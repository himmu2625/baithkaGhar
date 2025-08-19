// NOTE: Make sure to install 'recharts' with: npm install recharts
"use client"

import React, { useState, useEffect, useMemo, useCallback } from "react"
import {
  format,
  subDays,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  parseISO,
} from "date-fns"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"
import { DatePickerWithRange } from "@/components/ui/date-range-picker"
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
} from "recharts"
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  Users,
  Home,
  Filter,
  Download,
  RefreshCw,
  Eye,
  Star,
  ArrowUpRight,
  ArrowDownRight,
  BarChart3,
  PieChart as PieChartIcon,
  Activity,
  Target,
  Zap,
  Award,
  AlertTriangle,
  CheckCircle,
  Clock,
  MapPin,
  Percent,
} from "lucide-react"

interface AnalyticsData {
  revenue: {
    daily: Array<{ date: string; revenue: number; bookings: number }>
    monthly: Array<{ month: string; revenue: number; growth: number }>
    total: number
    growth: number
  }
  occupancy: {
    daily: Array<{
      date: string
      rate: number
      available: number
      booked: number
    }>
    average: number
    trend: number
  }
  pricing: {
    trends: Array<{
      date: string
      avgPrice: number
      minPrice: number
      maxPrice: number
    }>
    distribution: Array<{ range: string; count: number; revenue: number }>
  }
  topMovers: {
    priceChanges: Array<{
      id: string
      name: string
      location: string
      oldPrice: number
      newPrice: number
      change: number
      impact: string
    }>
    performance: Array<{
      id: string
      name: string
      location: string
      revenue: number
      occupancy: number
      growth: number
      rating: number
    }>
  }
  events: Array<{
    id: string
    name: string
    date: string
    impact: number
    bookings: number
    revenue: number
  }>
}

interface Filters {
  dateRange: { from: Date | undefined; to: Date | undefined }
  properties: string[]
  events: string[]
  rules: string[]
  metrics: string[]
}

export default function AdminAnalyticsDashboard() {
  const { toast } = useToast()

  // State management
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("overview")
  const [refreshing, setRefreshing] = useState(false)

  // Filter state
  const [filters, setFilters] = useState<Filters>({
    dateRange: {
      from: subDays(new Date(), 30),
      to: new Date(),
    },
    properties: [],
    events: [],
    rules: [],
    metrics: ["revenue", "occupancy", "pricing"],
  })

  // Available options for filters
  const [properties, setProperties] = useState<
    Array<{ id: string; name: string; location: string }>
  >([])
  const [events, setEvents] = useState<
    Array<{ id: string; name: string; date: string }>
  >([])
  const [rules, setRules] = useState<
    Array<{ id: string; name: string; type: string }>
  >([])

  const fetchAnalyticsData = useCallback(async () => {
    try {
      setLoading(true)

      // Fetch real analytics data from the API
      const params = new URLSearchParams()
      if (filters.dateRange.from)
        params.append("startDate", filters.dateRange.from.toISOString())
      if (filters.dateRange.to)
        params.append("endDate", filters.dateRange.to.toISOString())
      if (filters.properties.length > 0)
        params.append("propertyIds", filters.properties.join(","))
      if (filters.events.length > 0)
        params.append("eventIds", filters.events.join(","))
      // Add more filters as needed

      const res = await fetch(
        `/api/admin/analytics/dashboard?${params.toString()}`
      )
      const json = await res.json()
      if (!json.success)
        throw new Error(json.error || "Failed to fetch analytics")
      setAnalyticsData(json.data)
    } catch (error) {
      console.error("Error fetching analytics:", error)
      toast({
        title: "Error",
        description: "Failed to load analytics data",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [filters, toast])

  const fetchFilterOptions = useCallback(async () => {
    try {
      // TODO: Optionally fetch real filter options from API (e.g., /api/admin/properties, /api/admin/events)
      setProperties([])
      setEvents([])
      setRules([])
    } catch (error) {
      setProperties([])
      setEvents([])
      setRules([])
    }
  }, [])

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchAnalyticsData()
    setRefreshing(false)
    toast({
      title: "Success",
      description: "Analytics data refreshed successfully",
    })
  }

  const handleExport = () => {
    toast({
      title: "Export Started",
      description: "Your analytics report is being generated...",
    })
  }

  if (loading) {
    return (
      <div className="container mx-auto py-8 max-w-7xl">
        <div className="animate-pulse space-y-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-64 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 max-w-7xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
          <p className="text-muted-foreground">
            Monitor revenue, occupancy, and pricing performance across all
            properties
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
          <Button variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Date Range</Label>
              <DatePickerWithRange
                date={filters.dateRange}
                onDateChange={(range) =>
                  setFilters((prev) => ({
                    ...prev,
                    dateRange:
                      range && typeof range === "object"
                        ? {
                            from: range.from ?? subDays(new Date(), 30),
                            to: range.to ?? new Date(),
                          }
                        : { from: subDays(new Date(), 30), to: new Date() },
                  }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label>Properties</Label>
              <Select
                value={filters.properties[0] || "all"}
                onValueChange={(value) =>
                  setFilters((prev) => ({
                    ...prev,
                    properties: value === "all" ? [] : [value],
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Properties" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Properties</SelectItem>
                  {properties.map((property) => (
                    <SelectItem key={property.id} value={property.id}>
                      {property.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Events</Label>
              <Select
                value={filters.events[0] || "all"}
                onValueChange={(value) =>
                  setFilters((prev) => ({
                    ...prev,
                    events: value === "all" ? [] : [value],
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Events" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Events</SelectItem>
                  {events.map((event) => (
                    <SelectItem key={event.id} value={event.id}>
                      {event.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Pricing Rules</Label>
              <Select
                value={filters.rules[0] || "all"}
                onValueChange={(value) =>
                  setFilters((prev) => ({
                    ...prev,
                    rules: value === "all" ? [] : [value],
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Rules" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Rules</SelectItem>
                  {rules.map((rule) => (
                    <SelectItem key={rule.id} value={rule.id}>
                      {rule.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      {analyticsData && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Revenue</p>
                  <p className="text-2xl font-bold">
                    ₹{(analyticsData.revenue.total / 100000).toFixed(1)}L
                  </p>
                </div>
                <div className="p-3 bg-green-100 rounded-full">
                  <DollarSign className="h-6 w-6 text-green-600" />
                </div>
              </div>
              <div className="flex items-center mt-2">
                <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
                <span className="text-sm text-green-600 font-medium">
                  +{analyticsData.revenue.growth}%
                </span>
                <span className="text-sm text-muted-foreground ml-2">
                  vs last month
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">
                    Occupancy Rate
                  </p>
                  <p className="text-2xl font-bold">
                    {analyticsData.occupancy.average}%
                  </p>
                </div>
                <div className="p-3 bg-blue-100 rounded-full">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
              </div>
              <div className="flex items-center mt-2">
                <TrendingUp className="h-4 w-4 text-blue-600 mr-1" />
                <span className="text-sm text-blue-600 font-medium">
                  +{analyticsData.occupancy.trend}%
                </span>
                <span className="text-sm text-muted-foreground ml-2">
                  vs last month
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">
                    Avg Daily Rate
                  </p>
                  <p className="text-2xl font-bold">
                    ₹
                    {analyticsData.pricing.trends.length > 0
                      ? Math.round(
                          analyticsData.pricing.trends.reduce(
                            (sum, day) => sum + day.avgPrice,
                            0
                          ) / analyticsData.pricing.trends.length
                        ).toLocaleString()
                      : "0"}
                  </p>
                </div>
                <div className="p-3 bg-purple-100 rounded-full">
                  <BarChart3 className="h-6 w-6 text-purple-600" />
                </div>
              </div>
              <div className="flex items-center mt-2">
                <TrendingUp className="h-4 w-4 text-purple-600 mr-1" />
                <span className="text-sm text-purple-600 font-medium">
                  +12.3%
                </span>
                <span className="text-sm text-muted-foreground ml-2">
                  vs last month
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Properties</p>
                  <p className="text-2xl font-bold">{properties.length}</p>
                </div>
                <div className="p-3 bg-orange-100 rounded-full">
                  <Home className="h-6 w-6 text-orange-600" />
                </div>
              </div>
              <div className="flex items-center mt-2">
                <CheckCircle className="h-4 w-4 text-green-600 mr-1" />
                <span className="text-sm text-green-600 font-medium">
                  All Active
                </span>
                <span className="text-sm text-muted-foreground ml-2">
                  monitored
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Analytics */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-6"
      >
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="occupancy">Occupancy</TabsTrigger>
          <TabsTrigger value="pricing">Pricing</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Revenue Trend */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                  Revenue Trend (30 days)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={analyticsData?.revenue.daily || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="date"
                      tickFormatter={(value: string) =>
                        format(parseISO(value), "MMM dd")
                      }
                    />
                    <YAxis
                      tickFormatter={(value: number) =>
                        `₹${(value / 1000).toFixed(0)}K`
                      }
                    />
                    <Tooltip
                      labelFormatter={(value: string) =>
                        format(parseISO(value), "MMM dd, yyyy")
                      }
                      formatter={(value: number) => [
                        `₹${value.toLocaleString()}`,
                        "Revenue",
                      ]}
                    />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      stroke="#22c55e"
                      fill="#22c55e"
                      fillOpacity={0.3}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Occupancy Rate */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-blue-600" />
                  Occupancy Rate (30 days)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={analyticsData?.occupancy.daily || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="date"
                      tickFormatter={(value: string) =>
                        format(parseISO(value), "MMM dd")
                      }
                    />
                    <YAxis
                      domain={[0, 100]}
                      tickFormatter={(value: number) => `${value}%`}
                    />
                    <Tooltip
                      labelFormatter={(value: string) =>
                        format(parseISO(value), "MMM dd, yyyy")
                      }
                      formatter={(value: number) => [`${value}%`, "Occupancy"]}
                    />
                    <Line
                      type="monotone"
                      dataKey="rate"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      dot={{ fill: "#3b82f6", strokeWidth: 2, r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Top Movers */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Price Changes */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-orange-600" />
                  Biggest Price Changes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analyticsData?.topMovers.priceChanges.map((property) => (
                    <div
                      key={property.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex-1">
                        <h4 className="font-medium">{property.name}</h4>
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {property.location}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {property.impact}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground line-through">
                            ₹{property.oldPrice.toLocaleString()}
                          </span>
                          <span className="font-medium">
                            ₹{property.newPrice.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          {property.change > 0 ? (
                            <>
                              <ArrowUpRight className="h-3 w-3 text-green-600" />
                              <span className="text-sm font-medium text-green-600">
                                +{property.change}%
                              </span>
                            </>
                          ) : (
                            <>
                              <ArrowDownRight className="h-3 w-3 text-red-600" />
                              <span className="text-sm font-medium text-red-600">
                                {property.change}%
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Top Performers */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-purple-600" />
                  Top Performers
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analyticsData?.topMovers.performance.map(
                    (property, index) => (
                      <div
                        key={property.id}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-full text-sm font-bold">
                            {index + 1}
                          </div>
                          <div>
                            <h4 className="font-medium">{property.name}</h4>
                            <p className="text-sm text-muted-foreground flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {property.location}
                            </p>
                            <div className="flex items-center gap-3 mt-1 text-xs">
                              <span className="flex items-center gap-1">
                                <Star className="h-3 w-3 text-yellow-500" />
                                {property.rating}
                              </span>
                              <span className="flex items-center gap-1">
                                <Percent className="h-3 w-3 text-blue-500" />
                                {property.occupancy}% occupied
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">
                            ₹{(property.revenue / 1000).toFixed(0)}K
                          </div>
                          <div className="flex items-center gap-1">
                            <TrendingUp className="h-3 w-3 text-green-600" />
                            <span className="text-sm text-green-600 font-medium">
                              +{property.growth}%
                            </span>
                          </div>
                        </div>
                      </div>
                    )
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Event Impacts */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-indigo-600" />
                Event Impact Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {analyticsData?.events.map((event) => (
                  <div
                    key={event.id}
                    className="p-4 border rounded-lg bg-gradient-to-br from-indigo-50 to-purple-50"
                  >
                    <h4 className="font-medium text-indigo-900">
                      {event.name}
                    </h4>
                    <p className="text-sm text-indigo-700 mb-3">
                      {format(parseISO(event.date), "MMM dd, yyyy")}
                    </p>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-indigo-600">Revenue Impact:</span>
                        <span className="font-medium text-indigo-800">
                          +{event.impact}%
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-indigo-600">Bookings:</span>
                        <span className="font-medium text-indigo-800">
                          {event.bookings}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-indigo-600">Revenue:</span>
                        <span className="font-medium text-indigo-800">
                          ₹{(event.revenue / 1000).toFixed(0)}K
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Revenue Tab */}
        <TabsContent value="revenue" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Daily Revenue Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <ComposedChart data={analyticsData?.revenue.daily || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="date"
                      tickFormatter={(value: string) =>
                        format(parseISO(value), "MMM dd")
                      }
                    />
                    <YAxis
                      yAxisId="revenue"
                      orientation="left"
                      tickFormatter={(value: number) =>
                        `₹${(value / 1000).toFixed(0)}K`
                      }
                    />
                    <YAxis yAxisId="bookings" orientation="right" />
                    <Tooltip
                      labelFormatter={(value: string) =>
                        format(parseISO(value), "MMM dd, yyyy")
                      }
                    />
                    <Legend />
                    <Bar
                      yAxisId="revenue"
                      dataKey="revenue"
                      fill="#22c55e"
                      name="Revenue"
                    />
                    <Line
                      yAxisId="bookings"
                      type="monotone"
                      dataKey="bookings"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      name="Bookings"
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Monthly Growth</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={analyticsData?.revenue.monthly || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis tickFormatter={(value: number) => `${value}%`} />
                    <Tooltip
                      formatter={(value: number) => [`${value}%`, "Growth"]}
                    />
                    <Bar dataKey="growth" fill="#8b5cf6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Occupancy Tab */}
        <TabsContent value="occupancy" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Occupancy Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <ComposedChart data={analyticsData?.occupancy.daily || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(value: string) =>
                      format(parseISO(value), "MMM dd")
                    }
                  />
                  <YAxis
                    yAxisId="rate"
                    domain={[0, 100]}
                    tickFormatter={(value: number) => `${value}%`}
                  />
                  <YAxis yAxisId="rooms" orientation="right" />
                  <Tooltip
                    labelFormatter={(value: string) =>
                      format(parseISO(value), "MMM dd, yyyy")
                    }
                  />
                  <Legend />
                  <Area
                    yAxisId="rate"
                    type="monotone"
                    dataKey="rate"
                    stroke="#3b82f6"
                    fill="#3b82f6"
                    fillOpacity={0.3}
                    name="Occupancy Rate"
                  />
                  <Bar
                    yAxisId="rooms"
                    dataKey="booked"
                    fill="#22c55e"
                    name="Booked Rooms"
                  />
                  <Bar
                    yAxisId="rooms"
                    dataKey="available"
                    fill="#e5e7eb"
                    name="Available Rooms"
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pricing Tab */}
        <TabsContent value="pricing" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Price Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={analyticsData?.pricing.trends || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="date"
                      tickFormatter={(value: string) =>
                        format(parseISO(value), "MMM dd")
                      }
                    />
                    <YAxis
                      tickFormatter={(value: number) =>
                        `₹${(value / 1000).toFixed(0)}K`
                      }
                    />
                    <Tooltip
                      labelFormatter={(value: string) =>
                        format(parseISO(value), "MMM dd, yyyy")
                      }
                      formatter={(value: number) => [
                        `₹${value.toLocaleString()}`,
                        "",
                      ]}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="maxPrice"
                      stroke="#ef4444"
                      strokeWidth={1}
                      name="Max Price"
                      strokeDasharray="5 5"
                    />
                    <Line
                      type="monotone"
                      dataKey="avgPrice"
                      stroke="#3b82f6"
                      strokeWidth={3}
                      name="Avg Price"
                    />
                    <Line
                      type="monotone"
                      dataKey="minPrice"
                      stroke="#22c55e"
                      strokeWidth={1}
                      name="Min Price"
                      strokeDasharray="5 5"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Price Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <PieChart>
                    <Pie
                      data={analyticsData?.pricing.distribution || []}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(props: any) => {
                        const data = analyticsData?.pricing.distribution || []
                        const entry = data[props.index as number]
                        return entry ? `${entry.range} (${entry.count})` : ""
                      }}
                      outerRadius={120}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {analyticsData?.pricing.distribution.map(
                        (entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={`hsl(${index * 72}, 70%, 60%)`}
                          />
                        )
                      )}
                    </Pie>
                    <Tooltip
                      formatter={(value: number) => [
                        `${value} properties`,
                        "Count",
                      ]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
