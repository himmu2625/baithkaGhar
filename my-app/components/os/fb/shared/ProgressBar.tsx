'use client';

import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface ProgressBarProps {
  value: number;
  max?: number;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'success' | 'warning' | 'danger';
  showValue?: boolean;
  showPercentage?: boolean;
  label?: string;
  animated?: boolean;
  className?: string;
}

export function ProgressBar({ 
  value, 
  max = 100, 
  size = 'md',
  variant = 'default',
  showValue = false,
  showPercentage = true,
  label,
  animated = false,
  className 
}: ProgressBarProps) {
  const percentage = Math.min((value / max) * 100, 100);
  
  const sizeClasses = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3'
  };
  
  const variantClasses = {
    default: '[&>div]:bg-blue-600',
    success: '[&>div]:bg-green-600',
    warning: '[&>div]:bg-yellow-600',
    danger: '[&>div]:bg-red-600'
  };
  
  const getVariantByValue = (percentage: number) => {
    if (percentage >= 80) return 'success';
    if (percentage >= 60) return 'default';
    if (percentage >= 40) return 'warning';
    return 'danger';
  };
  
  const finalVariant = variant === 'default' && !showValue ? getVariantByValue(percentage) : variant;

  return (
    <div className={cn('space-y-1', className)}>
      {(label || showValue || showPercentage) && (
        <div className="flex justify-between items-center text-sm">
          {label && <span className="text-gray-700">{label}</span>}
          <div className="flex items-center space-x-2">
            {showValue && (
              <span className="font-medium">
                {value.toLocaleString()} / {max.toLocaleString()}
              </span>
            )}
            {showPercentage && (
              <span className="text-gray-600">
                {percentage.toFixed(0)}%
              </span>
            )}
          </div>
        </div>
      )}
      
      <Progress 
        value={percentage}
        className={cn(
          'w-full',
          sizeClasses[size],
          variantClasses[finalVariant],
          animated && 'transition-all duration-500 ease-out'
        )}
      />
    </div>
  );
}