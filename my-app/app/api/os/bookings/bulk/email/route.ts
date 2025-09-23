import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { validateOSAccess } from '@/lib/auth/os-auth'
import { connectToDatabase } from '@/lib/mongodb'
import Booking from '@/models/Booking'
import { z } from 'zod'

const bulkEmailSchema = z.object({
  bookingIds: z.array(z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid booking ID format'))
    .min(1, 'At least one booking ID is required')
    .max(100, 'Maximum 100 bookings can be emailed at once'),
  template: z.enum(['confirmation', 'reminder', 'feedback', 'thankyou', 'custom']),
  customMessage: z.string().max(2000, 'Custom message must be less than 2000 characters').optional(),
  subject: z.string().max(200, 'Subject must be less than 200 characters').optional()
})

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()
    const rawData = await request.json()

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Validate request data
    let validatedData
    try {
      validatedData = bulkEmailSchema.parse(rawData)
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

    if (validatedData.template === 'custom' && !validatedData.customMessage) {
      return NextResponse.json({
        error: 'Custom message is required for custom template'
      }, { status: 400 })
    }

    await connectToDatabase()

    // Get all bookings with guest details
    const bookings = await Booking.find({
      _id: { $in: validatedData.bookingIds }
    })
    .populate('propertyId', 'title address city state country')
    .lean()

    if (bookings.length === 0) {
      return NextResponse.json({ error: 'No bookings found' }, { status: 404 })
    }

    // Verify access to all properties
    const propertyIds = [...new Set(bookings.map(b => b.propertyId._id.toString()))]
    const accessChecks = await Promise.all(
      propertyIds.map(propertyId => validateOSAccess(session.user?.email, propertyId))
    )

    if (accessChecks.some(hasAccess => !hasAccess)) {
      return NextResponse.json({ error: 'Access denied to one or more properties' }, { status: 403 })
    }

    // Process emails
    const emailResults: any[] = []
    const emailService = await getEmailService()

    for (const booking of bookings) {
      try {
        const guestEmail = booking.contactDetails?.email || booking.userId?.email
        if (!guestEmail) {
          emailResults.push({
            bookingId: booking._id,
            success: false,
            error: 'No email address found for guest'
          })
          continue
        }

        const emailContent = await generateEmailContent(
          validatedData.template,
          booking,
          validatedData.customMessage,
          validatedData.subject
        )

        await emailService.send({
          to: guestEmail,
          subject: emailContent.subject,
          html: emailContent.html,
          text: emailContent.text
        })

        // Update booking with email sent timestamp
        const emailField = `emailSent.${validatedData.template === 'custom' ? 'custom' : validatedData.template}`
        await Booking.findByIdAndUpdate(booking._id, {
          $set: { [emailField]: new Date() }
        })

        emailResults.push({
          bookingId: booking._id,
          success: true,
          email: guestEmail
        })
      } catch (error) {
        console.error(`Email error for booking ${booking._id}:`, error)
        emailResults.push({
          bookingId: booking._id,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }

    const successCount = emailResults.filter(r => r.success).length
    const failureCount = emailResults.length - successCount

    return NextResponse.json({
      success: true,
      results: emailResults,
      summary: {
        total: emailResults.length,
        sent: successCount,
        failed: failureCount
      },
      message: `${successCount} email(s) sent successfully${failureCount > 0 ? `, ${failureCount} failed` : ''}`
    })
  } catch (error) {
    console.error('Bulk email error:', error)
    return NextResponse.json(
      { error: 'Failed to send emails' },
      { status: 500 }
    )
  }
}

async function getEmailService() {
  // This would typically be your email service (SendGrid, AWS SES, etc.)
  // For now, we'll return a mock service
  return {
    async send(emailData: any) {
      // Mock email sending - replace with actual email service
      console.log('Sending email:', emailData.to, emailData.subject)

      // Simulate email sending delay
      await new Promise(resolve => setTimeout(resolve, 100))

      // For testing, we'll just log the email
      // In production, integrate with your email service
      return { messageId: `mock-${Date.now()}` }
    }
  }
}

async function generateEmailContent(
  template: string,
  booking: any,
  customMessage?: string,
  customSubject?: string
) {
  const property = booking.propertyId
  const guestName = booking.contactDetails?.name || booking.userId?.name || 'Guest'
  const checkInDate = new Date(booking.dateFrom).toLocaleDateString()
  const checkOutDate = new Date(booking.dateTo).toLocaleDateString()

  const templates = {
    confirmation: {
      subject: customSubject || `Booking Confirmation - ${property.title}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Booking Confirmed!</h2>
          <p>Dear ${guestName},</p>
          <p>Your booking has been confirmed. Here are your details:</p>
          <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>${property.title}</h3>
            <p><strong>Check-in:</strong> ${checkInDate}</p>
            <p><strong>Check-out:</strong> ${checkOutDate}</p>
            <p><strong>Guests:</strong> ${booking.guests + (booking.children || 0)}</p>
            <p><strong>Total Amount:</strong> ₹${booking.totalPrice}</p>
            <p><strong>Booking ID:</strong> ${booking._id.toString().slice(-8)}</p>
          </div>
          <p>We look forward to hosting you!</p>
          <p>Best regards,<br>The ${property.title} Team</p>
        </div>
      `,
      text: `Booking Confirmed! Dear ${guestName}, your booking at ${property.title} from ${checkInDate} to ${checkOutDate} has been confirmed.`
    },
    reminder: {
      subject: customSubject || `Check-in Reminder - ${property.title}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #059669;">Check-in Reminder</h2>
          <p>Dear ${guestName},</p>
          <p>This is a friendly reminder about your upcoming stay:</p>
          <div style="background: #ecfdf5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>${property.title}</h3>
            <p><strong>Check-in:</strong> ${checkInDate} (2:00 PM onwards)</p>
            <p><strong>Check-out:</strong> ${checkOutDate} (11:00 AM)</p>
            <p><strong>Address:</strong> ${property.address}, ${property.city}</p>
          </div>
          <p>Please bring a valid ID for check-in. Contact us if you need any assistance.</p>
          <p>Safe travels,<br>The ${property.title} Team</p>
        </div>
      `,
      text: `Check-in Reminder: Dear ${guestName}, your stay at ${property.title} is scheduled for ${checkInDate}.`
    },
    feedback: {
      subject: customSubject || `How was your stay at ${property.title}?`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #7c3aed;">We'd love your feedback!</h2>
          <p>Dear ${guestName},</p>
          <p>Thank you for staying with us at ${property.title}. We hope you had a wonderful experience!</p>
          <p>Your feedback helps us improve our service. Please take a moment to share your thoughts about your recent stay.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="#" style="background: #7c3aed; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Leave a Review</a>
          </div>
          <p>Thank you for choosing us!</p>
          <p>Best regards,<br>The ${property.title} Team</p>
        </div>
      `,
      text: `We'd love your feedback! Thank you for staying at ${property.title}. Please share your experience with us.`
    },
    thankyou: {
      subject: customSubject || `Thank you for staying with us!`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #dc2626;">Thank You!</h2>
          <p>Dear ${guestName},</p>
          <p>Thank you for choosing ${property.title} for your recent stay. It was our pleasure to host you!</p>
          <p>We hope you had a comfortable and enjoyable experience with us. Your satisfaction is our top priority.</p>
          <p>We look forward to welcoming you again in the future.</p>
          <p>Warm regards,<br>The ${property.title} Team</p>
        </div>
      `,
      text: `Thank you for staying with us at ${property.title}! We hope you had a wonderful experience.`
    },
    custom: {
      subject: customSubject || `Message from ${property.title}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #374151;">Message from ${property.title}</h2>
          <p>Dear ${guestName},</p>
          <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
            ${customMessage?.replace(/\n/g, '<br>') || ''}
          </div>
          <p>Best regards,<br>The ${property.title} Team</p>
        </div>
      `,
      text: `Message from ${property.title}: ${customMessage || ''}`
    }
  }

  return templates[template as keyof typeof templates] || templates.custom
}