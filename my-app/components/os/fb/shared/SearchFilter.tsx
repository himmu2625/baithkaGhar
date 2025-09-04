'use client';

import { useState } from 'react';
import { Search, Filter, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';

interface FilterOption {
  key: string;
  label: string;
  type: 'select' | 'multiselect' | 'date' | 'range';
  options?: Array<{ value: string; label: string }>;
  placeholder?: string;
}

interface SearchFilterProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  filters?: FilterOption[];
  activeFilters?: Record<string, any>;
  onFiltersChange?: (filters: Record<string, any>) => void;
  placeholder?: string;
  showFilterCount?: boolean;
  className?: string;
}

export function SearchFilter({ 
  searchQuery, 
  onSearchChange,
  filters = [],
  activeFilters = {},
  onFiltersChange,
  placeholder = "Search...",
  showFilterCount = true,
  className 
}: SearchFilterProps) {
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const handleFilterChange = (key: string, value: any) => {
    const newFilters = { ...activeFilters };
    
    if (value === null || value === undefined || value === '') {
      delete newFilters[key];
    } else {
      newFilters[key] = value;
    }
    
    onFiltersChange?.(newFilters);
  };

  const clearFilter = (key: string) => {
    const newFilters = { ...activeFilters };
    delete newFilters[key];
    onFiltersChange?.(newFilters);
  };

  const clearAllFilters = () => {
    onFiltersChange?.({});
    onSearchChange('');
  };

  const activeFilterCount = Object.keys(activeFilters).length;
  const hasActiveFilters = activeFilterCount > 0 || searchQuery.length > 0;

  const renderFilterBadges = () => {
    const badges = [];
    
    // Search query badge
    if (searchQuery) {
      badges.push(
        <Badge key="search" variant="secondary" className="flex items-center space-x-1">
          <Search className="w-3 h-3" />
          <span>{searchQuery}</span>
          <button
            onClick={() => onSearchChange('')}
            className="ml-1 hover:bg-gray-200 rounded-full p-0.5"
          >
            <X className="w-3 h-3" />
          </button>
        </Badge>
      );
    }
    
    // Filter badges
    Object.entries(activeFilters).forEach(([key, value]) => {
      const filter = filters.find(f => f.key === key);
      if (!filter) return;
      
      let displayValue = value;
      if (filter.options && typeof value === 'string') {
        const option = filter.options.find(opt => opt.value === value);
        displayValue = option?.label || value;
      }
      
      badges.push(
        <Badge key={key} variant="secondary" className="flex items-center space-x-1">
          <span className="text-xs text-gray-600">{filter.label}:</span>
          <span>{displayValue}</span>
          <button
            onClick={() => clearFilter(key)}
            className="ml-1 hover:bg-gray-200 rounded-full p-0.5"
          >
            <X className="w-3 h-3" />
          </button>
        </Badge>
      );
    });
    
    return badges;
  };

  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex items-center space-x-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder={placeholder}
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>
        
        {filters.length > 0 && (
          <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="relative">
                <Filter className="w-4 h-4 mr-2" />
                Filters
                {showFilterCount && activeFilterCount > 0 && (
                  <Badge 
                    variant="secondary" 
                    className="ml-2 px-1.5 py-0.5 text-xs min-w-[1.25rem] h-5"
                  >
                    {activeFilterCount}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80" align="end">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Filters</h4>
                  {hasActiveFilters && (
                    <Button variant="ghost" size="sm" onClick={clearAllFilters}>
                      Clear All
                    </Button>
                  )}
                </div>
                
                {filters.map((filter) => (
                  <div key={filter.key} className="space-y-2">
                    <label className="text-sm font-medium">{filter.label}</label>
                    
                    {filter.type === 'select' && filter.options && (
                      <Select
                        value={activeFilters[filter.key] || ''}
                        onValueChange={(value) => handleFilterChange(filter.key, value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={filter.placeholder || `Select ${filter.label}`} />
                        </SelectTrigger>
                        <SelectContent>
                          {filter.options.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        )}
        
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearAllFilters}>
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>
      
      {/* Active filter badges */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2">
          {renderFilterBadges()}
        </div>
      )}
    </div>
  );
}