"use client"

import { useParams, useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Star, Users } from "lucide-react"
import Image from "next/image"
import { useLoginPrompt } from "@/hooks/use-login-prompt"
import { STAY_TYPES, getStayTypeById } from "@/lib/constants/stay-types"

interface Property {
  id: string
  title: string
  location: string
  price: number
  rating: number
  reviews: number
  image: string
  stayTypes: string[]
  bedrooms?: number
  bathrooms?: number
  maxGuests?: number
  amenities?: string[]
}

export default function StayTypePage() {
  const params = useParams()
  const router = useRouter()
  const { promptLogin } = useLoginPrompt()
  const stayTypeId = params?.id as string || "corporate-stay"
  
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const stayType = getStayTypeById(stayTypeId)
  
  // If invalid stay type, redirect to corporate stay
  useEffect(() => {
    if (!stayType) {
      router.replace('/stay-types/corporate-stay')
      return
    }
  }, [stayType, router])

  // Fetch properties for this stay type
  useEffect(() => {
    if (!stayType) return

    const fetchProperties = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/properties/by-stay-type?stayType=${stayTypeId}`)
        
        if (!response.ok) {
          throw new Error('Failed to fetch properties')
        }
        
        const data = await response.json()
        
        if (data.success) {
          setProperties(data.properties || [])
        } else {
          setError(data.message || 'Failed to load properties')
        }
      } catch (error) {
        console.error('Error fetching properties:', error)
        setError('Failed to load properties. Please try again later.')
      } finally {
        setLoading(false)
      }
    }

    fetchProperties()
  }, [stayTypeId, stayType])

  if (!stayType) {
    return null // Will redirect
  }

  return (
    <main className="pt-24 md:pt-28 pb-16">
      <div className="container mx-auto px-4">
        <Button variant="ghost" className="mb-4 text-darkGreen hover:text-mediumGreen" onClick={() => router.back()}>
          ← Back
        </Button>

        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div 
              className="p-3 rounded-full" 
              style={{ backgroundColor: stayType.color }}
            >
              <div className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-darkGreen">{stayType.label}</h1>
          </div>
          <p className="text-mediumGreen text-lg">{stayType.description}</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-mediumGreen"></div>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-600 mb-4">{error}</p>
            <Button 
              onClick={() => window.location.reload()} 
              className="bg-mediumGreen hover:bg-darkGreen text-white"
            >
              Try Again
            </Button>
          </div>
        ) : properties.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 mb-4">No properties available for {stayType.label} currently.</p>
            <Button 
              onClick={() => router.push('/search')} 
              className="bg-mediumGreen hover:bg-darkGreen text-white"
            >
              Browse All Properties
            </Button>
          </div>
        ) : (
          <>
            <h2 className="text-2xl font-bold text-darkGreen mb-6">
              Properties for {stayType.label} ({properties.length})
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {properties.map((property) => (
                <Card
                  key={property.id}
                  className="overflow-hidden border-lightGreen/30 hover:border-lightGreen transition-all duration-300 cursor-pointer"
                  onClick={() => router.push(`/property/${property.id}`)}
                >
                  <div className="relative h-48 overflow-hidden">
                    <Image
                      src={property.image || "/placeholder.svg"}
                      alt={property.title}
                      fill
                      className="object-cover transition-transform duration-500 hover:scale-110"
                    />
                    <Badge className="absolute top-2 right-2 bg-lightGreen text-darkGreen">
                      ₹{(
                        typeof property.price === 'object' && property.price !== null
                          ? (property.price as { base: number }).base
                          : property.price
                      ).toLocaleString()}/night
                    </Badge>
                    {property.rating > 0 && (
                      <Badge className="absolute top-2 left-2 bg-white/90 text-darkGreen">
                        <Star className="h-3 w-3 mr-1 fill-yellow-400 text-yellow-400" />
                        {property.rating}
                      </Badge>
                    )}
                  </div>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-bold text-darkGreen hover:text-mediumGreen transition-colors line-clamp-2">
                        {property.title}
                      </h3>
                    </div>
                    <p className="text-sm text-grayText mb-2">{property.location}</p>
                    
                    {property.maxGuests && (
                      <div className="flex items-center text-sm text-grayText mb-3">
                        <Users className="h-4 w-4 mr-1 text-mediumGreen" />
                        <span>Up to {property.maxGuests} guests</span>
                        {property.bedrooms && (
                          <>
                            <span className="mx-2">•</span>
                            <span>{property.bedrooms} bed{property.bedrooms > 1 ? 's' : ''}</span>
                          </>
                        )}
                      </div>
                    )}

                    {/* Show other stay types this property supports */}
                    {property.stayTypes && property.stayTypes.length > 1 && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {property.stayTypes
                          .filter(type => type !== stayTypeId)
                          .slice(0, 2)
                          .map(typeId => {
                            const type = getStayTypeById(typeId)
                            return type ? (
                              <Badge key={typeId} variant="outline" className="text-xs">
                                {type.label}
                              </Badge>
                            ) : null
                          })}
                        {property.stayTypes.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{property.stayTypes.length - 3} more
                          </Badge>
                        )}
                      </div>
                    )}

                    <Button
                      className="w-full bg-mediumGreen hover:bg-darkGreen text-lightYellow transition-all duration-300"
                      onClick={(e) => {
                        e.stopPropagation()
                        router.push(`/property/${property.id}`)
                      }}
                    >
                      View Details
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}
      </div>
    </main>
  )
}
