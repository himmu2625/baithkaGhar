"use client"

import React from 'react'
import { BookingManager } from '@/components/os/bookings/booking-manager'

interface BookingPageProps {
  params: {
    propertyId: string
  }
}

export default function BookingPage({ params }: BookingPageProps) {
  return <BookingManager />
}