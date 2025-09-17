"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Activity, RefreshCw, AlertTriangle } from "lucide-react"
import { useParams } from "next/navigation"
import { useOSAuth } from "@/hooks/use-os-auth"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface PropertyData {
  property: {
    id: string
    name: string
    address: any
    type: string
    totalRooms: number
    verificationStatus: string
  }
  metrics: {
    totalRooms: number
    occupiedRooms: number
    occupancyRate: number
    todayRevenue: number
    revenueChange: number
    todayBookings: number
    arrivals: number
    departures: number
  }
  bookings: {
    today: any[]
    arrivals: any[]
    departures: any[]
    recent: any[]
  }
  alerts: {
    type: string
    message: string
    severity: string
    count: number
  }[]
  timestamp: string
}

export function RealTimeDashboard() {
  const params = useParams()
  const { user } = useOSAuth()
  const [propertyData, setPropertyData] = useState<PropertyData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const propertyId = params.id as string

  const fetchPropertyData = async () => {
    if (!propertyId) return
    
    setIsLoading(true)
    setError(null)
    
    try {
      const response = await fetch(`/api/properties/${propertyId}`)
      
      if (!response.ok) {
        throw new Error(`Failed to fetch property data: ${response.status}`)
      }
      
      const data = await response.json()
      
      if (data.success && data.data) {
        console.log('Property data fetched:', data.data)
        setPropertyData(data.data)
        setLastUpdated(new Date())
      } else {
        throw new Error(data.message || 'Failed to fetch property data')
      }
    } catch (err) {
      console.error('Error fetching property data:', err)
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  // Fetch data on component mount
  useEffect(() => {
    fetchPropertyData()
    
    // Set up polling every 30 seconds
    const interval = setInterval(() => {
      fetchPropertyData()
    }, 30000)
    
    return () => clearInterval(interval)
  }, [propertyId])

  if (isLoading && !propertyData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Activity className="w-5 h-5" />
            <span>Real-time Data</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-8 w-32 mb-2" />
          <Skeleton className="h-4 w-48" />
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            <span>Data Error</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <Button 
            variant="outline" 
            size="sm" 
            className="mt-4"
            onClick={fetchPropertyData}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Activity className="w-5 h-5 text-green-500" />
            <span>Real-time Property Data</span>
          </div>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={fetchPropertyData}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {propertyData && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Property</h3>
                  <p className="text-lg font-semibold">{propertyData.property.name}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Occupancy</h3>
                  <p className="text-lg font-semibold">{propertyData.metrics.occupancyRate}%</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Today's Revenue</h3>
                  <p className="text-lg font-semibold">₹{propertyData.metrics.todayRevenue.toLocaleString()}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Today's Bookings</h3>
                  <p className="text-lg font-semibold">{propertyData.metrics.todayBookings}</p>
                </div>
              </div>
              
              <div className="text-xs text-gray-500 mt-2">
                Last updated: {lastUpdated ? lastUpdated.toLocaleTimeString() : 'Never'}
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
