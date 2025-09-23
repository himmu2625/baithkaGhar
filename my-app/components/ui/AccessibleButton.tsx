'use client'

import React, { forwardRef } from 'react'
import { useKeyboardNavigation } from '@/hooks/useAccessibility'

interface AccessibleButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  isLoading?: boolean
  loadingText?: string
  icon?: React.ReactNode
  iconPosition?: 'left' | 'right'
  ariaLabel?: string
  ariaDescribedBy?: string
  ariaExpanded?: boolean
  ariaControls?: string
  ariaPressed?: boolean
  children: React.ReactNode
}

export const AccessibleButton = forwardRef<HTMLButtonElement, AccessibleButtonProps>(
  ({
    variant = 'primary',
    size = 'md',
    isLoading = false,
    loadingText = 'Loading...',
    icon,
    iconPosition = 'left',
    ariaLabel,
    ariaDescribedBy,
    ariaExpanded,
    ariaControls,
    ariaPressed,
    className = '',
    children,
    onClick,
    onKeyDown,
    disabled,
    ...props
  }, ref) => {
    const { handleKeyNavigation } = useKeyboardNavigation()

    const baseClasses = [
      'inline-flex items-center justify-center',
      'font-medium rounded-lg',
      'focus:outline-none focus:ring-2 focus:ring-offset-2',
      'transition-all duration-200',
      'disabled:opacity-50 disabled:cursor-not-allowed',
      'touch-manipulation' // Improves touch responsiveness
    ]

    const variantClasses = {
      primary: [
        'bg-blue-600 text-white',
        'hover:bg-blue-700 focus:ring-blue-500',
        'active:bg-blue-800'
      ],
      secondary: [
        'bg-gray-200 text-gray-900',
        'hover:bg-gray-300 focus:ring-gray-500',
        'active:bg-gray-400'
      ],
      danger: [
        'bg-red-600 text-white',
        'hover:bg-red-700 focus:ring-red-500',
        'active:bg-red-800'
      ],
      ghost: [
        'bg-transparent text-gray-700',
        'hover:bg-gray-100 focus:ring-gray-500',
        'active:bg-gray-200'
      ]
    }

    const sizeClasses = {
      sm: ['px-3 py-2 text-sm', 'min-h-[32px]'],
      md: ['px-4 py-2.5 text-base', 'min-h-[40px]'],
      lg: ['px-6 py-3 text-lg', 'min-h-[48px]']
    }

    const buttonClasses = [
      ...baseClasses,
      ...variantClasses[variant],
      ...sizeClasses[size],
      className
    ].join(' ')

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (isLoading || disabled) return
      onClick?.(e)
    }

    const handleKeyDownEvent = (e: React.KeyboardEvent<HTMLButtonElement>) => {
      if (isLoading || disabled) return

      handleKeyNavigation(e, {
        onEnter: () => onClick?.(e as any),
        onSpace: () => onClick?.(e as any)
      })

      onKeyDown?.(e)
    }

    const renderIcon = () => {
      if (isLoading) {
        return (
          <svg
            className="animate-spin -ml-1 mr-2 h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )
      }

      if (icon) {
        return (
          <span
            className={iconPosition === 'right' ? 'ml-2' : 'mr-2'}
            aria-hidden="true"
          >
            {icon}
          </span>
        )
      }

      return null
    }

    const content = isLoading ? loadingText : children

    return (
      <button
        ref={ref}
        className={buttonClasses}
        onClick={handleClick}
        onKeyDown={handleKeyDownEvent}
        disabled={disabled || isLoading}
        aria-label={ariaLabel}
        aria-describedby={ariaDescribedBy}
        aria-expanded={ariaExpanded}
        aria-controls={ariaControls}
        aria-pressed={ariaPressed}
        aria-busy={isLoading}
        aria-disabled={disabled || isLoading}
        role="button"
        {...props}
      >
        {iconPosition === 'left' && renderIcon()}
        <span>{content}</span>
        {iconPosition === 'right' && renderIcon()}
      </button>
    )
  }
)

AccessibleButton.displayName = 'AccessibleButton'