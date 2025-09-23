import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const modificationRequestSchema = z.object({
  bookingId: z.string().min(1, 'Booking ID required'),
  confirmationNumber: z.string().min(1, 'Confirmation number required'),
  modificationType: z.enum(['dates', 'room', 'guests', 'special-requests', 'cancellation']),
  newCheckInDate: z.string().optional(),
  newCheckOutDate: z.string().optional(),
  newRoomType: z.string().optional(),
  newGuests: z.number().min(1).max(10).optional(),
  newSpecialRequests: z.array(z.string()).optional(),
  cancellationReason: z.string().optional(),
  guestEmail: z.string().email('Valid email required'),
  acceptTerms: z.boolean().refine(val => val === true, 'Must accept terms')
})

const quoteRequestSchema = z.object({
  bookingId: z.string().min(1, 'Booking ID required'),
  modificationType: z.enum(['dates', 'room', 'guests', 'special-requests', 'cancellation']),
  newCheckInDate: z.string().optional(),
  newCheckOutDate: z.string().optional(),
  newRoomType: z.string().optional(),
  newGuests: z.number().optional()
})

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
  status: 'confirmed' | 'checked-in' | 'checked-out' | 'cancelled' | 'modified'
  totalAmount: number
  originalAmount: number
  specialRequests: string[]
  amenities: string[]
  propertyId: string
  createdAt: string
  lastModified: string
  modificationHistory: ModificationRecord[]
  cancellationPolicy: string
  modificationPolicy: string
}

interface ModificationRecord {
  id: string
  type: string
  timestamp: string
  oldValues: any
  newValues: any
  priceDifference: number
  processedBy: string
  reason?: string
}

interface ModificationQuote {
  originalAmount: number
  newAmount: number
  priceDifference: number
  modificationFee: number
  totalDifference: number
  refundAmount: number
  additionalPayment: number
  availabilityConfirmed: boolean
  restrictions: string[]
  validUntil: string
  requiresApproval: boolean
}

interface RoomType {
  type: string
  basePrice: number
  available: boolean
  maxGuests: number
  amenities: string[]
  description: string
}

// Mock database
let mockBookings: BookingDetails[] = [
  {
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
    originalAmount: 450,
    specialRequests: ['Late checkout', 'High floor'],
    amenities: ['WiFi', 'Breakfast', 'Parking'],
    propertyId: 'prop-001',
    createdAt: '2024-01-10T10:30:00Z',
    lastModified: '2024-01-10T10:30:00Z',
    modificationHistory: [],
    cancellationPolicy: 'Free cancellation until 24 hours before check-in',
    modificationPolicy: 'Modifications allowed up to 48 hours before check-in'
  }
]

const roomTypes: RoomType[] = [
  {
    type: 'Standard King',
    basePrice: 150,
    available: true,
    maxGuests: 2,
    amenities: ['WiFi', 'AC', 'TV'],
    description: 'Comfortable room with king bed'
  },
  {
    type: 'Standard Queen',
    basePrice: 140,
    available: true,
    maxGuests: 2,
    amenities: ['WiFi', 'AC', 'TV'],
    description: 'Cozy room with queen bed'
  },
  {
    type: 'Deluxe Suite',
    basePrice: 250,
    available: true,
    maxGuests: 4,
    amenities: ['WiFi', 'AC', 'TV', 'Mini bar', 'Balcony'],
    description: 'Spacious suite with separate living area'
  },
  {
    type: 'Presidential Suite',
    basePrice: 500,
    available: false,
    maxGuests: 6,
    amenities: ['WiFi', 'AC', 'TV', 'Mini bar', 'Balcony', 'Jacuzzi'],
    description: 'Luxury suite with premium amenities'
  }
]

function findBooking(identifier: string): BookingDetails | null {
  return mockBookings.find(booking =>
    booking.confirmationNumber.toLowerCase() === identifier.toLowerCase() ||
    booking.email.toLowerCase() === identifier.toLowerCase() ||
    booking.id === identifier
  ) || null
}

function canModifyBooking(booking: BookingDetails): { allowed: boolean; reason?: string } {
  if (booking.status !== 'confirmed') {
    return { allowed: false, reason: 'Booking must be in confirmed status to modify' }
  }

  const checkInDate = new Date(booking.checkInDate)
  const now = new Date()
  const hoursUntilCheckIn = (checkInDate.getTime() - now.getTime()) / (1000 * 60 * 60)

  if (hoursUntilCheckIn < 48) {
    return { allowed: false, reason: 'Modifications not allowed within 48 hours of check-in' }
  }

  return { allowed: true }
}

function calculateNights(checkIn: string, checkOut: string): number {
  const checkInDate = new Date(checkIn)
  const checkOutDate = new Date(checkOut)
  return Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24))
}

function calculateRoomPrice(roomType: string, checkIn: string, checkOut: string): number {
  const room = roomTypes.find(r => r.type === roomType)
  if (!room) return 0

  const nights = calculateNights(checkIn, checkOut)
  const baseTotal = room.basePrice * nights

  // Add taxes and fees (15% tax + $25 booking fee)
  const taxes = baseTotal * 0.15
  const fees = 25

  return Math.round((baseTotal + taxes + fees) * 100) / 100
}

function generateModificationQuote(
  booking: BookingDetails,
  modificationType: string,
  newValues: any
): ModificationQuote {
  let newAmount = booking.totalAmount
  let modificationFee = 0
  const restrictions: string[] = []
  let requiresApproval = false

  switch (modificationType) {
    case 'dates':
      if (newValues.newCheckInDate && newValues.newCheckOutDate) {
        newAmount = calculateRoomPrice(booking.roomType, newValues.newCheckInDate, newValues.newCheckOutDate)

        // Check if it's a peak season (simplified logic)
        const checkInDate = new Date(newValues.newCheckInDate)
        const isWeekend = checkInDate.getDay() === 0 || checkInDate.getDay() === 6
        const isHoliday = checkInDate.getMonth() === 11 // December

        if (isWeekend || isHoliday) {
          newAmount *= 1.2 // 20% markup for peak times
          restrictions.push('Peak season rates apply')
        }

        if (newAmount > booking.totalAmount) {
          modificationFee = 25 // Date change fee for price increases
        }

        // Check how far in advance the change is being made
        const daysUntilCheckIn = Math.ceil((new Date(booking.checkInDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
        if (daysUntilCheckIn < 7) {
          restrictions.push('Short notice date changes may require approval')
          requiresApproval = true
        }
      }
      break

    case 'room':
      if (newValues.newRoomType) {
        const nights = calculateNights(booking.checkInDate, booking.checkOutDate)
        newAmount = calculateRoomPrice(newValues.newRoomType, booking.checkInDate, booking.checkOutDate)

        if (newAmount > booking.totalAmount) {
          modificationFee = 15 // Room upgrade fee
        }

        // Check room availability
        const newRoom = roomTypes.find(r => r.type === newValues.newRoomType)
        if (!newRoom?.available) {
          restrictions.push('Selected room type may not be available')
          requiresApproval = true
        }
      }
      break

    case 'guests':
      if (newValues.newGuests && newValues.newGuests !== booking.guests) {
        if (newValues.newGuests > booking.guests) {
          const additionalGuests = newValues.newGuests - booking.guests
          const extraGuestFee = additionalGuests * 25 // $25 per additional guest
          newAmount = booking.totalAmount + extraGuestFee
          modificationFee = 10 // Processing fee for guest changes
        }

        // Check room capacity
        const currentRoom = roomTypes.find(r => r.type === booking.roomType)
        if (currentRoom && newValues.newGuests > currentRoom.maxGuests) {
          restrictions.push('Number of guests exceeds room capacity')
          requiresApproval = true
        }
      }
      break

    case 'cancellation':
      const daysUntilCheckIn = Math.ceil((new Date(booking.checkInDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))

      if (daysUntilCheckIn >= 1) {
        // Free cancellation
        newAmount = 0
        modificationFee = 0
      } else {
        // Late cancellation fee (50% of booking)
        const cancellationPenalty = booking.totalAmount * 0.5
        newAmount = cancellationPenalty
        modificationFee = 0
        restrictions.push('Late cancellation fee applies (50% of booking value)')
      }
      break
  }

  const priceDifference = newAmount - booking.totalAmount
  const totalDifference = priceDifference + modificationFee
  const refundAmount = totalDifference < 0 ? Math.abs(totalDifference) : 0
  const additionalPayment = totalDifference > 0 ? totalDifference : 0

  return {
    originalAmount: booking.totalAmount,
    newAmount: Math.max(0, newAmount),
    priceDifference,
    modificationFee,
    totalDifference,
    refundAmount,
    additionalPayment,
    availabilityConfirmed: !requiresApproval,
    restrictions,
    validUntil: new Date(Date.now() + 15 * 60 * 1000).toISOString(), // 15 minutes
    requiresApproval
  }
}

function processModification(booking: BookingDetails, request: any): ModificationRecord {
  const modificationId = `mod-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`

  const modification: ModificationRecord = {
    id: modificationId,
    type: request.modificationType,
    timestamp: new Date().toISOString(),
    oldValues: {},
    newValues: {},
    priceDifference: 0,
    processedBy: 'self-service',
    reason: request.cancellationReason
  }

  // Store old values
  switch (request.modificationType) {
    case 'dates':
      modification.oldValues = {
        checkInDate: booking.checkInDate,
        checkOutDate: booking.checkOutDate
      }
      modification.newValues = {
        checkInDate: request.newCheckInDate,
        checkOutDate: request.newCheckOutDate
      }
      break

    case 'room':
      modification.oldValues = { roomType: booking.roomType }
      modification.newValues = { roomType: request.newRoomType }
      break

    case 'guests':
      modification.oldValues = { guests: booking.guests }
      modification.newValues = { guests: request.newGuests }
      break

    case 'cancellation':
      modification.oldValues = { status: booking.status }
      modification.newValues = { status: 'cancelled' }
      break
  }

  return modification
}

// Generate modification quote
export async function POST(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const action = url.searchParams.get('action')

    if (action === 'quote') {
      const body = await request.json()
      const quoteRequest = quoteRequestSchema.parse(body)

      const booking = findBooking(quoteRequest.bookingId)
      if (!booking) {
        return NextResponse.json(
          { error: 'Booking not found' },
          { status: 404 }
        )
      }

      const canModify = canModifyBooking(booking)
      if (!canModify.allowed) {
        return NextResponse.json(
          { error: canModify.reason },
          { status: 400 }
        )
      }

      const quote = generateModificationQuote(booking, quoteRequest.modificationType, quoteRequest)

      return NextResponse.json({
        success: true,
        quote,
        booking: {
          confirmationNumber: booking.confirmationNumber,
          currentAmount: booking.totalAmount
        }
      })

    } else {
      // Process actual modification
      const body = await request.json()
      const modificationRequest = modificationRequestSchema.parse(body)

      const booking = findBooking(modificationRequest.bookingId)
      if (!booking) {
        return NextResponse.json(
          { error: 'Booking not found' },
          { status: 404 }
        )
      }

      // Verify email matches
      if (booking.email.toLowerCase() !== modificationRequest.guestEmail.toLowerCase()) {
        return NextResponse.json(
          { error: 'Email does not match booking records' },
          { status: 403 }
        )
      }

      const canModify = canModifyBooking(booking)
      if (!canModify.allowed) {
        return NextResponse.json(
          { error: canModify.reason },
          { status: 400 }
        )
      }

      // Generate final quote
      const quote = generateModificationQuote(booking, modificationRequest.modificationType, modificationRequest)

      // Check if requires approval
      if (quote.requiresApproval) {
        return NextResponse.json({
          success: false,
          requiresApproval: true,
          message: 'This modification requires manual approval. Our team will contact you within 24 hours.',
          referenceNumber: `REQ-${Date.now().toString().slice(-6)}`
        })
      }

      // Process the modification
      const modification = processModification(booking, modificationRequest)

      // Update booking
      const bookingIndex = mockBookings.findIndex(b => b.id === booking.id)
      if (bookingIndex !== -1) {
        const updatedBooking = { ...booking }

        // Apply changes
        switch (modificationRequest.modificationType) {
          case 'dates':
            updatedBooking.checkInDate = modificationRequest.newCheckInDate!
            updatedBooking.checkOutDate = modificationRequest.newCheckOutDate!
            break

          case 'room':
            updatedBooking.roomType = modificationRequest.newRoomType!
            // Clear room number as it may change
            delete updatedBooking.roomNumber
            break

          case 'guests':
            updatedBooking.guests = modificationRequest.newGuests!
            break

          case 'special-requests':
            updatedBooking.specialRequests = modificationRequest.newSpecialRequests!
            break

          case 'cancellation':
            updatedBooking.status = 'cancelled'
            break
        }

        // Update amounts and metadata
        updatedBooking.totalAmount = quote.newAmount
        updatedBooking.lastModified = new Date().toISOString()
        updatedBooking.status = modificationRequest.modificationType === 'cancellation' ? 'cancelled' : 'modified'
        updatedBooking.modificationHistory.push(modification)

        mockBookings[bookingIndex] = updatedBooking

        // In a real implementation:
        // 1. Process payment if additional amount is due
        // 2. Issue refund if applicable
        // 3. Update room inventory
        // 4. Send confirmation emails
        // 5. Notify hotel staff
        // 6. Update PMS system

        return NextResponse.json({
          success: true,
          message: modificationRequest.modificationType === 'cancellation'
            ? 'Booking successfully cancelled'
            : 'Booking successfully modified',
          booking: {
            confirmationNumber: updatedBooking.confirmationNumber,
            status: updatedBooking.status,
            newAmount: updatedBooking.totalAmount
          },
          modification: {
            id: modification.id,
            type: modification.type,
            timestamp: modification.timestamp
          },
          payment: {
            additionalPayment: quote.additionalPayment,
            refundAmount: quote.refundAmount,
            processingTime: quote.refundAmount > 0 ? '5-7 business days' : undefined
          }
        })
      }

      return NextResponse.json(
        { error: 'Failed to update booking' },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Booking modification API error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Get booking details and modification options
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const identifier = url.searchParams.get('identifier') // confirmation number or email
    const action = url.searchParams.get('action')

    if (!identifier) {
      return NextResponse.json(
        { error: 'Booking identifier required' },
        { status: 400 }
      )
    }

    const booking = findBooking(identifier)
    if (!booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      )
    }

    if (action === 'availability') {
      // Return available room types
      return NextResponse.json({
        success: true,
        roomTypes: roomTypes.map(room => ({
          type: room.type,
          basePrice: room.basePrice,
          available: room.available,
          maxGuests: room.maxGuests,
          amenities: room.amenities,
          description: room.description
        }))
      })
    }

    // Return booking details
    const canModify = canModifyBooking(booking)

    return NextResponse.json({
      success: true,
      booking: {
        id: booking.id,
        confirmationNumber: booking.confirmationNumber,
        guestName: booking.guestName,
        email: booking.email,
        phone: booking.phone,
        checkInDate: booking.checkInDate,
        checkOutDate: booking.checkOutDate,
        roomType: booking.roomType,
        roomNumber: booking.roomNumber,
        guests: booking.guests,
        status: booking.status,
        totalAmount: booking.totalAmount,
        specialRequests: booking.specialRequests,
        amenities: booking.amenities,
        lastModified: booking.lastModified,
        modificationHistory: booking.modificationHistory
      },
      policies: {
        cancellation: booking.cancellationPolicy,
        modification: booking.modificationPolicy
      },
      modificationAllowed: canModify.allowed,
      modificationReason: canModify.reason
    })

  } catch (error) {
    console.error('Get booking modification data error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}