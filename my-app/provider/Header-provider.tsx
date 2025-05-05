"use client"

import React, { createContext, useContext, useState, ReactNode } from "react"

interface HeaderContextType {
  isTransparent: boolean
  setIsTransparent: (isTransparent: boolean) => void
  isScrolled: boolean
  setIsScrolled: (isScrolled: boolean) => void
}

const HeaderContext = createContext<HeaderContextType | undefined>(undefined)

export function HeaderProvider({ children }: { children: ReactNode }) {
  const [isTransparent, setIsTransparent] = useState(true)
  const [isScrolled, setIsScrolled] = useState(false)

  return (
    <HeaderContext.Provider value={{ isTransparent, setIsTransparent, isScrolled, setIsScrolled }}>
      {children}
    </HeaderContext.Provider>
  )
}

export function useHeader() {
  const context = useContext(HeaderContext)
  if (context === undefined) {
    throw new Error("useHeader must be used within a HeaderProvider")
  }
  return context
} 