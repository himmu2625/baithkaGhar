'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'default' | 'primary' | 'secondary';
  text?: string;
  overlay?: boolean;
  className?: string;
}

export default function LoadingSpinner({
  size = 'md',
  variant = 'default',
  text,
  overlay = false,
  className
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12'
  };

  const variantClasses = {
    default: 'text-gray-600',
    primary: 'text-blue-600',
    secondary: 'text-green-600'
  };

  const spinner = (
    <div className={cn('flex flex-col items-center gap-2', className)}>
      <div
        className={cn(
          'animate-spin rounded-full border-2 border-t-transparent',
          sizeClasses[size],
          variantClasses[variant]
        )}
        style={{
          borderColor: 'currentColor',
          borderTopColor: 'transparent'
        }}
      />
      {text && (
        <span className={cn('text-sm', variantClasses[variant])}>
          {text}
        </span>
      )}
    </div>
  );

  if (overlay) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 shadow-lg">
          {spinner}
        </div>
      </div>
    );
  }

  return spinner;
}

export function LoadingButton({
  isLoading,
  children,
  ...props
}: {
  isLoading: boolean;
  children: React.ReactNode;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      disabled={isLoading || props.disabled}
      className={cn(
        'flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed',
        props.className
      )}
    >
      {isLoading && <LoadingSpinner size="sm" />}
      {children}
    </button>
  );
}