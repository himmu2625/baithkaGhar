'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { Loader2, Clock, CheckCircle, AlertCircle } from 'lucide-react';

// Basic Spinner Component
interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const Spinner: React.FC<SpinnerProps> = ({ 
  size = 'md', 
  className 
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
    xl: 'h-12 w-12'
  };

  return (
    <Loader2 className={cn(
      "animate-spin text-primary",
      sizeClasses[size],
      className
    )} />
  );
};

// Loading Overlay Component
interface LoadingOverlayProps {
  isLoading: boolean;
  children: React.ReactNode;
  message?: string;
  className?: string;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  isLoading,
  children,
  message = 'Loading...',
  className
}) => {
  if (!isLoading) return <>{children}</>;

  return (
    <div className={cn("relative", className)}>
      {children}
      <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="text-center">
          <Spinner size="lg" className="mb-2" />
          <p className="text-sm text-gray-600">{message}</p>
        </div>
      </div>
    </div>
  );
};

// Skeleton Loader Components
interface SkeletonProps {
  className?: string;
  width?: string;
  height?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ 
  className, 
  width = 'w-full', 
  height = 'h-4' 
}) => {
  return (
    <div className={cn(
      "animate-pulse bg-gray-200 rounded",
      width,
      height,
      className
    )} />
  );
};

// Table Skeleton
interface TableSkeletonProps {
  rows?: number;
  columns?: number;
  className?: string;
}

export const TableSkeleton: React.FC<TableSkeletonProps> = ({
  rows = 5,
  columns = 4,
  className
}) => {
  return (
    <div className={cn("space-y-3", className)}>
      {/* Header */}
      <div className="flex gap-4">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} width="w-24" height="h-4" />
        ))}
      </div>
      
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="flex gap-4">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton key={colIndex} width="w-24" height="h-4" />
          ))}
        </div>
      ))}
    </div>
  );
};

// Card Skeleton
interface CardSkeletonProps {
  className?: string;
  showImage?: boolean;
  showActions?: boolean;
}

export const CardSkeleton: React.FC<CardSkeletonProps> = ({
  className,
  showImage = false,
  showActions = false
}) => {
  return (
    <div className={cn("p-4 border rounded-lg", className)}>
      {showImage && (
        <Skeleton width="w-full" height="h-32" className="mb-4" />
      )}
      
      <div className="space-y-3">
        <Skeleton width="w-3/4" height="h-5" />
        <Skeleton width="w-full" height="h-4" />
        <Skeleton width="w-1/2" height="h-4" />
        
        {showActions && (
          <div className="flex gap-2 pt-2">
            <Skeleton width="w-16" height="h-8" />
            <Skeleton width="w-16" height="h-8" />
          </div>
        )}
      </div>
    </div>
  );
};

// Progress Bar Component
interface ProgressBarProps {
  value: number;
  max?: number;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'success' | 'warning' | 'error';
  showLabel?: boolean;
  className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  max = 100,
  size = 'md',
  variant = 'default',
  showLabel = false,
  className
}) => {
  const percentage = Math.min((value / max) * 100, 100);
  
  const sizeClasses = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3'
  };

  const variantClasses = {
    default: 'bg-primary',
    success: 'bg-green-500',
    warning: 'bg-yellow-500',
    error: 'bg-red-500'
  };

  return (
    <div className={cn("space-y-1", className)}>
      {showLabel && (
        <div className="flex justify-between text-sm text-gray-600">
          <span>Progress</span>
          <span>{Math.round(percentage)}%</span>
        </div>
      )}
      
      <div className={cn(
        "w-full bg-gray-200 rounded-full overflow-hidden",
        sizeClasses[size]
      )}>
        <div
          className={cn(
            "h-full transition-all duration-300 ease-in-out",
            variantClasses[variant]
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

// Status Indicator Component
interface StatusIndicatorProps {
  status: 'loading' | 'success' | 'error' | 'warning' | 'idle';
  message?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({
  status,
  message,
  size = 'md',
  className
}) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'loading':
        return {
          icon: <Loader2 className="animate-spin" />,
          color: 'text-blue-500',
          bgColor: 'bg-blue-100'
        };
      case 'success':
        return {
          icon: <CheckCircle />,
          color: 'text-green-500',
          bgColor: 'bg-green-100'
        };
      case 'error':
        return {
          icon: <AlertCircle />,
          color: 'text-red-500',
          bgColor: 'bg-red-100'
        };
      case 'warning':
        return {
          icon: <AlertCircle />,
          color: 'text-yellow-500',
          bgColor: 'bg-yellow-100'
        };
      case 'idle':
        return {
          icon: <Clock />,
          color: 'text-gray-500',
          bgColor: 'bg-gray-100'
        };
    }
  };

  const config = getStatusConfig();
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6'
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className={cn(
        "flex items-center justify-center rounded-full p-1",
        config.bgColor
      )}>
        <div className={cn(config.color, sizeClasses[size])}>
          {config.icon}
        </div>
      </div>
      {message && (
        <span className="text-sm text-gray-600">{message}</span>
      )}
    </div>
  );
};

// Infinite Scroll Loading
interface InfiniteScrollLoadingProps {
  className?: string;
  message?: string;
}

export const InfiniteScrollLoading: React.FC<InfiniteScrollLoadingProps> = ({
  className,
  message = 'Loading more items...'
}) => {
  return (
    <div className={cn("flex items-center justify-center py-8", className)}>
      <div className="flex items-center gap-3">
        <Spinner size="md" />
        <span className="text-sm text-gray-600">{message}</span>
      </div>
    </div>
  );
};

// Page Loading Component
interface PageLoadingProps {
  title?: string;
  message?: string;
  className?: string;
}

export const PageLoading: React.FC<PageLoadingProps> = ({
  title = 'Loading',
  message = 'Please wait while we load your content...',
  className
}) => {
  return (
    <div className={cn("flex items-center justify-center min-h-[400px]", className)}>
      <div className="text-center">
        <Spinner size="xl" className="mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
        <p className="text-sm text-gray-500">{message}</p>
      </div>
    </div>
  );
};

// Button Loading State
interface ButtonLoadingProps {
  loading: boolean;
  children: React.ReactNode;
  loadingText?: string;
  className?: string;
}

export const ButtonLoading: React.FC<ButtonLoadingProps> = ({
  loading,
  children,
  loadingText,
  className
}) => {
  return (
    <div className={cn("inline-flex items-center gap-2", className)}>
      {loading && <Spinner size="sm" />}
      <span>{loading ? loadingText || children : children}</span>
    </div>
  );
};

// Content Placeholder
interface ContentPlaceholderProps {
  icon?: React.ReactNode;
  title: string;
  message: string;
  action?: React.ReactNode;
  className?: string;
}

export const ContentPlaceholder: React.FC<ContentPlaceholderProps> = ({
  icon,
  title,
  message,
  action,
  className
}) => {
  return (
    <div className={cn("text-center py-12", className)}>
      {icon && (
        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-gray-100 mb-4">
          <div className="text-gray-400">{icon}</div>
        </div>
      )}
      <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
      <p className="text-sm text-gray-500 mb-6">{message}</p>
      {action && action}
    </div>
  );
};

// Loading States for Different Components
export const LoadingStates = {
  Spinner,
  LoadingOverlay,
  Skeleton,
  TableSkeleton,
  CardSkeleton,
  ProgressBar,
  StatusIndicator,
  InfiniteScrollLoading,
  PageLoading,
  ButtonLoading,
  ContentPlaceholder
}; 