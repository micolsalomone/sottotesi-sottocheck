import { ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { SottocheckActionButton } from '@/app/components/SottocheckActionButton';
import { useLavorazioni } from '@/app/data/LavorazioniContext';
import type { DegreeLevel, ThesisType } from '@/app/data/LavorazioniContext';
import { STUDENT_VIEW_STUDENT_RECORD_ID } from '@/app/utils/studentView';
import {
  FormSection,
  ReadOnlyField,
  TextField,
} from '@/app/components/profile/ProfileFormPrimitives';
import { AcademicRecordsSections } from '@/app/components/profile/AcademicRecordsSection';
import { CrossSurfaceLink } from '@/app/components/account/AccountPrimitives';
import { CommercialConsentField } from '@/app/components/profile/CommercialConsentField';
import { readStudentEmailConsent, withStudentEmailConsent } from '@/app/data/marketingConsent';
import {
  applyAcademicRecordEdits,
  createDraftAcademicRecord,
  toEditableAcademicRecord,
  type EditableAcademic,
} from '@/app/data/studentAcademicRecords';

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

  // Commercial-communications consent for the PRIMARY email
  // (`contacts.emails[].marketing_consent`). `commercialTouched` separates "the
  // user made a choice this session" from "untouched" so an unrelated Profile
  // save never turns an untouched `null` into `false`.
  const [commercialConsent, setCommercialConsent] = useState<boolean | null>(null);
  const [commercialTouched, setCommercialTouched] = useState(false);

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
    setCommercialConsent(readStudentEmailConsent(student.contacts?.emails, primaryEmail));
    setCommercialTouched(false);

    const current = student.academic_records.filter((r) => r.is_current).map(toEditableAcademicRecord);
    const previous = student.academic_records.filter((r) => !r.is_current).map(toEditableAcademicRecord);
    setAcademic([...current, ...previous]);
  }, [student, existingPrimaryPhone, phoneIsGapFill, primaryEmail]);

  const markDirty = () => setSaved(false);

  const patchRecord = (id: string, patch: Partial<EditableAcademic>) => {
    setAcademic((prev) => prev.map((record) => (record.id === id ? { ...record, ...patch } : record)));
    markDirty();
  };

  const addPreviousRecord = () => {
    setAcademic((prev) => [...prev, createDraftAcademicRecord()]);
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

      // Commercial consent: write ONLY the primary email's per-email value, and
      // only when the Student changed it this session. No other email, no
      // `purposes`, no service access is touched.
      if (commercialTouched && primaryEmail) {
        contacts = {
          emails: withStudentEmailConsent(contacts?.emails, primaryEmail, commercialConsent, {
            source: 'student-profile',
          }),
          phones: contacts?.phones ?? [],
        };
      }

      // Existing records: direct content edit of the SAME record (never `id` /
      // `student_id` / `is_current` / `created_at` / `foreign_language` /
      // `thesis_language` / service binding, `updated_at` bumped only when
      // content actually changed). New drafts with content become non-current
      // previous records. Shared with the standalone Profile's Student branch.
      const academicRecords = applyAcademicRecordEdits(prev.id, prev.academic_records, academic);

      return {
        ...prev,
        first_name: nextFirst,
        last_name: nextLast,
        name: nextName,
        contacts,
        academic_records: academicRecords,
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

          {/* Commercial-communications consent for the primary email — kept
              adjacent to the email it applies to, not in a separate section. */}
          <div className="mt-4 border-t border-[var(--border)] pt-4">
            <CommercialConsentField
              idPrefix="student-commercial-consent"
              value={commercialConsent}
              onChange={(v) => {
                setCommercialConsent(v);
                setCommercialTouched(true);
                markDirty();
              }}
            />
            {primaryEmail && (
              <p
                className="mt-2 text-[var(--muted-foreground)]"
                style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-sm)', lineHeight: 1.6 }}
              >
                Riferito all&apos;indirizzo {primaryEmail}.
              </p>
            )}
          </div>
        </FormSection>

        <AcademicRecordsSections
          current={currentRecords}
          previous={previousRecords}
          onChange={patchRecord}
          onAddPrevious={addPreviousRecord}
          onRemoveDraft={removeDraft}
          onDeletePersisted={deletePersistedRecord}
          isRecordServiceBound={isRecordServiceBound}
          degreeLevelOptions={DEGREE_LEVEL_OPTIONS}
          typologyOptions={TYPOLOGY_OPTIONS}
        />

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
