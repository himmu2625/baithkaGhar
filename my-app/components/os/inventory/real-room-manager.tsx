"use client"

import React, { useState, useEffect, useCallback } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Bed,
  User,
  Clock,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Plus,
  Edit,
  Search,
  Filter,
  RefreshCw,
  IndianRupee,
  Users,
  Calendar,
  MapPin,
  Wifi,
  Tv,
  Car,
  Coffee,
  Bath,
  Wind,
  Phone,
  Shield,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface RoomUnit {
  unitTypeCode: string
  unitTypeName: string
  count: number
  pricing: {
    price: string
    currency: string
  }
  amenities: string[]
  roomNumbers?: {
    number: string
    status: 'available' | 'occupied' | 'maintenance' | 'cleaning'
  }[]
}

interface InventoryStats {
  totalRooms: number
  availableRooms: number
  bookedRooms: number
  maintenanceRooms: number
  occupancyRate: number
  averageRate: number
}

interface PropertyInfo {
  id: string
  title: string
  address: {
    city: string
    state: string
  }
}

const ROOM_STATUS_CONFIG = {
  available: { color: "bg-green-500", label: "Available", icon: CheckCircle2, badgeClass: "bg-green-100 text-green-800 border-green-200" },
  occupied: { color: "bg-blue-500", label: "Occupied", icon: User, badgeClass: "bg-blue-100 text-blue-800 border-blue-200" },
  maintenance: { color: "bg-red-500", label: "Maintenance", icon: AlertTriangle, badgeClass: "bg-red-100 text-red-800 border-red-200" },
  cleaning: { color: "bg-yellow-500", label: "Cleaning", icon: Clock, badgeClass: "bg-yellow-100 text-yellow-800 border-yellow-200" },
}

const AMENITY_ICONS: { [key: string]: React.ReactNode } = {
  "WiFi": <Wifi className="h-3 w-3" />,
  "TV": <Tv className="h-3 w-3" />,
  "AC": <Wind className="h-3 w-3" />,
  "Parking": <Car className="h-3 w-3" />,
  "Coffee": <Coffee className="h-3 w-3" />,
  "Bathroom": <Bath className="h-3 w-3" />,
  "Phone": <Phone className="h-3 w-3" />,
  "Safe": <Shield className="h-3 w-3" />,
}

export function RealRoomManager() {
  const params = useParams()
  const propertyId = params.id as string
  
  const [inventory, setInventory] = useState<RoomUnit[]>([])
  const [stats, setStats] = useState<InventoryStats | null>(null)
  const [property, setProperty] = useState<PropertyInfo | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [selectedRoom, setSelectedRoom] = useState<any>(null)
  const [updatingRoom, setUpdatingRoom] = useState<string | null>(null)

  const fetchInventoryData = useCallback(async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/os/inventory/${propertyId}`)
      if (!response.ok) {
        throw new Error('Failed to fetch inventory data')
      }
      const data = await response.json()
      
      if (data.success) {
        setInventory(data.inventory || [])
        setStats(data.stats)
        setProperty(data.property)
        setError(null)
      } else {
        setError(data.error || 'Failed to fetch inventory data')
      }
    } catch (error) {
      console.error('Error fetching inventory:', error)
      setError('Failed to load inventory data')
    } finally {
      setIsLoading(false)
    }
  }, [propertyId])

  useEffect(() => {
    if (propertyId) {
      fetchInventoryData()
    }
  }, [propertyId, fetchInventoryData])

  const updateRoomStatus = async (unitCode: string, roomNumber: string, newStatus: string) => {
    try {
      setUpdatingRoom(`${unitCode}-${roomNumber}`)
      const response = await fetch(`/api/os/inventory/${propertyId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          unitCode,
          roomNumber,
          status: newStatus
        })
      })

      if (!response.ok) {
        throw new Error('Failed to update room status')
      }

      const result = await response.json()
      if (result.success) {
        // Refresh data to get updated status
        await fetchInventoryData()
      } else {
        setError(result.error || 'Failed to update room status')
      }
    } catch (error) {
      console.error('Error updating room status:', error)
      setError('Failed to update room status')
    } finally {
      setUpdatingRoom(null)
    }
  }

  const formatCurrency = (amount: number | string) => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
    }).format(numAmount)
  }

  const getFilteredRooms = () => {
    return inventory.filter(unit => {
      const matchesSearch = unit.unitTypeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          unit.unitTypeCode.toLowerCase().includes(searchQuery.toLowerCase())
      
      if (filterStatus === "all") return matchesSearch
      
      // Filter by room status if individual rooms are tracked
      if (unit.roomNumbers && unit.roomNumbers.length > 0) {
        return matchesSearch && unit.roomNumbers.some(room => room.status === filterStatus)
      }
      
      return matchesSearch
    })
  }

  if (isLoading) {
    return (
      <div className="min-h-96 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading inventory data...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive" className="max-w-md mx-auto">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Room Inventory</h2>
          <p className="text-gray-600">Manage room availability and pricing</p>
          {property && (
            <div className="flex items-center space-x-2 mt-2 text-sm text-gray-500">
              <MapPin className="h-4 w-4" />
              <span>{property.title}</span>
            </div>
          )}
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search room types..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
          
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="available">Available</SelectItem>
              <SelectItem value="occupied">Occupied</SelectItem>
              <SelectItem value="maintenance">Maintenance</SelectItem>
              <SelectItem value="cleaning">Cleaning</SelectItem>
            </SelectContent>
          </Select>

          <Button onClick={fetchInventoryData} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-gray-900">{stats.totalRooms}</div>
              <div className="text-sm text-gray-600">Total Rooms</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{stats.availableRooms}</div>
              <div className="text-sm text-gray-600">Available</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.bookedRooms}</div>
              <div className="text-sm text-gray-600">Occupied</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-red-600">{stats.maintenanceRooms}</div>
              <div className="text-sm text-gray-600">Maintenance</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-purple-600">{stats.occupancyRate}%</div>
              <div className="text-sm text-gray-600">Occupancy</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Room Types Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {getFilteredRooms().map((unit) => (
          <Card key={unit.unitTypeCode} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{unit.unitTypeName}</CardTitle>
                <Badge variant="outline">{unit.unitTypeCode}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(unit.pricing.price)}
                </div>
                <div className="text-sm text-gray-500">per night</div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* Room Count */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Total Rooms:</span>
                <span className="font-semibold">{unit.count}</span>
              </div>

              {/* Amenities */}
              {unit.amenities && unit.amenities.length > 0 && (
                <div>
                  <div className="text-sm font-medium text-gray-700 mb-2">Amenities</div>
                  <div className="flex flex-wrap gap-1">
                    {unit.amenities.slice(0, 4).map((amenity) => (
                      <div
                        key={amenity}
                        className="flex items-center space-x-1 bg-gray-100 rounded px-2 py-1 text-xs"
                        title={amenity}
                      >
                        {AMENITY_ICONS[amenity]}
                        <span>{amenity}</span>
                      </div>
                    ))}
                    {unit.amenities.length > 4 && (
                      <div className="bg-gray-100 rounded px-2 py-1 text-xs">
                        +{unit.amenities.length - 4}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Individual Rooms (if tracked) */}
              {unit.roomNumbers && unit.roomNumbers.length > 0 && (
                <div>
                  <div className="text-sm font-medium text-gray-700 mb-2">Individual Rooms</div>
                  <div className="grid grid-cols-3 gap-2 max-h-32 overflow-y-auto">
                    {unit.roomNumbers.map((room) => {
                      const statusConfig = ROOM_STATUS_CONFIG[room.status]
                      const Icon = statusConfig.icon
                      const isUpdating = updatingRoom === `${unit.unitTypeCode}-${room.number}`
                      
                      return (
                        <Dialog key={room.number}>
                          <DialogTrigger asChild>
                            <button
                              className={cn(
                                "flex items-center justify-center space-x-1 p-2 rounded text-xs font-medium transition-colors",
                                statusConfig.badgeClass,
                                isUpdating && "opacity-50 cursor-not-allowed"
                              )}
                              disabled={isUpdating}
                            >
                              {isUpdating ? (
                                <RefreshCw className="h-3 w-3 animate-spin" />
                              ) : (
                                <Icon className="h-3 w-3" />
                              )}
                              <span>{room.number}</span>
                            </button>
                          </DialogTrigger>
                          
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Room {room.number} - {unit.unitTypeName}</DialogTitle>
                            </DialogHeader>
                            
                            <div className="space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <label className="text-sm font-medium">Current Status</label>
                                  <div className="mt-1">
                                    <Badge className={statusConfig.badgeClass}>
                                      {statusConfig.label}
                                    </Badge>
                                  </div>
                                </div>
                                <div>
                                  <label className="text-sm font-medium">Room Rate</label>
                                  <div className="mt-1 font-semibold">
                                    {formatCurrency(unit.pricing.price)}
                                  </div>
                                </div>
                              </div>
                              
                              <div>
                                <label className="text-sm font-medium">Update Status</label>
                                <div className="grid grid-cols-2 gap-2 mt-2">
                                  {Object.entries(ROOM_STATUS_CONFIG).map(([status, config]) => (
                                    <Button
                                      key={status}
                                      variant={room.status === status ? "default" : "outline"}
                                      size="sm"
                                      onClick={() => updateRoomStatus(unit.unitTypeCode, room.number, status)}
                                      disabled={isUpdating || room.status === status}
                                      className="justify-start"
                                    >
                                      <config.icon className="h-4 w-4 mr-2" />
                                      {config.label}
                                    </Button>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex space-x-2 pt-4 border-t">
                <Button variant="outline" size="sm" className="flex-1">
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Pricing
                </Button>
                <Button variant="outline" size="sm" className="flex-1">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Room
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {getFilteredRooms().length === 0 && (
        <div className="text-center py-12">
          <Bed className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <p className="text-gray-600">No room types found</p>
          {searchQuery && (
            <p className="text-sm text-gray-500 mt-1">
              Try adjusting your search or filters
            </p>
          )}
        </div>
      )}
    </div>
  )
}