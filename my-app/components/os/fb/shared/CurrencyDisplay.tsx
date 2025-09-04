'use client';

import { cn } from '@/lib/utils';

interface CurrencyDisplayProps {
  amount: number;
  currency?: 'INR' | 'USD' | 'EUR';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'default' | 'compact' | 'detailed';
  showSign?: boolean;
  className?: string;
}

export function CurrencyDisplay({ 
  amount, 
  currency = 'INR', 
  size = 'md',
  variant = 'default',
  showSign = false,
  className 
}: CurrencyDisplayProps) {
  const formatCurrency = (amount: number, currency: string, variant: string) => {
    const isNegative = amount < 0;
    const absAmount = Math.abs(amount);
    
    const currencySymbols = {
      INR: '₹',
      USD: '$',
      EUR: '€'
    };
    
    const symbol = currencySymbols[currency as keyof typeof currencySymbols] || '₹';
    
    if (variant === 'compact' && absAmount >= 1000) {
      const value = absAmount >= 10000000 ? (absAmount / 10000000).toFixed(1) + 'Cr' :
                   absAmount >= 100000 ? (absAmount / 100000).toFixed(1) + 'L' :
                   (absAmount / 1000).toFixed(1) + 'K';
      return `${isNegative ? '-' : showSign ? '+' : ''}${symbol}${value}`;
    }
    
    const formatted = absAmount.toLocaleString('en-IN', {
      minimumFractionDigits: variant === 'detailed' ? 2 : 0,
      maximumFractionDigits: variant === 'detailed' ? 2 : 0
    });
    
    return `${isNegative ? '-' : showSign ? '+' : ''}${symbol}${formatted}`;
  };
  
  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl'
  };
  
  const colorClasses = amount < 0 ? 'text-red-600' : 
                     showSign && amount > 0 ? 'text-green-600' : 
                     'text-gray-900';

  return (
    <span 
      className={cn(
        'font-semibold tabular-nums',
        sizeClasses[size],
        colorClasses,
        className
      )}
      title={`${currency} ${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
    >
      {formatCurrency(amount, currency, variant)}
    </span>
  );
}