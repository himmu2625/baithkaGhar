'use client'

import { useEffect, useRef, useState, useCallback } from 'react'

export interface AccessibilityPreferences {
  reducedMotion: boolean
  highContrast: boolean
  largeText: boolean
  screenReader: boolean
  keyboardNavigation: boolean
  focusIndicators: boolean
}

export function useAccessibility() {
  const [preferences, setPreferences] = useState<AccessibilityPreferences>({
    reducedMotion: false,
    highContrast: false,
    largeText: false,
    screenReader: false,
    keyboardNavigation: false,
    focusIndicators: true
  })

  const [isKeyboardUser, setIsKeyboardUser] = useState(false)
  const lastInteractionRef = useRef<'mouse' | 'keyboard'>('mouse')

  useEffect(() => {
    // Load accessibility preferences from localStorage
    const saved = localStorage.getItem('accessibility-preferences')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        setPreferences(prev => ({ ...prev, ...parsed }))
      } catch (error) {
        console.warn('Failed to parse accessibility preferences:', error)
      }
    }

    // Detect system preferences
    const detectSystemPreferences = () => {
      if (typeof window === 'undefined') return

      // Detect reduced motion preference
      const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

      // Detect high contrast preference
      const highContrast = window.matchMedia('(prefers-contrast: high)').matches

      // Detect large text preference
      const largeText = window.matchMedia('(min-resolution: 144dpi)').matches

      setPreferences(prev => ({
        ...prev,
        reducedMotion: reducedMotion || prev.reducedMotion,
        highContrast: highContrast || prev.highContrast,
        largeText: largeText || prev.largeText
      }))
    }

    detectSystemPreferences()

    // Listen for system preference changes
    const mediaQueries = [
      window.matchMedia('(prefers-reduced-motion: reduce)'),
      window.matchMedia('(prefers-contrast: high)')
    ]

    const handleMediaChange = () => detectSystemPreferences()

    mediaQueries.forEach(mq => {
      mq.addEventListener('change', handleMediaChange)
    })

    return () => {
      mediaQueries.forEach(mq => {
        mq.removeEventListener('change', handleMediaChange)
      })
    }
  }, [])

  useEffect(() => {
    // Detect keyboard vs mouse usage
    const handleMouseDown = () => {
      lastInteractionRef.current = 'mouse'
      setIsKeyboardUser(false)
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        lastInteractionRef.current = 'keyboard'
        setIsKeyboardUser(true)
      }
    }

    document.addEventListener('mousedown', handleMouseDown)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('mousedown', handleMouseDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  useEffect(() => {
    // Apply accessibility styles to document
    const root = document.documentElement

    if (preferences.reducedMotion) {
      root.style.setProperty('--motion-reduce', '1')
    } else {
      root.style.removeProperty('--motion-reduce')
    }

    if (preferences.highContrast) {
      root.classList.add('high-contrast')
    } else {
      root.classList.remove('high-contrast')
    }

    if (preferences.largeText) {
      root.classList.add('large-text')
    } else {
      root.classList.remove('large-text')
    }

    if (preferences.keyboardNavigation || isKeyboardUser) {
      root.classList.add('keyboard-navigation')
    } else {
      root.classList.remove('keyboard-navigation')
    }

    if (preferences.focusIndicators) {
      root.classList.add('focus-indicators')
    } else {
      root.classList.remove('focus-indicators')
    }
  }, [preferences, isKeyboardUser])

  const updatePreference = useCallback((key: keyof AccessibilityPreferences, value: boolean) => {
    setPreferences(prev => {
      const updated = { ...prev, [key]: value }
      localStorage.setItem('accessibility-preferences', JSON.stringify(updated))
      return updated
    })
  }, [])

  const announceToScreenReader = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    if (typeof window === 'undefined') return

    const announcement = document.createElement('div')
    announcement.setAttribute('aria-live', priority)
    announcement.setAttribute('aria-atomic', 'true')
    announcement.className = 'sr-only'
    announcement.textContent = message

    document.body.appendChild(announcement)

    setTimeout(() => {
      document.body.removeChild(announcement)
    }, 1000)
  }, [])

  return {
    preferences,
    updatePreference,
    isKeyboardUser,
    announceToScreenReader
  }
}

export function useFocusManagement() {
  const focusableElementsSelector = [
    'button',
    '[href]',
    'input',
    'select',
    'textarea',
    '[tabindex]:not([tabindex="-1"])',
    'details'
  ].join(', ')

  const trapFocus = useCallback((container: HTMLElement) => {
    const focusableElements = container.querySelectorAll(focusableElementsSelector) as NodeListOf<HTMLElement>
    const firstElement = focusableElements[0]
    const lastElement = focusableElements[focusableElements.length - 1]

    const handleTabKeyPress = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          lastElement.focus()
          e.preventDefault()
        }
      } else {
        if (document.activeElement === lastElement) {
          firstElement.focus()
          e.preventDefault()
        }
      }
    }

    container.addEventListener('keydown', handleTabKeyPress)

    // Focus first element
    firstElement?.focus()

    return () => {
      container.removeEventListener('keydown', handleTabKeyPress)
    }
  }, [])

  const restoreFocus = useCallback((element: HTMLElement | null) => {
    if (element && typeof element.focus === 'function') {
      element.focus()
    }
  }, [])

  return {
    trapFocus,
    restoreFocus
  }
}

export function useAriaAnnouncements() {
  const announce = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    if (typeof window === 'undefined') return

    // Create or update aria-live region
    let liveRegion = document.getElementById('aria-live-announcements')
    if (!liveRegion) {
      liveRegion = document.createElement('div')
      liveRegion.id = 'aria-live-announcements'
      liveRegion.setAttribute('aria-live', priority)
      liveRegion.setAttribute('aria-atomic', 'true')
      liveRegion.className = 'sr-only'
      document.body.appendChild(liveRegion)
    }

    liveRegion.textContent = message

    // Clear the message after announcement
    setTimeout(() => {
      if (liveRegion) {
        liveRegion.textContent = ''
      }
    }, 1000)
  }, [])

  return { announce }
}

export function useKeyboardNavigation() {
  const handleKeyNavigation = useCallback((
    e: React.KeyboardEvent,
    options: {
      onEnter?: () => void
      onSpace?: () => void
      onEscape?: () => void
      onArrowUp?: () => void
      onArrowDown?: () => void
      onArrowLeft?: () => void
      onArrowRight?: () => void
    }
  ) => {
    switch (e.key) {
      case 'Enter':
        if (options.onEnter) {
          e.preventDefault()
          options.onEnter()
        }
        break
      case ' ':
      case 'Space':
        if (options.onSpace) {
          e.preventDefault()
          options.onSpace()
        }
        break
      case 'Escape':
        if (options.onEscape) {
          e.preventDefault()
          options.onEscape()
        }
        break
      case 'ArrowUp':
        if (options.onArrowUp) {
          e.preventDefault()
          options.onArrowUp()
        }
        break
      case 'ArrowDown':
        if (options.onArrowDown) {
          e.preventDefault()
          options.onArrowDown()
        }
        break
      case 'ArrowLeft':
        if (options.onArrowLeft) {
          e.preventDefault()
          options.onArrowLeft()
        }
        break
      case 'ArrowRight':
        if (options.onArrowRight) {
          e.preventDefault()
          options.onArrowRight()
        }
        break
    }
  }, [])

  return { handleKeyNavigation }
}