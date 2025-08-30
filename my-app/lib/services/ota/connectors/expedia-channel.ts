import { BaseOTAChannel, ChannelCredentials, SyncData, ChannelSyncResult, ConnectionTestResult } from './base-channel'

export class ExpediaChannel extends BaseOTAChannel {
  constructor() {
    super('expedia', 'Expedia', 'https://services.expediapartnercentral.com')
  }

  async testConnection(credentials: ChannelCredentials): Promise<ConnectionTestResult> {
    try {
      this.validateCredentials(credentials, ['username', 'password'])
      this.log('info', 'Testing connection to Expedia')

      // Test authentication with Expedia EPC API
      const response = await this.makeRequest('/epc/v3/properties', {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${Buffer.from(`${credentials.username}:${credentials.password}`).toString('base64')}`,
          'Accept': 'application/json'
        }
      })

      this.log('info', 'Expedia connection test successful')
      
      return {
        success: true,
        message: 'Successfully connected to Expedia',
        details: {
          timestamp: new Date(),
          responseTime: Date.now(),
          propertiesFound: response.properties?.length || 0
        }
      }
    } catch (error) {
      this.log('error', 'Expedia connection test failed', error)
      
      return {
        success: false,
        message: `Connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: { error: error instanceof Error ? error.message : 'Unknown error' }
      }
    }
  }

  async syncInventory(data: SyncData): Promise<ChannelSyncResult> {
    try {
      this.log('info', 'Starting inventory sync with Expedia')
      
      this.validateCredentials(data.credentials, ['username', 'password'])
      
      if (!data.rooms || data.rooms.length === 0) {
        return this.buildErrorResult('No rooms to sync')
      }

      const sanitizedRooms = this.sanitizeRoomData(data.rooms)
      const authHeader = `Basic ${Buffer.from(`${data.credentials.username}:${data.credentials.password}`).toString('base64')}`
      
      let syncedRooms = 0
      const errors: string[] = []
      const warnings: string[] = []

      // Get property ID from Expedia
      const propertyId = data.property.expediaPropertyId || data.property.id

      for (const room of sanitizedRooms) {
        try {
          // Create room type in Expedia
          const roomTypePayload = this.buildRoomTypePayload(room, propertyId)
          
          const response = await this.makeRequest(`/epc/v3/properties/${propertyId}/roomTypes`, {
            method: 'POST',
            headers: {
              'Authorization': authHeader,
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            },
            body: roomTypePayload
          })

          if (response && !response.errors) {
            syncedRooms++
            this.log('info', `Room type ${room.roomType} synced successfully`)
            
            // Create rate plan for this room type
            await this.createRatePlan(authHeader, propertyId, response.roomTypeId || room.id, room)
            
          } else {
            const error = `Room ${room.roomNumber} sync failed: ${this.extractErrorMessage(response)}`
            errors.push(error)
            this.log('warn', error)
          }

          // Rate limiting for Expedia (60 requests per minute)
          await this.rateLimit(60)
          
        } catch (error) {
          const errorMsg = `Room ${room.roomNumber} sync error: ${error instanceof Error ? error.message : 'Unknown error'}`
          errors.push(errorMsg)
          this.log('error', errorMsg)
        }
      }

      const message = `Inventory sync completed. ${syncedRooms}/${sanitizedRooms.length} rooms synced successfully`
      this.log('info', message)

      if (errors.length > 0 && syncedRooms === 0) {
        return this.buildErrorResult('Inventory sync failed completely', errors)
      }

      return this.buildSuccessResult(message, { rooms: syncedRooms }, errors.length > 0 ? errors : undefined)
      
    } catch (error) {
      this.log('error', 'Inventory sync failed', error)
      return this.buildErrorResult(`Inventory sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async syncRates(data: SyncData): Promise<ChannelSyncResult> {
    try {
      this.log('info', 'Starting rate sync with Expedia')
      
      this.validateCredentials(data.credentials, ['username', 'password'])
      
      if (!data.rooms || data.rooms.length === 0) {
        return this.buildErrorResult('No rooms to sync rates for')
      }

      const sanitizedRooms = this.sanitizeRoomData(data.rooms)
      const authHeader = `Basic ${Buffer.from(`${data.credentials.username}:${data.credentials.password}`).toString('base64')}`
      const propertyId = data.property.expediaPropertyId || data.property.id
      
      let syncedRates = 0
      const errors: string[] = []

      // Sync rates for next 365 days
      const startDate = new Date()
      const endDate = new Date()
      endDate.setDate(endDate.getDate() + 365)

      for (const room of sanitizedRooms) {
        try {
          // Update rate plan with new rates
          const ratePayload = this.buildRatePayload(room, startDate, endDate)
          
          const response = await this.makeRequest(
            `/epc/v3/properties/${propertyId}/roomTypes/${room.id}/ratePlans/${room.ratePlanId || 'default'}/rates`,
            {
              method: 'PUT',
              headers: {
                'Authorization': authHeader,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
              },
              body: ratePayload
            }
          )

          if (response && !response.errors) {
            syncedRates++
            this.log('info', `Rates for room ${room.roomNumber} synced successfully`)
          } else {
            const error = `Rate sync failed for room ${room.roomNumber}: ${this.extractErrorMessage(response)}`
            errors.push(error)
            this.log('warn', error)
          }

          // Rate limiting
          await this.rateLimit(60)
          
        } catch (error) {
          const errorMsg = `Rate sync error for room ${room.roomNumber}: ${error instanceof Error ? error.message : 'Unknown error'}`
          errors.push(errorMsg)
          this.log('error', errorMsg)
        }
      }

      const message = `Rate sync completed. ${syncedRates}/${sanitizedRooms.length} room rates synced successfully`
      this.log('info', message)

      if (errors.length > 0 && syncedRates === 0) {
        return this.buildErrorResult('Rate sync failed completely', errors)
      }

      return this.buildSuccessResult(message, { rates: syncedRates }, errors.length > 0 ? errors : undefined)
      
    } catch (error) {
      this.log('error', 'Rate sync failed', error)
      return this.buildErrorResult(`Rate sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async syncAvailability(data: SyncData): Promise<ChannelSyncResult> {
    try {
      this.log('info', 'Starting availability sync with Expedia')
      
      this.validateCredentials(data.credentials, ['username', 'password'])
      
      if (!data.availability || data.availability.length === 0) {
        return this.buildErrorResult('No availability data to sync')
      }

      const authHeader = `Basic ${Buffer.from(`${data.credentials.username}:${data.credentials.password}`).toString('base64')}`
      const propertyId = data.property.expediaPropertyId || data.property.id
      
      let syncedInventory = 0
      const errors: string[] = []

      // Group availability by room
      const availabilityByRoom = this.groupAvailabilityByRoom(data.availability)

      for (const [roomId, roomAvailability] of availabilityByRoom.entries()) {
        try {
          // Update availability for this room type
          const availabilityPayload = this.buildAvailabilityPayload(roomAvailability)
          
          const response = await this.makeRequest(
            `/epc/v3/properties/${propertyId}/roomTypes/${roomId}/ratePlans/default/availability`,
            {
              method: 'PUT',
              headers: {
                'Authorization': authHeader,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
              },
              body: availabilityPayload
            }
          )

          if (response && !response.errors) {
            syncedInventory += roomAvailability.length
            this.log('info', `Availability for room ${roomId} synced successfully`)
          } else {
            const error = `Availability sync failed for room ${roomId}: ${this.extractErrorMessage(response)}`
            errors.push(error)
            this.log('warn', error)
          }

          // Rate limiting
          await this.rateLimit(60)
          
        } catch (error) {
          const errorMsg = `Availability sync error for room ${roomId}: ${error instanceof Error ? error.message : 'Unknown error'}`
          errors.push(errorMsg)
          this.log('error', errorMsg)
        }
      }

      const message = `Availability sync completed. ${syncedInventory} availability records synced successfully`
      this.log('info', message)

      if (errors.length > 0 && syncedInventory === 0) {
        return this.buildErrorResult('Availability sync failed completely', errors)
      }

      return this.buildSuccessResult(message, { inventory: syncedInventory }, errors.length > 0 ? errors : undefined)
      
    } catch (error) {
      this.log('error', 'Availability sync failed', error)
      return this.buildErrorResult(`Availability sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async getBookings(credentials: ChannelCredentials, dateRange: { start: Date, end: Date }): Promise<any[]> {
    try {
      this.log('info', 'Fetching bookings from Expedia')
      
      this.validateCredentials(credentials, ['username', 'password'])
      
      const authHeader = `Basic ${Buffer.from(`${credentials.username}:${credentials.password}`).toString('base64')}`
      
      const response = await this.makeRequest(
        `/epc/v3/reservations?checkin=${this.formatDate(dateRange.start)}&checkout=${this.formatDate(dateRange.end)}`,
        {
          headers: {
            'Authorization': authHeader,
            'Accept': 'application/json'
          }
        }
      )

      return this.parseBookingsResponse(response)
      
    } catch (error) {
      this.log('error', 'Failed to fetch bookings', error)
      return []
    }
  }

  async updateBooking(credentials: ChannelCredentials, bookingId: string, updates: any): Promise<ChannelSyncResult> {
    try {
      this.log('info', `Updating booking ${bookingId} on Expedia`)
      
      this.validateCredentials(credentials, ['username', 'password'])
      
      const authHeader = `Basic ${Buffer.from(`${credentials.username}:${credentials.password}`).toString('base64')}`
      
      const updatePayload = this.buildBookingUpdatePayload(updates)
      
      const response = await this.makeRequest(`/epc/v3/reservations/${bookingId}`, {
        method: 'PUT',
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: updatePayload
      })

      if (response && !response.errors) {
        return this.buildSuccessResult(`Booking ${bookingId} updated successfully`)
      } else {
        return this.buildErrorResult(`Booking update failed: ${this.extractErrorMessage(response)}`)
      }
      
    } catch (error) {
      this.log('error', 'Booking update failed', error)
      return this.buildErrorResult(`Booking update failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // Private helper methods

  private buildRoomTypePayload(room: any, propertyId: string): any {
    return {
      roomTypeId: room.id,
      name: {
        value: room.roomType
      },
      description: {
        value: room.description || `${room.roomType} room`
      },
      maxOccupancy: {
        adults: room.maxOccupancy,
        children: 0,
        total: room.maxOccupancy
      },
      area: {
        squareMeters: room.size || 25
      },
      bedTypes: [
        {
          id: "3.2",
          name: "Double bed"
        }
      ],
      smokingPreference: "NonSmoking"
    }
  }

  private async createRatePlan(authHeader: string, propertyId: string, roomTypeId: string, room: any): Promise<void> {
    try {
      const ratePlanPayload = {
        ratePlanId: 'default',
        name: {
          value: `Standard Rate - ${room.roomType}`
        },
        description: {
          value: `Standard rate plan for ${room.roomType}`
        },
        status: 'Active',
        type: 'Standalone',
        pricingModel: 'PerDayPricing',
        occupantsForBaseRate: 2,
        taxInclusive: false,
        cancelPolicy: {
          defaultPenalties: [
            {
              deadline: 86400, // 24 hours
              perStayFee: 'None',
              amount: 0
            }
          ]
        }
      }

      await this.makeRequest(`/epc/v3/properties/${propertyId}/roomTypes/${roomTypeId}/ratePlans`, {
        method: 'POST',
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: ratePlanPayload
      })
    } catch (error) {
      this.log('warn', `Failed to create rate plan for room ${roomTypeId}`, error)
    }
  }

  private buildRatePayload(room: any, startDate: Date, endDate: Date): any {
    const dates = []
    const currentDate = new Date(startDate)
    
    while (currentDate <= endDate) {
      dates.push({
        date: this.formatDate(currentDate),
        amount: room.baseRate,
        currency: 'INR'
      })
      currentDate.setDate(currentDate.getDate() + 1)
    }

    return { rates: dates }
  }

  private buildAvailabilityPayload(availability: any[]): any {
    return {
      availability: availability.map(avail => ({
        date: this.formatDate(new Date(avail.date)),
        available: avail.available,
        inventory: avail.inventory || (avail.available ? 1 : 0)
      }))
    }
  }

  private buildBookingUpdatePayload(updates: any): any {
    return {
      status: updates.status || 'Confirmed',
      ...(updates.notes && { specialRequests: updates.notes })
    }
  }

  private extractErrorMessage(response: any): string {
    if (response && response.errors && response.errors.length > 0) {
      return response.errors[0].message || 'Unknown error'
    }
    return response.message || 'Unknown error'
  }

  private groupAvailabilityByRoom(availability: any[]): Map<string, any[]> {
    const grouped = new Map<string, any[]>()
    
    for (const avail of availability) {
      const roomId = avail.roomId || avail.room_id
      if (!grouped.has(roomId)) {
        grouped.set(roomId, [])
      }
      grouped.get(roomId)!.push(avail)
    }
    
    return grouped
  }

  private parseBookingsResponse(response: any): any[] {
    if (!response || !response.reservations) {
      return []
    }

    return response.reservations.map((reservation: any) => ({
      id: reservation.reservationId,
      channelBookingId: reservation.itineraryId,
      guestName: `${reservation.primaryGuest.firstName} ${reservation.primaryGuest.lastName}`,
      email: reservation.primaryGuest.email,
      phone: reservation.primaryGuest.phone,
      checkIn: reservation.stayDates.checkinDate,
      checkOut: reservation.stayDates.checkoutDate,
      roomType: reservation.roomStay.roomType,
      adults: reservation.roomStay.occupancy.adults,
      children: reservation.roomStay.occupancy.children,
      totalAmount: reservation.charges.total.amount,
      currency: reservation.charges.total.currency,
      status: reservation.status,
      source: 'expedia'
    }))
  }
}

export default ExpediaChannel