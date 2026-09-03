import type { UploadedDocument } from '@/app/components/SottocheckUploadForm';

/**
 * Persistent Coach TesiCheck record.
 *
 * Separate domain from the paid-consumer `PersistentTesiCheck`
 * (`tesicheckPersistentCheck.ts`) and from its store: Coach records live in
 * `coach-tesicheck-checks-v1` and must not reuse the consumer validators.
 *
 * Two mutually exclusive shapes, discriminated by `binding.mode`:
 *
 * - `CoachPathBoundCheck` (`mode: 'coaching_path'`) — entitlement-based, no
 *   payment and no price, contextualised by a coaching path + Student, consumes
 *   coaching credits for THAT check only.
 * - `CoachFreeCheck` (`mode: 'check_libero'`) — paid "check libero", no Student,
 *   no coaching path, no coaching credits. Requires a verified payment and
 *   carries the price paid.
 */
export interface CoachPathBoundCheck {
  id: string;
  owner: {
    context: 'coach';
    id: string;
  };
  binding: {
    mode: 'coaching_path';
    studentId: string;
    studentName: string;
    /** Prototype-local opaque coaching-path id; production replaces it. */
    pathId: string;
    pathLabel: string;
  };
  document: UploadedDocument;
  /** Credits consumed by THIS check only. Never a remaining/total/used-quota value. */
  creditsUsed: number;
  status: 'completed';
  createdAt: string;
  completedAt: string;
  expiresAt: string;
  report: {
    availability: 'available';
    reference: string;
  };
  /** Idempotency key for one Coach execution request (no payment in this mode). */
  sourceExecutionReference: string;
}

/**
 * Paid Coach "check libero" — not associated with any Student or coaching path,
 * not backed by coaching credits. Deliberately carries no `studentId`,
 * `studentName`, `pathId`, `pathLabel`, `creditsUsed` or quota field.
 */
export interface CoachFreeCheck {
  id: string;
  owner: {
    context: 'coach';
    id: string;
  };
  binding: {
    mode: 'check_libero';
  };
  document: UploadedDocument;
  characterCount: number;
  price: number;
  payment: {
    status: 'paid';
    reference: string;
  };
  status: 'completed';
  createdAt: string;
  completedAt: string;
  expiresAt: string;
  report: {
    availability: 'available';
    reference: string;
  };
  /** Payment-origin idempotency key for one paid free-check materialization. */
  sourcePaymentReference: string;
}

export type CoachPersistentCheck = CoachPathBoundCheck | CoachFreeCheck;

const STORAGE_KEY = 'coach-tesicheck-checks-v1';
const RETENTION_DAYS = 30;

function getStoredChecks(): CoachPersistentCheck[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as CoachPersistentCheck[]) : [];
  } catch {
    return [];
  }
}

function saveChecks(checks: CoachPersistentCheck[]): boolean {
  try {
    // Prototype-only persistence. Production must create Coach checks server-side
    // against the real coaching-path entitlement (path-bound) or verified payment
    // (check libero).
    localStorage.setItem(STORAGE_KEY, JSON.stringify(checks));
    return true;
  } catch {
    return false;
  }
}

/** Runtime guard for a path-bound Coach check. Unchanged semantics. */
export function isCoachPathBoundCheck(value: CoachPersistentCheck): value is CoachPathBoundCheck {
  if (value.binding?.mode !== 'coaching_path') {
    return false;
  }
  const check = value as CoachPathBoundCheck;
  return Boolean(
    check.id
    && check.owner?.context === 'coach'
    && check.owner.id
    && check.binding.studentId
    && check.binding.pathId
    && check.document
    && typeof check.creditsUsed === 'number'
    && check.status === 'completed'
    && check.completedAt
    && check.expiresAt
    && check.report?.availability === 'available'
    && check.sourceExecutionReference,
  );
}

/** Runtime guard for a paid free Coach check ("check libero"). */
export function isCoachFreeCheck(value: CoachPersistentCheck): value is CoachFreeCheck {
  if (value.binding?.mode !== 'check_libero') {
    return false;
  }
  const check = value as CoachFreeCheck;
  return Boolean(
    check.id
    && check.owner?.context === 'coach'
    && check.owner.id
    && check.document
    && typeof check.characterCount === 'number'
    && typeof check.price === 'number'
    && check.payment?.status === 'paid'
    && check.status === 'completed'
    && check.completedAt
    && check.expiresAt
    && check.report?.availability === 'available'
    && check.sourcePaymentReference,
  );
}

/** True for either persistent Coach record shape. */
export function isCoachPersistentCheck(value: CoachPersistentCheck): boolean {
  return isCoachPathBoundCheck(value) || isCoachFreeCheck(value);
}

export function getCoachPersistentCheck(checkId: string): CoachPersistentCheck | null {
  const check = getStoredChecks().find((item) => item.id === checkId);
  if (!check) {
    return null;
  }
  return isCoachPersistentCheck(check) ? check : null;
}

/**
 * Read-only, owner-filtered list for the Coach Storico TesiCheck.
 *
 * Mirrors `getPersistentTesiChecksForOwner` on the consumer side: validates each
 * record through the runtime guards, keeps only exact `owner.id` matches, and
 * sorts newest `completedAt` first. Does not mutate anything on expiry — the
 * History derives availability at render time from `expiresAt`. Returns both
 * path-bound and free records; the caller branches on `binding.mode`.
 */
export function getCoachPersistentChecksForOwner(coachId: string): CoachPersistentCheck[] {
  return getStoredChecks()
    .filter((item) => isCoachPersistentCheck(item) && item.owner?.id === coachId)
    .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime());
}

/**
 * Materialize one path-bound Coach check. Idempotent: a record already written
 * for the same `sourceExecutionReference` is returned instead of a duplicate, so
 * a StrictMode double-invoke or a retry never double-creates.
 */
export function createCoachPathBoundCheck({
  coachId,
  studentId,
  studentName,
  pathId,
  pathLabel,
  document,
  creditsUsed,
  sourceExecutionReference,
}: {
  coachId: string;
  studentId: string;
  studentName: string;
  pathId: string;
  pathLabel: string;
  document: UploadedDocument;
  creditsUsed: number;
  sourceExecutionReference: string;
}): CoachPathBoundCheck | null {
  const existing = getStoredChecks().find(
    (item): item is CoachPathBoundCheck =>
      isCoachPathBoundCheck(item) && item.sourceExecutionReference === sourceExecutionReference,
  );
  if (existing) {
    return existing;
  }

  const completedAt = new Date();
  const expiresAt = new Date(completedAt);
  expiresAt.setDate(expiresAt.getDate() + RETENTION_DAYS);
  const id = `COA-CHK-${Date.now().toString().slice(-8)}`;

  const check: CoachPathBoundCheck = {
    id,
    owner: { context: 'coach', id: coachId },
    binding: { mode: 'coaching_path', studentId, studentName, pathId, pathLabel },
    document,
    creditsUsed,
    status: 'completed',
    createdAt: completedAt.toISOString(),
    completedAt: completedAt.toISOString(),
    expiresAt: expiresAt.toISOString(),
    report: { availability: 'available', reference: `REP-${id.slice(-8)}` },
    sourceExecutionReference,
  };

  return saveChecks([check, ...getStoredChecks()]) ? check : null;
}

/**
 * Materialize one paid free Coach check. Idempotent: a record already written for
 * the same `sourcePaymentReference` is returned instead of a duplicate, so a
 * StrictMode double-invoke, a repeated payment return or a post-payment recovery
 * retry never double-creates. The payment is the origin event — this key is
 * distinct from the path-bound `sourceExecutionReference`.
 */
export function createCoachFreeCheck({
  coachId,
  document,
  characterCount,
  price,
  sourcePaymentReference,
}: {
  coachId: string;
  document: UploadedDocument;
  characterCount: number;
  price: number;
  sourcePaymentReference: string;
}): CoachFreeCheck | null {
  const existing = getStoredChecks().find(
    (item): item is CoachFreeCheck =>
      isCoachFreeCheck(item) && item.sourcePaymentReference === sourcePaymentReference,
  );
  if (existing) {
    return existing;
  }

  const completedAt = new Date();
  const expiresAt = new Date(completedAt);
  expiresAt.setDate(expiresAt.getDate() + RETENTION_DAYS);
  const id = `COA-CHK-${Date.now().toString().slice(-8)}`;

  const check: CoachFreeCheck = {
    id,
    owner: { context: 'coach', id: coachId },
    binding: { mode: 'check_libero' },
    document,
    characterCount,
    price,
    payment: { status: 'paid', reference: `PAY-${id.slice(-8)}` },
    status: 'completed',
    createdAt: completedAt.toISOString(),
    completedAt: completedAt.toISOString(),
    expiresAt: expiresAt.toISOString(),
    report: { availability: 'available', reference: `REP-${id.slice(-8)}` },
    sourcePaymentReference,
  };

  return saveChecks([check, ...getStoredChecks()]) ? check : null;
}

/** Idempotency token for one Coach path-bound execution request. */
export function createCoachExecutionReference(): string {
  return `coach-exec-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/** Idempotency token for one Coach paid free-check payment. Minted once on payment success. */
export function createCoachFreePaymentReference(): string {
  return `coach-pay-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
