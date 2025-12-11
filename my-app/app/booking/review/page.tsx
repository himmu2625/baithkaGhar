"use client"

import { useState, useEffect, useMemo } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { ArrowLeft, Loader2, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import Link from "next/link"
import { useBookingFlow } from "@/lib/booking-flow/context"
import { ProgressIndicator, BOOKING_STEPS } from "../components/ProgressIndicator"
import { BookingSummary } from "../components/BookingSummary"
import { RoomGuestSelector } from "@/components/property/RoomGuestSelector"
import { MealAddons } from "@/components/property/MealAddons"
import { calculatePricing, calculateEffectiveAdults, calculateActualChildren } from "@/lib/booking-flow/pricing-calculator"
import { RoomConfig, PropertyData, RoomCategoryData, DateSelection, GuestSelection } from "@/lib/booking-flow/types"

export default function ReviewBookingPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { bookingData, updateBookingData, nextStep, isStepValid } = useBookingFlow()

  // Loading and error states
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  // Property data
  const [property, setProperty] = useState<PropertyData | null>(null)
  const [roomCategory, setRoomCategory] = useState<RoomCategoryData | null>(null)

  // Guest selector state
  const [isGuestSelectorOpen, setIsGuestSelectorOpen] = useState(false)
  const [roomConfigs, setRoomConfigs] = useState<RoomConfig[]>([])
  const [rooms, setRooms] = useState(1)
  const [adults, setAdults] = useState(1)
  const [children, setChildren] = useState(0)
  const [guests, setGuests] = useState(1)

  // Meal selection state
  const [selectedMeals, setSelectedMeals] = useState<string[]>([])
  const [mealCost, setMealCost] = useState(0)

  // Extract URL parameters
  const propertyId = searchParams?.get("propertyId") || ""
  const categoryId = searchParams?.get("categoryId") || ""
  const checkInStr = searchParams?.get("checkIn") || ""
  const checkOutStr = searchParams?.get("checkOut") || ""
  const roomsStr = searchParams?.get("rooms") || "1"
  const adultsStr = searchParams?.get("adults") || "1"
  const childrenStr = searchParams?.get("children") || "0"
  const roomConfigsStr = searchParams?.get("roomConfigs") || ""
  const mealsStr = searchParams?.get("meals") || ""

  // Parse dates - use useMemo to prevent recreating Date objects on every render
  const checkIn = useMemo(() => checkInStr ? new Date(checkInStr) : new Date(), [checkInStr])
  const checkOut = useMemo(() => checkOutStr ? new Date(checkOutStr) : new Date(), [checkOutStr])
  const nights = useMemo(() => Math.max(1, Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24))), [checkIn, checkOut])

  // Initialize room configurations from URL
  useEffect(() => {
    const parsedRooms = parseInt(roomsStr) || 1
    const parsedAdults = parseInt(adultsStr) || 1
    const parsedChildren = parseInt(childrenStr) || 0

    setRooms(parsedRooms)
    setAdults(parsedAdults)
    setChildren(parsedChildren)
    setGuests(parsedAdults + parsedChildren)

    // Parse room configurations
    if (roomConfigsStr) {
      try {
        const configs = JSON.parse(decodeURIComponent(roomConfigsStr))
        setRoomConfigs(configs)
      } catch (e) {
        console.error("Error parsing room configs:", e)
        setRoomConfigs([{ id: '1', adults: parsedAdults, children: [] }])
      }
    } else {
      setRoomConfigs([{ id: '1', adults: parsedAdults, children: [] }])
    }

    // Parse and set initial meals from URL
    if (mealsStr) {
      try {
        const meals = JSON.parse(decodeURIComponent(mealsStr))
        console.log('Parsed meals from URL:', meals)
        if (Array.isArray(meals) && meals.length > 0) {
          setSelectedMeals(meals)
        }
      } catch (e) {
        console.error("Error parsing meals:", e)
      }
    }
  }, [roomsStr, adultsStr, childrenStr, roomConfigsStr, mealsStr])

  // Fetch property data
  useEffect(() => {
    const fetchPropertyData = async () => {
      if (!propertyId) {
        setError("Property ID is missing")
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        const response = await fetch(`/api/properties/${propertyId}`)

        if (!response.ok) {
          throw new Error("Failed to fetch property details")
        }

        const data = await response.json()

        // Check if API response has the expected structure
        if (!data.success || !data.property) {
          throw new Error("Invalid API response structure")
        }

        const propertyFromAPI = data.property

        console.log('=== DEBUG: Property API Response ===')
        console.log('Property ID:', propertyFromAPI._id)
        console.log('Property Title:', propertyFromAPI.title)
        console.log('Property Units:', propertyFromAPI.propertyUnits?.length || 0)
        console.log('Category ID from URL:', categoryId)

        // Set property data (API uses 'title' but we use 'name' in our interface)
        const propertyData: PropertyData = {
          _id: propertyFromAPI._id,
          name: propertyFromAPI.title || propertyFromAPI.name,
          city: propertyFromAPI.city,
          address: propertyFromAPI.address,
          images: propertyFromAPI.images || [],
          rating: propertyFromAPI.rating,
          reviewsCount: propertyFromAPI.reviewsCount,
        }
        setProperty(propertyData)

        // Find the selected room category
        console.log('All property units:', propertyFromAPI.propertyUnits?.map((u: any) => ({ id: u._id, name: u.name })))

        const selectedCategory = propertyFromAPI.propertyUnits?.find(
          (unit: any) => unit._id === categoryId || unit.name === categoryId
        ) || propertyFromAPI.propertyUnits?.[0]

        console.log('Selected Category:', selectedCategory ? {
          id: selectedCategory._id,
          name: selectedCategory.name,
          price: selectedCategory.price,
          priceType: typeof selectedCategory.price,
          maxCapacity: selectedCategory.maxCapacityPerRoom,
          freeExtra: selectedCategory.freeExtraPersonLimit,
          extraCharge: selectedCategory.extraPersonCharge
        } : 'NOT FOUND')

        if (selectedCategory) {
          console.log('RAW Selected Category:', JSON.stringify(selectedCategory, null, 2))
        }

        if (selectedCategory) {
          // Extract price from nested pricing object and convert to number
          const priceValue = selectedCategory.pricing?.price || selectedCategory.price
          const numericPrice = typeof priceValue === 'string' ? parseFloat(priceValue) : priceValue

          console.log('Price extraction:', {
            raw: selectedCategory.pricing,
            priceValue,
            numericPrice,
            isNaN: isNaN(numericPrice)
          })

          // Use property-level mealPricing if room category doesn't have it
          const mealPricingData = selectedCategory.mealPricing || propertyFromAPI.mealPricing || {}
          console.log('Meal pricing data:', mealPricingData)

          const roomCategoryData: RoomCategoryData = {
            _id: selectedCategory._id,
            name: selectedCategory.unitTypeName || selectedCategory.name,
            price: numericPrice || 0,
            maxCapacityPerRoom: selectedCategory.maxCapacityPerRoom || 4,
            freeExtraPersonLimit: selectedCategory.freeExtraPersonLimit || 2,
            extraPersonCharge: selectedCategory.extraPersonCharge || 500,
            mealPricing: mealPricingData,
            images: selectedCategory.images || [],
            amenities: selectedCategory.amenities || [],
          }
          console.log('Room Category Data:', roomCategoryData)
          setRoomCategory(roomCategoryData)
        } else {
          console.error('❌ No room category found!')
        }

        setLoading(false)
      } catch (err: any) {
        console.error("Error fetching property:", err)
        setError(err.message || "Failed to load property details")
        setLoading(false)
      }
    }

    fetchPropertyData()
  }, [propertyId, categoryId])

  // Calculate pricing
  const pricing = useMemo(() => {
    if (!roomCategory) {
      console.log('⚠️ No room category, cannot calculate pricing')
      return null
    }

    console.log('=== PRICING CALCULATION ===')
    console.log('Room Category Price:', roomCategory.price, 'Type:', typeof roomCategory.price)
    console.log('Nights:', nights)
    console.log('Rooms:', rooms, 'Adults:', adults, 'Children:', children)

    const result = calculatePricing({
      roomCategory,
      nights,
      guestSelection: { rooms, adults, children, guests, roomConfigurations: roomConfigs },
      mealCost,
      addOnsCost: 0,
    })

    console.log('Pricing Result:', result)
    return result
  }, [roomCategory, nights, rooms, adults, children, guests, roomConfigs, mealCost])

  // Update booking context when data changes
  useEffect(() => {
    if (property && roomCategory && pricing) {
      const dateSelection: DateSelection = {
        checkIn,
        checkOut,
        nights,
      }

      const guestSelection: GuestSelection = {
        rooms,
        adults,
        children,
        guests,
        roomConfigurations: roomConfigs,
      }

      updateBookingData({
        propertyData: property,
        roomCategoryData: roomCategory,
        dateSelection,
        guestSelection,
        mealSelection: {
          plan: null,
          cost: mealCost,
          selectedMeals,
        },
        pricing,
        currentStep: 1,
      })
    }
  }, [property, roomCategory, pricing, checkIn, checkOut, nights, rooms, adults, children, guests, roomConfigs, mealCost, selectedMeals, updateBookingData])

  // Handle guest selector confirmation
  const handleGuestConfirm = (
    newRoomConfigs: RoomConfig[],
    totalGuests: number,
    effectiveAdults: number,
    actualChildren: number
  ) => {
    setRoomConfigs(newRoomConfigs)
    setRooms(newRoomConfigs.length)
    setAdults(effectiveAdults)
    setChildren(actualChildren)
    setGuests(totalGuests)
    setIsGuestSelectorOpen(false)
  }

  // Handle meal selection change
  const handleMealChange = (meals: string[], cost: number) => {
    setSelectedMeals(meals)
    setMealCost(cost)
  }

  // Handle continue to guest details
  const handleContinue = () => {
    if (isStepValid(1)) {
      router.push("/booking/guest-details")
    }
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-red-600" />
          <p className="mt-4 text-gray-600">Loading booking details...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error || !property || !roomCategory) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {error || "Failed to load booking details. Please try again."}
              </AlertDescription>
            </Alert>
            <Button
              onClick={() => router.back()}
              className="w-full mt-4"
              variant="outline"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Progress Indicator */}
      <ProgressIndicator currentStep={1} steps={BOOKING_STEPS} />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Back button */}
        <Button
          variant="ghost"
          onClick={() => {
            // Build URL with all current selections to preserve state
            if (property && checkIn && checkOut) {
              let backUrl = `/property/${propertyId}?`
              backUrl += `checkIn=${checkIn.toISOString()}`
              backUrl += `&checkOut=${checkOut.toISOString()}`
              backUrl += `&rooms=${rooms}`
              backUrl += `&adults=${adults}`
              backUrl += `&children=${children}`
              backUrl += `&guests=${adults + children}`
              if (categoryId) {
                backUrl += `&category=${categoryId}`
              }
              if (roomConfigs && roomConfigs.length > 0) {
                backUrl += `&roomConfigs=${encodeURIComponent(JSON.stringify(roomConfigs))}`
              }
              if (selectedMeals && selectedMeals.length > 0) {
                backUrl += `&meals=${encodeURIComponent(JSON.stringify(selectedMeals))}`
              }
              router.push(backUrl)
            } else {
              router.back()
            }
          }}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Property
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Page Title */}
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">Review Your Booking</h1>
              <p className="text-gray-600 mt-1">
                Please review your selection before proceeding
              </p>
            </div>

            {/* Rooms & Guests Section */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Rooms & Guests</h3>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsGuestSelectorOpen(true)}
                  >
                    Edit
                  </Button>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between py-3 px-4 bg-gray-50 rounded-lg">
                    <span className="text-sm text-gray-600">Rooms</span>
                    <span className="font-medium">{rooms}</span>
                  </div>
                  <div className="flex items-center justify-between py-3 px-4 bg-gray-50 rounded-lg">
                    <span className="text-sm text-gray-600">Guests</span>
                    <span className="font-medium">
                      {adults} {adults === 1 ? "Adult" : "Adults"}
                      {children > 0 &&
                        `, ${children} ${children === 1 ? "Child" : "Children"}`}
                    </span>
                  </div>
                </div>

                <Alert className="mt-4 bg-blue-50 border-blue-200">
                  <AlertDescription className="text-sm text-blue-800">
                    Children over 5 years are counted as adults for billing purposes
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>

            {/* Meal Add-ons Section */}
            {roomCategory.mealPricing && Object.keys(roomCategory.mealPricing).length > 0 && (
              <Card>
                <CardContent className="pt-6">
                  <h3 className="text-lg font-semibold mb-4">Add Meal Plans (Optional)</h3>
                  <MealAddons
                    mealPricing={roomCategory.mealPricing}
                    totalGuests={adults}
                    nights={nights}
                    onSelectionChange={handleMealChange}
                    initialSelectedMeals={selectedMeals}
                  />
                </CardContent>
              </Card>
            )}

            {/* Cancellation Policy */}
            <Card>
              <CardContent className="pt-6">
                <h3 className="text-lg font-semibold mb-3">Cancellation Policy</h3>
                <div className="space-y-2 text-sm text-gray-600">
                  <p>✓ Free cancellation up to 24 hours before check-in</p>
                  <p>✓ Full refund if cancelled within the free cancellation period</p>
                  <p>✗ Non-refundable if cancelled within 24 hours of check-in</p>
                </div>
              </CardContent>
            </Card>

            {/* Continue Button */}
            <Button
              onClick={handleContinue}
              disabled={!isStepValid(1)}
              className="w-full bg-red-600 hover:bg-red-700 text-white py-6 text-lg"
              size="lg"
            >
              Continue to Guest Details
            </Button>
          </div>

          {/* Right Column - Booking Summary */}
          <div className="lg:col-span-1">
            {pricing && (
              <BookingSummary
                propertyData={property}
                roomCategoryData={roomCategory}
                dateSelection={{ checkIn, checkOut, nights }}
                guestSelection={{ rooms, adults, children, guests, roomConfigurations: roomConfigs }}
                pricing={pricing}
                selectedMeals={selectedMeals}
                mealCost={mealCost}
                showEditButtons={false}
              />
            )}
          </div>
        </div>
      </div>

      {/* Room Guest Selector Modal */}
      <RoomGuestSelector
        open={isGuestSelectorOpen}
        onOpenChange={setIsGuestSelectorOpen}
        initialRooms={rooms}
        initialGuests={guests}
        initialRoomConfigs={roomConfigs}
        maxGuestsPerRoom={roomCategory.maxCapacityPerRoom}
        onConfirm={handleGuestConfirm}
      />
    </div>
  )
}
