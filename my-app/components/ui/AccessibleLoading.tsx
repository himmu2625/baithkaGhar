'use client'

import React from 'react'

interface AccessibleLoadingProps {
  size?: 'sm' | 'md' | 'lg'
  variant?: 'spinner' | 'dots' | 'pulse'
  message?: string
  showMessage?: boolean
  className?: string
}

export function AccessibleLoading({
  size = 'md',
  variant = 'spinner',
  message = 'Loading...',
  showMessage = true,
  className = ''
}: AccessibleLoadingProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  }

  const SpinnerIcon = () => (
    <svg
      className={`animate-spin ${sizeClasses[size]} ${className}`}
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

  const DotsLoader = () => {
    const dotSize = {
      sm: 'h-1 w-1',
      md: 'h-2 w-2',
      lg: 'h-3 w-3'
    }

    return (
      <div className={`flex space-x-1 ${className}`} aria-hidden="true">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className={`bg-current rounded-full animate-pulse ${dotSize[size]}`}
            style={{
              animationDelay: `${i * 0.15}s`,
              animationDuration: '0.6s'
            }}
          />
        ))}
      </div>
    )
  }

  const PulseLoader = () => (
    <div
      className={`bg-current rounded-full animate-pulse ${sizeClasses[size]} ${className}`}
      aria-hidden="true"
    />
  )

  const renderLoader = () => {
    switch (variant) {
      case 'dots':
        return <DotsLoader />
      case 'pulse':
        return <PulseLoader />
      default:
        return <SpinnerIcon />
    }
  }

  return (
    <div
      className="flex items-center justify-center space-x-2"
      role="status"
      aria-live="polite"
      aria-label={message}
    >
      {renderLoader()}
      {showMessage && (
        <span className="text-sm text-gray-600 sr-only">
          {message}
        </span>
      )}
    </div>
  )
}

interface AccessibleSkeletonProps {
  lines?: number
  width?: string | string[]
  height?: string
  className?: string
  animated?: boolean
}

export function AccessibleSkeleton({
  lines = 1,
  width = '100%',
  height = '1rem',
  className = '',
  animated = true
}: AccessibleSkeletonProps) {
  const skeletonClasses = [
    'bg-gray-200 rounded',
    animated ? 'animate-pulse' : '',
    className
  ].join(' ')

  const widths = Array.isArray(width) ? width : Array(lines).fill(width)

  return (
    <div
      role="status"
      aria-label="Loading content"
      className="space-y-2"
    >
      {Array.from({ length: lines }, (_, index) => (
        <div
          key={index}
          className={skeletonClasses}
          style={{
            width: widths[index] || widths[0],
            height
          }}
          aria-hidden="true"
        />
      ))}
      <span className="sr-only">Loading content...</span>
    </div>
  )
}

interface AccessibleProgressProps {
  value: number
  max?: number
  label?: string
  showPercentage?: boolean
  size?: 'sm' | 'md' | 'lg'
  variant?: 'default' | 'success' | 'warning' | 'danger'
  className?: string
}

export function AccessibleProgress({
  value,
  max = 100,
  label,
  showPercentage = true,
  size = 'md',
  variant = 'default',
  className = ''
}: AccessibleProgressProps) {
  const percentage = Math.round((value / max) * 100)
  const clampedPercentage = Math.min(Math.max(percentage, 0), 100)

  const sizeClasses = {
    sm: 'h-2',
    md: 'h-3',
    lg: 'h-4'
  }

  const variantClasses = {
    default: 'bg-blue-600',
    success: 'bg-green-600',
    warning: 'bg-yellow-600',
    danger: 'bg-red-600'
  }

  const progressId = `progress-${Math.random().toString(36).substring(2, 8)}`
  const labelId = label ? `${progressId}-label` : undefined

  return (
    <div className={`w-full ${className}`}>
      {(label || showPercentage) && (
        <div className="flex justify-between items-center mb-2">
          {label && (
            <label
              id={labelId}
              className="text-sm font-medium text-gray-700"
            >
              {label}
            </label>
          )}
          {showPercentage && (
            <span
              className="text-sm text-gray-600"
              aria-label={`${clampedPercentage} percent complete`}
            >
              {clampedPercentage}%
            </span>
          )}
        </div>
      )}

      <div
        className={`w-full bg-gray-200 rounded-full overflow-hidden ${sizeClasses[size]}`}
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={max}
        aria-valuenow={value}
        aria-valuetext={`${clampedPercentage}% complete`}
        aria-labelledby={labelId}
        aria-describedby={`${progressId}-desc`}
      >
        <div
          className={`h-full transition-all duration-300 ease-in-out ${variantClasses[variant]}`}
          style={{ width: `${clampedPercentage}%` }}
        />
      </div>

      <div
        id={`${progressId}-desc`}
        className="sr-only"
      >
        Progress: {clampedPercentage}% of {max}
      </div>
    </div>
  )
}

interface AccessibleSpinnerOverlayProps {
  isVisible: boolean
  message?: string
  backdrop?: boolean
  className?: string
}

export function AccessibleSpinnerOverlay({
  isVisible,
  message = 'Processing...',
  backdrop = true,
  className = ''
}: AccessibleSpinnerOverlayProps) {
  if (!isVisible) return null

  return (
    <div
      className={`
        fixed inset-0 z-50 flex items-center justify-center
        ${backdrop ? 'bg-black bg-opacity-50' : ''}
        ${className}
      `}
      role="dialog"
      aria-modal="true"
      aria-label={message}
    >
      <div className="bg-white rounded-lg p-6 shadow-xl flex items-center space-x-4">
        <AccessibleLoading size="lg" showMessage={false} />
        <div>
          <p className="text-lg font-medium text-gray-900">
            {message}
          </p>
          <p className="text-sm text-gray-600 mt-1">
            Please wait while we process your request...
          </p>
        </div>
      </div>
    </div>
  )
}