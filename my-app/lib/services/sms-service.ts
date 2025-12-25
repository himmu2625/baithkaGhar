import { connectToDatabase } from '@/lib/mongodb'
import Booking from '@/models/Booking'
import { format } from 'date-fns'

export interface SMSRequest {
  to: string | string[]
  message: string
  templateId?: string
  variables?: Record<string, any>
  priority: 'low' | 'normal' | 'high' | 'urgent'
  scheduleAt?: Date
  category: 'booking' | 'reminder' | 'alert' | 'promotional' | 'otp'
  trackDelivery?: boolean
}

export interface SMSResponse {
  success: boolean
  messageId?: string
  messageIds?: string[]
  error?: string
  queueId?: string
  scheduledFor?: Date
  cost?: number
  segments?: number
}

export interface SMSTemplate {
  templateId: string
  name: string
  content: string
  variables: string[]
  category: 'booking' | 'reminder' | 'alert' | 'promotional' | 'otp'
  language: string
  isActive: boolean
  approvalStatus: 'pending' | 'approved' | 'rejected'
  createdAt: Date
}

export interface SMSStats {
  sent: number
  delivered: number
  failed: number
  pending: number
  deliveryRate: number
  failureRate: number
  totalCost: number
  averageSegments: number
}

export interface BulkSMSRequest {
  recipients: Array<{
    phoneNumber: string
    variables?: Record<string, any>
  }>
  templateId: string
  batchSize?: number
  delayBetweenBatches?: number
}

export class SMSService {
  private static readonly SMS_PROVIDER = process.env.SMS_PROVIDER || 'twilio' // 'twilio' | 'textlocal' | 'msg91'

  // Send booking confirmation SMS
  static async sendBookingConfirmationSMS(bookingId: string): Promise<SMSResponse> {
    try {
      await connectToDatabase()

      const booking = await Booking.findById(bookingId).populate('propertyId')
      if (!booking) {
        return {
          success: false,
          error: 'Booking not found'
        }
      }

      const phoneNumber = booking.contactDetails?.phone || booking.phone
      if (!phoneNumber) {
        return {
          success: false,
          error: 'Phone number not found for booking'
        }
      }

      const message = this.generateBookingConfirmationSMS(booking)

      const smsRequest: SMSRequest = {
        to: phoneNumber,
        message,
        priority: 'high',
        category: 'booking',
        trackDelivery: true
      }

      const result = await this.sendSMS(smsRequest)

      // Log SMS activity
      if (result.success) {
        await this.logSMSActivity(bookingId, 'booking_confirmation', result.messageId!)
      }

      return result

    } catch (error) {
      console.error('Send booking confirmation SMS error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  // Send check-in reminder SMS
  static async sendCheckInReminderSMS(bookingId: string): Promise<SMSResponse> {
    try {
      await connectToDatabase()

      const booking = await Booking.findById(bookingId).populate('propertyId')
      if (!booking) {
        return {
          success: false,
          error: 'Booking not found'
        }
      }

      const phoneNumber = booking.contactDetails?.phone || booking.phone
      if (!phoneNumber) {
        return {
          success: false,
          error: 'Phone number not found for booking'
        }
      }

      const message = this.generateCheckInReminderSMS(booking)

      const smsRequest: SMSRequest = {
        to: phoneNumber,
        message,
        priority: 'normal',
        category: 'reminder',
        trackDelivery: true
      }

      const result = await this.sendSMS(smsRequest)

      // Log SMS activity and update booking
      if (result.success) {
        await this.logSMSActivity(bookingId, 'check_in_reminder', result.messageId!)

        if (!booking.smsSetn) booking.smsSent = {}
        booking.smsSent.checkInReminder = new Date()
        await booking.save()
      }

      return result

    } catch (error) {
      console.error('Send check-in reminder SMS error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  // Send payment reminder SMS
  static async sendPaymentReminderSMS(bookingId: string, amount: number): Promise<SMSResponse> {
    try {
      await connectToDatabase()

      const booking = await Booking.findById(bookingId).populate('propertyId')
      if (!booking) {
        return {
          success: false,
          error: 'Booking not found'
        }
      }

      const phoneNumber = booking.contactDetails?.phone || booking.phone
      if (!phoneNumber) {
        return {
          success: false,
          error: 'Phone number not found for booking'
        }
      }

      const message = this.generatePaymentReminderSMS(booking, amount)

      const smsRequest: SMSRequest = {
        to: phoneNumber,
        message,
        priority: 'high',
        category: 'reminder',
        trackDelivery: true
      }

      const result = await this.sendSMS(smsRequest)

      if (result.success) {
        await this.logSMSActivity(bookingId, 'payment_reminder', result.messageId!)
      }

      return result

    } catch (error) {
      console.error('Send payment reminder SMS error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  // Send cancellation confirmation SMS
  static async sendCancellationConfirmationSMS(bookingId: string): Promise<SMSResponse> {
    try {
      await connectToDatabase()

      const booking = await Booking.findById(bookingId).populate('propertyId')
      if (!booking) {
        return {
          success: false,
          error: 'Booking not found'
        }
      }

      const phoneNumber = booking.contactDetails?.phone || booking.phone
      if (!phoneNumber) {
        return {
          success: false,
          error: 'Phone number not found for booking'
        }
      }

      const message = this.generateCancellationConfirmationSMS(booking)

      const smsRequest: SMSRequest = {
        to: phoneNumber,
        message,
        priority: 'high',
        category: 'booking',
        trackDelivery: true
      }

      const result = await this.sendSMS(smsRequest)

      if (result.success) {
        await this.logSMSActivity(bookingId, 'cancellation_confirmation', result.messageId!)
      }

      return result

    } catch (error) {
      console.error('Send cancellation confirmation SMS error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  // Send OTP SMS
  static async sendOTPSMS(phoneNumber: string, otp: string, purpose: string = 'verification'): Promise<SMSResponse> {
    try {
      const message = `Your OTP for ${purpose} is: ${otp}. This OTP is valid for 5 minutes. Do not share this with anyone. - Baithaka Ghar`

      const smsRequest: SMSRequest = {
        to: phoneNumber,
        message,
        priority: 'urgent',
        category: 'otp',
        trackDelivery: true
      }

      const result = await this.sendSMS(smsRequest)

      // Log OTP sending for security
      console.log(`OTP sent to ${phoneNumber} for ${purpose}`, {
        messageId: result.messageId,
        timestamp: new Date().toISOString()
      })

      return result

    } catch (error) {
      console.error('Send OTP SMS error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  // Send templated SMS
  static async sendTemplatedSMS(
    templateId: string,
    phoneNumber: string,
    variables: Record<string, any> = {},
    options?: {
      priority?: 'low' | 'normal' | 'high' | 'urgent'
      scheduleAt?: Date
    }
  ): Promise<SMSResponse> {
    try {
      const template = await this.getSMSTemplate(templateId)
      if (!template) {
        return {
          success: false,
          error: 'SMS template not found'
        }
      }

      if (template.approvalStatus !== 'approved') {
        return {
          success: false,
          error: 'SMS template is not approved'
        }
      }

      const message = this.replaceVariables(template.content, variables)

      const smsRequest: SMSRequest = {
        to: phoneNumber,
        message,
        templateId,
        variables,
        priority: options?.priority || 'normal',
        scheduleAt: options?.scheduleAt,
        category: template.category,
        trackDelivery: true
      }

      return await this.sendSMS(smsRequest)

    } catch (error) {
      console.error('Send templated SMS error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  // Send bulk SMS
  static async sendBulkSMS(request: BulkSMSRequest): Promise<{
    totalSent: number
    totalFailed: number
    totalCost: number
    results: Array<{
      phoneNumber: string
      success: boolean
      messageId?: string
      error?: string
      cost?: number
    }>
  }> {
    const batchSize = request.batchSize || 100
    const delay = request.delayBetweenBatches || 1000

    let totalSent = 0
    let totalFailed = 0
    let totalCost = 0
    const results: Array<{
      phoneNumber: string
      success: boolean
      messageId?: string
      error?: string
      cost?: number
    }> = []

    const template = await this.getSMSTemplate(request.templateId)
    if (!template) {
      throw new Error('SMS template not found')
    }

    // Process recipients in batches
    for (let i = 0; i < request.recipients.length; i += batchSize) {
      const batch = request.recipients.slice(i, i + batchSize)

      const batchPromises = batch.map(async (recipient) => {
        const message = this.replaceVariables(template.content, recipient.variables || {})

        const smsRequest: SMSRequest = {
          to: recipient.phoneNumber,
          message,
          templateId: request.templateId,
          variables: recipient.variables,
          priority: 'normal',
          category: template.category,
          trackDelivery: true
        }

        const result = await this.sendSMS(smsRequest)

        results.push({
          phoneNumber: recipient.phoneNumber,
          success: result.success,
          messageId: result.messageId,
          error: result.error,
          cost: result.cost
        })

        if (result.success) {
          totalSent++
          totalCost += result.cost || 0
        } else {
          totalFailed++
        }

        return result
      })

      await Promise.all(batchPromises)

      // Delay between batches to respect rate limits
      if (i + batchSize < request.recipients.length) {
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }

    return { totalSent, totalFailed, totalCost, results }
  }

  // Core SMS sending function
  private static async sendSMS(request: SMSRequest): Promise<SMSResponse> {
    try {
      // Handle scheduled SMS
      if (request.scheduleAt && request.scheduleAt > new Date()) {
        const queueId = await this.scheduleSMS(request)
        return {
          success: true,
          queueId,
          scheduledFor: request.scheduleAt
        }
      }

      // Validate phone number
      const cleanedPhoneNumber = this.cleanPhoneNumber(request.to as string)
      if (!this.isValidPhoneNumber(cleanedPhoneNumber)) {
        return {
          success: false,
          error: 'Invalid phone number format'
        }
      }

      // Calculate message segments
      const segments = this.calculateMessageSegments(request.message)
      const cost = this.calculateSMSCost(segments)

      // Send based on provider
      let result: SMSResponse

      switch (this.SMS_PROVIDER) {
        case 'twilio':
          result = await this.sendViaTwilio(cleanedPhoneNumber, request.message)
          break
        case 'textlocal':
          result = await this.sendViaTextlocal(cleanedPhoneNumber, request.message)
          break
        case 'msg91':
          result = await this.sendViaMsg91(cleanedPhoneNumber, request.message)
          break
        default:
          result = await this.sendViaMockProvider(cleanedPhoneNumber, request.message)
      }

      if (result.success) {
        result.cost = cost
        result.segments = segments
      }

      return result

    } catch (error) {
      console.error('SMS sending error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  // Provider-specific sending methods
  private static async sendViaTwilio(phoneNumber: string, message: string): Promise<SMSResponse> {
    try {
      // In production, use actual Twilio SDK
      // const twilio = require('twilio')
      // const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)

      // const result = await client.messages.create({
      //   body: message,
      //   from: process.env.TWILIO_PHONE_NUMBER,
      //   to: phoneNumber
      // })

      // Mock response for development
      const messageId = `twilio_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

      return {
        success: true,
        messageId
      }

    } catch (error) {
      console.error('Twilio SMS error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Twilio SMS failed'
      }
    }
  }

  private static async sendViaTextlocal(phoneNumber: string, message: string): Promise<SMSResponse> {
    try {
      // In production, use Textlocal API
      // const response = await fetch('https://api.textlocal.in/send/', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      //   body: new URLSearchParams({
      //     apikey: process.env.TEXTLOCAL_API_KEY!,
      //     numbers: phoneNumber,
      //     message,
      //     sender: process.env.TEXTLOCAL_SENDER!
      //   })
      // })

      // Mock response for development
      const messageId = `textlocal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

      return {
        success: true,
        messageId
      }

    } catch (error) {
      console.error('Textlocal SMS error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Textlocal SMS failed'
      }
    }
  }

  private static async sendViaMsg91(phoneNumber: string, message: string): Promise<SMSResponse> {
    try {
      // In production, use MSG91 API
      // const response = await fetch('https://api.msg91.com/api/sendhttp.php', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      //   body: new URLSearchParams({
      //     authkey: process.env.MSG91_AUTH_KEY!,
      //     mobiles: phoneNumber,
      //     message,
      //     sender: process.env.MSG91_SENDER!,
      //     route: '4'
      //   })
      // })

      // Mock response for development
      const messageId = `msg91_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

      return {
        success: true,
        messageId
      }

    } catch (error) {
      console.error('MSG91 SMS error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'MSG91 SMS failed'
      }
    }
  }

  private static async sendViaMockProvider(phoneNumber: string, message: string): Promise<SMSResponse> {
    // Mock provider for development/testing
    console.log(`Mock SMS to ${phoneNumber}: ${message}`)

    const messageId = `mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    return {
      success: true,
      messageId
    }
  }

  // SMS message generators
  private static generateBookingConfirmationSMS(booking: any): string {
    const property = booking.propertyId
    const checkInDate = format(new Date(booking.dateFrom), 'dd MMM yyyy')
    const bookingRef = booking.bookingReference || booking._id.toString().slice(-8)

    return `Booking confirmed! ${property.title}, Check-in: ${checkInDate}, Ref: ${bookingRef}. Details: ${process.env.NEXT_PUBLIC_APP_URL}/bookings/${booking._id} - Baithaka Ghar`
  }

  private static generateCheckInReminderSMS(booking: any): string {
    const property = booking.propertyId
    const checkInDate = format(new Date(booking.dateFrom), 'dd MMM yyyy')
    const checkInTime = property.checkInTime || '3:00 PM'

    return `Reminder: Check-in tomorrow at ${property.title}, ${checkInDate} at ${checkInTime}. Address: ${property.address?.street}, ${property.address?.city}. Safe travels! - Baithaka Ghar`
  }

  private static generatePaymentReminderSMS(booking: any, amount: number): string {
    const bookingRef = booking.bookingReference || booking._id.toString().slice(-8)

    return `Payment reminder: ₹${amount.toLocaleString()} pending for booking ${bookingRef}. Pay now: ${process.env.NEXT_PUBLIC_APP_URL}/bookings/${booking._id}/payment - Baithaka Ghar`
  }

  private static generateCancellationConfirmationSMS(booking: any): string {
    const bookingRef = booking.bookingReference || booking._id.toString().slice(-8)

    return `Booking ${bookingRef} cancelled successfully. Refund will be processed as per policy. Thank you for choosing Baithaka Ghar.`
  }

  // Helper methods
  private static cleanPhoneNumber(phoneNumber: string): string {
    // Remove all non-digit characters
    let cleaned = phoneNumber.replace(/\D/g, '')

    // Add country code for India if missing
    if (cleaned.length === 10) {
      cleaned = '91' + cleaned
    }

    return cleaned
  }

  private static isValidPhoneNumber(phoneNumber: string): boolean {
    // Basic validation for Indian phone numbers
    const indianPhoneRegex = /^91[6-9]\d{9}$/
    return indianPhoneRegex.test(phoneNumber)
  }

  private static calculateMessageSegments(message: string): number {
    // Standard SMS is 160 characters, Unicode SMS is 70 characters
    const hasUnicode = /[^\x00-\x7F]/.test(message)
    const maxLength = hasUnicode ? 70 : 160

    return Math.ceil(message.length / maxLength)
  }

  private static calculateSMSCost(segments: number): number {
    // Base cost per segment in INR (this would be configured based on provider rates)
    const costPerSegment = 0.25
    return segments * costPerSegment
  }

  private static replaceVariables(content: string, variables: Record<string, any>): string {
    let result = content

    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g')
      result = result.replace(regex, String(value))
    })

    return result
  }

  private static async getSMSTemplate(templateId: string): Promise<SMSTemplate | null> {
    // In production, fetch from database
    // For now, return mock templates
    const mockTemplates: Record<string, SMSTemplate> = {
      'welcome': {
        templateId: 'welcome',
        name: 'Welcome Message',
        content: 'Welcome to {{propertyName}}! Your booking {{bookingRef}} is confirmed for {{checkInDate}}.',
        variables: ['propertyName', 'bookingRef', 'checkInDate'],
        category: 'booking',
        language: 'en',
        isActive: true,
        approvalStatus: 'approved',
        createdAt: new Date()
      }
    }

    return mockTemplates[templateId] || null
  }

  private static async scheduleSMS(request: SMSRequest): Promise<string> {
    // In production, integrate with a job queue system
    // For now, return a mock queue ID
    return `sms_queue_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private static async logSMSActivity(bookingId: string, type: string, messageId: string): Promise<void> {
    try {
      await connectToDatabase()

      const booking = await Booking.findById(bookingId)
      if (booking) {
        if (!booking.smsActivity) {
          booking.smsActivity = []
        }

        booking.smsActivity.push({
          type,
          messageId,
          sentAt: new Date(),
          status: 'sent'
        })

        await booking.save()
      }
    } catch (error) {
      console.error('SMS activity logging error:', error)
    }
  }
}