import { ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { SottocheckActionButton } from '@/app/components/SottocheckActionButton';
import type { DegreeLevel, ThesisType } from '@/app/data/LavorazioniContext';
import { getAccountFirstName, getAccountSession } from '@/app/data/tesicheckAccountSession';
import {
  applyStandaloneAcademicEdits,
  createDraftAcademicRecord,
  ensureStandaloneProfile,
  toEditableStandaloneRecord,
  updateStandaloneProfile,
} from '@/app/data/standaloneProfile';
import type { EditableAcademic } from '@/app/data/studentAcademicRecords';
import {
  FormSection,
  TextField,
} from '@/app/components/profile/ProfileFormPrimitives';
import { AcademicRecordsSections } from '@/app/components/profile/AcademicRecordsSection';
import { CrossSurfaceLink } from '@/app/components/account/AccountPrimitives';

/**
 * Standalone Profile (`/public-view/profilo`) — its own self-contained
 * prototype domain (`standaloneProfile.ts`), keyed by the verified account
 * email. Deliberately CRM-free: it never resolves Pipeline vs. Student, so its
 * shape (one current academic record + zero-or-more previous ones, always
 * available to fill in) never changes based on identity-resolution branching.
 * Acquisition Pipeline creation/dedupe at registration
 * (`tesicheckLeadEnrichment.ts`) is a separate, untouched concern — this page
 * never reads or writes it.
 *
 * Self-service IA rule: account email, phone (Recapiti) and the
 * commercial-communications preference all belong to Account
 * (`/public-view/account`), not Profile — this page owns only personal info
 * and academic history. See `PublicAccountPage.tsx` for where phone and the
 * consent controls now live.
 */

// Same option vocabulary as the Admin academic forms / Student Profile, kept
// local because those lists are not exported (see the standalone-enrichment
// handoff for why this stays a per-file constant rather than a shared module).
const DEGREE_LEVEL_OPTIONS: { value: DegreeLevel; label: string }[] = [
  { value: 'triennale', label: 'Triennale' },
  { value: 'magistrale', label: 'Magistrale' },
  { value: 'ciclo_unico', label: 'A ciclo unico' },
  { value: 'master', label: 'Master' },
  { value: 'dottorato', label: 'Dottorato' },
];

// `Tipologia` — underlying field stays `thesis_type`; `Esame` is a value of it.
const TYPOLOGY_OPTIONS: { value: ThesisType; label: string }[] = [
  { value: 'compilativa', label: 'Compilativa' },
  { value: 'sperimentale', label: 'Sperimentale' },
  { value: 'esame', label: 'Esame' },
];

export function PublicProfilePage() {
  const session = useMemo(() => getAccountSession(), []);
  const accountEmail = session?.emailVerified ? session.email : null;

  // ─── Form state ───────────────────────────────────────────
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [academic, setAcademic] = useState<EditableAcademic[]>([]);
  const [saved, setSaved] = useState(false);

  // Prefill once per account email; re-syncs when the record SET changes (add/
  // delete), mirroring `student/ProfilePage`, so in-session edits are not lost.
  const prefillKeyRef = useRef<string | null>(null);
  useEffect(() => {
    if (!accountEmail) return;
    const profile = ensureStandaloneProfile(accountEmail);
    if (!profile) return;
    const key = `${accountEmail}:${profile.academic_records.map((r) => r.id).join(',')}`;
    if (prefillKeyRef.current === key) return;
    prefillKeyRef.current = key;

    setFirstName(profile.first_name || getAccountFirstName(session));
    setLastName(profile.last_name);
    setAcademic([
      ...profile.academic_records.filter((r) => r.is_current).map(toEditableStandaloneRecord),
      ...profile.academic_records.filter((r) => !r.is_current).map(toEditableStandaloneRecord),
    ]);
  }, [accountEmail, session]);

  const markDirty = () => setSaved(false);

  const patchAcademic = (id: string, patch: Partial<EditableAcademic>) => {
    setAcademic((prev) => prev.map((record) => (record.id === id ? { ...record, ...patch } : record)));
    markDirty();
  };

  const addPreviousRecord = () => {
    setAcademic((prev) => [...prev, createDraftAcademicRecord()]);
    markDirty();
  };

  // Unsaved draft: drop from local form state only. It never reached the
  // Profile store, so no write is needed.
  const removeDraft = (id: string) => {
    setAcademic((prev) => prev.filter((record) => record.id !== id));
    markDirty();
  };

  // No `StudentService` concept in the standalone Profile — every previous
  // record is always a safe delete target.
  const deletePersistedRecord = (id: string) => {
    if (!accountEmail) return;
    updateStandaloneProfile(accountEmail, (profile) => ({
      ...profile,
      academic_records: profile.academic_records.filter((record) => record.id !== id),
    }));
  };
  const isRecordServiceBound = () => false;

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!accountEmail) return;

    updateStandaloneProfile(accountEmail, (profile) => ({
      ...profile,
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      academic_records: applyStandaloneAcademicEdits(profile.academic_records, academic),
    }));
    setSaved(true);
  };

  // ─── Guard / neutral state ──────────────────────────────
  if (!session || !session.emailVerified) {
    return (
      <PageShell>
        <NeutralCard
          title="Account TesiCheck non disponibile"
          body="Accedi con un account TesiCheck verificato per completare il tuo profilo."
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
            Informazioni salvate. Puoi aggiornarle di nuovo in qualsiasi momento.
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-6">
        <FormSection title="Informazioni personali">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <TextField id="profile-first-name" label="Nome" value={firstName} onChange={(v) => { setFirstName(v); markDirty(); }} autoComplete="given-name" />
            <TextField id="profile-last-name" label="Cognome" value={lastName} onChange={(v) => { setLastName(v); markDirty(); }} autoComplete="family-name" />
          </div>
        </FormSection>

        <AcademicRecordsSections
          current={currentRecords}
          previous={previousRecords}
          onChange={patchAcademic}
          onAddPrevious={addPreviousRecord}
          onRemoveDraft={removeDraft}
          onDeletePersisted={deletePersistedRecord}
          isRecordServiceBound={isRecordServiceBound}
          degreeLevelOptions={DEGREE_LEVEL_OPTIONS}
          typologyOptions={TYPOLOGY_OPTIONS}
        />

        <div>
          <SottocheckActionButton type="submit">Salva informazioni</SottocheckActionButton>
        </div>
      </form>

      <div className="mt-6">
        <CrossSurfaceLink to="/public-view/account" label="Gestisci account e privacy" />
      </div>
    </PageShell>
  );
}

// ─── Layout / field primitives (local, neutral-first) ───────
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
          Completa il tuo profilo
        </h1>
        <p
          className="mt-2 text-[var(--muted-foreground)]"
          style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-base)', lineHeight: 1.6 }}
        >
          Questi dettagli aiutano Sottotesi a conoscere il tuo contesto universitario e di tesi. Sono
          facoltativi e non influenzano l&apos;accesso al servizio o ai report.
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
