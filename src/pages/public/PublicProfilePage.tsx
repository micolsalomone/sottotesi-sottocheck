import { ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { SottocheckActionButton } from '@/app/components/SottocheckActionButton';
import { useLavorazioni } from '@/app/data/LavorazioniContext';
import type { DegreeLevel, Pipeline, ThesisType } from '@/app/data/LavorazioniContext';
import { getAccountFirstName, getAccountSession } from '@/app/data/tesicheckAccountSession';
import {
  nextPipelineId,
  readEmailMarketingConsent,
  resolveEnrichmentTarget,
  TESICHECK_ACQUISITION_SOURCE,
  withEmailMarketingConsent,
  withTesiCheckSource,
} from '@/app/data/tesicheckLeadEnrichment';
import { readStudentEmailConsent, withStudentEmailConsent } from '@/app/data/marketingConsent';
import {
  FormSection,
  ReadOnlyField,
  SelectField,
  TextField,
} from '@/app/components/profile/ProfileFormPrimitives';
import { CommercialConsentField } from '@/app/components/profile/CommercialConsentField';
import { CrossSurfaceLink } from '@/app/components/account/AccountPrimitives';

// Same option vocabulary as the Admin academic forms (CreatePipelineDrawer /
// PipelineDetailDrawer), kept local because those lists are not exported.
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
  const { pipelines, students, addPipeline, updatePipeline, updateStudent } = useLavorazioni();
  const session = useMemo(() => getAccountSession(), []);
  const accountEmail = session?.emailVerified ? session.email : null;

  // Once a save has happened this visit, keep editing that exact Pipeline so a
  // repeated save never creates a duplicate.
  const [activePipelineId, setActivePipelineId] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [fallbackNameError, setFallbackNameError] = useState(false);

  const target = useMemo(() => {
    if (activePipelineId) {
      return { mode: 'pipeline' as const, pipelineId: activePipelineId };
    }
    return resolveEnrichmentTarget({ accountEmail, students, pipelines });
  }, [activePipelineId, accountEmail, students, pipelines]);

  // ─── Form state ───────────────────────────────────────────
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  // Commercial-communications preference, written to whichever identity domain
  // resolution resolves (Pipeline consent map, or a matched Student). `touched`
  // separates an explicit choice from an untouched unknown so a Profile save
  // never turns an absent/`null` value into `false`.
  const [commercialConsent, setCommercialConsent] = useState<boolean | null>(null);
  const [commercialTouched, setCommercialTouched] = useState(false);
  const [degreeLevel, setDegreeLevel] = useState<DegreeLevel | ''>('');
  const [courseName, setCourseName] = useState('');
  const [universityName, setUniversityName] = useState('');
  const [typology, setTypology] = useState<ThesisType | ''>('');
  const [professor, setProfessor] = useState('');
  const [subject, setSubject] = useState('');
  const [topic, setTopic] = useState('');

  // Prefill once per resolved target.
  const prefillKeyRef = useRef<string | null>(null);
  useEffect(() => {
    const key = target.mode === 'pipeline' ? `pipeline:${target.pipelineId}` : target.mode;
    if (prefillKeyRef.current === key) return;
    prefillKeyRef.current = key;

    if (target.mode === 'pipeline') {
      const pipeline = pipelines.find((item) => item.id === target.pipelineId);
      if (!pipeline) return;
      setFirstName(pipeline.first_name ?? '');
      setLastName(pipeline.last_name ?? '');
      setPhone(pipeline.phone ?? '');
      setDegreeLevel(pipeline.academic_data?.degree_level ?? '');
      setCourseName(pipeline.academic_data?.course_name ?? '');
      setUniversityName(pipeline.academic_data?.university_name ?? '');
      setTypology(pipeline.academic_data?.thesis_type ?? '');
      setProfessor(pipeline.academic_data?.thesis_professor ?? '');
      setSubject(pipeline.academic_data?.thesis_subject ?? '');
      setTopic(pipeline.academic_data?.thesis_topic ?? '');
      setCommercialConsent(
        readEmailMarketingConsent(pipeline.marketing_consents, pipeline.email ?? accountEmail),
      );
      setCommercialTouched(false);
      return;
    }

    if (target.mode === 'student') {
      // Per-email consent for the verified account email only — never a global
      // Student value, never other Student emails.
      const matched = students.find((item) => item.id === target.studentId);
      setCommercialConsent(readStudentEmailConsent(matched?.contacts?.emails, accountEmail));
      setCommercialTouched(false);
      return;
    }

    if (target.mode === 'new_pipeline') {
      // Fallback path only (pre-rule accounts): the first name normally already
      // lives on the Pipeline created at registration.
      setFirstName(getAccountFirstName(session));
      setCommercialConsent(null);
      setCommercialTouched(false);
    }
  }, [target, pipelines, students, session, accountEmail]);

  const markDirty = () => {
    setSaved(false);
    setFallbackNameError(false);
  };

  const buildAcademicData = (): Pipeline['academic_data'] | undefined => {
    const next: NonNullable<Pipeline['academic_data']> = {};
    if (degreeLevel) next.degree_level = degreeLevel;
    if (courseName.trim()) next.course_name = courseName.trim();
    if (universityName.trim()) next.university_name = universityName.trim();
    if (typology) next.thesis_type = typology;
    if (professor.trim()) next.thesis_professor = professor.trim();
    if (subject.trim()) next.thesis_subject = subject.trim();
    if (topic.trim()) next.thesis_topic = topic.trim();
    return Object.keys(next).length > 0 ? next : undefined;
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!accountEmail) return;

    // Re-resolve against the latest CRM data so a second submit updates the
    // Pipeline written by the first one instead of adding another.
    const liveTarget = activePipelineId
      ? ({ mode: 'pipeline', pipelineId: activePipelineId } as const)
      : resolveEnrichmentTarget({ accountEmail, students, pipelines });

    if (liveTarget.mode === 'student' || liveTarget.mode === 'unavailable') return;

    const trimmedFirst = firstName.trim();
    const trimmedLast = lastName.trim();
    const fullName = `${trimmedFirst} ${trimmedLast}`.trim();

    if (liveTarget.mode === 'pipeline') {
      updatePipeline(liveTarget.pipelineId, (pipeline) => {
        const mergedAcademic: NonNullable<Pipeline['academic_data']> = {
          ...pipeline.academic_data,
          ...(degreeLevel ? { degree_level: degreeLevel } : {}),
          ...(courseName.trim() ? { course_name: courseName.trim() } : {}),
          ...(universityName.trim() ? { university_name: universityName.trim() } : {}),
          ...(typology ? { thesis_type: typology } : {}),
          ...(professor.trim() ? { thesis_professor: professor.trim() } : {}),
          ...(subject.trim() ? { thesis_subject: subject.trim() } : {}),
          ...(topic.trim() ? { thesis_topic: topic.trim() } : {}),
        };
        return {
          ...pipeline,
          first_name: trimmedFirst,
          last_name: trimmedLast,
          student_name: fullName || pipeline.student_name || pipeline.email || 'Lead senza nome',
          phone: phone.trim() || pipeline.phone || '',
          academic_data:
            Object.keys(mergedAcademic).length > 0 ? mergedAcademic : pipeline.academic_data,
          sources: withTesiCheckSource(pipeline.sources),
          // Write the explicit boolean for the verified account email only when
          // the user chose one this session; preserve every other map entry and
          // never delete a key to represent `false`.
          ...(commercialTouched && commercialConsent !== null
            ? {
                marketing_consents: withEmailMarketingConsent(
                  pipeline.marketing_consents,
                  pipeline.email || accountEmail,
                  commercialConsent,
                ),
              }
            : {}),
        };
      });
      setActivePipelineId(liveTarget.pipelineId);
      setSaved(true);
      return;
    }

    // liveTarget.mode === 'new_pipeline' — fallback compatibility only: a
    // post-rule registration already has its Pipeline (created at email
    // verification), so this branch is reached only for pre-rule accounts. A
    // verified email is guaranteed here (resolver); a first name is still
    // required before a lead can be created.
    if (!trimmedFirst) {
      setFallbackNameError(true);
      return;
    }
    const id = nextPipelineId(pipelines);
    const newPipeline: Pipeline = {
      id,
      student_name: fullName,
      first_name: trimmedFirst,
      last_name: trimmedLast,
      email: accountEmail,
      phone: phone.trim(),
      sources: [TESICHECK_ACQUISITION_SOURCE],
      created_at: new Date().toISOString().split('T')[0],
      lavorazioni_ids: [],
      academic_data: buildAcademicData(),
      // The Pipeline is created by the normal enrichment flow (name + fields);
      // an explicit commercial choice rides along. No Pipeline is created solely
      // to store a preference.
      ...(commercialTouched && commercialConsent !== null
        ? { marketing_consents: withEmailMarketingConsent(undefined, accountEmail, commercialConsent) }
        : {}),
    };
    addPipeline(newPipeline);
    setActivePipelineId(id);
    setSaved(true);
  };

  // ─── Guard / neutral states ──────────────────────────────
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

  if (target.mode === 'unavailable') {
    return (
      <PageShell>
        <NeutralCard
          title="Profilo non disponibile"
          body="Non è stato possibile collegare il tuo profilo all'account. Riprova più tardi."
        />
      </PageShell>
    );
  }

  if (target.mode === 'student') {
    const matchedStudent = students.find((item) => item.id === target.studentId) ?? null;
    const saveStudentConsent = () => {
      if (!matchedStudent || !commercialTouched || commercialConsent === null || !accountEmail) return;
      // Write consent to the verified matching email contact only — no global
      // value, no other Student email, no Pipeline, no contact/service changes.
      updateStudent(matchedStudent.id, (s) => ({
        ...s,
        contacts: {
          emails: withStudentEmailConsent(s.contacts?.emails, accountEmail, commercialConsent, {
            source: 'tesicheck-standalone-profile',
          }),
          phones: s.contacts?.phones ?? [],
        },
      }));
      setSaved(true);
    };
    return (
      <PageShell>
        <div className="flex flex-col gap-6">
          <NeutralCard
            title="Profilo studente già collegato"
            body="Il tuo account è già associato a un profilo studente Sottotesi. Le informazioni del profilo studente sono gestite dal percorso dedicato: non è necessario compilare nulla qui."
          />

          {matchedStudent && (
            <FormSection title="Comunicazioni">
              <CommercialConsentField
                idPrefix="standalone-student-commercial-consent"
                value={commercialConsent}
                onChange={(v) => {
                  setCommercialConsent(v);
                  setCommercialTouched(true);
                  setSaved(false);
                }}
              />
              {saved && (
                <p
                  className="mt-3 text-[var(--muted-foreground)]"
                  style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-sm)', lineHeight: 1.6 }}
                >
                  Preferenza salvata.
                </p>
              )}
              <div className="mt-4">
                <SottocheckActionButton onClick={saveStudentConsent}>
                  Salva preferenza
                </SottocheckActionButton>
              </div>
            </FormSection>
          )}

          <CrossSurfaceLink to="/public-view/account" label="Gestisci account e privacy" />
        </div>
      </PageShell>
    );
  }

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
        <FormSection title="Anagrafica">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <TextField id="profile-first-name" label="Nome" value={firstName} onChange={(v) => { setFirstName(v); markDirty(); }} autoComplete="given-name" />
            <TextField id="profile-last-name" label="Cognome" value={lastName} onChange={(v) => { setLastName(v); markDirty(); }} autoComplete="family-name" />
          </div>
        </FormSection>

        <FormSection title="Contatto">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <ReadOnlyField label="Email account" value={session.email} />
            <TextField id="profile-phone" label="Telefono (facoltativo)" type="tel" value={phone} onChange={(v) => { setPhone(v); markDirty(); }} autoComplete="tel" />
          </div>
        </FormSection>

        <FormSection title="Percorso universitario">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <SelectField
              id="profile-degree-level"
              label="Livello di laurea"
              value={degreeLevel}
              onChange={(v) => { setDegreeLevel(v as DegreeLevel | ''); markDirty(); }}
              options={DEGREE_LEVEL_OPTIONS}
            />
            <TextField id="profile-course" label="Corso di laurea" value={courseName} onChange={(v) => { setCourseName(v); markDirty(); }} />
            <TextField id="profile-university" label="Università" value={universityName} onChange={(v) => { setUniversityName(v); markDirty(); }} autoComplete="organization" />
            <SelectField
              id="profile-typology"
              label="Tipologia"
              value={typology}
              onChange={(v) => { setTypology(v as ThesisType | ''); markDirty(); }}
              options={TYPOLOGY_OPTIONS}
            />
            <TextField id="profile-professor" label="Professore (facoltativo)" value={professor} onChange={(v) => { setProfessor(v); markDirty(); }} />
            <TextField id="profile-subject" label="Materia" value={subject} onChange={(v) => { setSubject(v); markDirty(); }} />
            <TextField id="profile-topic" label="Argomento" value={topic} onChange={(v) => { setTopic(v); markDirty(); }} />
          </div>
        </FormSection>

        <FormSection title="Comunicazioni">
          <CommercialConsentField
            idPrefix="standalone-commercial-consent"
            value={commercialConsent}
            onChange={(v) => {
              setCommercialConsent(v);
              setCommercialTouched(true);
              markDirty();
            }}
          />
        </FormSection>

        <div>
          {fallbackNameError && (
            <p
              className="mb-3 text-[var(--destructive)]"
              style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-sm)', lineHeight: 1.6 }}
            >
              Inserisci il tuo nome per salvare le informazioni.
            </p>
          )}
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
