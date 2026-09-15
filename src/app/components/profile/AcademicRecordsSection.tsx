import { useState } from 'react';
import { Plus } from 'lucide-react';
import { FormSection, SelectField, TextField } from './ProfileFormPrimitives';
import type { EditableAcademic } from '@/app/data/studentAcademicRecords';
import type { DegreeLevel, ThesisType } from '@/app/data/LavorazioniContext';

/**
 * Shared "Percorso attuale" / "Percorsi precedenti" editor for a Student's
 * `academic_records[]` — used by `student/ProfilePage` and the standalone
 * Profile when the resolved identity is an existing Student. PRESENTATIONAL:
 * it owns only the local "confirm delete" UI state; every domain write
 * (`updateStudent`) is the caller's job via the `on*` callbacks. Option lists
 * are passed in rather than embedded, so each host keeps its own local
 * `DEGREE_LEVEL_OPTIONS` / `TYPOLOGY_OPTIONS` (not extracted — see the
 * standalone-enrichment handoff's option-constants note).
 */

interface AcademicOption<T extends string> {
  value: T;
  label: string;
}

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

interface AcademicRecordFieldsProps {
  record: EditableAcademic;
  onChange: (id: string, patch: Partial<EditableAcademic>) => void;
  degreeLevelOptions: AcademicOption<DegreeLevel>[];
  typologyOptions: AcademicOption<ThesisType>[];
}

/** The seven academic content fields for ONE record — shared between current and previous. */
export function AcademicRecordFields({ record, onChange, degreeLevelOptions, typologyOptions }: AcademicRecordFieldsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <SelectField
        id={`academic-${record.id}-degree-level`}
        label="Livello di laurea"
        value={record.degree_level}
        onChange={(v) => onChange(record.id, { degree_level: v as DegreeLevel | '' })}
        options={degreeLevelOptions}
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
        options={typologyOptions}
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

interface AcademicRecordsSectionsProps {
  current: EditableAcademic[];
  previous: EditableAcademic[];
  onChange: (id: string, patch: Partial<EditableAcademic>) => void;
  onAddPrevious: () => void;
  /** Unsaved draft: drop from local form state only, never a domain write. */
  onRemoveDraft: (id: string) => void;
  /** Persisted, non-current, service-unbound record: the caller's domain write. */
  onDeletePersisted: (id: string) => void;
  isRecordServiceBound: (id: string) => boolean;
  degreeLevelOptions: AcademicOption<DegreeLevel>[];
  typologyOptions: AcademicOption<ThesisType>[];
}

/**
 * "Percorso attuale" (read/edit the `is_current` record(s), never a selector,
 * never a way to change which record is current) + "Percorsi precedenti"
 * (edit / add / remove-draft / delete-if-unbound). `is_current` and
 * `StudentService` bindings are never touched by this component.
 */
export function AcademicRecordsSections({
  current,
  previous,
  onChange,
  onAddPrevious,
  onRemoveDraft,
  onDeletePersisted,
  isRecordServiceBound,
  degreeLevelOptions,
  typologyOptions,
}: AcademicRecordsSectionsProps) {
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(null);

  return (
    <>
      <FormSection title="Percorso attuale">
        {current.length > 0 ? (
          current.map((record) => (
            <AcademicRecordFields
              key={record.id}
              record={record}
              onChange={onChange}
              degreeLevelOptions={degreeLevelOptions}
              typologyOptions={typologyOptions}
            />
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
          {previous.length === 0 && (
            <p
              className="text-[var(--muted-foreground)]"
              style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)', lineHeight: 1.6 }}
            >
              Nessun percorso precedente registrato.
            </p>
          )}
          {previous.map((record, index) => {
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
                    <button type="button" onClick={() => onRemoveDraft(record.id)} style={textActionStyle}>
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
                        onClick={() => {
                          onDeletePersisted(record.id);
                          setConfirmingDeleteId(null);
                        }}
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
                <AcademicRecordFields
                  record={record}
                  onChange={onChange}
                  degreeLevelOptions={degreeLevelOptions}
                  typologyOptions={typologyOptions}
                />
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
              onClick={onAddPrevious}
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
    </>
  );
}
