'use client';

import { AlertTriangle, Clock, Flag, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

type Priority = 'low' | 'medium' | 'high' | 'urgent';

interface PriorityIndicatorProps {
  priority: Priority;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  variant?: 'icon' | 'badge' | 'dot';
}

export function PriorityIndicator({ 
  priority, 
  size = 'md', 
  showLabel = false, 
  variant = 'icon' 
}: PriorityIndicatorProps) {
  const getPriorityConfig = (priority: Priority) => {
    const configs = {
      low: {
        icon: Clock,
        label: 'Low Priority',
        color: 'text-gray-500',
        bgColor: 'bg-gray-100',
        borderColor: 'border-gray-300'
      },
      medium: {
        icon: Flag,
        label: 'Medium Priority',
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-100',
        borderColor: 'border-yellow-300'
      },
      high: {
        icon: AlertTriangle,
        label: 'High Priority',
        color: 'text-orange-600',
        bgColor: 'bg-orange-100',
        borderColor: 'border-orange-300'
      },
      urgent: {
        icon: Zap,
        label: 'Urgent',
        color: 'text-red-600',
        bgColor: 'bg-red-100',
        borderColor: 'border-red-300'
      }
    };
    
    return configs[priority];
  };

  const config = getPriorityConfig(priority);
  const Icon = config.icon;
  
  const sizeClasses = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  };
  
  const textSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  };

  if (variant === 'dot') {
    return (
      <div className="flex items-center space-x-2">
        <div 
          className={cn(
            'rounded-full',
            config.bgColor,
            sizeClasses[size]
          )}
        />
        {showLabel && (
          <span className={cn('font-medium', config.color, textSizeClasses[size])}>
            {config.label}
          </span>
        )}
      </div>
    );
  }

  if (variant === 'badge') {
    return (
      <div 
        className={cn(
          'inline-flex items-center space-x-1 px-2 py-1 rounded-full border',
          config.bgColor,
          config.borderColor
        )}
      >
        <Icon className={cn(sizeClasses[size], config.color)} />
        <span className={cn('font-medium', config.color, textSizeClasses[size])}>
          {showLabel ? config.label : priority.toUpperCase()}
        </span>
      </div>
    );
  }

  // Default icon variant
  return (
    <div className="flex items-center space-x-2">
      <Icon className={cn(sizeClasses[size], config.color)} />
      {showLabel && (
        <span className={cn('font-medium', config.color, textSizeClasses[size])}>
          {config.label}
        </span>
      )}
    </div>
  );
}