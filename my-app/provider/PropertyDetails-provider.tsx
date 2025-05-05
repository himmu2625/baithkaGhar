"use client"

import React, { createContext, useContext, useState, ReactNode } from "react"

interface Property {
  id: string
  name: string
  price: number
  location: string
  images: string[]
  description: string
}

interface PropertyDetailsContextType {
  currentProperty: Property | null
  setCurrentProperty: (property: Property | null) => void
}

const PropertyDetailsContext = createContext<PropertyDetailsContextType | undefined>(undefined)

export function PropertyDetailsProvider({ children }: { children: ReactNode }) {
  const [currentProperty, setCurrentProperty] = useState<Property | null>(null)

  return (
    <PropertyDetailsContext.Provider value={{ currentProperty, setCurrentProperty }}>
      {children}
    </PropertyDetailsContext.Provider>
  )
}

export function usePropertyDetails() {
  const context = useContext(PropertyDetailsContext)
  if (context === undefined) {
    throw new Error("usePropertyDetails must be used within a PropertyDetailsProvider")
  }
  return context
} 