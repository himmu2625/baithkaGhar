"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  ArrowLeft,
  Calendar,
  Download,
  RefreshCw,
  Target,
  Activity,
  Building,
  Bed,
  IndianRupee,
  Users,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Settings,
  Filter,
  Eye,
} from "lucide-react"

interface AnalyticsData {
  occupancy: {
    current: number
    previous: number
    trend: "up" | "down"
    weekly: number[]
    monthly: number[]
  }
  revenue: {
    current: number
    previous: number
    trend: "up" | "down"
    weekly: number[]
    monthly: number[]
  }
  rooms: {
    total: number
    available: number
    occupied: number
    maintenance: number
    revenue_per_room: number
  }
  performance: {
    avg_daily_rate: number
    revenue_per_available_room: number
    booking_conversion: number
    guest_satisfaction: number
  }
}

const mockAnalyticsData: AnalyticsData = {
  occupancy: {
    current: 74.5,
    previous: 68.2,
    trend: "up",
    weekly: [65, 72, 68, 78, 75, 82, 74],
    monthly: [68, 71, 69, 75, 73, 78, 76, 74, 72, 75, 77, 74],
  },
  revenue: {
    current: 125000,
    previous: 118000,
    trend: "up",
    weekly: [98000, 115000, 108000, 132000, 125000, 140000, 128000],
    monthly: [
      118000, 122000, 115000, 128000, 125000, 135000, 130000, 125000, 120000,
      128000, 132000, 125000,
    ],
  },
  rooms: {
    total: 55,
    available: 22,
    occupied: 33,
    maintenance: 3,
    revenue_per_room: 2273,
  },
  performance: {
    avg_daily_rate: 3200,
    revenue_per_available_room: 2850,
    booking_conversion: 68.5,
    guest_satisfaction: 4.6,
  },
}

export default function InventoryAnalytics() {
  const router = useRouter()
  const { data: session } = useSession()
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedPeriod, setSelectedPeriod] = useState<"weekly" | "monthly">(
    "weekly"
  )

  useEffect(() => {
    setTimeout(() => {
      setAnalytics(mockAnalyticsData)
      setLoading(false)
    }, 1000)
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading Analytics...</p>
        </div>
      </div>
    )
  }

  if (!analytics) return null

  const occupancyChange =
    analytics.occupancy.current - analytics.occupancy.previous
  const revenueChange = analytics.revenue.current - analytics.revenue.previous
  const revenueChangePercent = (
    (revenueChange / analytics.revenue.previous) *
    100
  ).toFixed(1)

  return (
    <div className="space-y-8">
      {/* Enhanced Header - Matching F&B Dashboard Style */}
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-2xl p-8 text-white shadow-2xl">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  router.push(
                    `/os/inventory/dashboard/${session?.user?.propertyId}`
                  )
                }
                className="flex items-center space-x-2 text-white/80 hover:text-white hover:bg-white/20 rounded-lg"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back to Inventory</span>
              </Button>
            </div>
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                <BarChart3 className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold tracking-tight">
                  Inventory Analytics
                </h1>
                <div className="flex items-center space-x-4 mt-2">
                  <div className="flex items-center space-x-1">
                    <Target className="h-4 w-4" />
                    <span className="text-indigo-100">
                      Performance Insights
                    </span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Activity className="h-4 w-4" />
                    <span className="text-green-200 font-medium">
                      Live Data
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-6 lg:mt-0 flex items-center space-x-4">
            <Button className="bg-white/20 hover:bg-white/30 text-white border-white/30 backdrop-blur-sm">
              <Download className="w-4 h-4 mr-2" />
              Export Data
            </Button>
            <Button className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 border-0 font-semibold">
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>
      </div>

      {/* Key Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 group bg-gradient-to-br from-emerald-50 to-emerald-100 hover:from-emerald-100 hover:to-emerald-200">
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-green-500/10"></div>
          <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-emerald-700">
              Current Occupancy
            </CardTitle>
            <div className="flex items-center space-x-2">
              {analytics.occupancy.trend === "up" ? (
                <TrendingUp className="h-4 w-4 text-emerald-600" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-600" />
              )}
              <Bed className="h-5 w-5 text-emerald-600" />
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-3xl font-bold text-emerald-900 mb-1">
              {analytics.occupancy.current}%
            </div>
            <div className="flex items-center space-x-1">
              <Badge
                className={`text-xs ${
                  analytics.occupancy.trend === "up"
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-red-100 text-red-700"
                }`}
              >
                {analytics.occupancy.trend === "up" ? "+" : ""}
                {occupancyChange.toFixed(1)}% vs last period
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 group bg-gradient-to-br from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-indigo-500/10"></div>
          <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-blue-700">
              Total Revenue
            </CardTitle>
            <div className="flex items-center space-x-2">
              {analytics.revenue.trend === "up" ? (
                <TrendingUp className="h-4 w-4 text-blue-600" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-600" />
              )}
              <IndianRupee className="h-5 w-5 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-3xl font-bold text-blue-900 mb-1">
              ₹{(analytics.revenue.current / 1000).toFixed(0)}K
            </div>
            <div className="flex items-center space-x-1">
              <Badge
                className={`text-xs ${
                  analytics.revenue.trend === "up"
                    ? "bg-blue-100 text-blue-700"
                    : "bg-red-100 text-red-700"
                }`}
              >
                {revenueChangePercent}% vs last period
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 group bg-gradient-to-br from-purple-50 to-purple-100 hover:from-purple-100 hover:to-purple-200">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-pink-500/10"></div>
          <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-purple-700">
              Available Rooms
            </CardTitle>
            <Building className="h-5 w-5 text-purple-600" />
          </CardHeader>
          <CardContent className="relative">
            <div className="text-3xl font-bold text-purple-900 mb-1">
              {analytics.rooms.available}
            </div>
            <div className="flex items-center space-x-1">
              <span className="text-xs text-purple-600">
                out of {analytics.rooms.total} rooms
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 group bg-gradient-to-br from-orange-50 to-orange-100 hover:from-orange-100 hover:to-orange-200">
          <div className="absolute inset-0 bg-gradient-to-r from-orange-500/10 to-red-500/10"></div>
          <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-orange-700">
              Avg Daily Rate
            </CardTitle>
            <Target className="h-5 w-5 text-orange-600" />
          </CardHeader>
          <CardContent className="relative">
            <div className="text-3xl font-bold text-orange-900 mb-1">
              ₹{analytics.performance.avg_daily_rate.toLocaleString()}
            </div>
            <div className="flex items-center space-x-1">
              <span className="text-xs text-orange-600">
                per room per night
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Modernized Analytics Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <div className="flex items-center justify-between">
          <TabsList className="grid w-full max-w-lg grid-cols-4 bg-white/80 backdrop-blur-sm border border-blue-100 p-1 rounded-lg">
            <TabsTrigger
              value="overview"
              className="data-[state=active]:bg-blue-600 data-[state=active]:text-white flex items-center space-x-2"
            >
              <BarChart3 className="h-4 w-4" />
              <span>Overview</span>
            </TabsTrigger>
            <TabsTrigger
              value="occupancy"
              className="data-[state=active]:bg-blue-600 data-[state=active]:text-white flex items-center space-x-2"
            >
              <Bed className="h-4 w-4" />
              <span>Occupancy</span>
            </TabsTrigger>
            <TabsTrigger
              value="revenue"
              className="data-[state=active]:bg-blue-600 data-[state=active]:text-white flex items-center space-x-2"
            >
              <IndianRupee className="h-4 w-4" />
              <span>Revenue</span>
            </TabsTrigger>
            <TabsTrigger
              value="performance"
              className="data-[state=active]:bg-blue-600 data-[state=active]:text-white flex items-center space-x-2"
            >
              <Target className="h-4 w-4" />
              <span>Performance</span>
            </TabsTrigger>
          </TabsList>

          <div className="flex items-center space-x-2 bg-white/80 backdrop-blur-sm border border-blue-100 p-1 rounded-lg">
            <Button
              variant={selectedPeriod === "weekly" ? "default" : "ghost"}
              size="sm"
              onClick={() => setSelectedPeriod("weekly")}
              className={
                selectedPeriod === "weekly"
                  ? "bg-blue-600 hover:bg-blue-700 text-white"
                  : "hover:bg-blue-50"
              }
            >
              Weekly
            </Button>
            <Button
              variant={selectedPeriod === "monthly" ? "default" : "ghost"}
              size="sm"
              onClick={() => setSelectedPeriod("monthly")}
              className={
                selectedPeriod === "monthly"
                  ? "bg-blue-600 hover:bg-blue-700 text-white"
                  : "hover:bg-blue-50"
              }
            >
              Monthly
            </Button>
          </div>
        </div>

        <TabsContent value="overview" className="p-6 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Room Status Overview */}
            <Card className="border-0 shadow-lg bg-gradient-to-r from-white to-blue-50/30">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-semibold text-blue-800 flex items-center space-x-2">
                  <Building className="h-5 w-5 text-blue-600" />
                  <span>Room Status Overview</span>
                </CardTitle>
                <CardDescription className="text-blue-600">
                  Current room distribution and availability
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-white rounded-lg border border-gray-200">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                        Occupied
                      </span>
                      <span className="text-lg font-bold text-green-600">
                        {analytics.rooms.occupied}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-500 h-2 rounded-full transition-all duration-1000"
                        style={{
                          width: `${
                            (analytics.rooms.occupied / analytics.rooms.total) *
                            100
                          }%`,
                        }}
                      ></div>
                    </div>
                  </div>

                  <div className="p-4 bg-white rounded-lg border border-gray-200">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                        Available
                      </span>
                      <span className="text-lg font-bold text-blue-600">
                        {analytics.rooms.available}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full transition-all duration-1000"
                        style={{
                          width: `${
                            (analytics.rooms.available /
                              analytics.rooms.total) *
                            100
                          }%`,
                        }}
                      ></div>
                    </div>
                  </div>

                  <div className="p-4 bg-white rounded-lg border border-gray-200">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                        Maintenance
                      </span>
                      <span className="text-lg font-bold text-orange-600">
                        {analytics.rooms.maintenance}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-orange-500 h-2 rounded-full transition-all duration-1000"
                        style={{
                          width: `${
                            (analytics.rooms.maintenance /
                              analytics.rooms.total) *
                            100
                          }%`,
                        }}
                      ></div>
                    </div>
                  </div>

                  <div className="p-4 bg-white rounded-lg border border-gray-200">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                        Total Rooms
                      </span>
                      <span className="text-lg font-bold text-gray-600">
                        {analytics.rooms.total}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-gray-500 h-2 rounded-full w-full"></div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Performance Metrics */}
            <Card className="border-0 shadow-lg bg-gradient-to-r from-white to-blue-50/30">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-semibold text-blue-800 flex items-center space-x-2">
                  <Target className="h-5 w-5 text-blue-600" />
                  <span>Key Performance Indicators</span>
                </CardTitle>
                <CardDescription className="text-blue-600">
                  Essential business metrics and performance data
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-4">
                  <div className="flex justify-between items-center p-4 bg-white rounded-lg border border-gray-200">
                    <div>
                      <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                        Revenue Per Available Room
                      </div>
                      <div className="text-lg font-bold text-blue-600 flex items-center">
                        <IndianRupee className="h-4 w-4 mr-1" />
                        {analytics.performance.revenue_per_available_room.toLocaleString()}
                      </div>
                    </div>
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <IndianRupee className="h-5 w-5 text-blue-600" />
                    </div>
                  </div>

                  <div className="flex justify-between items-center p-4 bg-white rounded-lg border border-gray-200">
                    <div>
                      <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                        Booking Conversion Rate
                      </div>
                      <div className="text-lg font-bold text-green-600">
                        {analytics.performance.booking_conversion}%
                      </div>
                    </div>
                    <div className="p-2 bg-green-100 rounded-lg">
                      <TrendingUp className="h-5 w-5 text-green-600" />
                    </div>
                  </div>

                  <div className="flex justify-between items-center p-4 bg-white rounded-lg border border-gray-200">
                    <div>
                      <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                        Guest Satisfaction Score
                      </div>
                      <div className="text-lg font-bold text-orange-600">
                        {analytics.performance.guest_satisfaction}/5.0
                      </div>
                    </div>
                    <div className="p-2 bg-orange-100 rounded-lg">
                      <Users className="h-5 w-5 text-orange-600" />
                    </div>
                  </div>

                  <div className="flex justify-between items-center p-4 bg-white rounded-lg border border-gray-200">
                    <div>
                      <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                        Revenue Per Room
                      </div>
                      <div className="text-lg font-bold text-purple-600 flex items-center">
                        <IndianRupee className="h-4 w-4 mr-1" />
                        {analytics.rooms.revenue_per_room.toLocaleString()}
                      </div>
                    </div>
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <Building className="h-5 w-5 text-purple-600" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="occupancy" className="p-6 space-y-6">
          <Card className="border-0 shadow-lg bg-gradient-to-r from-white to-blue-50/30">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-semibold text-blue-800 flex items-center space-x-2">
                <Bed className="h-5 w-5 text-blue-600" />
                <span>Occupancy Trends</span>
              </CardTitle>
              <CardDescription className="text-blue-600">
                Track occupancy rates over time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="p-8 bg-white rounded-lg border border-gray-200">
                <div className="text-center">
                  <div className="p-4 bg-blue-100 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                    <BarChart3 className="h-8 w-8 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">
                    Occupancy Analytics
                  </h3>
                  <p className="text-gray-500 mb-4">
                    Chart visualization would be implemented here
                  </p>
                  <div className="inline-flex items-center px-4 py-2 bg-blue-50 rounded-lg border border-blue-200">
                    <Calendar className="h-4 w-4 text-blue-600 mr-2" />
                    <span className="text-sm text-blue-700">
                      Showing {selectedPeriod} occupancy data
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="revenue" className="p-6 space-y-6">
          <Card className="border-0 shadow-lg bg-gradient-to-r from-white to-blue-50/30">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-semibold text-blue-800 flex items-center space-x-2">
                <IndianRupee className="h-5 w-5 text-blue-600" />
                <span>Revenue Analysis</span>
              </CardTitle>
              <CardDescription className="text-blue-600">
                Revenue trends and forecasting
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="p-8 bg-white rounded-lg border border-gray-200">
                <div className="text-center">
                  <div className="p-4 bg-green-100 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                    <IndianRupee className="h-8 w-8 text-green-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">
                    Revenue Analytics
                  </h3>
                  <p className="text-gray-500 mb-4">
                    Revenue chart visualization would be implemented here
                  </p>
                  <div className="inline-flex items-center px-4 py-2 bg-green-50 rounded-lg border border-green-200">
                    <TrendingUp className="h-4 w-4 text-green-600 mr-2" />
                    <span className="text-sm text-green-700">
                      Showing {selectedPeriod} revenue data
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="p-6 space-y-6">
          <Card className="border-0 shadow-lg bg-gradient-to-r from-white to-blue-50/30">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-semibold text-blue-800 flex items-center space-x-2">
                <Target className="h-5 w-5 text-blue-600" />
                <span>Performance Dashboard</span>
              </CardTitle>
              <CardDescription className="text-blue-600">
                Comprehensive performance metrics and benchmarks
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="p-8 bg-white rounded-lg border border-gray-200">
                <div className="text-center">
                  <div className="p-4 bg-purple-100 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                    <Target className="h-8 w-8 text-purple-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">
                    Performance Analytics
                  </h3>
                  <p className="text-gray-500 mb-4">
                    Performance analytics would be implemented here
                  </p>
                  <div className="inline-flex items-center px-4 py-2 bg-purple-50 rounded-lg border border-purple-200">
                    <Activity className="h-4 w-4 text-purple-600 mr-2" />
                    <span className="text-sm text-purple-700">
                      Advanced KPI tracking and benchmarking
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
