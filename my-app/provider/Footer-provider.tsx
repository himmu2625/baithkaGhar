"use client"

import React, { createContext, useContext, useState, ReactNode } from "react"

interface FooterContextType {
  showFooter: boolean
  setShowFooter: (show: boolean) => void
}

const FooterContext = createContext<FooterContextType | undefined>(undefined)

export function FooterProvider({ children }: { children: ReactNode }) {
  const [showFooter, setShowFooter] = useState(true)

  return (
    <FooterContext.Provider value={{ showFooter, setShowFooter }}>
      {children}
    </FooterContext.Provider>
  )
}

export function useFooter() {
  const context = useContext(FooterContext)
  if (context === undefined) {
    throw new Error("useFooter must be used within a FooterProvider")
  }
  return context
} 