import { connectToDatabase } from '@/lib/db/enhanced-mongodb'
import { auditLogger } from '@/lib/security/audit-logger'
import mongoose from 'mongoose'

export interface GuestMessage {
  id: string
  bookingId: string
  guestId: string
  propertyId: string
  type: 'pre_arrival' | 'check_in' | 'during_stay' | 'check_out' | 'post_stay' | 'support'
  category: 'welcome' | 'instructions' | 'request' | 'complaint' | 'inquiry' | 'emergency' | 'feedback'
  channel: 'sms' | 'email' | 'whatsapp' | 'in_app' | 'phone'
  direction: 'inbound' | 'outbound'
  from: string
  to: string
  subject?: string
  content: string
  attachments: MessageAttachment[]
  status: 'draft' | 'sent' | 'delivered' | 'read' | 'replied' | 'failed'
  priority: 'low' | 'normal' | 'high' | 'urgent'
  isAutomated: boolean
  templateId?: string
  relatedMessageId?: string
  handledBy?: string
  resolvedAt?: Date
  rating?: number
  tags: string[]
  metadata: any
  createdAt: Date
  updatedAt: Date
}

export interface MessageAttachment {
  id: string
  filename: string
  url: string
  type: 'image' | 'document' | 'audio' | 'video'
  size: number
}

export interface MessageTemplate {
  id: string
  name: string
  category: string
  type: GuestMessage['type']
  channel: GuestMessage['channel']
  subject?: string
  content: string
  variables: TemplateVariable[]
  isActive: boolean
  trigger?: AutomationTrigger
  propertyId: string
  createdAt: Date
  updatedAt: Date
}

export interface TemplateVariable {
  name: string
  description: string
  required: boolean
  defaultValue?: string
}

export interface AutomationTrigger {
  event: 'booking_confirmed' | 'check_in_reminder' | 'check_in' | 'check_out_reminder' | 'check_out' | 'review_request'
  timing: 'immediate' | 'scheduled'
  delay?: number // minutes
  conditions?: any
}

export interface GuestConversation {
  id: string
  guestId: string
  bookingId: string
  propertyId: string
  status: 'active' | 'resolved' | 'closed'
  priority: 'low' | 'normal' | 'high' | 'urgent'
  category: string
  assignedTo?: string
  messages: GuestMessage[]
  tags: string[]
  firstMessageAt: Date
  lastMessageAt: Date
  responseTime: number
  resolutionTime?: number
  satisfaction?: {
    rating: number
    feedback: string
    submittedAt: Date
  }
  metadata: any
  createdAt: Date
  updatedAt: Date
}

export interface CommunicationPreferences {
  guestId: string
  email: {
    enabled: boolean
    marketing: boolean
    transactional: boolean
    address: string
  }
  sms: {
    enabled: boolean
    marketing: boolean
    transactional: boolean
    number: string
  }
  whatsapp: {
    enabled: boolean
    number: string
  }
  inApp: {
    enabled: boolean
    pushNotifications: boolean
  }
  language: string
  timezone: string
  doNotDisturb: {
    enabled: boolean
    startTime: string
    endTime: string
  }
}

export interface BulkMessage {
  id: string
  name: string
  templateId: string
  targetCriteria: {
    bookingStatus?: string[]
    checkInDate?: { start: Date; end: Date }
    roomTypes?: string[]
    guestTypes?: string[]
    tags?: string[]
  }
  channel: GuestMessage['channel']
  scheduledAt?: Date
  status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'failed'
  totalRecipients: number
  sentCount: number
  deliveredCount: number
  failedCount: number
  propertyId: string
  createdBy: string
  createdAt: Date
  updatedAt: Date
}

export interface CommunicationFilters {
  guestId?: string
  bookingId?: string
  type?: string
  category?: string
  channel?: string
  status?: string
  dateRange?: { start: Date; end: Date }
  propertyId?: string
  page?: number
  limit?: number
}

export class GuestCommunicationService {
  // Message Management
  
  static async sendMessage(messageData: Omit<GuestMessage, 'id' | 'createdAt' | 'updatedAt' | 'status'>): Promise<{
    success: boolean
    data?: GuestMessage
    error?: string
  }> {
    try {
      await connectToDatabase()
      
      const newMessage: GuestMessage = {
        ...messageData,
        id: new mongoose.Types.ObjectId().toString(),
        status: 'sent',
        createdAt: new Date(),
        updatedAt: new Date()
      }
      
      // In production, send via appropriate channel (SMS, Email, WhatsApp, etc.)
      console.log('Sending message:', newMessage.channel, newMessage.to)
      
      // Mock delivery status
      setTimeout(() => {
        newMessage.status = 'delivered'
      }, 1000)
      
      await auditLogger.logUserAction({
        userId: messageData.from,
        action: 'send_message',
        resource: 'guest_message',
        resourceId: newMessage.id,
        ip: 'internal',
        userAgent: 'system',
        details: {
          guestId: messageData.guestId,
          channel: messageData.channel,
          type: messageData.type,
          category: messageData.category
        }
      })
      
      return { success: true, data: newMessage }
      
    } catch (error) {
      console.error('Error sending message:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  }
  
  static async getMessages(filters: CommunicationFilters = {}): Promise<{
    success: boolean
    data?: {
      messages: GuestMessage[]
      pagination: {
        page: number
        limit: number
        total: number
        pages: number
      }
      summary: {
        totalMessages: number
        unreadMessages: number
        byChannel: { [key: string]: number }
        byType: { [key: string]: number }
        responseTime: number
      }
    }
    error?: string
  }> {
    try {
      await connectToDatabase()
      
      const { page = 1, limit = 20 } = filters
      
      // Generate mock message data
      const mockMessages: GuestMessage[] = []
      const types = ['pre_arrival', 'check_in', 'during_stay', 'check_out', 'post_stay', 'support']
      const categories = ['welcome', 'instructions', 'request', 'complaint', 'inquiry', 'feedback']
      const channels = ['sms', 'email', 'whatsapp', 'in_app']
      const statuses = ['sent', 'delivered', 'read', 'replied']
      
      for (let i = 0; i < 50; i++) {
        mockMessages.push({
          id: `msg_${i}`,
          bookingId: `booking_${i % 10}`,
          guestId: `guest_${i % 15}`,
          propertyId: filters.propertyId || 'property_1',
          type: types[Math.floor(Math.random() * types.length)] as any,
          category: categories[Math.floor(Math.random() * categories.length)] as any,
          channel: channels[Math.floor(Math.random() * channels.length)] as any,
          direction: Math.random() > 0.5 ? 'inbound' : 'outbound',
          from: `guest${i}@example.com`,
          to: 'property@example.com',
          subject: `Message Subject ${i}`,
          content: `This is message content for message ${i}`,
          attachments: [],
          status: statuses[Math.floor(Math.random() * statuses.length)] as any,
          priority: 'normal',
          isAutomated: Math.random() > 0.7,
          tags: [`tag_${i % 5}`],
          metadata: {},
          createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
          updatedAt: new Date()
        })
      }
      
      // Apply filters
      let filteredMessages = mockMessages
      if (filters.guestId) {
        filteredMessages = filteredMessages.filter(m => m.guestId === filters.guestId)
      }
      if (filters.type) {
        filteredMessages = filteredMessages.filter(m => m.type === filters.type)
      }
      if (filters.channel) {
        filteredMessages = filteredMessages.filter(m => m.channel === filters.channel)
      }
      if (filters.status) {
        filteredMessages = filteredMessages.filter(m => m.status === filters.status)
      }
      
      const total = filteredMessages.length
      const skip = (page - 1) * limit
      const messages = filteredMessages.slice(skip, skip + limit)
      
      const summary = {
        totalMessages: mockMessages.length,
        unreadMessages: mockMessages.filter(m => m.status !== 'read').length,
        byChannel: this.groupBy(mockMessages, 'channel'),
        byType: this.groupBy(mockMessages, 'type'),
        responseTime: Math.floor(Math.random() * 120) + 30 // minutes
      }
      
      return {
        success: true,
        data: {
          messages,
          pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit)
          },
          summary
        }
      }
      
    } catch (error) {
      console.error('Error fetching messages:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  }
  
  // Template Management
  
  static async createTemplate(templateData: Omit<MessageTemplate, 'id' | 'createdAt' | 'updatedAt'>): Promise<{
    success: boolean
    data?: MessageTemplate
    error?: string
  }> {
    try {
      await connectToDatabase()
      
      const newTemplate: MessageTemplate = {
        ...templateData,
        id: new mongoose.Types.ObjectId().toString(),
        createdAt: new Date(),
        updatedAt: new Date()
      }
      
      console.log('Creating message template:', newTemplate.name)
      
      return { success: true, data: newTemplate }
      
    } catch (error) {
      console.error('Error creating template:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  }
  
  static async getTemplates(propertyId: string): Promise<{
    success: boolean
    data?: MessageTemplate[]
    error?: string
  }> {
    try {
      await connectToDatabase()
      
      // Generate mock template data
      const templates: MessageTemplate[] = [
        {
          id: 'template_1',
          name: 'Welcome Message',
          category: 'welcome',
          type: 'pre_arrival',
          channel: 'email',
          subject: 'Welcome to {{property_name}}',
          content: 'Dear {{guest_name}}, welcome to {{property_name}}! Your booking is confirmed for {{check_in_date}}.',
          variables: [
            { name: 'guest_name', description: 'Guest\'s full name', required: true },
            { name: 'property_name', description: 'Property name', required: true },
            { name: 'check_in_date', description: 'Check-in date', required: true }
          ],
          isActive: true,
          trigger: {
            event: 'booking_confirmed',
            timing: 'immediate'
          },
          propertyId,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 'template_2',
          name: 'Check-in Instructions',
          category: 'instructions',
          type: 'check_in',
          channel: 'sms',
          content: 'Hi {{guest_name}}! Check-in is at {{check_in_time}}. Your room number is {{room_number}}. Access code: {{access_code}}',
          variables: [
            { name: 'guest_name', description: 'Guest\'s first name', required: true },
            { name: 'check_in_time', description: 'Check-in time', required: true },
            { name: 'room_number', description: 'Room number', required: true },
            { name: 'access_code', description: 'Door access code', required: false }
          ],
          isActive: true,
          trigger: {
            event: 'check_in_reminder',
            timing: 'scheduled',
            delay: 60 // 1 hour before
          },
          propertyId,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 'template_3',
          name: 'Review Request',
          category: 'feedback',
          type: 'post_stay',
          channel: 'email',
          subject: 'How was your stay at {{property_name}}?',
          content: 'Dear {{guest_name}}, we hope you enjoyed your stay! Please take a moment to leave us a review: {{review_link}}',
          variables: [
            { name: 'guest_name', description: 'Guest\'s full name', required: true },
            { name: 'property_name', description: 'Property name', required: true },
            { name: 'review_link', description: 'Review submission link', required: true }
          ],
          isActive: true,
          trigger: {
            event: 'review_request',
            timing: 'scheduled',
            delay: 1440 // 24 hours after checkout
          },
          propertyId,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ]
      
      return { success: true, data: templates }
      
    } catch (error) {
      console.error('Error fetching templates:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  }
  
  // Conversation Management
  
  static async getConversations(propertyId: string, filters: { status?: string; assignedTo?: string } = {}): Promise<{
    success: boolean
    data?: GuestConversation[]
    error?: string
  }> {
    try {
      await connectToDatabase()
      
      // Generate mock conversation data
      const conversations: GuestConversation[] = []
      const statuses = ['active', 'resolved', 'closed']
      const categories = ['general', 'maintenance', 'housekeeping', 'billing', 'complaint']
      
      for (let i = 0; i < 15; i++) {
        conversations.push({
          id: `conv_${i}`,
          guestId: `guest_${i % 10}`,
          bookingId: `booking_${i % 8}`,
          propertyId,
          status: statuses[Math.floor(Math.random() * statuses.length)] as any,
          priority: Math.random() > 0.8 ? 'high' : 'normal',
          category: categories[Math.floor(Math.random() * categories.length)],
          assignedTo: Math.random() > 0.3 ? `staff_${i % 5}` : undefined,
          messages: [],
          tags: [`tag_${i % 3}`],
          firstMessageAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
          lastMessageAt: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000),
          responseTime: Math.floor(Math.random() * 180) + 15,
          resolutionTime: Math.random() > 0.5 ? Math.floor(Math.random() * 1440) + 60 : undefined,
          metadata: {},
          createdAt: new Date(),
          updatedAt: new Date()
        })
      }
      
      // Apply filters
      let filteredConversations = conversations
      if (filters.status) {
        filteredConversations = filteredConversations.filter(c => c.status === filters.status)
      }
      if (filters.assignedTo) {
        filteredConversations = filteredConversations.filter(c => c.assignedTo === filters.assignedTo)
      }
      
      return { success: true, data: filteredConversations }
      
    } catch (error) {
      console.error('Error fetching conversations:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  }
  
  static async updateConversationStatus(conversationId: string, status: GuestConversation['status'], userId: string): Promise<{
    success: boolean
    data?: GuestConversation
    error?: string
  }> {
    try {
      await connectToDatabase()
      
      console.log('Updating conversation status:', conversationId, status)
      
      await auditLogger.logUserAction({
        userId,
        action: 'update_conversation_status',
        resource: 'guest_conversation',
        resourceId: conversationId,
        ip: 'internal',
        userAgent: 'system',
        details: { newStatus: status }
      })
      
      // Return mock updated conversation
      const updatedConversation: GuestConversation = {
        id: conversationId,
        guestId: 'guest_1',
        bookingId: 'booking_1',
        propertyId: 'property_1',
        status,
        priority: 'normal',
        category: 'general',
        assignedTo: userId,
        messages: [],
        tags: [],
        firstMessageAt: new Date(),
        lastMessageAt: new Date(),
        responseTime: 30,
        metadata: {},
        createdAt: new Date(),
        updatedAt: new Date()
      }
      
      return { success: true, data: updatedConversation }
      
    } catch (error) {
      console.error('Error updating conversation status:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  }
  
  // Communication Preferences
  
  static async updateCommunicationPreferences(guestId: string, preferences: Partial<CommunicationPreferences>): Promise<{
    success: boolean
    data?: CommunicationPreferences
    error?: string
  }> {
    try {
      await connectToDatabase()
      
      console.log('Updating communication preferences for guest:', guestId)
      
      // Mock updated preferences
      const updatedPreferences: CommunicationPreferences = {
        guestId,
        email: {
          enabled: true,
          marketing: false,
          transactional: true,
          address: 'guest@example.com'
        },
        sms: {
          enabled: true,
          marketing: false,
          transactional: true,
          number: '+1234567890'
        },
        whatsapp: {
          enabled: false,
          number: ''
        },
        inApp: {
          enabled: true,
          pushNotifications: true
        },
        language: 'en',
        timezone: 'UTC',
        doNotDisturb: {
          enabled: false,
          startTime: '22:00',
          endTime: '08:00'
        },
        ...preferences
      }
      
      return { success: true, data: updatedPreferences }
      
    } catch (error) {
      console.error('Error updating communication preferences:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  }
  
  // Automated Messaging
  
  static async processAutomatedMessages(): Promise<{
    success: boolean
    data?: { processed: number; sent: number; failed: number }
    error?: string
  }> {
    try {
      await connectToDatabase()
      
      console.log('Processing automated messages...')
      
      // In production, this would:
      // 1. Check for trigger conditions (bookings, check-ins, etc.)
      // 2. Match against templates with automation rules
      // 3. Generate and send messages
      // 4. Log results
      
      const results = {
        processed: Math.floor(Math.random() * 20) + 5,
        sent: Math.floor(Math.random() * 15) + 3,
        failed: Math.floor(Math.random() * 3)
      }
      
      await auditLogger.logUserAction({
        userId: 'system',
        action: 'process_automated_messages',
        resource: 'automation',
        ip: 'internal',
        userAgent: 'system',
        details: results
      })
      
      return { success: true, data: results }
      
    } catch (error) {
      console.error('Error processing automated messages:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  }
  
  // Bulk Messaging
  
  static async createBulkMessage(bulkMessageData: Omit<BulkMessage, 'id' | 'createdAt' | 'updatedAt' | 'sentCount' | 'deliveredCount' | 'failedCount'>): Promise<{
    success: boolean
    data?: BulkMessage
    error?: string
  }> {
    try {
      await connectToDatabase()
      
      const newBulkMessage: BulkMessage = {
        ...bulkMessageData,
        id: new mongoose.Types.ObjectId().toString(),
        sentCount: 0,
        deliveredCount: 0,
        failedCount: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      }
      
      console.log('Creating bulk message:', newBulkMessage.name)
      
      return { success: true, data: newBulkMessage }
      
    } catch (error) {
      console.error('Error creating bulk message:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  }
  
  // Analytics
  
  static async getCommunicationAnalytics(propertyId: string, timeframe: '7d' | '30d' | '90d' = '30d'): Promise<{
    success: boolean
    data?: {
      summary: {
        totalMessages: number
        sentMessages: number
        receivedMessages: number
        responseRate: number
        averageResponseTime: number
      }
      byChannel: { [channel: string]: number }
      byType: { [type: string]: number }
      trends: {
        date: string
        sent: number
        received: number
        responseTime: number
      }[]
      satisfaction: {
        averageRating: number
        totalRatings: number
        distribution: { [rating: number]: number }
      }
    }
    error?: string
  }> {
    try {
      await connectToDatabase()
      
      // Generate mock analytics data
      const days = timeframe === '7d' ? 7 : timeframe === '30d' ? 30 : 90
      const trends = []
      
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date()
        date.setDate(date.getDate() - i)
        
        trends.push({
          date: date.toISOString().split('T')[0],
          sent: Math.floor(Math.random() * 50) + 10,
          received: Math.floor(Math.random() * 30) + 5,
          responseTime: Math.floor(Math.random() * 60) + 15
        })
      }
      
      const analytics = {
        summary: {
          totalMessages: Math.floor(Math.random() * 1000) + 200,
          sentMessages: Math.floor(Math.random() * 600) + 150,
          receivedMessages: Math.floor(Math.random() * 400) + 50,
          responseRate: Math.floor(Math.random() * 30) + 70,
          averageResponseTime: Math.floor(Math.random() * 60) + 30
        },
        byChannel: {
          email: Math.floor(Math.random() * 300) + 100,
          sms: Math.floor(Math.random() * 200) + 80,
          whatsapp: Math.floor(Math.random() * 150) + 50,
          in_app: Math.floor(Math.random() * 100) + 30
        },
        byType: {
          pre_arrival: Math.floor(Math.random() * 100) + 50,
          check_in: Math.floor(Math.random() * 80) + 40,
          during_stay: Math.floor(Math.random() * 120) + 60,
          check_out: Math.floor(Math.random() * 70) + 30,
          post_stay: Math.floor(Math.random() * 90) + 45,
          support: Math.floor(Math.random() * 60) + 20
        },
        trends,
        satisfaction: {
          averageRating: 4.2 + Math.random() * 0.6,
          totalRatings: Math.floor(Math.random() * 200) + 50,
          distribution: {
            1: Math.floor(Math.random() * 5) + 1,
            2: Math.floor(Math.random() * 8) + 2,
            3: Math.floor(Math.random() * 15) + 5,
            4: Math.floor(Math.random() * 40) + 20,
            5: Math.floor(Math.random() * 60) + 30
          }
        }
      }
      
      return { success: true, data: analytics }
      
    } catch (error) {
      console.error('Error fetching communication analytics:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  }
  
  // Helper Methods
  
  private static groupBy(items: any[], key: string): { [key: string]: number } {
    return items.reduce((acc, item) => {
      const value = item[key]
      acc[value] = (acc[value] || 0) + 1
      return acc
    }, {})
  }
}

export default GuestCommunicationService