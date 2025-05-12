"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { format, addDays, differenceInDays } from "date-fns"
import {
  MapPin,
  Star,
  Heart,
  Share2,
  Calendar,
  Wifi,
  Coffee,
  Utensils,
  Tv,
  Wind,
  Droplets,
  Car,
  Dumbbell,
  Waves,
  SpadeIcon as Spa,
  ChevronRight,
  ChevronLeft,
  Check,
  Kitchen,
  Refrigerator,
  AlertTriangle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { useLoginPrompt } from "@/hooks/use-login-prompt"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { motion, AnimatePresence } from "framer-motion"
import { ReportButton } from '@/components/ui/report-button';
import { ReportTargetType } from '@/models/reportTypes';
import { ReportProvider } from '@/hooks/use-report';
import { PropertyDetailsWrapper } from './property-details-wrapper';

interface PropertyDetails {
  id: string
  name: string
  description: string
  location: string
  price: number
  rating: number
  reviewCount: number
  images: string[]
  amenities: {
    name: string
    icon: React.ReactNode
  }[]
  rules: string[]
  host: {
    name: string
    image: string
    responseRate: number
    responseTime: string
    joinedDate: string
  }
  reviews: {
    id: string
    user: {
      name: string
      image: string
    }
    rating: number
    date: string
    comment: string
  }[]
  ratingBreakdown: {
    cleanliness: number
    accuracy: number
    communication: number
    location: number
    checkIn: number
    value: number
  }
}

export default function PropertyDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const { promptLogin, isLoggedIn } = useLoginPrompt()
  const [property, setProperty] = useState<PropertyDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [isFavorite, setIsFavorite] = useState(false)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [checkIn, setCheckIn] = useState<Date | undefined>(addDays(new Date(), 1))
  const [checkOut, setCheckOut] = useState<Date | undefined>(addDays(new Date(), 4))
  const [guests, setGuests] = useState(2)
  const [isBooking, setIsBooking] = useState(false)
  const [showAllAmenities, setShowAllAmenities] = useState(false)
  const [showAllReviews, setShowAllReviews] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const propertyId = params?.id as string || "unknown"

  useEffect(() => {
    const fetchPropertyDetails = async () => {
      setLoading(true)
      setErrorMessage(null)
      try {
        // Make a real API call to fetch the property details
        const response = await fetch(`/api/properties/${propertyId}`)
        
        if (response.status === 404) {
          setErrorMessage("Property not found. It may have been removed or is no longer available.")
          setLoading(false)
          return
        }
        
        if (!response.ok) {
          throw new Error(`Failed to fetch property: ${response.statusText}`)
        }
        
        const propertyData = await response.json()
        
        // Map API response to PropertyDetails interface
        const transformedProperty: PropertyDetails = {
          id: propertyData._id || propertyId,
          name: propertyData.title || propertyData.name || "Unnamed Property",
          description: propertyData.description || "",
          location: propertyData.address?.city || propertyData.city || "Unknown Location",
          price: propertyData.price?.base || parseFloat(propertyData.pricing?.perNight) || 0,
          rating: propertyData.rating || 4.5,
          reviewCount: propertyData.reviewCount || 0,
          images: [],
          amenities: [],
          rules: propertyData.rules || [],
          host: {
            name: propertyData.host?.name || "Unknown Host",
            image: propertyData.host?.image || "/placeholder.svg",
            responseRate: propertyData.host?.responseRate || 95,
            responseTime: propertyData.host?.responseTime || "within a day",
            joinedDate: propertyData.host?.joinedDate || "recently"
          },
          reviews: propertyData.reviews || [],
          ratingBreakdown: propertyData.ratingBreakdown || {
            cleanliness: 4.5,
            accuracy: 4.5,
            communication: 4.5,
            location: 4.5,
            checkIn: 4.5,
            value: 4.5
          }
        }
        
        // Process images from different possible formats
        if (propertyData.categorizedImages && propertyData.categorizedImages.length > 0) {
          propertyData.categorizedImages.forEach((category: any) => {
            if (category.files && category.files.length > 0) {
              category.files.forEach((file: any) => {
                if (file.url) transformedProperty.images.push(file.url)
              })
            }
          })
        }
        
        if (transformedProperty.images.length === 0 && propertyData.images) {
          // Handle different image formats
          if (Array.isArray(propertyData.images)) {
            propertyData.images.forEach((img: any) => {
              if (typeof img === 'string') transformedProperty.images.push(img)
              else if (img.url) transformedProperty.images.push(img.url)
            })
          }
        }
        
        // Ensure we have at least one image
        if (transformedProperty.images.length === 0) {
          transformedProperty.images = ["/placeholder.svg"]
        }
        
        // Map amenities
        const amenityIcons: Record<string, any> = {
          wifi: <Wifi className="h-4 w-4" />,
          tv: <Tv className="h-4 w-4" />,
          parking: <Car className="h-4 w-4" />,
          kitchen: <Kitchen className="h-4 w-4" />,
          pool: <Waves className="h-4 w-4" />,
          breakfast: <Coffee className="h-4 w-4" />,
          restaurant: <Utensils className="h-4 w-4" />,
          airConditioning: <Wind className="h-4 w-4" />,
          refrigerator: <Refrigerator className="h-4 w-4" />,
          geyser: <Droplets className="h-4 w-4" />,
          // Add more mappings as needed
        }
        
        // Process amenities from array or object
        if (Array.isArray(propertyData.amenities)) {
          propertyData.amenities.forEach((amenity: string) => {
            transformedProperty.amenities.push({
              name: amenity,
              icon: amenityIcons[amenity.toLowerCase().replace(/\s+/g, '')] || <Check className="h-4 w-4" />
            })
          })
        } else if (typeof propertyData.amenities === 'object' && propertyData.amenities !== null) {
          Object.entries(propertyData.amenities).forEach(([key, value]) => {
            if (value === true) {
              transformedProperty.amenities.push({
                name: key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1').trim(),
                icon: amenityIcons[key] || <Check className="h-4 w-4" />
              })
            }
          })
        }
        
        setProperty(transformedProperty)

        // Check if property is in favorites
        if (typeof window !== "undefined") {
          const savedFavorites = localStorage.getItem("favorites")
          if (savedFavorites) {
            const favorites = JSON.parse(savedFavorites)
            setIsFavorite(favorites.includes(propertyId))
          }
        }
      } catch (error) {
        console.error("Error fetching property details:", error)
        setErrorMessage("Failed to load property details. Please try again.")
        toast({
          title: "Error",
          description: "Failed to load property details. Please try again.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    if (propertyId !== "unknown") {
      fetchPropertyDetails()
    }
  }, [propertyId, toast])

  const toggleFavorite = () => {
    if (!promptLogin()) {
      return
    }

    let favorites: string[] = []
    if (typeof window !== "undefined") {
      const savedFavorites = localStorage.getItem("favorites")
      if (savedFavorites) {
        favorites = JSON.parse(savedFavorites)
      }
    }

    if (isFavorite) {
      favorites = favorites.filter((id) => id !== propertyId)
      toast({
        title: "Removed from favorites",
        description: "Property has been removed from your favorites",
      })
    } else {
      favorites.push(propertyId)
      toast({
        title: "Added to favorites",
        description: "Property has been added to your favorites",
      })
    }

    localStorage.setItem("favorites", JSON.stringify(favorites))
    setIsFavorite(!isFavorite)
  }

  const shareProperty = () => {
    if (navigator.share) {
      navigator
        .share({
          title: property?.name,
          text: `Check out this amazing property: ${property?.name}`,
          url: window.location.href,
        })
        .catch((error) => console.log("Error sharing", error))
    } else {
      // Fallback for browsers that don't support the Web Share API
      navigator.clipboard.writeText(window.location.href)
      toast({
        title: "Link copied",
        description: "Property link has been copied to clipboard",
      })
    }
  }

  const nextImage = () => {
    if (property) {
      setCurrentImageIndex((prev) => (prev === property.images.length - 1 ? 0 : prev + 1))
    }
  }

  const prevImage = () => {
    if (property) {
      setCurrentImageIndex((prev) => (prev === 0 ? property.images.length - 1 : prev - 1))
    }
  }

  const calculateTotalPrice = () => {
    if (!property || !checkIn || !checkOut) return 0
    const nights = differenceInDays(checkOut, checkIn)
    return property.price * nights
  }

  const handleBooking = async () => {
    if (!promptLogin()) {
      return
    }

    if (!checkIn || !checkOut) {
      toast({
        title: "Select dates",
        description: "Please select check-in and check-out dates",
        variant: "destructive",
      })
      return
    }

    setIsBooking(true)

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500))

      // Navigate to booking confirmation page
      router.push(
        `/booking/confirmation?propertyId=${propertyId}&checkIn=${checkIn.toISOString()}&checkOut=${checkOut.toISOString()}&guests=${guests}&total=${calculateTotalPrice()}`,
      )
    } catch (error) {
      console.error("Booking error:", error)
      toast({
        title: "Booking failed",
        description: "There was an error processing your booking. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsBooking(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto py-24 px-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Skeleton className="h-[400px] w-full rounded-lg mb-4" />
            <div className="grid grid-cols-4 gap-2">
              {[1, 2, 3, 4].map((_, index) => (
                <Skeleton key={index} className="h-20 w-full rounded-md" />
              ))}
            </div>
            <Skeleton className="h-10 w-3/4 mt-6 mb-2" />
            <Skeleton className="h-6 w-1/2 mb-4" />
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-3/4 mb-6" />
          </div>
          <div className="lg:col-span-1">
            <Skeleton className="h-[300px] w-full rounded-lg" />
          </div>
        </div>
      </div>
    )
  }

  if (errorMessage) {
    return (
      <PropertyDetailsWrapper>
        <div className="container mx-auto px-4 py-12">
          <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-red-700 mb-4">Property Not Found</h2>
            <p className="text-gray-600 mb-6">{errorMessage}</p>
            <div className="flex gap-4 justify-center">
              <Button 
                onClick={() => router.back()}
                className="bg-mediumGreen hover:bg-darkGreen text-lightYellow"
              >
                Go Back
              </Button>
              <Link href="/">
                <Button 
                  variant="outline"
                  className="border-mediumGreen text-mediumGreen"
                >
                  Return to Home
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </PropertyDetailsWrapper>
    )
  }

  if (!property) {
    return (
      <div className="container mx-auto py-24 px-4 text-center">
        <h1 className="text-2xl font-bold mb-4">Property Not Found</h1>
        <p className="mb-6">The property you're looking for doesn't exist or has been removed.</p>
        <Button onClick={() => router.push("/search")}>Back to Search</Button>
      </div>
    )
  }

  return (
    <PropertyDetailsWrapper>
      <div className="container mx-auto px-4 py-12">
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold mb-2">{property.name}</h1>
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <div className="flex items-center">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 mr-1" />
              <span className="font-medium">{property.rating}</span>
              <span className="text-muted-foreground ml-1">({property.reviewCount} reviews)</span>
            </div>
            <span className="text-muted-foreground">•</span>
            <div className="flex items-center">
              <MapPin className="h-4 w-4 mr-1 text-muted-foreground" />
              <span>{property.location}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            {/* Property Images */}
            <div className="relative rounded-lg overflow-hidden mb-6">
              <div className="relative h-[400px] w-full">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentImageIndex}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.5 }}
                    className="absolute inset-0"
                  >
                    <Image
                      src={property.images[currentImageIndex] || "/placeholder.svg"}
                      alt={`${property.name} - Image ${currentImageIndex + 1}`}
                      fill
                      className="object-cover"
                    />
                  </motion.div>
                </AnimatePresence>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white rounded-full"
                onClick={prevImage}
              >
                <ChevronLeft className="h-6 w-6 text-darkGreen" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white rounded-full"
                onClick={nextImage}
              >
                <ChevronRight className="h-6 w-6 text-darkGreen" />
              </Button>
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-1">
                {property.images.map((_, index) => (
                  <button
                    key={index}
                    className={`w-2 h-2 rounded-full transition-all ${
                      currentImageIndex === index ? "bg-white w-4" : "bg-white/50"
                    }`}
                    onClick={() => setCurrentImageIndex(index)}
                  />
                ))}
              </div>
              <div className="absolute top-4 right-4 flex space-x-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="bg-white/80 hover:bg-white rounded-full"
                  onClick={toggleFavorite}
                >
                  <Heart className={`h-5 w-5 ${isFavorite ? "fill-red-500 text-red-500" : "text-gray-600"}`} />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="bg-white/80 hover:bg-white rounded-full"
                  onClick={shareProperty}
                >
                  <Share2 className="h-5 w-5 text-gray-600" />
                </Button>
              </div>
            </div>

            {/* Property Thumbnails */}
            <div className="grid grid-cols-5 gap-2 mb-8">
              {property.images.map((image, index) => (
                <button
                  key={index}
                  className={`relative h-20 rounded-md overflow-hidden ${
                    currentImageIndex === index ? "ring-2 ring-mediumGreen" : ""
                  }`}
                  onClick={() => setCurrentImageIndex(index)}
                >
                  <Image src={image || "/placeholder.svg"} alt={`Thumbnail ${index + 1}`} fill className="object-cover" />
                </button>
              ))}
            </div>

            {/* Property Description */}
            <div className="mb-8">
              <h2 className="text-xl font-bold mb-4">About this place</h2>
              <p className="text-muted-foreground whitespace-pre-line">{property.description}</p>
            </div>

            {/* Amenities */}
            <div className="mb-8">
              <h2 className="text-xl font-bold mb-4">Amenities</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {property.amenities.slice(0, showAllAmenities ? property.amenities.length : 6).map((amenity, index) => (
                  <div key={index} className="flex items-center gap-2">
                    {amenity.icon}
                    <span>{amenity.name}</span>
                  </div>
                ))}
              </div>
              {property.amenities.length > 6 && (
                <Button variant="outline" className="mt-4" onClick={() => setShowAllAmenities(!showAllAmenities)}>
                  {showAllAmenities ? "Show less" : "Show all amenities"}
                </Button>
              )}
            </div>

            {/* House Rules */}
            <div className="mb-8">
              <h2 className="text-xl font-bold mb-4">House Rules</h2>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {property.rules.map((rule, index) => (
                  <li key={index} className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-mediumGreen"></div>
                    <span>{rule}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Host Information */}
            <div className="mb-8">
              <h2 className="text-xl font-bold mb-4">Hosted by {property.host.name}</h2>
              <div className="flex items-center gap-4 mb-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={property.host.image || "/placeholder.svg"} alt={property.host.name} />
                  <AvatarFallback>{property.host.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm text-muted-foreground">Joined in {property.host.joinedDate}</p>
                  <p className="text-sm">Response rate: {property.host.responseRate}%</p>
                  <p className="text-sm">Response time: {property.host.responseTime}</p>
                </div>
              </div>
            </div>

            {/* Reviews */}
            <div>
              <h2 className="text-xl font-bold mb-4">
                {property.reviewCount} reviews
                <span className="ml-2 inline-flex items-center">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 mr-1" />
                  <span className="font-medium">{property.rating}</span>
                </span>
              </h2>

              {/* Rating Breakdown */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="flex items-center gap-2">
                  <span className="text-sm w-24">Cleanliness</span>
                  <Progress value={property.ratingBreakdown.cleanliness * 20} className="h-2" />
                  <span className="text-sm">{property.ratingBreakdown.cleanliness}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm w-24">Accuracy</span>
                  <Progress value={property.ratingBreakdown.accuracy * 20} className="h-2" />
                  <span className="text-sm">{property.ratingBreakdown.accuracy}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm w-24">Communication</span>
                  <Progress value={property.ratingBreakdown.communication * 20} className="h-2" />
                  <span className="text-sm">{property.ratingBreakdown.communication}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm w-24">Location</span>
                  <Progress value={property.ratingBreakdown.location * 20} className="h-2" />
                  <span className="text-sm">{property.ratingBreakdown.location}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm w-24">Check-in</span>
                  <Progress value={property.ratingBreakdown.checkIn * 20} className="h-2" />
                  <span className="text-sm">{property.ratingBreakdown.checkIn}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm w-24">Value</span>
                  <Progress value={property.ratingBreakdown.value * 20} className="h-2" />
                  <span className="text-sm">{property.ratingBreakdown.value}</span>
                </div>
              </div>

              {/* Review List */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {property.reviews.slice(0, showAllReviews ? property.reviews.length : 4).map((review) => (
                  <div key={review.id} className="mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={review.user.image || "/placeholder.svg"} alt={review.user.name} />
                        <AvatarFallback>{review.user.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{review.user.name}</p>
                        <p className="text-xs text-muted-foreground">{review.date}</p>
                      </div>
                      <div className="ml-auto flex items-center">
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400 mr-1" />
                        <span className="text-sm">{review.rating}</span>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">{review.comment}</p>
                  </div>
                ))}
              </div>

              {property.reviews.length > 4 && (
                <Button variant="outline" className="mt-4" onClick={() => setShowAllReviews(!showAllReviews)}>
                  {showAllReviews ? "Show less reviews" : "Show all reviews"}
                </Button>
              )}
            </div>
          </div>

          {/* Booking Card */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle className="flex justify-between items-center">
                  <span>₹{property.price.toLocaleString()}</span>
                  <span className="text-sm font-normal text-muted-foreground">per night</span>
                </CardTitle>
                <div className="flex items-center">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 mr-1" />
                  <span className="font-medium">{property.rating}</span>
                  <span className="text-muted-foreground text-sm ml-1">({property.reviewCount} reviews)</span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-sm font-medium mb-1">Check-in</label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="w-full justify-start">
                            <Calendar className="mr-2 h-4 w-4" />
                            {checkIn ? format(checkIn, "PP") : "Select date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <CalendarComponent
                            mode="single"
                            selected={checkIn}
                            onSelect={setCheckIn}
                            disabled={(date) => date < new Date()}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Check-out</label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="w-full justify-start">
                            <Calendar className="mr-2 h-4 w-4" />
                            {checkOut ? format(checkOut, "PP") : "Select date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <CalendarComponent
                            mode="single"
                            selected={checkOut}
                            onSelect={setCheckOut}
                            disabled={(date) => (checkIn ? date <= checkIn : date <= new Date())}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Guests</label>
                    <Select value={guests.toString()} onValueChange={(val) => setGuests(Number.parseInt(val))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select guests" />
                      </SelectTrigger>
                      <SelectContent>
                        {[1, 2, 3, 4, 5, 6, 7, 8].map((num) => (
                          <SelectItem key={num} value={num.toString()}>
                            {num} {num === 1 ? "Guest" : "Guests"}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {checkIn && checkOut && (
                    <div className="space-y-2 mt-2">
                      <div className="flex justify-between">
                        <span>
                          ₹{property.price.toLocaleString()} x {differenceInDays(checkOut, checkIn)} nights
                        </span>
                        <span>₹{(property.price * differenceInDays(checkOut, checkIn)).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Cleaning fee</span>
                        <span>₹2,500</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Service fee</span>
                        <span>
                          ₹{Math.round(property.price * differenceInDays(checkOut, checkIn) * 0.1).toLocaleString()}
                        </span>
                      </div>
                      <Separator className="my-2" />
                      <div className="flex justify-between font-bold">
                        <span>Total</span>
                        <span>
                          ₹
                          {(
                            property.price * differenceInDays(checkOut, checkIn) +
                            2500 +
                            Math.round(property.price * differenceInDays(checkOut, checkIn) * 0.1)
                          ).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  className="w-full bg-mediumGreen hover:bg-mediumGreen/80 text-lightYellow"
                  onClick={handleBooking}
                  disabled={isBooking || !checkIn || !checkOut}
                >
                  {isBooking ? (
                    <div className="flex items-center">
                      <div className="animate-spin mr-2 h-4 w-4 border-2 border-lightYellow border-t-transparent rounded-full" />
                      Processing...
                    </div>
                  ) : (
                    "Book Now"
                  )}
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>

        <div className="flex items-center gap-2 mt-4">
          <ReportButton 
            targetType={ReportTargetType.PROPERTY}
            targetId={property.id}
            targetName={property.name}
            variant="outline"
            size="sm"
          />
        </div>
      </div>
    </PropertyDetailsWrapper>
  )
}
