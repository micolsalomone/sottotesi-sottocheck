import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { ArrowRight } from 'lucide-react';

// Neutral, presentation-only leaves shared by the standalone and Student Account
// pages (`/public-view/account`, `/student-view/account`). They hold no state
// beyond their controlled props: role data resolution, auth semantics and
// legal-state ownership stay inside the role-specific pages. Not a universal
// account model.

export function AccountInfoRow({
  label,
  value,
  hint,
  action,
}: {
  label: string;
  value: string;
  /** Optional secondary line under the value. */
  hint?: string;
  /** Optional right-aligned control (link / button). */
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2 py-3 first:pt-0 last:pb-0">
      <div className="min-w-0">
        <span
          className="block uppercase tracking-[0.08em] text-[var(--muted-foreground)]"
          style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-xs)', fontWeight: 'var(--font-weight-medium)' }}
        >
          {label}
        </span>
        <span
          className="mt-1 block text-[var(--foreground)]"
          style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)', lineHeight: 1.5 }}
        >
          {value}
        </span>
        {hint && (
          <span
            className="mt-1 block text-[var(--muted-foreground)]"
            style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-sm)', lineHeight: 1.5 }}
          >
            {hint}
          </span>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

/** Secondary text link between the Profile and Account surfaces. */
export function CrossSurfaceLink({ to, label }: { to: string; label: string }) {
  return (
    <Link
      to={to}
      className="control-focus-ring inline-flex items-center gap-2 text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:underline"
      style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)', fontWeight: 'var(--font-weight-medium)' }}
    >
      {label}
      <ArrowRight className="h-4 w-4" aria-hidden="true" />
    </Link>
  );
}
