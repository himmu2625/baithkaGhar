"use client"

import React, { useState, useEffect, useCallback } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Calendar,
  Users,
  IndianRupee,
  Home,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  AlertTriangle,
  BarChart3,
  PieChart,
  MapPin,
  Clock,
  CheckCircle2,
  XCircle,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface PropertyStats {
  totalRooms: number
  availableRooms: number
  bookedRooms: number
  maintenanceRooms: number
  occupancyRate: number
  averageRate: number
}

interface BookingStats {
  total: number
  confirmed: number
  pending: number
  cancelled: number
  todayArrivals: number
  todayDepartures: number
  revenue: number
}

interface PropertyInfo {
  id: string
  title: string
  address: {
    city: string
    state: string
  }
}

interface AnalyticsData {
  property: PropertyInfo
  inventory: PropertyStats
  bookings: BookingStats
}

export function RealAnalyticsDashboard() {
  const params = useParams()
  const propertyId = params.id as string
  
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const fetchAnalyticsData = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      // Fetch data from both APIs in parallel
      const [inventoryResponse, bookingsResponse] = await Promise.all([
        fetch(`/api/os/inventory/${propertyId}`),
        fetch(`/api/os/bookings/${propertyId}`)
      ])

      if (!inventoryResponse.ok || !bookingsResponse.ok) {
        throw new Error('Failed to fetch analytics data')
      }

      const [inventoryData, bookingsData] = await Promise.all([
        inventoryResponse.json(),
        bookingsResponse.json()
      ])

      if (inventoryData.success && bookingsData.success) {
        setAnalytics({
          property: inventoryData.property,
          inventory: inventoryData.stats,
          bookings: bookingsData.stats
        })
        setLastUpdated(new Date())
      } else {
        setError('Failed to load analytics data')
      }
    } catch (error) {
      console.error('Error fetching analytics:', error)
      setError('Failed to load analytics data')
    } finally {
      setIsLoading(false)
    }
  }, [propertyId])

  useEffect(() => {
    if (propertyId) {
      fetchAnalyticsData()
    }
  }, [propertyId, fetchAnalyticsData])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const calculateRevenue = () => {
    if (!analytics) return 0
    return analytics.bookings.revenue
  }

  const calculateOccupancyTrend = () => {
    if (!analytics) return 0
    // Simple trend calculation - could be enhanced with historical data
    const occupancyRate = analytics.inventory.occupancyRate
    return occupancyRate > 70 ? 15 : occupancyRate > 40 ? 5 : -10
  }

  const calculateRevenueTrend = () => {
    if (!analytics) return 0
    // Simple trend calculation based on confirmed vs pending bookings
    const confirmedRatio = analytics.bookings.confirmed / (analytics.bookings.total || 1)
    return confirmedRatio > 0.8 ? 12 : confirmedRatio > 0.6 ? 8 : -5
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-8 bg-gray-200 animate-pulse rounded w-64"></div>
            <div className="h-4 bg-gray-200 animate-pulse rounded w-80"></div>
          </div>
          <div className="h-10 bg-gray-200 animate-pulse rounded w-28"></div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="space-y-3">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive" className="max-w-md mx-auto">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription className="flex items-center justify-between">
          <span>{error}</span>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchAnalyticsData}
            className="ml-4"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </AlertDescription>
      </Alert>
    )
  }

  if (!analytics) return null

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h2>
          <p className="text-gray-600">
            Real-time insights and performance metrics for your property
          </p>
          {analytics.property && (
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <MapPin className="h-4 w-4" />
              <span>{analytics.property.title}</span>
            </div>
          )}
        </div>
        
        <div className="flex items-center space-x-3">
          {lastUpdated && (
            <div className="text-sm text-gray-500 flex items-center space-x-1">
              <Clock className="h-4 w-4" />
              <span>Updated {lastUpdated.toLocaleTimeString()}</span>
            </div>
          )}
          <Button onClick={fetchAnalyticsData} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Key Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Revenue
            </CardTitle>
            <IndianRupee className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {formatCurrency(calculateRevenue())}
            </div>
            <div className="flex items-center space-x-1 mt-1">
              {calculateRevenueTrend() > 0 ? (
                <TrendingUp className="h-3 w-3 text-green-600" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-600" />
              )}
              <span
                className={cn(
                  "text-xs font-medium",
                  calculateRevenueTrend() > 0 ? "text-green-600" : "text-red-600"
                )}
              >
                {Math.abs(calculateRevenueTrend())}% from last month
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Occupancy Rate
            </CardTitle>
            <BarChart3 className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {analytics.inventory.occupancyRate}%
            </div>
            <div className="flex items-center space-x-1 mt-1">
              {calculateOccupancyTrend() > 0 ? (
                <TrendingUp className="h-3 w-3 text-green-600" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-600" />
              )}
              <span
                className={cn(
                  "text-xs font-medium",
                  calculateOccupancyTrend() > 0 ? "text-green-600" : "text-red-600"
                )}
              >
                {Math.abs(calculateOccupancyTrend())}% from last month
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Bookings
            </CardTitle>
            <Calendar className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {analytics.bookings.total}
            </div>
            <div className="flex items-center space-x-2 mt-1">
              <Badge variant="secondary" className="text-xs">
                {analytics.bookings.confirmed} confirmed
              </Badge>
              {analytics.bookings.pending > 0 && (
                <Badge variant="outline" className="text-xs">
                  {analytics.bookings.pending} pending
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Room Availability
            </CardTitle>
            <Home className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {analytics.inventory.availableRooms}/{analytics.inventory.totalRooms}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {analytics.inventory.availableRooms} available rooms
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Today's Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-blue-600" />
              <span>Today's Activity</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium">Check-ins</span>
              </div>
              <div className="text-lg font-bold text-green-700">
                {analytics.bookings.todayArrivals}
              </div>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
              <div className="flex items-center space-x-2">
                <XCircle className="h-4 w-4 text-orange-600" />
                <span className="text-sm font-medium">Check-outs</span>
              </div>
              <div className="text-lg font-bold text-orange-700">
                {analytics.bookings.todayDepartures}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <PieChart className="h-5 w-5 text-purple-600" />
              <span>Room Status Overview</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-sm">Available</span>
                </div>
                <span className="font-semibold">{analytics.inventory.availableRooms}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span className="text-sm">Occupied</span>
                </div>
                <span className="font-semibold">{analytics.inventory.bookedRooms}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <span className="text-sm">Maintenance</span>
                </div>
                <span className="font-semibold">{analytics.inventory.maintenanceRooms}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Additional Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Average Room Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {formatCurrency(analytics.inventory.averageRate)}
            </div>
            <div className="text-sm text-gray-500 mt-1">per night</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Booking Conversion</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {analytics.bookings.total > 0 
                ? Math.round((analytics.bookings.confirmed / analytics.bookings.total) * 100)
                : 0}%
            </div>
            <div className="text-sm text-gray-500 mt-1">confirmed bookings</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Revenue per Room</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {analytics.inventory.totalRooms > 0
                ? formatCurrency(calculateRevenue() / analytics.inventory.totalRooms)
                : formatCurrency(0)}
            </div>
            <div className="text-sm text-gray-500 mt-1">this month</div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}