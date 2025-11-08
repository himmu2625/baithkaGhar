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
  Clock,
  TrendingUp,
  Sparkles,
  Target
} from "lucide-react"
import SavingsHighlight from "@/components/booking/SavingsHighlight"
import { PlanDetailsDisplay } from "@/components/booking/PlanDetailsDisplay"
import Image from "next/image"
import { toast } from "@/hooks/use-toast"
import { RefundInstructions } from "@/components/ui/refund-instructions"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

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
  rooms?: number
  totalPrice: number
  status: 'confirmed' | 'pending' | 'cancelled' | 'completed'
  paymentStatus?: string
  createdAt: string
  contactDetails?: {
    name?: string
    email?: string
    phone?: string
  }
  // Dynamic pricing fields
  isDynamicPricing?: boolean
  appliedPromotions?: Array<{
    id: string
    name: string
    discount: number
    type: string
  }>
  basePrice?: number
  marketAverage?: number
  savings?: {
    amount: number
    percentage: number
    reason: string
  }
  // Plan-based booking details
  roomCategory?: string
  planType?: 'EP' | 'CP' | 'MAP' | 'AP'
  occupancyType?: 'SINGLE' | 'DOUBLE' | 'TRIPLE' | 'QUAD'
  numberOfRooms?: number
  mealPlanInclusions?: {
    breakfast: boolean
    lunch: boolean
    dinner: boolean
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
  const [cancellingBooking, setCancellingBooking] = useState<string | null>(null)
  const [showRefundDialog, setShowRefundDialog] = useState(false)
  const [refundData, setRefundData] = useState<any>(null)

  // Function to cancel a booking
  const cancelBooking = async (bookingId: string) => {
    if (!confirm('Are you sure you want to cancel this booking? This action cannot be undone.')) {
      return
    }

    setCancellingBooking(bookingId)
    
    try {
      console.log('[Bookings] Cancelling booking:', bookingId)
      
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
      console.log('[Bookings] Booking cancelled successfully:', cancelledBooking)

      // Update the bookings list
      setBookings(prevBookings => 
        prevBookings.map(booking => 
          booking._id === bookingId 
            ? { ...booking, status: 'cancelled' as const }
            : booking
        )
      )

      // Show refund instructions if refund was processed
      if (cancelledBooking.refund && cancelledBooking.refund.processed) {
        setRefundData(cancelledBooking.refund)
        setShowRefundDialog(true)
        toast({
          title: "Booking Cancelled with Refund",
          description: `Your booking has been cancelled and refund of ₹${cancelledBooking.refund.amount.toLocaleString()} has been initiated.`,
          variant: "default",
        })
      } else {
        toast({
          title: "Booking Cancelled",
          description: "Your booking has been cancelled successfully.",
          variant: "default",
        })
      }
    } catch (error: any) {
      console.error('[Bookings] Error cancelling booking:', error)
      toast({
        title: "Cancellation Failed",
        description: error.message || "Failed to cancel booking. Please try again.",
        variant: "destructive",
      })
    } finally {
      setCancellingBooking(null)
    }
  }

  useEffect(() => {
    // Redirect if not logged in
    if (status === 'unauthenticated') {
      router.push('/login')
      return
    }

    const fetchBookings = async () => {
      if (status !== 'authenticated') return
      
      try {
        setLoading(true)
        console.log("[Bookings] Fetching user bookings...")
        
        // First, trigger automatic cancellation of expired pending paid bookings
        try {
          const autoCancelResponse = await fetch('/api/bookings/auto-cancel', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
          })
          
          if (autoCancelResponse.ok) {
            const autoCancelResult = await autoCancelResponse.json()
            console.log("[Bookings] Auto-cancellation result:", autoCancelResult)
            
            if (autoCancelResult.result?.cancelled > 0) {
              toast({
                title: "Bookings Updated",
                description: `${autoCancelResult.result.cancelled} expired bookings have been automatically cancelled.`,
                variant: "default",
              })
            }
          } else {
            console.warn("[Bookings] Auto-cancellation failed with status:", autoCancelResponse.status)
          }
        } catch (autoCancelError) {
          console.warn("[Bookings] Auto-cancellation failed:", autoCancelError)
          // Don't fail the entire request if auto-cancellation fails
        }
        
        const response = await fetch('/api/bookings')
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        
        const data = await response.json()
        console.log("[Bookings] Fetched bookings:", data.bookings?.length || 0)
        
        // Debug: Log booking statuses
        if (data.bookings && data.bookings.length > 0) {
          console.log("[Bookings] Booking statuses:")
          data.bookings.forEach((booking: any, index: number) => {
            console.log(`  ${index + 1}. ID: ${booking._id}`)
            console.log(`     Status: ${booking.status}`)
            console.log(`     Payment Status: ${booking.paymentStatus}`)
            console.log(`     Dates: ${booking.dateFrom} to ${booking.dateTo}`)
            console.log(`     Created: ${booking.createdAt}`)
          })
        }
        
        if (data.bookings) {
          setBookings(data.bookings)
        } else {
          setBookings([])
        }
      } catch (error) {
        console.error("[Bookings] Failed to fetch bookings:", error)
        toast({
          title: "Error",
          description: "Failed to load bookings. Please try again.",
          variant: "destructive",
        })
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
          // Show only CONFIRMED bookings that are in the future
          return booking.status === 'confirmed' && checkInDate > today
        case 'completed':
          // Show only completed bookings or confirmed bookings that have ended
          return booking.status === 'completed' || 
                 (booking.status === 'confirmed' && checkOutDate <= today)
        case 'cancelled':
          // Show only cancelled bookings (including failed payments)
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
    // Handle booking status based on payment flow
    if (booking.status === 'cancelled') {
      return <Badge variant="destructive" className="font-medium">Cancelled</Badge>
    } else if (booking.status === 'pending') {
      return <Badge variant="secondary" className="font-medium">Payment Pending</Badge>
    } else if (booking.status === 'completed') {
      return <Badge className="bg-green-100 text-green-800 font-medium">Completed</Badge>
    } else if (booking.status === 'confirmed') {
      const today = new Date()
      const checkInDate = new Date(booking.dateFrom)
      const checkOutDate = new Date(booking.dateTo)
      
      if (checkInDate > today) {
        return <Badge className="bg-blue-100 text-blue-800 font-medium">Upcoming</Badge>
      } else if (checkOutDate <= today) {
        return <Badge className="bg-green-100 text-green-800 font-medium">Completed</Badge>
      } else {
        return <Badge className="bg-orange-100 text-orange-800 font-medium">Ongoing</Badge>
      }
    } else {
      // Fallback for any other status
      return <Badge variant="outline" className="font-medium">{booking.status}</Badge>
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
              className="object-contain"
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

              {/* Plan Details - Show room category, meal plan, occupancy in compact mode */}
              {(booking.roomCategory || booking.planType || booking.occupancyType) && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <PlanDetailsDisplay
                    booking={booking}
                    variant="compact"
                  />
                </div>
              )}

              <div className="space-y-3 mt-3">
                {/* Enhanced Pricing Display */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-mediumGreen" />
                    <div>
                      <div className="font-semibold text-lg">₹{booking.totalPrice?.toLocaleString()}</div>
                      <div className="flex items-center gap-2">
                        {booking.isDynamicPricing && (
                          <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                            <Sparkles className="h-3 w-3 mr-1" />
                            Dynamic
                          </Badge>
                        )}
                        {booking.paymentStatus && (
                          <Badge variant="secondary" className="text-xs">
                            {booking.paymentStatus}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Savings Display */}
                  {booking.savings && booking.savings.amount > 0 && (
                    <div className="text-right">
                      <div className="text-sm font-medium text-green-600">
                        Saved ₹{booking.savings.amount.toLocaleString()}
                      </div>
                      <div className="text-xs text-green-500">
                        {booking.savings.percentage.toFixed(1)}% savings
                      </div>
                    </div>
                  )}
                </div>

                {/* Applied Promotions */}
                {booking.appliedPromotions && booking.appliedPromotions.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {booking.appliedPromotions.slice(0, 2).map((promo) => (
                      <Badge key={promo.id} variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                        <Target className="h-3 w-3 mr-1" />
                        {promo.name}
                      </Badge>
                    ))}
                    {booking.appliedPromotions.length > 2 && (
                      <Badge variant="outline" className="text-xs">
                        +{booking.appliedPromotions.length - 2} more
                      </Badge>
                    )}
                  </div>
                )}

                {/* Market Comparison for Dynamic Pricing */}
                {booking.isDynamicPricing && booking.marketAverage && (
                  <div className="text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <TrendingUp className="h-3 w-3" />
                      <span>
                        Market avg: ₹{booking.marketAverage.toLocaleString()} • 
                        You paid: {((booking.totalPrice / booking.marketAverage - 1) * 100).toFixed(1)}% 
                        {booking.totalPrice < booking.marketAverage ? 'below' : 'above'} market
                      </span>
                    </div>
                  </div>
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
                  onClick={() => cancelBooking(booking._id)}
                  disabled={cancellingBooking === booking._id}
                >
                  {cancellingBooking === booking._id ? (
                    <>
                      <div className="animate-spin rounded-full h-3 w-3 border-t-2 border-b-2 border-red-600 mr-1"></div>
                      Cancelling...
                    </>
                  ) : (
                    'Cancel'
                  )}
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
            <TabsList className="grid grid-cols-3 mb-6 bg-gray-100 p-1 rounded-lg">
              <TabsTrigger
                value="upcoming"
                className="data-[state=active]:bg-white data-[state=active]:text-darkGreen data-[state=active]:shadow-md data-[state=active]:font-semibold rounded-md transition-all duration-200"
              >
                Upcoming ({getFilteredBookings('upcoming').length})
              </TabsTrigger>
              <TabsTrigger
                value="completed"
                className="data-[state=active]:bg-white data-[state=active]:text-darkGreen data-[state=active]:shadow-md data-[state=active]:font-semibold rounded-md transition-all duration-200"
              >
                Completed ({getFilteredBookings('completed').length})
              </TabsTrigger>
              <TabsTrigger
                value="cancelled"
                className="data-[state=active]:bg-white data-[state=active]:text-darkGreen data-[state=active]:shadow-md data-[state=active]:font-semibold rounded-md transition-all duration-200"
              >
                Cancelled ({getFilteredBookings('cancelled').length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="upcoming" className="data-[state=active]:border-l-4 data-[state=active]:border-blue-500 data-[state=active]:pl-4">
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

            <TabsContent value="completed" className="data-[state=active]:border-l-4 data-[state=active]:border-green-500 data-[state=active]:pl-4">
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

            <TabsContent value="cancelled" className="data-[state=active]:border-l-4 data-[state=active]:border-red-500 data-[state=active]:pl-4">
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

      <Dialog open={showRefundDialog} onOpenChange={setShowRefundDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Refund Instructions</DialogTitle>
          </DialogHeader>
          {refundData && (
            <RefundInstructions 
              refund={refundData} 
              onClose={() => setShowRefundDialog(false)} 
            />
          )}
        </DialogContent>
      </Dialog>
    </main>
  )
}
