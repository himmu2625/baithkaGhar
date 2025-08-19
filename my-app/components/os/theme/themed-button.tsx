'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useTheme } from './theme-provider';
import { theme } from '@/lib/theme';

interface ThemedButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'accent' | 'success' | 'warning' | 'error';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ComponentType<any>;
  iconPosition?: 'left' | 'right';
}

export default function ThemedButton({
  children,
  variant = 'primary',
  size = 'md',
  className,
  onClick,
  disabled = false,
  loading = false,
  icon: Icon,
  iconPosition = 'left'
}: ThemedButtonProps) {
  const { isDark } = useTheme();

  const variantStyles = {
    primary: {
      light: 'bg-blue-600 hover:bg-blue-700 text-white',
      dark: 'bg-blue-500 hover:bg-blue-600 text-white',
    },
    secondary: {
      light: 'bg-gray-600 hover:bg-gray-700 text-white',
      dark: 'bg-gray-500 hover:bg-gray-600 text-white',
    },
    accent: {
      light: 'bg-orange-600 hover:bg-orange-700 text-white',
      dark: 'bg-orange-500 hover:bg-orange-600 text-white',
    },
    success: {
      light: 'bg-green-600 hover:bg-green-700 text-white',
      dark: 'bg-green-500 hover:bg-green-600 text-white',
    },
    warning: {
      light: 'bg-yellow-600 hover:bg-yellow-700 text-white',
      dark: 'bg-yellow-500 hover:bg-yellow-600 text-white',
    },
    error: {
      light: 'bg-red-600 hover:bg-red-700 text-white',
      dark: 'bg-red-500 hover:bg-red-600 text-white',
    },
  };

  const sizeStyles = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  const baseStyles = 'font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2';
  const variantStyle = variantStyles[variant][isDark ? 'dark' : 'light'];
  const sizeStyle = sizeStyles[size];

  return (
    <Button
      className={cn(
        baseStyles,
        variantStyle,
        sizeStyle,
        disabled && 'opacity-50 cursor-not-allowed',
        loading && 'cursor-wait',
        className
      )}
      onClick={onClick}
      disabled={disabled || loading}
    >
      {loading && (
        <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent mr-2" />
      )}
      {Icon && iconPosition === 'left' && !loading && (
        <Icon className="h-4 w-4 mr-2" />
      )}
      {children}
      {Icon && iconPosition === 'right' && !loading && (
        <Icon className="h-4 w-4 ml-2" />
      )}
    </Button>
  );
} 