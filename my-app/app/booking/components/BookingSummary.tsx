"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import Image from "next/image"
import { format } from "date-fns"
import { MapPin, Star, Calendar, Users, Edit2, Bed, Utensils } from "lucide-react"
import { PropertyData, RoomCategoryData, DateSelection, GuestSelection, PricingBreakdown } from "@/lib/booking-flow/types"
import { PriceBreakdown } from "./PriceBreakdown"
import { getValidImageUrl } from "@/lib/utils/image-utils"

interface BookingSummaryProps {
  propertyData: PropertyData
  roomCategoryData: RoomCategoryData
  dateSelection: DateSelection
  guestSelection: GuestSelection
  pricing: PricingBreakdown
  selectedMeals?: string[]
  mealCost?: number
  onEditDates?: () => void
  onEditGuests?: () => void
  onEditRoom?: () => void
  onEditMeals?: () => void
  showEditButtons?: boolean
  compact?: boolean
}

export function BookingSummary({
  propertyData,
  roomCategoryData,
  dateSelection,
  guestSelection,
  pricing,
  selectedMeals = [],
  mealCost = 0,
  onEditDates,
  onEditGuests,
  onEditRoom,
  onEditMeals,
  showEditButtons = false,
  compact = false,
}: BookingSummaryProps) {
  // Helper to format meal names
  const formatMealName = (mealId: string) => {
    const mealNames: { [key: string]: string } = {
      breakfast: "Breakfast",
      lunchDinner: "Lunch/Dinner",
      allMeals: "All Meals"
    }
    return mealNames[mealId] || mealId
  }
  // Get the first available image from property or room category
  const firstImage = propertyData.images?.[0] || roomCategoryData.images?.[0]

  // Debug logging
  console.log('[BookingSummary] Image check:', {
    propertyImages: propertyData.images,
    roomImages: roomCategoryData.images,
    firstImage,
  })

  const imageUrl = getValidImageUrl(firstImage, '/placeholder.svg')

  return (
    <Card className={compact ? "border-0 shadow-none" : "sticky top-4"}>
      <CardHeader className={compact ? "pb-3" : ""}>
        <CardTitle className="text-lg">Booking Summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Property Info */}
        <div className="space-y-3">
          <div className="relative w-full h-32 rounded-lg overflow-hidden bg-gray-100">
            <Image
              src={imageUrl}
              alt={propertyData.name}
              fill
              className="object-cover"
              unoptimized={imageUrl === '/placeholder.svg'}
            />
          </div>

          <div>
            <h3 className="font-semibold text-base">{propertyData.name}</h3>
            <div className="flex items-center gap-1 text-sm text-gray-600 mt-1">
              <MapPin className="h-3 w-3" />
              <span>{propertyData.city}</span>
            </div>
            {propertyData.rating && (
              <div className="flex items-center gap-1 mt-1">
                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                <span className="text-sm font-medium">{propertyData.rating}</span>
                {propertyData.reviewsCount && (
                  <span className="text-xs text-gray-500">
                    ({propertyData.reviewsCount} reviews)
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        <Separator />

        {/* Room Type */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bed className="h-4 w-4 text-gray-600" />
              <span className="text-sm font-medium">Room Type</span>
            </div>
            {showEditButtons && onEditRoom && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onEditRoom}
                className="h-7 px-2 text-red-600"
              >
                <Edit2 className="h-3 w-3 mr-1" />
                Edit
              </Button>
            )}
          </div>
          <p className="text-sm text-gray-700">{roomCategoryData.name}</p>
          <p className="text-xs text-gray-500">
            Max {roomCategoryData.maxCapacityPerRoom} persons per room
          </p>
        </div>

        <Separator />

        {/* Dates */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gray-600" />
              <span className="text-sm font-medium">Dates</span>
            </div>
            {showEditButtons && onEditDates && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onEditDates}
                className="h-7 px-2 text-red-600"
              >
                <Edit2 className="h-3 w-3 mr-1" />
                Edit
              </Button>
            )}
          </div>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Check-in:</span>
              <span className="font-medium">
                {format(dateSelection.checkIn, "MMM dd, yyyy")}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Check-out:</span>
              <span className="font-medium">
                {format(dateSelection.checkOut, "MMM dd, yyyy")}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Duration:</span>
              <span className="font-medium">
                {dateSelection.nights} {dateSelection.nights === 1 ? "night" : "nights"}
              </span>
            </div>
          </div>
        </div>

        <Separator />

        {/* Guests */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-gray-600" />
              <span className="text-sm font-medium">Guests</span>
            </div>
            {showEditButtons && onEditGuests && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onEditGuests}
                className="h-7 px-2 text-red-600"
              >
                <Edit2 className="h-3 w-3 mr-1" />
                Edit
              </Button>
            )}
          </div>
          <div className="space-y-1">
            <div className="text-sm">
              <span className="font-medium">
                {guestSelection.rooms} {guestSelection.rooms === 1 ? "Room" : "Rooms"},{" "}
                {guestSelection.adults} {guestSelection.adults === 1 ? "Adult" : "Adults"}
                {guestSelection.children > 0 &&
                  `, ${guestSelection.children} ${guestSelection.children === 1 ? "Child" : "Children"}`}
              </span>
            </div>
            {pricing.extraGuests > 0 && (
              <div className="text-xs text-amber-700 bg-amber-50 px-2 py-1.5 rounded">
                Includes {pricing.extraGuests} extra {pricing.extraGuests === 1 ? "guest" : "guests"}
                (₹{pricing.extraGuestCharge.toLocaleString()} charged)
              </div>
            )}
          </div>
        </div>

        {/* Meals Section - Only show if meals are selected */}
        {selectedMeals.length > 0 && (
          <>
            <Separator />
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Utensils className="h-4 w-4 text-gray-600" />
                  <span className="text-sm font-medium">Meal Plans</span>
                </div>
                {showEditButtons && onEditMeals && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onEditMeals}
                    className="h-7 px-2 text-red-600"
                  >
                    <Edit2 className="h-3 w-3 mr-1" />
                    Edit
                  </Button>
                )}
              </div>
              <div className="space-y-1">
                {selectedMeals.map((mealId) => (
                  <div key={mealId} className="flex items-center justify-between text-sm">
                    <span className="text-gray-700">• {formatMealName(mealId)}</span>
                  </div>
                ))}
                {mealCost > 0 && (
                  <div className="flex justify-between text-sm pt-1">
                    <span className="text-gray-600">Total meal cost:</span>
                    <span className="font-medium">₹{mealCost.toLocaleString()}</span>
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        <Separator />

        {/* Price Breakdown */}
        <PriceBreakdown
          pricing={pricing}
          nights={dateSelection.nights}
          rooms={guestSelection.rooms}
          showDetails={!compact}
        />

        {/* Trust badges */}
        <div className="bg-gray-50 rounded-lg p-3 space-y-2">
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <Badge variant="secondary" className="text-xs">
              ✓ Free Cancellation
            </Badge>
          </div>
          <p className="text-xs text-gray-500">
            Cancel up to 24 hours before check-in for a full refund
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
