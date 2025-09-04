'use client';

import { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function EmptyState({ 
  icon: Icon, 
  title, 
  description, 
  actionLabel, 
  onAction,
  size = 'md',
  className 
}: EmptyStateProps) {
  const sizeClasses = {
    sm: {
      container: 'p-6',
      icon: 'w-8 h-8',
      title: 'text-base',
      description: 'text-xs',
      spacing: 'space-y-2'
    },
    md: {
      container: 'p-8',
      icon: 'w-12 h-12',
      title: 'text-lg',
      description: 'text-sm',
      spacing: 'space-y-3'
    },
    lg: {
      container: 'p-12',
      icon: 'w-16 h-16',
      title: 'text-xl',
      description: 'text-base',
      spacing: 'space-y-4'
    }
  };

  return (
    <div 
      className={cn(
        'flex flex-col items-center justify-center text-center border-2 border-dashed border-gray-300 rounded-lg bg-gray-50',
        sizeClasses[size].container,
        sizeClasses[size].spacing,
        className
      )}
    >
      <Icon 
        className={cn(
          'text-gray-400',
          sizeClasses[size].icon
        )} 
      />
      
      <div className="space-y-1">
        <h3 
          className={cn(
            'font-semibold text-gray-900',
            sizeClasses[size].title
          )}
        >
          {title}
        </h3>
        
        {description && (
          <p 
            className={cn(
              'text-gray-600 max-w-md',
              sizeClasses[size].description
            )}
          >
            {description}
          </p>
        )}
      </div>
      
      {actionLabel && onAction && (
        <Button 
          onClick={onAction}
          variant="outline"
          size={size === 'md' ? 'default' : size}
        >
          {actionLabel}
        </Button>
      )}
    </div>
  );
}