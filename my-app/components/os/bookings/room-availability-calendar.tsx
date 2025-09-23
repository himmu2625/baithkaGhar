"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "@/hooks/use-toast"
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Bed,
  Users,
  Clock,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Settings,
  Filter,
  Eye,
  Edit,
  Home,
  Building,
  Wrench,
  Sparkles,
  UserCheck,
  IndianRupee
} from "lucide-react"
import { cn } from "@/lib/utils"
import { format, addDays, subDays, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, isToday } from "date-fns"

interface Room {
  _id: string
  roomNumber: string
  roomType: {
    _id: string
    name: string
    basePrice: number
  }
  floor: number
  status: 'available' | 'occupied' | 'maintenance' | 'cleaning' | 'out_of_order'
  amenities: string[]
  maxOccupancy: number
}

interface Booking {
  _id: string
  roomId: string
  guestName: string
  checkInDate: string
  checkOutDate: string
  status: 'confirmed' | 'pending' | 'cancelled'
  adults: number
  children: number
  totalAmount: number
}

interface RoomAvailability {
  date: string
  available: number
  occupied: number
  maintenance: number
  cleaning: number
  outOfOrder: number
}

export function RoomAvailabilityCalendar({ propertyId }: { propertyId: string }) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [viewMode, setViewMode] = useState<'week' | 'month'>('week')
  const [selectedRoom, setSelectedRoom] = useState<string>('all')
  const [rooms, setRooms] = useState<Room[]>([])
  const [bookings, setBookings] = useState<Booking[]>([])
  const [availability, setAvailability] = useState<RoomAvailability[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [filterStatus, setFilterStatus] = useState<string>('all')

  // Fetch rooms data
  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const response = await fetch(`/api/os/rooms/${propertyId}`)
        if (response.ok) {
          const data = await response.json()
          if (data.success) {
            setRooms(data.rooms || [])
          }
        }
      } catch (error) {
        console.error("Error fetching rooms:", error)
      }
    }

    if (propertyId) {
      fetchRooms()
    }
  }, [propertyId])

  // Fetch bookings and availability data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const startDate = viewMode === 'week'
          ? startOfWeek(currentDate)
          : new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)

        const endDate = viewMode === 'week'
          ? endOfWeek(currentDate)
          : new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)

        // Fetch bookings for the current period
        const bookingsResponse = await fetch(
          `/api/os/bookings/${propertyId}?dateFrom=${startDate.toISOString()}&dateTo=${endDate.toISOString()}`
        )

        if (bookingsResponse.ok) {
          const bookingsData = await bookingsResponse.json()
          if (bookingsData.success) {
            setBookings(bookingsData.bookings || [])
          }
        }

        // Generate availability data
        const dates = eachDayOfInterval({ start: startDate, end: endDate })
        const availabilityData = dates.map(date => {
          const dateStr = format(date, 'yyyy-MM-dd')
          const dayBookings = (bookingsData.bookings || []).filter((booking: Booking) => {
            const checkIn = new Date(booking.checkInDate)
            const checkOut = new Date(booking.checkOutDate)
            return date >= checkIn && date < checkOut && booking.status === 'confirmed'
          })

          const occupied = dayBookings.length
          const maintenance = rooms.filter(room => room.status === 'maintenance').length
          const cleaning = rooms.filter(room => room.status === 'cleaning').length
          const outOfOrder = rooms.filter(room => room.status === 'out_of_order').length
          const available = rooms.length - occupied - maintenance - cleaning - outOfOrder

          return {
            date: dateStr,
            available,
            occupied,
            maintenance,
            cleaning,
            outOfOrder
          }
        })

        setAvailability(availabilityData)
      } catch (error) {
        console.error("Error fetching data:", error)
        toast({
          title: "Data Loading Failed",
          description: "Failed to load calendar data",
          variant: "destructive"
        })
      } finally {
        setLoading(false)
      }
    }

    if (propertyId && rooms.length > 0) {
      fetchData()
    }
  }, [propertyId, currentDate, viewMode, rooms])

  const navigateDate = (direction: 'prev' | 'next') => {
    if (viewMode === 'week') {
      setCurrentDate(direction === 'prev' ? subDays(currentDate, 7) : addDays(currentDate, 7))
    } else {
      const newDate = new Date(currentDate)
      newDate.setMonth(direction === 'prev' ? newDate.getMonth() - 1 : newDate.getMonth() + 1)
      setCurrentDate(newDate)
    }
  }

  const getDateRange = () => {
    if (viewMode === 'week') {
      const start = startOfWeek(currentDate)
      const end = endOfWeek(currentDate)
      return `${format(start, 'MMM d')} - ${format(end, 'MMM d, yyyy')}`
    } else {
      return format(currentDate, 'MMMM yyyy')
    }
  }

  const getCalendarDates = () => {
    if (viewMode === 'week') {
      return eachDayOfInterval({
        start: startOfWeek(currentDate),
        end: endOfWeek(currentDate)
      })
    } else {
      const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
      const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)
      return eachDayOfInterval({ start: monthStart, end: monthEnd })
    }
  }

  const getAvailabilityForDate = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd')
    return availability.find(a => a.date === dateStr) || {
      date: dateStr,
      available: 0,
      occupied: 0,
      maintenance: 0,
      cleaning: 0,
      outOfOrder: 0
    }
  }

  const getBookingsForDate = (date: Date) => {
    return bookings.filter(booking => {
      const checkIn = new Date(booking.checkInDate)
      const checkOut = new Date(booking.checkOutDate)
      return date >= checkIn && date < checkOut && booking.status === 'confirmed'
    })
  }

  const getStatusColor = (status: string, count: number) => {
    if (count === 0) return 'bg-gray-100 text-gray-400'

    switch (status) {
      case 'available': return 'bg-green-100 text-green-800 border-green-200'
      case 'occupied': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'maintenance': return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'cleaning': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'outOfOrder': return 'bg-red-100 text-red-800 border-red-200'
      default: return 'bg-gray-100 text-gray-600 border-gray-200'
    }
  }

  const getFilteredRooms = () => {
    if (selectedRoom === 'all') {
      return filterStatus === 'all'
        ? rooms
        : rooms.filter(room => room.status === filterStatus)
    }
    return rooms.filter(room => room._id === selectedRoom)
  }

  const getRoomBookingForDate = (roomId: string, date: Date) => {
    return bookings.find(booking => {
      if (booking.roomId !== roomId) return false
      const checkIn = new Date(booking.checkInDate)
      const checkOut = new Date(booking.checkOutDate)
      return date >= checkIn && date < checkOut && booking.status === 'confirmed'
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading Room Calendar...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Calendar Header */}
      <Card className="border-0 shadow-lg bg-gradient-to-r from-blue-50 to-indigo-50">
        <CardHeader>
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            <div>
              <CardTitle className="text-2xl font-bold text-blue-900 flex items-center space-x-2">
                <Calendar className="h-6 w-6" />
                <span>Room Availability Calendar</span>
              </CardTitle>
              <CardDescription className="text-blue-700">
                Visual room allocation and availability management
              </CardDescription>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* View Mode Toggle */}
              <Tabs value={viewMode} onValueChange={(value: any) => setViewMode(value)}>
                <TabsList>
                  <TabsTrigger value="week">Week View</TabsTrigger>
                  <TabsTrigger value="month">Month View</TabsTrigger>
                </TabsList>
              </Tabs>

              {/* Room Filter */}
              <Select value={selectedRoom} onValueChange={setSelectedRoom}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="All Rooms" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Rooms</SelectItem>
                  {rooms.map(room => (
                    <SelectItem key={room._id} value={room._id}>
                      Room {room.roomNumber}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Status Filter */}
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="available">Available</SelectItem>
                  <SelectItem value="occupied">Occupied</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                  <SelectItem value="cleaning">Cleaning</SelectItem>
                  <SelectItem value="out_of_order">Out of Order</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              onClick={() => navigateDate('prev')}
              className="flex items-center space-x-2"
            >
              <ChevronLeft className="h-4 w-4" />
              <span>Previous</span>
            </Button>

            <h3 className="text-lg font-semibold text-blue-900">
              {getDateRange()}
            </h3>

            <Button
              variant="outline"
              onClick={() => navigateDate('next')}
              className="flex items-center space-x-2"
            >
              <span>Next</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Legend */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            <span className="font-medium text-gray-700">Legend:</span>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-green-500 rounded"></div>
              <span className="text-sm">Available</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-blue-500 rounded"></div>
              <span className="text-sm">Occupied</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-orange-500 rounded"></div>
              <span className="text-sm">Maintenance</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-yellow-500 rounded"></div>
              <span className="text-sm">Cleaning</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-red-500 rounded"></div>
              <span className="text-sm">Out of Order</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Calendar Grid */}
      <div className="space-y-4">
        {viewMode === 'week' ? (
          /* Week View */
          <Card>
            <CardContent className="p-6">
              <div className="grid grid-cols-8 gap-4">
                {/* Header Row */}
                <div className="font-semibold text-gray-700">Room</div>
                {getCalendarDates().map(date => (
                  <div key={date.toISOString()} className="text-center">
                    <div className="font-semibold text-gray-700">
                      {format(date, 'EEE')}
                    </div>
                    <div className={cn(
                      "text-sm",
                      isToday(date) ? "text-blue-600 font-bold" : "text-gray-600"
                    )}>
                      {format(date, 'd')}
                    </div>
                  </div>
                ))}

                {/* Room Rows */}
                {getFilteredRooms().map(room => (
                  <React.Fragment key={room._id}>
                    <div className="flex items-center space-x-2 py-2">
                      <div className="font-medium">Room {room.roomNumber}</div>
                      <Badge variant="outline" className="text-xs">
                        {room.roomType.name}
                      </Badge>
                    </div>
                    {getCalendarDates().map(date => {
                      const booking = getRoomBookingForDate(room._id, date)
                      const isAvailable = !booking && room.status === 'available'

                      return (
                        <div
                          key={`${room._id}-${date.toISOString()}`}
                          className={cn(
                            "h-16 rounded-lg border-2 cursor-pointer transition-all hover:shadow-md",
                            booking
                              ? "bg-blue-100 border-blue-300"
                              : room.status === 'available'
                              ? "bg-green-100 border-green-300 hover:bg-green-200"
                              : room.status === 'maintenance'
                              ? "bg-orange-100 border-orange-300"
                              : room.status === 'cleaning'
                              ? "bg-yellow-100 border-yellow-300"
                              : "bg-red-100 border-red-300"
                          )}
                          onClick={() => setSelectedDate(date)}
                        >
                          {booking ? (
                            <div className="p-2 text-xs">
                              <div className="font-medium truncate">
                                {booking.guestName}
                              </div>
                              <div className="text-blue-600">
                                {booking.adults}+{booking.children} guests
                              </div>
                            </div>
                          ) : (
                            <div className="p-2 text-xs text-center">
                              {room.status === 'available' ? (
                                <CheckCircle2 className="h-6 w-6 text-green-600 mx-auto" />
                              ) : room.status === 'maintenance' ? (
                                <Wrench className="h-6 w-6 text-orange-600 mx-auto" />
                              ) : room.status === 'cleaning' ? (
                                <Sparkles className="h-6 w-6 text-yellow-600 mx-auto" />
                              ) : (
                                <XCircle className="h-6 w-6 text-red-600 mx-auto" />
                              )}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </React.Fragment>
                ))}
              </div>
            </CardContent>
          </Card>
        ) : (
          /* Month View - Summary */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4">
            {getCalendarDates().map(date => {
              const dayAvailability = getAvailabilityForDate(date)
              const dayBookings = getBookingsForDate(date)

              return (
                <Card
                  key={date.toISOString()}
                  className={cn(
                    "cursor-pointer transition-all hover:shadow-md",
                    isToday(date) ? "ring-2 ring-blue-500 bg-blue-50" : "",
                    selectedDate && isSameDay(date, selectedDate) ? "ring-2 ring-green-500 bg-green-50" : ""
                  )}
                  onClick={() => setSelectedDate(date)}
                >
                  <CardContent className="p-4">
                    <div className="text-center mb-3">
                      <div className="font-semibold text-gray-900">
                        {format(date, 'd')}
                      </div>
                      <div className="text-xs text-gray-500">
                        {format(date, 'EEE')}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <Badge className={getStatusColor('available', dayAvailability.available)}>
                          {dayAvailability.available} Available
                        </Badge>
                      </div>

                      <div className="flex justify-between items-center">
                        <Badge className={getStatusColor('occupied', dayAvailability.occupied)}>
                          {dayAvailability.occupied} Occupied
                        </Badge>
                      </div>

                      {(dayAvailability.maintenance + dayAvailability.cleaning + dayAvailability.outOfOrder) > 0 && (
                        <div className="flex justify-between items-center">
                          <Badge variant="outline" className="text-xs">
                            {dayAvailability.maintenance + dayAvailability.cleaning + dayAvailability.outOfOrder} Issues
                          </Badge>
                        </div>
                      )}
                    </div>

                    {dayBookings.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-gray-200">
                        <div className="text-xs text-gray-600">
                          {dayBookings.length} booking{dayBookings.length > 1 ? 's' : ''}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      {/* Selected Date Details */}
      {selectedDate && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-blue-900">
              Details for {format(selectedDate, 'EEEE, MMMM d, yyyy')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {getBookingsForDate(selectedDate).map(booking => (
                <Card key={booking._id} className="bg-white">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-medium">{booking.guestName}</div>
                      <Badge variant="outline">
                        Room {rooms.find(r => r._id === booking.roomId)?.roomNumber}
                      </Badge>
                    </div>
                    <div className="text-sm text-gray-600 space-y-1">
                      <div className="flex items-center space-x-1">
                        <Users className="h-3 w-3" />
                        <span>{booking.adults} adults, {booking.children} children</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <IndianRupee className="h-3 w-3" />
                        <span>₹{booking.totalAmount.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Clock className="h-3 w-3" />
                        <span>
                          {format(new Date(booking.checkInDate), 'MMM d')} - {format(new Date(booking.checkOutDate), 'MMM d')}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}