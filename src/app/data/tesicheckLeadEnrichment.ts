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
 *   `marketing_consents[verifiedEmail]`; an existing Student → the shared
 *   `Student.marketing_consent` (checked → `true`, unchecked → `false`, no
 *   inference). It is a separate domain from Terms acceptance and Privacy
 *   acknowledgement (which live on the account, not here), and it never gates
 *   account creation, verification, payment or the report;
 * - the enrichment questionnaire (`resolveEnrichmentTarget` +
 *   `PublicProfilePage`) normally updates the already-created Pipeline;
 *   `new_pipeline` there is fallback-only for pre-rule accounts.
 */
import type { Pipeline, Student } from './LavorazioniContext';

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
 *   commercial choice is written here to `Student.marketing_consent` via the
 *   shared `updateStudent`. The registration UI asked outright, so this is a
 *   direct boolean (checked → `true`, unchecked → `false`), not an inference —
 *   tri-state for never-asked legacy Students stays a later concern. Nothing
 *   else on the Student is touched (no contacts, no services, no Pipeline).
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
    params.updateStudent(result.studentId, (student) => ({
      ...student,
      marketing_consent: granted,
    }));
  }

  return result;
}
