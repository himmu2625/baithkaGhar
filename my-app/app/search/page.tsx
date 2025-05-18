"use client"

export const dynamic = 'force-dynamic';

import { useState, useEffect, useMemo, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { format } from "date-fns"
import { MapPin, Calendar, Users, Star, Heart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "../../components/ui/skeleton"
import Image from "next/image"
import { useLoginPrompt } from "@/hooks/use-login-prompt"
import { useSession } from "next-auth/react"
import { trackPropertySearch, trackAllSearches } from "@/lib/search-tracking"

interface SearchResult {
  id: string
  title: string
  location: string
  price: number
  rating: number
  thumbnail: string
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

  const location = searchParams?.get("location") || ""
  const checkIn = useMemo(() => searchParams?.get("checkIn") ? new Date(searchParams.get("checkIn") as string) : null, [searchParams]);
  const checkOut = useMemo(() => searchParams?.get("checkOut") ? new Date(searchParams.get("checkOut") as string) : null, [searchParams]);
  const guests = searchParams?.get("guests") || "1"
  const rooms = searchParams?.get("rooms") || "1"

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
        let data = await response.json()
        
        // If no properties found for specific city, try the general properties endpoint
        if (!data.properties || data.properties.length === 0) {
          response = await fetch(`/api/properties?${queryParams.toString()}`)
          data = await response.json()
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
  }, [location, checkIn, checkOut, guests]) // Removed 'session' from dependency array

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

  // Function to navigate to property details page
  const viewPropertyDetails = (propertyId: string) => {
    // Include search parameters in the URL to property details page
    const urlParams = new URLSearchParams();
    if (checkIn) urlParams.append('checkIn', checkIn.toISOString());
    if (checkOut) urlParams.append('checkOut', checkOut.toISOString());
    if (guests) urlParams.append('guests', guests.toString());
    if (rooms) urlParams.append('rooms', rooms.toString());
    
    // Navigate to property details with query parameters
    router.push(`/property/${propertyId}?${urlParams.toString()}`);
  }

  return (
    <div className="container mx-auto py-24 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">Search Results for {location}</h1>
        <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
          {checkIn && checkOut && (
            <div className="flex items-center">
              <Calendar className="mr-1 h-4 w-4" />
              {format(checkIn, "PP")} - {format(checkOut, "PP")}
            </div>
          )}
          <div className="flex items-center">
            <Users className="mr-1 h-4 w-4" />
            {guests} {Number.parseInt(guests) === 1 ? "Guest" : "Guests"}, {rooms}{" "}
            {Number.parseInt(rooms) === 1 ? "Room" : "Rooms"}
          </div>
        </div>
      </div>

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
      ) : results.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {results.map((result) => (
            <Card 
              key={result.id} 
              className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer relative group" 
              onClick={() => viewPropertyDetails(result.id)}
            >
              <div className="relative h-[200px]">
                <Image 
                  src={result.thumbnail || "/placeholder.svg"} 
                  alt={result.title} 
                  fill 
                  className="object-cover" 
                />
                <div className="absolute top-2 left-2 bg-lightGreen text-darkGreen px-2 py-1 rounded-full font-medium text-xs">
                  {result.type}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2 bg-white/80 hover:bg-white rounded-full z-10"
                  onClick={(e) => {
                    e.stopPropagation(); // Prevent property card click
                    toggleFavorite(result.id);
                  }}
                >
                  <Heart
                    className={`h-5 w-5 ${favorites.includes(result.id) ? "fill-red-500 text-red-500" : "text-gray-600"}`}
                  />
                </Button>
              </div>
              <CardHeader>
                <CardTitle className="line-clamp-1">{result.title}</CardTitle>
                <div className="flex items-center text-sm text-muted-foreground">
                  <MapPin className="mr-1 h-4 w-4" />
                  {result.city || 'Unknown'}
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center mb-2">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 mr-1" />
                  <span className="font-medium">{result.rating || 0}</span>
                  <span className="text-muted-foreground text-sm ml-1">(Reviews)</span>
                </div>
                <div className="flex flex-wrap gap-2 mb-3">
                  {result.bedrooms && (
                    <span className="text-xs bg-lightGreen/10 text-darkGreen px-2 py-1 rounded-full">
                      {result.bedrooms} {result.bedrooms === 1 ? 'Bedroom' : 'Bedrooms'}
                    </span>
                  )}
                  {result.bathrooms && (
                    <span className="text-xs bg-lightGreen/10 text-darkGreen px-2 py-1 rounded-full">
                      {result.bathrooms} {result.bathrooms === 1 ? 'Bathroom' : 'Bathrooms'}
                    </span>
                  )}
                  {result.maxGuests && (
                    <span className="text-xs bg-lightGreen/10 text-darkGreen px-2 py-1 rounded-full">
                      Up to {result.maxGuests} guests
                    </span>
                  )}
                </div>
                <div className="font-bold text-lg">
                  ₹{typeof result.price === 'object' ? (result.price as any).base : result.price}<span className="text-sm font-normal">/night</span>
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  className="w-full bg-gradient-to-r from-lightGreen to-mediumGreen text-darkGreen transition-all duration-300 hover:brightness-110 hover:scale-[1.02] z-10 relative"
                  onClick={(e) => {
                    e.stopPropagation(); // Prevent property card click
                    e.preventDefault(); // Prevent default button behavior
                    
                    // Skip if button was recently clicked (prevent double-clicks)
                    const now = Date.now();
                    const lastClicked = parseInt(sessionStorage.getItem(`lastBookClick-${result.id}`) || '0');
                    if (now - lastClicked < 2000) { // 2 second debounce
                      return;
                    }
                    
                    // Store last click time
                    sessionStorage.setItem(`lastBookClick-${result.id}`, now.toString());
                    
                    // Check if user is logged in
                    if (!session) {
                      // First prompt for login
                      const shouldContinue = promptLogin();
                      // If login prompt is dismissed, don't proceed to booking
                      if (!shouldContinue) return;
                    }
                    
                    // Create URL with search parameters but don't navigate yet
                    const bookingUrl = `/booking?propertyId=${result.id}${checkIn ? `&checkIn=${checkIn.toISOString()}` : ''}${checkOut ? `&checkOut=${checkOut.toISOString()}` : ''}&guests=${guests}&rooms=${rooms}`;
                    
                    // Use router.push with a small delay to prevent rapid navigation
                    setTimeout(() => {
                      router.push(bookingUrl);
                    }, 100);
                  }}
                >
                  Book Now
                </Button>
              </CardFooter>
              {/* Overlay link for entire card */}
              <div className="absolute inset-0 z-0" onClick={() => viewPropertyDetails(result.id)}></div>
            </Card>
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
  )
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SearchResults />
    </Suspense>
  )
}
