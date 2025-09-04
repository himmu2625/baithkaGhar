'use client';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

type StatusType = 
  | 'active' | 'inactive' | 'pending' | 'completed' | 'cancelled' | 'confirmed'
  | 'preparing' | 'ready' | 'served' | 'occupied' | 'available' | 'reserved'
  | 'in-stock' | 'low-stock' | 'out-of-stock' | 'expired'
  | 'high' | 'medium' | 'low' | 'urgent';

interface StatusBadgeProps {
  status: StatusType;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'outline' | 'solid';
}

export function StatusBadge({ status, size = 'md', variant = 'default' }: StatusBadgeProps) {
  const getStatusConfig = (status: StatusType) => {
    const configs = {
      // Order statuses
      pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800 border-yellow-300' },
      preparing: { label: 'Preparing', color: 'bg-blue-100 text-blue-800 border-blue-300' },
      ready: { label: 'Ready', color: 'bg-green-100 text-green-800 border-green-300' },
      served: { label: 'Served', color: 'bg-gray-100 text-gray-800 border-gray-300' },
      completed: { label: 'Completed', color: 'bg-green-100 text-green-800 border-green-300' },
      cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-800 border-red-300' },
      
      // Table statuses
      available: { label: 'Available', color: 'bg-green-100 text-green-800 border-green-300' },
      occupied: { label: 'Occupied', color: 'bg-red-100 text-red-800 border-red-300' },
      reserved: { label: 'Reserved', color: 'bg-blue-100 text-blue-800 border-blue-300' },
      
      // General statuses
      active: { label: 'Active', color: 'bg-green-100 text-green-800 border-green-300' },
      inactive: { label: 'Inactive', color: 'bg-gray-100 text-gray-800 border-gray-300' },
      confirmed: { label: 'Confirmed', color: 'bg-green-100 text-green-800 border-green-300' },
      
      // Stock statuses
      'in-stock': { label: 'In Stock', color: 'bg-green-100 text-green-800 border-green-300' },
      'low-stock': { label: 'Low Stock', color: 'bg-yellow-100 text-yellow-800 border-yellow-300' },
      'out-of-stock': { label: 'Out of Stock', color: 'bg-red-100 text-red-800 border-red-300' },
      expired: { label: 'Expired', color: 'bg-red-100 text-red-800 border-red-300' },
      
      // Priority levels
      urgent: { label: 'Urgent', color: 'bg-red-100 text-red-800 border-red-300' },
      high: { label: 'High', color: 'bg-orange-100 text-orange-800 border-orange-300' },
      medium: { label: 'Medium', color: 'bg-yellow-100 text-yellow-800 border-yellow-300' },
      low: { label: 'Low', color: 'bg-gray-100 text-gray-800 border-gray-300' },
    };
    
    return configs[status] || { label: status, color: 'bg-gray-100 text-gray-800 border-gray-300' };
  };

  const config = getStatusConfig(status);
  
  const sizeClasses = {
    sm: 'text-xs px-1.5 py-0.5',
    md: 'text-sm px-2 py-1',
    lg: 'text-base px-3 py-1.5'
  };
  
  const variantClasses = {
    default: config.color,
    outline: `border ${config.color} bg-transparent`,
    solid: config.color.replace('100', '500').replace('800', '100')
  };

  return (
    <Badge 
      className={cn(
        'font-medium rounded-full',
        sizeClasses[size],
        variantClasses[variant]
      )}
    >
      {config.label}
    </Badge>
  );
}