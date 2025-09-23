'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Calendar,
  Users,
  Clock,
  DollarSign,
  Edit,
  Save,
  X,
  Check,
  AlertTriangle,
  Info,
  CreditCard,
  RefreshCw,
  ArrowRight,
  ArrowLeft,
  Bed,
  MapPin,
  Phone,
  Mail,
  User,
  CalendarDays,
  Search,
  ChevronDown,
  ChevronUp,
  Plus,
  Minus
} from 'lucide-react'

interface BookingDetails {
  id: string
  confirmationNumber: string
  guestName: string
  email: string
  phone: string
  checkInDate: string
  checkOutDate: string
  roomType: string
  roomNumber?: string
  guests: number
  status: 'confirmed' | 'checked-in' | 'checked-out' | 'cancelled'
  totalAmount: number
  specialRequests: string[]
  amenities: string[]
  cancellationPolicy: string
  modificationPolicy: string
  lastModified: string
}

interface ModificationRequest {
  type: 'dates' | 'room' | 'guests' | 'special-requests' | 'cancellation'
  newCheckInDate?: string
  newCheckOutDate?: string
  newRoomType?: string
  newGuests?: number
  newSpecialRequests?: string[]
  reason?: string
  pricingDifference?: number
  requiresApproval?: boolean
}

interface ModificationQuote {
  originalAmount: number
  newAmount: number
  difference: number
  fees: number
  refund: number
  requiresPayment: boolean
  availabilityConfirmed: boolean
  restrictions: string[]
}

interface AvailableRoom {
  type: string
  price: number
  available: boolean
  description: string
  amenities: string[]
}

export default function BookingModificationInterface() {
  const [booking, setBooking] = useState<BookingDetails | null>(null)
  const [lookupValue, setLookupValue] = useState('')
  const [modificationType, setModificationType] = useState<ModificationRequest['type'] | null>(null)
  const [modificationData, setModificationData] = useState<ModificationRequest>({
    type: 'dates'
  })
  const [quote, setQuote] = useState<ModificationQuote | null>(null)
  const [availableRooms, setAvailableRooms] = useState<AvailableRoom[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [step, setStep] = useState<'lookup' | 'details' | 'modify' | 'quote' | 'confirm' | 'complete'>('lookup')

  // Mock booking data
  const mockBooking: BookingDetails = {
    id: 'booking-001',
    confirmationNumber: 'BG-2024-001234',
    guestName: 'John Smith',
    email: 'john.smith@example.com',
    phone: '+1 (555) 123-4567',
    checkInDate: '2024-02-15',
    checkOutDate: '2024-02-18',
    roomType: 'Standard King',
    roomNumber: '205',
    guests: 2,
    status: 'confirmed',
    totalAmount: 450,
    specialRequests: ['Late checkout', 'High floor'],
    amenities: ['WiFi', 'Breakfast', 'Parking'],
    cancellationPolicy: 'Free cancellation until 24 hours before check-in',
    modificationPolicy: 'Modifications allowed up to 48 hours before check-in',
    lastModified: '2024-01-10T10:30:00Z'
  }

  const mockAvailableRooms: AvailableRoom[] = [
    {
      type: 'Standard King',
      price: 150,
      available: true,
      description: 'Comfortable room with king bed',
      amenities: ['WiFi', 'AC', 'TV']
    },
    {
      type: 'Standard Queen',
      price: 140,
      available: true,
      description: 'Cozy room with queen bed',
      amenities: ['WiFi', 'AC', 'TV']
    },
    {
      type: 'Deluxe Suite',
      price: 250,
      available: true,
      description: 'Spacious suite with separate living area',
      amenities: ['WiFi', 'AC', 'TV', 'Mini bar', 'Balcony']
    },
    {
      type: 'Presidential Suite',
      price: 500,
      available: false,
      description: 'Luxury suite with premium amenities',
      amenities: ['WiFi', 'AC', 'TV', 'Mini bar', 'Balcony', 'Jacuzzi']
    }
  ]

  useEffect(() => {
    if (modificationType) {
      generateQuote()
    }
  }, [modificationData, modificationType])

  const handleBookingLookup = async () => {
    setIsLoading(true)
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))

      if (lookupValue.toLowerCase().includes('bg-2024-001234') ||
          lookupValue.toLowerCase().includes('john.smith@example.com')) {
        setBooking(mockBooking)
        setStep('details')
      } else {
        alert('Booking not found. Please check your confirmation number or email.')
      }
    } catch (error) {
      console.error('Booking lookup failed:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const generateQuote = async () => {
    if (!booking || !modificationType) return

    setIsLoading(true)
    try {
      // Simulate quote generation
      await new Promise(resolve => setTimeout(resolve, 800))

      let newAmount = booking.totalAmount
      let difference = 0
      let fees = 0
      const restrictions: string[] = []

      switch (modificationType) {
        case 'dates':
          if (modificationData.newCheckInDate && modificationData.newCheckOutDate) {
            const checkIn = new Date(modificationData.newCheckInDate)
            const checkOut = new Date(modificationData.newCheckOutDate)
            const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24))

            // Base rate calculation
            newAmount = nights * 150 + 45 // base rate + taxes/fees
            difference = newAmount - booking.totalAmount

            if (difference > 0) {
              fees = 25 // Change fee for increases
            }

            // Check for restrictions
            const daysUntilCheckIn = Math.ceil((new Date(booking.checkInDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
            if (daysUntilCheckIn < 2) {
              restrictions.push('Date changes within 48 hours may require approval')
            }
          }
          break

        case 'room':
          if (modificationData.newRoomType) {
            const newRoom = mockAvailableRooms.find(r => r.type === modificationData.newRoomType)
            if (newRoom) {
              const nights = Math.ceil((new Date(booking.checkOutDate).getTime() - new Date(booking.checkInDate).getTime()) / (1000 * 60 * 60 * 24))
              newAmount = nights * newRoom.price + 45
              difference = newAmount - booking.totalAmount

              if (difference > 0) {
                fees = 15 // Room upgrade fee
              }
            }
          }
          break

        case 'guests':
          if (modificationData.newGuests && modificationData.newGuests !== booking.guests) {
            if (modificationData.newGuests > booking.guests) {
              difference = (modificationData.newGuests - booking.guests) * 25 // Extra guest fee
              fees = 10
            }
            newAmount = booking.totalAmount + difference + fees
          }
          break

        case 'cancellation':
          const daysUntilCheckIn = Math.ceil((new Date(booking.checkInDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
          if (daysUntilCheckIn >= 1) {
            newAmount = 0
            difference = -booking.totalAmount
            fees = 0
          } else {
            fees = booking.totalAmount * 0.5 // 50% cancellation fee
            newAmount = fees
            difference = -(booking.totalAmount - fees)
            restrictions.push('Late cancellation fee applies')
          }
          break
      }

      const mockQuote: ModificationQuote = {
        originalAmount: booking.totalAmount,
        newAmount: Math.max(0, newAmount),
        difference,
        fees,
        refund: difference < 0 ? Math.abs(difference) : 0,
        requiresPayment: difference > 0,
        availabilityConfirmed: true,
        restrictions
      }

      setQuote(mockQuote)
      setAvailableRooms(mockAvailableRooms)
    } catch (error) {
      console.error('Quote generation failed:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleModificationSubmit = async () => {
    setIsLoading(true)
    try {
      // Simulate modification submission
      await new Promise(resolve => setTimeout(resolve, 1500))
      setStep('complete')
    } catch (error) {
      console.error('Modification submission failed:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const canModifyBooking = () => {
    if (!booking) return false

    const checkInDate = new Date(booking.checkInDate)
    const now = new Date()
    const hoursUntilCheckIn = (checkInDate.getTime() - now.getTime()) / (1000 * 60 * 60)

    return hoursUntilCheckIn > 48 && booking.status === 'confirmed'
  }

  const renderBookingLookup = () => (
    <div className="space-y-6">
      <div className="text-center">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Search className="w-8 h-8 text-blue-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Modify Your Booking</h2>
        <p className="text-gray-600">Enter your confirmation number or email to get started</p>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="lookup">Confirmation Number or Email</Label>
              <Input
                id="lookup"
                placeholder="BG-2024-001234 or email@example.com"
                value={lookupValue}
                onChange={(e) => setLookupValue(e.target.value)}
                className="mt-1"
              />
            </div>
            <Button
              onClick={handleBookingLookup}
              className="w-full"
              disabled={!lookupValue.trim() || isLoading}
            >
              {isLoading ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Search className="w-4 h-4 mr-2" />
              )}
              Find Booking
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="text-center text-sm text-gray-500">
        <p>Need help? Contact our support team</p>
        <Button variant="outline" size="sm" className="mt-2">
          <Phone className="w-4 h-4 mr-2" />
          Call Support
        </Button>
      </div>
    </div>
  )

  const renderBookingDetails = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => setStep('lookup')}>
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back
        </Button>
        <Badge
          variant={booking?.status === 'confirmed' ? 'default' : 'secondary'}
          className="capitalize"
        >
          {booking?.status}
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bed className="w-5 h-5" />
            Booking Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-500">Confirmation</p>
              <p className="font-semibold">{booking?.confirmationNumber}</p>
            </div>
            <div>
              <p className="text-gray-500">Guest</p>
              <p className="font-semibold">{booking?.guestName}</p>
            </div>
            <div>
              <p className="text-gray-500">Check-in</p>
              <p className="font-semibold">{booking?.checkInDate}</p>
            </div>
            <div>
              <p className="text-gray-500">Check-out</p>
              <p className="font-semibold">{booking?.checkOutDate}</p>
            </div>
            <div>
              <p className="text-gray-500">Room</p>
              <p className="font-semibold">{booking?.roomType}</p>
              {booking?.roomNumber && <p className="text-xs text-gray-500">Room {booking.roomNumber}</p>}
            </div>
            <div>
              <p className="text-gray-500">Guests</p>
              <p className="font-semibold">{booking?.guests}</p>
            </div>
          </div>

          <Separator />

          <div>
            <p className="text-gray-500 text-sm mb-2">Total Amount</p>
            <p className="text-2xl font-bold text-green-600">${booking?.totalAmount}</p>
          </div>

          {booking?.specialRequests && booking.specialRequests.length > 0 && (
            <div>
              <p className="text-gray-500 text-sm mb-2">Special Requests</p>
              <div className="flex flex-wrap gap-2">
                {booking.specialRequests.map((request, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {request}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {canModifyBooking() ? (
        <Card>
          <CardHeader>
            <CardTitle>What would you like to modify?</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                className="h-auto p-4 flex-col gap-2"
                onClick={() => {
                  setModificationType('dates')
                  setStep('modify')
                }}
              >
                <Calendar className="w-6 h-6" />
                <span className="text-sm">Change Dates</span>
              </Button>
              <Button
                variant="outline"
                className="h-auto p-4 flex-col gap-2"
                onClick={() => {
                  setModificationType('room')
                  setStep('modify')
                }}
              >
                <Bed className="w-6 h-6" />
                <span className="text-sm">Change Room</span>
              </Button>
              <Button
                variant="outline"
                className="h-auto p-4 flex-col gap-2"
                onClick={() => {
                  setModificationType('guests')
                  setStep('modify')
                }}
              >
                <Users className="w-6 h-6" />
                <span className="text-sm">Change Guests</span>
              </Button>
              <Button
                variant="outline"
                className="h-auto p-4 flex-col gap-2 text-red-600 border-red-200 hover:bg-red-50"
                onClick={() => {
                  setModificationType('cancellation')
                  setStep('modify')
                }}
              >
                <X className="w-6 h-6" />
                <span className="text-sm">Cancel Booking</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Alert>
          <AlertTriangle className="w-4 h-4" />
          <AlertDescription>
            {booking?.status !== 'confirmed'
              ? 'This booking cannot be modified due to its current status.'
              : 'Modifications are not allowed within 48 hours of check-in. Please contact customer service for assistance.'
            }
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Policies</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div>
            <p className="font-medium">Modification Policy</p>
            <p className="text-gray-600">{booking?.modificationPolicy}</p>
          </div>
          <div>
            <p className="font-medium">Cancellation Policy</p>
            <p className="text-gray-600">{booking?.cancellationPolicy}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )

  const renderModificationForm = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => setStep('details')}>
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back
        </Button>
        <Badge variant="outline">
          Step 1 of 3
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="capitalize">
            {modificationType === 'cancellation' ? 'Cancel Booking' : `Modify ${modificationType?.replace('-', ' ')}`}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {modificationType === 'dates' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>New Check-in Date</Label>
                  <Input
                    type="date"
                    value={modificationData.newCheckInDate || ''}
                    onChange={(e) => setModificationData(prev => ({
                      ...prev,
                      newCheckInDate: e.target.value
                    }))}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
                <div>
                  <Label>New Check-out Date</Label>
                  <Input
                    type="date"
                    value={modificationData.newCheckOutDate || ''}
                    onChange={(e) => setModificationData(prev => ({
                      ...prev,
                      newCheckOutDate: e.target.value
                    }))}
                    min={modificationData.newCheckInDate || new Date().toISOString().split('T')[0]}
                  />
                </div>
              </div>

              {modificationData.newCheckInDate && modificationData.newCheckOutDate && (
                <div className="p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-700">
                    Current: {booking?.checkInDate} to {booking?.checkOutDate}
                  </p>
                  <p className="text-sm text-blue-700">
                    New: {modificationData.newCheckInDate} to {modificationData.newCheckOutDate}
                  </p>
                </div>
              )}
            </div>
          )}

          {modificationType === 'room' && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Current room: {booking?.roomType}
              </p>

              <div className="space-y-3">
                {availableRooms.map((room, index) => (
                  <div
                    key={index}
                    className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                      modificationData.newRoomType === room.type
                        ? 'border-blue-500 bg-blue-50'
                        : room.available
                        ? 'border-gray-200 hover:border-gray-300'
                        : 'border-gray-100 bg-gray-50 cursor-not-allowed'
                    }`}
                    onClick={() => room.available && setModificationData(prev => ({
                      ...prev,
                      newRoomType: room.type
                    }))}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-medium">{room.type}</h3>
                        <p className="text-sm text-gray-600">{room.description}</p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {room.amenities.map((amenity, i) => (
                            <Badge key={i} variant="outline" className="text-xs">
                              {amenity}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-lg">${room.price}</p>
                        <p className="text-xs text-gray-500">per night</p>
                        {!room.available && (
                          <p className="text-xs text-red-500">Not available</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {modificationType === 'guests' && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Current guests: {booking?.guests}
              </p>

              <div>
                <Label>New number of guests</Label>
                <div className="flex items-center gap-3 mt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setModificationData(prev => ({
                      ...prev,
                      newGuests: Math.max(1, (prev.newGuests || booking?.guests || 1) - 1)
                    }))}
                  >
                    <Minus className="w-4 h-4" />
                  </Button>
                  <span className="text-xl font-semibold w-12 text-center">
                    {modificationData.newGuests || booking?.guests}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setModificationData(prev => ({
                      ...prev,
                      newGuests: Math.min(4, (prev.newGuests || booking?.guests || 1) + 1)
                    }))}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-sm text-gray-500 mt-1">Maximum 4 guests per room</p>
              </div>
            </div>
          )}

          {modificationType === 'cancellation' && (
            <div className="space-y-4">
              <Alert variant="destructive">
                <AlertTriangle className="w-4 h-4" />
                <AlertDescription>
                  Are you sure you want to cancel this booking? This action cannot be undone.
                </AlertDescription>
              </Alert>

              <div>
                <Label>Reason for cancellation (optional)</Label>
                <Input
                  placeholder="Tell us why you're canceling..."
                  value={modificationData.reason || ''}
                  onChange={(e) => setModificationData(prev => ({
                    ...prev,
                    reason: e.target.value
                  }))}
                />
              </div>
            </div>
          )}

          <Button
            onClick={() => setStep('quote')}
            className="w-full"
            disabled={
              (modificationType === 'dates' && (!modificationData.newCheckInDate || !modificationData.newCheckOutDate)) ||
              (modificationType === 'room' && !modificationData.newRoomType) ||
              (modificationType === 'guests' && !modificationData.newGuests)
            }
          >
            Get Quote
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </CardContent>
      </Card>
    </div>
  )

  const renderQuote = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => setStep('modify')}>
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back
        </Button>
        <Badge variant="outline">
          Step 2 of 3
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Modification Quote</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <div className="text-center py-6">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2" />
              <p>Calculating new pricing...</p>
            </div>
          ) : quote ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Original Amount</span>
                  <span>${quote.originalAmount}</span>
                </div>
                {quote.difference !== 0 && (
                  <div className="flex justify-between">
                    <span>Price Adjustment</span>
                    <span className={quote.difference > 0 ? 'text-red-600' : 'text-green-600'}>
                      {quote.difference > 0 ? '+' : ''}${quote.difference}
                    </span>
                  </div>
                )}
                {quote.fees > 0 && (
                  <div className="flex justify-between">
                    <span>Modification Fee</span>
                    <span>${quote.fees}</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between font-bold text-lg">
                  <span>New Total</span>
                  <span>${quote.newAmount}</span>
                </div>
              </div>

              {quote.requiresPayment && (
                <Alert>
                  <CreditCard className="w-4 h-4" />
                  <AlertDescription>
                    Additional payment of ${quote.difference + quote.fees} will be charged to your original payment method.
                  </AlertDescription>
                </Alert>
              )}

              {quote.refund > 0 && (
                <Alert variant="default" className="border-green-200 bg-green-50">
                  <DollarSign className="w-4 h-4 text-green-600" />
                  <AlertDescription className="text-green-700">
                    You will receive a refund of ${quote.refund} within 5-7 business days.
                  </AlertDescription>
                </Alert>
              )}

              {quote.restrictions.length > 0 && (
                <Alert>
                  <Info className="w-4 h-4" />
                  <AlertDescription>
                    <div className="space-y-1">
                      {quote.restrictions.map((restriction, index) => (
                        <p key={index}>• {restriction}</p>
                      ))}
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              <div className="space-y-2 text-sm text-gray-600">
                <p>• All changes are subject to availability</p>
                <p>• Prices may vary based on demand and dates</p>
                <p>• This quote is valid for 15 minutes</p>
              </div>
            </div>
          ) : null}

          <Button
            onClick={() => setStep('confirm')}
            className="w-full"
            disabled={isLoading || !quote}
          >
            Continue to Confirmation
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </CardContent>
      </Card>
    </div>
  )

  const renderConfirmation = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => setStep('quote')}>
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back
        </Button>
        <Badge variant="outline">
          Step 3 of 3
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Confirm Changes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <h3 className="font-medium">Summary of Changes</h3>

            {modificationType === 'dates' && (
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm">
                  <span className="font-medium">Dates:</span> {modificationData.newCheckInDate} to {modificationData.newCheckOutDate}
                </p>
              </div>
            )}

            {modificationType === 'room' && (
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm">
                  <span className="font-medium">Room Type:</span> {modificationData.newRoomType}
                </p>
              </div>
            )}

            {modificationType === 'guests' && (
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm">
                  <span className="font-medium">Number of Guests:</span> {modificationData.newGuests}
                </p>
              </div>
            )}

            {modificationType === 'cancellation' && (
              <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                <p className="text-sm text-red-700">
                  <span className="font-medium">Cancellation:</span> This booking will be cancelled
                </p>
              </div>
            )}
          </div>

          {quote && (
            <div className="p-3 border rounded-lg">
              <div className="flex justify-between items-center">
                <span className="font-medium">Total Amount</span>
                <span className="text-lg font-bold">${quote.newAmount}</span>
              </div>
              {quote.requiresPayment && (
                <p className="text-sm text-red-600 mt-1">
                  Additional payment: ${quote.difference + quote.fees}
                </p>
              )}
              {quote.refund > 0 && (
                <p className="text-sm text-green-600 mt-1">
                  Refund amount: ${quote.refund}
                </p>
              )}
            </div>
          )}

          <Alert>
            <Info className="w-4 h-4" />
            <AlertDescription>
              By confirming, you agree to the new terms and pricing. You will receive an updated confirmation email.
            </AlertDescription>
          </Alert>

          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setStep('details')}
            >
              Cancel
            </Button>
            <Button
              className="flex-1"
              onClick={handleModificationSubmit}
              disabled={isLoading}
            >
              {isLoading ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Check className="w-4 h-4 mr-2" />
              )}
              Confirm Changes
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )

  const renderComplete = () => (
    <div className="space-y-6 text-center">
      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
        <Check className="w-8 h-8 text-green-600" />
      </div>

      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          {modificationType === 'cancellation' ? 'Booking Cancelled' : 'Changes Confirmed'}
        </h2>
        <p className="text-gray-600">
          {modificationType === 'cancellation'
            ? 'Your booking has been successfully cancelled'
            : 'Your booking has been successfully modified'
          }
        </p>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="space-y-3">
            <div className="flex justify-between">
              <span>Confirmation Number</span>
              <span className="font-medium">{booking?.confirmationNumber}</span>
            </div>
            {modificationType !== 'cancellation' && quote && (
              <div className="flex justify-between">
                <span>New Total</span>
                <span className="font-bold text-lg">${quote.newAmount}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>Reference</span>
              <span className="font-medium">MOD-{Date.now().toString().slice(-6)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-3 text-sm text-gray-600">
        <p>📧 An updated confirmation email has been sent to {booking?.email}</p>
        {modificationType === 'cancellation' ? (
          <p>💰 Refund will be processed within 5-7 business days</p>
        ) : (
          <p>🏨 Your updated booking is confirmed and ready</p>
        )}
      </div>

      <Button onClick={() => window.location.reload()} className="w-full">
        Make Another Change
      </Button>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-md mx-auto bg-white min-h-screen">
        {/* Header */}
        <div className="bg-blue-600 text-white p-4">
          <div className="text-center">
            <Edit className="w-8 h-8 mx-auto mb-2" />
            <h1 className="text-xl font-bold">Modify Booking</h1>
            <p className="text-blue-100 text-sm">Change or cancel your reservation</p>
          </div>
        </div>

        <div className="p-4">
          {step === 'lookup' && renderBookingLookup()}
          {step === 'details' && renderBookingDetails()}
          {step === 'modify' && renderModificationForm()}
          {step === 'quote' && renderQuote()}
          {step === 'confirm' && renderConfirmation()}
          {step === 'complete' && renderComplete()}
        </div>
      </div>
    </div>
  )
}