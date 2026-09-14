import { useEffect, useRef, useState } from 'react';
import { SottocheckActionButton } from '@/app/components/SottocheckActionButton';
import {
  FormSection,
  SelectField,
  TextField,
  controlStyle,
  fieldLabelStyle,
} from '@/app/components/profile/ProfileFormPrimitives';
import type {
  AcademicRecordOption,
  PostPaymentAcademicValues,
} from '@/app/data/tesicheckLeadEnrichment';

/**
 * Post-payment ACADEMIC-PROFILE REVIEW interstitial — authenticated standalone
 * paid flow only.
 *
 * PRESENTATIONAL ONLY. It never receives the check id, the report path, a
 * Pipeline, a Student or the account session — the paid page owns those
 * concerns.
 *
 * It always renders all four academic fields, prefilled from `initialValues`, so
 * the user can review, correct or complete the academic information already on
 * their Profile before seeing the report. When `records` holds more than one
 * entry (a Student with multiple academic records) a compact `Percorso
 * accademico` selector chooses which EXISTING record is being reviewed — it is
 * only an edit-target chooser, nothing more. With one record, or a Pipeline
 * target, no selector is shown.
 *
 * It is NOT identity completion, contact collection, account/legal management or
 * full Profile editing — surname, phone and contacts are Profile concerns and
 * are never part of this step. Both actions always lead to the paid report.
 */

// Option lists are duplicated locally on purpose: the equivalent lists in
// PublicProfilePage are not exported, and extracting them would mean editing a
// Profile page for a second consumer — out of scope for this slice.
const DEGREE_LEVEL_OPTIONS = [
  { value: 'triennale', label: 'Triennale' },
  { value: 'magistrale', label: 'Magistrale' },
  { value: 'ciclo_unico', label: 'A ciclo unico' },
  { value: 'master', label: 'Master' },
  { value: 'dottorato', label: 'Dottorato' },
];

const TYPOLOGY_OPTIONS = [
  { value: 'compilativa', label: 'Compilativa' },
  { value: 'sperimentale', label: 'Sperimentale' },
  { value: 'esame', label: 'Esame' },
];

interface PostPaymentEnrichmentInterstitialProps {
  initialValues: PostPaymentAcademicValues;
  records?: AcademicRecordOption[];
  selectedRecordId?: string;
  onRecordChange?: (recordId: string) => void;
  onSave: (values: PostPaymentAcademicValues) => void;
  onSkip: () => void;
}

export function PostPaymentEnrichmentInterstitial({
  initialValues,
  records,
  selectedRecordId,
  onRecordChange,
  onSave,
  onSkip,
}: PostPaymentEnrichmentInterstitialProps) {
  const [degreeLevel, setDegreeLevel] = useState<string>(initialValues.degree_level ?? '');
  const [universityName, setUniversityName] = useState<string>(initialValues.university_name ?? '');
  const [courseName, setCourseName] = useState<string>(initialValues.course_name ?? '');
  const [thesisType, setThesisType] = useState<string>(initialValues.thesis_type ?? '');

  // Re-seed the four fields when the reviewed record changes (parent recomputes
  // `initialValues` for the new `selectedRecordId`). Guarded so an unrelated
  // re-render never discards in-progress edits.
  const seededRecordRef = useRef(selectedRecordId);
  useEffect(() => {
    if (seededRecordRef.current === selectedRecordId) return;
    seededRecordRef.current = selectedRecordId;
    setDegreeLevel(initialValues.degree_level ?? '');
    setUniversityName(initialValues.university_name ?? '');
    setCourseName(initialValues.course_name ?? '');
    setThesisType(initialValues.thesis_type ?? '');
  }, [selectedRecordId, initialValues]);

  const showSelector = !!records && records.length > 1;

  const handleSave = () => {
    onSave({
      degree_level: degreeLevel as PostPaymentAcademicValues['degree_level'],
      university_name: universityName.trim(),
      course_name: courseName.trim(),
      thesis_type: thesisType as PostPaymentAcademicValues['thesis_type'],
    });
  };

  return (
    <div className="py-[32px]">
      <div className="mx-auto max-w-[520px]">
        <header className="mb-6">
          <h1
            style={{
              fontFamily: 'var(--font-alegreya)',
              fontSize: 'var(--text-h2)',
              fontWeight: 'var(--font-weight-bold)',
            }}
          >
            Prima del report
          </h1>
          <p
            className="mt-2 text-[var(--muted-foreground)]"
            style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-base)', lineHeight: 1.6 }}
          >
            Controlla o aggiorna alcune informazioni sul tuo percorso universitario. Le ritroverai
            nel Profilo. Puoi anche saltare e vedere subito il report.
          </p>
        </header>

        <form
          noValidate
          onSubmit={(event) => {
            event.preventDefault();
            handleSave();
          }}
          className="flex flex-col gap-6"
        >
          <FormSection title="Contesto accademico">
            <div className="grid grid-cols-1 gap-4">
              {showSelector && (
                <div>
                  <label
                    htmlFor="enrichment-record"
                    className="block text-[var(--foreground)]"
                    style={fieldLabelStyle()}
                  >
                    Percorso accademico
                  </label>
                  <select
                    id="enrichment-record"
                    value={selectedRecordId ?? records[0].id}
                    onChange={(event) => onRecordChange?.(event.target.value)}
                    className="control-focus-ring mt-2 w-full border border-[var(--border)] bg-[var(--background)] px-3 py-2 outline-none focus:border-[var(--foreground)]"
                    style={controlStyle()}
                  >
                    {records.map((record) => (
                      <option key={record.id} value={record.id}>
                        {record.label}
                        {record.isCurrent ? ' · Corrente' : ''}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <SelectField
                id="enrichment-degree-level"
                label="Livello di laurea"
                value={degreeLevel}
                onChange={setDegreeLevel}
                options={DEGREE_LEVEL_OPTIONS}
              />
              <TextField
                id="enrichment-university"
                label="Università"
                value={universityName}
                onChange={setUniversityName}
                autoComplete="organization"
              />
              <TextField
                id="enrichment-course"
                label="Corso di laurea"
                value={courseName}
                onChange={setCourseName}
              />
              <SelectField
                id="enrichment-typology"
                label="Tipologia"
                value={thesisType}
                onChange={setThesisType}
                options={TYPOLOGY_OPTIONS}
              />
            </div>
          </FormSection>

          <div className="flex flex-wrap items-center gap-3">
            <SottocheckActionButton type="submit">Aggiorna profilo</SottocheckActionButton>
            <SottocheckActionButton type="button" variant="secondary" onClick={onSkip}>
              Salta
            </SottocheckActionButton>
          </div>
        </form>
      </div>
    </div>
  );
}
