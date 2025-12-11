"use client"

import { PricingBreakdown } from "@/lib/booking-flow/types"
import { formatCurrency } from "@/lib/booking-flow/pricing-calculator"
import { Separator } from "@/components/ui/separator"
import { Info } from "lucide-react"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface PriceBreakdownProps {
  pricing: PricingBreakdown
  nights: number
  rooms: number
  showDetails?: boolean
}

export function PriceBreakdown({
  pricing,
  nights,
  rooms,
  showDetails = true,
}: PriceBreakdownProps) {
  return (
    <div className="space-y-3">
      <h3 className="font-semibold text-lg">Price Breakdown</h3>

      {showDetails && (
        <div className="space-y-2 text-sm">
          {/* Base room charges */}
          <div className="flex justify-between">
            <div className="flex items-center gap-1">
              <span className="text-gray-600">
                Room charges × {nights} {nights === 1 ? "night" : "nights"} × {rooms}{" "}
                {rooms === 1 ? "room" : "rooms"}
              </span>
            </div>
            <span className="font-medium">{formatCurrency(pricing.baseRoomTotal)}</span>
          </div>

          {/* Extra guest charges */}
          {pricing.extraGuestCharge > 0 && (
            <div className="flex justify-between">
              <div className="flex items-center gap-1">
                <span className="text-gray-600">
                  Extra guest charges ({pricing.extraGuests}{" "}
                  {pricing.extraGuests === 1 ? "guest" : "guests"})
                </span>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="h-3 w-3 text-gray-400" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-xs max-w-xs">
                        Additional charges apply for guests beyond the base capacity after
                        free extra person limit
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <span className="font-medium">{formatCurrency(pricing.extraGuestCharge)}</span>
            </div>
          )}

          {/* Meal charges */}
          {pricing.mealTotal > 0 && (
            <div className="flex justify-between">
              <span className="text-gray-600">Meal plan</span>
              <span className="font-medium">{formatCurrency(pricing.mealTotal)}</span>
            </div>
          )}

          {/* Add-ons */}
          {pricing.addOnsTotal > 0 && (
            <div className="flex justify-between">
              <span className="text-gray-600">Add-ons & extras</span>
              <span className="font-medium">{formatCurrency(pricing.addOnsTotal)}</span>
            </div>
          )}

          <Separator />

          {/* Subtotal */}
          <div className="flex justify-between">
            <span className="text-gray-600">Subtotal</span>
            <span className="font-medium">{formatCurrency(pricing.subtotal)}</span>
          </div>

          {/* Taxes */}
          <div className="flex justify-between">
            <div className="flex items-center gap-1">
              <span className="text-gray-600">Taxes (12% GST)</span>
            </div>
            <span className="font-medium">{formatCurrency(pricing.taxes)}</span>
          </div>

          {/* Service fee */}
          <div className="flex justify-between">
            <span className="text-gray-600">Service fee (5%)</span>
            <span className="font-medium">{formatCurrency(pricing.serviceFee)}</span>
          </div>
        </div>
      )}

      <Separator />

      {/* Total */}
      <div className="flex justify-between items-center">
        <span className="text-lg font-bold">Total Amount</span>
        <span className="text-2xl font-bold text-red-600">
          {formatCurrency(pricing.total)}
        </span>
      </div>

      <p className="text-xs text-gray-500">
        All taxes and fees included • No hidden charges
      </p>
    </div>
  )
}
