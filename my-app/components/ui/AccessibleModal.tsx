'use client'

import React, { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useFocusManagement, useAriaAnnouncements, useKeyboardNavigation } from '@/hooks/useAccessibility'
import { AccessibleButton } from './AccessibleButton'

interface AccessibleModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  description?: string
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  showCloseButton?: boolean
  closeOnOverlayClick?: boolean
  closeOnEscape?: boolean
  children: React.ReactNode
  footer?: React.ReactNode
  className?: string
  overlayClassName?: string
  contentClassName?: string
}

export function AccessibleModal({
  isOpen,
  onClose,
  title,
  description,
  size = 'md',
  showCloseButton = true,
  closeOnOverlayClick = true,
  closeOnEscape = true,
  children,
  footer,
  className = '',
  overlayClassName = '',
  contentClassName = ''
}: AccessibleModalProps) {
  const modalRef = useRef<HTMLDivElement>(null)
  const previousFocusRef = useRef<HTMLElement | null>(null)
  const { trapFocus, restoreFocus } = useFocusManagement()
  const { announce } = useAriaAnnouncements()
  const { handleKeyNavigation } = useKeyboardNavigation()

  useEffect(() => {
    if (isOpen) {
      // Store the currently focused element
      previousFocusRef.current = document.activeElement as HTMLElement

      // Prevent body scroll
      document.body.style.overflow = 'hidden'

      // Announce modal opening to screen readers
      announce(`${title} dialog opened`)

      // Set up focus trap
      if (modalRef.current) {
        const cleanup = trapFocus(modalRef.current)
        return cleanup
      }
    } else {
      // Restore body scroll
      document.body.style.overflow = ''

      // Restore focus to previous element
      restoreFocus(previousFocusRef.current)
    }
  }, [isOpen, title, announce, trapFocus, restoreFocus])

  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (closeOnEscape && e.key === 'Escape') {
        e.preventDefault()
        onClose()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, closeOnEscape, onClose])

  if (!isOpen) return null

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    full: 'max-w-full mx-4'
  }

  const modalContent = (
    <div
      className={`fixed inset-0 z-50 overflow-y-auto ${overlayClassName}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      aria-describedby={description ? "modal-description" : undefined}
    >
      <div className="flex min-h-full items-center justify-center p-4">
        {/* Overlay */}
        <div
          className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
          aria-hidden="true"
          onClick={closeOnOverlayClick ? onClose : undefined}
        />

        {/* Modal panel */}
        <div
          ref={modalRef}
          className={`
            relative transform overflow-hidden rounded-lg bg-white shadow-xl
            transition-all w-full ${sizeClasses[size]} ${className}
          `}
          onKeyDown={(e) => {
            handleKeyNavigation(e, {
              onEscape: closeOnEscape ? onClose : undefined
            })
          }}
        >
          <div className={`bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4 ${contentClassName}`}>
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h3
                  id="modal-title"
                  className="text-lg font-medium leading-6 text-gray-900"
                >
                  {title}
                </h3>
                {description && (
                  <p
                    id="modal-description"
                    className="mt-2 text-sm text-gray-500"
                  >
                    {description}
                  </p>
                )}
              </div>

              {showCloseButton && (
                <AccessibleButton
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  ariaLabel={`Close ${title} dialog`}
                  className="ml-4 -mt-2 -mr-2"
                >
                  <svg
                    className="h-5 w-5"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </AccessibleButton>
              )}
            </div>

            {/* Content */}
            <div className="mt-2">
              {children}
            </div>
          </div>

          {/* Footer */}
          {footer && (
            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse border-t">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  )

  // Render modal in portal to ensure proper stacking
  return createPortal(modalContent, document.body)
}

// Confirmation modal with accessibility features
export function AccessibleConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'primary'
}: {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  variant?: 'primary' | 'danger'
}) {
  const { announce } = useAriaAnnouncements()

  const handleConfirm = () => {
    onConfirm()
    announce(`${title} confirmed`)
  }

  const handleCancel = () => {
    onClose()
    announce(`${title} cancelled`)
  }

  return (
    <AccessibleModal
      isOpen={isOpen}
      onClose={handleCancel}
      title={title}
      description={message}
      size="sm"
      footer={
        <div className="flex space-x-3">
          <AccessibleButton
            variant={variant}
            onClick={handleConfirm}
            ariaLabel={`${confirmText} ${title.toLowerCase()}`}
          >
            {confirmText}
          </AccessibleButton>
          <AccessibleButton
            variant="secondary"
            onClick={handleCancel}
            ariaLabel={`${cancelText} ${title.toLowerCase()}`}
          >
            {cancelText}
          </AccessibleButton>
        </div>
      }
    >
      <p className="text-sm text-gray-700">
        {message}
      </p>
    </AccessibleModal>
  )
}