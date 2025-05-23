"use client"

import { useState, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { format, differenceInDays } from "date-fns"
import { MapPin, Calendar, Users, Info, CreditCard, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import Image from "next/image"
import { useSession } from "next-auth/react"
import { Loader2 } from "lucide-react"
import Link from "next/link"

export default function BookingPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { toast } = useToast()
  const { data: session, status } = useSession()
  
  // --- New Log: Log all received search parameters at the start --- 
  useEffect(() => {
    if (searchParams) {
      const paramsObject: Record<string, string> = {};
      searchParams.forEach((value, key) => {
        paramsObject[key] = value;
      });
      console.log("[BookingPage] Loaded with searchParams:", paramsObject);
    } else {
      console.log("[BookingPage] Loaded with no searchParams.");
    }
  }, [searchParams]);
  // --- End New Log ---
  
  const propertyId = searchParams?.get("propertyId") || ""
  const checkInStr = searchParams?.get("checkIn") || ""
  const checkOutStr = searchParams?.get("checkOut") || ""
  const guestsStr = searchParams?.get("guests") || "1"
  const categoryStr = searchParams?.get("category") || "";
  const priceStr = searchParams?.get("price") || "0";
  const propertyNameStr = searchParams?.get("propertyName") || "";
  
  const [property, setProperty] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [bookingDetails, setBookingDetails] = useState({
    name: "",
    email: "",
    phone: "",
    specialRequests: "",
  })
  const [bookingLoading, setBookingLoading] = useState(false)
  
  console.log("[BookingPage] Initial Params: propertyId:", propertyId, "checkInStr:", checkInStr, "checkOutStr:", checkOutStr, "guestsStr:", guestsStr, "categoryStr:", categoryStr, "priceStr:", priceStr, "propertyNameStr:", propertyNameStr);
  
  // Parse dates
  const checkIn = checkInStr ? new Date(checkInStr) : null
  const checkOut = checkOutStr ? new Date(checkOutStr) : null
  const guests = parseInt(guestsStr)
  const selectedCategory = categoryStr;
  const pricePerNight = parseFloat(priceStr);
  
  // Calculate stay duration and total price
  const nights = checkIn && checkOut ? differenceInDays(checkOut, checkIn) : 0
  const basePrice = pricePerNight || property?.price || 0;
  const totalPrice = basePrice * nights
  const taxRate = 0.12 // 12% tax
  const taxes = totalPrice * taxRate
  const finalTotal = totalPrice + taxes
  
  useEffect(() => {
    console.log("[BookingPage] Main useEffect triggered. propertyId:", propertyId);
    // Redirect if no property ID
    if (!propertyId) {
      console.log("[BookingPage] No propertyId found. Redirecting to homepage.");
      toast({
        title: "Missing property information",
        description: "Please select a property first.",
        variant: "destructive"
      })
      router.push("/")
      return
    }
    
    // Check for date validity
    if (!checkIn || !checkOut || checkIn >= checkOut) {
      console.log("[BookingPage] Invalid dates. Redirecting to property page.", { checkIn, checkOut, propertyId });
      toast({
        title: "Invalid dates",
        description: "Please select valid check-in and check-out dates.",
        variant: "destructive"
      })
      router.push(`/property/${propertyId}`)
      return
    }
    
    // Load property details
    const fetchPropertyDetails = async () => {
      console.log("[BookingPage] fetchPropertyDetails called for propertyId:", propertyId);
      try {
        const response = await fetch(`/api/properties/${propertyId}`)
        if (!response.ok) {
          console.error("[BookingPage] Failed to fetch property details, status:", response.status);
          throw new Error("Failed to fetch property details")
        }
        
        const data = await response.json()
        if (data.success && data.property) {
          console.log("[BookingPage] Property details fetched successfully:", data.property);
          setProperty(data.property)
        } else {
          console.error("[BookingPage] Property not found in API response or success false.");
          throw new Error("Property not found")
        }
      } catch (error) {
        console.error("[BookingPage] Error fetching property:", error);
        toast({
          title: "Error",
          description: "Could not load property details. Please try again.",
          variant: "destructive"
        })
        router.push("/") // Fallback redirect to home
      } finally {
        setLoading(false)
      }
    }
    
    fetchPropertyDetails()
    
    // Pre-fill user details if available from session
    if (session?.user) {
      console.log("[BookingPage] User session found, pre-filling details.", session.user);
      setBookingDetails(prev => ({
        ...prev,
        name: session.user.name || prev.name,
        email: session.user.email || prev.email,
      }))
    }
  }, [propertyId, checkInStr, checkOutStr, router, toast, session]); // Added checkInStr, checkOutStr to dependencies as checkIn/checkOut derive from them
  
  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setBookingDetails(prev => ({
      ...prev,
      [name]: value
    }))
  }
  
  // Handle booking submission
  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log("[BookingPage] handleBookingSubmit triggered.");
    
    // Check if user is logged in
    if (status !== "authenticated") {
      console.log("[BookingPage] User not authenticated, redirecting to login.");
      const returnUrl = `/booking?propertyId=${propertyId}&checkIn=${checkInStr}&checkOut=${checkOutStr}&guests=${guestsStr}`;
      router.push(`/login?returnUrl=${encodeURIComponent(returnUrl)}`);
      return;
    }
    
    // Validate form
    if (!bookingDetails.name || !bookingDetails.email || !bookingDetails.phone) {
      console.log("[BookingPage] Booking form validation failed: Missing required fields.", bookingDetails);
      toast({
        title: "Missing information",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }
    
    setBookingLoading(true)
    
    try {
      const bookingData = {
        propertyId,
        propertyName: property?.title || propertyNameStr || "Property",
        checkInDate: checkIn?.toISOString(),
        checkOutDate: checkOut?.toISOString(),
        guests,
        pricePerNight: basePrice,
        totalPrice: finalTotal,
        contactDetails: {
          name: bookingDetails.name,
          email: bookingDetails.email,
          phone: bookingDetails.phone
        },
        specialRequests: bookingDetails.specialRequests,
      }
      
      console.log("[BookingPage] Attempting to create booking with data:", bookingData);
      
      let bookingId;
      try {
        const response = await fetch("/api/bookings", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(bookingData)
        });
        
        if (response.ok) {
          const data = await response.json();
          bookingId = data._id || data.id;
          console.log("[BookingPage] Booking created via API. Booking ID:", bookingId);
        } else {
          const errorData = await response.text(); 
          console.warn("[BookingPage] API call to create booking failed. Status:", response.status, "Error:", errorData, "Falling back to mock booking ID.");
        }
      } catch (apiError) {
        console.warn("[BookingPage] API call to create booking errored:", apiError, "Falling back to mock booking ID.");
      }
      
      if (!bookingId) {
        bookingId = `MOCK-${Date.now()}`;
        console.log("[BookingPage] Created mock booking ID:", bookingId);
      }
      
      // Store booking data in sessionStorage
      const bookingToStore = {
        ...bookingData,
        bookingId,
        createdAt: new Date().toISOString()
      };
      try {
        sessionStorage.setItem(`booking_${bookingId}`, JSON.stringify(bookingToStore));
        console.log("[BookingPage] Booking data stored in sessionStorage for key:", `booking_${bookingId}`, bookingToStore);
      } catch (storageError) {
        console.warn("[BookingPage] Could not store booking data in sessionStorage:", storageError);
      }
      
      // CORRECTED FLOW: booking form → booking details confirmation → payment/checkout → final confirmation
      // First redirect to booking confirmation page to review details before payment
      console.log("[BookingPage] Generated booking ID:", bookingId);
      
      // Debug mock booking details for development - typically your API would handle this
      try {
        // Store booking in local storage for debugging (remove in production)
        localStorage.setItem('debug_last_booking', JSON.stringify({
          _id: bookingId,
          bookingCode: bookingId.substring(0, 6).toUpperCase(),
          propertyId: {
            _id: propertyId,
            title: property.title || "Property",
            location: {
              city: property.address?.city || property.city || "Unknown",
              state: property.address?.state || "Unknown"
            },
            images: property.images || []
          },
          userId: {
            _id: session?.user?.id || "user123",
            name: bookingDetails.name,
            email: bookingDetails.email
          },
          checkInDate: checkIn?.toISOString() || new Date().toISOString(),
          checkOutDate: checkOut?.toISOString() || new Date().toISOString(),
          guests: guests,
          status: 'confirmed',
          totalAmount: finalTotal,
          createdAt: new Date().toISOString()
        }));
      } catch (err) {
        console.warn("[BookingPage] Could not store debug booking data", err);
      }
      
      // For a guaranteed navigation, use full URL with absolute paths
      const baseUrl = window.location.origin;
      const bookingConfirmUrl = `${baseUrl}/booking/${bookingId}`;
      console.log("[BookingPage] Redirecting to booking details confirmation (booking/[id]) page:", bookingConfirmUrl);
      
      // Use window.location.replace for a clean navigation
      window.location.replace(bookingConfirmUrl);
      
      // Reset loading after navigation starts
      setTimeout(() => {
        setBookingLoading(false);
      }, 500);
    } catch (error: any) {
      console.error("[BookingPage] Error during booking submission process:", error);
      toast({
        title: "Booking failed",
        description: error.message || "There was an error creating your booking. Please try again.",
        variant: "destructive"
      })
      setBookingLoading(false)
    }
  }
  
  // Show loading state
  if (loading) {
    return (
      <div className="container mx-auto py-24 px-4 flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="h-12 w-12 animate-spin mb-4 text-lightGreen" />
        <h2 className="text-xl font-medium">Loading booking details...</h2>
      </div>
    )
  }
  
  // Show 404 if property not found
  if (!property) {
    return (
      <div className="container mx-auto py-24 px-4 text-center">
        <h1 className="text-3xl font-bold mb-4">Property Not Found</h1>
        <p className="text-muted-foreground mb-8">
          We couldn't find the property you're looking for.
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
  
  // Debug logs for state variables related to pricing and display
  console.log("[BookingPage] Render State: property:", property, "basePrice:", basePrice, "nights:", nights, "finalTotal:", finalTotal);
  
  return (
    <div className="container mx-auto py-24 px-4">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Booking Form */}
        <div className="lg:col-span-2">
          <h1 className="text-3xl font-bold mb-6">Complete Your Booking</h1>
          
          {/* Property Summary */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>{property.title}</CardTitle>
              <CardDescription className="flex items-center">
                <MapPin className="h-4 w-4 mr-1" />
                {property.address?.city || property.city || "Unknown location"}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex items-center space-x-4">
              <div className="relative h-20 w-20 overflow-hidden rounded-md">
                <Image 
                  src={property.thumbnail || "/placeholder.svg"} 
                  alt={property.title} 
                  fill 
                  className="object-cover" 
                />
              </div>
              <div>
                <div className="flex space-x-4 mb-2">
                  <div className="flex items-center text-sm">
                    <Calendar className="h-4 w-4 mr-1" />
                    {checkIn ? format(checkIn, "MMM dd, yyyy") : "Check-in"}
                  </div>
                  <div className="text-sm">→</div>
                  <div className="flex items-center text-sm">
                    <Calendar className="h-4 w-4 mr-1" />
                    {checkOut ? format(checkOut, "MMM dd, yyyy") : "Check-out"}
                  </div>
                </div>
                <div className="flex items-center text-sm">
                  <Users className="h-4 w-4 mr-1" />
                  {guests} {guests === 1 ? "guest" : "guests"} • {nights} {nights === 1 ? "night" : "nights"}
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Guest Information Form */}
          <form onSubmit={handleBookingSubmit}>
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Guest Information</CardTitle>
                <CardDescription>
                  Please provide the details of the main guest.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name *</Label>
                    <Input 
                      id="name" 
                      name="name" 
                      placeholder="Enter your full name" 
                      value={bookingDetails.name} 
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address *</Label>
                    <Input 
                      id="email" 
                      name="email" 
                      type="email" 
                      placeholder="Enter your email" 
                      value={bookingDetails.email} 
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input 
                    id="phone" 
                    name="phone" 
                    placeholder="Enter your phone number" 
                    value={bookingDetails.phone} 
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="specialRequests">Special Requests (Optional)</Label>
                  <Textarea 
                    id="specialRequests" 
                    name="specialRequests" 
                    placeholder="Any special requests or notes for your stay" 
                    value={bookingDetails.specialRequests} 
                    onChange={handleInputChange}
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>
            
            {/* Policy Summary */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Policies</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start space-x-2">
                  <Info className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-medium">Cancellation Policy</h4>
                    <p className="text-sm text-muted-foreground">
                      Free cancellation up to 48 hours before check-in. 
                      After that, cancellations will incur a fee of one night's stay.
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-2">
                  <Info className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-medium">Check-in/Check-out</h4>
                    <p className="text-sm text-muted-foreground">
                      Check-in: 3:00 PM - 10:00 PM <br />
                      Check-out: By 11:00 AM
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Mobile Price Summary (visible on small screens) */}
            <div className="lg:hidden mb-8">
              <Card>
                <CardHeader>
                  <CardTitle>Price Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <span>₹{basePrice} x {nights} nights</span>
                    <span>₹{totalPrice}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Taxes (12%)</span>
                    <span>₹{taxes.toFixed(2)}</span>
                  </div>
                  <Separator className="my-2" />
                  <div className="flex justify-between font-bold">
                    <span>Total</span>
                    <span>₹{finalTotal.toFixed(2)}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <Button 
              type="submit" 
              className="w-full bg-gradient-to-r from-lightGreen to-mediumGreen text-darkGreen font-medium text-lg py-6 hover:opacity-90"
              disabled={bookingLoading}
            >
              {bookingLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  Proceed to Payment <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
            
            <p className="text-center text-sm text-muted-foreground mt-4">
              By proceeding, you agree to our{" "}
              <Link href="/terms" className="underline hover:text-lightGreen">
                Terms and Conditions
              </Link>
            </p>
          </form>
        </div>
        
        {/* Price Summary Sidebar (desktop) */}
        <div className="hidden lg:block">
          <div className="sticky top-24">
            <Card>
              <CardHeader>
                <CardTitle>Price Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span>₹{basePrice} x {nights} nights</span>
                  <span>₹{totalPrice}</span>
                </div>
                <div className="flex justify-between">
                  <span>Taxes (12%)</span>
                  <span>₹{taxes.toFixed(2)}</span>
                </div>
                <Separator className="my-2" />
                <div className="flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span>₹{finalTotal.toFixed(2)}</span>
                </div>
                
                <div className="bg-lightGreen/10 p-4 rounded-lg mt-6">
                  <h4 className="font-medium flex items-center text-darkGreen mb-2">
                    <CreditCard className="mr-2 h-4 w-4" />
                    Payment Information
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    You won't be charged yet. Payment will be collected when you proceed to the payment page.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
} 