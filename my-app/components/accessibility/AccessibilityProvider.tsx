'use client'

import React, { createContext, useContext, useEffect } from 'react'
import { useAccessibility } from '@/hooks/useAccessibility'

const AccessibilityContext = createContext<ReturnType<typeof useAccessibility> | undefined>(undefined)

interface AccessibilityProviderProps {
  children: React.ReactNode
}

export function AccessibilityProvider({ children }: AccessibilityProviderProps) {
  const accessibilityState = useAccessibility()

  useEffect(() => {
    // Add global accessibility styles
    const style = document.createElement('style')
    style.textContent = `
      /* Screen reader only content */
      .sr-only {
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        white-space: nowrap;
        border: 0;
      }

      /* High contrast mode styles */
      .high-contrast {
        --bg-primary: #000000;
        --text-primary: #ffffff;
        --bg-secondary: #ffffff;
        --text-secondary: #000000;
        --border-color: #ffffff;
        --focus-color: #ffff00;
      }

      .high-contrast * {
        background-color: var(--bg-primary) !important;
        color: var(--text-primary) !important;
        border-color: var(--border-color) !important;
      }

      .high-contrast button,
      .high-contrast input,
      .high-contrast select,
      .high-contrast textarea {
        background-color: var(--bg-secondary) !important;
        color: var(--text-secondary) !important;
        border: 2px solid var(--border-color) !important;
      }

      .high-contrast *:focus {
        outline: 3px solid var(--focus-color) !important;
        outline-offset: 2px !important;
      }

      /* Large text mode */
      .large-text {
        font-size: 1.25em !important;
      }

      .large-text h1 { font-size: 2.5em !important; }
      .large-text h2 { font-size: 2em !important; }
      .large-text h3 { font-size: 1.75em !important; }
      .large-text h4 { font-size: 1.5em !important; }
      .large-text h5 { font-size: 1.25em !important; }
      .large-text h6 { font-size: 1.125em !important; }

      /* Reduced motion */
      @media (prefers-reduced-motion: reduce) {
        *,
        *::before,
        *::after {
          animation-duration: 0.01ms !important;
          animation-iteration-count: 1 !important;
          transition-duration: 0.01ms !important;
          scroll-behavior: auto !important;
        }
      }

      [data-motion-reduce="1"] *,
      [data-motion-reduce="1"] *::before,
      [data-motion-reduce="1"] *::after {
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.01ms !important;
        scroll-behavior: auto !important;
      }

      /* Focus indicators for keyboard navigation */
      .keyboard-navigation *:focus {
        outline: 2px solid #2563eb !important;
        outline-offset: 2px !important;
      }

      .keyboard-navigation button:focus,
      .keyboard-navigation [role="button"]:focus {
        box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.3) !important;
      }

      .focus-indicators *:focus-visible {
        outline: 2px solid #2563eb !important;
        outline-offset: 2px !important;
      }

      /* Touch targets */
      @media (hover: none) and (pointer: coarse) {
        button,
        [role="button"],
        a,
        input,
        select,
        textarea {
          min-height: 44px !important;
          min-width: 44px !important;
        }
      }

      /* Skip links */
      .skip-link {
        position: absolute;
        top: -40px;
        left: 6px;
        background: #000;
        color: #fff;
        padding: 8px;
        text-decoration: none;
        border-radius: 4px;
        z-index: 9999;
      }

      .skip-link:focus {
        top: 6px;
      }

      /* Error states */
      [aria-invalid="true"] {
        border-color: #dc2626 !important;
        box-shadow: 0 0 0 1px #dc2626 !important;
      }

      /* Loading states */
      [aria-busy="true"] {
        cursor: wait;
        opacity: 0.7;
      }

      /* Disabled states */
      [aria-disabled="true"],
      :disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      /* Live regions */
      [aria-live] {
        position: absolute;
        left: -10000px;
        width: 1px;
        height: 1px;
        overflow: hidden;
      }
    `

    document.head.appendChild(style)

    return () => {
      document.head.removeChild(style)
    }
  }, [])

  return (
    <AccessibilityContext.Provider value={accessibilityState}>
      {/* Skip navigation links */}
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      <a href="#navigation" className="skip-link">
        Skip to navigation
      </a>

      {/* Global aria-live region for announcements */}
      <div
        id="aria-live-announcements"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      />

      {children}
    </AccessibilityContext.Provider>
  )
}

export function useAccessibilityContext() {
  const context = useContext(AccessibilityContext)
  if (context === undefined) {
    throw new Error('useAccessibilityContext must be used within an AccessibilityProvider')
  }
  return context
}