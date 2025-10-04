"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Coffee, Utensils, Check, Info } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface PlanPricingMatrixProps {
  propertyId: string
  selectedCategory: string
}

const planConfig = {
  EP: {
    name: "European Plan",
    shortName: "EP",
    description: "Room Only",
    icon: null,
    color: "bg-gray-100 text-gray-800 border-gray-300"
  },
  CP: {
    name: "Continental Plan",
    shortName: "CP",
    description: "Room + Breakfast",
    icon: Coffee,
    color: "bg-blue-100 text-blue-800 border-blue-300"
  },
  MAP: {
    name: "Modified American Plan",
    shortName: "MAP",
    description: "Room + Breakfast + Lunch/Dinner",
    icon: Utensils,
    color: "bg-purple-100 text-purple-800 border-purple-300"
  },
  AP: {
    name: "American Plan",
    shortName: "AP",
    description: "All Meals Included",
    icon: Utensils,
    color: "bg-green-100 text-green-800 border-green-300"
  }
}

const occupancyConfig = {
  SINGLE: { label: "Single", maxGuests: 1 },
  DOUBLE: { label: "Double", maxGuests: 2 },
  TRIPLE: { label: "Triple", maxGuests: 3 },
  QUAD: { label: "Quad", maxGuests: 4 }
}

interface PricingData {
  planType: string
  occupancyType: string
  price: number
}

export function PlanPricingMatrix({ propertyId, selectedCategory }: PlanPricingMatrixProps) {
  const [pricingData, setPricingData] = useState<PricingData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchPricingMatrix = async () => {
      if (!propertyId || !selectedCategory) {
        setLoading(false)
        return
      }

      setLoading(true)
      setError(null)

      try {
        const response = await fetch(`/api/properties/${propertyId}/pricing-matrix?category=${selectedCategory}`)

        if (!response.ok) {
          throw new Error("Failed to fetch pricing matrix")
        }

        const data = await response.json()

        if (data.success && data.pricingMatrix) {
          setPricingData(data.pricingMatrix)
        }
      } catch (err) {
        console.error("Error fetching pricing matrix:", err)
        setError("Unable to load pricing matrix")
      } finally {
        setLoading(false)
      }
    }

    fetchPricingMatrix()
  }, [propertyId, selectedCategory])

  // Get unique plans and occupancies from pricing data
  const availablePlans = Array.from(new Set(pricingData.map(p => p.planType)))
  const availableOccupancies = Array.from(new Set(pricingData.map(p => p.occupancyType)))

  // Get price for specific plan and occupancy combination
  const getPrice = (plan: string, occupancy: string) => {
    const pricing = pricingData.find(p => p.planType === plan && p.occupancyType === occupancy)
    return pricing?.price
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Pricing Matrix</CardTitle>
          <CardDescription>View pricing for different plans and occupancy types</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error || pricingData.length === 0) {
    return null // Don't show matrix if no data available
  }

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span>Pricing Matrix</span>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Info className="h-4 w-4 text-gray-400" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-xs text-sm">
                  Prices vary based on meal plan and room occupancy. Select your preferences above to see the exact price.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </CardTitle>
        <CardDescription>
          Starting prices per night for different meal plans and occupancy types
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b">
                <th className="text-left p-3 font-semibold text-gray-700">Meal Plan</th>
                {availableOccupancies.map(occupancy => (
                  <th key={occupancy} className="text-center p-3 font-semibold text-gray-700">
                    {occupancyConfig[occupancy as keyof typeof occupancyConfig]?.label || occupancy}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {availablePlans.map(plan => {
                const planInfo = planConfig[plan as keyof typeof planConfig]
                const Icon = planInfo?.icon

                return (
                  <tr key={plan} className="border-b hover:bg-gray-50">
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        {Icon && <Icon className="h-4 w-4 text-gray-600" />}
                        <div>
                          <div className="font-medium text-gray-900">{planInfo?.shortName || plan}</div>
                          <div className="text-xs text-gray-500">{planInfo?.description}</div>
                        </div>
                      </div>
                    </td>
                    {availableOccupancies.map(occupancy => {
                      const price = getPrice(plan, occupancy)

                      return (
                        <td key={`${plan}-${occupancy}`} className="p-3 text-center">
                          {price ? (
                            <div>
                              <div className="font-semibold text-gray-900">
                                ₹{price.toLocaleString()}
                              </div>
                              <div className="text-xs text-gray-500">per night</div>
                            </div>
                          ) : (
                            <span className="text-gray-400 text-sm">N/A</span>
                          )}
                        </td>
                      )
                    })}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start gap-2">
            <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">Price Guide</p>
              <ul className="space-y-1 text-blue-700">
                <li className="flex items-center gap-1">
                  <Check className="h-3 w-3" />
                  <span>Prices shown are base rates per night</span>
                </li>
                <li className="flex items-center gap-1">
                  <Check className="h-3 w-3" />
                  <span>Final price may vary based on dates and availability</span>
                </li>
                <li className="flex items-center gap-1">
                  <Check className="h-3 w-3" />
                  <span>Taxes and fees will be added at checkout</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
