"use client"

import React, { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { GlassCard, GlassCardHeader, GlassCardContent, GlassCardTitle, GlassCardDescription } from "@/components/os/ui/glass-card"
import { EnhancedAnalytics } from "./enhanced-analytics"
import { AdvancedRoomManager } from "../inventory/advanced-room-manager"
import { GuestJourneyTracker } from "../guests/guest-journey-tracker"
import { MaintenanceWorkflowManager } from "../maintenance/workflow-manager"
import {
  LayoutDashboard,
  Bed,
  Users,
  Wrench,
  BarChart3,
  Calendar,
  Bell,
  Zap,
  TrendingUp,
  Clock,
  Shield,
  Star,
  IndianRupee,
  Activity,
  MapPin,
  Phone,
  Mail,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Plus,
  Settings,
} from "lucide-react"

interface DashboardStats {
  occupancy: {
    current: number
    target: number
    trend: number
  }
  revenue: {
    today: number
    month: number
    trend: number
  }
  guests: {
    current: number
    arrivals: number
    departures: number
    satisfaction: number
  }
  maintenance: {
    pending: number
    inProgress: number
    completed: number
    overdue: number
  }
  alerts: Array<{
    id: string
    type: "info" | "warning" | "error"
    title: string
    message: string
    timestamp: string
  }>
}

const sampleStats: DashboardStats = {
  occupancy: {
    current: 87,
    target: 90,
    trend: 5.2
  },
  revenue: {
    today: 45000,
    month: 850000,
    trend: 12.3
  },
  guests: {
    current: 142,
    arrivals: 28,
    departures: 15,
    satisfaction: 4.6
  },
  maintenance: {
    pending: 8,
    inProgress: 5,
    completed: 23,
    overdue: 2
  },
  alerts: [
    {
      id: "1",
      type: "warning",
      title: "High Priority Maintenance",
      message: "AC unit in room 301 requires immediate attention",
      timestamp: "2024-01-15T14:30:00Z"
    },
    {
      id: "2",
      type: "info",
      title: "Peak Hours Approaching",
      message: "Expect increased check-in activity between 3-5 PM",
      timestamp: "2024-01-15T13:45:00Z"
    },
    {
      id: "3",
      type: "error",
      title: "System Alert",
      message: "WiFi connectivity issues reported on Floor 2",
      timestamp: "2024-01-15T13:15:00Z"
    }
  ]
}

export function EnhancedDashboard() {
  const [activeTab, setActiveTab] = useState("overview")
  const [stats, setStats] = useState<DashboardStats>(sampleStats)
  const [currentTime, setCurrentTime] = useState(new Date())
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 60000)

    return () => clearInterval(timer)
  }, [])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-IN", {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-IN", {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    setRefreshing(false)
  }

  const getAlertIcon = (type: string) => {
    switch (type) {
      case "error":
        return <AlertTriangle className="h-4 w-4 text-red-400" />
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-yellow-400" />
      default:
        return <Bell className="h-4 w-4 text-blue-400" />
    }
  }

  const getAlertColor = (type: string) => {
    switch (type) {
      case "error":
        return "border-red-400/50 bg-red-500/10"
      case "warning":
        return "border-yellow-400/50 bg-yellow-500/10"
      default:
        return "border-blue-400/50 bg-blue-500/10"
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Hotel Management Dashboard</h1>
          <div className="flex items-center space-x-4 mt-2">
            <p className="text-white/70">{formatDate(currentTime)}</p>
            <div className="w-1 h-1 bg-white/30 rounded-full" />
            <p className="text-white/70">{formatTime(currentTime)}</p>
            <div className="w-1 h-1 bg-white/30 rounded-full" />
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <span className="text-green-400 font-medium text-sm">System Online</span>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
            className="bg-white/10 border-white/20 text-white hover:bg-white/20"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            size="sm"
            className="group relative overflow-hidden bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white border-0 shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:scale-110 hover:-translate-y-1"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-indigo-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative flex items-center space-x-2">
              <Plus className="h-4 w-4 group-hover:rotate-90 transition-transform duration-300" />
              <span className="font-bold">Quick Action</span>
              <div className="ml-1 w-2 h-2 bg-white/70 rounded-full animate-pulse"></div>
            </div>
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="bg-white/10 border-white/20 text-white hover:bg-white/20"
          >
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      {/* Quick Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Occupancy */}
        <GlassCard variant="gradient" className="group hover:scale-105 transition-transform">
          <GlassCardContent>
            <div className="flex items-center justify-between py-6">
              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <Bed className="h-5 w-5 text-blue-400" />
                  <span className="text-sm font-medium text-white/80">Occupancy</span>
                </div>
                <div className="text-3xl font-bold text-white mb-1">
                  {stats.occupancy.current}%
                </div>
                <div className="flex items-center space-x-1">
                  <TrendingUp className="h-3 w-3 text-green-400" />
                  <span className="text-xs text-green-400">+{stats.occupancy.trend}%</span>
                </div>
              </div>
              <div className="relative">
                <div className="w-16 h-16 rounded-full border-4 border-blue-500/20 flex items-center justify-center">
                  <div className="w-12 h-12 rounded-full bg-blue-500/30 flex items-center justify-center">
                    <span className="text-xs font-bold text-blue-400">
                      {stats.occupancy.current}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </GlassCardContent>
        </GlassCard>

        {/* Revenue */}
        <GlassCard variant="gradient" className="group hover:scale-105 transition-transform">
          <GlassCardContent>
            <div className="flex items-center justify-between py-6">
              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <IndianRupee className="h-5 w-5 text-green-400" />
                  <span className="text-sm font-medium text-white/80">Revenue Today</span>
                </div>
                <div className="text-2xl font-bold text-white mb-1">
                  {formatCurrency(stats.revenue.today)}
                </div>
                <div className="flex items-center space-x-1">
                  <TrendingUp className="h-3 w-3 text-green-400" />
                  <span className="text-xs text-green-400">+{stats.revenue.trend}%</span>
                </div>
              </div>
              <div className="relative">
                <div className="w-16 h-16 rounded-full border-4 border-green-500/20 flex items-center justify-center">
                  <div className="w-12 h-12 rounded-full bg-green-500/30 flex items-center justify-center">
                    <IndianRupee className="h-6 w-6 text-green-400" />
                  </div>
                </div>
              </div>
            </div>
          </GlassCardContent>
        </GlassCard>

        {/* Guests */}
        <GlassCard variant="gradient" className="group hover:scale-105 transition-transform">
          <GlassCardContent>
            <div className="flex items-center justify-between py-6">
              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <Users className="h-5 w-5 text-purple-400" />
                  <span className="text-sm font-medium text-white/80">Guests</span>
                </div>
                <div className="text-3xl font-bold text-white mb-1">
                  {stats.guests.current}
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="text-center">
                    <div className="text-green-400 font-medium">+{stats.guests.arrivals}</div>
                    <div className="text-white/60">Arrivals</div>
                  </div>
                  <div className="text-center">
                    <div className="text-blue-400 font-medium">-{stats.guests.departures}</div>
                    <div className="text-white/60">Departures</div>
                  </div>
                </div>
              </div>
              <div className="relative">
                <div className="w-16 h-16 rounded-full border-4 border-purple-500/20 flex items-center justify-center">
                  <div className="w-12 h-12 rounded-full bg-purple-500/30 flex items-center justify-center">
                    <Users className="h-6 w-6 text-purple-400" />
                  </div>
                </div>
              </div>
            </div>
          </GlassCardContent>
        </GlassCard>

        {/* Maintenance */}
        <GlassCard variant="gradient" className="group hover:scale-105 transition-transform">
          <GlassCardContent>
            <div className="flex items-center justify-between py-6">
              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <Wrench className="h-5 w-5 text-orange-400" />
                  <span className="text-sm font-medium text-white/80">Maintenance</span>
                </div>
                <div className="text-2xl font-bold text-white mb-1">
                  {stats.maintenance.pending + stats.maintenance.inProgress}
                </div>
                <div className="grid grid-cols-2 gap-1 text-xs">
                  <div className="text-center">
                    <div className="text-yellow-400 font-medium">{stats.maintenance.pending}</div>
                    <div className="text-white/60">Pending</div>
                  </div>
                  <div className="text-center">
                    <div className="text-red-400 font-medium">{stats.maintenance.overdue}</div>
                    <div className="text-white/60">Overdue</div>
                  </div>
                </div>
              </div>
              <div className="relative">
                <div className="w-16 h-16 rounded-full border-4 border-orange-500/20 flex items-center justify-center">
                  <div className="w-12 h-12 rounded-full bg-orange-500/30 flex items-center justify-center">
                    <Wrench className="h-6 w-6 text-orange-400" />
                  </div>
                </div>
              </div>
            </div>
          </GlassCardContent>
        </GlassCard>
      </div>

      {/* System Alerts */}
      {stats.alerts.length > 0 && (
        <GlassCard variant="subtle">
          <GlassCardHeader>
            <GlassCardTitle>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Bell className="h-5 w-5 text-yellow-400" />
                  <span>System Alerts</span>
                </div>
                <Badge variant="outline" className="bg-red-500/20 text-red-400 border-red-400/50">
                  {stats.alerts.length} Active
                </Badge>
              </div>
            </GlassCardTitle>
          </GlassCardHeader>
          <GlassCardContent>
            <div className="space-y-3">
              {stats.alerts.slice(0, 3).map((alert) => (
                <div key={alert.id} className={`p-4 rounded-lg border ${getAlertColor(alert.type)}`}>
                  <div className="flex items-start space-x-3">
                    {getAlertIcon(alert.type)}
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-white">{alert.title}</div>
                      <div className="text-sm text-white/80 mt-1">{alert.message}</div>
                      <div className="text-xs text-white/60 mt-2">
                        {new Date(alert.timestamp).toLocaleTimeString("en-IN")}
                      </div>
                    </div>
                    <Button size="sm" variant="outline" className="bg-white/10 border-white/20 text-white">
                      Resolve
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </GlassCardContent>
        </GlassCard>
      )}

      {/* Main Dashboard Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5 bg-white/10 backdrop-blur">
          <TabsTrigger 
            value="overview" 
            className="text-white data-[state=active]:bg-white/20 data-[state=active]:text-white"
          >
            <LayoutDashboard className="h-4 w-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger 
            value="analytics" 
            className="text-white data-[state=active]:bg-white/20 data-[state=active]:text-white"
          >
            <BarChart3 className="h-4 w-4 mr-2" />
            Analytics
          </TabsTrigger>
          <TabsTrigger 
            value="rooms" 
            className="text-white data-[state=active]:bg-white/20 data-[state=active]:text-white"
          >
            <Bed className="h-4 w-4 mr-2" />
            Rooms
          </TabsTrigger>
          <TabsTrigger 
            value="guests" 
            className="text-white data-[state=active]:bg-white/20 data-[state=active]:text-white"
          >
            <Users className="h-4 w-4 mr-2" />
            Guests
          </TabsTrigger>
          <TabsTrigger 
            value="maintenance" 
            className="text-white data-[state=active]:bg-white/20 data-[state=active]:text-white"
          >
            <Wrench className="h-4 w-4 mr-2" />
            Maintenance
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Activity */}
            <GlassCard variant="subtle">
              <GlassCardHeader>
                <GlassCardTitle>Recent Activity</GlassCardTitle>
                <GlassCardDescription>Latest events and updates</GlassCardDescription>
              </GlassCardHeader>
              <GlassCardContent>
                <div className="space-y-4">
                  <div className="flex items-center space-x-3 p-3 bg-white/5 rounded-lg">
                    <CheckCircle2 className="h-5 w-5 text-green-400" />
                    <div className="flex-1">
                      <div className="text-sm font-medium text-white">Room 205 checked out</div>
                      <div className="text-xs text-white/60">2 minutes ago</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3 p-3 bg-white/5 rounded-lg">
                    <Users className="h-5 w-5 text-blue-400" />
                    <div className="flex-1">
                      <div className="text-sm font-medium text-white">New guest arrival - Room 301</div>
                      <div className="text-xs text-white/60">8 minutes ago</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3 p-3 bg-white/5 rounded-lg">
                    <Wrench className="h-5 w-5 text-yellow-400" />
                    <div className="flex-1">
                      <div className="text-sm font-medium text-white">Maintenance completed - AC repair</div>
                      <div className="text-xs text-white/60">15 minutes ago</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3 p-3 bg-white/5 rounded-lg">
                    <Star className="h-5 w-5 text-purple-400" />
                    <div className="flex-1">
                      <div className="text-sm font-medium text-white">New 5-star review received</div>
                      <div className="text-xs text-white/60">1 hour ago</div>
                    </div>
                  </div>
                </div>
              </GlassCardContent>
            </GlassCard>

            {/* Enhanced Quick Actions */}
            <GlassCard variant="subtle" className="border-0 shadow-2xl bg-gradient-to-br from-white via-purple-50/20 to-pink-50/30 overflow-hidden hover:shadow-3xl transition-all duration-500">
              <GlassCardHeader className="bg-gradient-to-r from-purple-100/80 via-pink-100/80 to-red-100/80 border-b border-purple-200/50 backdrop-blur-sm">
                <div className="flex items-center space-x-3">
                  <div className="p-3 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-xl shadow-lg">
                    <Plus className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <GlassCardTitle className="text-xl font-bold text-purple-900">Quick Actions</GlassCardTitle>
                    <GlassCardDescription className="text-purple-700 font-medium">Frequently used operations and shortcuts</GlassCardDescription>
                  </div>
                </div>
              </GlassCardHeader>
              <GlassCardContent className="p-6">
                <div className="grid grid-cols-2 gap-4">
                  <Button className="group relative overflow-hidden bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 h-24 flex-col border-0 shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:scale-105 hover:-translate-y-1">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-indigo-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <div className="relative flex flex-col items-center">
                      <Plus className="h-7 w-7 mb-2 group-hover:rotate-90 transition-transform duration-300" />
                      <span className="font-bold text-sm">New Booking</span>
                    </div>
                  </Button>
                  
                  <Button className="group relative overflow-hidden bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 h-24 flex-col border-0 shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:scale-105 hover:-translate-y-1">
                    <div className="absolute inset-0 bg-gradient-to-r from-green-500/20 to-emerald-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <div className="relative flex flex-col items-center">
                      <Users className="h-7 w-7 mb-2 group-hover:scale-110 transition-transform duration-300" />
                      <span className="font-bold text-sm">Guest Check-in</span>
                    </div>
                  </Button>
                  
                  <Button className="group relative overflow-hidden bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 h-24 flex-col border-0 shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:scale-105 hover:-translate-y-1">
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-pink-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <div className="relative flex flex-col items-center">
                      <Calendar className="h-7 w-7 mb-2 group-hover:animate-pulse" />
                      <span className="font-bold text-sm">Room Status</span>
                    </div>
                  </Button>
                  
                  <Button className="group relative overflow-hidden bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 h-24 flex-col border-0 shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:scale-105 hover:-translate-y-1">
                    <div className="absolute inset-0 bg-gradient-to-r from-orange-500/20 to-red-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <div className="relative flex flex-col items-center">
                      <Wrench className="h-7 w-7 mb-2 group-hover:rotate-12 transition-transform duration-300" />
                      <span className="font-bold text-sm">Maintenance</span>
                    </div>
                  </Button>
                </div>
              </GlassCardContent>
            </GlassCard>
          </div>
        </TabsContent>

        <TabsContent value="analytics">
          <EnhancedAnalytics />
        </TabsContent>

        <TabsContent value="rooms">
          <AdvancedRoomManager />
        </TabsContent>

        <TabsContent value="guests">
          <GuestJourneyTracker />
        </TabsContent>

        <TabsContent value="maintenance">
          <MaintenanceWorkflowManager />
        </TabsContent>
      </Tabs>
    </div>
  )
}