'use client';

import { Calendar, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DateTimeDisplayProps {
  date: Date | string;
  format?: 'date' | 'time' | 'datetime' | 'relative' | 'duration';
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  variant?: 'default' | 'minimal' | 'detailed';
  className?: string;
}

export function DateTimeDisplay({ 
  date, 
  format = 'datetime', 
  size = 'md',
  showIcon = false,
  variant = 'default',
  className 
}: DateTimeDisplayProps) {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  const sizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  };
  
  const iconSizeClasses = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  };

  const formatDate = (date: Date, format: string, variant: string) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (format === 'relative') {
      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays < 7) return `${diffDays}d ago`;
      return date.toLocaleDateString('en-IN', { 
        day: 'numeric', 
        month: 'short' 
      });
    }
    
    if (format === 'duration') {
      const absDiffMins = Math.abs(diffMins);
      const absDiffHours = Math.abs(diffHours);
      
      if (absDiffMins < 60) return `${absDiffMins}m`;
      if (absDiffHours < 24) {
        const mins = absDiffMins % 60;
        return mins > 0 ? `${absDiffHours}h ${mins}m` : `${absDiffHours}h`;
      }
      const days = Math.abs(diffDays);
      const hours = absDiffHours % 24;
      return hours > 0 ? `${days}d ${hours}h` : `${days}d`;
    }
    
    if (format === 'time') {
      return date.toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        ...(variant === 'detailed' && { second: '2-digit' })
      });
    }
    
    if (format === 'date') {
      if (variant === 'minimal') {
        return date.toLocaleDateString('en-IN', {
          day: '2-digit',
          month: '2-digit'
        });
      }
      
      return date.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: variant === 'detailed' ? 'long' : 'short',
        ...(variant === 'detailed' && { year: 'numeric' })
      });
    }
    
    // datetime format
    if (variant === 'minimal') {
      return `${date.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: '2-digit'
      })} ${date.toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit'
      })}`;
    }
    
    return `${date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      ...(variant === 'detailed' && { year: 'numeric' })
    })} ${date.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      ...(variant === 'detailed' && { second: '2-digit' })
    })}`;
  };

  const getIcon = (format: string) => {
    if (format === 'time' || format === 'duration' || format === 'relative') {
      return Clock;
    }
    return Calendar;
  };

  const Icon = getIcon(format);
  const formattedDate = formatDate(dateObj, format, variant);

  return (
    <div className={cn('flex items-center space-x-1', className)}>
      {showIcon && (
        <Icon className={cn(iconSizeClasses[size], 'text-gray-500')} />
      )}
      <span className={cn('text-gray-700', sizeClasses[size])}>
        {formattedDate}
      </span>
    </div>
  );
}