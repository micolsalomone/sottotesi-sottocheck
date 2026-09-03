import type { UploadedDocument } from '@/app/components/SottocheckUploadForm';
import { clearPrecheckSession, getPrecheckSession } from '@/app/data/tesicheckPrecheckSession';

export interface PersistentTesiCheck {
  id: string;
  owner: {
    context: 'standalone' | 'student';
    id: string;
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
  sourceTemporaryDocumentRef?: string;
}

const STORAGE_KEY = 'public-tesicheck-checks-v1';
const RETENTION_DAYS = 30;

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

export function getPersistentTesiCheck(checkId: string): PersistentTesiCheck | null {
  const check = getStoredChecks().find((item) => item.id === checkId);
  return check && isPersistentTesiCheck(check) ? check : null;
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
    return existing;
  }

  const check = createPersistentTesiCheck({
    owner: { context: 'standalone', id: precheck.claim.accountId },
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
  document,
  characterCount,
  price,
}: {
  studentId: string;
  document: UploadedDocument;
  characterCount: number;
  price: number;
}): PersistentTesiCheck | null {
  const check = createPersistentTesiCheck({
    owner: { context: 'student', id: studentId },
    document,
    characterCount,
    price,
  });

  return saveChecks([check, ...getStoredChecks()]) ? check : null;
}

function createPersistentTesiCheck({
  owner,
  document,
  characterCount,
  price,
  sourceTemporaryDocumentRef,
}: {
  owner: PersistentTesiCheck['owner'];
  document: UploadedDocument;
  characterCount: number;
  price: number;
  sourceTemporaryDocumentRef?: string;
}): PersistentTesiCheck {
  const completedAt = new Date();
  const expiresAt = new Date(completedAt);
  expiresAt.setDate(expiresAt.getDate() + RETENTION_DAYS);
  const id = `${owner.context === 'student' ? 'STU' : 'PUB'}-CHK-${Date.now().toString().slice(-8)}`;

  return {
    id,
    owner,
    document,
    characterCount,
    price,
    payment: { status: 'paid', reference: `PAY-${id.slice(-8)}` },
    status: 'completed',
    createdAt: completedAt.toISOString(),
    completedAt: completedAt.toISOString(),
    expiresAt: expiresAt.toISOString(),
    report: { availability: 'available', reference: `REP-${id.slice(-8)}` },
    sourceTemporaryDocumentRef,
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
    && value.expiresAt
    && value.report?.availability === 'available'
  );
}
