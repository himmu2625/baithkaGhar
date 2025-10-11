"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  TrendingUp,
  TrendingDown,
  Check,
  X,
  Flame,
} from "lucide-react"
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  getDay,
} from "date-fns"

interface PricingData {
  date: string
  prices: {
    planType: "EP" | "CP" | "MAP" | "AP"
    occupancyType: "SINGLE" | "DOUBLE" | "TRIPLE" | "QUAD"
    price: number
    isLowest?: boolean
  }[]
  seasonType?: string
  isAvailable: boolean
}

interface EnhancedPricingCalendarProps {
  propertyId: string
  roomCategory: string
  selectedPlan: string
  selectedOccupancy: string
  onDateSelect?: (date: Date) => void
  onDateRangeSelect?: (startDate: Date, endDate: Date) => void
  mode?: "single" | "range"
  className?: string
}

// Format price in k format (e.g., 3500 -> 3.5k, 1500 -> 1.5k)
const formatPriceInK = (price: number): string => {
  if (price >= 1000) {
    const priceInK = price / 1000
    // If it's a whole number, show without decimals (e.g., 5k)
    // Otherwise show one decimal place (e.g., 3.5k)
    const formatted = priceInK % 1 === 0 ? `${priceInK}k` : `${priceInK.toFixed(1)}k`
    console.log(`[Price Format] ${price} -> ${formatted}`)
    return formatted
  }
  return price.toString()
}

export default function EnhancedPricingCalendar({
  propertyId,
  roomCategory,
  selectedPlan,
  selectedOccupancy,
  onDateSelect,
  onDateRangeSelect,
  mode = "single",
  className = "",
}: EnhancedPricingCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [pricingData, setPricingData] = useState<PricingData[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedRange, setSelectedRange] = useState<{
    start: Date | null
    end: Date | null
  }>({
    start: null,
    end: null,
  })

  // Fetch pricing data for current month
  useEffect(() => {
    fetchPricingData()
  }, [currentDate, propertyId, roomCategory, selectedPlan, selectedOccupancy])

  const fetchPricingData = async () => {
    setLoading(true)
    try {
      const startDate = startOfMonth(currentDate)
      const endDate = endOfMonth(currentDate)

      const response = await fetch(
        `/api/pricing/calendar?` +
          new URLSearchParams({
            propertyId,
            roomCategory,
            selectedPlan: selectedPlan || "EP",
            selectedOccupancy: selectedOccupancy || "DOUBLE",
            startDate: format(startDate, "yyyy-MM-dd"),
            endDate: format(endDate, "yyyy-MM-dd"),
          })
      )

      if (response.ok) {
        const contentType = response.headers.get("content-type")
        if (contentType && contentType.includes("application/json")) {
          const data = await response.json()
          setPricingData(data.pricing || [])
        } else {
          console.error("API returned non-JSON response")
          setPricingData([])
        }
      } else {
        console.error(`API error: ${response.status} ${response.statusText}`)
        setPricingData([])
      }
    } catch (error) {
      console.error("Error fetching pricing data:", error)
      setPricingData([])
    } finally {
      setLoading(false)
    }
  }

  const handleDateClick = (date: Date) => {
    if (mode === "single") {
      setSelectedDate(date)
      onDateSelect?.(date)
    } else {
      // Range mode
      if (!selectedRange.start || (selectedRange.start && selectedRange.end)) {
        setSelectedRange({ start: date, end: null })
      } else if (selectedRange.start && !selectedRange.end) {
        const start = selectedRange.start
        const end = date
        if (start <= end) {
          setSelectedRange({ start, end })
          onDateRangeSelect?.(start, end)
        } else {
          setSelectedRange({ start: date, end: null })
        }
      }
    }
  }

  const getPriceForDate = (
    date: Date
  ): { price: number; isLowest: boolean; seasonType?: string } => {
    const dateStr = format(date, "yyyy-MM-dd")
    const dayPricing = pricingData.find((p) => p.date === dateStr)

    if (!dayPricing) {
      return { price: 0, isLowest: false }
    }

    const selectedPrice = dayPricing.prices.find(
      (p) =>
        p.planType === selectedPlan && p.occupancyType === selectedOccupancy
    )

    if (selectedPrice) {
      return {
        price: selectedPrice.price,
        isLowest: selectedPrice.isLowest || false,
        seasonType: dayPricing.seasonType,
      }
    }

    // Find lowest price for any plan/occupancy if selected combination not available
    const allPrices = dayPricing.prices.map((p) => p.price)
    const lowestPrice = Math.min(...allPrices)

    return {
      price: lowestPrice,
      isLowest: true,
      seasonType: dayPricing.seasonType,
    }
  }

  const isDateInRange = (date: Date): boolean => {
    if (mode !== "range" || !selectedRange.start) return false

    if (selectedRange.end) {
      return date >= selectedRange.start && date <= selectedRange.end
    } else {
      return isSameDay(date, selectedRange.start)
    }
  }

  const navigateMonth = (direction: "prev" | "next") => {
    setCurrentDate(
      direction === "prev"
        ? subMonths(currentDate, 1)
        : addMonths(currentDate, 1)
    )
  }

  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const calendarDays = eachDayOfInterval({ start: monthStart, end: monthEnd })

  // Get the day of week for the first day of month (0 = Sunday, 6 = Saturday)
  const firstDayOfWeek = getDay(monthStart)

  // Create empty cells for days before the month starts
  const emptyDays = Array(firstDayOfWeek).fill(null)

  return (
    <div className={className}>
      {/* Compact Header Section */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Calendar className="h-4 w-4 text-blue-600" />
          <h3 className="text-sm font-semibold text-gray-900">
            Pricing Calendar
          </h3>
        </div>

        {/* Compact Calendar Controls */}
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 hover:bg-gray-100"
            onClick={() => navigateMonth("prev")}
          >
            <ChevronLeft className="h-3 w-3" />
          </Button>
          <span className="text-sm font-medium text-gray-700 min-w-[100px] text-center">
            {format(currentDate, "MMM yyyy")}
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 hover:bg-gray-100"
            onClick={() => navigateMonth("next")}
          >
            <ChevronRight className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Compact Filters */}
      {(selectedPlan || selectedOccupancy) && (
        <div className="flex items-center space-x-2 mb-3 text-xs text-gray-600">
          <span>Showing:</span>
          {selectedPlan && (
            <Badge variant="outline" className="h-5 px-2 text-xs">
              {selectedPlan}
            </Badge>
          )}
          {selectedOccupancy && (
            <Badge variant="outline" className="h-5 px-2 text-xs">
              {selectedOccupancy}
            </Badge>
          )}
        </div>
      )}

      {/* Compact Legend */}
      <div className="flex items-center justify-center space-x-4 mb-3 text-xs text-gray-600">
        <div className="flex items-center space-x-1">
          <div className="w-3 h-3 bg-green-100 border border-green-300 rounded"></div>
          <span>Available</span>
        </div>
        <div className="flex items-center space-x-1">
          <div className="w-3 h-3 bg-red-100 border border-red-300 rounded"></div>
          <span>Unavailable</span>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div>
          {/* Compact Calendar Grid */}
          <div className="grid grid-cols-7 gap-0.5">
            {/* Day headers */}
            {["S", "M", "T", "W", "T", "F", "S"].map((day, index) => (
              <div
                key={`day-${index}`}
                className="h-6 flex items-center justify-center text-xs font-medium text-gray-500"
              >
                {day}
              </div>
            ))}

            {/* Empty cells for alignment */}
            {emptyDays.map((_, index) => (
              <div key={`empty-${index}`} className="h-12"></div>
            ))}

            {/* Calendar days */}
            {calendarDays.map((date, index) => {
              const pricing = getPriceForDate(date)
              const isSelected = selectedDate && isSameDay(date, selectedDate)
              const isInRange = isDateInRange(date)
              const isCurrentMonth = isSameMonth(date, currentDate)
              const isToday = isSameDay(date, new Date())
              const dayOfWeek = getDay(date)
              const isWeekend = dayOfWeek === 0 || dayOfWeek === 6
              const isPastDate =
                date < new Date(new Date().setHours(0, 0, 0, 0))

              // Determine if date is available (not past date and has pricing data)
              const isAvailable = !isPastDate && pricing.price > 0

              // Determine background color based on status
              let bgColor = ""
              if (isSelected) {
                bgColor = "bg-blue-500 text-white"
              } else if (isInRange) {
                bgColor = "bg-blue-100"
              } else if (isToday) {
                bgColor = "bg-blue-50 ring-1 ring-blue-400"
              } else if (!isAvailable) {
                bgColor = "bg-red-50 border-red-200"
              } else {
                bgColor = "bg-green-50 border-green-200"
              }

              return (
                <div
                  key={index}
                  className={`
                    relative w-10 h-10 border border-gray-200 transition-all duration-150 flex flex-col justify-between p-1
                    ${!isCurrentMonth ? "opacity-40" : ""}
                    ${
                      isAvailable
                        ? "cursor-pointer hover:shadow-sm"
                        : "cursor-not-allowed opacity-60"
                    }
                    ${bgColor}
                  `}
                  onClick={() =>
                    isAvailable ? handleDateClick(date) : undefined
                  }
                  title={
                    isAvailable
                      ? `Available at ₹${pricing.price.toLocaleString()} (${selectedOccupancy} Sharing, ${selectedPlan})`
                      : isPastDate
                      ? "Past date - not available"
                      : "Unavailable"
                  }
                >
                  {/* Date number - top left */}
                  <div className="text-xs text-gray-500 leading-none">
                    {format(date, "d")}
                  </div>

                  {/* Price - center */}
                  <div className="flex-1 flex items-center justify-center">
                    {isAvailable ? (
                      <div
                        className={`text-xs font-bold text-center leading-none ${
                          isSelected ? "text-white" : "text-gray-900"
                        }`}
                      >
                        ₹{formatPriceInK(pricing.price)}
                      </div>
                    ) : (
                      <div className="text-xs font-bold text-center leading-none text-gray-400">
                        ₹∞
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Compact Selected range info */}
          {mode === "range" && selectedRange.start && selectedRange.end && (
            <div className="mt-3 p-2 bg-blue-50 rounded text-xs text-blue-700 text-center">
              <span className="font-medium">
                {format(selectedRange.start, "MMM dd")} -{" "}
                {format(selectedRange.end, "MMM dd")}
              </span>
              <span className="ml-2">
                (
                {Math.ceil(
                  (selectedRange.end.getTime() -
                    selectedRange.start.getTime()) /
                    (1000 * 60 * 60 * 24)
                )}{" "}
                nights)
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
