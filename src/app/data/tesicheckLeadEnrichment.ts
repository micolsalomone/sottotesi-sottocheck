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
}): EnsureTesiCheckPipelineResult {
  const target = resolveEnrichmentTarget({
    accountEmail: params.accountEmail,
    students: params.students,
    pipelines: params.pipelines,
  });

  if (target.mode === 'unavailable') return { outcome: 'unavailable' };
  if (target.mode === 'student') return { outcome: 'student' };

  if (target.mode === 'pipeline') {
    const existing = params.pipelines.find((pipeline) => pipeline.id === target.pipelineId);
    if (existing && !(existing.sources ?? []).includes(TESICHECK_ACQUISITION_SOURCE)) {
      params.updatePipeline(target.pipelineId, (pipeline) => ({
        ...pipeline,
        sources: withTesiCheckSource(pipeline.sources),
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

  params.addPipeline(pipeline);
  return { outcome: 'created', pipelineId: id };
}
