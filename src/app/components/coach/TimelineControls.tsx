import { useState, useRef, useEffect } from 'react';
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
  const [filterOpen, setFilterOpen] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) setFilterOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currentFilterLabel = FILTER_OPTIONS.find(o => o.value === filterMode)?.label || 'Tutte le fasi';

  return (
    <div className="py-6 flex items-center justify-end gap-3">
      {/* Filter Dropdown */}
      <div ref={filterRef} className="relative">
        <button
          onClick={() => { setFilterOpen(prev => !prev); }}
          className="flex items-center gap-[8px] px-[14px] py-[8px] border border-[var(--border)] bg-[var(--card)] hover:bg-[var(--muted)] transition-colors"
          style={{
            borderRadius: 'var(--radius)',
            fontFamily: 'var(--font-inter)',
            fontSize: 'var(--text-label)',
            fontWeight: 'var(--font-weight-medium)',
            color: 'var(--foreground)',
          }}
        >
          <Filter className="w-[14px] h-[14px] text-[var(--muted-foreground)]" />
          <span>{currentFilterLabel}</span>
          <ChevronDown
            className="w-[14px] h-[14px] text-[var(--muted-foreground)] transition-transform"
            style={{ transform: filterOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
          />
        </button>

        {filterOpen && (
          <div
            className="absolute right-0 top-full mt-[4px] z-50 border border-[var(--border)] bg-[var(--card)] py-[4px] min-w-[180px]"
            style={{
              borderRadius: 'var(--radius)',
              boxShadow: 'var(--elevation-md)',
            }}
          >
            {FILTER_OPTIONS.map(option => (
              <button
                key={option.value}
                onClick={() => { onFilterChange(option.value); setFilterOpen(false); }}
                className={`w-full text-left px-[14px] py-[8px] transition-colors ${
                  filterMode === option.value
                    ? 'bg-[var(--muted)] text-[var(--foreground)]'
                    : 'text-[var(--foreground)] hover:bg-[var(--muted)]'
                }`}
                style={{
                  fontFamily: 'var(--font-inter)',
                  fontSize: 'var(--text-label)',
                  fontWeight: filterMode === option.value ? 'var(--font-weight-medium)' : 'var(--font-weight-regular)',
                }}
              >
                {option.label}
              </button>
            ))}
          </div>
        )}
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
