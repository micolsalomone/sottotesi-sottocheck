import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import type { DegreeLevel, ThesisType } from '@/app/data/LavorazioniContext';
import { SottocheckActionButton } from '@/app/components/SottocheckActionButton';
import { SelectField, TextField } from '@/app/components/profile/ProfileFormPrimitives';
import {
  applyCurrentAcademicUpdate,
  dismissProfileCompletionPrompt,
  getCurrentAcademicValues,
  type PostPaymentAcademicValues,
} from '@/app/data/standaloneProfile';

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

interface StandaloneProfileCompletionModalProps {
  isOpen: boolean;
  email: string;
  onClose: () => void;
}

/**
 * One-time post-registration onboarding prompt, shown over an already-
 * rendered Dashboard or Report (never gates either). Edits ONLY the four
 * essential fields of the standalone Profile's CURRENT academic record —
 * see `standaloneProfile.ts`'s `applyCurrentAcademicUpdate` for the
 * non-destructive patch semantics and `getCurrentAcademicValues` for prefill.
 * Every exit (Save, Skip, X) dismisses the one-time prompt via
 * `dismissProfileCompletionPrompt`; only Save also writes academic data.
 */
export function StandaloneProfileCompletionModal({ isOpen, email, onClose }: StandaloneProfileCompletionModalProps) {
  const [values, setValues] = useState<PostPaymentAcademicValues>({});

  useEffect(() => {
    if (!isOpen) return;
    setValues(getCurrentAcademicValues(email) ?? {});
  }, [isOpen, email]);

  if (!isOpen) return null;

  const dismiss = () => {
    dismissProfileCompletionPrompt(email);
    onClose();
  };

  const handleSave = () => {
    applyCurrentAcademicUpdate(email, values);
    dismiss();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'color-mix(in srgb, var(--foreground) 40%, transparent)' }}
      onClick={dismiss}
    >
      <div
        className="w-full max-h-[85vh] overflow-hidden flex flex-col"
        style={{
          maxWidth: '540px',
          borderRadius: 'var(--radius)',
          backgroundColor: 'var(--card)',
          boxShadow: 'var(--elevation-lg)',
        }}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="border-b p-6" style={{ borderColor: 'var(--border)' }}>
          <div className="flex items-start justify-between gap-4">
            <h2
              style={{
                fontFamily: 'var(--font-alegreya)',
                fontSize: 'var(--text-h2)',
                fontWeight: 'var(--font-weight-bold)',
                color: 'var(--foreground)',
              }}
            >
              Completa il tuo profilo
            </h2>
            <button
              onClick={dismiss}
              className="flex-shrink-0 p-2 hover:opacity-70 transition-opacity"
              style={{ borderRadius: 'var(--radius)' }}
              aria-label="Chiudi"
            >
              <X className="size-5" style={{ color: 'var(--foreground)' }} />
            </button>
          </div>
          <p
            className="mt-2"
            style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)', color: 'var(--muted-foreground)' }}
          >
            Aggiungi alcune informazioni sul tuo percorso universitario. Potrai modificarle in qualsiasi momento dal
            Profilo.
          </p>
        </div>

        <div className="overflow-y-auto p-6 space-y-4">
          <SelectField
            id="modal-degree-level"
            label="Livello di laurea"
            value={values.degree_level ?? ''}
            onChange={(value) => setValues((prev) => ({ ...prev, degree_level: value as DegreeLevel | '' }))}
            options={DEGREE_LEVEL_OPTIONS}
          />
          <TextField
            id="modal-university"
            label="Università"
            value={values.university_name ?? ''}
            onChange={(value) => setValues((prev) => ({ ...prev, university_name: value }))}
          />
          <TextField
            id="modal-course"
            label="Corso di laurea"
            value={values.course_name ?? ''}
            onChange={(value) => setValues((prev) => ({ ...prev, course_name: value }))}
          />
          <SelectField
            id="modal-typology"
            label="Tipologia"
            value={values.thesis_type ?? ''}
            onChange={(value) => setValues((prev) => ({ ...prev, thesis_type: value as ThesisType | '' }))}
            options={TYPOLOGY_OPTIONS}
          />
        </div>

        <div
          className="border-t p-6 flex items-center justify-end gap-3"
          style={{ borderColor: 'var(--border)', backgroundColor: 'var(--muted)' }}
        >
          <SottocheckActionButton variant="secondary" onClick={dismiss}>
            Salta
          </SottocheckActionButton>
          <SottocheckActionButton variant="primary" onClick={handleSave}>
            Aggiorna profilo
          </SottocheckActionButton>
        </div>
      </div>
    </div>
  );
}
