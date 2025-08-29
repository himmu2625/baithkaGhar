"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Activity,
  Calendar,
  Clock,
  IndianRupee,
  TrendingUp,
  TrendingDown,
  Users,
  Zap,
  RefreshCw,
  Wifi,
  WifiOff,
  Bell
} from "lucide-react"
import { toast } from "@/hooks/use-toast"

interface RealtimeMetrics {
  activeBookings: number
  todayBookings: number
  todayRevenue: number
  currentOccupancy: number
  pendingActions: number
  recentActivity: Array<{
    id: string
    type: 'booking_created' | 'booking_confirmed' | 'booking_cancelled' | 'payment_received'
    message: string
    timestamp: string
    amount?: number
    propertyName?: string
  }>
  hourlyStats: Array<{
    hour: number
    bookings: number
    revenue: number
  }>
}

export default function RealTimeBookingMetrics() {
  const [metrics, setMetrics] = useState<RealtimeMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [connected, setConnected] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const wsRef = useRef<WebSocket | null>(null)

  // Simulated real-time data (in a real app, this would come from WebSocket or Server-Sent Events)
  const fetchRealtimeMetrics = async () => {
    try {
      // For now, we'll simulate real-time data by adding some randomness to the base metrics
      const baseResponse = await fetch('/api/admin/analytics/bookings?timeframe=1')
      
      if (!baseResponse.ok) {
        throw new Error('Failed to fetch metrics')
      }
      
      const baseData = await baseResponse.json()
      
      // Simulate real-time variations
      const now = new Date()
      const currentHour = now.getHours()
      
      // Generate hourly stats for today
      const hourlyStats = Array.from({ length: 24 }, (_, hour) => ({
        hour,
        bookings: Math.floor(Math.random() * 10) + (hour >= 9 && hour <= 18 ? 5 : 1),
        revenue: Math.floor(Math.random() * 50000) + (hour >= 9 && hour <= 18 ? 25000 : 5000)
      }))
      
      // Generate recent activity
      const activityTypes = ['booking_created', 'booking_confirmed', 'booking_cancelled', 'payment_received'] as const
      const recentActivity = Array.from({ length: 8 }, (_, index) => {
        const type = activityTypes[Math.floor(Math.random() * activityTypes.length)]
        const timestamp = new Date(Date.now() - (index * 15 * 60 * 1000)) // 15 minutes apart
        
        let message = ''
        let amount = undefined
        const propertyName = `Property ${Math.floor(Math.random() * 20) + 1}`
        
        switch (type) {
          case 'booking_created':
            message = `New booking received for ${propertyName}`
            amount = Math.floor(Math.random() * 15000) + 5000
            break
          case 'booking_confirmed':
            message = `Booking confirmed for ${propertyName}`
            break
          case 'booking_cancelled':
            message = `Booking cancelled for ${propertyName}`
            amount = Math.floor(Math.random() * 12000) + 3000
            break
          case 'payment_received':
            message = `Payment received for ${propertyName}`
            amount = Math.floor(Math.random() * 18000) + 7000
            break
        }
        
        return {
          id: `activity_${index}`,
          type,
          message,
          timestamp: timestamp.toISOString(),
          amount,
          propertyName
        }
      })
      
      const realtimeMetrics: RealtimeMetrics = {
        activeBookings: baseData.overview.totalBookings + Math.floor(Math.random() * 5),
        todayBookings: Math.floor(Math.random() * 25) + 10,
        todayRevenue: Math.floor(Math.random() * 100000) + 50000,
        currentOccupancy: Math.floor(Math.random() * 40) + 60, // 60-100%
        pendingActions: Math.floor(Math.random() * 8) + 2,
        recentActivity,
        hourlyStats
      }
      
      setMetrics(realtimeMetrics)
      setLastUpdated(new Date())
      setConnected(true)
      
    } catch (error: any) {
      console.error('Error fetching realtime metrics:', error)
      setConnected(false)
      toast({
        title: "Connection Error",
        description: "Failed to fetch real-time metrics",
        variant: "destructive"
      })
    }
  }

  // Initialize WebSocket connection (simulated)
  const initializeWebSocket = () => {
    // In a real implementation, this would connect to a WebSocket endpoint
    // For now, we'll simulate with a timer
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }
    
    if (autoRefresh) {
      intervalRef.current = setInterval(() => {
        fetchRealtimeMetrics()
      }, 30000) // Update every 30 seconds
    }
  }

  useEffect(() => {
    fetchRealtimeMetrics()
    setLoading(false)
    
    if (autoRefresh) {
      initializeWebSocket()
    }
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
      if (wsRef.current) {
        wsRef.current.close()
      }
    }
  }, [autoRefresh])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount)
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'booking_created': return <Calendar className="h-4 w-4 text-green-600" />
      case 'booking_confirmed': return <TrendingUp className="h-4 w-4 text-blue-600" />
      case 'booking_cancelled': return <TrendingDown className="h-4 w-4 text-red-600" />
      case 'payment_received': return <IndianRupee className="h-4 w-4 text-purple-600" />
      default: return <Activity className="h-4 w-4 text-gray-600" />
    }
  }

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'booking_created': return 'border-l-green-500 bg-green-50'
      case 'booking_confirmed': return 'border-l-blue-500 bg-blue-50'
      case 'booking_cancelled': return 'border-l-red-500 bg-red-50'
      case 'payment_received': return 'border-l-purple-500 bg-purple-50'
      default: return 'border-l-gray-500 bg-gray-50'
    }
  }

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date()
    const time = new Date(timestamp)
    const diffInMinutes = Math.floor((now.getTime() - time.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 1) return 'Just now'
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`
    const hours = Math.floor(diffInMinutes / 60)
    if (hours < 24) return `${hours}h ago`
    const days = Math.floor(hours / 24)
    return `${days}d ago`
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }, (_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-8 bg-gray-200 rounded w-1/2"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (!metrics) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <WifiOff className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Connection Lost</h3>
          <p className="text-gray-600 mb-4">Unable to load real-time metrics</p>
          <Button onClick={fetchRealtimeMetrics} className="bg-darkGreen hover:bg-darkGreen/90">
            <RefreshCw className="h-4 w-4 mr-2" />
            Reconnect
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with status */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-bold flex items-center">
            <Zap className="mr-2 h-5 w-5 text-yellow-500" />
            Real-time Metrics
          </h2>
          <Badge variant={connected ? "default" : "destructive"} className="flex items-center gap-1">
            {connected ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
            {connected ? "Live" : "Disconnected"}
          </Badge>
        </div>
        
        <div className="flex items-center gap-2">
          {lastUpdated && (
            <span className="text-sm text-gray-500">
              Last updated: {formatTimeAgo(lastUpdated.toISOString())}
            </span>
          )}
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={autoRefresh ? "bg-green-50 border-green-200" : ""}
          >
            <Bell className={`h-4 w-4 mr-2 ${autoRefresh ? "text-green-600" : ""}`} />
            {autoRefresh ? "Auto-refresh On" : "Auto-refresh Off"}
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={fetchRealtimeMetrics}
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="relative overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Bookings</p>
                <div className="text-2xl font-bold">{metrics.activeBookings}</div>
              </div>
              <Activity className="h-8 w-8 text-blue-600" />
            </div>
            <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-purple-500"></div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Today's Bookings</p>
                <div className="text-2xl font-bold">{metrics.todayBookings}</div>
              </div>
              <Calendar className="h-8 w-8 text-green-600" />
            </div>
            <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-green-500 to-emerald-500"></div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Today's Revenue</p>
                <div className="text-2xl font-bold">{formatCurrency(metrics.todayRevenue)}</div>
              </div>
              <IndianRupee className="h-8 w-8 text-purple-600" />
            </div>
            <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-pink-500"></div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Current Occupancy</p>
                <div className="text-2xl font-bold">{metrics.currentOccupancy}%</div>
              </div>
              <Users className="h-8 w-8 text-orange-600" />
            </div>
            <div 
              className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-orange-500 to-red-500 transition-all duration-300"
              style={{ width: `${metrics.currentOccupancy}%` }}
            ></div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity and Pending Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity Feed */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Activity className="mr-2 h-5 w-5" />
              Live Activity Feed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {metrics.recentActivity.map((activity, index) => (
                <div
                  key={activity.id}
                  className={`p-3 border-l-4 rounded-r-lg ${getActivityColor(activity.type)} transition-all duration-200 hover:shadow-sm`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      {getActivityIcon(activity.type)}
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-900">
                          {activity.message}
                        </p>
                        {activity.amount && (
                          <p className="text-xs text-gray-600 mt-1">
                            Amount: {formatCurrency(activity.amount)}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="text-xs text-gray-500">
                      {formatTimeAgo(activity.timestamp)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Pending Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Clock className="mr-2 h-5 w-5" />
              Pending Actions
              <Badge variant="secondary" className="ml-2">
                {metrics.pendingActions}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="p-3 border rounded-lg bg-yellow-50 border-yellow-200">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Pending Confirmations</span>
                  <Badge variant="outline">3</Badge>
                </div>
                <p className="text-xs text-gray-600 mt-1">Bookings awaiting confirmation</p>
              </div>
              
              <div className="p-3 border rounded-lg bg-blue-50 border-blue-200">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Payment Reviews</span>
                  <Badge variant="outline">2</Badge>
                </div>
                <p className="text-xs text-gray-600 mt-1">Payments requiring review</p>
              </div>
              
              <div className="p-3 border rounded-lg bg-purple-50 border-purple-200">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Room Allocations</span>
                  <Badge variant="outline">1</Badge>
                </div>
                <p className="text-xs text-gray-600 mt-1">Rooms needing assignment</p>
              </div>
              
              <div className="p-3 border rounded-lg bg-red-50 border-red-200">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Refund Requests</span>
                  <Badge variant="outline">2</Badge>
                </div>
                <p className="text-xs text-gray-600 mt-1">Refunds pending approval</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}