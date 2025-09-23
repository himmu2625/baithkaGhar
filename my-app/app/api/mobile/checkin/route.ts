import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const bookingLookupSchema = z.object({
  identifier: z.string().min(1, 'Confirmation number or email required')
})

const guestVerificationSchema = z.object({
  bookingId: z.string(),
  firstName: z.string().min(1, 'First name required'),
  lastName: z.string().min(1, 'Last name required'),
  email: z.string().email('Valid email required'),
  phone: z.string().min(1, 'Phone number required'),
  idNumber: z.string().min(1, 'ID number required'),
  address: z.string().optional(),
  emergencyContact: z.string().optional(),
  emergencyPhone: z.string().optional(),
  specialRequests: z.string().optional()
})

const documentUploadSchema = z.object({
  bookingId: z.string(),
  documentType: z.enum(['id', 'passport', 'visa', 'other']),
  documentData: z.string(), // base64 encoded file data
  fileName: z.string()
})

const checkInCompleteSchema = z.object({
  bookingId: z.string(),
  guestInfo: z.object({
    firstName: z.string(),
    lastName: z.string(),
    email: z.string().email(),
    phone: z.string(),
    idNumber: z.string(),
    address: z.string().optional(),
    emergencyContact: z.string().optional(),
    emergencyPhone: z.string().optional(),
    specialRequests: z.string().optional()
  }),
  documentsVerified: z.boolean(),
  paymentConfirmed: z.boolean()
})

const serviceRequestSchema = z.object({
  bookingId: z.string(),
  type: z.enum(['housekeeping', 'maintenance', 'concierge', 'dining', 'transport']),
  description: z.string().min(1, 'Description required'),
  urgency: z.enum(['low', 'medium', 'high']),
  roomNumber: z.string().optional()
})

interface BookingDetails {
  id: string
  confirmationNumber: string
  guestName: string
  email: string
  checkInDate: string
  checkOutDate: string
  roomNumber: string
  roomType: string
  guests: number
  totalAmount: number
  status: 'confirmed' | 'checked-in' | 'checked-out' | 'cancelled'
  amenities: string[]
  specialRequests: string[]
  paymentStatus: 'pending' | 'paid' | 'failed'
}

interface ServiceRequest {
  id: string
  bookingId: string
  type: string
  description: string
  urgency: string
  status: 'pending' | 'acknowledged' | 'in-progress' | 'completed'
  timestamp: string
  roomNumber?: string
}

// Mock database - replace with actual database calls
const mockBookings: BookingDetails[] = [
  {
    id: 'booking-001',
    confirmationNumber: 'BG-2024-001234',
    guestName: 'John Smith',
    email: 'john.smith@example.com',
    checkInDate: '2024-01-15',
    checkOutDate: '2024-01-18',
    roomNumber: '205',
    roomType: 'Deluxe King Room',
    guests: 2,
    totalAmount: 450,
    status: 'confirmed',
    amenities: ['WiFi', 'Breakfast', 'Parking', 'Gym Access'],
    specialRequests: ['Late checkout', 'High floor'],
    paymentStatus: 'paid'
  }
]

let mockServiceRequests: ServiceRequest[] = []

// Booking lookup endpoint
export async function POST(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const action = url.searchParams.get('action')

    switch (action) {
      case 'lookup': {
        const body = await request.json()
        const { identifier } = bookingLookupSchema.parse(body)

        // Search by confirmation number or email
        const booking = mockBookings.find(b =>
          b.confirmationNumber.toLowerCase() === identifier.toLowerCase() ||
          b.email.toLowerCase() === identifier.toLowerCase()
        )

        if (!booking) {
          return NextResponse.json(
            { error: 'Booking not found. Please check your confirmation number or email.' },
            { status: 404 }
          )
        }

        // Check if already checked in
        if (booking.status === 'checked-in') {
          return NextResponse.json(
            { error: 'This booking has already been checked in.' },
            { status: 400 }
          )
        }

        // Check if check-in is available (within 24 hours of check-in date)
        const checkInDate = new Date(booking.checkInDate)
        const now = new Date()
        const hoursDifference = (checkInDate.getTime() - now.getTime()) / (1000 * 60 * 60)

        if (hoursDifference > 24) {
          return NextResponse.json(
            { error: 'Online check-in is available 24 hours before your arrival date.' },
            { status: 400 }
          )
        }

        return NextResponse.json({
          success: true,
          booking: {
            id: booking.id,
            confirmationNumber: booking.confirmationNumber,
            guestName: booking.guestName,
            checkInDate: booking.checkInDate,
            checkOutDate: booking.checkOutDate,
            roomNumber: booking.roomNumber,
            roomType: booking.roomType,
            guests: booking.guests,
            totalAmount: booking.totalAmount,
            amenities: booking.amenities,
            specialRequests: booking.specialRequests
          }
        })
      }

      case 'verify': {
        const body = await request.json()
        const guestData = guestVerificationSchema.parse(body)

        // In a real implementation, save guest verification data
        console.log('Guest verification data saved:', guestData)

        return NextResponse.json({
          success: true,
          message: 'Guest information verified successfully'
        })
      }

      case 'upload-document': {
        const body = await request.json()
        const documentData = documentUploadSchema.parse(body)

        // In a real implementation, process and store the document
        // Perform OCR and verification

        // Simulate document verification process
        await new Promise(resolve => setTimeout(resolve, 2000))

        return NextResponse.json({
          success: true,
          documentId: `doc-${Date.now()}`,
          verified: true,
          message: 'Document uploaded and verified successfully'
        })
      }

      case 'complete-checkin': {
        const body = await request.json()
        const checkInData = checkInCompleteSchema.parse(body)

        // Find the booking
        const booking = mockBookings.find(b => b.id === checkInData.bookingId)

        if (!booking) {
          return NextResponse.json(
            { error: 'Booking not found' },
            { status: 404 }
          )
        }

        // Validate prerequisites
        if (!checkInData.documentsVerified) {
          return NextResponse.json(
            { error: 'Document verification required' },
            { status: 400 }
          )
        }

        if (!checkInData.paymentConfirmed) {
          return NextResponse.json(
            { error: 'Payment confirmation required' },
            { status: 400 }
          )
        }

        // Update booking status
        booking.status = 'checked-in'

        // Generate digital room key token
        const roomKeyToken = `key-${booking.id}-${Date.now()}`

        // In a real implementation, trigger:
        // - Send welcome SMS/email
        // - Notify front desk
        // - Update PMS system
        // - Generate mobile key access

        return NextResponse.json({
          success: true,
          checkInTime: new Date().toISOString(),
          roomKeyToken,
          booking: {
            id: booking.id,
            roomNumber: booking.roomNumber,
            roomType: booking.roomType,
            checkInDate: booking.checkInDate,
            checkOutDate: booking.checkOutDate
          },
          nextSteps: [
            'Use the digital room key to access your room',
            'WiFi password: BaithakaGuest2024',
            'Breakfast is served 7:00 AM - 10:00 AM',
            'Front desk is available 24/7 for assistance'
          ]
        })
      }

      case 'service-request': {
        const body = await request.json()
        const serviceData = serviceRequestSchema.parse(body)

        const newRequest: ServiceRequest = {
          id: `req-${Date.now()}`,
          bookingId: serviceData.bookingId,
          type: serviceData.type,
          description: serviceData.description,
          urgency: serviceData.urgency,
          status: 'pending',
          timestamp: new Date().toISOString(),
          roomNumber: serviceData.roomNumber
        }

        mockServiceRequests.push(newRequest)

        // In a real implementation:
        // - Notify appropriate department
        // - Send push notification to staff app
        // - Log in PMS system
        // - Send confirmation to guest

        return NextResponse.json({
          success: true,
          requestId: newRequest.id,
          estimatedResponse: serviceData.urgency === 'high' ? '15 minutes' :
                           serviceData.urgency === 'medium' ? '30 minutes' : '1 hour',
          message: 'Service request submitted successfully'
        })
      }

      case 'get-requests': {
        const bookingId = url.searchParams.get('bookingId')

        if (!bookingId) {
          return NextResponse.json(
            { error: 'Booking ID required' },
            { status: 400 }
          )
        }

        const requests = mockServiceRequests.filter(req => req.bookingId === bookingId)

        return NextResponse.json({
          success: true,
          requests
        })
      }

      default:
        return NextResponse.json(
          { error: 'Invalid action specified' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Mobile check-in API error:', error)

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

// Get booking status and information
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const bookingId = url.searchParams.get('bookingId')
    const confirmationNumber = url.searchParams.get('confirmationNumber')

    if (!bookingId && !confirmationNumber) {
      return NextResponse.json(
        { error: 'Booking ID or confirmation number required' },
        { status: 400 }
      )
    }

    const booking = mockBookings.find(b =>
      b.id === bookingId || b.confirmationNumber === confirmationNumber
    )

    if (!booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      booking: {
        id: booking.id,
        confirmationNumber: booking.confirmationNumber,
        status: booking.status,
        guestName: booking.guestName,
        roomNumber: booking.roomNumber,
        roomType: booking.roomType,
        checkInDate: booking.checkInDate,
        checkOutDate: booking.checkOutDate,
        guests: booking.guests,
        amenities: booking.amenities
      }
    })
  } catch (error) {
    console.error('Get booking error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}