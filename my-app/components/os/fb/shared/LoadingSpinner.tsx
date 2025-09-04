'use client';

import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'default' | 'dots' | 'pulse';
  text?: string;
  center?: boolean;
  className?: string;
}

export function LoadingSpinner({ 
  size = 'md', 
  variant = 'default',
  text,
  center = false,
  className 
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12'
  };
  
  const textSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
    xl: 'text-lg'
  };

  const renderSpinner = () => {
    if (variant === 'dots') {
      return (
        <div className="flex space-x-1">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className={cn(
                'rounded-full bg-current animate-pulse',
                size === 'sm' ? 'w-1 h-1' :
                size === 'md' ? 'w-1.5 h-1.5' :
                size === 'lg' ? 'w-2 h-2' : 'w-3 h-3'
              )}
              style={{
                animationDelay: `${i * 0.2}s`,
                animationDuration: '1.4s'
              }}
            />
          ))}
        </div>
      );
    }
    
    if (variant === 'pulse') {
      return (
        <div 
          className={cn(
            'rounded-full bg-current animate-pulse',
            sizeClasses[size]
          )}
        />
      );
    }
    
    // Default spinner
    return (
      <Loader2 
        className={cn(
          'animate-spin text-blue-600',
          sizeClasses[size]
        )} 
      />
    );
  };

  const content = (
    <div className={cn('flex items-center space-x-2', className)}>
      {renderSpinner()}
      {text && (
        <span className={cn('text-gray-600', textSizeClasses[size])}>
          {text}
        </span>
      )}
    </div>
  );

  if (center) {
    return (
      <div className="flex items-center justify-center p-8">
        {content}
      </div>
    );
  }

  return content;
}