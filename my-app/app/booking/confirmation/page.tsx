"use client"

export const dynamic = 'force-dynamic';

import { useState, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { format } from "date-fns"
import { CheckCircle, Calendar, Users, MapPin, ArrowRight, Download, Share2, Home, TrendingUp, Sparkles, AlertCircle } from "lucide-react"
import SavingsHighlight from "@/components/booking/SavingsHighlight"
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
  
  // Log all parameters for debugging
  useEffect(() => {
    console.log("Confirmation Page URL:", window.location.href);
    if (searchParams) {
      const paramsObj: Record<string, string> = {};
      searchParams.forEach((value, key) => {
        paramsObj[key] = value;
      });
      console.log("Search params:", paramsObj);
    }
  }, [searchParams]);
  
  // Get booking ID from URL parameters
  const bookingId = searchParams?.get("bookingId") || ""
  
  const [booking, setBooking] = useState<any>(null)
  const [property, setProperty] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    console.log("Confirmation page loaded with bookingId:", bookingId);
    
    // Check if no booking ID is provided
    if (!bookingId || bookingId.trim() === "") {
      console.log("No bookingId found, showing error");
      toast({
        title: "Missing booking information",
        description: "No booking ID was provided.",
        variant: "destructive"
      });
      setLoading(false);
      return;
    }
    
    // Check if user is authenticated
    if (status === "unauthenticated") {
      console.log("User not authenticated, redirecting to login");
      const returnUrl = `/booking/confirmation?bookingId=${encodeURIComponent(bookingId)}`;
      router.push(`/login?returnUrl=${encodeURIComponent(returnUrl)}`);
      return;
    }
    
    // Load booking and property details
    const fetchDetails = async () => {
      try {
        console.log("Fetching booking details for ID:", bookingId);
        
        // Try the real API first
        let bookingData = null;
        let propertyData = null;
        
        try {
          // Fetch booking details from API
          const bookingResponse = await fetch(`/api/bookings/${bookingId}`);
          console.log("Booking API response status:", bookingResponse.status);
          
          if (bookingResponse.ok) {
            const apiBookingData = await bookingResponse.json();
            console.log("Raw booking API response:", apiBookingData);
            
            // The API returns booking data directly, not wrapped in a booking property
            if (apiBookingData && apiBookingData.id) {
              bookingData = apiBookingData;
              console.log("Booking data received:", bookingData);
              
              // Get property ID from booking (could be populated object or just ID)
              const propertyId = bookingData.propertyId?.id || bookingData.propertyId;
              console.log("Property ID extracted:", propertyId);
              
              // Fetch property details if we have a property ID
              if (propertyId) {
                console.log("Fetching property details for ID:", propertyId);
                const propertyResponse = await fetch(`/api/properties/${propertyId}`);
                console.log("Property API response status:", propertyResponse.status);
                
                if (propertyResponse.ok) {
                  const apiPropertyData = await propertyResponse.json();
                  console.log("Raw property API response:", apiPropertyData);
                  
                  if (apiPropertyData.success && apiPropertyData.property) {
                    propertyData = apiPropertyData.property;
                    console.log("Property data received:", propertyData);
                  }
                }
              }
            } else {
              console.log("Invalid booking data structure:", apiBookingData);
            }
          } else {
            console.log("Booking API failed with status:", bookingResponse.status);
            const errorText = await bookingResponse.text();
            console.log("Error response:", errorText);
          }
        } catch (apiError) {
          console.log("API error:", apiError);
        }
        
        // If API calls failed, redirect to error page
        if (!bookingData || !propertyData) {
          console.log("Booking or property data not found - redirecting to home");
          toast({
            title: "Booking Not Found",
            description: "The booking could not be found in our system.",
            variant: "destructive"
          });
          router.push("/");
          return;
        }
        
        // Set the data in state
        setBooking(bookingData);
        setProperty(propertyData);
        console.log("Booking and property data set in state");
        
      } catch (error) {
        console.error("Error fetching details:", error);
        toast({
          title: "Error",
          description: "Could not load booking details. Please try again.",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };
    
    // Load the booking details
    fetchDetails();
  }, [bookingId, router, toast, status]);
  
  // Function to download booking confirmation (real implementation)
  const downloadConfirmation = async () => {
    try {
      setLoading(true);
      toast({
        title: "Generating invoice...",
        description: "Please wait while we prepare your invoice."
      });

      // Call the invoice generation API
      const response = await fetch(`/api/bookings/${bookingId}/invoice`, {
        method: 'GET',
      });

      if (!response.ok) {
        throw new Error('Failed to generate invoice');
      }

      // Get the HTML content
      const htmlContent = await response.text();
      
      // Create a blob with the HTML content
      const blob = new Blob([htmlContent], { type: 'text/html' });
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `invoice-${formattedBookingId}.html`;
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Download complete",
        description: "Invoice has been downloaded successfully. You can open it in any web browser."
      });
    } catch (error) {
      console.error('Download error:', error);
      toast({
        title: "Download failed",
        description: "Unable to download invoice. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Function to share booking (mock)
  const shareBooking = () => {
    if (navigator.share) {
      navigator.share({
        title: `Booking Confirmation: ${property?.title}`,
        text: `Check out my booking at ${property?.title}`,
        url: window.location.href
      })
      .catch(error => {
        console.error('Error sharing:', error);
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast({
        title: "Share link copied",
        description: "Booking confirmation link has been copied to clipboard."
      });
    }
  };
  
  // Show loading state
  if (loading) {
    return (
      <div className="container mx-auto py-24 px-4 flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="h-12 w-12 animate-spin mb-4 text-lightGreen" />
        <h2 className="text-xl font-medium">Loading booking confirmation...</h2>
      </div>
    );
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
    );
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
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 70vw"
                  src={(() => {
                    console.log("[ConfirmationPage] Property data for image:", property);
                    
                    // Get the correct property image from categorizedImages structure
                    if (property.categorizedImages && Array.isArray(property.categorizedImages) && property.categorizedImages.length > 0) {
                      console.log("[ConfirmationPage] Found categorizedImages:", property.categorizedImages.length);
                      
                      // Try to find exterior image first
                      const exteriorCategory = property.categorizedImages.find((cat: any) => cat.category === 'exterior');
                      if (exteriorCategory && exteriorCategory.files && Array.isArray(exteriorCategory.files) && exteriorCategory.files.length > 0) {
                        console.log("[ConfirmationPage] Using exterior image:", exteriorCategory.files[0].url);
                        return exteriorCategory.files[0].url;
                      }
                      
                      // Fallback to first available image from any category
                      for (const category of property.categorizedImages) {
                        if (category.files && Array.isArray(category.files) && category.files.length > 0) {
                          console.log("[ConfirmationPage] Using first available image:", category.files[0].url);
                          return category.files[0].url;
                        }
                      }
                    }
                    
                    // Try legacyGeneralImages
                    if (property.legacyGeneralImages && Array.isArray(property.legacyGeneralImages) && property.legacyGeneralImages.length > 0) {
                      console.log("[ConfirmationPage] Using legacy image:", property.legacyGeneralImages[0].url);
                      return property.legacyGeneralImages[0].url;
                    }
                    
                    // Try thumbnail
                    if (property.thumbnail && typeof property.thumbnail === 'string') {
                      console.log("[ConfirmationPage] Using thumbnail:", property.thumbnail);
                      return property.thumbnail;
                    }
                    
                    // Try direct images array
                    if (property.images && Array.isArray(property.images) && property.images.length > 0) {
                      const firstImage = property.images[0];
                      if (typeof firstImage === 'string') {
                        console.log("[ConfirmationPage] Using direct image string:", firstImage);
                        return firstImage;
                      } else if (firstImage && firstImage.url) {
                        console.log("[ConfirmationPage] Using direct image object:", firstImage.url);
                        return firstImage.url;
                      }
                    }
                    
                    console.log("[ConfirmationPage] No valid image found, using placeholder");
                    return "/placeholder.svg";
                  })()} 
                  alt={property.title} 
                  fill 
                  className="object-cover" 
                  unoptimized
                  onError={(e) => {
                    console.log(`[ConfirmationPage] Image load error, using placeholder`);
                    (e.target as HTMLImageElement).src = "/placeholder.svg";
                  }}
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
              {/* Room Allocation Information - Only show if room allocation is applicable */}
              {booking.roomAllocationStatus && booking.roomAllocationStatus !== 'not_applicable' && (
                <>
                  {booking.allocatedRoom && booking.roomAllocationStatus === 'allocated' && (
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium">Allocated Room</span>
                      <span className="flex items-center text-green-600 font-medium">
                        <Home className="h-4 w-4 mr-1" />
                        {booking.allocatedRoom.unitTypeName} - Room {booking.allocatedRoom.roomNumber}
                      </span>
                    </div>
                  )}
                  {booking.roomAllocationStatus === 'failed' && (
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium">Room Status</span>
                      <span className="flex items-center text-orange-600">
                        <AlertCircle className="h-4 w-4 mr-1" />
                        Room allocation pending
                      </span>
                    </div>
                  )}
                  {booking.roomAllocationStatus === 'pending' && (
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium">Room Status</span>
                      <span className="flex items-center text-blue-600">
                        <AlertCircle className="h-4 w-4 mr-1" />
                        Room assignment in progress
                      </span>
                    </div>
                  )}
                </>
              )}
            </div>
            
            <Separator />
            
            {/* Payment Details with Dynamic Pricing Info */}
            <div>
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-blue-600" />
                Payment Summary
              </h4>
              


              {/* Savings Highlight */}
              {/* Removed SavingsHighlight - only show if real savings exist */}

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Base room price ({nights} {nights === 1 ? "night" : "nights"})</span>
                  <span>₹{Math.round((booking.totalPrice / 1.12) / nights).toLocaleString()} × {nights}</span>
                </div>
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>₹{(booking.totalPrice / 1.12).toFixed(2)}</span>
                </div>
                
                {/* Show any applied discounts */}
                {booking.appliedPromotions && booking.appliedPromotions.length > 0 && (
                  <div className="space-y-1">
                    {booking.appliedPromotions.map((promo: any, index: number) => (
                      <div key={index} className="flex justify-between text-green-600">
                        <span>• {promo.name} discount</span>
                        <span>-₹{promo.discount?.toFixed(2) || '0.00'}</span>
                      </div>
                    ))}
                  </div>
                )}
                
                <div className="flex justify-between">
                  <span>Taxes & fees (12%)</span>
                  <span>₹{(booking.totalPrice - booking.totalPrice / 1.12).toFixed(2)}</span>
                </div>
                <Separator className="my-2" />
                <div className="flex justify-between font-medium text-base">
                  <span>Total Amount Paid</span>
                  <span className="text-green-600">₹{booking.totalPrice?.toFixed(2) || "0.00"}</span>
                </div>
                
                {/* Market comparison */}
                <div className="mt-3 pt-2 border-t border-gray-100">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Avg. market rate for similar properties</span>
                    <span>₹{Math.round((booking.totalPrice / 1.12) * 1.15).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-xs font-medium text-green-600 mt-1">
                    <span>Your savings</span>
                    <span>₹{Math.round((booking.totalPrice / 1.12) * 0.15).toLocaleString()}</span>
                  </div>
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
                <div className="space-y-1">
                  <a href="tel:+919356547176" className="text-lightGreen hover:underline block">
                    +91 9356547176
                  </a>
                  <a href="tel:+919936712614" className="text-lightGreen hover:underline block">
                    +91 9936712614
                  </a>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
