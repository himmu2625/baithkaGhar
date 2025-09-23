import { connectToDatabase } from '@/lib/mongodb'
import Booking from '@/models/Booking'
import { addDays, subDays, startOfDay, endOfDay, format, isAfter, isBefore } from 'date-fns'

export interface ReminderConfig {
  checkInReminder: {
    enabled: boolean
    daysBefore: number
    timeOfDay: string // HH:mm format
  }
  checkOutReminder: {
    enabled: boolean
    daysBefore: number
    timeOfDay: string
  }
  paymentReminder: {
    enabled: boolean
    daysBefore: number[]
    maxReminders: number
  }
  feedbackRequest: {
    enabled: boolean
    daysAfterCheckOut: number
  }
  cancellationDeadline: {
    enabled: boolean
    daysBefore: number
  }
}

export interface ReminderTemplate {
  type: 'check_in' | 'check_out' | 'payment' | 'feedback' | 'cancellation_deadline'
  subject: string
  htmlTemplate: string
  textTemplate: string
}

export class BookingReminderService {
  private config: ReminderConfig
  private templates: Record<string, ReminderTemplate>

  constructor(config?: Partial<ReminderConfig>) {
    this.config = {
      checkInReminder: {
        enabled: true,
        daysBefore: 1,
        timeOfDay: '09:00'
      },
      checkOutReminder: {
        enabled: true,
        daysBefore: 0,
        timeOfDay: '08:00'
      },
      paymentReminder: {
        enabled: true,
        daysBefore: [7, 3, 1],
        maxReminders: 3
      },
      feedbackRequest: {
        enabled: true,
        daysAfterCheckOut: 1
      },
      cancellationDeadline: {
        enabled: true,
        daysBefore: 2
      },
      ...config
    }

    this.templates = this.getDefaultTemplates()
  }

  async processAllReminders(): Promise<{
    processed: number
    sent: number
    failed: number
    results: any[]
  }> {
    try {
      await connectToDatabase()

      const results = await Promise.all([
        this.processCheckInReminders(),
        this.processCheckOutReminders(),
        this.processPaymentReminders(),
        this.processFeedbackRequests(),
        this.processCancellationDeadlineReminders()
      ])

      const summary = results.reduce(
        (acc, result) => ({
          processed: acc.processed + result.processed,
          sent: acc.sent + result.sent,
          failed: acc.failed + result.failed,
          results: [...acc.results, ...result.results]
        }),
        { processed: 0, sent: 0, failed: 0, results: [] }
      )

      console.log('Reminder processing summary:', summary)
      return summary
    } catch (error) {
      console.error('Error processing reminders:', error)
      throw error
    }
  }

  async processCheckInReminders(): Promise<{
    processed: number
    sent: number
    failed: number
    results: any[]
  }> {
    if (!this.config.checkInReminder.enabled) {
      return { processed: 0, sent: 0, failed: 0, results: [] }
    }

    const targetDate = addDays(new Date(), this.config.checkInReminder.daysBefore)
    const startDate = startOfDay(targetDate)
    const endDate = endOfDay(targetDate)

    const bookings = await Booking.find({
      dateFrom: { $gte: startDate, $lte: endDate },
      status: { $in: ['confirmed', 'pending'] },
      $or: [
        { 'emailSent.checkInReminder': { $exists: false } },
        { 'emailSent.checkInReminder': null }
      ]
    }).populate('propertyId', 'title address city state country phone email')

    const results = []
    let sent = 0
    let failed = 0

    for (const booking of bookings) {
      try {
        const emailSent = await this.sendCheckInReminder(booking)

        if (emailSent) {
          await Booking.findByIdAndUpdate(booking._id, {
            $set: { 'emailSent.checkInReminder': new Date() }
          })
          sent++
        } else {
          failed++
        }

        results.push({
          bookingId: booking._id,
          type: 'check_in_reminder',
          success: emailSent,
          email: booking.contactDetails?.email || booking.userId?.email
        })
      } catch (error) {
        console.error(`Check-in reminder error for booking ${booking._id}:`, error)
        failed++
        results.push({
          bookingId: booking._id,
          type: 'check_in_reminder',
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }

    return {
      processed: bookings.length,
      sent,
      failed,
      results
    }
  }

  async processCheckOutReminders(): Promise<{
    processed: number
    sent: number
    failed: number
    results: any[]
  }> {
    if (!this.config.checkOutReminder.enabled) {
      return { processed: 0, sent: 0, failed: 0, results: [] }
    }

    const targetDate = this.config.checkOutReminder.daysBefore === 0
      ? new Date()
      : addDays(new Date(), this.config.checkOutReminder.daysBefore)

    const startDate = startOfDay(targetDate)
    const endDate = endOfDay(targetDate)

    const bookings = await Booking.find({
      dateTo: { $gte: startDate, $lte: endDate },
      status: 'confirmed',
      checkInTime: { $exists: true }, // Only for guests who have checked in
      $or: [
        { 'emailSent.checkOutReminder': { $exists: false } },
        { 'emailSent.checkOutReminder': null }
      ]
    }).populate('propertyId', 'title address city state country')

    const results = []
    let sent = 0
    let failed = 0

    for (const booking of bookings) {
      try {
        const emailSent = await this.sendCheckOutReminder(booking)

        if (emailSent) {
          await Booking.findByIdAndUpdate(booking._id, {
            $set: { 'emailSent.checkOutReminder': new Date() }
          })
          sent++
        } else {
          failed++
        }

        results.push({
          bookingId: booking._id,
          type: 'check_out_reminder',
          success: emailSent,
          email: booking.contactDetails?.email || booking.userId?.email
        })
      } catch (error) {
        console.error(`Check-out reminder error for booking ${booking._id}:`, error)
        failed++
        results.push({
          bookingId: booking._id,
          type: 'check_out_reminder',
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }

    return {
      processed: bookings.length,
      sent,
      failed,
      results
    }
  }

  async processPaymentReminders(): Promise<{
    processed: number
    sent: number
    failed: number
    results: any[]
  }> {
    if (!this.config.paymentReminder.enabled) {
      return { processed: 0, sent: 0, failed: 0, results: [] }
    }

    const results = []
    let totalProcessed = 0
    let sent = 0
    let failed = 0

    for (const daysBefore of this.config.paymentReminder.daysBefore) {
      const targetDate = addDays(new Date(), daysBefore)
      const startDate = startOfDay(targetDate)
      const endDate = endOfDay(targetDate)

      const bookings = await Booking.find({
        dateFrom: { $gte: startDate, $lte: endDate },
        status: { $in: ['confirmed', 'pending'] },
        paymentStatus: { $in: ['pending', 'failed'] },
        $expr: {
          $lt: [
            { $ifNull: ['$emailSent.paymentReminderCount', 0] },
            this.config.paymentReminder.maxReminders
          ]
        }
      }).populate('propertyId', 'title')

      totalProcessed += bookings.length

      for (const booking of bookings) {
        try {
          const emailSent = await this.sendPaymentReminder(booking, daysBefore)

          if (emailSent) {
            await Booking.findByIdAndUpdate(booking._id, {
              $inc: { 'emailSent.paymentReminderCount': 1 },
              $set: { 'emailSent.paymentReminderLast': new Date() }
            })
            sent++
          } else {
            failed++
          }

          results.push({
            bookingId: booking._id,
            type: 'payment_reminder',
            daysBefore,
            success: emailSent,
            email: booking.contactDetails?.email || booking.userId?.email
          })
        } catch (error) {
          console.error(`Payment reminder error for booking ${booking._id}:`, error)
          failed++
          results.push({
            bookingId: booking._id,
            type: 'payment_reminder',
            daysBefore,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          })
        }
      }
    }

    return {
      processed: totalProcessed,
      sent,
      failed,
      results
    }
  }

  async processFeedbackRequests(): Promise<{
    processed: number
    sent: number
    failed: number
    results: any[]
  }> {
    if (!this.config.feedbackRequest.enabled) {
      return { processed: 0, sent: 0, failed: 0, results: [] }
    }

    const targetDate = subDays(new Date(), this.config.feedbackRequest.daysAfterCheckOut)
    const startDate = startOfDay(targetDate)
    const endDate = endOfDay(targetDate)

    const bookings = await Booking.find({
      dateTo: { $gte: startDate, $lte: endDate },
      status: 'completed',
      checkOutTime: { $exists: true },
      $or: [
        { 'emailSent.feedbackRequest': { $exists: false } },
        { 'emailSent.feedbackRequest': null }
      ]
    }).populate('propertyId', 'title')

    const results = []
    let sent = 0
    let failed = 0

    for (const booking of bookings) {
      try {
        const emailSent = await this.sendFeedbackRequest(booking)

        if (emailSent) {
          await Booking.findByIdAndUpdate(booking._id, {
            $set: { 'emailSent.feedbackRequest': new Date() }
          })
          sent++
        } else {
          failed++
        }

        results.push({
          bookingId: booking._id,
          type: 'feedback_request',
          success: emailSent,
          email: booking.contactDetails?.email || booking.userId?.email
        })
      } catch (error) {
        console.error(`Feedback request error for booking ${booking._id}:`, error)
        failed++
        results.push({
          bookingId: booking._id,
          type: 'feedback_request',
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }

    return {
      processed: bookings.length,
      sent,
      failed,
      results
    }
  }

  async processCancellationDeadlineReminders(): Promise<{
    processed: number
    sent: number
    failed: number
    results: any[]
  }> {
    if (!this.config.cancellationDeadline.enabled) {
      return { processed: 0, sent: 0, failed: 0, results: [] }
    }

    const targetDate = addDays(new Date(), this.config.cancellationDeadline.daysBefore)
    const startDate = startOfDay(targetDate)
    const endDate = endOfDay(targetDate)

    const bookings = await Booking.find({
      dateFrom: { $gte: startDate, $lte: endDate },
      status: { $in: ['confirmed', 'pending'] },
      $or: [
        { 'emailSent.cancellationDeadline': { $exists: false } },
        { 'emailSent.cancellationDeadline': null }
      ]
    }).populate('propertyId', 'title')

    const results = []
    let sent = 0
    let failed = 0

    for (const booking of bookings) {
      try {
        const emailSent = await this.sendCancellationDeadlineReminder(booking)

        if (emailSent) {
          await Booking.findByIdAndUpdate(booking._id, {
            $set: { 'emailSent.cancellationDeadline': new Date() }
          })
          sent++
        } else {
          failed++
        }

        results.push({
          bookingId: booking._id,
          type: 'cancellation_deadline',
          success: emailSent,
          email: booking.contactDetails?.email || booking.userId?.email
        })
      } catch (error) {
        console.error(`Cancellation deadline reminder error for booking ${booking._id}:`, error)
        failed++
        results.push({
          bookingId: booking._id,
          type: 'cancellation_deadline',
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }

    return {
      processed: bookings.length,
      sent,
      failed,
      results
    }
  }

  private async sendCheckInReminder(booking: any): Promise<boolean> {
    const template = this.templates.check_in
    const emailData = this.prepareEmailData(booking, template)

    return await this.sendEmail(emailData)
  }

  private async sendCheckOutReminder(booking: any): Promise<boolean> {
    const template = this.templates.check_out
    const emailData = this.prepareEmailData(booking, template)

    return await this.sendEmail(emailData)
  }

  private async sendPaymentReminder(booking: any, daysBefore: number): Promise<boolean> {
    const template = this.templates.payment
    const emailData = this.prepareEmailData(booking, template, { daysBefore })

    return await this.sendEmail(emailData)
  }

  private async sendFeedbackRequest(booking: any): Promise<boolean> {
    const template = this.templates.feedback
    const emailData = this.prepareEmailData(booking, template)

    return await this.sendEmail(emailData)
  }

  private async sendCancellationDeadlineReminder(booking: any): Promise<boolean> {
    const template = this.templates.cancellation_deadline
    const emailData = this.prepareEmailData(booking, template)

    return await this.sendEmail(emailData)
  }

  private prepareEmailData(booking: any, template: ReminderTemplate, extras?: any) {
    const guestName = booking.contactDetails?.name || booking.userId?.name || 'Guest'
    const guestEmail = booking.contactDetails?.email || booking.userId?.email
    const property = booking.propertyId
    const checkInDate = format(new Date(booking.dateFrom), 'EEEE, MMMM d, yyyy')
    const checkOutDate = format(new Date(booking.dateTo), 'EEEE, MMMM d, yyyy')
    const bookingId = booking._id.toString().slice(-8)

    // Template variables
    const variables = {
      guestName,
      propertyName: property.title,
      propertyAddress: property.address,
      propertyCity: property.city,
      checkInDate,
      checkOutDate,
      bookingId,
      totalAmount: booking.totalPrice || 0,
      guests: booking.guests + (booking.children || 0),
      ...extras
    }

    // Replace template variables
    let subject = template.subject
    let htmlContent = template.htmlTemplate
    let textContent = template.textTemplate

    Object.entries(variables).forEach(([key, value]) => {
      const placeholder = `{{${key}}}`
      subject = subject.replace(new RegExp(placeholder, 'g'), String(value))
      htmlContent = htmlContent.replace(new RegExp(placeholder, 'g'), String(value))
      textContent = textContent.replace(new RegExp(placeholder, 'g'), String(value))
    })

    return {
      to: guestEmail,
      subject,
      html: htmlContent,
      text: textContent
    }
  }

  private async sendEmail(emailData: any): Promise<boolean> {
    try {
      // Mock email sending - replace with actual email service
      console.log(`Sending reminder email to: ${emailData.to}`)
      console.log(`Subject: ${emailData.subject}`)

      // In production, integrate with your email service (SendGrid, AWS SES, etc.)
      /*
      const sgMail = require('@sendgrid/mail')
      sgMail.setApiKey(process.env.SENDGRID_API_KEY)

      await sgMail.send(emailData)
      */

      // Simulate email sending delay
      await new Promise(resolve => setTimeout(resolve, 100))

      return true
    } catch (error) {
      console.error('Email sending error:', error)
      return false
    }
  }

  private getDefaultTemplates(): Record<string, ReminderTemplate> {
    return {
      check_in: {
        type: 'check_in',
        subject: 'Check-in Reminder - {{propertyName}}',
        htmlTemplate: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2563eb;">Check-in Reminder</h2>
            <p>Dear {{guestName}},</p>
            <p>We're excited to welcome you tomorrow at <strong>{{propertyName}}</strong>!</p>

            <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3>Your Booking Details</h3>
              <p><strong>Check-in:</strong> {{checkInDate}} (2:00 PM onwards)</p>
              <p><strong>Check-out:</strong> {{checkOutDate}} (11:00 AM)</p>
              <p><strong>Guests:</strong> {{guests}}</p>
              <p><strong>Booking ID:</strong> {{bookingId}}</p>
            </div>

            <div style="background: #ecfdf5; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <h4 style="color: #065f46; margin-top: 0;">Important Reminders</h4>
              <ul style="color: #047857;">
                <li>Please bring a valid government-issued photo ID</li>
                <li>Contact us 30 minutes before arrival</li>
                <li>Early check-in may be available upon request</li>
              </ul>
            </div>

            <p>If you have any questions, feel free to contact us!</p>
            <p>Safe travels,<br>The {{propertyName}} Team</p>
          </div>
        `,
        textTemplate: `Check-in Reminder: Dear {{guestName}}, you're checking in tomorrow at {{propertyName}} on {{checkInDate}}. Please bring a valid ID and contact us 30 minutes before arrival.`
      },

      check_out: {
        type: 'check_out',
        subject: 'Check-out Reminder - {{propertyName}}',
        htmlTemplate: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #dc2626;">Check-out Reminder</h2>
            <p>Dear {{guestName}},</p>
            <p>We hope you're enjoying your stay at <strong>{{propertyName}}</strong>!</p>

            <div style="background: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3>Check-out Information</h3>
              <p><strong>Check-out Date:</strong> {{checkOutDate}}</p>
              <p><strong>Check-out Time:</strong> 11:00 AM</p>
              <p><strong>Late Check-out:</strong> Available until 1:00 PM (₹500 charge)</p>
            </div>

            <div style="background: #fffbeb; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <h4 style="color: #92400e; margin-top: 0;">Before You Leave</h4>
              <ul style="color: #78350f;">
                <li>Please ensure all personal belongings are packed</li>
                <li>Return room keys to reception</li>
                <li>Settle any additional charges</li>
                <li>Consider leaving a review of your stay</li>
              </ul>
            </div>

            <p>Thank you for staying with us!</p>
            <p>Best regards,<br>The {{propertyName}} Team</p>
          </div>
        `,
        textTemplate: `Check-out Reminder: Dear {{guestName}}, your check-out is scheduled for {{checkOutDate}} at 11:00 AM. Please return keys to reception and settle any additional charges.`
      },

      payment: {
        type: 'payment',
        subject: 'Payment Reminder - {{propertyName}}',
        htmlTemplate: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #dc2626;">Payment Reminder</h2>
            <p>Dear {{guestName}},</p>
            <p>This is a friendly reminder about your upcoming stay at <strong>{{propertyName}}</strong>.</p>

            <div style="background: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3>Payment Required</h3>
              <p><strong>Check-in Date:</strong> {{checkInDate}}</p>
              <p><strong>Amount Due:</strong> ₹{{totalAmount}}</p>
              <p><strong>Booking ID:</strong> {{bookingId}}</p>
              <p style="color: #dc2626;"><strong>Payment is required to confirm your booking.</strong></p>
            </div>

            <div style="text-align: center; margin: 30px 0;">
              <a href="#" style="background: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Pay Now</a>
            </div>

            <p>If you have any questions about payment, please contact us.</p>
            <p>Best regards,<br>The {{propertyName}} Team</p>
          </div>
        `,
        textTemplate: `Payment Reminder: Dear {{guestName}}, payment of ₹{{totalAmount}} is required for your booking at {{propertyName}} (Check-in: {{checkInDate}}). Please complete payment to confirm your booking.`
      },

      feedback: {
        type: 'feedback',
        subject: 'How was your stay at {{propertyName}}?',
        htmlTemplate: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #7c3aed;">Thank you for staying with us!</h2>
            <p>Dear {{guestName}},</p>
            <p>We hope you had a wonderful stay at <strong>{{propertyName}}</strong>!</p>

            <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3>Your Recent Stay</h3>
              <p><strong>Dates:</strong> {{checkInDate}} - {{checkOutDate}}</p>
              <p><strong>Booking ID:</strong> {{bookingId}}</p>
            </div>

            <p>Your feedback is invaluable to us and helps improve our service for future guests.</p>

            <div style="text-align: center; margin: 30px 0;">
              <a href="#" style="background: #7c3aed; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Leave a Review</a>
            </div>

            <p>Thank you for choosing us, and we hope to welcome you back soon!</p>
            <p>Warm regards,<br>The {{propertyName}} Team</p>
          </div>
        `,
        textTemplate: `Thank you for staying at {{propertyName}}! We'd love to hear about your experience. Please take a moment to leave us a review.`
      },

      cancellation_deadline: {
        type: 'cancellation_deadline',
        subject: 'Cancellation Deadline Approaching - {{propertyName}}',
        htmlTemplate: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #f59e0b;">Cancellation Deadline Notice</h2>
            <p>Dear {{guestName}},</p>
            <p>This is a reminder about your upcoming booking at <strong>{{propertyName}}</strong>.</p>

            <div style="background: #fffbeb; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3>Your Booking</h3>
              <p><strong>Check-in:</strong> {{checkInDate}}</p>
              <p><strong>Check-out:</strong> {{checkOutDate}}</p>
              <p><strong>Booking ID:</strong> {{bookingId}}</p>
            </div>

            <div style="background: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
              <h4 style="color: #92400e; margin-top: 0;">Important Notice</h4>
              <p style="color: #78350f;">The free cancellation period for your booking ends soon. After this deadline, cancellation charges may apply according to our policy.</p>
            </div>

            <p>If you need to make any changes to your booking, please contact us as soon as possible.</p>
            <p>Best regards,<br>The {{propertyName}} Team</p>
          </div>
        `,
        textTemplate: `Cancellation Deadline: Dear {{guestName}}, the free cancellation period for your booking at {{propertyName}} ({{checkInDate}}) ends soon. Contact us if you need to make changes.`
      }
    }
  }
}

// Export a singleton instance
export const bookingReminderService = new BookingReminderService()