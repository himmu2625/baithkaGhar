import axios from 'axios'

export interface BookingComProperty {
  propertyId: string
  bookingComPropertyId: string
  name: string
  address: string
  coordinates: {
    latitude: number
    longitude: number
  }
  amenities: string[]
  policies: {
    checkInTime: string
    checkOutTime: string
    cancellationPolicy: string
    childPolicy: string
    petPolicy: string
  }
  photos: Array<{
    url: string
    description: string
    isPrimary: boolean
  }>
  rooms: Array<{
    roomTypeId: string
    bookingComRoomId: string
    name: string
    description: string
    maxOccupancy: number
    amenities: string[]
    photos: string[]
  }>
  active: boolean
  lastSync: Date
}

export interface BookingComReservation {
  reservationId: string
  bookingComReservationId: string
  propertyId: string
  guestDetails: {
    firstName: string
    lastName: string
    email: string
    phone: string
    nationality: string
    language: string
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
    currency: string
    commission: number
    netAmount: number
  }
  status: 'confirmed' | 'cancelled' | 'modified' | 'no_show'
  specialRequests?: string
  paymentDetails: {
    paymentMethod: 'credit_card' | 'virtual_credit_card' | 'bank_transfer'
    paymentStatus: 'pending' | 'paid' | 'failed'
    collectedByBookingCom: boolean
  }
  cancellationDetails?: {
    cancelledAt: Date
    reason: string
    refundAmount: number
  }
  createdAt: Date
  lastModified: Date
}

export interface BookingComRateUpdate {
  roomTypeId: string
  date: Date
  rate: number
  currency: string
  availability: number
  restrictions: {
    minimumStay?: number
    maximumStay?: number
    closedToArrival?: boolean
    closedToDeparture?: boolean
    stopSell?: boolean
  }
}

export interface BookingComWebhookEvent {
  eventType: 'reservation_created' | 'reservation_modified' | 'reservation_cancelled' | 'test'
  eventId: string
  timestamp: Date
  propertyId: string
  reservationId?: string
  data: any
}

export class BookingComIntegration {
  private static readonly BASE_URL = 'https://distribution-xml.booking.com/2.5'
  private static readonly API_VERSION = '2.5'

  static async authenticateProperty(credentials: {
    username: string
    password: string
    propertyId: string
  }): Promise<{ success: boolean; property?: BookingComProperty; error?: string }> {
    try {
      const response = await axios.post(`${this.BASE_URL}/json/hotels`, {
        username: credentials.username,
        password: credentials.password,
        hotel_id: credentials.propertyId
      }, {
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'BaithakaGHAR-PMS/1.0'
        },
        timeout: 30000
      })

      if (response.data && response.data.result === 'OK') {
        const hotelData = response.data.hotel

        const property: BookingComProperty = {
          propertyId: credentials.propertyId,
          bookingComPropertyId: hotelData.hotel_id,
          name: hotelData.name,
          address: hotelData.address,
          coordinates: {
            latitude: hotelData.latitude,
            longitude: hotelData.longitude
          },
          amenities: hotelData.facilities || [],
          policies: {
            checkInTime: hotelData.checkin_from || '15:00',
            checkOutTime: hotelData.checkout_until || '11:00',
            cancellationPolicy: hotelData.cancellation_policy || 'Flexible',
            childPolicy: hotelData.child_policy || 'Children allowed',
            petPolicy: hotelData.pet_policy || 'Pets not allowed'
          },
          photos: (hotelData.photos || []).map((photo: any) => ({
            url: photo.url_original,
            description: photo.description || '',
            isPrimary: photo.photo_id === hotelData.main_photo_id
          })),
          rooms: (hotelData.room_types || []).map((room: any) => ({
            roomTypeId: room.room_type_id,
            bookingComRoomId: room.room_type_id,
            name: room.name,
            description: room.description || '',
            maxOccupancy: room.max_occupancy || 2,
            amenities: room.facilities || [],
            photos: room.photos || []
          })),
          active: true,
          lastSync: new Date()
        }

        return { success: true, property }
      }

      return { success: false, error: 'Authentication failed' }

    } catch (error: any) {
      console.error('Booking.com authentication error:', error)
      return {
        success: false,
        error: error.response?.data?.message || 'Authentication failed'
      }
    }
  }

  static async updateInventoryAndRates(credentials: {
    username: string
    password: string
    propertyId: string
  }, updates: BookingComRateUpdate[]): Promise<{ success: boolean; errors?: string[] }> {
    try {
      const updateData = {
        username: credentials.username,
        password: credentials.password,
        hotel_id: credentials.propertyId,
        room_data: updates.map(update => ({
          room_type_id: update.roomTypeId,
          date: update.date.toISOString().split('T')[0],
          rate: update.rate,
          currency: update.currency,
          availability: update.availability,
          minimum_stay: update.restrictions.minimumStay,
          maximum_stay: update.restrictions.maximumStay,
          closed_to_arrival: update.restrictions.closedToArrival ? 1 : 0,
          closed_to_departure: update.restrictions.closedToDeparture ? 1 : 0,
          stop_sell: update.restrictions.stopSell ? 1 : 0
        }))
      }

      const response = await axios.post(`${this.BASE_URL}/json/setRoomData`, updateData, {
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'BaithakaGHAR-PMS/1.0'
        },
        timeout: 30000
      })

      if (response.data && response.data.result === 'OK') {
        return { success: true }
      }

      const errors = response.data?.errors || ['Update failed']
      return { success: false, errors }

    } catch (error: any) {
      console.error('Booking.com rate update error:', error)
      return {
        success: false,
        errors: [error.response?.data?.message || 'Rate update failed']
      }
    }
  }

  static async fetchReservations(credentials: {
    username: string
    password: string
    propertyId: string
  }, dateRange: {
    from: Date
    to: Date
  }): Promise<{ success: boolean; reservations?: BookingComReservation[]; error?: string }> {
    try {
      const response = await axios.post(`${this.BASE_URL}/json/reservations`, {
        username: credentials.username,
        password: credentials.password,
        hotel_id: credentials.propertyId,
        checkin_date: dateRange.from.toISOString().split('T')[0],
        checkout_date: dateRange.to.toISOString().split('T')[0]
      }, {
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'BaithakaGHAR-PMS/1.0'
        },
        timeout: 30000
      })

      if (response.data && response.data.result === 'OK') {
        const reservations: BookingComReservation[] = (response.data.reservations || []).map((res: any) => ({
          reservationId: `bc-${res.reservation_id}`,
          bookingComReservationId: res.reservation_id,
          propertyId: credentials.propertyId,
          guestDetails: {
            firstName: res.customer?.firstname || '',
            lastName: res.customer?.lastname || '',
            email: res.customer?.email || '',
            phone: res.customer?.telephone || '',
            nationality: res.customer?.cc1 || '',
            language: res.customer?.language || 'en'
          },
          roomDetails: {
            roomTypeId: res.room_type_id,
            roomTypeName: res.room_type_name,
            numberOfRooms: res.room_reservation?.length || 1,
            guests: {
              adults: res.adults || 1,
              children: res.children || 0
            }
          },
          stayDetails: {
            checkIn: new Date(res.checkin),
            checkOut: new Date(res.checkout),
            nights: res.nights,
            totalAmount: parseFloat(res.total_price) || 0,
            currency: res.currency_code || 'USD',
            commission: parseFloat(res.commission) || 0,
            netAmount: (parseFloat(res.total_price) || 0) - (parseFloat(res.commission) || 0)
          },
          status: this.mapReservationStatus(res.status),
          specialRequests: res.remarks,
          paymentDetails: {
            paymentMethod: this.mapPaymentMethod(res.payment_type),
            paymentStatus: res.payment_status === 'paid' ? 'paid' : 'pending',
            collectedByBookingCom: res.payment_type !== 'hotel_collect'
          },
          cancellationDetails: res.status === 'cancelled' ? {
            cancelledAt: new Date(res.cancelled_at || res.last_change),
            reason: res.cancellation_reason || 'Not specified',
            refundAmount: parseFloat(res.refund_amount) || 0
          } : undefined,
          createdAt: new Date(res.made_date),
          lastModified: new Date(res.last_change)
        }))

        return { success: true, reservations }
      }

      return { success: false, error: 'Failed to fetch reservations' }

    } catch (error: any) {
      console.error('Booking.com reservations fetch error:', error)
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to fetch reservations'
      }
    }
  }

  static async confirmReservation(credentials: {
    username: string
    password: string
  }, reservationId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await axios.post(`${this.BASE_URL}/json/reservations/confirm`, {
        username: credentials.username,
        password: credentials.password,
        reservation_id: reservationId
      }, {
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'BaithakaGHAR-PMS/1.0'
        },
        timeout: 30000
      })

      if (response.data && response.data.result === 'OK') {
        return { success: true }
      }

      return { success: false, error: response.data?.message || 'Confirmation failed' }

    } catch (error: any) {
      console.error('Booking.com reservation confirmation error:', error)
      return {
        success: false,
        error: error.response?.data?.message || 'Confirmation failed'
      }
    }
  }

  static async markNoShow(credentials: {
    username: string
    password: string
  }, reservationId: string, reason?: string): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await axios.post(`${this.BASE_URL}/json/reservations/no_show`, {
        username: credentials.username,
        password: credentials.password,
        reservation_id: reservationId,
        reason: reason || 'Guest did not arrive'
      }, {
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'BaithakaGHAR-PMS/1.0'
        },
        timeout: 30000
      })

      if (response.data && response.data.result === 'OK') {
        return { success: true }
      }

      return { success: false, error: response.data?.message || 'No show marking failed' }

    } catch (error: any) {
      console.error('Booking.com no show error:', error)
      return {
        success: false,
        error: error.response?.data?.message || 'No show marking failed'
      }
    }
  }

  static async updateRoomInventory(credentials: {
    username: string
    password: string
    propertyId: string
  }, roomUpdates: Array<{
    roomTypeId: string
    dates: Array<{
      date: Date
      availability: number
    }>
  }>): Promise<{ success: boolean; errors?: string[] }> {
    try {
      const updatePromises = roomUpdates.map(async (roomUpdate) => {
        const response = await axios.post(`${this.BASE_URL}/json/setAvailability`, {
          username: credentials.username,
          password: credentials.password,
          hotel_id: credentials.propertyId,
          room_type_id: roomUpdate.roomTypeId,
          availability_data: roomUpdate.dates.map(dateData => ({
            date: dateData.date.toISOString().split('T')[0],
            availability: dateData.availability
          }))
        }, {
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'BaithakaGHAR-PMS/1.0'
          },
          timeout: 30000
        })

        return {
          roomTypeId: roomUpdate.roomTypeId,
          success: response.data?.result === 'OK',
          error: response.data?.message
        }
      })

      const results = await Promise.all(updatePromises)
      const errors = results.filter(r => !r.success).map(r => `${r.roomTypeId}: ${r.error}`)

      return {
        success: errors.length === 0,
        errors: errors.length > 0 ? errors : undefined
      }

    } catch (error: any) {
      console.error('Booking.com inventory update error:', error)
      return {
        success: false,
        errors: [error.response?.data?.message || 'Inventory update failed']
      }
    }
  }

  static async handleWebhook(webhookData: any): Promise<BookingComWebhookEvent> {
    const event: BookingComWebhookEvent = {
      eventType: webhookData.event_type || 'test',
      eventId: webhookData.event_id || `evt-${Date.now()}`,
      timestamp: new Date(webhookData.timestamp || Date.now()),
      propertyId: webhookData.hotel_id,
      reservationId: webhookData.reservation_id,
      data: webhookData
    }

    // Process the webhook based on event type
    switch (event.eventType) {
      case 'reservation_created':
        await this.processNewReservation(event)
        break
      case 'reservation_modified':
        await this.processReservationModification(event)
        break
      case 'reservation_cancelled':
        await this.processReservationCancellation(event)
        break
      case 'test':
        console.log('Booking.com webhook test received')
        break
    }

    return event
  }

  private static mapReservationStatus(status: string): BookingComReservation['status'] {
    switch (status?.toLowerCase()) {
      case 'confirmed':
      case 'ok':
        return 'confirmed'
      case 'cancelled':
        return 'cancelled'
      case 'modified':
        return 'modified'
      case 'no_show':
        return 'no_show'
      default:
        return 'confirmed'
    }
  }

  private static mapPaymentMethod(paymentType: string): BookingComReservation['paymentDetails']['paymentMethod'] {
    switch (paymentType?.toLowerCase()) {
      case 'booking_com':
      case 'virtual_credit_card':
        return 'virtual_credit_card'
      case 'hotel_collect':
        return 'credit_card'
      case 'bank_transfer':
        return 'bank_transfer'
      default:
        return 'credit_card'
    }
  }

  private static async processNewReservation(event: BookingComWebhookEvent): Promise<void> {
    try {
      console.log('Processing new Booking.com reservation:', event.reservationId)

      // This would integrate with your booking system
      // For now, we'll just log the event
      const reservation = event.data.reservation

      // You would typically:
      // 1. Create a booking in your system
      // 2. Send confirmation email to guest
      // 3. Update inventory
      // 4. Notify relevant staff

    } catch (error) {
      console.error('Error processing new reservation:', error)
    }
  }

  private static async processReservationModification(event: BookingComWebhookEvent): Promise<void> {
    try {
      console.log('Processing Booking.com reservation modification:', event.reservationId)

      // This would update the existing booking in your system
      const modification = event.data.modification

      // You would typically:
      // 1. Update the booking in your system
      // 2. Send modification confirmation to guest
      // 3. Update inventory if dates changed
      // 4. Notify relevant staff of changes

    } catch (error) {
      console.error('Error processing reservation modification:', error)
    }
  }

  private static async processReservationCancellation(event: BookingComWebhookEvent): Promise<void> {
    try {
      console.log('Processing Booking.com reservation cancellation:', event.reservationId)

      // This would cancel the booking in your system
      const cancellation = event.data.cancellation

      // You would typically:
      // 1. Cancel the booking in your system
      // 2. Send cancellation confirmation to guest
      // 3. Release inventory
      // 4. Process any refunds if applicable
      // 5. Notify relevant staff

    } catch (error) {
      console.error('Error processing reservation cancellation:', error)
    }
  }

  static async bulkUpdateRates(credentials: {
    username: string
    password: string
    propertyId: string
  }, rateUpdates: Array<{
    roomTypeId: string
    fromDate: Date
    toDate: Date
    rate: number
    currency: string
    daysOfWeek?: number[]
  }>): Promise<{ success: boolean; processedCount: number; errors?: string[] }> {
    try {
      let processedCount = 0
      const errors: string[] = []

      for (const rateUpdate of rateUpdates) {
        const dailyUpdates: BookingComRateUpdate[] = []
        const currentDate = new Date(rateUpdate.fromDate)
        const endDate = new Date(rateUpdate.toDate)

        while (currentDate <= endDate) {
          const dayOfWeek = currentDate.getDay()

          if (!rateUpdate.daysOfWeek || rateUpdate.daysOfWeek.includes(dayOfWeek)) {
            dailyUpdates.push({
              roomTypeId: rateUpdate.roomTypeId,
              date: new Date(currentDate),
              rate: rateUpdate.rate,
              currency: rateUpdate.currency,
              availability: 10,
              restrictions: {}
            })
          }

          currentDate.setDate(currentDate.getDate() + 1)
        }

        if (dailyUpdates.length > 0) {
          const result = await this.updateInventoryAndRates(credentials, dailyUpdates)
          if (result.success) {
            processedCount += dailyUpdates.length
          } else {
            errors.push(...(result.errors || ['Unknown error']))
          }
        }
      }

      return {
        success: errors.length === 0,
        processedCount,
        errors: errors.length > 0 ? errors : undefined
      }

    } catch (error: any) {
      console.error('Booking.com bulk rate update error:', error)
      return {
        success: false,
        processedCount: 0,
        errors: [error.message || 'Bulk update failed']
      }
    }
  }

  static async getBookingStatistics(credentials: {
    username: string
    password: string
    propertyId: string
  }, dateRange: { from: Date; to: Date }): Promise<{
    success: boolean
    statistics?: {
      totalReservations: number
      totalRevenue: number
      averageRate: number
      occupancyRate: number
      cancellationRate: number
      noShowRate: number
      topRoomTypes: Array<{ roomTypeId: string; count: number }>
    }
    error?: string
  }> {
    try {
      const reservationsResult = await this.fetchReservations(credentials, dateRange)

      if (!reservationsResult.success || !reservationsResult.reservations) {
        return { success: false, error: 'Failed to fetch reservations for statistics' }
      }

      const reservations = reservationsResult.reservations
      const totalReservations = reservations.length
      const totalRevenue = reservations.reduce((sum, res) => sum + res.stayDetails.totalAmount, 0)
      const averageRate = totalRevenue / Math.max(totalReservations, 1)

      const cancelledReservations = reservations.filter(r => r.status === 'cancelled').length
      const noShowReservations = reservations.filter(r => r.status === 'no_show').length

      const cancellationRate = (cancelledReservations / Math.max(totalReservations, 1)) * 100
      const noShowRate = (noShowReservations / Math.max(totalReservations, 1)) * 100

      const roomTypeCounts = reservations.reduce((acc, res) => {
        acc[res.roomDetails.roomTypeId] = (acc[res.roomDetails.roomTypeId] || 0) + 1
        return acc
      }, {} as { [key: string]: number })

      const topRoomTypes = Object.entries(roomTypeCounts)
        .map(([roomTypeId, count]) => ({ roomTypeId, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5)

      return {
        success: true,
        statistics: {
          totalReservations,
          totalRevenue,
          averageRate,
          occupancyRate: 0,
          cancellationRate,
          noShowRate,
          topRoomTypes
        }
      }

    } catch (error: any) {
      console.error('Booking.com statistics error:', error)
      return {
        success: false,
        error: error.message || 'Failed to calculate statistics'
      }
    }
  }

  static async testConnection(credentials: {
    username: string
    password: string
    propertyId: string
  }): Promise<{ success: boolean; message: string }> {
    try {
      const response = await axios.post(`${this.BASE_URL}/json/test`, {
        username: credentials.username,
        password: credentials.password,
        hotel_id: credentials.propertyId
      }, {
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'BaithakaGHAR-PMS/1.0'
        },
        timeout: 10000
      })

      if (response.data && response.data.result === 'OK') {
        return {
          success: true,
          message: 'Connection to Booking.com successful'
        }
      }

      return {
        success: false,
        message: response.data?.message || 'Connection test failed'
      }

    } catch (error: any) {
      console.error('Booking.com connection test error:', error)
      return {
        success: false,
        message: error.response?.data?.message || 'Connection test failed'
      }
    }
  }
}