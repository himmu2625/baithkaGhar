import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { validateOSAccess } from '@/lib/auth/os-auth'
import { GuestFeedbackService } from '@/lib/services/guest-feedback-service'
import { z } from 'zod'

const requestFeedbackSchema = z.object({
  bookingId: z.string(),
  type: z.enum(['stay_review', 'service_review', 'exit_survey', 'custom']).default('stay_review'),
  sendReminders: z.boolean().default(true),
  reminderSchedule: z.object({
    immediate: z.boolean().default(false),
    afterHours: z.array(z.number()).default([24, 72, 168]) // 1 day, 3 days, 1 week
  }).optional()
})

// POST /api/os/feedback/request - Request feedback from guest
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
      validatedData = requestFeedbackSchema.parse(body)
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

    const result = await GuestFeedbackService.requestFeedback(validatedData)

    if (!result.success) {
      return NextResponse.json({
        error: result.error || 'Failed to request feedback'
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      feedbackId: result.feedbackId,
      surveyUrl: result.surveyUrl
    })

  } catch (error) {
    console.error('Request feedback API error:', error)
    return NextResponse.json(
      { error: 'Failed to request feedback' },
      { status: 500 }
    )
  }
}