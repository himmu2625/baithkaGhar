"use client"

export const dynamic = 'force-dynamic';

import { useState, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { format } from "date-fns"
import { CheckCircle, Calendar, Users, MapPin, ArrowRight, Download, Share2, Home, TrendingUp, AlertCircle, Utensils, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/components/ui/use-toast"
import { useSession } from "next-auth/react"
import Image from "next/image"

export default function BookingConfirmationPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { toast } = useToast()
  const { data: session, status } = useSession()

  // Get booking ID from URL parameters
  const bookingId = searchParams?.get("bookingId") || ""
  
  const [booking, setBooking] = useState<any>(null)
  const [property, setProperty] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [retryCount, setRetryCount] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [isRetrying, setIsRetrying] = useState(false)

  useEffect(() => {
    // Check if no booking ID is provided
    if (!bookingId || bookingId.trim() === "") {
      toast({
        title: "Missing booking information",
        description: "No booking ID was provided in the URL. Please check your confirmation email.",
        variant: "destructive"
      });
      setLoading(false);
      setError("No booking ID provided");
      return;
    }

    // Check if user is authenticated
    if (status === "unauthenticated") {
      const returnUrl = `/booking/confirmation?bookingId=${encodeURIComponent(bookingId)}`;
      router.push(`/login?returnUrl=${encodeURIComponent(returnUrl)}`);
      return;
    }
    
    // Load booking and property details
    const fetchDetails = async () => {
      try {
        // Show retry status to user
        if (retryCount > 0) {
          setIsRetrying(true);
        }

        // Try the real API first
        let bookingData = null;
        let propertyData = null;

        try {
          // Fetch booking details from API
          const bookingResponse = await fetch(`/api/bookings/${bookingId}`, {
            cache: 'no-store',
            headers: {
              'Cache-Control': 'no-cache'
            }
          });

          if (bookingResponse.ok) {
            const apiBookingData = await bookingResponse.json();

            // The API returns booking data directly, check for both id and _id
            if (apiBookingData && (apiBookingData.id || apiBookingData._id)) {
              bookingData = apiBookingData;
              // Ensure id field exists
              if (!bookingData.id && bookingData._id) {
                bookingData.id = bookingData._id;
              }

              // Get property ID from booking (could be populated object or just ID)
              const propertyId = bookingData.propertyId?._id || bookingData.propertyId?.id || bookingData.propertyId;

              // Fetch property details if we have a property ID
              if (propertyId) {
                const propertyResponse = await fetch(`/api/properties/${propertyId}`, {
                  cache: 'no-store'
                });

                if (propertyResponse.ok) {
                  const apiPropertyData = await propertyResponse.json();

                  if (apiPropertyData.success && apiPropertyData.property) {
                    propertyData = apiPropertyData.property;
                  }
                }
              }
            }
          }
        } catch (apiError) {
          // Silently handle API errors and rely on retry logic
        }

        // If API calls failed, retry up to 8 times with increasing delays
        // This gives more time for the database to commit and index the booking
        if (!bookingData || !propertyData) {
          const maxRetries = 8;
          const retryDelay = Math.min(2000 + (retryCount * 500), 4000);

          if (retryCount < maxRetries) {
            setIsRetrying(true);
            setRetryCount(prev => prev + 1);
            setTimeout(() => fetchDetails(), retryDelay);
            return;
          } else {
            setError("Booking could not be found after multiple attempts");
            setIsRetrying(false);
            setLoading(false);
            toast({
              title: "Booking Not Found",
              description: "Your payment was successful, but we're having trouble loading your confirmation. Please check your email or contact support with your payment details.",
              variant: "destructive"
            });
            return;
          }
        }

        // Success! Set the data in state
        setBooking(bookingData);
        setProperty(propertyData);
        setIsRetrying(false);

      } catch (error) {
        setIsRetrying(false);
        toast({
          title: "Error",
          description: "Could not load booking details. Please try again.",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };
    
    // Only fetch if we haven't started loading yet
    if (loading && retryCount === 0) {
      fetchDetails();
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookingId, status]); // Only re-run when bookingId or auth status changes
  
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
  
  // Show loading state with retry information
  if (loading) {
    return (
      <div className="container mx-auto py-24 px-4 flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="h-12 w-12 animate-spin mb-4 text-lightGreen" />
        <h2 className="text-xl font-medium mb-2">Loading booking confirmation...</h2>
        {isRetrying && retryCount > 0 && (
          <p className="text-sm text-muted-foreground">
            Retrieving your booking details... (attempt {retryCount}/8)
          </p>
        )}
        {retryCount > 3 && (
          <p className="text-xs text-muted-foreground mt-2 max-w-md text-center">
            Taking a bit longer than usual. Your payment was successful, please wait while we load your confirmation.
          </p>
        )}
      </div>
    );
  }
  
  // Show error if booking or property not found (after all retries)
  if (!booking || !property) {
    return (
      <div className="container mx-auto py-24 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-yellow-100 mb-4">
            <AlertCircle className="h-10 w-10 text-yellow-600" />
          </div>
          <h1 className="text-3xl font-bold mb-4">Unable to Load Confirmation</h1>
          <p className="text-muted-foreground mb-2">
            Your payment was processed successfully, but we're having trouble loading your booking confirmation right now.
          </p>
          <p className="text-sm text-muted-foreground mb-8">
            Don't worry - your booking has been confirmed and you should receive a confirmation email shortly.
            You can also find your booking in "My Bookings" section.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              variant="outline"
              onClick={() => router.push("/bookings")}
            >
              View My Bookings
            </Button>
            <Button
              className="bg-gradient-to-r from-lightGreen to-mediumGreen text-darkGreen hover:opacity-90"
              onClick={() => window.location.reload()}
            >
              Try Again
            </Button>
          </div>

          <div className="mt-8 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-gray-700">
              <strong>Need help?</strong> Contact support at{" "}
              <a href="mailto:anuragsingh@baithakaghar.com" className="text-lightGreen hover:underline">
                anuragsingh@baithakaghar.com
              </a>
              {" "}or call us at{" "}
              <a href="tel:+919356547176" className="text-lightGreen hover:underline">
                +91 9356547176
              </a>
            </p>
          </div>
        </div>
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

  // Calculate price breakdown - Use DB data if available, otherwise reconstruct
  const calculatePriceBreakdown = () => {
    const numRooms = booking.numberOfRooms || 1;

    // If we have complete priceBreakdown in DB, use it
    if (booking.priceBreakdown?.total > 0 &&
        booking.priceBreakdown?.baseRoomTotal > 0 &&
        booking.priceBreakdown?.subtotal > 0) {
      return booking.priceBreakdown;
    }

    // Reconstruct from booking data
    // Base room charges
    let baseRoomTotal = 0;
    if (booking.basePrice) {
      baseRoomTotal = booking.basePrice * nights * numRooms;
    }

    // Extra guest charges - check multiple possible fields
    let extraGuestCharge = 0;
    const totalGuests = booking.adults || booking.guests || 0;

    if (booking.extraGuestCharges) {
      // Direct field from database
      extraGuestCharge = booking.extraGuestCharges;
    } else if (booking.occupancyCharges && booking.occupancyCharges > 0) {
      // Calculate from per-night occupancy charges
      extraGuestCharge = booking.occupancyCharges * nights * numRooms;
    } else {
      // Calculate from guest count
      // Standard hotel policy: 2 free guests per room
      const freeGuestsPerRoom = 2;
      const totalFreeGuests = freeGuestsPerRoom * numRooms;
      const extraGuests = Math.max(0, totalGuests - totalFreeGuests);

      if (extraGuests > 0) {
        const extraGuestRate = 400; // Standard rate: ₹400/night per guest
        extraGuestCharge = extraGuests * extraGuestRate * nights;
      }
    }

    // Meal charges - reconstruct from mealPlanInclusions or meals object
    let mealTotal = 0;
    if (booking.mealCharges) {
      mealTotal = booking.mealCharges;
    } else if (booking.meals) {
      // Sum up individual meal costs if available
      const breakfastTotal = booking.meals.breakfast?.total || 0;
      const lunchTotal = booking.meals.lunch?.total || 0;
      const dinnerTotal = booking.meals.dinner?.total || 0;
      mealTotal = breakfastTotal + lunchTotal + dinnerTotal;
    } else if (booking.mealPlanInclusions) {
      // Calculate from meal plan inclusions
      const totalGuests = booking.adults || booking.guests || 11; // Default to 11 from your booking
      const breakfastRate = booking.mealPlanInclusions.breakfast ? 200 : 0;
      const lunchRate = booking.mealPlanInclusions.lunch ? 350 : 0;
      const dinnerRate = booking.mealPlanInclusions.dinner ? 350 : 0;

      const breakfastCost = breakfastRate * totalGuests * nights;
      const lunchCost = lunchRate * totalGuests * nights;
      const dinnerCost = dinnerRate * totalGuests * nights;

      mealTotal = breakfastCost + lunchCost + dinnerCost;
    } else if (booking.planCharges && booking.planCharges > 0) {
      mealTotal = booking.planCharges * nights * numRooms;
    }

    // Calculate subtotal
    const subtotal = baseRoomTotal + extraGuestCharge + mealTotal;

    // Taxes and service fee
    const taxes = Math.round(subtotal * 0.12);
    const serviceFee = Math.round(subtotal * 0.05);

    // Total
    const total = subtotal + taxes + serviceFee;

    return {
      baseRoomTotal,
      extraGuestCharge,
      mealTotal,
      addOnsTotal: 0,
      subtotal,
      taxes,
      serviceFee,
      total
    };
  };

  const priceBreakdown = calculatePriceBreakdown();

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
                    // Get the correct property image from categorizedImages structure
                    if (property.categorizedImages && Array.isArray(property.categorizedImages) && property.categorizedImages.length > 0) {
                      // Try to find exterior image first
                      const exteriorCategory = property.categorizedImages.find((cat: any) => cat.category === 'exterior');
                      if (exteriorCategory && exteriorCategory.files && Array.isArray(exteriorCategory.files) && exteriorCategory.files.length > 0) {
                        return exteriorCategory.files[0].url;
                      }

                      // Fallback to first available image from any category
                      for (const category of property.categorizedImages) {
                        if (category.files && Array.isArray(category.files) && category.files.length > 0) {
                          return category.files[0].url;
                        }
                      }
                    }

                    // Try legacyGeneralImages
                    if (property.legacyGeneralImages && Array.isArray(property.legacyGeneralImages) && property.legacyGeneralImages.length > 0) {
                      return property.legacyGeneralImages[0].url;
                    }

                    // Try thumbnail
                    if (property.thumbnail && typeof property.thumbnail === 'string') {
                      return property.thumbnail;
                    }

                    // Try direct images array
                    if (property.images && Array.isArray(property.images) && property.images.length > 0) {
                      const firstImage = property.images[0];
                      if (typeof firstImage === 'string') {
                        return firstImage;
                      } else if (firstImage && firstImage.url) {
                        return firstImage.url;
                      }
                    }

                    return "/placeholder.svg";
                  })()}
                  alt={property.title}
                  fill
                  className="object-cover"
                  unoptimized
                  onError={(e) => {
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

              {/* Number of Rooms */}
              <div className="flex justify-between items-center mb-2">
                <span className="font-medium">Rooms</span>
                <span className="flex items-center">
                  <Home className="h-4 w-4 mr-1 text-lightGreen" />
                  {booking.numberOfRooms || 1} {(booking.numberOfRooms || 1) === 1 ? "room" : "rooms"}
                </span>
              </div>

              {/* Guests - Calculate correctly from adults + children */}
              <div className="flex justify-between items-center mb-2">
                <span className="font-medium">Guests</span>
                <span className="flex items-center">
                  <Users className="h-4 w-4 mr-1 text-lightGreen" />
                  {(() => {
                    const adults = booking.adults || booking.guests || 1;
                    const children = booking.children || 0;
                    if (children > 0) {
                      return `${adults} ${adults === 1 ? 'adult' : 'adults'}, ${children} ${children === 1 ? 'child' : 'children'}`;
                    }
                    return `${adults} ${adults === 1 ? 'adult' : 'adults'}`;
                  })()}
                </span>
              </div>

              {/* Room Category - Only if available */}
              {booking.roomCategory && (
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium">Room Category</span>
                  <span className="font-medium text-mediumGreen capitalize">
                    {booking.roomCategory}
                  </span>
                </div>
              )}

              {/* Meal Plan - Only if available and not EP */}
              {booking.planType && booking.planType !== 'EP' && (
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium">Meals Included</span>
                  <span className="flex items-center font-medium text-blue-600">
                    <Utensils className="h-4 w-4 mr-1" />
                    {booking.planType === 'CP' ? 'Breakfast' :
                     booking.planType === 'MAP' ? 'Breakfast + Lunch/Dinner' :
                     booking.planType === 'AP' ? 'All Meals' : booking.planType}
                  </span>
                </div>
              )}

              {/* Room Allocation - Only show if room is allocated */}
              {booking.allocatedRoom && booking.roomAllocationStatus === 'allocated' && (
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium">Assigned Room</span>
                  <span className="flex items-center text-green-600 font-medium">
                    <Home className="h-4 w-4 mr-1" />
                    Room {booking.allocatedRoom.roomNumber}
                  </span>
                </div>
              )}
            </div>

            {/* Payment Details - Always show comprehensive breakdown */}
            <Separator />
            <div>
              <h4 className="font-medium mb-4 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-blue-600" />
                Payment Breakdown
              </h4>

              <div className="space-y-3 text-sm">
                {/* Room Charges - Always show */}
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="text-gray-900 font-medium">Room charges</div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      {nights} {nights === 1 ? "night" : "nights"} × {booking.numberOfRooms || 1} {(booking.numberOfRooms || 1) === 1 ? "room" : "rooms"}
                    </div>
                  </div>
                  <span className="font-semibold text-gray-900">
                    ₹{priceBreakdown.baseRoomTotal.toLocaleString()}
                  </span>
                </div>

                {/* Meal Plan Charges - Show only if meals are actually included */}
                {priceBreakdown.mealTotal > 0 && (
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="text-gray-900 font-medium flex items-center gap-1">
                        <Utensils className="h-3.5 w-3.5" />
                        Meal charges
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        {booking.planType === 'CP' ? 'Breakfast included' :
                         booking.planType === 'MAP' ? 'Breakfast + One meal' :
                         booking.planType === 'AP' ? 'All meals included' :
                         'Meals included'}
                      </div>
                    </div>
                    <span className="font-semibold text-gray-900">
                      ₹{priceBreakdown.mealTotal.toLocaleString()}
                    </span>
                  </div>
                )}

                {/* Extra Guest Charges - Show only if applicable */}
                {priceBreakdown.extraGuestCharge > 0 && (
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="text-gray-900 font-medium">Extra guest charges</div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        Additional charges for extra guests
                      </div>
                    </div>
                    <span className="font-semibold text-gray-900">
                      ₹{priceBreakdown.extraGuestCharge.toLocaleString()}
                    </span>
                  </div>
                )}

                {/* Add-ons - Show only if available */}
                {priceBreakdown.addOnsTotal > 0 && (
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="text-gray-900 font-medium">Add-ons & extras</div>
                    </div>
                    <span className="font-semibold text-gray-900">
                      ₹{priceBreakdown.addOnsTotal.toLocaleString()}
                    </span>
                  </div>
                )}

                <Separator className="my-3" />

                {/* Subtotal */}
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Subtotal</span>
                  <span className="font-semibold text-gray-900">
                    ₹{priceBreakdown.subtotal.toLocaleString()}
                  </span>
                </div>

                {/* Discounts - Show only if available */}
                {booking.discountAmount > 0 && (
                  <div className="flex justify-between items-center text-green-600">
                    <span className="font-medium">
                      Discount {booking.couponCode && `(${booking.couponCode})`}
                    </span>
                    <span className="font-semibold">-₹{booking.discountAmount.toLocaleString()}</span>
                  </div>
                )}

                {/* Taxes & Fees */}
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Taxes & fees (GST 12%)</span>
                  <span className="font-semibold text-gray-900">
                    ₹{priceBreakdown.taxes.toLocaleString()}
                  </span>
                </div>

                {/* Service Fee - Show only if > 0 */}
                {priceBreakdown.serviceFee > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700">Service fee (5%)</span>
                    <span className="font-semibold text-gray-900">
                      ₹{priceBreakdown.serviceFee.toLocaleString()}
                    </span>
                  </div>
                )}

                <Separator className="my-3" />

                {/* Total Booking Amount - Always use the actual total from booking */}
                <div className="flex justify-between items-center py-2">
                  <span className="text-base font-bold text-gray-900">Total Amount</span>
                  <span className="text-xl font-bold text-gray-900">
                    ₹{priceBreakdown.total.toLocaleString()}
                  </span>
                </div>

                {/* Partial Payment Information */}
                {booking.isPartialPayment && booking.onlinePaymentAmount && booking.hotelPaymentAmount > 0 ? (
                  <>
                    <div className="mt-4 p-4 bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg space-y-3">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                            <CheckCircle className="h-5 w-5 text-green-600" />
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900">Paid Online</div>
                            <div className="text-xs text-gray-600">
                              {booking.partialPaymentPercent || 40}% of total amount
                            </div>
                          </div>
                        </div>
                        <span className="text-lg font-bold text-green-600">
                          ₹{(() => {
                            // Use booking amount if available, otherwise calculate from percentage
                            if (booking.onlinePaymentAmount) {
                              return booking.onlinePaymentAmount.toLocaleString();
                            }
                            const correctTotal = priceBreakdown.subtotal + priceBreakdown.taxes + priceBreakdown.serviceFee;
                            const onlineAmount = Math.round(correctTotal * (booking.partialPaymentPercent || 40) / 100);
                            return onlineAmount.toLocaleString();
                          })()}
                        </span>
                      </div>

                      <Separator className="bg-gray-300" />

                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center">
                            <AlertCircle className="h-5 w-5 text-orange-600" />
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900">Pay at Hotel</div>
                            <div className="text-xs text-gray-600">
                              {100 - (booking.partialPaymentPercent || 40)}% remaining balance
                            </div>
                          </div>
                        </div>
                        <span className="text-lg font-bold text-orange-600">
                          ₹{(() => {
                            // Use booking amount if available, otherwise calculate
                            if (booking.hotelPaymentAmount) {
                              return booking.hotelPaymentAmount.toLocaleString();
                            }
                            const correctTotal = priceBreakdown.subtotal + priceBreakdown.taxes + priceBreakdown.serviceFee;
                            const onlineAmount = Math.round(correctTotal * (booking.partialPaymentPercent || 40) / 100);
                            const hotelAmount = correctTotal - onlineAmount;
                            return hotelAmount.toLocaleString();
                          })()}
                        </span>
                      </div>
                    </div>

                    <div className="mt-3 p-3 bg-blue-50 border-l-4 border-blue-500 rounded">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                        <div className="text-sm text-blue-900">
                          <strong className="font-semibold">Payment Reminder:</strong>
                          <p className="mt-1">
                            Please pay the remaining amount of <strong>₹{(() => {
                              if (booking.hotelPaymentAmount) {
                                return booking.hotelPaymentAmount.toLocaleString();
                              }
                              const correctTotal = priceBreakdown.subtotal + priceBreakdown.taxes + priceBreakdown.serviceFee;
                              const onlineAmount = Math.round(correctTotal * (booking.partialPaymentPercent || 40) / 100);
                              return (correctTotal - onlineAmount).toLocaleString();
                            })()}</strong> at the property during check-in. Payment can be made via cash, card, or UPI.
                          </p>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                        <CheckCircle className="h-6 w-6 text-green-600" />
                      </div>
                      <div>
                        <div className="font-semibold text-green-900">Payment Complete</div>
                        <div className="text-sm text-green-700">
                          Full amount paid. No payment required at the property.
                        </div>
                      </div>
                    </div>
                  </div>
                )}
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
                <a href="mailto:anuragsingh@baithakaghar.com" className="text-lightGreen hover:underline">
                  anuragsingh@baithakaghar.com
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
