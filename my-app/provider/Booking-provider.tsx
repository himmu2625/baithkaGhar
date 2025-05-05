"use client"

import React, { createContext, useContext, useState, ReactNode } from "react"

interface BookingDetails {
  propertyId: string
  checkIn: Date | null
  checkOut: Date | null
  guests: number
  price: number
  total: number
}

interface BookingContextType {
  bookingDetails: BookingDetails | null
  setBookingDetails: (details: BookingDetails | null) => void
  clearBookingDetails: () => void
}

const defaultBookingDetails: BookingDetails = {
  propertyId: "",
  checkIn: null,
  checkOut: null,
  guests: 1,
  price: 0,
  total: 0
}

const BookingContext = createContext<BookingContextType | undefined>(undefined)

export function BookingProvider({ children }: { children: ReactNode }) {
  const [bookingDetails, setBookingDetails] = useState<BookingDetails | null>(null)

  const clearBookingDetails = () => {
    setBookingDetails(null)
  }

  return (
    <BookingContext.Provider value={{ bookingDetails, setBookingDetails, clearBookingDetails }}>
      {children}
    </BookingContext.Provider>
  )
}

export function useBooking() {
  const context = useContext(BookingContext)
  if (context === undefined) {
    throw new Error("useBooking must be used within a BookingProvider")
  }
  return context
} 