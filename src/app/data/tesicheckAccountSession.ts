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

import { clearPrecheckSession } from '@/app/data/tesicheckPrecheckSession';

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
  /**
   * Prototype legal state, MIRRORED from the registered-account registry for
   * convenient reads (e.g. a future role-specific Account page —
   * `/public-view/account` / `/student-view/account`, NOT the Profile page and
   * NOT the `/public/account` checkout gate). The registry (`RegisteredAccount`)
   * stays the source of truth. Absent on sessions created before this feature —
   * read absent as "not recorded in this prototype", never as accepted.
   * Production must replace these booleans with proper versioned + timestamped +
   * audited acceptance.
   */
  termsAccepted?: boolean;
  privacyAcknowledged?: boolean;
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
  /**
   * Prototype legal acceptance captured at standalone registration. This
   * registry is the persistent source of truth so `logout → login → Account
   * page` later still knows the account accepted / acknowledged. Terms &
   * Privacy are ACCOUNT-domain state, not Profile-domain.
   *
   * Absent for accounts registered before this feature: interpret absent as
   * "not recorded in this prototype" — never silently migrate legacy accounts to
   * accepted. No version, timestamp, IP/device or audit data is modelled here;
   * production auth / legal storage must add proper version + timestamp + audit
   * semantics. Commercial-communications consent is deliberately NOT stored here
   * (it is not account legal acceptance — see `tesicheckLeadEnrichment.ts`).
   */
  termsAccepted?: boolean;
  privacyAcknowledged?: boolean;
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
    && (session.termsAccepted === undefined || typeof session.termsAccepted === 'boolean')
    && (session.privacyAcknowledged === undefined || typeof session.privacyAcknowledged === 'boolean')
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

// Tiny in-memory notification channel for standalone account/session identity
// changes (sign-in, registration, email confirmation, `changeAccountEmail`) —
// NOT a general event bus. Exists because the persistent shell (`PublicHeader`,
// mounted once by `PublicLayout` and never remounted by route navigation)
// reads `getAccountSession()` at render time with no other way to learn that
// a sibling route (e.g. the Account page) just wrote a new session. Centralized
// here (the single module that owns `STORAGE_KEY`) rather than a `window`
// CustomEvent scattered across pages.
const sessionListeners = new Set<() => void>();

function notifyAccountSessionListeners() {
  sessionListeners.forEach((listener) => listener());
}

/**
 * Subscribe to standalone account/session identity changes. Returns an
 * unsubscribe function. Fires after every write through `saveAccountSession`
 * (sign-in, registration, email confirmation, `changeAccountEmail`) — never
 * on unrelated storage (registry, Profile, Student). Callers re-read
 * `getAccountSession()` themselves on notification; no payload is passed.
 */
export function subscribeToAccountSession(listener: () => void): () => void {
  sessionListeners.add(listener);
  return () => {
    sessionListeners.delete(listener);
  };
}

function saveAccountSession(session: TesiCheckAccountSession): TesiCheckAccountSession {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  } catch {
    // Prototype-only persistence.
  }
  notifyAccountSessionListeners();
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
    // Mirror the registry's legal state onto the session (undefined for legacy
    // accounts — "not recorded", never assumed accepted).
    termsAccepted: known?.termsAccepted,
    privacyAcknowledged: known?.privacyAcknowledged,
  });
}

/**
 * New account: registration collects an explicit first name (required "Nome"
 * field) plus email. Email must still be verified before payment is enabled.
 * The account is also written to the prototype registry so it can sign back in
 * after logout; `password` is stored verbatim (prototype only) and may be empty.
 *
 * `legal` carries the two REQUIRED registration acknowledgements (Terms &
 * Conditions acceptance, Privacy notice acknowledgement). New registrations
 * always pass both as `true` (the form blocks submit otherwise); they are
 * persisted to the registry and mirrored onto the session. Commercial-
 * communications consent is NOT passed here — it is not account legal
 * acceptance and is written to the acquisition Pipeline instead.
 */
export function registerAccount(
  firstName: string,
  email: string,
  password = '',
  legal?: { termsAccepted: boolean; privacyAcknowledged: boolean },
): TesiCheckAccountSession {
  upsertRegisteredAccount({
    email: email.trim(),
    firstName,
    password,
    termsAccepted: legal?.termsAccepted,
    privacyAcknowledged: legal?.privacyAcknowledged,
  });
  return saveAccountSession({
    id: DEMO_ACCOUNT_ID,
    email,
    firstName,
    emailVerified: false,
    termsAccepted: legal?.termsAccepted,
    privacyAcknowledged: legal?.privacyAcknowledged,
  });
}

export function confirmAccountEmail(): TesiCheckAccountSession | null {
  const session = getAccountSession();
  if (!session) return null;
  return saveAccountSession({ ...session, emailVerified: true });
}

/**
 * Confirmed account-email replacement for the Account page's "Modifica
 * email" flow — call ONLY after the new address has passed the prototype's
 * demo verification step; there is no earlier partial-mutation path. Renames
 * the matching `tesicheck-registered-accounts-v1` entry (deletes the old
 * normalized key, re-inserts under the new one, keeping `firstName`/
 * `password`/legal fields untouched) so `logout → login` keeps working under
 * the new address, then updates the session's own `email`. Everything else
 * on the session (`id`, `firstName`, `emailVerified`, legal flags) is
 * preserved — this only ever changes the email value itself. Consent
 * (`standaloneProfile.ts`'s `commercial_consents`, keyed by email) is
 * intentionally NOT touched here — see `renameStandaloneProfileEmail`, which
 * the caller invokes separately, and which never copies the old email's
 * consent onto the new one.
 */
export function changeAccountEmail(newEmail: string): TesiCheckAccountSession | null {
  const session = getAccountSession();
  if (!session) return null;
  const trimmed = newEmail.trim();
  const oldKey = normalizeEmail(session.email);
  const newKey = normalizeEmail(trimmed);
  if (oldKey !== newKey) {
    const accounts = readRegisteredAccounts();
    const existing = accounts[oldKey];
    if (existing) {
      delete accounts[oldKey];
      accounts[newKey] = { ...existing, email: trimmed };
      try {
        localStorage.setItem(REGISTERED_ACCOUNTS_KEY, JSON.stringify(accounts));
      } catch {
        // Prototype-only persistence.
      }
    }
  }
  return saveAccountSession({ ...session, email: trimmed });
}

/**
 * Drops only the authenticated standalone account session (domain A). Deliberately
 * leaves everything else untouched: the registered-accounts registry (so the same
 * account can log back in), the in-progress pre-check/checkout session, persistent
 * TesiCheck checks/history and CRM data.
 *
 * For an explicit standalone logout use `clearStandaloneSession` instead — logout
 * must also discard the transient purchase (domain B).
 */
export function clearAccountSession() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Storage unavailable.
  }
}

/**
 * End the standalone TesiCheck session on an explicit logout. Clears the two
 * transient persistence domains and nothing else:
 *  - the authenticated account session (`clearAccountSession`, domain A);
 *  - the in-progress checkout / pre-check purchase (`clearPrecheckSession`,
 *    domain B), so a started-but-unfinished purchase never leaks into the next
 *    login/session as the active checkout, and a stale mid-checkout `flowStage`
 *    can never strand a fresh checkout.
 *
 * Preserves everything that must outlive a logout (domain C): the
 * registered-accounts registry (`tesicheck-registered-accounts-v1`), persistent
 * paid checks / permanent History (`public-tesicheck-checks-v1`), CRM pipelines,
 * and all Student / Coach / Admin state.
 */
export function clearStandaloneSession() {
  clearAccountSession();
  clearPrecheckSession();
}

export function isPaymentEnabled(session: TesiCheckAccountSession | null): boolean {
  return !!session && session.emailVerified;
}
