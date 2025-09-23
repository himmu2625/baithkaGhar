import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { validateOSAccess } from '@/lib/auth/os-auth'
import { GuestLoyaltyService } from '@/lib/services/guest-loyalty-service'
import { z } from 'zod'

const processBookingSchema = z.object({
  bookingId: z.string()
})

// POST /api/os/loyalty/booking - Process booking for loyalty points
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()
    const body = await request.json()

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Validate request body
    let validatedData
    try {
      validatedData = processBookingSchema.parse(body)
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json({
          error: 'Validation failed',
          details: error.errors.map(e => ({
            field: e.path.join('.'),
            message: e.message
          }))
        }, { status: 400 })
      }
      throw error
    }

    // Validate access to the booking's property
    const { connectToDatabase } = await import('@/lib/mongodb')
    const Booking = (await import('@/models/Booking')).default
    await connectToDatabase()

    const booking = await Booking.findById(validatedData.bookingId)
    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    const hasAccess = await validateOSAccess(session.user?.email, booking.propertyId.toString())
    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Process loyalty points for the booking
    await GuestLoyaltyService.addPointsFromBooking(validatedData.bookingId)

    return NextResponse.json({
      success: true,
      message: 'Loyalty points processed successfully'
    })

  } catch (error) {
    console.error('Process booking loyalty API error:', error)
    return NextResponse.json(
      { error: 'Failed to process booking for loyalty' },
      { status: 500 }
    )
  }
}