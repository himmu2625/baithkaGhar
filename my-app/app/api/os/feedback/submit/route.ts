import { NextRequest, NextResponse } from 'next/server'
import { GuestFeedbackService } from '@/lib/services/guest-feedback-service'
import { z } from 'zod'

const submitFeedbackSchema = z.object({
  feedbackId: z.string(),

  // Ratings (1-5 scale)
  overallRating: z.number().min(1).max(5),
  cleanliness: z.number().min(1).max(5),
  comfort: z.number().min(1).max(5),
  service: z.number().min(1).max(5),
  valueForMoney: z.number().min(1).max(5),
  location: z.number().min(1).max(5),
  amenities: z.number().min(1).max(5),

  // Experience ratings
  checkInExperience: z.number().min(1).max(5),
  checkOutExperience: z.number().min(1).max(5),
  staffBehavior: z.number().min(1).max(5),
  responseTime: z.number().min(1).max(5),

  // Facility ratings
  roomCondition: z.number().min(1).max(5),
  bathroomCondition: z.number().min(1).max(5),
  internetQuality: z.number().min(1).max(5),
  foodQuality: z.number().min(1).max(5).optional(),
  parkingExperience: z.number().min(1).max(5).optional(),

  // Feedback arrays
  positiveAspects: z.array(z.string()).default([]),
  negativeAspects: z.array(z.string()).default([]),
  improvements: z.array(z.string()).default([]),

  // Boolean feedback
  wouldRecommend: z.boolean(),
  wouldReturnAgain: z.boolean(),

  // Text feedback
  comments: z.string().min(10).max(2000),
  privateNotes: z.string().max(500).optional(),

  // Guest details
  travelPurpose: z.enum(['business', 'leisure', 'family', 'group', 'other']),
  guestType: z.enum(['first_time', 'returning', 'frequent']),
  accompaniedBy: z.enum(['alone', 'spouse', 'family', 'friends', 'colleagues']),

  // Submission details
  submittedVia: z.enum(['email', 'sms', 'qr_code', 'app', 'website', 'phone']).default('website'),
  language: z.string().default('en'),
  deviceType: z.enum(['mobile', 'tablet', 'desktop']).optional()
})

// POST /api/os/feedback/submit - Submit guest feedback
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate request body
    let validatedData
    try {
      validatedData = submitFeedbackSchema.parse(body)
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

    // Check if feedback request exists
    const existingFeedback = await GuestFeedbackService.getFeedback(validatedData.feedbackId)
    if (!existingFeedback) {
      return NextResponse.json({ error: 'Feedback request not found' }, { status: 404 })
    }

    if (existingFeedback.status === 'submitted') {
      return NextResponse.json({ error: 'Feedback already submitted' }, { status: 400 })
    }

    const result = await GuestFeedbackService.submitFeedback(validatedData.feedbackId, validatedData)

    if (!result.success) {
      return NextResponse.json({
        error: result.error || 'Failed to submit feedback'
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Thank you for your feedback!'
    })

  } catch (error) {
    console.error('Submit feedback API error:', error)
    return NextResponse.json(
      { error: 'Failed to submit feedback' },
      { status: 500 }
    )
  }
}