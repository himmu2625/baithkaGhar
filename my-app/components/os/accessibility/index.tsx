"use client"

// Keyboard Navigation
export {
  useKeyboardNavigation,
  FocusableWrapper,
  KeyboardShortcutsModal,
  NavigationModeIndicator,
} from "./keyboard-navigation"

// Screen Reader Support
export {
  LiveRegion,
  useScreenReaderAnnouncement,
  SkipLink,
  FocusTrap,
  getAriaLabel,
  getAriaDescribedBy,
  AccessibleField,
  AccessibleButton,
  AccessibleTable,
  AccessibleModal,
} from "./screen-reader-support"

// Focus Indicators & High Contrast
export {
  useHighContrastMode,
  FocusIndicator,
  HighContrastProvider,
  useFocusManagement,
  useFocusVisible,
  AccessibleFocusButton,
  AccessibleFocusTrap,
  SkipToContent,
  withFocusIndicator,
  HighContrastToggle,
  focusIndicatorStyles,
} from "./focus-indicators"

// User Onboarding
export {
  OnboardingProvider,
  useOnboarding,
  OnboardingOverlay,
  GuidedTour,
  InteractiveTooltip,
  OnboardingProgress,
  onboardingFlows,
  OnboardingTrigger,
} from "./user-onboarding"

// Help & Documentation
export {
  HelpProvider,
  useHelp,
  HelpModal,
  HelpTrigger,
  QuickHelp,
} from "./help-documentation"

// Local imports for provider composition and utils
import React from "react"
import { HighContrastProvider, focusIndicatorStyles } from "./focus-indicators"
import { OnboardingProvider } from "./user-onboarding"
import { HelpProvider } from "./help-documentation"
import { getAriaLabel, getAriaDescribedBy } from "./screen-reader-support"

// Accessibility utilities
export const accessibilityUtils = {
  // ARIA utilities
  getAriaLabel,
  getAriaDescribedBy,

  // Focus utilities
  focusIndicatorStyles,

  // Screen reader utilities
  announce: (message: string, priority: "polite" | "assertive" = "polite") => {
    // This would be implemented with the screen reader announcement hook
    // Kept as a no-op console log helper for now
    // eslint-disable-next-line no-console
    console.log(`Screen reader announcement: ${message} (${priority})`)
  },

  // Keyboard navigation utilities (stub)
  registerShortcut: (shortcut: any) => {
    // eslint-disable-next-line no-console
    console.log("Registering keyboard shortcut:", shortcut)
  },

  // High contrast utilities
  isHighContrast: () => {
    if (typeof window !== "undefined") {
      return window.matchMedia("(prefers-contrast: high)").matches
    }
    return false
  },

  // Reduced motion utilities
  isReducedMotion: () => {
    if (typeof window !== "undefined") {
      return window.matchMedia("(prefers-reduced-motion: reduce)").matches
    }
    return false
  },
}

// Accessibility provider that combines all providers
export const AccessibilityProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  return (
    <HighContrastProvider>
      <OnboardingProvider>
        <HelpProvider>{children}</HelpProvider>
      </OnboardingProvider>
    </HighContrastProvider>
  )
}
