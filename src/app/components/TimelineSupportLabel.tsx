interface TimelineSupportLabelProps {
  label?: string;
  onClick?: () => void;
}

export function TimelineSupportLabel({ label = 'Contatta il supporto', onClick }: TimelineSupportLabelProps) {
  return (
    <div
      className="px-[24px] py-[14px] border-t border-[var(--border)]"
      style={{
        marginTop: '12px',
      }}
    >
      <button
        type="button"
        onClick={onClick}
        className="text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
        style={{
          fontFamily: 'var(--font-inter)',
          fontSize: 'var(--text-label)',
          fontWeight: 'var(--font-weight-medium)',
          lineHeight: '20px',
          letterSpacing: '0.2px',
          background: 'transparent',
          border: 'none',
          padding: 0,
          cursor: 'pointer',
        }}
      >
        {label}
      </button>
    </div>
  );
}