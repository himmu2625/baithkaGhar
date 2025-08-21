"use client"

import React, { useState, useEffect } from "react"
import { GlassCard, GlassCardHeader, GlassCardContent, GlassCardTitle, GlassCardDescription } from "@/components/os/ui/glass-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  Calendar,
  Bed,
  Star,
  Clock,
  Zap,
  BarChart3,
  PieChart,
  Activity,
  Target,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react"
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts"

interface AnalyticsData {
  revenue: {
    current: number
    previous: number
    trend: number
    data: Array<{ date: string; value: number; target: number }>
  }
  occupancy: {
    current: number
    target: number
    data: Array<{ date: string; occupied: number; total: number }>
  }
  bookings: {
    total: number
    confirmed: number
    pending: number
    cancelled: number
    data: Array<{ date: string; bookings: number; revenue: number }>
  }
  guests: {
    current: number
    checkinToday: number
    checkoutToday: number
    satisfaction: number
  }
  performance: Array<{
    metric: string
    value: number
    target: number
    trend: number
  }>
}

const sampleData: AnalyticsData = {
  revenue: {
    current: 245000,
    previous: 220000,
    trend: 11.4,
    data: [
      { date: "Jan", value: 185000, target: 180000 },
      { date: "Feb", value: 195000, target: 190000 },
      { date: "Mar", value: 210000, target: 200000 },
      { date: "Apr", value: 225000, target: 215000 },
      { date: "May", value: 245000, target: 230000 },
      { date: "Jun", value: 265000, target: 250000 },
    ]
  },
  occupancy: {
    current: 85,
    target: 90,
    data: [
      { date: "Mon", occupied: 45, total: 50 },
      { date: "Tue", occupied: 48, total: 50 },
      { date: "Wed", occupied: 42, total: 50 },
      { date: "Thu", occupied: 47, total: 50 },
      { date: "Fri", occupied: 50, total: 50 },
      { date: "Sat", occupied: 49, total: 50 },
      { date: "Sun", occupied: 44, total: 50 },
    ]
  },
  bookings: {
    total: 156,
    confirmed: 142,
    pending: 8,
    cancelled: 6,
    data: [
      { date: "Week 1", bookings: 32, revenue: 45000 },
      { date: "Week 2", bookings: 38, revenue: 52000 },
      { date: "Week 3", bookings: 45, revenue: 61000 },
      { date: "Week 4", bookings: 41, revenue: 58000 },
    ]
  },
  guests: {
    current: 89,
    checkinToday: 12,
    checkoutToday: 8,
    satisfaction: 4.7,
  },
  performance: [
    { metric: "Revenue Growth", value: 11.4, target: 10, trend: 1.4 },
    { metric: "Occupancy Rate", value: 85, target: 90, trend: -2.1 },
    { metric: "Avg Daily Rate", value: 4500, target: 4200, trend: 7.1 },
    { metric: "Guest Satisfaction", value: 4.7, target: 4.5, trend: 4.4 },
  ]
}

const COLORS = {
  primary: "#3B82F6",
  secondary: "#8B5CF6",
  success: "#10B981",
  warning: "#F59E0B",
  danger: "#EF4444",
  gradient: ["#3B82F6", "#8B5CF6", "#06B6D4", "#10B981"]
}

export function EnhancedAnalytics() {
  const [data] = useState<AnalyticsData>(sampleData)
  const [selectedMetric, setSelectedMetric] = useState("revenue")
  const [animationComplete, setAnimationComplete] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setAnimationComplete(true), 500)
    return () => clearTimeout(timer)
  }, [])

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  const getPerformanceColor = (value: number, target: number) => {
    if (value >= target) return "text-green-400"
    if (value >= target * 0.8) return "text-yellow-400"
    return "text-red-400"
  }

  const getTrendIcon = (trend: number) => {
    if (trend > 0) return <TrendingUp className="h-4 w-4 text-green-400" />
    return <TrendingDown className="h-4 w-4 text-red-400" />
  }

  const pieChartData = [
    { name: "Confirmed", value: data.bookings.confirmed, color: COLORS.success },
    { name: "Pending", value: data.bookings.pending, color: COLORS.warning },
    { name: "Cancelled", value: data.bookings.cancelled, color: COLORS.danger },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Analytics Dashboard</h2>
          <p className="text-white/70 mt-1">Real-time insights and performance metrics</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            className="bg-white/10 border-white/20 text-white hover:bg-white/20"
          >
            <BarChart3 className="h-4 w-4 mr-2" />
            Export Report
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="bg-white/10 border-white/20 text-white hover:bg-white/20"
          >
            <Activity className="h-4 w-4 mr-2" />
            Real-time
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Revenue Card */}
        <GlassCard variant="gradient" className="group">
          <GlassCardHeader>
            <GlassCardTitle icon={<DollarSign className="h-5 w-5 text-green-400" />}>
              Revenue
            </GlassCardTitle>
            <GlassCardDescription>Monthly performance</GlassCardDescription>
          </GlassCardHeader>
          <GlassCardContent>
            <div className="space-y-3">
              <div className="text-3xl font-bold text-white">
                {formatCurrency(data.revenue.current)}
              </div>
              <div className="flex items-center space-x-2">
                {getTrendIcon(data.revenue.trend)}
                <span className={`text-sm font-medium ${
                  data.revenue.trend > 0 ? "text-green-400" : "text-red-400"
                }`}>
                  {Math.abs(data.revenue.trend)}%
                </span>
                <span className="text-sm text-white/60">vs last month</span>
              </div>
              <div className="w-full bg-white/10 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-green-400 to-green-500 h-2 rounded-full transition-all duration-1000 ease-out"
                  style={{ 
                    width: animationComplete ? `${(data.revenue.current / data.revenue.previous) * 100}%` : "0%" 
                  }}
                />
              </div>
            </div>
          </GlassCardContent>
        </GlassCard>

        {/* Occupancy Card */}
        <GlassCard variant="gradient" className="group">
          <GlassCardHeader>
            <GlassCardTitle icon={<Bed className="h-5 w-5 text-blue-400" />}>
              Occupancy
            </GlassCardTitle>
            <GlassCardDescription>Current room utilization</GlassCardDescription>
          </GlassCardHeader>
          <GlassCardContent>
            <div className="space-y-3">
              <div className="text-3xl font-bold text-white">
                {data.occupancy.current}%
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-white/60">Target: {data.occupancy.target}%</span>
                <span className={getPerformanceColor(data.occupancy.current, data.occupancy.target)}>
                  {data.occupancy.current >= data.occupancy.target ? "On Track" : "Behind"}
                </span>
              </div>
              <div className="relative">
                <div className="w-full bg-white/10 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-blue-400 to-blue-500 h-2 rounded-full transition-all duration-1000 ease-out"
                    style={{ 
                      width: animationComplete ? `${data.occupancy.current}%` : "0%" 
                    }}
                  />
                </div>
                <div 
                  className="absolute top-0 w-1 h-2 bg-white/50 rounded-full"
                  style={{ left: `${data.occupancy.target}%` }}
                />
              </div>
            </div>
          </GlassCardContent>
        </GlassCard>

        {/* Guests Card */}
        <GlassCard variant="gradient" className="group">
          <GlassCardHeader>
            <GlassCardTitle icon={<Users className="h-5 w-5 text-purple-400" />}>
              Guests
            </GlassCardTitle>
            <GlassCardDescription>Current occupancy</GlassCardDescription>
          </GlassCardHeader>
          <GlassCardContent>
            <div className="space-y-3">
              <div className="text-3xl font-bold text-white">
                {data.guests.current}
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-green-500/20 rounded-lg p-2 text-center">
                  <div className="text-green-400 font-semibold">+{data.guests.checkinToday}</div>
                  <div className="text-white/60">Check-ins</div>
                </div>
                <div className="bg-blue-500/20 rounded-lg p-2 text-center">
                  <div className="text-blue-400 font-semibold">-{data.guests.checkoutToday}</div>
                  <div className="text-white/60">Check-outs</div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Star className="h-4 w-4 text-yellow-400" />
                <span className="text-sm text-white/60">
                  {data.guests.satisfaction}/5 satisfaction
                </span>
              </div>
            </div>
          </GlassCardContent>
        </GlassCard>

        {/* Performance Card */}
        <GlassCard variant="gradient" className="group">
          <GlassCardHeader>
            <GlassCardTitle icon={<Target className="h-5 w-5 text-orange-400" />}>
              Performance
            </GlassCardTitle>
            <GlassCardDescription>Key metrics overview</GlassCardDescription>
          </GlassCardHeader>
          <GlassCardContent>
            <div className="space-y-2">
              {data.performance.slice(0, 2).map((metric, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="text-xs text-white/60">{metric.metric}</div>
                  <div className="flex items-center space-x-1">
                    <span className={`text-xs font-medium ${getPerformanceColor(metric.value, metric.target)}`}>
                      {metric.metric.includes("Rate") ? `${metric.value}%` : 
                       metric.metric.includes("Revenue") ? `${metric.value}%` :
                       metric.metric.includes("Daily") ? formatCurrency(metric.value) :
                       metric.value}
                    </span>
                    {getTrendIcon(metric.trend)}
                  </div>
                </div>
              ))}
            </div>
          </GlassCardContent>
        </GlassCard>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Trend Chart */}
        <GlassCard variant="subtle" className="h-96">
          <GlassCardHeader>
            <GlassCardTitle icon={<BarChart3 className="h-5 w-5 text-blue-400" />}>
              Revenue Trend
            </GlassCardTitle>
            <GlassCardDescription>Monthly revenue vs targets</GlassCardDescription>
          </GlassCardHeader>
          <GlassCardContent>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={data.revenue.data}>
                <defs>
                  <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS.primary} stopOpacity={0.3}/>
                    <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="date" tick={{ fill: "white", fontSize: 12 }} />
                <YAxis tick={{ fill: "white", fontSize: 12 }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: "rgba(0,0,0,0.8)", 
                    border: "1px solid rgba(255,255,255,0.2)",
                    borderRadius: "8px",
                    color: "white"
                  }}
                  formatter={(value: any) => [formatCurrency(value), ""]}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke={COLORS.primary}
                  strokeWidth={3}
                  fill="url(#revenueGradient)"
                />
                <Area
                  type="monotone"
                  dataKey="target"
                  stroke={COLORS.warning}
                  strokeDasharray="5 5"
                  strokeWidth={2}
                  fill="none"
                />
              </AreaChart>
            </ResponsiveContainer>
          </GlassCardContent>
        </GlassCard>

        {/* Booking Distribution */}
        <GlassCard variant="subtle" className="h-96">
          <GlassCardHeader>
            <GlassCardTitle icon={<PieChart className="h-5 w-5 text-purple-400" />}>
              Booking Distribution
            </GlassCardTitle>
            <GlassCardDescription>Current booking status</GlassCardDescription>
          </GlassCardHeader>
          <GlassCardContent>
            <div className="flex items-center justify-between h-280">
              <ResponsiveContainer width="60%" height={250}>
                <RechartsPieChart>
                  <Pie
                    data={pieChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: "rgba(0,0,0,0.8)", 
                      border: "1px solid rgba(255,255,255,0.2)",
                      borderRadius: "8px",
                      color: "white"
                    }}
                  />
                </RechartsPieChart>
              </ResponsiveContainer>
              <div className="space-y-4">
                {pieChartData.map((item, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: item.color }}
                    />
                    <div>
                      <div className="text-sm font-medium text-white">{item.name}</div>
                      <div className="text-xs text-white/60">{item.value} bookings</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </GlassCardContent>
        </GlassCard>
      </div>

      {/* Occupancy Heatmap */}
      <GlassCard variant="subtle">
        <GlassCardHeader>
          <GlassCardTitle icon={<Activity className="h-5 w-5 text-green-400" />}>
            Weekly Occupancy Pattern
          </GlassCardTitle>
          <GlassCardDescription>Room utilization across the week</GlassCardDescription>
        </GlassCardHeader>
        <GlassCardContent>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={data.occupancy.data}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="date" tick={{ fill: "white", fontSize: 12 }} />
              <YAxis tick={{ fill: "white", fontSize: 12 }} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: "rgba(0,0,0,0.8)", 
                  border: "1px solid rgba(255,255,255,0.2)",
                  borderRadius: "8px",
                  color: "white"
                }}
              />
              <Bar dataKey="occupied" fill={COLORS.success} radius={[4, 4, 0, 0]} />
              <Bar dataKey="total" fill="rgba(255,255,255,0.1)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </GlassCardContent>
      </GlassCard>
    </div>
  )
}