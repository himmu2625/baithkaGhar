"use client"

import React, { useEffect, useRef, useState, useCallback } from "react"
import { useRouter, usePathname } from "next/navigation"

interface KeyboardShortcut {
  key: string
  ctrl?: boolean
  shift?: boolean
  alt?: boolean
  description: string
  action: () => void
}

interface FocusableElement {
  id: string
  element: HTMLElement
  priority: number
}

export const useKeyboardNavigation = () => {
  const [shortcuts, setShortcuts] = useState<KeyboardShortcut[]>([])
  const [focusableElements, setFocusableElements] = useState<
    FocusableElement[]
  >([])
  const [isNavigationMode, setIsNavigationMode] = useState(false)
  const router = useRouter()
  const pathname = usePathname()

  // Register a keyboard shortcut
  const registerShortcut = useCallback((shortcut: KeyboardShortcut) => {
    setShortcuts((prev) => [...prev, shortcut])
  }, [])

  // Unregister a keyboard shortcut
  const unregisterShortcut = useCallback((key: string) => {
    setShortcuts((prev) => prev.filter((s) => s.key !== key))
  }, [])

  // Register a focusable element
  const registerFocusableElement = useCallback(
    (id: string, element: HTMLElement, priority: number = 0) => {
      setFocusableElements((prev) => [...prev, { id, element, priority }])
    },
    []
  )

  // Unregister a focusable element
  const unregisterFocusableElement = useCallback((id: string) => {
    setFocusableElements((prev) => prev.filter((f) => f.id !== id))
  }, [])

  // Focus management
  const focusElement = useCallback(
    (id: string) => {
      const element = focusableElements.find((f) => f.id === id)
      if (element) {
        element.element.focus()
      }
    },
    [focusableElements]
  )

  const focusNext = useCallback(() => {
    const sortedElements = [...focusableElements].sort(
      (a, b) => a.priority - b.priority
    )
    const currentIndex = sortedElements.findIndex(
      (f) => f.element === document.activeElement
    )
    const nextIndex = (currentIndex + 1) % sortedElements.length
    sortedElements[nextIndex]?.element.focus()
  }, [focusableElements])

  const focusPrevious = useCallback(() => {
    const sortedElements = [...focusableElements].sort(
      (a, b) => a.priority - b.priority
    )
    const currentIndex = sortedElements.findIndex(
      (f) => f.element === document.activeElement
    )
    const prevIndex =
      currentIndex === 0 ? sortedElements.length - 1 : currentIndex - 1
    sortedElements[prevIndex]?.element.focus()
  }, [focusableElements])

  // Handle keyboard events
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Check for shortcuts
      const matchingShortcut = shortcuts.find(
        (s) =>
          s.key === event.key &&
          !!s.ctrl === event.ctrlKey &&
          !!s.shift === event.shiftKey &&
          !!s.alt === event.altKey
      )

      if (matchingShortcut) {
        event.preventDefault()
        matchingShortcut.action()
        return
      }

      // Navigation mode shortcuts
      if (isNavigationMode) {
        switch (event.key) {
          case "Tab":
            event.preventDefault()
            if (event.shiftKey) {
              focusPrevious()
            } else {
              focusNext()
            }
            break
          case "Escape":
            setIsNavigationMode(false)
            break
          case "h":
          case "H":
            event.preventDefault()
            router.push("/os/dashboard")
            break
          case "i":
          case "I":
            event.preventDefault()
            router.push("/os/inventory")
            break
          case "b":
          case "B":
            event.preventDefault()
            router.push("/os/bookings")
            break
          case "f":
          case "F":
            event.preventDefault()
            router.push("/os/financial")
            break
          case "s":
          case "S":
            event.preventDefault()
            router.push("/os/staff")
            break
          case "r":
          case "R":
            event.preventDefault()
            router.push("/os/reports")
            break
        }
      }

      // Global shortcuts
      if (event.ctrlKey || event.metaKey) {
        switch (event.key) {
          case "k":
            event.preventDefault()
            // Open search
            break
          case "b":
            event.preventDefault()
            // Toggle sidebar
            break
          case "n":
            event.preventDefault()
            // New booking
            break
          case "s":
            event.preventDefault()
            // Save
            break
        }
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [shortcuts, isNavigationMode, router, focusNext, focusPrevious])

  return {
    registerShortcut,
    unregisterShortcut,
    registerFocusableElement,
    unregisterFocusableElement,
    focusElement,
    focusNext,
    focusPrevious,
    isNavigationMode,
    setIsNavigationMode,
  }
}

// Focusable wrapper component
interface FocusableWrapperProps {
  id: string
  priority?: number
  children: React.ReactNode
  className?: string
  tabIndex?: number
}

export const FocusableWrapper: React.FC<FocusableWrapperProps> = ({
  id,
  priority = 0,
  children,
  className = "",
  tabIndex = 0,
}) => {
  const elementRef = useRef<HTMLDivElement>(null)
  const { registerFocusableElement, unregisterFocusableElement } =
    useKeyboardNavigation()

  useEffect(() => {
    if (elementRef.current) {
      registerFocusableElement(id, elementRef.current, priority)
    }

    return () => {
      unregisterFocusableElement(id)
    }
  }, [id, priority, registerFocusableElement, unregisterFocusableElement])

  return (
    <div
      ref={elementRef}
      className={className}
      tabIndex={tabIndex}
      role="button"
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault()
          elementRef.current?.click()
        }
      }}
    >
      {children}
    </div>
  )
}

// Keyboard shortcuts help modal
interface KeyboardShortcutsModalProps {
  isOpen: boolean
  onClose: () => void
}

export const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const shortcuts = [
    { key: "Ctrl + K", description: "Open search" },
    { key: "Ctrl + B", description: "Toggle sidebar" },
    { key: "Ctrl + N", description: "New booking" },
    { key: "Ctrl + S", description: "Save" },
    { key: "Tab", description: "Navigate between elements" },
    { key: "Shift + Tab", description: "Navigate backwards" },
    { key: "Enter/Space", description: "Activate element" },
    { key: "Escape", description: "Close modal/cancel" },
    { key: "H", description: "Go to Dashboard" },
    { key: "I", description: "Go to Inventory" },
    { key: "B", description: "Go to Bookings" },
    { key: "F", description: "Go to Financial" },
    { key: "S", description: "Go to Staff" },
    { key: "R", description: "Go to Reports" },
  ]

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4 max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Keyboard Shortcuts
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="space-y-3">
          {shortcuts.map((shortcut, index) => (
            <div
              key={index}
              className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700"
            >
              <span className="text-gray-700 dark:text-gray-300">
                {shortcut.description}
              </span>
              <kbd className="px-2 py-1 text-sm bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded">
                {shortcut.key}
              </kbd>
            </div>
          ))}
        </div>

        <div className="mt-6 text-sm text-gray-600 dark:text-gray-400">
          <p>
            Press{" "}
            <kbd className="px-1 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">
              ?
            </kbd>{" "}
            to show this help anytime.
          </p>
        </div>
      </div>
    </div>
  )
}

// Navigation mode indicator
export const NavigationModeIndicator: React.FC = () => {
  const { isNavigationMode } = useKeyboardNavigation()

  if (!isNavigationMode) return null

  return (
    <div className="fixed bottom-4 right-4 bg-blue-500 text-white px-3 py-2 rounded-lg shadow-lg z-50">
      <div className="flex items-center space-x-2">
        <span className="text-sm font-medium">Navigation Mode</span>
        <kbd className="px-1 py-0.5 bg-blue-600 rounded text-xs">Tab</kbd>
      </div>
    </div>
  )
}
