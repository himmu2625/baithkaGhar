"use client"

import React from 'react'
import { format } from "date-fns"
import { CalendarCheck, Check, MapPin, Users, CreditCard, Calendar, ArrowRight, Mail, Download, Phone } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import Link from "next/link"

interface BookingDetailsProps {
  bookingId: string
  checkIn: Date | string
  checkOut: Date | string
  guests: {
    adults: number
    children: number
  }
  property: {
    id: string
    name: string
    address: string
    city: string
    state: string
    country: string
    image: string
  }
  host: {
    id: string
    name: string
    email: string
    phone?: string
    avatar?: string
  }
  pricing: {
    total: number
    nights: number
    pricePerNight: number
    tax: number
  }
  paymentMethod?: string
  specialRequests?: string
  className?: string
}

export function BookingConfirmation({
  bookingId,
  checkIn,
  checkOut,
  guests,
  property,
  host,
  pricing,
  paymentMethod,
  specialRequests,
  className
}: BookingDetailsProps) {
  // Parse dates if needed
  const checkInDate = checkIn instanceof Date ? checkIn : new Date(checkIn)
  const checkOutDate = checkOut instanceof Date ? checkOut : new Date(checkOut)
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount)
  }
  
  return (
    <div className={className}>
      <div className="max-w-3xl mx-auto">
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
            <Check className="h-8 w-8 text-green-600" />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold mb-2">Booking Confirmed!</h1>
          <p className="text-muted-foreground">
            Your reservation at {property.name} is confirmed. Booking ID: {bookingId}
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center">
                <Calendar className="mr-2 h-4 w-4" />
                Check-in
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-bold">{format(checkInDate, "EEE, MMM d, yyyy")}</p>
              <p className="text-sm text-muted-foreground">After 2:00 PM</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center">
                <Calendar className="mr-2 h-4 w-4" />
                Check-out
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-bold">{format(checkOutDate, "EEE, MMM d, yyyy")}</p>
              <p className="text-sm text-muted-foreground">Before 11:00 AM</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center">
                <Users className="mr-2 h-4 w-4" />
                Guests
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-bold">
                {guests.adults} {guests.adults === 1 ? 'Adult' : 'Adults'}
                {guests.children > 0 && `, ${guests.children} ${guests.children === 1 ? 'Child' : 'Children'}`}
              </p>
            </CardContent>
          </Card>
        </div>
        
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-start">
              <div className="flex-1">
                <CardTitle>{property.name}</CardTitle>
                <CardDescription className="flex items-center mt-1">
                  <MapPin className="h-4 w-4 mr-1" />
                  {property.address}, {property.city}, {property.state}
                </CardDescription>
              </div>
              <div className="h-20 w-20 overflow-hidden rounded-md">
                {property.image && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={property.image}
                    alt={property.name}
                    className="h-full w-full object-cover"
                  />
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium mb-2">Host Information</h3>
                <div className="flex items-center space-x-3">
                  <Avatar>
                    <AvatarImage src={host.avatar} alt={host.name} />
                    <AvatarFallback>{host.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{host.name}</p>
                    <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                      {host.email && (
                        <div className="flex items-center">
                          <Mail className="h-3.5 w-3.5 mr-1" />
                          <span>{host.email}</span>
                        </div>
                      )}
                      {host.phone && (
                        <div className="flex items-center">
                          <Phone className="h-3.5 w-3.5 mr-1" />
                          <span>{host.phone}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-medium mb-2">Price Details</h3>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>{formatCurrency(pricing.pricePerNight)} x {pricing.nights} {pricing.nights === 1 ? 'night' : 'nights'}</span>
                    <span>{formatCurrency(pricing.pricePerNight * pricing.nights)}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span>Taxes</span>
                    <span>{formatCurrency(pricing.tax)}</span>
                  </div>
                  
                  <Separator className="my-2" />
                  
                  <div className="flex justify-between font-bold">
                    <span>Total (INR)</span>
                    <span>{formatCurrency(pricing.total)}</span>
                  </div>
                  
                  {paymentMethod && (
                    <div className="flex justify-between items-center mt-2 text-xs text-muted-foreground">
                      <span>Paid with</span>
                      <span className="flex items-center">
                        <CreditCard className="h-3 w-3 mr-1" />
                        {paymentMethod}
                      </span>
                    </div>
                  )}
                </div>
              </div>
              
              {specialRequests && (
                <div>
                  <h3 className="text-sm font-medium mb-2">Special Requests</h3>
                  <p className="text-sm">{specialRequests}</p>
                </div>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex flex-col sm:flex-row gap-3 border-t pt-6">
            <Button className="w-full sm:w-auto" variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Download Receipt
            </Button>
            <Button asChild className="w-full sm:w-auto">
              <Link href={`/bookings/${bookingId}`}>
                Manage Booking
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardFooter>
        </Card>
        
        <Accordion type="single" collapsible className="mb-8">
          <AccordionItem value="check-in">
            <AccordionTrigger>Check-in Instructions</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-4">
                <p>
                  Your check-in time is after 2:00 PM on {format(checkInDate, "EEEE, MMMM d, yyyy")}.
                </p>
                <div>
                  <h3 className="text-sm font-medium mb-1">Address</h3>
                  <p className="text-sm">
                    {property.address}, {property.city}, {property.state}, {property.country}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium mb-1">Check-in Process</h3>
                  <ul className="text-sm space-y-1">
                    <li>• Please contact the host 30 minutes before arrival</li>
                    <li>• The host or property manager will meet you at the property</li>
                    <li>• Please have your ID and booking confirmation ready</li>
                  </ul>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
          
          <AccordionItem value="policies">
            <AccordionTrigger>Cancellation Policy</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-2 text-sm">
                <p>Free cancellation until 5 days before check-in.</p>
                <p>After that, cancel before check-in and get a 50% refund, minus the service fee.</p>
              </div>
            </AccordionContent>
          </AccordionItem>
          
          <AccordionItem value="house-rules">
            <AccordionTrigger>House Rules</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-1 text-sm">
                <p>• Check-in: After 2:00 PM</p>
                <p>• Checkout: Before 11:00 AM</p>
                <p>• No smoking</p>
                <p>• No parties or events</p>
                <p>• Pets are not allowed</p>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
        
        <div className="text-center">
          <h3 className="text-lg font-medium mb-3">Need help with your booking?</h3>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button variant="outline" asChild>
              <Link href="/contact">
                Contact Support
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/faq">
                View FAQs
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
} 