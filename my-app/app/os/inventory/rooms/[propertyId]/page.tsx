"use client"

import React, { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { useToast } from "@/hooks/use-toast"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
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
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Separator } from "@/components/ui/separator"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Link from "next/link"
import {
  Plus,
  Search,
  Filter,
  MoreVertical,
  Bed,
  Wifi,
  Tv,
  Coffee,
  Snowflake,
  Droplets,
  RefreshCw,
  Users,
  Calendar,
  Settings,
  IndianRupee,
  TrendingUp,
  Activity,
  CheckCircle2,
  AlertTriangle,
  Wrench,
  Download,
  Upload,
  X,
  CheckSquare,
  Square,
  Zap,
  ArrowLeft,
  Eye,
  Edit,
  Trash2,
  Hotel,
  Star,
  Clock,
  Target,
  BarChart3,
  Building,
} from "lucide-react"

// Room status type definitions
type RoomStatus =
  | "available"
  | "occupied"
  | "maintenance"
  | "cleaning"
  | "out-of-order"
type HousekeepingStatus = "clean" | "dirty" | "inspected" | "out-of-order"

interface Room {
  id: string
  number: string
  floor: number
  type: {
    id: string
    name: string
    basePrice: number
  }
  status: RoomStatus
  housekeepingStatus: HousekeepingStatus
  amenities: string[]
  currentBooking?: {
    id: string
    guestName: string
    checkIn: string
    checkOut: string
    totalAmount: number
  }
  lastCleaned?: string
  notes?: string
  images?: string[]
}

interface Stats {
  totalRooms: number
  availableRooms: number
  occupiedRooms: number
  maintenanceRooms: number
  cleaningRooms: number
  outOfOrderRooms: number
  occupancyRate: number
  revenue: {
    today: number
    thisMonth: number
  }
  housekeeping: {
    clean: number
    dirty: number
    inspected: number
    outOfOrder: number
  }
}

export default function RoomManagement() {
  const router = useRouter()
  const params = useParams()
  const { data: session } = useSession()
  const { toast } = useToast()

  const [rooms, setRooms] = useState<Room[]>([])
  const [filteredRooms, setFilteredRooms] = useState<Room[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [floorFilter, setFloorFilter] = useState("all")
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null)
  const [bulkMode, setBulkMode] = useState(false)
  const [selectedRooms, setSelectedRooms] = useState<Set<string>>(new Set())
  const [isConnected, setIsConnected] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())
  const [currentTime, setCurrentTime] = useState<Date>(new Date())
  const [showAddRoomDialog, setShowAddRoomDialog] = useState(false)
  const [newRoom, setNewRoom] = useState({
    number: "",
    floor: 1,
    typeId: "",
    amenities: [] as string[],
    notes: "",
  })

  // Get propertyId from URL params only (canonical)
  const propertyId = params?.propertyId as string

  // Generate stats from real room data
  const generateStats = (rooms: Room[]): Stats => {
    const totalRooms = rooms.length
    const availableRooms = rooms.filter((r) => r.status === "available").length
    const occupiedRooms = rooms.filter((r) => r.status === "occupied").length
    const maintenanceRooms = rooms.filter(
      (r) => r.status === "maintenance"
    ).length
    const cleaningRooms = rooms.filter((r) => r.status === "cleaning").length
    const outOfOrderRooms = rooms.filter(
      (r) => r.status === "out-of-order"
    ).length
    const occupancyRate =
      totalRooms > 0 ? (occupiedRooms / totalRooms) * 100 : 0

    // Calculate revenue based on current bookings
    const todayRevenue = rooms
      .filter((r) => r.currentBooking)
      .reduce((sum, room) => sum + (room.currentBooking?.totalAmount || 0), 0)

    return {
      totalRooms,
      availableRooms,
      occupiedRooms,
      maintenanceRooms,
      cleaningRooms,
      outOfOrderRooms,
      occupancyRate,
      revenue: {
        today: todayRevenue,
        thisMonth: todayRevenue * 30, // Approximate monthly revenue
      },
      housekeeping: {
        clean: rooms.filter((r) => r.housekeepingStatus === "clean").length,
        dirty: rooms.filter((r) => r.housekeepingStatus === "dirty").length,
        inspected: rooms.filter((r) => r.housekeepingStatus === "inspected")
          .length,
        outOfOrder: rooms.filter((r) => r.housekeepingStatus === "out-of-order")
          .length,
      },
    }
  }

  const fetchRoomsData = async () => {
    try {
      setRefreshing(true)

      if (!propertyId) {
        console.log("Property ID not available, skipping fetch")
        setRooms([])
        setStats(generateStats([]))
        return
      }

      const response = await fetch(
        `/api/inventory/rooms?propertyId=${propertyId}`
      )

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || "Failed to fetch room data")
      }

      // Transform API data to match our Room interface
      const transformedRooms: Room[] =
        data.rooms?.map((room: any) => ({
          id: room._id || room.id,
          number: room.number,
          floor: room.floor,
          type: {
            id: room.roomType?._id || room.roomType?.id || "",
            name: room.roomType?.name || "Unknown Type",
            basePrice: room.roomType?.basePrice || 0,
          },
          status: room.status || "available",
          housekeepingStatus: room.housekeepingStatus || "clean",
          amenities: room.amenities || [],
          currentBooking: room.currentBooking
            ? {
                id: room.currentBooking._id || room.currentBooking.id,
                guestName: room.currentBooking.guestName,
                checkIn: room.currentBooking.checkIn,
                checkOut: room.currentBooking.checkOut,
                totalAmount: room.currentBooking.totalAmount || 0,
              }
            : undefined,
          lastCleaned: room.lastCleaned,
          notes: room.notes,
          images: room.images || [],
        })) || []

      setRooms(transformedRooms)
      setStats(generateStats(transformedRooms))
      setLastUpdated(new Date())

      toast({
        title: "Rooms Updated",
        description: `${transformedRooms.length} rooms loaded successfully`,
      })
    } catch (error) {
      console.error("Error fetching rooms:", error)
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to fetch room data",
        variant: "destructive",
      })
      // Set empty data on error
      setRooms([])
      setStats(generateStats([]))
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  // Filter rooms based on search and filters
  useEffect(() => {
    let filtered = rooms

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (room) =>
          room.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
          room.type.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          room.currentBooking?.guestName
            .toLowerCase()
            .includes(searchTerm.toLowerCase())
      )
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((room) => room.status === statusFilter)
    }

    // Floor filter
    if (floorFilter !== "all") {
      filtered = filtered.filter(
        (room) => room.floor.toString() === floorFilter
      )
    }

    setFilteredRooms(filtered)
  }, [rooms, searchTerm, statusFilter, floorFilter])

  // Initialize data on component mount - wait for session and propertyId
  useEffect(() => {
    if (propertyId) {
      fetchRoomsData()
    }
  }, [propertyId, session])

  // Real-time clock
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 60000)
    return () => clearInterval(timer)
  }, [])

  const getStatusColor = (status: RoomStatus) => {
    switch (status) {
      case "available":
        return "bg-green-100 text-green-800 border-green-200"
      case "occupied":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "maintenance":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "cleaning":
        return "bg-purple-100 text-purple-800 border-purple-200"
      case "out-of-order":
        return "bg-red-100 text-red-800 border-red-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getHousekeepingColor = (status: HousekeepingStatus) => {
    switch (status) {
      case "clean":
        return "text-green-600"
      case "dirty":
        return "text-red-600"
      case "inspected":
        return "text-blue-600"
      case "out-of-order":
        return "text-gray-600"
      default:
        return "text-gray-600"
    }
  }

  const formatRoomForDisplay = (room: Room) => {
    return {
      ...room,
      displayNumber: `Room ${room.number}`,
      displayFloor: `Floor ${room.floor}`,
      displayStatus:
        room.status.charAt(0).toUpperCase() +
        room.status.slice(1).replace("-", " "),
      displayHousekeeping:
        room.housekeepingStatus.charAt(0).toUpperCase() +
        room.housekeepingStatus.slice(1).replace("-", " "),
    }
  }

  // Room types - fetch from API
  const [roomTypes, setRoomTypes] = useState<
    { id: string; name: string; basePrice: number }[]
  >([])

  // Fetch room types for form
  useEffect(() => {
    const fetchRoomTypes = async () => {
      if (!propertyId) return

      try {
        const response = await fetch(
          `/api/inventory/room-types?propertyId=${propertyId}`
        )
        if (response.ok) {
          const data = await response.json()
          if (data.success && data.roomTypes) {
            const transformedTypes = data.roomTypes.map((type: any) => ({
              id: type._id || type.id,
              name: type.name,
              basePrice: type.basePrice || 0,
            }))
            setRoomTypes(transformedTypes)
          }
        }
      } catch (error) {
        console.error("Error fetching room types:", error)
      }
    }

    fetchRoomTypes()
  }, [propertyId])

  // Available amenities for form
  const availableAmenities = [
    "Wifi",
    "TV",
    "AC",
    "Mini Fridge",
    "Coffee Maker",
    "Balcony",
    "Bathtub",
    "Room Service",
    "Safe",
    "Telephone",
    "Hair Dryer",
    "Iron & Board",
    "Work Desk",
    "Sofa",
    "Ocean View",
    "City View",
  ]

  // Handle add room form submission
  const handleAddRoom = async () => {
    try {
      // Validate form
      if (!newRoom.number || !newRoom.typeId) {
        toast({
          title: "Validation Error",
          description: "Room number and type are required",
          variant: "destructive",
        })
        return
      }

      if (!propertyId) {
        toast({
          title: "Error",
          description: "Property ID is required",
          variant: "destructive",
        })
        return
      }

      // Check if room number already exists
      if (rooms.find((r) => r.number === newRoom.number)) {
        toast({
          title: "Room Exists",
          description: "A room with this number already exists",
          variant: "destructive",
        })
        return
      }

      // Prepare room data for API
      const roomData = {
        number: newRoom.number,
        floor: newRoom.floor,
        roomTypeId: newRoom.typeId,
        amenities: newRoom.amenities,
        notes: newRoom.notes || undefined,
        status: "available",
        housekeepingStatus: "clean",
      }

      // Call API to create room
      const response = await fetch(`/api/inventory/rooms`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ...roomData, propertyId }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`)
      }

      if (!data.success) {
        throw new Error(data.error || "Failed to create room")
      }

      // Refresh rooms data
      await fetchRoomsData()

      // Reset form
      setNewRoom({
        number: "",
        floor: 1,
        typeId: "",
        amenities: [],
        notes: "",
      })
      setShowAddRoomDialog(false)

      toast({
        title: "Room Added",
        description: `Room ${newRoom.number} has been successfully added`,
      })
    } catch (error) {
      console.error("Error adding room:", error)
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to add room. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Handle amenity toggle
  const toggleAmenity = (amenity: string) => {
    setNewRoom((prev) => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter((a) => a !== amenity)
        : [...prev.amenities, amenity],
    }))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading Room Management...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Enhanced Header - Matching F&B Dashboard Style */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-2xl p-8 text-white shadow-2xl">
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
                <Bed className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold tracking-tight">
                  Room Management
                </h1>
                <div className="flex items-center space-x-4 mt-2">
                  <div className="flex items-center space-x-1">
                    <Hotel className="h-4 w-4" />
                    <span className="text-blue-100">
                      Real-time Room Control
                    </span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Activity className="h-4 w-4" />
                    <span className="text-green-200 font-medium">
                      Live Updates
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-6 lg:mt-0 flex items-center space-x-4">
            <Button
              onClick={() => setShowAddRoomDialog(true)}
              className="bg-white/20 hover:bg-white/30 text-white border-white/30 backdrop-blur-sm"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Room
            </Button>
            <Button
              onClick={fetchRoomsData}
              disabled={refreshing}
              className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 border-0 font-semibold"
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
              Total Rooms
            </CardTitle>
            <div className="p-2 rounded-lg bg-emerald-500/20 group-hover:bg-emerald-500/30 transition-colors">
              <Hotel className="h-5 w-5 text-emerald-600" />
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-3xl font-bold text-emerald-900 mb-1">
              {stats?.totalRooms}
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
              {stats?.availableRooms}
            </div>
            <div className="space-y-2">
              <div className="w-full bg-blue-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-1000 ease-out"
                  style={{ width: `${stats?.occupancyRate}%` }}
                ></div>
              </div>
              <span className="text-xs text-blue-600">
                {stats?.occupancyRate.toFixed(1)}% occupied
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
              ₹{stats?.revenue.today.toLocaleString()}
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
              Needs Attention
            </CardTitle>
            <div className="p-2 rounded-lg bg-orange-500/20 group-hover:bg-orange-500/30 transition-colors">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-3xl font-bold text-orange-900 mb-1">
              {(stats?.maintenanceRooms || 0) + (stats?.outOfOrderRooms || 0)}
            </div>
            <div className="flex items-center space-x-1">
              <Wrench className="h-4 w-4 text-orange-600" />
              <span className="text-xs text-orange-600">
                Maintenance required
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Refined Search and Filters - OS Theme */}
      <Card className="border-0 shadow-lg bg-gradient-to-r from-white to-blue-50/30">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <Search className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-lg font-semibold text-blue-800">
                  Smart Room Finder
                </CardTitle>
                <CardDescription className="text-blue-600">
                  Advanced search and filtering system for room management
                </CardDescription>
              </div>
            </div>
            {/* Live Search Results Counter */}
            <div className="flex items-center space-x-2 bg-green-50 px-3 py-1 rounded-full border border-green-200">
              <Activity className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium text-green-700">
                {filteredRooms.length} rooms found
              </span>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-0 space-y-4">
          {/* Search Input Section */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <Input
              placeholder="Search by room number, type, guest name, or amenities..."
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

          {/* Filters Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Status Filter */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700 flex items-center">
                <CheckCircle2 className="h-4 w-4 mr-2 text-blue-600" />
                Room Status
              </Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-11 border-gray-200 focus:border-blue-500">
                  <SelectValue placeholder="Select Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 rounded-full bg-gray-400"></div>
                      <span>All Status ({rooms.length})</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="available">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 rounded-full bg-green-500"></div>
                      <span>Available ({stats?.availableRooms || 0})</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="occupied">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                      <span>Occupied ({stats?.occupiedRooms || 0})</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="maintenance">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                      <span>Maintenance ({stats?.maintenanceRooms || 0})</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="cleaning">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                      <span>Cleaning ({stats?.cleaningRooms || 0})</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="out-of-order">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 rounded-full bg-red-500"></div>
                      <span>Out of Order ({stats?.outOfOrderRooms || 0})</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Floor Filter */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700 flex items-center">
                <Building className="h-4 w-4 mr-2 text-purple-600" />
                Floor Level
              </Label>
              <Select value={floorFilter} onValueChange={setFloorFilter}>
                <SelectTrigger className="h-11 border-gray-200 focus:border-blue-500">
                  <SelectValue placeholder="Select Floor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    <div className="flex items-center space-x-2">
                      <Building className="h-4 w-4 text-gray-500" />
                      <span>All Floors</span>
                    </div>
                  </SelectItem>
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((floor) => (
                    <SelectItem key={floor} value={floor.toString()}>
                      <div className="flex items-center space-x-2">
                        <div className="w-6 h-4 bg-gradient-to-r from-indigo-400 to-purple-500 rounded text-xs text-white flex items-center justify-center font-bold">
                          {floor}
                        </div>
                        <span>
                          Floor {floor} (
                          {rooms.filter((r) => r.floor === floor).length} rooms)
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Quick Actions Row */}
          <div className="flex gap-3">
            <Button
              variant={bulkMode ? "default" : "outline"}
              onClick={() => setBulkMode(!bulkMode)}
              className={
                bulkMode
                  ? "bg-blue-600 hover:bg-blue-700 text-white"
                  : "border-gray-200 hover:border-blue-300 hover:bg-blue-50 text-gray-700"
              }
            >
              <CheckSquare className="h-4 w-4 mr-2" />
              {bulkMode ? "Exit Bulk Mode" : "Bulk Actions"}
            </Button>

            <Button
              variant="outline"
              onClick={() => {
                setSearchTerm("")
                setStatusFilter("all")
                setFloorFilter("all")
                setBulkMode(false)
              }}
              className="border-gray-200 hover:border-gray-400 hover:bg-gray-50 text-gray-700"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Clear All
            </Button>
          </div>

          {/* Active Filters Display */}
          {(searchTerm || statusFilter !== "all" || floorFilter !== "all") && (
            <div className="flex flex-wrap gap-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
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

              {floorFilter !== "all" && (
                <Badge className="bg-purple-100 text-purple-800 border-purple-300 text-xs">
                  Floor: {floorFilter}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setFloorFilter("all")}
                    className="ml-1 h-3 w-3 p-0 hover:bg-purple-200"
                  >
                    <X className="h-2 w-2" />
                  </Button>
                </Badge>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Search Summary */}
      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
        <div className="flex items-center space-x-2">
          <Target className="h-5 w-5 text-indigo-600" />
          <span className="font-semibold text-gray-700">
            Showing {filteredRooms.length} of {rooms.length} rooms
          </span>
        </div>
        <div className="text-sm text-gray-500">
          Last updated: {lastUpdated.toLocaleTimeString()}
        </div>
      </div>

      {/* Room Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredRooms.map((room) => {
          const displayRoom = formatRoomForDisplay(room)
          return (
            <Card
              key={room.id}
              className="group hover:scale-105 transition-all duration-300 hover:shadow-xl border-0 shadow-lg cursor-pointer bg-gradient-to-br from-white to-gray-50 hover:from-gray-50 hover:to-white"
            >
              <div
                className={`h-2 rounded-t-lg ${
                  room.status === "available"
                    ? "bg-gradient-to-r from-green-500 to-emerald-500"
                    : room.status === "occupied"
                    ? "bg-gradient-to-r from-blue-500 to-indigo-500"
                    : room.status === "maintenance"
                    ? "bg-gradient-to-r from-yellow-500 to-orange-500"
                    : room.status === "cleaning"
                    ? "bg-gradient-to-r from-purple-500 to-pink-500"
                    : "bg-gradient-to-r from-red-500 to-rose-500"
                }`}
              ></div>

              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-xl font-bold text-gray-900">
                      {displayRoom.displayNumber}
                    </CardTitle>
                    <CardDescription className="text-gray-600">
                      {displayRoom.type.name} • {displayRoom.displayFloor}
                    </CardDescription>
                  </div>
                  <Badge
                    className={`${getStatusColor(room.status)} font-medium`}
                  >
                    {displayRoom.displayStatus}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Current Booking */}
                {room.currentBooking && (
                  <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-center space-x-2 mb-2">
                      <Users className="h-4 w-4 text-blue-600" />
                      <span className="font-semibold text-blue-900">
                        {room.currentBooking.guestName}
                      </span>
                    </div>
                    <div className="text-sm text-blue-700">
                      <div>
                        Check-out:{" "}
                        {new Date(
                          room.currentBooking.checkOut
                        ).toLocaleDateString()}
                      </div>
                      <div className="font-semibold">
                        ₹{room.currentBooking.totalAmount.toLocaleString()}
                      </div>
                    </div>
                  </div>
                )}

                {/* Room Details */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Rate</span>
                    <span className="font-semibold">
                      ₹{room.type.basePrice}/night
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Housekeeping</span>
                    <span
                      className={`font-medium ${getHousekeepingColor(
                        room.housekeepingStatus
                      )}`}
                    >
                      {displayRoom.displayHousekeeping}
                    </span>
                  </div>
                </div>

                {/* Amenities */}
                <div className="flex flex-wrap gap-1">
                  {room.amenities.slice(0, 3).map((amenity) => (
                    <Badge
                      key={amenity}
                      variant="secondary"
                      className="text-xs bg-gray-100 text-gray-700"
                    >
                      {amenity}
                    </Badge>
                  ))}
                  {room.amenities.length > 3 && (
                    <Badge
                      variant="secondary"
                      className="text-xs bg-gray-100 text-gray-700"
                    >
                      +{room.amenities.length - 3} more
                    </Badge>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  <Button
                    size="sm"
                    className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white"
                    onClick={() => setSelectedRoom(room)}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    Details
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
      </div>

      {/* Room Details Dialog */}
      <Dialog open={!!selectedRoom} onOpenChange={() => setSelectedRoom(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          {selectedRoom && (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold">
                  Room {selectedRoom.number}
                </DialogTitle>
                <DialogDescription>
                  {selectedRoom.type.name} • Floor {selectedRoom.floor}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-semibold">Status</Label>
                    <Badge
                      className={`${getStatusColor(selectedRoom.status)} mt-1`}
                    >
                      {selectedRoom.status.replace("-", " ").toUpperCase()}
                    </Badge>
                  </div>
                  <div>
                    <Label className="text-sm font-semibold">
                      Housekeeping
                    </Label>
                    <div
                      className={`mt-1 font-medium ${getHousekeepingColor(
                        selectedRoom.housekeepingStatus
                      )}`}
                    >
                      {selectedRoom.housekeepingStatus
                        .replace("-", " ")
                        .toUpperCase()}
                    </div>
                  </div>
                </div>

                {selectedRoom.currentBooking && (
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <h4 className="font-semibold text-blue-900 mb-2">
                      Current Booking
                    </h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>Guest: {selectedRoom.currentBooking.guestName}</div>
                      <div>
                        Total: ₹
                        {selectedRoom.currentBooking.totalAmount.toLocaleString()}
                      </div>
                      <div>
                        Check-in:{" "}
                        {new Date(
                          selectedRoom.currentBooking.checkIn
                        ).toLocaleDateString()}
                      </div>
                      <div>
                        Check-out:{" "}
                        {new Date(
                          selectedRoom.currentBooking.checkOut
                        ).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                )}

                <div>
                  <Label className="text-sm font-semibold">Amenities</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {selectedRoom.amenities.map((amenity) => (
                      <Badge
                        key={amenity}
                        variant="secondary"
                        className="bg-gray-100 text-gray-700"
                      >
                        {amenity}
                      </Badge>
                    ))}
                  </div>
                </div>

                {selectedRoom.notes && (
                  <div>
                    <Label className="text-sm font-semibold">Notes</Label>
                    <p className="text-sm text-gray-600 mt-1">
                      {selectedRoom.notes}
                    </p>
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setSelectedRoom(null)}>
                  Close
                </Button>
                <Button className="bg-indigo-600 hover:bg-indigo-700 text-white">
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Room
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Modernized Add Room Dialog - Clean OS Style */}
      <Dialog open={showAddRoomDialog} onOpenChange={setShowAddRoomDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-800 -mx-6 -mt-6 px-6 pt-6 pb-8">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-xl"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full blur-lg"></div>
            <div className="relative">
              <div className="flex items-center space-x-3 mb-2">
                <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                  <Plus className="h-6 w-6 text-white" />
                </div>
                <div>
                  <DialogTitle className="text-2xl font-bold text-white">
                    Add New Room
                  </DialogTitle>
                  <DialogDescription className="text-blue-100 mt-1">
                    Create a new room with all necessary details and amenities
                  </DialogDescription>
                </div>
              </div>
            </div>
          </DialogHeader>

          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-6 bg-white/80 backdrop-blur-sm border border-blue-100 p-1 rounded-lg">
              <TabsTrigger
                value="basic"
                className="data-[state=active]:bg-blue-600 data-[state=active]:text-white flex items-center space-x-2"
              >
                <Settings className="h-4 w-4" />
                <span>Basic Info</span>
              </TabsTrigger>
              <TabsTrigger
                value="amenities"
                className="data-[state=active]:bg-blue-600 data-[state=active]:text-white flex items-center space-x-2"
              >
                <Wifi className="h-4 w-4" />
                <span>Amenities</span>
              </TabsTrigger>
              <TabsTrigger
                value="preview"
                className="data-[state=active]:bg-blue-600 data-[state=active]:text-white flex items-center space-x-2"
              >
                <Eye className="h-4 w-4" />
                <span>Preview</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="p-6 space-y-6">
              <Card>
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg font-semibold text-gray-800 flex items-center space-x-2">
                    <Settings className="h-5 w-5 text-blue-600" />
                    <span>Room Information</span>
                  </CardTitle>
                  <CardDescription>
                    Enter the basic details for the new room
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Room Number */}
                    <div className="space-y-2">
                      <Label
                        htmlFor="room-number"
                        className="text-sm font-medium text-gray-700"
                      >
                        Room Number *
                      </Label>
                      <div className="relative">
                        <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          id="room-number"
                          placeholder="Enter room number (e.g., 101, 205)"
                          value={newRoom.number}
                          onChange={(e) =>
                            setNewRoom((prev) => ({
                              ...prev,
                              number: e.target.value,
                            }))
                          }
                          className="pl-10 h-11"
                        />
                      </div>
                    </div>

                    {/* Floor */}
                    <div className="space-y-2">
                      <Label
                        htmlFor="floor"
                        className="text-sm font-medium text-gray-700"
                      >
                        Floor Level
                      </Label>
                      <Select
                        value={newRoom.floor.toString()}
                        onValueChange={(value) =>
                          setNewRoom((prev) => ({
                            ...prev,
                            floor: parseInt(value),
                          }))
                        }
                      >
                        <SelectTrigger className="h-11">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((floor) => (
                            <SelectItem key={floor} value={floor.toString()}>
                              Floor {floor}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Room Type */}
                    <div className="space-y-2 md:col-span-2">
                      <Label
                        htmlFor="room-type"
                        className="text-sm font-medium text-gray-700"
                      >
                        Room Type *
                      </Label>
                      <Select
                        value={newRoom.typeId}
                        onValueChange={(value) =>
                          setNewRoom((prev) => ({ ...prev, typeId: value }))
                        }
                      >
                        <SelectTrigger className="h-11">
                          <SelectValue placeholder="Select room type" />
                        </SelectTrigger>
                        <SelectContent>
                          {roomTypes.map((type) => (
                            <SelectItem key={type.id} value={type.id}>
                              <div className="flex items-center justify-between w-full">
                                <span>{type.name}</span>
                                <span className="ml-4 text-blue-600 font-semibold">
                                  ₹{type.basePrice}/night
                                </span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Notes */}
                    <div className="space-y-2 md:col-span-2">
                      <Label
                        htmlFor="notes"
                        className="text-sm font-medium text-gray-700"
                      >
                        Additional Notes
                      </Label>
                      <Input
                        id="notes"
                        placeholder="Any special notes about this room (optional)"
                        value={newRoom.notes}
                        onChange={(e) =>
                          setNewRoom((prev) => ({
                            ...prev,
                            notes: e.target.value,
                          }))
                        }
                        className="h-11"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Room Type Preview Card */}
              {newRoom.typeId && (
                <Card className="border border-blue-200 bg-blue-50/30">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-base font-semibold text-blue-800 flex items-center space-x-2">
                      <Star className="h-4 w-4 text-blue-600" />
                      <span>Selected Room Type</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {newRoom.typeId &&
                      roomTypes.find((t) => t.id === newRoom.typeId) && (
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-lg font-bold text-blue-900">
                              {
                                roomTypes.find((t) => t.id === newRoom.typeId)
                                  ?.name
                              }
                            </h3>
                            <p className="text-sm text-blue-600">
                              Base rate per night
                            </p>
                          </div>
                          <div className="text-xl font-bold text-blue-600 flex items-center">
                            <IndianRupee className="h-5 w-5 mr-1" />
                            {roomTypes
                              .find((t) => t.id === newRoom.typeId)
                              ?.basePrice.toLocaleString()}
                          </div>
                        </div>
                      )}
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="amenities" className="p-6 space-y-6">
              <Card>
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg font-semibold text-gray-800 flex items-center space-x-2">
                    <Wifi className="h-5 w-5 text-blue-600" />
                    <span>Room Amenities</span>
                  </CardTitle>
                  <CardDescription>
                    Select the amenities available in this room
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {availableAmenities.map((amenity) => (
                      <div
                        key={amenity}
                        className={`p-4 rounded-lg border cursor-pointer transition-all duration-200 hover:shadow-md ${
                          newRoom.amenities.includes(amenity)
                            ? "border-blue-500 bg-blue-50 text-blue-900"
                            : "border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50"
                        }`}
                        onClick={() => toggleAmenity(amenity)}
                      >
                        <div className="flex items-center space-x-3">
                          <div
                            className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                              newRoom.amenities.includes(amenity)
                                ? "border-blue-500 bg-blue-500"
                                : "border-gray-300"
                            }`}
                          >
                            {newRoom.amenities.includes(amenity) && (
                              <CheckCircle2 className="h-3 w-3 text-white" />
                            )}
                          </div>
                          <span className="font-medium text-sm">{amenity}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-gray-600">
                        Selected:{" "}
                        <span className="font-semibold text-blue-600">
                          {newRoom.amenities.length}
                        </span>{" "}
                        amenities
                      </p>
                      {newRoom.amenities.length > 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            setNewRoom((prev) => ({ ...prev, amenities: [] }))
                          }
                          className="text-xs text-gray-500 hover:text-gray-700"
                        >
                          Clear All
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="preview" className="p-6 space-y-6">
              <Card className="border border-green-200 bg-green-50/30">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg font-semibold text-green-800 flex items-center space-x-2">
                    <Eye className="h-5 w-5 text-green-600" />
                    <span>Room Preview</span>
                  </CardTitle>
                  <CardDescription>
                    Review the room details before adding
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="p-4 bg-white rounded-lg border border-gray-200">
                      <Label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                        Room Number
                      </Label>
                      <div className="text-lg font-bold text-gray-900 mt-1">
                        {newRoom.number || "Not specified"}
                      </div>
                    </div>
                    <div className="p-4 bg-white rounded-lg border border-gray-200">
                      <Label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                        Floor
                      </Label>
                      <div className="text-lg font-bold text-gray-900 mt-1">
                        Floor {newRoom.floor}
                      </div>
                    </div>
                    <div className="p-4 bg-white rounded-lg border border-gray-200">
                      <Label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                        Room Type
                      </Label>
                      <div className="text-lg font-bold text-gray-900 mt-1">
                        {roomTypes.find((t) => t.id === newRoom.typeId)?.name ||
                          "Not selected"}
                      </div>
                    </div>
                    <div className="p-4 bg-white rounded-lg border border-gray-200">
                      <Label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                        Base Rate
                      </Label>
                      <div className="text-lg font-bold text-green-600 mt-1 flex items-center">
                        <IndianRupee className="h-4 w-4 mr-1" />
                        {roomTypes
                          .find((t) => t.id === newRoom.typeId)
                          ?.basePrice.toLocaleString() || "0"}
                        <span className="text-sm text-gray-500 ml-1">
                          /night
                        </span>
                      </div>
                    </div>
                  </div>

                  {newRoom.amenities.length > 0 && (
                    <div className="p-4 bg-white rounded-lg border border-gray-200">
                      <Label className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3 block">
                        Selected Amenities ({newRoom.amenities.length})
                      </Label>
                      <div className="flex flex-wrap gap-2">
                        {newRoom.amenities.map((amenity) => (
                          <Badge
                            key={amenity}
                            className="bg-blue-100 text-blue-800 border-blue-200 text-xs"
                          >
                            {amenity}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {newRoom.notes && (
                    <div className="p-4 bg-white rounded-lg border border-gray-200">
                      <Label className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3 block">
                        Additional Notes
                      </Label>
                      <div className="text-gray-700 bg-gray-50 p-3 rounded-lg border border-gray-200">
                        {newRoom.notes}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <DialogFooter className="border-t bg-gradient-to-r from-gray-50 to-blue-50 -mx-6 -mb-6 px-6 pb-6 pt-4">
            <Button
              variant="outline"
              onClick={() => {
                setShowAddRoomDialog(false)
                setNewRoom({
                  number: "",
                  floor: 1,
                  typeId: "",
                  amenities: [],
                  notes: "",
                })
              }}
              className="border-gray-300 text-gray-700 hover:bg-gray-100"
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddRoom}
              disabled={!newRoom.number || !newRoom.typeId}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Room
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
