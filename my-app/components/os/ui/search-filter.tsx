'use client';

import React, { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  Filter, 
  X, 
  ChevronDown, 
  ChevronUp,
  SlidersHorizontal,
  Calendar,
  MapPin,
  Users,
  DollarSign
} from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { DatePicker } from './form-components';

// Advanced Search Component
interface SearchFilterProps {
  placeholder?: string;
  onSearch?: (query: string) => void;
  onFilterChange?: (filters: any) => void;
  filters?: any;
  className?: string;
  showAdvanced?: boolean;
}

export const SearchFilter: React.FC<SearchFilterProps> = ({
  placeholder = "Search...",
  onSearch,
  onFilterChange,
  filters = {},
  className,
  showAdvanced = true
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const [localFilters, setLocalFilters] = useState(filters);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    onSearch?.(query);
  };

  const handleFilterChange = (newFilters: any) => {
    const updatedFilters = { ...localFilters, ...newFilters };
    setLocalFilters(updatedFilters);
    onFilterChange?.(updatedFilters);
  };

  const clearFilters = () => {
    setLocalFilters({});
    onFilterChange?.({});
  };

  const hasActiveFilters = Object.keys(localFilters).some(key => 
    localFilters[key] !== undefined && localFilters[key] !== ''
  );

  return (
    <div className={cn("space-y-4", className)}>
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder={placeholder}
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          className="pl-10 pr-10"
        />
        {searchQuery && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleSearch('')}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Filter Controls */}
      {showAdvanced && (
        <div className="flex items-center gap-2">
          <Popover open={isAdvancedOpen} onOpenChange={setIsAdvancedOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Filters
                {hasActiveFilters && (
                  <Badge variant="secondary" className="ml-2">
                    {Object.keys(localFilters).filter(key => 
                      localFilters[key] !== undefined && localFilters[key] !== ''
                    ).length}
                  </Badge>
                )}
                {isAdvancedOpen ? (
                  <ChevronUp className="h-4 w-4 ml-2" />
                ) : (
                  <ChevronDown className="h-4 w-4 ml-2" />
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80" align="start">
              <AdvancedFilters
                filters={localFilters}
                onFilterChange={handleFilterChange}
                onClear={clearFilters}
              />
            </PopoverContent>
          </Popover>

          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="text-gray-500 hover:text-gray-700"
            >
              Clear all
            </Button>
          )}
        </div>
      )}

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2">
          {Object.entries(localFilters).map(([key, value]) => {
            if (value === undefined || value === '') return null;
            return (
              <Badge
                key={key}
                variant="secondary"
                className="flex items-center gap-1"
              >
                {key}: {String(value)}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleFilterChange({ [key]: undefined })}
                  className="h-4 w-4 p-0 hover:bg-transparent"
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            );
          })}
        </div>
      )}
    </div>
  );
};

// Advanced Filters Component
interface AdvancedFiltersProps {
  filters: any;
  onFilterChange: (filters: any) => void;
  onClear: () => void;
}

const AdvancedFilters: React.FC<AdvancedFiltersProps> = ({
  filters,
  onFilterChange,
  onClear
}) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-medium">Advanced Filters</h4>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClear}
          className="text-xs"
        >
          Clear all
        </Button>
      </div>

      {/* Date Range Filter */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Date Range</label>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs text-gray-500">From</label>
            <Input
              type="date"
              value={filters.dateFrom || ''}
              onChange={(e) => onFilterChange({ dateFrom: e.target.value })}
              className="text-xs"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500">To</label>
            <Input
              type="date"
              value={filters.dateTo || ''}
              onChange={(e) => onFilterChange({ dateTo: e.target.value })}
              className="text-xs"
            />
          </div>
        </div>
      </div>

      {/* Status Filter */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Status</label>
        <Select
          value={filters.status || ''}
          onValueChange={(value) => onFilterChange({ status: value })}
        >
          <SelectTrigger className="text-xs">
            <SelectValue placeholder="Select status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Category Filter */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Category</label>
        <div className="space-y-2">
          {['Hotels', 'Resorts', 'Apartments', 'Villas'].map((category) => (
            <div key={category} className="flex items-center space-x-2">
              <Checkbox
                id={category}
                checked={filters.categories?.includes(category) || false}
                onCheckedChange={(checked) => {
                  const currentCategories = filters.categories || [];
                  const newCategories = checked
                    ? [...currentCategories, category]
                    : currentCategories.filter(c => c !== category);
                  onFilterChange({ categories: newCategories });
                }}
              />
              <label htmlFor={category} className="text-sm">
                {category}
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* Price Range Filter */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Price Range</label>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs text-gray-500">Min</label>
            <Input
              type="number"
              placeholder="0"
              value={filters.priceMin || ''}
              onChange={(e) => onFilterChange({ priceMin: e.target.value })}
              className="text-xs"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500">Max</label>
            <Input
              type="number"
              placeholder="10000"
              value={filters.priceMax || ''}
              onChange={(e) => onFilterChange({ priceMax: e.target.value })}
              className="text-xs"
            />
          </div>
        </div>
      </div>

      {/* Location Filter */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Location</label>
        <Input
          placeholder="Enter location"
          value={filters.location || ''}
          onChange={(e) => onFilterChange({ location: e.target.value })}
          className="text-xs"
        />
      </div>
    </div>
  );
};

// Quick Search Component
interface QuickSearchProps {
  suggestions?: string[];
  onSearch: (query: string) => void;
  placeholder?: string;
  className?: string;
}

export const QuickSearch: React.FC<QuickSearchProps> = ({
  suggestions = [],
  onSearch,
  placeholder = "Quick search...",
  className
}) => {
  const [query, setQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);

  const filteredSuggestions = suggestions.filter(suggestion =>
    suggestion.toLowerCase().includes(query.toLowerCase())
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => 
        prev < filteredSuggestions.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex >= 0) {
        const selectedSuggestion = filteredSuggestions[selectedIndex];
        setQuery(selectedSuggestion);
        onSearch(selectedSuggestion);
        setShowSuggestions(false);
      } else {
        onSearch(query);
        setShowSuggestions(false);
      }
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
      setSelectedIndex(-1);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion);
    onSearch(suggestion);
    setShowSuggestions(false);
    setSelectedIndex(-1);
  };

  return (
    <div className={cn("relative", className)}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          ref={inputRef}
          placeholder={placeholder}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setShowSuggestions(true);
            setSelectedIndex(-1);
          }}
          onFocus={() => setShowSuggestions(true)}
          onKeyDown={handleKeyDown}
          className="pl-10"
        />
        {query && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setQuery('');
              onSearch('');
            }}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Suggestions Dropdown */}
      {showSuggestions && filteredSuggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
          {filteredSuggestions.map((suggestion, index) => (
            <div
              key={suggestion}
              className={cn(
                "px-3 py-2 cursor-pointer hover:bg-gray-50",
                index === selectedIndex && "bg-gray-100"
              )}
              onClick={() => handleSuggestionClick(suggestion)}
            >
              <div className="flex items-center gap-2">
                <Search className="h-4 w-4 text-gray-400" />
                <span className="text-sm">{suggestion}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Filter Tags Component
interface FilterTag {
  key: string;
  label: string;
  value: string;
  onRemove: () => void;
}

interface FilterTagsProps {
  tags: FilterTag[];
  onClearAll?: () => void;
  className?: string;
}

export const FilterTags: React.FC<FilterTagsProps> = ({
  tags,
  onClearAll,
  className
}) => {
  if (tags.length === 0) return null;

  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {tags.map((tag) => (
        <Badge
          key={tag.key}
          variant="secondary"
          className="flex items-center gap-1"
        >
          {tag.label}: {tag.value}
          <Button
            variant="ghost"
            size="sm"
            onClick={tag.onRemove}
            className="h-4 w-4 p-0 hover:bg-transparent"
          >
            <X className="h-3 w-3" />
          </Button>
        </Badge>
      ))}
      {onClearAll && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearAll}
          className="text-gray-500 hover:text-gray-700"
        >
          Clear all
        </Button>
      )}
    </div>
  );
};

// Search History Component
interface SearchHistoryProps {
  history: string[];
  onSelect: (query: string) => void;
  onClear: () => void;
  maxItems?: number;
  className?: string;
}

export const SearchHistory: React.FC<SearchHistoryProps> = ({
  history,
  onSelect,
  onClear,
  maxItems = 5,
  className
}) => {
  if (history.length === 0) return null;

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-gray-700">Recent Searches</h4>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClear}
          className="text-xs text-gray-500 hover:text-gray-700"
        >
          Clear
        </Button>
      </div>
      
      <div className="space-y-1">
        {history.slice(0, maxItems).map((query, index) => (
          <div
            key={index}
            className="flex items-center gap-2 p-2 rounded-md hover:bg-gray-50 cursor-pointer"
            onClick={() => onSelect(query)}
          >
            <Search className="h-4 w-4 text-gray-400" />
            <span className="text-sm text-gray-600">{query}</span>
          </div>
        ))}
      </div>
    </div>
  );
}; 