"use client"

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Calendar as CalendarIcon,
  Edit,
  User,
  Mail,
  Phone,
  Users,
  IndianRupee,
  Clock,
  AlertTriangle,
  Check,
  Save,
  X,
  RefreshCw,
  History
} from 'lucide-react'
import { format, startOfDay } from 'date-fns'
import { cn } from '@/lib/utils'
import { useToast } from '@/components/ui/use-toast'

interface Booking {
  _id: string
  userId: {
    _id: string
    name: string
    email: string
    phone?: string
  }
  propertyId: string
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed'
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded'
  dateFrom: string
  dateTo: string
  totalAmount: number
  adults: number
  children: number
  rooms: number
  specialRequests?: string
  adminNotes?: string
  createdAt: string
  updatedAt: string
  contactDetails?: {
    name: string
    email: string
    phone: string
  }
}

interface BookingEditFormProps {
  booking: Booking
  onBookingUpdated?: (booking: Booking) => void
  onCancel?: () => void
  triggerButton?: React.ReactNode
}

export function BookingEditForm({
  booking,
  onBookingUpdated,
  onCancel,
  triggerButton
}: BookingEditFormProps) {
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    guestDetails: {
      name: booking.contactDetails?.name || booking.userId.name || '',
      email: booking.contactDetails?.email || booking.userId.email || '',
      phone: booking.contactDetails?.phone || booking.userId.phone || ''
    },
    dateFrom: new Date(booking.dateFrom),
    dateTo: new Date(booking.dateTo),
    guests: booking.adults || 1,
    children: booking.children || 0,
    rooms: booking.rooms || 1,
    totalAmount: booking.totalAmount || 0,
    specialRequests: booking.specialRequests || '',
    paymentStatus: booking.paymentStatus || 'pending',
    status: booking.status || 'confirmed',
    adminNotes: booking.adminNotes || ''
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  const [availabilityCheck, setAvailabilityCheck] = useState<{
    isChecking: boolean
    isAvailable: boolean | null
    message: string
  }>({
    isChecking: false,
    isAvailable: null,
    message: ''
  })

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount)
  }

  // Check if form data has changed from original
  useEffect(() => {
    const originalData = {
      guestDetails: {
        name: booking.contactDetails?.name || booking.userId.name || '',
        email: booking.contactDetails?.email || booking.userId.email || '',
        phone: booking.contactDetails?.phone || booking.userId.phone || ''
      },
      dateFrom: new Date(booking.dateFrom),
      dateTo: new Date(booking.dateTo),
      guests: booking.adults || 1,
      children: booking.children || 0,
      rooms: booking.rooms || 1,
      totalAmount: booking.totalAmount || 0,
      specialRequests: booking.specialRequests || '',
      paymentStatus: booking.paymentStatus || 'pending',
      status: booking.status || 'confirmed',
      adminNotes: booking.adminNotes || ''
    }

    const hasChanged = JSON.stringify(formData) !== JSON.stringify(originalData)
    setHasChanges(hasChanged)
  }, [formData, booking])

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    // Guest details validation
    if (!formData.guestDetails.name.trim()) {
      newErrors.name = 'Guest name is required'
    }
    if (!formData.guestDetails.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.guestDetails.email)) {
      newErrors.email = 'Invalid email format'
    }

    // Date validation
    if (!formData.dateFrom) {
      newErrors.dateFrom = 'Check-in date is required'
    }
    if (!formData.dateTo) {
      newErrors.dateTo = 'Check-out date is required'
    }
    if (formData.dateFrom && formData.dateTo && formData.dateTo <= formData.dateFrom) {
      newErrors.dateTo = 'Check-out date must be after check-in date'
    }

    // Guest count validation
    if (formData.guests < 1) {
      newErrors.guests = 'At least 1 guest is required'
    }
    if (formData.rooms < 1) {
      newErrors.rooms = 'At least 1 room is required'
    }

    // Total amount validation
    if (formData.totalAmount <= 0) {
      newErrors.totalAmount = 'Total amount must be greater than 0'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const checkAvailability = async () => {
    // Skip availability check if dates haven't changed
    const originalDateFrom = new Date(booking.dateFrom)
    const originalDateTo = new Date(booking.dateTo)

    if (
      formData.dateFrom.getTime() === originalDateFrom.getTime() &&
      formData.dateTo.getTime() === originalDateTo.getTime() &&
      formData.rooms === booking.rooms
    ) {
      setAvailabilityCheck({
        isChecking: false,
        isAvailable: true,
        message: 'Current booking dates'
      })
      return
    }

    setAvailabilityCheck({ isChecking: true, isAvailable: null, message: 'Checking availability...' })

    try {
      const response = await fetch(`/api/os/properties/${booking.propertyId}/availability`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dateFrom: formData.dateFrom.toISOString(),
          dateTo: formData.dateTo.toISOString(),
          rooms: formData.rooms,
          guests: formData.guests,
          excludeBookingId: booking._id // Exclude current booking from availability check
        })
      })

      const data = await response.json()

      if (data.success && data.available) {
        setAvailabilityCheck({
          isChecking: false,
          isAvailable: true,
          message: 'Dates are available for modification!'
        })
      } else {
        setAvailabilityCheck({
          isChecking: false,
          isAvailable: false,
          message: data.message || 'Dates are not available'
        })
      }
    } catch (error) {
      setAvailabilityCheck({
        isChecking: false,
        isAvailable: false,
        message: 'Error checking availability'
      })
    }
  }

  useEffect(() => {
    if (formData.dateFrom && formData.dateTo) {
      const timer = setTimeout(() => {
        checkAvailability()
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [formData.dateFrom, formData.dateTo, formData.rooms])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      toast({
        title: "Validation Error",
        description: "Please fix the errors before submitting",
        variant: "destructive"
      })
      return
    }

    if (availabilityCheck.isAvailable === false) {
      toast({
        title: "Availability Error",
        description: "Selected dates are not available",
        variant: "destructive"
      })
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch(`/api/os/bookings/${booking.propertyId}/${booking._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          guestDetails: formData.guestDetails,
          dateFrom: formData.dateFrom.toISOString(),
          dateTo: formData.dateTo.toISOString(),
          guests: formData.guests,
          children: formData.children,
          rooms: formData.rooms,
          totalPrice: formData.totalAmount,
          specialRequests: formData.specialRequests,
          paymentStatus: formData.paymentStatus,
          status: formData.status,
          adminNotes: formData.adminNotes,
          contactDetails: formData.guestDetails
        })
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: "Booking Updated",
          description: "Booking has been updated successfully"
        })

        setIsDialogOpen(false)

        if (onBookingUpdated) {
          onBookingUpdated(result.booking)
        }
      } else {
        toast({
          title: "Update Failed",
          description: result.error || "Failed to update booking",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error updating booking:', error)
      toast({
        title: "Error",
        description: "Failed to update booking. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    // Reset form data to original values
    setFormData({
      guestDetails: {
        name: booking.contactDetails?.name || booking.userId.name || '',
        email: booking.contactDetails?.email || booking.userId.email || '',
        phone: booking.contactDetails?.phone || booking.userId.phone || ''
      },
      dateFrom: new Date(booking.dateFrom),
      dateTo: new Date(booking.dateTo),
      guests: booking.adults || 1,
      children: booking.children || 0,
      rooms: booking.rooms || 1,
      totalAmount: booking.totalAmount || 0,
      specialRequests: booking.specialRequests || '',
      paymentStatus: booking.paymentStatus || 'pending',
      status: booking.status || 'confirmed',
      adminNotes: booking.adminNotes || ''
    })
    setErrors({})
    setIsDialogOpen(false)
    if (onCancel) onCancel()
  }

  const nights = formData.dateFrom && formData.dateTo
    ? Math.ceil((formData.dateTo.getTime() - formData.dateFrom.getTime()) / (1000 * 60 * 60 * 24))
    : 0

  const defaultTrigger = (
    <Button variant="outline" size="sm">
      <Edit className="h-4 w-4 mr-1" />
      Edit
    </Button>
  )

  const getStatusBadgeStyle = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'completed':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        {triggerButton || defaultTrigger}
      </DialogTrigger>

      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5" />
            Edit Booking - {booking._id.slice(-8)}
          </DialogTitle>
        </DialogHeader>

        {/* Booking History Info */}
        <Card className="bg-gray-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div>
                  <div className="text-sm font-medium">Current Status</div>
                  <Badge className={getStatusBadgeStyle(booking.status)}>
                    {booking.status}
                  </Badge>
                </div>
                <Separator orientation="vertical" className="h-8" />
                <div>
                  <div className="text-sm font-medium">Created</div>
                  <div className="text-sm text-gray-600">
                    {format(new Date(booking.createdAt), 'MMM d, yyyy - h:mm a')}
                  </div>
                </div>
                <Separator orientation="vertical" className="h-8" />
                <div>
                  <div className="text-sm font-medium">Last Updated</div>
                  <div className="text-sm text-gray-600">
                    {format(new Date(booking.updatedAt), 'MMM d, yyyy - h:mm a')}
                  </div>
                </div>
              </div>
              {hasChanges && (
                <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  Unsaved Changes
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Guest Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <User className="h-5 w-5" />
                Guest Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Guest Name *</Label>
                  <Input
                    id="name"
                    value={formData.guestDetails.name}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      guestDetails: { ...prev.guestDetails, name: e.target.value }
                    }))}
                    className={errors.name ? 'border-red-500' : ''}
                  />
                  {errors.name && <p className="text-sm text-red-500 mt-1">{errors.name}</p>}
                </div>

                <div>
                  <Label htmlFor="email">Email Address *</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="email"
                      type="email"
                      value={formData.guestDetails.email}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        guestDetails: { ...prev.guestDetails, email: e.target.value }
                      }))}
                      className={cn("pl-10", errors.email ? 'border-red-500' : '')}
                    />
                  </div>
                  {errors.email && <p className="text-sm text-red-500 mt-1">{errors.email}</p>}
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="phone"
                      value={formData.guestDetails.phone}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        guestDetails: { ...prev.guestDetails, phone: e.target.value }
                      }))}
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Booking Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <CalendarIcon className="h-5 w-5" />
                Booking Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Check-in Date */}
                <div>
                  <Label>Check-in Date *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !formData.dateFrom && "text-muted-foreground",
                          errors.dateFrom && "border-red-500"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.dateFrom ? format(formData.dateFrom, "PPP") : "Select date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={formData.dateFrom}
                        onSelect={(date) => date && setFormData(prev => ({ ...prev, dateFrom: date }))}
                        disabled={(date) => date < startOfDay(new Date())}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  {errors.dateFrom && <p className="text-sm text-red-500 mt-1">{errors.dateFrom}</p>}
                </div>

                {/* Check-out Date */}
                <div>
                  <Label>Check-out Date *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !formData.dateTo && "text-muted-foreground",
                          errors.dateTo && "border-red-500"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.dateTo ? format(formData.dateTo, "PPP") : "Select date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={formData.dateTo}
                        onSelect={(date) => date && setFormData(prev => ({ ...prev, dateTo: date }))}
                        disabled={(date) =>
                          date < startOfDay(new Date()) ||
                          (formData.dateFrom && date <= formData.dateFrom)
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  {errors.dateTo && <p className="text-sm text-red-500 mt-1">{errors.dateTo}</p>}
                </div>

                {/* Guests */}
                <div>
                  <Label htmlFor="guests">Adults *</Label>
                  <div className="relative">
                    <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="guests"
                      type="number"
                      min="1"
                      value={formData.guests}
                      onChange={(e) => setFormData(prev => ({ ...prev, guests: parseInt(e.target.value) || 1 }))}
                      className={cn("pl-10", errors.guests ? 'border-red-500' : '')}
                    />
                  </div>
                  {errors.guests && <p className="text-sm text-red-500 mt-1">{errors.guests}</p>}
                </div>

                {/* Children */}
                <div>
                  <Label htmlFor="children">Children</Label>
                  <Input
                    id="children"
                    type="number"
                    min="0"
                    value={formData.children}
                    onChange={(e) => setFormData(prev => ({ ...prev, children: parseInt(e.target.value) || 0 }))}
                  />
                </div>

                {/* Rooms */}
                <div>
                  <Label htmlFor="rooms">Rooms *</Label>
                  <Input
                    id="rooms"
                    type="number"
                    min="1"
                    value={formData.rooms}
                    onChange={(e) => setFormData(prev => ({ ...prev, rooms: parseInt(e.target.value) || 1 }))}
                    className={errors.rooms ? 'border-red-500' : ''}
                  />
                  {errors.rooms && <p className="text-sm text-red-500 mt-1">{errors.rooms}</p>}
                </div>

                {/* Total Amount */}
                <div>
                  <Label htmlFor="totalAmount">Total Amount *</Label>
                  <div className="relative">
                    <IndianRupee className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="totalAmount"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.totalAmount}
                      onChange={(e) => setFormData(prev => ({ ...prev, totalAmount: parseFloat(e.target.value) || 0 }))}
                      className={cn("pl-10", errors.totalAmount ? 'border-red-500' : '')}
                    />
                  </div>
                  {errors.totalAmount && <p className="text-sm text-red-500 mt-1">{errors.totalAmount}</p>}
                </div>
              </div>

              {/* Availability Check */}
              {(formData.dateFrom && formData.dateTo) && (
                <Alert className={
                  availabilityCheck.isAvailable === true ? 'border-green-200 bg-green-50' :
                  availabilityCheck.isAvailable === false ? 'border-red-200 bg-red-50' :
                  'border-blue-200 bg-blue-50'
                }>
                  {availabilityCheck.isChecking ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : availabilityCheck.isAvailable === true ? (
                    <Check className="h-4 w-4 text-green-600" />
                  ) : availabilityCheck.isAvailable === false ? (
                    <X className="h-4 w-4 text-red-600" />
                  ) : (
                    <AlertTriangle className="h-4 w-4" />
                  )}
                  <AlertDescription className={
                    availabilityCheck.isAvailable === true ? 'text-green-800' :
                    availabilityCheck.isAvailable === false ? 'text-red-800' :
                    'text-blue-800'
                  }>
                    {availabilityCheck.message}
                  </AlertDescription>
                </Alert>
              )}

              {/* Booking Summary */}
              {nights > 0 && (
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">Updated Booking Summary</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-blue-600">Duration:</span>
                      <div className="font-medium">{nights} night{nights !== 1 ? 's' : ''}</div>
                    </div>
                    <div>
                      <span className="text-blue-600">Guests:</span>
                      <div className="font-medium">{formData.guests + formData.children} total</div>
                    </div>
                    <div>
                      <span className="text-blue-600">Per Night:</span>
                      <div className="font-medium">{formatCurrency(formData.totalAmount / nights)}</div>
                    </div>
                    <div>
                      <span className="text-blue-600">Total:</span>
                      <div className="font-medium text-lg">{formatCurrency(formData.totalAmount)}</div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Status and Additional Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Status & Additional Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="status">Booking Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value: 'pending' | 'confirmed' | 'cancelled' | 'completed') =>
                      setFormData(prev => ({ ...prev, status: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="confirmed">Confirmed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="paymentStatus">Payment Status</Label>
                  <Select
                    value={formData.paymentStatus}
                    onValueChange={(value: 'pending' | 'paid' | 'failed' | 'refunded') =>
                      setFormData(prev => ({ ...prev, paymentStatus: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="paid">Paid</SelectItem>
                      <SelectItem value="failed">Failed</SelectItem>
                      <SelectItem value="refunded">Refunded</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="specialRequests">Special Requests</Label>
                <Textarea
                  id="specialRequests"
                  value={formData.specialRequests}
                  onChange={(e) => setFormData(prev => ({ ...prev, specialRequests: e.target.value }))}
                  placeholder="Any special requests from the guest..."
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="adminNotes">Admin Notes</Label>
                <Textarea
                  id="adminNotes"
                  value={formData.adminNotes}
                  onChange={(e) => setFormData(prev => ({ ...prev, adminNotes: e.target.value }))}
                  placeholder="Internal notes for staff..."
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>

          {/* Form Actions */}
          <div className="flex justify-between pt-4 border-t">
            <Button type="button" variant="outline" onClick={handleCancel}>
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>

            <div className="flex space-x-3">
              <Button
                type="submit"
                disabled={isSubmitting || !hasChanges || availabilityCheck.isAvailable === false}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}