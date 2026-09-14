/**
 * TesiCheck standalone → CRM Pipeline acquisition + enrichment helpers.
 *
 * Prototype stand-in. The authenticated standalone area has no real identity
 * linked to the CRM, so this module resolves against the verified TesiCheck
 * account email matched to the in-memory CRM data (`LavorazioniContext`).
 * Production must replace the email match with a real account ↔ Student / lead
 * identity mapping and must never derive CRM identity from `DEMO_ACCOUNT_ID` or
 * from names.
 *
 * Product rules encoded here:
 * - a new standalone registration creates/dedupes a Pipeline immediately, on
 *   account creation + email verification — independently of payment or the
 *   later enrichment questionnaire (`ensureTesiCheckPipeline`);
 * - an email that already belongs to a Student never produces a Pipeline;
 * - an email that already belongs to a Pipeline enriches that Pipeline;
 * - Pipelines touched by this flow always carry `TesiCheck` in `sources`,
 *   system-assigned, never user-selectable;
 * - the OPTIONAL commercial-communications consent captured at registration is
 *   written as an EXPLICIT boolean to the identity domain that acquisition
 *   resolution resolves (`applyStandaloneRegistrationConsent`): a Pipeline →
 *   `marketing_consents[verifiedEmail]`; an existing Student → the matching
 *   verified email contact's `contacts.emails[].marketing_consent` (checked →
 *   `true`, unchecked → `false`, no inference), never a global Student value and
 *   never any other Student email. It is a separate domain from Terms acceptance
 *   and Privacy acknowledgement (which live on the account, not here), and it
 *   never gates account creation, verification, payment or the report;
 * - the enrichment questionnaire (`resolveEnrichmentTarget` +
 *   `PublicProfilePage`) normally updates the already-created Pipeline;
 *   `new_pipeline` there is fallback-only for pre-rule accounts.
 */
import type {
  DegreeLevel,
  Pipeline,
  Student,
  StudentAcademicRecord,
  ThesisType,
} from './LavorazioniContext';
import { withStudentEmailConsent } from './marketingConsent';

export type TesiCheckEnrichmentTarget =
  | { mode: 'student'; studentId: string }
  | { mode: 'pipeline'; pipelineId: string }
  | { mode: 'new_pipeline' }
  /** No usable verified account email — nothing may be created. */
  | { mode: 'unavailable' };

/** System-assigned acquisition source for every Pipeline created/enriched here. */
export const TESICHECK_ACQUISITION_SOURCE = 'TesiCheck';

const EMAIL_SHAPE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normalizeEmail(email: string | null | undefined): string {
  return (email ?? '').trim().toLowerCase();
}

function studentEmailSet(student: Student): string[] {
  const emails: string[] = [];
  if (student.email) emails.push(student.email);
  student.contacts?.emails?.forEach((entry) => {
    if (entry?.email) emails.push(entry.email);
  });
  return emails.map(normalizeEmail).filter(Boolean);
}

function pipelineEmailSet(pipeline: Pipeline): string[] {
  const emails: string[] = [];
  if (pipeline.email) emails.push(pipeline.email);
  pipeline.emails?.forEach((entry) => {
    if (entry) emails.push(entry);
  });
  return emails.map(normalizeEmail).filter(Boolean);
}

/**
 * Resolve where the standalone account's questionnaire answers should land.
 * Students are checked before Pipelines: a known Student identity must never be
 * duplicated as a lead. A missing / malformed email fails safe as `unavailable`
 * — a lead is never created without a real verified account email.
 */
export function resolveEnrichmentTarget(params: {
  accountEmail: string | null | undefined;
  students: Student[];
  pipelines: Pipeline[];
}): TesiCheckEnrichmentTarget {
  const email = normalizeEmail(params.accountEmail);
  if (!email || !EMAIL_SHAPE.test(email)) return { mode: 'unavailable' };

  const matchedStudent = params.students.find((student) =>
    studentEmailSet(student).includes(email),
  );
  if (matchedStudent) return { mode: 'student', studentId: matchedStudent.id };

  const matchedPipeline = params.pipelines.find((pipeline) =>
    pipelineEmailSet(pipeline).includes(email),
  );
  if (matchedPipeline) return { mode: 'pipeline', pipelineId: matchedPipeline.id };

  return { mode: 'new_pipeline' };
}

// The tri-state Pipeline consent reader now lives in `./marketingConsent`
// (`readMarketingConsentForContact`) — contact-key-neutral, shared with the
// Admin display helpers. Re-exported here for the existing acquisition/enrichment
// call sites.
export { readMarketingConsentForContact as readEmailMarketingConsent } from './marketingConsent';

/**
 * Set an explicit marketing-consent boolean for one contact email on a Pipeline
 * consent map, preserving every other entry. Writing an explicit `false` is
 * meaningful — it records "asked, not granted", distinct from a missing key
 * ("never collected"). Callers must not collapse the two with `map[email] || false`.
 */
export function withEmailMarketingConsent(
  existing: Record<string, boolean> | undefined,
  email: string,
  granted: boolean,
): Record<string, boolean> {
  return { ...(existing ?? {}), [email.trim()]: granted };
}

/** Preserve existing acquisition sources, ensure `TesiCheck` appears exactly once. */
export function withTesiCheckSource(existing: string[] | undefined): string[] {
  const sources = existing ?? [];
  return sources.includes(TESICHECK_ACQUISITION_SOURCE)
    ? sources
    : [...sources, TESICHECK_ACQUISITION_SOURCE];
}

/** Next Pipeline id using the existing `PIP-NNN` convention (see `CreatePipelineDrawer`). */
export function nextPipelineId(pipelines: Pipeline[]): string {
  const maxId = pipelines.reduce((max, pipeline) => {
    const num = parseInt(pipeline.id.replace('PIP-', ''), 10);
    return Number.isNaN(num) ? max : Math.max(max, num);
  }, 0);
  return `PIP-${String(maxId + 1).padStart(3, '0')}`;
}

/**
 * Build the immediate acquisition Pipeline for a new standalone TesiCheck
 * account. Grounded / structural fields only — no quote, owner, service,
 * channel, notes, `student_id`, academic data.
 *
 * Invariant: a new TesiCheck Pipeline needs a non-empty explicit first name.
 * `student_name` is the first name — never the email. Returns `null` when the
 * first name is empty so the caller skips creation.
 */
export function buildTesiCheckPipeline(params: {
  id: string;
  accountEmail: string;
  firstName: string;
}): Pipeline | null {
  const first = params.firstName.trim();
  if (!first) return null;
  return {
    id: params.id,
    first_name: first,
    last_name: '',
    student_name: first,
    email: params.accountEmail.trim(),
    phone: '',
    sources: [TESICHECK_ACQUISITION_SOURCE],
    created_at: new Date().toISOString().split('T')[0],
    lavorazioni_ids: [],
  };
}

export interface EnsureTesiCheckPipelineResult {
  /** `incomplete_identity` = valid email but no first name — not created. */
  outcome: 'student' | 'enriched' | 'created' | 'unavailable' | 'incomplete_identity';
  pipelineId?: string;
  /** Set only on `outcome: 'student'` — the resolved existing Student id. */
  studentId?: string;
}

/**
 * Idempotent CRM projection of a standalone TesiCheck identity. Call once a new
 * standalone account is created + email-verified: the Pipeline must exist from
 * that point on, independently of payment or the enrichment form.
 *
 * - existing Student email  → nothing (a known Student is never duplicated);
 * - existing Pipeline email → keep all data, ensure the `TesiCheck` source once;
 * - no match, valid email + non-empty first name → create one Pipeline;
 * - no match, valid email, empty first name → nothing (`incomplete_identity`);
 * - missing / invalid email → nothing.
 *
 * `commercialConsent` (optional): when a boolean is passed, the resolved
 * Pipeline gets an EXPLICIT `marketing_consents[email] = value` (`created` or
 * `enriched` outcomes only). Omitted / `undefined` → the consent map is left
 * untouched. This function stays **Pipeline-oriented**: on a Student match it
 * only reports `outcome: 'student'` + `studentId` and writes nothing — the
 * Student-domain consent write is the caller's job (see
 * `applyStandaloneRegistrationConsent`).
 *
 * Safe to call repeatedly: it re-resolves against current CRM data, so a second
 * call for the same identity enriches rather than duplicates.
 */
export function ensureTesiCheckPipeline(params: {
  accountEmail: string | null | undefined;
  firstName: string | null | undefined;
  students: Student[];
  pipelines: Pipeline[];
  addPipeline: (pipeline: Pipeline) => void;
  updatePipeline: (id: string, updater: (pipeline: Pipeline) => Pipeline) => void;
  commercialConsent?: boolean;
}): EnsureTesiCheckPipelineResult {
  const target = resolveEnrichmentTarget({
    accountEmail: params.accountEmail,
    students: params.students,
    pipelines: params.pipelines,
  });

  const recordsConsent = typeof params.commercialConsent === 'boolean';

  if (target.mode === 'unavailable') return { outcome: 'unavailable' };
  if (target.mode === 'student') return { outcome: 'student', studentId: target.studentId };

  if (target.mode === 'pipeline') {
    const existing = params.pipelines.find((pipeline) => pipeline.id === target.pipelineId);
    const needsSource = !!existing && !(existing.sources ?? []).includes(TESICHECK_ACQUISITION_SOURCE);
    if (existing && (needsSource || recordsConsent)) {
      // Key the consent under the Pipeline's own primary email so the Admin
      // contact rows (keyed on `pipeline.email`) read it back; fall back to the
      // verified account email if the match was via a secondary address.
      const consentKey = existing.email || normalizeEmail(params.accountEmail);
      params.updatePipeline(target.pipelineId, (pipeline) => ({
        ...pipeline,
        sources: withTesiCheckSource(pipeline.sources),
        ...(recordsConsent
          ? {
              marketing_consents: withEmailMarketingConsent(
                pipeline.marketing_consents,
                consentKey,
                params.commercialConsent as boolean,
              ),
            }
          : {}),
      }));
    }
    return { outcome: 'enriched', pipelineId: target.pipelineId };
  }

  // new_pipeline — the resolver already validated the email shape; a non-empty
  // explicit first name is still required.
  const id = nextPipelineId(params.pipelines);
  const pipeline = buildTesiCheckPipeline({
    id,
    accountEmail: (params.accountEmail ?? '').trim(),
    firstName: (params.firstName ?? '').trim(),
  });
  if (!pipeline) return { outcome: 'incomplete_identity' };

  const created = recordsConsent
    ? {
        ...pipeline,
        marketing_consents: withEmailMarketingConsent(
          undefined,
          pipeline.email ?? (params.accountEmail ?? '').trim(),
          params.commercialConsent as boolean,
        ),
      }
    : pipeline;
  params.addPipeline(created);
  return { outcome: 'created', pipelineId: id };
}

/**
 * Project a verified standalone registration's identity + optional commercial
 * choice into whichever domain acquisition resolution resolves — the single
 * entry point both registration paths (`/public/register`,
 * `/public/account`) call at `handleConfirmEmail`.
 *
 * Ownership boundary:
 * - identity + Pipeline consent  → `ensureTesiCheckPipeline` (unchanged):
 *   `created` / `enriched` also write `marketing_consents[verifiedEmail]`;
 * - existing Student             → NO Pipeline (rule preserved). The explicit
 *   commercial choice is written here to the VERIFIED matching email contact's
 *   `contacts.emails[].marketing_consent` via the shared `updateStudent` —
 *   per-email, never a global Student value, never another Student email. The
 *   registration UI asked outright, so this is a direct boolean (checked →
 *   `true`, unchecked → `false`), not an inference. `purposes`, service access,
 *   phones, other emails and Pipelines are all untouched. If the verified email
 *   is not already a contact entry, a minimal one is appended so the explicit
 *   choice is never dropped.
 *
 * Terms / Privacy acceptance is NOT handled here — that is account-domain state
 * (`registerAccount`), independent of acquisition identity.
 *
 * `commercialConsent` omitted / `undefined` → neither domain's consent is
 * written (identity resolution still runs).
 */
export function applyStandaloneRegistrationConsent(params: {
  accountEmail: string | null | undefined;
  firstName: string | null | undefined;
  students: Student[];
  pipelines: Pipeline[];
  addPipeline: (pipeline: Pipeline) => void;
  updatePipeline: (id: string, updater: (pipeline: Pipeline) => Pipeline) => void;
  updateStudent: (id: string, updater: (student: Student) => Student) => void;
  commercialConsent?: boolean;
}): EnsureTesiCheckPipelineResult {
  const result = ensureTesiCheckPipeline({
    accountEmail: params.accountEmail,
    firstName: params.firstName,
    students: params.students,
    pipelines: params.pipelines,
    addPipeline: params.addPipeline,
    updatePipeline: params.updatePipeline,
    commercialConsent: params.commercialConsent,
  });

  if (
    result.outcome === 'student'
    && result.studentId
    && typeof params.commercialConsent === 'boolean'
  ) {
    const granted = params.commercialConsent;
    const verifiedEmail = normalizeEmail(params.accountEmail);
    params.updateStudent(result.studentId, (student) => ({
      ...student,
      contacts: {
        emails: withStudentEmailConsent(student.contacts?.emails, verifiedEmail, granted, {
          source: 'tesicheck-registration',
        }),
        phones: student.contacts?.phones ?? [],
      },
    }));
  }

  return result;
}

// ─── Post-payment ACADEMIC-PROFILE REVIEW (authenticated standalone) ──────────
//
// A lightweight review-and-update step shown once, AFTER a paid standalone
// TesiCheck has been materialized (never before `completedCheck` exists).
//
// It lets the user REVIEW and, if they want, correct or complete the four
// academic fields already associated with their Profile identity. It is NOT
// gap-fill-only: whenever a resolvable academic target exists, ALL FOUR fields
// are shown, PREFILLED with the current values — the user confirms, corrects,
// completes or skips.
//
// It is still NOT identity completion, contact collection, account/legal
// management or full Profile editing — surname, phone, contacts, consent, quotes,
// notes, assignees and `sources` are never touched here. The full Profile remains
// the surface for deliberate edits.
//
// The Student domain supports MULTIPLE academic records. This step reviews ONE
// EXISTING record: for a Student with >1 record a selector chooses which existing
// record to review (preselecting `is_current`, else the first in Profile order).
// The selector is only an edit-target chooser — it never changes `is_current`,
// creates / deletes a record, touches `StudentService` / `academic_record_id`, or
// associates the paid TesiCheck with any record. There is NO
// PersistentTesiCheck ↔ academic-record association in this slice.
//
// Values belong to the resolved Pipeline `academic_data` or the selected Student
// academic record. They are never written to the PersistentTesiCheck /
// `public-tesicheck-checks-v1` record. This step is secondary to the paid result:
// callers navigate to the report regardless of the outcome and tolerate
// `applyPostPaymentAcademicUpdate` throwing.

export interface PostPaymentAcademicValues {
  degree_level?: DegreeLevel | '';
  university_name?: string;
  course_name?: string;
  thesis_type?: ThesisType | '';
}

/** One existing Student academic record offered as an edit target. */
export interface AcademicRecordOption {
  id: string;
  label: string;
  isCurrent: boolean;
}

/**
 * Whether the post-payment academic-profile review applies, and the data to
 * prefill. `applicable: false` for `new_pipeline` / `unavailable` and for a
 * Student with **zero** academic records (never fabricated) — the caller then
 * goes straight to the report.
 *
 * `records` is present only for a Student with **>1** academic record (the
 * selectable existing records, in Profile order). `selectedRecordId` is set for
 * every Student case (the record to review first); it is absent for a Pipeline
 * target (one flat `academic_data`, no selector).
 */
export type PostPaymentAcademicReview =
  | { applicable: false }
  | {
      applicable: true;
      initialValues: PostPaymentAcademicValues;
      records?: AcademicRecordOption[];
      selectedRecordId?: string;
    };

function academicValuesFrom(source: {
  degree_level?: DegreeLevel | '';
  university_name?: string;
  course_name?: string;
  thesis_type?: ThesisType | '';
}): PostPaymentAcademicValues {
  return {
    degree_level: source.degree_level ?? '',
    university_name: source.university_name ?? '',
    course_name: source.course_name ?? '',
    thesis_type: source.thesis_type ?? '',
  };
}

// Local degree-level label map for the record-summary selector — matches the
// existing `CreateStudentDrawer` summary vocabulary (`degreeLabelMap`). Not a new
// taxonomy; kept local because the drawer's map is not exported.
const DEGREE_LEVEL_SUMMARY_LABEL: Record<DegreeLevel, string> = {
  triennale: 'Triennale',
  magistrale: 'Magistrale',
  ciclo_unico: 'Ciclo unico',
  master: 'Master',
  dottorato: 'Dottorato',
};

/** `Magistrale · Lettere Moderne · Università di Bologna` — same join as `CreateStudentDrawer`. */
function academicRecordLabel(record: StudentAcademicRecord): string {
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

/** Profile/Admin order: the `is_current` record(s) first, then the rest in array order. */
function orderedAcademicRecords(student: Student): StudentAcademicRecord[] {
  return [
    ...student.academic_records.filter((record) => record.is_current),
    ...student.academic_records.filter((record) => !record.is_current),
  ];
}

/**
 * Prefill values for one existing Student academic record (by stable id), or
 * `null` if no Student currently owns a record with that id.
 */
export function academicValuesForRecord(
  students: Student[],
  recordId: string,
): PostPaymentAcademicValues | null {
  for (const student of students) {
    const record = student.academic_records.find((entry) => entry.id === recordId);
    if (record) return academicValuesFrom(record);
  }
  return null;
}

/**
 * Resolve the post-payment academic-profile review for the verified standalone
 * account. Re-resolves the acquisition identity via email:
 *  - Pipeline                  → applicable; prefill from `pipeline.academic_data`;
 *  - Student, ≥1 record        → applicable; preselect `is_current` (else the
 *                                first record in Profile order); prefill from it;
 *                                add `records` when there is >1;
 *  - Student, 0 records        → not applicable (no record is fabricated);
 *  - new_pipeline / unavailable → not applicable.
 */
export function resolvePostPaymentAcademicReview(params: {
  accountEmail: string | null | undefined;
  students: Student[];
  pipelines: Pipeline[];
}): PostPaymentAcademicReview {
  const target = resolveEnrichmentTarget({
    accountEmail: params.accountEmail,
    students: params.students,
    pipelines: params.pipelines,
  });

  if (target.mode === 'pipeline') {
    const pipeline = params.pipelines.find((item) => item.id === target.pipelineId);
    if (!pipeline) return { applicable: false };
    return { applicable: true, initialValues: academicValuesFrom(pipeline.academic_data ?? {}) };
  }
  if (target.mode === 'student') {
    const student = params.students.find((item) => item.id === target.studentId);
    if (!student || student.academic_records.length === 0) return { applicable: false };

    const ordered = orderedAcademicRecords(student);
    const selected = ordered[0]; // is_current if present, else first in Profile order

    if (student.academic_records.length === 1) {
      return {
        applicable: true,
        initialValues: academicValuesFrom(selected),
        selectedRecordId: selected.id,
      };
    }
    return {
      applicable: true,
      initialValues: academicValuesFrom(selected),
      selectedRecordId: selected.id,
      records: ordered.map((record) => ({
        id: record.id,
        label: academicRecordLabel(record),
        isCurrent: record.is_current,
      })),
    };
  }
  return { applicable: false };
}

/**
 * Non-destructive academic patch: for each of the four fields, a submitted
 * NON-EMPTY value that differs from the current one replaces it; an unchanged
 * value is a no-op; a submitted EMPTY value never erases an existing value. No
 * field is ever cleared from this step.
 */
function academicPatchFor(
  current: { degree_level?: DegreeLevel | ''; university_name?: string; course_name?: string; thesis_type?: ThesisType | '' },
  values: PostPaymentAcademicValues,
): { degree_level?: DegreeLevel; university_name?: string; course_name?: string; thesis_type?: ThesisType } {
  const patch: { degree_level?: DegreeLevel; university_name?: string; course_name?: string; thesis_type?: ThesisType } = {};
  const degreeLevel = (values.degree_level ?? '').trim();
  if (degreeLevel && degreeLevel !== (current.degree_level ?? '')) patch.degree_level = degreeLevel as DegreeLevel;
  const university = (values.university_name ?? '').trim();
  if (university && university !== (current.university_name ?? '')) patch.university_name = university;
  const course = (values.course_name ?? '').trim();
  if (course && course !== (current.course_name ?? '')) patch.course_name = course;
  const thesisType = (values.thesis_type ?? '').trim();
  if (thesisType && thesisType !== (current.thesis_type ?? '')) patch.thesis_type = thesisType as ThesisType;
  return patch;
}

function applyAcademicValuesToPipeline(pipeline: Pipeline, values: PostPaymentAcademicValues): Pipeline {
  const academic = pipeline.academic_data ?? {};
  const patch = academicPatchFor(academic, values);
  if (Object.keys(patch).length === 0) return pipeline;
  return { ...pipeline, academic_data: { ...academic, ...patch } };
}

/**
 * Update ONE existing Student academic record, identified by its stable id.
 * Never creates a record, never changes `is_current`, never touches `id` /
 * `student_id` / `StudentService.academic_record_id` / service bindings — and
 * never touches identity, contacts, phone or commercial consent. `updated_at` is
 * bumped only when a value actually changed. If the id no longer exists at save
 * time, nothing is written.
 */
function applyAcademicValuesToStudentRecord(
  student: Student,
  recordId: string,
  values: PostPaymentAcademicValues,
): Student {
  const index = student.academic_records.findIndex((record) => record.id === recordId);
  if (index === -1) return student;

  const patch = academicPatchFor(student.academic_records[index], values);
  if (Object.keys(patch).length === 0) return student;

  const today = new Date().toISOString().split('T')[0];
  return {
    ...student,
    academic_records: student.academic_records.map((entry, i) =>
      i === index ? { ...entry, ...patch, updated_at: today } : entry,
    ),
  };
}

export type PostPaymentAcademicOutcome = 'pipeline' | 'student' | 'skipped';

/**
 * Apply the reviewed academic values to the resolved acquisition identity.
 * Re-resolves at call time (never trusts a stale target). Explicit non-empty
 * values may overwrite current values (user correction); empty inputs never
 * erase; unchanged values are a no-op. Writes ONLY the Pipeline `academic_data`
 * or the ONE Student academic record named by `studentRecordId` — never a second
 * Pipeline, never a new Student record, never `is_current`, never identity /
 * contacts / consent / `sources` / service bindings.
 *
 * For a Student target `studentRecordId` is required (the edit-target record id
 * the caller was reviewing); a missing id, or an id that no longer exists, means
 * no academic write. `new_pipeline` / `unavailable` → nothing written
 * (`skipped`).
 *
 * This step is secondary to the paid result: callers MUST navigate to the report
 * regardless of the return value, and MUST tolerate this throwing.
 */
export function applyPostPaymentAcademicUpdate(params: {
  accountEmail: string | null | undefined;
  students: Student[];
  pipelines: Pipeline[];
  updatePipeline: (id: string, updater: (pipeline: Pipeline) => Pipeline) => void;
  updateStudent: (id: string, updater: (student: Student) => Student) => void;
  values: PostPaymentAcademicValues;
  /** Student target only: the stable id of the existing record being reviewed. */
  studentRecordId?: string;
}): PostPaymentAcademicOutcome {
  const target = resolveEnrichmentTarget({
    accountEmail: params.accountEmail,
    students: params.students,
    pipelines: params.pipelines,
  });

  if (target.mode === 'pipeline') {
    params.updatePipeline(target.pipelineId, (pipeline) => applyAcademicValuesToPipeline(pipeline, params.values));
    return 'pipeline';
  }
  if (target.mode === 'student') {
    const recordId = params.studentRecordId;
    if (!recordId) return 'skipped';
    params.updateStudent(target.studentId, (student) =>
      applyAcademicValuesToStudentRecord(student, recordId, params.values),
    );
    return 'student';
  }
  return 'skipped';
}
