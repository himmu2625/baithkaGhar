"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Building, 
  Calendar, 
  FileText, 
  MapPin, 
  Users, 
  Download,
  Eye,
  Phone,
  CreditCard,
  Clock
} from "lucide-react"
import Image from "next/image"
import { toast } from "@/hooks/use-toast"

interface Booking {
  _id: string
  propertyId: {
    _id: string
    title: string
    address?: {
      city?: string
      state?: string
      street?: string
      country?: string
    }
    images?: string[] | Array<{url: string, public_id?: string}>
    price?: number
  }
  dateFrom: string
  dateTo: string
  guests: number
  totalPrice: number
  status: 'confirmed' | 'pending' | 'cancelled' | 'completed'
  paymentStatus?: string
  createdAt: string
  contactDetails?: {
    name?: string
    email?: string
    phone?: string
  }
}

// Helper function to safely get image URL
const getImageUrl = (images?: string[] | Array<{url: string, public_id?: string}>): string => {
  if (!images || images.length === 0) {
    return "/placeholder.svg"
  }
  
  const firstImage = images[0]
  
  // If it's a string, return it directly
  if (typeof firstImage === 'string') {
    return firstImage
  }
  
  // If it's an object with url property, return the url
  if (typeof firstImage === 'object' && firstImage.url) {
    return firstImage.url
  }
  
  // Fallback to placeholder
  return "/placeholder.svg"
}

// Helper function to get a safe booking key
const getBookingKey = (booking: Booking, index: number): string => {
  return booking._id || `booking-${index}-${booking.dateFrom}`
}

export default function BookingsPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [activeTab, setActiveTab] = useState("upcoming")
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Redirect if not logged in
    if (status === 'unauthenticated') {
      router.push('/login')
      return
    }

    const fetchBookings = async () => {
      if (status !== 'authenticated') return
      
      setLoading(true)
      try {
        console.log("[Bookings] Fetching user bookings...")
        const response = await fetch('/api/bookings')
        
        if (response.ok) {
          const data = await response.json()
          console.log("[Bookings] API response:", data)
          setBookings(data.bookings || [])
        } else {
          console.error('[Bookings] Failed to fetch bookings:', response.statusText)
          toast({
            title: "Error",
            description: "Failed to load your bookings. Please try again.",
            variant: "destructive"
          })
          setBookings([])
        }
      } catch (error) {
        console.error("[Bookings] Error fetching bookings:", error)
        toast({
          title: "Error",
          description: "Failed to load your bookings. Please try again.",
          variant: "destructive"
        })
        setBookings([])
      } finally {
        setLoading(false)
      }
    }

    fetchBookings()
  }, [status, router])

  // Filter bookings by status
  const getFilteredBookings = (filterStatus: string) => {
    const today = new Date()
    
    return bookings.filter(booking => {
      const checkInDate = new Date(booking.dateFrom)
      const checkOutDate = new Date(booking.dateTo)
      
      switch (filterStatus) {
        case 'upcoming':
          return booking.status !== 'cancelled' && 
                 (checkInDate > today || (checkInDate <= today && checkOutDate > today))
        case 'completed':
          return booking.status === 'completed' || 
                 (booking.status !== 'cancelled' && checkOutDate <= today)
        case 'cancelled':
          return booking.status === 'cancelled'
        default:
          return true
      }
    })
  }

  const formatDateRange = (checkIn: string, checkOut: string) => {
    return `${format(new Date(checkIn), 'dd MMM yyyy')} - ${format(new Date(checkOut), 'dd MMM yyyy')}`
  }

  const calculateNights = (checkIn: string, checkOut: string) => {
    const start = new Date(checkIn)
    const end = new Date(checkOut)
    return Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
  }

  const getStatusBadge = (booking: Booking) => {
    const today = new Date()
    const checkInDate = new Date(booking.dateFrom)
    const checkOutDate = new Date(booking.dateTo)
    
    if (booking.status === 'cancelled') {
      return <Badge variant="destructive">Cancelled</Badge>
    } else if (booking.status === 'pending') {
      return <Badge variant="secondary">Pending</Badge>
    } else if (checkInDate > today) {
      return <Badge className="bg-blue-100 text-blue-800">Upcoming</Badge>
    } else if (checkOutDate <= today) {
      return <Badge className="bg-green-100 text-green-800">Completed</Badge>
    } else {
      return <Badge className="bg-orange-100 text-orange-800">Ongoing</Badge>
    }
  }

  const BookingCard = ({ booking }: { booking: Booking }) => (
    <Card className="border-lightGreen hover:shadow-lg transition-shadow">
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Property Image */}
          <div className="relative h-32 md:w-32 rounded-md overflow-hidden flex-shrink-0">
            <Image
              src={getImageUrl(booking.propertyId?.images)}
              alt={booking.propertyId?.title || "Property"}
              fill
              className="object-cover"
              onError={(e) => {
                console.warn("Failed to load image, using placeholder")
                e.currentTarget.src = "/placeholder.svg"
              }}
            />
          </div>
          
          {/* Booking Details */}
          <div className="flex-1">
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-semibold text-lg text-darkGreen line-clamp-1">
                {booking.propertyId?.title || "Property"}
              </h3>
              {getStatusBadge(booking)}
            </div>
            
            <div className="space-y-2 text-sm text-mediumGreen">
              <div className="flex items-center">
                <MapPin className="h-4 w-4 mr-2" />
                <span>
                  {booking.propertyId?.address?.city || 'Unknown'}, {booking.propertyId?.address?.state || 'Unknown'}
                </span>
              </div>
              
              <div className="flex items-center">
                <Calendar className="h-4 w-4 mr-2" />
                <span>{formatDateRange(booking.dateFrom, booking.dateTo)}</span>
                <span className="ml-2 text-xs text-gray-500">
                  ({calculateNights(booking.dateFrom, booking.dateTo)} nights)
                </span>
              </div>
              
              <div className="flex items-center">
                <Users className="h-4 w-4 mr-2" />
                <span>{booking.guests} guests</span>
              </div>
              
              <div className="flex items-center">
                <CreditCard className="h-4 w-4 mr-2" />
                <span className="font-semibold">₹{booking.totalPrice?.toLocaleString()}</span>
                {booking.paymentStatus && (
                  <Badge variant="secondary" className="ml-2 text-xs">
                    {booking.paymentStatus}
                  </Badge>
                )}
              </div>
            </div>
            
            {/* Booking Actions */}
            <div className="flex flex-wrap gap-2 mt-4">
              <Button
                size="sm"
                variant="outline"
                onClick={() => router.push(`/booking/${booking._id}`)}
              >
                <Eye className="h-4 w-4 mr-1" />
                View Details
              </Button>
              
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  window.open(`/api/bookings/${booking._id}/invoice`, '_blank')
                }}
              >
                <Download className="h-4 w-4 mr-1" />
                Invoice
              </Button>
              
              <Button
                size="sm"
                variant="outline"
                onClick={() => router.push(`/property/${booking.propertyId._id}`)}
              >
                <Building className="h-4 w-4 mr-1" />
                Property
              </Button>
              
              {booking.status === 'confirmed' && new Date(booking.dateFrom) > new Date() && (
                <Button
                  size="sm"
                  variant="outline"
                  className="text-red-600 hover:text-red-700"
                  onClick={() => {
                    // TODO: Implement cancellation
                    console.log('Cancel booking:', booking._id)
                  }}
                >
                  Cancel
                </Button>
              )}
            </div>
            
            <div className="mt-2 text-xs text-gray-500">
              <Clock className="h-3 w-3 inline mr-1" />
              Booked on {format(new Date(booking.createdAt), 'dd MMM yyyy')}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  const EmptyState = ({ type }: { type: string }) => {
    const getEmptyStateContent = () => {
      switch (type) {
        case 'upcoming':
          return {
            icon: <Calendar className="h-12 w-12 mx-auto text-mediumGreen/50 mb-4" />,
            title: "No upcoming bookings",
            description: "You don't have any upcoming bookings. Start exploring and book your perfect stay!"
          }
        case 'completed':
          return {
            icon: <Building className="h-12 w-12 mx-auto text-mediumGreen/50 mb-4" />,
            title: "No completed bookings",
            description: "You don't have any completed bookings yet. Book a stay to see it here after your visit."
          }
        case 'cancelled':
          return {
            icon: <FileText className="h-12 w-12 mx-auto text-mediumGreen/50 mb-4" />,
            title: "No cancelled bookings",
            description: "You don't have any cancelled bookings."
          }
        default:
          return {
            icon: <Calendar className="h-12 w-12 mx-auto text-mediumGreen/50 mb-4" />,
            title: "No bookings found",
            description: "No bookings found for this category."
          }
      }
    }

    const content = getEmptyStateContent()

    return (
      <div className="text-center py-12">
        {content.icon}
        <h3 className="text-lg font-medium text-darkGreen mb-2">{content.title}</h3>
        <p className="text-mediumGreen mb-4">{content.description}</p>
        {type === 'upcoming' && (
          <Button
            onClick={() => router.push("/")}
            className="bg-mediumGreen hover:bg-darkGreen text-lightYellow"
          >
            Explore Properties
          </Button>
        )}
      </div>
    )
  }

  // Show loading state if not authenticated
  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-mediumGreen"></div>
      </div>
    )
  }

  if (status === 'unauthenticated') {
    return null // Will redirect in useEffect
  }

  return (
    <main className="pt-24 pb-16">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-darkGreen">My Bookings</h1>
          <Button onClick={() => router.push("/")} className="bg-mediumGreen hover:bg-darkGreen text-lightYellow">
            Book New Stay
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-mediumGreen"></div>
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-3 mb-6">
              <TabsTrigger
                value="upcoming"
                className="data-[state=active]:bg-lightGreen data-[state=active]:text-darkGreen"
              >
                Upcoming ({getFilteredBookings('upcoming').length})
              </TabsTrigger>
              <TabsTrigger
                value="completed"
                className="data-[state=active]:bg-lightGreen data-[state=active]:text-darkGreen"
              >
                Completed ({getFilteredBookings('completed').length})
              </TabsTrigger>
              <TabsTrigger
                value="cancelled"
                className="data-[state=active]:bg-lightGreen data-[state=active]:text-darkGreen"
              >
                Cancelled ({getFilteredBookings('cancelled').length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="upcoming">
              <Card className="border-lightGreen">
                <CardHeader>
                  <CardTitle className="text-darkGreen">Upcoming Bookings</CardTitle>
                  <CardDescription>Your upcoming stays</CardDescription>
                </CardHeader>
                <CardContent>
                  {getFilteredBookings('upcoming').length > 0 ? (
                    <div className="space-y-4">
                      {getFilteredBookings('upcoming').map((booking, index) => (
                        <BookingCard key={getBookingKey(booking, index)} booking={booking} />
                      ))}
                    </div>
                  ) : (
                    <EmptyState type="upcoming" />
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="completed">
              <Card className="border-lightGreen">
                <CardHeader>
                  <CardTitle className="text-darkGreen">Completed Bookings</CardTitle>
                  <CardDescription>Your past stays</CardDescription>
                </CardHeader>
                <CardContent>
                  {getFilteredBookings('completed').length > 0 ? (
                    <div className="space-y-4">
                      {getFilteredBookings('completed').map((booking, index) => (
                        <BookingCard key={getBookingKey(booking, index)} booking={booking} />
                      ))}
                    </div>
                  ) : (
                    <EmptyState type="completed" />
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="cancelled">
              <Card className="border-lightGreen">
                <CardHeader>
                  <CardTitle className="text-darkGreen">Cancelled Bookings</CardTitle>
                  <CardDescription>Your cancelled reservations</CardDescription>
                </CardHeader>
                <CardContent>
                  {getFilteredBookings('cancelled').length > 0 ? (
                    <div className="space-y-4">
                      {getFilteredBookings('cancelled').map((booking, index) => (
                        <BookingCard key={getBookingKey(booking, index)} booking={booking} />
                      ))}
                    </div>
                  ) : (
                    <EmptyState type="cancelled" />
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </main>
  )
}
