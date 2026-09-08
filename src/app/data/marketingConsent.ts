/**
 * Commercial-communications consent — shared tri-state read helpers and the
 * Admin display vocabulary. One implementation, no per-component duplication.
 *
 * Both domain models are now PER-CONTACT / PER-EMAIL (they are NOT the same
 * storage shape and are intentionally not unified into one editing surface):
 *
 * - **Pipeline** `marketing_consents?: Record<string, boolean>` — keyed per
 *   contact string (email / phone): key absent = unknown / never collected;
 *   `true` = granted; `false` = explicitly not granted.
 * - **Student** `contacts.emails[].marketing_consent?: boolean | null` — one
 *   tri-state per email: `true` granted / `false` declined-revoked /
 *   `null` or absent = unknown. Consent belongs to the email channel, separate
 *   from `purposes` / service access. The legacy global `Student.marketing_consent`
 *   is deprecated and no longer read or written.
 *
 * Unknown is never collapsed into "No".
 */
import type { ContactEmail } from './LavorazioniContext';

export type RecontactSummary = 'granted' | 'declined' | 'unknown';

const normalizeContactKey = (value: string | null | undefined): string =>
  (value ?? '').trim().toLowerCase();

/**
 * Tri-state read of one contact's consent from a Pipeline consent map.
 * Contact-key-neutral (an email address or a phone number). Never `map[k] || false`.
 */
export function readMarketingConsentForContact(
  map: Record<string, boolean> | undefined,
  contactKey: string | null | undefined,
): boolean | null {
  const key = (contactKey ?? '').trim();
  if (!map || !key) return null;
  return Object.prototype.hasOwnProperty.call(map, key) ? map[key] : null;
}

/**
 * Current contact keys of a Pipeline (primary + additional email(s) and
 * phone(s)), trimmed and de-blanked. Used to derive the person-level summary
 * from CURRENT contacts only — stale keys left in `marketing_consents` never
 * drive the visible status.
 */
export function pipelineContactKeys(pipeline: {
  email?: string;
  emails?: string[];
  phone?: string;
  phones?: string[];
}): string[] {
  return [pipeline.email, ...(pipeline.emails ?? []), pipeline.phone, ...(pipeline.phones ?? [])]
    .map((value) => (value ?? '').trim())
    .filter((value): value is string => value.length > 0);
}

/**
 * Person-level Pipeline recontact summary over the given (current) contact keys:
 *
 * - at least one contact explicitly `true`  → `granted`
 *   (there is at least one channel on which commercial contact is allowed);
 * - else at least one contact explicitly `false` → `declined`;
 * - else → `unknown`.
 *
 * This answers "does any permitted recontact channel exist?" — it does NOT mean
 * every channel is allowed. The per-contact detail rows stay authoritative for
 * WHICH channel has consent (e.g. email `true` + phone `false` → summary
 * `granted`, but the drawer still shows phone as `Non consentito`).
 */
export function deriveRecontactSummary(
  map: Record<string, boolean> | undefined,
  contactKeys: string[],
): RecontactSummary {
  let sawDeclined = false;
  for (const key of contactKeys) {
    const value = readMarketingConsentForContact(map, key);
    if (value === true) return 'granted';
    if (value === false) sawDeclined = true;
  }
  return sawDeclined ? 'declined' : 'unknown';
}

/** Per-contact / per-email status label. */
export function marketingConsentLabel(value: boolean | null): string {
  return value === true ? 'Consentito' : value === false ? 'Non consentito' : 'Non richiesto';
}

/**
 * Tri-state read of ONE Student email contact's commercial consent. Matching is
 * case-insensitive on the address. Missing email / missing field → `null`
 * (Non richiesto) — never `false`.
 */
export function readStudentEmailConsent(
  emails: ContactEmail[] | undefined,
  email: string | null | undefined,
): boolean | null {
  const key = normalizeContactKey(email);
  if (!emails || !key) return null;
  const match = emails.find((entry) => normalizeContactKey(entry.email) === key);
  if (!match) return null;
  return match.marketing_consent === true || match.marketing_consent === false
    ? match.marketing_consent
    : null;
}

/**
 * Person-level recontact summary derived from the CURRENT Student email
 * contacts only (same rule as `deriveRecontactSummary` for Pipeline): any email
 * `true` → `granted`; else any email `false` → `declined`; else `unknown`.
 * Triage only — the per-email value in the drawer stays authoritative.
 */
export function deriveStudentRecontactSummary(
  emails: ContactEmail[] | undefined,
): RecontactSummary {
  let sawDeclined = false;
  for (const entry of emails ?? []) {
    if (entry.marketing_consent === true) return 'granted';
    if (entry.marketing_consent === false) sawDeclined = true;
  }
  return sawDeclined ? 'declined' : 'unknown';
}

/**
 * Return a NEW email array with exactly one email's `marketing_consent` set to
 * the given tri-state (`null` clears the field back to "not required"). Every
 * other email and every other field is left untouched — changing consent never
 * mutates `purposes` / `is_primary` / service access. When no email matches and
 * `createIfMissing` is provided, a minimal contact entry is appended so an
 * explicit preference is never silently dropped.
 */
export function withStudentEmailConsent(
  emails: ContactEmail[] | undefined,
  email: string | null | undefined,
  consent: boolean | null,
  createIfMissing?: { source: string },
): ContactEmail[] {
  const list: ContactEmail[] = emails ? emails.map((entry) => ({ ...entry })) : [];
  const rawEmail = (email ?? '').trim();
  const key = normalizeContactKey(email);
  if (!key) return list;
  const index = list.findIndex((entry) => normalizeContactKey(entry.email) === key);
  if (index >= 0) {
    if (consent === null) delete list[index].marketing_consent;
    else list[index].marketing_consent = consent;
    return list;
  }
  if (createIfMissing && consent !== null) {
    list.push({
      email: rawEmail,
      is_primary: list.length === 0,
      purposes: ['generic'],
      source: createIfMissing.source,
      added_at: new Date().toISOString(),
      marketing_consent: consent,
    });
  }
  return list;
}

/** Person-level Pipeline recontact summary label. */
export function recontactSummaryLabel(summary: RecontactSummary): string {
  return summary === 'granted'
    ? 'Ricontatto consentito'
    : summary === 'declined'
      ? 'Ricontatto non consentito'
      : 'Consenso non richiesto';
}
