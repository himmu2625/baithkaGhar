"use client"

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react"
import { useOSAuth } from "@/hooks/use-os-auth"

interface OSProperty {
  id: string
  name: string
  address: any
  verificationStatus: string
}

interface OSPropertyContextType {
  currentProperty: OSProperty | null
  setCurrentProperty: (property: OSProperty | null) => void
  isLoading: boolean
}

const OSPropertyContext = createContext<OSPropertyContextType | undefined>(
  undefined
)

export function OSPropertyProvider({ children }: { children: ReactNode }) {
  const { user, isAuthenticated, isLoading: authLoading } = useOSAuth()
  const [currentProperty, setCurrentProperty] = useState<OSProperty | null>(
    null
  )
  const [isLoading, setIsLoading] = useState(true)

  // Set property from authenticated user
  useEffect(() => {
    if (!authLoading) {
      if (isAuthenticated && user?.property) {
        setCurrentProperty(user.property)
      } else {
        setCurrentProperty(null)
      }
      setIsLoading(false)
    }
  }, [user, isAuthenticated, authLoading])

  return (
    <OSPropertyContext.Provider
      value={{
        currentProperty,
        setCurrentProperty,
        isLoading: isLoading || authLoading,
      }}
    >
      {children}
    </OSPropertyContext.Provider>
  )
}

export function useOSProperty() {
  const context = useContext(OSPropertyContext)
  if (context === undefined) {
    throw new Error("useOSProperty must be used within an OSPropertyProvider")
  }
  return context
}
