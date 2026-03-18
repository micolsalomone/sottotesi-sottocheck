import React from 'react';
import { Clock, User } from 'lucide-react';
import { StatusBadge, StatusType } from './StatusBadge';

export interface AuditEntry {
  id: string;
  action: string;
  description: string;
  admin: string;
  timestamp: string;
  status?: StatusType;
  metadata?: Record<string, any>;
}

interface AuditLogProps {
  entries: AuditEntry[];
  emptyMessage?: string;
}

export function AuditLog({ entries, emptyMessage = 'Nessuna attività registrata' }: AuditLogProps) {
  if (entries.length === 0) {
    return (
      <div className="text-center py-8 text-[var(--muted-foreground)]">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {entries.map((entry, index) => (
        <div
          key={entry.id}
          className="relative pl-8 pb-4 border-l-2 border-[var(--border)] last:border-0 last:pb-0"
        >
          {/* Timeline dot */}
          <div className="absolute left-0 top-0 -ml-[9px] w-4 h-4 rounded-full bg-[var(--primary)] border-2 border-[var(--background)]" />
          
          <div className="space-y-2">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1 flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-medium text-[var(--foreground)]">
                    {entry.action}
                  </h4>
                  {entry.status && <StatusBadge status={entry.status} />}
                </div>
                <p className="text-sm text-[var(--muted-foreground)]">
                  {entry.description}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 text-xs text-[var(--muted-foreground)]">
              <div className="flex items-center gap-1">
                <User className="h-3 w-3" />
                <span>{entry.admin}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>{entry.timestamp}</span>
              </div>
            </div>

            {entry.metadata && Object.keys(entry.metadata).length > 0 && (
              <div className="mt-2 p-2 bg-[var(--muted)] rounded text-xs space-y-1">
                {Object.entries(entry.metadata).map(([key, value]) => (
                  <div key={key} className="flex gap-2">
                    <span className="font-medium text-[var(--foreground)]">{key}:</span>
                    <span className="text-[var(--muted-foreground)]">{String(value)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}