import { ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import { CheckCircle2, Plus } from 'lucide-react';
import { SottocheckActionButton } from '@/app/components/SottocheckActionButton';
import { useLavorazioni } from '@/app/data/LavorazioniContext';
import type { DegreeLevel, StudentAcademicRecord, ThesisType } from '@/app/data/LavorazioniContext';
import { STUDENT_VIEW_STUDENT_RECORD_ID } from '@/app/utils/studentView';
import {
  FormSection,
  ReadOnlyField,
  SelectField,
  TextField,
} from '@/app/components/profile/ProfileFormPrimitives';
import { CrossSurfaceLink } from '@/app/components/account/AccountPrimitives';

// Client-approved academic vocabulary. Underlying fields keep their legacy names
// (`thesis_type` / `thesis_professor` / `thesis_subject` / `thesis_topic`).
const DEGREE_LEVEL_OPTIONS: { value: DegreeLevel; label: string }[] = [
  { value: 'triennale', label: 'Triennale' },
  { value: 'magistrale', label: 'Magistrale' },
  { value: 'ciclo_unico', label: 'A ciclo unico' },
  { value: 'master', label: 'Master' },
  { value: 'dottorato', label: 'Dottorato' },
];

// `Tipologia` — value `esame` shares the same academic structure, no exam-specific fields.
const TYPOLOGY_OPTIONS: { value: ThesisType; label: string }[] = [
  { value: 'compilativa', label: 'Compilativa' },
  { value: 'sperimentale', label: 'Sperimentale' },
  { value: 'esame', label: 'Esame' },
];

// Lightweight text action, aligned with a record heading — keeps the neutral
// Profile language, not an Admin-style card control.
const textActionStyle = {
  fontFamily: 'var(--font-inter)',
  fontSize: 'var(--text-label)',
  fontWeight: 'var(--font-weight-medium)',
  color: 'var(--muted-foreground)',
  textDecoration: 'underline',
  cursor: 'pointer',
} as const;

// Editable projection of the academic content fields the Student may maintain.
// Operational bindings (`student_id`, `id`, `is_current`, timestamps, service
// links) are never surfaced here.
interface EditableAcademic {
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

function toEditable(record: StudentAcademicRecord): EditableAcademic {
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

function editableHasContent(record: EditableAcademic): boolean {
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
// bumping `updated_at` on records the Student did not actually touch.
function editableDiffersFrom(edit: EditableAcademic, stored: StudentAcademicRecord): boolean {
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

export function ProfilePage() {
  const { students, updateStudent, data: services } = useLavorazioni();

  // Structured Student identity — resolved only by the prototype bridge id.
  // No Pipeline resolution, no email/CRM matching, no account session.
  const student = useMemo(
    () => students.find((item) => item.id === STUDENT_VIEW_STUDENT_RECORD_ID) ?? null,
    [students],
  );

  const primaryEmail = useMemo(() => {
    if (!student) return '';
    return student.contacts?.emails?.find((entry) => entry.is_primary)?.email ?? student.email ?? '';
  }, [student]);

  // Primary phone from the structured contacts model; the deprecated top-level
  // field is only a read fallback.
  const existingPrimaryPhone = useMemo(() => {
    if (!student) return '';
    return student.contacts?.phones?.find((entry) => entry.is_primary)?.phone ?? student.phone ?? '';
  }, [student]);
  const phoneIsGapFill = !existingPrimaryPhone.trim();

  // ─── Form state ───────────────────────────────────────────
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [academic, setAcademic] = useState<EditableAcademic[]>([]);
  const [saved, setSaved] = useState(false);
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(null);

  const prefillKeyRef = useRef<string | null>(null);
  useEffect(() => {
    if (!student) return;
    // Re-seed only when the *set* of stored records changes (ids), so in-session
    // edits and freshly added rows are not clobbered.
    const key = `${student.id}:${student.academic_records.map((r) => r.id).join(',')}`;
    if (prefillKeyRef.current === key) return;
    prefillKeyRef.current = key;

    setFirstName(student.first_name ?? '');
    setLastName(student.last_name ?? '');
    setPhone(phoneIsGapFill ? '' : existingPrimaryPhone);

    const current = student.academic_records.filter((r) => r.is_current).map(toEditable);
    const previous = student.academic_records.filter((r) => !r.is_current).map(toEditable);
    setAcademic([...current, ...previous]);
  }, [student, existingPrimaryPhone, phoneIsGapFill]);

  const markDirty = () => setSaved(false);

  const patchRecord = (id: string, patch: Partial<EditableAcademic>) => {
    setAcademic((prev) => prev.map((record) => (record.id === id ? { ...record, ...patch } : record)));
    markDirty();
  };

  const addPreviousRecord = () => {
    setAcademic((prev) => [
      ...prev,
      {
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
      },
    ]);
    markDirty();
  };

  // Unsaved draft: drop from local form state only. It never reached
  // `Student.academic_records`, so no domain write is needed.
  const removeDraft = (id: string) => {
    setAcademic((prev) => prev.filter((record) => record.id !== id));
    markDirty();
  };

  // Persisted, non-current, service-unbound record: remove it from the shared
  // Student domain array via the same `updateStudent` write. Current record,
  // other records, `is_current`, contacts, services and Pipelines are untouched.
  const deletePersistedRecord = (id: string) => {
    if (!student) return;
    updateStudent(student.id, (prev) => ({
      ...prev,
      academic_records: prev.academic_records.filter((record) => record.id !== id),
    }));
    setConfirmingDeleteId(null);
  };

  const isRecordServiceBound = (id: string) =>
    services.some((service) => service.academic_record_id === id);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!student) return;

    // Personal fields: editable, but a blank input preserves the stored value
    // (this UI has no explicit "clear" affordance).
    const nextFirst = firstName.trim() || student.first_name;
    const nextLast = lastName.trim() || student.last_name;
    const nextName = `${nextFirst} ${nextLast}`.trim() || student.name;

    // Phone: gap-fill only. Never overwrite an existing primary number.
    const gapFilledPhone = phoneIsGapFill ? phone.trim() : '';

    updateStudent(student.id, (prev) => {
      let contacts = prev.contacts;
      if (gapFilledPhone && contacts?.phones?.some((entry) => entry.is_primary)) {
        contacts = {
          ...contacts,
          phones: contacts.phones.map((entry) =>
            entry.is_primary ? { ...entry, phone: gapFilledPhone } : entry,
          ),
        };
      }

      const today = new Date().toISOString().split('T')[0];
      const editsById = new Map(academic.filter((r) => !r.isNew).map((r) => [r.id, r]));

      // Existing records: direct content edit of the SAME record. Never touch
      // `id`, `student_id`, `is_current`, `created_at`, `foreign_language`,
      // `thesis_language`, or any service binding. `updated_at` is bumped only
      // when content actually changed (matches the Admin drawer convention).
      const mergedExisting = prev.academic_records.map((record) => {
        const edit = editsById.get(record.id);
        if (!edit || !editableDiffersFrom(edit, record)) return record;
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

      // Newly added *previous* records: same StudentAcademicRecord model, Admin
      // id/date conventions, never current, no service binding.
      const addedPrevious: StudentAcademicRecord[] = academic
        .filter((r) => r.isNew && editableHasContent(r))
        .map((r) => ({
          id: r.id,
          student_id: prev.id,
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

      return {
        ...prev,
        first_name: nextFirst,
        last_name: nextLast,
        name: nextName,
        contacts,
        academic_records: [...mergedExisting, ...addedPrevious],
      };
    });

    setSaved(true);
  };

  // ─── Neutral unavailable state ───────────────────────────
  if (!student) {
    return (
      <PageShell>
        <NeutralCard
          title="Profilo non disponibile"
          body="Non è stato possibile caricare il profilo studente associato a questa area. Riprova più tardi."
        />
      </PageShell>
    );
  }

  const currentRecords = academic.filter((r) => r.isCurrent);
  const previousRecords = academic.filter((r) => !r.isCurrent);

  return (
    <PageShell>
      {saved && (
        <div
          role="status"
          className="mb-6 flex items-start gap-3 border border-[var(--border)] bg-[var(--card)] p-4"
          style={{ borderRadius: 'var(--radius)' }}
        >
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[var(--primary)]" aria-hidden="true" />
          <p
            className="text-[var(--foreground)]"
            style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)', lineHeight: 1.6 }}
          >
            Informazioni salvate.
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-6">
        <FormSection title="Informazioni personali">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <TextField
              id="student-profile-first-name"
              label="Nome"
              value={firstName}
              onChange={(v) => { setFirstName(v); markDirty(); }}
              autoComplete="given-name"
            />
            <TextField
              id="student-profile-last-name"
              label="Cognome"
              value={lastName}
              onChange={(v) => { setLastName(v); markDirty(); }}
              autoComplete="family-name"
            />
          </div>
        </FormSection>

        <FormSection title="Contatti">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <ReadOnlyField label="Email" value={primaryEmail} />
            {phoneIsGapFill ? (
              <TextField
                id="student-profile-phone"
                label="Telefono (facoltativo)"
                type="tel"
                value={phone}
                onChange={(v) => { setPhone(v); markDirty(); }}
                autoComplete="tel"
              />
            ) : (
              <ReadOnlyField label="Telefono" value={existingPrimaryPhone} />
            )}
          </div>
        </FormSection>

        <FormSection title="Percorso attuale">
          {currentRecords.length > 0 ? (
            currentRecords.map((record) => (
              <AcademicFields key={record.id} record={record} onChange={patchRecord} />
            ))
          ) : (
            <p
              className="text-[var(--muted-foreground)]"
              style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)', lineHeight: 1.6 }}
            >
              Il percorso universitario attuale non è ancora disponibile. Sarà impostato dal team Sottotesi.
            </p>
          )}
        </FormSection>

        <FormSection title="Percorsi precedenti">
          <div className="flex flex-col gap-6">
            {previousRecords.length === 0 && (
              <p
                className="text-[var(--muted-foreground)]"
                style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)', lineHeight: 1.6 }}
              >
                Nessun percorso precedente registrato.
              </p>
            )}
            {previousRecords.map((record, index) => {
              const bound = !record.isNew && isRecordServiceBound(record.id);
              const confirming = confirmingDeleteId === record.id;
              return (
                <div
                  key={record.id}
                  className={index > 0 ? 'border-t border-[var(--border)] pt-6' : undefined}
                >
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
                    <h3
                      className="text-[var(--foreground)]"
                      style={{
                        fontFamily: 'var(--font-inter)',
                        fontSize: 'var(--text-label)',
                        fontWeight: 'var(--font-weight-medium)',
                      }}
                    >
                      Percorso precedente {index + 1}
                    </h3>
                    {record.isNew ? (
                      <button type="button" onClick={() => removeDraft(record.id)} style={textActionStyle}>
                        Rimuovi
                      </button>
                    ) : bound ? null : confirming ? (
                      <span className="flex items-center gap-3">
                        <span
                          className="text-[var(--muted-foreground)]"
                          style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-sm)' }}
                        >
                          Eliminare questo percorso accademico?
                        </span>
                        <button
                          type="button"
                          onClick={() => deletePersistedRecord(record.id)}
                          style={{ ...textActionStyle, color: 'var(--destructive)' }}
                        >
                          Elimina
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmingDeleteId(null)}
                          style={textActionStyle}
                        >
                          Annulla
                        </button>
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmingDeleteId(record.id)}
                        style={textActionStyle}
                      >
                        Elimina percorso
                      </button>
                    )}
                  </div>
                  <AcademicFields record={record} onChange={patchRecord} />
                  {bound && (
                    <p
                      className="mt-3 text-[var(--muted-foreground)]"
                      style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-sm)', lineHeight: 1.6 }}
                    >
                      Questo percorso è collegato a una lavorazione e non può essere eliminato.
                    </p>
                  )}
                </div>
              );
            })}
            <div>
              <button
                type="button"
                onClick={addPreviousRecord}
                className="inline-flex items-center gap-2 border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-[var(--foreground)] hover:bg-[var(--muted)]"
                style={{
                  borderRadius: 'var(--radius)',
                  fontFamily: 'var(--font-inter)',
                  fontSize: 'var(--text-label)',
                  fontWeight: 'var(--font-weight-medium)',
                }}
              >
                <Plus className="h-4 w-4" aria-hidden="true" />
                Aggiungi percorso precedente
              </button>
            </div>
          </div>
        </FormSection>

        {/* Slice C will add a commercial-communications consent control here.
            Terms & Privacy status live on the Account page (/student-view/account),
            not in Profile. */}

        <div>
          <SottocheckActionButton type="submit">Salva</SottocheckActionButton>
        </div>
      </form>

      <div className="mt-6">
        <CrossSurfaceLink to="/student-view/account" label="Gestisci account e privacy" />
      </div>
    </PageShell>
  );
}

// ─── Academic content fields (shared between current and previous) ──────────
function AcademicFields({
  record,
  onChange,
}: {
  record: EditableAcademic;
  onChange: (id: string, patch: Partial<EditableAcademic>) => void;
}) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <SelectField
        id={`academic-${record.id}-degree-level`}
        label="Livello di laurea"
        value={record.degree_level}
        onChange={(v) => onChange(record.id, { degree_level: v as DegreeLevel | '' })}
        options={DEGREE_LEVEL_OPTIONS}
      />
      <TextField
        id={`academic-${record.id}-course`}
        label="Corso di laurea"
        value={record.course_name}
        onChange={(v) => onChange(record.id, { course_name: v })}
      />
      <TextField
        id={`academic-${record.id}-university`}
        label="Università"
        value={record.university_name}
        onChange={(v) => onChange(record.id, { university_name: v })}
        autoComplete="organization"
      />
      <SelectField
        id={`academic-${record.id}-typology`}
        label="Tipologia"
        value={record.thesis_type}
        onChange={(v) => onChange(record.id, { thesis_type: v as ThesisType | '' })}
        options={TYPOLOGY_OPTIONS}
      />
      <TextField
        id={`academic-${record.id}-professor`}
        label="Professore (facoltativo)"
        value={record.thesis_professor}
        onChange={(v) => onChange(record.id, { thesis_professor: v })}
      />
      <TextField
        id={`academic-${record.id}-subject`}
        label="Materia"
        value={record.thesis_subject}
        onChange={(v) => onChange(record.id, { thesis_subject: v })}
      />
      <TextField
        id={`academic-${record.id}-topic`}
        label="Argomento"
        value={record.thesis_topic}
        onChange={(v) => onChange(record.id, { thesis_topic: v })}
      />
    </div>
  );
}

// ─── Layout primitives (local, neutral-first) ──────────────
function PageShell({ children }: { children: ReactNode }) {
  return (
    <div className="py-[32px]">
      <header className="mb-8 max-w-[760px]">
        <h1
          style={{
            fontFamily: 'var(--font-alegreya)',
            fontSize: 'var(--text-h1)',
            fontWeight: 'var(--font-weight-bold)',
            lineHeight: 1.3,
            color: 'var(--foreground)',
          }}
        >
          Profilo
        </h1>
        <p
          className="mt-2 text-[var(--muted-foreground)]"
          style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-base)', lineHeight: 1.6 }}
        >
          Rivedi e completa le informazioni personali e accademiche associate al tuo profilo Sottotesi.
        </p>
      </header>
      <div className="max-w-[760px]">{children}</div>
    </div>
  );
}

function NeutralCard({ title, body }: { title: string; body: string }) {
  return (
    <section
      className="border border-[var(--border)] bg-[var(--card)] p-6 md:p-8"
      style={{ borderRadius: 'var(--radius)', boxShadow: 'var(--elevation-sm)' }}
    >
      <h2
        style={{
          fontFamily: 'var(--font-alegreya)',
          fontSize: 'var(--text-h3)',
          fontWeight: 'var(--font-weight-bold)',
          color: 'var(--foreground)',
        }}
      >
        {title}
      </h2>
      <p
        className="mt-2 text-[var(--muted-foreground)]"
        style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)', lineHeight: 1.6 }}
      >
        {body}
      </p>
    </section>
  );
}
