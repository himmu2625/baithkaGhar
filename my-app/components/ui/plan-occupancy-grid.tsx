"use client"

import React, { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/hooks/use-toast"
import { Save, RefreshCw, Check, X } from "lucide-react"

interface PlanOccupancyGridProps {
  propertyId: string
  roomCategories: Array<{
    code: string
    name: string
    basePrice: number
  }>
  selectedCategory?: string
  onSave?: () => void
}

interface PricingEntry {
  roomCategory: string
  planType: string
  occupancyType: string
  price: number
  pricingType: 'BASE' | 'PLAN_BASED'
  isAvailable?: boolean
}

const PLAN_TYPES = [
  { code: 'EP', name: 'Room Only (EP)' },
  { code: 'CP', name: 'Room + Breakfast (CP)' },
  { code: 'MAP', name: 'Room + Breakfast + Dinner (MAP)' },
  { code: 'AP', name: 'All Meals (AP)' },
]

const OCCUPANCY_TYPES = [
  { code: 'SINGLE', name: 'Single' },
  { code: 'DOUBLE', name: 'Double' },
  { code: 'TRIPLE', name: 'Triple' },
  { code: 'QUAD', name: 'Quad' },
]

export default function PlanOccupancyGrid({
  propertyId,
  roomCategories,
  selectedCategory,
  onSave,
}: PlanOccupancyGridProps) {
  const { toast } = useToast()
  const [pricingData, setPricingData] = useState<{
    [key: string]: number
  }>({})
  const [availabilityData, setAvailabilityData] = useState<{
    [key: string]: boolean
  }>({})
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  // Use the selectedCategory prop from parent
  const selectedRoomCategory = selectedCategory || (roomCategories.length > 0 ? roomCategories[0].code : '')

  useEffect(() => {
    if (selectedRoomCategory) {
      fetchPricingData()
    }
  }, [selectedRoomCategory])

  const fetchPricingData = async () => {
    try {
      setLoading(true)
      const response = await fetch(
        `/api/admin/properties/${propertyId}/plan-pricing`
      )
      const data = await response.json()

      if (data.success) {
        // Initialize all plan/occupancy combinations with defaults
        const gridData: { [key: string]: number } = {}
        const availData: { [key: string]: boolean } = {}

        // First, initialize all possible combinations as available with 0 price
        PLAN_TYPES.forEach((plan) => {
          OCCUPANCY_TYPES.forEach((occupancy) => {
            const key = `${plan.code}-${occupancy.code}`
            gridData[key] = 0
            availData[key] = true // Default to available
          })
        })

        // Then override with actual data from database
        data.pricingEntries
          .filter((entry: any) => entry.roomCategory === selectedRoomCategory)
          .forEach((entry: any) => {
            const key = `${entry.planType}-${entry.occupancyType}`
            gridData[key] = entry.price || 0
            availData[key] = entry.isAvailable !== false // Use database value
          })

        setPricingData(gridData)
        setAvailabilityData(availData)
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load pricing data',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handlePriceChange = (
    planType: string,
    occupancyType: string,
    value: string
  ) => {
    const key = `${planType}-${occupancyType}`
    const numValue = parseFloat(value) || 0
    setPricingData((prev) => ({
      ...prev,
      [key]: numValue,
    }))
  }

  const handleAvailabilityToggle = (
    planType: string,
    occupancyType: string,
    isAvailable: boolean
  ) => {
    const key = `${planType}-${occupancyType}`
    setAvailabilityData((prev) => ({
      ...prev,
      [key]: isAvailable,
    }))
  }

  const handleApplyToAll = (planType: string, baseValue: number) => {
    const updates: { [key: string]: number } = {}
    OCCUPANCY_TYPES.forEach((occupancy) => {
      const key = `${planType}-${occupancy.code}`
      updates[key] = baseValue
    })
    setPricingData((prev) => ({ ...prev, ...updates }))
  }

  const handleSaveAll = async () => {
    try {
      setSaving(true)

      // Convert grid data to array of pricing entries
      const entries: PricingEntry[] = []
      Object.entries(pricingData).forEach(([key, price]) => {
        const [planType, occupancyType] = key.split('-')
        const isAvailable = availabilityData[key] !== false // Default to true if not set

        entries.push({
          roomCategory: selectedRoomCategory,
          planType,
          occupancyType,
          price,
          pricingType: 'PLAN_BASED',
          isAvailable,
        })
      })

      const response = await fetch(
        `/api/admin/properties/${propertyId}/plan-pricing`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pricingEntries: entries }),
        }
      )

      const data = await response.json()

      if (data.success) {
        toast({
          title: 'Success',
          description: `Saved ${data.summary.successful} pricing entries`,
        })
        if (onSave) onSave()
      } else {
        throw new Error(data.error || 'Failed to save pricing')
      }
    } catch (error) {
      toast({
        title: 'Error',
        description:
          error instanceof Error ? error.message : 'Failed to save pricing',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  const selectedRoom = roomCategories.find(
    (cat) => cat.code === selectedRoomCategory
  )

  return (
    <div className="space-y-6">
      {/* Action Buttons */}
      <div className="flex gap-2 justify-end">
        <Button
          variant="outline"
          size="sm"
          onClick={fetchPricingData}
          disabled={loading}
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
        <Button
          size="sm"
          onClick={handleSaveAll}
          disabled={saving || loading}
        >
          <Save className="h-4 w-4 mr-2" />
          Save All
        </Button>
      </div>
        {/* Pricing Grid */}
        {loading ? (
          <div className="text-center py-8 text-muted-foreground">
            Loading pricing data...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2 font-semibold">Plan Type</th>
                  {OCCUPANCY_TYPES.map((occupancy) => (
                    <th key={occupancy.code} className="text-center p-2">
                      <div className="font-semibold">{occupancy.name}</div>
                      <div className="text-xs text-muted-foreground">
                        ({occupancy.code})
                      </div>
                    </th>
                  ))}
                  <th className="text-center p-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {PLAN_TYPES.map((plan) => {
                  const firstOccupancyKey = `${plan.code}-${OCCUPANCY_TYPES[0].code}`
                  const baseValue = pricingData[firstOccupancyKey] || 0

                  return (
                    <tr key={plan.code} className="border-b hover:bg-muted/50">
                      <td className="p-2">
                        <div className="font-medium">{plan.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {plan.code}
                        </div>
                      </td>
                      {OCCUPANCY_TYPES.map((occupancy) => {
                        const key = `${plan.code}-${occupancy.code}`
                        const value = pricingData[key] || 0
                        const isAvailable = availabilityData[key] !== false

                        return (
                          <td key={key} className="p-2">
                            <div className="space-y-2">
                              <div className="flex items-center gap-2 justify-center">
                                <Switch
                                  checked={isAvailable}
                                  onCheckedChange={(checked) =>
                                    handleAvailabilityToggle(
                                      plan.code,
                                      occupancy.code,
                                      checked
                                    )
                                  }
                                  className="scale-75"
                                />
                                <span className="text-xs font-medium">
                                  {isAvailable ? (
                                    <span className="text-green-600 flex items-center gap-1">
                                      <Check className="h-3 w-3" />
                                      Available
                                    </span>
                                  ) : (
                                    <span className="text-red-600 flex items-center gap-1">
                                      <X className="h-3 w-3" />
                                      Unavailable
                                    </span>
                                  )}
                                </span>
                              </div>
                              <Input
                                type="number"
                                value={value || ''}
                                onChange={(e) =>
                                  handlePriceChange(
                                    plan.code,
                                    occupancy.code,
                                    e.target.value
                                  )
                                }
                                className="w-28 text-center"
                                placeholder="0"
                                disabled={!isAvailable}
                              />
                            </div>
                          </td>
                        )
                      })}
                      <td className="p-2 text-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleApplyToAll(plan.code, baseValue)}
                          disabled={!baseValue}
                        >
                          Apply to All
                        </Button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

      {/* Info */}
      <div className="text-sm text-muted-foreground space-y-1">
        <p>• EP: European Plan (Room Only)</p>
        <p>• CP: Continental Plan (Room + Breakfast)</p>
        <p>• MAP: Modified American Plan (Room + Breakfast + Dinner)</p>
        <p>• AP: American Plan (Room + All Meals)</p>
      </div>
    </div>
  )
}
