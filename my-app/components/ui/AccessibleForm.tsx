'use client'

import React, { forwardRef, useState } from 'react'
import { useAriaAnnouncements } from '@/hooks/useAccessibility'

interface AccessibleInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
  helpText?: string
  required?: boolean
  showRequiredIndicator?: boolean
}

export const AccessibleInput = forwardRef<HTMLInputElement, AccessibleInputProps>(
  ({
    label,
    error,
    helpText,
    required = false,
    showRequiredIndicator = true,
    id,
    className = '',
    ...props
  }, ref) => {
    const inputId = id || `input-${Math.random().toString(36).substring(2, 8)}`
    const errorId = error ? `${inputId}-error` : undefined
    const helpId = helpText ? `${inputId}-help` : undefined
    const describedBy = [errorId, helpId].filter(Boolean).join(' ')

    const inputClasses = [
      'block w-full rounded-md border-gray-300 shadow-sm',
      'focus:border-blue-500 focus:ring-blue-500',
      'disabled:bg-gray-100 disabled:cursor-not-allowed',
      'text-base', // Minimum 16px to prevent zoom on iOS
      error ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : '',
      className
    ].join(' ')

    return (
      <div className="space-y-1">
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-gray-700"
        >
          {label}
          {required && showRequiredIndicator && (
            <span
              className="text-red-500 ml-1"
              aria-label="required"
              title="This field is required"
            >
              *
            </span>
          )}
        </label>

        <input
          ref={ref}
          id={inputId}
          className={inputClasses}
          aria-describedby={describedBy || undefined}
          aria-invalid={error ? 'true' : 'false'}
          aria-required={required}
          {...props}
        />

        {helpText && (
          <p
            id={helpId}
            className="text-sm text-gray-600"
            role="note"
          >
            {helpText}
          </p>
        )}

        {error && (
          <p
            id={errorId}
            className="text-sm text-red-600"
            role="alert"
            aria-live="polite"
          >
            {error}
          </p>
        )}
      </div>
    )
  }
)

AccessibleInput.displayName = 'AccessibleInput'

interface AccessibleSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string
  error?: string
  helpText?: string
  required?: boolean
  showRequiredIndicator?: boolean
  options: Array<{ value: string; label: string; disabled?: boolean }>
  placeholder?: string
}

export const AccessibleSelect = forwardRef<HTMLSelectElement, AccessibleSelectProps>(
  ({
    label,
    error,
    helpText,
    required = false,
    showRequiredIndicator = true,
    options,
    placeholder,
    id,
    className = '',
    ...props
  }, ref) => {
    const selectId = id || `select-${Math.random().toString(36).substring(2, 8)}`
    const errorId = error ? `${selectId}-error` : undefined
    const helpId = helpText ? `${selectId}-help` : undefined
    const describedBy = [errorId, helpId].filter(Boolean).join(' ')

    const selectClasses = [
      'block w-full rounded-md border-gray-300 shadow-sm',
      'focus:border-blue-500 focus:ring-blue-500',
      'disabled:bg-gray-100 disabled:cursor-not-allowed',
      'text-base pr-10', // Space for dropdown arrow
      error ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : '',
      className
    ].join(' ')

    return (
      <div className="space-y-1">
        <label
          htmlFor={selectId}
          className="block text-sm font-medium text-gray-700"
        >
          {label}
          {required && showRequiredIndicator && (
            <span
              className="text-red-500 ml-1"
              aria-label="required"
              title="This field is required"
            >
              *
            </span>
          )}
        </label>

        <select
          ref={ref}
          id={selectId}
          className={selectClasses}
          aria-describedby={describedBy || undefined}
          aria-invalid={error ? 'true' : 'false'}
          aria-required={required}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option
              key={option.value}
              value={option.value}
              disabled={option.disabled}
            >
              {option.label}
            </option>
          ))}
        </select>

        {helpText && (
          <p
            id={helpId}
            className="text-sm text-gray-600"
            role="note"
          >
            {helpText}
          </p>
        )}

        {error && (
          <p
            id={errorId}
            className="text-sm text-red-600"
            role="alert"
            aria-live="polite"
          >
            {error}
          </p>
        )}
      </div>
    )
  }
)

AccessibleSelect.displayName = 'AccessibleSelect'

interface AccessibleTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string
  error?: string
  helpText?: string
  required?: boolean
  showRequiredIndicator?: boolean
  characterLimit?: number
}

export const AccessibleTextarea = forwardRef<HTMLTextAreaElement, AccessibleTextareaProps>(
  ({
    label,
    error,
    helpText,
    required = false,
    showRequiredIndicator = true,
    characterLimit,
    value,
    onChange,
    id,
    className = '',
    ...props
  }, ref) => {
    const [charCount, setCharCount] = useState(
      typeof value === 'string' ? value.length : 0
    )

    const textareaId = id || `textarea-${Math.random().toString(36).substring(2, 8)}`
    const errorId = error ? `${textareaId}-error` : undefined
    const helpId = helpText ? `${textareaId}-help` : undefined
    const charCountId = characterLimit ? `${textareaId}-charcount` : undefined
    const describedBy = [errorId, helpId, charCountId].filter(Boolean).join(' ')

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setCharCount(e.target.value.length)
      onChange?.(e)
    }

    const isOverLimit = characterLimit && charCount > characterLimit
    const isNearLimit = characterLimit && charCount > characterLimit * 0.8

    const textareaClasses = [
      'block w-full rounded-md border-gray-300 shadow-sm',
      'focus:border-blue-500 focus:ring-blue-500',
      'disabled:bg-gray-100 disabled:cursor-not-allowed',
      'text-base resize-vertical',
      error || isOverLimit ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : '',
      className
    ].join(' ')

    return (
      <div className="space-y-1">
        <label
          htmlFor={textareaId}
          className="block text-sm font-medium text-gray-700"
        >
          {label}
          {required && showRequiredIndicator && (
            <span
              className="text-red-500 ml-1"
              aria-label="required"
              title="This field is required"
            >
              *
            </span>
          )}
        </label>

        <textarea
          ref={ref}
          id={textareaId}
          className={textareaClasses}
          aria-describedby={describedBy || undefined}
          aria-invalid={error || isOverLimit ? 'true' : 'false'}
          aria-required={required}
          value={value}
          onChange={handleChange}
          {...props}
        />

        {characterLimit && (
          <p
            id={charCountId}
            className={`text-sm ${
              isOverLimit ? 'text-red-600' : isNearLimit ? 'text-yellow-600' : 'text-gray-600'
            }`}
            role="status"
            aria-live="polite"
          >
            {charCount} / {characterLimit} characters
            {isOverLimit && ' (over limit)'}
          </p>
        )}

        {helpText && (
          <p
            id={helpId}
            className="text-sm text-gray-600"
            role="note"
          >
            {helpText}
          </p>
        )}

        {error && (
          <p
            id={errorId}
            className="text-sm text-red-600"
            role="alert"
            aria-live="polite"
          >
            {error}
          </p>
        )}
      </div>
    )
  }
)

AccessibleTextarea.displayName = 'AccessibleTextarea'

interface AccessibleCheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string
  description?: string
  error?: string
}

export const AccessibleCheckbox = forwardRef<HTMLInputElement, AccessibleCheckboxProps>(
  ({
    label,
    description,
    error,
    id,
    className = '',
    ...props
  }, ref) => {
    const checkboxId = id || `checkbox-${Math.random().toString(36).substring(2, 8)}`
    const errorId = error ? `${checkboxId}-error` : undefined
    const descId = description ? `${checkboxId}-desc` : undefined
    const describedBy = [errorId, descId].filter(Boolean).join(' ')

    return (
      <div className="space-y-1">
        <div className="flex items-start">
          <input
            ref={ref}
            id={checkboxId}
            type="checkbox"
            className={`
              h-4 w-4 text-blue-600 border-gray-300 rounded
              focus:ring-blue-500 focus:ring-2 focus:ring-offset-2
              disabled:opacity-50 disabled:cursor-not-allowed
              ${error ? 'border-red-500' : ''}
              ${className}
            `}
            aria-describedby={describedBy || undefined}
            aria-invalid={error ? 'true' : 'false'}
            {...props}
          />

          <div className="ml-3">
            <label
              htmlFor={checkboxId}
              className="text-sm font-medium text-gray-700 cursor-pointer"
            >
              {label}
            </label>

            {description && (
              <p
                id={descId}
                className="text-sm text-gray-600"
                role="note"
              >
                {description}
              </p>
            )}
          </div>
        </div>

        {error && (
          <p
            id={errorId}
            className="text-sm text-red-600 ml-7"
            role="alert"
            aria-live="polite"
          >
            {error}
          </p>
        )}
      </div>
    )
  }
)

AccessibleCheckbox.displayName = 'AccessibleCheckbox'

interface AccessibleFormProps {
  onSubmit: (e: React.FormEvent) => void
  children: React.ReactNode
  className?: string
  noValidate?: boolean
}

export function AccessibleForm({
  onSubmit,
  children,
  className = '',
  noValidate = true
}: AccessibleFormProps) {
  const { announce } = useAriaAnnouncements()

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    // Check for form validation errors
    const form = e.currentTarget
    const firstInvalid = form.querySelector('[aria-invalid="true"]') as HTMLElement

    if (firstInvalid) {
      firstInvalid.focus()
      announce('Please correct the form errors before submitting', 'assertive')
      return
    }

    onSubmit(e)
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate={noValidate}
      className={className}
      role="form"
    >
      {children}
    </form>
  )
}