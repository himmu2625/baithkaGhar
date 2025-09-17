"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
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
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import Link from "next/link"
import {
  Hotel,
  Users,
  Bed,
  IndianRupee,
  Plus,
  Edit,
  Trash2,
  Settings,
  Eye,
  BedSingle,
  BedDouble,
  Crown,
  Star,
  ArrowLeft,
  Activity,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  Search,
  Filter,
  RefreshCw,
  Target,
  BarChart3,
  Maximize,
  Coffee,
  Wifi,
  Tv,
  Snowflake,
  X,
} from "lucide-react"

interface RoomType {
  id: string
  name: string
  shortCode: string
  description: string
  capacity: {
    adults: number
    children: number
    extraBeds: number
  }
  basePrice: number
  amenities: string[]
  roomCount: number
  availableRooms: number
  images: string[]
  isActive: boolean
  features: string[]
  size: number // square feet
  bedConfiguration: string
  viewType?: string
  occupancyRate: number
  revenue: {
    daily: number
    monthly: number
  }
}

// Removed mock data - now fetching from real database

export default function RoomTypesManagement() {
  const router = useRouter()
  const { data: session } = useSession()
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([])
  const [filteredRoomTypes, setFilteredRoomTypes] = useState<RoomType[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [priceFilter, setPriceFilter] = useState("all")
  const [selectedRoomType, setSelectedRoomType] = useState<RoomType | null>(
    null
  )
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    shortCode: "",
    description: "",
    capacity: {
      adults: 2,
      children: 0,
      extraBeds: 0,
    },
    basePrice: 0,
    amenities: [],
    features: [],
    size: 0,
    bedConfiguration: "",
    viewType: "",
    isActive: true,
  })

  const params = useParams()
  const propertyId = params?.propertyId as string

  useEffect(() => {
    fetchRoomTypesData()
  }, [])

  useEffect(() => {
    let filtered = roomTypes

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (type) =>
          type.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          type.shortCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
          type.description.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((type) =>
        statusFilter === "active" ? type.isActive : !type.isActive
      )
    }

    // Price filter
    if (priceFilter !== "all") {
      filtered = filtered.filter((type) => {
        if (priceFilter === "budget") return type.basePrice < 2500
        if (priceFilter === "mid-range")
          return type.basePrice >= 2500 && type.basePrice < 5000
        if (priceFilter === "premium") return type.basePrice >= 5000
        return true
      })
    }

    setFilteredRoomTypes(filtered)
  }, [roomTypes, searchTerm, statusFilter, priceFilter])

  const fetchRoomTypesData = async () => {
    try {
      setRefreshing(true)

      if (propertyId) {
        const response = await fetch(
          `/api/inventory/room-types?propertyId=${propertyId}`
        )
        if (response.ok) {
          const data = await response.json()
          // Map API response to frontend interface
          const mappedRoomTypes = (data.roomTypes || []).map((rt: any) => ({
            id: rt.id,
            name: rt.name,
            shortCode: rt.unitTypeCode || rt.name?.substring(0, 3)?.toUpperCase() || 'N/A',
            description: rt.description || '',
            capacity: {
              adults: rt.maxOccupancy || 2,
              children: Math.floor((rt.maxOccupancy || 2) / 2),
              extraBeds: 1
            },
            basePrice: rt.basePrice || 0,
            amenities: rt.amenities || [],
            roomCount: rt.count || 0,
            availableRooms: rt.count || 0, // TODO: Calculate real availability from bookings
            images: [],
            isActive: rt.isActive !== false,
            features: rt.amenities || [],
            size: 300, // TODO: Get from database
            bedConfiguration: '1 Queen Bed', // TODO: Get from database
            viewType: 'City View', // TODO: Get from database
            occupancyRate: 70, // TODO: Calculate from bookings
            revenue: { daily: 0, monthly: 0 } // TODO: Calculate from bookings
          }));
          setRoomTypes(mappedRoomTypes)
        } else {
          console.error('Failed to fetch room types:', response.statusText)
          setRoomTypes([])
        }
      } else {
        console.error('Property ID not available')
        setRoomTypes([])
      }
    } catch (error) {
      console.error('Error fetching room types:', error)
      setRoomTypes([])
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const resetForm = () => {
    setFormData({
      name: "",
      shortCode: "",
      description: "",
      capacity: {
        adults: 2,
        children: 0,
        extraBeds: 0,
      },
      basePrice: 0,
      amenities: [],
      features: [],
      size: 0,
      bedConfiguration: "",
      viewType: "",
      isActive: true,
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!propertyId) return

    setIsSubmitting(true)
    try {
      const response = await fetch(
        `/api/os/properties/${propertyId}/room-types`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        }
      )

      if (response.ok) {
        const data = await response.json()
        setRoomTypes((prev) => [...prev, data.roomType])
        setShowAddDialog(false)
        resetForm()
      } else {
        const errorData = await response.json()
        console.error("Error creating room type:", errorData.error)
        // You can add proper error handling here
      }
    } catch (error) {
      console.error("Error creating room type:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleInputChange = (field: string, value: any) => {
    if (field.startsWith("capacity.")) {
      const capacityField = field.split(".")[1]
      setFormData((prev) => ({
        ...prev,
        capacity: {
          ...prev.capacity,
          [capacityField]: value,
        },
      }))
    } else {
      setFormData((prev) => ({
        ...prev,
        [field]: value,
      }))
    }
  }

  const getRoomTypeIcon = (name: string) => {
    if (name.toLowerCase().includes("suite"))
      return <Crown className="h-6 w-6" />
    if (name.toLowerCase().includes("deluxe"))
      return <Star className="h-6 w-6" />
    if (name.toLowerCase().includes("economy"))
      return <BedSingle className="h-6 w-6" />
    return <Hotel className="h-6 w-6" />
  }

  const getStatusColor = (isActive: boolean) => {
    return isActive
      ? "bg-green-100 text-green-800 border-green-200"
      : "bg-gray-100 text-gray-800 border-gray-200"
  }

  const getOccupancyColor = (rate: number) => {
    if (rate >= 80) return "text-green-600"
    if (rate >= 60) return "text-yellow-600"
    return "text-red-600"
  }

  const getPriceCategory = (price: number) => {
    if (price < 2500)
      return { label: "Budget", color: "bg-blue-100 text-blue-800" }
    if (price < 5000)
      return { label: "Mid-Range", color: "bg-purple-100 text-purple-800" }
    return {
      label: "Premium",
      color:
        "bg-gold-100 text-gold-800 bg-gradient-to-r from-yellow-100 to-orange-100 text-orange-800",
    }
  }

  const totalStats = {
    totalTypes: roomTypes.length,
    activeTypes: roomTypes.filter((type) => type.isActive).length,
    totalRooms: roomTypes.reduce((sum, type) => sum + type.roomCount, 0),
    totalRevenue: roomTypes.reduce((sum, type) => sum + type.revenue.daily, 0),
    averageOccupancy:
      roomTypes.reduce((sum, type) => sum + type.occupancyRate, 0) /
        roomTypes.length || 0,
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading Room Types...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Enhanced Header - Matching F&B Dashboard Style */}
      <div className="bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 rounded-2xl p-8 text-white shadow-2xl">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  router.push(`/os/inventory/dashboard/${propertyId}`)
                }
                className="flex items-center space-x-2 text-white/80 hover:text-white hover:bg-white/20 rounded-lg"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back to Inventory</span>
              </Button>
            </div>
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                <Hotel className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold tracking-tight">
                  Room Types Management
                </h1>
                <div className="flex items-center space-x-4 mt-2">
                  <div className="flex items-center space-x-1">
                    <Star className="h-4 w-4" />
                    <span className="text-purple-100">
                      Category Configuration
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
              onClick={() => setShowAddDialog(true)}
              className="bg-white/20 hover:bg-white/30 text-white border-white/30 backdrop-blur-sm"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Room Type
            </Button>
            <Button
              onClick={fetchRoomTypesData}
              disabled={refreshing}
              className="bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 border-0 font-semibold"
            >
              <RefreshCw
                className={`w-4 h-4 mr-2 ${refreshing ? "animate-spin" : ""}`}
              />
              {refreshing ? "Refreshing..." : "Refresh Data"}
            </Button>
          </div>
        </div>
      </div>

      {/* Enhanced Metrics Cards - Matching F&B Dashboard Style */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 group bg-gradient-to-br from-emerald-50 to-emerald-100 hover:from-emerald-100 hover:to-emerald-200">
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-green-500/10"></div>
          <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-emerald-700">
              Total Types
            </CardTitle>
            <div className="p-2 rounded-lg bg-emerald-500/20 group-hover:bg-emerald-500/30 transition-colors">
              <Hotel className="h-5 w-5 text-emerald-600" />
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-3xl font-bold text-emerald-900 mb-1">
              {totalStats.totalTypes}
            </div>
            <div className="flex items-center space-x-1">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <span className="text-xs text-emerald-600">
                {totalStats.activeTypes} active
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 group bg-gradient-to-br from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-indigo-500/10"></div>
          <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-blue-700">
              Total Rooms
            </CardTitle>
            <div className="p-2 rounded-lg bg-blue-500/20 group-hover:bg-blue-500/30 transition-colors">
              <Bed className="h-5 w-5 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-3xl font-bold text-blue-900 mb-1">
              {totalStats.totalRooms}
            </div>
            <div className="flex items-center space-x-1">
              <TrendingUp className="h-4 w-4 text-blue-600" />
              <span className="text-xs text-blue-600">All categories</span>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 group bg-gradient-to-br from-purple-50 to-purple-100 hover:from-purple-100 hover:to-purple-200">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-pink-500/10"></div>
          <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-purple-700">
              Daily Revenue
            </CardTitle>
            <div className="p-2 rounded-lg bg-purple-500/20 group-hover:bg-purple-500/30 transition-colors">
              <IndianRupee className="h-5 w-5 text-purple-600" />
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-3xl font-bold text-purple-900 mb-1">
              ₹{totalStats.totalRevenue.toLocaleString()}
            </div>
            <div className="flex items-center space-x-1">
              <TrendingUp className="h-4 w-4 text-purple-600" />
              <span className="text-xs text-purple-600">from all types</span>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 group bg-gradient-to-br from-orange-50 to-orange-100 hover:from-orange-100 hover:to-orange-200">
          <div className="absolute inset-0 bg-gradient-to-r from-orange-500/10 to-red-500/10"></div>
          <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-orange-700">
              Avg Occupancy
            </CardTitle>
            <div className="p-2 rounded-lg bg-orange-500/20 group-hover:bg-orange-500/30 transition-colors">
              <BarChart3 className="h-5 w-5 text-orange-600" />
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-3xl font-bold text-orange-900 mb-1">
              {totalStats.averageOccupancy.toFixed(1)}%
            </div>
            <div className="space-y-2">
              <div className="w-full bg-orange-200 rounded-full h-2">
                <div
                  className="bg-orange-600 h-2 rounded-full transition-all duration-1000 ease-out"
                  style={{ width: `${totalStats.averageOccupancy}%` }}
                ></div>
              </div>
              <span className="text-xs text-orange-600">across all types</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Refined Search and Filters - OS Theme */}
      <Card className="border-0 shadow-lg bg-gradient-to-r from-white to-blue-50/30">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold text-blue-800 flex items-center space-x-2">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <Search className="h-5 w-5 text-blue-600" />
            </div>
            <span>Find Room Types</span>
          </CardTitle>
          <CardDescription className="text-blue-600">
            Search and filter room categories by various criteria
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-gray-400" />
                </div>
                <Input
                  placeholder="Search by name, code, or description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="h-11 pl-10 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                />
                {searchTerm && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSearchTerm("")}
                    className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </div>
            <div className="flex gap-3">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-11 w-36 border-gray-200 focus:border-blue-500">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 rounded-full bg-gray-400"></div>
                      <span>All Status</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="active">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 rounded-full bg-green-500"></div>
                      <span>Active</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="inactive">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 rounded-full bg-gray-400"></div>
                      <span>Inactive</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>

              <Select value={priceFilter} onValueChange={setPriceFilter}>
                <SelectTrigger className="h-11 w-36 border-gray-200 focus:border-blue-500">
                  <SelectValue placeholder="Price Range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 rounded-full bg-gray-400"></div>
                      <span>All Prices</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="budget">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                      <span>Budget (₹0-2,500)</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="mid-range">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                      <span>Mid-Range (₹2,500-5,000)</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="premium">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                      <span>Premium (₹5,000+)</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Active Filters Display */}
          {(searchTerm || statusFilter !== "all" || priceFilter !== "all") && (
            <div className="flex flex-wrap gap-2 p-3 bg-blue-50 rounded-lg border border-blue-200 mt-4">
              <span className="text-sm font-medium text-blue-700">
                Active Filters:
              </span>

              {searchTerm && (
                <Badge className="bg-blue-100 text-blue-800 border-blue-300 text-xs">
                  Search: "{searchTerm}"
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSearchTerm("")}
                    className="ml-1 h-3 w-3 p-0 hover:bg-blue-200"
                  >
                    <X className="h-2 w-2" />
                  </Button>
                </Badge>
              )}

              {statusFilter !== "all" && (
                <Badge className="bg-green-100 text-green-800 border-green-300 text-xs">
                  Status:{" "}
                  {statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setStatusFilter("all")}
                    className="ml-1 h-3 w-3 p-0 hover:bg-green-200"
                  >
                    <X className="h-2 w-2" />
                  </Button>
                </Badge>
              )}

              {priceFilter !== "all" && (
                <Badge className="bg-purple-100 text-purple-800 border-purple-300 text-xs">
                  Price:{" "}
                  {priceFilter.charAt(0).toUpperCase() +
                    priceFilter.slice(1).replace("-", " ")}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setPriceFilter("all")}
                    className="ml-1 h-3 w-3 p-0 hover:bg-purple-200"
                  >
                    <X className="h-2 w-2" />
                  </Button>
                </Badge>
              )}

              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchTerm("")
                  setStatusFilter("all")
                  setPriceFilter("all")
                }}
                className="ml-2 text-blue-600 hover:text-blue-800 hover:bg-blue-100 text-xs h-6"
              >
                <Filter className="h-3 w-3 mr-1" />
                Clear All
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Room Types Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredRoomTypes.map((roomType) => {
          const priceCategory = getPriceCategory(roomType.basePrice)
          return (
            <Card
              key={roomType.id}
              className="group hover:scale-105 transition-all duration-300 hover:shadow-xl border-0 shadow-lg cursor-pointer bg-gradient-to-br from-white to-gray-50 hover:from-gray-50 hover:to-white"
            >
              <div
                className={`h-2 rounded-t-lg ${
                  roomType.name.includes("Suite")
                    ? "bg-gradient-to-r from-yellow-500 to-orange-500"
                    : roomType.name.includes("Deluxe")
                    ? "bg-gradient-to-r from-purple-500 to-pink-500"
                    : roomType.name.includes("Economy")
                    ? "bg-gradient-to-r from-blue-500 to-indigo-500"
                    : "bg-gradient-to-r from-green-500 to-emerald-500"
                }`}
              ></div>

              {/* Header */}
              <div className="bg-gradient-to-r from-gray-50/60 via-indigo-50/60 to-purple-50/60 border-b border-gray-200/50 backdrop-blur-sm p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-3 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 rounded-xl shadow-lg">
                      {getRoomTypeIcon(roomType.name)}
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">
                        {roomType.name}
                      </h3>
                      <p className="text-sm text-gray-700 font-medium">
                        Code: {roomType.shortCode}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div
                      className={`w-3 h-3 rounded-full ${
                        roomType.isActive ? "bg-green-500" : "bg-gray-400"
                      } animate-pulse`}
                    ></div>
                    <Badge
                      className={`${getStatusColor(
                        roomType.isActive
                      )} border-0`}
                    >
                      {roomType.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </div>
              </div>

              <CardContent className="p-6 space-y-4">
                {/* Description */}
                <p className="text-gray-700 text-sm">{roomType.description}</p>

                {/* Key Info Grid */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="flex items-center space-x-1 text-gray-600 mb-1">
                      <Users className="h-4 w-4" />
                      <span>Capacity</span>
                    </div>
                    <div className="font-medium text-gray-800">
                      {roomType.capacity.adults}A + {roomType.capacity.children}
                      C
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center space-x-1 text-gray-600 mb-1">
                      <Maximize className="h-4 w-4" />
                      <span>Size</span>
                    </div>
                    <div className="font-medium text-gray-800">
                      {roomType.size} sq ft
                    </div>
                  </div>
                </div>

                {/* Pricing */}
                <div className="bg-gradient-to-r from-green-50/50 to-emerald-50/50 p-3 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-green-700 font-medium">
                      Base Rate
                    </span>
                    <div className="flex items-center space-x-1 text-green-800 font-bold text-lg">
                      <IndianRupee className="h-4 w-4" />
                      <span>{roomType.basePrice.toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <div className="text-xs text-green-600">per night</div>
                    <Badge
                      className={`${priceCategory.color} text-xs border-0`}
                    >
                      {priceCategory.label}
                    </Badge>
                  </div>
                </div>

                {/* Room Count & Occupancy */}
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 text-sm">Room Count</span>
                  <div className="text-right">
                    <div className="font-bold text-gray-900">
                      {roomType.availableRooms}/{roomType.roomCount}
                    </div>
                    <div className="text-xs text-gray-500">available</div>
                  </div>
                </div>

                {/* Occupancy Rate */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-600">
                      Occupancy Rate
                    </span>
                    <span
                      className={`font-bold ${getOccupancyColor(
                        roomType.occupancyRate
                      )}`}
                    >
                      {roomType.occupancyRate}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-1000 ease-out ${
                        roomType.occupancyRate >= 80
                          ? "bg-green-500"
                          : roomType.occupancyRate >= 60
                          ? "bg-yellow-500"
                          : "bg-red-500"
                      }`}
                      style={{ width: `${roomType.occupancyRate}%` }}
                    ></div>
                  </div>
                </div>

                {/* Features */}
                <div>
                  <div className="text-sm font-medium text-gray-600 mb-2">
                    Key Features
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {roomType.features.slice(0, 3).map((feature, index) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className="text-xs bg-blue-50 text-blue-700"
                      >
                        {feature}
                      </Badge>
                    ))}
                    {roomType.features.length > 3 && (
                      <Badge
                        variant="secondary"
                        className="text-xs bg-gray-50 text-gray-600"
                      >
                        +{roomType.features.length - 3} more
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Revenue */}
                <div className="bg-gradient-to-r from-purple-50/50 to-indigo-50/50 p-3 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-purple-700 font-medium text-sm">
                      Daily Revenue
                    </span>
                    <div className="flex items-center space-x-1 text-purple-800 font-bold">
                      <IndianRupee className="h-4 w-4" />
                      <span>{roomType.revenue.daily.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  <Button
                    size="sm"
                    className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white"
                    onClick={() => setSelectedRoomType(roomType)}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    View Details
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 border-gray-300 hover:bg-gray-50"
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}

        {/* Add New Room Type Card */}
        <Card
          onClick={() => setShowAddDialog(true)}
          className="group hover:scale-105 transition-all duration-300 hover:shadow-xl border-2 border-dashed border-gray-300 hover:border-indigo-400 cursor-pointer bg-gradient-to-br from-gray-50 to-white hover:from-indigo-50 hover:to-purple-50"
        >
          <CardContent className="p-6 flex flex-col items-center justify-center min-h-[400px] text-center">
            <div className="w-16 h-16 rounded-full bg-gradient-to-r from-indigo-500/20 to-purple-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
              <Plus className="h-8 w-8 text-indigo-500 group-hover:rotate-90 transition-transform duration-300" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              Add New Room Type
            </h3>
            <p className="text-gray-600 text-sm mb-4">
              Create a new room category with custom features and pricing
            </p>
            <Button className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 border-0 shadow-lg">
              Create Room Type
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Room Type Details Dialog */}
      <Dialog
        open={!!selectedRoomType}
        onOpenChange={() => setSelectedRoomType(null)}
      >
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          {selectedRoomType && (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold flex items-center">
                  {getRoomTypeIcon(selectedRoomType.name)}
                  <span className="ml-2">{selectedRoomType.name}</span>
                  <Badge
                    className={`ml-2 ${getStatusColor(
                      selectedRoomType.isActive
                    )}`}
                  >
                    {selectedRoomType.isActive ? "Active" : "Inactive"}
                  </Badge>
                </DialogTitle>
                <DialogDescription>
                  {selectedRoomType.shortCode} • {selectedRoomType.description}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6">
                {/* Basic Information */}
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm font-semibold">
                        Base Price
                      </Label>
                      <div className="flex items-center space-x-1 mt-1">
                        <IndianRupee className="h-4 w-4 text-green-600" />
                        <span className="text-lg font-bold text-green-800">
                          {selectedRoomType.basePrice.toLocaleString()}
                        </span>
                        <span className="text-sm text-gray-600">per night</span>
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm font-semibold">Room Size</Label>
                      <div className="mt-1 font-medium">
                        {selectedRoomType.size} sq ft
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm font-semibold">
                        Bed Configuration
                      </Label>
                      <div className="mt-1 font-medium">
                        {selectedRoomType.bedConfiguration}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm font-semibold">Capacity</Label>
                      <div className="mt-1">
                        <div className="font-medium">
                          {selectedRoomType.capacity.adults} Adults,{" "}
                          {selectedRoomType.capacity.children} Children
                        </div>
                        <div className="text-sm text-gray-600">
                          Extra beds: {selectedRoomType.capacity.extraBeds}
                        </div>
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm font-semibold">View Type</Label>
                      <div className="mt-1 font-medium">
                        {selectedRoomType.viewType}
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm font-semibold">
                        Room Count
                      </Label>
                      <div className="mt-1 font-medium">
                        {selectedRoomType.roomCount} total (
                        {selectedRoomType.availableRooms} available)
                      </div>
                    </div>
                  </div>
                </div>

                {/* Performance Metrics */}
                <div className="bg-gradient-to-r from-gray-50 to-blue-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-3">
                    Performance Metrics
                  </h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center">
                      <div
                        className={`text-2xl font-bold ${getOccupancyColor(
                          selectedRoomType.occupancyRate
                        )}`}
                      >
                        {selectedRoomType.occupancyRate}%
                      </div>
                      <div className="text-xs text-gray-600">
                        Occupancy Rate
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-800">
                        ₹{selectedRoomType.revenue.daily.toLocaleString()}
                      </div>
                      <div className="text-xs text-gray-600">Daily Revenue</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-800">
                        ₹{selectedRoomType.revenue.monthly.toLocaleString()}
                      </div>
                      <div className="text-xs text-gray-600">
                        Monthly Revenue
                      </div>
                    </div>
                  </div>
                </div>

                {/* Features */}
                <div>
                  <Label className="text-sm font-semibold">Features</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {selectedRoomType.features.map((feature, index) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className="bg-blue-100 text-blue-800"
                      >
                        {feature}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Amenities */}
                <div>
                  <Label className="text-sm font-semibold">Amenities</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {selectedRoomType.amenities.map((amenity, index) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className="bg-green-100 text-green-800"
                      >
                        {amenity}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setSelectedRoomType(null)}
                >
                  Close
                </Button>
                <Button className="bg-indigo-600 hover:bg-indigo-700 text-white">
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Room Type
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Room Type Dialog */}
      <Dialog
        open={showAddDialog}
        onOpenChange={(open) => {
          if (!open) {
            resetForm()
          }
          setShowAddDialog(open)
        }}
      >
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold flex items-center">
              <Hotel className="h-6 w-6 mr-2" />
              Add New Room Type
            </DialogTitle>
            <DialogDescription>
              Create a new room category with custom features, pricing, and
              amenities
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name" className="text-sm font-semibold">
                    Room Type Name *
                  </Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="e.g., Deluxe Suite, Standard Room"
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    className="mt-1"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="shortCode" className="text-sm font-semibold">
                    Short Code *
                  </Label>
                  <Input
                    id="shortCode"
                    type="text"
                    placeholder="e.g., DLX, STD, STE"
                    value={formData.shortCode}
                    onChange={(e) =>
                      handleInputChange(
                        "shortCode",
                        e.target.value.toUpperCase()
                      )
                    }
                    className="mt-1"
                    maxLength={4}
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    3-4 character code for quick identification
                  </p>
                </div>
                <div>
                  <Label htmlFor="basePrice" className="text-sm font-semibold">
                    Base Price (₹) *
                  </Label>
                  <Input
                    id="basePrice"
                    type="number"
                    placeholder="e.g., 2500"
                    value={formData.basePrice}
                    onChange={(e) =>
                      handleInputChange(
                        "basePrice",
                        parseFloat(e.target.value) || 0
                      )
                    }
                    className="mt-1"
                    min="0"
                    step="50"
                    required
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="size" className="text-sm font-semibold">
                    Room Size (sq ft) *
                  </Label>
                  <Input
                    id="size"
                    type="number"
                    placeholder="e.g., 300"
                    value={formData.size}
                    onChange={(e) =>
                      handleInputChange("size", parseFloat(e.target.value) || 0)
                    }
                    className="mt-1"
                    min="0"
                    step="10"
                    required
                  />
                </div>
                <div>
                  <Label
                    htmlFor="bedConfiguration"
                    className="text-sm font-semibold"
                  >
                    Bed Configuration
                  </Label>
                  <Select
                    value={formData.bedConfiguration}
                    onValueChange={(value) =>
                      handleInputChange("bedConfiguration", value)
                    }
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select bed configuration" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1 Single Bed">1 Single Bed</SelectItem>
                      <SelectItem value="1 Double Bed">1 Double Bed</SelectItem>
                      <SelectItem value="1 Queen Bed">1 Queen Bed</SelectItem>
                      <SelectItem value="1 King Bed">1 King Bed</SelectItem>
                      <SelectItem value="2 Single Beds">
                        2 Single Beds
                      </SelectItem>
                      <SelectItem value="1 King Bed + Sofa Bed">
                        1 King Bed + Sofa Bed
                      </SelectItem>
                      <SelectItem value="1 Queen Bed + Sofa Bed">
                        1 Queen Bed + Sofa Bed
                      </SelectItem>
                      <SelectItem value="Custom">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="viewType" className="text-sm font-semibold">
                    View Type
                  </Label>
                  <Select
                    value={formData.viewType}
                    onValueChange={(value) =>
                      handleInputChange("viewType", value)
                    }
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select view type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="City View">City View</SelectItem>
                      <SelectItem value="Ocean View">Ocean View</SelectItem>
                      <SelectItem value="Garden View">Garden View</SelectItem>
                      <SelectItem value="Mountain View">
                        Mountain View
                      </SelectItem>
                      <SelectItem value="Pool View">Pool View</SelectItem>
                      <SelectItem value="Inner Courtyard">
                        Inner Courtyard
                      </SelectItem>
                      <SelectItem value="Street View">Street View</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Description */}
            <div>
              <Label htmlFor="description" className="text-sm font-semibold">
                Description *
              </Label>
              <Textarea
                id="description"
                placeholder="Describe the room type, its features, and what makes it special..."
                value={formData.description}
                onChange={(e) =>
                  handleInputChange("description", e.target.value)
                }
                className="mt-1 min-h-[100px]"
                required
              />
            </div>

            {/* Capacity */}
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h4 className="font-semibold text-blue-900 mb-3 flex items-center">
                <Users className="h-5 w-5 mr-2" />
                Room Capacity
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="adults" className="text-sm font-semibold">
                    Adults *
                  </Label>
                  <Input
                    id="adults"
                    type="number"
                    placeholder="2"
                    value={formData.capacity.adults}
                    onChange={(e) =>
                      handleInputChange(
                        "capacity.adults",
                        parseInt(e.target.value) || 0
                      )
                    }
                    className="mt-1 bg-white"
                    min="1"
                    max="10"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="children" className="text-sm font-semibold">
                    Children
                  </Label>
                  <Input
                    id="children"
                    type="number"
                    placeholder="0"
                    value={formData.capacity.children}
                    onChange={(e) =>
                      handleInputChange(
                        "capacity.children",
                        parseInt(e.target.value) || 0
                      )
                    }
                    className="mt-1 bg-white"
                    min="0"
                    max="5"
                  />
                </div>
                <div>
                  <Label htmlFor="extraBeds" className="text-sm font-semibold">
                    Extra Beds
                  </Label>
                  <Input
                    id="extraBeds"
                    type="number"
                    placeholder="0"
                    value={formData.capacity.extraBeds}
                    onChange={(e) =>
                      handleInputChange(
                        "capacity.extraBeds",
                        parseInt(e.target.value) || 0
                      )
                    }
                    className="mt-1 bg-white"
                    min="0"
                    max="3"
                  />
                </div>
              </div>
            </div>

            {/* Amenities */}
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <h4 className="font-semibold text-green-900 mb-3 flex items-center">
                <Coffee className="h-5 w-5 mr-2" />
                Amenities
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {[
                  "WiFi",
                  "Smart TV",
                  "AC",
                  "Mini Bar",
                  "Coffee Maker",
                  "Room Service",
                  "Mini Fridge",
                  "Safe",
                  "Hair Dryer",
                  "Iron & Ironing Board",
                  "Telephone",
                  "Balcony",
                  "Bathtub",
                  "Shower",
                  "Work Desk",
                ].map((amenity) => (
                  <div key={amenity} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={`amenity-${amenity}`}
                      checked={formData.amenities.includes(amenity)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          handleInputChange("amenities", [
                            ...formData.amenities,
                            amenity,
                          ])
                        } else {
                          handleInputChange(
                            "amenities",
                            formData.amenities.filter(
                              (a: string) => a !== amenity
                            )
                          )
                        }
                      }}
                      className="rounded border-gray-300 focus:ring-green-500"
                    />
                    <label
                      htmlFor={`amenity-${amenity}`}
                      className="text-sm text-green-800"
                    >
                      {amenity}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Features */}
            <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
              <h4 className="font-semibold text-purple-900 mb-3 flex items-center">
                <Star className="h-5 w-5 mr-2" />
                Special Features
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {[
                  "Premium Bathroom",
                  "Separate Living Room",
                  "Kitchen",
                  "Terrace",
                  "Garden Access",
                  "Jacuzzi",
                  "Fireplace",
                  "Private Pool",
                  "Concierge Service",
                  "Butler Service",
                  "Late Checkout",
                  "Early Checkin",
                  "Complimentary Breakfast",
                ].map((feature) => (
                  <div key={feature} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={`feature-${feature}`}
                      checked={formData.features.includes(feature)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          handleInputChange("features", [
                            ...formData.features,
                            feature,
                          ])
                        } else {
                          handleInputChange(
                            "features",
                            formData.features.filter(
                              (f: string) => f !== feature
                            )
                          )
                        }
                      }}
                      className="rounded border-gray-300 focus:ring-purple-500"
                    />
                    <label
                      htmlFor={`feature-${feature}`}
                      className="text-sm text-purple-800"
                    >
                      {feature}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Status Toggle */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div>
                <h4 className="font-semibold text-gray-900">
                  Room Type Status
                </h4>
                <p className="text-sm text-gray-600">
                  Set whether this room type is active and available for booking
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) =>
                    handleInputChange("isActive", e.target.checked)
                  }
                  className="rounded border-gray-300 focus:ring-blue-500"
                />
                <label htmlFor="isActive" className="text-sm font-medium">
                  {formData.isActive ? "Active" : "Inactive"}
                </label>
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowAddDialog(false)
                  resetForm()
                }}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Room Type
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
