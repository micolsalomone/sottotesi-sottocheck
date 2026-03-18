import React from 'react';
import { ChevronsUpDown, ChevronUp, ChevronDown } from 'lucide-react';

interface TableHeaderProps {
  label: string;
  columnKey: string;
  width: number;
  icon?: React.ReactNode;
  sortColumn?: string | null;
  sortDirection?: 'asc' | 'desc';
  onSort?: (key: string) => void;
  onResize?: (key: string, e: React.MouseEvent) => void;
  align?: 'left' | 'center' | 'right';
  className?: string;
}

export function TableHeader({
  label,
  columnKey,
  width,
  icon,
  sortColumn,
  sortDirection,
  onSort,
  onResize,
  align = 'left',
  className = '',
}: TableHeaderProps) {
  const isActive = sortColumn === columnKey;

  const handleResizeStart = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onResize) {
      onResize(columnKey, e);
    }
  };

  return (
    <th
      style={{
        width: `${width}px`,
        minWidth: `${width}px`,
        maxWidth: `${width}px`,
        position: 'relative',
        padding: '0.75rem 1rem',
        cursor: onSort ? 'pointer' : 'default',
        userSelect: 'none',
        textAlign: align,
        borderBottom: '1px solid var(--border)',
        background: 'var(--muted)',
      }}
      onClick={() => onSort?.(columnKey)}
      className={className}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          justifyContent: align === 'center' ? 'center' : align === 'right' ? 'flex-end' : 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', overflow: 'hidden' }}>
          {icon && <div style={{ flexShrink: 0 }}>{icon}</div>}
          <span
            style={{
              fontFamily: 'var(--font-inter)',
              fontSize: 'var(--text-label)',
              fontWeight: 'var(--font-weight-medium)',
              color: isActive ? 'var(--foreground)' : 'var(--muted-foreground)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              lineHeight: '1.5',
            }}
          >
            {label}
          </span>
        </div>

        {onSort && (
          <div style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
            {!isActive ? (
              <ChevronsUpDown size={14} style={{ color: 'var(--muted-foreground)', opacity: 0.4 }} />
            ) : sortDirection === 'asc' ? (
              <ChevronUp size={14} style={{ color: 'var(--primary)' }} />
            ) : (
              <ChevronDown size={14} style={{ color: 'var(--primary)' }} />
            )}
          </div>
        )}
      </div>

      {onResize && (
        <div
          onMouseDown={handleResizeStart}
          onClick={(e) => e.stopPropagation()}
          style={{
            position: 'absolute',
            right: 0,
            top: 0,
            bottom: 0,
            width: '6px',
            cursor: 'col-resize',
            zIndex: 10,
            borderRight: '1px solid var(--border)',
            transition: 'border-color 0.15s ease',
          }}
          className="resize-handle"
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLDivElement).style.borderRightColor = 'var(--primary)';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLDivElement).style.borderRightColor = 'var(--border)';
          }}
        />
      )}
      
      {!onResize && (
        <div
          style={{
            position: 'absolute',
            right: 0,
            top: 0,
            bottom: 0,
            width: '1px',
            background: 'var(--border)',
          }}
        />
      )}
    </th>
  );
}
