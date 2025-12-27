"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Search, MapPin, Building, Navigation, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import Image from 'next/image';

interface SearchResult {
  id: string;
  name: string;
  city: string;
  address: string;
  type: string;
  price: number;
  thumbnail: string | null;
  matchType: 'property' | 'city' | 'address' | 'type' | 'other';
}

interface CityResult {
  name: string;
  count: number;
  type: 'city';
}

interface AdvancedSearchProps {
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  onSelectResult?: (result: SearchResult | CityResult) => void;
  className?: string;
  variant?: 'header' | 'hero';
}

export function AdvancedSearch({
  placeholder = "City, region or hotel",
  value = "",
  onChange,
  onSelectResult,
  className = "",
  variant = "hero"
}: AdvancedSearchProps) {
  const [searchValue, setSearchValue] = useState(value);
  const [isOpen, setIsOpen] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [cities, setCities] = useState<CityResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<NodeJS.Timeout>();

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setHighlightedIndex(-1);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Update internal state when value prop changes
  useEffect(() => {
    setSearchValue(value);
  }, [value]);

  // Debounced search function
  const performSearch = async (query: string) => {
    if (!query.trim() || query.length < 2) {
      setResults([]);
      setCities([]);
      setIsOpen(false);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/search/advanced?q=${encodeURIComponent(query)}&limit=8`);
      const data = await response.json();
      
      if (data.success) {
        setResults(data.results || []);
        setCities(data.cities || []);
        setIsOpen(true);
        setHighlightedIndex(-1);
      }
    } catch (error) {
      // Search error
      setResults([]);
      setCities([]);
    } finally{
      setIsLoading(false);
    }
  };

  // Handle input change with debouncing
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setSearchValue(newValue);
    onChange?.(newValue);

    // Clear previous timeout
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // Set new timeout for debounced search
    debounceRef.current = setTimeout(() => {
      performSearch(newValue);
    }, 300);
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    const totalItems = cities.length + results.length;
    
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev < totalItems - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0) {
          const selectedItem = highlightedIndex < cities.length 
            ? cities[highlightedIndex]
            : results[highlightedIndex - cities.length];
          handleSelectResult(selectedItem);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setHighlightedIndex(-1);
        inputRef.current?.blur();
        break;
    }
  };

  // Handle result selection
  const handleSelectResult = (item: SearchResult | CityResult) => {
    if (item.type === 'city') {
      setSearchValue(item.name);
      onChange?.(item.name);
    } else {
      setSearchValue(item.name);
      onChange?.(item.name);
    }
    setIsOpen(false);
    setHighlightedIndex(-1);
    onSelectResult?.(item);
  };

  // Clear search
  const handleClear = () => {
    setSearchValue('');
    onChange?.('');
    setResults([]);
    setCities([]);
    setIsOpen(false);
    inputRef.current?.focus();
  };

  // Get icon for result type
  const getResultIcon = (matchType: string) => {
    switch (matchType) {
      case 'property':
        return <Building className="h-4 w-4 text-blue-500" />;
      case 'city':
        return <MapPin className="h-4 w-4 text-green-500" />;
      case 'address':
        return <Navigation className="h-4 w-4 text-orange-500" />;
      default:
        return <Search className="h-4 w-4 text-gray-500" />;
    }
  };

  const inputClasses = variant === 'header'
    ? "border-none focus:ring-0 w-full h-9 md:h-10 bg-transparent"
    : "w-full pl-10 pr-10 py-2 h-10 bg-darkGreen/60 border border-lightGreen/30 rounded-lg !text-white !placeholder-white/90 focus:outline-none focus:ring-2 focus:ring-lightGreen";

  const dropdownClasses = variant === 'header'
    ? "absolute top-full left-0 right-0 bg-white dark:bg-darkGreen border border-gray-200 dark:border-lightGreen/30 rounded-lg shadow-lg z-50 mt-1"
    : "absolute top-full left-0 right-0 bg-darkGreen/95 backdrop-blur-md border border-lightGreen/30 rounded-lg shadow-xl z-50 mt-2";

  return (
    <div ref={searchRef} className={cn("relative", className)}>
      <div className="relative">
        {variant === 'hero' && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MapPin className="h-4 w-4 sm:h-5 sm:w-5 text-lightGreen" />
          </div>
        )}
        
        <Input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={searchValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (searchValue.length >= 2) {
              performSearch(searchValue);
            }
          }}
          className={inputClasses}
        />
        
        {searchValue && (
          <button
            onClick={handleClear}
            className={cn(
              "absolute inset-y-0 right-0 pr-3 flex items-center",
              variant === 'hero' ? "text-lightYellow/60 hover:text-lightYellow" : "text-gray-400 hover:text-gray-600"
            )}
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Search Results Dropdown */}
      {isOpen && (searchValue.length >= 2) && (
        <div className={dropdownClasses}>
          <div className="max-h-96 overflow-y-auto">
            {isLoading ? (
              <div className={cn(
                "p-4 text-center",
                variant === 'hero' ? "text-lightYellow" : "text-gray-500"
              )}>
                <div className="animate-spin rounded-full h-6 w-6 border-2 border-current border-t-transparent mx-auto mb-2"></div>
                Searching...
              </div>
            ) : (
              <>
                {/* Cities Section */}
                {cities.length > 0 && (
                  <div className="p-2">
                    <div className={cn(
                      "text-xs font-medium mb-2 px-2",
                      variant === 'hero' ? "text-lightGreen" : "text-gray-500"
                    )}>
                      Cities ({cities.length})
                    </div>
                    {cities.map((city, index) => (
                      <button
                        key={`city-${index}`}
                        onClick={() => handleSelectResult(city)}
                        className={cn(
                          "w-full text-left px-3 py-2 rounded-md hover:bg-opacity-80 transition-colors flex items-center gap-3",
                          highlightedIndex === index 
                            ? variant === 'hero' 
                              ? "bg-lightGreen/20 text-lightYellow" 
                              : "bg-gray-100 text-gray-900"
                            : variant === 'hero'
                              ? "text-lightYellow hover:bg-lightGreen/10"
                              : "text-gray-700 hover:bg-gray-50"
                        )}
                      >
                        <MapPin className="h-4 w-4 text-green-500 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">{city.name}</div>
                          <div className={cn(
                            "text-xs",
                            variant === 'hero' ? "text-lightYellow/70" : "text-gray-500"
                          )}>
                            {city.count} properties
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {/* Properties Section */}
                {results.length > 0 && (
                  <div className={cn("p-2", cities.length > 0 && "border-t border-opacity-20")}>
                    <div className={cn(
                      "text-xs font-medium mb-2 px-2",
                      variant === 'hero' ? "text-lightGreen" : "text-gray-500"
                    )}>
                      Properties ({results.length})
                    </div>
                    {results.map((result, index) => {
                      const adjustedIndex = cities.length + index;
                      return (
                        <button
                          key={`result-${result.id}`}
                          onClick={() => handleSelectResult(result)}
                          className={cn(
                            "w-full text-left px-3 py-3 rounded-md hover:bg-opacity-80 transition-colors flex items-center gap-3",
                            highlightedIndex === adjustedIndex 
                              ? variant === 'hero' 
                                ? "bg-lightGreen/20 text-lightYellow" 
                                : "bg-gray-100 text-gray-900"
                              : variant === 'hero'
                                ? "text-lightYellow hover:bg-lightGreen/10"
                                : "text-gray-700 hover:bg-gray-50"
                          )}
                        >
                          {result.thumbnail ? (
                            <Image
                              src={result.thumbnail}
                              alt={result.name}
                              width={40}
                              height={40}
                              className="rounded object-cover flex-shrink-0"
                            />
                          ) : (
                            <div className="w-10 h-10 bg-gray-200 rounded flex items-center justify-center flex-shrink-0">
                              {getResultIcon(result.matchType)}
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="font-medium truncate">{result.name}</div>
                            <div className={cn(
                              "text-xs truncate",
                              variant === 'hero' ? "text-lightYellow/70" : "text-gray-500"
                            )}>
                              {result.address}
                            </div>
                            {result.price > 0 && (
                              <div className={cn(
                                "text-xs font-medium",
                                variant === 'hero' ? "text-lightGreen" : "text-blue-600"
                              )}>
                                ₹{result.price.toLocaleString()}/night
                              </div>
                            )}
                          </div>
                          <div className="flex-shrink-0">
                            {getResultIcon(result.matchType)}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* No Results */}
                {!isLoading && cities.length === 0 && results.length === 0 && searchValue.length >= 2 && (
                  <div className={cn(
                    "p-4 text-center",
                    variant === 'hero' ? "text-lightYellow/70" : "text-gray-500"
                  )}>
                    <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <div className="font-medium">No results found</div>
                    <div className="text-xs mt-1">
                      Try searching for a city, property name, or address
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
