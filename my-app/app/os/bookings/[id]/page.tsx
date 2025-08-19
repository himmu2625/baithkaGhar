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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Booking Management
          </h1>
          <p className="text-gray-600 mt-2">
            Manage all reservations and guest bookings
          </p>
        </div>
        <div className="mt-4 lg:mt-0">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Booking
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Bookings
              </CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">This month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Confirmed</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.confirmed}</div>
              <p className="text-xs text-muted-foreground">
                {stats.pending} pending approval
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Today's Activity
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.todayArrivals + stats.todayDepartures}
              </div>
              <p className="text-xs text-muted-foreground">
                {stats.todayArrivals} arrivals, {stats.todayDepartures}{" "}
                departures
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Revenue</CardTitle>
              <IndianRupee className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(stats.revenue)}
              </div>
              <p className="text-xs text-muted-foreground">This month</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle>Filters & Search</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search by guest name, email, or booking ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Booking Management with Accordions */}
      <Accordion
        type="multiple"
        defaultValue={["bookings-list"]}
        className="w-full"
      >
        <AccordionItem value="bookings-list">
          <AccordionTrigger className="text-lg font-semibold">
            <div className="flex items-center">
              <Calendar className="h-5 w-5 mr-2" />
              All Bookings
              <Badge variant="secondary" className="ml-2">
                {filteredBookings.length}
              </Badge>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Guest</TableHead>
                      <TableHead>Booking ID</TableHead>
                      <TableHead>Check-in</TableHead>
                      <TableHead>Check-out</TableHead>
                      <TableHead>Guests</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredBookings.map((booking) => (
                      <TableRow key={booking._id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{booking.userId.name}</p>
                            <p className="text-sm text-gray-600">
                              {booking.userId.email}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                            {booking._id.slice(-8)}
                          </code>
                        </TableCell>
                        <TableCell>
                          {new Date(booking.checkInDate).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          {new Date(booking.checkOutDate).toLocaleDateString()}
                        </TableCell>
                        <TableCell>{booking.totalGuests}</TableCell>
                        <TableCell>
                          {formatCurrency(booking.totalAmount)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            {getStatusIcon(booking.status)}
                            <Badge
                              variant={getStatusBadgeVariant(booking.status)}
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
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Select
                              value={booking.status}
                              onValueChange={(value) =>
                                updateBookingStatus(booking._id, value)
                              }
                            >
                              <SelectTrigger className="w-24">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="pending">Pending</SelectItem>
                                <SelectItem value="confirmed">
                                  Confirmed
                                </SelectItem>
                                <SelectItem value="cancelled">
                                  Cancelled
                                </SelectItem>
                                <SelectItem value="completed">
                                  Completed
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {/* Booking Details Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Booking Details</DialogTitle>
          </DialogHeader>
          {selectedBooking && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium">Guest Information</h4>
                  <div className="mt-2 space-y-1">
                    <p className="flex items-center text-sm">
                      <Users className="h-4 w-4 mr-2" />
                      {selectedBooking.userId.name}
                    </p>
                    <p className="flex items-center text-sm">
                      <Mail className="h-4 w-4 mr-2" />
                      {selectedBooking.userId.email}
                    </p>
                    {selectedBooking.userId.phone && (
                      <p className="flex items-center text-sm">
                        <Phone className="h-4 w-4 mr-2" />
                        {selectedBooking.userId.phone}
                      </p>
                    )}
                  </div>
                </div>
                <div>
                  <h4 className="font-medium">Booking Information</h4>
                  <div className="mt-2 space-y-1">
                    <p className="text-sm">
                      <strong>Check-in:</strong>{" "}
                      {new Date(
                        selectedBooking.checkInDate
                      ).toLocaleDateString()}
                    </p>
                    <p className="text-sm">
                      <strong>Check-out:</strong>{" "}
                      {new Date(
                        selectedBooking.checkOutDate
                      ).toLocaleDateString()}
                    </p>
                    <p className="text-sm">
                      <strong>Guests:</strong> {selectedBooking.totalGuests}
                    </p>
                    <p className="text-sm">
                      <strong>Amount:</strong>{" "}
                      {formatCurrency(selectedBooking.totalAmount)}
                    </p>
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <h4 className="font-medium">Status & Payment</h4>
                <div className="mt-2 flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(selectedBooking.status)}
                    <Badge
                      variant={getStatusBadgeVariant(selectedBooking.status)}
                    >
                      {selectedBooking.status}
                    </Badge>
                  </div>
                  <Badge variant="outline">
                    Payment: {selectedBooking.paymentStatus || "pending"}
                  </Badge>
                </div>
              </div>

              {selectedBooking.specialRequests && (
                <>
                  <Separator />
                  <div>
                    <h4 className="font-medium">Special Requests</h4>
                    <p className="text-sm text-gray-600 mt-1">
                      {selectedBooking.specialRequests}
                    </p>
                  </div>
                </>
              )}

              <Separator />

              <div className="flex justify-end space-x-2">
                <Button variant="outline">Edit Booking</Button>
                <Button>Contact Guest</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
