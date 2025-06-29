"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { TrendingUp, RefreshCw, Award, Star, Users, IndianRupee, Calendar, BarChart3 } from "lucide-react"
import { toast } from "sonner"

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
  updatedAt: string;
}

export default function TravelPicksAdmin() {
  const [travelPicks, setTravelPicks] = useState<TravelPickData[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    fetchTravelPicks()
  }, [])

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
        await fetchTravelPicks() // Refresh the data
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

  const forceUpdateTravelPicks = async () => {
    try {
      setUpdating(true)
      const response = await fetch('/api/travel-picks/force-update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      })
      
      const data = await response.json()
      
      if (data.success) {
        toast.success(`Force updated with ${data.data.travelPicksCreated} properties!`)
        await fetchTravelPicks() // Refresh the data
      } else {
        toast.error(data.message || 'Failed to force update travel picks')
      }
    } catch (error) {
      console.error('Error force updating travel picks:', error)
      toast.error('Error force updating travel picks')
    } finally {
      setUpdating(false)
    }
  }

  const initializeAllProperties = async () => {
    try {
      setUpdating(true)
      const response = await fetch('/api/travel-picks/init-all', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      })
      
      const data = await response.json()
      
      if (data.success) {
        toast.success(`Initialized ${data.data.travelPicksCreated} properties successfully!`)
        await fetchTravelPicks() // Refresh the data
      } else {
        toast.error(data.message || 'Failed to initialize travel picks')
      }
    } catch (error) {
      console.error('Error initializing travel picks:', error)
      toast.error('Error initializing travel picks')
    } finally {
      setUpdating(false)
    }
  }

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
          
          <Button 
            onClick={initializeAllProperties}
            disabled={updating}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {updating ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Initializing...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Initialize All 3 Properties
              </>
            )}
          </Button>
          
          <Button 
            onClick={forceUpdateTravelPicks}
            disabled={updating}
            variant="outline"
            className="border-mediumGreen text-mediumGreen hover:bg-mediumGreen hover:text-lightYellow"
          >
            {updating ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Force Updating...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Force Update All
              </>
            )}
          </Button>
        </div>
      </div>

      {travelPicks.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <TrendingUp className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">No Travel Picks Found</h3>
            <p className="text-gray-500 mb-4">
              No travel picks have been set up yet. Click "Update Rankings" to initialize them based on your current properties.
            </p>
            <div className="space-x-2">
              <Button 
                onClick={initializeAllProperties}
                disabled={updating}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Initialize All 3 Properties
              </Button>
              <Button 
                onClick={updateTravelPicks}
                disabled={updating}
                variant="outline"
                className="border-mediumGreen text-mediumGreen hover:bg-mediumGreen hover:text-lightYellow"
              >
                Update Rankings
              </Button>
            </div>
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

      <Card className="mt-6 border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center text-blue-800">
            <BarChart3 className="mr-2 h-5 w-5" />
            Scoring Algorithm
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
  )
} 