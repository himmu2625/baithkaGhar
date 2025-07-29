"use client"

import { useState } from "react"
import Image from "next/image"
import { motion } from "framer-motion"
import { Home, Star, Users, Wifi, Coffee, Utensils } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useLoginPrompt } from "@/hooks/use-login-prompt"
import { getPlaceholderImage } from "@/lib/placeholder"

const guestHomes = [
  {
    id: 1,
    title: "Surya Samudra Beachside Villa",
    location: "Goa",
    price: 12500,
    rating: 4.9,
    reviews: 124,
    image: "https://images.pexels.com/photos/338504/pexels-photo-338504.jpeg?auto=compress&cs=tinysrgb&w=1600",
    amenities: ["Pool", "WiFi", "Kitchen", "AC"],
    guests: 8,
    bedrooms: 4,
    type: "Villa",
  },
  {
    id: 2,
    title: "Himalayan Cedar Lodge",
    location: "Shimla",
    price: 8500,
    rating: 4.7,
    reviews: 98,
    image: "https://images.pexels.com/photos/2876787/pexels-photo-2876787.jpeg?auto=compress&cs=tinysrgb&w=1600",
    amenities: ["Fireplace", "WiFi", "Kitchen", "Heating"],
    guests: 4,
    bedrooms: 2,
    type: "House",
  },
  {
    id: 3,
    title: "Marine Heights Condominium",
    location: "Mumbai",
    price: 9800,
    rating: 4.8,
    reviews: 156,
    image: "https://images.pexels.com/photos/2121121/pexels-photo-2121121.jpeg?auto=compress&cs=tinysrgb&w=1600",
    amenities: ["Beach Access", "WiFi", "Kitchen", "AC"],
    guests: 6,
    bedrooms: 3,
    type: "Apartment",
  },
  {
    id: 4,
    title: "Maharaja Heritage Mahal",
    location: "Jaipur",
    price: 15000,
    rating: 4.9,
    reviews: 87,
    image: "https://images.pexels.com/photos/3225531/pexels-photo-3225531.jpeg?auto=compress&cs=tinysrgb&w=1600",
    amenities: ["Pool", "WiFi", "Restaurant", "AC"],
    guests: 10,
    bedrooms: 5,
    type: "Resort",
  },
  {
    id: 5,
    title: "Ganga View Ashram Stay",
    location: "Rishikesh",
    price: 7500,
    rating: 4.6,
    reviews: 64,
    image: "https://images.pexels.com/photos/2549018/pexels-photo-2549018.jpeg?auto=compress&cs=tinysrgb&w=1600",
    amenities: ["River View", "WiFi", "Kitchen", "Outdoor Space"],
    guests: 4,
    bedrooms: 2,
    type: "Hotel",
  },
]

export default function GuestHomes() {
  const { promptLogin } = useLoginPrompt()
  const [hoveredId, setHoveredId] = useState<number | null>(null)

  const getAmenityIcon = (amenity: string) => {
    switch (amenity.toLowerCase()) {
      case "wifi":
        return <Wifi className="h-4 w-4" />
      case "kitchen":
        return <Utensils className="h-4 w-4" />
      case "coffee":
      case "breakfast":
        return <Coffee className="h-4 w-4" />
      default:
        return null
    }
  }

  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl font-bold text-darkGreen mb-4 flex items-center justify-center">
            <Home className="mr-2 h-6 w-6 text-mediumGreen" />
            Featured Guest Homes
          </h2>
          <p className="text-mediumGreen max-w-2xl mx-auto">
            Handpicked homes with all the essentials for a comfortable stay
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
          {guestHomes.map((home, index) => (
            <motion.div
              key={home.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="group"
              onMouseEnter={() => setHoveredId(home.id)}
              onMouseLeave={() => setHoveredId(null)}
            >
              <Card className="overflow-hidden border-lightGreen/30 hover:border-lightGreen transition-all duration-300 h-full flex flex-col">
                <div className="relative h-48 overflow-hidden">
                  <Image
                    src={home.image || "/placeholder.svg"}
                    alt={home.title}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                    sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  />
                  <div className="absolute top-2 right-2 flex flex-col gap-2">
                    <Badge className="bg-lightGreen text-darkGreen">
                      {home.type}
                    </Badge>
                    <Badge className="bg-lightGreen/80 text-darkGreen">
                    ₹{home.price.toLocaleString()}/night
                  </Badge>
                  </div>
                </div>
                <CardContent className="p-4 flex-grow">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-darkGreen group-hover:text-mediumGreen transition-colors">
                      {home.title}
                    </h3>
                    <div className="flex items-center">
                      <Star className="h-4 w-4 text-yellow-500 mr-1" />
                      <span className="text-sm font-medium">{home.rating}</span>
                    </div>
                  </div>
                  <p className="text-sm text-grayText mb-2">{home.location}</p>
                  <div className="flex items-center text-sm text-grayText mb-3">
                    <Users className="h-4 w-4 mr-1 text-mediumGreen" />
                    <span>
                      {home.guests} guests • {home.bedrooms} bedrooms
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {home.amenities.slice(0, 3).map((amenity, i) => (
                      <Badge key={i} variant="outline" className="bg-lightGreen/10 text-darkGreen text-xs">
                        <span className="flex items-center">
                          {getAmenityIcon(amenity)}
                          <span className="ml-1">{amenity}</span>
                        </span>
                      </Badge>
                    ))}
                    {home.amenities.length > 3 && (
                      <Badge variant="outline" className="bg-lightGreen/10 text-darkGreen text-xs">
                        +{home.amenities.length - 3} more
                      </Badge>
                    )}
                  </div>
                </CardContent>
                <CardFooter className="p-4 pt-0 mt-auto">
                  <Button
                    className="w-full bg-mediumGreen hover:bg-darkGreen text-lightYellow transition-all duration-300"
                    onClick={promptLogin}
                  >
                    View Details
                  </Button>
                </CardFooter>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
