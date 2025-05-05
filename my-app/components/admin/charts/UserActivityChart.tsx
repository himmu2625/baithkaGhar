"use client"

import React from 'react'
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card"
import { Users } from "lucide-react"

interface UserActivityData {
  date: string
  newUsers: number
  activeUsers: number
}

interface UserActivityChartProps {
  title?: string
  description?: string
  data?: UserActivityData[]
  timeframe?: string
  loading?: boolean
}

export function UserActivityChart({ 
  title = "User Activity", 
  description = "Track new and active users over time",
  data = [], 
  timeframe = "30d",
  loading = false
}: UserActivityChartProps) {
  
  // In a real implementation, you would use a charting library
  // to render actual data visualization
  
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
              <Users className="h-12 w-12 text-gray-300 mb-2" />
              <p className="text-sm text-gray-500">
                User activity chart visualization would appear here
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Timeframe: {timeframe}
              </p>
              <div className="flex items-center justify-center gap-4 mt-4">
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-blue-500 mr-2"></div>
                  <span className="text-xs">New Users</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
                  <span className="text-xs">Active Users</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="h-[300px] w-full flex items-center justify-center bg-gray-50 rounded-md">
            <p className="text-sm text-gray-500">No user activity data available</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
} 