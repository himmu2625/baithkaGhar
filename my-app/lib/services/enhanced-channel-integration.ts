/**
 * Enhanced Channel Manager and PMS Integration System
 * Advanced integration with multiple booking channels and property management systems
 */

import dbConnect from "@/lib/db/dbConnect"
import Booking from "@/models/Booking"
import Property from "@/models/Property"
import { webSocketManager } from "./websocket-notifications"

export interface ChannelConfig {
  channelId: string
  channelName: string
  enabled: boolean
  credentials: {
    apiKey?: string
    secretKey?: string
    username?: string
    password?: string
    endpoint?: string
    propertyCode?: string
  }
  syncSettings: {
    syncRates: boolean
    syncAvailability: boolean
    syncBookings: boolean
    syncRestrictions: boolean
    autoSync: boolean
    syncInterval: number // minutes
  }
  mapping: {
    roomTypeMapping: Record<string, string>
    rateCodeMapping: Record<string, string>
    statusMapping: Record<string, string>
  }
  lastSync?: Date
  errors?: string[]
}

export interface PMSConfig {
  pmsId: string
  pmsName: string
  enabled: boolean
  credentials: {
    endpoint: string
    username: string
    password: string
    hotelCode?: string
    chainCode?: string
  }
  features: {
    reservations: boolean
    housekeeping: boolean
    guestProfiles: boolean
    reporting: boolean
    billing: boolean
  }
  syncSettings: {
    autoSync: boolean
    syncInterval: number
    conflictResolution: 'channel_wins' | 'pms_wins' | 'manual'
  }
  lastSync?: Date
}

export interface SyncResult {
  success: boolean
  channelId: string
  operation: 'rates' | 'availability' | 'bookings' | 'restrictions'
  processed: number
  errors: string[]
  warnings: string[]
  timestamp: Date
  duration: number
}

export interface BookingSyncData {
  externalId: string
  channelBookingId: string
  channel: string
  status: string
  guestInfo: {
    firstName: string
    lastName: string
    email?: string
    phone?: string
    nationality?: string
  }
  stayInfo: {
    checkIn: string
    checkOut: string
    adults: number
    children: number
    roomType: string
    rateCode: string
  }
  pricing: {
    totalAmount: number
    currency: string
    breakdown: Array<{
      date: string
      amount: number
      taxes?: number
    }>
  }
  specialRequests?: string
  channelCommission?: number
}

class EnhancedChannelIntegration {
  private channels: Map<string, ChannelConfig> = new Map()
  private pmsConfigs: Map<string, PMSConfig> = new Map()
  private syncQueues: Map<string, any[]> = new Map()
  private rateLimits: Map<string, { requests: number; resetTime: number }> = new Map()

  constructor() {
    this.initializeDefaultChannels()
  }

  private initializeDefaultChannels() {
    // Booking.com Integration
    this.channels.set('booking.com', {
      channelId: 'booking.com',
      channelName: 'Booking.com',
      enabled: false,
      credentials: {
        endpoint: 'https://supply-xml.booking.com/hotels/xml/',
        username: '',
        password: ''
      },
      syncSettings: {
        syncRates: true,
        syncAvailability: true,
        syncBookings: true,
        syncRestrictions: true,
        autoSync: true,
        syncInterval: 30
      },
      mapping: {
        roomTypeMapping: {},
        rateCodeMapping: {},
        statusMapping: {
          'confirmed': 'ok',
          'cancelled': 'cancelled',
          'modified': 'modified'
        }
      }
    })

    // Expedia Integration
    this.channels.set('expedia', {
      channelId: 'expedia',
      channelName: 'Expedia',
      enabled: false,
      credentials: {
        endpoint: 'https://services.expediapartnercentral.com/',
        username: '',
        password: ''
      },
      syncSettings: {
        syncRates: true,
        syncAvailability: true,
        syncBookings: true,
        syncRestrictions: true,
        autoSync: true,
        syncInterval: 45
      },
      mapping: {
        roomTypeMapping: {},
        rateCodeMapping: {},
        statusMapping: {
          'confirmed': 'Booked',
          'cancelled': 'Cancelled',
          'modified': 'Modified'
        }
      }
    })

    // Agoda Integration
    this.channels.set('agoda', {
      channelId: 'agoda',
      channelName: 'Agoda',
      enabled: false,
      credentials: {
        endpoint: 'https://ycapisandbox.agoda.com/',
        username: '',
        password: ''
      },
      syncSettings: {
        syncRates: true,
        syncAvailability: true,
        syncBookings: true,
        syncRestrictions: false,
        autoSync: true,
        syncInterval: 60
      },
      mapping: {
        roomTypeMapping: {},
        rateCodeMapping: {},
        statusMapping: {}
      }
    })
  }

  /**
   * Configure a channel integration
   */
  async configureChannel(propertyId: string, channelConfig: ChannelConfig): Promise<boolean> {
    try {
      console.log(`🔧 [ChannelIntegration] Configuring ${channelConfig.channelName} for property ${propertyId}`)

      // Validate credentials
      const isValid = await this.validateChannelCredentials(channelConfig)
      if (!isValid) {
        throw new Error('Invalid channel credentials')
      }

      // Store configuration
      this.channels.set(`${propertyId}_${channelConfig.channelId}`, channelConfig)

      // Test connection
      const testResult = await this.testChannelConnection(channelConfig)
      if (!testResult.success) {
        throw new Error(`Connection test failed: ${testResult.error}`)
      }

      // Start auto-sync if enabled
      if (channelConfig.syncSettings.autoSync) {
        this.scheduleSync(propertyId, channelConfig.channelId)
      }

      console.log(`✅ [ChannelIntegration] ${channelConfig.channelName} configured successfully`)
      return true

    } catch (error: any) {
      console.error(`❌ [ChannelIntegration] Configuration failed:`, error)
      return false
    }
  }

  /**
   * Sync bookings from all configured channels
   */
  async syncAllBookings(propertyId: string): Promise<SyncResult[]> {
    const results: SyncResult[] = []

    try {
      await dbConnect()

      const propertyChannels = Array.from(this.channels.entries())
        .filter(([key, config]) => key.startsWith(`${propertyId}_`) && config.enabled)

      for (const [key, config] of propertyChannels) {
        try {
          const result = await this.syncBookingsFromChannel(propertyId, config)
          results.push(result)
        } catch (error: any) {
          results.push({
            success: false,
            channelId: config.channelId,
            operation: 'bookings',
            processed: 0,
            errors: [error.message],
            warnings: [],
            timestamp: new Date(),
            duration: 0
          })
        }
      }

      // Notify about sync completion
      await webSocketManager.notifyAutomationTriggered(
        'Channel Booking Sync',
        [],
        {
          successful: results.filter(r => r.success).length,
          failed: results.filter(r => !r.success).length,
          totalProcessed: results.reduce((sum, r) => sum + r.processed, 0)
        }
      )

      return results

    } catch (error: any) {
      console.error('❌ [ChannelIntegration] Sync all bookings failed:', error)
      return results
    }
  }

  /**
   * Sync bookings from a specific channel
   */
  private async syncBookingsFromChannel(propertyId: string, config: ChannelConfig): Promise<SyncResult> {
    const startTime = Date.now()
    const result: SyncResult = {
      success: false,
      channelId: config.channelId,
      operation: 'bookings',
      processed: 0,
      errors: [],
      warnings: [],
      timestamp: new Date(),
      duration: 0
    }

    try {
      console.log(`🔄 [ChannelIntegration] Syncing bookings from ${config.channelName}`)

      // Check rate limiting
      if (!this.checkRateLimit(config.channelId)) {
        throw new Error('Rate limit exceeded')
      }

      // Fetch bookings from channel
      const channelBookings = await this.fetchBookingsFromChannel(config)
      console.log(`📥 [ChannelIntegration] Retrieved ${channelBookings.length} bookings from ${config.channelName}`)

      // Process each booking
      for (const channelBooking of channelBookings) {
        try {
          await this.processChannelBooking(propertyId, channelBooking, config)
          result.processed++
        } catch (error: any) {
          result.errors.push(`Booking ${channelBooking.channelBookingId}: ${error.message}`)
        }
      }

      // Update last sync time
      config.lastSync = new Date()
      result.success = true

      console.log(`✅ [ChannelIntegration] Processed ${result.processed} bookings from ${config.channelName}`)

    } catch (error: any) {
      console.error(`❌ [ChannelIntegration] Sync failed for ${config.channelName}:`, error)
      result.errors.push(error.message)
    } finally {
      result.duration = Date.now() - startTime
    }

    return result
  }

  /**
   * Fetch bookings from external channel
   */
  private async fetchBookingsFromChannel(config: ChannelConfig): Promise<BookingSyncData[]> {
    // This would implement the actual API calls to each channel
    // For now, returning mock data structure

    switch (config.channelId) {
      case 'booking.com':
        return this.fetchFromBookingDotCom(config)
      case 'expedia':
        return this.fetchFromExpedia(config)
      case 'agoda':
        return this.fetchFromAgoda(config)
      default:
        return []
    }
  }

  /**
   * Booking.com API integration
   */
  private async fetchFromBookingDotCom(config: ChannelConfig): Promise<BookingSyncData[]> {
    try {
      const { username, password, endpoint } = config.credentials

      // Mock implementation - in production, this would make actual API calls
      const xmlRequest = `
        <?xml version="1.0" encoding="UTF-8"?>
        <request>
          <username>${username}</username>
          <password>${password}</password>
          <reservations_pull>
            <from_date>${new Date(Date.now() - 7*24*60*60*1000).toISOString().split('T')[0]}</from_date>
            <to_date>${new Date().toISOString().split('T')[0]}</to_date>
          </reservations_pull>
        </request>
      `

      // Simulate API call
      console.log(`🔗 [Booking.com] Fetching reservations...`)
      
      // In production, you would:
      // const response = await fetch(endpoint, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/xml' },
      //   body: xmlRequest
      // })

      // Mock response parsing
      return [
        {
          externalId: 'BDC_12345',
          channelBookingId: '12345',
          channel: 'booking.com',
          status: 'confirmed',
          guestInfo: {
            firstName: 'John',
            lastName: 'Doe',
            email: 'john.doe@email.com',
            phone: '+1234567890'
          },
          stayInfo: {
            checkIn: '2024-03-15',
            checkOut: '2024-03-17',
            adults: 2,
            children: 0,
            roomType: 'deluxe',
            rateCode: 'BAR'
          },
          pricing: {
            totalAmount: 15000,
            currency: 'INR',
            breakdown: [
              { date: '2024-03-15', amount: 7500 },
              { date: '2024-03-16', amount: 7500 }
            ]
          },
          channelCommission: 1800
        }
      ]

    } catch (error) {
      console.error('❌ [Booking.com] API error:', error)
      return []
    }
  }

  /**
   * Expedia API integration
   */
  private async fetchFromExpedia(config: ChannelConfig): Promise<BookingSyncData[]> {
    try {
      // Mock Expedia API integration
      console.log(`🔗 [Expedia] Fetching reservations...`)
      
      return [
        {
          externalId: 'EXP_67890',
          channelBookingId: '67890',
          channel: 'expedia',
          status: 'confirmed',
          guestInfo: {
            firstName: 'Jane',
            lastName: 'Smith',
            email: 'jane.smith@email.com',
            phone: '+0987654321'
          },
          stayInfo: {
            checkIn: '2024-03-20',
            checkOut: '2024-03-22',
            adults: 1,
            children: 0,
            roomType: 'standard',
            rateCode: 'ADVANCE'
          },
          pricing: {
            totalAmount: 12000,
            currency: 'INR',
            breakdown: [
              { date: '2024-03-20', amount: 6000 },
              { date: '2024-03-21', amount: 6000 }
            ]
          },
          channelCommission: 1200
        }
      ]

    } catch (error) {
      console.error('❌ [Expedia] API error:', error)
      return []
    }
  }

  /**
   * Agoda API integration
   */
  private async fetchFromAgoda(config: ChannelConfig): Promise<BookingSyncData[]> {
    try {
      console.log(`🔗 [Agoda] Fetching reservations...`)
      
      // Mock Agoda implementation
      return []

    } catch (error) {
      console.error('❌ [Agoda] API error:', error)
      return []
    }
  }

  /**
   * Process individual channel booking
   */
  private async processChannelBooking(
    propertyId: string, 
    channelBooking: BookingSyncData, 
    config: ChannelConfig
  ) {
    try {
      // Check if booking already exists
      const existingBooking = await Booking.findOne({
        $or: [
          { 'channelData.externalId': channelBooking.externalId },
          { 'channelData.channelBookingId': channelBooking.channelBookingId }
        ]
      })

      if (existingBooking) {
        // Update existing booking if status changed
        if (existingBooking.channelData.status !== channelBooking.status) {
          await this.updateBookingFromChannel(existingBooking, channelBooking)
        }
        return
      }

      // Create new booking from channel data
      await this.createBookingFromChannel(propertyId, channelBooking, config)

    } catch (error) {
      console.error(`❌ [ChannelIntegration] Error processing booking ${channelBooking.channelBookingId}:`, error)
      throw error
    }
  }

  /**
   * Create new booking from channel data
   */
  private async createBookingFromChannel(
    propertyId: string, 
    channelBooking: BookingSyncData, 
    config: ChannelConfig
  ) {
    try {
      // Find or create guest user
      let guestUser = await this.findOrCreateGuestUser(channelBooking.guestInfo)

      // Map room type and rate code
      const mappedRoomType = config.mapping.roomTypeMapping[channelBooking.stayInfo.roomType] || channelBooking.stayInfo.roomType
      const mappedRateCode = config.mapping.rateCodeMapping[channelBooking.stayInfo.rateCode] || channelBooking.stayInfo.rateCode

      // Create booking
      const booking = new Booking({
        userId: guestUser._id,
        propertyId: propertyId,
        status: 'confirmed', // Channel bookings are typically confirmed
        dateFrom: new Date(channelBooking.stayInfo.checkIn),
        dateTo: new Date(channelBooking.stayInfo.checkOut),
        guests: channelBooking.stayInfo.adults + channelBooking.stayInfo.children,
        totalPrice: channelBooking.pricing.totalAmount,
        paymentStatus: 'completed', // Channel bookings are pre-paid
        
        // Channel-specific data
        channelData: {
          channel: channelBooking.channel,
          externalId: channelBooking.externalId,
          channelBookingId: channelBooking.channelBookingId,
          status: channelBooking.status,
          roomType: mappedRoomType,
          rateCode: mappedRateCode,
          commission: channelBooking.channelCommission,
          rawData: channelBooking
        },

        contactDetails: {
          name: `${channelBooking.guestInfo.firstName} ${channelBooking.guestInfo.lastName}`,
          email: channelBooking.guestInfo.email || '',
          phone: channelBooking.guestInfo.phone || ''
        },

        specialRequests: channelBooking.specialRequests,
        
        // Mark as channel booking
        isChannelBooking: true,
        adminNotes: `Imported from ${channelBooking.channel} (${channelBooking.channelBookingId})`
      })

      await booking.save()

      console.log(`✅ [ChannelIntegration] Created booking ${booking._id} from ${channelBooking.channel}`)

      // Send notification
      await webSocketManager.notifyBookingCreated(booking, [])

    } catch (error) {
      console.error(`❌ [ChannelIntegration] Failed to create booking:`, error)
      throw error
    }
  }

  /**
   * Update existing booking from channel
   */
  private async updateBookingFromChannel(existingBooking: any, channelBooking: BookingSyncData) {
    try {
      const oldStatus = existingBooking.status
      const newStatus = this.mapChannelStatusToLocal(channelBooking.status)

      if (oldStatus !== newStatus) {
        existingBooking.status = newStatus
        existingBooking.channelData.status = channelBooking.status
        existingBooking.adminNotes += `\nStatus updated from ${channelBooking.channel}: ${oldStatus} → ${newStatus}`
        
        await existingBooking.save()

        console.log(`📝 [ChannelIntegration] Updated booking ${existingBooking._id} status: ${oldStatus} → ${newStatus}`)

        // Send notification
        await webSocketManager.notifyBookingUpdated(existingBooking, oldStatus, newStatus)
      }
    } catch (error) {
      console.error(`❌ [ChannelIntegration] Failed to update booking:`, error)
      throw error
    }
  }

  /**
   * Find or create guest user from channel data
   */
  private async findOrCreateGuestUser(guestInfo: BookingSyncData['guestInfo']) {
    const User = require('@/models/User').default

    let user = null

    // Try to find existing user by email
    if (guestInfo.email) {
      user = await User.findOne({ email: guestInfo.email })
    }

    // Create new user if not found
    if (!user) {
      user = new User({
        name: `${guestInfo.firstName} ${guestInfo.lastName}`,
        email: guestInfo.email || `${guestInfo.firstName.toLowerCase()}.${guestInfo.lastName.toLowerCase()}@guest.local`,
        phone: guestInfo.phone,
        isChannelGuest: true,
        channelGuestInfo: {
          firstName: guestInfo.firstName,
          lastName: guestInfo.lastName,
          nationality: guestInfo.nationality
        }
      })

      await user.save()
      console.log(`👤 [ChannelIntegration] Created guest user: ${user.name}`)
    }

    return user
  }

  /**
   * Map channel status to local booking status
   */
  private mapChannelStatusToLocal(channelStatus: string): string {
    const statusMapping: Record<string, string> = {
      'ok': 'confirmed',
      'confirmed': 'confirmed',
      'cancelled': 'cancelled',
      'modified': 'confirmed',
      'no-show': 'cancelled'
    }

    return statusMapping[channelStatus.toLowerCase()] || 'confirmed'
  }

  /**
   * Validate channel credentials
   */
  private async validateChannelCredentials(config: ChannelConfig): Promise<boolean> {
    // Mock validation - in production, would test actual API connection
    const requiredFields = ['endpoint']
    
    switch (config.channelId) {
      case 'booking.com':
        requiredFields.push('username', 'password')
        break
      case 'expedia':
        requiredFields.push('username', 'password')
        break
      case 'agoda':
        requiredFields.push('username', 'password')
        break
    }

    return requiredFields.every(field => config.credentials[field as keyof typeof config.credentials])
  }

  /**
   * Test channel connection
   */
  private async testChannelConnection(config: ChannelConfig): Promise<{ success: boolean; error?: string }> {
    try {
      // Mock connection test
      console.log(`🧪 [ChannelIntegration] Testing connection to ${config.channelName}`)
      
      // In production, would make actual test API call
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  /**
   * Check rate limiting for channel
   */
  private checkRateLimit(channelId: string): boolean {
    const now = Date.now()
    const limit = this.rateLimits.get(channelId)
    
    if (!limit || now > limit.resetTime) {
      // Reset rate limit counter
      this.rateLimits.set(channelId, {
        requests: 1,
        resetTime: now + (60 * 1000) // 1 minute window
      })
      return true
    }
    
    if (limit.requests >= 10) { // 10 requests per minute
      return false
    }
    
    limit.requests++
    return true
  }

  /**
   * Schedule automatic sync
   */
  private scheduleSync(propertyId: string, channelId: string) {
    const config = this.channels.get(`${propertyId}_${channelId}`)
    if (!config || !config.syncSettings.autoSync) return

    const intervalMs = config.syncSettings.syncInterval * 60 * 1000

    setInterval(async () => {
      try {
        await this.syncBookingsFromChannel(propertyId, config)
      } catch (error) {
        console.error(`❌ [ChannelIntegration] Scheduled sync failed for ${channelId}:`, error)
      }
    }, intervalMs)

    console.log(`⏰ [ChannelIntegration] Scheduled sync for ${channelId} every ${config.syncSettings.syncInterval} minutes`)
  }

  /**
   * Get sync statistics
   */
  async getSyncStats(): Promise<any> {
    const stats = {
      totalChannels: this.channels.size,
      activeChannels: Array.from(this.channels.values()).filter(c => c.enabled).length,
      lastSyncTimes: Array.from(this.channels.entries()).map(([key, config]) => ({
        channel: key,
        lastSync: config.lastSync,
        nextSync: config.syncSettings.autoSync ? 
          new Date((config.lastSync?.getTime() || 0) + config.syncSettings.syncInterval * 60 * 1000) : null
      })),
      errorCounts: Array.from(this.channels.values()).reduce((acc, config) => {
        acc[config.channelId] = config.errors?.length || 0
        return acc
      }, {} as Record<string, number>)
    }

    return stats
  }

  /**
   * Manual sync trigger for testing
   */
  async triggerManualSync(propertyId: string, channelId?: string): Promise<SyncResult[]> {
    if (channelId) {
      const config = this.channels.get(`${propertyId}_${channelId}`)
      if (!config) {
        throw new Error(`Channel ${channelId} not found`)
      }
      
      return [await this.syncBookingsFromChannel(propertyId, config)]
    } else {
      return await this.syncAllBookings(propertyId)
    }
  }
}

// Export singleton instance
export const enhancedChannelIntegration = new EnhancedChannelIntegration()

export default EnhancedChannelIntegration