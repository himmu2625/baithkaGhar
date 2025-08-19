"use client"

import React, { useEffect, useState } from "react"

// Focus indicator styles
export const focusIndicatorStyles = {
  default:
    "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
  highContrast:
    "focus:outline-none focus:ring-4 focus:ring-yellow-400 focus:ring-offset-4",
  reducedMotion:
    "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-opacity-75",
}

// High contrast mode hook
export const useHighContrastMode = () => {
  const [isHighContrast, setIsHighContrast] = useState(false)
  const [isReducedMotion, setIsReducedMotion] = useState(false)

  useEffect(() => {
    // Check for user preferences
    const mediaQueryHighContrast = window.matchMedia("(prefers-contrast: high)")
    const mediaQueryReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    )

    const updatePreferences = () => {
      setIsHighContrast(mediaQueryHighContrast.matches)
      setIsReducedMotion(mediaQueryReducedMotion.matches)
    }

    updatePreferences()

    mediaQueryHighContrast.addEventListener("change", updatePreferences)
    mediaQueryReducedMotion.addEventListener("change", updatePreferences)

    return () => {
      mediaQueryHighContrast.removeEventListener("change", updatePreferences)
      mediaQueryReducedMotion.removeEventListener("change", updatePreferences)
    }
  }, [])

  return { isHighContrast, isReducedMotion }
}

// Focus indicator component
interface FocusIndicatorProps {
  children: React.ReactNode
  className?: string
  variant?: "default" | "highContrast" | "reducedMotion"
}

export const FocusIndicator: React.FC<FocusIndicatorProps> = ({
  children,
  className = "",
  variant = "default",
}) => {
  const { isHighContrast, isReducedMotion } = useHighContrastMode()

  let focusClass = focusIndicatorStyles.default

  if (isHighContrast || variant === "highContrast") {
    focusClass = focusIndicatorStyles.highContrast
  } else if (isReducedMotion || variant === "reducedMotion") {
    focusClass = focusIndicatorStyles.reducedMotion
  }

  return <div className={`${focusClass} ${className}`}>{children}</div>
}

// High contrast mode provider
interface HighContrastProviderProps {
  children: React.ReactNode
}

export const HighContrastProvider: React.FC<HighContrastProviderProps> = ({
  children,
}) => {
  const { isHighContrast, isReducedMotion } = useHighContrastMode()

  return (
    <div
      className={`${isHighContrast ? "high-contrast" : ""} ${
        isReducedMotion ? "reduced-motion" : ""
      }`}
      style={
        {
          "--focus-ring-color": isHighContrast ? "#fbbf24" : "#3b82f6",
          "--focus-ring-width": isHighContrast ? "4px" : "2px",
          "--focus-ring-offset": isHighContrast ? "4px" : "2px",
        } as React.CSSProperties
      }
    >
      {children}
    </div>
  )
}

// Accessible focus management
export const useFocusManagement = () => {
  const [focusedElement, setFocusedElement] = useState<HTMLElement | null>(null)

  const focusElement = (element: HTMLElement) => {
    element.focus()
    setFocusedElement(element)
  }

  const focusFirstElement = (container: HTMLElement) => {
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )

    if (focusableElements.length > 0) {
      focusElement(focusableElements[0] as HTMLElement)
    }
  }

  const focusLastElement = (container: HTMLElement) => {
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )

    if (focusableElements.length > 0) {
      focusElement(
        focusableElements[focusableElements.length - 1] as HTMLElement
      )
    }
  }

  return {
    focusedElement,
    focusElement,
    focusFirstElement,
    focusLastElement,
  }
}

// Focus visible utility
export const useFocusVisible = () => {
  const [isFocusVisible, setIsFocusVisible] = useState(false)

  useEffect(() => {
    const handleFocusVisible = (e: FocusEvent) => {
      setIsFocusVisible(true)
    }

    const handleFocusInvisible = () => {
      setIsFocusVisible(false)
    }

    document.addEventListener("focusin", handleFocusVisible)
    document.addEventListener("focusout", handleFocusInvisible)

    return () => {
      document.removeEventListener("focusin", handleFocusVisible)
      document.removeEventListener("focusout", handleFocusInvisible)
    }
  }, [])

  return isFocusVisible
}

// Accessible button with focus management
interface AccessibleFocusButtonProps {
  children: React.ReactNode
  onClick?: () => void
  onFocus?: () => void
  onBlur?: () => void
  className?: string
  "aria-label"?: string
  "aria-describedby"?: string
}

export const AccessibleFocusButton: React.FC<AccessibleFocusButtonProps> = ({
  children,
  onClick,
  onFocus,
  onBlur,
  className = "",
  "aria-label": ariaLabel,
  "aria-describedby": ariaDescribedby,
}) => {
  const isFocusVisible = useFocusVisible()

  return (
    <FocusIndicator>
      <button
        onClick={onClick}
        onFocus={onFocus}
        onBlur={onBlur}
        aria-label={ariaLabel}
        aria-describedby={ariaDescribedby}
        className={`${className} ${isFocusVisible ? "focus-visible" : ""}`}
      >
        {children}
      </button>
    </FocusIndicator>
  )
}

// Focus trap with high contrast support
interface AccessibleFocusTrapProps {
  children: React.ReactNode
  isActive?: boolean
  onEscape?: () => void
  className?: string
}

export const AccessibleFocusTrap: React.FC<AccessibleFocusTrapProps> = ({
  children,
  isActive = true,
  onEscape,
  className = "",
}) => {
  const { isHighContrast } = useHighContrastMode()

  return (
    <div
      className={`${className} ${
        isHighContrast ? "high-contrast-focus-trap" : ""
      }`}
      style={
        {
          "--focus-trap-border": isHighContrast
            ? "3px solid #fbbf24"
            : "2px solid #3b82f6",
        } as React.CSSProperties
      }
    >
      {children}
    </div>
  )
}

// Skip to content link
export const SkipToContent: React.FC<{
  targetId: string
  children: React.ReactNode
}> = ({ targetId, children }) => {
  const { isHighContrast } = useHighContrastMode()

  return (
    <a
      href={`#${targetId}`}
      className={`sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:rounded focus:outline-none ${
        isHighContrast
          ? "focus:bg-yellow-400 focus:text-black focus:ring-4 focus:ring-yellow-400"
          : "focus:bg-blue-600 focus:text-white focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      }`}
    >
      {children}
    </a>
  )
}

// Focus indicator for custom components
export const withFocusIndicator = <P extends object>(
  Component: React.ComponentType<P>
) => {
  return React.forwardRef<HTMLElement, P>((props, ref) => {
    const { isHighContrast } = useHighContrastMode()

    return (
      <FocusIndicator variant={isHighContrast ? "highContrast" : "default"}>
        <Component {...props} ref={ref} />
      </FocusIndicator>
    )
  })
}

// High contrast mode toggle
export const HighContrastToggle: React.FC = () => {
  const [isEnabled, setIsEnabled] = useState(false)
  const { isHighContrast } = useHighContrastMode()

  const toggleHighContrast = () => {
    setIsEnabled(!isEnabled)
    document.documentElement.classList.toggle("high-contrast-mode")
  }

  return (
    <AccessibleFocusButton
      onClick={toggleHighContrast}
      aria-label={`${isEnabled ? "Disable" : "Enable"} high contrast mode`}
      className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
        isEnabled || isHighContrast
          ? "bg-yellow-400 text-black"
          : "bg-gray-200 text-gray-700 hover:bg-gray-300"
      }`}
    >
      <span className="flex items-center space-x-2">
        <span className="w-4 h-4 border-2 border-current rounded-full" />
        <span>High Contrast</span>
      </span>
    </AccessibleFocusButton>
  )
}
