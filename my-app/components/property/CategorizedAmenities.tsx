"use client"

import {
  Wifi,
  Tv,
  Car,
  Wind,
  Waves,
  Utensils,
  Coffee,
  Droplets,
  Refrigerator,
  CookingPot,
  BedDouble,
  Dumbbell,
  SpadeIcon as Spa,
  Shield,
  Users,
  Music,
  Gamepad2,
  Laptop,
  Phone,
  Check,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface AmenitiesData {
  wifi?: boolean
  tv?: boolean
  kitchen?: boolean
  parking?: boolean
  ac?: boolean
  pool?: boolean
  geyser?: boolean
  shower?: boolean
  bathTub?: boolean
  reception24x7?: boolean
  roomService?: boolean
  restaurant?: boolean
  bar?: boolean
  pub?: boolean
  fridge?: boolean
  [key: string]: boolean | undefined
}

interface CategorizedAmenitiesProps {
  amenities: AmenitiesData
  otherAmenities?: string
}

interface AmenityCategory {
  name: string
  icon: React.ComponentType<{ className?: string }>
  color: string
  amenities: Array<{
    key: string
    label: string
    icon: React.ComponentType<{ className?: string }>
  }>
}

export function CategorizedAmenities({ amenities, otherAmenities }: CategorizedAmenitiesProps) {
  const categories: AmenityCategory[] = [
    {
      name: "Popular Amenities",
      icon: Shield,
      color: "emerald",
      amenities: [
        { key: "wifi", label: "Free WiFi", icon: Wifi },
        { key: "parking", label: "Free Parking", icon: Car },
        { key: "ac", label: "Air Conditioning", icon: Wind },
        { key: "reception24x7", label: "24/7 Reception", icon: Phone },
        { key: "roomService", label: "Room Service", icon: Users },
      ],
    },
    {
      name: "Kitchen & Dining",
      icon: Utensils,
      color: "orange",
      amenities: [
        { key: "kitchen", label: "Kitchen", icon: CookingPot },
        { key: "restaurant", label: "Restaurant", icon: Utensils },
        { key: "bar", label: "Bar", icon: Coffee },
        { key: "fridge", label: "Refrigerator", icon: Refrigerator },
      ],
    },
    {
      name: "Bathroom",
      icon: Droplets,
      color: "blue",
      amenities: [
        { key: "geyser", label: "Geyser/Water Heater", icon: Droplets },
        { key: "shower", label: "Shower", icon: Droplets },
        { key: "bathTub", label: "Bathtub", icon: Droplets },
      ],
    },
    {
      name: "Entertainment",
      icon: Tv,
      color: "purple",
      amenities: [
        { key: "tv", label: "Television", icon: Tv },
        { key: "wifi", label: "High-Speed Internet", icon: Wifi },
      ],
    },
    {
      name: "Recreation",
      icon: Waves,
      color: "cyan",
      amenities: [
        { key: "pool", label: "Swimming Pool", icon: Waves },
        { key: "gym", label: "Fitness Center", icon: Dumbbell },
        { key: "spa", label: "Spa", icon: Spa },
      ],
    },
  ]

  const colorClasses: Record<string, { bg: string; border: string; text: string; icon: string }> = {
    emerald: {
      bg: "bg-emerald-50",
      border: "border-emerald-200",
      text: "text-emerald-900",
      icon: "text-emerald-600",
    },
    orange: {
      bg: "bg-orange-50",
      border: "border-orange-200",
      text: "text-orange-900",
      icon: "text-orange-600",
    },
    blue: {
      bg: "bg-blue-50",
      border: "border-blue-200",
      text: "text-blue-900",
      icon: "text-blue-600",
    },
    purple: {
      bg: "bg-purple-50",
      border: "border-purple-200",
      text: "text-purple-900",
      icon: "text-purple-600",
    },
    cyan: {
      bg: "bg-cyan-50",
      border: "border-cyan-200",
      text: "text-cyan-900",
      icon: "text-cyan-600",
    },
  }

  return (
    <Card className="mb-6 border-emerald-200 shadow-sm">
      <CardContent className="p-6">
        <h2 className="text-2xl font-bold text-darkGreen mb-6">Amenities</h2>

        <div className="space-y-6">
          {categories.map((category) => {
            const availableAmenities = category.amenities.filter(
              (amenity) => amenities[amenity.key]
            )

            if (availableAmenities.length === 0) return null

            const CategoryIcon = category.icon
            const colors = colorClasses[category.color]

            return (
              <div
                key={category.name}
                className={`p-4 rounded-lg border ${colors.border} ${colors.bg}`}
              >
                <div className="flex items-center gap-2 mb-4">
                  <CategoryIcon className={`h-5 w-5 ${colors.icon}`} />
                  <h3 className={`font-semibold ${colors.text}`}>{category.name}</h3>
                  <Badge variant="secondary" className="ml-auto">
                    {availableAmenities.length}
                  </Badge>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {availableAmenities.map((amenity) => {
                    const AmenityIcon = amenity.icon
                    return (
                      <div
                        key={amenity.key}
                        className="flex items-center gap-2 text-sm"
                      >
                        <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                        <AmenityIcon className="h-4 w-4 text-gray-600 flex-shrink-0" />
                        <span className="text-gray-700">{amenity.label}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}

          {otherAmenities && (
            <div className="p-4 rounded-lg border border-gray-200 bg-gray-50">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Shield className="h-5 w-5 text-gray-600" />
                Additional Amenities
              </h3>
              <p className="text-sm text-gray-700 whitespace-pre-line">
                {otherAmenities}
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
