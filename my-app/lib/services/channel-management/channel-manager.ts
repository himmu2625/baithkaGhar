import { BookingComIntegration, BookingComProperty, BookingComReservation } from './booking-com-integration'
import { AirbnbIntegration, AirbnbProperty, AirbnbReservation } from './airbnb-integration'
import { ExpediaIntegration, ExpediaProperty, ExpediaReservation } from './expedia-integration'

export interface ChannelConfiguration {
  propertyId: string
  channels: {
    bookingCom?: {
      enabled: boolean
      credentials: {
        username: string
        password: string
        propertyId: string
      }
      lastSync: Date
      syncEnabled: boolean
      autoAcceptReservations: boolean
    }
    airbnb?: {
      enabled: boolean
      credentials: {
        accessToken: string
        refreshToken: string
      }
      listingIds: string[]
      lastSync: Date
      syncEnabled: boolean
      autoAcceptReservations: boolean
    }
    expedia?: {
      enabled: boolean
      credentials: {
        username: string
        password: string
        propertyId: string
        testMode: boolean
      }
      lastSync: Date
      syncEnabled: boolean
      autoAcceptReservations: boolean
    }
  }
  rateMapping: {
    [channelRoomId: string]: {
      localRoomTypeId: string
      channelName: string
      markup?: number
      markupType?: 'fixed' | 'percentage'
    }
  }
  inventorySync: {
    enabled: boolean
    frequency: 'realtime' | 'hourly' | 'daily'
    lastSync: Date
    conflictResolution: 'manual' | 'first_come_first_served' | 'priority_based'
  }
  rateSynchronization: {
    enabled: boolean
    baseRateSource: 'manual' | 'channel_manager' | 'pms'
    markupRules: Array<{
      channelName: string
      roomTypeId: string
      markup: number
      markupType: 'fixed' | 'percentage'
      active: boolean
    }>
  }
}

export interface ChannelReservation {
  reservationId: string
  channelReservationId: string
  channelName: 'booking_com' | 'airbnb' | 'expedia'
  propertyId: string
  status: 'confirmed' | 'cancelled' | 'modified' | 'no_show'
  guestDetails: {
    firstName: string
    lastName: string
    email: string
    phone?: string
  }
  roomDetails: {
    roomTypeId: string
    roomTypeName: string
    numberOfRooms: number
    guests: {
      adults: number
      children: number
    }
  }
  stayDetails: {
    checkIn: Date
    checkOut: Date
    nights: number
    totalAmount: number
    commission: number
    netAmount: number
    currency: string
  }
  specialRequests?: string
  createdAt: Date
  lastModified: Date
  syncedToLocal: boolean
  localBookingId?: string
}

export interface InventoryUpdate {
  roomTypeId: string
  date: Date
  availability: number
  rate?: number
  currency?: string
  restrictions?: {
    minimumStay?: number
    maximumStay?: number
    closedToArrival?: boolean
    closedToDeparture?: boolean
    stopSell?: boolean
  }
}

export interface ChannelSyncResult {
  channelName: string
  success: boolean
  itemsProcessed: number
  errors: string[]
  lastSync: Date
}

export class ChannelManager {
  static async syncAllChannels(propertyId: string): Promise<ChannelSyncResult[]> {
    try {
      const config = await this.getChannelConfiguration(propertyId)
      if (!config) {
        throw new Error('Channel configuration not found')
      }

      const syncResults: ChannelSyncResult[] = []

      // Sync Booking.com
      if (config.channels.bookingCom?.enabled && config.channels.bookingCom.syncEnabled) {
        const result = await this.syncBookingCom(config.channels.bookingCom, propertyId)
        syncResults.push(result)
      }

      // Sync Airbnb
      if (config.channels.airbnb?.enabled && config.channels.airbnb.syncEnabled) {
        const result = await this.syncAirbnb(config.channels.airbnb, propertyId)
        syncResults.push(result)
      }

      // Sync Expedia
      if (config.channels.expedia?.enabled && config.channels.expedia.syncEnabled) {
        const result = await this.syncExpedia(config.channels.expedia, propertyId)
        syncResults.push(result)
      }

      // Update last sync time
      await this.updateLastSyncTime(propertyId)

      return syncResults

    } catch (error) {
      console.error('Error syncing channels:', error)
      throw error
    }
  }

  static async updateInventoryAcrossChannels(propertyId: string, updates: InventoryUpdate[]): Promise<{ success: boolean; errors: { [channel: string]: string[] } }> {
    try {
      const config = await this.getChannelConfiguration(propertyId)
      if (!config) {
        throw new Error('Channel configuration not found')
      }

      const errors: { [channel: string]: string[] } = {}

      // Update Booking.com
      if (config.channels.bookingCom?.enabled) {
        try {
          const bookingComUpdates = updates.map(update => ({
            roomTypeId: this.mapToChannelRoomId(update.roomTypeId, 'booking_com', config),
            date: update.date,
            rate: update.rate || 0,
            currency: update.currency || 'USD',
            availability: update.availability,
            restrictions: update.restrictions || {}
          }))

          const result = await BookingComIntegration.updateInventoryAndRates(
            config.channels.bookingCom.credentials,
            bookingComUpdates
          )

          if (!result.success && result.errors) {
            errors.booking_com = result.errors
          }
        } catch (error: any) {
          errors.booking_com = [error.message || 'Update failed']
        }
      }

      // Update Airbnb
      if (config.channels.airbnb?.enabled) {
        try {
          const airbnbUpdates = config.channels.airbnb.listingIds.map(listingId => ({
            listingId,
            updates: updates.map(update => ({
              date: update.date,
              available: update.availability > 0,
              price: update.rate,
              minimumNights: update.restrictions?.minimumStay,
              maximumNights: update.restrictions?.maximumStay
            }))
          }))

          const result = await AirbnbIntegration.updateCalendar(
            config.channels.airbnb.credentials.accessToken,
            airbnbUpdates
          )

          if (!result.success && result.errors) {
            errors.airbnb = result.errors
          }
        } catch (error: any) {
          errors.airbnb = [error.message || 'Update failed']
        }
      }

      // Update Expedia
      if (config.channels.expedia?.enabled) {
        try {
          const expediaUpdates = updates.map(update => ({
            roomTypeId: this.mapToChannelRoomId(update.roomTypeId, 'expedia', config),
            rateTypeId: 'standard', // This would be configurable
            dates: [{
              date: update.date,
              baseRate: update.rate || 0,
              availability: update.availability,
              restrictions: {
                minimumLengthOfStay: update.restrictions?.minimumStay,
                maximumLengthOfStay: update.restrictions?.maximumStay,
                closedToArrival: update.restrictions?.closedToArrival,
                closedToDeparture: update.restrictions?.closedToDeparture,
                stopSell: update.restrictions?.stopSell
              }
            }]
          }))

          const result = await ExpediaIntegration.updateAvailabilityAndRates(
            config.channels.expedia.credentials,
            expediaUpdates
          )

          if (!result.success && result.errors) {
            errors.expedia = result.errors
          }
        } catch (error: any) {
          errors.expedia = [error.message || 'Update failed']
        }
      }

      return {
        success: Object.keys(errors).length === 0,
        errors
      }

    } catch (error) {
      console.error('Error updating inventory across channels:', error)
      throw error
    }
  }

  static async fetchAllReservations(propertyId: string, dateRange?: { from: Date; to: Date }): Promise<ChannelReservation[]> {
    try {
      const config = await this.getChannelConfiguration(propertyId)
      if (!config) {
        throw new Error('Channel configuration not found')
      }

      const allReservations: ChannelReservation[] = []

      // Fetch from Booking.com
      if (config.channels.bookingCom?.enabled) {
        try {
          const result = await BookingComIntegration.fetchReservations(
            config.channels.bookingCom.credentials,
            dateRange || { from: new Date(), to: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) }
          )

          if (result.success && result.reservations) {
            const channelReservations = result.reservations.map(res => this.mapBookingComReservation(res))
            allReservations.push(...channelReservations)
          }
        } catch (error) {
          console.error('Error fetching Booking.com reservations:', error)
        }
      }

      // Fetch from Airbnb
      if (config.channels.airbnb?.enabled) {
        try {
          for (const listingId of config.channels.airbnb.listingIds) {
            const result = await AirbnbIntegration.fetchReservations(
              config.channels.airbnb.credentials.accessToken,
              listingId,
              dateRange
            )

            if (result.success && result.reservations) {
              const channelReservations = result.reservations.map(res => this.mapAirbnbReservation(res))
              allReservations.push(...channelReservations)
            }
          }
        } catch (error) {
          console.error('Error fetching Airbnb reservations:', error)
        }
      }

      // Fetch from Expedia
      if (config.channels.expedia?.enabled) {
        try {
          const result = await ExpediaIntegration.fetchReservations(
            config.channels.expedia.credentials,
            dateRange
          )

          if (result.success && result.reservations) {
            const channelReservations = result.reservations.map(res => this.mapExpediaReservation(res))
            allReservations.push(...channelReservations)
          }
        } catch (error) {
          console.error('Error fetching Expedia reservations:', error)
        }
      }

      return allReservations

    } catch (error) {
      console.error('Error fetching all reservations:', error)
      throw error
    }
  }

  static async confirmReservation(channelName: string, reservationId: string, propertyId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const config = await this.getChannelConfiguration(propertyId)
      if (!config) {
        throw new Error('Channel configuration not found')
      }

      switch (channelName) {
        case 'booking_com':
          if (config.channels.bookingCom?.enabled) {
            return await BookingComIntegration.confirmReservation(
              config.channels.bookingCom.credentials,
              reservationId
            )
          }
          break

        case 'airbnb':
          if (config.channels.airbnb?.enabled) {
            return await AirbnbIntegration.acceptReservation(
              config.channels.airbnb.credentials.accessToken,
              reservationId
            )
          }
          break

        case 'expedia':
          if (config.channels.expedia?.enabled) {
            return await ExpediaIntegration.confirmReservation(
              config.channels.expedia.credentials,
              reservationId,
              'CONF-' + Date.now()
            )
          }
          break

        default:
          return { success: false, error: 'Unknown channel' }
      }

      return { success: false, error: 'Channel not configured' }

    } catch (error: any) {
      console.error('Error confirming reservation:', error)
      return { success: false, error: error.message }
    }
  }

  static async testAllConnections(propertyId: string): Promise<{ [channel: string]: { success: boolean; message: string } }> {
    try {
      const config = await this.getChannelConfiguration(propertyId)
      if (!config) {
        throw new Error('Channel configuration not found')
      }

      const results: { [channel: string]: { success: boolean; message: string } } = {}

      // Test Booking.com
      if (config.channels.bookingCom?.enabled) {
        results.booking_com = await BookingComIntegration.testConnection(
          config.channels.bookingCom.credentials
        )
      }

      // Test Airbnb
      if (config.channels.airbnb?.enabled) {
        results.airbnb = await AirbnbIntegration.testConnection(
          config.channels.airbnb.credentials.accessToken
        )
      }

      // Test Expedia
      if (config.channels.expedia?.enabled) {
        results.expedia = await ExpediaIntegration.testConnection(
          config.channels.expedia.credentials
        )
      }

      return results

    } catch (error) {
      console.error('Error testing connections:', error)
      throw error
    }
  }

  private static async syncBookingCom(config: any, propertyId: string): Promise<ChannelSyncResult> {
    try {
      const result = await BookingComIntegration.fetchReservations(
        config.credentials,
        { from: new Date(), to: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) }
      )

      if (result.success && result.reservations) {
        // Process reservations and sync to local system
        for (const reservation of result.reservations) {
          await this.processChannelReservation(this.mapBookingComReservation(reservation), propertyId)
        }

        return {
          channelName: 'booking_com',
          success: true,
          itemsProcessed: result.reservations.length,
          errors: [],
          lastSync: new Date()
        }
      }

      return {
        channelName: 'booking_com',
        success: false,
        itemsProcessed: 0,
        errors: [result.error || 'Sync failed'],
        lastSync: new Date()
      }

    } catch (error: any) {
      return {
        channelName: 'booking_com',
        success: false,
        itemsProcessed: 0,
        errors: [error.message || 'Sync failed'],
        lastSync: new Date()
      }
    }
  }

  private static async syncAirbnb(config: any, propertyId: string): Promise<ChannelSyncResult> {
    try {
      let totalProcessed = 0
      const errors: string[] = []

      for (const listingId of config.listingIds) {
        const result = await AirbnbIntegration.fetchReservations(
          config.credentials.accessToken,
          listingId
        )

        if (result.success && result.reservations) {
          for (const reservation of result.reservations) {
            await this.processChannelReservation(this.mapAirbnbReservation(reservation), propertyId)
          }
          totalProcessed += result.reservations.length
        } else {
          errors.push(`${listingId}: ${result.error || 'Sync failed'}`)
        }
      }

      return {
        channelName: 'airbnb',
        success: errors.length === 0,
        itemsProcessed: totalProcessed,
        errors,
        lastSync: new Date()
      }

    } catch (error: any) {
      return {
        channelName: 'airbnb',
        success: false,
        itemsProcessed: 0,
        errors: [error.message || 'Sync failed'],
        lastSync: new Date()
      }
    }
  }

  private static async syncExpedia(config: any, propertyId: string): Promise<ChannelSyncResult> {
    try {
      const result = await ExpediaIntegration.fetchReservations(
        config.credentials,
        { from: new Date(), to: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) }
      )

      if (result.success && result.reservations) {
        for (const reservation of result.reservations) {
          await this.processChannelReservation(this.mapExpediaReservation(reservation), propertyId)
        }

        return {
          channelName: 'expedia',
          success: true,
          itemsProcessed: result.reservations.length,
          errors: [],
          lastSync: new Date()
        }
      }

      return {
        channelName: 'expedia',
        success: false,
        itemsProcessed: 0,
        errors: [result.error || 'Sync failed'],
        lastSync: new Date()
      }

    } catch (error: any) {
      return {
        channelName: 'expedia',
        success: false,
        itemsProcessed: 0,
        errors: [error.message || 'Sync failed'],
        lastSync: new Date()
      }
    }
  }

  private static async getChannelConfiguration(propertyId: string): Promise<ChannelConfiguration | null> {
    try {
      // This would fetch from your database
      // For now, returning a mock configuration
      return {
        propertyId,
        channels: {
          bookingCom: {
            enabled: true,
            credentials: {
              username: 'test_user',
              password: 'test_pass',
              propertyId: propertyId
            },
            lastSync: new Date(),
            syncEnabled: true,
            autoAcceptReservations: false
          }
        },
        rateMapping: {},
        inventorySync: {
          enabled: true,
          frequency: 'realtime',
          lastSync: new Date(),
          conflictResolution: 'first_come_first_served'
        },
        rateSynchronization: {
          enabled: true,
          baseRateSource: 'manual',
          markupRules: []
        }
      }
    } catch (error) {
      console.error('Error fetching channel configuration:', error)
      return null
    }
  }

  private static mapToChannelRoomId(localRoomId: string, channelName: string, config: ChannelConfiguration): string {
    // This would map local room IDs to channel-specific room IDs
    // For now, returning the same ID
    return localRoomId
  }

  private static mapBookingComReservation(res: BookingComReservation): ChannelReservation {
    return {
      reservationId: res.reservationId,
      channelReservationId: res.bookingComReservationId,
      channelName: 'booking_com',
      propertyId: res.propertyId,
      status: res.status,
      guestDetails: {
        firstName: res.guestDetails.firstName,
        lastName: res.guestDetails.lastName,
        email: res.guestDetails.email,
        phone: res.guestDetails.phone
      },
      roomDetails: {
        roomTypeId: res.roomDetails.roomTypeId,
        roomTypeName: res.roomDetails.roomTypeName,
        numberOfRooms: res.roomDetails.numberOfRooms,
        guests: res.roomDetails.guests
      },
      stayDetails: {
        checkIn: res.stayDetails.checkIn,
        checkOut: res.stayDetails.checkOut,
        nights: res.stayDetails.nights,
        totalAmount: res.stayDetails.totalAmount,
        commission: res.stayDetails.commission,
        netAmount: res.stayDetails.netAmount,
        currency: res.stayDetails.currency
      },
      specialRequests: res.specialRequests,
      createdAt: res.createdAt,
      lastModified: res.lastModified,
      syncedToLocal: false
    }
  }

  private static mapAirbnbReservation(res: AirbnbReservation): ChannelReservation {
    return {
      reservationId: res.reservationId,
      channelReservationId: res.airbnbReservationCode,
      channelName: 'airbnb',
      propertyId: res.listingId,
      status: res.status === 'accepted' ? 'confirmed' : res.status,
      guestDetails: {
        firstName: res.guestDetails.firstName,
        lastName: res.guestDetails.lastName,
        email: res.guestDetails.email,
        phone: res.guestDetails.phone
      },
      roomDetails: {
        roomTypeId: res.listingId,
        roomTypeName: 'Airbnb Listing',
        numberOfRooms: 1,
        guests: {
          adults: res.stayDetails.guests.adults,
          children: res.stayDetails.guests.children
        }
      },
      stayDetails: {
        checkIn: res.stayDetails.checkIn,
        checkOut: res.stayDetails.checkOut,
        nights: res.stayDetails.nights,
        totalAmount: res.stayDetails.totalAmount,
        commission: res.stayDetails.airbnbFees,
        netAmount: res.stayDetails.hostPayout,
        currency: res.stayDetails.currency
      },
      specialRequests: res.specialRequests,
      createdAt: res.createdAt,
      lastModified: res.lastModified,
      syncedToLocal: false
    }
  }

  private static mapExpediaReservation(res: ExpediaReservation): ChannelReservation {
    return {
      reservationId: res.reservationId,
      channelReservationId: res.expediaItineraryId,
      channelName: 'expedia',
      propertyId: res.propertyId,
      status: res.status,
      guestDetails: {
        firstName: res.guestDetails.firstName,
        lastName: res.guestDetails.lastName,
        email: res.guestDetails.email,
        phone: res.guestDetails.phone
      },
      roomDetails: {
        roomTypeId: res.roomDetails.roomTypeId,
        roomTypeName: res.roomDetails.roomTypeName,
        numberOfRooms: res.roomDetails.numberOfRooms,
        guests: res.roomDetails.guests
      },
      stayDetails: {
        checkIn: res.stayDetails.checkIn,
        checkOut: res.stayDetails.checkOut,
        nights: res.stayDetails.nights,
        totalAmount: res.stayDetails.totalAmount,
        commission: res.stayDetails.commission,
        netAmount: res.stayDetails.netAmount,
        currency: res.stayDetails.currency
      },
      specialRequests: res.specialRequests,
      createdAt: res.createdAt,
      lastModified: res.lastModified,
      syncedToLocal: false
    }
  }

  private static async processChannelReservation(reservation: ChannelReservation, propertyId: string): Promise<void> {
    try {
      // This would process the reservation and create a local booking
      console.log('Processing channel reservation:', reservation.reservationId)

      // 1. Check if reservation already exists locally
      // 2. Create or update local booking
      // 3. Update inventory
      // 4. Send confirmation emails
      // 5. Notify staff

    } catch (error) {
      console.error('Error processing channel reservation:', error)
    }
  }

  private static async updateLastSyncTime(propertyId: string): Promise<void> {
    try {
      // Update last sync time in database
      console.log('Updating last sync time for property:', propertyId)
    } catch (error) {
      console.error('Error updating last sync time:', error)
    }
  }
}