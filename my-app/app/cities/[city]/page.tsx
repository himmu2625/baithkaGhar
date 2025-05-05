"use client"

import { useParams } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { MapPin, Star, Users, Wifi, Coffee } from "lucide-react"
import Image from "next/image"
import { Badge } from "@/components/ui/badge"
import { useLoginPrompt } from "@/hooks/use-login-prompt"

export default function CityPage() {
  const params = useParams()
  const { promptLogin } = useLoginPrompt()
  
  const city = params?.city as string || "unknown"
  const cityName = city.charAt(0).toUpperCase() + city.slice(1)

  // Sample properties data
  const properties = [
    {
      id: 1,
      title: "Luxury Hotel in " + cityName,
      price: 12500,
      rating: 4.9,
      reviews: 124,
      image: "/placeholder.svg?height=300&width=500",
      amenities: ["Pool", "WiFi", "Restaurant", "AC"],
      guests: 4,
      bedrooms: 2,
    },
    {
      id: 2,
      title: "Budget Stay in " + cityName,
      price: 5500,
      rating: 4.2,
      reviews: 86,
      image: "/placeholder.svg?height=300&width=500",
      amenities: ["WiFi", "Kitchen", "AC"],
      guests: 2,
      bedrooms: 1,
    },
    {
      id: 3,
      title: "Family Resort in " + cityName,
      price: 18000,
      rating: 4.7,
      reviews: 152,
      image: "/placeholder.svg?height=300&width=500",
      amenities: ["Pool", "WiFi", "Restaurant", "Kids Area", "AC"],
      guests: 6,
      bedrooms: 3,
    },
  ]

  const getAmenityIcon = (amenity: string) => {
    switch (amenity.toLowerCase()) {
      case "wifi":
        return <Wifi className="h-4 w-4" />
      case "kitchen":
        return <Coffee className="h-4 w-4" />
      default:
        return null
    }
  }

  return (
    <main className="pt-24 pb-16">
      <div className="container mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-darkGreen mb-2 flex items-center">
            <MapPin className="mr-2 h-6 w-6 text-mediumGreen" />
            Accommodations in {cityName}
          </h1>
          <p className="text-mediumGreen">
            Discover the best places to stay in {cityName} - from luxury hotels to cozy homestays
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {properties.map((property) => (
            <Card
              key={property.id}
              className="overflow-hidden border-lightGreen/30 hover:border-lightGreen transition-all duration-300"
            >
              <div className="relative h-48 overflow-hidden">
                <Image
                  src={property.image || "/placeholder.svg"}
                  alt={property.title}
                  fill
                  className="object-cover transition-transform duration-500 hover:scale-110"
                />
                <Badge className="absolute top-2 right-2 bg-lightGreen text-darkGreen">
                  ₹{property.price.toLocaleString()}/night
                </Badge>
              </div>
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-darkGreen hover:text-mediumGreen transition-colors">
                    {property.title}
                  </h3>
                  <div className="flex items-center">
                    <Star className="h-4 w-4 text-yellow-500 mr-1" />
                    <span className="text-sm font-medium">{property.rating}</span>
                  </div>
                </div>
                <div className="flex items-center text-sm text-grayText mb-3">
                  <Users className="h-4 w-4 mr-1 text-mediumGreen" />
                  <span>
                    {property.guests} guests • {property.bedrooms} bedrooms
                  </span>
                </div>
                <div className="flex flex-wrap gap-2 mb-4">
                  {property.amenities.slice(0, 3).map((amenity, i) => (
                    <Badge key={i} variant="outline" className="bg-lightGreen/10 text-darkGreen text-xs">
                      <span className="flex items-center">
                        {getAmenityIcon(amenity)}
                        <span className="ml-1">{amenity}</span>
                      </span>
                    </Badge>
                  ))}
                  {property.amenities.length > 3 && (
                    <Badge variant="outline" className="bg-lightGreen/10 text-darkGreen text-xs">
                      +{property.amenities.length - 3} more
                    </Badge>
                  )}
                </div>
                <Button
                  className="w-full bg-mediumGreen hover:bg-darkGreen text-lightYellow transition-all duration-300"
                  onClick={promptLogin}
                >
                  View Details
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </main>
  )
}
