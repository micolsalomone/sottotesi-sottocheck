/**
 * Editable-projection model for `Student.academic_records[]`, used directly by
 * `student/ProfilePage` (`/student-view/profilo`) — the Student role surface
 * that lets a Student correct their own real academic records.
 *
 * The standalone Profile (`/public-view/profilo`, `standaloneProfile.ts`) is a
 * SEPARATE, CRM-free domain: it never reads or writes `Student.academic_records[]`
 * and does not import `toEditableAcademicRecord` / `applyAcademicRecordEdits` /
 * `editableAcademicDiffersFrom` from here (those stay Student-typed, used only
 * by `student/ProfilePage`). It reuses only the fully generic pieces —
 * `EditableAcademic` (the type), `createDraftAcademicRecord`,
 * `editableAcademicHasContent` — which never reference `StudentAcademicRecord`.
 *
 * This is a CORRECTION surface, not the post-payment academic review
 * (`standaloneProfile.ts`'s `applyStandaloneAcademicReview`): an edited field
 * here intentionally overwrites the stored value — the user may correct data
 * they already know, the same convention the Admin drawer uses. It never
 * gap-fills; that semantic is specific to the post-payment review.
 *
 * Multiple academic records are a real part of the Student domain. This module
 * never flattens them into one record and never introduces a second
 * academic-record source — `Student.academic_records[]` stays authoritative,
 * read/written only via the host's `updateStudent`.
 */
import type { DegreeLevel, StudentAcademicRecord, ThesisType } from './LavorazioniContext';

/**
 * Editable projection of the academic content fields a Student-domain surface
 * may maintain. Operational bindings (`student_id`, `id`, `is_current`,
 * `created_at`, `foreign_language`, `thesis_language`, service links) are never
 * surfaced through this projection — callers that need `id` still have it, but
 * it is never itself an editable field.
 */
export interface EditableAcademic {
  id: string;
  isNew: boolean;
  isCurrent: boolean;
  degree_level: DegreeLevel | '';
  course_name: string;
  university_name: string;
  thesis_type: ThesisType | '';
  thesis_professor: string;
  thesis_subject: string;
  thesis_topic: string;
}

export function toEditableAcademicRecord(record: StudentAcademicRecord): EditableAcademic {
  return {
    id: record.id,
    isNew: false,
    isCurrent: record.is_current,
    degree_level: record.degree_level ?? '',
    course_name: record.course_name ?? '',
    university_name: record.university_name ?? '',
    thesis_type: record.thesis_type ?? '',
    thesis_professor: record.thesis_professor ?? '',
    thesis_subject: record.thesis_subject ?? '',
    thesis_topic: record.thesis_topic ?? '',
  };
}

/** A blank draft for "Aggiungi percorso precedente" — always non-current, never persisted until it has content. */
export function createDraftAcademicRecord(): EditableAcademic {
  return {
    id: `AR-NEW-${Date.now()}`,
    isNew: true,
    isCurrent: false,
    degree_level: '',
    course_name: '',
    university_name: '',
    thesis_type: '',
    thesis_professor: '',
    thesis_subject: '',
    thesis_topic: '',
  };
}

export function editableAcademicHasContent(record: EditableAcademic): boolean {
  return Boolean(
    record.degree_level ||
      record.course_name.trim() ||
      record.university_name.trim() ||
      record.thesis_type ||
      record.thesis_professor.trim() ||
      record.thesis_subject.trim() ||
      record.thesis_topic.trim(),
  );
}

// True when the editable content diverges from the stored record — used to avoid
// bumping `updated_at` on records the user did not actually touch.
export function editableAcademicDiffersFrom(edit: EditableAcademic, stored: StudentAcademicRecord): boolean {
  return (
    edit.degree_level !== (stored.degree_level ?? '') ||
    edit.course_name.trim() !== (stored.course_name ?? '').trim() ||
    edit.university_name.trim() !== (stored.university_name ?? '').trim() ||
    edit.thesis_type !== (stored.thesis_type ?? '') ||
    edit.thesis_professor.trim() !== (stored.thesis_professor ?? '').trim() ||
    edit.thesis_subject.trim() !== (stored.thesis_subject ?? '').trim() ||
    edit.thesis_topic.trim() !== (stored.thesis_topic ?? '').trim()
  );
}

/**
 * Apply a Profile-style direct correction of academic-record CONTENT to a
 * Student's `academic_records[]`:
 *  - existing records (matched by stable `id`) are corrected in place — never
 *    `id` / `student_id` / `is_current` / `created_at` / `foreign_language` /
 *    `thesis_language` / any service binding; `updated_at` is bumped only when
 *    content actually changed (Admin-drawer convention);
 *  - drafts with content become new, non-current previous records (same
 *    id/date conventions as the Admin drawer);
 *  - drafts without content, and records the caller never edited, are ignored.
 *
 * Returns a NEW array; the caller passes it straight into `updateStudent`.
 */
export function applyAcademicRecordEdits(
  studentId: string,
  records: StudentAcademicRecord[],
  edits: EditableAcademic[],
): StudentAcademicRecord[] {
  const today = new Date().toISOString().split('T')[0];
  const editsById = new Map(edits.filter((r) => !r.isNew).map((r) => [r.id, r]));

  const mergedExisting = records.map((record) => {
    const edit = editsById.get(record.id);
    if (!edit || !editableAcademicDiffersFrom(edit, record)) return record;
    return {
      ...record,
      degree_level: edit.degree_level,
      course_name: edit.course_name.trim(),
      university_name: edit.university_name.trim(),
      thesis_type: edit.thesis_type,
      thesis_professor: edit.thesis_professor.trim(),
      thesis_subject: edit.thesis_subject.trim(),
      thesis_topic: edit.thesis_topic.trim() || undefined,
      updated_at: today,
    };
  });

  const addedPrevious: StudentAcademicRecord[] = edits
    .filter((r) => r.isNew && editableAcademicHasContent(r))
    .map((r) => ({
      id: r.id,
      student_id: studentId,
      degree_level: r.degree_level,
      course_name: r.course_name.trim(),
      university_name: r.university_name.trim(),
      thesis_professor: r.thesis_professor.trim(),
      thesis_topic: r.thesis_topic.trim(),
      thesis_subject: r.thesis_subject.trim(),
      foreign_language: false,
      thesis_language: '',
      thesis_type: r.thesis_type,
      is_current: false,
      created_at: today,
      updated_at: today,
    }));

  return [...mergedExisting, ...addedPrevious];
}
