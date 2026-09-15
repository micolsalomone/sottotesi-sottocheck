import { ReactNode } from 'react';
import { Loader2 } from 'lucide-react';

type SottocheckActionButtonVariant = 'primary' | 'secondary';

interface SottocheckActionButtonProps {
  type?: 'button' | 'submit' | 'reset';
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
  icon?: ReactNode;
  children: ReactNode;
  variant?: SottocheckActionButtonVariant;
  fullWidth?: boolean;
  className?: string;
}

export function SottocheckActionButton({
  type = 'button',
  onClick,
  disabled = false,
  loading = false,
  icon,
  children,
  variant = 'primary',
  fullWidth = false,
  className = '',
}: SottocheckActionButtonProps) {
  const isDisabled = disabled || loading;
  const baseClass = fullWidth ? 'w-full' : '';
  const variantClass =
    variant === 'primary'
      ? isDisabled
        ? 'bg-[var(--muted)] text-[var(--muted-foreground)] cursor-not-allowed'
        : 'bg-[var(--foreground)] text-[var(--background)] hover:opacity-90 cursor-pointer'
      : isDisabled
        ? 'border border-[var(--border)] bg-[var(--background)] text-[var(--muted-foreground)] cursor-not-allowed'
        : 'border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] hover:bg-[var(--muted)] cursor-pointer';

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={isDisabled}
      className={`inline-flex items-center justify-center gap-2 px-6 py-3 transition-opacity disabled:opacity-70 focus-visible:outline-none focus-visible:border-[var(--ring)] focus-visible:ring-[3px] focus-visible:ring-[color-mix(in_srgb,var(--ring)_50%,transparent)] ${baseClass} ${variantClass} ${className}`}
      style={{
        borderRadius: 'var(--radius)',
        fontFamily: 'var(--font-inter)',
        fontSize: 'var(--text-base)',
        fontWeight: 'var(--font-weight-medium)',
      }}
    >
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : icon}
      {children}
    </button>
  );
}
