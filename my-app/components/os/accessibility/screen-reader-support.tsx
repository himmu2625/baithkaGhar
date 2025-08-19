"use client"

import React, { useEffect, useRef, useState } from "react"

// Live region for screen reader announcements
interface LiveRegionProps {
  "aria-live": "polite" | "assertive" | "off"
  "aria-atomic"?: boolean
  "aria-relevant"?: "additions" | "removals" | "text" | "all"
  children?: React.ReactNode
  className?: string
}

export const LiveRegion: React.FC<LiveRegionProps> = ({
  "aria-live": ariaLive,
  "aria-atomic": ariaAtomic = true,
  "aria-relevant": ariaRelevant = "all",
  children,
  className = "",
}) => {
  return (
    <div
      aria-live={ariaLive}
      aria-atomic={ariaAtomic}
      aria-relevant={ariaRelevant}
      className={`sr-only ${className}`}
    >
      {children}
    </div>
  )
}

// Screen reader announcement hook
export const useScreenReaderAnnouncement = () => {
  const [announcements, setAnnouncements] = useState<string[]>([])
  const liveRegionRef = useRef<HTMLDivElement>(null)

  const announce = (
    message: string,
    priority: "polite" | "assertive" = "polite"
  ) => {
    setAnnouncements((prev) => [...prev, message])

    // Clear the message after a short delay to allow screen readers to process it
    setTimeout(() => {
      setAnnouncements((prev) => prev.filter((msg) => msg !== message))
    }, 1000)
  }

  const ScreenReaderAnnouncer = () => (
    <>
      <LiveRegion aria-live="polite" aria-atomic={true}>
        {announcements.filter((_, index) => index % 2 === 0).join(" ")}
      </LiveRegion>
      <LiveRegion aria-live="assertive" aria-atomic={true}>
        {announcements.filter((_, index) => index % 2 === 1).join(" ")}
      </LiveRegion>
    </>
  )

  return { announce, ScreenReaderAnnouncer }
}

// Skip link component
export const SkipLink: React.FC<{
  targetId: string
  children: React.ReactNode
}> = ({ targetId, children }) => {
  return (
    <a
      href={`#${targetId}`}
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
    >
      {children}
    </a>
  )
}

// Focus trap component
interface FocusTrapProps {
  children: React.ReactNode
  isActive?: boolean
  onEscape?: () => void
}

export const FocusTrap: React.FC<FocusTrapProps> = ({
  children,
  isActive = true,
  onEscape,
}) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const firstFocusableRef = useRef<HTMLElement | null>(null)
  const lastFocusableRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (!isActive || !containerRef.current) return

    const container = containerRef.current
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )

    if (focusableElements.length > 0) {
      firstFocusableRef.current = focusableElements[0] as HTMLElement
      lastFocusableRef.current = focusableElements[
        focusableElements.length - 1
      ] as HTMLElement
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Tab") {
        if (event.shiftKey) {
          if (document.activeElement === firstFocusableRef.current) {
            event.preventDefault()
            lastFocusableRef.current?.focus()
          }
        } else {
          if (document.activeElement === lastFocusableRef.current) {
            event.preventDefault()
            firstFocusableRef.current?.focus()
          }
        }
      } else if (event.key === "Escape" && onEscape) {
        onEscape()
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [isActive, onEscape])

  return (
    <div ref={containerRef} className={isActive ? "focus-trap" : ""}>
      {children}
    </div>
  )
}

// ARIA utilities
export const getAriaLabel = (
  label: string,
  required?: boolean,
  error?: string
) => {
  let ariaLabel = label
  if (required) ariaLabel += " (required)"
  if (error) ariaLabel += ` (error: ${error})`
  return ariaLabel
}

export const getAriaDescribedBy = (
  descriptionId?: string,
  errorId?: string
) => {
  const ids = [descriptionId, errorId].filter(Boolean)
  return ids.length > 0 ? ids.join(" ") : undefined
}

// Accessible form field wrapper
interface AccessibleFieldProps {
  id: string
  label: string
  required?: boolean
  error?: string
  description?: string
  children: React.ReactNode
  className?: string
}

export const AccessibleField: React.FC<AccessibleFieldProps> = ({
  id,
  label,
  required = false,
  error,
  description,
  children,
  className = "",
}) => {
  const descriptionId = description ? `${id}-description` : undefined
  const errorId = error ? `${id}-error` : undefined

  return (
    <div className={`space-y-1 ${className}`}>
      <label
        htmlFor={id}
        className="block text-sm font-medium text-gray-700 dark:text-gray-300"
      >
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>

      {description && (
        <p
          id={descriptionId}
          className="text-sm text-gray-500 dark:text-gray-400"
        >
          {description}
        </p>
      )}

      {React.cloneElement(children as React.ReactElement, {
        id,
        "aria-label": getAriaLabel(label, required, error),
        "aria-describedby": getAriaDescribedBy(descriptionId, errorId),
        "aria-invalid": error ? "true" : "false",
        "aria-required": required,
      })}

      {error && (
        <p
          id={errorId}
          className="text-sm text-red-600 dark:text-red-400"
          role="alert"
        >
          {error}
        </p>
      )}
    </div>
  )
}

// Accessible button component
interface AccessibleButtonProps {
  children: React.ReactNode
  onClick?: () => void
  disabled?: boolean
  loading?: boolean
  "aria-label"?: string
  "aria-describedby"?: string
  className?: string
  type?: "button" | "submit" | "reset"
}

export const AccessibleButton: React.FC<AccessibleButtonProps> = ({
  children,
  onClick,
  disabled = false,
  loading = false,
  "aria-label": ariaLabel,
  "aria-describedby": ariaDescribedby,
  className = "",
  type = "button",
}) => {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      aria-label={ariaLabel}
      aria-describedby={ariaDescribedby}
      aria-busy={loading}
      className={`px-4 py-2 rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
      {loading && (
        <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
      )}
      {children}
    </button>
  )
}

// Accessible table component
interface AccessibleTableProps {
  caption?: string
  children: React.ReactNode
  className?: string
}

export const AccessibleTable: React.FC<AccessibleTableProps> = ({
  caption,
  children,
  className = "",
}) => {
  return (
    <div className="overflow-x-auto">
      <table
        className={`min-w-full divide-y divide-gray-200 dark:divide-gray-700 ${className}`}
      >
        {caption && <caption className="sr-only">{caption}</caption>}
        {children}
      </table>
    </div>
  )
}

// Accessible modal component
interface AccessibleModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  className?: string
}

export const AccessibleModal: React.FC<AccessibleModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  className = "",
}) => {
  const modalRef = useRef<HTMLDivElement>(null)
  const { announce } = useScreenReaderAnnouncement()

  useEffect(() => {
    if (isOpen) {
      announce(`Modal opened: ${title}`)
      modalRef.current?.focus()
    }
  }, [isOpen, title, announce])

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div
          className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
          aria-hidden="true"
          onClick={onClose}
        />

        <FocusTrap isActive={isOpen} onEscape={onClose}>
          <div
            ref={modalRef}
            className={`inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full ${className}`}
            role="document"
            tabIndex={-1}
          >
            <div className="px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              <div className="flex items-center justify-between mb-4">
                <h3
                  id="modal-title"
                  className="text-lg font-medium text-gray-900 dark:text-white"
                >
                  {title}
                </h3>
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  aria-label="Close modal"
                >
                  ✕
                </button>
              </div>
              {children}
            </div>
          </div>
        </FocusTrap>
      </div>
    </div>
  )
}
