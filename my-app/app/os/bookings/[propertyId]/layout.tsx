import React from 'react'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Booking Management | Property OS',
  description: 'Manage property bookings, reservations, and guest stays',
}

interface BookingLayoutProps {
  children: React.ReactNode
  params: {
    propertyId: string
  }
}

export default function BookingLayout({ children, params }: BookingLayoutProps) {
  return (
    <div className="booking-management-layout">
      {children}
    </div>
  )
}