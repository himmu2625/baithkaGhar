"use client"

import React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Coffee, Utensils, Users } from "lucide-react"

interface PlanFiltersProps {
  selectedPlans: string[]
  selectedOccupancies: string[]
  onPlanChange: (plans: string[]) => void
  onOccupancyChange: (occupancies: string[]) => void
}

const mealPlans = [
  {
    value: "EP",
    label: "European Plan (EP)",
    description: "Room Only",
    icon: null
  },
  {
    value: "CP",
    label: "Continental Plan (CP)",
    description: "Room + Breakfast",
    icon: Coffee
  },
  {
    value: "MAP",
    label: "Modified American Plan (MAP)",
    description: "Room + Breakfast + 1 Meal",
    icon: Utensils
  },
  {
    value: "AP",
    label: "American Plan (AP)",
    description: "All Meals Included",
    icon: Utensils
  }
]

const occupancyTypes = [
  { value: "SINGLE", label: "Single", maxGuests: 1 },
  { value: "DOUBLE", label: "Double", maxGuests: 2 },
  { value: "TRIPLE", label: "Triple", maxGuests: 3 },
  { value: "QUAD", label: "Quad", maxGuests: 4 }
]

export function PlanFilters({
  selectedPlans,
  selectedOccupancies,
  onPlanChange,
  onOccupancyChange
}: PlanFiltersProps) {

  const handlePlanToggle = (planValue: string) => {
    const newPlans = selectedPlans.includes(planValue)
      ? selectedPlans.filter(p => p !== planValue)
      : [...selectedPlans, planValue]
    onPlanChange(newPlans)
  }

  const handleOccupancyToggle = (occupancyValue: string) => {
    const newOccupancies = selectedOccupancies.includes(occupancyValue)
      ? selectedOccupancies.filter(o => o !== occupancyValue)
      : [...selectedOccupancies, occupancyValue]
    onOccupancyChange(newOccupancies)
  }

  const clearAllFilters = () => {
    onPlanChange([])
    onOccupancyChange([])
  }

  const hasActiveFilters = selectedPlans.length > 0 || selectedOccupancies.length > 0

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Filters</CardTitle>
          {hasActiveFilters && (
            <button
              onClick={clearAllFilters}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Clear all
            </button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Meal Plan Filters */}
        <div>
          <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
            <Coffee className="h-4 w-4" />
            Meal Plans
          </h3>
          <div className="space-y-3">
            {mealPlans.map((plan) => {
              const Icon = plan.icon
              return (
                <div key={plan.value} className="flex items-start space-x-2">
                  <Checkbox
                    id={`plan-${plan.value}`}
                    checked={selectedPlans.includes(plan.value)}
                    onCheckedChange={() => handlePlanToggle(plan.value)}
                  />
                  <div className="flex-1">
                    <Label
                      htmlFor={`plan-${plan.value}`}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex items-center gap-2"
                    >
                      {Icon && <Icon className="h-3 w-3" />}
                      {plan.label}
                    </Label>
                    <p className="text-xs text-gray-500 mt-1">{plan.description}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Occupancy Type Filters */}
        <div>
          <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
            <Users className="h-4 w-4" />
            Occupancy Type
          </h3>
          <div className="space-y-3">
            {occupancyTypes.map((occupancy) => (
              <div key={occupancy.value} className="flex items-start space-x-2">
                <Checkbox
                  id={`occupancy-${occupancy.value}`}
                  checked={selectedOccupancies.includes(occupancy.value)}
                  onCheckedChange={() => handleOccupancyToggle(occupancy.value)}
                />
                <div className="flex-1">
                  <Label
                    htmlFor={`occupancy-${occupancy.value}`}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    {occupancy.label}
                  </Label>
                  <p className="text-xs text-gray-500 mt-1">
                    Up to {occupancy.maxGuests} {occupancy.maxGuests === 1 ? 'guest' : 'guests'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Active Filters Summary */}
        {hasActiveFilters && (
          <div className="pt-3 border-t">
            <h4 className="text-xs font-semibold text-gray-700 mb-2">Active Filters:</h4>
            <div className="flex flex-wrap gap-2">
              {selectedPlans.map(plan => {
                const planInfo = mealPlans.find(p => p.value === plan)
                return (
                  <Badge
                    key={plan}
                    variant="secondary"
                    className="text-xs cursor-pointer hover:bg-red-100"
                    onClick={() => handlePlanToggle(plan)}
                  >
                    {planInfo?.label} ✕
                  </Badge>
                )
              })}
              {selectedOccupancies.map(occupancy => {
                const occupancyInfo = occupancyTypes.find(o => o.value === occupancy)
                return (
                  <Badge
                    key={occupancy}
                    variant="secondary"
                    className="text-xs cursor-pointer hover:bg-red-100"
                    onClick={() => handleOccupancyToggle(occupancy)}
                  >
                    {occupancyInfo?.label} ✕
                  </Badge>
                )
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
