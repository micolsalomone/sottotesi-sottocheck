import React from 'react';
import { Badge } from './ui/badge';

export type StatusType = 
  | 'active' 
  | 'completed' 
  | 'in-progress' 
  | 'assigned'
  | 'pending' 
  | 'invited'
  | 'blocked' 
  | 'error'
  | 'payment-error'
  | 'verification-error'
  | 'archived' 
  | 'inactive'
  | 'overdue'
  | 'warning';

interface StatusBadgeProps {
  status: StatusType;
  label?: string;
  className?: string;
}

const statusConfig: Record<StatusType, { label: string; variant: string; className: string }> = {
  'active': {
    label: 'Attivo',
    variant: 'default',
    className: 'bg-[var(--primary)] text-[var(--primary-foreground)]'
  },
  'completed': {
    label: 'Completato',
    variant: 'secondary',
    className: 'bg-[var(--muted)] text-[var(--muted-foreground)]'
  },
  'in-progress': {
    label: 'In corso',
    variant: 'default',
    className: 'bg-[var(--chart-2)] text-white'
  },
  'assigned': {
    label: 'Assegnato',
    variant: 'default',
    className: 'bg-[var(--chart-2)] text-white'
  },
  'pending': {
    label: 'In attesa',
    variant: 'default',
    className: 'bg-[var(--chart-3)] text-white'
  },
  'invited': {
    label: 'Invitato',
    variant: 'default',
    className: 'bg-[var(--chart-3)] text-white'
  },
  'blocked': {
    label: 'Bloccato',
    variant: 'destructive',
    className: 'bg-[var(--destructive-foreground)] text-white'
  },
  'error': {
    label: 'Errore',
    variant: 'destructive',
    className: 'bg-[var(--destructive-foreground)] text-white'
  },
  'payment-error': {
    label: 'Errore pagamento',
    variant: 'destructive',
    className: 'bg-[var(--destructive-foreground)] text-white'
  },
  'verification-error': {
    label: 'Errore verifica',
    variant: 'destructive',
    className: 'bg-[var(--destructive-foreground)] text-white'
  },
  'archived': {
    label: 'Archiviato',
    variant: 'secondary',
    className: 'bg-[var(--muted)] text-[var(--muted-foreground)]'
  },
  'inactive': {
    label: 'Inattivo',
    variant: 'secondary',
    className: 'bg-[var(--muted)] text-[var(--muted-foreground)]'
  },
  'overdue': {
    label: 'In ritardo',
    variant: 'default',
    className: 'bg-[var(--chart-3)] text-white'
  },
  'warning': {
    label: 'Attenzione',
    variant: 'default',
    className: 'bg-[var(--chart-3)] text-white'
  }
};

export function StatusBadge({ status, label, className = '' }: StatusBadgeProps) {
  const config = statusConfig[status] || statusConfig['inactive'];
  const displayLabel = label || config.label;

  return (
    <Badge className={`${config.className} ${className}`}>
      {displayLabel}
    </Badge>
  );
}