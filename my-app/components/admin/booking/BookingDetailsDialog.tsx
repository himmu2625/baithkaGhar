"use client"

import React from 'react'
import { format } from "date-fns"
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog"
import { 
  Home, 
  User, 
  Calendar, 
  Users, 
  CreditCard, 
  Clock
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { BookingStatusBadge } from "./BookingStatusBadge"
import { PaymentStatusBadge } from "./PaymentStatusBadge"

interface Booking {
  id: string
  propertyId: string
  propertyName: string
  propertyLocation: {
    city: string
    state: string
  }
  guestId: string
  guestName: string
  guestEmail: string
  checkIn: string
  checkOut: string
  guests: {
    adults: number
    children: number
  }
  status: 'confirmed' | 'pending' | 'cancelled' | 'completed'
  paymentStatus: 'paid' | 'pending' | 'refunded' | 'failed'
  totalAmount: number
  createdAt: string
}

interface BookingDetailsDialogProps {
  booking: Booking | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onUpdateStatus?: (bookingId: string, status: Booking['status']) => void
}

export function BookingDetailsDialog({ 
  booking, 
  open, 
  onOpenChange,
  onUpdateStatus
}: BookingDetailsDialogProps) {
  if (!booking) {
    return null
  }
  
  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'PPP')
  }
  
  const formatDateTime = (dateString: string) => {
    return format(new Date(dateString), 'PPp')
  }
  
  const calculateNights = (checkIn: string, checkOut: string) => {
    const startDate = new Date(checkIn)
    const endDate = new Date(checkOut)
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount)
  }
  
  const nights = calculateNights(booking.checkIn, booking.checkOut)
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md md:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl">Booking Details</DialogTitle>
          <DialogDescription>
            Booking #{booking.id}
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
          {/* Left column */}
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-gray-500 flex items-center mb-1">
                <Home className="h-4 w-4 mr-2" />
                Property
              </h3>
              <p className="font-medium">{booking.propertyName}</p>
              <p className="text-sm text-gray-500">{booking.propertyLocation.city}, {booking.propertyLocation.state}</p>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-500 flex items-center mb-1">
                <User className="h-4 w-4 mr-2" />
                Guest
              </h3>
              <p className="font-medium">{booking.guestName}</p>
              <p className="text-sm text-gray-500">{booking.guestEmail}</p>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-500 flex items-center mb-1">
                <Calendar className="h-4 w-4 mr-2" />
                Dates
              </h3>
              <p className="font-medium">
                {formatDate(booking.checkIn)} - {formatDate(booking.checkOut)}
              </p>
              <p className="text-sm text-gray-500">{nights} {nights === 1 ? 'night' : 'nights'}</p>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-500 flex items-center mb-1">
                <Users className="h-4 w-4 mr-2" />
                Guests
              </h3>
              <p className="font-medium">
                {booking.guests.adults} {booking.guests.adults === 1 ? 'adult' : 'adults'}
                {booking.guests.children > 0 && `, ${booking.guests.children} ${booking.guests.children === 1 ? 'child' : 'children'}`}
              </p>
            </div>
          </div>
          
          {/* Right column */}
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-gray-500 flex items-center mb-1">
                <CreditCard className="h-4 w-4 mr-2" />
                Payment
              </h3>
              <p className="font-medium">{formatCurrency(booking.totalAmount)}</p>
              <div className="mt-1">
                <PaymentStatusBadge status={booking.paymentStatus} />
              </div>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-500 flex items-center mb-1">
                <Clock className="h-4 w-4 mr-2" />
                Booking Status
              </h3>
              <div className="mt-1">
                <BookingStatusBadge status={booking.status} />
              </div>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-500 flex items-center mb-1">
                <Calendar className="h-4 w-4 mr-2" />
                Created
              </h3>
              <p className="font-medium">
                {formatDateTime(booking.createdAt)}
              </p>
            </div>
          </div>
        </div>
        
        <DialogFooter className="sm:justify-between">
          <div className="flex flex-col gap-2 sm:flex-row">
            {onUpdateStatus && booking.status !== 'cancelled' && (
              <Button 
                variant="destructive" 
                onClick={() => {
                  onUpdateStatus(booking.id, 'cancelled')
                  onOpenChange(false)
                }}
              >
                Cancel Booking
              </Button>
            )}
            
            {onUpdateStatus && booking.status === 'pending' && (
              <Button
                variant="default"
                onClick={() => {
                  onUpdateStatus(booking.id, 'confirmed')
                  onOpenChange(false)
                }}
              >
                Confirm Booking
              </Button>
            )}
            
            {onUpdateStatus && booking.status === 'confirmed' && (
              <Button
                variant="default"
                onClick={() => {
                  onUpdateStatus(booking.id, 'completed')
                  onOpenChange(false)
                }}
              >
                Mark as Completed
              </Button>
            )}
          </div>
          
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 