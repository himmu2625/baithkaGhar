"use client"

import { useState, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Loader2, CheckCircle2, AlertCircle, CreditCard, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/components/ui/use-toast"
import { useSession } from "next-auth/react"
import Image from "next/image"
import Link from "next/link"

export default function CheckoutPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { toast } = useToast()
  const { data: session, status } = useSession()
  
  const bookingId = searchParams?.get("bookingId") || ""
  const propertyId = searchParams?.get("propertyId") || ""
  
  const [booking, setBooking] = useState<any>(null)
  const [property, setProperty] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [paymentLoading, setPaymentLoading] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState("card")
  const [paymentStatus, setPaymentStatus] = useState<"idle" | "processing" | "success" | "error">("idle")
  const [cardDetails, setCardDetails] = useState({
    cardNumber: "",
    cardName: "",
    expiryDate: "",
    cvv: "",
  })
  
  // For demo purposes - this simulates the actual payment processing
  const [paymentSimulationStep, setPaymentSimulationStep] = useState(0)
  
  useEffect(() => {
    // Redirect if no booking ID
    if (!bookingId || !propertyId) {
      toast({
        title: "Missing booking information",
        description: "Please complete the booking process first.",
        variant: "destructive"
      })
      router.push("/")
      return
    }
    
    // Check if user is authenticated
    if (status === "unauthenticated") {
      router.push(`/login?returnUrl=${encodeURIComponent(`/checkout?bookingId=${bookingId}&propertyId=${propertyId}`)}`)
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
        
        // Fetch property details
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
  }, [bookingId, propertyId, router, toast, status])
  
  // Handles card input changes
  const handleCardInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setCardDetails(prev => ({
      ...prev,
      [name]: value
    }))
  }
  
  // Format card number with spaces
  const formatCardNumber = (value: string) => {
    return value
      .replace(/\s/g, "") // Remove existing spaces
      .replace(/(\d{4})/g, "$1 ") // Add space after every 4 digits
      .trim() // Remove trailing spaces
  }
  
  // Process payment
  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate card details if card payment is selected
    if (paymentMethod === "card") {
      if (!cardDetails.cardNumber || !cardDetails.cardName || !cardDetails.expiryDate || !cardDetails.cvv) {
        toast({
          title: "Missing information",
          description: "Please fill in all required card details.",
          variant: "destructive"
        })
        return
      }
    }
    
    setPaymentLoading(true)
    setPaymentStatus("processing")
    
    // Simulate payment processing with progress steps
    setPaymentSimulationStep(1) // Step 1: Verifying details
    
    try {
      // For demo purposes, we'll simulate API calls with timeouts
      
      // Step 1: Verify card details (1 second)
      await new Promise(resolve => setTimeout(resolve, 1000))
      setPaymentSimulationStep(2) // Step 2: Processing payment
      
      // Step 2: Process payment (2 seconds)
      await new Promise(resolve => setTimeout(resolve, 2000))
      setPaymentSimulationStep(3) // Step 3: Finalizing booking
      
      // Step 3: Create payment record (1 second)
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // In a real app, you would make an API call like this:
      /*
      const response = await fetch("/api/payments/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          bookingId,
          propertyId,
          paymentMethod,
          amount: booking.totalPrice || 0
        })
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || "Payment failed")
      }
      */
      
      // Final step: Success
      setPaymentStatus("success")
      setPaymentSimulationStep(4)
      
      // Wait 2 seconds before redirecting to confirmation page
      setTimeout(() => {
        // Use direct navigation to booking confirmation page
        const confirmationUrl = `/booking/confirmation?bookingId=${encodeURIComponent(bookingId)}`;
        console.log("Redirecting to booking confirmation:", confirmationUrl);
        window.location.href = confirmationUrl;
      }, 2000)
    } catch (error: any) {
      console.error("Payment error:", error)
      setPaymentStatus("error")
      toast({
        title: "Payment failed",
        description: error.message || "There was an error processing your payment. Please try again.",
        variant: "destructive"
      })
    } finally {
      setPaymentLoading(false)
    }
  }
  
  // Show loading state
  if (loading) {
    return (
      <div className="container mx-auto py-24 px-4 flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="h-12 w-12 animate-spin mb-4 text-lightGreen" />
        <h2 className="text-xl font-medium">Loading payment details...</h2>
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
  
  // Show success state
  if (paymentStatus === "success") {
    return (
      <div className="container mx-auto py-24 px-4 flex flex-col items-center justify-center min-h-[60vh]">
        <div className="max-w-md w-full mx-auto text-center">
          <CheckCircle2 className="h-16 w-16 mx-auto mb-4 text-green-500" />
          <h1 className="text-3xl font-bold mb-2">Payment Successful!</h1>
          <p className="text-lg text-muted-foreground mb-8">
            Your booking has been confirmed. Thank you for choosing Baithaka!
          </p>
          <Button
            className="bg-gradient-to-r from-lightGreen to-mediumGreen text-darkGreen hover:opacity-90 px-8 py-6 text-lg"
            onClick={() => {
              const confirmationUrl = `/booking/confirmation?bookingId=${encodeURIComponent(bookingId)}`;
              window.location.href = confirmationUrl;
            }}
          >
            View Booking Details
          </Button>
        </div>
      </div>
    )
  }
  
  // Show error state
  if (paymentStatus === "error") {
    return (
      <div className="container mx-auto py-24 px-4 flex flex-col items-center justify-center min-h-[60vh]">
        <div className="max-w-md w-full mx-auto text-center">
          <AlertCircle className="h-16 w-16 mx-auto mb-4 text-red-500" />
          <h1 className="text-3xl font-bold mb-2">Payment Failed</h1>
          <p className="text-lg text-muted-foreground mb-8">
            There was an issue processing your payment. Please try again.
          </p>
          <Button
            className="bg-gradient-to-r from-lightGreen to-mediumGreen text-darkGreen hover:opacity-90 px-8 py-6 text-lg"
            onClick={() => setPaymentStatus("idle")}
          >
            Try Again
          </Button>
        </div>
      </div>
    )
  }
  
  // Processing state
  if (paymentStatus === "processing") {
    return (
      <div className="container mx-auto py-24 px-4 flex flex-col items-center justify-center min-h-[60vh]">
        <div className="max-w-md w-full mx-auto text-center">
          <Loader2 className="h-16 w-16 mx-auto mb-6 animate-spin text-lightGreen" />
          <h1 className="text-3xl font-bold mb-4">Processing Payment</h1>
          
          <div className="space-y-4 text-left my-8">
            <div className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${paymentSimulationStep >= 1 ? 'bg-lightGreen text-darkGreen' : 'bg-gray-200'}`}>
                {paymentSimulationStep >= 1 ? '✓' : '1'}
              </div>
              <div>
                <p className="font-medium">Verifying Details</p>
                {paymentSimulationStep >= 1 && <p className="text-sm text-muted-foreground">Your information has been verified</p>}
              </div>
            </div>
            
            <div className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${paymentSimulationStep >= 2 ? 'bg-lightGreen text-darkGreen' : 'bg-gray-200'}`}>
                {paymentSimulationStep >= 2 ? '✓' : '2'}
              </div>
              <div>
                <p className="font-medium">Processing Payment</p>
                {paymentSimulationStep >= 2 && <p className="text-sm text-muted-foreground">Processing your payment securely</p>}
              </div>
            </div>
            
            <div className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${paymentSimulationStep >= 3 ? 'bg-lightGreen text-darkGreen' : 'bg-gray-200'}`}>
                {paymentSimulationStep >= 3 ? '✓' : '3'}
              </div>
              <div>
                <p className="font-medium">Finalizing Booking</p>
                {paymentSimulationStep >= 3 && <p className="text-sm text-muted-foreground">Confirming your reservation</p>}
              </div>
            </div>
            
            <div className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${paymentSimulationStep >= 4 ? 'bg-lightGreen text-darkGreen' : 'bg-gray-200'}`}>
                {paymentSimulationStep >= 4 ? '✓' : '4'}
              </div>
              <div>
                <p className="font-medium">Booking Complete</p>
                {paymentSimulationStep >= 4 && <p className="text-sm text-muted-foreground">Your booking is confirmed!</p>}
              </div>
            </div>
          </div>
          
          <p className="text-muted-foreground">
            Please do not refresh the page or press the back button...
          </p>
        </div>
      </div>
    )
  }
  
  // Main payment page
  return (
    <div className="container mx-auto py-24 px-4">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="flex items-center mb-6">
            <Button
              variant="ghost"
              size="sm"
              className="hover:bg-lightGreen/10 mr-2"
              onClick={() => window.history.back()}
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
            <h1 className="text-3xl font-bold">Payment Details</h1>
          </div>
          
          <form onSubmit={handlePayment}>
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Payment Method</CardTitle>
                <CardDescription>
                  Select your preferred payment method
                </CardDescription>
              </CardHeader>
              <CardContent>
                <RadioGroup 
                  value={paymentMethod} 
                  onValueChange={setPaymentMethod}
                  className="space-y-3"
                >
                  <div className="flex items-center space-x-2 rounded-lg border p-3 hover:bg-lightGreen/5">
                    <RadioGroupItem value="card" id="card" />
                    <Label htmlFor="card" className="flex items-center flex-1 cursor-pointer">
                      <CreditCard className="h-5 w-5 mr-2" />
                      Credit/Debit Card
                    </Label>
                    <div className="flex space-x-1">
                      <Image src="/visa.svg" alt="Visa" width={32} height={24} className="h-6 w-auto" />
                      <Image src="/mastercard.svg" alt="Mastercard" width={32} height={24} className="h-6 w-auto" />
                      <Image src="/amex.svg" alt="American Express" width={32} height={24} className="h-6 w-auto" />
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 rounded-lg border p-3 hover:bg-lightGreen/5">
                    <RadioGroupItem value="upi" id="upi" />
                    <Label htmlFor="upi" className="flex items-center flex-1 cursor-pointer">
                      <Image src="/upi.svg" alt="UPI" width={24} height={24} className="h-5 w-5 mr-2" />
                      UPI Payment
                    </Label>
                    <div className="flex space-x-1">
                      <Image src="/gpay.svg" alt="Google Pay" width={32} height={24} className="h-6 w-auto" />
                      <Image src="/phonepe.svg" alt="PhonePe" width={32} height={24} className="h-6 w-auto" />
                      <Image src="/paytm.svg" alt="Paytm" width={32} height={24} className="h-6 w-auto" />
                    </div>
                  </div>
                </RadioGroup>
              </CardContent>
            </Card>
            
            {paymentMethod === "card" && (
              <Card className="mb-8">
                <CardHeader>
                  <CardTitle>Card Details</CardTitle>
                  <CardDescription>
                    Enter your card information securely
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="cardNumber">Card Number</Label>
                    <Input
                      id="cardNumber"
                      name="cardNumber"
                      placeholder="1234 5678 9012 3456"
                      value={cardDetails.cardNumber}
                      onChange={(e) => {
                        // Format card number as user types
                        const formatted = formatCardNumber(e.target.value.slice(0, 19));
                        setCardDetails({ ...cardDetails, cardNumber: formatted });
                      }}
                      maxLength={19}
                      className="font-mono"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="cardName">Cardholder Name</Label>
                    <Input
                      id="cardName"
                      name="cardName"
                      placeholder="John Doe"
                      value={cardDetails.cardName}
                      onChange={handleCardInputChange}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="expiryDate">Expiry Date (MM/YY)</Label>
                      <Input
                        id="expiryDate"
                        name="expiryDate"
                        placeholder="MM/YY"
                        value={cardDetails.expiryDate}
                        onChange={handleCardInputChange}
                        maxLength={5}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="cvv">Security Code (CVV)</Label>
                      <Input
                        id="cvv"
                        name="cvv"
                        placeholder="123"
                        value={cardDetails.cvv}
                        onChange={handleCardInputChange}
                        maxLength={4}
                        type="password"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
            
            {paymentMethod === "upi" && (
              <Card className="mb-8">
                <CardHeader>
                  <CardTitle>UPI Payment</CardTitle>
                  <CardDescription>
                    Choose your UPI payment method
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4">
                    <Button 
                      type="button"
                      variant="outline" 
                      className="flex flex-col items-center justify-center h-24 hover:bg-lightGreen/5"
                    >
                      <Image src="/gpay.svg" alt="Google Pay" width={40} height={40} className="mb-2" />
                      <span className="text-sm">Google Pay</span>
                    </Button>
                    
                    <Button 
                      type="button"
                      variant="outline" 
                      className="flex flex-col items-center justify-center h-24 hover:bg-lightGreen/5"
                    >
                      <Image src="/phonepe.svg" alt="PhonePe" width={40} height={40} className="mb-2" />
                      <span className="text-sm">PhonePe</span>
                    </Button>
                    
                    <Button 
                      type="button"
                      variant="outline" 
                      className="flex flex-col items-center justify-center h-24 hover:bg-lightGreen/5"
                    >
                      <Image src="/paytm.svg" alt="Paytm" width={40} height={40} className="mb-2" />
                      <span className="text-sm">Paytm</span>
                    </Button>
                  </div>
                  
                  <div className="mt-6">
                    <Label htmlFor="upiId">UPI ID</Label>
                    <div className="flex mt-2">
                      <Input
                        id="upiId"
                        placeholder="yourname@upi"
                        className="rounded-r-none"
                      />
                      <Button 
                        type="button"
                        className="rounded-l-none bg-lightGreen text-darkGreen hover:bg-mediumGreen"
                      >
                        Verify
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
            
            <Button 
              type="submit" 
              className="w-full bg-gradient-to-r from-lightGreen to-mediumGreen text-darkGreen font-medium text-lg py-6 hover:opacity-90"
              disabled={paymentLoading}
            >
              {paymentLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing Payment...
                </>
              ) : (
                `Pay ₹${booking.totalPrice?.toFixed(2) || "0.00"}`
              )}
            </Button>
            
            <div className="mt-4 text-center">
              <p className="text-sm text-muted-foreground">
                Your payment information is encrypted and secure.
              </p>
              <div className="flex items-center justify-center mt-2 space-x-2">
                <Image src="/secure-payment.svg" alt="Secure Payment" width={16} height={16} />
                <span className="text-xs text-muted-foreground">Secure Payment</span>
              </div>
            </div>
          </form>
        </div>
        
        {/* Booking Summary Sidebar */}
        <div className="hidden lg:block">
          <div className="sticky top-24">
            <Card>
              <CardHeader>
                <CardTitle>Booking Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="relative h-16 w-16 overflow-hidden rounded-md flex-shrink-0">
                    <Image 
                      src={property.thumbnail || "/placeholder.svg"} 
                      alt={property.title} 
                      fill 
                      className="object-cover" 
                    />
                  </div>
                  <div>
                    <h3 className="font-medium">{property.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {property.address?.city || property.city || "Unknown location"}
                    </p>
                  </div>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Check-in</span>
                    <span className="font-medium">{new Date(booking.dateFrom || booking.checkInDate).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Check-out</span>
                    <span className="font-medium">{new Date(booking.dateTo || booking.checkOutDate).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Guests</span>
                    <span className="font-medium">{booking.guests} guests</span>
                  </div>
                </div>
                
                <Separator className="my-2" />
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Room price</span>
                    <span>₹{(booking.totalPrice / 1.12).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Taxes (12%)</span>
                    <span>₹{(booking.totalPrice - booking.totalPrice / 1.12).toFixed(2)}</span>
                  </div>
                </div>
                
                <Separator className="my-2" />
                
                <div className="flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span>₹{booking.totalPrice?.toFixed(2) || "0.00"}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
} 