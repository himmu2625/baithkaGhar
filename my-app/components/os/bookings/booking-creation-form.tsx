"use client"

import React, { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { toast } from "@/hooks/use-toast"
import {
  CalendarDays,
  Users,
  User,
  Mail,
  Phone,
  MapPin,
  CreditCard,
  CheckCircle2,
  Clock,
  IndianRupee,
  Bed,
  Plus,
  Minus,
  AlertCircle,
  Star,
  Gift,
  Car,
  Utensils,
  Wifi,
  Coffee,
  Calculator
} from "lucide-react"
import { cn } from "@/lib/utils"
import { format } from "date-fns"

interface RoomType {
  _id: string
  name: string
  description: string
  basePrice: number
  maxOccupancy: number
  amenities: string[]
  images: string[]
  available: number
}

interface BookingFormData {
  // Guest Information
  guestName: string
  guestEmail: string
  guestPhone: string
  guestAddress: string
  guestIdType: string
  guestIdNumber: string

  // Booking Details
  checkInDate: Date | null
  checkOutDate: Date | null
  adults: number
  children: number
  rooms: number

  // Room Selection
  selectedRoomType: string
  roomPreferences: string[]

  // Special Requirements
  specialRequests: string
  dietaryRequirements: string
  accessibilityNeeds: string

  // Add-ons
  mealPlan: string
  extraBed: boolean
  earlyCheckIn: boolean
  lateCheckOut: boolean
  airportTransfer: boolean

  // Payment
  paymentMethod: string
  advancePayment: number
  couponCode: string
}

interface PricingBreakdown {
  roomCharges: number
  taxes: number
  extraServices: number
  discount: number
  total: number
  nights: number
}

export function BookingCreationForm({ propertyId, onClose }: { propertyId: string, onClose?: () => void }) {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([])
  const [availabilityChecked, setAvailabilityChecked] = useState(false)
  const [pricingBreakdown, setPricingBreakdown] = useState<PricingBreakdown | null>(null)

  const [formData, setFormData] = useState<BookingFormData>({
    guestName: "",
    guestEmail: "",
    guestPhone: "",
    guestAddress: "",
    guestIdType: "",
    guestIdNumber: "",
    checkInDate: null,
    checkOutDate: null,
    adults: 2,
    children: 0,
    rooms: 1,
    selectedRoomType: "",
    roomPreferences: [],
    specialRequests: "",
    dietaryRequirements: "",
    accessibilityNeeds: "",
    mealPlan: "none",
    extraBed: false,
    earlyCheckIn: false,
    lateCheckOut: false,
    airportTransfer: false,
    paymentMethod: "online",
    advancePayment: 0,
    couponCode: ""
  })

  // Fetch room types
  useEffect(() => {
    const fetchRoomTypes = async () => {
      try {
        const response = await fetch(`/api/inventory/room-types?propertyId=${propertyId}`)
        if (response.ok) {
          const data = await response.json()
          if (data.success) {
            setRoomTypes(data.roomTypes || [])
          }
        }
      } catch (error) {
        console.error("Error fetching room types:", error)
      }
    }

    if (propertyId) {
      fetchRoomTypes()
    }
  }, [propertyId])

  // Check availability when dates change
  useEffect(() => {
    if (formData.checkInDate && formData.checkOutDate && formData.selectedRoomType) {
      checkAvailability()
    }
  }, [formData.checkInDate, formData.checkOutDate, formData.selectedRoomType, formData.rooms])

  const checkAvailability = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/os/bookings/availability`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          propertyId,
          checkInDate: formData.checkInDate,
          checkOutDate: formData.checkOutDate,
          roomTypeId: formData.selectedRoomType,
          rooms: formData.rooms
        })
      })

      const data = await response.json()
      if (data.success) {
        setAvailabilityChecked(true)
        calculatePricing()
      } else {
        toast({
          title: "Availability Check Failed",
          description: data.error || "Selected dates are not available",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("Availability check error:", error)
    } finally {
      setLoading(false)
    }
  }

  const calculatePricing = () => {
    if (!formData.checkInDate || !formData.checkOutDate || !formData.selectedRoomType) return

    const selectedRoom = roomTypes.find(rt => rt._id === formData.selectedRoomType)
    if (!selectedRoom) return

    const nights = Math.ceil((formData.checkOutDate.getTime() - formData.checkInDate.getTime()) / (1000 * 3600 * 24))
    const roomCharges = selectedRoom.basePrice * nights * formData.rooms

    let extraServices = 0
    if (formData.extraBed) extraServices += 500 * nights
    if (formData.earlyCheckIn) extraServices += 1000
    if (formData.lateCheckOut) extraServices += 1000
    if (formData.airportTransfer) extraServices += 2000
    if (formData.mealPlan === 'breakfast') extraServices += 500 * nights
    if (formData.mealPlan === 'halfboard') extraServices += 1200 * nights
    if (formData.mealPlan === 'fullboard') extraServices += 2000 * nights

    const subtotal = roomCharges + extraServices
    const taxes = subtotal * 0.18 // 18% GST
    const discount = formData.couponCode ? subtotal * 0.1 : 0 // 10% discount for demo
    const total = subtotal + taxes - discount

    setPricingBreakdown({
      roomCharges,
      taxes,
      extraServices,
      discount,
      total,
      nights
    })
  }

  const handleSubmit = async () => {
    setLoading(true)
    try {
      const bookingData = {
        ...formData,
        propertyId,
        totalAmount: pricingBreakdown?.total || 0,
        paymentStatus: formData.paymentMethod === 'online' ? 'pending' : 'cash_on_arrival',
        status: 'pending'
      }

      const response = await fetch(`/api/os/bookings/${propertyId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bookingData)
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: "Booking Created Successfully",
          description: `Booking ID: ${result.booking._id}`,
        })

        if (onClose) onClose()
        else router.push(`/os/bookings/${propertyId}`)
      } else {
        throw new Error(result.error || 'Failed to create booking')
      }
    } catch (error) {
      console.error("Booking creation error:", error)
      toast({
        title: "Booking Creation Failed",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const nextStep = () => {
    if (currentStep < 4) setCurrentStep(currentStep + 1)
  }

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1)
  }

  const canProceedToNext = () => {
    switch (currentStep) {
      case 1:
        return formData.checkInDate && formData.checkOutDate && formData.adults > 0
      case 2:
        return formData.selectedRoomType && availabilityChecked
      case 3:
        return formData.guestName && formData.guestEmail && formData.guestPhone
      case 4:
        return true
      default:
        return false
    }
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Create New Booking</h1>
          <p className="text-gray-600 mt-2">Complete the booking process in 4 simple steps</p>
        </div>
        <div className="flex items-center space-x-2">
          {[1, 2, 3, 4].map((step) => (
            <div
              key={step}
              className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium",
                step === currentStep
                  ? "bg-blue-600 text-white"
                  : step < currentStep
                  ? "bg-green-600 text-white"
                  : "bg-gray-200 text-gray-600"
              )}
            >
              {step < currentStep ? <CheckCircle2 className="h-4 w-4" /> : step}
            </div>
          ))}
        </div>
      </div>

      <Card className="shadow-lg">
        <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
          <CardTitle className="flex items-center space-x-2">
            {currentStep === 1 && <><CalendarDays className="h-5 w-5" /><span>Step 1: Booking Dates & Guests</span></>}
            {currentStep === 2 && <><Bed className="h-5 w-5" /><span>Step 2: Room Selection & Services</span></>}
            {currentStep === 3 && <><User className="h-5 w-5" /><span>Step 3: Guest Information</span></>}
            {currentStep === 4 && <><CreditCard className="h-5 w-5" /><span>Step 4: Payment & Confirmation</span></>}
          </CardTitle>
          <CardDescription className="text-blue-100">
            {currentStep === 1 && "Select your check-in and check-out dates"}
            {currentStep === 2 && "Choose your room type and additional services"}
            {currentStep === 3 && "Provide guest details and special requirements"}
            {currentStep === 4 && "Review booking details and complete payment"}
          </CardDescription>
        </CardHeader>

        <CardContent className="p-6">
          {/* Step 1: Dates and Guests */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="checkin">Check-in Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !formData.checkInDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarDays className="mr-2 h-4 w-4" />
                          {formData.checkInDate ? format(formData.checkInDate, "PPP") : "Pick a date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={formData.checkInDate || undefined}
                          onSelect={(date) => setFormData(prev => ({ ...prev, checkInDate: date || null }))}
                          disabled={(date) => date < new Date()}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div>
                    <Label htmlFor="checkout">Check-out Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !formData.checkOutDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarDays className="mr-2 h-4 w-4" />
                          {formData.checkOutDate ? format(formData.checkOutDate, "PPP") : "Pick a date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={formData.checkOutDate || undefined}
                          onSelect={(date) => setFormData(prev => ({ ...prev, checkOutDate: date || null }))}
                          disabled={(date) => date <= (formData.checkInDate || new Date())}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label>Adults</Label>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setFormData(prev => ({ ...prev, adults: Math.max(1, prev.adults - 1) }))}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <span className="w-8 text-center">{formData.adults}</span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setFormData(prev => ({ ...prev, adults: prev.adults + 1 }))}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div>
                      <Label>Children</Label>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setFormData(prev => ({ ...prev, children: Math.max(0, prev.children - 1) }))}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <span className="w-8 text-center">{formData.children}</span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setFormData(prev => ({ ...prev, children: prev.children + 1 }))}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div>
                      <Label>Rooms</Label>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setFormData(prev => ({ ...prev, rooms: Math.max(1, prev.rooms - 1) }))}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <span className="w-8 text-center">{formData.rooms}</span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setFormData(prev => ({ ...prev, rooms: prev.rooms + 1 }))}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  {formData.checkInDate && formData.checkOutDate && (
                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="flex items-center space-x-2 mb-2">
                        <Clock className="h-4 w-4 text-blue-600" />
                        <span className="font-medium text-blue-900">Booking Summary</span>
                      </div>
                      <div className="text-sm text-blue-800">
                        <div>Duration: {Math.ceil((formData.checkOutDate.getTime() - formData.checkInDate.getTime()) / (1000 * 3600 * 24))} nights</div>
                        <div>Guests: {formData.adults} adults{formData.children > 0 && `, ${formData.children} children`}</div>
                        <div>Rooms: {formData.rooms}</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Room Selection */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label>Select Room Type</Label>
                    <Select value={formData.selectedRoomType} onValueChange={(value) => setFormData(prev => ({ ...prev, selectedRoomType: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose room type" />
                      </SelectTrigger>
                      <SelectContent>
                        {roomTypes.map((room) => (
                          <SelectItem key={room._id} value={room._id}>
                            {room.name} - ₹{room.basePrice}/night
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Meal Plan</Label>
                    <Select value={formData.mealPlan} onValueChange={(value) => setFormData(prev => ({ ...prev, mealPlan: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No Meals</SelectItem>
                        <SelectItem value="breakfast">Breakfast Only (+₹500/night)</SelectItem>
                        <SelectItem value="halfboard">Half Board (+₹1200/night)</SelectItem>
                        <SelectItem value="fullboard">Full Board (+₹2000/night)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-4">
                  <Label>Additional Services</Label>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span>Extra Bed (+₹500/night)</span>
                      <input
                        type="checkbox"
                        checked={formData.extraBed}
                        onChange={(e) => setFormData(prev => ({ ...prev, extraBed: e.target.checked }))}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Early Check-in (+₹1000)</span>
                      <input
                        type="checkbox"
                        checked={formData.earlyCheckIn}
                        onChange={(e) => setFormData(prev => ({ ...prev, earlyCheckIn: e.target.checked }))}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Late Check-out (+₹1000)</span>
                      <input
                        type="checkbox"
                        checked={formData.lateCheckOut}
                        onChange={(e) => setFormData(prev => ({ ...prev, lateCheckOut: e.target.checked }))}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Airport Transfer (+₹2000)</span>
                      <input
                        type="checkbox"
                        checked={formData.airportTransfer}
                        onChange={(e) => setFormData(prev => ({ ...prev, airportTransfer: e.target.checked }))}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {pricingBreakdown && (
                <Card className="bg-gray-50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calculator className="h-5 w-5" />
                      Pricing Breakdown
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Room Charges ({pricingBreakdown.nights} nights)</span>
                        <span>₹{pricingBreakdown.roomCharges.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Extra Services</span>
                        <span>₹{pricingBreakdown.extraServices.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Taxes (18% GST)</span>
                        <span>₹{pricingBreakdown.taxes.toLocaleString()}</span>
                      </div>
                      {pricingBreakdown.discount > 0 && (
                        <div className="flex justify-between text-green-600">
                          <span>Discount</span>
                          <span>-₹{pricingBreakdown.discount.toLocaleString()}</span>
                        </div>
                      )}
                      <Separator />
                      <div className="flex justify-between font-bold text-lg">
                        <span>Total Amount</span>
                        <span>₹{pricingBreakdown.total.toLocaleString()}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Step 3: Guest Information */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="guestName">Guest Name</Label>
                  <Input
                    id="guestName"
                    value={formData.guestName}
                    onChange={(e) => setFormData(prev => ({ ...prev, guestName: e.target.value }))}
                    placeholder="Enter guest name"
                  />
                </div>

                <div>
                  <Label htmlFor="guestEmail">Email Address</Label>
                  <Input
                    id="guestEmail"
                    type="email"
                    value={formData.guestEmail}
                    onChange={(e) => setFormData(prev => ({ ...prev, guestEmail: e.target.value }))}
                    placeholder="guest@email.com"
                  />
                </div>

                <div>
                  <Label htmlFor="guestPhone">Phone Number</Label>
                  <Input
                    id="guestPhone"
                    value={formData.guestPhone}
                    onChange={(e) => setFormData(prev => ({ ...prev, guestPhone: e.target.value }))}
                    placeholder="+91 9876543210"
                  />
                </div>

                <div>
                  <Label htmlFor="guestIdType">ID Type</Label>
                  <Select value={formData.guestIdType} onValueChange={(value) => setFormData(prev => ({ ...prev, guestIdType: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select ID type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="passport">Passport</SelectItem>
                      <SelectItem value="aadhar">Aadhar Card</SelectItem>
                      <SelectItem value="driving_license">Driving License</SelectItem>
                      <SelectItem value="voter_id">Voter ID</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="guestAddress">Address</Label>
                  <Textarea
                    id="guestAddress"
                    value={formData.guestAddress}
                    onChange={(e) => setFormData(prev => ({ ...prev, guestAddress: e.target.value }))}
                    placeholder="Enter full address"
                    rows={3}
                  />
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="specialRequests">Special Requests</Label>
                  <Textarea
                    id="specialRequests"
                    value={formData.specialRequests}
                    onChange={(e) => setFormData(prev => ({ ...prev, specialRequests: e.target.value }))}
                    placeholder="Any special requests or requirements"
                    rows={3}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Payment */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label>Payment Method</Label>
                  <Select value={formData.paymentMethod} onValueChange={(value) => setFormData(prev => ({ ...prev, paymentMethod: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="online">Online Payment</SelectItem>
                      <SelectItem value="cash">Cash on Arrival</SelectItem>
                      <SelectItem value="card">Card at Property</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="couponCode">Coupon Code (Optional)</Label>
                  <Input
                    id="couponCode"
                    value={formData.couponCode}
                    onChange={(e) => setFormData(prev => ({ ...prev, couponCode: e.target.value }))}
                    placeholder="Enter coupon code"
                  />
                </div>
              </div>

              {pricingBreakdown && (
                <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
                  <CardHeader>
                    <CardTitle className="text-blue-900">Booking Summary</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span>Guest:</span>
                        <span className="font-medium">{formData.guestName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Dates:</span>
                        <span className="font-medium">
                          {formData.checkInDate && format(formData.checkInDate, "MMM dd")} - {formData.checkOutDate && format(formData.checkOutDate, "MMM dd, yyyy")}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Duration:</span>
                        <span className="font-medium">{pricingBreakdown.nights} nights</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Guests:</span>
                        <span className="font-medium">{formData.adults} adults, {formData.children} children</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Rooms:</span>
                        <span className="font-medium">{formData.rooms}</span>
                      </div>
                      <Separator />
                      <div className="flex justify-between font-bold text-lg text-blue-900">
                        <span>Total Amount:</span>
                        <span>₹{pricingBreakdown.total.toLocaleString()}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </CardContent>

        <div className="flex justify-between items-center p-6 border-t bg-gray-50">
          <Button
            variant="outline"
            onClick={prevStep}
            disabled={currentStep === 1}
          >
            Previous
          </Button>

          <div className="flex space-x-2">
            {currentStep < 4 ? (
              <Button
                onClick={nextStep}
                disabled={!canProceedToNext() || loading}
              >
                Next Step
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={loading || !pricingBreakdown}
                className="bg-green-600 hover:bg-green-700"
              >
                {loading ? "Creating Booking..." : "Confirm Booking"}
              </Button>
            )}
          </div>
        </div>
      </Card>
    </div>
  )
}