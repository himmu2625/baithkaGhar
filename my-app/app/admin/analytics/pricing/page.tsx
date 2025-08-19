"use client"

import React, { useState, useEffect, useCallback } from "react"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  Users,
  BarChart3,
  PieChart,
  Activity,
  Target,
  Award,
} from "lucide-react"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
} from "recharts"

interface PricingAnalytics {
  totalRevenue: number
  averagePrice: number
  priceChange: number
  bookingsCount: number
  occupancyRate: number
  dynamicPricingEnabled: number
  revenueByMonth: Array<{
    month: string
    revenue: number
    bookings: number
    averagePrice: number
  }>
  topPerformingProperties: Array<{
    propertyId: string
    propertyName: string
    revenue: number
    bookings: number
    averagePrice: number
  }>
  pricingFactorsUsage: Array<{
    factor: string
    usage: number
    impact: number
  }>
}

export default function PricingAnalyticsPage() {
  const [analytics, setAnalytics] = useState<PricingAnalytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState("30")
  const [selectedProperty, setSelectedProperty] = useState("all")

  const fetchAnalytics = useCallback(async () => {
    setLoading(true)
    try {
      const response = await fetch(
        `/api/admin/analytics/pricing?timeRange=${timeRange}&propertyId=${selectedProperty}`
      )
      const data = await response.json()

      if (response.ok) {
        setAnalytics(data)
      } else {
        console.error("Failed to fetch analytics:", data.error)
      }
    } catch (error) {
      console.error("Error fetching analytics:", error)
    } finally {
      setLoading(false)
    }
  }, [timeRange, selectedProperty])

  useEffect(() => {
    fetchAnalytics()
  }, [fetchAnalytics])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const formatPercentage = (value: number) => {
    return `${value > 0 ? "+" : ""}${value.toFixed(1)}%`
  }

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          <span className="ml-2">Loading analytics...</span>
        </div>
      </div>
    )
  }

  if (!analytics) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Pricing Analytics</h2>
          <p className="text-gray-600">No analytics data available.</p>
        </div>
      </div>
    )
  }

  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"]

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Dynamic Pricing Analytics</h1>
          <p className="text-gray-600 mt-2">
            Track pricing performance and revenue impact
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
              <SelectItem value="365">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={fetchAnalytics} variant="outline">
            Refresh
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(analytics.totalRevenue)}
            </div>
            <p className="text-xs text-muted-foreground">
              {formatPercentage(analytics.priceChange)} from last period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Price</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(analytics.averagePrice)}
            </div>
            <p className="text-xs text-muted-foreground">per night</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bookings</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.bookingsCount}</div>
            <p className="text-xs text-muted-foreground">total bookings</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Occupancy Rate
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics.occupancyRate.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">average occupancy</p>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Trend Chart */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Revenue Trend
          </CardTitle>
          <CardDescription>
            Revenue performance over the selected time period
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={analytics.revenueByMonth}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip
                formatter={(value: any) => [formatCurrency(value), "Revenue"]}
                labelFormatter={(label) => `Month: ${label}`}
              />
              <Line
                type="monotone"
                dataKey="revenue"
                stroke="#0088FE"
                strokeWidth={2}
                dot={{ fill: "#0088FE", strokeWidth: 2, r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Top Performing Properties */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              Top Performing Properties
            </CardTitle>
            <CardDescription>
              Properties with highest revenue and dynamic pricing adoption
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics.topPerformingProperties.map((property, index) => (
                <div
                  key={property.propertyId}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <Badge
                      variant="outline"
                      className="bg-blue-50 text-blue-700"
                    >
                      #{index + 1}
                    </Badge>
                    <div>
                      <div className="font-medium">{property.propertyName}</div>
                      <div className="text-sm text-gray-500">
                        {property.bookings} bookings •{" "}
                        {formatCurrency(property.averagePrice)}/night
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-green-600">
                      {formatCurrency(property.revenue)}
                    </div>
                    <div className="text-xs text-gray-500">revenue</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Pricing Factors Usage */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Pricing Factors Usage
            </CardTitle>
            <CardDescription>
              Most commonly used dynamic pricing factors and their impact
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analytics.pricingFactorsUsage}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="factor" />
                <YAxis />
                <Tooltip
                  formatter={(value: any, name: string) => [
                    name === "usage" ? `${value}%` : `${value}%`,
                    name === "usage" ? "Usage" : "Impact",
                  ]}
                />
                <Bar dataKey="usage" fill="#0088FE" name="Usage" />
                <Bar dataKey="impact" fill="#00C49F" name="Impact" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Dynamic Pricing Adoption */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Dynamic Pricing Adoption
          </CardTitle>
          <CardDescription>
            Properties using dynamic pricing vs static pricing
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center">
            <ResponsiveContainer width="100%" height={300}>
              <RechartsPieChart>
                <React.Fragment>
                  <Pie
                    data={[
                      {
                        name: "Dynamic Pricing",
                        value: analytics.dynamicPricingEnabled,
                      },
                      {
                        name: "Static Pricing",
                        value: 100 - analytics.dynamicPricingEnabled,
                      },
                    ]}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(props: any) => {
                      const name = props.name ?? ""
                      const percent =
                        typeof props.percent === "number" ? props.percent : 0
                      return `${name} ${(percent * 100).toFixed(0)}%`
                    }}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {COLORS.map((color, index) => (
                      <Cell key={`cell-${index}`} fill={color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </React.Fragment>
              </RechartsPieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
