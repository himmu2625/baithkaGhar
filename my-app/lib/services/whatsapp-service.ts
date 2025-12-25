import { connectToDatabase } from '@/lib/mongodb'
import Booking from '@/models/Booking'
import { format } from 'date-fns'

export interface WhatsAppMessage {
  to: string
  type: 'text' | 'template' | 'image' | 'document' | 'location'
  text?: {
    body: string
    preview_url?: boolean
  }
  template?: {
    name: string
    language: {
      code: string
    }
    components: Array<{
      type: 'header' | 'body' | 'footer' | 'button'
      parameters?: Array<{
        type: 'text' | 'currency' | 'date_time'
        text?: string
        currency?: {
          fallback_value: string
          code: string
          amount_1000: number
        }
        date_time?: {
          fallback_value: string
        }
      }>
    }>
  }
  image?: {
    link: string
    caption?: string
  }
  document?: {
    link: string
    caption?: string
    filename?: string
  }
  location?: {
    longitude: number
    latitude: number
    name?: string
    address?: string
  }
}

export interface WhatsAppResponse {
  success: boolean
  messageId?: string
  error?: string
  quotaUsed?: number
  rateLimitRemaining?: number
}

export interface WhatsAppTemplate {
  name: string
  language: string
  category: 'AUTHENTICATION' | 'MARKETING' | 'UTILITY'
  components: Array<{
    type: 'HEADER' | 'BODY' | 'FOOTER' | 'BUTTONS'
    format?: 'TEXT' | 'MEDIA' | 'LOCATION'
    text?: string
    buttons?: Array<{
      type: 'QUICK_REPLY' | 'URL' | 'PHONE_NUMBER'
      text: string
      url?: string
      phone_number?: string
    }>
  }>
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
}

export interface WhatsAppWebhookData {
  object: string
  entry: Array<{
    id: string
    changes: Array<{
      value: {
        messaging_product: string
        metadata: {
          display_phone_number: string
          phone_number_id: string
        }
        messages?: Array<{
          from: string
          id: string
          timestamp: string
          text?: {
            body: string
          }
          type: string
        }>
        statuses?: Array<{
          id: string
          status: 'sent' | 'delivered' | 'read' | 'failed'
          timestamp: string
          recipient_id: string
          errors?: Array<{
            code: number
            title: string
            message: string
          }>
        }>
      }
      field: string
    }>
  }>
}

export class WhatsAppService {
  private static readonly WHATSAPP_API_URL = 'https://graph.facebook.com/v18.0'
  private static readonly PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID
  private static readonly ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN

  // Send booking confirmation via WhatsApp
  static async sendBookingConfirmation(bookingId: string): Promise<WhatsAppResponse> {
    try {
      await connectToDatabase()

      const booking = await Booking.findById(bookingId).populate('propertyId')
      if (!booking) {
        return {
          success: false,
          error: 'Booking not found'
        }
      }

      const phoneNumber = this.extractPhoneNumber(booking.contactDetails?.phone || booking.phone)
      if (!phoneNumber) {
        return {
          success: false,
          error: 'Phone number not found for booking'
        }
      }

      // Use template message for booking confirmation
      const message = this.createBookingConfirmationTemplate(booking)

      const result = await this.sendMessage(phoneNumber, message)

      if (result.success) {
        await this.logWhatsAppActivity(bookingId, 'booking_confirmation', result.messageId!)
      }

      return result

    } catch (error) {
      console.error('WhatsApp booking confirmation error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  // Send check-in reminder via WhatsApp
  static async sendCheckInReminder(bookingId: string): Promise<WhatsAppResponse> {
    try {
      await connectToDatabase()

      const booking = await Booking.findById(bookingId).populate('propertyId')
      if (!booking) {
        return {
          success: false,
          error: 'Booking not found'
        }
      }

      const phoneNumber = this.extractPhoneNumber(booking.contactDetails?.phone || booking.phone)
      if (!phoneNumber) {
        return {
          success: false,
          error: 'Phone number not found for booking'
        }
      }

      const message = this.createCheckInReminderTemplate(booking)

      const result = await this.sendMessage(phoneNumber, message)

      if (result.success) {
        await this.logWhatsAppActivity(bookingId, 'check_in_reminder', result.messageId!)

        // Update booking to mark WhatsApp reminder as sent
        if (!booking.whatsAppSent) booking.whatsAppSent = {}
        booking.whatsAppSent.checkInReminder = new Date()
        await booking.save()
      }

      return result

    } catch (error) {
      console.error('WhatsApp check-in reminder error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  // Send payment reminder via WhatsApp
  static async sendPaymentReminder(bookingId: string, amount: number): Promise<WhatsAppResponse> {
    try {
      await connectToDatabase()

      const booking = await Booking.findById(bookingId).populate('propertyId')
      if (!booking) {
        return {
          success: false,
          error: 'Booking not found'
        }
      }

      const phoneNumber = this.extractPhoneNumber(booking.contactDetails?.phone || booking.phone)
      if (!phoneNumber) {
        return {
          success: false,
          error: 'Phone number not found for booking'
        }
      }

      const message = this.createPaymentReminderTemplate(booking, amount)

      const result = await this.sendMessage(phoneNumber, message)

      if (result.success) {
        await this.logWhatsAppActivity(bookingId, 'payment_reminder', result.messageId!)
      }

      return result

    } catch (error) {
      console.error('WhatsApp payment reminder error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  // Send property location via WhatsApp
  static async sendPropertyLocation(bookingId: string): Promise<WhatsAppResponse> {
    try {
      await connectToDatabase()

      const booking = await Booking.findById(bookingId).populate('propertyId')
      if (!booking) {
        return {
          success: false,
          error: 'Booking not found'
        }
      }

      const phoneNumber = this.extractPhoneNumber(booking.contactDetails?.phone || booking.phone)
      if (!phoneNumber) {
        return {
          success: false,
          error: 'Phone number not found for booking'
        }
      }

      const property = booking.propertyId

      if (!property.location?.coordinates) {
        return {
          success: false,
          error: 'Property location not available'
        }
      }

      const message: WhatsAppMessage = {
        to: phoneNumber,
        type: 'location',
        location: {
          longitude: property.location.coordinates[0],
          latitude: property.location.coordinates[1],
          name: property.title,
          address: `${property.address?.street}, ${property.address?.city}, ${property.address?.state} ${property.address?.zipCode}`
        }
      }

      const result = await this.sendMessage(phoneNumber, message)

      if (result.success) {
        await this.logWhatsAppActivity(bookingId, 'location_share', result.messageId!)
      }

      return result

    } catch (error) {
      console.error('WhatsApp location share error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  // Send custom message via WhatsApp
  static async sendCustomMessage(
    phoneNumber: string,
    message: string,
    type: 'text' | 'template' = 'text',
    templateName?: string,
    templateParams?: Array<string>
  ): Promise<WhatsAppResponse> {
    try {
      const cleanedNumber = this.extractPhoneNumber(phoneNumber)
      if (!cleanedNumber) {
        return {
          success: false,
          error: 'Invalid phone number'
        }
      }

      let whatsappMessage: WhatsAppMessage

      if (type === 'template' && templateName) {
        whatsappMessage = {
          to: cleanedNumber,
          type: 'template',
          template: {
            name: templateName,
            language: {
              code: 'en'
            },
            components: [
              {
                type: 'body',
                parameters: templateParams?.map(param => ({
                  type: 'text',
                  text: param
                })) || []
              }
            ]
          }
        }
      } else {
        whatsappMessage = {
          to: cleanedNumber,
          type: 'text',
          text: {
            body: message,
            preview_url: true
          }
        }
      }

      return await this.sendMessage(cleanedNumber, whatsappMessage)

    } catch (error) {
      console.error('WhatsApp custom message error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  // Send document via WhatsApp
  static async sendDocument(
    phoneNumber: string,
    documentUrl: string,
    filename: string,
    caption?: string
  ): Promise<WhatsAppResponse> {
    try {
      const cleanedNumber = this.extractPhoneNumber(phoneNumber)
      if (!cleanedNumber) {
        return {
          success: false,
          error: 'Invalid phone number'
        }
      }

      const message: WhatsAppMessage = {
        to: cleanedNumber,
        type: 'document',
        document: {
          link: documentUrl,
          filename,
          caption
        }
      }

      return await this.sendMessage(cleanedNumber, message)

    } catch (error) {
      console.error('WhatsApp document send error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  // Handle incoming WhatsApp webhooks
  static async handleWebhook(webhookData: WhatsAppWebhookData): Promise<boolean> {
    try {
      if (webhookData.object !== 'whatsapp_business_account') {
        return false
      }

      for (const entry of webhookData.entry) {
        for (const change of entry.changes) {
          if (change.field === 'messages') {
            // Handle incoming messages
            if (change.value.messages) {
              for (const message of change.value.messages) {
                await this.handleIncomingMessage(message)
              }
            }

            // Handle message statuses
            if (change.value.statuses) {
              for (const status of change.value.statuses) {
                await this.handleMessageStatus(status)
              }
            }
          }
        }
      }

      return true

    } catch (error) {
      console.error('WhatsApp webhook handling error:', error)
      return false
    }
  }

  // Core message sending function
  private static async sendMessage(phoneNumber: string, message: WhatsAppMessage): Promise<WhatsAppResponse> {
    try {
      if (!this.ACCESS_TOKEN || !this.PHONE_NUMBER_ID) {
        return {
          success: false,
          error: 'WhatsApp API credentials not configured'
        }
      }

      const url = `${this.WHATSAPP_API_URL}/${this.PHONE_NUMBER_ID}/messages`

      const payload = {
        messaging_product: 'whatsapp',
        to: phoneNumber,
        ...message
      }

      // Remove the 'to' field from the message object as it's at the root level
      delete (payload as any).to

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.ACCESS_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })

      const responseData = await response.json()

      if (!response.ok) {
        console.error('WhatsApp API error:', responseData)
        return {
          success: false,
          error: responseData.error?.message || 'WhatsApp API error'
        }
      }

      return {
        success: true,
        messageId: responseData.messages?.[0]?.id,
        quotaUsed: responseData.quota_used,
        rateLimitRemaining: response.headers.get('x-ratelimit-remaining')
          ? parseInt(response.headers.get('x-ratelimit-remaining')!)
          : undefined
      }

    } catch (error) {
      console.error('WhatsApp send message error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  // Template message creators
  private static createBookingConfirmationTemplate(booking: any): WhatsAppMessage {
    const property = booking.propertyId
    const checkInDate = format(new Date(booking.dateFrom), 'dd MMM yyyy')
    const checkOutDate = format(new Date(booking.dateTo), 'dd MMM yyyy')
    const bookingRef = booking.bookingReference || booking._id.toString().slice(-8)

    return {
      to: '',
      type: 'template',
      template: {
        name: 'booking_confirmation',
        language: {
          code: 'en'
        },
        components: [
          {
            type: 'header',
            parameters: [
              {
                type: 'text',
                text: property.title
              }
            ]
          },
          {
            type: 'body',
            parameters: [
              {
                type: 'text',
                text: booking.contactDetails?.name || booking.guestName || 'Guest'
              },
              {
                type: 'text',
                text: bookingRef
              },
              {
                type: 'text',
                text: checkInDate
              },
              {
                type: 'text',
                text: checkOutDate
              },
              {
                type: 'currency',
                currency: {
                  fallback_value: `₹${(booking.totalPrice || 0).toLocaleString()}`,
                  code: 'INR',
                  amount_1000: (booking.totalPrice || 0) * 1000
                }
              }
            ]
          }
        ]
      }
    }
  }

  private static createCheckInReminderTemplate(booking: any): WhatsAppMessage {
    const property = booking.propertyId
    const checkInDate = format(new Date(booking.dateFrom), 'dd MMM yyyy')
    const checkInTime = property.checkInTime || '3:00 PM'

    return {
      to: '',
      type: 'template',
      template: {
        name: 'check_in_reminder',
        language: {
          code: 'en'
        },
        components: [
          {
            type: 'body',
            parameters: [
              {
                type: 'text',
                text: booking.contactDetails?.name || booking.guestName || 'Guest'
              },
              {
                type: 'text',
                text: property.title
              },
              {
                type: 'text',
                text: checkInDate
              },
              {
                type: 'text',
                text: checkInTime
              },
              {
                type: 'text',
                text: `${property.address?.street}, ${property.address?.city}`
              }
            ]
          }
        ]
      }
    }
  }

  private static createPaymentReminderTemplate(booking: any, amount: number): WhatsAppMessage {
    const bookingRef = booking.bookingReference || booking._id.toString().slice(-8)
    const paymentUrl = `${process.env.NEXT_PUBLIC_APP_URL}/bookings/${booking._id}/payment`

    return {
      to: '',
      type: 'template',
      template: {
        name: 'payment_reminder',
        language: {
          code: 'en'
        },
        components: [
          {
            type: 'body',
            parameters: [
              {
                type: 'text',
                text: booking.contactDetails?.name || booking.guestName || 'Guest'
              },
              {
                type: 'currency',
                currency: {
                  fallback_value: `₹${amount.toLocaleString()}`,
                  code: 'INR',
                  amount_1000: amount * 1000
                }
              },
              {
                type: 'text',
                text: bookingRef
              }
            ]
          },
          {
            type: 'button',
            parameters: [
              {
                type: 'text',
                text: paymentUrl
              }
            ]
          }
        ]
      }
    }
  }

  // Helper methods
  private static extractPhoneNumber(phoneNumber: string): string | null {
    if (!phoneNumber) return null

    // Remove all non-digit characters
    let cleaned = phoneNumber.replace(/\D/g, '')

    // Add country code for India if missing
    if (cleaned.length === 10) {
      cleaned = '91' + cleaned
    }

    // Validate Indian phone number format
    if (!/^91[6-9]\d{9}$/.test(cleaned)) {
      return null
    }

    return cleaned
  }

  private static async handleIncomingMessage(message: any): Promise<void> {
    try {
      console.log('Incoming WhatsApp message:', {
        from: message.from,
        id: message.id,
        type: message.type,
        timestamp: message.timestamp,
        text: message.text?.body
      })

      // In production, implement auto-responses, keyword handling, etc.
      // For now, just log the message

      // Example: Auto-respond to specific keywords
      if (message.text?.body?.toLowerCase().includes('help')) {
        await this.sendCustomMessage(
          message.from,
          'Thank you for contacting Baithaka Ghar! Our team will respond to you shortly. For immediate assistance, please call us at +91-XXXXXXXXXX.'
        )
      }

    } catch (error) {
      console.error('Handle incoming WhatsApp message error:', error)
    }
  }

  private static async handleMessageStatus(status: any): Promise<void> {
    try {
      console.log('WhatsApp message status update:', {
        messageId: status.id,
        status: status.status,
        timestamp: status.timestamp,
        recipient: status.recipient_id
      })

      // Update message status in database
      await connectToDatabase()

      const booking = await Booking.findOne({
        'whatsAppActivity.messageId': status.id
      })

      if (booking) {
        const activityIndex = booking.whatsAppActivity.findIndex(
          (activity: any) => activity.messageId === status.id
        )

        if (activityIndex !== -1) {
          booking.whatsAppActivity[activityIndex].status = status.status
          booking.whatsAppActivity[activityIndex].statusUpdatedAt = new Date()

          if (status.errors?.length > 0) {
            booking.whatsAppActivity[activityIndex].error = status.errors[0].message
          }

          await booking.save()
        }
      }

    } catch (error) {
      console.error('Handle WhatsApp message status error:', error)
    }
  }

  private static async logWhatsAppActivity(bookingId: string, type: string, messageId: string): Promise<void> {
    try {
      await connectToDatabase()

      const booking = await Booking.findById(bookingId)
      if (booking) {
        if (!booking.whatsAppActivity) {
          booking.whatsAppActivity = []
        }

        booking.whatsAppActivity.push({
          type,
          messageId,
          sentAt: new Date(),
          status: 'sent'
        })

        await booking.save()
      }
    } catch (error) {
      console.error('WhatsApp activity logging error:', error)
    }
  }
}