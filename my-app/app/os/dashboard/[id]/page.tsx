"use client"

import React, { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { useOSAuth } from "@/hooks/use-os-auth"
import { useRouter } from "next/navigation"
import { LoadingSpinner } from "@/components/os/common/loading-spinner"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Users,
  Calendar,
  IndianRupee,
  BedIcon,
  Clock,
  MapPin,
  Star,
} from "lucide-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Separator } from "@/components/ui/separator"
import { PropertyArrivalsDepartures } from "@/components/os/dashboard/property-arrivals-departures"
import { PropertyRecentBookings } from "@/components/os/dashboard/property-recent-bookings"

interface PropertyData {
  _id: string
  title: string
  description: string
  address: any
  price: any
  totalHotelRooms: string
  propertyUnits: any[]
  generalAmenities: any
  metrics: {
    totalRooms: number
    occupiedRooms: number
    occupancyRate: number
    todayRevenue: number
    monthlyRevenue: number
    revenueChange: number
    totalBookings: number
    inHouse: number
    todayArrivals: number
    todayDepartures: number
  }
  housekeeping?: {
    totalRooms: number
    clean: number
    dirty: number
    cleaningInProgress: number
    inspected: number
    maintenanceRequired: number
  }
  bookings: {
    recent: any[]
    arrivals: any[]
    departures: any[]
    total: number
  }
}

export default function PropertyDashboardPage() {
  const params = useParams()
  const { user, isAuthenticated, isLoading } = useOSAuth()
  const router = useRouter()
  const [propertyData, setPropertyData] = useState<PropertyData | null>(null)
  const [isLoadingData, setIsLoadingData] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const propertyId = params?.id as string

  useEffect(() => {
    const fetchPropertyData = async () => {
      try {
        setIsLoadingData(true)
        const response = await fetch(`/api/os/property/${propertyId}`)
        if (!response.ok) {
          throw new Error("Failed to fetch property data")
        }
        const data = await response.json()
        setPropertyData(data.property)
      } catch (error) {
        console.error("Error fetching property data:", error)
        setError("Failed to load property data")
      } finally {
        setIsLoadingData(false)
      }
    }

    if (propertyId && isAuthenticated) {
      fetchPropertyData()
    }
  }, [propertyId, isAuthenticated])

  // Authentication and access control
  useEffect(() => {
    if (!isLoading && isAuthenticated && user) {
      if (user.propertyId !== propertyId) {
        setError("You don't have access to this property")
      }
    } else if (!isLoading && !isAuthenticated) {
      router.push("/os/login")
    }
  }, [isLoading, isAuthenticated, user, propertyId, router])

  if (isLoading || isLoadingData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">Loading property dashboard...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="max-w-md w-full">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <div className="mt-4 text-center">
            <Button onClick={() => router.push("/os/login")} variant="outline">
              Return to login
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (!propertyData) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">Property data not found</p>
      </div>
    )
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status?.toLowerCase()) {
      case "confirmed":
        return "default"
      case "pending":
        return "secondary"
      case "cancelled":
        return "destructive"
      default:
        return "outline"
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {propertyData.title}
          </h1>
          <p className="text-gray-600 mt-2 flex items-center">
            <MapPin className="h-4 w-4 mr-1" />
            {propertyData.address.city}, {propertyData.address.state}
          </p>
        </div>
      </div>

      {/* Key Metrics Cards (PMS-focused) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <IndianRupee className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(propertyData.metrics.monthlyRevenue)}
            </div>
            <p className="text-xs text-muted-foreground flex items-center">
              {propertyData.metrics.revenueChange >= 0 ? (
                <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-500 mr-1" />
              )}
              {Math.abs(propertyData.metrics.revenueChange).toFixed(1)}% from
              last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Occupancy Rate
            </CardTitle>
            <BedIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {propertyData.metrics.occupancyRate}%
            </div>
            <p className="text-xs text-muted-foreground">
              {propertyData.metrics.occupiedRooms} of{" "}
              {propertyData.metrics.totalRooms} rooms occupied
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Today's Revenue
            </CardTitle>
            <IndianRupee className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(propertyData.metrics.todayRevenue)}
            </div>
            <p className="text-xs text-muted-foreground">
              From today's bookings
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              In-House Guests
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {propertyData.metrics.inHouse || 0}
            </div>
            <p className="text-xs text-muted-foreground">Currently staying</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Dashboard Content with Accordions */}
      <Accordion
        type="multiple"
        defaultValue={["arrivals", "bookings", "housekeeping"]}
        className="w-full"
      >
        {/* Today's Arrivals & Departures */}
        <AccordionItem value="arrivals">
          <AccordionTrigger className="text-lg font-semibold">
            <div className="flex items-center">
              <Clock className="h-5 w-5 mr-2" />
              Today's Arrivals & Departures
              <Badge variant="secondary" className="ml-2">
                {propertyData.metrics.todayArrivals +
                  propertyData.metrics.todayDepartures}
              </Badge>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <PropertyArrivalsDepartures
              arrivals={propertyData.bookings.arrivals}
              departures={propertyData.bookings.departures}
            />
          </AccordionContent>
        </AccordionItem>

        {/* Housekeeping Summary */}
        <AccordionItem value="housekeeping">
          <AccordionTrigger className="text-lg font-semibold">
            <div className="flex items-center">
              <BedIcon className="h-5 w-5 mr-2" />
              Housekeeping Summary
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Room Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="flex justify-between">
                      <span>Clean</span>
                      <span className="font-medium">
                        {propertyData.housekeeping?.clean || 0}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Dirty</span>
                      <span className="font-medium">
                        {propertyData.housekeeping?.dirty || 0}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Cleaning</span>
                      <span className="font-medium">
                        {propertyData.housekeeping?.cleaningInProgress || 0}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Inspected</span>
                      <span className="font-medium">
                        {propertyData.housekeeping?.inspected || 0}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Maintenance</span>
                      <span className="font-medium">
                        {propertyData.housekeeping?.maintenanceRequired || 0}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>In-House</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">
                    {propertyData.metrics.inHouse || 0}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Guests currently staying
                  </p>
                </CardContent>
              </Card>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Recent Bookings */}
        <AccordionItem value="bookings">
          <AccordionTrigger className="text-lg font-semibold">
            <div className="flex items-center">
              <Calendar className="h-5 w-5 mr-2" />
              Recent Bookings
              <Badge variant="secondary" className="ml-2">
                {propertyData.bookings.recent.length}
              </Badge>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <PropertyRecentBookings
              bookings={propertyData.bookings.recent}
              formatCurrency={formatCurrency}
              getStatusBadgeVariant={getStatusBadgeVariant}
            />
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  )
}
