import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { validateOSAccess } from '@/lib/auth/os-auth'
import { GuestFeedbackService } from '@/lib/services/guest-feedback-service'
import { z } from 'zod'

const respondToFeedbackSchema = z.object({
  feedbackId: z.string(),
  message: z.string().min(10),
  respondedBy: z.string(),
  actionsTaken: z.array(z.string()).optional()
})

// GET /api/os/feedback - Get feedbacks for property
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession()
    const { searchParams } = new URL(request.url)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const propertyId = searchParams.get('propertyId')
    const status = searchParams.get('status')
    const type = searchParams.get('type')
    const minRating = searchParams.get('minRating')
    const maxRating = searchParams.get('maxRating')
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')
    const limit = searchParams.get('limit')
    const offset = searchParams.get('offset')

    if (!propertyId) {
      return NextResponse.json({ error: 'Property ID is required' }, { status: 400 })
    }

    const hasAccess = await validateOSAccess(session.user?.email, propertyId)
    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const filters: any = {}
    if (status) filters.status = status
    if (type) filters.type = type
    if (minRating && maxRating) {
      filters.ratingRange = {
        min: parseInt(minRating),
        max: parseInt(maxRating)
      }
    }
    if (dateFrom) filters.dateFrom = new Date(dateFrom)
    if (dateTo) filters.dateTo = new Date(dateTo)
    if (limit) filters.limit = parseInt(limit)
    if (offset) filters.offset = parseInt(offset)

    const feedbacks = await GuestFeedbackService.getPropertyFeedbacks(propertyId, filters)

    return NextResponse.json({
      success: true,
      feedbacks
    })

  } catch (error) {
    console.error('Get feedbacks API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch feedbacks' },
      { status: 500 }
    )
  }
}

// PUT /api/os/feedback - Respond to feedback
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession()
    const body = await request.json()

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Validate request body
    let validatedData
    try {
      validatedData = respondToFeedbackSchema.parse(body)
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

    // Get the feedback to validate access
    const feedback = await GuestFeedbackService.getFeedback(validatedData.feedbackId)
    if (!feedback) {
      return NextResponse.json({ error: 'Feedback not found' }, { status: 404 })
    }

    const hasAccess = await validateOSAccess(session.user?.email, feedback.propertyId)
    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const result = await GuestFeedbackService.respondToFeedback(validatedData.feedbackId, {
      message: validatedData.message,
      respondedBy: validatedData.respondedBy,
      actionsTaken: validatedData.actionsTaken
    })

    if (!result.success) {
      return NextResponse.json({
        error: result.error || 'Failed to respond to feedback'
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true
    })

  } catch (error) {
    console.error('Respond to feedback API error:', error)
    return NextResponse.json(
      { error: 'Failed to respond to feedback' },
      { status: 500 }
    )
  }
}