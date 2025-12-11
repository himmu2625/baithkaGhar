"use client"

import React, { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  ArrowLeft,
  Shield,
  CreditCard,
  Lock,
  CheckCircle2,
  AlertCircle,
  Clock,
  MapPin,
  Calendar,
  Users,
  UtensilsCrossed,
  FileText,
  Loader2,
  Info,
} from "lucide-react"

import { useBookingFlow } from "@/lib/booking-flow/context"
import { ProgressIndicator, BOOKING_STEPS } from "@/app/booking/components/ProgressIndicator"
import { PriceBreakdown } from "@/app/booking/components/PriceBreakdown"

// Razorpay types
declare global {
  interface Window {
    Razorpay: any
  }
}

interface RazorpayOptions {
  key: string
  amount: number
  currency: string
  name: string
  description: string
  order_id: string
  prefill: {
    name: string
    email: string
    contact: string
  }
  notes: {
    bookingId: string
  }
  theme: {
    color: string
  }
  handler: (response: RazorpayResponse) => void
  modal: {
    ondismiss: () => void
  }
}

interface RazorpayResponse {
  razorpay_payment_id: string
  razorpay_order_id: string
  razorpay_signature: string
}

export default function PaymentPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const { bookingData, updateBookingData, previousStep, isStepValid } = useBookingFlow()

  // State
  const [agreedToPolicies, setAgreedToPolicies] = useState(bookingData.agreedToPolicies || false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [razorpayLoaded, setRazorpayLoaded] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  const [isNavigating, setIsNavigating] = useState(false)

  // Track mounted state
  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Load Razorpay script
  useEffect(() => {
    // Check if Razorpay is already loaded
    if (typeof window !== "undefined" && window.Razorpay) {
      setRazorpayLoaded(true)
      return
    }

    const script = document.createElement("script")
    script.src = "https://checkout.razorpay.com/v1/checkout.js"
    script.async = true
    script.onload = () => {
      setRazorpayLoaded(true)
      if (typeof window === "undefined" || !window.Razorpay) {
        setError("Payment gateway failed to initialize. Please refresh and try again.")
      }
    }
    script.onerror = () => {
      setError("Failed to load payment gateway. Please check your internet connection and refresh.")
    }
    document.body.appendChild(script)

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script)
      }
    }
  }, [])

  // Redirect if previous steps not completed (after context hydrates)
  useEffect(() => {
    // Don't redirect if user is intentionally navigating
    if (isNavigating) return

    // Wait a bit for context to hydrate from sessionStorage
    const timer = setTimeout(() => {
      if (!isMounted) return

      const { propertyData, roomCategoryData, dateSelection, guestSelection, mealSelection } = bookingData

      if (!isStepValid(1)) {
        // Build review URL with parameters
        if (propertyData && roomCategoryData && dateSelection && guestSelection) {
          let reviewUrl = `/booking/review?propertyId=${propertyData._id}`
          reviewUrl += `&categoryId=${roomCategoryData._id}`
          reviewUrl += `&checkIn=${dateSelection.checkIn.toISOString()}`
          reviewUrl += `&checkOut=${dateSelection.checkOut.toISOString()}`
          reviewUrl += `&rooms=${guestSelection.rooms}`
          reviewUrl += `&adults=${guestSelection.adults}`
          reviewUrl += `&children=${guestSelection.children}`

          if (guestSelection.roomConfigurations && guestSelection.roomConfigurations.length > 0) {
            reviewUrl += `&roomConfigs=${encodeURIComponent(JSON.stringify(guestSelection.roomConfigurations))}`
          }

          if (mealSelection?.selectedMeals && mealSelection.selectedMeals.length > 0) {
            reviewUrl += `&meals=${encodeURIComponent(JSON.stringify(mealSelection.selectedMeals))}`
          }

          router.push(reviewUrl)
        } else {
          router.push("/")
        }
      } else if (!isStepValid(2)) {
        router.push("/booking/guest-details")
      }
    }, 100) // Small delay to allow context hydration

    return () => clearTimeout(timer)
  }, [isMounted, isStepValid, router, bookingData, isNavigating])

  // Extract data from booking context
  const {
    propertyData,
    roomCategoryData,
    dateSelection,
    guestSelection,
    mealSelection,
    pricing,
    guestInfo,
    arrivalTime,
    specialRequests,
    gstDetails,
  } = bookingData

  // Handle back button
  const handleBack = () => {
    setIsNavigating(true)
    updateBookingData({
      agreedToPolicies,
      currentStep: 2,
    })
    previousStep()
    router.push("/booking/guest-details")
  }

  // Create booking and initiate payment
  const handlePayment = async () => {
    if (!agreedToPolicies) {
      setError("Please accept the terms and conditions to proceed")
      return
    }

    if (!razorpayLoaded) {
      setError("Payment gateway is still loading. Please wait...")
      return
    }

    if (!session?.user) {
      setError("You must be logged in to complete booking")
      return
    }

    if (typeof window === "undefined" || !window.Razorpay) {
      setError("Payment gateway not loaded. Please refresh the page and try again.")
      return
    }

    setIsProcessing(true)
    setError(null)

    try {
      // Validate required data before creating payload
      if (!propertyData?._id) {
        throw new Error("Property information is missing. Please go back and try again.")
      }
      if (!dateSelection?.checkIn || !dateSelection?.checkOut) {
        throw new Error("Check-in/check-out dates are missing. Please go back and try again.")
      }
      if (!guestSelection) {
        throw new Error("Guest information is missing. Please go back and try again.")
      }
      if (!pricing?.total || pricing.total <= 0) {
        throw new Error("Invalid pricing information. Please go back and try again.")
      }
      if (!guestInfo?.firstName || !guestInfo?.lastName || !guestInfo?.email || !guestInfo?.phone) {
        throw new Error("Please complete all required guest information fields.")
      }

      const bookingPayload = {
        propertyId: propertyData._id,
        dateFrom: dateSelection.checkIn.toISOString(),
        dateTo: dateSelection.checkOut.toISOString(),
        guests: guestSelection.guests || guestSelection.adults || 1,
        totalPrice: pricing.total,

        // Guest details
        contactDetails: {
          name: `${guestInfo.firstName} ${guestInfo.lastName}`.trim(),
          email: guestInfo.email,
          phone: `${guestInfo.countryCode || ""}${guestInfo.phone}`,
        },

        // Room and guest configuration
        numberOfRooms: guestSelection?.rooms || 1,
        adults: guestSelection?.adults || 1,
        children: guestSelection?.children || 0,
        roomConfigurations: guestSelection?.roomConfigurations || [],

        // Meal selection
        meals: mealSelection,

        // Special requests - convert array to string format
        specialRequests: (() => {
          const requests = specialRequests?.requests || []
          const comments = specialRequests?.comments || ""
          const parts: string[] = []
          
          // Add arrival time if available
          if (arrivalTime) {
            parts.push(`Expected arrival time: ${arrivalTime}`)
          }
          
          // Add request items
          if (requests.length > 0) {
            const requestsText = requests.map(req => req.replace(/([A-Z])/g, " $1").trim()).join(", ")
            parts.push(requestsText)
          }
          
          // Add comments
          if (comments) {
            parts.push(comments)
          }
          
          return parts.length > 0 ? parts.join(". ") : undefined
        })(),

        // GST details
        gstDetails: gstDetails || null,

        // Pricing breakdown
        priceBreakdown: {
          baseRoomTotal: pricing?.baseRoomTotal,
          extraGuestCharge: pricing?.extraGuestCharge,
          mealTotal: pricing?.mealTotal,
          addOnsTotal: pricing?.addOnsTotal,
          subtotal: pricing?.subtotal,
          taxes: pricing?.taxes,
          serviceFee: pricing?.serviceFee,
          total: pricing?.total,
        },

        // Status
        status: "pending",
        paymentStatus: "pending",
      }

      const bookingResponse = await fetch("/api/bookings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(bookingPayload),
      })

      if (!bookingResponse.ok) {
        let errorData: any = null
        let errorText = ""
        
        try {
          const contentType = bookingResponse.headers.get("content-type")
          if (contentType && contentType.includes("application/json")) {
            errorData = await bookingResponse.json()
            console.error("[Payment] API Error Response:", errorData)
          } else {
            errorText = await bookingResponse.text()
            console.error("[Payment] API Error Text:", errorText)
          }
        } catch (parseError) {
          console.error("[Payment] Error parsing error response:", parseError)
          try {
            errorText = await bookingResponse.text()
          } catch (e) {
            errorText = `Failed to create booking (Status: ${bookingResponse.status})`
          }
        }
        
        // Build error message safely
        let errorMessage = "Failed to create booking"
        if (errorData) {
          if (typeof errorData.error === "string") {
            errorMessage = errorData.error
          } else if (typeof errorData.message === "string") {
            errorMessage = errorData.message
          }
          
          // If booking was created but payment failed, provide more context
          if (errorData.bookingCreated && errorData.bookingId) {
            const bookingId = errorData.bookingId 
              ? (typeof errorData.bookingId === "string" ? errorData.bookingId : String(errorData.bookingId))
              : "Unknown"
            errorMessage = `${errorMessage} Booking ID: ${bookingId}. Please contact support to complete payment.`
          }
        } else if (errorText) {
          errorMessage = errorText
        } else {
          errorMessage = `Failed to create booking (Status: ${bookingResponse.status})`
        }
        
        throw new Error(errorMessage)
      }

      const bookingResult = await bookingResponse.json()
      
      // Validate booking result structure
      if (!bookingResult || !bookingResult.booking) {
        console.error("[Payment] Invalid booking result:", bookingResult)
        throw new Error("Invalid response from server. Please try again.")
      }
      
      console.log("[Payment] Booking created:", bookingResult.booking._id)

      // Step 2: Check if payment order was created
      if (!bookingResult.payment || !bookingResult.payment.orderId) {
        const bookingId = bookingResult.booking?._id 
          ? String(bookingResult.booking._id) 
          : bookingResult.bookingId 
            ? String(bookingResult.bookingId)
            : "Unknown"
        throw new Error(
          `Payment order creation failed. Your booking (ID: ${bookingId}) has been created but payment could not be initiated. ` +
          `Please contact support with your booking ID to complete payment.`
        )
      }

      const { orderId, amount, amountInPaise, currency, razorpayKeyId } = bookingResult.payment
      const bookingId = bookingResult.booking?._id ? String(bookingResult.booking._id) : ""

      // Validate payment data
      if (!razorpayKeyId) {
        throw new Error("Razorpay key not configured. Please contact support.")
      }
      if (!orderId) {
        throw new Error("Payment order ID missing. Please contact support.")
      }
      if (!amountInPaise) {
        throw new Error("Payment amount missing. Please contact support.")
      }

      // Step 3: Open Razorpay checkout
      const options: RazorpayOptions = {
        key: razorpayKeyId,
        amount: amountInPaise, // Use amount in paise directly from backend (already converted)
        currency: currency || "INR",
        name: propertyData?.title || "Baithaka GHAR",
        description: `Booking for ${dateSelection?.nights} night${dateSelection?.nights !== 1 ? 's' : ''}`,
        order_id: orderId,
        prefill: {
          name: `${guestInfo?.firstName} ${guestInfo?.lastName}`,
          email: guestInfo?.email || session.user.email || "",
          contact: `${guestInfo?.countryCode}${guestInfo?.phone}` || "",
        },
        notes: {
          bookingId: bookingId,
        },
        theme: {
          color: "#DC2626", // Red-600
        },
        handler: async (response: RazorpayResponse) => {
          await handlePaymentSuccess(response, bookingId)
        },
        modal: {
          ondismiss: () => {
            setIsProcessing(false)
            setError("Payment cancelled. Your booking has been saved but not confirmed. Please complete payment to confirm.")
          },
        },
      }

      try {
        const razorpay = new window.Razorpay(options)
        razorpay.open()
      } catch (razorpayError: any) {
        console.error("[Payment] Razorpay initialization error:", razorpayError)
        throw new Error(`Failed to open payment gateway: ${razorpayError.message}`)
      }

    } catch (err: any) {
      console.error("[Payment] Error:", err)
      setError(err.message || "Failed to initiate payment. Please try again.")
      setIsProcessing(false)
    }
  }

  // Handle payment success
  const handlePaymentSuccess = async (response: RazorpayResponse, bookingId: string) => {
    try {
      // Verify payment with backend
      const verifyResponse = await fetch("/api/payments/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          razorpay_order_id: response.razorpay_order_id,
          razorpay_payment_id: response.razorpay_payment_id,
          razorpay_signature: response.razorpay_signature,
          bookingId: bookingId,
        }),
      })

      if (!verifyResponse.ok) {
        const errorData = await verifyResponse.json()
        throw new Error(errorData.error || "Payment verification failed")
      }

      await verifyResponse.json()

      // Update booking context with payment details
      updateBookingData({
        payment: {
          razorpayOrderId: response.razorpay_order_id,
          razorpayPaymentId: response.razorpay_payment_id,
          razorpaySignature: response.razorpay_signature,
          status: "completed",
          amount: pricing?.total || 0,
          currency: "INR",
          paidAt: new Date().toISOString(),
        },
        bookingId: bookingId,
        currentStep: 4,
      })

      // Redirect to confirmation page
      router.push(`/booking/confirmation?bookingId=${bookingId}`)

    } catch (err: any) {
      console.error("[Payment] Verification error:", err)
      setError(err.message || "Payment verification failed. Please contact support with your payment details.")
      setIsProcessing(false)
    }
  }

  // If data not available, show loading
  if (!propertyData || !roomCategoryData || !dateSelection || !guestSelection || !pricing || !guestInfo) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-red-600 mb-4" />
          <p className="text-gray-600">Loading booking details...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <ProgressIndicator currentStep={3} steps={BOOKING_STEPS} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left side: Review and Payment */}
          <div className="lg:col-span-2 space-y-6">
            {/* Page Header */}
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Review and Pay</h1>
              <p className="text-sm text-gray-600">
                Please review your booking details and complete payment to confirm
              </p>
            </div>

            {/* Error Alert */}
            {error && (
              <Alert className="border-red-200 bg-red-50">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-sm text-red-800">{error}</AlertDescription>
              </Alert>
            )}

            {/* Property Details Card */}
            <Card className="p-6">
              <div className="flex items-start gap-4">
                {propertyData.images && propertyData.images.length > 0 && (
                  <img
                    src={propertyData.images[0]}
                    alt={propertyData.title}
                    className="w-24 h-24 object-cover rounded-lg"
                  />
                )}
                <div className="flex-1">
                  <h2 className="text-xl font-semibold text-gray-900 mb-1">
                    {propertyData.title}
                  </h2>
                  <div className="flex items-center gap-1 text-sm text-gray-600 mb-2">
                    <MapPin className="h-4 w-4" />
                    {propertyData.address?.city}, {propertyData.address?.state}
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {roomCategoryData.name}
                  </Badge>
                </div>
              </div>
            </Card>

            {/* Booking Summary Card */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Booking Summary</h3>

              <div className="space-y-4">
                {/* Dates */}
                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">Check-in & Check-out</p>
                    <p className="text-sm text-gray-600">
                      {dateSelection.checkIn.toLocaleDateString("en-US", {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}{" "}
                      - {dateSelection.checkOut.toLocaleDateString("en-US", {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {dateSelection.nights} night{dateSelection.nights !== 1 ? "s" : ""}
                    </p>
                  </div>
                </div>

                <Separator />

                {/* Guests */}
                <div className="flex items-start gap-3">
                  <Users className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">Guests</p>
                    <p className="text-sm text-gray-600">
                      {guestSelection.rooms} Room{guestSelection.rooms !== 1 ? "s" : ""} •{" "}
                      {guestSelection.adults} Adult{guestSelection.adults !== 1 ? "s" : ""}
                      {guestSelection.children > 0 && ` • ${guestSelection.children} Child${guestSelection.children !== 1 ? "ren" : ""}`}
                    </p>
                  </div>
                </div>

                {/* Meals */}
                {mealSelection && Object.keys(mealSelection).length > 0 && (
                  <>
                    <Separator />
                    <div className="flex items-start gap-3">
                      <UtensilsCrossed className="h-5 w-5 text-gray-400 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">Meals</p>
                        <div className="text-sm text-gray-600">
                          {Object.entries(mealSelection).map(([mealId, count]) => (
                            <div key={mealId}>
                              {count} × {mealId}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {/* Arrival Time */}
                {arrivalTime && (
                  <>
                    <Separator />
                    <div className="flex items-start gap-3">
                      <Clock className="h-5 w-5 text-gray-400 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">Expected Arrival</p>
                        <p className="text-sm text-gray-600">{arrivalTime}</p>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </Card>

            {/* Guest Information Card */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Guest Information</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.push("/booking/guest-details")}
                  className="text-red-600 hover:text-red-700"
                >
                  Edit
                </Button>
              </div>

              <div className="space-y-3">
                <div>
                  <p className="text-xs text-gray-500">Name</p>
                  <p className="text-sm font-medium text-gray-900">
                    {guestInfo.firstName} {guestInfo.lastName}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Email</p>
                  <p className="text-sm font-medium text-gray-900">{guestInfo.email}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Phone</p>
                  <p className="text-sm font-medium text-gray-900">
                    {guestInfo.countryCode} {guestInfo.phone}
                  </p>
                </div>
              </div>

              {/* Special Requests */}
              {(specialRequests?.requests.length > 0 || specialRequests?.comments) && (
                <>
                  <Separator className="my-4" />
                  <div>
                    <p className="text-xs text-gray-500 mb-2">Special Requests</p>
                    {specialRequests.requests.length > 0 && (
                      <ul className="text-sm text-gray-600 space-y-1 mb-2">
                        {specialRequests.requests.map((request) => (
                          <li key={request} className="flex items-center gap-2">
                            <CheckCircle2 className="h-3 w-3 text-green-600" />
                            {request.replace(/([A-Z])/g, " $1").trim()}
                          </li>
                        ))}
                      </ul>
                    )}
                    {specialRequests.comments && (
                      <p className="text-sm text-gray-600 italic">&quot;{specialRequests.comments}&quot;</p>
                    )}
                  </div>
                </>
              )}

              {/* GST Details */}
              {gstDetails && (
                <>
                  <Separator className="my-4" />
                  <div>
                    <p className="text-xs text-gray-500 mb-2">GST Details</p>
                    <div className="space-y-1 text-sm text-gray-600">
                      <p>
                        <span className="font-medium">Company:</span> {gstDetails.companyName}
                      </p>
                      <p>
                        <span className="font-medium">GSTIN:</span> {gstDetails.gstin}
                      </p>
                      <p>
                        <span className="font-medium">Address:</span> {gstDetails.companyAddress}
                      </p>
                    </div>
                  </div>
                </>
              )}
            </Card>

            {/* Cancellation Policy Card */}
            <Card className="p-6">
              <div className="flex items-start gap-3 mb-4">
                <FileText className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">Cancellation Policy</h3>
                  <p className="text-sm text-gray-600">
                    {propertyData.cancellationPolicy || "Free cancellation up to 24 hours before check-in. After that, 50% refund up to 7 days before check-in. No refund for cancellations within 7 days of check-in."}
                  </p>
                </div>
              </div>
            </Card>

            {/* Terms and Conditions */}
            <Card className="p-6 bg-blue-50 border-blue-200">
              <div className="flex items-start gap-3">
                <Checkbox
                  id="terms"
                  checked={agreedToPolicies}
                  onCheckedChange={(checked) => setAgreedToPolicies(checked as boolean)}
                  className="mt-1"
                />
                <div className="flex-1">
                  <Label htmlFor="terms" className="text-sm font-medium cursor-pointer text-gray-900">
                    I agree to the terms and conditions
                  </Label>
                  <p className="text-xs text-gray-600 mt-1">
                    By proceeding with this booking, I acknowledge that I have read and agree to the{" "}
                    <a href="/terms" className="text-blue-600 hover:underline">
                      Terms of Service
                    </a>
                    ,{" "}
                    <a href="/privacy" className="text-blue-600 hover:underline">
                      Privacy Policy
                    </a>
                    , and the property&apos;s cancellation policy listed above.
                  </p>
                </div>
              </div>
            </Card>

            {/* Payment Information */}
            <Alert className="bg-green-50 border-green-200">
              <Shield className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-sm text-green-800">
                <div className="flex items-center gap-2 mb-1">
                  <Lock className="h-3 w-3" />
                  <span className="font-medium">Secure Payment</span>
                </div>
                Your payment information is encrypted and secure. We use Razorpay for payment processing.
              </AlertDescription>
            </Alert>

            {/* Navigation Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                variant="outline"
                onClick={handleBack}
                disabled={isProcessing}
                className="flex items-center justify-center gap-2 flex-1"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Guest Details
              </Button>
              <Button
                onClick={handlePayment}
                disabled={!agreedToPolicies || isProcessing || !razorpayLoaded}
                className="flex items-center justify-center gap-2 flex-1 bg-red-600 hover:bg-red-700 text-white disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CreditCard className="h-4 w-4" />
                    Pay ₹{pricing.total.toLocaleString("en-IN")}
                  </>
                )}
              </Button>
            </div>

            {!razorpayLoaded && (
              <Alert className="border-blue-200 bg-blue-50">
                <Info className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-sm text-blue-800">
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Loading secure payment gateway... Please wait.</span>
                  </div>
                </AlertDescription>
              </Alert>
            )}
          </div>

          {/* Right side: Price Breakdown */}
          <div className="lg:col-span-1">
            <Card className="sticky top-4 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Price Details</h3>

              <PriceBreakdown
                pricing={pricing}
                nights={dateSelection.nights}
                rooms={guestSelection.rooms}
                showDetails={true}
              />

              <Separator className="my-4" />

              {/* Trust Badges */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span>Instant Booking Confirmation</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <Shield className="h-4 w-4 text-green-600" />
                  <span>Secure Payment Processing</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <Lock className="h-4 w-4 text-green-600" />
                  <span>Your Data is Protected</span>
                </div>
              </div>

              <Alert className="mt-4 bg-yellow-50 border-yellow-200">
                <Info className="h-4 w-4 text-yellow-600" />
                <AlertDescription className="text-xs text-yellow-800">
                  Final price includes all taxes and fees. No hidden charges.
                </AlertDescription>
              </Alert>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
