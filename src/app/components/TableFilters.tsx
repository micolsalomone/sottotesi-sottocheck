import React, { useState } from 'react';
import { Search, ChevronDown, ChevronUp, X } from 'lucide-react';
import { Input } from './ui/input';
import { Button } from './ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';

export interface FilterOption {
  label: string;
  value: string;
}

export interface FilterConfig {
  key: string;
  label: string;
  options: FilterOption[];
  defaultValue?: string;
}

interface TableFiltersProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  filters: FilterConfig[];
  filterValues: Record<string, string>;
  onFilterChange: (key: string, value: string) => void;
  onReset: () => void;
  defaultExpanded?: boolean;
}

export function TableFilters({
  searchValue,
  onSearchChange,
  searchPlaceholder = 'Cerca...',
  filters,
  filterValues,
  onFilterChange,
  onReset,
  defaultExpanded = true
}: TableFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  const hasActiveFilters = () => {
    return searchValue !== '' || Object.values(filterValues).some(value => value !== 'all');
  };

  const handleReset = () => {
    onReset();
  };

  return (
    <div className="space-y-3 mb-4">
      {/* Barra ricerca sempre visibile */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder={searchPlaceholder}
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
          />
          {searchValue && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className="gap-2"
        >
          Filtri
          {isExpanded ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </Button>
        {hasActiveFilters() && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReset}
            className="text-muted-foreground hover:text-foreground"
          >
            Reset
          </Button>
        )}
      </div>

      {/* Filtri dropdown espandibili */}
      {isExpanded && filters.length > 0 && (
        <div className="flex flex-wrap items-center gap-3 p-4 bg-muted rounded-lg border border-border">
          {filters.map((filter) => (
            <div key={filter.key} className="flex items-center gap-2">
              <label className="text-sm font-medium text-foreground whitespace-nowrap">
                {filter.label}:
              </label>
              <Select
                value={filterValues[filter.key] || 'all'}
                onValueChange={(value) => onFilterChange(filter.key, value)}
              >
                <SelectTrigger className="w-40 bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tutti</SelectItem>
                  {filter.options.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}