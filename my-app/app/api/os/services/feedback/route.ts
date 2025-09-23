import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { GuestServiceRequestService } from '@/lib/services/guest-service-request'
import { z } from 'zod'

const feedbackSchema = z.object({
  requestId: z.string(),
  rating: z.number().min(1).max(5),
  comment: z.string().optional()
})

// POST /api/os/services/feedback - Submit guest feedback for service request
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
      validatedData = feedbackSchema.parse(body)
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

    // Get the service request to validate access
    const serviceRequest = await GuestServiceRequestService.getServiceRequest(validatedData.requestId)
    if (!serviceRequest) {
      return NextResponse.json({ error: 'Service request not found' }, { status: 404 })
    }

    // Validate that the user is the guest who made the request
    const { connectToDatabase } = await import('@/lib/mongodb')
    const Booking = (await import('@/models/Booking')).default
    await connectToDatabase()

    const booking = await Booking.findById(serviceRequest.bookingId).populate('userId')
    if (!booking || booking.userId.email !== session.user?.email) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const result = await GuestServiceRequestService.submitGuestFeedback(
      validatedData.requestId,
      {
        rating: validatedData.rating,
        comment: validatedData.comment
      }
    )

    if (!result.success) {
      return NextResponse.json({
        error: result.error || 'Failed to submit feedback'
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true
    })

  } catch (error) {
    console.error('Submit feedback API error:', error)
    return NextResponse.json(
      { error: 'Failed to submit feedback' },
      { status: 500 }
    )
  }
}