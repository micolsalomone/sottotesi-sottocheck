import { RadioGroup, RadioGroupItem } from '@/app/components/ui/radio-group';
import { fieldLabelStyle } from './ProfileFormPrimitives';

// Neutral, presentation-only tri-state choice for the commercial-communications
// preference. Shared by the standalone Public profile and the Student profile.
//
// It holds no state and knows nothing about Pipeline / Student / account session
// / CRM resolution — the role pages own state and persistence. `value` is
// tri-state: `true` (granted), `false` (declined), `null` (never expressed →
// neither option selected). `onChange` always yields an explicit boolean.
//
// Prototype copy only — final consent wording comes from client / legal.

const HELPER_STYLE = {
  fontFamily: 'var(--font-inter)',
  fontSize: 'var(--text-sm)',
  lineHeight: 1.5,
} as const;

const OPTION_STYLE = {
  fontFamily: 'var(--font-inter)',
  fontSize: 'var(--text-label)',
  lineHeight: 1.5,
} as const;

export function CommercialConsentField({
  value,
  onChange,
  disabled = false,
  idPrefix = 'commercial-consent',
}: {
  value: boolean | null;
  onChange: (value: boolean) => void;
  disabled?: boolean;
  idPrefix?: string;
}) {
  const selected = value === true ? 'yes' : value === false ? 'no' : '';

  return (
    <div>
      <span className="block text-[var(--foreground)]" style={fieldLabelStyle()}>
        Comunicazioni commerciali
      </span>

      <RadioGroup
        className="mt-3 gap-2"
        value={selected}
        onValueChange={(next) => onChange(next === 'yes')}
        disabled={disabled}
        aria-label="Comunicazioni commerciali"
      >
        <label
          htmlFor={`${idPrefix}-yes`}
          className="flex cursor-pointer items-start gap-3 text-[var(--foreground)]"
          style={OPTION_STYLE}
        >
          <RadioGroupItem id={`${idPrefix}-yes`} value="yes" className="mt-[2px]" />
          <span>Sì, desidero ricevere comunicazioni commerciali</span>
        </label>
        <label
          htmlFor={`${idPrefix}-no`}
          className="flex cursor-pointer items-start gap-3 text-[var(--foreground)]"
          style={OPTION_STYLE}
        >
          <RadioGroupItem id={`${idPrefix}-no`} value="no" className="mt-[2px]" />
          <span>No, non desidero ricevere comunicazioni commerciali</span>
        </label>
      </RadioGroup>

      {value === null && (
        <p className="mt-2 text-[var(--muted-foreground)]" style={HELPER_STYLE}>
          Preferenza non ancora espressa.
        </p>
      )}
      <p className="mt-2 text-[var(--muted-foreground)]" style={HELPER_STYLE}>
        Puoi modificare questa scelta in qualsiasi momento.
      </p>
    </div>
  );
}
