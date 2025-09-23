import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { validateOSAccess } from '@/lib/auth/os-auth'
import { EmailService } from '@/lib/services/email-service'
import { z } from 'zod'

const sendEmailSchema = z.object({
  type: z.enum(['booking_confirmation', 'check_in_reminder', 'thank_you_feedback', 'custom']),
  bookingId: z.string().optional(),
  recipients: z.array(z.string().email()).optional(),
  templateId: z.string().optional(),
  subject: z.string().optional(),
  htmlContent: z.string().optional(),
  textContent: z.string().optional(),
  variables: z.record(z.any()).optional(),
  priority: z.enum(['low', 'normal', 'high']).default('normal'),
  scheduleAt: z.string().datetime().optional().transform(val => val ? new Date(val) : undefined)
})

const bulkEmailSchema = z.object({
  templateId: z.string(),
  recipients: z.array(z.string().email()),
  variablesPerRecipient: z.record(z.record(z.any())).optional(),
  batchSize: z.number().min(1).max(100).default(50),
  delayBetweenBatches: z.number().min(0).max(10000).default(1000)
})

// POST /api/os/communications/email - Send email
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
      validatedData = sendEmailSchema.parse(body)
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

    let result

    switch (validatedData.type) {
      case 'booking_confirmation':
        if (!validatedData.bookingId) {
          return NextResponse.json({
            error: 'Booking ID is required for booking confirmation emails'
          }, { status: 400 })
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

        result = await EmailService.sendBookingConfirmation(validatedData.bookingId)
        break

      case 'check_in_reminder':
        if (!validatedData.bookingId) {
          return NextResponse.json({
            error: 'Booking ID is required for check-in reminder emails'
          }, { status: 400 })
        }

        result = await EmailService.sendCheckInReminder(validatedData.bookingId)
        break

      case 'thank_you_feedback':
        if (!validatedData.bookingId) {
          return NextResponse.json({
            error: 'Booking ID is required for thank you feedback emails'
          }, { status: 400 })
        }

        result = await EmailService.sendThankYouAndFeedback(validatedData.bookingId)
        break

      case 'custom':
        if (!validatedData.recipients || validatedData.recipients.length === 0) {
          return NextResponse.json({
            error: 'Recipients are required for custom emails'
          }, { status: 400 })
        }

        if (!validatedData.templateId && (!validatedData.subject || !validatedData.htmlContent)) {
          return NextResponse.json({
            error: 'Either template ID or subject and content are required'
          }, { status: 400 })
        }

        // Send to multiple recipients if specified
        if (validatedData.recipients.length === 1) {
          if (validatedData.templateId) {
            result = await EmailService.sendTemplatedEmail(
              validatedData.templateId,
              validatedData.recipients[0],
              validatedData.variables || {},
              {
                scheduleAt: validatedData.scheduleAt,
                priority: validatedData.priority
              }
            )
          } else {
            // Direct email sending would be implemented here
            result = { success: false, error: 'Direct email sending not implemented yet' }
          }
        } else {
          // Bulk email sending
          if (!validatedData.templateId) {
            return NextResponse.json({
              error: 'Template ID is required for bulk emails'
            }, { status: 400 })
          }

          const bulkResult = await EmailService.sendBulkEmails(
            validatedData.recipients,
            validatedData.templateId,
            undefined, // No per-recipient variables for now
            { batchSize: 50, delayBetweenBatches: 1000 }
          )

          return NextResponse.json({
            success: true,
            bulk: true,
            totalSent: bulkResult.totalSent,
            totalFailed: bulkResult.totalFailed,
            results: bulkResult.results
          })
        }
        break

      default:
        return NextResponse.json({
          error: 'Invalid email type'
        }, { status: 400 })
    }

    if (!result.success) {
      return NextResponse.json({
        error: result.error || 'Failed to send email'
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      messageId: result.messageId,
      queueId: result.queueId,
      scheduledFor: result.scheduledFor
    })

  } catch (error) {
    console.error('Email API error:', error)
    return NextResponse.json(
      { error: 'Failed to send email' },
      { status: 500 }
    )
  }
}

// POST /api/os/communications/email/bulk - Send bulk emails
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
      validatedData = bulkEmailSchema.parse(body)
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

    const result = await EmailService.sendBulkEmails(
      validatedData.recipients,
      validatedData.templateId,
      validatedData.variablesPerRecipient,
      {
        batchSize: validatedData.batchSize,
        delayBetweenBatches: validatedData.delayBetweenBatches
      }
    )

    return NextResponse.json({
      success: true,
      totalSent: result.totalSent,
      totalFailed: result.totalFailed,
      successRate: result.totalSent / (result.totalSent + result.totalFailed) * 100,
      results: result.results
    })

  } catch (error) {
    console.error('Bulk email API error:', error)
    return NextResponse.json(
      { error: 'Failed to send bulk emails' },
      { status: 500 }
    )
  }
}