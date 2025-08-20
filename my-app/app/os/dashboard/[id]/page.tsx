"use client"

import React, { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { useOSAuth } from "@/hooks/use-os-auth"
import { useRouter } from "next/navigation"
import { LoadingSpinner } from "@/components/os/common/loading-spinner"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Users,
  Calendar,
  IndianRupee,
  BedIcon,
  Clock,
  MapPin,
  Star,
  Building2,
  DollarSign,
  Activity,
  BarChart3,
  PieChart,
  Zap,
  Shield,
  Bell,
  RefreshCw,
  Eye,
  CheckCircle2,
  AlertCircle,
  Home,
  Phone,
  Mail,
  Timer,
} from "lucide-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Separator } from "@/components/ui/separator"
import { PropertyArrivalsDepartures } from "@/components/os/dashboard/property-arrivals-departures"
import { PropertyRecentBookings } from "@/components/os/dashboard/property-recent-bookings"

interface PropertyData {
  _id: string
  title: string
  description: string
  address: any
  price: any
  totalHotelRooms: string
  propertyUnits: any[]
  generalAmenities: any
  metrics: {
    totalRooms: number
    occupiedRooms: number
    occupancyRate: number
    todayRevenue: number
    monthlyRevenue: number
    revenueChange: number
    totalBookings: number
    inHouse: number
    todayArrivals: number
    todayDepartures: number
  }
  housekeeping?: {
    totalRooms: number
    clean: number
    dirty: number
    cleaningInProgress: number
    inspected: number
    maintenanceRequired: number
  }
  bookings: {
    recent: any[]
    arrivals: any[]
    departures: any[]
    total: number
  }
}

export default function PropertyDashboardPage() {
  const params = useParams()
  const { user, isAuthenticated, isLoading } = useOSAuth()
  const router = useRouter()
  const [propertyData, setPropertyData] = useState<PropertyData | null>(null)
  const [isLoadingData, setIsLoadingData] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const propertyId = params?.id as string

  useEffect(() => {
    const fetchPropertyData = async () => {
      try {
        setIsLoadingData(true)
        const response = await fetch(`/api/os/property/${propertyId}`)
        if (!response.ok) {
          throw new Error("Failed to fetch property data")
        }
        const data = await response.json()
        setPropertyData(data.property)
      } catch (error) {
        console.error("Error fetching property data:", error)
        setError("Failed to load property data")
      } finally {
        setIsLoadingData(false)
      }
    }

    if (propertyId && isAuthenticated) {
      fetchPropertyData()
    }
  }, [propertyId, isAuthenticated])

  // Authentication and access control
  useEffect(() => {
    if (!isLoading && isAuthenticated && user) {
      if (user.propertyId !== propertyId) {
        setError("You don't have access to this property")
      }
    } else if (!isLoading && !isAuthenticated) {
      router.push("/os/login")
    }
  }, [isLoading, isAuthenticated, user, propertyId, router])

  if (isLoading || isLoadingData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">Loading property dashboard...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="max-w-md w-full">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <div className="mt-4 text-center">
            <Button onClick={() => router.push("/os/login")} variant="outline">
              Return to login
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (!propertyData) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">Property data not found</p>
      </div>
    )
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status?.toLowerCase()) {
      case "confirmed":
        return "default"
      case "pending":
        return "secondary"
      case "cancelled":
        return "destructive"
      default:
        return "outline"
    }
  }

  return (
    <div className="space-y-8 animate-in fade-in-50 duration-700">
      {/* Enhanced Header */}
      <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 rounded-2xl p-8 text-white shadow-2xl">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                <Building2 className="h-8 w-8 text-white" />
              </div>
        <div>
                <h1 className="text-4xl font-bold tracking-tight">
            {propertyData.title}
          </h1>
                <div className="flex items-center space-x-4 mt-2">
                  <div className="flex items-center space-x-1">
                    <MapPin className="h-4 w-4" />
                    <span className="text-blue-100">
            {propertyData.address.city}, {propertyData.address.state}
                    </span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Activity className="h-4 w-4" />
                    <span className="text-green-200 font-medium">Live</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-6 lg:mt-0 flex items-center space-x-4">
            <div className="text-center">
              <div className="text-2xl font-bold">
                {(() => {
                  // Calculate total rooms with fallback logic
                  let totalRooms = propertyData.metrics.totalRooms || 0

                  // If metrics shows 0, try to calculate from property data
                  if (totalRooms === 0 || totalRooms === 1) {
                    // First try totalHotelRooms
                    if (
                      propertyData.totalHotelRooms &&
                      propertyData.totalHotelRooms !== "0"
                    ) {
                      totalRooms = parseInt(propertyData.totalHotelRooms) || 0
                    }

                    // If no totalHotelRooms, calculate from propertyUnits
                    if (
                      totalRooms === 0 &&
                      propertyData.propertyUnits &&
                      propertyData.propertyUnits.length > 0
                    ) {
                      totalRooms = propertyData.propertyUnits.reduce(
                        (sum: number, unit: any) =>
                          sum + (parseInt(unit.count) || 0),
                        0
                      )
                    }
                  }

                  return totalRooms
                })()}
              </div>
              <div className="text-blue-200 text-sm">Total Rooms</div>
            </div>
            <div className="w-px h-12 bg-white/20"></div>
            <div className="text-center">
              <div className="text-2xl font-bold">
                {(() => {
                  // Enhanced in-house calculation
                  let inHouseCount = propertyData.metrics.inHouse || 0

                  // If we have today's check-ins data, we can be more specific
                  if (
                    (propertyData.metrics as any).todayCheckIns !== undefined
                  ) {
                    // Use the actual in-house count from API
                    return inHouseCount
                  }

                  // Fallback: calculate from today's arrivals minus departures
                  if (inHouseCount === 0 && propertyData.bookings) {
                    const todayArrivals =
                      propertyData.metrics.todayArrivals || 0
                    const todayDepartures =
                      propertyData.metrics.todayDepartures || 0
                    // This is a rough estimate - actual staying guests
                    inHouseCount = Math.max(0, todayArrivals - todayDepartures)
                  }

                  return inHouseCount
                })()}
              </div>
              <div className="text-blue-200 text-sm">
                In-House
                {((propertyData.metrics as any).todayCheckIns || 0) > 0 && (
                  <div className="text-xs text-blue-300 mt-1">
                    +{(propertyData.metrics as any).todayCheckIns || 0} today
                  </div>
                )}
              </div>
            </div>
        </div>
        </div>
      </div>

      {/* Enhanced Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 group bg-gradient-to-br from-emerald-50 to-emerald-100 hover:from-emerald-100 hover:to-emerald-200">
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-green-500/10"></div>
          <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-emerald-700">
              Total Revenue
            </CardTitle>
            <div className="p-2 rounded-lg bg-emerald-500/20 group-hover:bg-emerald-500/30 transition-colors">
              <IndianRupee className="h-5 w-5 text-emerald-600" />
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-3xl font-bold text-emerald-900 mb-1">
              {formatCurrency(propertyData.metrics.monthlyRevenue)}
            </div>
            <div className="flex items-center space-x-1">
              {propertyData.metrics.revenueChange >= 0 ? (
                <TrendingUp className="h-4 w-4 text-emerald-600" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-500" />
              )}
              <span
                className={`text-sm font-medium ${
                  propertyData.metrics.revenueChange >= 0
                    ? "text-emerald-600"
                    : "text-red-500"
                }`}
              >
                {Math.abs(propertyData.metrics.revenueChange).toFixed(1)}%
              </span>
              <span className="text-xs text-emerald-600">vs last month</span>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 group bg-gradient-to-br from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-indigo-500/10"></div>
          <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-blue-700">
              Occupancy Rate
            </CardTitle>
            <div className="p-2 rounded-lg bg-blue-500/20 group-hover:bg-blue-500/30 transition-colors">
              <PieChart className="h-5 w-5 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-3xl font-bold text-blue-900 mb-1">
              {propertyData.metrics.occupancyRate}%
            </div>
            <div className="space-y-2">
              <div className="w-full bg-blue-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-1000 ease-out"
                  style={{ width: `${propertyData.metrics.occupancyRate}%` }}
                ></div>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-blue-600">
              {propertyData.metrics.occupiedRooms} of{" "}
              {propertyData.metrics.totalRooms} rooms occupied
            </p>
                {((propertyData.metrics as any).occupiedRoomsFromInventory ||
                  0) > 0 && (
                  <div className="flex items-center space-x-1">
                    <CheckCircle2 className="h-3 w-3 text-green-600" />
                    <span className="text-xs text-green-600">
                      From room inventory system
                    </span>
                  </div>
                )}
                {((propertyData.metrics as any).occupiedRoomsFromInventory ||
                  0) === 0 &&
                  ((propertyData.metrics as any).occupiedRoomsFromBookings ||
                    0) > 0 && (
                    <div className="flex items-center space-x-1">
                      <AlertCircle className="h-3 w-3 text-amber-600" />
                      <span className="text-xs text-amber-600">
                        From booking records
                      </span>
                    </div>
                  )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 group bg-gradient-to-br from-purple-50 to-purple-100 hover:from-purple-100 hover:to-purple-200">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-pink-500/10"></div>
          <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-purple-700">
              Today's Revenue
            </CardTitle>
            <div className="p-2 rounded-lg bg-purple-500/20 group-hover:bg-purple-500/30 transition-colors">
              <BarChart3 className="h-5 w-5 text-purple-600" />
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-3xl font-bold text-purple-900 mb-1">
              {formatCurrency(propertyData.metrics.todayRevenue)}
            </div>
            <div className="flex items-center space-x-1">
              <Timer className="h-4 w-4 text-purple-600" />
              <span className="text-xs text-purple-600">
              From today's bookings
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 group bg-gradient-to-br from-orange-50 to-orange-100 hover:from-orange-100 hover:to-orange-200">
          <div className="absolute inset-0 bg-gradient-to-r from-orange-500/10 to-red-500/10"></div>
          <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-orange-700">
              In-House Guests
            </CardTitle>
            <div className="p-2 rounded-lg bg-orange-500/20 group-hover:bg-orange-500/30 transition-colors">
              <Users className="h-5 w-5 text-orange-600" />
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-3xl font-bold text-orange-900 mb-1">
              {(() => {
                // Enhanced in-house calculation for metrics card
                let inHouseCount = propertyData.metrics.inHouse || 0

                // Fallback calculation if needed
                if (inHouseCount === 0 && propertyData.bookings) {
                  const todayArrivals = propertyData.metrics.todayArrivals || 0
                  const todayDepartures =
                    propertyData.metrics.todayDepartures || 0
                  inHouseCount = Math.max(0, todayArrivals - todayDepartures)
                }

                return inHouseCount
              })()}
            </div>
            <div className="space-y-1">
              <div className="flex items-center space-x-1">
                <Home className="h-4 w-4 text-orange-600" />
                <span className="text-xs text-orange-600">
                  Currently staying
                </span>
              </div>
              {((propertyData.metrics as any).todayCheckIns || 0) > 0 && (
                <div className="flex items-center space-x-1">
                  <CheckCircle2 className="h-3 w-3 text-green-600" />
                  <span className="text-xs text-green-600">
                    +{(propertyData.metrics as any).todayCheckIns || 0} checked
                    in today
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Dashboard Content with Accordions */}
      <Accordion
        type="multiple"
        defaultValue={["arrivals", "bookings", "housekeeping"]}
        className="w-full"
      >
        {/* Enhanced Arrivals & Departures */}
        <AccordionItem
          value="arrivals"
          className="border rounded-xl shadow-sm bg-white"
        >
          <AccordionTrigger className="text-lg font-semibold px-6 py-4 hover:bg-gray-50">
            <div className="flex items-center">
              <div className="p-2 rounded-lg bg-blue-100 mr-3">
                <Timer className="h-5 w-5 text-blue-600" />
              </div>
              <span>Today's Arrivals & Departures</span>
              <div className="flex items-center space-x-2 ml-auto mr-4">
                <Badge
                  variant="outline"
                  className="bg-green-50 text-green-700 border-green-200"
                >
                  {propertyData.metrics.todayArrivals} Arrivals
                </Badge>
                <Badge
                  variant="outline"
                  className="bg-blue-50 text-blue-700 border-blue-200"
                >
                  {propertyData.metrics.todayDepartures} Departures
                </Badge>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-6 pb-6">
            <PropertyArrivalsDepartures
              arrivals={propertyData.bookings.arrivals}
              departures={propertyData.bookings.departures}
            />
          </AccordionContent>
        </AccordionItem>

        {/* Enhanced Housekeeping Summary */}
        <AccordionItem
          value="housekeeping"
          className="border rounded-xl shadow-sm bg-white"
        >
          <AccordionTrigger className="text-lg font-semibold px-6 py-4 hover:bg-gray-50">
            <div className="flex items-center">
              <div className="p-2 rounded-lg bg-indigo-100 mr-3">
                <Shield className="h-5 w-5 text-indigo-600" />
              </div>
              <span>Housekeeping Operations</span>
              <Badge variant="secondary" className="ml-auto mr-4">
                {propertyData.housekeeping?.totalRooms || 0} Rooms
              </Badge>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-6 pb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card className="border-0 shadow-md bg-gradient-to-br from-green-50 to-emerald-50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center">
                    <CheckCircle2 className="h-5 w-5 text-green-600 mr-2" />
                    Room Status Overview
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 rounded-lg bg-green-100">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        <span className="font-medium text-green-800">
                          Clean
                        </span>
                      </div>
                      <span className="font-bold text-green-800">
                        {propertyData.housekeeping?.clean || 0}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 rounded-lg bg-red-100">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                        <span className="font-medium text-red-800">Dirty</span>
                      </div>
                      <span className="font-bold text-red-800">
                        {propertyData.housekeeping?.dirty || 0}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 rounded-lg bg-blue-100">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                        <span className="font-medium text-blue-800">
                          Cleaning
                        </span>
                      </div>
                      <span className="font-bold text-blue-800">
                        {propertyData.housekeeping?.cleaningInProgress || 0}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 rounded-lg bg-purple-100">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                        <span className="font-medium text-purple-800">
                          Inspected
                        </span>
                  </div>
                      <span className="font-bold text-purple-800">
                        {propertyData.housekeeping?.inspected || 0}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 rounded-lg bg-orange-100">
                      <div className="flex items-center space-x-2">
                        <AlertCircle className="w-3 h-3 text-orange-500" />
                        <span className="font-medium text-orange-800">
                          Maintenance
                        </span>
                  </div>
                      <span className="font-bold text-orange-800">
                        {propertyData.housekeeping?.maintenanceRequired || 0}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-md bg-gradient-to-br from-blue-50 to-indigo-50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center">
                    <Activity className="h-5 w-5 text-blue-600 mr-2" />
                    Performance Metrics
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center p-4 rounded-xl bg-blue-100">
                    <div className="text-3xl font-bold text-blue-900 mb-1">
                      {propertyData.metrics.inHouse || 0}
                    </div>
                    <div className="text-sm text-blue-700">Guests In-House</div>
                  </div>
                    <div className="space-y-3">
                            <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-600">
                          Cleaning Efficiency
                        </span>
                        <span className="font-medium">
                          {Math.round(
                            ((propertyData.housekeeping?.clean || 0) /
                              (propertyData.housekeeping?.totalRooms || 1)) *
                              100
                          )}
                          %
                        </span>
                            </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-green-500 h-2 rounded-full transition-all duration-1000"
                          style={{
                            width: `${Math.round(
                              ((propertyData.housekeeping?.clean || 0) /
                                (propertyData.housekeeping?.totalRooms || 1)) *
                                100
                            )}%`,
                          }}
                        ></div>
                            </div>
                          </div>
                        </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-md bg-gradient-to-br from-purple-50 to-pink-50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center">
                    <Bell className="h-5 w-5 text-purple-600 mr-2" />
                    Quick Actions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <button className="w-full p-3 text-left rounded-lg bg-purple-100 hover:bg-purple-200 transition-colors">
                    <div className="flex items-center space-x-2">
                      <RefreshCw className="h-4 w-4 text-purple-600" />
                      <span className="font-medium text-purple-800">
                        Update Status
                      </span>
                              </div>
                  </button>
                  <button className="w-full p-3 text-left rounded-lg bg-blue-100 hover:bg-blue-200 transition-colors">
                    <div className="flex items-center space-x-2">
                      <Eye className="h-4 w-4 text-blue-600" />
                      <span className="font-medium text-blue-800">
                        View Assignments
                      </span>
                              </div>
                  </button>
                  <button className="w-full p-3 text-left rounded-lg bg-green-100 hover:bg-green-200 transition-colors">
                    <div className="flex items-center space-x-2">
                      <Zap className="h-4 w-4 text-green-600" />
                      <span className="font-medium text-green-800">
                        Schedule Tasks
                      </span>
                    </div>
                  </button>
                </CardContent>
              </Card>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Enhanced Recent Bookings */}
        <AccordionItem
          value="bookings"
          className="border rounded-xl shadow-sm bg-white"
        >
          <AccordionTrigger className="text-lg font-semibold px-6 py-4 hover:bg-gray-50">
            <div className="flex items-center">
              <div className="p-2 rounded-lg bg-emerald-100 mr-3">
                <Calendar className="h-5 w-5 text-emerald-600" />
              </div>
              <span>Recent Bookings</span>
              <Badge
                variant="outline"
                className="ml-auto mr-4 bg-emerald-50 text-emerald-700 border-emerald-200"
              >
                {propertyData.bookings.recent.length} Bookings
              </Badge>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-6 pb-6">
            <PropertyRecentBookings
              bookings={propertyData.bookings.recent}
              formatCurrency={formatCurrency}
              getStatusBadgeVariant={getStatusBadgeVariant}
            />
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  )
}
