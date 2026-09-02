import { AlertCircle, CheckCircle, Clock } from 'lucide-react';

export type SottocheckHistoryStatus =
  | 'completed'
  | 'processing'
  | 'error';

interface SottocheckHistoryStatusBadgeProps {
  status: SottocheckHistoryStatus;
}

export function SottocheckHistoryStatusBadge({ status }: SottocheckHistoryStatusBadgeProps) {
  if (status === 'completed') {
    return (
      <span
        className="inline-flex items-center gap-1 px-[10px] py-[4px]"
        style={{
          borderRadius: 'var(--radius-badge)',
          background: 'rgba(11,182,63,0.10)',
          color: 'var(--primary)',
          fontFamily: 'var(--font-inter)',
          fontSize: '11px',
          fontWeight: 'var(--font-weight-medium)',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
        }}
      >
        <CheckCircle className="w-3 h-3" />
        Completato
      </span>
    );
  }

  if (status === 'processing') {
    return (
      <span
        className="inline-flex items-center gap-1 px-[10px] py-[4px]"
        style={{
          borderRadius: 'var(--radius-badge)',
          background: 'rgba(46,144,250,0.10)',
          color: 'var(--chart-2)',
          fontFamily: 'var(--font-inter)',
          fontSize: '11px',
          fontWeight: 'var(--font-weight-medium)',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
        }}
      >
        <Clock className="w-3 h-3" />
        In elaborazione
      </span>
    );
  }

  return (
    <span
      className="inline-flex items-center gap-1 px-[10px] py-[4px]"
      style={{
        borderRadius: 'var(--radius-badge)',
        background: 'rgba(220,38,38,0.10)',
        color: 'var(--destructive)',
        fontFamily: 'var(--font-inter)',
        fontSize: '11px',
        fontWeight: 'var(--font-weight-medium)',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
      }}
    >
      <AlertCircle className="w-3 h-3" />
      Errore
    </span>
  );
}
