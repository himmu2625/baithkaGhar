"use client"

import React, { createContext, useContext, useState, ReactNode } from "react"

interface FilterOptions {
  priceMin: number
  priceMax: number
  location: string
  bedrooms: number
  bathrooms: number
  amenities: string[]
}

interface FilterContextType {
  filters: FilterOptions
  updateFilters: (filters: Partial<FilterOptions>) => void
  resetFilters: () => void
}

const defaultFilters: FilterOptions = {
  priceMin: 0,
  priceMax: 100000,
  location: "",
  bedrooms: 0,
  bathrooms: 0,
  amenities: [],
}

const FilterContext = createContext<FilterContextType | undefined>(undefined)

export function FilterProvider({ children }: { children: ReactNode }) {
  const [filters, setFilters] = useState<FilterOptions>(defaultFilters)

  const updateFilters = (newFilters: Partial<FilterOptions>) => {
    setFilters(prev => ({ ...prev, ...newFilters }))
  }

  const resetFilters = () => {
    setFilters(defaultFilters)
  }

  return (
    <FilterContext.Provider value={{ filters, updateFilters, resetFilters }}>
      {children}
    </FilterContext.Provider>
  )
}

export function useFilters() {
  const context = useContext(FilterContext)
  if (context === undefined) {
    throw new Error("useFilters must be used within a FilterProvider")
  }
  return context
} 