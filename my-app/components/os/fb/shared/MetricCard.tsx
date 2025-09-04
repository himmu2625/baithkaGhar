'use client';

import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface MetricCardProps {
  title: string;
  value: string | number;
  icon?: LucideIcon;
  subtitle?: string;
  trend?: {
    value: number;
    label?: string;
    period?: string;
  };
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  className?: string;
}

export function MetricCard({ 
  title, 
  value, 
  icon: Icon, 
  subtitle,
  trend,
  variant = 'default',
  size = 'md',
  loading = false,
  className 
}: MetricCardProps) {
  const formatValue = (val: string | number) => {
    if (typeof val === 'number') {
      return val.toLocaleString();
    }
    return val;
  };

  const getVariantColors = (variant: string) => {
    const colors = {
      default: 'text-blue-600',
      success: 'text-green-600',
      warning: 'text-yellow-600',
      danger: 'text-red-600',
      info: 'text-purple-600'
    };
    return colors[variant as keyof typeof colors] || colors.default;
  };

  const getTrendIcon = (trendValue: number) => {
    return trendValue >= 0 ? TrendingUp : TrendingDown;
  };

  const getTrendColor = (trendValue: number) => {
    return trendValue >= 0 ? 'text-green-600' : 'text-red-600';
  };

  const sizeClasses = {
    sm: {
      header: 'pb-2',
      title: 'text-sm',
      value: 'text-lg',
      subtitle: 'text-xs',
      icon: 'w-4 h-4'
    },
    md: {
      header: 'pb-3',
      title: 'text-base',
      value: 'text-2xl',
      subtitle: 'text-sm',
      icon: 'w-5 h-5'
    },
    lg: {
      header: 'pb-4',
      title: 'text-lg',
      value: 'text-3xl',
      subtitle: 'text-base',
      icon: 'w-6 h-6'
    }
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader className={sizeClasses[size].header}>
          <div className="flex items-center justify-between">
            <div className="h-4 bg-gray-200 rounded w-24 animate-pulse" />
            <div className="h-5 w-5 bg-gray-200 rounded animate-pulse" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="h-8 bg-gray-200 rounded w-20 animate-pulse" />
            <div className="h-3 bg-gray-200 rounded w-16 animate-pulse" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className={sizeClasses[size].header}>
        <CardTitle className={cn('flex items-center justify-between', sizeClasses[size].title)}>
          <span>{title}</span>
          {Icon && (
            <Icon className={cn(sizeClasses[size].icon, getVariantColors(variant))} />
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-1">
          <div className={cn('font-bold', sizeClasses[size].value, getVariantColors(variant))}>
            {formatValue(value)}
          </div>
          
          {subtitle && (
            <p className={cn('text-gray-600', sizeClasses[size].subtitle)}>
              {subtitle}
            </p>
          )}
          
          {trend && (
            <div className={cn('flex items-center space-x-1', sizeClasses[size].subtitle)}>
              {(() => {
                const TrendIcon = getTrendIcon(trend.value);
                return (
                  <>
                    <TrendIcon className={cn('w-3 h-3', getTrendColor(trend.value))} />
                    <span className={getTrendColor(trend.value)}>
                      {Math.abs(trend.value)}%
                    </span>
                    {trend.label && (
                      <span className="text-gray-500">
                        {trend.label}
                      </span>
                    )}
                    {trend.period && (
                      <span className="text-gray-400">
                        vs {trend.period}
                      </span>
                    )}
                  </>
                );
              })()}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}