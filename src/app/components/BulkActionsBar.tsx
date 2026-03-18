import React from 'react';
import { X } from 'lucide-react';
import { Button } from './ui/button';

export interface BulkAction {
  label: string;
  icon?: React.ReactNode;
  onClick: (selectedIds: string[]) => void;
  variant?: 'default' | 'destructive' | 'secondary';
  disabled?: boolean;
}

interface BulkActionsBarProps {
  selectedCount: number;
  selectedIds: string[];
  actions: BulkAction[];
  onClearSelection: () => void;
}

export function BulkActionsBar({
  selectedCount,
  selectedIds,
  actions,
  onClearSelection
}: BulkActionsBarProps) {
  if (selectedCount === 0) {
    return null;
  }

  return (
    <div className="sticky top-0 z-10 flex items-center justify-between gap-4 p-4 bg-[var(--primary)] text-[var(--primary-foreground)] rounded-lg shadow-lg border border-[var(--border)] mb-4">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearSelection}
          className="h-8 w-8 p-0 text-[var(--primary-foreground)] hover:bg-white/20"
        >
          <X className="h-4 w-4" />
        </Button>
        <span className="font-medium">
          {selectedCount} {selectedCount === 1 ? 'elemento selezionato' : 'elementi selezionati'}
        </span>
      </div>
      <div className="flex items-center gap-2">
        {actions.map((action, index) => (
          <Button
            key={index}
            variant={action.variant || 'secondary'}
            size="sm"
            onClick={() => action.onClick(selectedIds)}
            disabled={action.disabled}
            className={
              action.variant === 'destructive'
                ? 'bg-[var(--destructive-foreground)] text-white hover:opacity-90'
                : 'bg-white text-[var(--foreground)] hover:bg-white/90'
            }
          >
            {action.icon && <span className="mr-2">{action.icon}</span>}
            {action.label}
          </Button>
        ))}
      </div>
    </div>
  );
}