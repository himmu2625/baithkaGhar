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
  DollarSign, 
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
  
  // Generate mock booking data
  useEffect(() => {
    const generateMockBookings = () => {
      const statuses = ['confirmed', 'pending', 'cancelled', 'completed'] as const
      const paymentStatuses = ['paid', 'pending', 'refunded', 'failed'] as const
      const properties = [
        { name: 'Mountain View Villa', city: 'Shimla', state: 'Himachal Pradesh' },
        { name: 'Lakeside Cottage', city: 'Udaipur', state: 'Rajasthan' },
        { name: 'Beachfront Apartment', city: 'Goa', state: 'Goa' },
        { name: 'Urban Penthouse', city: 'Mumbai', state: 'Maharashtra' },
        { name: 'Riverside Cabin', city: 'Rishikesh', state: 'Uttarakhand' },
        { name: 'Heritage Haveli', city: 'Jaipur', state: 'Rajasthan' },
        { name: 'Tea Estate Bungalow', city: 'Darjeeling', state: 'West Bengal' },
        { name: 'Forest Retreat', city: 'Coorg', state: 'Karnataka' }
      ]
      
      const guestFirstNames = ['Arun', 'Sonia', 'Vikram', 'Meera', 'Rahul', 'Priya', 'Raj', 'Anjali']
      const guestLastNames = ['Kumar', 'Singh', 'Patel', 'Shah', 'Verma', 'Gupta', 'Sharma', 'Reddy']
      
      const mockBookings: Booking[] = Array.from({ length: 100 }).map((_, i) => {
        const id = `book_${(30000 + i).toString()}`
        const propertyId = `prop_${(20000 + Math.floor(Math.random() * 100)).toString()}`
        const propertyIndex = Math.floor(Math.random() * properties.length)
        
        const guestId = `usr_${(10000 + Math.floor(Math.random() * 100)).toString()}`
        const guestIndex = Math.floor(Math.random() * guestFirstNames.length)
        const guestName = `${guestFirstNames[guestIndex]} ${guestLastNames[guestIndex]}`
        const guestEmail = `${guestFirstNames[guestIndex].toLowerCase()}.${guestLastNames[guestIndex].toLowerCase()}${i}@example.com`
        
        const createdAt = new Date()
        createdAt.setDate(createdAt.getDate() - Math.floor(Math.random() * 30))
        
        // Random check-in date between now and next 6 months
        const checkIn = new Date()
        checkIn.setDate(checkIn.getDate() + Math.floor(Math.random() * 180))
        
        // Random check-out date 1-14 days after check-in
        const checkOut = new Date(checkIn)
        checkOut.setDate(checkOut.getDate() + Math.floor(Math.random() * 14) + 1)
        
        const adults = Math.floor(Math.random() * 4) + 1
        const children = Math.floor(Math.random() * 3)
        
        const statusIndex = Math.floor(Math.random() * statuses.length)
        const status = statuses[statusIndex]
        
        let paymentStatus: typeof paymentStatuses[number]
        if (status === 'cancelled') {
          paymentStatus = Math.random() > 0.5 ? 'refunded' : 'failed'
        } else if (status === 'confirmed' || status === 'completed') {
          paymentStatus = Math.random() > 0.1 ? 'paid' : 'pending'
        } else {
          paymentStatus = Math.random() > 0.5 ? 'paid' : 'pending'
        }
        
        const basePrice = Math.floor(Math.random() * 5000) + 2000
        const nights = Math.round((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24))
        const totalAmount = basePrice * nights + (Math.random() > 0.5 ? 1500 : 0)
        
        return {
          id,
          propertyId,
          propertyName: properties[propertyIndex].name,
          propertyLocation: {
            city: properties[propertyIndex].city,
            state: properties[propertyIndex].state
          },
          guestId,
          guestName,
          guestEmail,
          checkIn: checkIn.toISOString(),
          checkOut: checkOut.toISOString(),
          guests: {
            adults,
            children
          },
          status,
          paymentStatus,
          totalAmount,
          createdAt: createdAt.toISOString()
        }
      })
      
      return mockBookings
    }
    
    const mockBookings = generateMockBookings()
    setBookings(mockBookings)
    setFilteredBookings(mockBookings)
    setLoading(false)
  }, [])
  
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
          booking.id.toLowerCase().includes(lowerSearch) || 
          booking.propertyName.toLowerCase().includes(lowerSearch) ||
          booking.guestName.toLowerCase().includes(lowerSearch) ||
          booking.guestEmail.toLowerCase().includes(lowerSearch) ||
          booking.propertyLocation.city.toLowerCase().includes(lowerSearch)
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
                      description: `Booking ${booking.id} has been confirmed.`,
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
                  onClick={() => {
                    toast({
                      title: "Booking Cancelled",
                      description: `Booking ${booking.id} has been cancelled.`,
                    })
                  }}
                  className="text-red-600"
                >
                  <X className="mr-2 h-4 w-4" />
                  <span>Cancel Booking</span>
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]

  return (
    <div className="space-y-6">
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
        <Card className="md:col-span-1 h-fit">
          <CardHeader>
            <CardTitle className="text-lg">Filters</CardTitle>
            <CardDescription>Filter booking data</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="search">Search Bookings</Label>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  id="search"
                  placeholder="ID, guest, or property"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Booking Status</Label>
              <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid grid-cols-5 w-full">
                  <TabsTrigger value="all" className="text-xs">All</TabsTrigger>
                  <TabsTrigger value="confirmed" className="text-xs">Confirmed</TabsTrigger>
                  <TabsTrigger value="pending" className="text-xs">Pending</TabsTrigger>
                  <TabsTrigger value="completed" className="text-xs">Completed</TabsTrigger>
                  <TabsTrigger value="cancelled" className="text-xs">Cancelled</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="paymentStatus">Payment Status</Label>
              <Select value={paymentFilter} onValueChange={setPaymentFilter}>
                <SelectTrigger id="paymentStatus">
                  <SelectValue placeholder="All Payment Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Payment Statuses</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="refunded">Refunded</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="pt-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full"
                onClick={() => {
                  setSearchTerm("")
                  setActiveTab("all")
                  setPaymentFilter("all")
                }}
              >
                <Filter className="mr-2 h-4 w-4" />
                Reset Filters
              </Button>
            </div>
          </CardContent>
        </Card>
        
        <div className="md:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center justify-between">
                <span>Booking List</span>
                <Badge className="ml-2">{filteredBookings.length} bookings</Badge>
              </CardTitle>
              <CardDescription>
                Manage all reservations and bookings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DataTable 
                columns={columns} 
                data={filteredBookings} 
                pagination={true}
              />
            </CardContent>
          </Card>
        </div>
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
                  <p className="font-mono">{selectedBooking.id}</p>
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
                  <DollarSign className="h-4 w-4 text-gray-500 mt-0.5 mr-2" />
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