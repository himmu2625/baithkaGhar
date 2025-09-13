"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { AnimatedCounter, CurrencyCounter, PercentageCounter } from './animated-counter';
import { cn } from '@/lib/utils';

interface AnalyticsCardProps {
  title: string;
  value: number;
  previousValue?: number;
  format?: 'number' | 'currency' | 'percentage';
  icon: React.ElementType;
  gradient?: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: number;
  subtitle?: string;
  className?: string;
  loading?: boolean;
}

export function AnalyticsCard({
  title,
  value,
  previousValue,
  format = 'number',
  icon: Icon,
  gradient = 'from-blue-500 to-indigo-600',
  trend,
  trendValue,
  subtitle,
  className,
  loading = false,
}: AnalyticsCardProps) {
  // Calculate trend if not provided
  const calculatedTrend = trend || (previousValue !== undefined 
    ? value > previousValue ? 'up' : value < previousValue ? 'down' : 'neutral'
    : 'neutral');
    
  const calculatedTrendValue = trendValue || (previousValue !== undefined && previousValue !== 0
    ? Math.round(((value - previousValue) / previousValue) * 100)
    : 0);

  const getTrendIcon = () => {
    switch (calculatedTrend) {
      case 'up': return ArrowUpRight;
      case 'down': return ArrowDownRight;
      default: return Minus;
    }
  };

  const getTrendColor = () => {
    switch (calculatedTrend) {
      case 'up': return 'text-green-600 bg-green-50';
      case 'down': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const formatValue = () => {
    if (loading) return "---";
    
    switch (format) {
      case 'currency':
        return <CurrencyCounter amount={value} className="text-3xl font-bold text-gray-900" />;
      case 'percentage':
        return <PercentageCounter percentage={value} className="text-3xl font-bold text-gray-900" />;
      default:
        return <AnimatedCounter end={value} className="text-3xl font-bold text-gray-900" />;
    }
  };

  const TrendIcon = getTrendIcon();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      whileHover={{ y: -2 }}
      className={className}
    >
      <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white/80 backdrop-blur-sm">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600 mb-2">{title}</p>
              
              {loading ? (
                <div className="h-8 bg-gray-200 rounded animate-pulse mb-2"></div>
              ) : (
                <div className="text-3xl font-bold text-gray-900 mb-2">
                  {formatValue()}
                </div>
              )}

              {subtitle && (
                <p className="text-xs text-gray-500 mb-3">{subtitle}</p>
              )}

              {/* Trend Indicator */}
              {!loading && calculatedTrendValue !== 0 && (
                <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getTrendColor()}`}>
                  <TrendIcon className="w-3 h-3 mr-1" />
                  <span>
                    {calculatedTrendValue > 0 ? '+' : ''}{calculatedTrendValue}%
                  </span>
                </div>
              )}
            </div>

            {/* Icon */}
            <div className={`p-4 rounded-2xl bg-gradient-to-r ${gradient} shadow-lg`}>
              <Icon className="w-6 h-6 text-white" />
            </div>
          </div>

          {/* Progress Bar (optional) */}
          {previousValue !== undefined && !loading && (
            <div className="mt-4">
              <div className="w-full bg-gray-200 rounded-full h-1.5">
                <motion.div 
                  className={`h-1.5 rounded-full bg-gradient-to-r ${gradient}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min((value / (previousValue * 1.5)) * 100, 100)}%` }}
                  transition={{ duration: 1, delay: 0.5 }}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

// Specialized card variants
export function RevenueCard({ revenue, previousRevenue, ...props }: Omit<AnalyticsCardProps, 'format' | 'title' | 'value'> & { revenue: number; previousRevenue?: number }) {
  return (
    <AnalyticsCard
      title="Revenue"
      value={revenue}
      previousValue={previousRevenue}
      format="currency"
      gradient="from-green-500 to-emerald-600"
      {...props}
    />
  );
}

export function CommissionCard({ commission, previousCommission, ...props }: Omit<AnalyticsCardProps, 'format' | 'title' | 'value'> & { commission: number; previousCommission?: number }) {
  return (
    <AnalyticsCard
      title="Commission Earned"
      value={commission}
      previousValue={previousCommission}
      format="currency"
      gradient="from-blue-500 to-indigo-600"
      {...props}
    />
  );
}

export function BookingsCard({ bookings, previousBookings, ...props }: Omit<AnalyticsCardProps, 'format' | 'title' | 'value'> & { bookings: number; previousBookings?: number }) {
  return (
    <AnalyticsCard
      title="Total Bookings"
      value={bookings}
      previousValue={previousBookings}
      format="number"
      gradient="from-purple-500 to-pink-600"
      {...props}
    />
  );
}

export function ConversionCard({ rate, previousRate, ...props }: Omit<AnalyticsCardProps, 'format' | 'title' | 'value'> & { rate: number; previousRate?: number }) {
  return (
    <AnalyticsCard
      title="Conversion Rate"
      value={rate}
      previousValue={previousRate}
      format="percentage"
      gradient="from-orange-500 to-red-600"
      {...props}
    />
  );
}

// Stats Grid Layout
export function StatsGrid({ 
  children, 
  className = '' 
}: { 
  children: React.ReactNode; 
  className?: string; 
}) {
  return (
    <div className={cn(
      "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8",
      className
    )}>
      {children}
    </div>
  );
}

// Loading skeleton for analytics card
export function AnalyticsCardSkeleton() {
  return (
    <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="h-4 bg-gray-200 rounded animate-pulse mb-3 w-24"></div>
            <div className="h-8 bg-gray-200 rounded animate-pulse mb-3 w-16"></div>
            <div className="h-6 bg-gray-200 rounded-full animate-pulse w-20"></div>
          </div>
          <div className="w-14 h-14 bg-gray-200 rounded-2xl animate-pulse"></div>
        </div>
      </CardContent>
    </Card>
  );
}