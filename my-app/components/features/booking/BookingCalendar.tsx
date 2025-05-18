"use client"

import React, { useState, useEffect } from 'react'
import { Calendar as CalendarIcon, X } from "lucide-react"
import { format, addDays, isBefore, isAfter, isEqual, isSameDay, parseISO } from "date-fns"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface BookedDate {
  startDate: Date
  endDate: Date
}

interface BookingCalendarProps {
  bookedDates?: BookedDate[]
  minBookingDays?: number
  maxBookingDays?: number
  minDate?: Date
  maxDate?: Date
  defaultSelected?: {
    from: Date
    to: Date
  }
  price?: number
  onDateSelect?: (dates: { from: Date; to: Date }) => void
  className?: string
}

export function BookingCalendar({
  bookedDates = [],
  minBookingDays = 1,
  maxBookingDays = 90,
  minDate = new Date(),
  maxDate = addDays(new Date(), 365),
  defaultSelected,
  price,
  onDateSelect,
  className
}: BookingCalendarProps) {
  const [date, setDate] = useState<{
    from: Date | undefined
    to: Date | undefined
  }>({
    from: defaultSelected?.from,
    to: defaultSelected?.to
  })

  // Parse the booking dates if they're provided as strings
  const parsedBookedDates = bookedDates.map(booking => ({
    startDate: booking.startDate instanceof Date ? booking.startDate : parseISO(booking.startDate as unknown as string),
    endDate: booking.endDate instanceof Date ? booking.endDate : parseISO(booking.endDate as unknown as string)
  }))

  // Function to check if a date is booked
  const isDateBooked = (date: Date) => {
    return parsedBookedDates.some(booking => {
      const checkDate = new Date(date.setHours(0, 0, 0, 0))
      const start = new Date(booking.startDate.setHours(0, 0, 0, 0))
      const end = new Date(booking.endDate.setHours(0, 0, 0, 0))
      
      return (isAfter(checkDate, start) || isEqual(checkDate, start)) && 
             (isBefore(checkDate, end) || isEqual(checkDate, end))
    })
  }

  // Function to calculate the total nights and price
  const calculateBookingDetails = () => {
    if (date.from && date.to) {
      const diffTime = Math.abs(date.to.getTime() - date.from.getTime())
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      
      return {
        nights: diffDays,
        totalPrice: price ? diffDays * price : 0
      }
    }
    
    return { nights: 0, totalPrice: 0 }
  }

  const { nights, totalPrice } = calculateBookingDetails()

  useEffect(() => {
    if (date.from && date.to && onDateSelect) {
      onDateSelect({ from: date.from, to: date.to })
    }
  }, [date, onDateSelect])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount)
  }

  const clearSelection = () => {
    setDate({ from: undefined, to: undefined })
  }

  return (
    <div className={cn("space-y-4", className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-full justify-start text-left font-normal",
              !date.from && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date.from ? (
              date.to ? (
                <>
                  {format(date.from, "PPP")} - {format(date.to, "PPP")}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="ml-auto h-6 w-6 -mr-2"
                    onClick={(e) => {
                      e.stopPropagation()
                      clearSelection()
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </>
              ) : (
                format(date.from, "PPP")
              )
            ) : (
              "Select dates"
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 bg-darkGreen border border-lightGreen/50 shadow-lg shadow-darkGreen" align="start">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={date.from}
            selected={date}
            onSelect={(range) => setDate({ from: range?.from, to: range?.to })}
            numberOfMonths={2}
            fromDate={minDate}
            toDate={maxDate}
            disabled={date => {
              // Disable dates that are booked
              const isBooked = isDateBooked(date)
              
              // Don't allow selection of dates before minDate
              const isTooEarly = isBefore(date, minDate) && !isSameDay(date, minDate)
              
              // Don't allow selection of dates after maxDate
              const isTooLate = isAfter(date, maxDate) && !isSameDay(date, maxDate)
              
              return isBooked || isTooEarly || isTooLate
            }}
            modifiers={{
              booked: (date) => isDateBooked(date)
            }}
            modifiersStyles={{
              booked: {
                backgroundColor: 'rgba(239, 68, 68, 0.2)',
                color: '#FFCC00',
                textDecoration: 'line-through'
              }
            }}
            classNames={{
              day_selected: "bg-lightGreen text-darkGreen hover:bg-lightYellow hover:text-darkGreen",
              day_range_middle: "bg-lightGreen/50 text-white hover:bg-lightGreen/70 hover:text-white",
              day_range_end: "bg-lightGreen text-darkGreen hover:bg-lightYellow hover:text-darkGreen",
              day_today: "bg-lightGreen/30 text-lightYellow border border-lightGreen/50"
            }}
          />
        </PopoverContent>
      </Popover>

      {date.from && date.to && (
        <div className="space-y-2">
          <div className="flex justify-between items-center text-sm">
            <span>Check-in:</span>
            <span className="font-medium">{format(date.from, "EEEE, MMMM d")}</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span>Check-out:</span>
            <span className="font-medium">{format(date.to, "EEEE, MMMM d")}</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span>Duration:</span>
            <span className="font-medium">{nights} {nights === 1 ? 'night' : 'nights'}</span>
          </div>
          {price && (
            <div className="flex justify-between items-center text-sm">
              <span>Total:</span>
              <span className="font-medium">{formatCurrency(totalPrice)}</span>
            </div>
          )}
          
          {nights < minBookingDays && (
            <Badge variant="destructive" className="w-full justify-center">
              Minimum stay is {minBookingDays} {minBookingDays === 1 ? 'night' : 'nights'}
            </Badge>
          )}
          
          {nights > maxBookingDays && (
            <Badge variant="destructive" className="w-full justify-center">
              Maximum stay is {maxBookingDays} nights
            </Badge>
          )}
        </div>
      )}
    </div>
  )
} 