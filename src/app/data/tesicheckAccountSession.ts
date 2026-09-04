/**
 * Prototype-only account session for the standalone TesiCheck experience.
 *
 * The prototype has no auth provider: this module stands in for the identity and
 * email-verification a real backend would own. Production must authenticate the
 * user, verify the email server-side, and never trust a client-held flag for
 * `payment_enabled`.
 *
 * A tiny local "registered accounts" registry (plain object in `localStorage`,
 * plaintext password) exists only so the designer/client can walk the loop
 * `register → logout → login with the same account` deterministically during a
 * prototype review. It is NOT an auth backend: no hashing, no tokens, no
 * expiry/refresh, no per-account ids. Production auth is delegated entirely to
 * the real application.
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
// Prototype registry of accounts created via the standalone registration form,
// so the same account can sign back in after logout. Separate from the session
// key on purpose: logout clears the session, never this registry.
const REGISTERED_ACCOUNTS_KEY = 'tesicheck-registered-accounts-v1';

// Already-stored persistent checks carry this value as `owner.id`; keep it stable
// so a returning demo user still matches their existing reports.
export const DEMO_ACCOUNT_ID = 'public-account-demo';

interface RegisteredAccount {
  email: string;
  firstName: string;
  /** Plaintext — prototype only. Empty for accounts created before this registry. */
  password: string;
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function readRegisteredAccounts(): Record<string, RegisteredAccount> {
  try {
    const raw = localStorage.getItem(REGISTERED_ACCOUNTS_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? (parsed as Record<string, RegisteredAccount>) : {};
  } catch {
    return {};
  }
}

/** The prototype account registered under this email in this browser, if any. */
export function findRegisteredAccount(email: string): RegisteredAccount | null {
  return readRegisteredAccounts()[normalizeEmail(email)] ?? null;
}

function upsertRegisteredAccount(account: RegisteredAccount) {
  try {
    const accounts = readRegisteredAccounts();
    accounts[normalizeEmail(account.email)] = account;
    localStorage.setItem(REGISTERED_ACCOUNTS_KEY, JSON.stringify(accounts));
  } catch {
    // Prototype-only persistence.
  }
}

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

/**
 * Existing account: the prototype treats a returning user as already verified.
 * If the email matches an account registered in this browser, its explicit
 * first name is restored so it is genuinely "the same account". Credential
 * checking (the stored password) is the caller's responsibility — see
 * `findRegisteredAccount`; an unknown email still signs in (prototype demo).
 */
export function signInAccount(email: string): TesiCheckAccountSession {
  const known = findRegisteredAccount(email);
  return saveAccountSession({
    id: DEMO_ACCOUNT_ID,
    email,
    firstName: known?.firstName,
    emailVerified: true,
  });
}

/**
 * New account: registration collects an explicit first name (required "Nome"
 * field) plus email. Email must still be verified before payment is enabled.
 * The account is also written to the prototype registry so it can sign back in
 * after logout; `password` is stored verbatim (prototype only) and may be empty.
 */
export function registerAccount(firstName: string, email: string, password = ''): TesiCheckAccountSession {
  upsertRegisteredAccount({ email: email.trim(), firstName, password });
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

/**
 * Sign out: drops only the authenticated standalone session. Deliberately leaves
 * the registered-accounts registry (so the same account can log back in), the
 * pre-check/checkout session, persistent TesiCheck checks/history and CRM data
 * untouched — those are not authentication state.
 */
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
