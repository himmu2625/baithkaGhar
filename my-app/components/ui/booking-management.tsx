"use client"

import React, { useState } from 'react'
import { format } from "date-fns"
import { 
  Calendar, 
  Users, 
  MapPin, 
  CreditCard, 
  Download, 
  Share2, 
  Phone, 
  Mail, 
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle,
  Star,
  MessageSquare,
  Plane,
  Car,
  Utensils
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { useToast } from "@/components/ui/use-toast"
import Link from "next/link"
import Image from "next/image"

interface BookingManagementProps {
  booking: {
    id: string
    bookingCode: string
    status: 'confirmed' | 'pending' | 'cancelled' | 'completed'
    checkIn: Date | string
    checkOut: Date | string
    guests: number
    totalAmount: number
    createdAt: Date | string
    specialRequests?: string
    cancellationDeadline?: Date | string
  }
  property: {
    id: string
    slug?: string
    name: string
    address: string
    city: string
    state: string
    country: string
    image: string
    rating?: number
    amenities?: string[]
    type: string
  }
  host?: {
    id: string
    name: string
    email?: string
    phone?: string
    avatar?: string
    rating?: number
    responseTime?: string
  }
  className?: string
}

export function BookingManagement({
  booking,
  property,
  host,
  className
}: BookingManagementProps) {
  const { toast } = useToast()
  const [isDownloading, setIsDownloading] = useState(false)
  
  const checkInDate = booking.checkIn instanceof Date ? booking.checkIn : new Date(booking.checkIn)
  const checkOutDate = booking.checkOut instanceof Date ? booking.checkOut : new Date(booking.checkOut)
  const nights = Math.round((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24))
  
  const statusConfig = {
    confirmed: { 
      color: 'bg-green-100 text-green-800 border-green-200', 
      icon: CheckCircle, 
      text: 'Confirmed',
      description: 'Your booking is confirmed and ready!'
    },
    pending: { 
      color: 'bg-yellow-100 text-yellow-800 border-yellow-200', 
      icon: Clock, 
      text: 'Pending',
      description: 'Awaiting confirmation from host'
    },
    cancelled: { 
      color: 'bg-red-100 text-red-800 border-red-200', 
      icon: XCircle, 
      text: 'Cancelled',
      description: 'This booking has been cancelled'
    },
    completed: { 
      color: 'bg-blue-100 text-blue-800 border-blue-200', 
      icon: Star, 
      text: 'Completed',
      description: 'Thank you for staying with us!'
    }
  }
  
  const currentStatus = statusConfig[booking.status]
  const StatusIcon = currentStatus.icon
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount)
  }
  
  const getTimeUntilCheckIn = () => {
    const now = new Date()
    const timeDiff = checkInDate.getTime() - now.getTime()
    const daysDiff = Math.ceil(timeDiff / (1000 * 60 * 60 * 24))
    
    if (daysDiff < 0) return "Check-in has passed"
    if (daysDiff === 0) return "Today!"
    if (daysDiff === 1) return "Tomorrow"
    return `${daysDiff} days to go`
  }
  
  const downloadInvoice = async () => {
    try {
      setIsDownloading(true)
      const response = await fetch(`/api/bookings/${booking.id}/invoice`)
      if (response.ok) {
        const htmlContent = await response.text()
        const blob = new Blob([htmlContent], { type: 'text/html' })
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `invoice-${booking.bookingCode}.html`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        window.URL.revokeObjectURL(url)
        
        toast({
          title: "Invoice Downloaded",
          description: "Your booking invoice has been downloaded successfully."
        })
      }
    } catch (error) {
      toast({
        title: "Download Failed",
        description: "Unable to download invoice. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsDownloading(false)
    }
  }
  
  const shareBooking = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `My booking at ${property.name}`,
          text: `I'm staying at ${property.name} from ${format(checkInDate, 'MMM d')} to ${format(checkOutDate, 'MMM d')}`,
          url: window.location.href
        })
      } catch (error) {
        // Share cancelled or failed
      }
    } else {
      // Fallback to copying to clipboard
      navigator.clipboard.writeText(window.location.href)
      toast({
        title: "Link Copied",
        description: "Booking link has been copied to your clipboard."
      })
    }
  }
  
  return (
    <div className={className}>
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Header Section */}
        <Card className="overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <StatusIcon className="h-6 w-6" />
                  <Badge variant="secondary" className={`${currentStatus.color} border`}>
                    {currentStatus.text}
                  </Badge>
                </div>
                <h1 className="text-2xl font-bold mb-1">{property.name}</h1>
                <p className="opacity-90">{currentStatus.description}</p>
              </div>
              <div className="text-right">
                <p className="text-sm opacity-90">Booking ID</p>
                <p className="text-xl font-mono font-bold">{booking.bookingCode}</p>
              </div>
            </div>
          </div>
          
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-4">
                <div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                    <Calendar className="h-4 w-4" />
                    Check-in
                  </div>
                  <div className="font-semibold">
                    {format(checkInDate, "EEE, MMM d, yyyy")}
                  </div>
                  <div className="text-sm text-muted-foreground">2:00 PM onwards</div>
                </div>
                
                <div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                    <Calendar className="h-4 w-4" />
                    Check-out
                  </div>
                  <div className="font-semibold">
                    {format(checkOutDate, "EEE, MMM d, yyyy")}
                  </div>
                  <div className="text-sm text-muted-foreground">11:00 AM</div>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                    <Users className="h-4 w-4" />
                    Guests
                  </div>
                  <div className="font-semibold">{booking.guests} {booking.guests === 1 ? 'guest' : 'guests'}</div>
                </div>
                
                <div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                    <Clock className="h-4 w-4" />
                    Duration
                  </div>
                  <div className="font-semibold">{nights} {nights === 1 ? 'night' : 'nights'}</div>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                    <CreditCard className="h-4 w-4" />
                    Total Amount
                  </div>
                  <div className="font-semibold text-lg text-green-600">
                    {formatCurrency(booking.totalAmount)}
                  </div>
                </div>
                
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Check-in Countdown</div>
                  <div className="font-semibold text-blue-600">{getTimeUntilCheckIn()}</div>
                </div>
              </div>
            </div>
          </CardContent>
          
          <CardFooter className="bg-muted/50 p-6">
            <div className="flex flex-wrap gap-3 w-full">
              <Button onClick={downloadInvoice} disabled={isDownloading} variant="outline">
                <Download className="mr-2 h-4 w-4" />
                {isDownloading ? 'Downloading...' : 'Download Invoice'}
              </Button>
              <Button onClick={shareBooking} variant="outline">
                <Share2 className="mr-2 h-4 w-4" />
                Share Booking
              </Button>
              {booking.status === 'confirmed' && (
                <Button asChild>
                  <Link href={`/user/reports?booking=${booking.id}`}>
                    <MessageSquare className="mr-2 h-4 w-4" />
                    Contact Support
                  </Link>
                </Button>
              )}
            </div>
          </CardFooter>
        </Card>
        
        {/* Tabs Section */}
        <Tabs defaultValue="details" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="property">Property</TabsTrigger>
            <TabsTrigger value="host">Host Info</TabsTrigger>
            <TabsTrigger value="actions">Actions</TabsTrigger>
          </TabsList>
          
          <TabsContent value="details" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Location & Address
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-muted rounded-lg">
                  <div className="font-medium mb-2">{property.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {property.address}<br />
                    {property.city}, {property.state} {property.country}
                  </div>
                </div>
                
                {booking.specialRequests && (
                  <div>
                    <h4 className="font-medium mb-2">Special Requests</h4>
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-sm">{booking.specialRequests}</p>
                    </div>
                  </div>
                )}
                
                <div>
                  <h4 className="font-medium mb-3">Important Reminders</h4>
                  <div className="space-y-2">
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Check-in Requirements</AlertTitle>
                      <AlertDescription>
                        Please bring a valid government-issued photo ID and be ready to show this booking confirmation.
                      </AlertDescription>
                    </Alert>
                    
                    <Alert>
                      <Phone className="h-4 w-4" />
                      <AlertTitle>Contact Property</AlertTitle>
                      <AlertDescription>
                        Contact the property 30 minutes before arrival to confirm check-in procedures.
                      </AlertDescription>
                    </Alert>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="property" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Image 
                    src={property.image || '/placeholder.svg'} 
                    alt={property.name}
                    width={40}
                    height={40}
                    className="rounded-lg object-cover"
                  />
                  {property.name}
                </CardTitle>
                <CardDescription>{property.type} in {property.city}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {property.rating && (
                  <div className="flex items-center gap-2">
                    <Star className="h-4 w-4 text-yellow-500 fill-current" />
                    <span className="font-medium">{property.rating}</span>
                    <span className="text-sm text-muted-foreground">Guest Rating</span>
                  </div>
                )}
                
                {property.amenities && property.amenities.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">Property Amenities</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {property.amenities.map((amenity, index) => (
                        <div key={index} className="flex items-center gap-2 text-sm">
                          <div className="w-2 h-2 bg-green-500 rounded-full" />
                          {amenity}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="grid grid-cols-3 gap-4 pt-4">
                  <Button variant="outline" size="sm" asChild>
                    <Link href={property.slug ? `/property/${property.slug}` : `/property/${property.id}`}>
                      View Property
                    </Link>
                  </Button>
                  <Button variant="outline" size="sm">
                    <Car className="mr-2 h-4 w-4" />
                    Directions
                  </Button>
                  <Button variant="outline" size="sm">
                    <Utensils className="mr-2 h-4 w-4" />
                    Nearby Dining
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="host" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Host Information</CardTitle>
                <CardDescription>
                  Your host will be available to assist you during your stay
                </CardDescription>
              </CardHeader>
              <CardContent>
                {host ? (
                  <div className="space-y-4">
                    <div className="flex items-center space-x-4">
                      <Avatar className="h-16 w-16">
                        <AvatarImage src={host.avatar} alt={host.name} />
                        <AvatarFallback className="text-lg">{host.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-semibold text-lg">{host.name}</h3>
                        {host.rating && (
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 text-yellow-500 fill-current" />
                            <span className="text-sm">{host.rating} Host Rating</span>
                          </div>
                        )}
                        {host.responseTime && (
                          <p className="text-sm text-muted-foreground">
                            Responds within {host.responseTime}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {host.email && (
                        <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                          <Mail className="h-5 w-5 text-blue-600" />
                          <div>
                            <p className="font-medium">Email</p>
                            <p className="text-sm text-muted-foreground">{host.email}</p>
                          </div>
                        </div>
                      )}
                      
                      {host.phone && (
                        <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                          <Phone className="h-5 w-5 text-green-600" />
                          <div>
                            <p className="font-medium">Phone</p>
                            <p className="text-sm text-muted-foreground">{host.phone}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">
                      Host contact information will be shared 24 hours before your check-in.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="actions" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Booking Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button onClick={downloadInvoice} disabled={isDownloading} className="w-full" variant="outline">
                    <Download className="mr-2 h-4 w-4" />
                    Download Invoice
                  </Button>
                  <Button onClick={shareBooking} className="w-full" variant="outline">
                    <Share2 className="mr-2 h-4 w-4" />
                    Share Booking
                  </Button>
                  {booking.status === 'confirmed' && (
                    <Button asChild className="w-full" variant="outline">
                      <Link href={`/booking/${booking.id}/modify`}>
                        Modify Booking
                      </Link>
                    </Button>
                  )}
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Support & Help</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button asChild className="w-full" variant="outline">
                    <Link href="/contact">
                      <MessageSquare className="mr-2 h-4 w-4" />
                      Contact Support
                    </Link>
                  </Button>
                  <Button asChild className="w-full" variant="outline">
                    <Link href="/faq">
                      Help Center
                    </Link>
                  </Button>
                  {booking.status === 'confirmed' && booking.cancellationDeadline && (
                    <Button className="w-full" variant="destructive">
                      Cancel Booking
                    </Button>
                  )}
                </CardContent>
              </Card>
            </div>
            
            {booking.status === 'confirmed' && (
              <Card className="border-green-200 bg-green-50">
                <CardHeader>
                  <CardTitle className="text-green-800">Travel Preparation</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-3 md:grid-cols-3">
                    <Button variant="outline" size="sm" className="bg-white">
                      <Plane className="mr-2 h-4 w-4" />
                      Flight Info
                    </Button>
                    <Button variant="outline" size="sm" className="bg-white">
                      <Car className="mr-2 h-4 w-4" />
                      Transportation
                    </Button>
                    <Button variant="outline" size="sm" className="bg-white">
                      Weather Forecast
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
} 