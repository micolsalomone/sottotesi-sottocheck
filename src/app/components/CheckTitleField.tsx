interface CheckTitleFieldProps {
  /** Current title value (controlled). */
  value: string;
  /** Called on every keystroke with the raw input value. */
  onChange: (next: string) => void;
  /** Optional blur handler — callers use it to restore the filename default when blank. */
  onBlur?: () => void;
  /** Unique id so the label binds; defaults to a stable local id. */
  id?: string;
  className?: string;
}

/**
 * "Titolo del controllo" field for the TesiCheck preparation step, shown next to
 * the uploaded document once it is valid. Prefilled by the caller with the
 * filename-derived default and freely editable. Presentation only — the caller
 * owns the state, the default seed, the blank-on-blur reset and persistence.
 * Never rendered inside payment UI.
 */
export function CheckTitleField({
  value,
  onChange,
  onBlur,
  id = 'tesicheck-title',
  className = '',
}: CheckTitleFieldProps) {
  return (
    <div className={className}>
      <label
        htmlFor={id}
        className="block text-[var(--foreground)]"
        style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)', fontWeight: 'var(--font-weight-medium)' }}
      >
        Titolo del controllo
      </label>
      <input
        id={id}
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onBlur={onBlur}
        className="mt-2 w-full h-[44px] px-[12px] border border-[var(--border)] bg-[var(--background)]"
        style={{
          borderRadius: 'var(--radius)',
          fontFamily: 'var(--font-inter)',
          fontSize: 'var(--text-label)',
          color: 'var(--foreground)',
        }}
      />
      <p
        className="mt-1 text-[var(--muted-foreground)]"
        style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-sm)' }}
      >
        Usa un titolo che ti aiuti a riconoscere questa versione, ad esempio &ldquo;Capitolo 3 &ndash; Metodologia&rdquo;.
      </p>
    </div>
  );
}
