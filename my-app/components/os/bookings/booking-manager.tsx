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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Calendar,
  Users,
  IndianRupee,
  Clock,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Plus,
  Search,
  Filter,
  RefreshCw,
  User,
  Phone,
  Mail,
  MapPin,
  CreditCard,
  CalendarDays,
  Eye,
  Edit,
  Download,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface Booking {
  _id: string
  userId: {
    _id: string
    name: string
    email: string
    phone?: string
  }
  propertyId: string
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed'
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded'
  checkInDate: string
  checkOutDate: string
  dateFrom: string
  dateTo: string
  totalAmount: number
  adults: number
  children: number
  rooms: number
  specialRequests?: string
  createdAt: string
  updatedAt: string
}

interface BookingStats {
  total: number
  confirmed: number
  pending: number
  cancelled: number
  todayArrivals: number
  todayDepartures: number
  revenue: number
}

const BOOKING_STATUS_CONFIG = {
  pending: { color: "bg-yellow-500", label: "Pending", badgeClass: "bg-yellow-100 text-yellow-800 border-yellow-200" },
  confirmed: { color: "bg-green-500", label: "Confirmed", badgeClass: "bg-green-100 text-green-800 border-green-200" },
  cancelled: { color: "bg-red-500", label: "Cancelled", badgeClass: "bg-red-100 text-red-800 border-red-200" },
  completed: { color: "bg-blue-500", label: "Completed", badgeClass: "bg-blue-100 text-blue-800 border-blue-200" },
}

const PAYMENT_STATUS_CONFIG = {
  pending: { label: "Payment Pending", badgeClass: "bg-orange-100 text-orange-800 border-orange-200" },
  paid: { label: "Paid", badgeClass: "bg-green-100 text-green-800 border-green-200" },
  failed: { label: "Payment Failed", badgeClass: "bg-red-100 text-red-800 border-red-200" },
  refunded: { label: "Refunded", badgeClass: "bg-purple-100 text-purple-800 border-purple-200" },
}

export function BookingManager() {
  const params = useParams()
  const propertyId = params?.id as string
  
  const [bookings, setBookings] = useState<Booking[]>([])
  const [stats, setStats] = useState<BookingStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [filterPayment, setFilterPayment] = useState("all")
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
  const [updatingBooking, setUpdatingBooking] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("all")

  const fetchBookingData = useCallback(async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/os/bookings/${propertyId}`)
      if (!response.ok) {
        throw new Error('Failed to fetch booking data')
      }
      const data = await response.json()
      
      if (data.success) {
        setBookings(data.bookings || [])
        setStats(data.stats)
        setError(null)
      } else {
        setError(data.error || 'Failed to fetch booking data')
      }
    } catch (error) {
      console.error('Error fetching bookings:', error)
      setError('Failed to load booking data')
    } finally {
      setIsLoading(false)
    }
  }, [propertyId])

  useEffect(() => {
    if (propertyId) {
      fetchBookingData()
    }
  }, [propertyId, fetchBookingData])

  const updateBookingStatus = async (bookingId: string, status: string, paymentStatus?: string) => {
    try {
      setUpdatingBooking(bookingId)
      const response = await fetch(`/api/os/bookings/${propertyId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bookingId,
          status,
          paymentStatus
        })
      })

      if (!response.ok) {
        throw new Error('Failed to update booking')
      }

      const result = await response.json()
      if (result.success) {
        // Refresh data to get updated status
        await fetchBookingData()
      } else {
        setError(result.error || 'Failed to update booking')
      }
    } catch (error) {
      console.error('Error updating booking:', error)
      setError('Failed to update booking')
    } finally {
      setUpdatingBooking(null)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getFilteredBookings = () => {
    return bookings.filter(booking => {
      const matchesSearch = 
        (booking.userId?.name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
        (booking.userId?.email?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
        booking._id.toLowerCase().includes(searchQuery.toLowerCase())
      
      const matchesStatus = filterStatus === "all" || booking.status === filterStatus
      const matchesPayment = filterPayment === "all" || booking.paymentStatus === filterPayment
      
      // Tab-based filtering
      const today = new Date()
      const checkInDate = new Date(booking.checkInDate || booking.dateFrom)
      const checkOutDate = new Date(booking.checkOutDate || booking.dateTo)
      
      let matchesTab = true
      switch (activeTab) {
        case "arrivals":
          matchesTab = checkInDate.toDateString() === today.toDateString() && booking.status === 'confirmed'
          break
        case "departures":
          matchesTab = checkOutDate.toDateString() === today.toDateString() && booking.status === 'confirmed'
          break
        case "current":
          matchesTab = checkInDate <= today && checkOutDate >= today && booking.status === 'confirmed'
          break
        case "upcoming":
          matchesTab = checkInDate > today && booking.status === 'confirmed'
          break
      }
      
      return matchesSearch && matchesStatus && matchesPayment && matchesTab
    })
  }

  const getTodayArrivals = () => {
    const today = new Date()
    return bookings.filter(booking => {
      const checkInDate = new Date(booking.checkInDate || booking.dateFrom)
      return checkInDate.toDateString() === today.toDateString() && booking.status === 'confirmed'
    })
  }

  const getTodayDepartures = () => {
    const today = new Date()
    return bookings.filter(booking => {
      const checkOutDate = new Date(booking.checkOutDate || booking.dateTo)
      return checkOutDate.toDateString() === today.toDateString() && booking.status === 'confirmed'
    })
  }

  const getCurrentGuests = () => {
    const today = new Date()
    return bookings.filter(booking => {
      const checkInDate = new Date(booking.checkInDate || booking.dateFrom)
      const checkOutDate = new Date(booking.checkOutDate || booking.dateTo)
      return checkInDate <= today && checkOutDate >= today && booking.status === 'confirmed'
    })
  }

  if (isLoading) {
    return (
      <div className="min-h-96 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading booking data...</p>
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
          <h2 className="text-2xl font-bold text-gray-900">Booking Management</h2>
          <p className="text-gray-600">Manage reservations and guest stays</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search bookings..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
          
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="confirmed">Confirmed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterPayment} onValueChange={setFilterPayment}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Payment" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Payments</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
              <SelectItem value="refunded">Refunded</SelectItem>
            </SelectContent>
          </Select>

          <Button onClick={fetchBookingData} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>

          <Button className="bg-blue-600 hover:bg-blue-700">
            <Plus className="h-4 w-4 mr-2" />
            New Booking
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
              <div className="text-sm text-gray-600">Total Bookings</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{stats.confirmed}</div>
              <div className="text-sm text-gray-600">Confirmed</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
              <div className="text-sm text-gray-600">Pending</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.todayArrivals}</div>
              <div className="text-sm text-gray-600">Today Arrivals</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-purple-600">{stats.todayDepartures}</div>
              <div className="text-sm text-gray-600">Today Departures</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-emerald-600">{formatCurrency(stats.revenue)}</div>
              <div className="text-sm text-gray-600">Revenue</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Booking Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="all">All Bookings</TabsTrigger>
          <TabsTrigger value="arrivals">
            <div className="flex items-center space-x-1">
              <span>Arrivals</span>
              <Badge variant="secondary" className="text-xs">
                {getTodayArrivals().length}
              </Badge>
            </div>
          </TabsTrigger>
          <TabsTrigger value="current">
            <div className="flex items-center space-x-1">
              <span>In-House</span>
              <Badge variant="secondary" className="text-xs">
                {getCurrentGuests().length}
              </Badge>
            </div>
          </TabsTrigger>
          <TabsTrigger value="departures">
            <div className="flex items-center space-x-1">
              <span>Departures</span>
              <Badge variant="secondary" className="text-xs">
                {getTodayDepartures().length}
              </Badge>
            </div>
          </TabsTrigger>
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4">
          {/* Booking List */}
          <div className="grid grid-cols-1 gap-4">
            {getFilteredBookings().map((booking, index) => {
              const statusConfig = BOOKING_STATUS_CONFIG[booking.status] || BOOKING_STATUS_CONFIG.pending
              const paymentConfig = PAYMENT_STATUS_CONFIG[booking.paymentStatus || 'pending'] || PAYMENT_STATUS_CONFIG.pending
              const isUpdating = updatingBooking === booking._id
              const checkInDate = new Date(booking.checkInDate || booking.dateFrom)
              const checkOutDate = new Date(booking.checkOutDate || booking.dateTo)
              const nights = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 3600 * 24))
              
              // Debug logging to identify potential duplicate keys
              console.log(`Booking ${index}: ID = ${booking._id}, Key = booking-${booking._id}`)
              
              return (
                <Card key={`booking-${booking._id}-${index}`} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 space-y-3">
                        {/* Guest Info */}
                        <div className="flex items-center space-x-4">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <User className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900">{booking.userId?.name || 'Guest'}</div>
                            <div className="text-sm text-gray-600 flex items-center space-x-4">
                              <span className="flex items-center space-x-1">
                                <Mail className="h-3 w-3" />
                                <span>{booking.userId?.email || 'No email'}</span>
                              </span>
                              {booking.userId?.phone && (
                                <span className="flex items-center space-x-1">
                                  <Phone className="h-3 w-3" />
                                  <span>{booking.userId.phone}</span>
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Booking Details */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <div className="text-gray-500">Check-in</div>
                            <div className="font-medium">{formatDate(booking.checkInDate || booking.dateFrom)}</div>
                          </div>
                          <div>
                            <div className="text-gray-500">Check-out</div>
                            <div className="font-medium">{formatDate(booking.checkOutDate || booking.dateTo)}</div>
                          </div>
                          <div>
                            <div className="text-gray-500">Guests</div>
                            <div className="font-medium">{booking.adults} Adults, {booking.children} Children</div>
                          </div>
                          <div>
                            <div className="text-gray-500">Nights</div>
                            <div className="font-medium">{nights} night{nights !== 1 ? 's' : ''}</div>
                          </div>
                        </div>

                        {/* Special Requests */}
                        {booking.specialRequests && (
                          <div className="text-sm">
                            <div className="text-gray-500">Special Requests</div>
                            <div className="text-gray-700 bg-gray-50 p-2 rounded mt-1">
                              {booking.specialRequests}
                            </div>
                          </div>
                        )}

                        {/* Booking Info */}
                        <div className="flex items-center space-x-4 text-xs text-gray-500">
                          <span>ID: {booking._id.slice(-8)}</span>
                          <span>Created: {formatDateTime(booking.createdAt)}</span>
                        </div>
                      </div>

                      {/* Status and Actions */}
                      <div className="flex flex-col items-end space-y-3">
                        <div className="text-right">
                          <div className="text-2xl font-bold text-green-600">
                            {formatCurrency(booking.totalAmount)}
                          </div>
                          <div className="text-sm text-gray-500">Total Amount</div>
                        </div>

                        <div className="flex flex-col items-end space-y-2">
                          <Badge className={statusConfig?.badgeClass || "bg-gray-100 text-gray-800 border-gray-200"}>
                            {statusConfig?.label || booking.status}
                          </Badge>
                          <Badge className={paymentConfig?.badgeClass || "bg-orange-100 text-orange-800 border-orange-200"}>
                            {paymentConfig?.label || (booking.paymentStatus || 'pending')}
                          </Badge>
                        </div>

                        <div className="flex space-x-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setSelectedBooking(booking)}
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                View
                              </Button>
                            </DialogTrigger>
                            
                            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                              <DialogHeader>
                                <DialogTitle>Booking Details - {booking.userId?.name || 'Guest'}</DialogTitle>
                              </DialogHeader>
                              
                              {selectedBooking && (
                                <div className="space-y-6">
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <label className="text-sm font-medium text-gray-700">Guest Name</label>
                                      <div className="mt-1 text-sm">{selectedBooking.userId.name}</div>
                                    </div>
                                    <div>
                                      <label className="text-sm font-medium text-gray-700">Email</label>
                                      <div className="mt-1 text-sm">{selectedBooking.userId.email}</div>
                                    </div>
                                  </div>
                                  
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <label className="text-sm font-medium text-gray-700">Check-in Date</label>
                                      <div className="mt-1 text-sm">{formatDate(selectedBooking.checkInDate || selectedBooking.dateFrom)}</div>
                                    </div>
                                    <div>
                                      <label className="text-sm font-medium text-gray-700">Check-out Date</label>
                                      <div className="mt-1 text-sm">{formatDate(selectedBooking.checkOutDate || selectedBooking.dateTo)}</div>
                                    </div>
                                  </div>
                                  
                                  <div className="grid grid-cols-3 gap-4">
                                    <div>
                                      <label className="text-sm font-medium text-gray-700">Adults</label>
                                      <div className="mt-1 text-sm">{selectedBooking.adults}</div>
                                    </div>
                                    <div>
                                      <label className="text-sm font-medium text-gray-700">Children</label>
                                      <div className="mt-1 text-sm">{selectedBooking.children}</div>
                                    </div>
                                    <div>
                                      <label className="text-sm font-medium text-gray-700">Rooms</label>
                                      <div className="mt-1 text-sm">{selectedBooking.rooms}</div>
                                    </div>
                                  </div>
                                  
                                  <div>
                                    <label className="text-sm font-medium text-gray-700">Total Amount</label>
                                    <div className="mt-1 text-xl font-semibold text-green-600">
                                      {formatCurrency(selectedBooking.totalAmount)}
                                    </div>
                                  </div>
                                  
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <label className="text-sm font-medium text-gray-700">Booking Status</label>
                                      <div className="mt-2 space-y-2">
                                        {Object.entries(BOOKING_STATUS_CONFIG).map(([status, config]) => (
                                          <Button
                                            key={`booking-status-${status}`}
                                            variant={selectedBooking.status === status ? "default" : "outline"}
                                            size="sm"
                                            onClick={() => updateBookingStatus(selectedBooking._id, status)}
                                            disabled={isUpdating || selectedBooking.status === status}
                                            className="w-full justify-start"
                                          >
                                            {config.label}
                                          </Button>
                                        ))}
                                      </div>
                                    </div>
                                    
                                    <div>
                                      <label className="text-sm font-medium text-gray-700">Payment Status</label>
                                      <div className="mt-2 space-y-2">
                                        {Object.entries(PAYMENT_STATUS_CONFIG).map(([status, config]) => (
                                          <Button
                                            key={`payment-status-${status}`}
                                            variant={selectedBooking.paymentStatus === status ? "default" : "outline"}
                                            size="sm"
                                            onClick={() => updateBookingStatus(selectedBooking._id, selectedBooking.status, status)}
                                            disabled={isUpdating || selectedBooking.paymentStatus === status}
                                            className="w-full justify-start"
                                          >
                                            {config.label}
                                          </Button>
                                        ))}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </DialogContent>
                          </Dialog>

                          {booking.status !== 'completed' && booking.status !== 'cancelled' && (
                            <Select
                              value={booking.status}
                              onValueChange={(newStatus) => updateBookingStatus(booking._id, newStatus)}
                              disabled={isUpdating}
                            >
                              <SelectTrigger className="w-32">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="pending">Pending</SelectItem>
                                <SelectItem value="confirmed">Confirmed</SelectItem>
                                <SelectItem value="cancelled">Cancelled</SelectItem>
                                <SelectItem value="completed">Completed</SelectItem>
                              </SelectContent>
                            </Select>
                          )}
                        </div>
                      </div>
                    </div>

                    {isUpdating && (
                      <div className="absolute inset-0 bg-white/50 flex items-center justify-center">
                        <RefreshCw className="h-6 w-6 animate-spin text-blue-600" />
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {getFilteredBookings().length === 0 && (
            <div className="text-center py-12">
              <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-600">No bookings found</p>
              {(searchQuery || filterStatus !== "all" || filterPayment !== "all") && (
                <p className="text-sm text-gray-500 mt-1">
                  Try adjusting your search or filters
                </p>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}