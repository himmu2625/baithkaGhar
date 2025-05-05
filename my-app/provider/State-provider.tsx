"use client"

import React, { createContext, useContext, useState, ReactNode } from "react"

interface StateContextType {
  // Add state properties as needed
  someState: string
  updateSomeState: (value: string) => void
}

const StateContext = createContext<StateContextType | undefined>(undefined)

export function StateProvider({ children }: { children: ReactNode }) {
  const [someState, setSomeState] = useState("")

  const updateSomeState = (value: string) => {
    setSomeState(value)
  }

  return (
    <StateContext.Provider value={{ someState, updateSomeState }}>
      {children}
    </StateContext.Provider>
  )
}

export function useAppState() {
  const context = useContext(StateContext)
  if (context === undefined) {
    throw new Error("useAppState must be used within a StateProvider")
  }
  return context
} 