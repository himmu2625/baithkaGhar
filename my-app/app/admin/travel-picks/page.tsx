"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { 
  TrendingUp, 
  RefreshCw, 
  Award, 
  Star, 
  Users, 
  IndianRupee, 
  Calendar, 
  BarChart3, 
  Hand, 
  Bot,
  Search,
  ImageOff
} from "lucide-react"
import { toast } from "sonner"
import Image from "next/image"

interface TravelPickData {
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
    propertyType: string;
    maxGuests: number;
    bedrooms: number;
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
  isManuallySelected?: boolean;
  updatedAt: string;
}

interface PropertyData {
  _id: string;
  title: string;
  location: string;
  price: number;
  rating: number;
  reviewCount: number;
  propertyType: string;
  maxGuests: number;
  bedrooms: number;
  image: string | null;
}

export default function TravelPicksAdmin() {
  const [travelPicks, setTravelPicks] = useState<TravelPickData[]>([])
  const [availableProperties, setAvailableProperties] = useState<PropertyData[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [loadingProperties, setLoadingProperties] = useState(false)
  const [isManualMode, setIsManualMode] = useState(false)
  const [selectedPropertyIds, setSelectedPropertyIds] = useState<string[]>([])
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    fetchTravelPicks()
  }, [])

  useEffect(() => {
    if (isManualMode && availableProperties.length === 0) {
      fetchAvailableProperties()
    }
  }, [isManualMode, availableProperties.length])

  useEffect(() => {
    // Check if current travel picks are manually selected
    if (travelPicks.length > 0) {
      const hasManualPicks = travelPicks.some(pick => pick.isManuallySelected)
      if (hasManualPicks && !isManualMode) {
        setIsManualMode(true)
        setSelectedPropertyIds(travelPicks.map(pick => pick.propertyId._id))
      }
    }
  }, [travelPicks, isManualMode])

  const fetchTravelPicks = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/travel-picks')
      const data = await response.json()
      
      if (data.success) {
        setTravelPicks(data.data || [])
      } else {
        toast.error('Failed to fetch travel picks')
      }
    } catch (error) {
      console.error('Error fetching travel picks:', error)
      toast.error('Error fetching travel picks')
    } finally {
      setLoading(false)
    }
  }

  const fetchAvailableProperties = async () => {
    try {
      setLoadingProperties(true)
      const response = await fetch('/api/admin/properties/available')
      const data = await response.json()
      
      if (data.success) {
        setAvailableProperties(data.data || [])
      } else {
        toast.error('Failed to fetch available properties')
      }
    } catch (error) {
      console.error('Error fetching properties:', error)
      toast.error('Error fetching properties')
    } finally {
      setLoadingProperties(false)
    }
  }

  const updateTravelPicks = async () => {
    try {
      setUpdating(true)
      const response = await fetch('/api/admin/travel-picks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isAdminRequest: true })
      })
      
      const data = await response.json()
      
      if (data.success) {
        toast.success('Travel picks updated successfully!')
        setIsManualMode(false) // Switch back to automatic mode
        setSelectedPropertyIds([])
        await fetchTravelPicks()
      } else {
        toast.error(data.error || 'Failed to update travel picks')
      }
    } catch (error) {
      console.error('Error updating travel picks:', error)
      toast.error('Error updating travel picks')
    } finally {
      setUpdating(false)
    }
  }

  const saveManualSelection = async () => {
    if (selectedPropertyIds.length === 0) {
      toast.error('Please select at least one property')
      return
    }

    if (selectedPropertyIds.length > 5) {
      toast.error('Cannot select more than 5 properties')
      return
    }

    try {
      setUpdating(true)
      toast.loading('Saving your Travel Picks selection...', { id: 'saving-travel-picks' })
      
      const response = await fetch('/api/admin/travel-picks', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ selectedPropertyIds })
      })
      
      const data = await response.json()
      
      if (data.success) {
        toast.success(
          `🎉 Successfully saved ${selectedPropertyIds.length} properties as Travel Picks! They will now appear on your homepage.`, 
          { 
            id: 'saving-travel-picks',
            duration: 5000 
          }
        )
        await fetchTravelPicks()
        // Don't clear selection immediately so user can see what was saved
        setTimeout(() => {
          setSelectedPropertyIds([])
        }, 2000)
      } else {
        toast.error(data.error || 'Failed to save Travel Picks selection', { id: 'saving-travel-picks' })
      }
    } catch (error) {
      console.error('Error saving manual selection:', error)
      toast.error('Network error: Failed to save Travel Picks selection', { id: 'saving-travel-picks' })
    } finally {
      setUpdating(false)
    }
  }

  const handlePropertySelection = (propertyId: string, isSelected: boolean) => {
    if (isSelected) {
      if (selectedPropertyIds.length >= 5) {
        toast.error('Cannot select more than 5 properties')
        return
      }
      setSelectedPropertyIds([...selectedPropertyIds, propertyId])
    } else {
      setSelectedPropertyIds(selectedPropertyIds.filter(id => id !== propertyId))
    }
  }

  const filteredProperties = availableProperties.filter(property =>
    property.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    property.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
    property.propertyType.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            {[1,2,3,4,5].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-darkGreen flex items-center">
            <TrendingUp className="mr-2 h-8 w-8 text-mediumGreen" />
            Travel Picks Management
          </h1>
          <p className="text-mediumGreen mt-2">
            Manage the top 5 properties displayed on the homepage
          </p>
        </div>
      </div>

      {/* Mode Toggle */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center">
            Selection Mode
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-4">
            <Button
              variant={!isManualMode ? "default" : "outline"}
              onClick={() => {
                setIsManualMode(false)
                setSelectedPropertyIds([])
              }}
              className={!isManualMode ? "bg-mediumGreen hover:bg-darkGreen text-lightYellow" : ""}
              disabled={updating}
            >
              <Bot className="mr-2 h-4 w-4" />
              Automatic Ranking
            </Button>
            <Button
              variant={isManualMode ? "default" : "outline"}
              onClick={() => setIsManualMode(true)}
              className={isManualMode ? "bg-mediumGreen hover:bg-darkGreen text-lightYellow" : ""}
              disabled={updating}
            >
              <Hand className="mr-2 h-4 w-4" />
              Manual Selection
            </Button>
          </div>
          <p className="text-sm text-gray-600 mt-2">
            {isManualMode 
              ? "Manually select up to 5 properties from your available listings"
              : "Automatically rank properties based on ratings, bookings, and performance metrics"
            }
          </p>
        </CardContent>
      </Card>

      {isManualMode ? (
        /* Manual Selection Mode */
        <div className={`space-y-6 ${selectedPropertyIds.length > 0 ? 'pb-32' : ''}`}>
          {/* Submit Section - Always Visible */}
          {selectedPropertyIds.length > 0 && (
            <Card className="border-green-200 bg-green-50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="bg-green-100 p-2 rounded-full">
                      <Hand className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-green-800">
                        {selectedPropertyIds.length} Properties Selected
                      </h3>
                      <p className="text-sm text-green-600">
                        Ready to save your Travel Picks selection
                      </p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      onClick={() => setSelectedPropertyIds([])}
                      variant="outline"
                      className="border-green-300 text-green-700 hover:bg-green-100"
                      disabled={updating}
                    >
                      Clear All
                    </Button>
                    <Button
                      onClick={saveManualSelection}
                      disabled={updating}
                      className="bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-2"
                    >
                      {updating ? (
                        <>
                          <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                          Saving Selection...
                        </>
                      ) : (
                        <>
                          <Award className="mr-2 h-4 w-4" />
                          Save as Travel Picks
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Hand className="mr-2 h-5 w-5" />
                Select Properties for Travel Picks ({selectedPropertyIds.length}/5)
                {selectedPropertyIds.length === 5 && (
                  <Badge className="ml-3 bg-green-100 text-green-800">
                    Maximum Reached
                  </Badge>
                )}
              </CardTitle>
              <p className="text-sm text-gray-600 mt-2">
                Choose up to 5 properties to feature in your Travel Picks section. 
                {selectedPropertyIds.length === 0 && " Start by selecting properties below."}
                {selectedPropertyIds.length > 0 && selectedPropertyIds.length < 5 && 
                  ` You can select ${5 - selectedPropertyIds.length} more properties.`}
                {selectedPropertyIds.length === 5 && " You've reached the maximum limit."}
              </p>
            </CardHeader>
            <CardContent>
              {/* Search */}
              <div className="mb-6">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    type="text"
                    placeholder="Search properties by name, location, or type..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {loadingProperties ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[1,2,3].map((i) => (
                    <div key={i} className="border rounded-lg p-4 animate-pulse">
                      <div className="h-40 bg-gray-200 rounded mb-4"></div>
                      <div className="space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredProperties.map((property) => (
                    <Card 
                      key={property._id} 
                      className={`cursor-pointer transition-all hover:shadow-md relative ${
                        selectedPropertyIds.includes(property._id) 
                          ? 'border-2 border-green-500 bg-green-50 shadow-lg' 
                          : 'border hover:border-gray-300'
                      }`}
                      onClick={(e) => {
                        // Prevent card click when clicking on checkbox
                        if (e.target instanceof HTMLElement && 
                            (e.target.closest('[role="checkbox"]') || e.target.closest('button'))) {
                          return;
                        }
                        handlePropertySelection(
                          property._id, 
                          !selectedPropertyIds.includes(property._id)
                        );
                      }}
                    >
                      <CardContent className="p-4">
                        {selectedPropertyIds.includes(property._id) && (
                          <div className="absolute top-2 right-2 z-10 flex flex-col space-y-1">
                            <Badge className="bg-green-600 text-white">
                              #{selectedPropertyIds.indexOf(property._id) + 1}
                            </Badge>
                            <Badge className="bg-blue-600 text-white text-xs">
                              <Award className="h-2 w-2 mr-1" />
                              Selected
                            </Badge>
                          </div>
                        )}
                        <div className="flex items-start space-x-3">
                          <Checkbox
                            checked={selectedPropertyIds.includes(property._id)}
                            onCheckedChange={(checked) => 
                              handlePropertySelection(property._id, checked === true)
                            }
                            className="mt-1"
                          />
                          <div className="flex-1">
                            {/* Property Image */}
                            <div className="w-full h-32 bg-gray-200 rounded-lg mb-3 overflow-hidden">
                              {property.image ? (
                                <Image
                                  src={property.image}
                                  alt={property.title}
                                  width={200}
                                  height={128}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <ImageOff className="h-8 w-8 text-gray-400" />
                                </div>
                              )}
                            </div>

                            {/* Property Details */}
                            <h3 className="font-semibold text-sm mb-1 line-clamp-2">
                              {property.title}
                            </h3>
                            <p className="text-xs text-gray-600 mb-2">
                              📍 {property.location}
                            </p>
                            
                            <div className="space-y-1">
                              <div className="flex items-center justify-between text-xs">
                                <span className="flex items-center">
                                  <Star className="h-3 w-3 text-yellow-500 mr-1" />
                                  {property.rating.toFixed(1)} ({property.reviewCount})
                                </span>
                                <span className="font-semibold text-mediumGreen">
                                  ₹{property.price.toLocaleString()}/night
                                </span>
                              </div>
                              <div className="flex items-center text-xs text-gray-600">
                                <Users className="h-3 w-3 mr-1" />
                                {property.maxGuests} guests • {property.bedrooms} bedrooms
                              </div>
                              <Badge variant="outline" className="text-xs">
                                {property.propertyType}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {!loadingProperties && filteredProperties.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-gray-500">No properties found matching your search.</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Sticky Submit Bar */}
          {selectedPropertyIds.length > 0 && (
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg z-50">
              <div className="container mx-auto px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="bg-green-100 p-2 rounded-full">
                      <Award className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800">
                        {selectedPropertyIds.length} Properties Selected for Travel Picks
                      </h3>
                      <p className="text-sm text-gray-600">
                        {selectedPropertyIds.length === 5 ? "Maximum reached" : 
                         `You can select ${5 - selectedPropertyIds.length} more properties`}
                      </p>
                    </div>
                  </div>
                  <div className="flex space-x-3">
                    <Button
                      onClick={() => setSelectedPropertyIds([])}
                      variant="outline"
                      disabled={updating}
                    >
                      Clear All
                    </Button>
                    <Button
                      onClick={saveManualSelection}
                      disabled={updating}
                      className="bg-green-600 hover:bg-green-700 text-white font-semibold px-8 py-2"
                    >
                      {updating ? (
                        <>
                          <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Award className="mr-2 h-4 w-4" />
                          Save Travel Picks ({selectedPropertyIds.length})
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Automatic Mode */
        <div className="space-y-6">
          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2">
            <Button 
              onClick={updateTravelPicks}
              disabled={updating}
              className="bg-mediumGreen hover:bg-darkGreen text-lightYellow"
            >
              {updating ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Update Rankings
                </>
              )}
            </Button>
          </div>

          {/* Current Travel Picks */}
          {travelPicks.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center">
                <TrendingUp className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold text-gray-600 mb-2">No Travel Picks Found</h3>
                <p className="text-gray-500 mb-4">
                  No travel picks have been set up yet. Click "Update Rankings" to initialize them based on your current properties.
                </p>
                <Button 
                  onClick={updateTravelPicks}
                  disabled={updating}
                  className="bg-mediumGreen hover:bg-darkGreen text-lightYellow"
                >
                  Update Rankings
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {travelPicks.map((pick) => (
                <Card key={pick._id} className="border-l-4 border-l-mediumGreen">
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center">
                        <Badge className="bg-mediumGreen text-lightYellow mr-3 flex items-center">
                          <Award className="h-3 w-3 mr-1" />
                          #{pick.rank}
                        </Badge>
                        {pick.propertyId.title}
                        {pick.isManuallySelected && (
                          <Badge variant="outline" className="ml-2 text-purple-600">
                            <Hand className="h-3 w-3 mr-1" />
                            Manual
                          </Badge>
                        )}
                      </CardTitle>
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline" className="text-darkGreen">
                          Score: {pick.score.toFixed(1)}
                        </Badge>
                        <Badge variant="outline" className="text-darkGreen">
                          {pick.propertyId.propertyType}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                      <div className="flex items-center space-x-2">
                        <Star className="h-4 w-4 text-yellow-500" />
                        <span className="text-sm">
                          {pick.metrics.rating.toFixed(1)} ({pick.metrics.reviewCount} reviews)
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Users className="h-4 w-4 text-mediumGreen" />
                        <span className="text-sm">
                          {pick.propertyId.maxGuests} guests • {pick.propertyId.bedrooms} bedrooms
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <IndianRupee className="h-4 w-4 text-green-600" />
                        <span className="text-sm">
                          ₹{pick.propertyId.price.base.toLocaleString()}/night
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-blue-600" />
                        <span className="text-sm">
                          {pick.metrics.bookingCount} total bookings
                        </span>
                      </div>
                    </div>

                    <Separator className="my-4" />

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-mediumGreen">
                          {pick.metrics.recentBookings}
                        </div>
                        <div className="text-xs text-gray-500">Recent Bookings (30d)</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">
                          ₹{(pick.metrics.revenue / 1000).toFixed(0)}K
                        </div>
                        <div className="text-xs text-gray-500">Total Revenue</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">
                          {(pick.metrics.occupancyRate * 100).toFixed(0)}%
                        </div>
                        <div className="text-xs text-gray-500">Occupancy Rate</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-600">
                          {pick.score.toFixed(1)}
                        </div>
                        <div className="text-xs text-gray-500">Overall Score</div>
                      </div>
                    </div>

                    <div className="mt-4 text-sm text-gray-500">
                      📍 {pick.propertyId.location} • Last updated: {new Date(pick.updatedAt).toLocaleDateString()}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Scoring Algorithm Info */}
          <Card className="border-blue-200 bg-blue-50">
            <CardHeader>
              <CardTitle className="flex items-center text-blue-800">
                <BarChart3 className="mr-2 h-5 w-5" />
                Automatic Scoring Algorithm
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-blue-700">
              <p className="mb-2">Travel picks are ranked based on a weighted scoring system:</p>
              <ul className="space-y-1">
                <li>• <strong>Rating (25%):</strong> Property star rating × 20 points</li>
                <li>• <strong>Reviews (15%):</strong> Review count × 2 points (max 100)</li>
                <li>• <strong>Bookings (30%):</strong> Total bookings × 10 points (max 100)</li>
                <li>• <strong>Recent Activity (20%):</strong> Last 30 days bookings × 20 points (max 100)</li>
                <li>• <strong>Revenue (10%):</strong> Total revenue ÷ 1000 points (max 100)</li>
              </ul>
              <p className="mt-2 text-xs">
                Rankings are automatically updated when you click "Update Rankings" or can be scheduled to run periodically.
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
} 