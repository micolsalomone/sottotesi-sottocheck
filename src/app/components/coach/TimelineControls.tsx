import { ChevronDown, Filter } from 'lucide-react';

interface TimelineControlsProps {
  filterMode: 'open' | 'upcoming' | 'completed' | 'all';
  onFilterChange: (mode: 'open' | 'upcoming' | 'completed' | 'all') => void;
  onEditTimeline?: () => void;
}

const FILTER_OPTIONS: { value: TimelineControlsProps['filterMode']; label: string }[] = [
  { value: 'all', label: 'Tutte le fasi' },
  { value: 'open', label: 'Aperte' },
  { value: 'upcoming', label: 'Prossime fasi' },
  { value: 'completed', label: 'Completate' },
];

export function TimelineControls({
  filterMode,
  onFilterChange,
  onEditTimeline,
}: TimelineControlsProps) {
  return (
    <div className="py-6 flex items-center justify-end gap-3">
      {/* Filter Dropdown */}
      <div className="relative">
        <Filter
          aria-hidden="true"
          className="pointer-events-none absolute left-[14px] top-1/2 w-[14px] h-[14px] -translate-y-1/2 text-[var(--muted-foreground)]"
        />
        <select
          aria-label="Filtra le fasi della timeline"
          className="control-focus-ring appearance-none cursor-pointer pl-[36px] pr-[36px] py-[8px] border border-[var(--border)] bg-[var(--card)] hover:bg-[var(--muted)] transition-colors"
          value={filterMode}
          onChange={(event) => onFilterChange(event.target.value as TimelineControlsProps['filterMode'])}
          style={{
            borderRadius: 'var(--radius)',
            fontFamily: 'var(--font-inter)',
            fontSize: 'var(--text-label)',
            fontWeight: 'var(--font-weight-medium)',
            color: 'var(--foreground)',
          }}
        >
          {FILTER_OPTIONS.map(option => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
        <ChevronDown
          aria-hidden="true"
          className="pointer-events-none absolute right-[14px] top-1/2 w-[14px] h-[14px] -translate-y-1/2 text-[var(--muted-foreground)]"
        />
      </div>

      {/* Edit Timeline Button */}
      {onEditTimeline && (
        <button
          onClick={onEditTimeline}
          className="flex items-center gap-[8px] px-[14px] py-[8px] border border-[var(--border)] bg-[var(--card)] hover:bg-[var(--muted)] transition-colors"
          style={{
            borderRadius: 'var(--radius)',
            fontFamily: 'var(--font-inter)',
            fontSize: 'var(--text-label)',
            fontWeight: 'var(--font-weight-medium)',
            color: 'var(--foreground)',
          }}
        >
          <svg className="w-[14px] h-[14px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
          <span>Modifica timeline</span>
        </button>
      )}
    </div>
  );
}
