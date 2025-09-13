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
import { EnhancedDashboard } from "@/components/os/dashboard/enhanced-dashboard"

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

  const propertyId = (params?.id as string) || ''

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
          className="border-0 rounded-2xl shadow-2xl bg-gradient-to-br from-white via-indigo-50/20 to-purple-50/30 overflow-hidden hover:shadow-3xl transition-all duration-500"
        >
          <AccordionTrigger className="text-xl font-bold px-8 py-6 bg-gradient-to-r from-indigo-100/80 via-purple-100/80 to-pink-100/80 border-b border-indigo-200/50 backdrop-blur-sm hover:from-indigo-200/60 hover:via-purple-200/60 hover:to-pink-200/60 transition-all duration-300">
            <div className="flex items-center w-full">
              <div className="flex items-center space-x-4 flex-1">
                <div className="p-3 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 rounded-xl shadow-lg">
                  <Shield className="h-7 w-7 text-indigo-600" />
                </div>
                <div>
                  <span className="text-indigo-900">Housekeeping Operations</span>
                  <div className="text-sm font-normal text-indigo-700 mt-1">Complete room management and maintenance</div>
                </div>
              </div>
              <div className="flex items-center space-x-3 mr-4">
                <Badge className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white border-0 shadow-lg font-bold px-4 py-2 text-lg animate-pulse">
                  <Shield className="w-4 h-4 mr-2" />
                  {propertyData.housekeeping?.totalRooms || 0} ROOMS
                </Badge>
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse"></div>
                  <span className="text-sm text-indigo-600 font-medium">Live Status</span>
                </div>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-8 pb-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <Card className="border-0 shadow-2xl bg-gradient-to-br from-white via-green-50/20 to-emerald-50/30 overflow-hidden hover:shadow-3xl transition-all duration-500 transform hover:scale-[1.02]">
                <CardHeader className="bg-gradient-to-r from-green-100/80 via-emerald-100/80 to-teal-100/80 border-b border-green-200/50 backdrop-blur-sm pb-4">
                  <CardTitle className="text-xl flex items-center space-x-3 text-green-900">
                    <div className="p-3 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-xl shadow-lg">
                      <CheckCircle2 className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                      <span className="font-bold">Room Status Overview</span>
                      <div className="text-sm font-normal text-green-700 mt-1">Live room status tracking</div>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6 p-6">
                  <div className="space-y-4">
                    <div className="group relative overflow-hidden bg-gradient-to-r from-white to-green-50/50 border-0 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-[1.02]">
                      <div className="absolute inset-0 bg-gradient-to-r from-green-500/5 to-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      <div className="relative flex justify-between items-center p-4">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-gradient-to-r from-green-100/80 to-emerald-100/80 rounded-lg shadow-sm">
                            <div className="w-4 h-4 bg-green-500 rounded-full animate-pulse"></div>
                          </div>
                          <span className="font-bold text-green-800 text-lg">Clean</span>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-green-900">{propertyData.housekeeping?.clean || 0}</div>
                          <Badge className="bg-gradient-to-r from-green-200 to-emerald-200 text-green-800 border-0 shadow-sm text-xs">Ready</Badge>
                        </div>
                      </div>
                    </div>

                    <div className="group relative overflow-hidden bg-gradient-to-r from-white to-red-50/50 border-0 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-[1.02]">
                      <div className="absolute inset-0 bg-gradient-to-r from-red-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      <div className="relative flex justify-between items-center p-4">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-gradient-to-r from-red-100/80 to-pink-100/80 rounded-lg shadow-sm">
                            <div className="w-4 h-4 bg-red-500 rounded-full"></div>
                          </div>
                          <span className="font-bold text-red-800 text-lg">Dirty</span>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-red-900">{propertyData.housekeeping?.dirty || 0}</div>
                          <Badge className="bg-gradient-to-r from-red-200 to-pink-200 text-red-800 border-0 shadow-sm text-xs">Needs Clean</Badge>
                        </div>
                      </div>
                    </div>

                    <div className="group relative overflow-hidden bg-gradient-to-r from-white to-blue-50/50 border-0 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-[1.02]">
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      <div className="relative flex justify-between items-center p-4">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-gradient-to-r from-blue-100/80 to-indigo-100/80 rounded-lg shadow-sm">
                            <div className="w-4 h-4 bg-blue-500 rounded-full animate-pulse"></div>
                          </div>
                          <span className="font-bold text-blue-800 text-lg">Cleaning</span>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-blue-900">{propertyData.housekeeping?.cleaningInProgress || 0}</div>
                          <Badge className="bg-gradient-to-r from-blue-200 to-indigo-200 text-blue-800 border-0 shadow-sm text-xs animate-pulse">In Progress</Badge>
                        </div>
                      </div>
                    </div>

                    <div className="group relative overflow-hidden bg-gradient-to-r from-white to-purple-50/50 border-0 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-[1.02]">
                      <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      <div className="relative flex justify-between items-center p-4">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-gradient-to-r from-purple-100/80 to-pink-100/80 rounded-lg shadow-sm">
                            <div className="w-4 h-4 bg-purple-500 rounded-full"></div>
                          </div>
                          <span className="font-bold text-purple-800 text-lg">Inspected</span>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-purple-900">{propertyData.housekeeping?.inspected || 0}</div>
                          <Badge className="bg-gradient-to-r from-purple-200 to-pink-200 text-purple-800 border-0 shadow-sm text-xs">Approved</Badge>
                        </div>
                      </div>
                    </div>

                    <div className="group relative overflow-hidden bg-gradient-to-r from-white to-orange-50/50 border-0 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-[1.02]">
                      <div className="absolute inset-0 bg-gradient-to-r from-orange-500/5 to-red-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      <div className="relative flex justify-between items-center p-4">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-gradient-to-r from-orange-100/80 to-red-100/80 rounded-lg shadow-sm">
                            <AlertCircle className="w-4 h-4 text-orange-500" />
                          </div>
                          <span className="font-bold text-orange-800 text-lg">Maintenance</span>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-orange-900">{propertyData.housekeeping?.maintenanceRequired || 0}</div>
                          <Badge className="bg-gradient-to-r from-orange-200 to-red-200 text-orange-800 border-0 shadow-sm text-xs">Urgent</Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-2xl bg-gradient-to-br from-white via-blue-50/20 to-indigo-50/30 overflow-hidden hover:shadow-3xl transition-all duration-500 transform hover:scale-[1.02]">
                <CardHeader className="bg-gradient-to-r from-blue-100/80 via-indigo-100/80 to-purple-100/80 border-b border-blue-200/50 backdrop-blur-sm pb-4">
                  <CardTitle className="text-xl flex items-center space-x-3 text-blue-900">
                    <div className="p-3 bg-gradient-to-r from-blue-500/20 to-indigo-500/20 rounded-xl shadow-lg">
                      <Activity className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <span className="font-bold">Performance Metrics</span>
                      <div className="text-sm font-normal text-blue-700 mt-1">Operational efficiency insights</div>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6 p-6">
                  <div className="group relative overflow-hidden bg-gradient-to-r from-white to-blue-50/50 border-0 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <div className="relative text-center p-6">
                      <div className="flex items-center justify-center mb-4">
                        <div className="p-4 bg-gradient-to-r from-blue-100/80 to-indigo-100/80 rounded-full shadow-lg">
                          <Users className="w-8 h-8 text-blue-600" />
                        </div>
                      </div>
                      <div className="text-4xl font-bold text-blue-900 mb-2">
                        {propertyData.metrics.inHouse || 0}
                      </div>
                      <div className="text-lg text-blue-700 font-semibold">Guests In-House</div>
                      <Badge className="bg-gradient-to-r from-blue-200 to-indigo-200 text-blue-800 border-0 shadow-sm mt-3">
                        Live Count
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="bg-gradient-to-r from-white/80 to-green-50/80 rounded-2xl p-6 shadow-lg">
                      <div className="flex justify-between items-center mb-4">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-gradient-to-r from-green-100/80 to-emerald-100/80 rounded-lg shadow-sm">
                            <Activity className="w-5 h-5 text-green-600" />
                          </div>
                          <span className="font-bold text-green-900 text-lg">Cleaning Efficiency</span>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-green-900">
                            {Math.round(
                              ((propertyData.housekeeping?.clean || 0) /
                                (propertyData.housekeeping?.totalRooms || 1)) *
                                100
                            )}%
                          </div>
                          <Badge className="bg-gradient-to-r from-green-200 to-emerald-200 text-green-800 border-0 shadow-sm text-xs">
                            Performance
                          </Badge>
                        </div>
                      </div>
                      <div className="w-full bg-green-200/50 rounded-full h-4">
                        <div
                          className="bg-gradient-to-r from-green-500 to-emerald-500 h-4 rounded-full transition-all duration-1000 ease-out shadow-md"
                          style={{
                            width: `${Math.round(
                              ((propertyData.housekeeping?.clean || 0) /
                                (propertyData.housekeeping?.totalRooms || 1)) *
                                100
                            )}%`,
                          }}
                        ></div>
                      </div>
                      <div className="flex justify-between text-sm text-green-700 mt-2">
                        <span>Clean Rooms: {propertyData.housekeeping?.clean || 0}</span>
                        <span>Total Rooms: {propertyData.housekeeping?.totalRooms || 0}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-2xl bg-gradient-to-br from-white via-purple-50/20 to-pink-50/30 overflow-hidden hover:shadow-3xl transition-all duration-500 transform hover:scale-[1.02]">
                <CardHeader className="bg-gradient-to-r from-purple-100/80 via-pink-100/80 to-red-100/80 border-b border-purple-200/50 backdrop-blur-sm pb-4">
                  <CardTitle className="text-xl flex items-center space-x-3 text-purple-900">
                    <div className="p-3 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-xl shadow-lg">
                      <Bell className="h-6 w-6 text-purple-600" />
                    </div>
                    <div>
                      <span className="font-bold">Quick Actions</span>
                      <div className="text-sm font-normal text-purple-700 mt-1">Instant housekeeping operations</div>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 p-6">
                  <button className="group w-full relative overflow-hidden bg-gradient-to-r from-white to-purple-50/50 border-0 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]">
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <div className="relative p-4">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-gradient-to-r from-purple-100/80 to-pink-100/80 rounded-lg shadow-sm group-hover:shadow-md transition-all duration-300">
                          <RefreshCw className="h-5 w-5 text-purple-600 group-hover:rotate-180 transition-transform duration-500" />
                        </div>
                        <div className="text-left">
                          <div className="font-bold text-purple-900 text-lg">Update Status</div>
                          <div className="text-purple-600 text-sm">Modify room cleaning status</div>
                        </div>
                      </div>
                    </div>
                  </button>
                  
                  <button className="group w-full relative overflow-hidden bg-gradient-to-r from-white to-blue-50/50 border-0 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <div className="relative p-4">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-gradient-to-r from-blue-100/80 to-indigo-100/80 rounded-lg shadow-sm group-hover:shadow-md transition-all duration-300">
                          <Eye className="h-5 w-5 text-blue-600 group-hover:scale-110 transition-transform duration-300" />
                        </div>
                        <div className="text-left">
                          <div className="font-bold text-blue-900 text-lg">View Assignments</div>
                          <div className="text-blue-600 text-sm">Check staff task allocation</div>
                        </div>
                      </div>
                    </div>
                  </button>
                  
                  <button className="group w-full relative overflow-hidden bg-gradient-to-r from-white to-green-50/50 border-0 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]">
                    <div className="absolute inset-0 bg-gradient-to-r from-green-500/5 to-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <div className="relative p-4">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-gradient-to-r from-green-100/80 to-emerald-100/80 rounded-lg shadow-sm group-hover:shadow-md transition-all duration-300">
                          <Zap className="h-5 w-5 text-green-600 group-hover:animate-pulse" />
                        </div>
                        <div className="text-left">
                          <div className="font-bold text-green-900 text-lg">Schedule Tasks</div>
                          <div className="text-green-600 text-sm">Plan cleaning activities</div>
                        </div>
                      </div>
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
          className="border-0 rounded-2xl shadow-2xl bg-gradient-to-br from-white via-emerald-50/20 to-green-50/30 overflow-hidden hover:shadow-3xl transition-all duration-500"
        >
          <AccordionTrigger className="text-xl font-bold px-8 py-6 bg-gradient-to-r from-emerald-100/80 via-green-100/80 to-teal-100/80 border-b border-emerald-200/50 backdrop-blur-sm hover:from-emerald-200/60 hover:via-green-200/60 hover:to-teal-200/60 transition-all duration-300">
            <div className="flex items-center w-full">
              <div className="flex items-center space-x-4 flex-1">
                <div className="p-3 bg-gradient-to-r from-emerald-500/20 to-green-500/20 rounded-xl shadow-lg">
                  <Calendar className="h-7 w-7 text-emerald-600" />
                </div>
                <div>
                  <span className="text-emerald-900">Recent Bookings</span>
                  <div className="text-sm font-normal text-emerald-700 mt-1">Latest reservation activity and guest check-ins</div>
                </div>
              </div>
              <div className="flex items-center space-x-3 mr-4">
                <Badge className="bg-gradient-to-r from-emerald-500 to-green-500 text-white border-0 shadow-lg font-bold px-4 py-2 text-lg animate-pulse">
                  <Calendar className="w-4 h-4 mr-2" />
                  {propertyData.bookings.recent.length} BOOKINGS
                </Badge>
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                  <span className="text-sm text-emerald-600 font-medium">Live Updates</span>
                </div>
              </div>
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
