import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import crypto from 'crypto'

const generateQRSchema = z.object({
  bookingId: z.string().min(1, 'Booking ID required'),
  action: z.enum(['checkin', 'verify', 'service', 'checkout']).default('checkin'),
  includeGuest: z.boolean().default(true)
})

const verifyQRSchema = z.object({
  qrData: z.string().min(1, 'QR data required'),
  action: z.enum(['checkin', 'verify', 'service', 'checkout']).optional(),
  propertyId: z.string().optional()
})

const updateQRStatusSchema = z.object({
  qrCodeId: z.string().min(1, 'QR Code ID required'),
  status: z.enum(['active', 'used', 'expired', 'revoked']),
  usedBy: z.string().optional(),
  usedAt: z.string().optional()
})

interface BookingDetails {
  id: string
  confirmationNumber: string
  guestName: string
  email: string
  phone: string
  checkInDate: string
  checkOutDate: string
  roomNumber: string
  roomType: string
  guests: number
  totalAmount: number
  status: 'confirmed' | 'checked-in' | 'checked-out' | 'cancelled'
  propertyId: string
  specialRequests?: string[]
  amenities?: string[]
}

interface QRCodeRecord {
  id: string
  bookingId: string
  qrData: string
  qrHash: string
  action: string
  status: 'active' | 'used' | 'expired' | 'revoked'
  expiresAt: string
  createdAt: string
  usedAt?: string
  usedBy?: string
  metadata: Record<string, any>
}

// Mock database - replace with actual database calls
const mockBookings: BookingDetails[] = [
  {
    id: 'booking-001',
    confirmationNumber: 'BG-2024-001234',
    guestName: 'John Smith',
    email: 'john.smith@example.com',
    phone: '+1 (555) 123-4567',
    checkInDate: '2024-01-15',
    checkOutDate: '2024-01-18',
    roomNumber: '205',
    roomType: 'Deluxe King Room',
    guests: 2,
    totalAmount: 450,
    status: 'confirmed',
    propertyId: 'prop-001',
    specialRequests: ['Late checkout', 'High floor'],
    amenities: ['WiFi', 'Breakfast', 'Parking', 'Gym Access']
  }
]

let mockQRCodes: QRCodeRecord[] = []

function generateSecureHash(data: string): string {
  return crypto.createHash('sha256').update(data + process.env.QR_SECRET_KEY || 'default-secret').digest('hex')
}

function generateQRData(booking: BookingDetails, action: string, expiresAt: Date): any {
  const baseData = {
    type: 'booking_qr',
    version: '1.0',
    bookingId: booking.id,
    confirmationNumber: booking.confirmationNumber,
    action,
    propertyId: booking.propertyId,
    expiresAt: expiresAt.toISOString(),
    timestamp: new Date().toISOString()
  }

  // Add verification hash
  const verificationCode = crypto.randomBytes(16).toString('hex')
  const hash = generateSecureHash(JSON.stringify(baseData) + verificationCode)

  return {
    ...baseData,
    verificationCode,
    hash
  }
}

function isQRCodeExpired(qrCode: QRCodeRecord): boolean {
  return new Date() > new Date(qrCode.expiresAt)
}

function validateQRHash(qrData: any): boolean {
  const { hash, verificationCode, ...data } = qrData
  const expectedHash = generateSecureHash(JSON.stringify(data) + verificationCode)
  return hash === expectedHash
}

// Generate QR code for booking
export async function POST(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const action = url.searchParams.get('action')

    switch (action) {
      case 'generate': {
        const body = await request.json()
        const { bookingId, action: qrAction, includeGuest } = generateQRSchema.parse(body)

        // Find booking
        const booking = mockBookings.find(b => b.id === bookingId)
        if (!booking) {
          return NextResponse.json(
            { error: 'Booking not found' },
            { status: 404 }
          )
        }

        // Check if booking is valid for QR generation
        if (booking.status === 'cancelled') {
          return NextResponse.json(
            { error: 'Cannot generate QR code for cancelled booking' },
            { status: 400 }
          )
        }

        // Set expiration based on action
        const now = new Date()
        let expiresAt: Date

        switch (qrAction) {
          case 'checkin':
            // Check-in QR codes expire 24 hours after check-in date
            const checkInDate = new Date(booking.checkInDate)
            expiresAt = new Date(checkInDate.getTime() + 24 * 60 * 60 * 1000)
            break
          case 'checkout':
            // Checkout QR codes expire at checkout date + 1 day
            const checkOutDate = new Date(booking.checkOutDate)
            expiresAt = new Date(checkOutDate.getTime() + 24 * 60 * 60 * 1000)
            break
          case 'service':
            // Service QR codes expire in 7 days
            expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
            break
          case 'verify':
            // Verification QR codes expire in 1 hour
            expiresAt = new Date(now.getTime() + 60 * 60 * 1000)
            break
          default:
            expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000)
        }

        // Generate QR data
        const qrData = generateQRData(booking, qrAction, expiresAt)
        const qrString = JSON.stringify(qrData)
        const qrHash = generateSecureHash(qrString)

        // Create QR code record
        const qrRecord: QRCodeRecord = {
          id: `qr-${Date.now()}-${Math.random().toString(36).substring(2)}`,
          bookingId,
          qrData: qrString,
          qrHash,
          action: qrAction,
          status: 'active',
          expiresAt: expiresAt.toISOString(),
          createdAt: now.toISOString(),
          metadata: {
            includeGuest,
            generatedFor: booking.guestName,
            roomNumber: booking.roomNumber
          }
        }

        mockQRCodes.push(qrRecord)

        // Prepare response data
        const responseData = {
          qrCodeId: qrRecord.id,
          qrData: qrString,
          expiresAt: expiresAt.toISOString(),
          action: qrAction,
          booking: {
            confirmationNumber: booking.confirmationNumber,
            guestName: booking.guestName,
            roomNumber: booking.roomNumber,
            checkInDate: booking.checkInDate,
            checkOutDate: booking.checkOutDate
          }
        }

        // Log QR generation
        console.log(`QR code generated for booking ${booking.confirmationNumber}, action: ${qrAction}`)

        return NextResponse.json({
          success: true,
          ...responseData
        })
      }

      case 'verify': {
        const body = await request.json()
        const { qrData, action: expectedAction, propertyId } = verifyQRSchema.parse(body)

        try {
          const qrObject = JSON.parse(qrData)

          // Validate QR code structure
          if (qrObject.type !== 'booking_qr') {
            return NextResponse.json(
              { error: 'Invalid QR code type' },
              { status: 400 }
            )
          }

          // Validate hash
          if (!validateQRHash(qrObject)) {
            return NextResponse.json(
              { error: 'QR code verification failed - invalid signature' },
              { status: 400 }
            )
          }

          // Check expiration
          if (new Date() > new Date(qrObject.expiresAt)) {
            return NextResponse.json(
              { error: 'QR code has expired' },
              { status: 400 }
            )
          }

          // Find QR code record
          const qrRecord = mockQRCodes.find(qr =>
            qr.qrData === qrData && qr.status === 'active'
          )

          if (!qrRecord) {
            return NextResponse.json(
              { error: 'QR code not found or already used' },
              { status: 404 }
            )
          }

          // Find associated booking
          const booking = mockBookings.find(b => b.id === qrObject.bookingId)
          if (!booking) {
            return NextResponse.json(
              { error: 'Associated booking not found' },
              { status: 404 }
            )
          }

          // Validate property if specified
          if (propertyId && booking.propertyId !== propertyId) {
            return NextResponse.json(
              { error: 'QR code not valid for this property' },
              { status: 400 }
            )
          }

          // Validate action if specified
          if (expectedAction && qrObject.action !== expectedAction) {
            return NextResponse.json(
              { error: `QR code is for ${qrObject.action}, not ${expectedAction}` },
              { status: 400 }
            )
          }

          // Additional validations based on action
          const now = new Date()
          switch (qrObject.action) {
            case 'checkin':
              if (booking.status !== 'confirmed') {
                return NextResponse.json(
                  { error: 'Booking is not in confirmed status' },
                  { status: 400 }
                )
              }

              // Check if it's too early to check in (more than 24 hours before)
              const checkInDate = new Date(booking.checkInDate)
              const hoursUntilCheckIn = (checkInDate.getTime() - now.getTime()) / (1000 * 60 * 60)
              if (hoursUntilCheckIn > 24) {
                return NextResponse.json(
                  { error: 'Check-in not available yet - too early' },
                  { status: 400 }
                )
              }
              break

            case 'checkout':
              if (booking.status !== 'checked-in') {
                return NextResponse.json(
                  { error: 'Guest must be checked in to checkout' },
                  { status: 400 }
                )
              }
              break
          }

          return NextResponse.json({
            success: true,
            valid: true,
            qrCodeId: qrRecord.id,
            action: qrObject.action,
            booking: {
              id: booking.id,
              confirmationNumber: booking.confirmationNumber,
              guestName: booking.guestName,
              roomNumber: booking.roomNumber,
              roomType: booking.roomType,
              status: booking.status,
              checkInDate: booking.checkInDate,
              checkOutDate: booking.checkOutDate,
              guests: booking.guests
            },
            metadata: qrRecord.metadata,
            scannedAt: now.toISOString()
          })

        } catch (parseError) {
          return NextResponse.json(
            { error: 'Invalid QR code format' },
            { status: 400 }
          )
        }
      }

      case 'mark-used': {
        const body = await request.json()
        const { qrCodeId, status, usedBy } = updateQRStatusSchema.parse(body)

        const qrRecord = mockQRCodes.find(qr => qr.id === qrCodeId)
        if (!qrRecord) {
          return NextResponse.json(
            { error: 'QR code not found' },
            { status: 404 }
          )
        }

        // Update QR code status
        qrRecord.status = status
        if (status === 'used') {
          qrRecord.usedAt = new Date().toISOString()
          qrRecord.usedBy = usedBy
        }

        // If this was a check-in QR code and it's being marked as used,
        // update the booking status
        if (qrRecord.action === 'checkin' && status === 'used') {
          const booking = mockBookings.find(b => b.id === qrRecord.bookingId)
          if (booking) {
            booking.status = 'checked-in'
          }
        }

        return NextResponse.json({
          success: true,
          qrCodeId,
          status,
          message: `QR code marked as ${status}`
        })
      }

      default:
        return NextResponse.json(
          { error: 'Invalid action specified' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('QR code API error:', error)

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

// Get QR code information
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const qrCodeId = url.searchParams.get('qrCodeId')
    const bookingId = url.searchParams.get('bookingId')

    if (!qrCodeId && !bookingId) {
      return NextResponse.json(
        { error: 'QR Code ID or Booking ID required' },
        { status: 400 }
      )
    }

    if (qrCodeId) {
      // Get specific QR code
      const qrRecord = mockQRCodes.find(qr => qr.id === qrCodeId)
      if (!qrRecord) {
        return NextResponse.json(
          { error: 'QR code not found' },
          { status: 404 }
        )
      }

      const booking = mockBookings.find(b => b.id === qrRecord.bookingId)

      return NextResponse.json({
        success: true,
        qrCode: {
          id: qrRecord.id,
          action: qrRecord.action,
          status: qrRecord.status,
          expiresAt: qrRecord.expiresAt,
          createdAt: qrRecord.createdAt,
          usedAt: qrRecord.usedAt,
          usedBy: qrRecord.usedBy,
          expired: isQRCodeExpired(qrRecord)
        },
        booking: booking ? {
          confirmationNumber: booking.confirmationNumber,
          guestName: booking.guestName,
          roomNumber: booking.roomNumber,
          status: booking.status
        } : null
      })
    }

    if (bookingId) {
      // Get all QR codes for booking
      const qrRecords = mockQRCodes.filter(qr => qr.bookingId === bookingId)
      const booking = mockBookings.find(b => b.id === bookingId)

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
          guestName: booking.guestName,
          status: booking.status
        },
        qrCodes: qrRecords.map(qr => ({
          id: qr.id,
          action: qr.action,
          status: qr.status,
          expiresAt: qr.expiresAt,
          createdAt: qr.createdAt,
          expired: isQRCodeExpired(qr)
        }))
      })
    }
  } catch (error) {
    console.error('Get QR code error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}