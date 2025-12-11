"use client"

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react"
import { BookingFlowData, initialBookingData } from "./types"

interface BookingFlowContextType {
  bookingData: BookingFlowData
  updateBookingData: (data: Partial<BookingFlowData>) => void
  nextStep: () => void
  previousStep: () => void
  goToStep: (step: number) => void
  resetBooking: () => void
  isStepValid: (step: number) => boolean
}

const BookingFlowContext = createContext<BookingFlowContextType | undefined>(undefined)

const STORAGE_KEY = "baithaka-booking-flow"

export function BookingFlowProvider({ children }: { children: ReactNode }) {
  const [bookingData, setBookingData] = useState<BookingFlowData>(initialBookingData)
  const [isHydrated, setIsHydrated] = useState(false)

  // Load from session storage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = sessionStorage.getItem(STORAGE_KEY)
      if (stored) {
        try {
          const parsed = JSON.parse(stored)
          // Convert date strings back to Date objects
          if (parsed.dateSelection) {
            parsed.dateSelection.checkIn = new Date(parsed.dateSelection.checkIn)
            parsed.dateSelection.checkOut = new Date(parsed.dateSelection.checkOut)
          }
          setBookingData(parsed)
        } catch (error) {
          console.error("Error parsing stored booking data:", error)
        }
      }
      setIsHydrated(true)
    }
  }, [])

  // Save to session storage on data change
  useEffect(() => {
    if (isHydrated && typeof window !== "undefined") {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(bookingData))
    }
  }, [bookingData, isHydrated])

  const updateBookingData = useCallback((data: Partial<BookingFlowData>) => {
    setBookingData((prev) => ({ ...prev, ...data }))
  }, [])

  const nextStep = useCallback(() => {
    setBookingData((prev) => ({
      ...prev,
      currentStep: Math.min(prev.currentStep + 1, 4),
    }))
  }, [])

  const previousStep = useCallback(() => {
    setBookingData((prev) => ({
      ...prev,
      currentStep: Math.max(prev.currentStep - 1, 1),
    }))
  }, [])

  const goToStep = useCallback((step: number) => {
    if (step >= 1 && step <= 4) {
      setBookingData((prev) => ({ ...prev, currentStep: step }))
    }
  }, [])

  const resetBooking = useCallback(() => {
    setBookingData(initialBookingData)
    if (typeof window !== "undefined") {
      sessionStorage.removeItem(STORAGE_KEY)
    }
  }, [])

  const isStepValid = (step: number): boolean => {
    switch (step) {
      case 1: // Review Booking
        return !!(
          bookingData.propertyData &&
          bookingData.roomCategoryData &&
          bookingData.dateSelection &&
          bookingData.guestSelection &&
          bookingData.pricing
        )
      case 2: // Guest Details
        return !!(
          bookingData.guestInfo?.firstName &&
          bookingData.guestInfo?.lastName &&
          bookingData.guestInfo?.email &&
          bookingData.guestInfo?.phone &&
          bookingData.arrivalTime
        )
      case 3: // Payment
        return !!(
          isStepValid(1) &&
          isStepValid(2) &&
          bookingData.agreedToPolicies
        )
      default:
        return false
    }
  }

  const value: BookingFlowContextType = {
    bookingData,
    updateBookingData,
    nextStep,
    previousStep,
    goToStep,
    resetBooking,
    isStepValid,
  }

  return (
    <BookingFlowContext.Provider value={value}>
      {children}
    </BookingFlowContext.Provider>
  )
}

export function useBookingFlow() {
  const context = useContext(BookingFlowContext)
  if (context === undefined) {
    throw new Error("useBookingFlow must be used within a BookingFlowProvider")
  }
  return context
}
