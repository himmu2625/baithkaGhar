"use client"

import React from 'react'
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card"
import { BarChart } from "lucide-react"

interface BookingData {
  date: string
  count: number
  status?: 'confirmed' | 'pending' | 'cancelled' | 'completed'
}

interface BookingsChartProps {
  title?: string
  description?: string
  data?: BookingData[]
  timeframe?: string
  loading?: boolean
}

export function BookingsChart({ 
  title = "Bookings Overview", 
  description = "Track bookings over time",
  data = [], 
  timeframe = "30d",
  loading = false
}: BookingsChartProps) {
  
  // In a real implementation, you would use a charting library like Recharts
  // to render a real chart. This is just a placeholder component.
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="h-[300px] w-full bg-gray-100 animate-pulse rounded-md"></div>
        ) : data.length > 0 ? (
          <div className="relative h-[300px] w-full">
            {/* This is a placeholder for the actual chart */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <BarChart className="h-12 w-12 text-gray-300 mb-2" />
              <p className="text-sm text-gray-500">
                Bookings chart visualization would appear here
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Timeframe: {timeframe}
              </p>
              <div className="flex items-center justify-center gap-4 mt-4">
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
                  <span className="text-xs">Confirmed</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-yellow-500 mr-2"></div>
                  <span className="text-xs">Pending</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-red-500 mr-2"></div>
                  <span className="text-xs">Cancelled</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-blue-500 mr-2"></div>
                  <span className="text-xs">Completed</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="h-[300px] w-full flex items-center justify-center bg-gray-50 rounded-md">
            <p className="text-sm text-gray-500">No booking data available</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
} 