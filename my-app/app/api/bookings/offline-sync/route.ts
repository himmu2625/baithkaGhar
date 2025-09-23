import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const offlineBookingSchema = z.object({
  offlineId: z.string().min(1, 'Offline booking ID required'),
  propertyId: z.string().min(1, 'Property ID required'),
  roomType: z.string().min(1, 'Room type required'),
  checkInDate: z.string().min(1, 'Check-in date required'),
  checkOutDate: z.string().min(1, 'Check-out date required'),
  guests: z.number().min(1, 'Number of guests required'),
  guestInfo: z.object({
    firstName: z.string().min(1, 'First name required'),
    lastName: z.string().min(1, 'Last name required'),
    email: z.string().email('Valid email required'),
    phone: z.string().min(1, 'Phone number required'),
    address: z.string().optional(),
    specialRequests: z.string().optional()
  }),
  pricing: z.object({
    baseRate: z.number().min(0, 'Base rate must be positive'),
    taxes: z.number().min(0, 'Taxes must be positive'),
    fees: z.number().min(0, 'Fees must be positive'),
    total: z.number().min(0, 'Total must be positive')
  }),
  createdOffline: z.boolean().default(true),
  createdAt: z.string().min(1, 'Creation date required')
})

const batchSyncSchema = z.object({
  bookings: z.array(offlineBookingSchema).min(1, 'At least one booking required')
})

interface SyncedBooking {
  offlineId: string
  serverBookingId: string
  confirmationNumber: string
  status: 'confirmed' | 'failed'
  error?: string
}

interface SyncResult {
  success: boolean
  totalBookings: number
  successfulBookings: number
  failedBookings: number
  results: SyncedBooking[]
  errors: string[]
}

// Mock database - replace with actual database calls
let mockBookings: any[] = []
let bookingCounter = 1000

function generateConfirmationNumber(): string {
  const prefix = 'BG'
  const year = new Date().getFullYear()
  const counter = String(bookingCounter++).padStart(6, '0')
  return `${prefix}-${year}-${counter}`
}

function generateBookingId(): string {
  return `booking-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`
}

function validateBookingDates(checkIn: string, checkOut: string): boolean {
  const checkInDate = new Date(checkIn)
  const checkOutDate = new Date(checkOut)
  const today = new Date()

  // Remove time component for comparison
  today.setHours(0, 0, 0, 0)
  checkInDate.setHours(0, 0, 0, 0)
  checkOutDate.setHours(0, 0, 0, 0)

  // Check-in should be today or future
  if (checkInDate < today) {
    return false
  }

  // Check-out should be after check-in
  if (checkOutDate <= checkInDate) {
    return false
  }

  return true
}

function validateRoomAvailability(roomType: string, checkIn: string, checkOut: string): boolean {
  // Mock availability check - in real implementation, check against room inventory
  const checkInDate = new Date(checkIn)
  const checkOutDate = new Date(checkOut)

  // Check for conflicting bookings
  const conflictingBookings = mockBookings.filter(booking => {
    if (booking.roomType !== roomType) return false

    const existingCheckIn = new Date(booking.checkInDate)
    const existingCheckOut = new Date(booking.checkOutDate)

    // Check for date overlap
    return (checkInDate < existingCheckOut && checkOutDate > existingCheckIn)
  })

  // Assume we have limited inventory per room type
  const roomInventory = {
    'Standard King': 5,
    'Standard Queen': 4,
    'Deluxe Suite': 2,
    'Presidential Suite': 1
  }

  const maxRooms = roomInventory[roomType as keyof typeof roomInventory] || 1
  return conflictingBookings.length < maxRooms
}

function calculatePricing(roomType: string, checkIn: string, checkOut: string, guests: number): any {
  const checkInDate = new Date(checkIn)
  const checkOutDate = new Date(checkOut)
  const nights = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24))

  // Base rates by room type
  const baseRates = {
    'Standard King': 120,
    'Standard Queen': 110,
    'Deluxe Suite': 200,
    'Presidential Suite': 350
  }

  const baseRate = baseRates[roomType as keyof typeof baseRates] || 100
  const subtotal = baseRate * nights
  const taxes = subtotal * 0.15 // 15% tax
  const fees = 25 // Fixed booking fee
  const total = subtotal + taxes + fees

  return {
    baseRate: subtotal,
    taxes: Math.round(taxes * 100) / 100,
    fees,
    total: Math.round(total * 100) / 100,
    nights,
    ratePerNight: baseRate
  }
}

async function processSingleBooking(offlineBooking: any): Promise<SyncedBooking> {
  try {
    // Validate booking dates
    if (!validateBookingDates(offlineBooking.checkInDate, offlineBooking.checkOutDate)) {
      return {
        offlineId: offlineBooking.offlineId,
        serverBookingId: '',
        confirmationNumber: '',
        status: 'failed',
        error: 'Invalid booking dates - check-in must be today or future, check-out must be after check-in'
      }
    }

    // Check room availability
    if (!validateRoomAvailability(offlineBooking.roomType, offlineBooking.checkInDate, offlineBooking.checkOutDate)) {
      return {
        offlineId: offlineBooking.offlineId,
        serverBookingId: '',
        confirmationNumber: '',
        status: 'failed',
        error: 'Room not available for selected dates'
      }
    }

    // Recalculate pricing to ensure accuracy
    const serverPricing = calculatePricing(
      offlineBooking.roomType,
      offlineBooking.checkInDate,
      offlineBooking.checkOutDate,
      offlineBooking.guests
    )

    // Allow small pricing discrepancies (within 5%)
    const pricingDifference = Math.abs(serverPricing.total - offlineBooking.pricing.total)
    const allowedVariance = serverPricing.total * 0.05

    if (pricingDifference > allowedVariance) {
      return {
        offlineId: offlineBooking.offlineId,
        serverBookingId: '',
        confirmationNumber: '',
        status: 'failed',
        error: `Pricing has changed. New total: $${serverPricing.total} (was $${offlineBooking.pricing.total})`
      }
    }

    // Create server booking
    const serverBookingId = generateBookingId()
    const confirmationNumber = generateConfirmationNumber()

    const serverBooking = {
      id: serverBookingId,
      confirmationNumber,
      propertyId: offlineBooking.propertyId,
      roomType: offlineBooking.roomType,
      checkInDate: offlineBooking.checkInDate,
      checkOutDate: offlineBooking.checkOutDate,
      guests: offlineBooking.guests,
      guestInfo: offlineBooking.guestInfo,
      pricing: serverPricing, // Use server-calculated pricing
      status: 'confirmed',
      paymentStatus: 'pending',
      createdAt: new Date().toISOString(),
      createdOffline: true,
      offlineId: offlineBooking.offlineId,
      originalOfflineCreatedAt: offlineBooking.createdAt,
      syncedAt: new Date().toISOString()
    }

    // Save to mock database
    mockBookings.push(serverBooking)

    // In a real implementation, you would:
    // 1. Save to actual database
    // 2. Send confirmation email
    // 3. Update inventory systems
    // 4. Process payment if required
    // 5. Trigger webhooks/notifications

    console.log(`Successfully synced offline booking ${offlineBooking.offlineId} -> ${serverBookingId}`)

    return {
      offlineId: offlineBooking.offlineId,
      serverBookingId,
      confirmationNumber,
      status: 'confirmed'
    }

  } catch (error) {
    console.error(`Error processing offline booking ${offlineBooking.offlineId}:`, error)

    return {
      offlineId: offlineBooking.offlineId,
      serverBookingId: '',
      confirmationNumber: '',
      status: 'failed',
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }
  }
}

// Sync single offline booking
export async function POST(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const batchMode = url.searchParams.get('batch') === 'true'

    if (batchMode) {
      // Handle batch sync
      const body = await request.json()
      const { bookings } = batchSyncSchema.parse(body)

      const syncResult: SyncResult = {
        success: true,
        totalBookings: bookings.length,
        successfulBookings: 0,
        failedBookings: 0,
        results: [],
        errors: []
      }

      // Process each booking
      for (const booking of bookings) {
        try {
          const result = await processSingleBooking(booking)
          syncResult.results.push(result)

          if (result.status === 'confirmed') {
            syncResult.successfulBookings++
          } else {
            syncResult.failedBookings++
            if (result.error) {
              syncResult.errors.push(`Booking ${booking.offlineId}: ${result.error}`)
            }
          }
        } catch (error) {
          syncResult.failedBookings++
          const errorMessage = error instanceof Error ? error.message : 'Unknown error'
          syncResult.errors.push(`Booking ${booking.offlineId}: ${errorMessage}`)
        }
      }

      // Mark overall success/failure
      syncResult.success = syncResult.failedBookings === 0

      return NextResponse.json(syncResult)

    } else {
      // Handle single booking sync
      const body = await request.json()
      const offlineBooking = offlineBookingSchema.parse(body)

      const result = await processSingleBooking(offlineBooking)

      if (result.status === 'confirmed') {
        return NextResponse.json({
          success: true,
          booking: {
            id: result.serverBookingId,
            confirmationNumber: result.confirmationNumber,
            offlineId: result.offlineId
          },
          message: 'Booking successfully synced to server'
        })
      } else {
        return NextResponse.json({
          success: false,
          error: result.error || 'Failed to sync booking',
          offlineId: result.offlineId
        }, { status: 400 })
      }
    }

  } catch (error) {
    console.error('Offline sync API error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Validation error',
        details: error.errors
      }, { status: 400 })
    }

    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}

// Get sync status and statistics
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const offlineId = url.searchParams.get('offlineId')

    if (offlineId) {
      // Get status of specific offline booking
      const syncedBooking = mockBookings.find(b => b.offlineId === offlineId)

      if (syncedBooking) {
        return NextResponse.json({
          success: true,
          status: 'synced',
          booking: {
            id: syncedBooking.id,
            confirmationNumber: syncedBooking.confirmationNumber,
            status: syncedBooking.status,
            syncedAt: syncedBooking.syncedAt
          }
        })
      } else {
        return NextResponse.json({
          success: false,
          status: 'not-found',
          error: 'Offline booking not found in server records'
        }, { status: 404 })
      }
    } else {
      // Get general sync statistics
      const offlineBookings = mockBookings.filter(b => b.createdOffline)
      const recentSyncs = offlineBookings.filter(b => {
        const syncTime = new Date(b.syncedAt).getTime()
        const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000)
        return syncTime > oneDayAgo
      })

      return NextResponse.json({
        success: true,
        statistics: {
          totalOfflineBookingsSynced: offlineBookings.length,
          recentSyncs: recentSyncs.length,
          lastSyncTime: offlineBookings.length > 0 ?
            Math.max(...offlineBookings.map(b => new Date(b.syncedAt).getTime())) : null
        }
      })
    }

  } catch (error) {
    console.error('Get sync status error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}

// Delete synced offline booking
export async function DELETE(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const offlineId = url.searchParams.get('offlineId')

    if (!offlineId) {
      return NextResponse.json({
        success: false,
        error: 'Offline booking ID required'
      }, { status: 400 })
    }

    const bookingIndex = mockBookings.findIndex(b => b.offlineId === offlineId)

    if (bookingIndex === -1) {
      return NextResponse.json({
        success: false,
        error: 'Offline booking not found'
      }, { status: 404 })
    }

    const deletedBooking = mockBookings.splice(bookingIndex, 1)[0]

    return NextResponse.json({
      success: true,
      message: 'Offline booking removed from server',
      deletedBooking: {
        id: deletedBooking.id,
        confirmationNumber: deletedBooking.confirmationNumber
      }
    })

  } catch (error) {
    console.error('Delete offline booking error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}