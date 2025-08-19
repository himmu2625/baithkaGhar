"use client"

import React, { createContext, useContext, useEffect, useState } from "react"
import { cssVariables, theme } from "@/lib/theme"

type ThemeMode = "light" | "dark" | "system"

interface ThemeContextType {
  mode: ThemeMode
  isDark: boolean
  setMode: (mode: ThemeMode) => void
  toggleMode: () => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

interface ThemeProviderProps {
  children: React.ReactNode
  defaultMode?: ThemeMode
  storageKey?: string
}

export function ThemeProvider({
  children,
  defaultMode = "system",
  storageKey = "baithaka-theme-mode",
}: ThemeProviderProps) {
  const [mode, setMode] = useState<ThemeMode>(defaultMode)
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    // Load theme from localStorage
    const savedMode = localStorage.getItem(storageKey) as ThemeMode
    if (savedMode) {
      setMode(savedMode)
    }
  }, [storageKey])

  useEffect(() => {
    const root = window.document.documentElement

    // Remove existing theme classes
    root.classList.remove("light", "dark")

    let currentMode = mode

    if (mode === "system") {
      currentMode = window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light"
    }

    // Apply theme
    root.classList.add(currentMode)
    setIsDark(currentMode === "dark")

    // Apply CSS variables
    const variables =
      currentMode === "dark" ? cssVariables.dark : cssVariables.light
    Object.entries(variables).forEach(([key, value]) => {
      root.style.setProperty(key, value)
    })

    // Save to localStorage
    localStorage.setItem(storageKey, mode)
  }, [mode, storageKey])

  useEffect(() => {
    // Listen for system theme changes
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)")

    const handleChange = () => {
      if (mode === "system") {
        const newMode = mediaQuery.matches ? "dark" : "light"
        const root = window.document.documentElement
        root.classList.remove("light", "dark")
        root.classList.add(newMode)
        setIsDark(newMode === "dark")

        const variables =
          newMode === "dark" ? cssVariables.dark : cssVariables.light
        Object.entries(variables).forEach(([key, value]) => {
          root.style.setProperty(key, value)
        })
      }
    }

    mediaQuery.addEventListener("change", handleChange)
    return () => mediaQuery.removeEventListener("change", handleChange)
  }, [mode])

  const setThemeMode = (newMode: ThemeMode) => {
    setMode(newMode)
  }

  const toggleMode = () => {
    setMode((prev) => {
      if (prev === "light") return "dark"
      if (prev === "dark") return "system"
      return "light"
    })
  }

  return (
    <ThemeContext.Provider
      value={{ mode, isDark, setMode: setThemeMode, toggleMode }}
    >
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider")
  }
  return context
}

// Theme-aware component wrapper
export function withTheme<P extends object>(Component: React.ComponentType<P>) {
  return function ThemedComponent(props: P) {
    const { isDark } = useTheme()
    return <Component {...props} isDark={isDark} />
  }
}

// CSS-in-JS helper for theme-aware styles
export function createThemedStyles<T extends Record<string, any>>(
  styles: (theme: any, isDark: boolean) => T
) {
  return (isDark: boolean) => styles(theme, isDark)
}

// Theme-aware className helper
export function themedClassNames(
  baseClasses: string,
  lightClasses: string = "",
  darkClasses: string = ""
) {
  return `${baseClasses} ${lightClasses} dark:${darkClasses}`
}
