"use client"

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Search,
  Filter,
  Calendar as CalendarIcon,
  Users,
  IndianRupee,
  X,
  RotateCcw,
  SlidersHorizontal,
  ChevronDown,
  User,
  Mail,
  Phone,
  MapPin,
  CreditCard,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle
} from 'lucide-react'
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, subDays } from 'date-fns'
import { cn } from '@/lib/utils'

export interface BookingFilters {
  search: string
  status: string[]
  paymentStatus: string[]
  dateRange: {
    from: Date | undefined
    to: Date | undefined
  }
  amountRange: {
    min: number | undefined
    max: number | undefined
  }
  guestCount: {
    min: number | undefined
    max: number | undefined
  }
  source: string[]
  roomType: string[]
  sortBy: string
  sortOrder: 'asc' | 'desc'
}

interface BookingSearchFiltersProps {
  filters: BookingFilters
  onFiltersChange: (filters: BookingFilters) => void
  onSearch: () => void
  onReset: () => void
  resultCount?: number
  isLoading?: boolean
}

const defaultFilters: BookingFilters = {
  search: '',
  status: [],
  paymentStatus: [],
  dateRange: { from: undefined, to: undefined },
  amountRange: { min: undefined, max: undefined },
  guestCount: { min: undefined, max: undefined },
  source: [],
  roomType: [],
  sortBy: 'createdAt',
  sortOrder: 'desc'
}

const STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'confirmed', label: 'Confirmed', color: 'bg-green-100 text-green-800' },
  { value: 'cancelled', label: 'Cancelled', color: 'bg-red-100 text-red-800' },
  { value: 'completed', label: 'Completed', color: 'bg-blue-100 text-blue-800' }
]

const PAYMENT_STATUS_OPTIONS = [
  { value: 'pending', label: 'Payment Pending', color: 'bg-orange-100 text-orange-800' },
  { value: 'paid', label: 'Paid', color: 'bg-green-100 text-green-800' },
  { value: 'failed', label: 'Payment Failed', color: 'bg-red-100 text-red-800' },
  { value: 'refunded', label: 'Refunded', color: 'bg-purple-100 text-purple-800' }
]

const SOURCE_OPTIONS = [
  { value: 'direct', label: 'Direct Booking' },
  { value: 'booking.com', label: 'Booking.com' },
  { value: 'airbnb', label: 'Airbnb' },
  { value: 'expedia', label: 'Expedia' },
  { value: 'agoda', label: 'Agoda' },
  { value: 'phone', label: 'Phone Booking' },
  { value: 'walkin', label: 'Walk-in' }
]

const SORT_OPTIONS = [
  { value: 'createdAt', label: 'Date Created' },
  { value: 'dateFrom', label: 'Check-in Date' },
  { value: 'dateTo', label: 'Check-out Date' },
  { value: 'totalAmount', label: 'Total Amount' },
  { value: 'guestName', label: 'Guest Name' },
  { value: 'updatedAt', label: 'Last Updated' }
]

const DATE_PRESETS = [
  {
    label: 'Today',
    getValue: () => ({
      from: new Date(),
      to: new Date()
    })
  },
  {
    label: 'This Week',
    getValue: () => ({
      from: startOfWeek(new Date()),
      to: endOfWeek(new Date())
    })
  },
  {
    label: 'This Month',
    getValue: () => ({
      from: startOfMonth(new Date()),
      to: endOfMonth(new Date())
    })
  },
  {
    label: 'Last 7 Days',
    getValue: () => ({
      from: subDays(new Date(), 7),
      to: new Date()
    })
  },
  {
    label: 'Last 30 Days',
    getValue: () => ({
      from: subDays(new Date(), 30),
      to: new Date()
    })
  }
]

export function BookingSearchFilters({
  filters,
  onFiltersChange,
  onSearch,
  onReset,
  resultCount,
  isLoading
}: BookingSearchFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false)

  const updateFilters = (updates: Partial<BookingFilters>) => {
    onFiltersChange({ ...filters, ...updates })
  }

  const handleStatusChange = (status: string, checked: boolean) => {
    const newStatus = checked
      ? [...filters.status, status]
      : filters.status.filter(s => s !== status)
    updateFilters({ status: newStatus })
  }

  const handlePaymentStatusChange = (status: string, checked: boolean) => {
    const newPaymentStatus = checked
      ? [...filters.paymentStatus, status]
      : filters.paymentStatus.filter(s => s !== status)
    updateFilters({ paymentStatus: newPaymentStatus })
  }

  const handleSourceChange = (source: string, checked: boolean) => {
    const newSource = checked
      ? [...filters.source, source]
      : filters.source.filter(s => s !== source)
    updateFilters({ source: newSource })
  }

  const handleDatePreset = (preset: { from: Date; to: Date }) => {
    updateFilters({ dateRange: preset })
    setIsDatePickerOpen(false)
  }

  const handleReset = () => {
    onFiltersChange(defaultFilters)
    onReset()
  }

  const getActiveFilterCount = () => {
    let count = 0
    if (filters.search) count++
    if (filters.status.length > 0) count++
    if (filters.paymentStatus.length > 0) count++
    if (filters.dateRange.from || filters.dateRange.to) count++
    if (filters.amountRange.min || filters.amountRange.max) count++
    if (filters.guestCount.min || filters.guestCount.max) count++
    if (filters.source.length > 0) count++
    if (filters.roomType.length > 0) count++
    return count
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount)
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Search & Filters</CardTitle>
          <div className="flex items-center space-x-2">
            {resultCount !== undefined && (
              <Badge variant="outline" className="bg-blue-50 text-blue-700">
                {resultCount} results
              </Badge>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              <SlidersHorizontal className="h-4 w-4 mr-2" />
              {isExpanded ? 'Hide' : 'Show'} Filters
              {getActiveFilterCount() > 0 && (
                <Badge className="ml-2 h-5 w-5 rounded-full p-0 bg-blue-600 text-white text-xs">
                  {getActiveFilterCount()}
                </Badge>
              )}
              <ChevronDown className={cn("h-4 w-4 ml-1 transition-transform", isExpanded && "rotate-180")} />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Search Bar */}
        <div className="flex space-x-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by guest name, email, phone, or booking ID..."
              value={filters.search}
              onChange={(e) => updateFilters({ search: e.target.value })}
              className="pl-10"
            />
          </div>
          <Button onClick={onSearch} disabled={isLoading}>
            <Search className="h-4 w-4 mr-2" />
            Search
          </Button>
          <Button variant="outline" onClick={handleReset}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset
          </Button>
        </div>

        {/* Quick Status Filters */}
        <div className="flex flex-wrap gap-2">
          {STATUS_OPTIONS.map((option) => (
            <Badge
              key={option.value}
              variant={filters.status.includes(option.value) ? "default" : "outline"}
              className={cn(
                "cursor-pointer hover:opacity-80 transition-opacity",
                filters.status.includes(option.value) && option.color
              )}
              onClick={() => handleStatusChange(option.value, !filters.status.includes(option.value))}
            >
              {option.label}
              {filters.status.includes(option.value) && (
                <X className="h-3 w-3 ml-1" />
              )}
            </Badge>
          ))}
        </div>

        {/* Expanded Filters */}
        {isExpanded && (
          <div className="space-y-6 pt-4 border-t">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Payment Status */}
              <div>
                <Label className="text-sm font-medium mb-3 block">Payment Status</Label>
                <div className="space-y-2">
                  {PAYMENT_STATUS_OPTIONS.map((option) => (
                    <div key={option.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={`payment-${option.value}`}
                        checked={filters.paymentStatus.includes(option.value)}
                        onCheckedChange={(checked) =>
                          handlePaymentStatusChange(option.value, !!checked)
                        }
                      />
                      <Label
                        htmlFor={`payment-${option.value}`}
                        className="text-sm font-normal cursor-pointer"
                      >
                        {option.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Date Range */}
              <div>
                <Label className="text-sm font-medium mb-3 block">Date Range</Label>
                <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {filters.dateRange.from ? (
                        filters.dateRange.to ? (
                          <>
                            {format(filters.dateRange.from, "LLL dd, y")} -{" "}
                            {format(filters.dateRange.to, "LLL dd, y")}
                          </>
                        ) : (
                          format(filters.dateRange.from, "LLL dd, y")
                        )
                      ) : (
                        "Select date range"
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <div className="flex">
                      <div className="border-r p-4">
                        <h4 className="font-medium mb-2">Quick Select</h4>
                        <div className="space-y-1">
                          {DATE_PRESETS.map((preset) => (
                            <Button
                              key={preset.label}
                              variant="ghost"
                              size="sm"
                              className="w-full justify-start"
                              onClick={() => handleDatePreset(preset.getValue())}
                            >
                              {preset.label}
                            </Button>
                          ))}
                        </div>
                      </div>
                      <Calendar
                        initialFocus
                        mode="range"
                        defaultMonth={filters.dateRange.from}
                        selected={filters.dateRange}
                        onSelect={(range) =>
                          updateFilters({ dateRange: { from: range?.from, to: range?.to } })
                        }
                        numberOfMonths={2}
                      />
                    </div>
                  </PopoverContent>
                </Popover>

                {(filters.dateRange.from || filters.dateRange.to) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => updateFilters({ dateRange: { from: undefined, to: undefined } })}
                    className="mt-2 w-full"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Clear dates
                  </Button>
                )}
              </div>

              {/* Amount Range */}
              <div>
                <Label className="text-sm font-medium mb-3 block">Amount Range</Label>
                <div className="space-y-2">
                  <div className="flex space-x-2">
                    <div className="relative flex-1">
                      <IndianRupee className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        type="number"
                        placeholder="Min"
                        value={filters.amountRange.min || ''}
                        onChange={(e) =>
                          updateFilters({
                            amountRange: {
                              ...filters.amountRange,
                              min: e.target.value ? parseFloat(e.target.value) : undefined
                            }
                          })
                        }
                        className="pl-10"
                      />
                    </div>
                    <div className="relative flex-1">
                      <IndianRupee className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        type="number"
                        placeholder="Max"
                        value={filters.amountRange.max || ''}
                        onChange={(e) =>
                          updateFilters({
                            amountRange: {
                              ...filters.amountRange,
                              max: e.target.value ? parseFloat(e.target.value) : undefined
                            }
                          })
                        }
                        className="pl-10"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Guest Count */}
              <div>
                <Label className="text-sm font-medium mb-3 block">Guest Count</Label>
                <div className="space-y-2">
                  <div className="flex space-x-2">
                    <div className="relative flex-1">
                      <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        type="number"
                        placeholder="Min"
                        value={filters.guestCount.min || ''}
                        onChange={(e) =>
                          updateFilters({
                            guestCount: {
                              ...filters.guestCount,
                              min: e.target.value ? parseInt(e.target.value) : undefined
                            }
                          })
                        }
                        className="pl-10"
                        min="1"
                      />
                    </div>
                    <div className="relative flex-1">
                      <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        type="number"
                        placeholder="Max"
                        value={filters.guestCount.max || ''}
                        onChange={(e) =>
                          updateFilters({
                            guestCount: {
                              ...filters.guestCount,
                              max: e.target.value ? parseInt(e.target.value) : undefined
                            }
                          })
                        }
                        className="pl-10"
                        min="1"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Booking Source */}
              <div>
                <Label className="text-sm font-medium mb-3 block">Booking Source</Label>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {SOURCE_OPTIONS.map((option) => (
                    <div key={option.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={`source-${option.value}`}
                        checked={filters.source.includes(option.value)}
                        onCheckedChange={(checked) =>
                          handleSourceChange(option.value, !!checked)
                        }
                      />
                      <Label
                        htmlFor={`source-${option.value}`}
                        className="text-sm font-normal cursor-pointer"
                      >
                        {option.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Sort Options */}
              <div>
                <Label className="text-sm font-medium mb-3 block">Sort By</Label>
                <div className="space-y-2">
                  <Select
                    value={filters.sortBy}
                    onValueChange={(value) => updateFilters({ sortBy: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SORT_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select
                    value={filters.sortOrder}
                    onValueChange={(value: 'asc' | 'desc') => updateFilters({ sortOrder: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="desc">Newest First</SelectItem>
                      <SelectItem value="asc">Oldest First</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Active Filters Summary */}
            {getActiveFilterCount() > 0 && (
              <div className="pt-4 border-t">
                <div className="flex items-center justify-between mb-3">
                  <Label className="text-sm font-medium">Active Filters</Label>
                  <Button variant="ghost" size="sm" onClick={handleReset}>
                    Clear All
                  </Button>
                </div>

                <div className="flex flex-wrap gap-2">
                  {filters.search && (
                    <Badge variant="secondary" className="gap-1">
                      Search: "{filters.search}"
                      <X
                        className="h-3 w-3 cursor-pointer"
                        onClick={() => updateFilters({ search: '' })}
                      />
                    </Badge>
                  )}

                  {filters.status.map((status) => (
                    <Badge key={`active-status-${status}`} variant="secondary" className="gap-1">
                      Status: {STATUS_OPTIONS.find(o => o.value === status)?.label}
                      <X
                        className="h-3 w-3 cursor-pointer"
                        onClick={() => handleStatusChange(status, false)}
                      />
                    </Badge>
                  ))}

                  {filters.paymentStatus.map((status) => (
                    <Badge key={`active-payment-${status}`} variant="secondary" className="gap-1">
                      Payment: {PAYMENT_STATUS_OPTIONS.find(o => o.value === status)?.label}
                      <X
                        className="h-3 w-3 cursor-pointer"
                        onClick={() => handlePaymentStatusChange(status, false)}
                      />
                    </Badge>
                  ))}

                  {(filters.dateRange.from || filters.dateRange.to) && (
                    <Badge variant="secondary" className="gap-1">
                      Date: {filters.dateRange.from && format(filters.dateRange.from, "MMM d")}
                      {filters.dateRange.from && filters.dateRange.to && " - "}
                      {filters.dateRange.to && format(filters.dateRange.to, "MMM d")}
                      <X
                        className="h-3 w-3 cursor-pointer"
                        onClick={() => updateFilters({ dateRange: { from: undefined, to: undefined } })}
                      />
                    </Badge>
                  )}

                  {(filters.amountRange.min || filters.amountRange.max) && (
                    <Badge variant="secondary" className="gap-1">
                      Amount: {filters.amountRange.min && formatCurrency(filters.amountRange.min)}
                      {filters.amountRange.min && filters.amountRange.max && " - "}
                      {filters.amountRange.max && formatCurrency(filters.amountRange.max)}
                      <X
                        className="h-3 w-3 cursor-pointer"
                        onClick={() => updateFilters({ amountRange: { min: undefined, max: undefined } })}
                      />
                    </Badge>
                  )}

                  {(filters.guestCount.min || filters.guestCount.max) && (
                    <Badge variant="secondary" className="gap-1">
                      Guests: {filters.guestCount.min}
                      {filters.guestCount.min && filters.guestCount.max && " - "}
                      {filters.guestCount.max}
                      <X
                        className="h-3 w-3 cursor-pointer"
                        onClick={() => updateFilters({ guestCount: { min: undefined, max: undefined } })}
                      />
                    </Badge>
                  )}

                  {filters.source.map((source) => (
                    <Badge key={`active-source-${source}`} variant="secondary" className="gap-1">
                      Source: {SOURCE_OPTIONS.find(o => o.value === source)?.label}
                      <X
                        className="h-3 w-3 cursor-pointer"
                        onClick={() => handleSourceChange(source, false)}
                      />
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}