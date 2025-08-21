"use client"

import React, { useState, useEffect, useCallback } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Calendar,
  Clock,
  User,
  MapPin,
  Phone,
  Mail,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Search,
  Filter,
  Users,
  CreditCard,
  MessageSquare,
  Car,
  Coffee,
  Utensils,
  Luggage,
  LogIn,
  LogOut,
  Star,
  ChevronRight,
} from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

interface GuestBooking {
  _id: string
  userId: {
    name: string
    email: string
    phone?: string
  }
  checkInDate: string
  checkOutDate: string
  totalGuests: number
  totalAmount: number
  status: string
  paymentStatus: string
  createdAt: string
  updatedAt: string
  specialRequests?: string
  roomPreferences?: string
}

interface JourneyStage {
  id: string
  name: string
  status: "completed" | "current" | "pending"
  timestamp?: string
  icon: React.ElementType
  description: string
}

export function RealGuestJourney() {
  const params = useParams()
  const propertyId = params.id as string
  
  const [bookings, setBookings] = useState<GuestBooking[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [selectedBooking, setSelectedBooking] = useState<GuestBooking | null>(null)

  const fetchBookingsData = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      const response = await fetch(`/api/os/bookings/${propertyId}`)
      if (!response.ok) {
        throw new Error('Failed to fetch bookings data')
      }
      
      const data = await response.json()
      if (data.success) {
        setBookings(data.bookings || [])
      } else {
        setError(data.error || 'Failed to fetch bookings data')
      }
    } catch (error) {
      console.error('Error fetching bookings:', error)
      setError('Failed to load guest journey data')
    } finally {
      setIsLoading(false)
    }
  }, [propertyId])

  useEffect(() => {
    if (propertyId) {
      fetchBookingsData()
    }
  }, [propertyId, fetchBookingsData])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const getBookingStage = (booking: GuestBooking): JourneyStage[] => {
    const now = new Date()
    const checkInDate = new Date(booking.checkInDate)
    const checkOutDate = new Date(booking.checkOutDate)
    const isCheckedIn = now >= checkInDate && now < checkOutDate
    const isCheckedOut = now >= checkOutDate
    
    return [
      {
        id: "booking",
        name: "Booking Confirmed",
        status: booking.status === "confirmed" ? "completed" : booking.status === "pending" ? "current" : "pending",
        timestamp: booking.createdAt,
        icon: CheckCircle2,
        description: "Reservation has been made and confirmed"
      },
      {
        id: "payment",
        name: "Payment Processed",
        status: booking.paymentStatus === "paid" ? "completed" : booking.paymentStatus === "partial" ? "current" : "pending",
        timestamp: booking.paymentStatus === "paid" ? booking.updatedAt : undefined,
        icon: CreditCard,
        description: "Payment has been processed successfully"
      },
      {
        id: "arrival",
        name: "Guest Arrival",
        status: isCheckedIn || isCheckedOut ? "completed" : now.toDateString() === checkInDate.toDateString() ? "current" : "pending",
        timestamp: isCheckedIn || isCheckedOut ? booking.checkInDate : undefined,
        icon: LogIn,
        description: "Guest has arrived and checked in"
      },
      {
        id: "stay",
        name: "During Stay",
        status: isCheckedIn ? "current" : isCheckedOut ? "completed" : "pending",
        timestamp: isCheckedIn ? booking.checkInDate : undefined,
        icon: Coffee,
        description: "Guest is enjoying their stay"
      },
      {
        id: "departure",
        name: "Check Out",
        status: isCheckedOut ? "completed" : now.toDateString() === checkOutDate.toDateString() ? "current" : "pending",
        timestamp: isCheckedOut ? booking.checkOutDate : undefined,
        icon: LogOut,
        description: "Guest has checked out successfully"
      },
      {
        id: "feedback",
        name: "Review & Feedback",
        status: isCheckedOut ? "current" : "pending",
        timestamp: undefined,
        icon: Star,
        description: "Guest provides feedback about their experience"
      }
    ]
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "bg-green-100 text-green-800 border-green-200"
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "cancelled":
        return "bg-red-100 text-red-800 border-red-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getFilteredBookings = () => {
    return bookings.filter(booking => {
      const matchesSearch = booking.userId.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          booking.userId.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          booking._id.toLowerCase().includes(searchQuery.toLowerCase())
      
      const matchesStatus = statusFilter === "all" || booking.status === statusFilter
      
      return matchesSearch && matchesStatus
    })
  }

  const getJourneyProgress = (stages: JourneyStage[]) => {
    const completedStages = stages.filter(stage => stage.status === "completed").length
    return Math.round((completedStages / stages.length) * 100)
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-8 bg-gray-200 animate-pulse rounded w-64"></div>
            <div className="h-4 bg-gray-200 animate-pulse rounded w-80"></div>
          </div>
          <div className="h-10 bg-gray-200 animate-pulse rounded w-28"></div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="space-y-3">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-6 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="h-3 bg-gray-200 rounded w-full"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive" className="max-w-md mx-auto">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription className="flex items-center justify-between">
          <span>{error}</span>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchBookingsData}
            className="ml-4"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-gray-900">Guest Journey Tracking</h2>
          <p className="text-gray-600">
            Track guest experiences from booking to checkout
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search guests..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
          
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="confirmed">Confirmed</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>

          <Button onClick={fetchBookingsData} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Guest Journey Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {getFilteredBookings().map((booking) => {
          const journeyStages = getBookingStage(booking)
          const progress = getJourneyProgress(journeyStages)
          const currentStage = journeyStages.find(stage => stage.status === "current")
          
          return (
            <Card key={booking._id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <User className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{booking.userId.name}</h3>
                      <p className="text-sm text-gray-500">#{booking._id.slice(-8)}</p>
                    </div>
                  </div>
                  <Badge className={getStatusColor(booking.status)}>
                    {booking.status}
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <div className="flex items-center space-x-1">
                    <Calendar className="h-4 w-4" />
                    <span>{new Date(booking.checkInDate).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Users className="h-4 w-4" />
                    <span>{booking.totalGuests} guests</span>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Progress Bar */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Journey Progress</span>
                    <span className="font-medium">{progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                </div>

                {/* Current Stage */}
                {currentStage && (
                  <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
                    <currentStage.icon className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="font-medium text-blue-900">{currentStage.name}</p>
                      <p className="text-sm text-blue-600">{currentStage.description}</p>
                    </div>
                  </div>
                )}

                {/* Quick Info */}
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-500">Amount:</span>
                    <div className="font-medium">{formatCurrency(booking.totalAmount)}</div>
                  </div>
                  <div>
                    <span className="text-gray-500">Payment:</span>
                    <div className="font-medium capitalize">{booking.paymentStatus || 'pending'}</div>
                  </div>
                </div>

                {/* Action Button */}
                <Dialog>
                  <DialogTrigger asChild>
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => setSelectedBooking(booking)}
                    >
                      View Journey Details
                      <ChevronRight className="h-4 w-4 ml-2" />
                    </Button>
                  </DialogTrigger>
                  
                  <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle className="flex items-center space-x-2">
                        <User className="h-5 w-5" />
                        <span>{booking.userId.name}'s Journey</span>
                      </DialogTitle>
                    </DialogHeader>
                    
                    <div className="space-y-6">
                      {/* Guest Information */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <h4 className="font-medium text-gray-900">Guest Information</h4>
                          <div className="space-y-1 text-sm">
                            <div className="flex items-center space-x-2">
                              <Mail className="h-4 w-4 text-gray-400" />
                              <span>{booking.userId.email}</span>
                            </div>
                            {booking.userId.phone && (
                              <div className="flex items-center space-x-2">
                                <Phone className="h-4 w-4 text-gray-400" />
                                <span>{booking.userId.phone}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <h4 className="font-medium text-gray-900">Booking Details</h4>
                          <div className="space-y-1 text-sm">
                            <div>Check-in: {new Date(booking.checkInDate).toLocaleDateString()}</div>
                            <div>Check-out: {new Date(booking.checkOutDate).toLocaleDateString()}</div>
                            <div>Guests: {booking.totalGuests}</div>
                            <div>Total: {formatCurrency(booking.totalAmount)}</div>
                          </div>
                        </div>
                      </div>

                      {/* Journey Timeline */}
                      <div className="space-y-4">
                        <h4 className="font-medium text-gray-900">Journey Timeline</h4>
                        <div className="space-y-4">
                          {journeyStages.map((stage, index) => (
                            <div key={stage.id} className="flex items-center space-x-4">
                              <div
                                className={cn(
                                  "flex items-center justify-center w-10 h-10 rounded-full border-2",
                                  stage.status === "completed" 
                                    ? "bg-green-100 border-green-500 text-green-600"
                                    : stage.status === "current"
                                    ? "bg-blue-100 border-blue-500 text-blue-600"
                                    : "bg-gray-100 border-gray-300 text-gray-400"
                                )}
                              >
                                <stage.icon className="h-5 w-5" />
                              </div>
                              
                              <div className="flex-1">
                                <div className="flex items-center justify-between">
                                  <h5 className={cn(
                                    "font-medium",
                                    stage.status === "completed" ? "text-green-900" 
                                    : stage.status === "current" ? "text-blue-900"
                                    : "text-gray-500"
                                  )}>
                                    {stage.name}
                                  </h5>
                                  {stage.timestamp && (
                                    <span className="text-xs text-gray-500">
                                      {new Date(stage.timestamp).toLocaleDateString()}
                                    </span>
                                  )}
                                </div>
                                <p className="text-sm text-gray-600">{stage.description}</p>
                              </div>
                              
                              {index < journeyStages.length - 1 && (
                                <div 
                                  className={cn(
                                    "absolute left-[2.5rem] w-0.5 h-8 mt-10",
                                    stage.status === "completed" ? "bg-green-300" : "bg-gray-200"
                                  )}
                                  style={{ position: 'absolute', marginTop: '2.5rem' }}
                                />
                              )}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Special Requests */}
                      {booking.specialRequests && (
                        <div className="space-y-2">
                          <h4 className="font-medium text-gray-900">Special Requests</h4>
                          <p className="text-sm text-gray-600 p-3 bg-gray-50 rounded-lg">
                            {booking.specialRequests}
                          </p>
                        </div>
                      )}
                    </div>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {getFilteredBookings().length === 0 && (
        <div className="text-center py-12">
          <Users className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <p className="text-gray-600">No guest journeys found</p>
          {searchQuery && (
            <p className="text-sm text-gray-500 mt-1">
              Try adjusting your search or filters
            </p>
          )}
        </div>
      )}
    </div>
  )
}