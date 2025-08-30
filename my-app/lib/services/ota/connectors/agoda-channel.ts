import { BaseOTAChannel, ChannelCredentials, SyncData, ChannelSyncResult, ConnectionTestResult } from './base-channel'

export class AgodaChannel extends BaseOTAChannel {
  constructor() {
    super('agoda', 'Agoda', 'https://xmlapi.agoda.com')
  }

  async testConnection(credentials: ChannelCredentials): Promise<ConnectionTestResult> {
    try {
      this.validateCredentials(credentials, ['hotelId', 'username', 'password'])
      this.log('info', 'Testing connection to Agoda')

      // Test authentication with Agoda XML API
      const response = await this.makeRequest('/apxml/property_list', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/xml',
          'SOAPAction': 'http://www.agoda.com/xmlapi/property_list'
        },
        body: this.buildPropertyListXML(credentials)
      })

      this.log('info', 'Agoda connection test successful')
      
      return {
        success: true,
        message: 'Successfully connected to Agoda',
        details: {
          timestamp: new Date(),
          responseTime: Date.now(),
          hotelId: credentials.hotelId
        }
      }
    } catch (error) {
      this.log('error', 'Agoda connection test failed', error)
      
      return {
        success: false,
        message: `Connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: { error: error instanceof Error ? error.message : 'Unknown error' }
      }
    }
  }

  async syncInventory(data: SyncData): Promise<ChannelSyncResult> {
    try {
      this.log('info', 'Starting inventory sync with Agoda')
      
      this.validateCredentials(data.credentials, ['hotelId', 'username', 'password'])
      
      if (!data.rooms || data.rooms.length === 0) {
        return this.buildErrorResult('No rooms to sync')
      }

      const sanitizedRooms = this.sanitizeRoomData(data.rooms)
      
      let syncedRooms = 0
      const errors: string[] = []
      const warnings: string[] = []

      // Agoda requires room type setup first, then rate plan setup
      for (const room of sanitizedRooms) {
        try {
          // Create/update room type
          const roomTypeXML = this.buildRoomTypeXML(room, data.credentials)
          
          const response = await this.makeRequest('/apxml/room_type_list', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/xml',
              'SOAPAction': 'http://www.agoda.com/xmlapi/room_type_list'
            },
            body: roomTypeXML
          })

          if (this.isSuccessResponse(response)) {
            syncedRooms++
            this.log('info', `Room type ${room.roomType} synced successfully`)
            
            // Create rate plan for this room type
            await this.createAgodaRatePlan(room, data.credentials)
            
          } else {
            const error = `Room ${room.roomNumber} sync failed: ${this.extractErrorMessage(response)}`
            errors.push(error)
            this.log('warn', error)
          }

          // Rate limiting for Agoda (30 requests per minute)
          await this.rateLimit(30)
          
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
      this.log('info', 'Starting rate sync with Agoda')
      
      this.validateCredentials(data.credentials, ['hotelId', 'username', 'password'])
      
      if (!data.rooms || data.rooms.length === 0) {
        return this.buildErrorResult('No rooms to sync rates for')
      }

      const sanitizedRooms = this.sanitizeRoomData(data.rooms)
      
      let syncedRates = 0
      const errors: string[] = []

      // Sync rates for next 365 days
      const startDate = new Date()
      const endDate = new Date()
      endDate.setDate(endDate.getDate() + 365)

      for (const room of sanitizedRooms) {
        try {
          // Update rates for this room type
          const rateXML = this.buildRateUpdateXML(room, startDate, endDate, data.credentials)
          
          const response = await this.makeRequest('/apxml/rate_update', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/xml',
              'SOAPAction': 'http://www.agoda.com/xmlapi/rate_update'
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
      this.log('info', 'Starting availability sync with Agoda')
      
      this.validateCredentials(data.credentials, ['hotelId', 'username', 'password'])
      
      if (!data.availability || data.availability.length === 0) {
        return this.buildErrorResult('No availability data to sync')
      }

      let syncedInventory = 0
      const errors: string[] = []

      // Group availability by room
      const availabilityByRoom = this.groupAvailabilityByRoom(data.availability)

      for (const [roomId, roomAvailability] of availabilityByRoom.entries()) {
        try {
          // Update availability for this room type
          const availabilityXML = this.buildAvailabilityXML(roomId, roomAvailability, data.credentials)
          
          const response = await this.makeRequest('/apxml/availability_update', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/xml',
              'SOAPAction': 'http://www.agoda.com/xmlapi/availability_update'
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
      this.log('info', 'Fetching bookings from Agoda')
      
      this.validateCredentials(credentials, ['hotelId', 'username', 'password'])
      
      const bookingXML = this.buildBookingListXML(credentials, dateRange)
      
      const response = await this.makeRequest('/apxml/reservation_list', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/xml',
          'SOAPAction': 'http://www.agoda.com/xmlapi/reservation_list'
        },
        body: bookingXML
      })

      return this.parseBookingsResponse(response)
      
    } catch (error) {
      this.log('error', 'Failed to fetch bookings', error)
      return []
    }
  }

  async updateBooking(credentials: ChannelCredentials, bookingId: string, updates: any): Promise<ChannelSyncResult> {
    try {
      this.log('info', `Updating booking ${bookingId} on Agoda`)
      
      this.validateCredentials(credentials, ['hotelId', 'username', 'password'])
      
      const updateXML = this.buildBookingUpdateXML(credentials, bookingId, updates)
      
      const response = await this.makeRequest('/apxml/reservation_update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/xml',
          'SOAPAction': 'http://www.agoda.com/xmlapi/reservation_update'
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

  private buildPropertyListXML(credentials: ChannelCredentials): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
    <soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
      <soap:Header/>
      <soap:Body>
        <PropertyListRQ xmlns="http://www.agoda.com/xmlapi">
          <Authentication>
            <HotelId>${credentials.hotelId}</HotelId>
            <UserName>${this.escapeXML(credentials.username)}</UserName>
            <Password>${this.escapeXML(credentials.password)}</Password>
          </Authentication>
        </PropertyListRQ>
      </soap:Body>
    </soap:Envelope>`
  }

  private buildRoomTypeXML(room: any, credentials: ChannelCredentials): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
    <soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
      <soap:Header/>
      <soap:Body>
        <RoomTypeListRQ xmlns="http://www.agoda.com/xmlapi">
          <Authentication>
            <HotelId>${credentials.hotelId}</HotelId>
            <UserName>${this.escapeXML(credentials.username)}</UserName>
            <Password>${this.escapeXML(credentials.password)}</Password>
          </Authentication>
          <RoomType>
            <RoomTypeId>${room.id}</RoomTypeId>
            <RoomTypeName>${this.escapeXML(room.roomType)}</RoomTypeName>
            <RoomTypeDescription>${this.escapeXML(room.description || room.roomType)}</RoomTypeDescription>
            <MaxOccupancy>${room.maxOccupancy}</MaxOccupancy>
            <RoomSize>${room.size || 25}</RoomSize>
            <BedTypes>
              <BedType>
                <BedTypeId>2</BedTypeId>
                <BedTypeName>Double</BedTypeName>
                <BedCount>1</BedCount>
              </BedType>
            </BedTypes>
            <Amenities>
              ${room.amenities.map((amenity: string) => `<Amenity>${this.escapeXML(amenity)}</Amenity>`).join('')}
            </Amenities>
          </RoomType>
        </RoomTypeListRQ>
      </soap:Body>
    </soap:Envelope>`
  }

  private async createAgodaRatePlan(room: any, credentials: ChannelCredentials): Promise<void> {
    try {
      const ratePlanXML = `<?xml version="1.0" encoding="UTF-8"?>
      <soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
        <soap:Header/>
        <soap:Body>
          <RatePlanRQ xmlns="http://www.agoda.com/xmlapi">
            <Authentication>
              <HotelId>${credentials.hotelId}</HotelId>
              <UserName>${this.escapeXML(credentials.username)}</UserName>
              <Password>${this.escapeXML(credentials.password)}</Password>
            </Authentication>
            <RatePlan>
              <RatePlanId>${room.id}_standard</RatePlanId>
              <RoomTypeId>${room.id}</RoomTypeId>
              <RatePlanName>Standard Rate - ${this.escapeXML(room.roomType)}</RatePlanName>
              <RatePlanDescription>Standard rate plan for ${this.escapeXML(room.roomType)}</RatePlanDescription>
              <CancellationPolicy>
                <CancellationDeadline>24</CancellationDeadline>
                <CancellationFee>0</CancellationFee>
              </CancellationPolicy>
            </RatePlan>
          </RatePlanRQ>
        </soap:Body>
      </soap:Envelope>`

      await this.makeRequest('/apxml/rate_plan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/xml',
          'SOAPAction': 'http://www.agoda.com/xmlapi/rate_plan'
        },
        body: ratePlanXML
      })
    } catch (error) {
      this.log('warn', `Failed to create rate plan for room ${room.id}`, error)
    }
  }

  private buildRateUpdateXML(room: any, startDate: Date, endDate: Date, credentials: ChannelCredentials): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
    <soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
      <soap:Header/>
      <soap:Body>
        <RateUpdateRQ xmlns="http://www.agoda.com/xmlapi">
          <Authentication>
            <HotelId>${credentials.hotelId}</HotelId>
            <UserName>${this.escapeXML(credentials.username)}</UserName>
            <Password>${this.escapeXML(credentials.password)}</Password>
          </Authentication>
          <RateUpdate>
            <RatePlanId>${room.id}_standard</RatePlanId>
            <DateFrom>${this.formatDate(startDate)}</DateFrom>
            <DateTo>${this.formatDate(endDate)}</DateTo>
            <Rate>
              <Amount>${room.baseRate}</Amount>
              <Currency>INR</Currency>
            </Rate>
          </RateUpdate>
        </RateUpdateRQ>
      </soap:Body>
    </soap:Envelope>`
  }

  private buildAvailabilityXML(roomId: string, availability: any[], credentials: ChannelCredentials): string {
    const availabilityItems = availability.map(avail => 
      `<AvailabilityItem>
         <Date>${this.formatDate(new Date(avail.date))}</Date>
         <Available>${avail.available ? 'true' : 'false'}</Available>
         <Inventory>${avail.inventory || (avail.available ? 1 : 0)}</Inventory>
       </AvailabilityItem>`
    ).join('')

    return `<?xml version="1.0" encoding="UTF-8"?>
    <soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
      <soap:Header/>
      <soap:Body>
        <AvailabilityUpdateRQ xmlns="http://www.agoda.com/xmlapi">
          <Authentication>
            <HotelId>${credentials.hotelId}</HotelId>
            <UserName>${this.escapeXML(credentials.username)}</UserName>
            <Password>${this.escapeXML(credentials.password)}</Password>
          </Authentication>
          <AvailabilityUpdate>
            <RatePlanId>${roomId}_standard</RatePlanId>
            <Availability>
              ${availabilityItems}
            </Availability>
          </AvailabilityUpdate>
        </AvailabilityUpdateRQ>
      </soap:Body>
    </soap:Envelope>`
  }

  private buildBookingListXML(credentials: ChannelCredentials, dateRange: { start: Date, end: Date }): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
    <soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
      <soap:Header/>
      <soap:Body>
        <ReservationListRQ xmlns="http://www.agoda.com/xmlapi">
          <Authentication>
            <HotelId>${credentials.hotelId}</HotelId>
            <UserName>${this.escapeXML(credentials.username)}</UserName>
            <Password>${this.escapeXML(credentials.password)}</Password>
          </Authentication>
          <DateRange>
            <CheckInFrom>${this.formatDate(dateRange.start)}</CheckInFrom>
            <CheckInTo>${this.formatDate(dateRange.end)}</CheckInTo>
          </DateRange>
        </ReservationListRQ>
      </soap:Body>
    </soap:Envelope>`
  }

  private buildBookingUpdateXML(credentials: ChannelCredentials, bookingId: string, updates: any): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
    <soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
      <soap:Header/>
      <soap:Body>
        <ReservationUpdateRQ xmlns="http://www.agoda.com/xmlapi">
          <Authentication>
            <HotelId>${credentials.hotelId}</HotelId>
            <UserName>${this.escapeXML(credentials.username)}</UserName>
            <Password>${this.escapeXML(credentials.password)}</Password>
          </Authentication>
          <ReservationUpdate>
            <ReservationId>${bookingId}</ReservationId>
            <Status>${updates.status || 'Confirmed'}</Status>
            ${updates.notes ? `<Notes>${this.escapeXML(updates.notes)}</Notes>` : ''}
          </ReservationUpdate>
        </ReservationUpdateRQ>
      </soap:Body>
    </soap:Envelope>`
  }

  private isSuccessResponse(response: any): boolean {
    if (typeof response === 'string') {
      return !response.includes('<Error>') && !response.includes('<Fault>') && response.includes('Success')
    }
    return response && response.success !== false && !response.error
  }

  private extractErrorMessage(response: any): string {
    if (typeof response === 'string') {
      const errorMatch = response.match(/<Error[^>]*>([^<]+)<\/Error>/)
      const faultMatch = response.match(/<Fault[^>]*>([^<]+)<\/Fault>/)
      return errorMatch?.[1] || faultMatch?.[1] || 'Unknown error'
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
    // This would parse the actual SOAP XML response from Agoda
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

export default AgodaChannel