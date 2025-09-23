import nodemailer from 'nodemailer'
import { connectToDatabase } from '@/lib/mongodb'
import Booking from '@/models/Booking'
import Property from '@/models/Property'
import { format, addDays } from 'date-fns'

export interface EmailTemplate {
  templateId: string
  name: string
  subject: string
  htmlContent: string
  textContent: string
  variables: string[]
  category: 'confirmation' | 'reminder' | 'feedback' | 'notification' | 'marketing'
  isActive: boolean
  propertyId?: string
  language: string
  createdAt: Date
  lastModified: Date
}

export interface EmailRequest {
  to: string | string[]
  cc?: string[]
  bcc?: string[]
  templateId?: string
  subject?: string
  htmlContent?: string
  textContent?: string
  variables?: Record<string, any>
  attachments?: Array<{
    filename: string
    content: string | Buffer
    contentType: string
  }>
  priority: 'low' | 'normal' | 'high'
  scheduleAt?: Date
  trackOpening?: boolean
  trackClicks?: boolean
}

export interface EmailResponse {
  success: boolean
  messageId?: string
  error?: string
  queueId?: string
  scheduledFor?: Date
}

export interface EmailStats {
  sent: number
  delivered: number
  opened: number
  clicked: number
  bounced: number
  complained: number
  unsubscribed: number
  openRate: number
  clickRate: number
  bounceRate: number
}

export class EmailService {
  private static transporter: nodemailer.Transporter

  private static getTransporter(): nodemailer.Transporter {
    if (!this.transporter) {
      // Configure email transporter (using Gmail as example)
      this.transporter = nodemailer.createTransporter({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASSWORD
        },
        // For production, use proper SMTP settings
        // host: process.env.SMTP_HOST,
        // port: parseInt(process.env.SMTP_PORT || '587'),
        // secure: process.env.SMTP_SECURE === 'true',
        // auth: {
        //   user: process.env.SMTP_USER,
        //   pass: process.env.SMTP_PASSWORD
        // }
      })
    }

    return this.transporter
  }

  // Send booking confirmation email
  static async sendBookingConfirmation(bookingId: string): Promise<EmailResponse> {
    try {
      await connectToDatabase()

      const booking = await Booking.findById(bookingId)
        .populate('propertyId')
        .populate('userId')

      if (!booking) {
        return {
          success: false,
          error: 'Booking not found'
        }
      }

      const property = booking.propertyId
      const guest = booking.userId || booking.contactDetails

      // Generate booking confirmation template
      const emailContent = this.generateBookingConfirmationEmail(booking, property)

      const emailRequest: EmailRequest = {
        to: guest.email || booking.email,
        subject: `Booking Confirmation - ${property.title}`,
        htmlContent: emailContent.html,
        textContent: emailContent.text,
        priority: 'high',
        trackOpening: true,
        trackClicks: true,
        attachments: [
          {
            filename: 'booking-confirmation.pdf',
            content: await this.generateBookingPDF(booking, property),
            contentType: 'application/pdf'
          }
        ]
      }

      const result = await this.sendEmail(emailRequest)

      // Log email sending
      if (result.success) {
        await this.logEmailActivity(bookingId, 'booking_confirmation', result.messageId!)
      }

      return result

    } catch (error) {
      console.error('Send booking confirmation error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  // Send check-in reminder email
  static async sendCheckInReminder(bookingId: string): Promise<EmailResponse> {
    try {
      await connectToDatabase()

      const booking = await Booking.findById(bookingId)
        .populate('propertyId')
        .populate('userId')

      if (!booking) {
        return {
          success: false,
          error: 'Booking not found'
        }
      }

      const property = booking.propertyId
      const guest = booking.userId || booking.contactDetails

      const emailContent = this.generateCheckInReminderEmail(booking, property)

      const emailRequest: EmailRequest = {
        to: guest.email || booking.email,
        subject: `Check-in Reminder - ${property.title}`,
        htmlContent: emailContent.html,
        textContent: emailContent.text,
        priority: 'normal',
        trackOpening: true
      }

      const result = await this.sendEmail(emailRequest)

      if (result.success) {
        await this.logEmailActivity(bookingId, 'check_in_reminder', result.messageId!)

        // Update booking to mark reminder as sent
        if (!booking.emailSent) booking.emailSent = {}
        booking.emailSent.checkInReminder = new Date()
        await booking.save()
      }

      return result

    } catch (error) {
      console.error('Send check-in reminder error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  // Send thank you and feedback email
  static async sendThankYouAndFeedback(bookingId: string): Promise<EmailResponse> {
    try {
      await connectToDatabase()

      const booking = await Booking.findById(bookingId)
        .populate('propertyId')
        .populate('userId')

      if (!booking) {
        return {
          success: false,
          error: 'Booking not found'
        }
      }

      const property = booking.propertyId
      const guest = booking.userId || booking.contactDetails

      const emailContent = this.generateThankYouFeedbackEmail(booking, property)

      const emailRequest: EmailRequest = {
        to: guest.email || booking.email,
        subject: `Thank you for staying with us - Share your experience`,
        htmlContent: emailContent.html,
        textContent: emailContent.text,
        priority: 'normal',
        trackOpening: true,
        trackClicks: true
      }

      const result = await this.sendEmail(emailRequest)

      if (result.success) {
        await this.logEmailActivity(bookingId, 'thank_you_feedback', result.messageId!)

        // Update booking to mark feedback email as sent
        if (!booking.emailSent) booking.emailSent = {}
        booking.emailSent.feedbackRequest = new Date()
        await booking.save()
      }

      return result

    } catch (error) {
      console.error('Send thank you feedback error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  // Send custom email using template
  static async sendTemplatedEmail(
    templateId: string,
    recipient: string,
    variables: Record<string, any> = {},
    options?: {
      scheduleAt?: Date
      priority?: 'low' | 'normal' | 'high'
    }
  ): Promise<EmailResponse> {
    try {
      const template = await this.getEmailTemplate(templateId)
      if (!template) {
        return {
          success: false,
          error: 'Email template not found'
        }
      }

      // Replace variables in template
      const subject = this.replaceVariables(template.subject, variables)
      const htmlContent = this.replaceVariables(template.htmlContent, variables)
      const textContent = this.replaceVariables(template.textContent, variables)

      const emailRequest: EmailRequest = {
        to: recipient,
        subject,
        htmlContent,
        textContent,
        priority: options?.priority || 'normal',
        scheduleAt: options?.scheduleAt,
        trackOpening: true,
        trackClicks: true
      }

      return await this.sendEmail(emailRequest)

    } catch (error) {
      console.error('Send templated email error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  // Send bulk emails
  static async sendBulkEmails(
    recipients: string[],
    templateId: string,
    variablesPerRecipient?: Record<string, Record<string, any>>,
    options?: {
      batchSize?: number
      delayBetweenBatches?: number
    }
  ): Promise<{
    totalSent: number
    totalFailed: number
    results: Array<{ email: string; success: boolean; messageId?: string; error?: string }>
  }> {
    const batchSize = options?.batchSize || 50
    const delay = options?.delayBetweenBatches || 1000

    let totalSent = 0
    let totalFailed = 0
    const results: Array<{ email: string; success: boolean; messageId?: string; error?: string }> = []

    // Process recipients in batches
    for (let i = 0; i < recipients.length; i += batchSize) {
      const batch = recipients.slice(i, i + batchSize)

      const batchPromises = batch.map(async (email) => {
        const variables = variablesPerRecipient?.[email] || {}
        const result = await this.sendTemplatedEmail(templateId, email, variables)

        results.push({
          email,
          success: result.success,
          messageId: result.messageId,
          error: result.error
        })

        if (result.success) {
          totalSent++
        } else {
          totalFailed++
        }

        return result
      })

      await Promise.all(batchPromises)

      // Delay between batches to avoid rate limiting
      if (i + batchSize < recipients.length) {
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }

    return { totalSent, totalFailed, results }
  }

  // Core email sending function
  private static async sendEmail(request: EmailRequest): Promise<EmailResponse> {
    try {
      const transporter = this.getTransporter()

      const mailOptions = {
        from: `"Baithaka GHAR" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
        to: Array.isArray(request.to) ? request.to.join(', ') : request.to,
        cc: request.cc?.join(', '),
        bcc: request.bcc?.join(', '),
        subject: request.subject,
        html: request.htmlContent,
        text: request.textContent,
        attachments: request.attachments?.map(att => ({
          filename: att.filename,
          content: att.content,
          contentType: att.contentType
        })),
        priority: request.priority === 'high' ? 'high' : request.priority === 'low' ? 'low' : 'normal'
      }

      // Handle scheduled emails
      if (request.scheduleAt && request.scheduleAt > new Date()) {
        const queueId = await this.scheduleEmail(request)
        return {
          success: true,
          queueId,
          scheduledFor: request.scheduleAt
        }
      }

      const info = await transporter.sendMail(mailOptions)

      return {
        success: true,
        messageId: info.messageId
      }

    } catch (error) {
      console.error('Email sending error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  // Generate booking confirmation email content
  private static generateBookingConfirmationEmail(booking: any, property: any) {
    const checkInDate = format(new Date(booking.dateFrom), 'EEEE, MMMM dd, yyyy')
    const checkOutDate = format(new Date(booking.dateTo), 'EEEE, MMMM dd, yyyy')
    const nights = Math.ceil((new Date(booking.dateTo).getTime() - new Date(booking.dateFrom).getTime()) / (1000 * 60 * 60 * 24))

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Booking Confirmation</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; }
          .header { background: #2563eb; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; }
          .booking-details { background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 20px 0; }
          .detail-row { display: flex; justify-content: space-between; margin-bottom: 10px; }
          .footer { background: #f1f5f9; padding: 20px; text-align: center; font-size: 12px; }
          .button { background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 10px 0; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Booking Confirmed!</h1>
          <p>Thank you for choosing ${property.title}</p>
        </div>

        <div class="content">
          <p>Dear ${booking.contactDetails?.name || booking.guestName || 'Guest'},</p>

          <p>We're excited to confirm your reservation! Your booking has been successfully confirmed and we look forward to welcoming you.</p>

          <div class="booking-details">
            <h3>Booking Details</h3>
            <div class="detail-row">
              <strong>Booking Reference:</strong>
              <span>${booking.bookingReference || booking._id.toString().slice(-8)}</span>
            </div>
            <div class="detail-row">
              <strong>Property:</strong>
              <span>${property.title}</span>
            </div>
            <div class="detail-row">
              <strong>Check-in:</strong>
              <span>${checkInDate}</span>
            </div>
            <div class="detail-row">
              <strong>Check-out:</strong>
              <span>${checkOutDate}</span>
            </div>
            <div class="detail-row">
              <strong>Duration:</strong>
              <span>${nights} night${nights > 1 ? 's' : ''}</span>
            </div>
            <div class="detail-row">
              <strong>Guests:</strong>
              <span>${booking.guests} adult${booking.guests > 1 ? 's' : ''}${booking.children ? `, ${booking.children} child${booking.children > 1 ? 'ren' : ''}` : ''}</span>
            </div>
            <div class="detail-row">
              <strong>Room:</strong>
              <span>${booking.allocatedRoom?.roomTypeName || 'To be assigned'}</span>
            </div>
            <div class="detail-row">
              <strong>Total Amount:</strong>
              <span>₹${(booking.totalPrice || 0).toLocaleString()}</span>
            </div>
            <div class="detail-row">
              <strong>Payment Status:</strong>
              <span>${booking.paymentStatus === 'completed' ? 'Paid' : 'Pending'}</span>
            </div>
          </div>

          ${booking.specialRequests ? `
          <div class="booking-details">
            <h3>Special Requests</h3>
            <p>${booking.specialRequests}</p>
          </div>
          ` : ''}

          <div class="booking-details">
            <h3>Property Information</h3>
            <p><strong>Address:</strong> ${property.address?.street}, ${property.address?.city}, ${property.address?.state} ${property.address?.zipCode}</p>
            <p><strong>Check-in Time:</strong> ${property.checkInTime || '3:00 PM'}</p>
            <p><strong>Check-out Time:</strong> ${property.checkOutTime || '11:00 AM'}</p>
            ${property.contactDetails?.phone ? `<p><strong>Phone:</strong> ${property.contactDetails.phone}</p>` : ''}
          </div>

          <div style="text-align: center;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/bookings/${booking._id}" class="button">
              View Booking Details
            </a>
          </div>

          <p>If you have any questions or need to make changes to your booking, please contact us or use the link above to manage your reservation.</p>

          <p>We look forward to hosting you!</p>

          <p>Best regards,<br>
          The ${property.title} Team</p>
        </div>

        <div class="footer">
          <p>This is an automated message. Please do not reply to this email.</p>
          <p>© 2024 Baithaka GHAR. All rights reserved.</p>
        </div>
      </body>
      </html>
    `

    const text = `
      Booking Confirmation - ${property.title}

      Dear ${booking.contactDetails?.name || booking.guestName || 'Guest'},

      Your booking has been confirmed!

      Booking Details:
      - Reference: ${booking.bookingReference || booking._id.toString().slice(-8)}
      - Property: ${property.title}
      - Check-in: ${checkInDate}
      - Check-out: ${checkOutDate}
      - Duration: ${nights} night${nights > 1 ? 's' : ''}
      - Guests: ${booking.guests} adult${booking.guests > 1 ? 's' : ''}${booking.children ? `, ${booking.children} child${booking.children > 1 ? 'ren' : ''}` : ''}
      - Room: ${booking.allocatedRoom?.roomTypeName || 'To be assigned'}
      - Total Amount: ₹${(booking.totalPrice || 0).toLocaleString()}
      - Payment Status: ${booking.paymentStatus === 'completed' ? 'Paid' : 'Pending'}

      ${booking.specialRequests ? `Special Requests: ${booking.specialRequests}\n` : ''}

      Property Information:
      - Address: ${property.address?.street}, ${property.address?.city}, ${property.address?.state} ${property.address?.zipCode}
      - Check-in Time: ${property.checkInTime || '3:00 PM'}
      - Check-out Time: ${property.checkOutTime || '11:00 AM'}
      ${property.contactDetails?.phone ? `- Phone: ${property.contactDetails.phone}` : ''}

      View your booking: ${process.env.NEXT_PUBLIC_APP_URL}/bookings/${booking._id}

      Thank you for choosing ${property.title}!

      Best regards,
      The ${property.title} Team
    `

    return { html, text }
  }

  // Generate check-in reminder email content
  private static generateCheckInReminderEmail(booking: any, property: any) {
    const checkInDate = format(new Date(booking.dateFrom), 'EEEE, MMMM dd, yyyy')
    const checkInTime = property.checkInTime || '3:00 PM'

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Check-in Reminder</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; }
          .header { background: #059669; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; }
          .highlight-box { background: #ecfdf5; border-left: 4px solid #059669; padding: 15px; margin: 20px 0; }
          .footer { background: #f1f5f9; padding: 20px; text-align: center; font-size: 12px; }
          .button { background: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 10px 0; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Your Stay is Tomorrow!</h1>
          <p>Check-in reminder for ${property.title}</p>
        </div>

        <div class="content">
          <p>Dear ${booking.contactDetails?.name || booking.guestName || 'Guest'},</p>

          <p>We're excited to welcome you tomorrow! This is a friendly reminder about your upcoming stay.</p>

          <div class="highlight-box">
            <h3>Check-in Information</h3>
            <p><strong>Date:</strong> ${checkInDate}</p>
            <p><strong>Time:</strong> ${checkInTime}</p>
            <p><strong>Address:</strong> ${property.address?.street}, ${property.address?.city}</p>
            <p><strong>Booking Reference:</strong> ${booking.bookingReference || booking._id.toString().slice(-8)}</p>
          </div>

          <h3>What to Bring:</h3>
          <ul>
            <li>Valid government-issued photo ID</li>
            <li>Booking confirmation (this email)</li>
            <li>Payment card used for booking (if applicable)</li>
          </ul>

          <h3>Check-in Process:</h3>
          <ol>
            <li>Arrive at the property</li>
            <li>Present your ID and booking confirmation</li>
            <li>Complete any remaining formalities</li>
            <li>Receive your room keys and property information</li>
          </ol>

          ${property.checkInInstructions ? `
          <div class="highlight-box">
            <h3>Special Check-in Instructions</h3>
            <p>${property.checkInInstructions}</p>
          </div>
          ` : ''}

          <div style="text-align: center;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/bookings/${booking._id}" class="button">
              View Booking Details
            </a>
          </div>

          <p>If you're running late or have any questions, please contact us at ${property.contactDetails?.phone || 'the property'}</p>

          <p>We can't wait to host you!</p>

          <p>Best regards,<br>
          The ${property.title} Team</p>
        </div>

        <div class="footer">
          <p>This is an automated message. Please do not reply to this email.</p>
          <p>© 2024 Baithaka GHAR. All rights reserved.</p>
        </div>
      </body>
      </html>
    `

    const text = `
      Check-in Reminder - ${property.title}

      Dear ${booking.contactDetails?.name || booking.guestName || 'Guest'},

      Your stay is tomorrow! This is a friendly reminder about your upcoming check-in.

      Check-in Information:
      - Date: ${checkInDate}
      - Time: ${checkInTime}
      - Address: ${property.address?.street}, ${property.address?.city}
      - Booking Reference: ${booking.bookingReference || booking._id.toString().slice(-8)}

      What to Bring:
      - Valid government-issued photo ID
      - Booking confirmation
      - Payment card used for booking (if applicable)

      ${property.checkInInstructions ? `Special Instructions: ${property.checkInInstructions}\n` : ''}

      Contact: ${property.contactDetails?.phone || 'See booking details'}

      View booking: ${process.env.NEXT_PUBLIC_APP_URL}/bookings/${booking._id}

      We look forward to hosting you!

      Best regards,
      The ${property.title} Team
    `

    return { html, text }
  }

  // Generate thank you and feedback email content
  private static generateThankYouFeedbackEmail(booking: any, property: any) {
    const feedbackUrl = `${process.env.NEXT_PUBLIC_APP_URL}/feedback/${booking._id}`

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Thank You for Your Stay</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; }
          .header { background: #7c3aed; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; }
          .feedback-box { background: #faf5ff; border: 2px solid #7c3aed; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center; }
          .footer { background: #f1f5f9; padding: 20px; text-align: center; font-size: 12px; }
          .button { background: #7c3aed; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 10px 0; }
          .stars { font-size: 24px; color: #fbbf24; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Thank You!</h1>
          <p>We hope you enjoyed your stay at ${property.title}</p>
        </div>

        <div class="content">
          <p>Dear ${booking.contactDetails?.name || booking.guestName || 'Guest'},</p>

          <p>Thank you for choosing ${property.title} for your recent stay. We hope you had a wonderful experience and created memorable moments.</p>

          <div class="feedback-box">
            <h3>How was your stay?</h3>
            <div class="stars">⭐⭐⭐⭐⭐</div>
            <p>Your feedback is invaluable to us and helps us improve our services for future guests.</p>

            <a href="${feedbackUrl}" class="button">
              Share Your Experience
            </a>

            <p style="font-size: 14px; margin-top: 15px;">
              Takes less than 2 minutes • Completely anonymous if you prefer
            </p>
          </div>

          <h3>What you can tell us about:</h3>
          <ul>
            <li>Room comfort and cleanliness</li>
            <li>Staff service and friendliness</li>
            <li>Property amenities and facilities</li>
            <li>Overall value for money</li>
            <li>Suggestions for improvement</li>
          </ul>

          <p>As a token of our appreciation, guests who complete our feedback survey are eligible for:</p>
          <ul>
            <li>10% discount on your next booking</li>
            <li>Early check-in privileges</li>
            <li>Complimentary room upgrade (subject to availability)</li>
          </ul>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${feedbackUrl}" class="button">
              Leave Your Feedback
            </a>
          </div>

          <p>We would also love to connect with you on social media. Share your photos and tag us:</p>
          <p style="text-align: center;">
            📸 Instagram: @baithakaghar<br>
            📘 Facebook: Baithaka GHAR<br>
            🐦 Twitter: @baithakaghar
          </p>

          <p>Thank you once again for your stay. We look forward to welcoming you back soon!</p>

          <p>Warm regards,<br>
          The ${property.title} Team</p>
        </div>

        <div class="footer">
          <p>This is an automated message. Please do not reply to this email.</p>
          <p>© 2024 Baithaka GHAR. All rights reserved.</p>
        </div>
      </body>
      </html>
    `

    const text = `
      Thank You for Your Stay - ${property.title}

      Dear ${booking.contactDetails?.name || booking.guestName || 'Guest'},

      Thank you for choosing ${property.title} for your recent stay. We hope you had a wonderful experience!

      We'd love to hear about your experience. Your feedback helps us improve our services.

      Share your feedback: ${feedbackUrl}

      Tell us about:
      - Room comfort and cleanliness
      - Staff service and friendliness
      - Property amenities and facilities
      - Overall value for money
      - Suggestions for improvement

      Complete our survey and get:
      - 10% discount on your next booking
      - Early check-in privileges
      - Complimentary room upgrade (subject to availability)

      Connect with us:
      📸 Instagram: @baithakaghar
      📘 Facebook: Baithaka GHAR
      🐦 Twitter: @baithakaghar

      Thank you again for your stay!

      Warm regards,
      The ${property.title} Team
    `

    return { html, text }
  }

  // Helper methods
  private static async getEmailTemplate(templateId: string): Promise<EmailTemplate | null> {
    // In production, this would fetch from database
    // For now, return null to use default templates
    return null
  }

  private static replaceVariables(content: string, variables: Record<string, any>): string {
    let result = content

    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g')
      result = result.replace(regex, String(value))
    })

    return result
  }

  private static async generateBookingPDF(booking: any, property: any): Promise<Buffer> {
    // In production, use a PDF generation library like puppeteer or jsPDF
    // For now, return empty buffer
    return Buffer.from('PDF content would go here')
  }

  private static async scheduleEmail(request: EmailRequest): Promise<string> {
    // In production, integrate with a job queue system like Bull or Agenda
    // For now, return a mock queue ID
    return `queue_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private static async logEmailActivity(bookingId: string, type: string, messageId: string): Promise<void> {
    try {
      await connectToDatabase()

      const booking = await Booking.findById(bookingId)
      if (booking) {
        if (!booking.emailActivity) {
          booking.emailActivity = []
        }

        booking.emailActivity.push({
          type,
          messageId,
          sentAt: new Date(),
          status: 'sent'
        })

        await booking.save()
      }
    } catch (error) {
      console.error('Email activity logging error:', error)
    }
  }
}