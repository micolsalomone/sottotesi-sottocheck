/**
 * Prototype-only account session for the standalone TesiCheck checkout.
 *
 * The prototype has no auth provider: this module stands in for the identity and
 * email-verification a real backend would own. Production must authenticate the
 * user, verify the email server-side, and never trust a client-held flag for
 * `payment_enabled`.
 */

export interface TesiCheckAccountSession {
  id: string;
  email: string;
  /**
   * Explicit first name for accounts registered under the current acquisition
   * rule. Registration collects it as a required "Nome" field; sign-in does not
   * set it.
   */
  firstName?: string;
  /**
   * Legacy single "name" string from pre-rule registrations. May be a full name;
   * never split it to derive a surname. Prefer `firstName` when present.
   */
  name?: string;
  emailVerified: boolean;
}

const STORAGE_KEY = 'tesicheck-account-session-v1';

// Already-stored persistent checks carry this value as `owner.id`; keep it stable
// so a returning demo user still matches their existing reports.
export const DEMO_ACCOUNT_ID = 'public-account-demo';

function isAccountSession(value: unknown): value is TesiCheckAccountSession {
  if (!value || typeof value !== 'object') return false;
  const session = value as Record<string, unknown>;
  return (
    typeof session.id === 'string'
    && session.id.length > 0
    && typeof session.email === 'string'
    && session.email.length > 0
    && typeof session.emailVerified === 'boolean'
    && (session.firstName === undefined || typeof session.firstName === 'string')
    && (session.name === undefined || typeof session.name === 'string')
  );
}

/**
 * First name for a session, preferring the explicit `firstName`. Legacy `name`
 * is only used when it is a single token — a multi-token legacy value is not
 * split to guess first/last.
 */
export function getAccountFirstName(session: TesiCheckAccountSession | null): string {
  if (!session) return '';
  if (session.firstName && session.firstName.trim()) return session.firstName.trim();
  const legacy = (session.name ?? '').trim();
  return legacy.length > 0 && !/\s/.test(legacy) ? legacy : '';
}

export function getAccountSession(): TesiCheckAccountSession | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return isAccountSession(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function saveAccountSession(session: TesiCheckAccountSession): TesiCheckAccountSession {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  } catch {
    // Prototype-only persistence.
  }
  return session;
}

/** Existing account: the prototype treats a returning user as already verified. */
export function signInAccount(email: string): TesiCheckAccountSession {
  return saveAccountSession({
    id: DEMO_ACCOUNT_ID,
    email,
    emailVerified: true,
  });
}

/**
 * New account: registration collects an explicit first name (required "Nome"
 * field) plus email. Email must still be verified before payment is enabled.
 */
export function registerAccount(firstName: string, email: string): TesiCheckAccountSession {
  return saveAccountSession({
    id: DEMO_ACCOUNT_ID,
    email,
    firstName,
    emailVerified: false,
  });
}

export function confirmAccountEmail(): TesiCheckAccountSession | null {
  const session = getAccountSession();
  if (!session) return null;
  return saveAccountSession({ ...session, emailVerified: true });
}

export function clearAccountSession() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Storage unavailable.
  }
}

export function isPaymentEnabled(session: TesiCheckAccountSession | null): boolean {
  return !!session && session.emailVerified;
}
