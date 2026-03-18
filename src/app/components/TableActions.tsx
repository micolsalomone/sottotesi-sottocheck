import React from 'react';
import { MoreVertical } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';

export interface TableAction {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  variant?: 'default' | 'destructive';
  divider?: boolean; // Aggiunge separatore dopo questa azione
  hidden?: boolean; // Nasconde l'azione se true
}

interface TableActionsProps {
  actions: TableAction[];
  label?: string;
}

export function TableActions({ actions, label = 'Azioni' }: TableActionsProps) {
  const visibleActions = actions.filter(action => !action.hidden);

  if (visibleActions.length === 0) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="inline-flex items-center justify-center h-8 w-8 p-0 rounded-md hover:bg-[var(--muted)] outline-none"
        aria-label={label}
      >
        <MoreVertical className="h-4 w-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {visibleActions.map((action, index) => {
          const showDivider = action.divider && index < visibleActions.length - 1;
          return (
            <div key={index}>
              <DropdownMenuItem
                onClick={action.onClick}
                className={
                  action.variant === 'destructive'
                    ? 'text-[var(--destructive-foreground)] focus:text-[var(--destructive-foreground)] focus:bg-[var(--destructive)]'
                    : ''
                }
              >
                {action.icon && <span className="mr-2">{action.icon}</span>}
                {action.label}
              </DropdownMenuItem>
              {showDivider && <DropdownMenuSeparator />}
            </div>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}