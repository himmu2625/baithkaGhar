"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
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
  AlertTriangle,
  UtensilsCrossed as Kitchen,
  RefrigeratorIcon as Refrigerator,
  BedDouble,
  Plus,
  Minus,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { useSession } from "next-auth/react"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { motion, AnimatePresence } from "framer-motion"
import { ReportButton } from '@/components/ui/report-button';
import { ReportTargetType } from '@/models/reportTypes';
import { ReportProvider } from '@/hooks/use-report';
import { PropertyDetailsWrapper } from './property-details-wrapper';
import { Badge } from "@/components/ui/badge"
import { PropertyDetails, RoomCategory } from './types';
import { getCategoryPrice, calculateTotalPriceForCategory, getCategoryById } from './price-functions';

// Format property type with capitalization
const formatPropertyType = (type: string) => {
  if (!type) return 'Property';
  // Capitalize the first letter
  return type.charAt(0).toUpperCase() + type.slice(1).toLowerCase();
};

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
    console.log('Current property page URL:', window.location.href);
    
    // Listen for navigation events
    const handleBeforeUnload = () => {
      console.log('Navigation away from property page');
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);
  
  // Get URL parameters if they exist, otherwise use defaults
  const urlCheckIn = searchParams?.get("checkIn") ? new Date(searchParams.get("checkIn") as string) : undefined
  const urlCheckOut = searchParams?.get("checkOut") ? new Date(searchParams.get("checkOut") as string) : undefined
  const urlGuests = searchParams?.get("guests") ? parseInt(searchParams.get("guests") as string) : undefined
  const urlRooms = searchParams?.get("rooms") ? parseInt(searchParams.get("rooms") as string) : undefined
  const urlCategory = searchParams?.get("category") || null
  
  // Initialize state with URL parameters or default values
  const [checkIn, setCheckIn] = useState<Date | undefined>(urlCheckIn || addDays(new Date(), 1))
  const [checkOut, setCheckOut] = useState<Date | undefined>(urlCheckOut || addDays(new Date(), 4))
  const [guests, setGuests] = useState(urlGuests || 1)
  const [rooms, setRooms] = useState(urlRooms || 1)
  const [isBooking, setIsBooking] = useState(false)
  const [showAllAmenities, setShowAllAmenities] = useState(false)
  const [showAllReviews, setShowAllReviews] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const propertyId = params?.id as string || "unknown"

  // Force re-render when selected category changes
  const [, setForceUpdate] = useState(0);

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
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        })
        
        console.log(`Response status for property ${propertyId}: ${response.status}`)
        
        if (response.status === 404) {
          console.log(`Property not found: ${propertyId}`)
          setErrorMessage("Property not found. It may have been removed or is no longer available.")
          setLoading(false)
          return
        }
        
        if (!response.ok) {
          // Get response text for better debugging
          const errorText = await response.text()
          console.error(`Error response (${response.status}): ${errorText}`)
          throw new Error(`Failed to fetch property: ${response.statusText || 'Server Error'}`)
        }
        
        // Get response as text first to ensure proper parsing
        const responseText = await response.text()
        console.log(`Response received for property ${propertyId} (length: ${responseText.length})`)
        
        let propertyData
        try {
          // Try to parse the JSON response
          propertyData = JSON.parse(responseText)
          
          // Check if property is in the expected format
          if (propertyData.success && propertyData.property) {
            propertyData = propertyData.property
            console.log(`Property data successfully extracted: ${propertyData._id}`)
          } else if (!propertyData._id) {
            console.warn('Unexpected property data format:', propertyData)
          }
        } catch (parseError) {
          console.error('JSON parse error:', parseError)
          console.error('Response text:', responseText.substring(0, 200) + '...')
          throw new Error('Invalid response format from server')
        }
        
        // Safety check for required data - log issues but don't throw errors
        if (!propertyData) {
          console.warn('Property data is missing');
          setErrorMessage("Property information is unavailable. Please try again later.");
          setLoading(false);
          return;
        }
        
        // Map API response to PropertyDetails interface with fallbacks for missing data
        const transformedProperty: PropertyDetails = {
          id: propertyData._id || propertyId,
          name: propertyData.title || propertyData.name || "Unnamed Property",
          description: propertyData.description || "",
          location: propertyData.address?.city || propertyData.location?.city || propertyData.city || "Unknown Location",
          price: propertyData.price?.base || parseFloat(propertyData.pricing?.perNight) || 0,
          rating: propertyData.rating || 4.5,
          reviewCount: propertyData.reviewCount || 0,
          type: propertyData.propertyType ? propertyData.propertyType.charAt(0).toUpperCase() + propertyData.propertyType.slice(1) : 'Property',
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
        try {
          // Initialize an array to collect valid images
          const validImages: string[] = [];
          
          // Handle categorizedImages (new format)
          if (propertyData.categorizedImages && Array.isArray(propertyData.categorizedImages)) {
            console.log(`Processing categorized images: ${propertyData.categorizedImages.length} categories found`);
            
            propertyData.categorizedImages.forEach((category: any) => {
              if (category?.files && Array.isArray(category.files)) {
                category.files.forEach((file: any) => {
                  if (file && file.url && typeof file.url === 'string') {
                    validImages.push(file.url);
                    console.log(`Added image from category ${category.category}: ${file.url}`);
                  }
                });
              }
            });
          }
          
          // Handle legacy format images
          if (propertyData.legacyGeneralImages && Array.isArray(propertyData.legacyGeneralImages)) {
            console.log(`Processing legacy images: ${propertyData.legacyGeneralImages.length} found`);
            
            propertyData.legacyGeneralImages.forEach((img: any) => {
              if (img && img.url && typeof img.url === 'string') {
                validImages.push(img.url);
                console.log(`Added legacy image: ${img.url}`);
              }
            });
          }
          
          // Handle direct images array
          if (propertyData.images) {
            console.log(`Processing direct images array`);
            
            // Handle different image formats
            if (Array.isArray(propertyData.images)) {
              propertyData.images.forEach((img: any) => {
                if (typeof img === 'string' && img) {
                  validImages.push(img);
                  console.log(`Added string image: ${img}`);
                } else if (img && img.url && typeof img.url === 'string') {
                  validImages.push(img.url);
                  console.log(`Added object image: ${img.url}`);
                }
              });
            }
          }
          
          console.log(`Total valid images found: ${validImages.length}`);
          
          // Set the valid images to the property
          transformedProperty.images = validImages;
          
          // Ensure we have at least one image
          if (!transformedProperty.images || transformedProperty.images.length === 0) {
            console.log('No valid images found, using placeholder');
            transformedProperty.images = ["/placeholder.svg"];
          }
        } catch (imageError) {
          console.error('Error processing property images:', imageError);
          // Ensure we always have at least one image even if processing fails
          transformedProperty.images = ["/placeholder.svg"];
        }
        
        // Filter out any invalid images (just to be extra safe)
        transformedProperty.images = transformedProperty.images.filter(
          img => img && typeof img === 'string'
        );
        
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
        
        // Process room categories if available
        if (propertyData.roomCategories && Array.isArray(propertyData.roomCategories) && propertyData.roomCategories.length > 0) {
          console.log(`Processing ${propertyData.roomCategories.length} room categories`);
          transformedProperty.categories = propertyData.roomCategories.map((category: any) => ({
            id: category.id || category._id || `category-${Math.random().toString(36).substr(2, 9)}`,
            name: category.name || "Standard Room",
            description: category.description || "",
            price: category.price || propertyData.price?.base || 0,
            maxGuests: category.maxGuests || 3,
            amenities: category.amenities || []
          }));
          
          // Set the default price to the first category if categories exist
          if (transformedProperty.categories && transformedProperty.categories.length > 0) {
            transformedProperty.price = transformedProperty.categories[0].price;
            // Set the first category as selected by default
            setSelectedCategory(transformedProperty.categories[0].id);
          }
        }
        // Check for propertyUnits (comes from property listing form)
        else if (propertyData.propertyUnits && Array.isArray(propertyData.propertyUnits) && propertyData.propertyUnits.length > 0) {
          console.log(`Processing ${propertyData.propertyUnits.length} property units as room categories`);
          transformedProperty.categories = propertyData.propertyUnits.map((unit: any) => ({
            id: unit.unitTypeCode || `unit-${Math.random().toString(36).substr(2, 9)}`,
            name: unit.unitTypeName || "Standard Room",
            description: `${unit.unitTypeName} with essential amenities`,
            price: parseFloat(unit.pricing?.price) || propertyData.price?.base || 0,
            maxGuests: 3,
            amenities: ['Wifi', 'TV', 'Air Conditioning']
          }));
          
          // Set the default price to the first category
          if (transformedProperty.categories && transformedProperty.categories.length > 0) {
            transformedProperty.price = transformedProperty.categories[0].price;
            setSelectedCategory(transformedProperty.categories[0].id);
          }
        }
        // Alternative property structure (roomTypes)
        else if (propertyData.roomTypes && Array.isArray(propertyData.roomTypes) && propertyData.roomTypes.length > 0) {
          console.log(`Processing ${propertyData.roomTypes.length} room types`);
          transformedProperty.categories = propertyData.roomTypes.map((room: any) => ({
            id: room.id || room._id || `room-${Math.random().toString(36).substr(2, 9)}`,
            name: room.name || room.type || "Standard Room",
            description: room.description || "",
            price: room.price || propertyData.price?.base || 0,
            maxGuests: room.capacity || room.maxGuests || 3,
            amenities: room.amenities || []
          }));
          
          if (transformedProperty.categories && transformedProperty.categories.length > 0) {
            transformedProperty.price = transformedProperty.categories[0].price;
            setSelectedCategory(transformedProperty.categories[0].id);
          }
        } else {
          // No categories found, create default categories
          console.log('No room categories found, creating default categories');
          
          // Create default room categories based on property type
          const propertyTypeLabel = propertyData.propertyType || 'hotel';
          const basePrice = propertyData.price?.base || parseFloat(propertyData.pricing?.perNight) || 4500;
          
          transformedProperty.categories = [
            {
              id: 'standard',
              name: 'Standard Room',
              description: `Comfortable standard ${propertyTypeLabel} room with essential amenities.`,
              price: basePrice,
              maxGuests: 3,
              amenities: ['Wifi', 'TV', 'Air Conditioning']
            },
            {
              id: 'deluxe',
              name: 'Deluxe Room',
              description: `Spacious deluxe ${propertyTypeLabel} room with premium amenities and extra comfort.`,
              price: Math.round(basePrice * 1.25),
              maxGuests: 3,
              amenities: ['Wifi', 'TV', 'Air Conditioning', 'Mini Bar', 'Room Service']
            },
            {
              id: 'premium',
              name: 'Premium Suite',
              description: `Luxurious premium suite with exclusive amenities and exceptional services.`,
              price: Math.round(basePrice * 1.5),
              maxGuests: 4,
              amenities: ['Wifi', 'TV', 'Air Conditioning', 'Mini Bar', 'Room Service', 'Balcony', 'Jacuzzi']
            }
          ];
          
          // Ensure prices are valid numbers
          transformedProperty.categories.forEach(cat => {
            if (isNaN(cat.price) || cat.price <= 0) {
              console.warn(`Invalid price for ${cat.name}, defaulting to base price`);
              cat.price = 4500;
            }
          });
          
          // Set the default price to the first category
          transformedProperty.price = transformedProperty.categories[0].price;
          setSelectedCategory(transformedProperty.categories[0].id);
          
          console.log(`Created ${transformedProperty.categories.length} default categories`);
        }
        
        console.log('Final property categories:', transformedProperty.categories);
        
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
            propertyType: transformedProperty.propertyType || transformedProperty.type
          });
        }
      } catch (error) {
        console.error('Error fetching property details:', error)
        setErrorMessage("There was a problem loading this property. Please try again later.")
      } finally {
        setLoading(false)
      }
    }

    // Only fetch if we have a valid property ID
    if (propertyId !== "unknown") {
      fetchPropertyDetails()
    }
  }, [propertyId]) // Only re-run when propertyId changes

  // Effect to handle room category selection on page load
  useEffect(() => {
    // Only run this once when property loads or URL category changes
    if (!property?.categories || property.categories.length === 0) return;
    
    if (urlCategory) {
      // Check if the URL category exists in this property
      const categoryExists = property.categories.some(cat => cat.id === urlCategory);
      if (categoryExists) {
        // The category exists, we can use it
        setSelectedCategory(urlCategory);
      } else {
        // If the category from the URL doesn't exist, use the first available category
        setSelectedCategory(property.categories[0].id);
      }
    } else if (!selectedCategory) {
      // No category in URL, use first category if we haven't selected one yet
      setSelectedCategory(property.categories[0].id);
    }
  }, [property, urlCategory]);
  
  // Update the booking URL when parameters change
  const updateBookingUrl = (params: { checkIn?: Date, checkOut?: Date, guests?: number, rooms?: number, category?: string | null }) => {
    const newParams = new URLSearchParams(searchParams?.toString());
    
    if (params.checkIn) {
      newParams.set('checkIn', format(params.checkIn, 'yyyy-MM-dd'));
    }
    
    if (params.checkOut) {
      newParams.set('checkOut', format(params.checkOut, 'yyyy-MM-dd'));
    }
    
    if (params.guests) {
      newParams.set('guests', params.guests.toString());
    }
    
    if (params.rooms) {
      newParams.set('rooms', params.rooms.toString());
    }
    
    if (params.category) {
      newParams.set('category', params.category);
    } else if (params.category === null) {
      newParams.delete('category');
    }
    
    // Update the URL without refreshing the page
    window.history.replaceState({}, '', `${window.location.pathname}?${newParams.toString()}`);
  };

  // Make sure to sync URL category with selected category
  useEffect(() => {
    if (urlCategory && property?.categories) {
      const categoryExists = property.categories.some(cat => cat.id === urlCategory);
      if (categoryExists) {
        setSelectedCategory(urlCategory);
      }
    }
  }, [urlCategory, property]);

  const toggleFavorite = () => {
    if (!session) {
      router.push("/login");
      return;
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

  // Simple function to handle category selection
  const handleCategoryChange = (categoryId: string) => {
    // Update the UI state
    setSelectedCategory(categoryId);
    
    // Force re-render
    setForceUpdate(prev => prev + 1);
    
    // Log the selection for debugging
    const selectedCat = property?.categories?.find(cat => cat.id === categoryId);
    console.log(`Selected category: ${selectedCat?.name} with price: ${selectedCat?.price}`);
    
    // Create URL with all current parameters
    const urlParams = new URLSearchParams(searchParams?.toString() || "");
    urlParams.set("category", categoryId);
    
    // Keep URL query parameters but update category without page reload
    router.replace(`${window.location.pathname}?${urlParams.toString()}`);
  };
  
  // Helper function to calculate the total price
  const calculateTotalPrice = () => {
    if (!property || !checkIn || !checkOut) return 0;
    
    const nights = differenceInDays(checkOut, checkIn);
    if (nights <= 0) return 0;
    
    let price = property.price;
    if (selectedCategory && property.categories) {
      const category = property.categories.find(cat => cat.id === selectedCategory);
      if (category) {
        price = category.price;
      }
    }
    
    // Calculate base price for rooms and nights
    const baseTotal = price * nights * rooms;
    
    // Calculate extra guest charge (1000 rupees per extra guest beyond 2 per room)
    const baseGuestCapacity = rooms * 2; // 2 guests per room baseline
    const extraGuests = Math.max(0, guests - baseGuestCapacity);
    const extraGuestCharge = extraGuests * 1000 * nights;
    
    return baseTotal + extraGuestCharge;
  };

  // Helper function to calculate extra guest charge
  const calculateExtraGuestCharge = () => {
    if (!checkIn || !checkOut) return 0;
    
    const nights = differenceInDays(checkOut, checkIn);
    if (nights <= 0) return 0;
    
    const baseGuestCapacity = rooms * 2; // 2 guests per room baseline
    const extraGuests = Math.max(0, guests - baseGuestCapacity);
    
    return extraGuests * 1000 * nights;
  };

  // Helper function to get the number of extra guests
  const getExtraGuestsCount = () => {
    const baseGuestCapacity = rooms * 2; // 2 guests per room baseline
    return Math.max(0, guests - baseGuestCapacity);
  };

  // Helper function to get maximum guests per room limit
  const getMaxGuestsPerRoom = () => {
    return 3; // Maximum 3 guests allowed per room
  };

  // Helper function to get minimum rooms required for current guest count
  const getMinimumRoomsRequired = () => {
    return Math.ceil(guests / getMaxGuestsPerRoom());
  };

  // Get the currently selected category object and log its price
  const getSelectedCategoryObject = () => {
    const result = property?.categories?.find(category => category.id === selectedCategory);
    // Ensure the price is a valid number
    if (result && (isNaN(result.price) || result.price <= 0)) {
      console.warn(`Invalid price found for category ${result.name}, using default price`);
      result.price = property?.price || 4500;
    }
    return result || null;
  };

  const handleBooking = () => {
    console.log("[PropertyPage] handleBooking triggered.");
    console.log("[PropertyPage] Session status:", status, "Session data:", session);

    // Check session status more robustly
    if (status === "loading") {
      console.log("[PropertyPage] Session still loading, please wait...");
      toast({
        title: "Please wait",
        description: "Loading your session...",
        variant: "default"
      });
      return;
    }

    // Check if user is logged in
    if (status !== "authenticated" || !session) {
      console.log("[PropertyPage] User not logged in, redirecting to login.");
      const currentUrl = window.location.pathname + window.location.search;
      router.push(`/login?callbackUrl=${encodeURIComponent(currentUrl)}`);
      return;
    }

    console.log("[PropertyPage] ✅ User is authenticated, proceeding with booking.");

    if (!checkIn || !checkOut) {
      console.log("[PropertyPage] Check-in or check-out dates missing.");
      toast({
        title: "Select dates",
        description: "Please select check-in and check-out dates",
        variant: "destructive",
      })
      return
    }

    if (!selectedCategory && property?.categories && property.categories.length > 0) {
      console.log("[PropertyPage] No category selected, defaulting to first.");
      setSelectedCategory(property.categories[0].id);
    }

    setIsBooking(true)

    try {
      console.log("[PropertyPage] handleBooking: propertyId:", propertyId, "checkIn:", checkIn?.toISOString(), "checkOut:", checkOut?.toISOString());
      
      const categoryDetails = getSelectedCategoryObject();
      const categoryPrice = categoryDetails?.price || property?.price || 0;
      console.log("[PropertyPage] categoryDetails:", categoryDetails, "categoryPrice:", categoryPrice);

      let bookingUrl = `/booking?propertyId=${propertyId}`;
      
      if (checkIn) {
        bookingUrl += `&checkIn=${checkIn.toISOString()}`;
      }
      if (checkOut) {
        bookingUrl += `&checkOut=${checkOut.toISOString()}`;
      }
      bookingUrl += `&guests=${guests}`;
      bookingUrl += `&rooms=${rooms}`;
      if (selectedCategory) {
        bookingUrl += `&category=${selectedCategory}`;
      }
      bookingUrl += `&price=${categoryPrice}`;
      if (property && property.name) {
        bookingUrl += `&propertyName=${encodeURIComponent(property.name)}`;
      }
      
      console.log("[PropertyPage] Navigating to booking page with URL:", bookingUrl);
      
      router.push(bookingUrl);
      
      setTimeout(() => {
        setIsBooking(false);
      }, 500);
    } catch (error) {
      console.error("[PropertyPage] Navigation error in handleBooking:", error);
      toast({
        title: "Navigation failed",
        description: "There was an error proceeding to booking. Please try again.",
        variant: "destructive",
      })
      setIsBooking(false)
    }
  }

  // Update date change handlers
  const handleCheckInChange = (date: Date | undefined) => {
    setCheckIn(date);
    if (date) {
      updateBookingUrl({ checkIn: date });
    }
  };
  
  const handleCheckOutChange = (date: Date | undefined) => {
    setCheckOut(date);
    if (date) {
      updateBookingUrl({ checkOut: date });
    }
  };

  // Update functions to modify URL when guests/rooms change
  const incrementGuests = () => {
    const totalMaxGuests = 1000; // Absolute maximum guests allowed
    
    if (guests < totalMaxGuests) {
      const newGuestCount = guests + 1;
      
      // Auto-adjust rooms if needed to maintain max 3 guests per room
      const minimumRoomsNeeded = Math.ceil(newGuestCount / getMaxGuestsPerRoom());
      
      if (minimumRoomsNeeded > rooms) {
        setRooms(minimumRoomsNeeded);
        updateBookingUrl({ guests: newGuestCount, rooms: minimumRoomsNeeded });
      } else {
        updateBookingUrl({ guests: newGuestCount });
      }
      
      setGuests(newGuestCount);
    }
  };
  
  const decrementGuests = () => {
    if (guests > 1) {
      const newGuestCount = guests - 1;
      setGuests(newGuestCount);
      updateBookingUrl({ guests: newGuestCount });
      
      // Optional: Auto-decrease rooms if guest count goes below threshold
      const maxGuestsPerRoom = getSelectedCategoryObject()?.maxGuests || 3;
      if (rooms > 1 && newGuestCount <= (rooms - 1) * maxGuestsPerRoom) {
        const newRoomCount = rooms - 1;
        setRooms(newRoomCount);
        updateBookingUrl({ rooms: newRoomCount });
      }
    }
  };

  // Update functions to modify URL when guests/rooms change
  const incrementRooms = () => {
    // Can't have more rooms than guests, and reasonable maximum of 200
    if (rooms < guests && rooms < 200) {
      const newRoomCount = rooms + 1;
      setRooms(newRoomCount);
      updateBookingUrl({ rooms: newRoomCount });
    }
  };
  
  const decrementRooms = () => {
    const minimumRoomsNeeded = getMinimumRoomsRequired();
    
    if (rooms > 1 && rooms > minimumRoomsNeeded) {
      const newRoomCount = rooms - 1;
      setRooms(newRoomCount);
      updateBookingUrl({ rooms: newRoomCount });
    }
  };

  // When any of the booking parameters change, update the URL
  useEffect(() => {
    if (checkIn && checkOut && property) {
      updateBookingUrl({
        checkIn,
        checkOut,
        guests,
        rooms,
        category: selectedCategory
      });
    }
  }, [checkIn, checkOut, guests, rooms, selectedCategory]);

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
            <h2 className="text-2xl font-bold text-red-700 mb-4">Property Not Found</h2>
            <p className="text-gray-600 mb-6">{errorMessage}</p>
            <div className="flex gap-4 justify-center">
              <Button variant="outline" onClick={() => router.back()}>
                Go Back
              </Button>
              <Button onClick={() => router.push('/')}>
                Return to Home
              </Button>
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
        <p className="mb-6">The property you're looking for doesn't exist or has been removed.</p>
        <Button onClick={() => router.push("/search")}>Back to Search</Button>
      </div>
    )
  }

  return (
    <PropertyDetailsWrapper>
      <div className="container mx-auto px-4 py-8 pt-24 md:pt-28">
        <div className="mb-6">
          <div className="flex flex-col items-start gap-2 mb-4">
            <h1 className="text-2xl md:text-3xl font-bold break-words w-full">{property.name}</h1>
            <Badge className="bg-lightGreen text-darkGreen font-medium shadow-lg border border-lightGreen/30 hover:bg-lightGreen/90 transition-colors">
              {formatPropertyType(property.propertyType || property.type || 'Property')}
            </Badge>
          </div>
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
                    {property.images && property.images.length > 0 ? (
                      <Image
                        src={property.images[currentImageIndex] || "/placeholder.svg"}
                        alt={`${property.name} - Image ${currentImageIndex + 1}`}
                        fill
                        className="object-cover"
                        onError={(e) => {
                          console.log(`Image load error for ${property.images[currentImageIndex]}, using placeholder`);
                          (e.target as HTMLImageElement).src = "/placeholder.svg";
                        }}
                        unoptimized={property.images[currentImageIndex]?.includes('unsplash.com')}
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
                          currentImageIndex === index ? "bg-white w-4" : "bg-white/50"
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

            {/* Property Thumbnails - only show if multiple images */}
            {property.images && property.images.length > 1 && (
              <div className="grid grid-cols-5 gap-2 mb-8">
                {property.images.map((image, index) => (
                  <button
                    key={index}
                    className={`relative h-20 rounded-md overflow-hidden ${
                      currentImageIndex === index ? "ring-2 ring-mediumGreen" : ""
                    }`}
                    onClick={() => setCurrentImageIndex(index)}
                  >
                    <Image 
                      src={image || "/placeholder.svg"} 
                      alt={`Thumbnail ${index + 1}`} 
                      fill 
                      className="object-cover"
                      onError={(e) => {
                        console.log(`Thumbnail load error for ${image}, using placeholder`);
                        (e.target as HTMLImageElement).src = "/placeholder.svg";
                      }}
                      unoptimized={image?.includes('unsplash.com')}
                    />
                  </button>
                ))}
              </div>
            )}

            {/* Property Description */}
            <div className="mb-8">
              <h2 className="text-xl font-bold mb-4">About this place</h2>
              <p className="text-muted-foreground whitespace-pre-line">{property.description}</p>
            </div>

            {/* Room Categories Section - New Addition */}
            <div className="mb-8 border-2 border-lightGreen/30 rounded-lg p-6 bg-lightGreen/5">
              <h2 className="text-xl font-bold mb-4 flex items-center">
                <BedDouble className="h-5 w-5 mr-2 text-mediumGreen" />
                Room Categories
              </h2>
              <p className="text-sm text-muted-foreground mb-4">Select your preferred room type for this stay:</p>
              <div className="grid grid-cols-1 gap-4">
                {property.categories && property.categories.map((category) => (
                  <div 
                    key={category.id}
                    onClick={() => handleCategoryChange(category.id)}
                    className={`border rounded-lg p-4 cursor-pointer transition-all hover:shadow-md ${
                      selectedCategory === category.id 
                        ? 'border-2 border-mediumGreen bg-lightGreen/10' 
                        : 'border border-gray-200 hover:border-mediumGreen'
                    }`}
                  >
                    <div className="flex flex-wrap justify-between items-center">
                      <div className="flex items-center gap-2">
                        <div className={`h-5 w-5 flex items-center justify-center rounded-full ${
                          selectedCategory === category.id ? 'bg-mediumGreen text-white' : 'border border-gray-300'
                        }`}>
                          {selectedCategory === category.id && <Check className="h-3 w-3" />}
                        </div>
                        <h3 className="font-medium text-lg">{category.name}</h3>
                      </div>
                      <div className="font-bold text-xl text-mediumGreen">₹{category.price.toLocaleString()}/night</div>
                    </div>
                    
                    {category.description && (
                      <p className="text-sm text-muted-foreground mt-2 ml-7">{category.description}</p>
                    )}
                    
                    <div className="mt-3 ml-7 flex flex-wrap items-center gap-2">
                      <span className="flex items-center text-xs bg-lightGreen/10 text-darkGreen px-2 py-1 rounded-full">
                        <BedDouble className="h-3 w-3 mr-1" />
                        Up to {category.maxGuests} guests
                      </span>
                      
                      {category.amenities && category.amenities.map((amenity, idx) => (
                        <span key={idx} className="text-xs bg-lightGreen/10 text-darkGreen px-2 py-1 rounded-full">
                          {amenity}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
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
                  <span className="text-xl md:text-2xl font-bold text-mediumGreen">
                    ₹{getSelectedCategoryObject()?.price.toLocaleString() || property.price.toLocaleString()}
                  </span>
                  <span className="text-sm font-normal text-muted-foreground">per night</span>
                </CardTitle>
                
                {property?.categories && (
                  <div className="mt-2 mb-1">
                    <span className="text-sm font-medium text-muted-foreground">Room Category: </span>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {property.categories.map((category) => (
                        <button
                          key={category.id}
                          onClick={() => handleCategoryChange(category.id)}
                          className={`px-3 py-1 text-sm rounded-full transition-all ${
                            selectedCategory === category.id
                              ? 'bg-mediumGreen text-white scale-110 shadow-md' 
                              : 'bg-gray-100 hover:bg-gray-200 text-gray-800 hover:scale-105'
                          }`}
                        >
                          {category.name} - ₹{category.price.toLocaleString()}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
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
                            onSelect={handleCheckInChange}
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
                            onSelect={handleCheckOutChange}
                            disabled={(date) => (checkIn ? date <= checkIn : date <= new Date())}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Guests</label>
                    <div className="flex items-center border rounded-md h-10">
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="icon" 
                        onClick={decrementGuests}
                        disabled={guests <= 1}
                        className="h-full rounded-none rounded-l-md"
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <div className="flex-1 text-center font-medium">
                        {guests} {guests === 1 ? "Guest" : "Guests"}
                      </div>
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="icon" 
                        onClick={incrementGuests}
                        disabled={guests >= 1000}
                        className="h-full rounded-none rounded-r-md"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      2 guests per room (baseline) • Max {getMaxGuestsPerRoom()} guests per room • Rooms auto-adjust
                      {getExtraGuestsCount() > 0 && (
                        <>
                          <br />
                          <span className="text-orange-600">
                            Extra charge: ₹1,000 per night for 3rd guest in each room
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Rooms</label>
                    <div className="flex items-center border rounded-md h-10">
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="icon" 
                        onClick={decrementRooms}
                        disabled={rooms <= 1 || rooms <= getMinimumRoomsRequired()}
                        className="h-full rounded-none rounded-l-md"
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <div className="flex-1 text-center font-medium">
                        {rooms} {rooms === 1 ? "Room" : "Rooms"}
                      </div>
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="icon" 
                        onClick={incrementRooms}
                        disabled={rooms >= 200 || rooms >= guests}
                        className="h-full rounded-none rounded-r-md"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {checkIn && checkOut && (
                    <div className="space-y-2 mt-2">
                      <div className="flex justify-between items-center">
                        <div>
                          <span className="font-medium">
                            ₹{getSelectedCategoryObject()?.price.toLocaleString() || property.price.toLocaleString()}
                          </span>
                          <span className="text-sm text-muted-foreground"> × {differenceInDays(checkOut, checkIn)} nights × {rooms} {rooms === 1 ? 'room' : 'rooms'}</span>
                        </div>
                        <span>
                          ₹{((getSelectedCategoryObject()?.price || property.price) * differenceInDays(checkOut, checkIn) * rooms).toLocaleString()}
                        </span>
                      </div>
                      
                      {calculateExtraGuestCharge() > 0 && (
                        <div className="flex justify-between items-center">
                          <div>
                            <span className="text-sm text-muted-foreground">Extra guest charge</span>
                            <span className="text-xs text-muted-foreground block">
                              ({getExtraGuestsCount()} extra {getExtraGuestsCount() === 1 ? 'guest' : 'guests'} × ₹1,000)
                            </span>
                          </div>
                          <span className="text-orange-600">
                            +₹{calculateExtraGuestCharge().toLocaleString()}
                          </span>
                        </div>
                      )}
                      
                      <Separator className="my-2" />
                      <div className="flex justify-between font-bold">
                        <span>Total</span>
                        <span className="text-lg text-mediumGreen">
                          ₹{calculateTotalPrice().toLocaleString()}
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
