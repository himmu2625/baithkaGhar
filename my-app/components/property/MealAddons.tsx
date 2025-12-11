"use client"

import React, { useState, useEffect } from "react"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Coffee, Utensils, UtensilsCrossed, Info } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface MealOption {
  id: string
  name: string
  pricePerPerson: number
  icon: React.ReactNode
  description: string
}

interface MealAddonsProps {
  mealPricing: {
    breakfast?: { enabled: boolean; pricePerPerson: number; description?: string }
    lunchDinner?: { enabled: boolean; pricePerPerson: number; description?: string }
    allMeals?: { enabled: boolean; pricePerPerson: number; description?: string }
  }
  totalGuests: number
  nights: number
  onSelectionChange: (selectedMeals: string[], totalMealCost: number) => void
  initialSelectedMeals?: string[]
  className?: string
}

export function MealAddons({
  mealPricing,
  totalGuests,
  nights,
  onSelectionChange,
  initialSelectedMeals = [],
  className = ""
}: MealAddonsProps) {
  const [selectedMeals, setSelectedMeals] = useState<string[]>(initialSelectedMeals)

  // Update selectedMeals when initialSelectedMeals changes (from URL)
  useEffect(() => {
    if (initialSelectedMeals && initialSelectedMeals.length > 0) {
      setSelectedMeals(initialSelectedMeals)
    }
  }, [initialSelectedMeals])

  // Build available meal options
  const availableMeals: MealOption[] = [
    {
      id: 'breakfast',
      name: 'Breakfast',
      pricePerPerson: mealPricing.breakfast?.pricePerPerson || 0,
      icon: <Coffee className="h-3.5 w-3.5" />,
      description: mealPricing.breakfast?.description || 'Continental breakfast daily'
    },
    {
      id: 'lunchDinner',
      name: 'Lunch/Dinner',
      pricePerPerson: mealPricing.lunchDinner?.pricePerPerson || 0,
      icon: <Utensils className="h-3.5 w-3.5" />,
      description: mealPricing.lunchDinner?.description || 'Choose lunch or dinner'
    },
    {
      id: 'allMeals',
      name: 'All Meals',
      pricePerPerson: mealPricing.allMeals?.pricePerPerson || 0,
      icon: <UtensilsCrossed className="h-3.5 w-3.5" />,
      description: mealPricing.allMeals?.description || 'Breakfast, lunch & dinner included'
    },
  ].filter(meal => {
    if (meal.id === 'breakfast') return mealPricing.breakfast?.enabled
    if (meal.id === 'lunchDinner') return mealPricing.lunchDinner?.enabled
    if (meal.id === 'allMeals') return mealPricing.allMeals?.enabled
    return false
  })

  // Calculate and notify parent when selection changes
  useEffect(() => {
    const totalCost = selectedMeals.reduce((sum, mealId) => {
      const meal = availableMeals.find(m => m.id === mealId)
      if (!meal) return sum
      return sum + (meal.pricePerPerson * totalGuests * nights)
    }, 0)

    onSelectionChange(selectedMeals, totalCost)
  }, [selectedMeals, totalGuests, nights])

  const handleMealToggle = (mealId: string, checked: boolean) => {
    let updated: string[] = []

    if (mealId === 'allMeals' && checked) {
      // If selecting "All Meals", deselect other meals (since all meals includes everything)
      updated = ['allMeals']
    } else if (checked) {
      // Adding a meal - if "All Meals" was selected, deselect it
      updated = [...selectedMeals.filter(id => id !== 'allMeals'), mealId]
    } else {
      // Removing a meal
      updated = selectedMeals.filter(id => id !== mealId)
    }

    setSelectedMeals(updated)
  }

  // If no meals available, don't render
  if (availableMeals.length === 0) {
    return null
  }

  const hasAllMealsSelected = selectedMeals.includes('allMeals')

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Compact Header */}
      <div className="flex items-center gap-2 mb-2">
        <UtensilsCrossed className="h-4 w-4 text-orange-600" />
        <span className="text-sm font-semibold text-gray-900">Add Meal Options</span>
        <span className="text-[10px] text-gray-500">(Optional)</span>
      </div>

      <div className="space-y-2">{/* Info Alert */}
        <Alert className="bg-blue-50 border-blue-200 py-1.5 px-2">
          <Info className="h-3 w-3 text-blue-600" />
          <AlertDescription className="text-[10px] text-blue-800 leading-tight">
            Optional meal add-ons. Select what you'd like included.
          </AlertDescription>
        </Alert>

        {/* Meal Options */}
        {availableMeals.map((meal) => {
          const isSelected = selectedMeals.includes(meal.id)
          const isDisabled = hasAllMealsSelected && meal.id !== 'allMeals'
          const mealCost = meal.pricePerPerson * totalGuests * nights
          const dailyCost = meal.pricePerPerson * totalGuests

          return (
            <div
              key={meal.id}
              className={`
                flex items-start justify-between p-2 border rounded-md transition-all cursor-pointer
                ${isSelected
                  ? 'border-blue-500 bg-blue-50'
                  : isDisabled
                  ? 'border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed'
                  : 'border-gray-200 hover:border-gray-300'
                }
              `}
              onClick={() => !isDisabled && handleMealToggle(meal.id, !isSelected)}
            >
              <div className="flex items-start gap-2 flex-1">
                <Checkbox
                  id={meal.id}
                  checked={isSelected}
                  onCheckedChange={(checked) => !isDisabled && handleMealToggle(meal.id, checked as boolean)}
                  disabled={isDisabled}
                  className={`mt-0.5 h-3.5 w-3.5 ${isSelected ? "border-blue-500" : ""}`}
                />
                <div className="flex-1">
                  <Label
                    htmlFor={meal.id}
                    className={`flex items-center gap-1.5 text-xs font-semibold cursor-pointer ${
                      isDisabled ? 'text-gray-400' : 'text-gray-900'
                    }`}
                  >
                    <span className={`${isSelected ? "text-blue-600" : isDisabled ? "text-gray-400" : "text-gray-600"}`}>
                      {meal.icon}
                    </span>
                    {meal.name}
                    {meal.id === 'allMeals' && (
                      <Badge variant="secondary" className="ml-1 bg-orange-100 text-orange-700 text-[9px] py-0 px-1">
                        Best Value
                      </Badge>
                    )}
                  </Label>
                  <p className={`text-[10px] mt-0.5 leading-tight ${isDisabled ? 'text-gray-400' : 'text-gray-600'}`}>
                    {meal.description}
                  </p>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="text-[9px] text-gray-500">
                      ₹{meal.pricePerPerson}/person/day
                    </span>
                    <span className="text-[9px] text-gray-400">•</span>
                    <span className="text-[9px] text-gray-500">
                      ₹{dailyCost.toLocaleString()}/day for {totalGuests}
                    </span>
                  </div>
                </div>
              </div>
              <div className="text-right ml-2">
                <div className={`text-sm font-bold ${
                  isSelected ? 'text-blue-600' : isDisabled ? 'text-gray-400' : 'text-gray-900'
                }`}>
                  ₹{mealCost.toLocaleString()}
                </div>
                <div className="text-[9px] text-gray-500">
                  {nights}N
                </div>
              </div>
            </div>
          )
        })}

        {/* Selection Summary */}
        {selectedMeals.length > 0 && (
          <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-md">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-medium text-green-800">
                {selectedMeals.length} meal option{selectedMeals.length > 1 ? 's' : ''} selected
              </span>
              <span className="text-xs font-semibold text-green-900">
                ₹{selectedMeals.reduce((sum, mealId) => {
                  const meal = availableMeals.find(m => m.id === mealId)
                  if (!meal) return sum
                  return sum + (meal.pricePerPerson * totalGuests * nights)
                }, 0).toLocaleString()}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
