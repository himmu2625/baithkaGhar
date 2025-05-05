"use client"

export const dynamic = 'force-dynamic';

import type React from "react"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { format } from "date-fns"
import { CheckCircle, Calendar, Users, MapPin, ArrowRight, CreditCard, Landmark, Wallet } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"
import { useLoginPrompt } from "@/hooks/use-login-prompt"
import Image from "next/image"

// Create a client component for the booking confirmation content
function BookingConfirmationContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { toast } = useToast()
  const { isLoggedIn, promptLogin } = useLoginPrompt()
  const [isProcessing, setIsProcessing] = useState(false)
  const [isConfirmed, setIsConfirmed] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState("card")
  const [cardDetails, setCardDetails] = useState({
    cardNumber: "",
    cardName: "",
    expiryDate: "",
    cvv: "",
  })
  const [upiId, setUpiId] = useState("")

  const propertyId = searchParams?.get("propertyId") || ""
  const checkIn = searchParams?.get("checkIn") ? new Date(searchParams.get("checkIn") as string) : null
  const checkOut = searchParams?.get("checkOut") ? new Date(searchParams.get("checkOut") as string) : null
  const guests = searchParams?.get("guests") || "1"
  const total = searchParams?.get("total") || "0"

  // Mock property data
  const property = {
    id: propertyId,
    name: "Luxury Beachfront Villa with Private Pool",
    location: "Goa, India",
    image: "/serene-goan-escape.png",
  }

  useEffect(() => {
    // Redirect if not logged in
    if (!isLoggedIn) {
      promptLogin()
    }
  }, [isLoggedIn, promptLogin])

  const handleCardInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setCardDetails({
      ...cardDetails,
      [name]: value,
    })
  }

  const validateCardDetails = () => {
    if (cardDetails.cardNumber.length < 16) {
      toast({
        title: "Invalid card number",
        description: "Please enter a valid card number",
        variant: "destructive",
      })
      return false
    }
    if (cardDetails.cardName.trim() === "") {
      toast({
        title: "Invalid name",
        description: "Please enter the name on your card",
        variant: "destructive",
      })
      return false
    }
    if (cardDetails.expiryDate.trim() === "") {
      toast({
        title: "Invalid expiry date",
        description: "Please enter your card's expiry date",
        variant: "destructive",
      })
      return false
    }
    if (cardDetails.cvv.length < 3) {
      toast({
        title: "Invalid CVV",
        description: "Please enter a valid CVV",
        variant: "destructive",
      })
      return false
    }
    return true
  }

  const validateUpi = () => {
    if (!upiId.includes("@")) {
      toast({
        title: "Invalid UPI ID",
        description: "Please enter a valid UPI ID",
        variant: "destructive",
      })
      return false
    }
    return true
  }

  const handlePayment = async () => {
    // Validate based on payment method
    if (paymentMethod === "card" && !validateCardDetails()) {
      return
    }
    if (paymentMethod === "upi" && !validateUpi()) {
      return
    }

    setIsProcessing(true)

    try {
      // Simulate payment processing
      await new Promise((resolve) => setTimeout(resolve, 2000))

      // Simulate successful payment
      setIsConfirmed(true)
      toast({
        title: "Payment successful",
        description: "Your booking has been confirmed",
      })
    } catch (error) {
      console.error("Payment error:", error)
      toast({
        title: "Payment failed",
        description: "There was an error processing your payment. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleViewBookings = () => {
    router.push("/dashboard/bookings")
  }

  if (isConfirmed) {
    return (
      <div className="container mx-auto py-24 px-4 max-w-2xl">
        <Card className="border-green-200">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4">
              <CheckCircle className="h-16 w-16 text-green-500" />
            </div>
            <CardTitle className="text-2xl">Booking Confirmed!</CardTitle>
            <CardDescription>Your reservation has been successfully confirmed.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-muted p-4 rounded-lg">
              <div className="flex items-center gap-4 mb-4">
                <div className="relative h-16 w-16 rounded-md overflow-hidden flex-shrink-0">
                  <Image src={property.image || "/placeholder.svg"} alt={property.name} fill className="object-cover" />
                </div>
                <div>
                  <h3 className="font-medium">{property.name}</h3>
                  <p className="text-sm text-muted-foreground flex items-center">
                    <MapPin className="h-3 w-3 mr-1" />
                    {property.location}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Check-in</p>
                  <p className="font-medium">{checkIn ? format(new Date(checkIn), "EEE, MMM d, yyyy") : "N/A"}</p>
                  <p className="text-sm">After 2:00 PM</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Check-out</p>
                  <p className="font-medium">{checkOut ? format(new Date(checkOut), "EEE, MMM d, yyyy") : "N/A"}</p>
                  <p className="text-sm">Before 11:00 AM</p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-medium mb-2">Booking Details</h3>
              <div className="text-sm space-y-1">
                <div className="flex justify-between">
                  <span>Booking ID</span>
                  <span className="font-medium">BK{Math.floor(Math.random() * 1000000)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Guests</span>
                  <span>
                    {guests} {Number(guests) === 1 ? "Guest" : "Guests"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Total Amount</span>
                  <span className="font-medium">₹{Number(total).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Payment Method</span>
                  <span>
                    {paymentMethod === "card" ? "Credit Card" : paymentMethod === "upi" ? "UPI" : "Net Banking"}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-green-50 p-4 rounded-lg">
              <p className="text-sm text-green-800">
                A confirmation email has been sent to your registered email address with all the booking details.
              </p>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-2">
            <Button
              className="w-full bg-mediumGreen hover:bg-mediumGreen/80 text-lightYellow"
              onClick={handleViewBookings}
            >
              View My Bookings
            </Button>
            <Button variant="outline" className="w-full" onClick={() => router.push("/")}>
              Return to Home
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-24 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Confirm and Pay</h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Payment Method</CardTitle>
                <CardDescription>Choose your preferred payment method</CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="card" value={paymentMethod} onValueChange={setPaymentMethod}>
                  <TabsList className="grid grid-cols-3 mb-4">
                    <TabsTrigger value="card" className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4" />
                      <span>Card</span>
                    </TabsTrigger>
                    <TabsTrigger value="upi" className="flex items-center gap-2">
                      <Wallet className="h-4 w-4" />
                      <span>UPI</span>
                    </TabsTrigger>
                    <TabsTrigger value="netbanking" className="flex items-center gap-2">
                      <Landmark className="h-4 w-4" />
                      <span>Net Banking</span>
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="card" className="space-y-4">
                    <div className="grid grid-cols-1 gap-4">
                      <div>
                        <Label htmlFor="cardNumber">Card Number</Label>
                        <Input
                          id="cardNumber"
                          name="cardNumber"
                          placeholder="1234 5678 9012 3456"
                          value={cardDetails.cardNumber}
                          onChange={handleCardInputChange}
                          maxLength={16}
                        />
                      </div>
                      <div>
                        <Label htmlFor="cardName">Name on Card</Label>
                        <Input
                          id="cardName"
                          name="cardName"
                          placeholder="John Doe"
                          value={cardDetails.cardName}
                          onChange={handleCardInputChange}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="expiryDate">Expiry Date</Label>
                          <Input
                            id="expiryDate"
                            name="expiryDate"
                            placeholder="MM/YY"
                            value={cardDetails.expiryDate}
                            onChange={handleCardInputChange}
                          />
                        </div>
                        <div>
                          <Label htmlFor="cvv">CVV</Label>
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
                    </div>
                  </TabsContent>

                  <TabsContent value="upi" className="space-y-4">
                    <div>
                      <Label htmlFor="upiId">UPI ID</Label>
                      <Input
                        id="upiId"
                        placeholder="yourname@upi"
                        value={upiId}
                        onChange={(e) => setUpiId(e.target.value)}
                      />
                      <p className="text-sm text-muted-foreground mt-1">
                        Enter your UPI ID (e.g., yourname@okicici, yourname@okhdfc)
                      </p>
                    </div>
                  </TabsContent>

                  <TabsContent value="netbanking" className="space-y-4">
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      {["HDFC Bank", "ICICI Bank", "SBI", "Axis Bank", "Kotak Bank", "Yes Bank"].map((bank) => (
                        <div
                          key={bank}
                          className="border rounded-lg p-4 text-center cursor-pointer hover:border-mediumGreen"
                        >
                          <p className="font-medium">{bank}</p>
                        </div>
                      ))}
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
              <CardFooter>
                <Button
                  className="w-full bg-mediumGreen hover:bg-mediumGreen/80 text-lightYellow"
                  onClick={handlePayment}
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <div className="flex items-center">
                      <div className="animate-spin mr-2 h-4 w-4 border-2 border-lightYellow border-t-transparent rounded-full" />
                      Processing Payment...
                    </div>
                  ) : (
                    `Pay ₹${Number(total).toLocaleString()}`
                  )}
                </Button>
              </CardFooter>
            </Card>
          </div>

          <div className="md:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Booking Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="relative h-16 w-16 rounded-md overflow-hidden flex-shrink-0">
                    <Image
                      src={property.image || "/placeholder.svg"}
                      alt={property.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div>
                    <h3 className="font-medium line-clamp-1">{property.name}</h3>
                    <p className="text-sm text-muted-foreground flex items-center">
                      <MapPin className="h-3 w-3 mr-1" />
                      {property.location}
                    </p>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div className="text-sm">
                      <div className="flex items-center">
                        {checkIn ? format(new Date(checkIn), "EEE, MMM d, yyyy") : "N/A"}
                        <ArrowRight className="h-3 w-3 mx-1" />
                        {checkOut ? format(new Date(checkOut), "EEE, MMM d, yyyy") : "N/A"}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      {guests} {Number(guests) === 1 ? "Guest" : "Guests"}
                    </span>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Room charges</span>
                    <span>₹{(Number(total) - 2500 - Math.round(Number(total) * 0.1)).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Cleaning fee</span>
                    <span>₹2,500</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Service fee</span>
                    <span>₹{Math.round(Number(total) * 0.1).toLocaleString()}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-bold">
                    <span>Total</span>
                    <span>₹{Number(total).toLocaleString()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

// Main page component with Suspense boundary
export default function BookingConfirmationPage() {
  return (
    <Suspense fallback={
      <div className="container mx-auto py-24 px-4 max-w-2xl flex justify-center">
        <div className="animate-pulse">Loading booking confirmation...</div>
      </div>
    }>
      <BookingConfirmationContent />
    </Suspense>
  )
}
