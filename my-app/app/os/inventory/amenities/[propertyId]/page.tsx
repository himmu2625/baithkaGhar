"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { useRouter, useParams } from "next/navigation"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { ListPageSkeleton } from "@/components/ui/loading-skeleton"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
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
import {
  Wifi,
  Tv,
  Car,
  Coffee,
  Utensils,
  Dumbbell,
  Waves,
  Leaf,
  Shield,
  Snowflake,
  Bath,
  Phone,
  Plus,
  Edit,
  Trash2,
  Settings,
  CheckCircle2,
  XCircle,
  Star,
  Users,
  Building,
  Bed,
  ArrowLeft,
  Activity,
  BarChart3,
  TrendingUp,
  Target,
  Filter,
  RefreshCw,
  Clock,
  MapPin,
  Tags,
  Image,
  DollarSign,
  Calendar,
  Heart,
  Award,
  Zap,
  Sparkles,
  Home,
  X,
} from "lucide-react"

interface Amenity {
  id: string
  name: string
  category: "room" | "property" | "service" | "location" | "policy"
  description: string
  icon: string
  isActive: boolean
  isPremium: boolean
  cost?: number // additional cost if premium
  roomsWithAmenity: number
  totalRooms: number
  popularityScore: number // 1-100
  maintenanceCost: number // monthly
  lastUpdated: string
}

// Removed mock data - now fetching from real API

const getAmenityIcon = (iconName: string) => {
  const icons = {
    wifi: <Wifi className="h-5 w-5" />,
    tv: <Tv className="h-5 w-5" />,
    car: <Car className="h-5 w-5" />,
    coffee: <Coffee className="h-5 w-5" />,
    utensils: <Utensils className="h-5 w-5" />,
    dumbbell: <Dumbbell className="h-5 w-5" />,
    waves: <Waves className="h-5 w-5" />,
    snowflake: <Snowflake className="h-5 w-5" />,
    users: <Users className="h-5 w-5" />,
    building: <Building className="h-5 w-5" />,
  }
  return icons[iconName as keyof typeof icons] || <Leaf className="h-5 w-5" />
}

const getCategoryColor = (category: string) => {
  const colors = {
    room: "blue",
    property: "green",
    service: "purple",
    location: "orange",
    policy: "gray",
  }
  return colors[category as keyof typeof colors] || "gray"
}

const getCategoryGradient = (category: string) => {
  const gradients = {
    room: "from-blue-50/30 via-indigo-50/20 to-purple-50/30",
    property: "from-green-50/30 via-emerald-50/20 to-teal-50/30",
    service: "from-purple-50/30 via-pink-50/20 to-rose-50/30",
    location: "from-orange-50/30 via-amber-50/20 to-yellow-50/30",
    policy: "from-gray-50/30 via-slate-50/20 to-zinc-50/30",
  }
  return (
    gradients[category as keyof typeof gradients] ||
    "from-gray-50/30 via-slate-50/20 to-zinc-50/30"
  )
}

export default function AmenitiesManagement() {
  const router = useRouter()
  const { data: session } = useSession()
  const [amenities, setAmenities] = useState<Amenity[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [editingAmenity, setEditingAmenity] = useState<Amenity | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Amenity Form State
  const [formData, setFormData] = useState({
    name: "",
    category: "room",
    description: "",
    icon: "wifi",
    isActive: true,
    isPremium: false,

    // Premium amenity details
    cost: 0,

    // Room availability
    availableInRoomTypes: [],
    isAvailableInAllRooms: true,

    // Operational details
    maintenanceCost: 0,
    maintenanceFrequency: "monthly",

    // Guest experience
    popularityScore: 50,
    guestRating: 4.0,
    isHighlight: false,

    // Booking and availability
    requiresAdvanceBooking: false,
    advanceBookingHours: 0,
    hasLimitedAvailability: false,
    maxDailyUsers: null,

    // Operating hours
    operatingHours: {
      isAlwaysAvailable: true,
      startTime: "00:00",
      endTime: "23:59",
      days: [
        "monday",
        "tuesday",
        "wednesday",
        "thursday",
        "friday",
        "saturday",
        "sunday",
      ],
    },

    // Additional information
    instructions: "",
    contactInfo: "",
    location: "",

    // Tags and categories
    tags: [],
    subcategory: "",

    // Images
    images: [],
  })

  const propertyId = useParams()?.propertyId as string

  useEffect(() => {
    if (propertyId) {
      fetchAmenities()
    }
  }, [propertyId])

  const fetchAmenities = useCallback(async () => {
    try {
      setLoading(true)

      if (!propertyId) {
        setAmenities([])
        return
      }

      const response = await fetch(`/api/inventory/amenities?propertyId=${propertyId}`)

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || "Failed to fetch amenities")
      }

      // Transform API data to match Amenity interface
      const transformedAmenities: Amenity[] =
        data.data?.map((amenity: any) => ({
          id: amenity._id || amenity.id,
          name: amenity.name,
          category: amenity.category || "room",
          description: amenity.description || "",
          icon: amenity.icon || "wifi",
          isActive: amenity.isActive !== false,
          isPremium: amenity.isPremium || false,
          cost: amenity.cost || 0,
          roomsWithAmenity: amenity.roomsWithAmenity || 0,
          totalRooms: amenity.totalRooms || 0,
          popularityScore: amenity.popularityScore || 50,
          maintenanceCost: amenity.maintenanceCost || 0,
          lastUpdated: amenity.updatedAt || new Date().toISOString(),
        })) || []

      setAmenities(transformedAmenities)
    } catch (error) {
      console.error("Error fetching amenities:", error)
      setAmenities([])
    } finally {
      setLoading(false)
    }
  }, [propertyId])

  const resetForm = () => {
    setFormData({
      name: "",
      category: "room",
      description: "",
      icon: "wifi",
      isActive: true,
      isPremium: false,
      cost: 0,
      availableInRoomTypes: [],
      isAvailableInAllRooms: true,
      maintenanceCost: 0,
      maintenanceFrequency: "monthly",
      popularityScore: 50,
      guestRating: 4.0,
      isHighlight: false,
      requiresAdvanceBooking: false,
      advanceBookingHours: 0,
      hasLimitedAvailability: false,
      maxDailyUsers: null,
      operatingHours: {
        isAlwaysAvailable: true,
        startTime: "00:00",
        endTime: "23:59",
        days: [
          "monday",
          "tuesday",
          "wednesday",
          "thursday",
          "friday",
          "saturday",
          "sunday",
        ],
      },
      instructions: "",
      contactInfo: "",
      location: "",
      tags: [],
      subcategory: "",
      images: [],
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!propertyId) return

    setIsSubmitting(true)
    try {
      const response = await fetch(
        `/api/inventory/amenities?propertyId=${propertyId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...formData,
            propertyId
          }),
        }
      )

      const data = await response.json()

      if (response.ok && data.success) {
        // Refresh the amenities list from API
        await fetchAmenities()
        setShowAddDialog(false)
        setShowEditDialog(false)
        setEditingAmenity(null)
        resetForm()
      } else {
        console.error(`Error ${editingAmenity ? 'updating' : 'creating'} amenity:`, data.error || "Unknown error")
        // Handle error display to user if needed
      }
    } catch (error) {
      console.error("Error creating amenity:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleInputChange = (field: string, value: any) => {
    if (field.startsWith("operatingHours.")) {
      const hoursField = field.split(".")[1]
      setFormData((prev) => ({
        ...prev,
        operatingHours: {
          ...prev.operatingHours,
          [hoursField]: value,
        },
      }))
    } else {
      setFormData((prev) => ({
        ...prev,
        [field]: value,
      }))
    }
  }

  const filteredAmenities = useMemo(() =>
    selectedCategory === "all"
      ? amenities
      : amenities.filter((amenity) => amenity.category === selectedCategory),
    [amenities, selectedCategory]
  )

  const toggleAmenity = (id: string) => {
    setAmenities((prev) =>
      prev.map((amenity) =>
        amenity.id === id
          ? { ...amenity, isActive: !amenity.isActive }
          : amenity
      )
    )
  }

  const handleEditAmenity = (amenity: Amenity) => {
    setEditingAmenity(amenity)
    setFormData({
      name: amenity.name,
      category: amenity.category,
      description: amenity.description,
      icon: amenity.icon,
      isActive: amenity.isActive,
      isPremium: amenity.isPremium,
      cost: amenity.cost || 0,
      availableInRoomTypes: [],
      isAvailableInAllRooms: true,
      maintenanceCost: amenity.maintenanceCost || 0,
      maintenanceFrequency: "monthly",
      popularityScore: amenity.popularityScore || 50,
      guestRating: 4.0,
      isHighlight: false,
      requiresAdvanceBooking: false,
      advanceBookingHours: 0,
      hasLimitedAvailability: false,
      maxDailyUsers: null,
      operatingHours: {
        isAlwaysAvailable: true,
        startTime: "00:00",
        endTime: "23:59",
        days: [
          "monday",
          "tuesday",
          "wednesday",
          "thursday",
          "friday",
          "saturday",
          "sunday",
        ],
      },
      instructions: "",
      contactInfo: "",
      location: "",
      tags: [],
      subcategory: "",
      images: [],
    })
    setShowEditDialog(true)
  }

  const categories = useMemo(() => [
    { id: "all", label: "All Amenities", count: amenities.length },
    {
      id: "room",
      label: "Room Features",
      count: amenities.filter((a) => a.category === "room").length,
    },
    {
      id: "property",
      label: "Property Facilities",
      count: amenities.filter((a) => a.category === "property").length,
    },
    {
      id: "service",
      label: "Guest Services",
      count: amenities.filter((a) => a.category === "service").length,
    },
    {
      id: "location",
      label: "Location Features",
      count: amenities.filter((a) => a.category === "location").length,
    },
    {
      id: "policy",
      label: "Policies & Rules",
      count: amenities.filter((a) => a.category === "policy").length,
    },
  ], [amenities])

  if (loading) {
    return <ListPageSkeleton />
  }

  return (
    <div className="space-y-8">
      {/* Enhanced Header - Matching F&B Dashboard Style */}
      <div className="bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 rounded-2xl p-8 text-white shadow-2xl">
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
                <Wifi className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold tracking-tight">
                  Amenities Management
                </h1>
                <div className="flex items-center space-x-4 mt-2">
                  <div className="flex items-center space-x-1">
                    <Star className="h-4 w-4" />
                    <span className="text-cyan-100">
                      Property Features & Services
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
              onClick={() => router.push(`/os/inventory/analytics/${propertyId}`)}
              className="bg-white/20 hover:bg-white/30 text-white border-white/30 backdrop-blur-sm"
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              Analytics
            </Button>
            <Button
              onClick={() => setShowAddDialog(true)}
              className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 border-0 font-semibold"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Amenity
            </Button>
          </div>
        </div>
      </div>

      {/* Enhanced Category Filter */}
      <Card className="border-0 shadow-lg bg-gradient-to-r from-gray-50 to-white">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-gray-900 flex items-center">
            <Filter className="h-5 w-5 text-cyan-600 mr-2" />
            Amenity Categories
          </CardTitle>
          <CardDescription>
            Filter amenities by type and category
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            {categories.map((category) => (
              <Button
                key={category.id}
                variant={
                  selectedCategory === category.id ? "default" : "outline"
                }
                size="sm"
                onClick={() => setSelectedCategory(category.id)}
                className={
                  selectedCategory === category.id
                    ? "bg-gradient-to-r from-cyan-600 to-blue-600 text-white hover:from-cyan-700 hover:to-blue-700"
                    : "border-gray-300 hover:bg-gray-50"
                }
              >
                {category.label}
                <Badge
                  className={`ml-2 border-0 ${
                    selectedCategory === category.id
                      ? "bg-white/20 text-current"
                      : "bg-gray-100 text-gray-700"
                  }`}
                >
                  {category.count}
                </Badge>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Enhanced Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 group bg-gradient-to-br from-cyan-50 to-cyan-100 hover:from-cyan-100 hover:to-cyan-200">
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-blue-500/10"></div>
          <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-cyan-700">
              Total Amenities
            </CardTitle>
            <div className="p-2 rounded-lg bg-cyan-500/20 group-hover:bg-cyan-500/30 transition-colors">
              <Star className="h-5 w-5 text-cyan-600" />
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-3xl font-bold text-cyan-900 mb-1">
              {amenities.length}
            </div>
            <div className="flex items-center space-x-1">
              <TrendingUp className="h-4 w-4 text-cyan-600" />
              <span className="text-xs text-cyan-600">All services</span>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 group bg-gradient-to-br from-emerald-50 to-emerald-100 hover:from-emerald-100 hover:to-emerald-200">
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-green-500/10"></div>
          <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-emerald-700">
              Active
            </CardTitle>
            <div className="p-2 rounded-lg bg-emerald-500/20 group-hover:bg-emerald-500/30 transition-colors">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-3xl font-bold text-emerald-900 mb-1">
              {amenities.filter((a) => a.isActive).length}
            </div>
            <div className="flex items-center space-x-1">
              <Activity className="h-4 w-4 text-emerald-600" />
              <span className="text-xs text-emerald-600">
                Currently available
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 group bg-gradient-to-br from-purple-50 to-purple-100 hover:from-purple-100 hover:to-purple-200">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-pink-500/10"></div>
          <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-purple-700">
              Premium
            </CardTitle>
            <div className="p-2 rounded-lg bg-purple-500/20 group-hover:bg-purple-500/30 transition-colors">
              <Star className="h-5 w-5 text-purple-600" />
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-3xl font-bold text-purple-900 mb-1">
              {amenities.filter((a) => a.isPremium).length}
            </div>
            <div className="flex items-center space-x-1">
              <Star className="h-4 w-4 text-purple-600" />
              <span className="text-xs text-purple-600">Premium services</span>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 group bg-gradient-to-br from-orange-50 to-orange-100 hover:from-orange-100 hover:to-orange-200">
          <div className="absolute inset-0 bg-gradient-to-r from-orange-500/10 to-red-500/10"></div>
          <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-orange-700">
              Monthly Cost
            </CardTitle>
            <div className="p-2 rounded-lg bg-orange-500/20 group-hover:bg-orange-500/30 transition-colors">
              <TrendingUp className="h-5 w-5 text-orange-600" />
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-3xl font-bold text-orange-900 mb-1">
              ₹
              {(
                amenities.reduce((sum, a) => sum + a.maintenanceCost, 0) / 1000
              ).toFixed(0)}
              K
            </div>
            <div className="flex items-center space-x-1">
              <Target className="h-4 w-4 text-orange-600" />
              <span className="text-xs text-orange-600">Total maintenance</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Amenities Grid */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Property Amenities
            </h2>
            <p className="text-gray-600">
              Manage all amenities and services offered to guests
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <Button className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white shadow-lg">
              <Settings className="h-4 w-4 mr-2" />
              Bulk Settings
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAmenities.map((amenity) => {
            const coverage =
              (amenity.roomsWithAmenity / amenity.totalRooms) * 100

            return (
              <Card
                key={amenity.id}
                className="group hover:scale-105 transition-all duration-300 hover:shadow-xl border-0 shadow-lg cursor-pointer bg-gradient-to-br from-white to-gray-50 hover:from-gray-50 hover:to-white overflow-hidden"
              >
                {/* Enhanced Header */}
                <div
                  className={`h-2 bg-gradient-to-r ${
                    amenity.category === "room"
                      ? "from-blue-500 to-indigo-500"
                      : amenity.category === "property"
                      ? "from-green-500 to-emerald-500"
                      : amenity.category === "service"
                      ? "from-purple-500 to-pink-500"
                      : "from-orange-500 to-yellow-500"
                  } rounded-t-lg`}
                ></div>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div
                      className={`p-3 rounded-xl bg-gradient-to-r ${
                        amenity.category === "room"
                          ? "from-blue-500/20 to-indigo-500/20"
                          : amenity.category === "property"
                          ? "from-green-500/20 to-emerald-500/20"
                          : amenity.category === "service"
                          ? "from-purple-500/20 to-pink-500/20"
                          : "from-orange-500/20 to-yellow-500/20"
                      } group-hover:bg-opacity-30 transition-all duration-300`}
                    >
                      {getAmenityIcon(amenity.icon)}
                    </div>
                    <div className="flex items-center space-x-3">
                      {amenity.isPremium && (
                        <Badge className="bg-gradient-to-r from-yellow-100 to-orange-100 text-orange-800 border-orange-200 font-medium">
                          <Star className="h-3 w-3 mr-1" />
                          Premium
                        </Badge>
                      )}
                      <div className="flex items-center space-x-2 p-2 bg-gray-50 rounded-lg border border-gray-200">
                        <span
                          className={`text-xs font-medium ${
                            amenity.isActive
                              ? "text-green-700"
                              : "text-gray-500"
                          }`}
                        >
                          {amenity.isActive ? "Active" : "Inactive"}
                        </span>
                        <Switch
                          checked={amenity.isActive}
                          onCheckedChange={() => toggleAmenity(amenity.id)}
                          className="data-[state=checked]:bg-blue-600"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <CardTitle className="text-xl font-bold text-gray-900 group-hover:text-gray-700">
                      {amenity.name}
                    </CardTitle>
                    <CardDescription className="text-gray-600 capitalize">
                      {amenity.category.replace("_", " ")} •{" "}
                      {amenity.description}
                    </CardDescription>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Enhanced Coverage */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 font-medium">
                        Room Coverage
                      </span>
                      <span className="font-bold text-gray-800">
                        {amenity.roomsWithAmenity}/{amenity.totalRooms} rooms
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-1000 ease-out ${
                          coverage >= 90
                            ? "bg-gradient-to-r from-green-500 to-emerald-500"
                            : coverage >= 70
                            ? "bg-gradient-to-r from-blue-500 to-indigo-500"
                            : coverage >= 50
                            ? "bg-gradient-to-r from-yellow-500 to-orange-500"
                            : "bg-gradient-to-r from-red-500 to-pink-500"
                        }`}
                        style={{ width: `${coverage}%` }}
                      ></div>
                    </div>
                    <div className="text-xs text-gray-500 font-medium">
                      {coverage.toFixed(0)}% coverage
                    </div>
                  </div>

                  {/* Enhanced Popularity Score */}
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 text-sm font-medium">
                      Guest Rating
                    </span>
                    <div className="flex items-center space-x-2">
                      <div className="flex items-center">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`h-4 w-4 transition-colors ${
                              i < Math.floor(amenity.popularityScore / 20)
                                ? "text-yellow-500 fill-current"
                                : "text-gray-300"
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-sm font-bold text-gray-800">
                        {amenity.popularityScore}%
                      </span>
                    </div>
                  </div>

                  {/* Enhanced Cost Information */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    {amenity.isPremium && amenity.cost && (
                      <div>
                        <div className="text-gray-600 mb-1 font-medium">
                          Premium Cost
                        </div>
                        <div className="font-bold text-green-700">
                          ₹{amenity.cost}/night
                        </div>
                      </div>
                    )}
                    <div>
                      <div className="text-gray-600 mb-1 font-medium">
                        Maintenance
                      </div>
                      <div className="font-bold text-gray-800">
                        ₹{amenity.maintenanceCost.toLocaleString()}/mo
                      </div>
                    </div>
                  </div>

                  {/* Enhanced Status */}
                  <div className="flex items-center justify-between pt-2 border-t border-gray-200/50">
                    <div className="flex items-center space-x-2">
                      {amenity.isActive ? (
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-500" />
                      )}
                      <span
                        className={`text-sm font-bold ${
                          amenity.isActive ? "text-green-700" : "text-red-700"
                        }`}
                      >
                        {amenity.isActive ? "Active" : "Inactive"}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 font-medium">
                      Updated:{" "}
                      {new Date(amenity.lastUpdated).toLocaleDateString()}
                    </div>
                  </div>

                  {/* Enhanced Actions */}
                  <div className="flex gap-2 pt-2">
                    <Button
                      size="sm"
                      onClick={() => handleEditAmenity(amenity)}
                      className={`flex-1 ${
                        amenity.category === "room"
                          ? "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                          : amenity.category === "property"
                          ? "bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                          : amenity.category === "service"
                          ? "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                          : "bg-gradient-to-r from-orange-600 to-yellow-600 hover:from-orange-700 hover:to-yellow-700"
                      } shadow-md hover:shadow-lg transition-all duration-200`}
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Edit Amenity
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-gray-300 hover:bg-gray-50 hover:shadow-md transition-all duration-200"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}

          {/* Add New Amenity Card */}
          <Card className="group hover:scale-105 transition-all duration-300 hover:shadow-xl border-2 border-dashed border-gray-300 hover:border-cyan-400 cursor-pointer bg-gradient-to-br from-gray-50 to-white hover:from-cyan-50 hover:to-blue-50">
            <CardContent className="p-6 flex flex-col items-center justify-center min-h-[320px] text-center">
              <div className="w-16 h-16 rounded-full bg-gradient-to-r from-cyan-500/20 to-blue-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                <Plus className="h-8 w-8 text-cyan-600 group-hover:rotate-90 transition-transform duration-300" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                Add New Amenity
              </h3>
              <p className="text-gray-600 text-sm mb-4">
                Create a new amenity or service offering
              </p>
              <Button
                onClick={() => setShowAddDialog(true)}
                className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Amenity
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Add/Edit Amenity Dialog */}
      <Dialog
        open={showAddDialog || showEditDialog}
        onOpenChange={(open) => {
          if (!open) {
            resetForm()
            setEditingAmenity(null)
            setShowAddDialog(false)
            setShowEditDialog(false)
          } else {
            // Opening dialog
            if (editingAmenity) {
              setShowEditDialog(true)
              setShowAddDialog(false)
            } else {
              setShowAddDialog(true)
              setShowEditDialog(false)
            }
          }
        }}
      >
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold flex items-center">
              <Sparkles className="h-6 w-6 mr-2 text-cyan-600" />
              {editingAmenity ? 'Edit Amenity' : 'Add New Amenity'}
            </DialogTitle>
            <DialogDescription>
              {editingAmenity
                ? 'Update this amenity or service for your guests'
                : 'Create a new amenity or service to enhance your guests\' experience'
              }
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <Label
                    htmlFor="amenityName"
                    className="text-sm font-semibold"
                  >
                    Amenity Name *
                  </Label>
                  <Input
                    id="amenityName"
                    type="text"
                    placeholder="e.g., WiFi, Swimming Pool, Spa"
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    className="mt-1"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="category" className="text-sm font-semibold">
                    Category *
                  </Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) =>
                      handleInputChange("category", value)
                    }
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="room">
                        <div className="flex items-center space-x-2">
                          <Home className="h-4 w-4" />
                          <span>Room Features</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="property">
                        <div className="flex items-center space-x-2">
                          <Building className="h-4 w-4" />
                          <span>Property Facilities</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="service">
                        <div className="flex items-center space-x-2">
                          <Users className="h-4 w-4" />
                          <span>Guest Services</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="location">
                        <div className="flex items-center space-x-2">
                          <Building className="h-4 w-4" />
                          <span>Location Features</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="policy">
                        <div className="flex items-center space-x-2">
                          <Building className="h-4 w-4" />
                          <span>Policies & Rules</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="icon" className="text-sm font-semibold">
                    Icon
                  </Label>
                  <Select
                    value={formData.icon}
                    onValueChange={(value) => handleInputChange("icon", value)}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="wifi">
                        <div className="flex items-center space-x-2">
                          <Wifi className="h-4 w-4" />
                          <span>WiFi</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="tv">
                        <div className="flex items-center space-x-2">
                          <Tv className="h-4 w-4" />
                          <span>TV</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="car">
                        <div className="flex items-center space-x-2">
                          <Car className="h-4 w-4" />
                          <span>Parking</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="coffee">
                        <div className="flex items-center space-x-2">
                          <Coffee className="h-4 w-4" />
                          <span>Coffee/Mini Bar</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="utensils">
                        <div className="flex items-center space-x-2">
                          <Utensils className="h-4 w-4" />
                          <span>Dining</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="dumbbell">
                        <div className="flex items-center space-x-2">
                          <Dumbbell className="h-4 w-4" />
                          <span>Fitness</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="waves">
                        <div className="flex items-center space-x-2">
                          <Waves className="h-4 w-4" />
                          <span>Swimming</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="snowflake">
                        <div className="flex items-center space-x-2">
                          <Snowflake className="h-4 w-4" />
                          <span>Air Conditioning</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="users">
                        <div className="flex items-center space-x-2">
                          <Users className="h-4 w-4" />
                          <span>Concierge</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="building">
                        <div className="flex items-center space-x-2">
                          <Building className="h-4 w-4" />
                          <span>Business Center</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <Label
                    htmlFor="description"
                    className="text-sm font-semibold"
                  >
                    Description *
                  </Label>
                  <Textarea
                    id="description"
                    placeholder="Describe the amenity and what it offers to guests..."
                    value={formData.description}
                    onChange={(e) =>
                      handleInputChange("description", e.target.value)
                    }
                    className="mt-1 min-h-[100px]"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="location" className="text-sm font-semibold">
                    Location
                  </Label>
                  <Input
                    id="location"
                    type="text"
                    placeholder="e.g., Lobby, Floor 2, Poolside"
                    value={formData.location}
                    onChange={(e) =>
                      handleInputChange("location", e.target.value)
                    }
                    className="mt-1"
                  />
                </div>
              </div>
            </div>

            {/* Premium Amenity Settings */}
            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
              <h4 className="font-semibold text-yellow-900 mb-3 flex items-center">
                <Star className="h-5 w-5 mr-2" />
                Premium Amenity Settings
              </h4>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="isPremium"
                    checked={formData.isPremium}
                    onChange={(e) =>
                      handleInputChange("isPremium", e.target.checked)
                    }
                    className="rounded border-gray-300 focus:ring-yellow-500"
                  />
                  <Label
                    htmlFor="isPremium"
                    className="text-sm font-semibold text-yellow-800"
                  >
                    This is a premium amenity (requires additional charge)
                  </Label>
                </div>

                {formData.isPremium && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="cost" className="text-sm font-semibold">
                        Premium Cost (₹ per night) *
                      </Label>
                      <Input
                        id="cost"
                        type="number"
                        placeholder="500"
                        value={formData.cost}
                        onChange={(e) =>
                          handleInputChange(
                            "cost",
                            parseFloat(e.target.value) || 0
                          )
                        }
                        className="mt-1 bg-white"
                        min="0"
                        step="50"
                        required={formData.isPremium}
                      />
                    </div>
                    <div>
                      <Label
                        htmlFor="isHighlight"
                        className="text-sm font-semibold"
                      >
                        Feature Highlight
                      </Label>
                      <div className="flex items-center space-x-2 mt-2">
                        <input
                          type="checkbox"
                          id="isHighlight"
                          checked={formData.isHighlight}
                          onChange={(e) =>
                            handleInputChange("isHighlight", e.target.checked)
                          }
                          className="rounded border-gray-300 focus:ring-yellow-500"
                        />
                        <Label
                          htmlFor="isHighlight"
                          className="text-sm text-yellow-800"
                        >
                          Highlight as featured amenity
                        </Label>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Operational Details */}
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <h4 className="font-semibold text-green-900 mb-3 flex items-center">
                <Settings className="h-5 w-5 mr-2" />
                Operational Details
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label
                    htmlFor="maintenanceCost"
                    className="text-sm font-semibold"
                  >
                    Maintenance Cost (₹/month)
                  </Label>
                  <Input
                    id="maintenanceCost"
                    type="number"
                    placeholder="5000"
                    value={formData.maintenanceCost}
                    onChange={(e) =>
                      handleInputChange(
                        "maintenanceCost",
                        parseFloat(e.target.value) || 0
                      )
                    }
                    className="mt-1 bg-white"
                    min="0"
                    step="100"
                  />
                </div>
                <div>
                  <Label
                    htmlFor="maintenanceFrequency"
                    className="text-sm font-semibold"
                  >
                    Maintenance Frequency
                  </Label>
                  <Select
                    value={formData.maintenanceFrequency}
                    onValueChange={(value) =>
                      handleInputChange("maintenanceFrequency", value)
                    }
                  >
                    <SelectTrigger className="mt-1 bg-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="quarterly">Quarterly</SelectItem>
                      <SelectItem value="yearly">Yearly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label
                    htmlFor="popularityScore"
                    className="text-sm font-semibold"
                  >
                    Expected Popularity (%)
                  </Label>
                  <Input
                    id="popularityScore"
                    type="number"
                    placeholder="75"
                    value={formData.popularityScore}
                    onChange={(e) =>
                      handleInputChange(
                        "popularityScore",
                        parseInt(e.target.value) || 0
                      )
                    }
                    className="mt-1 bg-white"
                    min="0"
                    max="100"
                  />
                </div>
              </div>
            </div>

            {/* Availability & Booking */}
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h4 className="font-semibold text-blue-900 mb-3 flex items-center">
                <Calendar className="h-5 w-5 mr-2" />
                Availability & Booking
              </h4>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="requiresAdvanceBooking"
                        checked={formData.requiresAdvanceBooking}
                        onChange={(e) =>
                          handleInputChange(
                            "requiresAdvanceBooking",
                            e.target.checked
                          )
                        }
                        className="rounded border-gray-300 focus:ring-blue-500"
                      />
                      <Label
                        htmlFor="requiresAdvanceBooking"
                        className="text-sm font-semibold text-blue-800"
                      >
                        Requires advance booking
                      </Label>
                    </div>

                    {formData.requiresAdvanceBooking && (
                      <div>
                        <Label
                          htmlFor="advanceBookingHours"
                          className="text-sm font-semibold"
                        >
                          Advance Booking Hours
                        </Label>
                        <Input
                          id="advanceBookingHours"
                          type="number"
                          placeholder="24"
                          value={formData.advanceBookingHours}
                          onChange={(e) =>
                            handleInputChange(
                              "advanceBookingHours",
                              parseInt(e.target.value) || 0
                            )
                          }
                          className="mt-1 bg-white"
                          min="1"
                          max="168"
                        />
                      </div>
                    )}
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="hasLimitedAvailability"
                        checked={formData.hasLimitedAvailability}
                        onChange={(e) =>
                          handleInputChange(
                            "hasLimitedAvailability",
                            e.target.checked
                          )
                        }
                        className="rounded border-gray-300 focus:ring-blue-500"
                      />
                      <Label
                        htmlFor="hasLimitedAvailability"
                        className="text-sm font-semibold text-blue-800"
                      >
                        Limited daily availability
                      </Label>
                    </div>

                    {formData.hasLimitedAvailability && (
                      <div>
                        <Label
                          htmlFor="maxDailyUsers"
                          className="text-sm font-semibold"
                        >
                          Max Daily Users
                        </Label>
                        <Input
                          id="maxDailyUsers"
                          type="number"
                          placeholder="20"
                          value={formData.maxDailyUsers || ""}
                          onChange={(e) =>
                            handleInputChange(
                              "maxDailyUsers",
                              parseInt(e.target.value) || null
                            )
                          }
                          className="mt-1 bg-white"
                          min="1"
                          max="500"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Operating Hours */}
            <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
              <h4 className="font-semibold text-purple-900 mb-3 flex items-center">
                <Clock className="h-5 w-5 mr-2" />
                Operating Hours
              </h4>
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="isAlwaysAvailable"
                    checked={formData.operatingHours.isAlwaysAvailable}
                    onChange={(e) =>
                      handleInputChange(
                        "operatingHours.isAlwaysAvailable",
                        e.target.checked
                      )
                    }
                    className="rounded border-gray-300 focus:ring-purple-500"
                  />
                  <Label
                    htmlFor="isAlwaysAvailable"
                    className="text-sm font-semibold text-purple-800"
                  >
                    Available 24/7
                  </Label>
                </div>

                {!formData.operatingHours.isAlwaysAvailable && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label
                        htmlFor="startTime"
                        className="text-sm font-semibold"
                      >
                        Start Time
                      </Label>
                      <Input
                        id="startTime"
                        type="time"
                        value={formData.operatingHours.startTime}
                        onChange={(e) =>
                          handleInputChange(
                            "operatingHours.startTime",
                            e.target.value
                          )
                        }
                        className="mt-1 bg-white"
                      />
                    </div>
                    <div>
                      <Label
                        htmlFor="endTime"
                        className="text-sm font-semibold"
                      >
                        End Time
                      </Label>
                      <Input
                        id="endTime"
                        type="time"
                        value={formData.operatingHours.endTime}
                        onChange={(e) =>
                          handleInputChange(
                            "operatingHours.endTime",
                            e.target.value
                          )
                        }
                        className="mt-1 bg-white"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Additional Information */}
            <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
              <h4 className="font-semibold text-orange-900 mb-3 flex items-center">
                <MapPin className="h-5 w-5 mr-2" />
                Additional Information
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label
                    htmlFor="instructions"
                    className="text-sm font-semibold"
                  >
                    Usage Instructions
                  </Label>
                  <Textarea
                    id="instructions"
                    placeholder="Instructions for guests on how to use this amenity..."
                    value={formData.instructions}
                    onChange={(e) =>
                      handleInputChange("instructions", e.target.value)
                    }
                    className="mt-1 bg-white"
                    rows={3}
                  />
                </div>
                <div>
                  <Label
                    htmlFor="contactInfo"
                    className="text-sm font-semibold"
                  >
                    Contact Information
                  </Label>
                  <Textarea
                    id="contactInfo"
                    placeholder="Contact details or booking information..."
                    value={formData.contactInfo}
                    onChange={(e) =>
                      handleInputChange("contactInfo", e.target.value)
                    }
                    className="mt-1 bg-white"
                    rows={3}
                  />
                </div>
              </div>
            </div>

            {/* Room Availability */}
            <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-200">
              <h4 className="font-semibold text-indigo-900 mb-3 flex items-center">
                <Home className="h-5 w-5 mr-2" />
                Room Availability
              </h4>
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="isAvailableInAllRooms"
                    checked={formData.isAvailableInAllRooms}
                    onChange={(e) =>
                      handleInputChange(
                        "isAvailableInAllRooms",
                        e.target.checked
                      )
                    }
                    className="rounded border-gray-300 focus:ring-indigo-500"
                  />
                  <Label
                    htmlFor="isAvailableInAllRooms"
                    className="text-sm font-semibold text-indigo-800"
                  >
                    Available in all rooms
                  </Label>
                </div>
                <p className="text-sm text-indigo-600">
                  {formData.isAvailableInAllRooms
                    ? "This amenity will be available in all room types"
                    : "You can specify specific room types later"}
                </p>
              </div>
            </div>

            {/* Status Toggle */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div>
                <h4 className="font-semibold text-gray-900">Amenity Status</h4>
                <p className="text-sm text-gray-600">
                  Set whether this amenity is active and available for guests
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
                <Label htmlFor="isActive" className="text-sm font-medium">
                  {formData.isActive ? "Active" : "Inactive"}
                </Label>
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowAddDialog(false)
                  setShowEditDialog(false)
                  setEditingAmenity(null)
                  resetForm()
                }}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    {editingAmenity ? 'Updating...' : 'Creating...'}
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    {editingAmenity ? 'Update Amenity' : 'Create Amenity'}
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
