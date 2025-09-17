'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface StatusIndicatorProps {
  status: string;
  type: 'room' | 'task' | 'maintenance' | 'inventory' | 'priority' | 'condition';
  className?: string;
  showIcon?: boolean;
}

export default function StatusIndicator({ status, type, className, showIcon = true }: StatusIndicatorProps) {
  const getStatusConfig = () => {
    switch (type) {
      case 'room':
        return getRoomStatusConfig(status);
      case 'task':
        return getTaskStatusConfig(status);
      case 'maintenance':
        return getMaintenanceStatusConfig(status);
      case 'inventory':
        return getInventoryStatusConfig(status);
      case 'priority':
        return getPriorityStatusConfig(status);
      case 'condition':
        return getConditionStatusConfig(status);
      default:
        return { color: 'bg-gray-500', icon: '•', label: status };
    }
  };

  const getRoomStatusConfig = (status: string) => {
    const configs = {
      available: { color: 'bg-green-500', icon: '✓', label: 'Available' },
      occupied: { color: 'bg-blue-500', icon: '👤', label: 'Occupied' },
      maintenance: { color: 'bg-orange-500', icon: '🔧', label: 'Maintenance' },
      cleaning: { color: 'bg-yellow-500', icon: '🧹', label: 'Cleaning' },
      out_of_order: { color: 'bg-red-500', icon: '⚠️', label: 'Out of Order' },
      reserved: { color: 'bg-purple-500', icon: '📅', label: 'Reserved' },
    };
    return configs[status as keyof typeof configs] || { color: 'bg-gray-500', icon: '•', label: status };
  };

  const getTaskStatusConfig = (status: string) => {
    const configs = {
      scheduled: { color: 'bg-gray-500', icon: '📅', label: 'Scheduled' },
      assigned: { color: 'bg-blue-500', icon: '👤', label: 'Assigned' },
      in_progress: { color: 'bg-yellow-500', icon: '⏳', label: 'In Progress' },
      paused: { color: 'bg-orange-500', icon: '⏸️', label: 'Paused' },
      completed: { color: 'bg-green-500', icon: '✅', label: 'Completed' },
      cancelled: { color: 'bg-red-500', icon: '❌', label: 'Cancelled' },
      delayed: { color: 'bg-purple-500', icon: '⏰', label: 'Delayed' },
      failed: { color: 'bg-red-600', icon: '💥', label: 'Failed' },
      requires_inspection: { color: 'bg-indigo-500', icon: '🔍', label: 'Requires Inspection' },
    };
    return configs[status as keyof typeof configs] || { color: 'bg-gray-500', icon: '•', label: status };
  };

  const getMaintenanceStatusConfig = (status: string) => {
    const configs = {
      reported: { color: 'bg-yellow-500', icon: '📋', label: 'Reported' },
      acknowledged: { color: 'bg-blue-500', icon: '👁️', label: 'Acknowledged' },
      assigned: { color: 'bg-indigo-500', icon: '👤', label: 'Assigned' },
      in_progress: { color: 'bg-orange-500', icon: '🔧', label: 'In Progress' },
      on_hold: { color: 'bg-gray-500', icon: '⏸️', label: 'On Hold' },
      waiting_parts: { color: 'bg-purple-500', icon: '📦', label: 'Waiting Parts' },
      completed: { color: 'bg-green-500', icon: '✅', label: 'Completed' },
      verified: { color: 'bg-green-600', icon: '✓', label: 'Verified' },
      closed: { color: 'bg-gray-600', icon: '🔒', label: 'Closed' },
      cancelled: { color: 'bg-red-500', icon: '❌', label: 'Cancelled' },
    };
    return configs[status as keyof typeof configs] || { color: 'bg-gray-500', icon: '•', label: status };
  };

  const getInventoryStatusConfig = (status: string) => {
    const configs = {
      in_stock: { color: 'bg-green-500', icon: '📦', label: 'In Stock' },
      low_stock: { color: 'bg-yellow-500', icon: '⚠️', label: 'Low Stock' },
      out_of_stock: { color: 'bg-red-500', icon: '❌', label: 'Out of Stock' },
      ordered: { color: 'bg-blue-500', icon: '🛒', label: 'Ordered' },
      damaged: { color: 'bg-orange-500', icon: '💥', label: 'Damaged' },
      needs_replacement: { color: 'bg-purple-500', icon: '🔄', label: 'Needs Replacement' },
    };
    return configs[status as keyof typeof configs] || { color: 'bg-gray-500', icon: '•', label: status };
  };

  const getPriorityStatusConfig = (status: string) => {
    const configs = {
      low: { color: 'bg-gray-500', icon: '⬇️', label: 'Low' },
      medium: { color: 'bg-blue-500', icon: '➡️', label: 'Medium' },
      high: { color: 'bg-orange-500', icon: '⬆️', label: 'High' },
      urgent: { color: 'bg-red-500', icon: '🔥', label: 'Urgent' },
      emergency: { color: 'bg-red-600', icon: '🚨', label: 'Emergency' },
    };
    return configs[status as keyof typeof configs] || { color: 'bg-gray-500', icon: '•', label: status };
  };

  const getConditionStatusConfig = (status: string) => {
    const configs = {
      excellent: { color: 'bg-green-500', icon: '⭐', label: 'Excellent' },
      good: { color: 'bg-blue-500', icon: '👍', label: 'Good' },
      fair: { color: 'bg-yellow-500', icon: '👌', label: 'Fair' },
      poor: { color: 'bg-orange-500', icon: '👎', label: 'Poor' },
      critical: { color: 'bg-red-500', icon: '💥', label: 'Critical' },
      missing: { color: 'bg-red-600', icon: '❓', label: 'Missing' },
      damaged: { color: 'bg-red-500', icon: '💔', label: 'Damaged' },
      needs_renovation: { color: 'bg-purple-500', icon: '🏗️', label: 'Needs Renovation' },
    };
    return configs[status as keyof typeof configs] || { color: 'bg-gray-500', icon: '•', label: status };
  };

  const config = getStatusConfig();

  return (
    <Badge className={cn(config.color, 'text-white', className)}>
      {showIcon && <span className="mr-1">{config.icon}</span>}
      {config.label}
    </Badge>
  );
}

// Utility function to get status color class
export const getStatusColor = (status: string, type: string): string => {
  const indicator = new StatusIndicator({ status, type: type as any, showIcon: false });
  return indicator.props.className || 'bg-gray-500';
};