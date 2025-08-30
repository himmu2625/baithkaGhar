import { connectToDatabase } from '@/lib/db/enhanced-mongodb'
import OTAChannelConfig from '@/models/OTAChannelConfig'
import OTAPropertyConfig from '@/models/OTAPropertyConfig'
import Property from '@/models/Property'
import Room from '@/models/Room'
import RoomAvailability from '@/models/RoomAvailability'
import { ObjectId } from 'mongodb'

// Real OTA channel connectors
import { BookingComChannel } from './connectors/booking-com-channel'
import { ExpediaChannel } from './connectors/expedia-channel'
import { AgodaChannel } from './connectors/agoda-channel'

export interface OTAChannel {
  id: string
  name: string
  type: string
  status: 'active' | 'inactive' | 'error' | 'testing'
  credentials: {
    [key: string]: any
  }
  lastSync?: Date
  syncStatus?: 'success' | 'failed' | 'pending' | 'syncing'
  errorMessage?: string
  configuration?: {
    [key: string]: any
  }
}

export interface SyncResult {
  success: boolean
  message: string
  syncedRooms?: number
  syncedRates?: number
  syncedInventory?: number
  errors?: string[]
  warnings?: string[]
  timestamp: Date
  channelId: string
  propertyId: string
  syncType: 'inventory' | 'rates' | 'availability' | 'all'
}

export interface RoomMapping {
  internalRoomId: string
  internalRoomType: string
  channelRoomId: string
  channelRoomType: string
  ratePlanId: string
  isActive: boolean
}

export interface RateMapping {
  internalRateId: string
  channelRateId: string
  ratePlanName: string
  baseRate: number
  channelSpecificRates?: {
    [channelId: string]: number
  }
}

export interface PropertyMapping {
  internalPropertyId: string
  channelPropertyId: string
  channelPropertyName: string
  isActive: boolean
}

export interface SyncConfig {
  autoSync: boolean
  syncFrequency: number // minutes
  syncTypes: ('inventory' | 'rates' | 'availability')[]
  retryAttempts: number
  notificationSettings: {
    onSuccess: boolean
    onError: boolean
    emailRecipients: string[]
  }
}

export interface ChannelCredentials {
  [key: string]: any
}

export class OTACoreService {
  private static instance: OTACoreService
  private channelConnectors: Map<string, any>
  
  private constructor() {
    this.channelConnectors = new Map()
    this.initializeConnectors()
  }
  
  public static getInstance(): OTACoreService {
    if (!OTACoreService.instance) {
      OTACoreService.instance = new OTACoreService()
    }
    return OTACoreService.instance
  }

  private initializeConnectors() {
    this.channelConnectors.set('booking-com', new BookingComChannel())
    this.channelConnectors.set('expedia', new ExpediaChannel())  
    this.channelConnectors.set('agoda', new AgodaChannel())
  }

  /**
   * Get all configured OTA channels for a property
   */
  async getPropertyOTAChannels(propertyId: string): Promise<OTAChannel[]> {
    try {
      await connectToDatabase()
      
      const configs = await OTAPropertyConfig.find({ propertyId })
        .populate('channelId')
        .lean()
      
      return configs
        .filter(config => config.channelId)
        .map(config => ({
          id: config.channelId._id.toString(),
          name: config.channelId.name,
          type: config.channelId.type,
          status: config.status,
          credentials: config.credentials,
          lastSync: config.lastSync,
          syncStatus: config.syncStatus,
          errorMessage: config.errorMessage,
          configuration: config.configuration
        }))
    } catch (error) {
      console.error('Error fetching property OTA channels:', error)
      return []
    }
  }

  /**
   * Sync property inventory with OTA channels
   */
  async syncInventory(propertyId: string, channels?: string[]): Promise<SyncResult[]> {
    try {
      await connectToDatabase()
      
      // Get property and rooms
      const property = await Property.findById(propertyId).lean()
      if (!property) {
        throw new Error('Property not found')
      }

      const rooms = await Room.find({ propertyId }).lean()
      if (!rooms || rooms.length === 0) {
        throw new Error('No rooms found for property')
      }

      // Get OTA channels for this property
      let otaChannels = await this.getPropertyOTAChannels(propertyId)
      
      // Filter by specific channels if requested
      if (channels && channels.length > 0) {
        otaChannels = otaChannels.filter(channel => channels.includes(channel.id))
      }

      const results: SyncResult[] = []

      // Sync with each channel
      for (const channel of otaChannels) {
        try {
          const connector = this.channelConnectors.get(channel.type)
          if (!connector) {
            results.push({
              success: false,
              message: `No connector available for ${channel.name}`,
              errors: [`Connector not implemented for ${channel.type}`],
              timestamp: new Date(),
              channelId: channel.id,
              propertyId,
              syncType: 'inventory'
            })
            continue
          }

          // Update sync status to syncing
          await this.updateChannelSyncStatus(propertyId, channel.id, 'syncing')

          // Perform inventory sync
          const syncResult = await connector.syncInventory({
            property,
            rooms,
            credentials: channel.credentials,
            configuration: channel.configuration
          })

          // Update sync status based on result
          await this.updateChannelSyncStatus(
            propertyId, 
            channel.id, 
            syncResult.success ? 'success' : 'failed',
            syncResult.success ? null : syncResult.message
          )

          results.push({
            ...syncResult,
            timestamp: new Date(),
            channelId: channel.id,
            propertyId,
            syncType: 'inventory'
          })

        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error'
          
          // Update sync status to failed
          await this.updateChannelSyncStatus(propertyId, channel.id, 'failed', errorMessage)
          
          results.push({
            success: false,
            message: `Inventory sync failed for ${channel.name}`,
            errors: [errorMessage],
            timestamp: new Date(),
            channelId: channel.id,
            propertyId,
            syncType: 'inventory'
          })
        }
      }

      return results
    } catch (error) {
      console.error('Error syncing inventory:', error)
      return [{
        success: false,
        message: 'Inventory sync failed',
        errors: [error instanceof Error ? error.message : 'Unknown error'],
        timestamp: new Date(),
        channelId: '',
        propertyId,
        syncType: 'inventory'
      }]
    }
  }

  /**
   * Sync rates and pricing with OTA channels
   */
  async syncRates(propertyId: string, channels?: string[]): Promise<SyncResult[]> {
    try {
      await connectToDatabase()
      
      const property = await Property.findById(propertyId).lean()
      if (!property) {
        throw new Error('Property not found')
      }

      const rooms = await Room.find({ propertyId }).lean()
      
      let otaChannels = await this.getPropertyOTAChannels(propertyId)
      
      if (channels && channels.length > 0) {
        otaChannels = otaChannels.filter(channel => channels.includes(channel.id))
      }

      const results: SyncResult[] = []

      for (const channel of otaChannels) {
        try {
          const connector = this.channelConnectors.get(channel.type)
          if (!connector) {
            results.push({
              success: false,
              message: `No connector available for ${channel.name}`,
              errors: [`Connector not implemented for ${channel.type}`],
              timestamp: new Date(),
              channelId: channel.id,
              propertyId,
              syncType: 'rates'
            })
            continue
          }

          await this.updateChannelSyncStatus(propertyId, channel.id, 'syncing')

          const syncResult = await connector.syncRates({
            property,
            rooms,
            credentials: channel.credentials,
            configuration: channel.configuration
          })

          await this.updateChannelSyncStatus(
            propertyId,
            channel.id,
            syncResult.success ? 'success' : 'failed',
            syncResult.success ? null : syncResult.message
          )

          results.push({
            ...syncResult,
            timestamp: new Date(),
            channelId: channel.id,
            propertyId,
            syncType: 'rates'
          })

        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error'
          
          await this.updateChannelSyncStatus(propertyId, channel.id, 'failed', errorMessage)
          
          results.push({
            success: false,
            message: `Rate sync failed for ${channel.name}`,
            errors: [errorMessage],
            timestamp: new Date(),
            channelId: channel.id,
            propertyId,
            syncType: 'rates'
          })
        }
      }

      return results
    } catch (error) {
      console.error('Error syncing rates:', error)
      return [{
        success: false,
        message: 'Rate sync failed',
        errors: [error instanceof Error ? error.message : 'Unknown error'],
        timestamp: new Date(),
        channelId: '',
        propertyId,
        syncType: 'rates'
      }]
    }
  }

  /**
   * Sync availability with OTA channels
   */
  async syncAvailability(propertyId: string, channels?: string[], dateRange?: { start: Date, end: Date }): Promise<SyncResult[]> {
    try {
      await connectToDatabase()
      
      const property = await Property.findById(propertyId).lean()
      if (!property) {
        throw new Error('Property not found')
      }

      // Get availability data
      const startDate = dateRange?.start || new Date()
      const endDate = dateRange?.end || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year ahead

      const availability = await RoomAvailability.find({
        propertyId,
        date: { $gte: startDate, $lte: endDate }
      }).lean()

      let otaChannels = await this.getPropertyOTAChannels(propertyId)
      
      if (channels && channels.length > 0) {
        otaChannels = otaChannels.filter(channel => channels.includes(channel.id))
      }

      const results: SyncResult[] = []

      for (const channel of otaChannels) {
        try {
          const connector = this.channelConnectors.get(channel.type)
          if (!connector) {
            results.push({
              success: false,
              message: `No connector available for ${channel.name}`,
              errors: [`Connector not implemented for ${channel.type}`],
              timestamp: new Date(),
              channelId: channel.id,
              propertyId,
              syncType: 'availability'
            })
            continue
          }

          await this.updateChannelSyncStatus(propertyId, channel.id, 'syncing')

          const syncResult = await connector.syncAvailability({
            property,
            availability,
            dateRange: { start: startDate, end: endDate },
            credentials: channel.credentials,
            configuration: channel.configuration
          })

          await this.updateChannelSyncStatus(
            propertyId,
            channel.id,
            syncResult.success ? 'success' : 'failed',
            syncResult.success ? null : syncResult.message
          )

          results.push({
            ...syncResult,
            timestamp: new Date(),
            channelId: channel.id,
            propertyId,
            syncType: 'availability'
          })

        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error'
          
          await this.updateChannelSyncStatus(propertyId, channel.id, 'failed', errorMessage)
          
          results.push({
            success: false,
            message: `Availability sync failed for ${channel.name}`,
            errors: [errorMessage],
            timestamp: new Date(),
            channelId: channel.id,
            propertyId,
            syncType: 'availability'
          })
        }
      }

      return results
    } catch (error) {
      console.error('Error syncing availability:', error)
      return [{
        success: false,
        message: 'Availability sync failed',
        errors: [error instanceof Error ? error.message : 'Unknown error'],
        timestamp: new Date(),
        channelId: '',
        propertyId,
        syncType: 'availability'
      }]
    }
  }

  /**
   * Test connection to an OTA channel
   */
  async testConnection(channelId: string, credentials: any): Promise<{ success: boolean; message: string; details?: any }> {
    try {
      const channel = await OTAChannelConfig.findById(channelId).lean()
      if (!channel) {
        throw new Error('Channel configuration not found')
      }

      const connector = this.channelConnectors.get(channel.type)
      if (!connector) {
        throw new Error(`Connector not available for ${channel.name}`)
      }

      const result = await connector.testConnection(credentials)
      
      return {
        success: result.success,
        message: result.message,
        details: result.details
      }
    } catch (error) {
      return {
        success: false,
        message: `Connection test failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }
  }

  /**
   * Get sync status for all channels
   */
  async getSyncStatus(propertyId: string): Promise<{[channelId: string]: any}> {
    try {
      await connectToDatabase()
      
      const configs = await OTAPropertyConfig.find({ propertyId })
        .populate('channelId')
        .lean()
      
      const status: {[channelId: string]: any} = {}
      
      for (const config of configs) {
        status[config.channelId._id.toString()] = {
          channelName: config.channelId.name,
          status: config.syncStatus || 'unknown',
          lastSync: config.lastSync,
          errorMessage: config.errorMessage,
          isActive: config.status === 'active',
          configuration: config.configuration
        }
      }
      
      return status
    } catch (error) {
      console.error('Failed to get sync status:', error)
      return {}
    }
  }

  /**
   * Update channel credentials
   */
  async updateChannelCredentials(propertyId: string, channelId: string, credentials: any): Promise<boolean> {
    try {
      await connectToDatabase()
      
      const result = await OTAPropertyConfig.findOneAndUpdate(
        { propertyId, channelId },
        { 
          credentials: credentials,
          updatedAt: new Date()
        },
        { new: true, upsert: true }
      )
      
      return !!result
    } catch (error) {
      console.error('Failed to update credentials:', error)
      return false
    }
  }

  /**
   * Enable/disable OTA channel for property
   */
  async updateChannelStatus(propertyId: string, channelId: string, status: 'active' | 'inactive', configuration?: any): Promise<boolean> {
    try {
      await connectToDatabase()
      
      const updateData: any = {
        status,
        updatedAt: new Date()
      }
      
      if (configuration) {
        updateData.configuration = configuration
      }
      
      const result = await OTAPropertyConfig.findOneAndUpdate(
        { propertyId, channelId },
        updateData,
        { new: true, upsert: true }
      )
      
      return !!result
    } catch (error) {
      console.error('Failed to update channel status:', error)
      return false
    }
  }

  /**
   * Update sync status for a channel
   */
  private async updateChannelSyncStatus(propertyId: string, channelId: string, syncStatus: string, errorMessage?: string): Promise<void> {
    try {
      const updateData: any = {
        syncStatus,
        lastSync: new Date()
      }
      
      if (errorMessage) {
        updateData.errorMessage = errorMessage
      } else {
        updateData.$unset = { errorMessage: 1 }
      }
      
      await OTAPropertyConfig.findOneAndUpdate(
        { propertyId, channelId },
        updateData
      )
    } catch (error) {
      console.error('Failed to update sync status:', error)
    }
  }

  /**
   * Get OTA channel mapping for property
   */
  async getChannelMappings(propertyId: string, channelId: string): Promise<{ rooms: RoomMapping[], rates: RateMapping[] }> {
    try {
      await connectToDatabase()
      
      const config = await OTAPropertyConfig.findOne({ propertyId, channelId }).lean()
      
      return {
        rooms: config?.roomMappings || [],
        rates: config?.rateMappings || []
      }
    } catch (error) {
      console.error('Failed to get channel mappings:', error)
      return { rooms: [], rates: [] }
    }
  }

  /**
   * Update OTA channel mappings
   */
  async updateChannelMappings(
    propertyId: string, 
    channelId: string, 
    mappings: { rooms?: RoomMapping[], rates?: RateMapping[] }
  ): Promise<boolean> {
    try {
      await connectToDatabase()
      
      const updateData: any = {}
      
      if (mappings.rooms) {
        updateData.roomMappings = mappings.rooms
      }
      
      if (mappings.rates) {
        updateData.rateMappings = mappings.rates
      }
      
      const result = await OTAPropertyConfig.findOneAndUpdate(
        { propertyId, channelId },
        updateData,
        { new: true, upsert: true }
      )
      
      return !!result
    } catch (error) {
      console.error('Failed to update channel mappings:', error)
      return false
    }
  }
}

export const otaCoreService = OTACoreService.getInstance()
export default otaCoreService