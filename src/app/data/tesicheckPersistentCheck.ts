import type { UploadedDocument } from '@/app/components/SottocheckUploadForm';
import { clearPrecheckSession, getPrecheckSession } from '@/app/data/tesicheckPrecheckSession';
import { deriveDefaultCheckTitle } from '@/app/utils/deriveCheckTitle';

export interface PersistentTesiCheck {
  id: string;
  owner: {
    context: 'standalone' | 'student';
    id: string;
  };
  /**
   * Semantic, user-facing title for the check/version shown in History. A
   * distinct concept from `document.name` (the uploaded artifact) and never
   * written back onto it.
   *
   * Optional only for backward compatibility with records written before the
   * title foundation: every creator in this module always assigns a non-empty
   * title, and the read accessors normalize legacy records to an effective title
   * (see `normalizePersistentTesiCheck`). Editable title state arrives in a
   * later slice.
   */
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
   * @deprecated Legacy optional. There is no longer an application-level report
   * expiry — completed reports stay accessible from History indefinitely. Kept
   * only so records written by the old 30-day model still validate; it is never
   * read to gate report access or History rendering. (Legal/data retention and
   * account deletion are separate production concerns, out of scope here.)
   */
  expiresAt?: string;
  report: {
    availability: 'available';
    reference: string;
  };
  /** Standalone (guest) materialization idempotency key. */
  sourceTemporaryDocumentRef?: string;
  /** Student self-service materialization idempotency key (no guest pre-check). */
  sourcePaymentReference?: string;
}

/** A stored check resolved for display: `title` is guaranteed non-empty. */
export type NormalizedPersistentTesiCheck = PersistentTesiCheck & { title: string };

const STORAGE_KEY = 'public-tesicheck-checks-v1';

/**
 * Idempotency key for one Student self-service paid materialization. Student has
 * no guest pre-check, so it cannot reuse `sourceTemporaryDocumentRef`. Created
 * once when the payment succeeds and kept stable across materialization retries.
 */
export function createStudentPaymentReference() {
  return `stu-pay-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Idempotency key for one authenticated-standalone (`/public-view/sottocheck`)
 * self-service paid materialization. Like the Student flow, this flow has no
 * guest pre-check, so it cannot reuse `sourceTemporaryDocumentRef`. Minted once
 * when the (simulated) payment succeeds and kept stable across materialization
 * retries. Distinct from the guest pre-check flow, which keeps
 * `sourceTemporaryDocumentRef`.
 */
export function createStandalonePaymentReference() {
  return `std-pay-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Guarantee an effective display `title` on a record read from storage. Records
 * written before the title foundation have no `title`; fall back to the
 * filename-derived default at read time only — the stored record is never
 * mutated by a read.
 */
export function normalizePersistentTesiCheck(check: PersistentTesiCheck): NormalizedPersistentTesiCheck {
  const title = check.title?.trim();
  return title
    ? (check as NormalizedPersistentTesiCheck)
    : { ...check, title: deriveDefaultCheckTitle(check.document.name) };
}

function getStoredChecks(): PersistentTesiCheck[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) as PersistentTesiCheck[] : [];
  } catch {
    return [];
  }
}

function saveChecks(checks: PersistentTesiCheck[]) {
  try {
    // Prototype-only persistence. Production must create and verify checks server-side.
    localStorage.setItem(STORAGE_KEY, JSON.stringify(checks));
    return true;
  } catch {
    return false;
  }
}

export function getPersistentTesiCheck(checkId: string): NormalizedPersistentTesiCheck | null {
  const check = getStoredChecks().find((item) => item.id === checkId);
  return check && isPersistentTesiCheck(check) ? normalizePersistentTesiCheck(check) : null;
}

/**
 * Read-only view of the paid consumer checks owned by one identity, newest
 * completed first. Consumer-paid specific: the caller passes the exact
 * `owner.context` + `owner.id` for its context (standalone / student). No schema
 * change, no migration, no expiry-driven mutation — reports stay accessible for
 * the life of the record. Each returned check has an effective `title`.
 */
export function getPersistentTesiChecksForOwner(
  context: PersistentTesiCheck['owner']['context'],
  ownerId: string,
): NormalizedPersistentTesiCheck[] {
  return getStoredChecks()
    .filter(
      (item) =>
        isPersistentTesiCheck(item)
        && item.owner?.context === context
        && item.owner?.id === ownerId,
    )
    .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime())
    .map(normalizePersistentTesiCheck);
}

export function createPersistentCheckFromPaidPrecheck(): PersistentTesiCheck | null {
  const precheck = getPrecheckSession();
  if (
    !precheck ||
    precheck.flowStage !== 'payment_success' ||
    precheck.claim.status !== 'claimed' ||
    !precheck.claim.accountId
  ) {
    return null;
  }

  const existing = getStoredChecks().find(
    (item) => item.sourceTemporaryDocumentRef === precheck.temporaryDocumentRef
  );
  if (existing && isPersistentTesiCheck(existing)) {
    clearPrecheckSession();
    return normalizePersistentTesiCheck(existing);
  }

  const check = createPersistentTesiCheck({
    owner: { context: 'standalone', id: precheck.claim.accountId },
    title: precheck.title,
    document: precheck.document,
    characterCount: precheck.characterCount,
    price: precheck.price,
    sourceTemporaryDocumentRef: precheck.temporaryDocumentRef,
  });

  if (!saveChecks([check, ...getStoredChecks()])) {
    return null;
  }

  // Consume the temporary session only after the persistent check is safely stored.
  clearPrecheckSession();
  return check;
}

export function createPersistentStudentCheck({
  studentId,
  title,
  document,
  characterCount,
  price,
  sourcePaymentReference,
}: {
  studentId: string;
  /** Optional for now; Slice B supplies an edited title. Defaults from the filename. */
  title?: string;
  document: UploadedDocument;
  characterCount: number;
  price: number;
  sourcePaymentReference: string;
}): PersistentTesiCheck | null {
  // Reuse an already-materialized check for this payment so a retry never
  // duplicates. Student's dedupe key is `sourcePaymentReference`; the standalone
  // flow keeps its own key (`sourceTemporaryDocumentRef`) untouched.
  const existing = getStoredChecks().find(
    (item) => item.owner?.context === 'student' && item.sourcePaymentReference === sourcePaymentReference
  );
  if (existing && isPersistentTesiCheck(existing)) {
    return normalizePersistentTesiCheck(existing);
  }

  const check = createPersistentTesiCheck({
    owner: { context: 'student', id: studentId },
    title,
    document,
    characterCount,
    price,
    sourcePaymentReference,
  });

  return saveChecks([check, ...getStoredChecks()]) ? check : null;
}

/**
 * Materialize the authenticated-standalone (`/public-view/sottocheck`)
 * self-service paid check. Same shape/store as the guest pre-check conversion
 * (`owner.context: 'standalone'`, id = the prototype account id) so it lands in
 * the same `/public-view/history` and opens via `/public-view/report/:checkId`.
 * Dedupe key is `sourcePaymentReference` scoped to `owner.context === 'standalone'`
 * — the guest flow keeps its own `sourceTemporaryDocumentRef`, so a retry reuses
 * an already-written record instead of duplicating. `null` = storage write failed.
 */
export function createPersistentStandaloneCheck({
  accountId,
  title,
  document,
  characterCount,
  price,
  sourcePaymentReference,
}: {
  accountId: string;
  /** Optional for legacy tolerance; the caller supplies the edited title. Defaults from the filename. */
  title?: string;
  document: UploadedDocument;
  characterCount: number;
  price: number;
  sourcePaymentReference: string;
}): PersistentTesiCheck | null {
  const existing = getStoredChecks().find(
    (item) => item.owner?.context === 'standalone' && item.sourcePaymentReference === sourcePaymentReference,
  );
  if (existing && isPersistentTesiCheck(existing)) {
    return normalizePersistentTesiCheck(existing);
  }

  const check = createPersistentTesiCheck({
    owner: { context: 'standalone', id: accountId },
    title,
    document,
    characterCount,
    price,
    sourcePaymentReference,
  });

  return saveChecks([check, ...getStoredChecks()]) ? check : null;
}

/**
 * Rename one persistent check's semantic title. Mutates **only** `title` (trimmed);
 * an empty input resolves to the record's current title, else the filename-derived
 * default — never blank. Document, report reference, payment, dates and owner are
 * untouched. Returns `false` when the id is unknown or the write fails.
 */
export function renamePersistentCheckTitle(checkId: string, nextTitle: string): boolean {
  const checks = getStoredChecks();
  const index = checks.findIndex((item) => item.id === checkId);
  if (index === -1) {
    return false;
  }
  const current = checks[index];
  const resolved =
    nextTitle.trim() || current.title?.trim() || deriveDefaultCheckTitle(current.document.name);
  checks[index] = { ...current, title: resolved };
  return saveChecks(checks);
}

function createPersistentTesiCheck({
  owner,
  title,
  document,
  characterCount,
  price,
  sourceTemporaryDocumentRef,
  sourcePaymentReference,
}: {
  owner: PersistentTesiCheck['owner'];
  title?: string;
  document: UploadedDocument;
  characterCount: number;
  price: number;
  sourceTemporaryDocumentRef?: string;
  sourcePaymentReference?: string;
}): NormalizedPersistentTesiCheck {
  const completedAt = new Date();
  const id = `${owner.context === 'student' ? 'STU' : 'PUB'}-CHK-${Date.now().toString().slice(-8)}`;
  // A new record always carries a non-empty title; no application-level expiry.
  const effectiveTitle = title?.trim() || deriveDefaultCheckTitle(document.name);

  return {
    id,
    owner,
    title: effectiveTitle,
    document,
    characterCount,
    price,
    payment: { status: 'paid', reference: `PAY-${id.slice(-8)}` },
    status: 'completed',
    createdAt: completedAt.toISOString(),
    completedAt: completedAt.toISOString(),
    report: { availability: 'available', reference: `REP-${id.slice(-8)}` },
    sourceTemporaryDocumentRef,
    sourcePaymentReference,
  };
}

function isPersistentTesiCheck(value: PersistentTesiCheck) {
  return Boolean(
    value.id
    && value.owner?.id
    && (value.owner.context === 'standalone' || value.owner.context === 'student')
    && value.document
    && value.payment?.status === 'paid'
    && value.status === 'completed'
    && value.completedAt
    && value.report?.availability === 'available'
  );
}
