/**
 * Prototype-local Profile domain for the authenticated standalone TesiCheck
 * user (`/public-view`). `PublicProfilePage` (`/public-view/profilo`) and the
 * post-registration Profile-completion modal
 * (`StandaloneProfileCompletionModal`) read/write ONLY this store — never
 * `Pipeline` nor `Student.academic_records[]`.
 *
 * This is a deliberate product boundary: the public-facing Profile /
 * onboarding UI must not depend on Pipeline-vs-Student CRM resolution, so its
 * shape never changes based on identity-resolution branching. Every
 * authenticated standalone user gets the SAME Profile shape — current +
 * zero-or-more previous academic records, always available to fill in.
 *
 * Acquisition Pipeline creation/dedupe at registration
 * (`ensureTesiCheckPipeline`, `applyStandaloneRegistrationConsent`, both in
 * `tesicheckLeadEnrichment.ts`) is UNCHANGED and keeps running independently —
 * this store does not replace it, does not read it, and does not write to it.
 * The only touch point is additive: `seedStandaloneProfileFromRegistration`
 * mirrors the ALREADY-explicit registration choice (first name + commercial
 * consent) onto this store, in parallel with (never instead of) the
 * acquisition write, and arms the one-time onboarding prompt flag.
 *
 * PROTOTYPE ONLY:
 *  - keyed by the verified standalone account email (the same keying already
 *    used by `tesicheck-registered-accounts-v1`) — the smallest identity key
 *    already available here, no new identity concept introduced;
 *  - `localStorage`, no server, no real backend record;
 *  - no `StudentService` / service-binding concept — that is a Student
 *    operational-domain concern this store never models; every previous
 *    academic record here is always deletable.
 *
 * PRODUCTION HANDOFF: a real implementation must decide how, or whether, a
 * standalone user's Profile data reconciles with any CRM/Student entity
 * server-side. This prototype intentionally does NOT simulate that
 * reconciliation — it must not be read as prescribing that architecture.
 */
import type { DegreeLevel, ThesisType } from './LavorazioniContext';
import { createDraftAcademicRecord, editableAcademicHasContent, type EditableAcademic } from './studentAcademicRecords';

export { createDraftAcademicRecord };

const STORAGE_KEY = 'tesicheck-standalone-profile-v1';

export interface StandaloneAcademicRecord {
  id: string;
  is_current: boolean;
  degree_level: DegreeLevel | '';
  course_name: string;
  university_name: string;
  thesis_type: ThesisType | '';
  thesis_professor: string;
  thesis_subject: string;
  thesis_topic: string;
  created_at: string;
  updated_at: string;
}

export interface StandaloneProfile {
  email: string;
  first_name: string;
  last_name: string;
  phone: string;
  /**
   * Per-CONTACT-DETAIL commercial-communications consent, keyed by the exact
   * contact string (the account email, or the current `phone` value) —
   * MODEL B: consent belongs to the individual contact, not to the person.
   * Key present = explicit choice; absent = never expressed for that contact.
   * Because `phone` is a single value here (no contact history array), a
   * changed phone number simply reads/writes a different key: it never
   * inherits the previous number's consent, and the previous number's key (if
   * any) is left untouched — same "stale key is inert" behaviour as Pipeline's
   * `marketing_consents`. Prototype phone semantics: means permission for
   * promotional WhatsApp communication on that number — NOT commercial phone
   * calls, which are out of scope of this prototype (production/legal decision).
   */
  commercial_consents: Record<string, boolean>;
  academic_records: StandaloneAcademicRecord[];
  /**
   * ONE-TIME onboarding prompt flag — means ONLY "the post-registration
   * Profile-completion modal still needs to be shown". It is NOT a
   * Profile-completeness signal (see `isCurrentAcademicRecordComplete` for
   * that, a separate and unrelated derivation). Set `true` only by
   * `seedStandaloneProfileFromRegistration` on a NEW successful registration;
   * set back to `false` the moment the modal is dismissed by any exit (save,
   * skip, close). Absent (pre-existing/legacy profiles) is read as `false` —
   * never inferred from missing academic data, never defaulted to `true`.
   */
  profile_completion_prompt_pending?: boolean;
}

/** The four onboarding-modal academic fields — narrower on purpose than the full Profile field set (see `StandaloneProfileCompletionModal`). */
export interface PostPaymentAcademicValues {
  degree_level?: DegreeLevel | '';
  university_name?: string;
  course_name?: string;
  thesis_type?: ThesisType | '';
}

function normalizeEmail(email: string | null | undefined): string {
  return (email ?? '').trim().toLowerCase();
}

/** Smallest normalization for a `commercial_consents` map key — works for an
 * email or a phone value alike (lowercasing a phone is a harmless no-op). */
function normalizeContactKey(contact: string | null | undefined): string {
  return (contact ?? '').trim().toLowerCase();
}

function todayIso(): string {
  return new Date().toISOString().split('T')[0];
}

function readAll(): Record<string, StandaloneProfile> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? (parsed as Record<string, StandaloneProfile>) : {};
  } catch {
    return {};
  }
}

function writeAll(all: Record<string, StandaloneProfile>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  } catch {
    // Prototype-only persistence.
  }
}

function blankCurrentRecord(): StandaloneAcademicRecord {
  const today = todayIso();
  return {
    id: `SPR-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    is_current: true,
    degree_level: '',
    course_name: '',
    university_name: '',
    thesis_type: '',
    thesis_professor: '',
    thesis_subject: '',
    thesis_topic: '',
    created_at: today,
    updated_at: today,
  };
}

function emptyProfile(email: string): StandaloneProfile {
  return {
    email: normalizeEmail(email),
    first_name: '',
    last_name: '',
    phone: '',
    commercial_consents: {},
    academic_records: [blankCurrentRecord()],
  };
}

/** Read-only: `null` when nothing has been saved yet for this email, or the email is invalid. */
export function getStandaloneProfile(email: string | null | undefined): StandaloneProfile | null {
  const key = normalizeEmail(email);
  return key ? readAll()[key] ?? null : null;
}

/**
 * Get-or-create, guaranteeing the returned profile always has exactly one
 * `is_current` academic record — a standalone Profile always has something to
 * complete; it is never "not applicable". `null` only when the email itself is
 * invalid/absent.
 */
export function ensureStandaloneProfile(email: string | null | undefined): StandaloneProfile | null {
  const key = normalizeEmail(email);
  if (!key) return null;
  const all = readAll();
  const existing = all[key];
  if (existing && existing.academic_records.some((r) => r.is_current)) {
    return existing;
  }
  const next: StandaloneProfile = existing
    ? { ...existing, academic_records: [...existing.academic_records, blankCurrentRecord()] }
    : emptyProfile(key);
  all[key] = next;
  writeAll(all);
  return next;
}

/** `null` (no-op) when the email is invalid/absent. */
export function updateStandaloneProfile(
  email: string | null | undefined,
  updater: (profile: StandaloneProfile) => StandaloneProfile,
): StandaloneProfile | null {
  const key = normalizeEmail(email);
  if (!key) return null;
  const all = readAll();
  const current = all[key] ?? emptyProfile(key);
  const next = updater(current);
  all[key] = next;
  writeAll(all);
  return next;
}

/**
 * Tri-state read of ONE contact detail's commercial-communications preference
 * — contact-key-neutral (an email address or a phone number), same pattern as
 * Pipeline's `readMarketingConsentForContact`. The profile itself is still
 * resolved by account email (the identity key); `contact` is only the
 * consent-map key being read, which may be that same email or a phone value.
 */
export function readStandaloneContactConsent(
  accountEmail: string | null | undefined,
  contact: string | null | undefined,
): boolean | null {
  const contactKey = normalizeContactKey(contact);
  if (!contactKey) return null;
  const profile = getStandaloneProfile(accountEmail);
  if (!profile || !Object.prototype.hasOwnProperty.call(profile.commercial_consents, contactKey)) return null;
  return profile.commercial_consents[contactKey];
}

/** Explicit write only — the caller decides when a real choice was made. Only
 * ever touches the ONE contact key being written; every other key is left
 * untouched. */
export function writeStandaloneContactConsent(
  accountEmail: string | null | undefined,
  contact: string | null | undefined,
  granted: boolean,
): void {
  const contactKey = normalizeContactKey(contact);
  if (!contactKey) return;
  updateStandaloneProfile(accountEmail, (profile) => ({
    ...profile,
    commercial_consents: { ...profile.commercial_consents, [contactKey]: granted },
  }));
}

/** Tri-state read of the commercial-communications preference for the account
 * email itself. Thin wrapper over `readStandaloneContactConsent`. */
export function readStandaloneCommercialConsent(email: string | null | undefined): boolean | null {
  return readStandaloneContactConsent(email, email);
}

/** Explicit write of the account email's own consent. Thin wrapper over
 * `writeStandaloneContactConsent`. */
export function writeStandaloneCommercialConsent(email: string | null | undefined, granted: boolean): void {
  writeStandaloneContactConsent(email, email, granted);
}

/**
 * Tri-state read of the CURRENT phone's commercial-communications preference.
 * `accountEmail` resolves the profile; `phone` is the contact key. Returns
 * `null` (Non richiesto) whenever there is no phone yet, or no explicit choice
 * has been made for the current phone value.
 */
export function readStandalonePhoneConsent(
  accountEmail: string | null | undefined,
  phone: string | null | undefined,
): boolean | null {
  return readStandaloneContactConsent(accountEmail, phone);
}

/** Explicit write of the CURRENT phone's consent. Never touches the email's
 * consent entry or any other key. */
export function writeStandalonePhoneConsent(
  accountEmail: string | null | undefined,
  phone: string | null | undefined,
  granted: boolean,
): void {
  writeStandaloneContactConsent(accountEmail, phone, granted);
}

/**
 * Registration seed: mirrors the ALREADY-explicit registration choice (first
 * name + commercial consent) onto this prototype-local Profile store, in
 * PARALLEL with — never instead of — the acquisition Pipeline/Student write
 * `applyStandaloneRegistrationConsent` already performs. Does not touch
 * academic records; never reads or resolves Pipeline/Student.
 *
 * Also arms the one-time `profile_completion_prompt_pending` flag: a NEW
 * successful standalone registration should offer the Profile-completion
 * modal once, on whichever landing surface (Dashboard or Report) the user
 * reaches first. Existing profiles that predate this feature are never
 * retroactively flagged — only a fresh registration calls this at all.
 */
export function seedStandaloneProfileFromRegistration(params: {
  email: string;
  firstName?: string;
  commercialConsent: boolean;
}): void {
  const key = normalizeEmail(params.email);
  if (!key) return;
  updateStandaloneProfile(key, (profile) => ({
    ...profile,
    first_name: profile.first_name || (params.firstName ?? '').trim(),
    commercial_consents: { ...profile.commercial_consents, [key]: params.commercialConsent },
    profile_completion_prompt_pending: true,
  }));
}

/**
 * Whether the one-time Profile-completion modal still needs to be shown.
 * Absent (pre-existing/legacy profiles, or no profile at all) reads as
 * `false` — never inferred, never shown automatically to an account that
 * didn't register through the flag-setting path.
 */
export function isProfileCompletionPromptPending(email: string | null | undefined): boolean {
  return getStandaloneProfile(email)?.profile_completion_prompt_pending === true;
}

/** Called on every modal exit — Save, Skip, or the X close — never re-armed by anything else. */
export function dismissProfileCompletionPrompt(email: string | null | undefined): void {
  const key = normalizeEmail(email);
  if (!key) return;
  updateStandaloneProfile(key, (profile) => ({ ...profile, profile_completion_prompt_pending: false }));
}

// ─── Academic-record editing for the Profile page (all 7 fields, direct correction) ───

function academicContentDiffers(edit: EditableAcademic, stored: StandaloneAcademicRecord): boolean {
  return (
    edit.degree_level !== stored.degree_level ||
    edit.course_name.trim() !== stored.course_name.trim() ||
    edit.university_name.trim() !== stored.university_name.trim() ||
    edit.thesis_type !== stored.thesis_type ||
    edit.thesis_professor.trim() !== stored.thesis_professor.trim() ||
    edit.thesis_subject.trim() !== stored.thesis_subject.trim() ||
    edit.thesis_topic.trim() !== stored.thesis_topic.trim()
  );
}

export function toEditableStandaloneRecord(record: StandaloneAcademicRecord): EditableAcademic {
  return {
    id: record.id,
    isNew: false,
    isCurrent: record.is_current,
    degree_level: record.degree_level,
    course_name: record.course_name,
    university_name: record.university_name,
    thesis_type: record.thesis_type,
    thesis_professor: record.thesis_professor,
    thesis_subject: record.thesis_subject,
    thesis_topic: record.thesis_topic,
  };
}

/**
 * Direct content correction (Profile semantics, NOT the onboarding modal's
 * gap-fill-free patch below): existing records matched by id are replaced with
 * the edited content when it differs (never `id` / `is_current` / `created_at`;
 * `updated_at` bumped only on real change); drafts with content become new,
 * non-current previous records. No `StudentService` concept exists here, so
 * every previous record is always a safe delete target for the caller.
 */
export function applyStandaloneAcademicEdits(
  records: StandaloneAcademicRecord[],
  edits: EditableAcademic[],
): StandaloneAcademicRecord[] {
  const today = todayIso();
  const editsById = new Map(edits.filter((r) => !r.isNew).map((r) => [r.id, r]));

  const merged = records.map((record) => {
    const edit = editsById.get(record.id);
    if (!edit || !academicContentDiffers(edit, record)) return record;
    return {
      ...record,
      degree_level: edit.degree_level,
      course_name: edit.course_name.trim(),
      university_name: edit.university_name.trim(),
      thesis_type: edit.thesis_type,
      thesis_professor: edit.thesis_professor.trim(),
      thesis_subject: edit.thesis_subject.trim(),
      thesis_topic: edit.thesis_topic.trim(),
      updated_at: today,
    };
  });

  const added: StandaloneAcademicRecord[] = edits
    .filter((r) => r.isNew && editableAcademicHasContent(r))
    .map((r) => ({
      id: r.id,
      is_current: false,
      degree_level: r.degree_level,
      course_name: r.course_name.trim(),
      university_name: r.university_name.trim(),
      thesis_type: r.thesis_type,
      thesis_professor: r.thesis_professor.trim(),
      thesis_subject: r.thesis_subject.trim(),
      thesis_topic: r.thesis_topic.trim(),
      created_at: today,
      updated_at: today,
    }));

  return [...merged, ...added];
}

// ─── Post-registration Profile-completion modal (current record, 4 fields only) ───

function valuesFromRecord(record: StandaloneAcademicRecord): PostPaymentAcademicValues {
  return {
    degree_level: record.degree_level,
    university_name: record.university_name,
    course_name: record.course_name,
    thesis_type: record.thesis_type,
  };
}

/**
 * Prefill values for the CURRENT academic record, auto-provisioning the
 * profile/record if needed (`ensureStandaloneProfile`). Used only by
 * `StandaloneProfileCompletionModal` — the modal never manages previous
 * records, never selects among records, never changes `is_current`.
 */
export function getCurrentAcademicValues(email: string | null | undefined): PostPaymentAcademicValues | null {
  const profile = ensureStandaloneProfile(email);
  const current = profile?.academic_records.find((r) => r.is_current);
  return current ? valuesFromRecord(current) : null;
}

type FourFieldKeys = 'degree_level' | 'university_name' | 'course_name' | 'thesis_type';

function fourFieldPatch(
  current: Pick<StandaloneAcademicRecord, FourFieldKeys>,
  values: PostPaymentAcademicValues,
): Partial<Pick<StandaloneAcademicRecord, FourFieldKeys>> {
  const patch: Partial<Pick<StandaloneAcademicRecord, FourFieldKeys>> = {};
  const degreeLevel = (values.degree_level ?? '').trim();
  if (degreeLevel && degreeLevel !== current.degree_level) patch.degree_level = degreeLevel as DegreeLevel;
  const university = (values.university_name ?? '').trim();
  if (university && university !== current.university_name) patch.university_name = university;
  const course = (values.course_name ?? '').trim();
  if (course && course !== current.course_name) patch.course_name = course;
  const thesisType = (values.thesis_type ?? '').trim();
  if (thesisType && thesisType !== current.thesis_type) patch.thesis_type = thesisType as ThesisType;
  return patch;
}

/**
 * Apply the completion-modal's 4 fields to the CURRENT academic record only.
 * Non-destructive: a submitted non-empty value that differs from the current
 * one replaces it; empty or unchanged is a no-op; the record's other
 * Profile-only fields (`thesis_professor` / `thesis_subject` / `thesis_topic`)
 * are never touched, and neither are any previous records. Auto-provisions the
 * current record if somehow missing (`ensureStandaloneProfile`-equivalent
 * guard), so a save never silently does nothing.
 */
export function applyCurrentAcademicUpdate(email: string | null | undefined, values: PostPaymentAcademicValues): void {
  ensureStandaloneProfile(email);
  updateStandaloneProfile(email, (profile) => {
    const index = profile.academic_records.findIndex((r) => r.is_current);
    if (index === -1) return profile;
    const patch = fourFieldPatch(profile.academic_records[index], values);
    if (Object.keys(patch).length === 0) return profile;
    const today = todayIso();
    return {
      ...profile,
      academic_records: profile.academic_records.map((r, i) =>
        i === index ? { ...r, ...patch, updated_at: today } : r,
      ),
    };
  });
}

/**
 * Dashboard-reminder-only derivation: is the CURRENT academic record's
 * essential context present (degree level, university, course, typology)?
 * Unrelated to `profile_completion_prompt_pending` — this controls ONLY
 * whether the Dashboard reminder card renders, never the one-time modal.
 * Previous-record completeness is irrelevant here by design.
 */
export function isCurrentAcademicRecordComplete(email: string | null | undefined): boolean {
  const record = getStandaloneProfile(email)?.academic_records.find((r) => r.is_current);
  if (!record) return false;
  return Boolean(
    record.degree_level.trim() &&
      record.university_name.trim() &&
      record.course_name.trim() &&
      record.thesis_type.trim(),
  );
}
