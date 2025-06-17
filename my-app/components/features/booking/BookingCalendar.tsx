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
              "w-full justify-start text-left font-normal h-12 px-4 text-sm",
              "border-2 border-gray-200 hover:border-lightGreen transition-all duration-200",
              "bg-white hover:bg-gray-50 shadow-sm hover:shadow-md",
              !date.from && "text-gray-500"
            )}
          >
            <CalendarIcon className="mr-3 h-5 w-5 text-lightGreen" />
            {date.from ? (
              date.to ? (
                <div className="flex items-center justify-between w-full">
                  <span className="font-medium text-gray-900">
                    {format(date.from, "MMM dd")} - {format(date.to, "MMM dd, yyyy")}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="ml-2 h-7 w-7 rounded-full hover:bg-red-100 hover:text-red-600 transition-colors"
                    onClick={(e) => {
                      e.stopPropagation()
                      clearSelection()
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <span className="font-medium text-gray-900">{format(date.from, "PPP")}</span>
              )
            ) : (
              <span className="text-gray-500">Select check-in and check-out dates</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 bg-white border-2 border-gray-100 shadow-2xl rounded-xl" align="start">
          <div className="p-4 bg-gradient-to-br from-lightGreen/5 to-darkGreen/5 rounded-t-xl">
            <h4 className="font-semibold text-gray-800 text-center">Select Your Stay Dates</h4>
            <p className="text-sm text-gray-600 text-center mt-1">Choose check-in and check-out dates</p>
          </div>
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
                backgroundColor: '#fef2f2',
                color: '#dc2626',
                textDecoration: 'line-through',
                border: '1px solid #fee2e2',
                opacity: '0.6'
              }
            }}
            classNames={{
              months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0 p-4",
              month: "space-y-4",
              caption: "flex justify-center pt-1 relative items-center",
              caption_label: "text-base font-semibold text-gray-800",
              nav: "space-x-1 flex items-center",
              nav_button: cn(
                "inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                "disabled:pointer-events-none disabled:opacity-50",
                "border border-gray-200 bg-white hover:bg-lightGreen hover:text-white",
                "h-9 w-9"
              ),
              nav_button_previous: "absolute left-0",
              nav_button_next: "absolute right-0",
              table: "w-full border-collapse space-y-1",
              head_row: "flex",
              head_cell: "text-gray-600 rounded-md w-10 font-medium text-[0.8rem] text-center",
              row: "flex w-full mt-2",
              cell: "text-center text-sm p-0 relative focus-within:relative focus-within:z-20",
              day: cn(
                "h-10 w-10 p-0 font-normal aria-selected:opacity-100 rounded-lg transition-all duration-200",
                "hover:bg-lightGreen/20 hover:text-darkGreen hover:scale-105",
                "focus:bg-lightGreen/30 focus:text-darkGreen focus:outline-none focus:ring-2 focus:ring-lightGreen/50"
              ),
              day_selected: "bg-darkGreen text-white hover:bg-darkGreen hover:text-white focus:bg-darkGreen focus:text-white font-semibold shadow-md",
              day_today: "bg-lightYellow/30 text-darkGreen font-semibold border-2 border-lightYellow",
              day_outside: "text-gray-300 opacity-50",
              day_disabled: "text-gray-300 opacity-30 cursor-not-allowed",
              day_range_middle: "aria-selected:bg-lightGreen/20 aria-selected:text-darkGreen hover:aria-selected:bg-lightGreen/30",
              day_range_end: "bg-darkGreen text-white hover:bg-darkGreen hover:text-white focus:bg-darkGreen focus:text-white font-semibold shadow-md",
              day_range_start: "bg-darkGreen text-white hover:bg-darkGreen hover:text-white focus:bg-darkGreen focus:text-white font-semibold shadow-md",
              day_hidden: "invisible",
            }}
          />
        </PopoverContent>
      </Popover>

      {date.from && date.to && (
        <div className="bg-gradient-to-r from-lightGreen/5 to-darkGreen/5 rounded-xl p-4 border border-lightGreen/20 space-y-3">
          <h4 className="font-semibold text-gray-800 text-center mb-3">Booking Summary</h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white rounded-lg p-3 border border-gray-100">
              <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Check-in</div>
              <div className="font-semibold text-gray-900">{format(date.from, "EEE, MMM d")}</div>
              <div className="text-xs text-gray-600">{format(date.from, "yyyy")}</div>
            </div>
            <div className="bg-white rounded-lg p-3 border border-gray-100">
              <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Check-out</div>
              <div className="font-semibold text-gray-900">{format(date.to, "EEE, MMM d")}</div>
              <div className="text-xs text-gray-600">{format(date.to, "yyyy")}</div>
            </div>
          </div>
          <div className="flex justify-between items-center py-2 border-t border-gray-200">
            <span className="text-gray-600">Duration:</span>
            <span className="font-semibold text-darkGreen">{nights} {nights === 1 ? 'night' : 'nights'}</span>
          </div>
          {price && (
            <div className="flex justify-between items-center py-2 border-t border-gray-200">
              <span className="text-gray-600">Total Cost:</span>
              <span className="text-xl font-bold text-darkGreen">{formatCurrency(totalPrice)}</span>
            </div>
          )}
          
          {nights < minBookingDays && (
            <Badge variant="destructive" className="w-full justify-center py-2 bg-red-100 text-red-700 border border-red-200">
              Minimum stay is {minBookingDays} {minBookingDays === 1 ? 'night' : 'nights'}
            </Badge>
          )}
          
          {nights > maxBookingDays && (
            <Badge variant="destructive" className="w-full justify-center py-2 bg-red-100 text-red-700 border border-red-200">
              Maximum stay is {maxBookingDays} nights
            </Badge>
          )}
        </div>
      )}
    </div>
  )
} 