"use client"

import React from 'react'
import { 
  Card, 
  CardContent 
} from "@/components/ui/card"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Filter, X } from "lucide-react"

interface FilterOption {
  id: string
  label: string
}

interface SearchFiltersProps {
  propertyTypes?: FilterOption[]
  amenities?: FilterOption[]
  locations?: FilterOption[]
  priceRange?: [number, number]
  maxPrice?: number
  selectedPropertyTypes?: string[]
  selectedAmenities?: string[]
  selectedLocations?: string[]
  selectedPriceRange?: [number, number]
  onPropertyTypeChange?: (value: string[]) => void
  onAmenitiesChange?: (value: string[]) => void
  onLocationsChange?: (value: string[]) => void
  onPriceRangeChange?: (value: [number, number]) => void
  onResetFilters?: () => void
}

export function SearchFilters({
  propertyTypes = [],
  amenities = [],
  locations = [],
  priceRange = [0, 50000],
  maxPrice = 50000,
  selectedPropertyTypes = [],
  selectedAmenities = [],
  selectedLocations = [],
  selectedPriceRange = [0, 50000],
  onPropertyTypeChange,
  onAmenitiesChange,
  onLocationsChange,
  onPriceRangeChange,
  onResetFilters
}: SearchFiltersProps) {
  
  const handlePropertyTypeToggle = (id: string) => {
    if (!onPropertyTypeChange) return
    
    const updated = selectedPropertyTypes.includes(id)
      ? selectedPropertyTypes.filter(item => item !== id)
      : [...selectedPropertyTypes, id]
    
    onPropertyTypeChange(updated)
  }
  
  const handleAmenityToggle = (id: string) => {
    if (!onAmenitiesChange) return
    
    const updated = selectedAmenities.includes(id)
      ? selectedAmenities.filter(item => item !== id)
      : [...selectedAmenities, id]
    
    onAmenitiesChange(updated)
  }
  
  const handleLocationToggle = (id: string) => {
    if (!onLocationsChange) return
    
    const updated = selectedLocations.includes(id)
      ? selectedLocations.filter(item => item !== id)
      : [...selectedLocations, id]
    
    onLocationsChange(updated)
  }
  
  const handlePriceChange = (value: number[]) => {
    if (!onPriceRangeChange || value.length < 2) return
    onPriceRangeChange([value[0], value[1]])
  }
  
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(price)
  }
  
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-medium">Filters</h3>
          {onResetFilters && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onResetFilters}
              className="h-8 px-2 text-sm"
            >
              <X className="h-4 w-4 mr-1" />
              Reset all
            </Button>
          )}
        </div>
        
        <Accordion type="multiple" defaultValue={["price", "type"]}>
          {/* Price Range Filter */}
          <AccordionItem value="price">
            <AccordionTrigger>Price Range</AccordionTrigger>
            <AccordionContent>
              <div className="pt-2 pb-6">
                <Slider
                  defaultValue={selectedPriceRange}
                  min={priceRange[0]}
                  max={maxPrice}
                  step={1000}
                  value={selectedPriceRange}
                  onValueChange={handlePriceChange}
                  className="mb-6"
                />
                <div className="flex items-center justify-between">
                  <span className="text-sm">{formatPrice(selectedPriceRange[0])}</span>
                  <span className="text-sm">{formatPrice(selectedPriceRange[1])}</span>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
          
          {/* Property Type Filter */}
          {propertyTypes.length > 0 && (
            <AccordionItem value="type">
              <AccordionTrigger>Property Type</AccordionTrigger>
              <AccordionContent>
                <div className="grid grid-cols-1 gap-2 pt-2">
                  {propertyTypes.map(type => (
                    <div key={type.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`type-${type.id}`}
                        checked={selectedPropertyTypes.includes(type.id)}
                        onCheckedChange={() => handlePropertyTypeToggle(type.id)}
                      />
                      <Label
                        htmlFor={`type-${type.id}`}
                        className="text-sm cursor-pointer"
                      >
                        {type.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          )}
          
          {/* Amenities Filter */}
          {amenities.length > 0 && (
            <AccordionItem value="amenities">
              <AccordionTrigger>Amenities</AccordionTrigger>
              <AccordionContent>
                <div className="grid grid-cols-1 gap-2 pt-2">
                  {amenities.map(amenity => (
                    <div key={amenity.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`amenity-${amenity.id}`}
                        checked={selectedAmenities.includes(amenity.id)}
                        onCheckedChange={() => handleAmenityToggle(amenity.id)}
                      />
                      <Label
                        htmlFor={`amenity-${amenity.id}`}
                        className="text-sm cursor-pointer"
                      >
                        {amenity.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          )}
          
          {/* Locations Filter */}
          {locations.length > 0 && (
            <AccordionItem value="locations">
              <AccordionTrigger>Locations</AccordionTrigger>
              <AccordionContent>
                <div className="grid grid-cols-1 gap-2 pt-2">
                  {locations.map(location => (
                    <div key={location.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`location-${location.id}`}
                        checked={selectedLocations.includes(location.id)}
                        onCheckedChange={() => handleLocationToggle(location.id)}
                      />
                      <Label
                        htmlFor={`location-${location.id}`}
                        className="text-sm cursor-pointer"
                      >
                        {location.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          )}
        </Accordion>
        
        {onResetFilters && (
          <Button
            variant="outline"
            className="w-full mt-4"
            onClick={onResetFilters}
          >
            <Filter className="mr-2 h-4 w-4" />
            Reset All Filters
          </Button>
        )}
      </CardContent>
    </Card>
  )
} 