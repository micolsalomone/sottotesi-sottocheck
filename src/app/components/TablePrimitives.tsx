import * as React from 'react';
import { CSSProperties, MouseEvent, ReactNode, Ref } from 'react';
import { ChevronsUpDown, ChevronUp, ChevronDown, ChevronRight, Pencil, StickyNote } from 'lucide-react';
import { getAdminBadgeStyle } from '@/app/utils/adminBadgeStyles';
import { Checkbox } from './ui/checkbox';

/**
 * TABLE PRIMITIVES
 * A shared library of table components and hooks for the Sottotesi Admin Dashboard.
 * These follow the design system variables defined in theme.css.
 */

// --- Types ---

export type SortDirection = 'asc' | 'desc' | null;

export interface TableColumnProps {
  id: string;
  label: string;
  width: number;
  icon?: ReactNode;
  sortable?: boolean;
  align?: 'left' | 'center' | 'right';
  sticky?: 'left' | 'right';
  sortDirection?: SortDirection;
  onSort?: (id: string) => void;
  onResize?: (id: string, e: MouseEvent) => void;
  children?: ReactNode;
}

// --- Components ---

/**
 * Root Table Container with horizontal overflow handling
 */
export const TableRoot = ({ children, minWidth = '1200px' }: { children: ReactNode; minWidth?: string }) => (
  <div className="data-table" style={{ display: 'block', width: '100%' }}>
    <div style={{ overflowX: 'auto', width: '100%' }}>
      <table style={{ minWidth, width: '100%', borderCollapse: 'separate', borderSpacing: 0 }}>
        {children}
      </table>
    </div>
  </div>
);

/**
 * Responsive Table Layout
 * Desktop: render tabella classica
 * Mobile: render cards/lista alternativa
 */
export const ResponsiveTableLayout = ({
  desktop,
  mobile,
}: {
  desktop: ReactNode;
  mobile: ReactNode;
}) => (
  <>
    <div className="table-responsive-desktop">{desktop}</div>
    <div className="table-responsive-mobile" style={{ display: 'none' }}>{mobile}</div>

    <style>{`
      @media (max-width: 768px) {
        .table-responsive-desktop {
          display: none !important;
        }

        .table-responsive-mobile {
          display: block !important;
        }
      }
    `}</style>
  </>
);

/**
 * Mobile cards wrapper for responsive table alternative
 */
export const ResponsiveMobileCards = ({ children }: { children: ReactNode }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
    {children}
  </div>
);

/**
 * Single mobile card primitive
 */
export const ResponsiveMobileCard = ({ children, backgroundColor }: { children: ReactNode; backgroundColor?: string }) => (
  <div
    style={{
      backgroundColor: backgroundColor || 'var(--card)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius)',
      padding: '1rem',
    }}
  >
    {children}
  </div>
);

export const ResponsiveMobileCardHeader = ({ children }: { children: ReactNode }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
    {children}
  </div>
);

export const ResponsiveMobileCardSection = ({ children, marginBottom = '1rem' }: { children: ReactNode; marginBottom?: string }) => (
  <div style={{ marginBottom }}>
    {children}
  </div>
);

export const ResponsiveMobileFieldLabel = ({ children }: { children: ReactNode }) => (
  <div style={{
    fontFamily: 'var(--font-inter)',
    fontSize: 'var(--text-label)',
    fontWeight: 'var(--font-weight-medium)',
    color: 'var(--muted-foreground)',
    marginBottom: '0.25rem',
    lineHeight: '1.5',
  }}>
    {children}
  </div>
);

export const ResponsiveMobileCardFooter = ({ children }: { children: ReactNode }) => (
  <div style={{
    fontFamily: 'var(--font-inter)',
    fontSize: 'var(--text-label)',
    color: 'var(--muted-foreground)',
    paddingTop: '0.75rem',
    borderTop: '1px solid var(--border)',
    lineHeight: '1.5',
  }}>
    {children}
  </div>
);

/**
 * Table Header Cell with Resize and Sort
 */
export const TableHeaderCell = ({
  id,
  label,
  width,
  icon,
  sortable,
  align = 'left',
  sticky,
  sortDirection,
  onSort,
  onResize,
  children
}: TableColumnProps) => {
  const isStickyRight = sticky === 'right';
  
  const handleSortClick = () => {
    if (sortable && onSort) {
      onSort(id);
    }
  };

  return (
    <th
      style={{
        width: `${width}px`,
        minWidth: `${width}px`,
        position: sticky ? 'sticky' : 'relative',
        right: isStickyRight ? 0 : undefined,
        left: sticky === 'left' ? 0 : undefined,
        backgroundColor: sticky ? 'var(--background)' : undefined,
        zIndex: sticky ? 20 : 1,
        boxShadow: isStickyRight ? '-2px 0 4px rgba(0, 0, 0, 0.05)' : undefined,
        textAlign: align,
        cursor: sortable ? 'pointer' : 'default',
        userSelect: 'none',
        padding: '0.75rem 1rem',
        borderBottom: '1px solid var(--border)',
      }}
      onClick={handleSortClick}
    >
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '0.5rem', 
        justifyContent: align === 'center' ? 'center' : align === 'right' ? 'flex-end' : 'space-between' 
      }}>
        <span style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.375rem',
          fontFamily: 'var(--font-inter)',
          fontSize: 'var(--text-label)',
          fontWeight: 'var(--font-weight-medium)',
          color: 'var(--foreground)',
          lineHeight: '1.5',
        }}>
          {label || children}
          {icon}
        </span>
        
        {sortable && (
          <div style={{ display: 'flex', alignItems: 'center', color: sortDirection ? 'var(--primary)' : 'var(--muted-foreground)', opacity: sortDirection ? 1 : 0.5 }}>
            {sortDirection === 'asc' ? <ChevronUp size={14} /> : 
             sortDirection === 'desc' ? <ChevronDown size={14} /> : 
             <ChevronsUpDown size={14} />}
          </div>
        )}
      </div>

      {/* Resize Handle */}
      {onResize && !sticky && (
        <div
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
          onMouseDown={(e) => {
            e.stopPropagation();
            onResize(id, e);
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLDivElement).style.borderRight = '2px solid var(--primary)';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLDivElement).style.borderRight = '1px solid var(--border)';
          }}
        />
      )}
    </th>
  );
};

/**
 * Generic Table Header Cell
 * Lightweight primitive used to replace legacy raw <th> markup when custom
 * header content is required.
 */
export const TableHeaderBaseCell = ({
  children,
  onClick,
  style,
  className,
}: {
  children?: ReactNode;
  onClick?: (e: MouseEvent) => void;
  style?: CSSProperties;
  className?: string;
}) => (
  <th
    onClick={onClick}
    className={className}
    style={{
      padding: '0.75rem 1rem',
      borderBottom: '1px solid var(--border)',
      textAlign: 'left',
      verticalAlign: 'middle',
      ...style,
    }}
  >
    {children}
  </th>
);

/**
 * Table Body Cell
 */
export const TableCell = ({ 
  children, 
  align = 'left', 
  sticky,
  width,
  backgroundColor,
  onClick,
  style,
  className,
  colSpan,
}: { 
  children?: ReactNode; 
  align?: 'left' | 'center' | 'right';
  sticky?: 'left' | 'right';
  width?: number;
  backgroundColor?: string;
  onClick?: (e: MouseEvent) => void;
  style?: CSSProperties;
  className?: string;
  colSpan?: number;
}) => {
  const isStickyRight = sticky === 'right';
  
  return (
    <td
      onClick={onClick}
      className={className}
      colSpan={colSpan}
      style={{
        padding: '0.75rem 1rem',
        textAlign: align,
        position: sticky ? 'sticky' : 'relative',
        right: isStickyRight ? 0 : undefined,
        left: sticky === 'left' ? 0 : undefined,
        backgroundColor: backgroundColor ?? (sticky ? 'var(--background)' : 'inherit'),
        zIndex: sticky ? 10 : 1,
        boxShadow: isStickyRight ? '-2px 0 4px rgba(0, 0, 0, 0.05)' : undefined,
        width: width ? `${width}px` : undefined,
        minWidth: width ? `${width}px` : undefined,
        borderBottom: '1px solid var(--border)',
        ...style,
      }}
    >
      {children}
    </td>
  );
};

/**
 * Table Row
 */
export const TableRow = ({ 
  children, 
  onClick, 
  selected,
  selectedBackgroundColor,
  highlighted,
  expanded,
  className = "",
  style,
  rowRef,
}: { 
  children: ReactNode; 
  onClick?: () => void;
  selected?: boolean;
  selectedBackgroundColor?: string;
  highlighted?: boolean;
  expanded?: boolean;
  className?: string;
  style?: CSSProperties;
  rowRef?: Ref<HTMLTableRowElement>;
}) => {
  const hoverClass = onClick ? 'hover:bg-muted/50' : '';
  const rowClassName = `${hoverClass} ${className}`.trim();

  return (
    <tr
      ref={rowRef}
      onClick={onClick}
      style={{
        cursor: onClick ? 'pointer' : 'default',
        backgroundColor: selected ? (selectedBackgroundColor || 'var(--muted)') : highlighted ? 'rgba(var(--primary-rgb), 0.1)' : 'transparent',
        transition: 'background-color 0.15s ease',
        borderBottom: expanded ? 'none' : '1px solid var(--border)',
        ...style,
      }}
      className={rowClassName}
    >
      {children}
    </tr>
  );
};

/**
 * Table Group Header Row
 */
export const TableGroupHeader = ({ children, colSpan }: { children: ReactNode; colSpan: number }) => (
  <tr style={{ backgroundColor: 'var(--muted)', borderTop: '2px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
    <td colSpan={colSpan} style={{ padding: '0.5rem 1rem' }}>
      {children}
    </td>
  </tr>
);

/**
 * Table Expandable Content Row
 */
export const TableExpandableRow = ({ children, colSpan, isVisible }: { children: ReactNode; colSpan: number; isVisible: boolean }) => {
  if (!isVisible) return null;
  return (
    <tr style={{ backgroundColor: 'rgba(var(--primary-rgb), 0.02)' }}>
      <td colSpan={colSpan} style={{ padding: '0', borderBottom: '1px solid var(--border)' }}>
        <div style={{ padding: '1rem' }}>
          {children}
        </div>
      </td>
    </tr>
  );
};

/**
 * Empty State Row
 */
export const TableEmptyState = ({ message, colSpan }: { message: string; colSpan: number }) => (
  <tr>
    <td colSpan={colSpan} style={{ 
      textAlign: 'center', 
      padding: '3rem 1rem',
      fontFamily: 'var(--font-inter)',
      fontSize: 'var(--text-label)',
      color: 'var(--muted-foreground)',
      lineHeight: '1.5',
    }}>
      {message}
    </td>
  </tr>
);

// --- Content Components (Cell UI) ---

/**
 * Student/Lead Badge
 */
export const StudentTypeBadge = ({ isStudent }: { isStudent: boolean }) => (
  <span style={{
    fontFamily: 'var(--font-inter)',
    fontSize: 'var(--text-xs)',
    fontWeight: 'var(--font-weight-medium)',
    color: isStudent ? 'var(--primary)' : 'var(--muted-foreground)',
    border: `1px solid ${isStudent ? 'var(--primary)' : 'var(--border)'}`,
    borderRadius: 'var(--radius-badge)',
    padding: '0.125rem 0.5rem',
    lineHeight: '1.5',
    whiteSpace: 'nowrap',
    flexShrink: 0,
  }}>
    {isStudent ? 'Studente' : 'Lead'}
  </span>
);

/**
 * Primary Text in Cell
 */
export const CellTextPrimary = ({ children }: { children: ReactNode }) => (
  <div style={{
    fontFamily: 'var(--font-inter)',
    fontSize: 'var(--text-base)',
    fontWeight: 'var(--font-weight-medium)',
    color: 'var(--foreground)',
    lineHeight: '1.5',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  }}>
    {children}
  </div>
);

/**
 * Secondary Text in Cell
 */
export const CellTextSecondary = ({ children }: { children: ReactNode }) => (
  <div style={{
    fontFamily: 'var(--font-inter)',
    fontSize: '12px',
    color: 'var(--muted-foreground)',
    lineHeight: '1.5',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  }}>
    {children}
  </div>
);

/**
 * Multi-line cell content wrapper
 */
export const CellContentStack = ({ children, gap = '2px' }: { children: ReactNode; gap?: string }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap }}>
    {children}
  </div>
);

/**
 * Status Pill (derived from StatusBadge logic in ServiziStudentiPage)
 */
export const StatusPill = ({ 
  label, 
  variant = 'default' 
}: { 
  label: string; 
  variant?: 'default' | 'success' | 'warning' | 'error' | 'neutral' | 'info' | 'purple'
}) => {
  const toneByVariant = {
    default: 'primary',
    success: 'success',
    warning: 'warning',
    error: 'danger',
    neutral: 'neutral',
    info: 'info',
    purple: 'purple',
  } as const;

  return (
    <span style={getAdminBadgeStyle(toneByVariant[variant])}>
      {label}
    </span>
  );
};

// --- Grouping Components ---

/**
 * Group Header Title
 */
export const GroupHeaderTitle = ({ children }: { children: ReactNode }) => (
  <span style={{
    fontFamily: 'var(--font-inter)',
    fontSize: 'var(--text-base)',
    fontWeight: 'var(--font-weight-semibold)',
    color: 'var(--foreground)',
    lineHeight: '1.5',
  }}>
    {children}
  </span>
);

/**
 * Group Header Stats Container
 */
export const GroupHeaderStats = ({ children }: { children: ReactNode }) => (
  <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
    {children}
  </div>
);

/**
 * Single Stat in Group Header
 */
export const GroupHeaderStat = ({ label, value, color }: { label: string; value: string | number; color?: string }) => (
  <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.25rem' }}>
    <span style={{ fontFamily: 'var(--font-inter)', fontSize: '11px', color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.02em' }}>{label}:</span>
    <span style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)', fontWeight: 'var(--font-weight-semibold)', color: color || 'var(--foreground)' }}>{value}</span>
  </div>
);

// --- Inline Editing Components ---

/**
 * Inline Edit Input
 */
export const InlineEditInput = ({ 
  value, 
  onChange, 
  onBlur, 
  onKeyDown, 
  type = "text",
  autoFocus = true
}: { 
  value: string | number; 
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur: () => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  type?: string;
  autoFocus?: boolean;
}) => (
  <input
    autoFocus={autoFocus}
    type={type}
    value={value}
    onChange={onChange}
    onBlur={onBlur}
    onKeyDown={onKeyDown}
    style={{
      padding: '0.125rem 0.375rem',
      borderRadius: 'var(--radius)',
      border: '1px solid var(--primary)',
      fontFamily: 'var(--font-inter)',
      fontSize: 'var(--text-label)',
      backgroundColor: 'var(--background)',
      color: 'var(--foreground)',
      outline: 'none',
      width: '100%',
    }}
  />
);

/**
 * Inline Edit Select
 */
export const InlineEditSelect = ({ 
  value, 
  onChange, 
  children 
}: { 
  value: string; 
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  children: ReactNode;
}) => (
  <select
    value={value}
    onChange={onChange}
    style={{
      padding: '0.25rem 0.375rem',
      borderRadius: 'var(--radius)',
      border: '1px solid var(--border)',
      fontFamily: 'var(--font-inter)',
      fontSize: 'var(--text-label)',
      backgroundColor: 'var(--background)',
      color: 'var(--foreground)',
      cursor: 'pointer',
      outline: 'none',
      appearance: 'auto',
    }}
  >
    {children}
  </select>
);

/**
 * Expand/Collapse Toggle
 */
export const ExpandToggle = ({ isExpanded, onClick }: { isExpanded: boolean; onClick: (e: React.MouseEvent) => void }) => (
  <button 
    onClick={(e) => { e.stopPropagation(); onClick(e); }} 
    style={{ 
      cursor: 'pointer', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      color: 'var(--muted-foreground)',
      padding: '0.25rem',
      borderRadius: 'var(--radius)',
      border: 'none',
      background: 'none',
      transition: 'background-color 0.15s ease',
    }}
    className="hover:bg-muted"
  >
    {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
  </button>
);

/**
 * Table Action Cell (Sticky Right)
 */
export const TableActionCell = ({
  children,
  width = 60,
  backgroundColor,
  onClick,
}: {
  children: ReactNode;
  width?: number;
  backgroundColor?: string;
  onClick?: (e: MouseEvent) => void;
}) => (
  <TableCell align="center" sticky="right" width={width} backgroundColor={backgroundColor} onClick={onClick}>
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      {children}
    </div>
  </TableCell>
);

export const TableSelectionHeaderCell = ({
  width = 50,
  checked,
  onCheckedChange,
}: {
  width?: number;
  checked: boolean | 'indeterminate';
  onCheckedChange: (checked: boolean | 'indeterminate') => void;
}) => (
  <th
    style={{
      width: `${width}px`,
      minWidth: `${width}px`,
      position: 'relative',
      background: 'var(--muted)',
      borderBottom: '1px solid var(--border)',
      padding: '0 1rem',
      textAlign: 'center',
      userSelect: 'none',
    }}
  >
    <Checkbox checked={checked} onCheckedChange={onCheckedChange} />
    <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: '1px', background: 'var(--border)' }} />
  </th>
);

export const TableSelectionCell = ({
  checked,
  onCheckedChange,
  onClick,
}: {
  checked: boolean;
  onCheckedChange: (checked: boolean | 'indeterminate') => void;
  onClick?: (e: MouseEvent) => void;
}) => (
  <TableCell onClick={onClick}>
    <Checkbox checked={checked} onCheckedChange={onCheckedChange} />
  </TableCell>
);

export const TableActionPlaceholderCell = ({
  width = 60,
  backgroundColor,
}: {
  width?: number;
  backgroundColor?: string;
}) => (
  <TableCell align="center" sticky="right" width={width} backgroundColor={backgroundColor}>
    <span style={{ visibility: 'hidden' }}>—</span>
  </TableCell>
);

/**
 * Table Header Action Cell (Sticky Right)
 */
export const TableHeaderActionCell = ({ width = 60 }: { width?: number }) => (
  <th style={{
    width: `${width}px`,
    minWidth: `${width}px`,
    position: 'sticky',
    right: 0,
    backgroundColor: 'var(--background)',
    zIndex: 25,
    boxShadow: '-2px 0 4px rgba(0, 0, 0, 0.05)',
    textAlign: 'center',
    padding: '0.75rem 1rem',
    borderBottom: '1px solid var(--border)',
    userSelect: 'none',
  }}>
    <span style={{
      fontFamily: 'var(--font-inter)',
      fontSize: 'var(--text-label)',
      fontWeight: 'var(--font-weight-semibold)',
      color: 'var(--foreground)',
      lineHeight: '1.5',
    }}>
      Azioni
    </span>
  </th>
);

// ─────────────────────────────────────────────────────────────────────────────
// NEW PRIMITIVES (added for ServiziStudentiPage refactoring)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * InlinePencilEditDisplay
 * Shows a value (or placeholder) + a subtle pencil icon.
 * Clicking triggers the parent's onEdit callback.
 * Used as the "display" mode for all inline-editable cells.
 */
export const InlinePencilEditDisplay = ({
  value,
  placeholder = '—',
  onClick,
  color,
  pencilSize = 10,
}: {
  value?: string | number | null;
  placeholder?: string;
  onClick: (e: React.MouseEvent) => void;
  color?: string;
  pencilSize?: number;
}) => {
  const hasValue = value !== undefined && value !== null && value !== '';
  return (
    <div
      onClick={(e) => { e.stopPropagation(); onClick(e); }}
      title="Clicca per modificare"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.25rem',
        cursor: 'pointer',
        color: hasValue ? (color || 'var(--foreground)') : 'var(--muted-foreground)',
        fontFamily: 'var(--font-inter)',
        fontSize: 'var(--text-label)',
        lineHeight: '1.5',
      }}
    >
      <span>{hasValue ? value : placeholder}</span>
      <Pencil
        size={pencilSize}
        style={{ color: 'var(--muted-foreground)', opacity: 0.5, flexShrink: 0 }}
      />
    </div>
  );
};

/**
 * InlineEditInvoiceNumber
 * Dual-input pattern: "N." / "Anno" (e.g. "17/2026").
 * Used for: N. Fattura (service level), N. Fattura (installment level), N. Notula coach.
 *
 * Props:
 * - numValue / onNumChange       → left input (number)
 * - yearValue / onYearChange     → right input (year)
 * - onConfirm(num, year)         → called on Enter or blur of last field
 * - onCancel                     → called on Escape
 * - numWidth / yearWidth         → widths in px (defaults: 40 / 48)
 * - yearDataAttr                 → data attribute key for blur coordination (e.g. "data-invoice-year")
 * - yearDataAttrValue            → value for the above attr (e.g. service.id or inst.id)
 */
export const InlineEditInvoiceNumber = ({
  numValue,
  onNumChange,
  yearValue,
  onYearChange,
  onConfirm,
  onCancel,
  numWidth = 40,
  yearWidth = 48,
  yearDataAttr,
  yearDataAttrValue,
  numPlaceholder = 'N.',
  yearPlaceholder = 'Anno',
}: {
  numValue: string;
  onNumChange: (val: string) => void;
  yearValue: string;
  onYearChange: (val: string) => void;
  onConfirm: (num: string, year: string) => void;
  onCancel: () => void;
  numWidth?: number;
  yearWidth?: number;
  yearDataAttr?: string;
  yearDataAttrValue?: string;
  numPlaceholder?: string;
  yearPlaceholder?: string;
}) => {
  const inputBase: React.CSSProperties = {
    padding: '0.125rem 0.375rem',
    borderRadius: 'var(--radius)',
    border: '1px solid var(--primary)',
    fontFamily: 'var(--font-inter)',
    fontSize: 'var(--text-label)',
    backgroundColor: 'var(--background)',
    color: 'var(--foreground)',
    outline: 'none',
  };

  const handleNumKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') onConfirm(numValue, yearValue);
    if (e.key === 'Escape') onCancel();
  };

  const handleYearKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') onConfirm(numValue, yearValue);
    if (e.key === 'Escape') onCancel();
  };

  const handleNumBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    // If focus moves to the year input of the same row, don't confirm yet
    if (yearDataAttr && yearDataAttrValue) {
      if ((e.relatedTarget as HTMLElement)?.getAttribute?.(yearDataAttr) === yearDataAttrValue) return;
    }
    onConfirm(numValue, yearValue);
  };

  const yearExtraProps: Record<string, string> = {};
  if (yearDataAttr && yearDataAttrValue) {
    yearExtraProps[yearDataAttr] = yearDataAttrValue;
  }

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
      <input
        type="text"
        inputMode="numeric"
        autoFocus
        value={numValue}
        placeholder={numPlaceholder}
        onChange={(e) => onNumChange(e.target.value.replace(/\D/g, ''))}
        onKeyDown={handleNumKeyDown}
        onBlur={handleNumBlur}
        style={{ ...inputBase, width: `${numWidth}px`, textAlign: 'right' }}
      />
      <span style={{ color: 'var(--muted-foreground)', fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)', lineHeight: '1' }}>/</span>
      <input
        type="text"
        inputMode="numeric"
        value={yearValue}
        placeholder={yearPlaceholder}
        {...yearExtraProps}
        onChange={(e) => onYearChange(e.target.value.replace(/\D/g, '').slice(0, 4))}
        onKeyDown={handleYearKeyDown}
        onBlur={() => onConfirm(numValue, yearValue)}
        style={{ ...inputBase, width: `${yearWidth}px`, color: 'var(--muted-foreground)' }}
      />
    </div>
  );
};

/**
 * PayoutStatusSelect
 * A pill-style select where the background color reflects the current status.
 * Text is always white. No border, no system appearance.
 * Used for: "Stato pag." column in Compensi Coach view.
 */
export type PayoutStatusValue = 'pending_invoice' | 'waiting_due_date' | 'ready_to_pay' | 'paid' | 'disputed';

const PAYOUT_STATUS_COLORS: Record<PayoutStatusValue, string> = {
  pending_invoice:    'var(--muted-foreground)',
  waiting_due_date:   'var(--chart-2)',
  ready_to_pay:       'var(--chart-3)',
  paid:               'var(--primary)',
  disputed:           'var(--destructive-foreground)',
};

const PAYOUT_STATUS_LABELS: Record<PayoutStatusValue, string> = {
  pending_invoice:  'Attesa notula',
  waiting_due_date: 'In scadenza',
  ready_to_pay:     'Da pagare',
  paid:             'Pagato',
  disputed:         'Contestato',
};

export const PayoutStatusSelect = ({
  value,
  onChange,
  width = 128,
}: {
  value: PayoutStatusValue;
  onChange: (val: PayoutStatusValue) => void;
  width?: number;
}) => (
  <select
    value={value}
    onChange={(e) => onChange(e.target.value as PayoutStatusValue)}
    onClick={(e) => e.stopPropagation()}
    style={{
      padding: '0.25rem 0.5rem',
      borderRadius: 'var(--radius)',
      border: 'none',
      fontFamily: 'var(--font-inter)',
      fontSize: 'var(--text-label)',
      fontWeight: 'var(--font-weight-medium)',
      color: '#fff',
      backgroundColor: PAYOUT_STATUS_COLORS[value],
      cursor: 'pointer',
      outline: 'none',
      appearance: 'none' as any,
      WebkitAppearance: 'none' as any,
      width: `${width}px`,
      textAlign: 'center' as any,
    }}
  >
    {(Object.keys(PAYOUT_STATUS_LABELS) as PayoutStatusValue[]).map((key) => (
      <option key={key} value={key}>{PAYOUT_STATUS_LABELS[key]}</option>
    ))}
  </select>
);

/** Expose label/color helpers for use in host pages */
export const getPayoutStatusLabel = (status?: PayoutStatusValue): string =>
  status ? PAYOUT_STATUS_LABELS[status] : 'N/D';

export const getPayoutStatusColor = (status?: PayoutStatusValue): string =>
  status ? PAYOUT_STATUS_COLORS[status] : 'var(--muted-foreground)';

/**
 * NotesBadgeButton
 * Icon button (StickyNote) with an absolute-positioned count badge.
 * Count === 0 → muted color, no badge rendered.
 * Count > 0   → primary color, badge visible.
 */
export const NotesBadgeButton = ({
  count,
  onClick,
  iconSize = 18,
}: {
  count: number;
  onClick: (e: React.MouseEvent) => void;
  iconSize?: number;
}) => (
  <button
    onClick={(e) => { e.stopPropagation(); onClick(e); }}
    title={`${count} ${count === 1 ? 'nota' : 'note'}`}
    style={{
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      padding: '0.25rem',
      color: count > 0 ? 'var(--primary)' : 'var(--muted-foreground)',
    }}
  >
    <StickyNote size={iconSize} />
    {count > 0 && (
      <span style={{
        position: 'absolute',
        top: '-4px',
        right: '-4px',
        backgroundColor: 'var(--primary)',
        color: 'var(--primary-foreground)',
        borderRadius: '50%',
        width: '16px',
        height: '16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '10px',
        fontWeight: 'var(--font-weight-medium)',
        fontFamily: 'var(--font-inter)',
        lineHeight: '1',
      }}>
        {count}
      </span>
    )}
  </button>
);

/**
 * CompletionIndicatorDot
 * Small amber dot shown next to the row ID when a service has incomplete setup.
 * (missing contract, missing price, missing coach, or overdue installments)
 */
export const CompletionIndicatorDot = ({ title = 'Setup incompleto' }: { title?: string }) => (
  <span
    title={title}
    style={{
      display: 'inline-block',
      width: '7px',
      height: '7px',
      borderRadius: '50%',
      backgroundColor: 'var(--chart-3)',
      flexShrink: 0,
    }}
  />
);

/**
 * NextDueDateDisplay
 * Shows the next pending/overdue installment date with a contextual countdown label.
 * - Overdue (days < 0):     red  — "Xg fa"
 * - Today (days === 0):     red  — "Oggi"
 * - Within 7 days:          amber — "tra Xg"
 * - Future:                 muted — "tra Xg"
 * - No pending date:        muted — "—"
 */
export const NextDueDateDisplay = ({
  dueDate,
}: {
  dueDate: string | null;
}) => {
  if (!dueDate) {
    return (
      <span style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)', color: 'var(--muted-foreground)', lineHeight: '1.5' }}>
        —
      </span>
    );
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);
  const diffDays = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  let color: string;
  let label: string;

  if (diffDays < 0) {
    color = 'var(--destructive-foreground)';
    label = `${Math.abs(diffDays)}g fa`;
  } else if (diffDays === 0) {
    color = 'var(--destructive-foreground)';
    label = 'Oggi';
  } else if (diffDays <= 7) {
    color = 'var(--chart-3)';
    label = `tra ${diffDays}g`;
  } else {
    color = 'var(--muted-foreground)';
    label = `tra ${diffDays}g`;
  }

  return (
    <div style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)', lineHeight: '1.5' }}>
      <div style={{ fontWeight: 'var(--font-weight-medium)', color }}>{dueDate}</div>
      <div style={{ fontSize: 'var(--text-xs)', color }}>{label}</div>
    </div>
  );
};

/**
 * Scad40ggDisplay
 * Shows the 40-day payment deadline computed from the notula issue date.
 * Highlights imminent/overdue deadlines. If status is "paid", renders neutral.
 * Returns "—" when no notula date is set.
 */
export const Scad40ggDisplay = ({
  notulaDate,
  isPaid = false,
}: {
  notulaDate?: string;
  isPaid?: boolean;
}) => {
  if (!notulaDate) {
    return (
      <span style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)', color: 'var(--muted-foreground)', lineHeight: '1.5' }}>
        —
      </span>
    );
  }

  const d = new Date(notulaDate);
  d.setDate(d.getDate() + 40);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const daysLeft = Math.ceil((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  const dateStr = d.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' });

  const isOverdue = daysLeft <= 0;
  const isWarning = daysLeft <= 7 && daysLeft > 0;

  const color = isPaid
    ? 'var(--foreground)'
    : isOverdue
    ? 'var(--destructive-foreground)'
    : isWarning
    ? 'var(--chart-3)'
    : 'var(--foreground)';

  return (
    <span style={{
      fontFamily: 'var(--font-inter)',
      fontSize: 'var(--text-label)',
      fontWeight: (isOverdue && !isPaid) ? 'var(--font-weight-bold)' : 'var(--font-weight-regular)',
      color,
      lineHeight: '1.5',
    }}>
      {dateStr}
      {!isPaid && daysLeft <= 14 && (
        <span style={{
          fontSize: 'var(--text-xs)',
          color: isOverdue ? 'var(--destructive-foreground)' : 'var(--chart-3)',
          marginLeft: '0.2rem',
        }}>
          ({daysLeft > 0 ? `-${daysLeft}gg` : `+${Math.abs(daysLeft)}gg`})
        </span>
      )}
    </span>
  );
};