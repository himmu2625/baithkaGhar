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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

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
    todayArrivals: number
    todayDepartures: number
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
        <div className="mt-4 lg:mt-0">
          <Button>
            <Star className="h-4 w-4 mr-2" />
            Quick Actions
          </Button>
        </div>
      </div>

      {/* Key Metrics Cards */}
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
              Total Bookings
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {propertyData.metrics.totalBookings}
            </div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Dashboard Content with Accordions */}
      <Accordion
        type="multiple"
        defaultValue={["overview", "bookings", "arrivals"]}
        className="w-full"
      >
        {/* Property Overview */}
        <AccordionItem value="overview">
          <AccordionTrigger className="text-lg font-semibold">
            <div className="flex items-center">
              <BedIcon className="h-5 w-5 mr-2" />
              Property Overview & Details
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Basic Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-medium">Description</h4>
                    <p className="text-sm text-gray-600 mt-1">
                      {propertyData.description}
                    </p>
                  </div>
                  <Separator />
                  <div>
                    <h4 className="font-medium">Complete Address</h4>
                    <div className="text-sm text-gray-600 mt-1">
                      <p>{propertyData.address.street}</p>
                      <p>
                        {propertyData.address.city},{" "}
                        {propertyData.address.state}
                      </p>
                      <p>
                        {propertyData.address.zipCode},{" "}
                        {propertyData.address.country}
                      </p>
                    </div>
                  </div>
                  <Separator />
                  <div>
                    <h4 className="font-medium">Pricing Structure</h4>
                    <div className="text-sm text-gray-600 mt-1">
                      <p>
                        Base Price: {formatCurrency(propertyData.price.base)}
                      </p>
                      {propertyData.price.cleaning && (
                        <p>
                          Cleaning Fee:{" "}
                          {formatCurrency(propertyData.price.cleaning)}
                        </p>
                      )}
                      {propertyData.price.service && (
                        <p>
                          Service Fee:{" "}
                          {formatCurrency(propertyData.price.service)}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Room Configuration</CardTitle>
                </CardHeader>
                <CardContent>
                  {propertyData.propertyUnits &&
                  propertyData.propertyUnits.length > 0 ? (
                    <div className="space-y-3">
                      {propertyData.propertyUnits.map((unit, index) => (
                        <div key={index} className="border rounded-lg p-3">
                          <div className="flex justify-between items-start">
                            <div>
                              <h5 className="font-medium">
                                {unit.unitTypeName}
                              </h5>
                              <p className="text-sm text-gray-600">
                                Code: {unit.unitTypeCode}
                              </p>
                              <p className="text-sm text-gray-600">
                                Count: {unit.count}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-medium">
                                {formatCurrency(parseInt(unit.pricing.price))}
                                /night
                              </p>
                              <p className="text-xs text-gray-600">
                                {formatCurrency(
                                  parseInt(unit.pricing.pricePerWeek)
                                )}
                                /week
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-600">
                      Total Rooms: {propertyData.totalHotelRooms}
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          </AccordionContent>
        </AccordionItem>

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
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Arrivals */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <TrendingUp className="h-4 w-4 mr-2 text-green-600" />
                    Arrivals ({propertyData.metrics.todayArrivals})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {propertyData.bookings.arrivals.length > 0 ? (
                    <div className="space-y-3">
                      {propertyData.bookings.arrivals.map((booking, index) => (
                        <div key={index} className="border rounded-lg p-3">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium">
                                {booking.userId?.name || "Guest"}
                              </p>
                              <p className="text-sm text-gray-600">
                                {booking.userId?.email}
                              </p>
                              <p className="text-sm text-gray-600">
                                {booking.userId?.phone}
                              </p>
                            </div>
                            <div className="text-right">
                              <Badge variant="outline">
                                {new Date(
                                  booking.checkInDate
                                ).toLocaleDateString()}
                              </Badge>
                              <p className="text-sm text-gray-600 mt-1">
                                {booking.totalGuests} guests
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-600">No arrivals today</p>
                  )}
                </CardContent>
              </Card>

              {/* Departures */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <TrendingDown className="h-4 w-4 mr-2 text-blue-600" />
                    Departures ({propertyData.metrics.todayDepartures})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {propertyData.bookings.departures.length > 0 ? (
                    <div className="space-y-3">
                      {propertyData.bookings.departures.map(
                        (booking, index) => (
                          <div key={index} className="border rounded-lg p-3">
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="font-medium">
                                  {booking.userId?.name || "Guest"}
                                </p>
                                <p className="text-sm text-gray-600">
                                  {booking.userId?.email}
                                </p>
                                <p className="text-sm text-gray-600">
                                  {booking.userId?.phone}
                                </p>
                              </div>
                              <div className="text-right">
                                <Badge variant="outline">
                                  {new Date(
                                    booking.checkOutDate
                                  ).toLocaleDateString()}
                                </Badge>
                                <p className="text-sm text-gray-600 mt-1">
                                  {booking.totalGuests} guests
                                </p>
                              </div>
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-600">No departures today</p>
                  )}
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
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Guest</TableHead>
                      <TableHead>Check-in</TableHead>
                      <TableHead>Check-out</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Booked</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {propertyData.bookings.recent.map((booking, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <div>
                            <p className="font-medium">
                              {booking.userId?.name || "Guest"}
                            </p>
                            <p className="text-sm text-gray-600">
                              {booking.userId?.email}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          {booking.checkInDate
                            ? new Date(booking.checkInDate).toLocaleDateString()
                            : "-"}
                        </TableCell>
                        <TableCell>
                          {booking.checkOutDate
                            ? new Date(
                                booking.checkOutDate
                              ).toLocaleDateString()
                            : "-"}
                        </TableCell>
                        <TableCell>
                          {formatCurrency(booking.totalAmount || 0)}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={getStatusBadgeVariant(booking.status)}
                          >
                            {booking.status || "pending"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-gray-600">
                          {new Date(booking.createdAt).toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </AccordionContent>
        </AccordionItem>

        {/* Amenities */}
        <AccordionItem value="amenities">
          <AccordionTrigger className="text-lg font-semibold">
            <div className="flex items-center">
              <Star className="h-5 w-5 mr-2" />
              Amenities & Features
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <Card>
              <CardContent className="pt-6">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {Object.entries(propertyData.generalAmenities).map(
                    ([key, value]) => (
                      <div key={key} className="flex items-center space-x-2">
                        <div
                          className={`w-3 h-3 rounded-full ${
                            value ? "bg-green-500" : "bg-gray-300"
                          }`}
                        ></div>
                        <span className="text-sm capitalize">
                          {key.replace(/([A-Z])/g, " $1").trim()}
                        </span>
                      </div>
                    )
                  )}
                </div>
              </CardContent>
            </Card>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  )
}

