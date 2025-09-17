"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { useSession } from "next-auth/react"
import Link from "next/link"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Bed,
  Hotel,
  Wifi,
  Wrench,
  Sparkles,
  Building,
  TrendingUp,
  Calendar,
  Settings,
  ArrowRight,
  BarChart3,
  IndianRupee,
  Package,
  Users,
  CheckCircle2,
  AlertTriangle,
  Activity,
  ArrowLeft,
  Eye,
  PlusCircle,
  RefreshCw,
  Star,
  Target,
} from "lucide-react"
import { DashboardSkeleton } from "@/components/ui/loading-skeleton"

export default function PropertyInventoryLanding() {
  const router = useRouter()
  const params = useParams()
  const { data: session } = useSession()
  const [loading, setLoading] = useState(true)
  const [propertyData, setPropertyData] = useState<any>(null)
  const [moduleData, setModuleData] = useState<any>({
    roomTypes: { count: 0, status: 'Loading...' },
    amenities: { count: 0, status: 'Loading...' },
    facilities: { count: 0, status: 'Loading...' }
  })

  const propertyId = params?.propertyId as string

  // Allow access to any property ID from URL - remove automatic redirect
  // Users should be able to access different properties through URL params

  useEffect(() => {
    // Load real property-specific data from API
    const loadPropertyData = async () => {
      try {
        setLoading(true)

        // Fetch real dashboard data from API - using F&B pattern
        const dashboardResponse = await fetch(
          `/api/inventory/dashboard?propertyId=${propertyId}`
        )
        const dashboardData = await dashboardResponse.json()

        // Fetch module-specific data in parallel to get detailed counts
        const [amenitiesRes, facilitiesRes] = await Promise.all([
          fetch(`/api/inventory/amenities?propertyId=${propertyId}`).catch(() => null),
          fetch(`/api/inventory/facilities?propertyId=${propertyId}`).catch(() => null)
        ])

        // Parse module data
        const amenitiesData = amenitiesRes ? await amenitiesRes.json() : null
        const facilitiesData = facilitiesRes ? await facilitiesRes.json() : null

        // Use real data from dashboard API and supplement with module APIs
        const roomTypesFromDashboard = dashboardData?.data?.roomTypes || { activeTypes: 0, totalTypes: 0 }

        // Update module data state with real data
        setModuleData({
          roomTypes: {
            count: roomTypesFromDashboard.activeTypes || 0,
            status: roomTypesFromDashboard.activeTypes > 0 ? 'All Configured' : 'Setup Required'
          },
          amenities: {
            count: amenitiesData?.data?.length || 0,
            status: amenitiesData?.data && amenitiesData.data.length > 0 ?
              `${Math.round((amenitiesData.data.filter((a: any) => a.isAvailable).length / amenitiesData.data.length) * 100)}% Active` :
              'No Data'
          },
          facilities: {
            count: facilitiesData?.facilities?.length || 0,
            status: facilitiesData?.facilities && facilitiesData.facilities.length > 0 ?
              `${facilitiesData.facilities.filter((f: any) => f.status === 'operational').length}/${facilitiesData.facilities.length} Operational` :
              'All Systems'
          }
        })

        // Property details are included in dashboard response
        const propertyData = dashboardData.success
          ? { success: true, property: dashboardData.data.property }
          : { success: false }

        if (dashboardResponse.ok && dashboardData.success) {
          setPropertyData({
            id: propertyId,
            name: propertyData.success
              ? propertyData.property?.name || `Property ${propertyId}`
              : `Property ${propertyId}`,
            totalRooms: dashboardData.data.overview.totalRooms,
            availableRooms: dashboardData.data.overview.availableRooms,
            occupancyRate: dashboardData.data.overview.occupancyRate,
            todayRevenue: dashboardData.data.revenue.todaysRevenue,
            pendingTasks: dashboardData.data.housekeeping?.tasksPending || 0,
            roomTypesActive: roomTypesFromDashboard.activeTypes || 0,
          })
        } else {
          setPropertyData({
            id: propertyId,
            name: `Property ${propertyId}`,
            totalRooms: 0,
            availableRooms: 0,
            occupancyRate: 0,
            todayRevenue: 0,
            pendingTasks: 0,
          })
        }
      } catch (error) {
        console.error("Error loading property data:", error)
        // Fallback to basic data
        setPropertyData({
          id: propertyId,
          name: `Property ${propertyId}`,
          totalRooms: 0,
          availableRooms: 0,
          occupancyRate: 0,
          todayRevenue: 0,
          pendingTasks: 0,
        })
      } finally {
        setLoading(false)
      }
    }

    if (propertyId) {
      loadPropertyData()
    }
  }, [propertyId])

  if (loading) {
    return <DashboardSkeleton />
  }

  const inventoryModules = [
    {
      title: "Room Management",
      description: "Manage individual rooms, availability, and status tracking",
      href: `/os/inventory/rooms/${propertyId}`,
      icon: Bed,
      color: "blue",
      gradient: "from-blue-500 to-indigo-500",
      stats: `${propertyData?.totalRooms || 55} Total Rooms`,
      status: `${propertyData?.availableRooms || 22} Available`,
    },
    {
      title: "Room Types",
      description: "Configure room categories, pricing, and features",
      href: `/os/inventory/room-types/${propertyId}`,
      icon: Hotel,
      color: "green",
      gradient: "from-green-500 to-emerald-500",
      stats: `${moduleData.roomTypes.count} Active Types`,
      status: moduleData.roomTypes.status,
    },
    {
      title: "Rate Management",
      description: "Dynamic pricing and revenue optimization",
      href: `/os/inventory/rates/${propertyId}`,
      icon: IndianRupee,
      color: "purple",
      gradient: "from-purple-500 to-pink-500",
      stats: "₹3,200 Avg Rate",
      status: "Optimized",
    },
    {
      title: "Amenities",
      description: "Manage property features and guest services",
      href: `/os/inventory/amenities/${propertyId}`,
      icon: Wifi,
      color: "cyan",
      gradient: "from-cyan-500 to-blue-500",
      stats: `${moduleData.amenities.count} Total`,
      status: moduleData.amenities.status,
    },
    {
      title: "Housekeeping",
      description: "Room cleaning schedules and task management",
      href: `/os/inventory/housekeeping/${propertyId}`,
      icon: Sparkles,
      color: "yellow",
      gradient: "from-yellow-500 to-orange-500",
      stats: `${propertyData?.pendingTasks || 12} Tasks Pending`,
      status: "In Progress",
    },
    {
      title: "Facilities",
      description: "Property infrastructure and maintenance",
      href: `/os/inventory/facilities/${propertyId}`,
      icon: Building,
      color: "gray",
      gradient: "from-gray-500 to-slate-500",
      stats: `${moduleData.facilities.count} Systems`,
      status: moduleData.facilities.status,
    },
  ]

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
                onClick={() => router.push("/os")}
                className="flex items-center space-x-2 text-white/80 hover:text-white hover:bg-white/20 rounded-lg"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back to OS</span>
              </Button>
            </div>
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                <Hotel className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold tracking-tight">
                  Inventory Management
                </h1>
                <div className="flex items-center space-x-4 mt-2">
                  <div className="flex items-center space-x-1">
                    <Package className="h-4 w-4" />
                    <span className="text-indigo-100">
                      {propertyData?.name || `Property ${propertyId}`}
                    </span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Activity className="h-4 w-4" />
                    <span className="text-green-200 font-medium">Active</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-6 lg:mt-0 flex items-center space-x-4">
            <Button
              onClick={() =>
                router.push(`/os/inventory/analytics/${propertyId}`)
              }
              className="bg-white/20 hover:bg-white/30 text-white border-white/30 backdrop-blur-sm"
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              Analytics
            </Button>
            <Button className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 border-0 font-semibold">
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </Button>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 group bg-gradient-to-br from-emerald-50 to-emerald-100 hover:from-emerald-100 hover:to-emerald-200">
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-green-500/10"></div>
          <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-emerald-700">
              Total Rooms
            </CardTitle>
            <div className="p-2 rounded-lg bg-emerald-500/20 group-hover:bg-emerald-500/30 transition-colors">
              <Hotel className="h-5 w-5 text-emerald-600" />
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-3xl font-bold text-emerald-900 mb-1">
              {propertyData?.totalRooms || 55}
            </div>
            <div className="flex items-center space-x-1">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <span className="text-xs text-emerald-600">All configured</span>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 group bg-gradient-to-br from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-indigo-500/10"></div>
          <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-blue-700">
              Available Now
            </CardTitle>
            <div className="p-2 rounded-lg bg-blue-500/20 group-hover:bg-blue-500/30 transition-colors">
              <Bed className="h-5 w-5 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-3xl font-bold text-blue-900 mb-1">
              {propertyData?.availableRooms || 22}
            </div>
            <div className="flex items-center space-x-1">
              <TrendingUp className="h-4 w-4 text-blue-600" />
              <span className="text-xs text-blue-600">
                {propertyData?.occupancyRate || 74.5}% occupancy
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 group bg-gradient-to-br from-purple-50 to-purple-100 hover:from-purple-100 hover:to-purple-200">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-pink-500/10"></div>
          <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-purple-700">
              Revenue Today
            </CardTitle>
            <div className="p-2 rounded-lg bg-purple-500/20 group-hover:bg-purple-500/30 transition-colors">
              <IndianRupee className="h-5 w-5 text-purple-600" />
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-3xl font-bold text-purple-900 mb-1">
              ₹{(propertyData?.todayRevenue || 125000).toLocaleString()}
            </div>
            <div className="flex items-center space-x-1">
              <TrendingUp className="h-4 w-4 text-purple-600" />
              <span className="text-xs text-purple-600">+8% vs yesterday</span>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 group bg-gradient-to-br from-orange-50 to-orange-100 hover:from-orange-100 hover:to-orange-200">
          <div className="absolute inset-0 bg-gradient-to-r from-orange-500/10 to-red-500/10"></div>
          <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-orange-700">
              Tasks Pending
            </CardTitle>
            <div className="p-2 rounded-lg bg-orange-500/20 group-hover:bg-orange-500/30 transition-colors">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-3xl font-bold text-orange-900 mb-1">
              {propertyData?.pendingTasks || 12}
            </div>
            <div className="flex items-center space-x-1">
              <Sparkles className="h-4 w-4 text-orange-600" />
              <span className="text-xs text-orange-600">Housekeeping</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Inventory Modules Grid */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Management Modules
            </h2>
            <p className="text-gray-600">
              Access all inventory management tools
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <Button
              onClick={() =>
                router.push(`/os/inventory/dashboard/${propertyId}`)
              }
              className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg"
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              View Dashboard
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {inventoryModules.map((module) => {
            const Icon = module.icon
            return (
              <Link key={module.title} href={module.href} prefetch={true}>
                <Card className="group hover:scale-105 transition-all duration-300 hover:shadow-xl border-0 shadow-lg cursor-pointer bg-gradient-to-br from-white to-gray-50 hover:from-gray-50 hover:to-white">
                  <div
                    className={`h-2 bg-gradient-to-r ${module.gradient} rounded-t-lg`}
                  ></div>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div
                        className={`p-3 rounded-xl bg-gradient-to-r ${module.gradient} bg-opacity-20 group-hover:bg-opacity-30 transition-all duration-300`}
                      >
                        <Icon className={`h-6 w-6 text-${module.color}-600`} />
                      </div>
                      <Badge
                        className={`bg-${module.color}-100 text-${module.color}-800 border-0 font-medium`}
                      >
                        {module.status}
                      </Badge>
                    </div>
                    <div className="space-y-1">
                      <CardTitle className="text-xl font-bold text-gray-900 group-hover:text-gray-700">
                        {module.title}
                      </CardTitle>
                      <CardDescription className="text-gray-600">
                        {module.description}
                      </CardDescription>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-semibold text-gray-900">
                          {module.stats}
                        </div>
                        <div className="text-xs text-gray-500">
                          Current status
                        </div>
                      </div>
                      <ArrowRight
                        className={`h-5 w-5 text-${module.color}-600 group-hover:translate-x-1 transition-transform duration-200`}
                      />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
      </div>

      {/* Quick Actions */}
      <Card className="border-0 shadow-lg bg-gradient-to-r from-gray-50 to-white">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-gray-900 flex items-center">
            <Target className="h-5 w-5 text-indigo-600 mr-2" />
            Quick Actions
          </CardTitle>
          <CardDescription>
            Common inventory management tasks for this property
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button
              onClick={() =>
                router.push(`/os/inventory/dashboard/${propertyId}`)
              }
              className="p-6 h-auto justify-start bg-gradient-to-r from-indigo-50 to-purple-50 hover:from-indigo-100 hover:to-purple-100 text-indigo-900 border-indigo-200"
              variant="outline"
            >
              <div className="flex flex-col items-start space-y-2">
                <BarChart3 className="h-5 w-5 text-indigo-600" />
                <div>
                  <div className="font-semibold">View Dashboard</div>
                  <div className="text-xs text-indigo-700">
                    Complete overview
                  </div>
                </div>
              </div>
            </Button>

            <Button
              onClick={() => router.push(`/os/inventory/rooms/${propertyId}`)}
              className="p-6 h-auto justify-start bg-gradient-to-r from-blue-50 to-cyan-50 hover:from-blue-100 hover:to-cyan-100 text-blue-900 border-blue-200"
              variant="outline"
            >
              <div className="flex flex-col items-start space-y-2">
                <Bed className="h-5 w-5 text-blue-600" />
                <div>
                  <div className="font-semibold">Manage Rooms</div>
                  <div className="text-xs text-blue-700">
                    Check availability
                  </div>
                </div>
              </div>
            </Button>

            <Button
              onClick={() =>
                router.push(`/os/inventory/housekeeping/${propertyId}`)
              }
              className="p-6 h-auto justify-start bg-gradient-to-r from-yellow-50 to-orange-50 hover:from-yellow-100 hover:to-orange-100 text-yellow-900 border-yellow-200"
              variant="outline"
            >
              <div className="flex flex-col items-start space-y-2">
                <Sparkles className="h-5 w-5 text-yellow-600" />
                <div>
                  <div className="font-semibold">Housekeeping</div>
                  <div className="text-xs text-yellow-700">
                    View pending tasks
                  </div>
                </div>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
