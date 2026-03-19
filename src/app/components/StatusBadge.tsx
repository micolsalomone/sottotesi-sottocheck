import React from 'react';
import { getAdminBadgeStyle, type AdminBadgeTone } from '@/app/utils/adminBadgeStyles';

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

const statusConfig: Record<StatusType, { label: string; tone: AdminBadgeTone }> = {
  active: {
    label: 'Attivo',
    tone: 'success',
  },
  completed: {
    label: 'Completato',
    tone: 'info',
  },
  'in-progress': {
    label: 'In corso',
    tone: 'info',
  },
  assigned: {
    label: 'Assegnato',
    tone: 'info',
  },
  pending: {
    label: 'In attesa',
    tone: 'warning',
  },
  invited: {
    label: 'Invitato',
    tone: 'warning',
  },
  blocked: {
    label: 'Bloccato',
    tone: 'danger',
  },
  error: {
    label: 'Errore',
    tone: 'danger',
  },
  'payment-error': {
    label: 'Errore pagamento',
    tone: 'danger',
  },
  'verification-error': {
    label: 'Errore verifica',
    tone: 'danger',
  },
  archived: {
    label: 'Archiviato',
    tone: 'neutral',
  },
  inactive: {
    label: 'Inattivo',
    tone: 'neutral',
  },
  overdue: {
    label: 'In ritardo',
    tone: 'warning',
  },
  warning: {
    label: 'Attenzione',
    tone: 'warning',
  },
};

export function StatusBadge({ status, label, className = '' }: StatusBadgeProps) {
  const config = statusConfig[status] || statusConfig.inactive;
  const displayLabel = label || config.label;

  return (
    <span className={className} style={getAdminBadgeStyle(config.tone)}>
      {displayLabel}
    </span>
  );
}