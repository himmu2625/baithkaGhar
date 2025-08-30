import { BaseOTAChannel, ChannelCredentials, SyncData, ChannelSyncResult, ConnectionTestResult } from './base-channel'

export class BookingComChannel extends BaseOTAChannel {
  constructor() {
    super('booking-com', 'Booking.com', 'https://supply-xml.booking.com')
  }

  async testConnection(credentials: ChannelCredentials): Promise<ConnectionTestResult> {
    try {
      this.validateCredentials(credentials, ['username', 'password'])
      this.log('info', 'Testing connection to Booking.com')

      // Test authentication endpoint
      const response = await this.makeRequest('/hotels/xml/availabilities', {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${Buffer.from(`${credentials.username}:${credentials.password}`).toString('base64')}`
        }
      })

      this.log('info', 'Booking.com connection test successful')
      
      return {
        success: true,
        message: 'Successfully connected to Booking.com',
        details: {
          timestamp: new Date(),
          responseTime: Date.now(),
          version: response.version || 'unknown'
        }
      }
    } catch (error) {
      this.log('error', 'Booking.com connection test failed', error)
      
      return {
        success: false,
        message: `Connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: { error: error instanceof Error ? error.message : 'Unknown error' }
      }
    }
  }

  async syncInventory(data: SyncData): Promise<ChannelSyncResult> {
    try {
      this.log('info', 'Starting inventory sync with Booking.com')
      
      this.validateCredentials(data.credentials, ['username', 'password'])
      
      if (!data.rooms || data.rooms.length === 0) {
        return this.buildErrorResult('No rooms to sync')
      }

      const sanitizedRooms = this.sanitizeRoomData(data.rooms)
      const authHeader = `Basic ${Buffer.from(`${data.credentials.username}:${data.credentials.password}`).toString('base64')}`
      
      let syncedRooms = 0
      const errors: string[] = []
      const warnings: string[] = []

      // Sync rooms in batches to avoid rate limits
      const batchSize = 10
      for (let i = 0; i < sanitizedRooms.length; i += batchSize) {
        const batch = sanitizedRooms.slice(i, i + batchSize)
        
        for (const room of batch) {
          try {
            // Create room inventory request XML
            const roomXML = this.buildRoomInventoryXML(room, data.property)
            
            const response = await this.makeRequest('/hotels/xml/rooms', {
              method: 'POST',
              headers: {
                'Authorization': authHeader,
                'Content-Type': 'application/xml'
              },
              body: roomXML
            })

            if (this.isSuccessResponse(response)) {
              syncedRooms++
              this.log('info', `Room ${room.roomNumber} synced successfully`)
            } else {
              const error = `Room ${room.roomNumber} sync failed: ${this.extractErrorMessage(response)}`
              errors.push(error)
              this.log('warn', error)
            }

            // Rate limiting
            await this.rateLimit(30) // 30 requests per minute for Booking.com
            
          } catch (error) {
            const errorMsg = `Room ${room.roomNumber} sync error: ${error instanceof Error ? error.message : 'Unknown error'}`
            errors.push(errorMsg)
            this.log('error', errorMsg)
          }
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
      this.log('info', 'Starting rate sync with Booking.com')
      
      this.validateCredentials(data.credentials, ['username', 'password'])
      
      if (!data.rooms || data.rooms.length === 0) {
        return this.buildErrorResult('No rooms to sync rates for')
      }

      const sanitizedRooms = this.sanitizeRoomData(data.rooms)
      const authHeader = `Basic ${Buffer.from(`${data.credentials.username}:${data.credentials.password}`).toString('base64')}`
      
      let syncedRates = 0
      const errors: string[] = []

      // Sync rates for next 365 days
      const startDate = new Date()
      const endDate = new Date()
      endDate.setDate(endDate.getDate() + 365)

      for (const room of sanitizedRooms) {
        try {
          // Create rate update XML
          const rateXML = this.buildRateUpdateXML(room, startDate, endDate, data.property)
          
          const response = await this.makeRequest('/hotels/xml/rates', {
            method: 'POST',
            headers: {
              'Authorization': authHeader,
              'Content-Type': 'application/xml'
            },
            body: rateXML
          })

          if (this.isSuccessResponse(response)) {
            syncedRates++
            this.log('info', `Rates for room ${room.roomNumber} synced successfully`)
          } else {
            const error = `Rate sync failed for room ${room.roomNumber}: ${this.extractErrorMessage(response)}`
            errors.push(error)
            this.log('warn', error)
          }

          // Rate limiting
          await this.rateLimit(30)
          
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
      this.log('info', 'Starting availability sync with Booking.com')
      
      this.validateCredentials(data.credentials, ['username', 'password'])
      
      if (!data.availability || data.availability.length === 0) {
        return this.buildErrorResult('No availability data to sync')
      }

      const authHeader = `Basic ${Buffer.from(`${data.credentials.username}:${data.credentials.password}`).toString('base64')}`
      
      let syncedInventory = 0
      const errors: string[] = []

      // Group availability by room
      const availabilityByRoom = this.groupAvailabilityByRoom(data.availability)

      for (const [roomId, roomAvailability] of availabilityByRoom.entries()) {
        try {
          // Create availability update XML
          const availabilityXML = this.buildAvailabilityXML(roomId, roomAvailability, data.property)
          
          const response = await this.makeRequest('/hotels/xml/availability', {
            method: 'POST',
            headers: {
              'Authorization': authHeader,
              'Content-Type': 'application/xml'
            },
            body: availabilityXML
          })

          if (this.isSuccessResponse(response)) {
            syncedInventory += roomAvailability.length
            this.log('info', `Availability for room ${roomId} synced successfully`)
          } else {
            const error = `Availability sync failed for room ${roomId}: ${this.extractErrorMessage(response)}`
            errors.push(error)
            this.log('warn', error)
          }

          // Rate limiting
          await this.rateLimit(30)
          
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
      this.log('info', 'Fetching bookings from Booking.com')
      
      this.validateCredentials(credentials, ['username', 'password'])
      
      const authHeader = `Basic ${Buffer.from(`${credentials.username}:${credentials.password}`).toString('base64')}`
      
      const response = await this.makeRequest(
        `/hotels/xml/reservations?checkin_from=${this.formatDate(dateRange.start)}&checkin_to=${this.formatDate(dateRange.end)}`,
        {
          headers: {
            'Authorization': authHeader
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
      this.log('info', `Updating booking ${bookingId} on Booking.com`)
      
      this.validateCredentials(credentials, ['username', 'password'])
      
      const authHeader = `Basic ${Buffer.from(`${credentials.username}:${credentials.password}`).toString('base64')}`
      
      const updateXML = this.buildBookingUpdateXML(bookingId, updates)
      
      const response = await this.makeRequest('/hotels/xml/reservations', {
        method: 'POST',
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/xml'
        },
        body: updateXML
      })

      if (this.isSuccessResponse(response)) {
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

  private buildRoomInventoryXML(room: any, property: any): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
    <request>
      <username>${property.bookingComHotelId || property.id}</username>
      <room>
        <id>${room.id}</id>
        <name>${this.escapeXML(room.roomType)}</name>
        <description>${this.escapeXML(room.description)}</description>
        <max_occupancy>${room.maxOccupancy}</max_occupancy>
        <room_size>${room.size}</room_size>
        <bed_configurations>
          <bed_configuration>
            <bed_type>double</bed_type>
            <bed_count>1</bed_count>
          </bed_configuration>
        </bed_configurations>
        <amenities>
          ${room.amenities.map((amenity: string) => `<amenity>${this.escapeXML(amenity)}</amenity>`).join('\n')}
        </amenities>
      </room>
    </request>`
  }

  private buildRateUpdateXML(room: any, startDate: Date, endDate: Date, property: any): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
    <request>
      <username>${property.bookingComHotelId || property.id}</username>
      <rates>
        <room_id>${room.id}</room_id>
        <date_from>${this.formatDate(startDate)}</date_from>
        <date_to>${this.formatDate(endDate)}</date_to>
        <rate>${room.baseRate}</rate>
        <currency>INR</currency>
      </rates>
    </request>`
  }

  private buildAvailabilityXML(roomId: string, availability: any[], property: any): string {
    const availabilityItems = availability.map(avail => 
      `<date date="${this.formatDate(new Date(avail.date))}" available="${avail.available ? 1 : 0}" />`
    ).join('\n')

    return `<?xml version="1.0" encoding="UTF-8"?>
    <request>
      <username>${property.bookingComHotelId || property.id}</username>
      <availability>
        <room_id>${roomId}</room_id>
        ${availabilityItems}
      </availability>
    </request>`
  }

  private buildBookingUpdateXML(bookingId: string, updates: any): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
    <request>
      <reservation_id>${bookingId}</reservation_id>
      <status>${updates.status || 'confirmed'}</status>
      ${updates.notes ? `<notes>${this.escapeXML(updates.notes)}</notes>` : ''}
    </request>`
  }

  private isSuccessResponse(response: any): boolean {
    if (typeof response === 'string') {
      return !response.includes('<error>') && !response.includes('fault')
    }
    return response && response.success !== false && !response.error
  }

  private extractErrorMessage(response: any): string {
    if (typeof response === 'string') {
      const match = response.match(/<error[^>]*>([^<]+)<\/error>/)
      return match ? match[1] : 'Unknown error'
    }
    return response.error || response.message || 'Unknown error'
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
    // This would parse the actual XML/JSON response from Booking.com
    // For now, return mock data structure
    return []
  }

  private escapeXML(str: string): string {
    if (!str) return ''
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')
  }
}

export default BookingComChannel