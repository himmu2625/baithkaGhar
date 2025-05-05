"use client"

import React from 'react'
import { Badge } from "@/components/ui/badge"
import { Check, Clock, X, Calendar } from "lucide-react"

type BookingStatus = 'confirmed' | 'pending' | 'cancelled' | 'completed'

interface BookingStatusBadgeProps {
  status: BookingStatus
  size?: 'sm' | 'md' | 'lg'
}

export function BookingStatusBadge({ status, size = 'md' }: BookingStatusBadgeProps) {
  const sizeClasses = {
    sm: 'text-xs py-0 px-2',
    md: 'text-xs py-1 px-2',
    lg: 'text-sm py-1 px-3'
  }
  
  const getStatusConfig = (status: BookingStatus) => {
    switch (status) {
      case 'confirmed':
        return {
          color: 'bg-green-100 text-green-800 border-green-200 hover:bg-green-200',
          icon: Check,
          label: 'Confirmed'
        }
      case 'pending':
        return {
          color: 'bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-200',
          icon: Clock,
          label: 'Pending'
        }
      case 'cancelled':
        return {
          color: 'bg-red-100 text-red-800 border-red-200 hover:bg-red-200',
          icon: X,
          label: 'Cancelled'
        }
      case 'completed':
        return {
          color: 'bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-200',
          icon: Calendar,
          label: 'Completed'
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