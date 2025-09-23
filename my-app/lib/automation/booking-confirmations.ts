export interface BookingConfirmationConfig {
  propertyId: string
  enabled: boolean
  triggers: ConfirmationTrigger[]
  templates: ConfirmationTemplate[]
  channels: NotificationChannel[]
  timing: TimingConfig
  personalisation: PersonalisationConfig
  attachments: AttachmentConfig[]
}

export interface ConfirmationTrigger {
  event: 'booking_created' | 'payment_confirmed' | 'check_in_approaching' | 'booking_modified' | 'cancellation'
  conditions?: TriggerCondition[]
  delay?: number
  active: boolean
}

export interface TriggerCondition {
  field: 'booking_type' | 'guest_type' | 'room_type' | 'booking_value' | 'lead_time' | 'loyalty_tier'
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains' | 'in'
  value: any
}

export interface ConfirmationTemplate {
  id: string
  name: string
  trigger: string
  subject: string
  htmlContent: string
  textContent: string
  language: string
  variables: TemplateVariable[]
  brandingConfig: BrandingConfig
}

export interface TemplateVariable {
  name: string
  type: 'text' | 'date' | 'currency' | 'number' | 'boolean' | 'image' | 'url'
  required: boolean
  defaultValue?: any
  description: string
}

export interface BrandingConfig {
  logo: string
  primaryColor: string
  secondaryColor: string
  fontFamily: string
  footerText: string
  socialLinks?: SocialLink[]
}

export interface SocialLink {
  platform: 'facebook' | 'twitter' | 'instagram' | 'linkedin'
  url: string
  icon: string
}

export interface NotificationChannel {
  type: 'email' | 'sms' | 'whatsapp' | 'push' | 'webhook'
  enabled: boolean
  priority: number
  config: ChannelConfig
}

export interface ChannelConfig {
  email?: {
    fromAddress: string
    fromName: string
    replyTo?: string
    bcc?: string[]
    tracking: boolean
  }
  sms?: {
    senderId: string
    shortLinks: boolean
  }
  whatsapp?: {
    businessNumber: string
    templateId?: string
  }
  push?: {
    title: string
    icon: string
    badge: string
  }
  webhook?: {
    url: string
    method: 'POST' | 'PUT'
    headers: Record<string, string>
    authentication?: {
      type: 'bearer' | 'basic' | 'api_key'
      credentials: Record<string, string>
    }
  }
}

export interface TimingConfig {
  immediate: boolean
  scheduledTime?: string
  timezone: string
  respectQuietHours: boolean
  quietHours?: {
    start: string
    end: string
  }
  retryPolicy: RetryPolicy
}

export interface RetryPolicy {
  maxAttempts: number
  backoffStrategy: 'linear' | 'exponential'
  initialDelay: number
  maxDelay: number
}

export interface PersonalisationConfig {
  useGuestName: boolean
  useBookingDetails: boolean
  includeRoomDetails: boolean
  includeAmenities: boolean
  includeLocalInfo: boolean
  customFields: PersonalisationField[]
}

export interface PersonalisationField {
  name: string
  source: 'guest_profile' | 'booking_data' | 'property_data' | 'external_api'
  mapping: string
  fallback?: string
}

export interface AttachmentConfig {
  type: 'pdf' | 'ics' | 'image' | 'document'
  name: string
  template?: string
  generateDynamic: boolean
  required: boolean
}

export interface BookingConfirmationData {
  bookingId: string
  guestId: string
  propertyId: string
  checkIn: Date
  checkOut: Date
  roomType: string
  roomNumber?: string
  totalAmount: number
  currency: string
  paymentStatus: 'pending' | 'confirmed' | 'failed'
  specialRequests?: string[]
  guestDetails: GuestDetails
  propertyDetails: PropertyDetails
  confirmationNumber: string
  qrCode?: string
}

export interface GuestDetails {
  firstName: string
  lastName: string
  email: string
  phone?: string
  loyaltyNumber?: string
  loyaltyTier?: string
  preferences?: GuestPreferences
  language?: string
  country?: string
}

export interface GuestPreferences {
  roomType?: string
  floorPreference?: string
  bedType?: string
  dietaryRestrictions?: string[]
  accessibilityNeeds?: string[]
}

export interface PropertyDetails {
  name: string
  address: string
  phone: string
  email: string
  website: string
  checkInTime: string
  checkOutTime: string
  amenities: string[]
  policies: PropertyPolicy[]
  directions?: string
  nearbyAttractions?: NearbyAttraction[]
}

export interface PropertyPolicy {
  type: 'cancellation' | 'pet' | 'smoking' | 'child' | 'payment'
  title: string
  description: string
}

export interface NearbyAttraction {
  name: string
  type: 'restaurant' | 'attraction' | 'shopping' | 'transport'
  distance: string
  description?: string
}

export interface ConfirmationResult {
  success: boolean
  messageId: string
  channel: string
  sentAt: Date
  deliveredAt?: Date
  openedAt?: Date
  clickedAt?: Date
  error?: string
  retryCount: number
}

export interface ConfirmationAnalytics {
  totalSent: number
  totalDelivered: number
  totalOpened: number
  totalClicked: number
  deliveryRate: number
  openRate: number
  clickRate: number
  channelBreakdown: Record<string, ChannelMetrics>
  templatePerformance: Record<string, TemplateMetrics>
}

export interface ChannelMetrics {
  sent: number
  delivered: number
  failed: number
  deliveryRate: number
  avgDeliveryTime: number
}

export interface TemplateMetrics {
  used: number
  opened: number
  clicked: number
  openRate: number
  clickRate: number
  avgEngagementTime: number
}

export class BookingConfirmationService {
  private configs = new Map<string, BookingConfirmationConfig>()
  private templates = new Map<string, ConfirmationTemplate>()
  private pendingConfirmations = new Map<string, BookingConfirmationData>()
  private results = new Map<string, ConfirmationResult[]>()
  private processingQueue: BookingConfirmationData[] = []
  private processingInterval?: NodeJS.Timeout

  constructor() {
    this.initializeDefaultTemplates()
    this.startProcessingQueue()
  }

  async processBookingConfirmation(bookingData: BookingConfirmationData): Promise<ConfirmationResult[]> {
    const config = this.configs.get(bookingData.propertyId)
    if (!config || !config.enabled) {
      throw new Error('Booking confirmations not configured or disabled for this property')
    }

    const trigger = config.triggers.find(t => t.event === 'booking_created' && t.active)
    if (!trigger) {
      throw new Error('No active trigger found for booking creation')
    }

    if (trigger.conditions && !this.evaluateConditions(trigger.conditions, bookingData)) {
      return []
    }

    const results: ConfirmationResult[] = []
    const enabledChannels = config.channels.filter(c => c.enabled).sort((a, b) => b.priority - a.priority)

    for (const channel of enabledChannels) {
      try {
        const result = await this.sendConfirmation(bookingData, channel, config)
        results.push(result)
        this.storeResult(bookingData.bookingId, result)
      } catch (error) {
        const errorResult: ConfirmationResult = {
          success: false,
          messageId: '',
          channel: channel.type,
          sentAt: new Date(),
          error: error instanceof Error ? error.message : 'Unknown error',
          retryCount: 0
        }
        results.push(errorResult)
        this.storeResult(bookingData.bookingId, errorResult)
      }
    }

    await this.scheduleFollowUps(bookingData, config)
    return results
  }

  private evaluateConditions(conditions: TriggerCondition[], bookingData: BookingConfirmationData): boolean {
    return conditions.every(condition => {
      const value = this.extractFieldValue(condition.field, bookingData)
      return this.compareValues(value, condition.operator, condition.value)
    })
  }

  private extractFieldValue(field: string, bookingData: BookingConfirmationData): any {
    switch (field) {
      case 'booking_type':
        return this.determineBookingType(bookingData)
      case 'guest_type':
        return bookingData.guestDetails.loyaltyTier || 'standard'
      case 'room_type':
        return bookingData.roomType
      case 'booking_value':
        return bookingData.totalAmount
      case 'lead_time':
        return Math.ceil((bookingData.checkIn.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      case 'loyalty_tier':
        return bookingData.guestDetails.loyaltyTier
      default:
        return null
    }
  }

  private determineBookingType(bookingData: BookingConfirmationData): string {
    const leadTime = Math.ceil((bookingData.checkIn.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    const nights = Math.ceil((bookingData.checkOut.getTime() - bookingData.checkIn.getTime()) / (1000 * 60 * 60 * 24))

    if (leadTime <= 1) return 'last_minute'
    if (nights >= 7) return 'extended_stay'
    if (bookingData.totalAmount > 1000) return 'premium'
    return 'standard'
  }

  private compareValues(actual: any, operator: string, expected: any): boolean {
    switch (operator) {
      case 'equals': return actual === expected
      case 'not_equals': return actual !== expected
      case 'greater_than': return actual > expected
      case 'less_than': return actual < expected
      case 'contains': return String(actual).includes(String(expected))
      case 'in': return Array.isArray(expected) && expected.includes(actual)
      default: return false
    }
  }

  private async sendConfirmation(
    bookingData: BookingConfirmationData,
    channel: NotificationChannel,
    config: BookingConfirmationConfig
  ): Promise<ConfirmationResult> {
    const template = this.selectTemplate(config.templates, 'booking_created', bookingData.guestDetails.language)
    const personalizedContent = await this.personalizeContent(template, bookingData, config.personalisation)

    switch (channel.type) {
      case 'email':
        return await this.sendEmailConfirmation(bookingData, personalizedContent, channel.config.email!, config)
      case 'sms':
        return await this.sendSMSConfirmation(bookingData, personalizedContent, channel.config.sms!)
      case 'whatsapp':
        return await this.sendWhatsAppConfirmation(bookingData, personalizedContent, channel.config.whatsapp!)
      case 'push':
        return await this.sendPushConfirmation(bookingData, personalizedContent, channel.config.push!)
      case 'webhook':
        return await this.sendWebhookConfirmation(bookingData, channel.config.webhook!)
      default:
        throw new Error(`Unsupported channel type: ${channel.type}`)
    }
  }

  private selectTemplate(templates: ConfirmationTemplate[], trigger: string, language = 'en'): ConfirmationTemplate {
    const filtered = templates.filter(t => t.trigger === trigger)
    const languageMatch = filtered.find(t => t.language === language)
    const defaultMatch = filtered.find(t => t.language === 'en')

    return languageMatch || defaultMatch || filtered[0]
  }

  private async personalizeContent(
    template: ConfirmationTemplate,
    bookingData: BookingConfirmationData,
    personalization: PersonalisationConfig
  ): Promise<{ subject: string; htmlContent: string; textContent: string }> {
    const variables = await this.buildTemplateVariables(bookingData, personalization)

    return {
      subject: this.replaceVariables(template.subject, variables),
      htmlContent: this.replaceVariables(template.htmlContent, variables),
      textContent: this.replaceVariables(template.textContent, variables)
    }
  }

  private async buildTemplateVariables(
    bookingData: BookingConfirmationData,
    personalization: PersonalisationConfig
  ): Promise<Record<string, any>> {
    const variables: Record<string, any> = {}

    if (personalization.useGuestName) {
      variables.guest_first_name = bookingData.guestDetails.firstName
      variables.guest_last_name = bookingData.guestDetails.lastName
      variables.guest_full_name = `${bookingData.guestDetails.firstName} ${bookingData.guestDetails.lastName}`
    }

    if (personalization.useBookingDetails) {
      variables.booking_id = bookingData.bookingId
      variables.confirmation_number = bookingData.confirmationNumber
      variables.check_in_date = bookingData.checkIn.toLocaleDateString()
      variables.check_out_date = bookingData.checkOut.toLocaleDateString()
      variables.total_amount = bookingData.totalAmount
      variables.currency = bookingData.currency
      variables.nights = Math.ceil((bookingData.checkOut.getTime() - bookingData.checkIn.getTime()) / (1000 * 60 * 60 * 24))
    }

    if (personalization.includeRoomDetails) {
      variables.room_type = bookingData.roomType
      variables.room_number = bookingData.roomNumber || 'To be assigned'
    }

    if (personalization.includeAmenities && bookingData.propertyDetails) {
      variables.amenities = bookingData.propertyDetails.amenities.join(', ')
    }

    variables.property_name = bookingData.propertyDetails.name
    variables.property_address = bookingData.propertyDetails.address
    variables.property_phone = bookingData.propertyDetails.phone
    variables.check_in_time = bookingData.propertyDetails.checkInTime
    variables.check_out_time = bookingData.propertyDetails.checkOutTime

    for (const field of personalization.customFields) {
      const value = await this.extractCustomFieldValue(field, bookingData)
      variables[field.name] = value || field.fallback || ''
    }

    return variables
  }

  private async extractCustomFieldValue(field: PersonalisationField, bookingData: BookingConfirmationData): Promise<any> {
    switch (field.source) {
      case 'guest_profile':
        return this.getGuestProfileValue(field.mapping, bookingData.guestDetails)
      case 'booking_data':
        return this.getBookingValue(field.mapping, bookingData)
      case 'property_data':
        return this.getPropertyValue(field.mapping, bookingData.propertyDetails)
      case 'external_api':
        return await this.getExternalValue(field.mapping, bookingData)
      default:
        return null
    }
  }

  private getGuestProfileValue(mapping: string, guestDetails: GuestDetails): any {
    const path = mapping.split('.')
    let value: any = guestDetails
    for (const key of path) {
      value = value?.[key]
    }
    return value
  }

  private getBookingValue(mapping: string, bookingData: BookingConfirmationData): any {
    const path = mapping.split('.')
    let value: any = bookingData
    for (const key of path) {
      value = value?.[key]
    }
    return value
  }

  private getPropertyValue(mapping: string, propertyDetails: PropertyDetails): any {
    const path = mapping.split('.')
    let value: any = propertyDetails
    for (const key of path) {
      value = value?.[key]
    }
    return value
  }

  private async getExternalValue(mapping: string, bookingData: BookingConfirmationData): Promise<any> {
    return null
  }

  private replaceVariables(content: string, variables: Record<string, any>): string {
    return content.replace(/\{\{(\w+)\}\}/g, (match, variableName) => {
      return String(variables[variableName] || match)
    })
  }

  private async sendEmailConfirmation(
    bookingData: BookingConfirmationData,
    content: { subject: string; htmlContent: string; textContent: string },
    emailConfig: NonNullable<ChannelConfig['email']>,
    config: BookingConfirmationConfig
  ): Promise<ConfirmationResult> {
    const attachments = await this.generateAttachments(bookingData, config.attachments)

    const emailData = {
      from: `${emailConfig.fromName} <${emailConfig.fromAddress}>`,
      to: bookingData.guestDetails.email,
      replyTo: emailConfig.replyTo,
      bcc: emailConfig.bcc,
      subject: content.subject,
      html: content.htmlContent,
      text: content.textContent,
      attachments
    }

    try {
      const response = await fetch('/api/communications/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(emailData)
      })

      if (!response.ok) {
        throw new Error(`Email send failed: ${response.statusText}`)
      }

      const result = await response.json()

      return {
        success: true,
        messageId: result.messageId || `email-${Date.now()}`,
        channel: 'email',
        sentAt: new Date(),
        retryCount: 0
      }
    } catch (error) {
      throw new Error(`Email delivery failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  private async sendSMSConfirmation(
    bookingData: BookingConfirmationData,
    content: { textContent: string },
    smsConfig: NonNullable<ChannelConfig['sms']>
  ): Promise<ConfirmationResult> {
    if (!bookingData.guestDetails.phone) {
      throw new Error('No phone number available for SMS')
    }

    const smsData = {
      to: bookingData.guestDetails.phone,
      from: smsConfig.senderId,
      message: content.textContent,
      shortLinks: smsConfig.shortLinks
    }

    try {
      const response = await fetch('/api/communications/sms/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(smsData)
      })

      if (!response.ok) {
        throw new Error(`SMS send failed: ${response.statusText}`)
      }

      const result = await response.json()

      return {
        success: true,
        messageId: result.messageId || `sms-${Date.now()}`,
        channel: 'sms',
        sentAt: new Date(),
        retryCount: 0
      }
    } catch (error) {
      throw new Error(`SMS delivery failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  private async sendWhatsAppConfirmation(
    bookingData: BookingConfirmationData,
    content: { textContent: string },
    whatsappConfig: NonNullable<ChannelConfig['whatsapp']>
  ): Promise<ConfirmationResult> {
    if (!bookingData.guestDetails.phone) {
      throw new Error('No phone number available for WhatsApp')
    }

    const whatsappData = {
      to: bookingData.guestDetails.phone,
      from: whatsappConfig.businessNumber,
      message: content.textContent,
      templateId: whatsappConfig.templateId
    }

    try {
      const response = await fetch('/api/communications/whatsapp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(whatsappData)
      })

      if (!response.ok) {
        throw new Error(`WhatsApp send failed: ${response.statusText}`)
      }

      const result = await response.json()

      return {
        success: true,
        messageId: result.messageId || `whatsapp-${Date.now()}`,
        channel: 'whatsapp',
        sentAt: new Date(),
        retryCount: 0
      }
    } catch (error) {
      throw new Error(`WhatsApp delivery failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  private async sendPushConfirmation(
    bookingData: BookingConfirmationData,
    content: { subject: string; textContent: string },
    pushConfig: NonNullable<ChannelConfig['push']>
  ): Promise<ConfirmationResult> {
    const pushData = {
      userId: bookingData.guestId,
      title: content.subject,
      body: content.textContent,
      icon: pushConfig.icon,
      badge: pushConfig.badge,
      data: {
        bookingId: bookingData.bookingId,
        type: 'booking_confirmation'
      }
    }

    try {
      const response = await fetch('/api/communications/push/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pushData)
      })

      if (!response.ok) {
        throw new Error(`Push notification send failed: ${response.statusText}`)
      }

      const result = await response.json()

      return {
        success: true,
        messageId: result.messageId || `push-${Date.now()}`,
        channel: 'push',
        sentAt: new Date(),
        retryCount: 0
      }
    } catch (error) {
      throw new Error(`Push notification delivery failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  private async sendWebhookConfirmation(
    bookingData: BookingConfirmationData,
    webhookConfig: NonNullable<ChannelConfig['webhook']>
  ): Promise<ConfirmationResult> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...webhookConfig.headers
    }

    if (webhookConfig.authentication) {
      const auth = webhookConfig.authentication
      switch (auth.type) {
        case 'bearer':
          headers['Authorization'] = `Bearer ${auth.credentials.token}`
          break
        case 'basic':
          const basicAuth = Buffer.from(`${auth.credentials.username}:${auth.credentials.password}`).toString('base64')
          headers['Authorization'] = `Basic ${basicAuth}`
          break
        case 'api_key':
          headers[auth.credentials.header || 'X-API-Key'] = auth.credentials.key
          break
      }
    }

    try {
      const response = await fetch(webhookConfig.url, {
        method: webhookConfig.method,
        headers,
        body: JSON.stringify({
          event: 'booking_confirmation',
          booking: bookingData,
          timestamp: new Date().toISOString()
        })
      })

      if (!response.ok) {
        throw new Error(`Webhook call failed: ${response.statusText}`)
      }

      return {
        success: true,
        messageId: `webhook-${Date.now()}`,
        channel: 'webhook',
        sentAt: new Date(),
        retryCount: 0
      }
    } catch (error) {
      throw new Error(`Webhook delivery failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  private async generateAttachments(
    bookingData: BookingConfirmationData,
    attachmentConfigs: AttachmentConfig[]
  ): Promise<any[]> {
    const attachments: any[] = []

    for (const config of attachmentConfigs) {
      try {
        if (config.type === 'pdf' && config.generateDynamic) {
          const pdfBuffer = await this.generateBookingVoucher(bookingData)
          attachments.push({
            filename: `booking-confirmation-${bookingData.confirmationNumber}.pdf`,
            content: pdfBuffer,
            contentType: 'application/pdf'
          })
        }

        if (config.type === 'ics') {
          const icsContent = this.generateCalendarEvent(bookingData)
          attachments.push({
            filename: `booking-${bookingData.confirmationNumber}.ics`,
            content: icsContent,
            contentType: 'text/calendar'
          })
        }
      } catch (error) {
        console.error(`Failed to generate attachment ${config.type}:`, error)
        if (config.required) {
          throw error
        }
      }
    }

    return attachments
  }

  private async generateBookingVoucher(bookingData: BookingConfirmationData): Promise<Buffer> {
    return Buffer.from('PDF placeholder')
  }

  private generateCalendarEvent(bookingData: BookingConfirmationData): string {
    const startDate = bookingData.checkIn.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
    const endDate = bookingData.checkOut.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'

    return [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Baithaka GHAR//Booking System//EN',
      'BEGIN:VEVENT',
      `UID:booking-${bookingData.bookingId}@baithakaghar.com`,
      `DTSTART:${startDate}`,
      `DTEND:${endDate}`,
      `SUMMARY:Hotel Stay - ${bookingData.propertyDetails.name}`,
      `DESCRIPTION:Booking confirmation: ${bookingData.confirmationNumber}`,
      `LOCATION:${bookingData.propertyDetails.address}`,
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n')
  }

  private async scheduleFollowUps(bookingData: BookingConfirmationData, config: BookingConfirmationConfig): Promise<void> {
    const preArrivalTrigger = config.triggers.find(t => t.event === 'check_in_approaching' && t.active)
    if (preArrivalTrigger) {
      const reminderDate = new Date(bookingData.checkIn)
      reminderDate.setDate(reminderDate.getDate() - 1)

      if (reminderDate > new Date()) {
        setTimeout(() => {
          this.processingQueue.push(bookingData)
        }, reminderDate.getTime() - Date.now())
      }
    }
  }

  private storeResult(bookingId: string, result: ConfirmationResult): void {
    if (!this.results.has(bookingId)) {
      this.results.set(bookingId, [])
    }
    this.results.get(bookingId)!.push(result)
  }

  private startProcessingQueue(): void {
    this.processingInterval = setInterval(() => {
      this.processQueue()
    }, 30000)
  }

  private async processQueue(): Promise<void> {
    while (this.processingQueue.length > 0) {
      const bookingData = this.processingQueue.shift()
      if (bookingData) {
        try {
          await this.processBookingConfirmation(bookingData)
        } catch (error) {
          console.error('Error processing queued confirmation:', error)
        }
      }
    }
  }

  private initializeDefaultTemplates(): void {
    const defaultTemplate: ConfirmationTemplate = {
      id: 'booking-confirmation-default',
      name: 'Default Booking Confirmation',
      trigger: 'booking_created',
      subject: 'Booking Confirmation - {{confirmation_number}}',
      htmlContent: `
        <html>
          <body style="font-family: Arial, sans-serif; margin: 0; padding: 20px;">
            <div style="max-width: 600px; margin: 0 auto;">
              <h1 style="color: #2c3e50;">Booking Confirmation</h1>
              <p>Dear {{guest_full_name}},</p>
              <p>Thank you for your booking at {{property_name}}. Your reservation has been confirmed.</p>

              <div style="background: #f8f9fa; padding: 20px; margin: 20px 0; border-radius: 8px;">
                <h3>Booking Details</h3>
                <p><strong>Confirmation Number:</strong> {{confirmation_number}}</p>
                <p><strong>Check-in:</strong> {{check_in_date}} at {{check_in_time}}</p>
                <p><strong>Check-out:</strong> {{check_out_date}} at {{check_out_time}}</p>
                <p><strong>Room Type:</strong> {{room_type}}</p>
                <p><strong>Total Amount:</strong> {{currency}} {{total_amount}}</p>
              </div>

              <div style="background: #e8f4fd; padding: 20px; margin: 20px 0; border-radius: 8px;">
                <h3>Property Information</h3>
                <p><strong>{{property_name}}</strong></p>
                <p>{{property_address}}</p>
                <p>Phone: {{property_phone}}</p>
              </div>

              <p>We look forward to welcoming you!</p>
              <p>Best regards,<br>The {{property_name}} Team</p>
            </div>
          </body>
        </html>
      `,
      textContent: `
        Booking Confirmation

        Dear {{guest_full_name}},

        Thank you for your booking at {{property_name}}. Your reservation has been confirmed.

        Booking Details:
        Confirmation Number: {{confirmation_number}}
        Check-in: {{check_in_date}} at {{check_in_time}}
        Check-out: {{check_out_date}} at {{check_out_time}}
        Room Type: {{room_type}}
        Total Amount: {{currency}} {{total_amount}}

        Property Information:
        {{property_name}}
        {{property_address}}
        Phone: {{property_phone}}

        We look forward to welcoming you!

        Best regards,
        The {{property_name}} Team
      `,
      language: 'en',
      variables: [],
      brandingConfig: {
        logo: '',
        primaryColor: '#2c3e50',
        secondaryColor: '#3498db',
        fontFamily: 'Arial, sans-serif',
        footerText: 'Thank you for choosing us!'
      }
    }

    this.templates.set(defaultTemplate.id, defaultTemplate)
  }

  async updateConfiguration(propertyId: string, config: BookingConfirmationConfig): Promise<void> {
    this.configs.set(propertyId, config)
    await this.saveConfiguration(propertyId, config)
  }

  async getConfiguration(propertyId: string): Promise<BookingConfirmationConfig | null> {
    return this.configs.get(propertyId) || null
  }

  async getAnalytics(propertyId: string, startDate: Date, endDate: Date): Promise<ConfirmationAnalytics> {
    const results = Array.from(this.results.values()).flat()
      .filter(r => r.sentAt >= startDate && r.sentAt <= endDate)

    const totalSent = results.length
    const totalDelivered = results.filter(r => r.deliveredAt).length
    const totalOpened = results.filter(r => r.openedAt).length
    const totalClicked = results.filter(r => r.clickedAt).length

    const channelBreakdown: Record<string, ChannelMetrics> = {}
    const channels = [...new Set(results.map(r => r.channel))]

    for (const channel of channels) {
      const channelResults = results.filter(r => r.channel === channel)
      channelBreakdown[channel] = {
        sent: channelResults.length,
        delivered: channelResults.filter(r => r.deliveredAt).length,
        failed: channelResults.filter(r => !r.success).length,
        deliveryRate: channelResults.filter(r => r.deliveredAt).length / channelResults.length,
        avgDeliveryTime: 0
      }
    }

    return {
      totalSent,
      totalDelivered,
      totalOpened,
      totalClicked,
      deliveryRate: totalSent > 0 ? totalDelivered / totalSent : 0,
      openRate: totalDelivered > 0 ? totalOpened / totalDelivered : 0,
      clickRate: totalOpened > 0 ? totalClicked / totalOpened : 0,
      channelBreakdown,
      templatePerformance: {}
    }
  }

  private async saveConfiguration(propertyId: string, config: BookingConfirmationConfig): Promise<void> {
  }

  async retryFailedConfirmation(bookingId: string, channel: string): Promise<ConfirmationResult> {
    const bookingData = this.pendingConfirmations.get(bookingId)
    if (!bookingData) {
      throw new Error('Booking data not found for retry')
    }

    const config = this.configs.get(bookingData.propertyId)
    if (!config) {
      throw new Error('Configuration not found for retry')
    }

    const channelConfig = config.channels.find(c => c.type === channel)
    if (!channelConfig) {
      throw new Error('Channel configuration not found for retry')
    }

    return await this.sendConfirmation(bookingData, channelConfig, config)
  }

  stopProcessing(): void {
    if (this.processingInterval) {
      clearInterval(this.processingInterval)
      this.processingInterval = undefined
    }
  }
}

export const bookingConfirmationService = new BookingConfirmationService()