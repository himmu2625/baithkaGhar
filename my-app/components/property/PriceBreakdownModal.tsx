"use client"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import {
  IndianRupee,
  Calendar,
  Users,
  Utensils,
  TrendingUp,
  Info,
} from "lucide-react"

interface PriceBreakdownModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  basePrice: number
  nights: number
  guests: number
  rooms?: number
  extraGuestCharge?: number
  freeGuestLimit?: number
  mealAddons?: {
    breakfast?: number
    lunch?: number
    dinner?: number
    lunchDinner?: number
    allMeals?: number
  }
  taxes?: number
  serviceFee?: number
  discountPercent?: number
  dynamicPriceMultiplier?: number
}

export function PriceBreakdownModal({
  open,
  onOpenChange,
  basePrice,
  nights,
  guests,
  rooms = 1,
  extraGuestCharge = 0,
  freeGuestLimit = 2,
  mealAddons = {},
  taxes = 0,
  serviceFee = 0,
  discountPercent = 0,
  dynamicPriceMultiplier = 1,
}: PriceBreakdownModalProps) {
  // Calculations
  const extraGuests = Math.max(0, guests - freeGuestLimit)
  const extraGuestTotal = extraGuests * extraGuestCharge * nights

  const mealTotal = Object.values(mealAddons).reduce((sum, price) => {
    return sum + (price || 0) * guests * nights
  }, 0)

  const subtotal = (basePrice * nights * rooms) + extraGuestTotal + mealTotal
  const dynamicPriceAdjustment = subtotal * (dynamicPriceMultiplier - 1)
  const subtotalAfterDynamic = subtotal + dynamicPriceAdjustment

  const discount = (subtotalAfterDynamic * discountPercent) / 100
  const calculatedTaxes = taxes || (subtotalAfterDynamic - discount) * 0.12 // 12% GST
  const calculatedServiceFee = serviceFee || (subtotalAfterDynamic - discount) * 0.05 // 5% service fee

  const totalPrice = subtotalAfterDynamic - discount + calculatedTaxes + calculatedServiceFee

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <IndianRupee className="h-6 w-6 text-emerald-600" />
            Price Breakdown
          </DialogTitle>
          <DialogDescription>
            Detailed breakdown of your booking cost
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Booking Summary */}
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h3 className="font-semibold text-blue-900 mb-3">Booking Summary</h3>
            <div className="space-y-2 text-sm">
              {rooms > 1 && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-blue-600" />
                    <span className="text-blue-800">Number of Rooms</span>
                  </div>
                  <span className="font-semibold text-blue-900">{rooms}</span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-blue-600" />
                  <span className="text-blue-800">Number of Nights</span>
                </div>
                <span className="font-semibold text-blue-900">{nights}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-blue-600" />
                  <span className="text-blue-800">Number of Guests</span>
                </div>
                <span className="font-semibold text-blue-900">{guests}</span>
              </div>
              {extraGuests > 0 && (
                <div className="pt-1 mt-2 border-t border-blue-300">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-blue-700">
                      (Includes {extraGuests} extra {extraGuests === 1 ? 'guest' : 'guests'})
                    </span>
                    <span className="text-blue-700">Free up to {freeGuestLimit}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Base Price */}
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-900">Room Charges</h3>
            <div className="flex justify-between items-center">
              <span className="text-gray-700">
                ₹{basePrice.toLocaleString()} × {nights} {nights === 1 ? 'night' : 'nights'}{rooms > 1 ? ` × ${rooms} ${rooms === 1 ? 'room' : 'rooms'}` : ''}
              </span>
              <span className="font-semibold text-gray-900">
                ₹{(basePrice * nights * rooms).toLocaleString()}
              </span>
            </div>
          </div>

          {/* Extra Guest Charges */}
          {extraGuests > 0 && extraGuestCharge > 0 && (
            <>
              <Separator />
              <div className="space-y-3">
                <h3 className="font-semibold text-gray-900">Extra Guest Charges</h3>
                <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <span className="text-sm text-amber-900">
                        {extraGuests} extra {extraGuests === 1 ? 'guest' : 'guests'} × ₹{extraGuestCharge}/night
                      </span>
                      <p className="text-xs text-amber-700 mt-1">
                        (Free for up to {freeGuestLimit} guests)
                      </p>
                    </div>
                    <span className="font-semibold text-amber-900">
                      ₹{extraGuestTotal.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Meal Add-ons */}
          {mealTotal > 0 && (
            <>
              <Separator />
              <div className="space-y-3">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Utensils className="h-4 w-4" />
                  Meal Add-ons
                </h3>
                {Object.entries(mealAddons).map(([meal, price]) => {
                  if (!price) return null

                  // Format meal names properly
                  const mealNames: { [key: string]: string } = {
                    breakfast: 'Breakfast',
                    lunch: 'Lunch',
                    dinner: 'Dinner',
                    lunchDinner: 'Lunch/Dinner',
                    allMeals: 'All Meals'
                  }
                  const mealName = mealNames[meal] || meal

                  return (
                    <div key={meal} className="flex justify-between items-center text-sm">
                      <span className="text-gray-700">
                        {mealName}: ₹{price} × {guests} Guests × {nights} Nights
                      </span>
                      <span className="font-semibold text-gray-900">
                        ₹{(price * guests * nights).toLocaleString()}
                      </span>
                    </div>
                  )
                })}
              </div>
            </>
          )}

          {/* Dynamic Pricing Adjustment */}
          {dynamicPriceMultiplier !== 1 && (
            <>
              <Separator />
              <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-purple-600" />
                    <span className="text-sm text-purple-900">Dynamic Pricing Adjustment</span>
                    {dynamicPriceMultiplier > 1 && (
                      <Badge variant="destructive" className="text-xs">Peak</Badge>
                    )}
                    {dynamicPriceMultiplier < 1 && (
                      <Badge variant="secondary" className="text-xs bg-green-500 text-white">Off-Peak</Badge>
                    )}
                  </div>
                  <span className={`font-semibold ${dynamicPriceAdjustment >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {dynamicPriceAdjustment >= 0 ? '+' : ''}₹{Math.abs(dynamicPriceAdjustment).toLocaleString()}
                  </span>
                </div>
                <p className="text-xs text-purple-700 mt-2">
                  {dynamicPriceMultiplier > 1
                    ? 'Higher demand during this period'
                    : 'Lower demand - great savings!'}
                </p>
              </div>
            </>
          )}

          <Separator className="my-4 border-2" />

          {/* Subtotal */}
          <div className="flex justify-between items-center font-semibold text-lg">
            <span>Subtotal</span>
            <span>₹{subtotalAfterDynamic.toLocaleString()}</span>
          </div>

          {/* Discount */}
          {discountPercent > 0 && (
            <div className="flex justify-between items-center text-green-600">
              <span>Discount ({discountPercent}%)</span>
              <span>- ₹{discount.toLocaleString()}</span>
            </div>
          )}

          {/* Taxes */}
          <div className="flex justify-between items-center text-sm text-gray-700">
            <div className="flex items-center gap-1">
              <span>Taxes & Fees (GST 12%)</span>
              <Info className="h-3 w-3 text-gray-400" />
            </div>
            <span>₹{calculatedTaxes.toLocaleString()}</span>
          </div>

          {/* Service Fee */}
          <div className="flex justify-between items-center text-sm text-gray-700">
            <span>Service Fee (5%)</span>
            <span>₹{calculatedServiceFee.toLocaleString()}</span>
          </div>

          <Separator className="my-4 border-2 border-emerald-200" />

          {/* Total */}
          <div className="p-4 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-lg border-2 border-emerald-300">
            <div className="flex justify-between items-center">
              <span className="text-xl font-bold text-emerald-900">Total Amount</span>
              <span className="text-2xl font-bold text-emerald-700">
                ₹{totalPrice.toLocaleString()}
              </span>
            </div>
            <p className="text-xs text-emerald-700 mt-2">
              Final amount payable (all charges included)
            </p>
          </div>

          {/* Info Note */}
          <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-xs text-blue-800">
              <Info className="h-3 w-3 inline mr-1" />
              All prices are in Indian Rupees (₹). Taxes and fees are calculated as per government regulations.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
