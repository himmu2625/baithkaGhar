"use client"

export const dynamic = 'force-dynamic';

import { useState, useEffect, useMemo, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { format } from "date-fns"
import { MapPin, Calendar, Users, Star, Heart, ArrowLeft } from "lucide-react"
import { LocationIcon, CalendarIcon, GuestsIcon, StarIcon, HeartIcon } from "@/components/ui/enhanced-icons"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "../../components/ui/skeleton"
import Image from "next/image"
import { useLoginPrompt } from "@/hooks/use-login-prompt"
import { useSession } from "next-auth/react"
import { trackPropertySearch, trackAllSearches } from "@/lib/search-tracking"
import { PropertyCard } from "@/components/ui/property-card"
import { SpecialOffersDisplay } from "@/components/features/special-offers/SpecialOffersDisplay"
import { PlanFilters } from "@/components/search/PlanFilters"

interface SearchResult {
  id: string
  title: string
  location: string
  price: number
  rating: number
  thumbnail: string
  categorizedImages?: Array<{
    category: string;
    files: Array<{ url: string; public_id: string }>;
  }>;
  legacyGeneralImages?: Array<{ url: string; public_id: string }>;
  amenities?: string[]
  type: string
  bedrooms?: number
  bathrooms?: number
  maxGuests?: number
  city?: string
}

// Client component for search results
function SearchResults() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { promptLogin } = useLoginPrompt()
  const { data: session } = useSession()
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(true)
  const [favorites, setFavorites] = useState<string[]>([])
  const [selectedPlans, setSelectedPlans] = useState<string[]>([])
  const [selectedOccupancies, setSelectedOccupancies] = useState<string[]>([])

  const location = searchParams?.get("location") || ""
  const checkIn = useMemo(() => searchParams?.get("checkIn") ? new Date(searchParams.get("checkIn") as string) : null, [searchParams]);
  const checkOut = useMemo(() => searchParams?.get("checkOut") ? new Date(searchParams.get("checkOut") as string) : null, [searchParams]);
  const guests = searchParams?.get("guests") || "1"
  const rooms = searchParams?.get("rooms") || "1"
  const planType = searchParams?.get("planType") || "EP"
  const occupancyType = searchParams?.get("occupancyType") || "DOUBLE"

  // Helper function to get the best image for a property based on category preference
  const getPropertyImage = (property: SearchResult): string => {
    // Try categorizedImages first - prefer exterior images
    if (property.categorizedImages && Array.isArray(property.categorizedImages)) {
      // First try to find exterior images
      const exteriorCategory = property.categorizedImages.find(cat => cat.category === 'exterior');
      if (exteriorCategory && exteriorCategory.files && exteriorCategory.files.length > 0) {
        return exteriorCategory.files[0].url;
      }
      
      // Then try interior images
      const interiorCategory = property.categorizedImages.find(cat => cat.category === 'interior');
      if (interiorCategory && interiorCategory.files && interiorCategory.files.length > 0) {
        return interiorCategory.files[0].url;
      }
      
      // Finally, try any available categorized image
      for (const category of property.categorizedImages) {
        if (category.files && category.files.length > 0) {
          return category.files[0].url;
        }
      }
    }
    
    // Try legacyGeneralImages
    if (property.legacyGeneralImages && Array.isArray(property.legacyGeneralImages) && property.legacyGeneralImages.length > 0) {
      return property.legacyGeneralImages[0].url;
    }
    
    // Fallback to thumbnail or placeholder
    return property.thumbnail || "/placeholder.svg";
  }

  useEffect(() => {
    const fetchResults = async () => {
      setLoading(true)
      try {
        // Construct query parameters for API call
        const queryParams = new URLSearchParams()
        if (location) queryParams.append('city', location)
        // Add other filters if needed
        
        // First try to get properties for the specific city
        let response = await fetch(`/api/properties/by-city?${queryParams.toString()}`)

        // Check if response is ok and has content
        if (!response.ok) {
          throw new Error(`API error: ${response.status}`)
        }

        const responseText = await response.text()
        let data = responseText ? JSON.parse(responseText) : { success: false, properties: [] }

        // If no properties found for specific city, try the general properties endpoint
        if (!data.properties || data.properties.length === 0) {
          response = await fetch(`/api/properties?${queryParams.toString()}`)

          if (!response.ok) {
            throw new Error(`API error: ${response.status}`)
          }

          const responseText2 = await response.text()
          data = responseText2 ? JSON.parse(responseText2) : { success: false, properties: [] }
        }
        
        if (data.success && data.properties) {
          setResults(data.properties)
        } else {
          setResults([])
        }

        // Track this search in the database - using a flag to avoid re-sending tracking on every render
        const hasResults = data.properties && data.properties.length > 0
        
        // Create a tracking ID to deduplicate search tracking
        const searchTrackingId = `${location}-${checkIn ? checkIn.toISOString() : 'null'}-${checkOut ? checkOut.toISOString() : 'null'}-${guests}`
        
        // Only track if we have a location and haven't tracked this search yet in this session
        if (location && !sessionStorage.getItem(`tracked-${searchTrackingId}`)) {
          const searchData = {
            searchTerm: location,
            location: location,
            checkIn: checkIn ? format(checkIn, 'yyyy-MM-dd') : undefined,
            checkOut: checkOut ? format(checkOut, 'yyyy-MM-dd') : undefined,
            guests: Number(guests),
          }
          
          // Mark this search as tracked in this session
          sessionStorage.setItem(`tracked-${searchTrackingId}`, 'true')
          
          // Fire and forget - don't await these tracking calls
          trackAllSearches(
            searchData,
            hasResults,
            hasResults ? data.properties.length : 0,
            session
          ).catch(err => console.error('Error tracking search', err))
          
          // If no results, track as a search for unlisted property
          if (!hasResults) {
            trackPropertySearch(searchData, session)
              .catch(err => console.error('Error tracking property search', err))
          }
        }
      } catch (error) {
        console.error("Error fetching search results:", error)
        setResults([])
      } finally {
        setLoading(false)
      }
    }

    if (location) {
      fetchResults()
    }
  }, [location, checkIn, checkOut, guests, session]) // Added 'session' back to dependency array

  // Load favorites from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedFavorites = localStorage.getItem("favorites")
      if (savedFavorites) {
        setFavorites(JSON.parse(savedFavorites))
      }
    }
  }, [])

  const toggleFavorite = (id: string) => {
    // Check if user is logged in
    if (!promptLogin()) {
      return
    }

    const newFavorites = favorites.includes(id) ? favorites.filter((favId) => favId !== id) : [...favorites, id]

    setFavorites(newFavorites)
    localStorage.setItem("favorites", JSON.stringify(newFavorites))
  }

  // Filter results based on selected plans and occupancies
  const filteredResults = useMemo(() => {
    let filtered = results;

    // Note: Client-side filtering is for display only
    // In a real implementation, you'd want to check if properties have the selected plan/occupancy combinations
    // For now, we show all results since properties now have plan-based pricing

    return filtered;
  }, [results, selectedPlans, selectedOccupancies]);

  // Function to navigate to property details page
  const viewPropertyDetails = (propertyId: string) => {
    // Include search parameters in the URL to property details page
    const urlParams = new URLSearchParams();
    if (checkIn) urlParams.append('checkIn', checkIn.toISOString());
    if (checkOut) urlParams.append('checkOut', checkOut.toISOString());
    if (guests) urlParams.append('guests', guests.toString());
    if (rooms) urlParams.append('rooms', rooms.toString());
    if (planType) urlParams.append('planType', planType);
    if (occupancyType) urlParams.append('occupancyType', occupancyType);

    // Navigate to property details with query parameters
    router.push(`/property/${propertyId}?${urlParams.toString()}`);
  }

  return (
    <div className="container mx-auto py-24 px-4">
      <div className="mb-8">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="mb-4 flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <h1 className="text-3xl font-bold mb-4">Search Results for {location}</h1>
        <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
          {checkIn && checkOut && (
            <div className="flex items-center">
              <CalendarIcon size="sm" className="mr-1" />
              {format(checkIn, "PP")} - {format(checkOut, "PP")}
            </div>
          )}
          <div className="flex items-center">
            <GuestsIcon size="sm" className="mr-1" />
            {guests} {Number.parseInt(guests) === 1 ? "Guest" : "Guests"}, {rooms}{" "}
            {Number.parseInt(rooms) === 1 ? "Room" : "Rooms"}
          </div>
          {planType && (
            <div className="flex items-center bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
              <span className="text-xs font-medium">
                Plan: {planType === 'EP' ? 'Room Only' : planType === 'CP' ? 'Room + Breakfast' :
                       planType === 'MAP' ? 'Room + Breakfast + 1 Meal' : 'Room + All Meals'}
              </span>
            </div>
          )}
          {occupancyType && (
            <div className="flex items-center bg-purple-100 text-purple-800 px-2 py-1 rounded-full">
              <span className="text-xs font-medium">
                {occupancyType === 'SINGLE' ? 'Single Sharing' :
                 occupancyType === 'DOUBLE' ? 'Double Sharing' :
                 occupancyType === 'TRIPLE' ? 'Triple Sharing' : 'Quad Sharing'}
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="my-12">
        <SpecialOffersDisplay />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Filters Sidebar */}
        <div className="lg:col-span-1">
          <div className="sticky top-24">
            <PlanFilters
              selectedPlans={selectedPlans}
              selectedOccupancies={selectedOccupancies}
              onPlanChange={setSelectedPlans}
              onOccupancyChange={setSelectedOccupancies}
            />
          </div>
        </div>

        {/* Results Area */}
        <div className="lg:col-span-3">
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((_, index) => (
            <Card key={index} className="overflow-hidden">
              <Skeleton className="h-[200px] w-full" />
              <CardHeader>
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-2/3" />
              </CardContent>
              <CardFooter>
                <Skeleton className="h-10 w-full" />
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : filteredResults.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredResults.map((result, index) => (
            <PropertyCard
              key={result.id}
              property={{
                ...result,
                location: result.city || result.location
              }}
              checkIn={checkIn || undefined}
              checkOut={checkOut || undefined}
              guests={parseInt(guests)}
              rooms={parseInt(rooms)}
              planType={planType}
              occupancyType={occupancyType}
              showPlanPricing={true}
              showDynamicPricing={true}
              showEventTags={true}
              onFavoriteToggle={toggleFavorite}
              isFavorite={favorites.includes(result.id)}
              showCategorizedImages={true}
              priority={index === 0}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="mb-4 text-6xl">🏠</div>
          <h2 className="text-2xl font-bold mb-2">No properties found</h2>
          <p className="text-muted-foreground mb-8">
            We couldn't find any properties in {location}. Try another location or adjust your filters.
          </p>
          <Button 
            className="bg-gradient-to-r from-lightGreen to-mediumGreen text-darkGreen hover:opacity-90"
            onClick={() => window.history.back()}
          >
            Go Back
          </Button>
        </div>
      )}
        </div>
      </div>
    </div>
  )
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SearchResults />
    </Suspense>
  )
}
