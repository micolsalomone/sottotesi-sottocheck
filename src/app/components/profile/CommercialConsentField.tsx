import * as RadioGroupPrimitive from '@radix-ui/react-radio-group';
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

/**
 * `[ Sì ] [ No ]` — a stronger, more legible presentation of the SAME
 * `role="radiogroup"` semantics as the default dot-radio variant (Radix
 * `RadioGroup` underneath either way: arrow-key navigation, `aria-checked`,
 * single tab stop). Selected = near-black background / white text (the
 * repo's `action-primary` treatment, same as `.btn-primary`) — never the
 * brand green the default variant's dot indicator uses, which is too weak
 * to read as a real selection at a glance. Not a checkbox: exactly one of
 * the two segments is selected once a choice is made, never both/neither
 * after a choice.
 */
function SegmentedOption({
  id,
  value,
  label,
  selected,
  disabled,
}: {
  id: string;
  value: 'yes' | 'no';
  label: string;
  selected: boolean;
  disabled?: boolean;
}) {
  return (
    <RadioGroupPrimitive.Item
      id={id}
      value={value}
      className="control-focus-ring"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: '72px',
        padding: '0.5rem 1.25rem',
        borderRadius: 'var(--radius)',
        border: `1px solid ${selected ? 'var(--foreground)' : 'var(--border)'}`,
        background: selected ? 'var(--foreground)' : 'var(--background)',
        color: selected ? 'var(--background)' : 'var(--foreground)',
        fontFamily: 'var(--font-inter)',
        fontSize: 'var(--text-label)',
        fontWeight: 'var(--font-weight-medium)',
        lineHeight: 1.5,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        transition: 'background-color 0.15s ease, color 0.15s ease, border-color 0.15s ease',
      }}
    >
      {label}
    </RadioGroupPrimitive.Item>
  );
}

export function CommercialConsentField({
  value,
  onChange,
  disabled = false,
  idPrefix = 'commercial-consent',
  // All below default to the ORIGINAL copy/behaviour so existing callers
  // (registration) render byte-identical output without passing anything.
  // Account surfaces override them for a more compact, contact-scoped layout
  // (heading + value shown externally, status conveyed by the question itself).
  showLabel = true,
  yesLabel = 'Sì, desidero ricevere comunicazioni commerciali',
  noLabel = 'No, non desidero ricevere comunicazioni commerciali',
  showUnknownHint = true,
  helperText = 'Puoi modificare questa scelta in qualsiasi momento.',
  ariaLabel = 'Comunicazioni commerciali',
  variant = 'radio',
}: {
  value: boolean | null;
  onChange: (value: boolean) => void;
  disabled?: boolean;
  idPrefix?: string;
  /** Hide the internal "Comunicazioni commerciali" label when the caller
   * already shows an equivalent heading/question (e.g. a natural-language
   * question rendered above the control). */
  showLabel?: boolean;
  yesLabel?: string;
  noLabel?: string;
  /** Hide the built-in "Preferenza non ancora espressa." line when the caller
   * renders its own unknown-state copy instead. */
  showUnknownHint?: boolean;
  /** Trailing helper line. Pass '' to show nothing. */
  helperText?: string;
  /** Accessible name for the radio group. Lets the caller keep the VISIBLE
   * `yesLabel`/`noLabel` short (e.g. "Sì" / "No") while screen readers still
   * get the full question. */
  ariaLabel?: string;
  /** `radio` (default, unchanged) = small dot indicator + label text, for
   * callers that pass long-form labels (registration). `segmented` = a
   * compact `[ Sì ] [ No ]` selectable-button pair — use with short labels. */
  variant?: 'radio' | 'segmented';
}) {
  const selected = value === true ? 'yes' : value === false ? 'no' : '';

  return (
    <div>
      {showLabel && (
        <span className="block text-[var(--foreground)]" style={fieldLabelStyle()}>
          Comunicazioni commerciali
        </span>
      )}

      {variant === 'segmented' ? (
        <RadioGroupPrimitive.Root
          className={showLabel ? 'mt-3 flex gap-2' : 'flex gap-2'}
          value={selected}
          onValueChange={(next) => onChange(next === 'yes')}
          disabled={disabled}
          aria-label={ariaLabel}
        >
          <SegmentedOption id={`${idPrefix}-yes`} value="yes" label={yesLabel} selected={value === true} disabled={disabled} />
          <SegmentedOption id={`${idPrefix}-no`} value="no" label={noLabel} selected={value === false} disabled={disabled} />
        </RadioGroupPrimitive.Root>
      ) : (
        <RadioGroup
          className={showLabel ? 'mt-3 gap-2' : 'gap-2'}
          value={selected}
          onValueChange={(next) => onChange(next === 'yes')}
          disabled={disabled}
          aria-label={ariaLabel}
        >
          <label
            htmlFor={`${idPrefix}-yes`}
            className="flex cursor-pointer items-start gap-3 text-[var(--foreground)]"
            style={OPTION_STYLE}
          >
            <RadioGroupItem id={`${idPrefix}-yes`} value="yes" className="mt-[2px]" />
            <span>{yesLabel}</span>
          </label>
          <label
            htmlFor={`${idPrefix}-no`}
            className="flex cursor-pointer items-start gap-3 text-[var(--foreground)]"
            style={OPTION_STYLE}
          >
            <RadioGroupItem id={`${idPrefix}-no`} value="no" className="mt-[2px]" />
            <span>{noLabel}</span>
          </label>
        </RadioGroup>
      )}

      {showUnknownHint && value === null && (
        <p className="mt-2 text-[var(--muted-foreground)]" style={HELPER_STYLE}>
          Preferenza non ancora espressa.
        </p>
      )}
      {helperText && (
        <p className="mt-2 text-[var(--muted-foreground)]" style={HELPER_STYLE}>
          {helperText}
        </p>
      )}
    </div>
  );
}
