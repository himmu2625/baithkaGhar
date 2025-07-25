"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { motion } from "framer-motion"
import { Wifi, Utensils, Coffee, TrendingUp, Award, Users, Star, MapPin } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useLoginPrompt } from "@/hooks/use-login-prompt"
import { useRouter } from "next/navigation"
import { StarIcon } from "@/components/ui/enhanced-icons"

interface TravelPickProperty {
  _id: string;
  propertyId: {
    _id: string;
    title: string;
    location: string;
    price: {
      base: number;
    };
    rating: number;
    reviewCount: number;
    images: string[];
    categorizedImages: {
      category: string;
      files: {
        url: string;
        public_id: string;
      }[];
    }[];
    legacyGeneralImages: {
      url: string;
      public_id: string;
    }[];
    propertyType: string;
    maxGuests: number;
    bedrooms: number;
    generalAmenities: {
      wifi: boolean;
      tv: boolean;
      kitchen: boolean;
      parking: boolean;
      ac: boolean;
      pool: boolean;
      geyser: boolean;
      shower: boolean;
      bathTub: boolean;
      reception24x7: boolean;
      roomService: boolean;
      restaurant: boolean;
      bar: boolean;
      pub: boolean;
      fridge: boolean;
    };
  };
  rank: number;
  score: number;
  metrics: {
    rating: number;
    reviewCount: number;
    bookingCount: number;
    recentBookings: number;
    revenue: number;
    occupancyRate: number;
  };
}

// Fallback data for when API fails or no travel picks exist
const fallbackTravelPicks = [
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
    rank: 1
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
    rank: 2
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
    rank: 3
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
    rank: 4
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
    rank: 5
  },
]

export default function TravelPicks() {
  const { promptLogin } = useLoginPrompt()
  const router = useRouter()
  const [hoveredId, setHoveredId] = useState<number | null>(null)
  const [travelPicks, setTravelPicks] = useState<TravelPickProperty[]>([])
  const [loading, setLoading] = useState(true)
  const [useFallback, setUseFallback] = useState(false)

  useEffect(() => {
    fetchTravelPicks()
  }, [])

  const fetchTravelPicks = async () => {
    try {
      console.log('TravelPicks: Fetching travel picks...');
      const response = await fetch('/api/travel-picks');
      console.log('TravelPicks: Response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Failed to fetch travel picks`);
      }
      
      const data = await response.json();
      console.log('TravelPicks: Data received:', data);
      
      if (data.success && data.data && data.data.length > 0) {
        setTravelPicks(data.data);
        setUseFallback(false);
        console.log(`TravelPicks: Successfully loaded ${data.data.length} travel picks`);
      } else {
        console.log('TravelPicks: No travel picks found, using fallback data');
        setUseFallback(true);
      }
    } catch (error) {
      console.error('TravelPicks: Error fetching travel picks:', error);
      setUseFallback(true);
    } finally {
      setLoading(false);
    }
  }

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

  const getTopAmenities = (generalAmenities: any) => {
    const amenityList = []
    if (generalAmenities?.wifi) amenityList.push("WiFi")
    if (generalAmenities?.pool) amenityList.push("Pool")
    if (generalAmenities?.kitchen) amenityList.push("Kitchen")
    if (generalAmenities?.ac) amenityList.push("AC")
    if (generalAmenities?.parking) amenityList.push("Parking")
    if (generalAmenities?.restaurant) amenityList.push("Restaurant")
    return amenityList.slice(0, 3)
  }

  const getPrimaryImage = (property: any) => {
    // Check images array first
    if (property.images && property.images.length > 0) {
      return property.images[0]
    }
    
    // Check categorizedImages
    if (property.categorizedImages && property.categorizedImages.length > 0) {
      const firstCategory = property.categorizedImages.find((cat: any) => cat.files && cat.files.length > 0)
      if (firstCategory && firstCategory.files[0]?.url) {
        return firstCategory.files[0].url
      }
    }
    
    // Check legacyGeneralImages
    if (property.legacyGeneralImages && property.legacyGeneralImages.length > 0) {
      if (property.legacyGeneralImages[0]?.url) {
        return property.legacyGeneralImages[0].url
      }
    }
    
    // Fallback to placeholder
    return "/placeholder.svg"
  }

  const handlePropertyClick = (propertyId: string) => {
    router.push(`/property/${propertyId}`)
  }

  if (loading) {
    return (
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-darkGreen mb-4 flex items-center justify-center">
              <TrendingUp className="mr-2 h-6 w-6 text-mediumGreen" />
              Loading Travel Picks...
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
            {[1,2,3,4,5].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-gray-200 h-48 rounded-lg mb-4"></div>
                <div className="bg-gray-200 h-4 rounded mb-2"></div>
                <div className="bg-gray-200 h-4 rounded w-3/4"></div>
              </div>
            ))}
          </div>
        </div>
      </section>
    )
  }

  const displayProperties = useFallback ? fallbackTravelPicks : travelPicks

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
            <TrendingUp className="mr-2 h-6 w-6 text-mediumGreen" />
            Travel Picks
          </h2>
          <p className="text-mediumGreen max-w-2xl mx-auto">
            Our top-rated properties based on guest reviews, bookings, and overall excellence
          </p>
          {useFallback && (
            <p className="text-sm text-orange-600 mt-2">
              Showing sample properties - Initialize travel picks from admin panel
            </p>
          )}
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
          {displayProperties.map((item, index) => {
            // Handle both API data and fallback data structures safely
            const isApiData = !useFallback && ("propertyId" in item);
            const property = isApiData ? (item as TravelPickProperty).propertyId : (item as typeof fallbackTravelPicks[number]);
            const rank = isApiData ? item.rank : item.rank
            
            // Normalize fields so TypeScript is satisfied
            let title: string;
            let location: string;
            let pricePerNight: number;
            let rating: number;
            let reviewCount: number;
            let primaryImage: string;
            let propertyType: string;
            let maxGuests: number;
            let bedrooms: number;
            let amenities: string[];
            let propertyId: string | number;

            if (isApiData) {
              const apiProp = property as TravelPickProperty["propertyId"];
              title = apiProp.title;
              location = apiProp.location;
              pricePerNight = apiProp.price?.base ?? 0;
              rating = apiProp.rating;
              reviewCount = apiProp.reviewCount;
              primaryImage = getPrimaryImage(apiProp);
              propertyType = apiProp.propertyType;
              maxGuests = apiProp.maxGuests;
              bedrooms = apiProp.bedrooms;
              amenities = getTopAmenities(apiProp.generalAmenities);
              propertyId = apiProp._id;
            } else {
              const fb = property as typeof fallbackTravelPicks[number];
              title = fb.title;
              location = fb.location;
              pricePerNight = fb.price;
              rating = fb.rating;
              reviewCount = fb.reviews;
              primaryImage = fb.image;
              propertyType = fb.type;
              maxGuests = fb.guests;
              bedrooms = fb.bedrooms;
              amenities = fb.amenities;
              propertyId = fb.id;
            }

            return (
              <motion.div
                key={String(propertyId) || `property-${index}`}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="group cursor-pointer"
                onMouseEnter={() => setHoveredId(rank)}
                onMouseLeave={() => setHoveredId(null)}
                onClick={() => handlePropertyClick(String(propertyId))}
              >
                <Card className="overflow-hidden border-lightGreen/30 hover:border-lightGreen transition-all duration-300 h-full flex flex-col relative">
                  {/* Ranking Badge */}
                  <div className="absolute top-2 left-2 z-10">
                    <Badge className="bg-mediumGreen text-lightYellow flex items-center">
                      <Award className="h-3 w-3 mr-1" />
                      #{rank}
                    </Badge>
                  </div>
                  
                  <div className="relative h-48 overflow-hidden">
                    <Image
                      src={primaryImage}
                      alt={title}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    <div className="absolute top-2 right-2 flex flex-col gap-2">
                      <Badge className="bg-lightGreen text-darkGreen">
                        {propertyType}
                      </Badge>
                      <Badge className="bg-lightGreen/80 text-darkGreen">
                        ₹{pricePerNight?.toLocaleString()}/night
                      </Badge>
                    </div>
                  </div>
                  
                  <CardContent className="p-4 flex-grow">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-bold text-darkGreen group-hover:text-mediumGreen transition-colors">
                        {title}
                      </h3>
                      <div className="flex items-center">
                        <StarIcon size="sm" className="text-yellow-500 mr-1" filled />
                        <span className="text-sm font-medium">{rating}</span>
                      </div>
                    </div>
                    <p className="text-sm text-grayText mb-2">{location}</p>
                    <div className="flex items-center text-sm text-grayText mb-3">
                      <Users className="h-4 w-4 mr-1 text-mediumGreen" />
                      <span>
                        {maxGuests} guests • {bedrooms} bedrooms
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {amenities.slice(0, 3).map((amenity: string, i: number) => (
                        <Badge key={amenity} variant="outline" className="bg-lightGreen/10 text-darkGreen text-xs">
                          <span className="flex items-center">
                            {getAmenityIcon(amenity)}
                            <span className="ml-1">{amenity}</span>
                          </span>
                        </Badge>
                      ))}
                      {amenities.length > 3 && (
                        <Badge key="more" variant="outline" className="bg-lightGreen/10 text-darkGreen text-xs">
                          +{amenities.length - 3} more
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                  
                  <CardFooter className="p-4 pt-0 mt-auto">
                    <Button
                      className="w-full bg-mediumGreen hover:bg-darkGreen text-lightYellow transition-all duration-300"
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePropertyClick(String(propertyId));
                      }}
                    >
                      View Details
                    </Button>
                  </CardFooter>
                </Card>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
} 