"use client"

import React from 'react'
import { Badge } from "@/components/ui/badge"
import { Check, Clock, X, RefreshCw } from "lucide-react"

type PaymentStatus = 'paid' | 'pending' | 'refunded' | 'failed'

interface PaymentStatusBadgeProps {
  status: PaymentStatus
  size?: 'sm' | 'md' | 'lg'
}

export function PaymentStatusBadge({ status, size = 'md' }: PaymentStatusBadgeProps) {
  const sizeClasses = {
    sm: 'text-xs py-0 px-2',
    md: 'text-xs py-1 px-2',
    lg: 'text-sm py-1 px-3'
  }
  
  const getStatusConfig = (status: PaymentStatus) => {
    switch (status) {
      case 'paid':
        return {
          color: 'bg-green-100 text-green-800 border-green-200 hover:bg-green-200',
          icon: Check,
          label: 'Paid'
        }
      case 'pending':
        return {
          color: 'bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-200',
          icon: Clock,
          label: 'Pending'
        }
      case 'refunded':
        return {
          color: 'bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-200',
          icon: RefreshCw,
          label: 'Refunded'
        }
      case 'failed':
        return {
          color: 'bg-red-100 text-red-800 border-red-200 hover:bg-red-200',
          icon: X,
          label: 'Failed'
        }
      default:
        return {
          color: 'bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-200',
          icon: Clock,
          label: status
        }
    }
  }
  
  const { color, icon: Icon, label } = getStatusConfig(status)
  
  return (
    <Badge 
      variant="outline" 
      className={`${color} ${sizeClasses[size]} font-medium`}
    >
      <Icon className="mr-1 h-3 w-3" />
      {label}
    </Badge>
  )
} 