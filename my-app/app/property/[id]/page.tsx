"use client"

import type React from "react"

import { useState, useEffect, useCallback, useMemo } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { format, addDays, differenceInDays, eachDayOfInterval } from "date-fns"
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
  AlertTriangle,
  UtensilsCrossed as Kitchen,
  Info,
  RefrigeratorIcon as Refrigerator,
  BedDouble,
  Plus,
  Minus,
  TrendingUp,
  Home,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { PricingCalendar } from "@/components/ui/pricing-calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { useSession } from "next-auth/react"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { motion, AnimatePresence } from "framer-motion"
import { ReportButton } from "@/components/ui/report-button"
import { ReportTargetType } from "@/models/reportTypes"
import { EventPricingBadge } from "@/components/property/EventPricingBadge"
import DynamicPriceBreakdown from "@/components/property/DynamicPriceBreakdown"
import EventPricingBadges from "@/components/property/EventPricingBadges"
import PriceTrendGraph from "@/components/property/PriceTrendGraph"
import PricingSection from "@/components/property/PricingSection"
import { PlanPricingMatrix } from "@/components/property/PlanPricingMatrix"

import { ReportProvider } from "@/hooks/use-report"
import { PropertyDetailsWrapper } from "./property-details-wrapper"
import { Badge } from "@/components/ui/badge"
import { PropertyDetails, RoomCategory } from "./types"
import {
  getCategoryPrice,
  calculateTotalPriceForCategory,
  getCategoryById,
} from "./price-functions"
import { BackButton } from "@/components/ui/back-button"
import { ReviewsSection } from "@/components/features/property/ReviewsSection"
import { ReviewForm } from "@/components/features/property/ReviewForm"
import { DynamicPricePreview } from "@/components/property/DynamicPricePreview"
import DynamicPriceIndicator from "@/components/search/DynamicPriceIndicator"
import { TooltipProvider } from "@/components/ui/tooltip"

// Format property type with capitalization
const formatPropertyType = (type: string) => {
  if (!type) return "Property"
  // Capitalize the first letter
  return type.charAt(0).toUpperCase() + type.slice(1).toLowerCase()
}

// Helper to check if a value is a Date object
function isDateObject(val: any): val is Date {
  return (
    Object.prototype.toString.call(val) === "[object Date]" &&
    !isNaN(val.getTime())
  )
}

export default function PropertyDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const { data: session, status } = useSession()
  const [property, setProperty] = useState<PropertyDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [isFavorite, setIsFavorite] = useState(false)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  // Debug logging to track navigation events
  useEffect(() => {
    console.log("Current property page URL:", window.location.href)

    // Listen for navigation events
    const handleBeforeUnload = () => {
      console.log("Navigation away from property page")
    }

    window.addEventListener("beforeunload", handleBeforeUnload)
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload)
    }
  }, [])

  // Get URL parameters if they exist, otherwise use defaults
  const urlCheckIn = searchParams?.get("checkIn")
    ? new Date(searchParams.get("checkIn") as string)
    : undefined
  const urlCheckOut = searchParams?.get("checkOut")
    ? new Date(searchParams.get("checkOut") as string)
    : undefined
  const urlGuests = searchParams?.get("guests")
    ? parseInt(searchParams.get("guests") as string)
    : undefined
  const urlRooms = searchParams?.get("rooms")
    ? parseInt(searchParams.get("rooms") as string)
    : undefined
  const urlCategory = searchParams?.get("category") || null

  // Initialize state with URL parameters or default values
  const [checkIn, setCheckIn] = useState<Date | undefined>(
    urlCheckIn || addDays(new Date(), 1)
  )
  const [checkOut, setCheckOut] = useState<Date | undefined>(
    urlCheckOut || addDays(new Date(), 4)
  )
  const [guests, setGuests] = useState(urlGuests || 1)
  const [rooms, setRooms] = useState(urlRooms || 1)
  const [isBooking, setIsBooking] = useState(false)
  const [showAllAmenities, setShowAllAmenities] = useState(false)
  const [showAllReviews, setShowAllReviews] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [canReview, setCanReview] = useState(false)
  const [isReviewFormOpen, setIsReviewFormOpen] = useState(false)
  const [forceRefetch, setForceRefetch] = useState(0)

  const [showPricingBreakdown, setShowPricingBreakdown] = useState(false)
  const [pricingDataFromSection, setPricingDataFromSection] =
    useState<any>(null)

  // Pricing data states
  const [pricingData, setPricingData] = useState({
    customPrices: [] as Array<{
      startDate: string
      endDate: string
      price: number
      reason: string
      isActive: boolean
    }>,
    seasonalRules: [] as Array<{
      id: string
      name: string
      startDate: string
      endDate: string
      multiplier: number
      isActive: boolean
    }>,
    blockedDates: [] as Array<{
      startDate: string
      endDate: string
      reason: string
      isActive: boolean
      categoryId?: string
    }>,
  })

  const propertyId = (params?.id as string) || "unknown"

  // Memoized selected category to prevent unnecessary re-renders
  const selectedCategoryData = useMemo(() => {
    if (!property?.categories || !selectedCategory) return null
    return (
      property.categories.find((cat) => cat.id === selectedCategory) || null
    )
  }, [property?.categories, selectedCategory])

  // Helper function to calculate price for a specific date (similar to PricingCalendar)
  const calculatePriceForDate = useCallback(
    (
      date: Date,
      basePrice: number,
      customPrices: any[] = [],
      seasonalRules: any[] = []
    ): { price: number; isCustom: boolean; reason?: string } => {
      const dateKey = format(date, "yyyy-MM-dd")

      // Check for custom pricing first (direct pricing takes priority)
      const customPrice = customPrices.find(
        (cp) => cp.isActive && cp.startDate <= dateKey && cp.endDate >= dateKey
      )

      if (customPrice) {
        return {
          price: customPrice.price,
          isCustom: true,
          reason: customPrice.reason,
        }
      }

      // Apply seasonal rules if no custom price
      let finalPrice = basePrice
      let appliedRules: string[] = []
      seasonalRules.forEach((rule) => {
        if (
          rule.isActive &&
          new Date(rule.startDate) <= date &&
          date <= new Date(rule.endDate)
        ) {
          finalPrice *= rule.multiplier
          appliedRules.push(`${rule.name} (${rule.multiplier}x)`)
        }
      })

      return {
        price: Math.round(finalPrice),
        isCustom: false,
        reason: appliedRules.length > 0 ? appliedRules.join(", ") : undefined,
      }
    },
    []
  )

  // Memoized pricing calculations with daily pricing
  const pricingCalculations = useMemo(() => {
    if (!property || !checkIn || !checkOut || !selectedCategoryData) {
      return {
        basePrice: 0,
        nights: 0,
        baseTotal: 0,
        extraGuestCharge: 0,
        totalPrice: 0,
        extraGuestsCount: 0,
        dailyBreakdown: [],
        actualDailyTotal: 0,
      }
    }

    const nights = differenceInDays(checkOut, checkIn)
    if (nights <= 0) {
      return {
        basePrice: 0,
        nights: 0,
        baseTotal: 0,
        extraGuestCharge: 0,
        totalPrice: 0,
        extraGuestsCount: 0,
        dailyBreakdown: [],
        actualDailyTotal: 0,
      }
    }

    const basePrice = selectedCategoryData.price

    // Calculate actual daily prices using custom prices and seasonal rules
    const stayDates = eachDayOfInterval({ start: checkIn, end: checkOut })
    const dailyBreakdown: Array<{
      date: Date
      dateStr: string
      price: number
      isCustom: boolean
      reason?: string
      roomTotal: number
    }> = []

    let actualDailyTotal = 0

    // Calculate price for each day (excluding the checkout date)
    stayDates.slice(0, -1).forEach((date) => {
      const dailyPricing = calculatePriceForDate(
        date,
        basePrice,
        pricingData.customPrices || [],
        pricingData.seasonalRules || []
      )

      const roomTotal = dailyPricing.price * rooms
      actualDailyTotal += roomTotal

      dailyBreakdown.push({
        date,
        dateStr: format(date, "MMM dd, yyyy"),
        price: dailyPricing.price,
        isCustom: dailyPricing.isCustom,
        reason: dailyPricing.reason,
        roomTotal,
      })
    })

    // Calculate extra guest charge (1000 rupees per extra guest beyond 2 per room)
    const baseGuestCapacity = rooms * 2 // 2 guests per room baseline
    const extraGuestsCount = Math.max(0, guests - baseGuestCapacity)
    const extraGuestCharge = extraGuestsCount * 1000 * nights

    const totalPrice = actualDailyTotal + extraGuestCharge

    return {
      basePrice,
      nights,
      baseTotal: basePrice * nights * rooms, // Keep for comparison
      extraGuestCharge,
      totalPrice,
      extraGuestsCount,
      dailyBreakdown,
      actualDailyTotal,
    }
  }, [
    property,
    checkIn,
    checkOut,
    selectedCategoryData,
    rooms,
    guests,
    pricingData,
    calculatePriceForDate,
  ])

  useEffect(() => {
    const fetchPropertyDetails = async () => {
      // Don't check if we're already loading - this was causing the fetch to never start
      // if (loading) return;

      setLoading(true)
      setErrorMessage(null)
      try {
        console.log(`Fetching property details for ID: ${propertyId}`)

        // Make a real API call to fetch the property details
        const response = await fetch(`/api/properties/${propertyId}`, {
          method: "GET",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
        })

        console.log(
          `Response status for property ${propertyId}: ${response.status}`
        )

        if (response.status === 404) {
          console.log(`Property not found: ${propertyId}`)
          setErrorMessage(
            "Property not found. It may have been removed or is no longer available."
          )
          setLoading(false)
          return
        }

        if (!response.ok) {
          // Get response text for better debugging
          const errorText = await response.text()
          console.error(`Error response (${response.status}): ${errorText}`)
          throw new Error(
            `Failed to fetch property: ${response.statusText || "Server Error"}`
          )
        }

        // Get response as text first to ensure proper parsing
        const responseText = await response.text()
        console.log(
          `Response received for property ${propertyId} (length: ${responseText.length})`
        )

        let propertyData
        try {
          // Try to parse the JSON response
          propertyData = JSON.parse(responseText)

          // Check if property is in the expected format
          if (propertyData.success && propertyData.property) {
            propertyData = propertyData.property
            console.log(
              `Property data successfully extracted: ${propertyData._id}`
            )
          } else if (!propertyData._id) {
            console.warn("Unexpected property data format:", propertyData)
          }
        } catch (parseError) {
          console.error("JSON parse error:", parseError)
          console.error(
            "Response text:",
            responseText.substring(0, 200) + "..."
          )
          throw new Error("Invalid response format from server")
        }

        // Safety check for required data - log issues but don't throw errors
        if (!propertyData) {
          console.warn("Property data is missing")
          setErrorMessage(
            "Property information is unavailable. Please try again later."
          )
          setLoading(false)
          return
        }

        // Map API response to PropertyDetails interface with fallbacks for missing data
        const transformedProperty: PropertyDetails = {
          id: propertyData._id || propertyId,
          name: propertyData.title || propertyData.name || "Unnamed Property",
          description: propertyData.description || "",
          location:
            propertyData.address?.city ||
            propertyData.location?.city ||
            propertyData.city ||
            "Unknown Location",
          price:
            propertyData.price?.base ||
            parseFloat(propertyData.pricing?.perNight) ||
            0,
          rating: propertyData.rating || 4.5,
          reviewCount: propertyData.reviewCount || 0,
          type: propertyData.propertyType
            ? propertyData.propertyType.charAt(0).toUpperCase() +
              propertyData.propertyType.slice(1)
            : "Property",
          images: [],
          amenities: [],
          rules: propertyData.rules || [],
          host: {
            name: propertyData.host?.name || "Unknown Host",
            image: propertyData.host?.image || "/placeholder.svg",
            responseRate: propertyData.host?.responseRate || 95,
            responseTime: propertyData.host?.responseTime || "within a day",
            joinedDate: propertyData.host?.joinedDate || "recently",
          },
          reviews: propertyData.reviews || [],
          ratingBreakdown: propertyData.ratingBreakdown || {
            cleanliness: 4.5,
            accuracy: 4.5,
            communication: 4.5,
            location: 4.5,
            checkIn: 4.5,
            value: 4.5,
          },
          googleMapLink: propertyData.googleMapLink,
          locationCoords:
            propertyData.locationCoords ||
            propertyData.address?.coordinates ||
            undefined,
          contactNo: propertyData.contactNo || undefined,
          hidePrices: propertyData.hidePrices || false,
        }

        // Process images from different possible formats
        try {
          // Initialize an array to collect valid images with categories
          const validImages: string[] = []
          const categorizedImages: Array<{
            category: string
            files: Array<{ url: string; public_id: string }>
          }> = []

          // Handle categorizedImages (new format) - preserve category information
          if (
            propertyData.categorizedImages &&
            Array.isArray(propertyData.categorizedImages)
          ) {
            console.log(
              `Processing categorized images: ${propertyData.categorizedImages.length} categories found`
            )

            propertyData.categorizedImages.forEach((category: any) => {
              if (category?.files && Array.isArray(category.files)) {
                const validCategoryFiles: Array<{
                  url: string
                  public_id: string
                }> = []

                category.files.forEach((file: any) => {
                  if (file && file.url && typeof file.url === "string") {
                    validImages.push(file.url)
                    validCategoryFiles.push({
                      url: file.url,
                      public_id: file.public_id || "",
                    })
                    console.log(
                      `Added image from category ${category.category}: ${file.url}`
                    )
                  }
                })

                if (validCategoryFiles.length > 0) {
                  categorizedImages.push({
                    category: category.category,
                    files: validCategoryFiles,
                  })
                }
              }
            })
          }

          // Handle legacy format images
          if (
            propertyData.legacyGeneralImages &&
            Array.isArray(propertyData.legacyGeneralImages)
          ) {
            console.log(
              `Processing legacy images: ${propertyData.legacyGeneralImages.length} found`
            )

            const validLegacyFiles: Array<{ url: string; public_id: string }> =
              []
            propertyData.legacyGeneralImages.forEach((img: any) => {
              if (img && img.url && typeof img.url === "string") {
                validImages.push(img.url)
                validLegacyFiles.push({
                  url: img.url,
                  public_id: img.public_id || "",
                })
                console.log(`Added legacy image: ${img.url}`)
              }
            })

            if (validLegacyFiles.length > 0) {
              categorizedImages.push({
                category: "general",
                files: validLegacyFiles,
              })
            }
          }

          // Handle direct images array
          if (propertyData.images) {
            console.log(`Processing direct images array`)

            // Handle different image formats
            if (Array.isArray(propertyData.images)) {
              const validDirectFiles: Array<{
                url: string
                public_id: string
              }> = []

              propertyData.images.forEach((img: any) => {
                if (typeof img === "string" && img) {
                  validImages.push(img)
                  validDirectFiles.push({
                    url: img,
                    public_id: "",
                  })
                  console.log(`Added string image: ${img}`)
                } else if (img && img.url && typeof img.url === "string") {
                  validImages.push(img.url)
                  validDirectFiles.push({
                    url: img.url,
                    public_id: img.public_id || "",
                  })
                  console.log(`Added object image: ${img.url}`)
                }
              })

              if (validDirectFiles.length > 0) {
                categorizedImages.push({
                  category: "property",
                  files: validDirectFiles,
                })
              }
            }
          }

          console.log(`Total valid images found: ${validImages.length}`)
          console.log(`Categorized images:`, categorizedImages)

          // Set the valid images to the property
          transformedProperty.images = validImages
          ;(transformedProperty as any).categorizedImages = categorizedImages

          // Ensure we have at least one image
          if (
            !transformedProperty.images ||
            transformedProperty.images.length === 0
          ) {
            console.log("No valid images found, using placeholder")
            transformedProperty.images = ["/placeholder.svg"]
          }
        } catch (imageError) {
          console.error("Error processing property images:", imageError)
          // Ensure we always have at least one image even if processing fails
          transformedProperty.images = ["/placeholder.svg"]
        }

        // Filter out any invalid images (just to be extra safe)
        transformedProperty.images = transformedProperty.images.filter(
          (img) => img && typeof img === "string"
        )

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
              icon: amenityIcons[amenity.toLowerCase().replace(/\s+/g, "")] || (
                <Check className="h-4 w-4" />
              ),
            })
          })
        } else if (
          typeof propertyData.amenities === "object" &&
          propertyData.amenities !== null
        ) {
          Object.entries(propertyData.amenities).forEach(([key, value]) => {
            if (value === true) {
              transformedProperty.amenities.push({
                name:
                  key.charAt(0).toUpperCase() +
                  key
                    .slice(1)
                    .replace(/([A-Z])/g, " $1")
                    .trim(),
                icon: amenityIcons[key] || <Check className="h-4 w-4" />,
              })
            }
          })
        }

        // Process room categories if available
        if (
          propertyData.roomCategories &&
          Array.isArray(propertyData.roomCategories) &&
          propertyData.roomCategories.length > 0
        ) {
          console.log(
            `Processing ${propertyData.roomCategories.length} room categories`
          )
          transformedProperty.categories = propertyData.roomCategories.map(
            (category: any) => ({
              id:
                category.id ||
                category._id ||
                `category-${Math.random().toString(36).substr(2, 9)}`,
              name: category.name || "Standard Room",
              description: category.description || "",
              price: category.price || propertyData.price?.base || 0,
              maxGuests: category.maxGuests || 3,
              amenities: category.amenities || [],
            })
          )

          // Set the default price to the first category if categories exist
          if (
            transformedProperty.categories &&
            transformedProperty.categories.length > 0
          ) {
            transformedProperty.price = transformedProperty.categories[0].price
          }
        }
        // Check for propertyUnits (comes from property listing form)
        else if (
          propertyData.propertyUnits &&
          Array.isArray(propertyData.propertyUnits) &&
          propertyData.propertyUnits.length > 0
        ) {
          console.log(
            `Processing ${propertyData.propertyUnits.length} property units as room categories`
          )
          transformedProperty.categories = propertyData.propertyUnits.map(
            (unit: any) => ({
              id:
                unit.unitTypeCode ||
                `unit-${Math.random().toString(36).substr(2, 9)}`,
              name: unit.unitTypeName || "Standard Room",
              description: `${unit.unitTypeName} with essential amenities`,
              price:
                parseFloat(unit.pricing?.price) ||
                propertyData.price?.base ||
                0,
              maxGuests: 3,
              amenities: ["Wifi", "TV", "Air Conditioning"],
            })
          )

          // Set the default price to the first category
          if (
            transformedProperty.categories &&
            transformedProperty.categories.length > 0
          ) {
            transformedProperty.price = transformedProperty.categories[0].price
          }
        }
        // Alternative property structure (roomTypes)
        else if (
          propertyData.roomTypes &&
          Array.isArray(propertyData.roomTypes) &&
          propertyData.roomTypes.length > 0
        ) {
          console.log(`Processing ${propertyData.roomTypes.length} room types`)
          transformedProperty.categories = propertyData.roomTypes.map(
            (room: any) => ({
              id:
                room.id ||
                room._id ||
                `room-${Math.random().toString(36).substr(2, 9)}`,
              name: room.name || room.type || "Standard Room",
              description: room.description || "",
              price: room.price || propertyData.price?.base || 0,
              maxGuests: room.capacity || room.maxGuests || 3,
              amenities: room.amenities || [],
            })
          )

          if (
            transformedProperty.categories &&
            transformedProperty.categories.length > 0
          ) {
            transformedProperty.price = transformedProperty.categories[0].price
          }
        } else {
          // No categories found, create default categories
          console.log("No room categories found, creating default categories")

          // Create default room categories based on property type
          const propertyTypeLabel = propertyData.propertyType || "hotel"
          const basePrice =
            propertyData.price?.base ||
            parseFloat(propertyData.pricing?.perNight) ||
            4500

          transformedProperty.categories = [
            {
              id: "standard",
              name: "Standard Room",
              description: `Comfortable standard ${propertyTypeLabel} room with essential amenities.`,
              price: basePrice,
              maxGuests: 3,
              amenities: ["Wifi", "TV", "Air Conditioning"],
            },
            {
              id: "deluxe",
              name: "Deluxe Room",
              description: `Spacious deluxe ${propertyTypeLabel} room with premium amenities and extra comfort.`,
              price: Math.round(basePrice * 1.25),
              maxGuests: 3,
              amenities: [
                "Wifi",
                "TV",
                "Air Conditioning",
                "Mini Bar",
                "Room Service",
              ],
            },
            {
              id: "premium",
              name: "Premium Suite",
              description: `Luxurious premium suite with exclusive amenities and exceptional services.`,
              price: Math.round(basePrice * 1.5),
              maxGuests: 4,
              amenities: [
                "Wifi",
                "TV",
                "Air Conditioning",
                "Mini Bar",
                "Room Service",
                "Balcony",
                "Jacuzzi",
              ],
            },
          ]

          // Ensure prices are valid numbers
          transformedProperty.categories.forEach((cat) => {
            if (isNaN(cat.price) || cat.price <= 0) {
              console.warn(
                `Invalid price for ${cat.name}, defaulting to base price`
              )
              cat.price = 4500
            }
          })

          // Set the default price to the first category
          transformedProperty.price = transformedProperty.categories[0].price

          console.log(
            `Created ${transformedProperty.categories.length} default categories`
          )
        }

        console.log(
          "Final property categories:",
          transformedProperty.categories
        )

        setProperty(transformedProperty)

        // Check if property is in favorites
        if (typeof window !== "undefined") {
          const savedFavorites = localStorage.getItem("favorites")
          if (savedFavorites) {
            const favorites = JSON.parse(savedFavorites)
            setIsFavorite(favorites.includes(propertyId))
          }
        }

        // Add console log to debug property type
        if (transformedProperty) {
          console.log("Property details loaded:", {
            id: transformedProperty.id,
            title: transformedProperty.name,
            propertyType:
              transformedProperty.propertyType || transformedProperty.type,
          })
        }

        // Fetch pricing data for this property
        try {
          const pricingResponse = await fetch(
            `/api/admin/properties/${propertyId}/pricing`
          )
          if (pricingResponse.ok) {
            const pricingResult = await pricingResponse.json()
            if (pricingResult.dynamicPricing) {
              setPricingData({
                customPrices:
                  pricingResult.dynamicPricing.directPricing?.customPrices ||
                  [],
                seasonalRules:
                  pricingResult.dynamicPricing.seasonalPricing?.rules || [],
                blockedDates:
                  pricingResult.dynamicPricing.availabilityControl
                    ?.blockedDates || [],
              })
            }
          }
        } catch (pricingError) {
          console.error("Error fetching pricing data:", pricingError)
          // Continue with default empty pricing data
        }
      } catch (error) {
        console.error("Error fetching property details:", error)
        setErrorMessage(
          "There was a problem loading this property. Please try again later."
        )
      } finally {
        setLoading(false)
      }
    }

    // Only fetch if we have a valid property ID
    if (propertyId !== "unknown") {
      fetchPropertyDetails()
    }
  }, [propertyId]) // Only re-run when propertyId changes

  useEffect(() => {
    const checkReviewEligibility = async () => {
      if (status === "authenticated" && propertyId) {
        try {
          const response = await fetch(
            `/api/user/can-review?propertyId=${propertyId}`
          )
          const data = await response.json()
          if (data.canReview) {
            setCanReview(true)
          }
        } catch (error) {
          console.error("Error checking review eligibility:", error)
        }
      }
    }
    checkReviewEligibility()
  }, [status, propertyId])

  // Effect to handle room category selection on page load (FIXED - removed selectedCategory from deps)
  useEffect(() => {
    // Only run this once when property loads or URL category changes
    if (!property?.categories || property.categories.length === 0) return

    if (urlCategory) {
      // Check if the URL category exists in this property
      const categoryExists = property.categories.some(
        (cat) => cat.id === urlCategory
      )
      if (categoryExists) {
        // The category exists, we can use it
        setSelectedCategory(urlCategory)
      } else {
        // If the category from the URL doesn't exist, use the first available category
        setSelectedCategory(property.categories[0].id)
      }
    } else if (!selectedCategory) {
      // No category in URL, use first category if we haven't selected one yet
      setSelectedCategory(property.categories[0].id)
    }
  }, [property, urlCategory]) // eslint-disable-line react-hooks/exhaustive-deps
  // INTENTIONALLY REMOVED selectedCategory to prevent infinite loop

  // Fixed URL update function (REMOVED searchParams dependency to prevent loop)
  const updateBookingUrl = useCallback(
    (
      params: {
        checkIn?: Date
        checkOut?: Date
        guests?: number
        rooms?: number
        category?: string | null
      },
      skipNavigation = false
    ) => {
      // Get current search params directly from window location to avoid dependency loop
      const currentParams = new URLSearchParams(window.location.search)

      if (params.checkIn) {
        currentParams.set("checkIn", format(params.checkIn, "yyyy-MM-dd"))
      }

      if (params.checkOut) {
        currentParams.set("checkOut", format(params.checkOut, "yyyy-MM-dd"))
      }

      if (params.guests) {
        currentParams.set("guests", params.guests.toString())
      }

      if (params.rooms) {
        currentParams.set("rooms", params.rooms.toString())
      }

      if (params.category) {
        currentParams.set("category", params.category)
      } else if (params.category === null) {
        currentParams.delete("category")
      }

      // Only update URL if not skipping navigation
      if (!skipNavigation) {
        // Use window.history.replaceState instead of router.replace to avoid page reload
        const newUrl = `${window.location.pathname}?${currentParams.toString()}`
        window.history.replaceState({}, "", newUrl)
      }
    },
    [] // REMOVED searchParams dependency to prevent loop
  )

  // Update booking URL when property or parameters change
  useEffect(() => {
    if (property) {
      updateBookingUrl({
        checkIn,
        checkOut,
        guests,
        rooms,
        category: selectedCategory,
      })
    }
  }, [
    property,
    checkIn,
    checkOut,
    guests,
    rooms,
    selectedCategory,
    updateBookingUrl,
  ])

  const toggleFavorite = () => {
    if (!session) {
      router.push("/login")
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
      setCurrentImageIndex((prev) =>
        prev === property.images.length - 1 ? 0 : prev + 1
      )
    }
  }

  const prevImage = () => {
    if (property) {
      setCurrentImageIndex((prev) =>
        prev === 0 ? property.images.length - 1 : prev - 1
      )
    }
  }

  // Memoize categories to prevent object recreation
  const memoizedCategories = useMemo(() => property?.categories || [], [property?.categories])

  // Ultra-simple category change handler (FIXED - minimal logic to prevent loops)
  const handleCategoryChange = useCallback(
    (categoryId: string) => {
      setSelectedCategory(categoryId)
    },
    []
  )

  // Memoize price change handler
  const handlePriceChange = useCallback((priceData: any) => {
    setPricingDataFromSection(priceData)
  }, [])

  // Helper function to get maximum guests per room limit
  const getMaxGuestsPerRoom = () => {
    return 3 // Maximum 3 guests allowed per room
  }

  // Helper function to get minimum rooms required for current guest count
  const getMinimumRoomsRequired = () => {
    return Math.ceil(guests / getMaxGuestsPerRoom())
  }

  const handleBooking = () => {
    // This function is now handled by the PricingSection component
    // keeping it here for backwards compatibility but should not be called
    console.log(
      "[PropertyPage] Legacy handleBooking called - should use PricingSection instead"
    )
  }

  // Update date change handlers
  const handleCheckInChange = (date: Date | undefined) => {
    setCheckIn(date)
    if (date) {
      updateBookingUrl({ checkIn: date })
    }
  }

  const handleCheckOutChange = (date: Date | undefined) => {
    setCheckOut(date)
    if (date) {
      updateBookingUrl({ checkOut: date })
    }
  }

  // Update guests and rooms handlers for PricingSection integration
  const updateGuests = (newGuests: number) => {
    setGuests(newGuests)
    updateBookingUrl({ guests: newGuests })
  }

  const updateRooms = (newRooms: number) => {
    setRooms(newRooms)
    updateBookingUrl({ rooms: newRooms })
  }

  // Update functions to modify URL when guests/rooms change
  const incrementGuests = () => {
    const totalMaxGuests = 1000 // Absolute maximum guests allowed

    if (guests < totalMaxGuests) {
      const newGuestCount = guests + 1

      // Auto-adjust rooms if needed to maintain max 3 guests per room
      const minimumRoomsNeeded = Math.ceil(
        newGuestCount / getMaxGuestsPerRoom()
      )

      if (minimumRoomsNeeded > rooms) {
        setRooms(minimumRoomsNeeded)
        updateBookingUrl({ guests: newGuestCount, rooms: minimumRoomsNeeded })
      } else {
        updateBookingUrl({ guests: newGuestCount })
      }

      setGuests(newGuestCount)
    }
  }

  const decrementGuests = () => {
    if (guests > 1) {
      const newGuestCount = guests - 1
      setGuests(newGuestCount)
      updateBookingUrl({ guests: newGuestCount })

      // Optional: Auto-decrease rooms if guest count goes below threshold
      const maxGuestsPerRoom = selectedCategoryData?.maxGuests || 3
      if (rooms > 1 && newGuestCount <= (rooms - 1) * maxGuestsPerRoom) {
        const newRoomCount = rooms - 1
        setRooms(newRoomCount)
        updateBookingUrl({ rooms: newRoomCount })
      }
    }
  }

  // Update functions to modify URL when guests/rooms change
  const incrementRooms = () => {
    // Can't have more rooms than guests, and reasonable maximum of 200
    if (rooms < guests && rooms < 200) {
      const newRoomCount = rooms + 1
      setRooms(newRoomCount)
      updateBookingUrl({ rooms: newRoomCount })
    }
  }

  const decrementRooms = () => {
    const minimumRoomsNeeded = getMinimumRoomsRequired()

    if (rooms > 1 && rooms > minimumRoomsNeeded) {
      const newRoomCount = rooms - 1
      setRooms(newRoomCount)
      updateBookingUrl({ rooms: newRoomCount })
    }
  }

  // Helper to check if a date is blocked - using same logic as calendar
  const isDateBlocked = (date: Date, blockedDates: any[]) => {
    if (
      !blockedDates ||
      !Array.isArray(blockedDates) ||
      blockedDates.length === 0
    ) {
      return false
    }

    return blockedDates.some((blocked: any) => {
      if (!blocked || blocked.isActive === false) return false

      try {
        // Convert to Date objects for comparison
        const startDate = new Date(blocked.startDate)
        const endDate = new Date(blocked.endDate)

        // Normalize all dates to midnight UTC for accurate comparison
        const normalizedDate = new Date(
          date.getFullYear(),
          date.getMonth(),
          date.getDate()
        )
        const normalizedStart = new Date(
          startDate.getFullYear(),
          startDate.getMonth(),
          startDate.getDate()
        )
        const normalizedEnd = new Date(
          endDate.getFullYear(),
          endDate.getMonth(),
          endDate.getDate()
        )

        // Check if date falls within the blocked range (inclusive)
        return (
          normalizedDate >= normalizedStart && normalizedDate <= normalizedEnd
        )
      } catch (error) {
        console.error("Error processing blocked date:", blocked, error)
        return false
      }
    })
  }

  // Enhanced booking validation to check blocked dates
  const validateBookingDates = useCallback(() => {
    if (
      !checkIn ||
      !checkOut ||
      !selectedCategory ||
      !pricingData?.blockedDates
    ) {
      return { isValid: true, errors: [] }
    }

    const errors: string[] = []
    const categoryBlockedDates = pricingData.blockedDates.filter(
      (blocked: any) =>
        blocked.isActive &&
        (!blocked.categoryId || blocked.categoryId === selectedCategory)
    )

    // Check each date in the booking range
    const currentDate = new Date(checkIn)
    const endDate = new Date(checkOut)

    console.log("Validating booking dates:", {
      checkIn: format(checkIn, "yyyy-MM-dd"),
      checkOut: format(checkOut, "yyyy-MM-dd"),
      selectedCategory,
      categoryBlockedDates,
    })

    while (currentDate < endDate) {
      if (isDateBlocked(currentDate, categoryBlockedDates)) {
        const blockedDateStr = format(currentDate, "MMM dd, yyyy")
        errors.push(
          `${blockedDateStr} is blocked and not available for booking`
        )
        console.log(
          `❌ Booking validation failed: ${blockedDateStr} is blocked`
        )
      }
      currentDate.setDate(currentDate.getDate() + 1)
    }

    return {
      isValid: errors.length === 0,
      errors,
    }
  }, [checkIn, checkOut, selectedCategory, pricingData?.blockedDates])

  if (loading) {
    return (
      <div className="container mx-auto py-24 md:py-28 px-4">
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
        <div className="container mx-auto px-4 py-12 pt-24 md:pt-28">
          <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-red-700 mb-4">
              Property Not Found
            </h2>
            <p className="text-gray-600 mb-6">{errorMessage}</p>
            <div className="flex gap-4 justify-center">
              <Button variant="outline" onClick={() => router.back()}>
                Go Back
              </Button>
              <Button onClick={() => router.push("/")}>Return to Home</Button>
            </div>
          </div>
        </div>
      </PropertyDetailsWrapper>
    )
  }

  if (!property) {
    return (
      <div className="container mx-auto px-4 py-24 md:py-28 text-center">
        <h1 className="text-2xl font-bold mb-4">Property Not Found</h1>
        <p className="mb-6">
          The property you're looking for doesn't exist or has been removed.
        </p>
        <Button onClick={() => router.push("/search")}>Back to Search</Button>
      </div>
    )
  }

  return (
    <TooltipProvider>
      <PropertyDetailsWrapper>
        <div className="container mx-auto px-4 py-8 pt-24 md:pt-28">
          <div className="mb-6">
            <BackButton
              className="text-darkGreen hover:text-mediumGreen mb-4"
              variant="ghost"
            />
            <div className="flex flex-col items-start gap-2 mb-4">
              <h1 className="text-2xl md:text-3xl font-bold break-words w-full">
                {property.name}
              </h1>
              <Badge className="bg-lightGreen text-darkGreen font-medium shadow-lg border border-lightGreen/30 hover:bg-lightGreen/90 transition-colors">
                {formatPropertyType(
                  property.propertyType || property.type || "Property"
                )}
              </Badge>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <div className="flex items-center">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 mr-1" />
                <span className="font-medium">{property.rating}</span>
                <span className="text-muted-foreground ml-1">
                  ({property.reviewCount} reviews)
                </span>
              </div>
              <span className="text-muted-foreground">•</span>
              <div className="flex items-center">
                <MapPin className="h-4 w-4 mr-1 text-muted-foreground" />
                <span>{property.location}</span>
                <Button
                  variant="link"
                  className="ml-4 text-mediumGreen hover:text-darkGreen p-0 h-auto"
                  onClick={() => {
                    let url: string
                    if (property.googleMapLink) {
                      url = property.googleMapLink
                    } else if (
                      property.locationCoords?.lat &&
                      property.locationCoords?.lng
                    ) {
                      url = `https://www.google.com/maps/dir/?api=1&destination=${property.locationCoords.lat},${property.locationCoords.lng}`
                    } else {
                      url = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
                        property.location
                      )}`
                    }
                    if (typeof window !== "undefined") {
                      window.open(url, "_blank")
                    }
                  }}
                >
                  Get Directions
                </Button>
                {property.contactNo && (
                  <Button
                    variant="link"
                    className="ml-4 text-mediumGreen hover:text-darkGreen p-0 h-auto"
                    onClick={() => {
                      if (typeof window !== "undefined") {
                        window.location.href = `tel:${property.contactNo}`
                      }
                    }}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 mr-1"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 5a2 2 0 012-2h3.28a2 2 0 011.94 1.515l.7 2.8a2 2 0 01-.45 1.95l-1.27 1.27a16.001 16.001 0 006.586 6.586l1.27-1.27a2 2 0 011.95-.45l2.8.7A2 2 0 0121 18.72V21a2 2 0 01-2 2h-1C7.163 23 1 16.837 1 9V8a2 2 0 012-2z"
                      />
                    </svg>
                    Call Now
                  </Button>
                )}
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
                      {property.images && property.images.length > 0 ? (
                        <Image
                          src={
                            property.images[currentImageIndex] ||
                            "/placeholder.svg"
                          }
                          alt={`${property.name} - Image ${
                            currentImageIndex + 1
                          }`}
                          fill
                          className="object-cover"
                          onError={(e) => {
                            console.log(
                              `Image load error for ${property.images[currentImageIndex]}, using placeholder`
                            )
                            ;(e.target as HTMLImageElement).src =
                              "/placeholder.svg"
                          }}
                          unoptimized={property.images[
                            currentImageIndex
                          ]?.includes("unsplash.com")}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-100">
                          <p className="text-gray-500">No images available</p>
                        </div>
                      )}
                    </motion.div>
                  </AnimatePresence>
                </div>

                {/* Only show navigation if there are multiple images */}
                {property.images && property.images.length > 1 && (
                  <>
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
                            currentImageIndex === index
                              ? "bg-white w-4"
                              : "bg-white/50"
                          }`}
                          onClick={() => setCurrentImageIndex(index)}
                        />
                      ))}
                    </div>
                  </>
                )}

                <div className="absolute top-4 right-4 flex space-x-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="bg-white/80 hover:bg-white rounded-full"
                    onClick={toggleFavorite}
                  >
                    <Heart
                      className={`h-5 w-5 ${
                        isFavorite
                          ? "fill-red-500 text-red-500"
                          : "text-gray-600"
                      }`}
                    />
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

              {/* Property Thumbnails - only show if multiple images */}
              {property.images && property.images.length > 1 && (
                <div className="grid grid-cols-5 gap-2 mb-8">
                  {property.images.map((image, index) => (
                    <button
                      key={index}
                      className={`relative h-20 rounded-md overflow-hidden ${
                        currentImageIndex === index
                          ? "ring-2 ring-mediumGreen"
                          : ""
                      }`}
                      onClick={() => setCurrentImageIndex(index)}
                    >
                      <Image
                        src={image || "/placeholder.svg"}
                        alt={`Thumbnail ${index + 1}`}
                        fill
                        className="object-cover"
                        onError={(e) => {
                          console.log(
                            `Thumbnail load error for ${image}, using placeholder`
                          )
                          ;(e.target as HTMLImageElement).src =
                            "/placeholder.svg"
                        }}
                        unoptimized={image?.includes("unsplash.com")}
                      />
                    </button>
                  ))}
                </div>
              )}

              {/* Categorized Images Section */}
              {(property as any).categorizedImages &&
                (property as any).categorizedImages.length > 0 && (
                  <div className="mb-8">
                    <h3 className="text-xl font-semibold text-darkGreen mb-4">
                      Property Photos by Category
                    </h3>
                    <div className="space-y-6">
                      {(property as any).categorizedImages.map(
                        (category: any) => (
                          <div
                            key={category.category}
                            className="bg-gray-50 rounded-lg p-4"
                          >
                            <h4 className="text-lg font-medium text-darkGreen mb-3 capitalize flex items-center">
                              {category.category === "general"
                                ? "Property Photos"
                                : category.category}
                              <span className="text-sm text-gray-500 ml-2">
                                ({category.files.length} photo
                                {category.files.length === 1 ? "" : "s"})
                              </span>
                            </h4>
                            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                              {category.files.map(
                                (file: any, index: number) => (
                                  <button
                                    key={index}
                                    className="relative h-24 rounded-md overflow-hidden hover:ring-2 hover:ring-mediumGreen transition-all"
                                    onClick={() => {
                                      // Find the image index in the main images array
                                      const imageIndex =
                                        property.images.findIndex(
                                          (img) => img === file.url
                                        )
                                      if (imageIndex !== -1) {
                                        setCurrentImageIndex(imageIndex)
                                        // Scroll to top image
                                        window.scrollTo({
                                          top: 0,
                                          behavior: "smooth",
                                        })
                                      }
                                    }}
                                  >
                                    <Image
                                      src={file.url || "/placeholder.svg"}
                                      alt={`${category.category} ${index + 1}`}
                                      fill
                                      className="object-cover hover:scale-110 transition-transform"
                                      onError={(e) => {
                                        console.log(
                                          `Category image load error for ${file.url}, using placeholder`
                                        )
                                        ;(e.target as HTMLImageElement).src =
                                          "/placeholder.svg"
                                      }}
                                    />
                                    <div className="absolute inset-0 bg-black/0 hover:bg-black/10 transition-colors" />
                                  </button>
                                )
                              )}
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                )}

              {/* Property Description */}
              <div className="mb-8">
                <h2 className="text-xl font-bold mb-4">About this place</h2>
                <p className="text-muted-foreground whitespace-pre-line">
                  {property.description}
                </p>
              </div>

              {/* Amenities */}
              <div className="mb-8">
                <h2 className="text-xl font-bold mb-4">Amenities</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {property.amenities
                    .slice(0, showAllAmenities ? property.amenities.length : 6)
                    .map((amenity, index) => (
                      <div key={index} className="flex items-center gap-2">
                        {amenity.icon}
                        <span>{amenity.name}</span>
                      </div>
                    ))}
                </div>
                {property.amenities.length > 6 && (
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => setShowAllAmenities(!showAllAmenities)}
                  >
                    {showAllAmenities ? "Show less" : "Show all amenities"}
                  </Button>
                )}
              </div>

              {/* Plan-Based Pricing Matrix */}
              {selectedCategory && (
                <PlanPricingMatrix
                  propertyId={propertyId}
                  selectedCategory={selectedCategory}
                />
              )}

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
                <h2 className="text-xl font-bold mb-4">
                  Hosted by {property.host.name}
                </h2>
                <div className="flex items-center gap-4 mb-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage
                      src={property.host.image || "/placeholder.svg"}
                      alt={property.host.name}
                    />
                    <AvatarFallback>
                      {property.host.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Joined in {property.host.joinedDate}
                    </p>
                    <p className="text-sm">
                      Response rate: {property.host.responseRate}%
                    </p>
                    <p className="text-sm">
                      Response time: {property.host.responseTime}
                    </p>
                  </div>
                </div>
                {/* Call Now button for mobile users */}
                {property.contactNo && (
                  <div className="hidden md:block mt-4">
                    <a
                      href={`tel:${property.contactNo}`}
                      className="inline-flex items-center px-4 py-2 bg-mediumGreen text-white rounded-lg shadow hover:bg-darkGreen focus:outline-none focus:ring-2 focus:ring-mediumGreen focus:ring-offset-2 transition-colors"
                      style={{ textDecoration: "none" }}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 mr-2"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 5a2 2 0 012-2h3.28a2 2 0 011.94 1.515l.7 2.8a2 2 0 01-.45 1.95l-1.27 1.27a16.001 16.001 0 006.586 6.586l1.27-1.27a2 2 0 011.95-.45l2.8.7A2 2 0 0121 18.72V21a2 2 0 01-2 2h-1C7.163 23 1 16.837 1 9V8a2 2 0 012-2z"
                        />
                      </svg>
                      Call Now
                    </a>
                  </div>
                )}
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
                    <Progress
                      value={property.ratingBreakdown.cleanliness * 20}
                      className="h-2"
                    />
                    <span className="text-sm">
                      {property.ratingBreakdown.cleanliness}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm w-24">Accuracy</span>
                    <Progress
                      value={property.ratingBreakdown.accuracy * 20}
                      className="h-2"
                    />
                    <span className="text-sm">
                      {property.ratingBreakdown.accuracy}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm w-24">Communication</span>
                    <Progress
                      value={property.ratingBreakdown.communication * 20}
                      className="h-2"
                    />
                    <span className="text-sm">
                      {property.ratingBreakdown.communication}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm w-24">Location</span>
                    <Progress
                      value={property.ratingBreakdown.location * 20}
                      className="h-2"
                    />
                    <span className="text-sm">
                      {property.ratingBreakdown.location}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm w-24">Check-in</span>
                    <Progress
                      value={property.ratingBreakdown.checkIn * 20}
                      className="h-2"
                    />
                    <span className="text-sm">
                      {property.ratingBreakdown.checkIn}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm w-24">Value</span>
                    <Progress
                      value={property.ratingBreakdown.value * 20}
                      className="h-2"
                    />
                    <span className="text-sm">
                      {property.ratingBreakdown.value}
                    </span>
                  </div>
                </div>

                {/* Review List */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {property.reviews
                    .slice(0, showAllReviews ? property.reviews.length : 4)
                    .map((review) => (
                      <div key={review.id} className="mb-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Avatar className="h-10 w-10">
                            <AvatarImage
                              src={review.user.image || "/placeholder.svg"}
                              alt={review.user.name}
                            />
                            <AvatarFallback>
                              {review.user.name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{review.user.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {review.date}
                            </p>
                          </div>
                          <div className="ml-auto flex items-center">
                            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400 mr-1" />
                            <span className="text-sm">{review.rating}</span>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {review.comment}
                        </p>
                      </div>
                    ))}
                </div>

                {property.reviews.length > 4 && (
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => setShowAllReviews(!showAllReviews)}
                  >
                    {showAllReviews ? "Show less reviews" : "Show all reviews"}
                  </Button>
                )}
              </div>
            </div>

            {/* Enhanced Booking Card with Plan-Based Pricing */}
            <div className="lg:col-span-1">
              <div className="sticky top-24 max-h-[calc(100vh-8rem)] overflow-y-auto">
                  <PricingSection
                    propertyId={propertyId}
                    selectedCategory={selectedCategory}
                    checkInDate={checkIn || null}
                    checkOutDate={checkOut || null}
                    guestCount={guests}
                    roomCount={rooms}
                    availableCategories={memoizedCategories}
                    onCategoryChange={handleCategoryChange}
                    onPriceChange={handlePriceChange}
                    hidePrices={property?.hidePrices || false}
                  onBookingClick={() => {
                    console.log("[PropertyPage] PricingSection booking clicked")
                    if (!checkIn || !checkOut || !property) {
                      console.log(
                        "[PropertyPage] Missing required data for booking"
                      )
                      return
                    }

                    if (isBooking) {
                      console.log("[PropertyPage] Already booking in progress")
                      return
                    }

                    // Check session status
                    if (status === "loading") {
                      console.log("[PropertyPage] Session still loading")
                      toast({
                        title: "Please wait",
                        description: "Loading your session...",
                        variant: "default",
                      })
                      return
                    }

                    // Check if user is logged in
                    if (status !== "authenticated" || !session) {
                      console.log(
                        "[PropertyPage] User not logged in, redirecting to login"
                      )
                      const currentUrl =
                        window.location.pathname + window.location.search
                      router.push(
                        `/login?callbackUrl=${encodeURIComponent(currentUrl)}`
                      )
                      return
                    }

                    console.log(
                      "[PropertyPage] ✅ User is authenticated, proceeding with booking"
                    )

                    setIsBooking(true)

                    try {
                      // Use pricing data from PricingSection if available, otherwise fallback
                      const totalPrice =
                        pricingDataFromSection?.totalPrice ||
                        pricingCalculations.totalPrice
                      const basePrice =
                        pricingDataFromSection?.basePrice ||
                        selectedCategoryData?.price ||
                        property.price ||
                        0

                      let bookingUrl = `/booking?propertyId=${propertyId}`

                      if (checkIn) {
                        bookingUrl += `&checkIn=${checkIn.toISOString()}`
                      }
                      if (checkOut) {
                        bookingUrl += `&checkOut=${checkOut.toISOString()}`
                      }
                      bookingUrl += `&guests=${guests}`
                      bookingUrl += `&rooms=${rooms}`
                      if (selectedCategory) {
                        bookingUrl += `&category=${selectedCategory}`
                      }
                      bookingUrl += `&price=${totalPrice}`
                      bookingUrl += `&basePrice=${basePrice}`
                      if (property.name) {
                        bookingUrl += `&propertyName=${encodeURIComponent(
                          property.name
                        )}`
                      }

                      // Add plan-based pricing data if available
                      if (pricingDataFromSection?.planType) {
                        bookingUrl += `&planType=${pricingDataFromSection.planType}`
                      }
                      if (pricingDataFromSection?.occupancyType) {
                        bookingUrl += `&occupancyType=${pricingDataFromSection.occupancyType}`
                      }

                      console.log(
                        "[PropertyPage] Navigating to booking page with URL:",
                        bookingUrl
                      )

                      router.push(bookingUrl)

                      setTimeout(() => {
                        setIsBooking(false)
                      }, 500)
                    } catch (error) {
                      console.error(
                        "[PropertyPage] Navigation error in handleBooking:",
                        error
                      )
                      toast({
                        title: "Navigation failed",
                        description:
                          "There was an error proceeding to booking. Please try again.",
                        variant: "destructive",
                      })
                      setIsBooking(false)
                    }
                  }}
                />
              </div>
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

          <Separator className="my-8" />

          {canReview && (
            <div className="my-6">
              <Button onClick={() => setIsReviewFormOpen(true)}>
                Write a Review
              </Button>
            </div>
          )}

          {property.rating > 0 && property.reviewCount > 0 && (
            <ReviewsSection
              key={forceRefetch}
              propertyId={property.id}
              initialRating={property.rating}
              initialReviewCount={property.reviewCount}
              initialRatingBreakdown={property.ratingBreakdown}
            />
          )}

          <Separator className="my-8" />
        </div>
        {session?.user && (
          <ReviewForm
            propertyId={propertyId}
            userId={session.user.id}
            isOpen={isReviewFormOpen}
            onClose={() => setIsReviewFormOpen(false)}
            onReviewSubmit={() => {
              setForceRefetch((prev) => prev + 1) // Trigger a refetch of the reviews
              setCanReview(false) // Prevent multiple reviews
            }}
          />
        )}
        {/* Custom scrolling behavior script */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
      document.addEventListener('DOMContentLoaded', function() {
        const sidebar = document.getElementById('property-sidebar');
        const mainContent = document.querySelector('.lg\\:col-span-2');
        let isScrollingSidebar = false;
        let sidebarScrollHeight = 0;
        let sidebarClientHeight = 0;
        let lastScrollTop = 0;
        
        function updateSidebarDimensions() {
          if (sidebar) {
            sidebarScrollHeight = sidebar.scrollHeight;
            sidebarClientHeight = sidebar.clientHeight;
          }
        }
        
        updateSidebarDimensions();
        window.addEventListener('resize', updateSidebarDimensions);
        
        document.addEventListener('mousemove', function(e) {
          if (sidebar && mainContent) {
            const sidebarRect = sidebar.getBoundingClientRect();
            isScrollingSidebar = (
              e.clientX >= sidebarRect.left && 
              e.clientX <= sidebarRect.right && 
              e.clientY >= sidebarRect.top && 
              e.clientY <= sidebarRect.bottom
            );
          }
        });
        
        window.addEventListener('wheel', function(e) {
          if (!sidebar || !mainContent) return;
          
          const scrollingDown = e.deltaY > 0;
          const scrollingUp = e.deltaY < 0;
          const currentScrollTop = window.scrollY;
          
          if (isScrollingSidebar) {
            // When hovering over sidebar
            if (scrollingDown) {
              // Scrolling down
              if (sidebar.scrollTop < (sidebarScrollHeight - sidebarClientHeight)) {
                // If sidebar hasn't reached bottom, prevent page scroll
                e.preventDefault();
                sidebar.scrollTop += 40; // Adjust scroll speed as needed
              }
            } else if (scrollingUp) {
              // Scrolling up
              if (sidebar.scrollTop > 0) {
                // If sidebar hasn't reached top, prevent page scroll
                e.preventDefault();
                sidebar.scrollTop -= 40; // Adjust scroll speed as needed
              }
            }
          }
          
          lastScrollTop = currentScrollTop;
        }, { passive: false });
      });
    `,
          }}
        />
      </PropertyDetailsWrapper>
    </TooltipProvider>
  )
}
