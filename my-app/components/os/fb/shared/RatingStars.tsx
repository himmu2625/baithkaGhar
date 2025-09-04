'use client';

import { Star, StarHalf } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RatingStarsProps {
  rating: number;
  maxRating?: number;
  size?: 'sm' | 'md' | 'lg';
  showValue?: boolean;
  showCount?: boolean;
  count?: number;
  interactive?: boolean;
  onRatingChange?: (rating: number) => void;
  className?: string;
}

export function RatingStars({ 
  rating, 
  maxRating = 5, 
  size = 'md',
  showValue = false,
  showCount = false,
  count,
  interactive = false,
  onRatingChange,
  className 
}: RatingStarsProps) {
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

  const renderStars = () => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    
    for (let i = 1; i <= maxRating; i++) {
      const isFilled = i <= fullStars;
      const isHalf = i === fullStars + 1 && hasHalfStar;
      
      stars.push(
        <button
          key={i}
          type="button"
          disabled={!interactive}
          onClick={() => interactive && onRatingChange?.(i)}
          className={cn(
            'relative',
            interactive && 'hover:scale-110 transition-transform cursor-pointer',
            !interactive && 'cursor-default'
          )}
        >
          {isHalf ? (
            <div className="relative">
              <Star className={cn(sizeClasses[size], 'text-gray-300')} />
              <StarHalf 
                className={cn(
                  sizeClasses[size], 
                  'absolute inset-0 text-yellow-400 fill-current'
                )} 
              />
            </div>
          ) : (
            <Star 
              className={cn(
                sizeClasses[size],
                isFilled ? 'text-yellow-400 fill-current' : 'text-gray-300'
              )} 
            />
          )}
        </button>
      );
    }
    
    return stars;
  };

  return (
    <div className={cn('flex items-center space-x-1', className)}>
      <div className="flex items-center space-x-0.5">
        {renderStars()}
      </div>
      
      {showValue && (
        <span className={cn('font-medium text-gray-700', textSizeClasses[size])}>
          {rating.toFixed(1)}
        </span>
      )}
      
      {showCount && count !== undefined && (
        <span className={cn('text-gray-500', textSizeClasses[size])}>
          ({count.toLocaleString()})
        </span>
      )}
    </div>
  );
}