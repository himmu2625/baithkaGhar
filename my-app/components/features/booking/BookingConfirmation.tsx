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
          <CardFooter className="flex flex-col sm:flex-row gap-4">
            <Button 
              className="w-full sm:w-auto" 
              variant="outline"
              onClick={() => {
                // Download receipt functionality
                const downloadReceipt = async () => {
                  try {
                    const response = await fetch(`/api/bookings/${bookingId}/invoice`);
                    if (response.ok) {
                      const htmlContent = await response.text();
                      const blob = new Blob([htmlContent], { type: 'text/html' });
                      const url = window.URL.createObjectURL(blob);
                      const link = document.createElement('a');
                      link.href = url;
                      link.download = `booking-receipt-${bookingId.slice(-6).toUpperCase()}.html`;
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                      window.URL.revokeObjectURL(url);
                    }
                  } catch (error) {
                    console.error('Download failed:', error);
                  }
                };
                downloadReceipt();
              }}
            >
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
        
        {/* Enhanced Next Steps Section */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarCheck className="h-5 w-5 text-green-600" />
              What's Next?
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-green-600 font-semibold text-sm">1</span>
                </div>
                <div>
                  <h4 className="font-medium">Save Your Booking Details</h4>
                  <p className="text-sm text-muted-foreground">
                    Download your receipt and save your booking ID: <code className="bg-muted px-1 py-0.5 rounded text-xs">{bookingId}</code>
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-blue-600 font-semibold text-sm">2</span>
                </div>
                <div>
                  <h4 className="font-medium">Contact Property Before Arrival</h4>
                  <p className="text-sm text-muted-foreground">
                    Call or message the property 30 minutes before your arrival to confirm check-in procedures.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-purple-600 font-semibold text-sm">3</span>
                </div>
                <div>
                  <h4 className="font-medium">Prepare Required Documents</h4>
                  <p className="text-sm text-muted-foreground">
                    Bring a valid government-issued photo ID and a copy of this booking confirmation.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-orange-600 font-semibold text-sm">4</span>
                </div>
                <div>
                  <h4 className="font-medium">Check the Weather</h4>
                  <p className="text-sm text-muted-foreground">
                    Review the weather forecast for {property.city} and pack accordingly.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Emergency Contact Information */}
        <Card className="mb-8 border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-800">
              <Phone className="h-5 w-5" />
              Need Help?
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-yellow-200 flex items-center justify-center">
                  <Phone className="h-5 w-5 text-yellow-700" />
                </div>
                <div>
                  <p className="font-medium text-yellow-800">24/7 Support</p>
                  <p className="text-sm text-yellow-700">+91 8800 123 456</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-yellow-200 flex items-center justify-center">
                  <Mail className="h-5 w-5 text-yellow-700" />
                </div>
                <div>
                  <p className="font-medium text-yellow-800">Email Support</p>
                  <p className="text-sm text-yellow-700">support@baithakaghar.com</p>
                </div>
              </div>
            </div>
            
            <div className="mt-4 p-3 bg-yellow-100 rounded-lg">
              <p className="text-sm text-yellow-800">
                <strong>Emergency Contact:</strong> If you face any issues during your stay, 
                contact our emergency helpline at <strong>+91 9999 888 777</strong> (Available 24/7)
              </p>
            </div>
          </CardContent>
        </Card>

        <Accordion type="single" collapsible className="mb-8">
          <AccordionItem value="check-in">
            <AccordionTrigger className="text-left">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Check-in Instructions & Property Location
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-4">
                <div className="bg-muted p-4 rounded-lg">
                  <h4 className="font-medium mb-2">📍 Property Address</h4>
                  <p className="text-sm">
                    {property.address}, {property.city}, {property.state}, {property.country}
                  </p>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">⏰ Check-in Process</h4>
                  <ul className="text-sm space-y-2 list-disc list-inside text-muted-foreground">
                    <li>Check-in time: <strong>2:00 PM onwards</strong> on {format(checkInDate, "EEEE, MMMM d, yyyy")}</li>
                    <li>Please contact the host 30 minutes before arrival</li>
                    <li>The host or property manager will meet you at the property</li>
                    <li>Have your ID and booking confirmation ready</li>
                    <li>Complete the check-in formalities as per local regulations</li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">🏠 Property Amenities</h4>
                  <p className="text-sm text-muted-foreground">
                    Please check with the property directly for available amenities, WiFi passwords, 
                    and any specific property rules or guidelines.
                  </p>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
          
          <AccordionItem value="policies">
            <AccordionTrigger>
              <div className="flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Cancellation & Payment Policies
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">💳 Payment Information</h4>
                  <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                    <p className="text-sm text-green-800">
                      ✅ <strong>Payment Completed:</strong> ₹{pricing.total.toLocaleString()} has been successfully charged
                      {paymentMethod && ` via ${paymentMethod}`}
                    </p>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">🔄 Cancellation Policy</h4>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• Free cancellation up to 48 hours before check-in</li>
                    <li>• 50% refund for cancellations 24-48 hours before check-in</li>
                    <li>• No refund for cancellations within 24 hours of check-in</li>
                    <li>• Refunds will be processed within 5-7 business days</li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">📋 Terms & Conditions</h4>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• Valid ID proof required at check-in</li>
                    <li>• No smoking or parties allowed unless specified</li>
                    <li>• Damage charges may apply for property damage</li>
                    <li>• Guest capacity should not exceed the booked number</li>
                  </ul>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
          
          <AccordionItem value="contact">
            <AccordionTrigger>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Host & Support Contact
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-4">
                <div className="bg-muted p-4 rounded-lg">
                  <h4 className="font-medium mb-2">🏠 Property Host</h4>
                  {host?.name ? (
                    <div className="flex items-center space-x-3 mb-3">
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
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Host contact details will be shared 24 hours before your check-in.
                    </p>
                  )}
                </div>
                
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <h4 className="font-medium mb-2 text-blue-800">📞 Baithaka Ghar Support</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-4 w-4 text-blue-600" />
                      <span>+91 8800 123 456</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-4 w-4 text-blue-600" />
                      <span>support@baithakaghar.com</span>
                    </div>
                  </div>
                  <p className="text-xs text-blue-700 mt-2">
                    Available 24/7 for any booking-related queries or emergencies
                  </p>
                </div>
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