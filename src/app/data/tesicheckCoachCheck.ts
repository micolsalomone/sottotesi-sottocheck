import type { UploadedDocument } from '@/app/components/SottocheckUploadForm';
import { deriveDefaultCheckTitle } from '@/app/utils/deriveCheckTitle';

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
 *
 * Both shapes carry a semantic `title` (History primary identity), distinct from
 * `document.name`. It is optional in the type only for backward compatibility
 * with pre-title records; every creator here always assigns a non-empty title
 * and the read accessors normalize legacy records (`normalizeCoachPersistentCheck`).
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
  /** Semantic display title. Optional only for legacy records — always set on create. */
  title?: string;
  document: UploadedDocument;
  /** Credits consumed by THIS check only. Never a remaining/total/used-quota value. */
  creditsUsed: number;
  status: 'completed';
  createdAt: string;
  completedAt: string;
  /**
   * @deprecated Legacy optional. No application-level report expiry any more —
   * reports stay accessible from History. Kept only so old 30-day-model records
   * still validate; never read to gate the UI.
   */
  expiresAt?: string;
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
  /** Semantic display title. Optional only for legacy records — always set on create. */
  title?: string;
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
  /**
   * @deprecated Legacy optional. No application-level report expiry any more —
   * reports stay accessible from History. Kept only so old 30-day-model records
   * still validate; never read to gate the UI.
   */
  expiresAt?: string;
  report: {
    availability: 'available';
    reference: string;
  };
  /** Payment-origin idempotency key for one paid free-check materialization. */
  sourcePaymentReference: string;
}

export type CoachPersistentCheck = CoachPathBoundCheck | CoachFreeCheck;

/** A stored Coach check resolved for display: `title` is guaranteed non-empty. */
export type NormalizedCoachPersistentCheck<T extends CoachPersistentCheck = CoachPersistentCheck> = T & { title: string };

const STORAGE_KEY = 'coach-tesicheck-checks-v1';

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

/**
 * Guarantee an effective display `title`. Pre-title records fall back to the
 * filename-derived default at read time only; storage is never mutated by a read.
 */
export function normalizeCoachPersistentCheck<T extends CoachPersistentCheck>(
  check: T,
): NormalizedCoachPersistentCheck<T> {
  const title = check.title?.trim();
  return title
    ? (check as NormalizedCoachPersistentCheck<T>)
    : { ...check, title: deriveDefaultCheckTitle(check.document.name) };
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
    && check.report?.availability === 'available'
    && check.sourcePaymentReference,
  );
}

/** True for either persistent Coach record shape. */
export function isCoachPersistentCheck(value: CoachPersistentCheck): boolean {
  return isCoachPathBoundCheck(value) || isCoachFreeCheck(value);
}

export function getCoachPersistentCheck(checkId: string): NormalizedCoachPersistentCheck | null {
  const check = getStoredChecks().find((item) => item.id === checkId);
  if (!check) {
    return null;
  }
  return isCoachPersistentCheck(check) ? normalizeCoachPersistentCheck(check) : null;
}

/**
 * Read-only, owner-filtered list for the Coach Storico TesiCheck.
 *
 * Mirrors `getPersistentTesiChecksForOwner` on the consumer side: validates each
 * record through the runtime guards, keeps only exact `owner.id` matches, and
 * sorts newest `completedAt` first. Never mutates on read; reports stay
 * accessible for the life of the record. Returns both path-bound and free
 * records with an effective `title`; the caller branches on `binding.mode`.
 */
export function getCoachPersistentChecksForOwner(coachId: string): NormalizedCoachPersistentCheck[] {
  return getStoredChecks()
    .filter((item) => isCoachPersistentCheck(item) && item.owner?.id === coachId)
    .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime())
    .map((check) => normalizeCoachPersistentCheck(check));
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
  title,
  document,
  creditsUsed,
  sourceExecutionReference,
}: {
  coachId: string;
  studentId: string;
  studentName: string;
  pathId: string;
  pathLabel: string;
  /** Optional for now; Slice B supplies an edited title. Defaults from the filename. */
  title?: string;
  document: UploadedDocument;
  creditsUsed: number;
  sourceExecutionReference: string;
}): CoachPathBoundCheck | null {
  const existing = getStoredChecks().find(
    (item): item is CoachPathBoundCheck =>
      isCoachPathBoundCheck(item) && item.sourceExecutionReference === sourceExecutionReference,
  );
  if (existing) {
    return normalizeCoachPersistentCheck(existing);
  }

  const completedAt = new Date();
  const id = `COA-CHK-${Date.now().toString().slice(-8)}`;

  const check: CoachPathBoundCheck = {
    id,
    owner: { context: 'coach', id: coachId },
    binding: { mode: 'coaching_path', studentId, studentName, pathId, pathLabel },
    title: title?.trim() || deriveDefaultCheckTitle(document.name),
    document,
    creditsUsed,
    status: 'completed',
    createdAt: completedAt.toISOString(),
    completedAt: completedAt.toISOString(),
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
  title,
  document,
  characterCount,
  price,
  sourcePaymentReference,
}: {
  coachId: string;
  /** Optional for now; Slice B supplies an edited title. Defaults from the filename. */
  title?: string;
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
    return normalizeCoachPersistentCheck(existing);
  }

  const completedAt = new Date();
  const id = `COA-CHK-${Date.now().toString().slice(-8)}`;

  const check: CoachFreeCheck = {
    id,
    owner: { context: 'coach', id: coachId },
    binding: { mode: 'check_libero' },
    title: title?.trim() || deriveDefaultCheckTitle(document.name),
    document,
    characterCount,
    price,
    payment: { status: 'paid', reference: `PAY-${id.slice(-8)}` },
    status: 'completed',
    createdAt: completedAt.toISOString(),
    completedAt: completedAt.toISOString(),
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
