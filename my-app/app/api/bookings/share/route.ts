import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import crypto from 'crypto'

const createShareSchema = z.object({
  bookingId: z.string().min(1, 'Booking ID required'),
  shareType: z.enum(['public', 'private', 'temporary']).default('private'),
  expiresAt: z.string().optional(),
  password: z.string().optional(),
  allowedEmails: z.array(z.string().email()).optional(),
  includeDetails: z.object({
    personalInfo: z.boolean().default(false),
    paymentInfo: z.boolean().default(false),
    contactInfo: z.boolean().default(false),
    specialRequests: z.boolean().default(true),
    amenities: z.boolean().default(true)
  }).optional()
})

const shareRequestSchema = z.object({
  recipients: z.array(z.object({
    type: z.enum(['email', 'sms', 'whatsapp']),
    address: z.string().min(1, 'Recipient address required'),
    name: z.string().optional()
  })).min(1, 'At least one recipient required'),
  template: z.string().min(1, 'Template required'),
  customMessage: z.string().optional(),
  includeAttachments: z.object({
    pdf: z.boolean().default(false),
    qrCode: z.boolean().default(false),
    calendar: z.boolean().default(false)
  }).optional()
})

interface ShareLink {
  id: string
  bookingId: string
  shareToken: string
  shareType: 'public' | 'private' | 'temporary'
  createdAt: string
  expiresAt?: string
  accessCount: number
  maxAccess?: number
  password?: string
  allowedEmails?: string[]
  includeDetails: {
    personalInfo: boolean
    paymentInfo: boolean
    contactInfo: boolean
    specialRequests: boolean
    amenities: boolean
  }
  isActive: boolean
  createdBy: string
}

interface ShareActivity {
  id: string
  shareId: string
  accessedAt: string
  accessedBy?: string
  ipAddress: string
  userAgent: string
  method: 'link' | 'email' | 'sms' | 'social'
}

interface BookingDetails {
  id: string
  confirmationNumber: string
  guestName: string
  email: string
  phone: string
  propertyName: string
  propertyLocation: string
  propertyAddress: string
  checkInDate: string
  checkOutDate: string
  roomType: string
  roomNumber?: string
  guests: number
  totalAmount: number
  paidAmount: number
  specialRequests: string[]
  amenities: string[]
  status: string
  qrCode?: string
}

// Mock database
let mockShares: ShareLink[] = []
let mockShareActivity: ShareActivity[] = []
let shareCounter = 1000

const mockBookings: BookingDetails[] = [
  {
    id: 'booking-001',
    confirmationNumber: 'BG-2024-001234',
    guestName: 'John Smith',
    email: 'john.smith@example.com',
    phone: '+1 (555) 123-4567',
    propertyName: 'Baithaka GHAR Downtown',
    propertyLocation: 'New York, NY',
    propertyAddress: '123 Hotel Street, New York, NY 10001',
    checkInDate: '2024-02-15',
    checkOutDate: '2024-02-18',
    roomType: 'Deluxe King Suite',
    roomNumber: '1205',
    guests: 2,
    totalAmount: 750,
    paidAmount: 750,
    specialRequests: ['Late checkout', 'High floor', 'Welcome champagne'],
    amenities: ['WiFi', 'Breakfast', 'Spa access', 'Parking'],
    status: 'confirmed'
  }
]

function generateShareToken(): string {
  return crypto.randomBytes(16).toString('hex')
}

function generateShareId(): string {
  return `share-${shareCounter++}-${Math.random().toString(36).substring(2, 8)}`
}

function findBooking(bookingId: string): BookingDetails | null {
  return mockBookings.find(b => b.id === bookingId) || null
}

function findShareLink(token: string): ShareLink | null {
  return mockShares.find(share => share.shareToken === token && share.isActive) || null
}

function validateShareAccess(shareLink: ShareLink, requestEmail?: string): { allowed: boolean; reason?: string } {
  // Check if expired
  if (shareLink.expiresAt && new Date() > new Date(shareLink.expiresAt)) {
    return { allowed: false, reason: 'Share link has expired' }
  }

  // Check max access limit
  if (shareLink.maxAccess && shareLink.accessCount >= shareLink.maxAccess) {
    return { allowed: false, reason: 'Share link has reached maximum access limit' }
  }

  // Check email restrictions
  if (shareLink.allowedEmails && shareLink.allowedEmails.length > 0) {
    if (!requestEmail || !shareLink.allowedEmails.includes(requestEmail.toLowerCase())) {
      return { allowed: false, reason: 'Access restricted to specific email addresses' }
    }
  }

  return { allowed: true }
}

function sanitizeBookingData(booking: BookingDetails, includeDetails: ShareLink['includeDetails']): any {
  const sanitized: any = {
    confirmationNumber: booking.confirmationNumber,
    propertyName: booking.propertyName,
    propertyLocation: booking.propertyLocation,
    checkInDate: booking.checkInDate,
    checkOutDate: booking.checkOutDate,
    roomType: booking.roomType,
    guests: booking.guests,
    status: booking.status
  }

  if (includeDetails.personalInfo) {
    sanitized.guestName = booking.guestName
  }

  if (includeDetails.contactInfo) {
    sanitized.email = booking.email
    sanitized.phone = booking.phone
    sanitized.propertyAddress = booking.propertyAddress
  }

  if (includeDetails.paymentInfo) {
    sanitized.totalAmount = booking.totalAmount
    sanitized.paidAmount = booking.paidAmount
  }

  if (includeDetails.specialRequests) {
    sanitized.specialRequests = booking.specialRequests
  }

  if (includeDetails.amenities) {
    sanitized.amenities = booking.amenities
  }

  if (booking.roomNumber) {
    sanitized.roomNumber = booking.roomNumber
  }

  return sanitized
}

function logShareAccess(shareId: string, request: NextRequest, accessedBy?: string) {
  const activity: ShareActivity = {
    id: `activity-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
    shareId,
    accessedAt: new Date().toISOString(),
    accessedBy,
    ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
    userAgent: request.headers.get('user-agent') || 'unknown',
    method: 'link'
  }

  mockShareActivity.push(activity)

  // Update access count
  const shareIndex = mockShares.findIndex(s => s.id === shareId)
  if (shareIndex !== -1) {
    mockShares[shareIndex].accessCount++
  }
}

// Create shareable link
export async function POST(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const action = url.searchParams.get('action')

    if (action === 'create-link') {
      const body = await request.json()
      const { bookingId, shareType, expiresAt, password, allowedEmails, includeDetails } = createShareSchema.parse(body)

      // Verify booking exists
      const booking = findBooking(bookingId)
      if (!booking) {
        return NextResponse.json(
          { error: 'Booking not found' },
          { status: 404 }
        )
      }

      // Create share link
      const shareToken = generateShareToken()
      const shareId = generateShareId()

      const shareLink: ShareLink = {
        id: shareId,
        bookingId,
        shareToken,
        shareType,
        createdAt: new Date().toISOString(),
        expiresAt,
        accessCount: 0,
        password: password ? crypto.createHash('sha256').update(password).digest('hex') : undefined,
        allowedEmails: allowedEmails?.map(email => email.toLowerCase()),
        includeDetails: includeDetails || {
          personalInfo: false,
          paymentInfo: false,
          contactInfo: false,
          specialRequests: true,
          amenities: true
        },
        isActive: true,
        createdBy: 'current-user' // In real app, get from auth
      }

      mockShares.push(shareLink)

      const shareUrl = `${url.origin}/booking/share/${shareToken}`

      return NextResponse.json({
        success: true,
        shareLink: {
          id: shareId,
          url: shareUrl,
          token: shareToken,
          expiresAt: shareLink.expiresAt,
          shareType: shareLink.shareType
        },
        booking: {
          confirmationNumber: booking.confirmationNumber,
          propertyName: booking.propertyName
        }
      })

    } else if (action === 'send-share') {
      const body = await request.json()
      const { recipients, template, customMessage, includeAttachments } = shareRequestSchema.parse(body)

      // In a real implementation:
      // 1. Generate or use existing share link
      // 2. Format message using template
      // 3. Send via email/SMS providers
      // 4. Generate attachments if requested
      // 5. Log share activities

      // Simulate sending to recipients
      const sendResults = await Promise.all(
        recipients.map(async (recipient) => {
          try {
            // Simulate API calls to email/SMS providers
            await new Promise(resolve => setTimeout(resolve, 500))

            const activity: ShareActivity = {
              id: `activity-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
              shareId: 'temp-share-id',
              accessedAt: new Date().toISOString(),
              accessedBy: recipient.address,
              ipAddress: 'server',
              userAgent: 'share-service',
              method: recipient.type as any
            }

            mockShareActivity.push(activity)

            return {
              recipient: recipient.address,
              type: recipient.type,
              status: 'sent',
              messageId: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`
            }
          } catch (error) {
            return {
              recipient: recipient.address,
              type: recipient.type,
              status: 'failed',
              error: 'Delivery failed'
            }
          }
        })
      )

      const successCount = sendResults.filter(result => result.status === 'sent').length
      const failureCount = sendResults.filter(result => result.status === 'failed').length

      return NextResponse.json({
        success: failureCount === 0,
        summary: {
          total: recipients.length,
          sent: successCount,
          failed: failureCount
        },
        results: sendResults,
        message: `Successfully sent to ${successCount} of ${recipients.length} recipients`
      })

    } else {
      return NextResponse.json(
        { error: 'Invalid action specified' },
        { status: 400 }
      )
    }

  } catch (error) {
    console.error('Booking share API error:', error)

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

// Access shared booking
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const token = url.searchParams.get('token')
    const password = url.searchParams.get('password')
    const email = url.searchParams.get('email')

    if (!token) {
      return NextResponse.json(
        { error: 'Share token required' },
        { status: 400 }
      )
    }

    const shareLink = findShareLink(token)
    if (!shareLink) {
      return NextResponse.json(
        { error: 'Invalid or expired share link' },
        { status: 404 }
      )
    }

    // Validate access
    const accessValidation = validateShareAccess(shareLink, email)
    if (!accessValidation.allowed) {
      return NextResponse.json(
        { error: accessValidation.reason },
        { status: 403 }
      )
    }

    // Check password if required
    if (shareLink.password) {
      if (!password) {
        return NextResponse.json(
          { error: 'Password required', requiresPassword: true },
          { status: 401 }
        )
      }

      const hashedPassword = crypto.createHash('sha256').update(password).digest('hex')
      if (hashedPassword !== shareLink.password) {
        return NextResponse.json(
          { error: 'Invalid password' },
          { status: 401 }
        )
      }
    }

    // Get booking details
    const booking = findBooking(shareLink.bookingId)
    if (!booking) {
      return NextResponse.json(
        { error: 'Associated booking not found' },
        { status: 404 }
      )
    }

    // Log access
    logShareAccess(shareLink.id, request, email)

    // Return sanitized booking data
    const sanitizedBooking = sanitizeBookingData(booking, shareLink.includeDetails)

    return NextResponse.json({
      success: true,
      booking: sanitizedBooking,
      shareInfo: {
        shareType: shareLink.shareType,
        createdAt: shareLink.createdAt,
        expiresAt: shareLink.expiresAt,
        accessCount: shareLink.accessCount + 1 // Include current access
      }
    })

  } catch (error) {
    console.error('Get shared booking error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Manage share links
export async function PUT(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const action = url.searchParams.get('action')
    const shareId = url.searchParams.get('shareId')

    if (!shareId) {
      return NextResponse.json(
        { error: 'Share ID required' },
        { status: 400 }
      )
    }

    const shareIndex = mockShares.findIndex(s => s.id === shareId)
    if (shareIndex === -1) {
      return NextResponse.json(
        { error: 'Share link not found' },
        { status: 404 }
      )
    }

    switch (action) {
      case 'deactivate':
        mockShares[shareIndex].isActive = false
        return NextResponse.json({
          success: true,
          message: 'Share link deactivated'
        })

      case 'extend':
        const body = await request.json()
        const { expiresAt } = body

        if (expiresAt) {
          mockShares[shareIndex].expiresAt = expiresAt
        }

        return NextResponse.json({
          success: true,
          message: 'Share link updated',
          shareLink: mockShares[shareIndex]
        })

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }

  } catch (error) {
    console.error('Update share link error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Delete share link
export async function DELETE(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const shareId = url.searchParams.get('shareId')

    if (!shareId) {
      return NextResponse.json(
        { error: 'Share ID required' },
        { status: 400 }
      )
    }

    const shareIndex = mockShares.findIndex(s => s.id === shareId)
    if (shareIndex === -1) {
      return NextResponse.json(
        { error: 'Share link not found' },
        { status: 404 }
      )
    }

    // Remove share link and associated activities
    mockShares.splice(shareIndex, 1)
    mockShareActivity = mockShareActivity.filter(activity => activity.shareId !== shareId)

    return NextResponse.json({
      success: true,
      message: 'Share link deleted successfully'
    })

  } catch (error) {
    console.error('Delete share link error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}