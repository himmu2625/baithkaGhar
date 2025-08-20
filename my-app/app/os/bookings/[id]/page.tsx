"use client"

import React, { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { useOSAuth } from "@/hooks/use-os-auth"
import { useRouter } from "next/navigation"
import { LoadingSpinner } from "@/components/os/common/loading-spinner"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  AlertTriangle,
  Calendar,
  Users,
  Search,
  Filter,
  Plus,
  Edit,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  Phone,
  Mail,
  MapPin,
  IndianRupee,
  CalendarDays,
  UserCheck,
  TrendingUp,
  LogIn,
  LogOut,
  Star,
  MessageSquare,
  CreditCard,
  Timer,
  BarChart3,
  CheckCircle2,
  AlertCircle,
  Zap,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Separator } from "@/components/ui/separator"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

interface BookingData {
  _id: string
  userId: {
    name: string
    email: string
    phone?: string
  }
  propertyId: string
  checkInDate: string
  checkOutDate: string
  totalGuests: number
  totalAmount: number
  status: string
  paymentStatus: string
  createdAt: string
  updatedAt: string
  guestDetails?: any
  specialRequests?: string
  roomPreferences?: string
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

export default function BookingManagementPage() {
  const params = useParams()
  const { user, isAuthenticated, isLoading } = useOSAuth()
  const router = useRouter()
  const [bookings, setBookings] = useState<BookingData[]>([])
  const [stats, setStats] = useState<BookingStats | null>(null)
  const [isLoadingData, setIsLoadingData] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [selectedBooking, setSelectedBooking] = useState<BookingData | null>(
    null
  )
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)

  const propertyId = (params as { id?: string } | null)?.id as string

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        setIsLoadingData(true)
        const response = await fetch(`/api/os/bookings/${propertyId}`)
        if (!response.ok) {
          throw new Error("Failed to fetch bookings")
        }
        const data = await response.json()
        setBookings(data.bookings)
        setStats(data.stats)
      } catch (error) {
        console.error("Error fetching bookings:", error)
        setError("Failed to load bookings")
      } finally {
        setIsLoadingData(false)
      }
    }

    if (propertyId && isAuthenticated) {
      fetchBookings()
    }
  }, [propertyId, isAuthenticated])

  // Authentication and access control
  useEffect(() => {
    if (!isLoading && isAuthenticated && user) {
      if (user.propertyId !== propertyId) {
        setError("You don't have access to this property")
      }
    } else if (!isLoading && !isAuthenticated) {
      router.push("/os/login")
    }
  }, [isLoading, isAuthenticated, user, propertyId, router])

  if (isLoading || isLoadingData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">Loading bookings...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="max-w-md w-full">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <div className="mt-4 text-center">
            <Button onClick={() => router.push("/os/login")} variant="outline">
              Return to login
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status?.toLowerCase()) {
      case "confirmed":
        return "default"
      case "pending":
        return "secondary"
      case "cancelled":
        return "destructive"
      case "completed":
        return "outline"
      default:
        return "outline"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case "confirmed":
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-600" />
      case "cancelled":
        return <XCircle className="h-4 w-4 text-red-600" />
      default:
        return <Clock className="h-4 w-4 text-gray-600" />
    }
  }

  const filteredBookings = bookings.filter((booking) => {
    const matchesSearch =
      booking.userId.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.userId.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking._id.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus =
      statusFilter === "all" || booking.status === statusFilter

    return matchesSearch && matchesStatus
  })

  const handleBookingClick = (booking: BookingData) => {
    setSelectedBooking(booking)
    setIsDetailsOpen(true)
  }

  const updateBookingStatus = async (bookingId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/os/bookings/${propertyId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          bookingId,
          status: newStatus,
        }),
      })

      if (response.ok) {
        // Refresh bookings
        const updatedBookings = bookings.map((booking) =>
          booking._id === bookingId
            ? { ...booking, status: newStatus }
            : booking
        )
        setBookings(updatedBookings)
      }
    } catch (error) {
      console.error("Error updating booking status:", error)
    }
  }

  return (
    <div className="space-y-8 animate-in fade-in-0 duration-300">
      {/* Enhanced Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 border border-blue-100/50">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-indigo-500/5 to-purple-500/5"></div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-300/20 to-purple-300/20 rounded-full blur-3xl transform translate-x-32 -translate-y-32"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-indigo-300/20 to-blue-300/20 rounded-full blur-2xl transform -translate-x-24 translate-y-24"></div>

        <div className="relative p-8">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-2">
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg flex items-center justify-center">
                    <Calendar className="h-6 w-6 text-white" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
                    <CheckCircle2 className="h-2 w-2 text-white" />
                  </div>
                </div>
        <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-700 bg-clip-text text-transparent">
            Booking Management
          </h1>
                  <p className="text-blue-600/80 font-medium">
            Manage all reservations and guest bookings
          </p>
        </div>
              </div>
            </div>

            <div className="mt-6 lg:mt-0 flex items-center space-x-3">
              <div className="hidden lg:flex items-center space-x-4 text-sm text-blue-600">
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="font-medium">Live System</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Timer className="h-4 w-4" />
                  <span>Real-time Updates</span>
                </div>
              </div>

              <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
            <Plus className="h-4 w-4 mr-2" />
            New Booking
          </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 group bg-gradient-to-br from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-indigo-500/10"></div>
            <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-semibold text-blue-800">
                Total Bookings
              </CardTitle>
              <div className="p-2 rounded-lg bg-blue-500/20 group-hover:bg-blue-500/30 transition-colors">
                <CalendarDays className="h-5 w-5 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent className="relative">
              <div className="text-3xl font-bold text-blue-900 mb-1">
                {stats.total}
              </div>
              <div className="flex items-center space-x-1">
                <BarChart3 className="h-3 w-3 text-blue-600" />
                <p className="text-xs text-blue-600 font-medium">This month</p>
              </div>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 group bg-gradient-to-br from-green-50 to-green-100 hover:from-green-100 hover:to-green-200">
            <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 to-emerald-500/10"></div>
            <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-semibold text-green-800">
                Confirmed
              </CardTitle>
              <div className="p-2 rounded-lg bg-green-500/20 group-hover:bg-green-500/30 transition-colors">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              </div>
            </CardHeader>
            <CardContent className="relative">
              <div className="text-3xl font-bold text-green-900 mb-1">
                {stats.confirmed}
              </div>
              <div className="space-y-1">
                <div className="flex items-center space-x-1">
                  <UserCheck className="h-3 w-3 text-green-600" />
                  <p className="text-xs text-green-600 font-medium">
                    Confirmed bookings
                  </p>
                </div>
                {stats.pending > 0 && (
                  <div className="flex items-center space-x-1">
                    <Clock className="h-3 w-3 text-amber-600" />
                    <p className="text-xs text-amber-600">
                {stats.pending} pending approval
              </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 group bg-gradient-to-br from-purple-50 to-purple-100 hover:from-purple-100 hover:to-purple-200">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-pink-500/10"></div>
            <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-semibold text-purple-800">
                Today's Activity
              </CardTitle>
              <div className="p-2 rounded-lg bg-purple-500/20 group-hover:bg-purple-500/30 transition-colors">
                <Users className="h-5 w-5 text-purple-600" />
              </div>
            </CardHeader>
            <CardContent className="relative">
              <div className="text-3xl font-bold text-purple-900 mb-1">
                {stats.todayArrivals + stats.todayDepartures}
              </div>
              <div className="space-y-1">
                <div className="flex items-center space-x-1">
                  <LogIn className="h-3 w-3 text-green-600" />
                  <p className="text-xs text-green-600 font-medium">
                    {stats.todayArrivals} arrivals
                  </p>
                </div>
                <div className="flex items-center space-x-1">
                  <LogOut className="h-3 w-3 text-orange-600" />
                  <p className="text-xs text-orange-600 font-medium">
                    {stats.todayDepartures} departures
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 group bg-gradient-to-br from-emerald-50 to-emerald-100 hover:from-emerald-100 hover:to-emerald-200">
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-teal-500/10"></div>
            <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-semibold text-emerald-800">
                Revenue
              </CardTitle>
              <div className="p-2 rounded-lg bg-emerald-500/20 group-hover:bg-emerald-500/30 transition-colors">
                <IndianRupee className="h-5 w-5 text-emerald-600" />
              </div>
            </CardHeader>
            <CardContent className="relative">
              <div className="text-3xl font-bold text-emerald-900 mb-1">
                {formatCurrency(stats.revenue)}
              </div>
              <div className="flex items-center space-x-1">
                <TrendingUp className="h-3 w-3 text-emerald-600" />
                <p className="text-xs text-emerald-600 font-medium">
                  Monthly revenue
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Enhanced Filters and Search */}
      <Card className="relative overflow-hidden border-0 shadow-lg bg-gradient-to-br from-slate-50 to-gray-100">
        <div className="absolute inset-0 bg-gradient-to-r from-slate-500/5 to-gray-500/5"></div>
        <CardHeader className="relative">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="p-2 rounded-lg bg-gradient-to-br from-slate-500/20 to-gray-500/20">
                <Filter className="h-5 w-5 text-slate-600" />
              </div>
              <CardTitle className="text-slate-800 font-semibold">
                Filters & Search
              </CardTitle>
            </div>
            <Badge
              variant="outline"
              className="text-slate-600 border-slate-300"
            >
              {filteredBookings.length} results
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="relative">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative group">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4 group-focus-within:text-blue-500 transition-colors" />
                <Input
                  placeholder="Search by guest name, email, or booking ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 border-slate-200 focus:border-blue-500 focus:ring-blue-500/20 bg-white/70 backdrop-blur-sm transition-all duration-200"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm("")}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    <XCircle className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
            <div className="relative">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-48 border-slate-200 focus:border-blue-500 focus:ring-blue-500/20 bg-white/70 backdrop-blur-sm">
                  <div className="flex items-center space-x-2">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        statusFilter === "confirmed"
                          ? "bg-green-500"
                          : statusFilter === "pending"
                          ? "bg-yellow-500"
                          : statusFilter === "cancelled"
                          ? "bg-red-500"
                          : statusFilter === "completed"
                          ? "bg-blue-500"
                          : "bg-slate-400"
                      }`}
                    ></div>
                <SelectValue placeholder="Filter by status" />
                  </div>
              </SelectTrigger>
              <SelectContent>
                  <SelectItem value="all">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 rounded-full bg-slate-400"></div>
                      <span>All Statuses</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="confirmed">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 rounded-full bg-green-500"></div>
                      <span>Confirmed</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="pending">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                      <span>Pending</span>
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
          </div>
        </CardContent>
      </Card>

      {/* Enhanced Booking Management */}
      <Accordion
        type="multiple"
        defaultValue={["bookings-list"]}
        className="w-full"
      >
        <AccordionItem
          value="bookings-list"
          className="border-0 shadow-lg rounded-xl overflow-hidden bg-gradient-to-br from-white to-slate-50"
        >
          <AccordionTrigger className="text-lg font-semibold hover:no-underline px-6 py-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100">
            <div className="flex items-center">
              <div className="p-2 rounded-lg bg-blue-500/20 mr-3">
                <Calendar className="h-5 w-5 text-blue-600" />
              </div>
              <span className="text-blue-800">All Bookings</span>
              <Badge
                variant="secondary"
                className="ml-3 bg-blue-100 text-blue-700 border-blue-200"
              >
                {filteredBookings.length}
              </Badge>
            </div>
          </AccordionTrigger>
          <AccordionContent className="p-0">
            <Card className="border-0 shadow-none">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                      <TableRow className="bg-gradient-to-r from-slate-50 to-gray-50 border-b border-slate-200">
                        <TableHead className="font-semibold text-slate-700">
                          Guest
                        </TableHead>
                        <TableHead className="font-semibold text-slate-700">
                          Booking ID
                        </TableHead>
                        <TableHead className="font-semibold text-slate-700">
                          Check-in
                        </TableHead>
                        <TableHead className="font-semibold text-slate-700">
                          Check-out
                        </TableHead>
                        <TableHead className="font-semibold text-slate-700">
                          Guests
                        </TableHead>
                        <TableHead className="font-semibold text-slate-700">
                          Amount
                        </TableHead>
                        <TableHead className="font-semibold text-slate-700">
                          Status
                        </TableHead>
                        <TableHead className="font-semibold text-slate-700">
                          Actions
                        </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                      {filteredBookings.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center py-12">
                            <div className="flex flex-col items-center space-y-3">
                              <div className="w-16 h-16 bg-gradient-to-br from-slate-100 to-slate-200 rounded-2xl flex items-center justify-center">
                                <Calendar className="h-8 w-8 text-slate-400" />
                              </div>
                              <div className="text-slate-500 font-medium">
                                No bookings found
                              </div>
                              <div className="text-sm text-slate-400">
                                Try adjusting your search or filters
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredBookings.map((booking, index) => (
                          <TableRow
                            key={booking._id}
                            className={`hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-indigo-50/50 transition-all duration-200 ${
                              index % 2 === 0 ? "bg-white" : "bg-slate-50/30"
                            }`}
                          >
                            <TableCell className="py-4">
                              <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                                  <span className="text-white font-bold text-sm">
                                    {booking.userId.name
                                      .charAt(0)
                                      .toUpperCase()}
                                  </span>
                                </div>
                          <div>
                                  <p className="font-semibold text-slate-800">
                                    {booking.userId.name}
                                  </p>
                                  <div className="flex items-center space-x-1">
                                    <Mail className="h-3 w-3 text-slate-400" />
                                    <p className="text-sm text-slate-600">
                              {booking.userId.email}
                            </p>
                                  </div>
                                </div>
                          </div>
                        </TableCell>
                        <TableCell>
                              <div className="flex items-center space-x-2">
                                <code className="text-xs bg-gradient-to-r from-slate-100 to-slate-200 px-3 py-1.5 rounded-lg font-mono text-slate-700 border border-slate-200">
                            {booking._id.slice(-8)}
                          </code>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center space-x-1">
                                <LogIn className="h-4 w-4 text-green-600" />
                                <span className="font-medium text-slate-700">
                                  {new Date(
                                    booking.checkInDate
                                  ).toLocaleDateString()}
                                </span>
                              </div>
                        </TableCell>
                        <TableCell>
                              <div className="flex items-center space-x-1">
                                <LogOut className="h-4 w-4 text-orange-600" />
                                <span className="font-medium text-slate-700">
                                  {new Date(
                                    booking.checkOutDate
                                  ).toLocaleDateString()}
                                </span>
                              </div>
                        </TableCell>
                        <TableCell>
                              <div className="flex items-center space-x-1">
                                <Users className="h-4 w-4 text-purple-600" />
                                <span className="font-semibold text-slate-700">
                                  {booking.totalGuests}
                                </span>
                              </div>
                        </TableCell>
                        <TableCell>
                              <div className="flex items-center space-x-1">
                                <IndianRupee className="h-4 w-4 text-emerald-600" />
                                <span className="font-bold text-emerald-700">
                          {formatCurrency(booking.totalAmount)}
                                </span>
                              </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            {getStatusIcon(booking.status)}
                            <Badge
                                  variant={getStatusBadgeVariant(
                                    booking.status
                                  )}
                                  className="font-medium"
                            >
                              {booking.status}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleBookingClick(booking)}
                                  className="border-slate-200 hover:border-blue-300 hover:bg-blue-50 transition-all duration-200"
                            >
                                  <Eye className="h-4 w-4 text-slate-600" />
                            </Button>
                            <Select
                              value={booking.status}
                              onValueChange={(value) =>
                                updateBookingStatus(booking._id, value)
                              }
                            >
                                  <SelectTrigger className="w-28 h-8 text-xs border-slate-200 hover:border-blue-300 transition-colors">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                    <SelectItem value="pending">
                                      <div className="flex items-center space-x-2">
                                        <Clock className="h-3 w-3 text-yellow-600" />
                                        <span>Pending</span>
                                      </div>
                                    </SelectItem>
                                <SelectItem value="confirmed">
                                      <div className="flex items-center space-x-2">
                                        <CheckCircle2 className="h-3 w-3 text-green-600" />
                                        <span>Confirmed</span>
                                      </div>
                                </SelectItem>
                                <SelectItem value="cancelled">
                                      <div className="flex items-center space-x-2">
                                        <XCircle className="h-3 w-3 text-red-600" />
                                        <span>Cancelled</span>
                                      </div>
                                </SelectItem>
                                <SelectItem value="completed">
                                      <div className="flex items-center space-x-2">
                                        <CheckCircle className="h-3 w-3 text-blue-600" />
                                        <span>Completed</span>
                                      </div>
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </TableCell>
                      </TableRow>
                        ))
                      )}
                  </TableBody>
                </Table>
                </div>
              </CardContent>
            </Card>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {/* Enhanced Booking Details Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="relative pb-6">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 rounded-t-lg -m-6 mb-0"></div>
            <div className="relative flex items-center space-x-4">
              {selectedBooking && (
                <>
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                    <span className="text-white font-bold text-xl">
                      {selectedBooking.userId.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <DialogTitle className="text-2xl font-bold text-slate-800 mb-1">
                      {selectedBooking.userId.name}'s Booking
                    </DialogTitle>
                    <div className="flex items-center space-x-2">
                      <code className="text-sm bg-slate-200 px-2 py-1 rounded font-mono text-slate-700">
                        #{selectedBooking._id.slice(-8)}
                      </code>
                      <div className="flex items-center space-x-1">
                        {getStatusIcon(selectedBooking.status)}
                        <Badge
                          variant={getStatusBadgeVariant(
                            selectedBooking.status
                          )}
                        >
                          {selectedBooking.status}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </DialogHeader>

          {selectedBooking && (
            <div className="space-y-8">
              {/* Guest and Booking Information Cards */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100">
                  <CardHeader className="flex flex-row items-center space-y-0 pb-3">
                    <div className="p-2 rounded-lg bg-blue-500/20 mr-3">
                      <Users className="h-5 w-5 text-blue-600" />
                    </div>
                    <CardTitle className="text-blue-800">
                      Guest Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center space-x-3 p-3 bg-white/70 rounded-lg">
                      <Users className="h-4 w-4 text-blue-600" />
                <div>
                        <p className="font-semibold text-slate-800">
                      {selectedBooking.userId.name}
                    </p>
                        <p className="text-sm text-slate-600">Guest Name</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3 p-3 bg-white/70 rounded-lg">
                      <Mail className="h-4 w-4 text-blue-600" />
                      <div>
                        <p className="font-medium text-slate-800">
                      {selectedBooking.userId.email}
                    </p>
                        <p className="text-sm text-slate-600">Email Address</p>
                      </div>
                    </div>
                    {selectedBooking.userId.phone && (
                      <div className="flex items-center space-x-3 p-3 bg-white/70 rounded-lg">
                        <Phone className="h-4 w-4 text-blue-600" />
                        <div>
                          <p className="font-medium text-slate-800">
                        {selectedBooking.userId.phone}
                      </p>
                          <p className="text-sm text-slate-600">Phone Number</p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-green-100">
                  <CardHeader className="flex flex-row items-center space-y-0 pb-3">
                    <div className="p-2 rounded-lg bg-green-500/20 mr-3">
                      <Calendar className="h-5 w-5 text-green-600" />
                  </div>
                    <CardTitle className="text-green-800">
                      Booking Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center space-x-3 p-3 bg-white/70 rounded-lg">
                      <LogIn className="h-4 w-4 text-green-600" />
                <div>
                        <p className="font-semibold text-slate-800">
                      {new Date(
                        selectedBooking.checkInDate
                      ).toLocaleDateString()}
                    </p>
                        <p className="text-sm text-slate-600">Check-in Date</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3 p-3 bg-white/70 rounded-lg">
                      <LogOut className="h-4 w-4 text-orange-600" />
                      <div>
                        <p className="font-semibold text-slate-800">
                      {new Date(
                        selectedBooking.checkOutDate
                      ).toLocaleDateString()}
                    </p>
                        <p className="text-sm text-slate-600">Check-out Date</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3 p-3 bg-white/70 rounded-lg">
                      <Users className="h-4 w-4 text-purple-600" />
                      <div>
                        <p className="font-semibold text-slate-800">
                          {selectedBooking.totalGuests} Guests
                        </p>
                        <p className="text-sm text-slate-600">Total Guests</p>
                  </div>
                </div>
                  </CardContent>
                </Card>
              </div>

              {/* Payment and Status Information */}
              <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-purple-100">
                <CardHeader className="flex flex-row items-center space-y-0 pb-3">
                  <div className="p-2 rounded-lg bg-purple-500/20 mr-3">
                    <CreditCard className="h-5 w-5 text-purple-600" />
                  </div>
                  <CardTitle className="text-purple-800">
                    Payment & Status
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 bg-white/70 rounded-lg text-center">
                      <div className="flex items-center justify-center space-x-2 mb-2">
                        <IndianRupee className="h-6 w-6 text-emerald-600" />
                        <span className="text-2xl font-bold text-emerald-700">
                          {formatCurrency(selectedBooking.totalAmount)}
                        </span>
                      </div>
                      <p className="text-sm text-slate-600">Total Amount</p>
                    </div>
                    <div className="p-4 bg-white/70 rounded-lg text-center">
                      <div className="flex items-center justify-center mb-2">
                    {getStatusIcon(selectedBooking.status)}
                      </div>
                    <Badge
                      variant={getStatusBadgeVariant(selectedBooking.status)}
                        className="mb-1"
                    >
                      {selectedBooking.status}
                    </Badge>
                      <p className="text-sm text-slate-600">Booking Status</p>
                    </div>
                    <div className="p-4 bg-white/70 rounded-lg text-center">
                      <div className="flex items-center justify-center mb-2">
                        <CreditCard className="h-6 w-6 text-blue-600" />
                  </div>
                      <Badge variant="outline" className="mb-1">
                        {selectedBooking.paymentStatus || "pending"}
                  </Badge>
                      <p className="text-sm text-slate-600">Payment Status</p>
                </div>
              </div>
                </CardContent>
              </Card>

              {/* Special Requests */}
              {selectedBooking.specialRequests && (
                <Card className="border-0 shadow-lg bg-gradient-to-br from-amber-50 to-amber-100">
                  <CardHeader className="flex flex-row items-center space-y-0 pb-3">
                    <div className="p-2 rounded-lg bg-amber-500/20 mr-3">
                      <MessageSquare className="h-5 w-5 text-amber-600" />
                    </div>
                    <CardTitle className="text-amber-800">
                      Special Requests
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="p-4 bg-white/70 rounded-lg">
                      <p className="text-slate-700">
                      {selectedBooking.specialRequests}
                    </p>
                  </div>
                  </CardContent>
                </Card>
              )}

              {/* Action Buttons */}
              <div className="flex justify-end space-x-3 pt-4 border-t border-slate-200">
                <Button
                  variant="outline"
                  className="border-slate-300 hover:border-blue-400 hover:bg-blue-50 transition-all duration-200"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Booking
                </Button>
                <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-300">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Contact Guest
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
