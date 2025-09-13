"use client";

import React, { useEffect, useState } from 'react';
import { motion, useAnimation, useInView } from 'framer-motion';

interface AnimatedCounterProps {
  end: number;
  start?: number;
  duration?: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
  enableOnView?: boolean;
}

export function AnimatedCounter({
  end,
  start = 0,
  duration = 2,
  decimals = 0,
  prefix = '',
  suffix = '',
  className = '',
  enableOnView = true,
}: AnimatedCounterProps) {
  const [count, setCount] = useState(start);
  const controls = useAnimation();
  const ref = React.useRef(null);
  const inView = useInView(ref);

  useEffect(() => {
    if (enableOnView && !inView) return;

    let startTime: number;
    let animationFrame: number;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / (duration * 1000), 1);
      
      const easeOutCubic = 1 - Math.pow(1 - progress, 3);
      const currentCount = start + (end - start) * easeOutCubic;
      
      setCount(currentCount);

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [end, start, duration, inView, enableOnView]);

  const formattedCount = count.toFixed(decimals);

  return (
    <motion.span
      ref={ref}
      className={className}
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      {prefix}{formattedCount}{suffix}
    </motion.span>
  );
}

// Specialized currency counter
export function CurrencyCounter({ 
  amount, 
  currency = '₹', 
  className = '',
  ...props 
}: Omit<AnimatedCounterProps, 'prefix'> & { 
  amount: number; 
  currency?: string; 
}) {
  return (
    <AnimatedCounter
      end={amount}
      prefix={currency}
      className={className}
      {...props}
    />
  );
}

// Percentage counter
export function PercentageCounter({ 
  percentage, 
  className = '',
  showSign = true,
  ...props 
}: Omit<AnimatedCounterProps, 'suffix' | 'end'> & { 
  percentage: number;
  showSign?: boolean;
}) {
  return (
    <AnimatedCounter
      end={percentage}
      suffix={showSign ? '%' : ''}
      decimals={1}
      className={className}
      {...props}
    />
  );
}

// Stats counter with formatting
export function StatsCounter({
  value,
  label,
  format = 'number',
  icon: Icon,
  trend,
  trendValue,
  className = '',
}: {
  value: number;
  label: string;
  format?: 'number' | 'currency' | 'percentage';
  icon?: React.ElementType;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: number;
  className?: string;
}) {
  const formatValue = () => {
    switch (format) {
      case 'currency':
        return <CurrencyCounter amount={value} />;
      case 'percentage':
        return <PercentageCounter percentage={value} />;
      default:
        return <AnimatedCounter end={value} />;
    }
  };

  const getTrendColor = () => {
    switch (trend) {
      case 'up': return 'text-green-600';
      case 'down': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <motion.div
      className={`p-6 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow duration-300 ${className}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 mb-1">{label}</p>
          <div className="text-3xl font-bold text-gray-900">
            {formatValue()}
          </div>
          {trend && trendValue !== undefined && (
            <div className={`flex items-center mt-2 text-sm ${getTrendColor()}`}>
              <span>{trend === 'up' ? '↗' : trend === 'down' ? '↘' : '→'}</span>
              <span className="ml-1">
                {trendValue > 0 ? '+' : ''}{trendValue}%
              </span>
            </div>
          )}
        </div>
        {Icon && (
          <div className="p-3 bg-gray-100 rounded-full">
            <Icon className="w-6 h-6 text-gray-600" />
          </div>
        )}
      </div>
    </motion.div>
  );
}