"use client"

export const dynamic = 'force-dynamic';

import { useState, useEffect, useMemo, Suspense } from "react"
import { useSearchParams } from "next/navigation"
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
  name: string
  location: string
  price: number
  rating: number
  image: string
  amenities: string[]
}

// Client component for search results
function SearchResults() {
  const searchParams = useSearchParams()
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
        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 1500))

        // Mock data based on search parameters
        const mockResults: SearchResult[] = [
          {
            id: "1",
            name: "Luxury Suite at Beachfront Resort",
            location: location,
            price: 12500,
            rating: 4.8,
            image: `/placeholder.svg?height=300&width=500&query=Luxury%20Hotel%20in%20${location}`,
            amenities: ["Free WiFi", "Swimming Pool", "Spa", "Restaurant", "Room Service"],
          },
          {
            id: "2",
            name: "Deluxe Room with City View",
            location: location,
            price: 8500,
            rating: 4.5,
            image: `/placeholder.svg?height=300&width=500&query=City%20View%20Hotel%20in%20${location}`,
            amenities: ["Free WiFi", "Gym", "Restaurant", "Air Conditioning"],
          },
          {
            id: "3",
            name: "Premium Villa with Private Pool",
            location: location,
            price: 18000,
            rating: 4.9,
            image: `/placeholder.svg?height=300&width=500&query=Villa%20with%20Pool%20in%20${location}`,
            amenities: ["Private Pool", "Free WiFi", "Kitchen", "Garden", "BBQ"],
          },
          {
            id: "4",
            name: "Standard Double Room",
            location: location,
            price: 5500,
            rating: 4.2,
            image: `/placeholder.svg?height=300&width=500&query=Standard%20Hotel%20in%20${location}`,
            amenities: ["Free WiFi", "TV", "Air Conditioning"],
          },
          {
            id: "5",
            name: "Heritage Haveli Suite",
            location: location,
            price: 15000,
            rating: 4.7,
            image: `/placeholder.svg?height=300&width=500&query=Heritage%20Hotel%20in%20${location}`,
            amenities: ["Free WiFi", "Restaurant", "Spa", "Cultural Activities"],
          },
          {
            id: "6",
            name: "Budget Friendly Homestay",
            location: location,
            price: 3500,
            rating: 4.0,
            image: `/placeholder.svg?height=300&width=500&query=Homestay%20in%20${location}`,
            amenities: ["Free WiFi", "Kitchen", "Local Guide"],
          },
        ]

        setResults(mockResults)

        // Track this search in the database
        const searchData = {
          searchTerm: location,
          location: location,
          checkIn: checkIn ? format(checkIn, 'yyyy-MM-dd') : undefined,
          checkOut: checkOut ? format(checkOut, 'yyyy-MM-dd') : undefined,
          guests: Number(guests),
        }
        
        // Track if we have results or not
        const hasResults = mockResults.length > 0
        
        // Track all searches for analytics
        trackAllSearches(
          searchData,
          hasResults,
          mockResults.length,
          session
        ).catch(err => console.error('Error tracking search', err))
        
        // If no results, track as a search for unlisted property
        if (!hasResults) {
          trackPropertySearch(searchData, session)
            .catch(err => console.error('Error tracking property search', err))
        }
      } catch (error) {
        console.error("Error fetching search results:", error)
      } finally {
        setLoading(false)
      }
    }

    if (location) {
      fetchResults()
    }
  }, [location, checkIn, checkOut, guests, session])

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
            <Card key={result.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <div className="relative h-[200px]">
                <Image src={result.image || "/placeholder.svg"} alt={result.name} fill className="object-cover" />
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2 bg-white/80 hover:bg-white rounded-full"
                  onClick={() => toggleFavorite(result.id)}
                >
                  <Heart
                    className={`h-5 w-5 ${favorites.includes(result.id) ? "fill-red-500 text-red-500" : "text-gray-600"}`}
                  />
                </Button>
              </div>
              <CardHeader>
                <CardTitle className="line-clamp-1">{result.name}</CardTitle>
                <div className="flex items-center text-sm text-muted-foreground">
                  <MapPin className="mr-1 h-4 w-4" />
                  {result.location}
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center mb-2">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 mr-1" />
                  <span className="font-medium">{result.rating}</span>
                  <span className="text-muted-foreground text-sm ml-1">(120+ reviews)</span>
                </div>
                <div className="flex flex-wrap gap-1 mb-3">
                  {result.amenities.slice(0, 3).map((amenity, index) => (
                    <span key={index} className="text-xs bg-lightGreen/10 text-darkGreen px-2 py-1 rounded-full">
                      {amenity}
                    </span>
                  ))}
                  {result.amenities.length > 3 && (
                    <span className="text-xs bg-lightGreen/10 text-darkGreen px-2 py-1 rounded-full">
                      +{result.amenities.length - 3} more
                    </span>
                  )}
                </div>
                <div className="text-xl font-bold text-darkGreen">
                  ₹{result.price.toLocaleString()}
                  <span className="text-sm font-normal text-muted-foreground"> / night</span>
                </div>
              </CardContent>
              <CardFooter>
                <Button className="w-full bg-mediumGreen hover:bg-mediumGreen/80 text-lightYellow">View Details</Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="mb-4 text-muted-foreground">
            <MapPin className="h-12 w-12 mx-auto mb-2" />
            <h2 className="text-2xl font-bold">No properties found</h2>
          </div>
          <p className="mb-6">We couldn't find any properties matching your search criteria.</p>
          <Button onClick={() => window.history.back()}>Go Back</Button>
        </div>
      )}
    </div>
  )
}

// Main page component with Suspense boundary
export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="container mx-auto py-24 px-4">
        <div className="animate-pulse">
          <div className="h-8 w-1/3 bg-gray-200 rounded mb-8"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((index) => (
              <div key={index} className="h-[400px] bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    }>
      <SearchResults />
    </Suspense>
  )
}
