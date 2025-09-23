"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "@/hooks/use-toast"
import {
  Building,
  Bed,
  Users,
  MapPin,
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ArrowRight,
  Star,
  Wifi,
  Car,
  Coffee,
  Tv,
  Wind,
  Bath,
  Search,
  Filter,
  RotateCcw,
  Save,
  Eye,
  Edit,
  UserCheck,
  Shield,
  Zap,
  Home
} from "lucide-react"
import { cn } from "@/lib/utils"

interface Room {
  _id: string
  roomNumber: string
  roomType: {
    _id: string
    name: string
    category: string
    basePrice: number
    maxOccupancy: number
  }
  floor: number
  status: 'available' | 'occupied' | 'maintenance' | 'cleaning' | 'out_of_order'
  amenities: string[]
  features: string[]
  lastCleaned: string
  lastMaintenance: string
  currentBooking?: {
    _id: string
    guestName: string
    checkInDate: string
    checkOutDate: string
    adults: number
    children: number
  }
}

interface Booking {
  _id: string
  guestName: string
  guestEmail: string
  checkInDate: string
  checkOutDate: string
  adults: number
  children: number
  roomType: string
  roomPreferences: string[]
  specialRequests: string
  status: 'pending' | 'confirmed' | 'cancelled'
  roomId?: string
  totalAmount: number
}

interface RoomAllocationInterfaceProps {
  propertyId: string
  onAllocationComplete?: () => void
}

export function RoomAllocationInterface({ propertyId, onAllocationComplete }: RoomAllocationInterfaceProps) {
  const [rooms, setRooms] = useState<Room[]>([])
  const [unallocatedBookings, setUnallocatedBookings] = useState<Booking[]>([])
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null)
  const [loading, setLoading] = useState(true)
  const [allocating, setAllocating] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterFloor, setFilterFloor] = useState<string>("all")
  const [filterRoomType, setFilterRoomType] = useState<string>("all")
  const [filterStatus, setFilterStatus] = useState<string>("available")
  const [sortBy, setSortBy] = useState<string>("roomNumber")

  // Fetch rooms and unallocated bookings
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        // Fetch rooms
        const roomsResponse = await fetch(`/api/os/rooms/${propertyId}`)
        if (roomsResponse.ok) {
          const roomsData = await roomsResponse.json()
          if (roomsData.success) {
            setRooms(roomsData.rooms || [])
          }
        }

        // Fetch unallocated bookings
        const bookingsResponse = await fetch(`/api/os/bookings/${propertyId}?status=confirmed&allocated=false`)
        if (bookingsResponse.ok) {
          const bookingsData = await bookingsResponse.json()
          if (bookingsData.success) {
            setUnallocatedBookings(bookingsData.bookings || [])
          }
        }
      } catch (error) {
        console.error("Error fetching data:", error)
        toast({
          title: "Data Loading Failed",
          description: "Failed to load rooms and bookings",
          variant: "destructive"
        })
      } finally {
        setLoading(false)
      }
    }

    if (propertyId) {
      fetchData()
    }
  }, [propertyId])

  const handleRoomAllocation = async (bookingId: string, roomId: string) => {
    setAllocating(true)
    try {
      const response = await fetch(`/api/os/bookings/${propertyId}/allocate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId, roomId })
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: "Room Allocated Successfully",
          description: `Room ${selectedRoom?.roomNumber} assigned to ${selectedBooking?.guestName}`,
        })

        // Refresh data
        setUnallocatedBookings(prev => prev.filter(b => b._id !== bookingId))
        setRooms(prev => prev.map(room =>
          room._id === roomId
            ? { ...room, status: 'occupied' as const, currentBooking: selectedBooking ? {
                _id: selectedBooking._id,
                guestName: selectedBooking.guestName,
                checkInDate: selectedBooking.checkInDate,
                checkOutDate: selectedBooking.checkOutDate,
                adults: selectedBooking.adults,
                children: selectedBooking.children
              } : undefined }
            : room
        ))

        setSelectedBooking(null)
        setSelectedRoom(null)

        if (onAllocationComplete) {
          onAllocationComplete()
        }
      } else {
        throw new Error(result.error || 'Failed to allocate room')
      }
    } catch (error) {
      console.error("Room allocation error:", error)
      toast({
        title: "Allocation Failed",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive"
      })
    } finally {
      setAllocating(false)
    }
  }

  const getCompatibleRooms = (booking: Booking) => {
    return rooms.filter(room => {
      const totalGuests = booking.adults + booking.children
      const matchesType = !booking.roomType || room.roomType._id === booking.roomType
      const hasCapacity = room.roomType.maxOccupancy >= totalGuests
      const isAvailable = room.status === 'available'
      const matchesPreferences = booking.roomPreferences.length === 0 ||
        booking.roomPreferences.some(pref =>
          room.features.includes(pref) || room.amenities.includes(pref)
        )

      return matchesType && hasCapacity && isAvailable && matchesPreferences
    })
  }

  const getFilteredRooms = () => {
    let filtered = rooms

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(room =>
        room.roomNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        room.roomType.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Floor filter
    if (filterFloor !== "all") {
      filtered = filtered.filter(room => room.floor.toString() === filterFloor)
    }

    // Room type filter
    if (filterRoomType !== "all") {
      filtered = filtered.filter(room => room.roomType._id === filterRoomType)
    }

    // Status filter
    if (filterStatus !== "all") {
      filtered = filtered.filter(room => room.status === filterStatus)
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'roomNumber':
          return a.roomNumber.localeCompare(b.roomNumber)
        case 'floor':
          return a.floor - b.floor
        case 'price':
          return a.roomType.basePrice - b.roomType.basePrice
        case 'capacity':
          return a.roomType.maxOccupancy - b.roomType.maxOccupancy
        default:
          return 0
      }
    })

    return filtered
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'available': return <CheckCircle2 className="h-4 w-4 text-green-600" />
      case 'occupied': return <Users className="h-4 w-4 text-blue-600" />
      case 'maintenance': return <AlertTriangle className="h-4 w-4 text-orange-600" />
      case 'cleaning': return <Zap className="h-4 w-4 text-yellow-600" />
      case 'out_of_order': return <XCircle className="h-4 w-4 text-red-600" />
      default: return <Clock className="h-4 w-4 text-gray-600" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-100 text-green-800 border-green-200'
      case 'occupied': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'maintenance': return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'cleaning': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'out_of_order': return 'bg-red-100 text-red-800 border-red-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getAmenityIcon = (amenity: string) => {
    switch (amenity.toLowerCase()) {
      case 'wifi': return <Wifi className="h-3 w-3" />
      case 'tv': return <Tv className="h-3 w-3" />
      case 'ac': case 'air conditioning': return <Wind className="h-3 w-3" />
      case 'parking': return <Car className="h-3 w-3" />
      case 'coffee': return <Coffee className="h-3 w-3" />
      case 'bathtub': return <Bath className="h-3 w-3" />
      default: return <Star className="h-3 w-3" />
    }
  }

  const uniqueFloors = Array.from(new Set(rooms.map(room => room.floor))).sort((a, b) => a - b)
  const uniqueRoomTypes = Array.from(new Set(rooms.map(room => room.roomType._id)))

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading Room Allocation Interface...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="border-0 shadow-lg bg-gradient-to-r from-purple-50 to-pink-50">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-purple-900 flex items-center space-x-2">
            <Building className="h-6 w-6" />
            <span>Room Allocation Management</span>
          </CardTitle>
          <CardDescription className="text-purple-700">
            Assign specific rooms to confirmed bookings with intelligent matching
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Unallocated Bookings */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="h-5 w-5" />
              <span>Pending Allocations</span>
              <Badge variant="secondary">{unallocatedBookings.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 max-h-96 overflow-y-auto">
            {unallocatedBookings.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-2" />
                <p className="text-gray-600">All bookings allocated!</p>
              </div>
            ) : (
              unallocatedBookings.map(booking => (
                <Card
                  key={booking._id}
                  className={cn(
                    "cursor-pointer transition-all hover:shadow-md",
                    selectedBooking?._id === booking._id ? "ring-2 ring-purple-500 bg-purple-50" : ""
                  )}
                  onClick={() => setSelectedBooking(booking)}
                >
                  <CardContent className="p-4">
                    <div className="space-y-2">
                      <div className="font-semibold text-gray-900">{booking.guestName}</div>
                      <div className="text-sm text-gray-600">
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-3 w-3" />
                          <span>
                            {new Date(booking.checkInDate).toLocaleDateString()} - {new Date(booking.checkOutDate).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Users className="h-3 w-3" />
                          <span>{booking.adults} adults, {booking.children} children</span>
                        </div>
                      </div>
                      {booking.roomPreferences.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {booking.roomPreferences.slice(0, 2).map(pref => (
                            <Badge key={pref} variant="outline" className="text-xs">
                              {pref}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </CardContent>
        </Card>

        {/* Room Selection */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
              <CardTitle className="flex items-center space-x-2">
                <Bed className="h-5 w-5" />
                <span>Available Rooms</span>
                {selectedBooking && (
                  <Badge className="bg-purple-100 text-purple-800">
                    {getCompatibleRooms(selectedBooking).length} Compatible
                  </Badge>
                )}
              </CardTitle>

              <div className="flex flex-wrap items-center gap-2">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search rooms..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 w-40"
                  />
                </div>

                {/* Filters */}
                <Select value={filterFloor} onValueChange={setFilterFloor}>
                  <SelectTrigger className="w-28">
                    <SelectValue placeholder="Floor" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Floors</SelectItem>
                    {uniqueFloors.map(floor => (
                      <SelectItem key={floor} value={floor.toString()}>
                        Floor {floor}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="available">Available</SelectItem>
                    <SelectItem value="occupied">Occupied</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                    <SelectItem value="cleaning">Cleaning</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="roomNumber">Room #</SelectItem>
                    <SelectItem value="floor">Floor</SelectItem>
                    <SelectItem value="price">Price</SelectItem>
                    <SelectItem value="capacity">Capacity</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
              {getFilteredRooms().map(room => {
                const isCompatible = selectedBooking ? getCompatibleRooms(selectedBooking).includes(room) : true
                const isSelected = selectedRoom?._id === room._id

                return (
                  <Card
                    key={room._id}
                    className={cn(
                      "cursor-pointer transition-all hover:shadow-md",
                      isSelected ? "ring-2 ring-blue-500 bg-blue-50" : "",
                      !isCompatible && selectedBooking ? "opacity-50" : "",
                      room.status !== 'available' ? "opacity-60" : ""
                    )}
                    onClick={() => {
                      if (isCompatible && room.status === 'available') {
                        setSelectedRoom(room)
                      }
                    }}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <div className="font-semibold text-lg">Room {room.roomNumber}</div>
                          <div className="text-sm text-gray-600">Floor {room.floor}</div>
                        </div>
                        <div className="text-right">
                          <Badge className={getStatusColor(room.status)}>
                            {getStatusIcon(room.status)}
                            <span className="ml-1">{room.status}</span>
                          </Badge>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">{room.roomType.name}</span>
                          <span className="text-sm font-bold text-green-600">
                            ₹{room.roomType.basePrice}/night
                          </span>
                        </div>

                        <div className="flex items-center space-x-4 text-xs text-gray-600">
                          <div className="flex items-center space-x-1">
                            <Users className="h-3 w-3" />
                            <span>Max {room.roomType.maxOccupancy}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Home className="h-3 w-3" />
                            <span>{room.roomType.category}</span>
                          </div>
                        </div>

                        {room.amenities.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {room.amenities.slice(0, 4).map(amenity => (
                              <div
                                key={amenity}
                                className="flex items-center space-x-1 bg-gray-100 rounded px-2 py-1 text-xs"
                              >
                                {getAmenityIcon(amenity)}
                                <span>{amenity}</span>
                              </div>
                            ))}
                          </div>
                        )}

                        {room.currentBooking && (
                          <div className="p-2 bg-blue-50 rounded border border-blue-200">
                            <div className="text-xs text-blue-800">
                              <div className="font-medium">{room.currentBooking.guestName}</div>
                              <div>
                                {new Date(room.currentBooking.checkInDate).toLocaleDateString()} - {new Date(room.currentBooking.checkOutDate).toLocaleDateString()}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Allocation Action */}
      {selectedBooking && selectedRoom && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="text-center">
                  <div className="font-semibold text-gray-900">{selectedBooking.guestName}</div>
                  <div className="text-sm text-gray-600">
                    {selectedBooking.adults} adults, {selectedBooking.children} children
                  </div>
                </div>

                <ArrowRight className="h-6 w-6 text-green-600" />

                <div className="text-center">
                  <div className="font-semibold text-gray-900">Room {selectedRoom.roomNumber}</div>
                  <div className="text-sm text-gray-600">
                    {selectedRoom.roomType.name} • Floor {selectedRoom.floor}
                  </div>
                </div>
              </div>

              <Button
                onClick={() => handleRoomAllocation(selectedBooking._id, selectedRoom._id)}
                disabled={allocating}
                className="bg-green-600 hover:bg-green-700"
              >
                {allocating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                    Allocating...
                  </>
                ) : (
                  <>
                    <UserCheck className="h-4 w-4 mr-2" />
                    Allocate Room
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Allocation Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-orange-600">{unallocatedBookings.length}</div>
            <div className="text-sm text-gray-600">Pending Allocation</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">
              {rooms.filter(r => r.status === 'available').length}
            </div>
            <div className="text-sm text-gray-600">Available Rooms</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">
              {rooms.filter(r => r.status === 'occupied').length}
            </div>
            <div className="text-sm text-gray-600">Occupied Rooms</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-red-600">
              {rooms.filter(r => ['maintenance', 'cleaning', 'out_of_order'].includes(r.status)).length}
            </div>
            <div className="text-sm text-gray-600">Out of Service</div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}