"use client"

import {
  MapPin,
  Utensils,
  ShoppingBag,
  Train,
  Plane,
  Building2,
  Camera,
  HeartPulse,
  Fuel,
  Navigation,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface NearbyLocation {
  id?: string
  name: string
  type?: string
  category?: string
  distance: string
  description?: string
}

interface NearbyLocationsProps {
  locations?: NearbyLocation[]
}

const locationIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  restaurant: Utensils,
  shopping: ShoppingBag,
  transport: Train,
  airport: Plane,
  attraction: Camera,
  hospital: HeartPulse,
  fuel: Fuel,
  default: MapPin,
}

const locationCategories = [
  { id: "all", label: "All", icon: MapPin },
  { id: "restaurant", label: "Restaurants", icon: Utensils },
  { id: "shopping", label: "Shopping", icon: ShoppingBag },
  { id: "transport", label: "Transport", icon: Train },
  { id: "attraction", label: "Attractions", icon: Camera },
]

export function NearbyLocations({ locations = [] }: NearbyLocationsProps) {
  if (locations.length === 0) return null

  const categorizedLocations = locationCategories.reduce((acc, category) => {
    if (category.id === "all") {
      acc[category.id] = locations
    } else {
      acc[category.id] = locations.filter(
        (loc) => {
          const locationType = (loc.category || loc.type || '').toLowerCase()
          return locationType === category.id
        }
      )
    }
    return acc
  }, {} as Record<string, NearbyLocation[]>)

  return (
    <Card className="mb-6 border-emerald-200 shadow-sm">
      <CardContent className="p-6">
        <h2 className="text-2xl font-bold text-darkGreen mb-6 flex items-center gap-2">
          <MapPin className="h-6 w-6 text-rose-500" />
          Nearby Locations
        </h2>

        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-5 mb-6 bg-gray-100">
            {locationCategories.map((category) => {
              const Icon = category.icon
              const count = categorizedLocations[category.id]?.length || 0

              if (category.id !== "all" && count === 0) return null

              return (
                <TabsTrigger
                  key={category.id}
                  value={category.id}
                  className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white"
                >
                  <Icon className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">{category.label}</span>
                  {count > 0 && (
                    <Badge variant="secondary" className="ml-2 h-5 w-5 p-0 flex items-center justify-center text-xs">
                      {count}
                    </Badge>
                  )}
                </TabsTrigger>
              )
            })}
          </TabsList>

          {locationCategories.map((category) => {
            const categoryLocations = categorizedLocations[category.id] || []

            if (category.id !== "all" && categoryLocations.length === 0) return null

            return (
              <TabsContent key={category.id} value={category.id} className="space-y-3">
                {categoryLocations.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <MapPin className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                    <p>No locations found in this category</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {categoryLocations.map((location, index) => {
                      const locationType = (location.category || location.type || 'default').toLowerCase()
                      const Icon = locationIcons[locationType] || locationIcons.default

                      return (
                        <div
                          key={location.id || index}
                          className="flex items-start gap-3 p-4 bg-white rounded-lg border border-gray-200 hover:border-emerald-300 hover:shadow-md transition-all duration-200"
                        >
                          <div className="flex-shrink-0 p-2 bg-emerald-100 rounded-full">
                            <Icon className="h-5 w-5 text-emerald-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-gray-900 truncate">
                              {location.name}
                            </h4>
                            {location.description && (
                              <p className="text-xs text-gray-500 mt-0.5 truncate">
                                {location.description}
                              </p>
                            )}
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="secondary" className="text-xs capitalize">
                                {location.category || location.type || 'Location'}
                              </Badge>
                              <div className="flex items-center gap-1 text-sm text-gray-600">
                                <Navigation className="h-3 w-3" />
                                <span>{location.distance}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </TabsContent>
            )
          })}
        </Tabs>

        {/* Optional: Add Map View */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-start gap-3">
            <MapPin className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-blue-900 mb-1">Want to explore the area?</p>
              <p className="text-sm text-blue-700">
                View the exact location and nearby places on the map after booking.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
