"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Check,
  Coffee,
  Utensils,
  Hotel,
  Star,
  Clock,
  Users,
} from "lucide-react"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

export interface PlanType {
  code: "EP" | "CP" | "MAP" | "AP"
  name: string
  description: string
  inclusions: string[]
  price?: number
}

interface PlanSelectorProps {
  plans: PlanType[]
  selectedPlan?: string
  onPlanSelect: (planCode: string) => void
  className?: string
  showPrices?: boolean
}

const planIcons = {
  EP: Hotel,
  CP: Coffee,
  MAP: Utensils,
  AP: Utensils,
}

const planColors = {
  EP: {
    bg: "bg-blue-50",
    border: "border-blue-200",
    hover: "hover:bg-blue-100",
    selected: "ring-blue-500 bg-blue-100",
    icon: "text-blue-600",
    accent: "bg-blue-500",
  },
  CP: {
    bg: "bg-green-50",
    border: "border-green-200",
    hover: "hover:bg-green-100",
    selected: "ring-green-500 bg-green-100",
    icon: "text-green-600",
    accent: "bg-green-500",
  },
  MAP: {
    bg: "bg-orange-50",
    border: "border-orange-200",
    hover: "hover:bg-orange-100",
    selected: "ring-orange-500 bg-orange-100",
    icon: "text-orange-600",
    accent: "bg-orange-500",
  },
  AP: {
    bg: "bg-purple-50",
    border: "border-purple-200",
    hover: "hover:bg-purple-100",
    selected: "ring-purple-500 bg-purple-100",
    icon: "text-purple-600",
    accent: "bg-purple-500",
  },
}

const planLabels = {
  EP: "Room Only",
  CP: "Room + Breakfast",
  MAP: "Room + Breakfast + 1 Meal",
  AP: "Room + All Meals",
}

export default function PlanSelector({
  plans,
  selectedPlan,
  onPlanSelect,
  className = "",
  showPrices = false,
}: PlanSelectorProps) {
  return (
    <div className={`space-y-3 ${className}`}>
      <div className="grid grid-cols-4 gap-2">
        {plans.map((plan) => {
          const IconComponent = planIcons[plan.code]
          const isSelected = selectedPlan === plan.code
          const colors = planColors[plan.code]

          return (
            <div
              key={plan.code}
              className={`relative cursor-pointer transition-all duration-200 group ${
                isSelected ? "scale-105" : "hover:scale-105"
              }`}
              onClick={() => onPlanSelect(plan.code)}
            >
              {/* Selection Indicator */}
              {isSelected && (
                <div className="absolute -top-1 -right-1 z-10">
                  <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center shadow-sm">
                    <Check className="h-2.5 w-2.5 text-white" />
                  </div>
                </div>
              )}

              {/* Ultra-Minimal Plan Block */}
              <div
                className={`p-3 rounded-xl border-2 transition-all duration-200 ${
                  isSelected
                    ? `${colors.selected} ring-1 shadow-md`
                    : `${colors.bg} ${colors.border} ${colors.hover} shadow-sm hover:shadow-md`
                }`}
              >
                {/* Icon Only */}
                <div className="flex justify-center mb-2">
                  <div
                    className={`p-2.5 rounded-lg ${colors.bg} border ${colors.border} transition-colors group-hover:${colors.accent} group-hover:border-transparent`}
                  >
                    <IconComponent
                      className={`h-4 w-4 ${colors.icon} transition-colors group-hover:text-white`}
                    />
                  </div>
                </div>

                {/* Plan Code */}
                <div className="text-center">
                  <div className={`text-sm font-bold ${colors.icon}`}>
                    {plan.code}
                  </div>
                </div>

                {/* Price (if shown) */}
                {showPrices && plan.price && (
                  <div className="mt-2 text-center">
                    <div className="text-sm font-bold text-gray-900">
                      ₹{plan.price.toLocaleString()}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Selected Plan Details */}
      {selectedPlan && (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg border">
          {(() => {
            const selectedPlanData = plans.find((p) => p.code === selectedPlan)
            const colors = planColors[selectedPlan]
            const IconComponent = planIcons[selectedPlan]

            return (
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <div
                    className={`p-2 rounded-lg ${colors.bg} border ${colors.border}`}
                  >
                    <IconComponent className={`h-5 w-5 ${colors.icon}`} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {selectedPlanData?.name}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {selectedPlanData?.description}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {selectedPlanData?.inclusions.map((inclusion, index) => (
                    <div
                      key={index}
                      className="flex items-center space-x-2 text-sm"
                    >
                      <div className={`p-1 rounded-full ${colors.accent}`}>
                        <Check className="h-2 w-2 text-white" />
                      </div>
                      <span className="text-gray-700">{inclusion}</span>
                    </div>
                  ))}
                </div>
              </div>
            )
          })()}
        </div>
      )}
    </div>
  )
}

// Occupancy Selector Component
interface OccupancySelectorProps {
  occupancies: Array<{
    type: "SINGLE" | "DOUBLE" | "TRIPLE" | "QUAD"
    label: string
    description: string
    maxGuests: number
    price?: number
  }>
  selectedOccupancy?: string
  onOccupancySelect: (occupancyType: string) => void
  className?: string
}

export function OccupancySelector({
  occupancies,
  selectedOccupancy,
  onOccupancySelect,
  className = "",
}: OccupancySelectorProps) {
  const getOccupancyColor = (type: string) => {
    const colors = {
      SINGLE: {
        bg: "bg-blue-50",
        border: "border-blue-200",
        hover: "hover:bg-blue-100",
        selected: "ring-blue-500 bg-blue-100",
        icon: "text-blue-600",
        accent: "bg-blue-500",
      },
      DOUBLE: {
        bg: "bg-green-50",
        border: "border-green-200",
        hover: "hover:bg-green-100",
        selected: "ring-green-500 bg-green-100",
        icon: "text-green-600",
        accent: "bg-green-500",
      },
      TRIPLE: {
        bg: "bg-orange-50",
        border: "border-orange-200",
        hover: "hover:bg-orange-100",
        selected: "ring-orange-500 bg-orange-100",
        icon: "text-orange-600",
        accent: "bg-orange-500",
      },
      QUAD: {
        bg: "bg-purple-50",
        border: "border-purple-200",
        hover: "hover:bg-purple-100",
        selected: "ring-purple-500 bg-purple-100",
        icon: "text-purple-600",
        accent: "bg-purple-500",
      },
    }
    return colors[type as keyof typeof colors] || colors.SINGLE
  }

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="grid grid-cols-4 gap-2">
        {occupancies.map((occupancy) => {
          const isSelected = selectedOccupancy === occupancy.type
          const colors = getOccupancyColor(occupancy.type)

          return (
            <div
              key={occupancy.type}
              className={`relative cursor-pointer transition-all duration-200 group ${
                isSelected ? "scale-105" : "hover:scale-105"
              }`}
              onClick={() => onOccupancySelect(occupancy.type)}
            >
              {/* Selection Indicator */}
              {isSelected && (
                <div className="absolute -top-1 -right-1 z-10">
                  <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center shadow-sm">
                    <Check className="h-2.5 w-2.5 text-white" />
                  </div>
                </div>
              )}

              {/* Ultra-Minimal Occupancy Block */}
              <div
                className={`p-3 rounded-xl border-2 transition-all duration-200 ${
                  isSelected
                    ? `${colors.selected} ring-1 shadow-md`
                    : `${colors.bg} ${colors.border} ${colors.hover} shadow-sm hover:shadow-md`
                }`}
              >
                {/* Icon Only */}
                <div className="flex justify-center mb-2">
                  <div
                    className={`p-2.5 rounded-lg ${colors.bg} border ${colors.border} transition-colors group-hover:${colors.accent} group-hover:border-transparent`}
                  >
                    <Users
                      className={`h-4 w-4 ${colors.icon} transition-colors group-hover:text-white`}
                    />
                  </div>
                </div>

                {/* Occupancy Label */}
                <div className="text-center">
                  <div className={`text-xs font-bold ${colors.icon} mb-1`}>
                    {occupancy.label}
                  </div>
                  <div className="text-xs text-gray-600 leading-tight">
                    Max {occupancy.maxGuests}
                  </div>
                </div>

                {/* Price (if shown) */}
                {occupancy.price && (
                  <div className="mt-2 text-center">
                    <div className="text-sm font-bold text-gray-900">
                      ₹{occupancy.price.toLocaleString()}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Selected Occupancy Details */}
      {selectedOccupancy && (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg border">
          {(() => {
            const selectedOccupancyData = occupancies.find(
              (o) => o.type === selectedOccupancy
            )
            const colors = getOccupancyColor(selectedOccupancy)

            return (
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <div
                    className={`p-2 rounded-lg ${colors.bg} border ${colors.border}`}
                  >
                    <Users className={`h-5 w-5 ${colors.icon}`} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {selectedOccupancyData?.label}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {selectedOccupancyData?.description}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Maximum Guests:</span>
                  <span className="text-sm font-semibold text-gray-900">
                    {selectedOccupancyData?.maxGuests}
                  </span>
                </div>

                {selectedOccupancyData?.price && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">
                      Price per night:
                    </span>
                    <span className="text-sm font-semibold text-gray-900">
                      ₹{selectedOccupancyData.price.toLocaleString()}
                    </span>
                  </div>
                )}
              </div>
            )
          })()}
        </div>
      )}
    </div>
  )
}
