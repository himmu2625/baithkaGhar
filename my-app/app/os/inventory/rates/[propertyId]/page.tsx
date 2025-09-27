"use client"

import React, { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { useToast } from "@/hooks/use-toast"
import { format, addDays, startOfMonth, endOfMonth } from "date-fns"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Plus,
  Upload,
  Download,
  RefreshCw,
  Settings,
  Calendar,
  ArrowLeft,
  TrendingUp,
  IndianRupee,
  Hotel,
  Activity,
  Target,
  Clock,
  AlertTriangle
} from "lucide-react"

// Import new components
import PlanSelector, { OccupancySelector } from "@/components/ui/plan-selector"
import EnhancedPricingCalendar from "@/components/ui/enhanced-pricing-calendar"
import ExcelImportDialog from "@/components/ui/excel-import-dialog"

// Types
interface RoomType {
  id: string
  name: string
  description: string
  basePrice: number
  count: number
  maxGuests: number
}

interface Property {
  id: string
  name: string
}

interface PricingSummary {
  totalRules: number
  activeRules: number
  roomCategories: number
  dateRange: { min: string; max: string }
  priceRange: { min: number; max: number }
}

const defaultPlans = [
  { code: 'EP' as const, name: 'Room Only', description: 'European Plan - Room accommodation only', inclusions: ['Room accommodation', 'Basic amenities'] },
  { code: 'CP' as const, name: 'Room + Breakfast', description: 'Continental Plan - Room with breakfast', inclusions: ['Room accommodation', 'Daily breakfast'] },
  { code: 'MAP' as const, name: 'Room + Breakfast + 1 Meal', description: 'Modified American Plan - Room with breakfast and one meal', inclusions: ['Room accommodation', 'Daily breakfast', 'Lunch or dinner'] },
  { code: 'AP' as const, name: 'Room + All Meals', description: 'American Plan - Room with all meals', inclusions: ['Room accommodation', 'All meals'] }
];

const defaultOccupancies = [
  { type: 'SINGLE' as const, label: 'Single', description: 'Single Sharing', maxGuests: 1 },
  { type: 'DOUBLE' as const, label: 'Double', description: 'Double Sharing', maxGuests: 2 },
  { type: 'TRIPLE' as const, label: 'Triple', description: 'Triple Sharing', maxGuests: 3 },
  { type: 'QUAD' as const, label: 'Quad', description: 'Quad Sharing', maxGuests: 4 }
];

export default function EnhancedRateManagement() {
  const params = useParams()
  const router = useRouter()
  const { data: session } = useSession()
  const { toast } = useToast()

  const propertyId = params.propertyId as string

  // State
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([])
  const [property, setProperty] = useState<Property | null>(null)
  const [pricingSummary, setPricingSummary] = useState<PricingSummary | null>(null)
  const [showImportDialog, setShowImportDialog] = useState(false)

  // Selection state
  const [selectedPlan, setSelectedPlan] = useState<string>('EP')
  const [selectedOccupancy, setSelectedOccupancy] = useState<string>('SINGLE')
  const [selectedRoomCategory, setSelectedRoomCategory] = useState<string>('')

  // Data fetching
  useEffect(() => {
    if (propertyId && session?.user) {
      fetchData()
    }
  }, [propertyId, session])

  const fetchData = async () => {
    try {
      setLoading(true)
      console.log("🔄 [Enhanced Rate Management] Starting data fetch for property:", propertyId)

      // Fetch room types and pricing summary in parallel
      const [roomTypesResponse, pricingSummaryResponse] = await Promise.allSettled([
        fetch(`/api/admin/properties/${propertyId}/pricing`),
        fetch(`/api/pricing/summary?propertyId=${propertyId}`)
      ])

      // Handle room types response
      if (roomTypesResponse.status === 'fulfilled') {
        try {
          const roomTypesData = await roomTypesResponse.value.json()
          console.log("🏠 [Enhanced Rate Management] Room types response:", roomTypesData)

          if (roomTypesResponse.value.ok && roomTypesData.roomCategories) {
            const transformedRoomTypes = roomTypesData.roomCategories.map((category: any) => ({
              id: category.id,
              name: category.name,
              description: category.description,
              basePrice: category.price,
              count: category.count,
              maxGuests: category.maxGuests
            }))
            setRoomTypes(transformedRoomTypes)

            // Set default room category
            if (transformedRoomTypes.length > 0 && !selectedRoomCategory) {
              setSelectedRoomCategory(transformedRoomTypes[0].name)
            }

            console.log("✅ [Enhanced Rate Management] Room types loaded:", transformedRoomTypes.length)
          }
        } catch (error) {
          console.error("❌ [Enhanced Rate Management] Error parsing room types:", error)
        }
      }

      // Handle pricing summary response
      if (pricingSummaryResponse.status === 'fulfilled') {
        try {
          const summaryData = await pricingSummaryResponse.value.json()
          if (pricingSummaryResponse.value.ok) {
            setPricingSummary(summaryData.summary)
            setProperty(summaryData.property)
          }
        } catch (error) {
          console.error("❌ [Enhanced Rate Management] Error parsing pricing summary:", error)
        }
      }

      console.log("✅ [Enhanced Rate Management] Data fetch completed")
    } catch (error) {
      console.error("❌ [Enhanced Rate Management] Unexpected error during data fetch:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchData()
    setRefreshing(false)
    toast({
      title: "Success",
      description: "Pricing data refreshed successfully",
    })
  }

  const handleImportComplete = (result: any) => {
    toast({
      title: result.success ? "Success" : "Import Issues",
      description: result.success
        ? `Successfully imported ${result.importResult?.created || 0} pricing rules`
        : "Import completed with some issues. Check the details.",
      variant: result.success ? "default" : "destructive"
    })

    if (result.success) {
      fetchData() // Refresh data after successful import
    }
  }

  // Calculate stats
  const stats = {
    totalRules: pricingSummary?.totalRules || 0,
    activeRules: pricingSummary?.activeRules || 0,
    roomCategories: roomTypes.length,
    avgBaseRate: roomTypes.length > 0 ? Math.round(roomTypes.reduce((sum, room) => sum + room.basePrice, 0) / roomTypes.length) : 0,
    priceRange: pricingSummary?.priceRange || { min: 0, max: 0 }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-32 w-32 border-b-4 border-blue-600 mx-auto"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <IndianRupee className="h-8 w-8 text-blue-600" />
            </div>
          </div>
          <p className="mt-6 text-lg font-medium text-gray-700">Loading Enhanced Rate Management...</p>
          <p className="mt-2 text-sm text-gray-500">Setting up your advanced pricing dashboard</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="space-y-6">
        {/* Header Section */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-3xl p-8 m-6 text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-600/90 to-blue-600/90"></div>
          <div className="relative">
            <div className="flex justify-between items-start">
              <div className="space-y-4">
                <Button
                  variant="ghost"
                  onClick={() => router.push(`/os/inventory/dashboard/${propertyId}`)}
                  className="text-white/80 hover:text-white hover:bg-white/10 p-2 h-auto"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Inventory
                </Button>

                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                    <IndianRupee className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <h1 className="text-4xl font-bold text-white">
                      Enhanced Rate Management
                    </h1>
                    <div className="flex items-center space-x-4 mt-2">
                      <div className="flex items-center space-x-2">
                        <Target className="h-4 w-4 text-white/80" />
                        <span className="text-white/90">Plan-based pricing with occupancy control</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Activity className="h-4 w-4 text-white/80" />
                        <span className="text-white/90">Excel import enabled</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setShowImportDialog(true)}
                  className="bg-white/10 border-white/20 text-white hover:bg-white/20 hover:text-white"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Import Excel
                </Button>
                <Button
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="bg-white text-purple-600 hover:bg-white/90 font-semibold"
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mx-6">
          <div className="bg-gradient-to-br from-teal-50 to-teal-100 rounded-2xl p-6 border border-teal-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-teal-700 font-medium">Total Rules</h3>
              <div className="p-2 bg-teal-500/20 rounded-lg">
                <Target className="h-6 w-6 text-teal-600" />
              </div>
            </div>
            <div className="text-4xl font-bold text-teal-900 mb-2">{stats.totalRules}</div>
            <div className="flex items-center text-teal-600 text-sm">
              <Activity className="h-4 w-4 mr-1" />
              {stats.activeRules} active
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-6 border border-blue-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-blue-700 font-medium">Room Categories</h3>
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <Hotel className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <div className="text-4xl font-bold text-blue-900 mb-2">{stats.roomCategories}</div>
            <div className="flex items-center text-blue-600 text-sm">
              <TrendingUp className="h-4 w-4 mr-1" />
              Available types
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-6 border border-purple-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-purple-700 font-medium">Avg Base Rate</h3>
              <div className="p-2 bg-purple-500/20 rounded-lg">
                <IndianRupee className="h-6 w-6 text-purple-600" />
              </div>
            </div>
            <div className="text-4xl font-bold text-purple-900 mb-2">₹{stats.avgBaseRate}</div>
            <div className="flex items-center text-purple-600 text-sm">
              <TrendingUp className="h-4 w-4 mr-1" />
              Per night
            </div>
          </div>

          <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl p-6 border border-orange-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-orange-700 font-medium">Price Range</h3>
              <div className="p-2 bg-orange-500/20 rounded-lg">
                <TrendingUp className="h-6 w-6 text-orange-600" />
              </div>
            </div>
            <div className="text-2xl font-bold text-orange-900 mb-2">
              ₹{stats.priceRange.min} - ₹{stats.priceRange.max}
            </div>
            <div className="flex items-center text-orange-600 text-sm">
              <IndianRupee className="h-4 w-4 mr-1" />
              Min - Max
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-6 border border-green-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-green-700 font-medium">Plan Types</h3>
              <div className="p-2 bg-green-500/20 rounded-lg">
                <Settings className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <div className="text-4xl font-bold text-green-900 mb-2">4</div>
            <div className="flex items-center text-green-600 text-sm">
              <Target className="h-4 w-4 mr-1" />
              EP, CP, MAP, AP
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="mx-6">
          <Tabs defaultValue="calendar" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="calendar">Pricing Calendar</TabsTrigger>
              <TabsTrigger value="plans">Plan Management</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
            </TabsList>

            {/* Calendar Tab */}
            <TabsContent value="calendar" className="space-y-6">
              {/* Plan and Occupancy Selection */}
              <Card>
                <CardHeader>
                  <CardTitle>Select Plan & Occupancy</CardTitle>
                  <CardDescription>
                    Choose the plan type and occupancy to view pricing for
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Plan Selection */}
                  <div>
                    <h4 className="font-medium mb-3">Plan Type</h4>
                    <PlanSelector
                      plans={defaultPlans}
                      selectedPlan={selectedPlan}
                      onPlanSelect={setSelectedPlan}
                    />
                  </div>

                  {/* Occupancy Selection */}
                  <div>
                    <h4 className="font-medium mb-3">Occupancy Type</h4>
                    <OccupancySelector
                      occupancies={defaultOccupancies}
                      selectedOccupancy={selectedOccupancy}
                      onOccupancySelect={setSelectedOccupancy}
                    />
                  </div>

                  {/* Room Category Selection */}
                  {roomTypes.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-3">Room Category</h4>
                      <div className="flex flex-wrap gap-2">
                        {roomTypes.map((room) => (
                          <Button
                            key={room.id}
                            variant={selectedRoomCategory === room.name ? "default" : "outline"}
                            onClick={() => setSelectedRoomCategory(room.name)}
                            className="flex items-center space-x-2"
                          >
                            <Hotel className="h-4 w-4" />
                            <span>{room.name}</span>
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Pricing Calendar */}
              {selectedRoomCategory && (
                <EnhancedPricingCalendar
                  propertyId={propertyId}
                  roomCategory={selectedRoomCategory}
                  selectedPlan={selectedPlan}
                  selectedOccupancy={selectedOccupancy}
                  mode="range"
                />
              )}
            </TabsContent>

            {/* Plans Tab */}
            <TabsContent value="plans" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Plan Type Definitions</CardTitle>
                  <CardDescription>
                    Industry standard plan types with their inclusions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {defaultPlans.map((plan) => (
                      <div key={plan.code} className="p-4 border rounded-lg">
                        <div className="flex items-center space-x-2 mb-3">
                          <Badge variant="outline">{plan.code}</Badge>
                          <h4 className="font-semibold">{plan.name}</h4>
                        </div>
                        <p className="text-sm text-gray-600 mb-3">{plan.description}</p>
                        <div className="space-y-1">
                          <h5 className="text-sm font-medium">Inclusions:</h5>
                          {plan.inclusions.map((inclusion, index) => (
                            <div key={index} className="text-sm text-gray-600 flex items-center space-x-2">
                              <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                              <span>{inclusion}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Analytics Tab */}
            <TabsContent value="analytics" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Pricing Analytics</CardTitle>
                  <CardDescription>
                    Analysis and insights from your pricing data
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12">
                    <TrendingUp className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-600 mb-2">Analytics Coming Soon</h3>
                    <p className="text-gray-500">
                      Advanced pricing analytics and insights will be available here
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Excel Import Dialog */}
      <ExcelImportDialog
        isOpen={showImportDialog}
        onClose={() => setShowImportDialog(false)}
        propertyId={propertyId}
        onImportComplete={handleImportComplete}
      />
    </div>
  )
}