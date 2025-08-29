"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Calendar,
  Search,
  Filter,
  MoreVertical,
  Eye,
  MessageCircle,
  Phone,
  CheckCircle,
  XCircle,
  Clock,
  IndianRupee,
  MapPin,
  Users,
  Menu,
  Plus,
  RefreshCw,
  TrendingUp,
  AlertTriangle,
  Home
} from "lucide-react"
import { format } from "date-fns"
import { toast } from "@/hooks/use-toast"

interface Booking {
  _id: string
  bookingCode: string
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed'
  paymentStatus: 'paid' | 'pending' | 'refunded' | 'failed'
  dateFrom: string
  dateTo: string
  guests: number
  totalPrice: number
  property: {
    id: string
    title: string
    location: string
  }
  user: {
    id: string
    name: string
    email: string
  }
  createdAt: string
}

interface QuickStats {
  todayBookings: number
  todayRevenue: number
  pendingApprovals: number
  occupancyRate: number
}

export default function MobileBookingInterface() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [filteredBookings, setFilteredBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
  const [showBookingDetails, setShowBookingDetails] = useState(false)
  const [showCancelDialog, setShowCancelDialog] = useState(false)
  const [quickStats, setQuickStats] = useState<QuickStats>({
    todayBookings: 0,
    todayRevenue: 0,
    pendingApprovals: 0,
    occupancyRate: 0
  })

  useEffect(() => {
    fetchBookings()
    fetchQuickStats()
  }, [])

  useEffect(() => {
    filterBookings()
  }, [bookings, activeTab, searchQuery])

  const fetchBookings = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/bookings?limit=50')
      
      if (response.ok) {
        const data = await response.json()
        setBookings(data.bookings || [])
      } else {
        throw new Error('Failed to fetch bookings')
      }
    } catch (error: any) {
      console.error('Error fetching bookings:', error)
      toast({
        title: "Error",
        description: "Failed to load bookings",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchQuickStats = async () => {
    try {
      const response = await fetch('/api/admin/analytics/bookings?timeframe=1')
      
      if (response.ok) {
        const data = await response.json()
        setQuickStats({
          todayBookings: data.overview?.totalBookings || 0,
          todayRevenue: data.overview?.totalRevenue || 0,
          pendingApprovals: data.statusBreakdown?.pending?.count || 0,
          occupancyRate: 85 // Mock data - would be calculated from real occupancy
        })
      }
    } catch (error) {
      console.error('Error fetching quick stats:', error)
    }
  }

  const filterBookings = () => {
    let filtered = [...bookings]

    // Filter by status
    if (activeTab !== "all") {
      filtered = filtered.filter(booking => booking.status === activeTab)
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(booking =>
        booking.bookingCode.toLowerCase().includes(query) ||
        booking.user.name.toLowerCase().includes(query) ||
        booking.property.title.toLowerCase().includes(query)
      )
    }

    setFilteredBookings(filtered)
  }

  const handleBookingAction = async (action: string, bookingId: string) => {
    try {
      let endpoint = ''
      let method = 'PATCH'
      let body: any = {}

      switch (action) {
        case 'confirm':
          body = { status: 'confirmed' }
          break
        case 'cancel':
          body = { status: 'cancelled' }
          break
        case 'complete':
          body = { status: 'completed' }
          break
        default:
          return
      }

      const response = await fetch(`/api/bookings/${bookingId}`, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      if (response.ok) {
        await fetchBookings()
        toast({
          title: "Success",
          description: `Booking ${action}ed successfully`,
        })
        setShowCancelDialog(false)
      } else {
        throw new Error(`Failed to ${action} booking`)
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      })
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800 border-green-200'
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200'
      case 'completed': return 'bg-blue-100 text-blue-800 border-blue-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getPaymentStatusIcon = (status: string) => {
    switch (status) {
      case 'paid': return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'pending': return <Clock className="h-4 w-4 text-yellow-600" />
      case 'failed': return <XCircle className="h-4 w-4 text-red-600" />
      case 'refunded': return <RefreshCw className="h-4 w-4 text-purple-600" />
      default: return <Clock className="h-4 w-4 text-gray-600" />
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount)
  }

  const calculateNights = (checkIn: string, checkOut: string) => {
    const start = new Date(checkIn)
    const end = new Date(checkOut)
    return Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Mobile Header */}
      <div className="bg-white shadow-sm sticky top-0 z-40">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-xl font-bold">Bookings</h1>
              <p className="text-sm text-gray-600">{filteredBookings.length} bookings</p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={fetchBookings}>
                <RefreshCw className="h-4 w-4" />
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <Menu className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Quick Actions</DropdownMenuLabel>
                  <DropdownMenuItem>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Booking
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <TrendingUp className="h-4 w-4 mr-2" />
                    View Analytics
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <Filter className="h-4 w-4 mr-2" />
                    Advanced Filters
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
            <Input
              placeholder="Search bookings..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
      </div>

      {/* Quick Stats Cards */}
      <div className="px-4 py-4">
        <div className="grid grid-cols-2 gap-3">
          <Card className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600">Today</p>
                <p className="text-lg font-bold">{quickStats.todayBookings}</p>
              </div>
              <Calendar className="h-5 w-5 text-blue-500" />
            </div>
          </Card>
          
          <Card className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600">Revenue</p>
                <p className="text-lg font-bold">{formatCurrency(quickStats.todayRevenue)}</p>
              </div>
              <IndianRupee className="h-5 w-5 text-green-500" />
            </div>
          </Card>
          
          <Card className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600">Pending</p>
                <p className="text-lg font-bold">{quickStats.pendingApprovals}</p>
              </div>
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
            </div>
          </Card>
          
          <Card className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600">Occupancy</p>
                <p className="text-lg font-bold">{quickStats.occupancyRate}%</p>
              </div>
              <TrendingUp className="h-5 w-5 text-purple-500" />
            </div>
          </Card>
        </div>
      </div>

      {/* Status Tabs */}
      <div className="px-4 mb-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="all" className="text-xs">All</TabsTrigger>
            <TabsTrigger value="pending" className="text-xs">Pending</TabsTrigger>
            <TabsTrigger value="confirmed" className="text-xs">Confirmed</TabsTrigger>
            <TabsTrigger value="completed" className="text-xs">Completed</TabsTrigger>
            <TabsTrigger value="cancelled" className="text-xs">Cancelled</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Bookings List */}
      <div className="px-4 space-y-3">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map(i => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-4">
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredBookings.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-600 mb-2">No Bookings Found</h3>
              <p className="text-gray-500">
                {searchQuery ? "No bookings match your search criteria" : "No bookings available"}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredBookings.map((booking) => (
            <Card key={booking._id} className="shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-sm">{booking.bookingCode}</h3>
                      <Badge className={`text-xs px-2 py-0 ${getStatusColor(booking.status)}`}>
                        {booking.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-600 mb-1">
                      {booking.user.name}
                    </p>
                    <div className="flex items-center text-xs text-gray-500">
                      <Home className="h-3 w-3 mr-1" />
                      <span className="truncate">{booking.property.title}</span>
                    </div>
                  </div>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => {
                          setSelectedBooking(booking)
                          setShowBookingDetails(true)
                        }}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <MessageCircle className="h-4 w-4 mr-2" />
                        Message Guest
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Phone className="h-4 w-4 mr-2" />
                        Call Guest
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      {booking.status === 'pending' && (
                        <DropdownMenuItem
                          onClick={() => handleBookingAction('confirm', booking._id)}
                          className="text-green-600"
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Confirm
                        </DropdownMenuItem>
                      )}
                      {['pending', 'confirmed'].includes(booking.status) && (
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedBooking(booking)
                            setShowCancelDialog(true)
                          }}
                          className="text-red-600"
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          Cancel
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <div className="flex items-center text-gray-500 mb-1">
                      <Calendar className="h-3 w-3 mr-1" />
                      <span>Check-in</span>
                    </div>
                    <p className="font-medium">{format(new Date(booking.dateFrom), 'MMM dd')}</p>
                  </div>
                  <div>
                    <div className="flex items-center text-gray-500 mb-1">
                      <Calendar className="h-3 w-3 mr-1" />
                      <span>Check-out</span>
                    </div>
                    <p className="font-medium">{format(new Date(booking.dateTo), 'MMM dd')}</p>
                  </div>
                </div>

                <Separator className="my-3" />

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    {getPaymentStatusIcon(booking.paymentStatus)}
                    <span className="text-xs text-gray-600">{booking.paymentStatus}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center text-xs text-gray-500">
                      <Users className="h-3 w-3 mr-1" />
                      <span>{booking.guests} guests</span>
                    </div>
                    <div className="font-semibold text-sm">
                      {formatCurrency(booking.totalPrice)}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Booking Details Sheet */}
      <Sheet open={showBookingDetails} onOpenChange={setShowBookingDetails}>
        <SheetContent side="bottom" className="h-[90vh]">
          <SheetHeader>
            <SheetTitle>Booking Details</SheetTitle>
            <SheetDescription>
              {selectedBooking?.bookingCode} • {selectedBooking?.user.name}
            </SheetDescription>
          </SheetHeader>
          
          {selectedBooking && (
            <ScrollArea className="h-[calc(90vh-120px)] mt-6">
              <div className="space-y-6">
                {/* Status and Actions */}
                <div className="flex items-center justify-between">
                  <Badge className={`${getStatusColor(selectedBooking.status)} px-3 py-1`}>
                    {selectedBooking.status}
                  </Badge>
                  <div className="flex gap-2">
                    {selectedBooking.status === 'pending' && (
                      <Button 
                        size="sm" 
                        onClick={() => handleBookingAction('confirm', selectedBooking._id)}
                      >
                        Confirm
                      </Button>
                    )}
                    <Button variant="outline" size="sm">
                      <MessageCircle className="h-4 w-4 mr-2" />
                      Message
                    </Button>
                  </div>
                </div>

                {/* Guest Information */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Guest Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <Label className="text-xs text-gray-500">Name</Label>
                      <p className="font-medium">{selectedBooking.user.name}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-gray-500">Email</Label>
                      <p className="font-medium">{selectedBooking.user.email}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-gray-500">Guests</Label>
                      <p className="font-medium">{selectedBooking.guests} guests</p>
                    </div>
                  </CardContent>
                </Card>

                {/* Stay Details */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Stay Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <Label className="text-xs text-gray-500">Property</Label>
                      <p className="font-medium">{selectedBooking.property.title}</p>
                      <div className="flex items-center text-sm text-gray-600 mt-1">
                        <MapPin className="h-3 w-3 mr-1" />
                        {selectedBooking.property.location}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-xs text-gray-500">Check-in</Label>
                        <p className="font-medium">
                          {format(new Date(selectedBooking.dateFrom), 'MMM dd, yyyy')}
                        </p>
                      </div>
                      <div>
                        <Label className="text-xs text-gray-500">Check-out</Label>
                        <p className="font-medium">
                          {format(new Date(selectedBooking.dateTo), 'MMM dd, yyyy')}
                        </p>
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs text-gray-500">Duration</Label>
                      <p className="font-medium">
                        {calculateNights(selectedBooking.dateFrom, selectedBooking.dateTo)} nights
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Payment Information */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Payment Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span>Payment Status</span>
                      <div className="flex items-center gap-1">
                        {getPaymentStatusIcon(selectedBooking.paymentStatus)}
                        <span className="font-medium">{selectedBooking.paymentStatus}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Total Amount</span>
                      <span className="font-bold text-lg">
                        {formatCurrency(selectedBooking.totalPrice)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm text-gray-600">
                      <span>Booked On</span>
                      <span>{format(new Date(selectedBooking.createdAt), 'MMM dd, yyyy')}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </ScrollArea>
          )}
        </SheetContent>
      </Sheet>

      {/* Cancel Confirmation Dialog */}
      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Booking</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel booking {selectedBooking?.bookingCode}?
              This action will process a refund if applicable.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Booking</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => selectedBooking && handleBookingAction('cancel', selectedBooking._id)}
              className="bg-red-600 hover:bg-red-700"
            >
              Cancel Booking
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}