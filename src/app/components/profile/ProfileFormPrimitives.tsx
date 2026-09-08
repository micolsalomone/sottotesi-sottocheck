import type { ReactNode } from 'react';

// Neutral, presentation-only profile form primitives.
// Shared by the standalone Public profile and the Student profile. They hold no
// state beyond their controlled props and no domain / CRM coupling.

export function fieldLabelStyle() {
  return {
    fontFamily: 'var(--font-inter)',
    fontSize: 'var(--text-label)',
    fontWeight: 'var(--font-weight-medium)',
  } as const;
}

export function controlStyle() {
  return {
    borderRadius: 'var(--radius)',
    fontFamily: 'var(--font-inter)',
    fontSize: 'var(--text-label)',
    color: 'var(--foreground)',
  } as const;
}

export function FormSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section
      className="border border-[var(--border)] bg-[var(--card)] p-6"
      style={{ borderRadius: 'var(--radius)', boxShadow: 'var(--elevation-sm)' }}
    >
      <h2
        className="mb-4 uppercase tracking-[0.08em] text-[var(--muted-foreground)]"
        style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-xs)', fontWeight: 'var(--font-weight-medium)' }}
      >
        {title}
      </h2>
      {children}
    </section>
  );
}

export function TextField({
  id,
  label,
  value,
  onChange,
  type = 'text',
  autoComplete,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: 'text' | 'tel';
  autoComplete?: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-[var(--foreground)]" style={fieldLabelStyle()}>
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        autoComplete={autoComplete}
        onChange={(event) => onChange(event.target.value)}
        className="control-focus-ring mt-2 w-full border border-[var(--border)] bg-[var(--background)] px-3 py-2 outline-none focus:border-[var(--foreground)]"
        style={controlStyle()}
      />
    </div>
  );
}

export function SelectField({
  id,
  label,
  value,
  onChange,
  options,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-[var(--foreground)]" style={fieldLabelStyle()}>
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="control-focus-ring mt-2 w-full border border-[var(--border)] bg-[var(--background)] px-3 py-2 outline-none focus:border-[var(--foreground)]"
        style={controlStyle()}
      >
        <option value="">Seleziona…</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="block text-[var(--foreground)]" style={fieldLabelStyle()}>
        {label}
      </span>
      <p
        className="mt-2 w-full border border-[var(--border)] bg-[var(--muted)] px-3 py-2 text-[var(--muted-foreground)]"
        style={controlStyle()}
      >
        {value}
      </p>
    </div>
  );
}
