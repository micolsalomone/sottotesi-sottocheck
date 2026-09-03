import type { UploadedDocument } from '@/app/components/SottocheckUploadForm';

/**
 * Persistent Coach TesiCheck record — path-bound mode only.
 *
 * Separate domain from the paid-consumer `PersistentTesiCheck`
 * (`tesicheckPersistentCheck.ts`): a Coach path-bound check is entitlement-based,
 * has no payment and no price, and is contextualised by a coaching path + Student
 * rather than owned by a paying account. It therefore lives in its own store and
 * must not reuse the consumer validators.
 *
 * Only `binding.mode = 'coaching_path'` exists today. The future `Check libero`
 * mode will add a second discriminated branch (price paid, no Student/path) when
 * that workstream is implemented — not now.
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

const STORAGE_KEY = 'coach-tesicheck-checks-v1';
const RETENTION_DAYS = 30;

function getStoredChecks(): CoachPathBoundCheck[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as CoachPathBoundCheck[]) : [];
  } catch {
    return [];
  }
}

function saveChecks(checks: CoachPathBoundCheck[]): boolean {
  try {
    // Prototype-only persistence. Production must create Coach checks server-side
    // against the real coaching-path entitlement.
    localStorage.setItem(STORAGE_KEY, JSON.stringify(checks));
    return true;
  } catch {
    return false;
  }
}

function isCoachPathBoundCheck(value: CoachPathBoundCheck): boolean {
  return Boolean(
    value.id
    && value.owner?.context === 'coach'
    && value.owner.id
    && value.binding?.mode === 'coaching_path'
    && value.binding.studentId
    && value.binding.pathId
    && value.document
    && typeof value.creditsUsed === 'number'
    && value.status === 'completed'
    && value.completedAt
    && value.expiresAt
    && value.report?.availability === 'available'
    && value.sourceExecutionReference,
  );
}

export function getCoachPersistentCheck(checkId: string): CoachPathBoundCheck | null {
  const check = getStoredChecks().find((item) => item.id === checkId);
  return check && isCoachPathBoundCheck(check) ? check : null;
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
    (item) => item.sourceExecutionReference === sourceExecutionReference,
  );
  if (existing && isCoachPathBoundCheck(existing)) {
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

/** Idempotency token for one Coach path-bound execution request. */
export function createCoachExecutionReference(): string {
  return `coach-exec-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
