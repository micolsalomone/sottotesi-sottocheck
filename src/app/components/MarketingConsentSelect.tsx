import type { CSSProperties } from 'react';

/**
 * Compact explicit tri-state control for commercial-communications consent —
 * Admin editing surfaces only. Presentation-only: the caller owns state and
 * persistence, and the storage-model difference between Pipeline (per-contact
 * map) and Student (one global value) stays in the caller.
 *
 *   `null`  → `Non richiesto`  (unknown / never collected)
 *   `true`  → `Consentito`
 *   `false` → `Non consentito` (explicitly declined / revoked)
 *
 * A caller that maps `null` onto a Pipeline `marketing_consents` map MUST remove
 * the contact key (never store a key to represent "unknown"). Selecting
 * `Non consentito` stores an explicit `false` — it is not a key removal.
 */
export function MarketingConsentSelect({
  value,
  onChange,
  id,
  ariaLabel = 'Consenso comunicazioni commerciali',
  className = 'drawer-control-focus',
  style,
}: {
  value: boolean | null;
  onChange: (value: boolean | null) => void;
  id?: string;
  ariaLabel?: string;
  className?: string;
  style?: CSSProperties;
}) {
  const current = value === true ? 'granted' : value === false ? 'declined' : 'unknown';

  return (
    <select
      id={id}
      aria-label={ariaLabel}
      value={current}
      onChange={(event) => {
        const next = event.target.value;
        onChange(next === 'granted' ? true : next === 'declined' ? false : null);
      }}
      className={className}
      style={{
        fontFamily: 'var(--font-inter)',
        fontSize: '11px',
        color: 'var(--foreground)',
        background: 'var(--input-background)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius)',
        padding: '0.25rem 0.5rem',
        lineHeight: '1.5',
        cursor: 'pointer',
        ...style,
      }}
    >
      <option value="unknown">Non richiesto</option>
      <option value="granted">Consentito</option>
      <option value="declined">Non consentito</option>
    </select>
  );
}
