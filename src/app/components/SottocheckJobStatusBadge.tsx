import { StatusBadge, type StatusType } from './StatusBadge';

export type SottocheckJobStatus =
  | 'completed'
  | 'running'
  | 'failed'
  | 'pending';

interface SottocheckJobStatusBadgeProps {
  status: SottocheckJobStatus;
}

const STATUS_CONFIG: Record<SottocheckJobStatus, { label: string; status: StatusType }> = {
  completed: { label: 'Completato', status: 'completed' },
  running: { label: 'In corso', status: 'in-progress' },
  failed: { label: 'Fallito', status: 'error' },
  pending: { label: 'In attesa', status: 'pending' },
};

export function SottocheckJobStatusBadge({ status }: SottocheckJobStatusBadgeProps) {
  const config = STATUS_CONFIG[status];

  return <StatusBadge status={config.status} label={config.label} />;
}
