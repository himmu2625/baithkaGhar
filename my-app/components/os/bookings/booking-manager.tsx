"use client"

import React, { useState, useEffect, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Label } from "@/components/ui/label"
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
  Activity,
  TrendingUp,
  ArrowLeft,
  Building,
  Target,
  Star,
  Timer,
  BarChart3,
  X,
  Bell
} from "lucide-react"
import { cn } from "@/lib/utils"
import { BookingCreationForm } from './booking-creation-form'
import { RoomAvailabilityCalendar } from './room-availability-calendar'
import { RoomAllocationInterface } from './room-allocation-interface'
import { RoomUpgradeInterface } from './room-upgrade-interface'
import RoomStatusManager from './room-status-manager'
import PaymentProcessor from './payment-processor'
import CommunicationCenter from './communication-center'
import AnalyticsDashboard from './analytics-dashboard'
import FrontDeskOperations from './front-desk-operations'

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
  const router = useRouter()
  const propertyId = (params?.propertyId || params?.id) as string
  
  const [bookings, setBookings] = useState<Booking[]>([])
  const [stats, setStats] = useState<BookingStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [filterPayment, setFilterPayment] = useState("all")
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
  const [updatingBooking, setUpdatingBooking] = useState<string | null>(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
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
    if (!amount || isNaN(amount)) return "₹0"
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A"
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return "Invalid Date"
    return date.toLocaleDateString("en-IN", {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const formatDateTime = (dateString: string) => {
    if (!dateString) return "N/A"
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return "Invalid Date"
    return date.toLocaleDateString("en-IN", {
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
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading Booking Management...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={fetchBookingData}>Retry</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Enhanced Header - Matching OS Dashboard Style */}
      <div className="bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 rounded-2xl p-8 text-white shadow-2xl">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push(`/os/dashboard/${propertyId}`)}
                className="flex items-center space-x-2 text-white/80 hover:text-white hover:bg-white/20 rounded-lg"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back to Dashboard</span>
              </Button>
            </div>
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                <CalendarDays className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold tracking-tight">
                  Booking Management
                </h1>
                <div className="flex items-center space-x-4 mt-2">
                  <div className="flex items-center space-x-1">
                    <Users className="h-4 w-4" />
                    <span className="text-green-100">
                      Real-time Reservations
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
              onClick={fetchBookingData}
              disabled={isLoading}
              className="bg-white/20 hover:bg-white/30 text-white border-white/30 backdrop-blur-sm"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
              {isLoading ? "Refreshing..." : "Refresh Data"}
            </Button>
            <Button
              onClick={() => setShowCreateForm(true)}
              className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 border-0 font-semibold"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Booking
            </Button>
          </div>
        </div>
      </div>

      {/* Enhanced Metrics Cards - Matching OS Dashboard Style */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6">
        <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 group bg-gradient-to-br from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-indigo-500/10"></div>
          <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-blue-700">
              Total Bookings
            </CardTitle>
            <div className="p-2 rounded-lg bg-blue-500/20 group-hover:bg-blue-500/30 transition-colors">
              <CalendarDays className="h-5 w-5 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-3xl font-bold text-blue-900 mb-1">
              {stats?.total || 0}
            </div>
            <div className="flex items-center space-x-1">
              <CheckCircle2 className="h-4 w-4 text-blue-600" />
              <span className="text-xs text-blue-600">All reservations</span>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 group bg-gradient-to-br from-green-50 to-green-100 hover:from-green-100 hover:to-green-200">
          <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 to-emerald-500/10"></div>
          <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-green-700">
              Confirmed
            </CardTitle>
            <div className="p-2 rounded-lg bg-green-500/20 group-hover:bg-green-500/30 transition-colors">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-3xl font-bold text-green-900 mb-1">
              {stats?.confirmed || 0}
            </div>
            <div className="space-y-2">
              <div className="w-full bg-green-200 rounded-full h-2">
                <div
                  className="bg-green-600 h-2 rounded-full transition-all duration-1000 ease-out"
                  style={{ width: stats && stats.total > 0 ? `${(stats.confirmed / stats.total) * 100}%` : '0%' }}
                ></div>
              </div>
              <span className="text-xs text-green-600">
                {stats && stats.total > 0 ? Math.round((stats.confirmed / stats.total) * 100) : 0}% confirmed
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 group bg-gradient-to-br from-yellow-50 to-yellow-100 hover:from-yellow-100 hover:to-yellow-200">
          <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/10 to-orange-500/10"></div>
          <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-yellow-700">
              Pending
            </CardTitle>
            <div className="p-2 rounded-lg bg-yellow-500/20 group-hover:bg-yellow-500/30 transition-colors">
              <Clock className="h-5 w-5 text-yellow-600" />
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-3xl font-bold text-yellow-900 mb-1">
              {stats?.pending || 0}
            </div>
            <div className="flex items-center space-x-1">
              <Timer className="h-4 w-4 text-yellow-600" />
              <span className="text-xs text-yellow-600">Awaiting confirmation</span>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 group bg-gradient-to-br from-purple-50 to-purple-100 hover:from-purple-100 hover:to-purple-200">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-pink-500/10"></div>
          <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-purple-700">
              Today Arrivals
            </CardTitle>
            <div className="p-2 rounded-lg bg-purple-500/20 group-hover:bg-purple-500/30 transition-colors">
              <Users className="h-5 w-5 text-purple-600" />
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-3xl font-bold text-purple-900 mb-1">
              {stats?.todayArrivals || 0}
            </div>
            <div className="flex items-center space-x-1">
              <ArrowLeft className="h-4 w-4 text-purple-600 rotate-90" />
              <span className="text-xs text-purple-600">Check-ins today</span>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 group bg-gradient-to-br from-indigo-50 to-indigo-100 hover:from-indigo-100 hover:to-indigo-200">
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-blue-500/10"></div>
          <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-indigo-700">
              Today Departures
            </CardTitle>
            <div className="p-2 rounded-lg bg-indigo-500/20 group-hover:bg-indigo-500/30 transition-colors">
              <Users className="h-5 w-5 text-indigo-600" />
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-3xl font-bold text-indigo-900 mb-1">
              {stats?.todayDepartures || 0}
            </div>
            <div className="flex items-center space-x-1">
              <ArrowLeft className="h-4 w-4 text-indigo-600 -rotate-90" />
              <span className="text-xs text-indigo-600">Check-outs today</span>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 group bg-gradient-to-br from-emerald-50 to-emerald-100 hover:from-emerald-100 hover:to-emerald-200">
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-green-500/10"></div>
          <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-emerald-700">
              Revenue
            </CardTitle>
            <div className="p-2 rounded-lg bg-emerald-500/20 group-hover:bg-emerald-500/30 transition-colors">
              <IndianRupee className="h-5 w-5 text-emerald-600" />
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-3xl font-bold text-emerald-900 mb-1">
              {formatCurrency(stats?.revenue || 0)}
            </div>
            <div className="flex items-center space-x-1">
              <TrendingUp className="h-4 w-4 text-emerald-600" />
              <span className="text-xs text-emerald-600">Total earnings</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Refined Search and Filters - OS Theme */}
      <Card className="border-0 shadow-lg bg-gradient-to-r from-white to-green-50/30">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-500/20 rounded-lg">
                <Search className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <CardTitle className="text-lg font-semibold text-green-800">
                  Smart Booking Finder
                </CardTitle>
                <CardDescription className="text-green-600">
                  Advanced search and filtering system for booking management
                </CardDescription>
              </div>
            </div>
            {/* Live Search Results Counter */}
            <div className="flex items-center space-x-2 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
              <Activity className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-700">
                {getFilteredBookings().length} bookings found
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
              placeholder="Search by guest name, email, booking ID, or special requests..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-11 pl-10 border-gray-200 focus:border-green-500 focus:ring-green-500"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSearchQuery("")}
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
                <CheckCircle2 className="h-4 w-4 mr-2 text-green-600" />
                Booking Status
              </Label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="h-11 border-gray-200 focus:border-green-500">
                  <SelectValue placeholder="Select Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 rounded-full bg-gray-400"></div>
                      <span>All Status ({bookings.length})</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="pending">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                      <span>Pending ({stats?.pending || 0})</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="confirmed">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 rounded-full bg-green-500"></div>
                      <span>Confirmed ({stats?.confirmed || 0})</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="cancelled">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 rounded-full bg-red-500"></div>
                      <span>Cancelled</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="completed">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                      <span>Completed</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Payment Filter */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700 flex items-center">
                <CreditCard className="h-4 w-4 mr-2 text-emerald-600" />
                Payment Status
              </Label>
              <Select value={filterPayment} onValueChange={setFilterPayment}>
                <SelectTrigger className="h-11 border-gray-200 focus:border-green-500">
                  <SelectValue placeholder="Select Payment" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    <div className="flex items-center space-x-2">
                      <CreditCard className="h-4 w-4 text-gray-500" />
                      <span>All Payments</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="pending">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                      <span>Pending</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="paid">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 rounded-full bg-green-500"></div>
                      <span>Paid</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="failed">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 rounded-full bg-red-500"></div>
                      <span>Failed</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="refunded">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                      <span>Refunded</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Quick Actions Row */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setSearchQuery("")
                setFilterStatus("all")
                setFilterPayment("all")
              }}
              className="border-gray-200 hover:border-gray-400 hover:bg-gray-50 text-gray-700"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Clear All
            </Button>
          </div>

          {/* Active Filters Display */}
          {(searchQuery || filterStatus !== "all" || filterPayment !== "all") && (
            <div className="flex flex-wrap gap-2 p-3 bg-green-50 rounded-lg border border-green-200">
              <span className="text-sm font-medium text-green-700">
                Active Filters:
              </span>

              {searchQuery && (
                <Badge className="bg-green-100 text-green-800 border-green-300 text-xs">
                  Search: "{searchQuery}"
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSearchQuery("")}
                    className="ml-1 h-3 w-3 p-0 hover:bg-green-200"
                  >
                    <X className="h-2 w-2" />
                  </Button>
                </Badge>
              )}

              {filterStatus !== "all" && (
                <Badge className="bg-blue-100 text-blue-800 border-blue-300 text-xs">
                  Status: {filterStatus.charAt(0).toUpperCase() + filterStatus.slice(1)}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setFilterStatus("all")}
                    className="ml-1 h-3 w-3 p-0 hover:bg-blue-200"
                  >
                    <X className="h-2 w-2" />
                  </Button>
                </Badge>
              )}

              {filterPayment !== "all" && (
                <Badge className="bg-purple-100 text-purple-800 border-purple-300 text-xs">
                  Payment: {filterPayment.charAt(0).toUpperCase() + filterPayment.slice(1)}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setFilterPayment("all")}
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

      {/* Clean Minimal Navigation */}
      <div className="space-y-4">
        {/* Simple Header with Actions */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Booking Management</h1>
            <p className="text-sm text-gray-600 mt-1">Manage your property reservations and guest services</p>
          </div>
          <Button
            onClick={() => setShowCreateForm(true)}
            className="bg-blue-600 hover:bg-blue-700 shadow-sm"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Booking
          </Button>
        </div>

        {/* Clean Button Navigation */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('all')}
              className={cn(
                "whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-colors",
                activeTab === 'all'
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              )}
            >
              <div className="flex items-center gap-2">
                <Building className="h-4 w-4" />
                All Bookings
              </div>
            </button>

            <button
              onClick={() => setActiveTab('arrivals')}
              className={cn(
                "whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-colors",
                activeTab === 'arrivals'
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              )}
            >
              <div className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4" />
                Arrivals
                {getTodayArrivals().length > 0 && (
                  <span className="ml-1 bg-blue-100 text-blue-600 py-0.5 px-2 rounded-full text-xs font-medium">
                    {getTodayArrivals().length}
                  </span>
                )}
              </div>
            </button>

            <button
              onClick={() => setActiveTab('current')}
              className={cn(
                "whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-colors",
                activeTab === 'current'
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              )}
            >
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                In-House
                {getCurrentGuests().length > 0 && (
                  <span className="ml-1 bg-green-100 text-green-600 py-0.5 px-2 rounded-full text-xs font-medium">
                    {getCurrentGuests().length}
                  </span>
                )}
              </div>
            </button>

            <button
              onClick={() => setActiveTab('departures')}
              className={cn(
                "whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-colors",
                activeTab === 'departures'
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              )}
            >
              <div className="flex items-center gap-2">
                <Timer className="h-4 w-4" />
                Departures
                {getTodayDepartures().length > 0 && (
                  <span className="ml-1 bg-orange-100 text-orange-600 py-0.5 px-2 rounded-full text-xs font-medium">
                    {getTodayDepartures().length}
                  </span>
                )}
              </div>
            </button>

            <button
              onClick={() => setActiveTab('upcoming')}
              className={cn(
                "whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-colors",
                activeTab === 'upcoming'
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              )}
            >
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4" />
                Upcoming
              </div>
            </button>

            {/* Dropdown for other functions */}
            <div className="relative ml-8">
              <select
                value={['all', 'arrivals', 'current', 'departures', 'upcoming'].includes(activeTab) ? '' : activeTab}
                onChange={(e) => setActiveTab(e.target.value)}
                className="appearance-none bg-white border border-gray-300 rounded-md px-3 py-2 pr-8 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="" disabled>More Tools</option>
                <option value="calendar">📅 Calendar View</option>
                <option value="allocation">🎯 Room Allocation</option>
                <option value="upgrades">📈 Upgrades</option>
                <option value="room-status">🏨 Room Status</option>
                <option value="payments">💳 Payments</option>
                <option value="communications">🔔 Communications</option>
                <option value="analytics">📊 Analytics</option>
                <option value="front-desk">🏪 Front Desk</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                  <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
                </svg>
              </div>
            </div>
          </nav>
        </div>

        {/* Booking List Content */}
        {(activeTab === 'all' || activeTab === 'arrivals' || activeTab === 'current' || activeTab === 'departures' || activeTab === 'upcoming') && (
          <div className="space-y-6">
            {/* Enhanced Search Summary */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Target className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {getFilteredBookings().length} Bookings Found
                    </h3>
                    <p className="text-sm text-gray-600">
                      {activeTab === 'all' ? 'All bookings' :
                       activeTab === 'arrivals' ? 'Arriving today' :
                       activeTab === 'current' ? 'Currently checked in' :
                       activeTab === 'departures' ? 'Departing today' :
                       'Upcoming bookings'}
                      {getFilteredBookings().length !== bookings.length && ` of ${bookings.length} total`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant="outline" className="text-sm">
                    Last updated: {new Date().toLocaleTimeString()}
                  </Badge>
                  <Button variant="outline" size="sm" onClick={fetchBookingData}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                  </Button>
                </div>
              </div>
            </div>

          {/* Enhanced Booking Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {getFilteredBookings().map((booking, index) => {
              const statusConfig = BOOKING_STATUS_CONFIG[booking.status] || BOOKING_STATUS_CONFIG.pending
              const paymentConfig = PAYMENT_STATUS_CONFIG[booking.paymentStatus || 'pending'] || PAYMENT_STATUS_CONFIG.pending
              const isUpdating = updatingBooking === booking._id
              const checkInDate = new Date(booking.checkInDate || booking.dateFrom)
              const checkOutDate = new Date(booking.checkOutDate || booking.dateTo)
              const nightsCalculation = (checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 3600 * 24)
              const nights = isNaN(nightsCalculation) ? 0 : Math.max(1, Math.ceil(nightsCalculation))

              return (
                <Card
                  key={`booking-${booking._id}-${index}`}
                  className="group hover:scale-[1.02] transition-all duration-300 hover:shadow-xl border border-gray-200 shadow-sm cursor-pointer bg-white hover:bg-gray-50 relative overflow-hidden"
                >
                  {/* Status Color Bar */}
                  <div
                    className={`h-2 rounded-t-lg ${
                      booking.status === "confirmed"
                        ? "bg-gradient-to-r from-green-500 to-emerald-500"
                        : booking.status === "pending"
                        ? "bg-gradient-to-r from-yellow-500 to-orange-500"
                        : booking.status === "cancelled"
                        ? "bg-gradient-to-r from-red-500 to-rose-500"
                        : "bg-gradient-to-r from-blue-500 to-indigo-500"
                    }`}
                  ></div>

                  <CardHeader className="pb-4 p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-14 h-14 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-xl flex items-center justify-center">
                          <User className="h-7 w-7 text-blue-600" />
                        </div>
                        <div>
                          <CardTitle className="text-lg font-semibold text-gray-900 mb-1">
                            {booking.userId?.name || 'Guest'}
                          </CardTitle>
                          <CardDescription className="text-gray-600 flex items-center space-x-1">
                            <Mail className="h-3 w-3" />
                            <span>{booking.userId?.email || 'No email'}</span>
                          </CardDescription>
                        </div>
                      </div>
                      <div className="flex flex-col items-end space-y-2">
                        <Badge className={`${statusConfig?.badgeClass || "bg-gray-100 text-gray-800 border-gray-200"} px-3 py-1`}>
                          {statusConfig?.label || booking.status}
                        </Badge>
                        <Badge className={`${paymentConfig?.badgeClass || "bg-orange-100 text-orange-800 border-orange-200"} px-3 py-1`}>
                          {paymentConfig?.label || (booking.paymentStatus || 'pending')}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="px-6 pb-6 space-y-5">
                    {/* Booking Details Grid */}
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="flex items-center space-x-2 mb-1">
                          <CalendarDays className="h-4 w-4 text-blue-600" />
                          <span className="font-medium text-blue-900">Check-in</span>
                        </div>
                        <div className="font-semibold text-blue-800">
                          {formatDate(booking.checkInDate || booking.dateFrom)}
                        </div>
                      </div>
                      <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                        <div className="flex items-center space-x-2 mb-1">
                          <CalendarDays className="h-4 w-4 text-purple-600" />
                          <span className="font-medium text-purple-900">Check-out</span>
                        </div>
                        <div className="font-semibold text-purple-800">
                          {formatDate(booking.checkOutDate || booking.dateTo)}
                        </div>
                      </div>
                    </div>

                    {/* Guest & Stay Details */}
                    <div className="grid grid-cols-3 gap-3 text-sm">
                      <div className="text-center p-2 bg-gray-50 rounded-lg">
                        <Users className="h-4 w-4 mx-auto mb-1 text-gray-600" />
                        <div className="font-medium text-gray-900">{(booking.adults || 0) + (booking.children || 0)}</div>
                        <div className="text-xs text-gray-500">Guests</div>
                      </div>
                      <div className="text-center p-2 bg-gray-50 rounded-lg">
                        <Building className="h-4 w-4 mx-auto mb-1 text-gray-600" />
                        <div className="font-medium text-gray-900">{booking.rooms || 0}</div>
                        <div className="text-xs text-gray-500">Rooms</div>
                      </div>
                      <div className="text-center p-2 bg-gray-50 rounded-lg">
                        <Clock className="h-4 w-4 mx-auto mb-1 text-gray-600" />
                        <div className="font-medium text-gray-900">{nights || 0}</div>
                        <div className="text-xs text-gray-500">Nights</div>
                      </div>
                    </div>

                    {/* Amount */}
                    <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <IndianRupee className="h-5 w-5 text-emerald-600" />
                          <span className="font-medium text-emerald-900">Total Amount</span>
                        </div>
                        <div className="text-xl font-bold text-emerald-600">
                          {formatCurrency(booking.totalAmount)}
                        </div>
                      </div>
                    </div>

                    {/* Special Requests */}
                    {booking.specialRequests && (
                      <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                        <div className="flex items-center space-x-2 mb-2">
                          <Bell className="h-4 w-4 text-yellow-600" />
                          <span className="font-medium text-yellow-900">Special Requests</span>
                        </div>
                        <div className="text-sm text-yellow-800 bg-yellow-100 p-2 rounded">
                          {booking.specialRequests}
                        </div>
                      </div>
                    )}

                    {/* Booking Meta */}
                    <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-gray-100">
                      <span>ID: {booking._id.slice(-8)}</span>
                      <span>Created: {formatDateTime(booking.createdAt)}</span>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            size="sm"
                            className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                            onClick={() => setSelectedBooking(booking)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View Details
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
                                  <div className="mt-1 text-sm">{selectedBooking.adults || 0}</div>
                                </div>
                                <div>
                                  <label className="text-sm font-medium text-gray-700">Children</label>
                                  <div className="mt-1 text-sm">{selectedBooking.children || 0}</div>
                                </div>
                                <div>
                                  <label className="text-sm font-medium text-gray-700">Rooms</label>
                                  <div className="mt-1 text-sm">{selectedBooking.rooms || 0}</div>
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
                          <SelectTrigger className="flex-1 border-gray-300 hover:bg-gray-50">
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

                    {isUpdating && (
                      <div className="absolute inset-0 bg-white/50 flex items-center justify-center rounded-lg">
                        <RefreshCw className="h-6 w-6 animate-spin text-green-600" />
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
        </div>
        )}

        {/* Room Availability Calendar Tab */}
        {activeTab === 'calendar' && (
          <div>
            <RoomAvailabilityCalendar propertyId={propertyId} />
          </div>
        )}

        {/* Room Allocation Tab */}
        {activeTab === 'allocation' && (
          <div>
            <RoomAllocationInterface
              propertyId={propertyId}
              onAllocationComplete={fetchBookingData}
            />
          </div>
        )}

        {/* Room Upgrades Tab */}
        {activeTab === 'upgrades' && (
          <div>
            <RoomUpgradeInterface propertyId={propertyId} />
          </div>
        )}

        {/* Room Status Tab */}
        {activeTab === 'room-status' && (
          <div>
            <RoomStatusManager propertyId={propertyId} />
          </div>
        )}

        {/* Payments Tab */}
        {activeTab === 'payments' && (
          <div>
            <PaymentProcessor propertyId={propertyId} />
          </div>
        )}

        {/* Communications Tab */}
        {activeTab === 'communications' && (
          <div>
            <CommunicationCenter propertyId={propertyId} />
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div>
            <AnalyticsDashboard propertyId={propertyId} />
          </div>
        )}

        {/* Front Desk Tab */}
        {activeTab === 'front-desk' && (
          <div>
            <FrontDeskOperations propertyId={propertyId} />
          </div>
        )}
      </div>

      {/* Booking Creation Dialog */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto m-4">
            <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
              <h2 className="text-xl font-semibold">Create New Booking</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowCreateForm(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <BookingCreationForm
              propertyId={propertyId}
              onClose={() => {
                setShowCreateForm(false)
                fetchBookingData() // Refresh data after creation
              }}
            />
          </div>
        </div>
      )}
      </div>
    </div>
  )
}