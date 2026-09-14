/**
 * Prototype-local Profile domain for the authenticated standalone TesiCheck
 * user (`/public-view`). `PublicProfilePage` (`/public-view/profilo`) and the
 * post-payment academic review (`PublicPaidSottocheckPage`,
 * `PublicAccountGatePage`) read/write ONLY this store — never `Pipeline` nor
 * `Student.academic_records[]`.
 *
 * This is a deliberate product boundary: the public-facing Profile / review
 * must not depend on Pipeline-vs-Student CRM resolution, so its shape (one
 * academic block vs. a multi-record editor, whether the review even appears)
 * never changes based on identity-resolution branching. Every authenticated
 * standalone user gets the SAME Profile shape — current + zero-or-more
 * previous academic records, always available to fill in.
 *
 * Acquisition Pipeline creation/dedupe at registration
 * (`ensureTesiCheckPipeline`, `applyStandaloneRegistrationConsent`, both in
 * `tesicheckLeadEnrichment.ts`) is UNCHANGED and keeps running independently —
 * this store does not replace it, does not read it, and does not write to it.
 * The only touch point is additive: `seedStandaloneProfileFromRegistration`
 * mirrors the ALREADY-explicit registration choice (first name + commercial
 * consent) onto this store, in parallel with (never instead of) the
 * acquisition write.
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
  /** Per-email commercial-communications consent. Key present = explicit choice; absent = never expressed. */
  commercial_consents: Record<string, boolean>;
  academic_records: StandaloneAcademicRecord[];
}

/** The four post-payment-review academic fields — narrower on purpose than the full Profile field set (see `PostPaymentEnrichmentInterstitial`). */
export interface PostPaymentAcademicValues {
  degree_level?: DegreeLevel | '';
  university_name?: string;
  course_name?: string;
  thesis_type?: ThesisType | '';
}

/** One existing academic record offered as a review edit target. */
export interface AcademicRecordOption {
  id: string;
  label: string;
  isCurrent: boolean;
}

function normalizeEmail(email: string | null | undefined): string {
  return (email ?? '').trim().toLowerCase();
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
 * review or complete; unlike CRM resolution, it is never "not applicable".
 * `null` only when the email itself is invalid/absent.
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

/** Tri-state read of the commercial-communications preference for this email. */
export function readStandaloneCommercialConsent(email: string | null | undefined): boolean | null {
  const key = normalizeEmail(email);
  if (!key) return null;
  const profile = getStandaloneProfile(key);
  if (!profile || !Object.prototype.hasOwnProperty.call(profile.commercial_consents, key)) return null;
  return profile.commercial_consents[key];
}

/** Explicit write only — the caller decides when a real choice was made. */
export function writeStandaloneCommercialConsent(email: string | null | undefined, granted: boolean): void {
  const key = normalizeEmail(email);
  if (!key) return;
  updateStandaloneProfile(key, (profile) => ({
    ...profile,
    commercial_consents: { ...profile.commercial_consents, [key]: granted },
  }));
}

/**
 * Registration seed: mirrors the ALREADY-explicit registration choice (first
 * name + commercial consent) onto this prototype-local Profile store, in
 * PARALLEL with — never instead of — the acquisition Pipeline/Student write
 * `applyStandaloneRegistrationConsent` already performs. Does not touch
 * academic records; never reads or resolves Pipeline/Student.
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
  }));
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
 * Direct content correction (Profile semantics, NOT the post-payment review's
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

// ─── Post-payment academic review (4 fields, non-destructive per-field patch) ───

// Local record-summary label map — matches the vocabulary already used by
// `CreateStudentDrawer` / `tesicheckLeadEnrichment.ts`'s prior version, kept
// local on purpose (no shared taxonomy module for this yet).
const DEGREE_LEVEL_SUMMARY_LABEL: Record<DegreeLevel, string> = {
  triennale: 'Triennale',
  magistrale: 'Magistrale',
  ciclo_unico: 'Ciclo unico',
  master: 'Master',
  dottorato: 'Dottorato',
};

function recordLabel(record: StandaloneAcademicRecord): string {
  return (
    [
      record.degree_level ? DEGREE_LEVEL_SUMMARY_LABEL[record.degree_level] : null,
      record.course_name || null,
      record.university_name || null,
    ]
      .filter(Boolean)
      .join(' · ') || 'Percorso accademico'
  );
}

function valuesFromRecord(record: StandaloneAcademicRecord): PostPaymentAcademicValues {
  return {
    degree_level: record.degree_level,
    university_name: record.university_name,
    course_name: record.course_name,
    thesis_type: record.thesis_type,
  };
}

export interface StandaloneAcademicReview {
  initialValues: PostPaymentAcademicValues;
  /** Present only when the profile has >1 academic record. */
  records?: AcademicRecordOption[];
  selectedRecordId: string;
}

/**
 * Resolve the post-payment academic review for this verified standalone
 * account email. Reads/auto-provisions ONLY this store (via
 * `ensureStandaloneProfile`) — never Pipeline or Student. Always resolvable
 * for a valid email: a current record always exists (created blank on first
 * use), so there is no "nothing to review" case to skip, unlike the previous
 * CRM-resolved version. `records` (the selector options) is present only when
 * the profile holds more than one academic record.
 */
export function resolveStandaloneAcademicReview(email: string | null | undefined): StandaloneAcademicReview | null {
  const profile = ensureStandaloneProfile(email);
  if (!profile) return null;

  const ordered = [
    ...profile.academic_records.filter((r) => r.is_current),
    ...profile.academic_records.filter((r) => !r.is_current),
  ];
  const selected = ordered[0];
  const base: StandaloneAcademicReview = {
    initialValues: valuesFromRecord(selected),
    selectedRecordId: selected.id,
  };
  if (profile.academic_records.length <= 1) return base;
  return {
    ...base,
    records: ordered.map((record) => ({
      id: record.id,
      label: recordLabel(record),
      isCurrent: record.is_current,
    })),
  };
}

/** Prefill values for one existing record (by id), or `null` if it no longer exists. */
export function standaloneAcademicValuesForRecord(
  email: string | null | undefined,
  recordId: string,
): PostPaymentAcademicValues | null {
  const record = getStandaloneProfile(email)?.academic_records.find((r) => r.id === recordId);
  return record ? valuesFromRecord(record) : null;
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
 * Apply the reviewed 4 academic fields to ONE existing record, identified by
 * stable id. Non-destructive: a submitted non-empty value that differs from
 * the current one replaces it; empty or unchanged is a no-op; the record's
 * other Profile-only fields (`thesis_professor` / `thesis_subject` /
 * `thesis_topic`) are never touched. If the id no longer exists at save time,
 * nothing is written. Secondary to the paid result: callers navigate to the
 * report regardless of this call's outcome, and should tolerate it throwing.
 */
export function applyStandaloneAcademicReview(
  email: string | null | undefined,
  recordId: string,
  values: PostPaymentAcademicValues,
): void {
  updateStandaloneProfile(email, (profile) => {
    const index = profile.academic_records.findIndex((r) => r.id === recordId);
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
