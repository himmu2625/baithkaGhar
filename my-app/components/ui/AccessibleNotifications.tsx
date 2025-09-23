'use client'

import React, { useState, useEffect, createContext, useContext } from 'react'
import { useAriaAnnouncements } from '@/hooks/useAccessibility'
import { AccessibleButton } from './AccessibleButton'

interface Notification {
  id: string
  type: 'info' | 'success' | 'warning' | 'error'
  title: string
  message: string
  duration?: number
  persistent?: boolean
  actions?: Array<{
    label: string
    onClick: () => void
    variant?: 'primary' | 'secondary'
  }>
}

interface NotificationContextType {
  notifications: Notification[]
  addNotification: (notification: Omit<Notification, 'id'>) => void
  removeNotification: (id: string) => void
  clearAll: () => void
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const { announce } = useAriaAnnouncements()

  const addNotification = (notification: Omit<Notification, 'id'>) => {
    const id = `notification-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`
    const newNotification: Notification = {
      ...notification,
      id
    }

    setNotifications(prev => [...prev, newNotification])

    // Announce to screen readers
    const priority = notification.type === 'error' ? 'assertive' : 'polite'
    announce(`${notification.type}: ${notification.title}. ${notification.message}`, priority)

    // Auto-remove non-persistent notifications
    if (!notification.persistent) {
      const duration = notification.duration || 5000
      setTimeout(() => {
        removeNotification(id)
      }, duration)
    }
  }

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }

  const clearAll = () => {
    setNotifications([])
    announce('All notifications cleared')
  }

  return (
    <NotificationContext.Provider value={{
      notifications,
      addNotification,
      removeNotification,
      clearAll
    }}>
      {children}
      <NotificationContainer />
    </NotificationContext.Provider>
  )
}

export function useNotifications() {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider')
  }
  return context
}

function NotificationContainer() {
  const { notifications } = useNotifications()

  if (notifications.length === 0) return null

  return (
    <div
      className="fixed top-4 right-4 z-50 space-y-2 max-w-sm w-full"
      role="region"
      aria-label="Notifications"
      aria-live="polite"
    >
      {notifications.map(notification => (
        <NotificationItem
          key={notification.id}
          notification={notification}
        />
      ))}
    </div>
  )
}

function NotificationItem({ notification }: { notification: Notification }) {
  const { removeNotification } = useNotifications()
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Trigger animation on mount
    setIsVisible(true)
  }, [])

  const handleDismiss = () => {
    setIsVisible(false)
    setTimeout(() => {
      removeNotification(notification.id)
    }, 300) // Match animation duration
  }

  const typeConfig = {
    info: {
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      iconColor: 'text-blue-400',
      textColor: 'text-blue-800',
      icon: (
        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
            clipRule="evenodd"
          />
        </svg>
      )
    },
    success: {
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      iconColor: 'text-green-400',
      textColor: 'text-green-800',
      icon: (
        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
            clipRule="evenodd"
          />
        </svg>
      )
    },
    warning: {
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200',
      iconColor: 'text-yellow-400',
      textColor: 'text-yellow-800',
      icon: (
        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
            clipRule="evenodd"
          />
        </svg>
      )
    },
    error: {
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      iconColor: 'text-red-400',
      textColor: 'text-red-800',
      icon: (
        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
            clipRule="evenodd"
          />
        </svg>
      )
    }
  }

  const config = typeConfig[notification.type]

  return (
    <div
      className={`
        transform transition-all duration-300 ease-in-out
        ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
        ${config.bgColor} ${config.borderColor} border rounded-lg shadow-lg p-4
      `}
      role="alert"
      aria-labelledby={`notification-title-${notification.id}`}
      aria-describedby={`notification-message-${notification.id}`}
    >
      <div className="flex items-start">
        <div className={`flex-shrink-0 ${config.iconColor}`} aria-hidden="true">
          {config.icon}
        </div>

        <div className="ml-3 flex-1">
          <h3
            id={`notification-title-${notification.id}`}
            className={`text-sm font-medium ${config.textColor}`}
          >
            {notification.title}
          </h3>

          <p
            id={`notification-message-${notification.id}`}
            className={`mt-1 text-sm ${config.textColor} opacity-90`}
          >
            {notification.message}
          </p>

          {notification.actions && notification.actions.length > 0 && (
            <div className="mt-3 flex space-x-2">
              {notification.actions.map((action, index) => (
                <AccessibleButton
                  key={index}
                  size="sm"
                  variant={action.variant || 'secondary'}
                  onClick={() => {
                    action.onClick()
                    handleDismiss()
                  }}
                  className="text-xs"
                >
                  {action.label}
                </AccessibleButton>
              ))}
            </div>
          )}
        </div>

        <div className="ml-4 flex-shrink-0">
          <AccessibleButton
            variant="ghost"
            size="sm"
            onClick={handleDismiss}
            ariaLabel={`Dismiss ${notification.title} notification`}
            className={`${config.textColor} hover:bg-white hover:bg-opacity-20`}
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </AccessibleButton>
        </div>
      </div>
    </div>
  )
}

// Toast notification hooks - these should be used inside React components
export function useToast() {
  const { addNotification } = useNotifications()

  return {
    info: (title: string, message: string, options?: Partial<Notification>) => {
      addNotification({ type: 'info', title, message, ...options })
    },
    success: (title: string, message: string, options?: Partial<Notification>) => {
      addNotification({ type: 'success', title, message, ...options })
    },
    warning: (title: string, message: string, options?: Partial<Notification>) => {
      addNotification({ type: 'warning', title, message, ...options })
    },
    error: (title: string, message: string, options?: Partial<Notification>) => {
      addNotification({ type: 'error', title, message, ...options })
    }
  }
}

// Banner notification component for persistent system messages
interface AccessibleBannerProps {
  type: 'info' | 'warning' | 'error'
  title: string
  message: string
  actions?: Array<{
    label: string
    onClick: () => void
    variant?: 'primary' | 'secondary'
  }>
  onDismiss?: () => void
  dismissible?: boolean
  className?: string
}

export function AccessibleBanner({
  type,
  title,
  message,
  actions,
  onDismiss,
  dismissible = true,
  className = ''
}: AccessibleBannerProps) {
  const typeConfig = {
    info: {
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      iconColor: 'text-blue-400',
      textColor: 'text-blue-800'
    },
    warning: {
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200',
      iconColor: 'text-yellow-400',
      textColor: 'text-yellow-800'
    },
    error: {
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      iconColor: 'text-red-400',
      textColor: 'text-red-800'
    }
  }

  const config = typeConfig[type]

  return (
    <div
      className={`
        ${config.bgColor} ${config.borderColor} border-l-4 p-4
        ${className}
      `}
      role="alert"
      aria-labelledby="banner-title"
      aria-describedby="banner-message"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3
            id="banner-title"
            className={`text-sm font-medium ${config.textColor}`}
          >
            {title}
          </h3>

          <p
            id="banner-message"
            className={`mt-1 text-sm ${config.textColor} opacity-90`}
          >
            {message}
          </p>

          {actions && actions.length > 0 && (
            <div className="mt-3 flex space-x-2">
              {actions.map((action, index) => (
                <AccessibleButton
                  key={index}
                  size="sm"
                  variant={action.variant || 'secondary'}
                  onClick={action.onClick}
                  className="text-xs"
                >
                  {action.label}
                </AccessibleButton>
              ))}
            </div>
          )}
        </div>

        {dismissible && onDismiss && (
          <AccessibleButton
            variant="ghost"
            size="sm"
            onClick={onDismiss}
            ariaLabel={`Dismiss ${title} banner`}
            className={`ml-4 ${config.textColor}`}
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
    </div>
  )
}