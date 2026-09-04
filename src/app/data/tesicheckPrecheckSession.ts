import type { UploadedDocument } from '@/app/components/SottocheckUploadForm';
import { deriveDefaultCheckTitle } from '@/app/utils/deriveCheckTitle';

export type PrecheckValidationState = 'valid';
export type PrecheckFlowStage =
  | 'quote_ready'
  | 'checkout_account'
  | 'checkout_verify_email'
  | 'checkout_payment'
  | 'redirecting'
  | 'payment_success';

export interface TesiCheckPrecheckSession {
  document: UploadedDocument;
  /**
   * Semantic, user-facing title for the check. Seeded from the filename
   * (`deriveDefaultCheckTitle`) and editable on the landing before checkout. It
   * travels through the whole checkout (account / verify / payment) and is read
   * by `createPersistentCheckFromPaidPrecheck` at materialization. Distinct from
   * `document.name`; not coupled to the account model. `getPrecheckSession`
   * normalizes a missing/blank value so legacy sessions stay valid.
   */
  title: string;
  /**
   * Prototype token for a temporarily uploaded document. Production must resolve this to a
   * recoverable temporary server/storage resource; document metadata alone cannot recreate a check.
   */
  temporaryDocumentRef: string;
  validationState: PrecheckValidationState;
  characterCount: number;
  price: number;
  flowStage: PrecheckFlowStage;
  claim: {
    status: 'guest' | 'claimed';
    accountId?: string;
  };
}

const STORAGE_KEY = 'tesicheck-precheck-session-v1';

export function getPrecheckSession(): TesiCheckPrecheckSession | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const session = JSON.parse(raw) as TesiCheckPrecheckSession;
    if (
      !session.document ||
      !session.temporaryDocumentRef ||
      session.validationState !== 'valid' ||
      !Number.isFinite(session.characterCount) ||
      !Number.isFinite(session.price) ||
      !isPrecheckFlowStage(session.flowStage) ||
      !session.claim
    ) {
      return null;
    }

    // Legacy sessions predate `title`: derive an effective one without invalidating.
    if (!session.title || !session.title.trim()) {
      return { ...session, title: deriveDefaultCheckTitle(session.document.name) };
    }

    return session;
  } catch {
    return null;
  }
}

function isPrecheckFlowStage(value: unknown): value is PrecheckFlowStage {
  return value === 'quote_ready'
    || value === 'checkout_account'
    || value === 'checkout_verify_email'
    || value === 'checkout_payment'
    || value === 'redirecting'
    || value === 'payment_success';
}

export function createTemporaryDocumentRef() {
  return `tmp-doc-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function savePrecheckSession(session: TesiCheckPrecheckSession) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  } catch {
    // Session storage is a prototype-only handoff mechanism.
  }
}

export function clearPrecheckSession() {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // Session storage is unavailable.
  }
}

export function setPrecheckFlowStage(flowStage: PrecheckFlowStage): TesiCheckPrecheckSession | null {
  const session = getPrecheckSession();
  if (!session) return null;

  const nextSession = { ...session, flowStage };
  savePrecheckSession(nextSession);
  return nextSession;
}

export function claimPrecheckSession(accountId: string): TesiCheckPrecheckSession | null {
  const session = getPrecheckSession();
  if (!session) return null;

  const claimedSession: TesiCheckPrecheckSession = {
    ...session,
    claim: { status: 'claimed', accountId },
  };
  savePrecheckSession(claimedSession);
  return claimedSession;
}
