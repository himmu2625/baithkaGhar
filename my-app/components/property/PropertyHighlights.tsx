"use client"

import {
  Wifi,
  Car,
  Utensils,
  MapPin,
  Users,
  Home,
  Star,
  Shield,
  Heart,
  Coffee,
  Waves,
  Wind,
  Sparkles,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

interface PropertyHighlight {
  icon: React.ComponentType<{ className?: string }>
  text: string
  featured?: boolean
}

interface PropertyHighlightsProps {
  highlights?: string[]
  amenities?: {
    wifi?: boolean
    parking?: boolean
    restaurant?: boolean
    pool?: boolean
    ac?: boolean
  }
  propertyType?: string
  rating?: number
}

export function PropertyHighlights({
  highlights = [],
  amenities = {},
  propertyType,
  rating
}: PropertyHighlightsProps) {
  // Build highlights array from various sources
  const displayHighlights: PropertyHighlight[] = []

  // Add rating highlight if available
  if (rating && rating >= 4.5) {
    displayHighlights.push({
      icon: Star,
      text: `${rating.toFixed(1)} Star Rating`,
      featured: true
    })
  }

  // Add property type
  if (propertyType) {
    displayHighlights.push({
      icon: Home,
      text: `${propertyType.charAt(0).toUpperCase() + propertyType.slice(1)} Property`,
    })
  }

  // Add amenities as highlights
  if (amenities.wifi) {
    displayHighlights.push({
      icon: Wifi,
      text: "Free WiFi",
    })
  }

  if (amenities.parking) {
    displayHighlights.push({
      icon: Car,
      text: "Free Parking",
    })
  }

  if (amenities.restaurant) {
    displayHighlights.push({
      icon: Utensils,
      text: "On-site Restaurant",
    })
  }

  if (amenities.pool) {
    displayHighlights.push({
      icon: Waves,
      text: "Swimming Pool",
    })
  }

  if (amenities.ac) {
    displayHighlights.push({
      icon: Wind,
      text: "Air Conditioning",
    })
  }

  // Add custom highlights from property
  highlights.slice(0, 6 - displayHighlights.length).forEach(highlight => {
    displayHighlights.push({
      icon: Sparkles,
      text: highlight,
    })
  })

  if (displayHighlights.length === 0) return null

  return (
    <Card className="mb-6 border-emerald-200 shadow-sm">
      <CardContent className="p-6">
        <h2 className="text-2xl font-bold text-darkGreen mb-4 flex items-center gap-2">
          <Heart className="h-6 w-6 text-rose-500" />
          Property Highlights
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayHighlights.map((highlight, index) => {
            const IconComponent = highlight.icon
            return (
              <div
                key={index}
                className={`flex items-center gap-3 p-3 rounded-lg transition-all duration-200 ${
                  highlight.featured
                    ? 'bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200'
                    : 'bg-gray-50 hover:bg-gray-100'
                }`}
              >
                <div className={`flex-shrink-0 p-2 rounded-full ${
                  highlight.featured ? 'bg-amber-200' : 'bg-emerald-100'
                }`}>
                  <IconComponent className={`h-5 w-5 ${
                    highlight.featured ? 'text-amber-700' : 'text-emerald-600'
                  }`} />
                </div>
                <span className={`font-medium text-sm ${
                  highlight.featured ? 'text-amber-900' : 'text-gray-700'
                }`}>
                  {highlight.text}
                </span>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
