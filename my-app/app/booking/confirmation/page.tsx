"use client"

export const dynamic = 'force-dynamic';

import { useState, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { format } from "date-fns"
import { CheckCircle, Calendar, Users, MapPin, ArrowRight, Download, Share2, Home } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/components/ui/use-toast"
import { useSession } from "next-auth/react"
import { Loader2 } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

export default function BookingConfirmationPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { toast } = useToast()
  const { data: session, status } = useSession()
  
  const bookingId = searchParams?.get("bookingId") || ""
  
  const [booking, setBooking] = useState<any>(null)
  const [property, setProperty] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Redirect if no booking ID
    if (!bookingId) {
      toast({
        title: "Missing booking information",
        description: "Booking details not found.",
        variant: "destructive"
      })
      router.push("/")
      return
    }
    
    // Check if user is authenticated
    if (status === "unauthenticated") {
      router.push(`/login?returnUrl=${encodeURIComponent(`/booking/confirmation?bookingId=${bookingId}`)}`)
      return
    }
    
    // Load booking and property details
    const fetchDetails = async () => {
      try {
        // Fetch booking details
        const bookingResponse = await fetch(`/api/bookings/${bookingId}`)
        if (!bookingResponse.ok) {
          throw new Error("Failed to fetch booking details")
        }
        
        const bookingData = await bookingResponse.json()
        if (!bookingData.booking) {
          throw new Error("Booking not found")
        }
        
        setBooking(bookingData.booking)
        
        // Fetch property details using the propertyId from the booking
        const propertyId = bookingData.booking.propertyId
        
        const propertyResponse = await fetch(`/api/properties/${propertyId}`)
        if (!propertyResponse.ok) {
          throw new Error("Failed to fetch property details")
        }
        
        const propertyData = await propertyResponse.json()
        if (!propertyData.success || !propertyData.property) {
          throw new Error("Property not found")
        }
        
        setProperty(propertyData.property)
      } catch (error) {
        console.error("Error fetching details:", error)
        toast({
          title: "Error",
          description: "Could not load booking details. Please try again.",
          variant: "destructive"
        })
      } finally {
        setLoading(false)
      }
    }
    
    fetchDetails()
  }, [bookingId, router, toast, status])
  
  // Function to download booking confirmation (mock)
  const downloadConfirmation = () => {
    toast({
      title: "Download started",
      description: "Your booking confirmation is being downloaded."
    })
    
    // In a real app, this would trigger a PDF download
    // For now, we'll just simulate a delay
    setTimeout(() => {
      toast({
        title: "Download complete",
        description: "Booking confirmation has been downloaded."
      })
    }, 2000)
  }
  
  // Function to share booking (mock)
  const shareBooking = () => {
    // Check if Web Share API is available
    if (navigator.share) {
      navigator.share({
        title: `Booking Confirmation: ${property?.title}`,
        text: `Check out my booking at ${property?.title} from ${new Date(booking?.checkInDate || booking?.dateFrom).toLocaleDateString()} to ${new Date(booking?.checkOutDate || booking?.dateTo).toLocaleDateString()}`,
        url: window.location.href
      })
      .catch(error => {
        console.error('Error sharing:', error);
      });
    } else {
      // Fallback for browsers that don't support the Web Share API
      toast({
        title: "Share link copied",
        description: "Booking confirmation link has been copied to clipboard."
      })
      navigator.clipboard.writeText(window.location.href);
    }
  }
  
  // Show loading state
  if (loading) {
    return (
      <div className="container mx-auto py-24 px-4 flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="h-12 w-12 animate-spin mb-4 text-lightGreen" />
        <h2 className="text-xl font-medium">Loading booking confirmation...</h2>
      </div>
    )
  }
  
  // Show error if booking or property not found
  if (!booking || !property) {
    return (
      <div className="container mx-auto py-24 px-4 text-center">
        <h1 className="text-3xl font-bold mb-4">Booking Not Found</h1>
        <p className="text-muted-foreground mb-8">
          We couldn't find the booking you're looking for.
        </p>
        <Button
          className="bg-gradient-to-r from-lightGreen to-mediumGreen text-darkGreen hover:opacity-90"
          onClick={() => router.push("/")}
        >
          Return Home
        </Button>
      </div>
    )
  }
  
  // Calculate booking duration
  const checkIn = new Date(booking.checkInDate || booking.dateFrom)
  const checkOut = new Date(booking.checkOutDate || booking.dateTo)
  const nights = Math.round((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24))
  
  // Get booking ID (either MongoDB _id or a custom ID field)
  const displayBookingId = booking.bookingId || booking._id || "Unknown"
  
  // Format booking ID to be more readable
  const formattedBookingId = `BK-${displayBookingId.toString().slice(-6).toUpperCase()}`
  
  return (
    <div className="container mx-auto py-24 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 mb-4">
            <CheckCircle className="h-10 w-10 text-green-500" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Booking Confirmed!</h1>
          <p className="text-lg text-muted-foreground">
            Your reservation has been successfully confirmed. We've sent a confirmation email to your inbox.
          </p>
            </div>
        
        <Card className="mb-8 border-green-200">
          <CardHeader>
            <CardTitle>Booking Information</CardTitle>
            <CardDescription>Reference ID: {formattedBookingId}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Property Details */}
            <div className="flex items-center space-x-4">
              <div className="relative h-24 w-24 overflow-hidden rounded-md flex-shrink-0">
                <Image 
                  src={property.thumbnail || "/placeholder.svg"} 
                  alt={property.title} 
                  fill 
                  className="object-cover" 
                />
                </div>
                <div>
                <h3 className="font-medium text-lg">{property.title}</h3>
                <p className="text-sm text-muted-foreground flex items-center mt-1">
                  <MapPin className="h-4 w-4 mr-1" />
                  {property.address?.city || property.city || "Unknown location"}
                </p>
                <div className="flex items-center mt-1 text-sm text-muted-foreground">
                  <Home className="h-4 w-4 mr-1" />
                  <span>{property.propertyType || "Accommodation"}</span>
                </div>
              </div>
            </div>
            
            <Separator />
            
            {/* Stay Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium mb-2">Check-in</h4>
                <div className="flex items-center text-sm">
                  <Calendar className="h-4 w-4 mr-2 text-lightGreen" />
                <div>
                    <p className="font-medium">{format(checkIn, "EEEE, MMMM d, yyyy")}</p>
                    <p className="text-muted-foreground">From 2:00 PM</p>
                  </div>
                </div>
              </div>
              <div>
                <h4 className="font-medium mb-2">Check-out</h4>
                <div className="flex items-center text-sm">
                  <Calendar className="h-4 w-4 mr-2 text-lightGreen" />
                <div>
                    <p className="font-medium">{format(checkOut, "EEEE, MMMM d, yyyy")}</p>
                    <p className="text-muted-foreground">Before 11:00 AM</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-muted p-4 rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <span className="font-medium">Duration</span>
                <span>{nights} {nights === 1 ? "night" : "nights"}</span>
              </div>
              <div className="flex justify-between items-center mb-2">
                <span className="font-medium">Guests</span>
                <span className="flex items-center">
                  <Users className="h-4 w-4 mr-1 text-lightGreen" />
                  {booking.guests} {booking.guests === 1 ? "guest" : "guests"}
                </span>
              </div>
            </div>
            
            <Separator />
            
            {/* Payment Details */}
            <div>
              <h4 className="font-medium mb-3">Payment Summary</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Room price</span>
                  <span>₹{(booking.totalPrice / 1.12).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Taxes (12%)</span>
                  <span>₹{(booking.totalPrice - booking.totalPrice / 1.12).toFixed(2)}</span>
                </div>
                <Separator className="my-2" />
                <div className="flex justify-between font-medium text-base">
                  <span>Total (Paid)</span>
                  <span className="text-green-600">₹{booking.totalPrice?.toFixed(2) || "0.00"}</span>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col sm:flex-row gap-3">
            <Button 
              variant="outline" 
              className="w-full sm:w-auto flex items-center gap-2"
              onClick={downloadConfirmation}
            >
              <Download className="h-4 w-4" />
              Download
            </Button>
            <Button
              variant="outline" 
              className="w-full sm:w-auto flex items-center gap-2"
              onClick={shareBooking}
            >
              <Share2 className="h-4 w-4" />
              Share
            </Button>
            <Button 
              className="w-full sm:w-auto bg-gradient-to-r from-lightGreen to-mediumGreen text-darkGreen hover:opacity-90 flex items-center gap-2 ml-auto"
              onClick={() => router.push("/")}
            >
              Continue Exploring
              <ArrowRight className="h-4 w-4" />
            </Button>
          </CardFooter>
        </Card>
        
        {/* Contact Information */}
            <Card>
              <CardHeader>
            <CardTitle>Need Assistance?</CardTitle>
              </CardHeader>
              <CardContent>
            <p className="text-muted-foreground mb-4">
              If you have any questions or need to modify your reservation, please contact us via:
            </p>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                <span className="font-medium">Email:</span>
                <a href="mailto:support@baithaka.com" className="text-lightGreen hover:underline">
                  support@baithaka.com
                </a>
                  </div>
                  <div className="flex items-center gap-2">
                <span className="font-medium">Phone:</span>
                <a href="tel:+918800123456" className="text-lightGreen hover:underline">
                  +91 8800 123 456
                </a>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
  )
}
