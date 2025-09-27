"use client"

import React, { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Calendar,
  IndianRupee,
  Users,
  Coffee,
  Utensils,
  Hotel,
  TrendingUp,
  Info,
  Home,
  Check,
} from "lucide-react"
import { format, differenceInDays } from "date-fns"
import PlanSelector, { OccupancySelector } from "@/components/ui/plan-selector"
import EnhancedPricingCalendar from "@/components/ui/enhanced-pricing-calendar"
import { useToast } from "@/hooks/use-toast"

// Plan type definitions
const availablePlans = [
  {
    code: "EP" as const,
    name: "Room Only",
    description: "European Plan - Room accommodation only",
    inclusions: [
      "Room accommodation",
      "Basic amenities",
      "Housekeeping",
      "Wi-Fi",
    ],
  },
  {
    code: "CP" as const,
    name: "Room + Breakfast",
    description: "Continental Plan - Room with breakfast included",
    inclusions: [
      "Room accommodation",
      "Daily breakfast",
      "Basic amenities",
      "Housekeeping",
      "Wi-Fi",
    ],
  },
  {
    code: "MAP" as const,
    name: "Room + Breakfast + 1 Meal",
    description:
      "Modified American Plan - Room with breakfast and one main meal",
    inclusions: [
      "Room accommodation",
      "Daily breakfast",
      "Lunch or dinner",
      "Basic amenities",
      "Housekeeping",
      "Wi-Fi",
    ],
  },
  {
    code: "AP" as const,
    name: "Room + All Meals",
    description: "American Plan - Room with all meals included",
    inclusions: [
      "Room accommodation",
      "Daily breakfast",
      "Lunch",
      "Dinner",
      "Basic amenities",
      "Housekeeping",
      "Wi-Fi",
    ],
  },
]

const availableOccupancies = [
  {
    type: "SINGLE" as const,
    label: "Single",
    description: "Single Sharing",
    maxGuests: 1,
  },
  {
    type: "DOUBLE" as const,
    label: "Double",
    description: "Double Sharing",
    maxGuests: 2,
  },
  {
    type: "TRIPLE" as const,
    label: "Triple",
    description: "Triple Sharing",
    maxGuests: 3,
  },
  {
    type: "QUAD" as const,
    label: "Quad",
    description: "Quad Sharing",
    maxGuests: 4,
  },
]

interface PricingSectionProps {
  propertyId: string
  selectedCategory: string
  checkInDate: Date | null
  checkOutDate: Date | null
  guestCount: number
  roomCount: number
  onPriceChange: (priceData: any) => void
  onBookingClick: () => void
  availableCategories?: Array<{
    id: string
    name: string
    price: number
  }>
  onCategoryChange?: (categoryId: string) => void
}

interface PricingData {
  planType: string
  occupancyType: string
  basePrice: number
  totalPrice: number
  pricePerNight: number
  nights: number
  breakdown: {
    roomPrice: number
    taxes: number
    extraCharges: number
  }
}

export default function PricingSection({
  propertyId,
  selectedCategory,
  checkInDate,
  checkOutDate,
  guestCount,
  roomCount,
  onPriceChange,
  onBookingClick,
  availableCategories = [],
  onCategoryChange,
}: PricingSectionProps) {
  const [selectedPlan, setSelectedPlan] = useState<string>("EP")
  const [selectedOccupancy, setSelectedOccupancy] = useState<string>("DOUBLE")
  const [pricingData, setPricingData] = useState<PricingData | null>(null)
  const [loading, setLoading] = useState(false)
  const [showCalendar, setShowCalendar] = useState(false)
  const { toast } = useToast()

  // Auto-select appropriate occupancy based on guest count
  useEffect(() => {
    if (guestCount <= 1) {
      setSelectedOccupancy("SINGLE")
    } else if (guestCount <= 2) {
      setSelectedOccupancy("DOUBLE")
    } else if (guestCount <= 3) {
      setSelectedOccupancy("TRIPLE")
    } else {
      setSelectedOccupancy("QUAD")
    }
  }, [guestCount])

  // Fetch pricing when plan, occupancy, or dates change
  useEffect(() => {
    if (checkInDate && checkOutDate && selectedCategory) {
      fetchPricingData()
    }
  }, [
    selectedPlan,
    selectedOccupancy,
    checkInDate,
    checkOutDate,
    selectedCategory,
    propertyId,
  ])

  const fetchPricingData = async () => {
    if (!checkInDate || !checkOutDate) return

    setLoading(true)
    try {
      const response = await fetch("/api/pricing/query", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          propertyId,
          roomCategory: selectedCategory,
          checkInDate: format(checkInDate, "yyyy-MM-dd"),
          checkOutDate: format(checkOutDate, "yyyy-MM-dd"),
          planType: selectedPlan,
          occupancyType: selectedOccupancy,
        }),
      })

      if (response.ok) {
        const data = await response.json()

        if (data.success && data.pricingOptions.length > 0) {
          const pricing = data.pricingOptions[0]
          const nights = differenceInDays(checkOutDate, checkInDate)
          const basePrice = pricing.pricePerNight
          const roomPrice = basePrice * nights * roomCount
          const taxes = Math.round(roomPrice * 0.12) // 12% GST
          const extraCharges = 0 // Can be calculated based on additional services
          const totalPrice = roomPrice + taxes + extraCharges

          const calculatedPricing: PricingData = {
            planType: selectedPlan,
            occupancyType: selectedOccupancy,
            basePrice,
            totalPrice,
            pricePerNight: basePrice,
            nights,
            breakdown: {
              roomPrice,
              taxes,
              extraCharges,
            },
          }

          setPricingData(calculatedPricing)
          onPriceChange(calculatedPricing)
        } else {
          // Fallback to default pricing if no specific pricing found
          const nights = differenceInDays(checkOutDate, checkInDate)
          const fallbackPrice = 5000 // Default fallback price
          const roomPrice = fallbackPrice * nights * roomCount
          const taxes = Math.round(roomPrice * 0.12)
          const totalPrice = roomPrice + taxes

          const fallbackPricing: PricingData = {
            planType: selectedPlan,
            occupancyType: selectedOccupancy,
            basePrice: fallbackPrice,
            totalPrice,
            pricePerNight: fallbackPrice,
            nights,
            breakdown: {
              roomPrice,
              taxes,
              extraCharges: 0,
            },
          }

          setPricingData(fallbackPricing)
          onPriceChange(fallbackPricing)
        }
      }
    } catch (error) {
      console.error("Error fetching pricing:", error)
      toast({
        title: "Pricing Error",
        description: "Unable to fetch current pricing. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const selectedPlanDetails = availablePlans.find(
    (plan) => plan.code === selectedPlan
  )
  const selectedOccupancyDetails = availableOccupancies.find(
    (occ) => occ.type === selectedOccupancy
  )

  const canBook = checkInDate && checkOutDate && pricingData && !loading

  return (
    <div className="space-y-6">
      {/* 1. Pricing Calendar - Always Visible at Top */}
      <Card className="border-2 border-blue-100 bg-gradient-to-br from-blue-50 to-indigo-50">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center space-x-3 text-xl">
            <div className="p-2 rounded-xl bg-blue-500 text-white">
              <Calendar className="h-6 w-6" />
            </div>
            <span className="text-gray-800">Pricing Calendar</span>
          </CardTitle>
          <p className="text-sm text-gray-600 ml-11">
            View dynamic pricing for your selected plan and occupancy
          </p>
        </CardHeader>
        <CardContent className="pt-0">
          <EnhancedPricingCalendar
            propertyId={propertyId}
            roomCategory={selectedCategory}
            selectedPlan={selectedPlan}
            selectedOccupancy={selectedOccupancy}
            mode="range"
          />
        </CardContent>
      </Card>

      {/* 2. Room Category Selection */}
      {availableCategories.length > 1 && (
        <Card className="border-2 border-green-100 bg-gradient-to-br from-green-50 to-emerald-50">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center space-x-3 text-xl">
              <div className="p-2 rounded-xl bg-green-500 text-white">
                <Home className="h-6 w-6" />
              </div>
              <span className="text-gray-800">Select Room Category</span>
            </CardTitle>
            <p className="text-sm text-gray-600 ml-11">
              Choose your preferred room type for this stay
            </p>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
              {availableCategories.map((category) => {
                const isSelected = selectedCategory === category.id
                return (
                  <div
                    key={category.id}
                    className={`relative cursor-pointer transition-all duration-200 group ${
                      isSelected ? "scale-105" : "hover:scale-105"
                    }`}
                    onClick={() => onCategoryChange?.(category.id)}
                  >
                    {isSelected && (
                      <div className="absolute -top-1 -right-1 z-10">
                        <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center shadow-sm">
                          <Check className="h-2.5 w-2.5 text-white" />
                        </div>
                      </div>
                    )}

                    <div
                      className={`p-3 rounded-xl border-2 transition-all duration-200 ${
                        isSelected
                          ? "bg-green-500 text-white border-green-500 ring-1 shadow-md"
                          : "bg-white border-green-200 hover:border-green-300 shadow-sm hover:shadow-md"
                      }`}
                    >
                      <div className="flex justify-center mb-2">
                        <div
                          className={`p-2.5 rounded-lg transition-colors ${
                            isSelected
                              ? "bg-white/20 border-white/30"
                              : "bg-green-100 border border-green-200 group-hover:bg-green-500 group-hover:border-transparent"
                          }`}
                        >
                          <Home
                            className={`h-4 w-4 transition-colors ${
                              isSelected
                                ? "text-white"
                                : "text-green-600 group-hover:text-white"
                            }`}
                          />
                        </div>
                      </div>

                      <div className="text-center">
                        <div
                          className={`text-sm font-bold ${
                            isSelected ? "text-white" : "text-green-600"
                          }`}
                        >
                          {category.name}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 3. Plan Selection */}
      <Card className="border-2 border-orange-100 bg-gradient-to-br from-orange-50 to-amber-50">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center space-x-3 text-xl">
            <div className="p-2 rounded-xl bg-orange-500 text-white">
              <Utensils className="h-6 w-6" />
            </div>
            <span className="text-gray-800">Select Your Plan</span>
          </CardTitle>
          <p className="text-sm text-gray-600 ml-11">
            Choose your meal plan for this stay
          </p>
        </CardHeader>
        <CardContent className="pt-0">
          <PlanSelector
            plans={availablePlans}
            selectedPlan={selectedPlan}
            onPlanSelect={setSelectedPlan}
            showPrices={false}
          />
        </CardContent>
      </Card>

      {/* 4. Occupancy Selection */}
      <Card className="border-2 border-purple-100 bg-gradient-to-br from-purple-50 to-violet-50">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center space-x-3 text-xl">
            <div className="p-2 rounded-xl bg-purple-500 text-white">
              <Users className="h-6 w-6" />
            </div>
            <span className="text-gray-800">Select Occupancy</span>
          </CardTitle>
          <p className="text-sm text-gray-600 ml-11">
            Choose the number of guests per room
          </p>
        </CardHeader>
        <CardContent className="pt-0">
          <OccupancySelector
            occupancies={availableOccupancies}
            selectedOccupancy={selectedOccupancy}
            onOccupancySelect={setSelectedOccupancy}
          />

          {guestCount > (selectedOccupancyDetails?.maxGuests || 2) && (
            <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-center space-x-2 text-amber-800">
                <Info className="h-4 w-4" />
                <span className="text-sm font-medium">
                  Guest count ({guestCount}) exceeds selected occupancy.
                  Consider selecting a higher occupancy type.
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 5. Pricing Details */}
      <Card className="border-2 border-emerald-100 bg-gradient-to-br from-emerald-50 to-teal-50">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center space-x-3 text-xl">
            <div className="p-2 rounded-xl bg-emerald-500 text-white">
              <IndianRupee className="h-6 w-6" />
            </div>
            <span className="text-gray-800">Pricing Details</span>
          </CardTitle>
          <p className="text-sm text-gray-600 ml-11">
            Complete breakdown of your booking cost
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : pricingData ? (
            <>
              {/* Current Selection Summary */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-blue-50 rounded-lg">
                <div>
                  <div className="text-sm text-blue-600 font-medium">
                    Selected Plan
                  </div>
                  <div className="font-semibold">
                    {selectedPlanDetails?.name}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-blue-600 font-medium">
                    Occupancy
                  </div>
                  <div className="font-semibold">
                    {selectedOccupancyDetails?.label} Sharing
                  </div>
                </div>
              </div>

              {/* Price Breakdown */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span>Price per night</span>
                  <span className="font-semibold">
                    ₹{pricingData.pricePerNight.toLocaleString()}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span>
                    × {pricingData.nights} nights × {roomCount} room(s)
                  </span>
                  <span className="font-semibold">
                    ₹{pricingData.breakdown.roomPrice.toLocaleString()}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span>Taxes & fees (12% GST)</span>
                  <span className="font-semibold">
                    ₹{pricingData.breakdown.taxes.toLocaleString()}
                  </span>
                </div>

                <Separator />

                <div className="flex justify-between items-center text-lg font-bold">
                  <span>Total Amount</span>
                  <span className="text-green-600">
                    ₹{pricingData.totalPrice.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Booking Button */}
              <Button
                onClick={onBookingClick}
                disabled={!canBook}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3"
                size="lg"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                ) : null}
                Book Now - ₹{pricingData.totalPrice.toLocaleString()}
              </Button>
            </>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Calendar className="h-12 w-12 mx-auto mb-2 text-gray-300" />
              <p>Select dates to view pricing</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
