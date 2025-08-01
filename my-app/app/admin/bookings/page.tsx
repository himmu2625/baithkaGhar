"use client"

export const dynamic = 'force-dynamic';

import { useState, useEffect } from "react"
import { ColumnDef } from "@tanstack/react-table"
import { 
  MoreHorizontal, 
  Download, 
  Calendar, 
  FileText, 
  Eye, 
  Home, 
  User, 
  IndianRupee, 
  X, 
  Filter,
  Search,
  Clock,
  Check
} from "lucide-react"
import { format } from "date-fns"
import { DataTable } from "@/components/ui/data-table"
import { Button } from "@/components/ui/button"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog"
import { toast } from "@/hooks/use-toast"

// Booking type definition
interface Booking {
  id: string
  bookingCode?: string // Add formatted booking code for display
  propertyId: string
  propertyName: string
  propertyLocation: {
    city: string
    state: string
  }
  guestId: string
  guestName: string
  guestEmail: string
  checkIn: string
  checkOut: string
  guests: {
    adults: number
    children: number
  }
  status: 'confirmed' | 'pending' | 'cancelled' | 'completed'
  paymentStatus: 'paid' | 'pending' | 'refunded' | 'failed'
  totalAmount: number
  createdAt: string
}

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("all")
  const [filteredBookings, setFilteredBookings] = useState<Booking[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [paymentFilter, setPaymentFilter] = useState("all")
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [analytics, setAnalytics] = useState({
    total: 0,
    pending: 0,
    thisMonth: {
      bookings: 0,
      revenue: 0
    },
    avgConfirmation: 0
  })
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalBookings, setTotalBookings] = useState(0)
  const [pageSize, setPageSize] = useState(50)
  const [cancellingBooking, setCancellingBooking] = useState<string | null>(null)

  // Function to cancel a booking
  const cancelBooking = async (bookingId: string) => {
    if (!confirm('Are you sure you want to cancel this booking? This action cannot be undone.')) {
      return
    }

    setCancellingBooking(bookingId)
    
    try {
      console.log('[Admin Bookings] Cancelling booking:', bookingId)
      
      const response = await fetch(`/api/bookings/${bookingId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Include cookies/session
        body: JSON.stringify({ status: 'cancelled' }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to cancel booking')
      }

      const cancelledBooking = await response.json()
      console.log('[Admin Bookings] Booking cancelled successfully:', cancelledBooking)

      // Find the booking in current list to get the bookingCode
      const currentBooking = bookings.find(b => b.id === bookingId)
      const bookingCode = currentBooking?.bookingCode || bookingId

      // Update the bookings list
      setBookings(prevBookings => 
        prevBookings.map(booking => 
          booking.id === bookingId 
            ? { ...booking, status: 'cancelled' as const }
            : booking
        )
      )

      // Show refund information if refund was processed
      if (cancelledBooking.refund && cancelledBooking.refund.processed) {
        toast({
          title: "Booking Cancelled with Refund",
          description: `Booking ${bookingCode} has been cancelled and refund of ₹${cancelledBooking.refund.amount.toLocaleString()} has been initiated.`,
          variant: "default",
        })
      } else {
        toast({
          title: "Booking Cancelled",
          description: `Booking ${bookingCode} has been cancelled successfully.`,
          variant: "default",
        })
      }
    } catch (error: any) {
      console.error('[Admin Bookings] Error cancelling booking:', error)
      toast({
        title: "Cancellation Failed",
        description: error.message || "Failed to cancel booking. Please try again.",
        variant: "destructive",
      })
    } finally {
      setCancellingBooking(null)
    }
  }
  
  // Fetch real booking data from API
  useEffect(() => {
    const fetchBookings = async () => {
      try {
        setLoading(true);
        console.log("[AdminBookings] Fetching bookings from API...");
        
        // Build query parameters
        const params = new URLSearchParams({
          page: currentPage.toString(),
          limit: pageSize.toString(),
          timestamp: Date.now().toString()
        });
        
        // Add filters to query
        if (activeTab !== "all") {
          params.append('status', activeTab);
        }
        
        if (paymentFilter !== "all") {
          params.append('paymentStatus', paymentFilter);
        }
        
        if (searchTerm) {
          params.append('search', searchTerm);
        }
        
        const response = await fetch(`/api/admin/bookings?${params.toString()}`);
        console.log("[AdminBookings] API response status:", response.status);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error("[AdminBookings] API error:", errorText);
          throw new Error(`Failed to fetch bookings: ${response.status}`);
        }
        
        const data = await response.json();
        console.log("[AdminBookings] API response data:", data);
        
        if (data.bookings && Array.isArray(data.bookings)) {
          // Transform API data to match component interface
          const transformedBookings: Booking[] = data.bookings.map((booking: any) => ({
            id: booking._id, // Use the real MongoDB _id for API calls
            bookingCode: booking.bookingCode, // Keep the formatted code for display
            propertyId: booking.property?.id || booking.propertyId,
            propertyName: booking.property?.title || booking.propertyName || 'Unknown Property',
            propertyLocation: {
              city: booking.property?.location || 'Unknown City',
              state: 'Unknown State'
            },
            guestId: booking.user?.id || booking.userId,
            guestName: booking.user?.name || booking.contactDetails?.name || 'Unknown Guest',
            guestEmail: booking.user?.email || booking.contactDetails?.email || 'Unknown Email',
            checkIn: booking.startDate || booking.dateFrom,
            checkOut: booking.endDate || booking.dateTo,
            guests: {
              adults: booking.guestCount || booking.guests || 1,
              children: 0
            },
            status: booking.status || 'confirmed',
            paymentStatus: booking.payment?.status || 'paid',
            totalAmount: booking.payment?.amount || booking.totalPrice || 0,
            createdAt: booking.createdAt
          }));
          
          console.log("[AdminBookings] Transformed bookings:", transformedBookings);
          setBookings(transformedBookings);
          
          // Update pagination info
          if (data.pagination) {
            setTotalPages(data.pagination.pages);
            setTotalBookings(data.pagination.total);
          }
          
          // Calculate analytics from the data
          const total = data.pagination?.total || transformedBookings.length;
          const pending = transformedBookings.filter(b => b.status === 'pending').length;
          
          // Calculate this month's data
          const now = new Date();
          const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
          const thisMonthBookings = transformedBookings.filter(b => 
            new Date(b.createdAt) >= thisMonthStart
          );
          const thisMonthRevenue = thisMonthBookings.reduce((sum, b) => sum + b.totalAmount, 0);
          
          setAnalytics({
            total,
            pending,
            thisMonth: {
              bookings: thisMonthBookings.length,
              revenue: thisMonthRevenue
            },
            avgConfirmation: 2 // Placeholder - could be calculated from actual data
          });
        } else {
          console.log("[AdminBookings] No bookings found in response");
          setBookings([]);
        }
      } catch (error) {
        console.error("[AdminBookings] Error fetching bookings:", error);
        toast({
          title: "Error",
          description: "Failed to load bookings. Please try again.",
          variant: "destructive"
        });
        setBookings([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchBookings();
  }, [currentPage, pageSize, activeTab, paymentFilter, searchTerm]);
  
  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, paymentFilter, searchTerm]);
  
  // Filter bookings based on active tab, search term, and payment status
  useEffect(() => {
    let filtered = [...bookings]
    
    // Apply booking status filter based on tab
    if (activeTab !== "all") {
      filtered = filtered.filter(booking => booking.status === activeTab)
    }
    
    // Apply payment status filter
    if (paymentFilter !== "all") {
      filtered = filtered.filter(booking => booking.paymentStatus === paymentFilter)
    }
    
    // Apply search filter
    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase()
      filtered = filtered.filter(
        booking => 
          (booking.bookingCode || booking.id).toLowerCase().includes(lowerSearch) || 
          booking.propertyName.toLowerCase().includes(lowerSearch) ||
          booking.guestName.toLowerCase().includes(lowerSearch) ||
          booking.guestEmail.toLowerCase().includes(lowerSearch)
      )
    }
    
    setFilteredBookings(filtered)
  }, [activeTab, searchTerm, paymentFilter, bookings])
  
  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount)
  }
  
  // Format date range
  const formatDateRange = (checkIn: string, checkOut: string) => {
    return `${format(new Date(checkIn), 'dd MMM yyyy')} - ${format(new Date(checkOut), 'dd MMM yyyy')}`
  }
  
  // Calculate number of nights
  const calculateNights = (checkIn: string, checkOut: string) => {
    const start = new Date(checkIn)
    const end = new Date(checkOut)
    return Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
  }
  
  // Status badge component
  const StatusBadge = ({ status }: { status: Booking['status'] }) => {
    switch (status) {
      case 'confirmed':
        return <Badge className="bg-green-600 hover:bg-green-700">Confirmed</Badge>
      case 'pending':
        return <Badge className="bg-yellow-600 hover:bg-yellow-700">Pending</Badge>
      case 'cancelled':
        return <Badge className="bg-red-600 hover:bg-red-700">Cancelled</Badge>
      case 'completed':
        return <Badge className="bg-blue-600 hover:bg-blue-700">Completed</Badge>
      default:
        return null
    }
  }
  
  // Payment status badge component
  const PaymentBadge = ({ status }: { status: Booking['paymentStatus'] }) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-emerald-600 hover:bg-emerald-700">Paid</Badge>
      case 'pending':
        return <Badge className="bg-amber-600 hover:bg-amber-700">Pending</Badge>
      case 'refunded':
        return <Badge className="bg-purple-600 hover:bg-purple-700">Refunded</Badge>
      case 'failed':
        return <Badge className="bg-rose-600 hover:bg-rose-700">Failed</Badge>
      default:
        return null
    }
  }
  
  // Table columns definition
  const columns: ColumnDef<Booking>[] = [
    {
      accessorKey: "id",
      header: "Booking ID",
      cell: ({ row }) => <span className="font-mono text-xs">{row.getValue("id")}</span>,
    },
    {
      accessorKey: "bookingCode",
      header: "Booking Code",
      cell: ({ row }) => (
        <span className="font-mono text-xs">{row.getValue("bookingCode")}</span>
      ),
    },
    {
      accessorKey: "propertyName",
      header: "Property",
      cell: ({ row }) => (
        <div>
          <div className="font-medium line-clamp-1">{row.getValue("propertyName")}</div>
          <div className="text-xs text-gray-500">
            {row.original.propertyLocation.city}, {row.original.propertyLocation.state}
          </div>
        </div>
      ),
    },
    {
      accessorKey: "guestName",
      header: "Guest",
      cell: ({ row }) => (
        <div>
          <div className="font-medium">{row.getValue("guestName")}</div>
          <div className="text-xs text-gray-500">{row.original.guestEmail}</div>
        </div>
      ),
    },
    {
      accessorKey: "checkIn",
      header: "Stay",
      cell: ({ row }) => (
        <div>
          <div className="text-sm">
            {formatDateRange(row.original.checkIn, row.original.checkOut)}
          </div>
          <div className="text-xs text-gray-500">
            {calculateNights(row.original.checkIn, row.original.checkOut)} nights, {row.original.guests.adults + row.original.guests.children} guests
          </div>
        </div>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => <StatusBadge status={row.getValue("status")} />,
    },
    {
      accessorKey: "paymentStatus",
      header: "Payment",
      cell: ({ row }) => (
        <div className="flex flex-col gap-1">
          <PaymentBadge status={row.getValue("paymentStatus")} />
          <span className="text-xs font-medium">{formatCurrency(row.original.totalAmount)}</span>
        </div>
      ),
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const booking = row.original
        
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem 
                onClick={() => {
                  setSelectedBooking(booking)
                  setIsDetailsOpen(true)
                }}
              >
                <Eye className="mr-2 h-4 w-4" />
                <span>View Details</span>
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => window.location.href = `/admin/bookings/${booking.id}/invoice`}
              >
                <FileText className="mr-2 h-4 w-4" />
                <span>View Invoice</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {booking.status === 'pending' && (
                <DropdownMenuItem
                  onClick={() => {
                    toast({
                      title: "Booking Confirmed",
                      description: `Booking ${booking.bookingCode || booking.id} has been confirmed.`,
                    })
                  }}
                  className="text-green-600"
                >
                  <Check className="mr-2 h-4 w-4" />
                  <span>Confirm Booking</span>
                </DropdownMenuItem>
              )}
              {(booking.status === 'pending' || booking.status === 'confirmed') && (
                <DropdownMenuItem
                  onClick={() => cancelBooking(booking.id)}
                  disabled={cancellingBooking === booking.id}
                  className="text-red-600"
                >
                  <X className="mr-2 h-4 w-4" />
                  <span>
                    {cancellingBooking === booking.id ? 'Cancelling...' : 'Cancel Booking'}
                  </span>
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]

  return (
    <div className="space-y-6 mt-12">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold flex items-center">
          <Calendar className="mr-2 h-6 w-6" />
          Booking Management
        </h1>
        <Button className="bg-darkGreen hover:bg-darkGreen/90">
          <Download className="mr-2 h-4 w-4" />
          Export Bookings
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Filters</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="search">Search</Label>
                <Input
                  id="search"
                placeholder="Guest name, ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            
            <div className="space-y-2">
              <Label>Booking Status</Label>
              <select 
                className="w-full p-2 border rounded"
                value={activeTab}
                onChange={(e) => setActiveTab(e.target.value)}
              >
                <option value="">All Statuses</option>
                <option value="confirmed">Confirmed</option>
                <option value="pending">Pending</option>
                <option value="cancelled">Cancelled</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </CardContent>
        </Card>
        
        <Card className="md:col-span-3">
            <CardHeader>
            <CardTitle>Bookings</CardTitle>
              <CardDescription>
              {loading ? "Loading bookings..." : `${filteredBookings.length} bookings found`}
              </CardDescription>
            </CardHeader>
            <CardContent>
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-darkGreen"></div>
              </div>
            ) : filteredBookings.length > 0 ? (
              <div>
              <DataTable 
                columns={columns} 
                data={filteredBookings} 
                pagination={true}
              />
              
              {/* Pagination Controls */}
              {!loading && filteredBookings.length > 0 && totalPages > 1 && (
                <div className="flex justify-center items-center gap-4 mt-6 pt-4 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">
                      Page {currentPage} of {totalPages}
                    </span>
                    <span className="text-sm text-gray-500">
                      ({totalBookings} total bookings)
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">Show:</span>
                    <Select value={pageSize.toString()} onValueChange={(value) => setPageSize(Number(value))}>
                      <SelectTrigger className="h-8 w-16">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="10">10</SelectItem>
                        <SelectItem value="25">25</SelectItem>
                        <SelectItem value="50">50</SelectItem>
                        <SelectItem value="100">100</SelectItem>
                      </SelectContent>
                    </Select>
                    <span className="text-sm text-gray-500">per page</span>
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage >= totalPages}
                  >
                    Next
                  </Button>
                </div>
              )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-64 text-center p-4">
                <Calendar className="h-10 w-10 text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-600 mb-2">No Bookings Found</h3>
                <p className="text-sm text-gray-500 max-w-sm">
                  {searchTerm || activeTab
                    ? "No bookings match your search criteria. Try adjusting your filters."
                    : "There are no bookings in the system yet. Bookings will appear here once guests make reservations."}
                </p>
              </div>
            )}
            </CardContent>
          </Card>
        </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Booking Stats</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-blue-700">Total</h3>
                <p className="text-2xl font-bold text-blue-900">{analytics.total}</p>
              </div>
              <div className="bg-amber-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-amber-700">Pending</h3>
                <p className="text-2xl font-bold text-amber-900">{analytics.pending}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>This Month</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-green-700">Bookings</h3>
                <p className="text-2xl font-bold text-green-900">{analytics.thisMonth.bookings}</p>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-purple-700">Revenue</h3>
                <p className="text-2xl font-bold text-purple-900">{formatCurrency(analytics.thisMonth.revenue)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Processing Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-gray-700">Avg. Confirmation</h3>
                <p className="text-2xl font-bold text-gray-900">{analytics.avgConfirmation} hrs</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Booking details dialog */}
      {selectedBooking && (
        <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Booking Details</DialogTitle>
              <DialogDescription>
                Complete information about this booking
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Booking ID</h4>
                  <p className="font-mono">{selectedBooking.bookingCode || selectedBooking.id}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Created</h4>
                  <p>{format(new Date(selectedBooking.createdAt), 'PPp')}</p>
                </div>
                <div className="col-span-2">
                  <h4 className="text-sm font-medium text-gray-500">Status</h4>
                  <div className="flex gap-2 mt-1">
                    <StatusBadge status={selectedBooking.status} />
                    <PaymentBadge status={selectedBooking.paymentStatus} />
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-1">Property</h4>
                <div className="flex items-start">
                  <Home className="h-4 w-4 text-gray-500 mt-0.5 mr-2" />
                  <div>
                    <p className="font-medium">{selectedBooking.propertyName}</p>
                    <p className="text-sm text-gray-500">
                      {selectedBooking.propertyLocation.city}, {selectedBooking.propertyLocation.state}
                    </p>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-1">Guest</h4>
                <div className="flex items-start">
                  <User className="h-4 w-4 text-gray-500 mt-0.5 mr-2" />
                  <div>
                    <p className="font-medium">{selectedBooking.guestName}</p>
                    <p className="text-sm text-gray-500">{selectedBooking.guestEmail}</p>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-1">Stay Details</h4>
                <div className="flex items-start">
                  <Calendar className="h-4 w-4 text-gray-500 mt-0.5 mr-2" />
                  <div>
                    <p className="font-medium">
                      {formatDateRange(selectedBooking.checkIn, selectedBooking.checkOut)}
                    </p>
                    <p className="text-sm text-gray-500">
                      {calculateNights(selectedBooking.checkIn, selectedBooking.checkOut)} nights
                    </p>
                    <p className="text-sm text-gray-500">
                      {selectedBooking.guests.adults} adults, {selectedBooking.guests.children} children
                    </p>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-1">Payment</h4>
                <div className="flex items-start">
                  <IndianRupee className="h-4 w-4 text-gray-500 mt-0.5 mr-2" />
                  <div>
                    <p className="font-medium">
                      {formatCurrency(selectedBooking.totalAmount)}
                    </p>
                    <p className="text-sm text-gray-500 italic">
                      {selectedBooking.paymentStatus === 'paid' ? 'Paid in full' : selectedBooking.paymentStatus}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter className="sm:justify-start">
              <Button 
                className="bg-darkGreen hover:bg-darkGreen/90"
                onClick={() => window.location.href = `/admin/bookings/${selectedBooking.id}/invoice`}
              >
                <FileText className="mr-2 h-4 w-4" />
                View Invoice
              </Button>
              {selectedBooking.status === 'pending' && (
                <Button variant="secondary">
                  <Check className="mr-2 h-4 w-4" />
                  Confirm Booking
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
} 