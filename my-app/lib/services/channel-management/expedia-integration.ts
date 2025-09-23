import axios from 'axios'
import { parseString } from 'xml2js'

export interface ExpediaProperty {
  propertyId: string
  expediaPropertyId: string
  name: string
  address: string
  chainCode?: string
  brandCode?: string
  propertyCategory: string
  starRating: number
  rooms: Array<{
    roomTypeId: string
    expediaRoomId: string
    name: string
    description: string
    maxOccupancy: number
    bedTypes: Array<{
      bedType: string
      count: number
    }>
    smokingPreference: 'smoking' | 'non_smoking' | 'either'
    amenities: string[]
  }>
  policies: {
    checkInTime: string
    checkOutTime: string
    minimumAge: number
    cancellationPolicy: string
    petPolicy: string
  }
  contactInfo: {
    phone: string
    fax?: string
    email: string
  }
  timezone: string
  currency: string
  active: boolean
  lastSync: Date
}

export interface ExpediaReservation {
  reservationId: string
  expediaItineraryId: string
  propertyId: string
  confirmationNumber: string
  status: 'confirmed' | 'cancelled' | 'modified' | 'no_show'
  guestDetails: {
    firstName: string
    lastName: string
    email: string
    phone?: string
    address?: {
      street: string
      city: string
      state: string
      country: string
      postalCode: string
    }
  }
  roomDetails: {
    roomTypeId: string
    roomTypeName: string
    numberOfRooms: number
    guests: {
      adults: number
      children: number
    }
    smokingPreference: 'smoking' | 'non_smoking'
    bedType?: string
  }
  stayDetails: {
    checkIn: Date
    checkOut: Date
    nights: number
    totalAmount: number
    commission: number
    netAmount: number
    currency: string
    rateType: 'merchant' | 'net' | 'package'
  }
  specialRequests?: string
  valueAdds?: Array<{
    id: string
    description: string
    amount: number
  }>
  paymentDetails: {
    cardType?: string
    lastFourDigits?: string
    expirationDate?: string
    billingAddress?: any
    authorizationCode?: string
  }
  cancellationDetails?: {
    cancelledAt: Date
    reason: string
    penalty: number
    refundAmount: number
  }
  createdAt: Date
  lastModified: Date
}

export interface ExpediaRateUpdate {
  roomTypeId: string
  date: Date
  rateType: 'merchant' | 'net'
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

export interface ExpediaProductUpdate {
  roomTypeId: string
  rateTypeId: string
  dates: Array<{
    date: Date
    baseRate: number
    availability: number
    restrictions: {
      minimumLengthOfStay?: number
      maximumLengthOfStay?: number
      closedToArrival?: boolean
      closedToDeparture?: boolean
      stopSell?: boolean
    }
  }>
}

export class ExpediaIntegration {
  private static readonly PRODUCTION_URL = 'https://ws.expediapartnercentral.com/eqc/ar'
  private static readonly TEST_URL = 'https://ws.expediapartnercentral.com/eqc/ar'
  private static readonly BOOKING_RETRIEVAL_URL = 'https://ws.expediapartnercentral.com/eqc/br'

  static async authenticateProperty(credentials: {
    username: string
    password: string
    propertyId: string
    testMode?: boolean
  }): Promise<{ success: boolean; property?: ExpediaProperty; error?: string }> {
    try {
      const baseUrl = credentials.testMode ? this.TEST_URL : this.PRODUCTION_URL

      // Expedia uses SOAP XML for authentication
      const soapEnvelope = `<?xml version="1.0" encoding="UTF-8"?>
        <soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
          <soap:Header>
            <Interface xmlns="http://www.expediaconnect.com/EQC/AR/2013/07">
              <PayloadInfo correlationId="${Date.now()}" requestId="${Date.now()}" timestamp="${new Date().toISOString()}"/>
            </Interface>
          </soap:Header>
          <soap:Body>
            <Authentication xmlns="http://www.expediaconnect.com/EQC/AR/2013/07">
              <username>${credentials.username}</username>
              <password>${credentials.password}</password>
            </Authentication>
          </soap:Body>
        </soap:Envelope>`

      const response = await axios.post(baseUrl, soapEnvelope, {
        headers: {
          'Content-Type': 'text/xml; charset=utf-8',
          'SOAPAction': 'http://www.expediaconnect.com/EQC/AR/2013/07/Authentication',
          'User-Agent': 'BaithakaGHAR-PMS/1.0'
        },
        timeout: 30000
      })

      if (response.status === 200) {
        // Parse XML response to extract property information
        const parsedData = await this.parseXMLResponse(response.data)

        if (parsedData.success) {
          const property: ExpediaProperty = {
            propertyId: credentials.propertyId,
            expediaPropertyId: credentials.propertyId,
            name: 'Property Name', // Would be extracted from response
            address: 'Property Address',
            propertyCategory: 'Hotel',
            starRating: 3,
            rooms: [], // Would be populated from property details
            policies: {
              checkInTime: '15:00',
              checkOutTime: '11:00',
              minimumAge: 18,
              cancellationPolicy: 'Flexible',
              petPolicy: 'Not allowed'
            },
            contactInfo: {
              phone: '',
              email: ''
            },
            timezone: 'UTC',
            currency: 'USD',
            active: true,
            lastSync: new Date()
          }

          return { success: true, property }
        }
      }

      return { success: false, error: 'Authentication failed' }

    } catch (error: any) {
      console.error('Expedia authentication error:', error)
      return {
        success: false,
        error: error.response?.data || 'Authentication failed'
      }
    }
  }

  static async updateAvailabilityAndRates(credentials: {
    username: string
    password: string
    propertyId: string
    testMode?: boolean
  }, updates: ExpediaProductUpdate[]): Promise<{ success: boolean; errors?: string[] }> {
    try {
      const baseUrl = credentials.testMode ? this.TEST_URL : this.PRODUCTION_URL

      const updatePromises = updates.map(async (update) => {
        const productData = update.dates.map(dateData => `
          <AvailRateUpdate>
            <DateRange from="${dateData.date.toISOString().split('T')[0]}" to="${dateData.date.toISOString().split('T')[0]}"/>
            <RoomType id="${update.roomTypeId}">
              <Inventory totalInventoryAvailable="${dateData.availability}"/>
              <Rate id="${update.rateTypeId}" currency="USD">
                <PerDay rate="${dateData.baseRate}"/>
              </Rate>
              <Restrictions>
                ${dateData.restrictions.minimumLengthOfStay ? `<MinLOS value="${dateData.restrictions.minimumLengthOfStay}"/>` : ''}
                ${dateData.restrictions.maximumLengthOfStay ? `<MaxLOS value="${dateData.restrictions.maximumLengthOfStay}"/>` : ''}
                ${dateData.restrictions.closedToArrival ? '<ClosedToArrival value="true"/>' : ''}
                ${dateData.restrictions.closedToDeparture ? '<ClosedToDeparture value="true"/>' : ''}
                ${dateData.restrictions.stopSell ? '<StopSell value="true"/>' : ''}
              </Restrictions>
            </RoomType>
          </AvailRateUpdate>
        `).join('')

        const soapEnvelope = `<?xml version="1.0" encoding="UTF-8"?>
          <soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
            <soap:Header>
              <Interface xmlns="http://www.expediaconnect.com/EQC/AR/2013/07">
                <PayloadInfo correlationId="${Date.now()}" requestId="${Date.now()}" timestamp="${new Date().toISOString()}"/>
              </Interface>
            </soap:Header>
            <soap:Body>
              <AvailRateUpdateRQ xmlns="http://www.expediaconnect.com/EQC/AR/2013/07">
                <Authentication>
                  <username>${credentials.username}</username>
                  <password>${credentials.password}</password>
                </Authentication>
                <Hotel id="${credentials.propertyId}">
                  ${productData}
                </Hotel>
              </AvailRateUpdateRQ>
            </soap:Body>
          </soap:Envelope>`

        const response = await axios.post(baseUrl, soapEnvelope, {
          headers: {
            'Content-Type': 'text/xml; charset=utf-8',
            'SOAPAction': 'http://www.expediaconnect.com/EQC/AR/2013/07/AvailRateUpdateRQ',
            'User-Agent': 'BaithakaGHAR-PMS/1.0'
          },
          timeout: 30000
        })

        return {
          roomTypeId: update.roomTypeId,
          success: response.status === 200,
          error: response.status !== 200 ? 'Update failed' : undefined
        }
      })

      const results = await Promise.all(updatePromises)
      const errors = results.filter(r => !r.success).map(r => `${r.roomTypeId}: ${r.error}`)

      return {
        success: errors.length === 0,
        errors: errors.length > 0 ? errors : undefined
      }

    } catch (error: any) {
      console.error('Expedia availability update error:', error)
      return {
        success: false,
        errors: [error.message || 'Update failed']
      }
    }
  }

  static async fetchReservations(credentials: {
    username: string
    password: string
    propertyId: string
    testMode?: boolean
  }, dateRange?: {
    from: Date
    to: Date
  }): Promise<{ success: boolean; reservations?: ExpediaReservation[]; error?: string }> {
    try {
      const baseUrl = credentials.testMode ? this.BOOKING_RETRIEVAL_URL : this.BOOKING_RETRIEVAL_URL

      const fromDate = dateRange?.from || new Date()
      const toDate = dateRange?.to || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)

      const soapEnvelope = `<?xml version="1.0" encoding="UTF-8"?>
        <soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
          <soap:Header>
            <Interface xmlns="http://www.expediaconnect.com/EQC/BR/2014/01">
              <PayloadInfo correlationId="${Date.now()}" requestId="${Date.now()}" timestamp="${new Date().toISOString()}"/>
            </Interface>
          </soap:Header>
          <soap:Body>
            <BookingRetrievalRQ xmlns="http://www.expediaconnect.com/EQC/BR/2014/01">
              <Authentication>
                <username>${credentials.username}</username>
                <password>${credentials.password}</password>
              </Authentication>
              <Hotel id="${credentials.propertyId}"/>
              <ParamSet>
                <BookingDateRange from="${fromDate.toISOString().split('T')[0]}" to="${toDate.toISOString().split('T')[0]}"/>
              </ParamSet>
            </BookingRetrievalRQ>
          </soap:Body>
        </soap:Envelope>`

      const response = await axios.post(baseUrl, soapEnvelope, {
        headers: {
          'Content-Type': 'text/xml; charset=utf-8',
          'SOAPAction': 'http://www.expediaconnect.com/EQC/BR/2014/01/BookingRetrievalRQ',
          'User-Agent': 'BaithakaGHAR-PMS/1.0'
        },
        timeout: 30000
      })

      if (response.status === 200) {
        const parsedData = await this.parseReservationsXML(response.data)

        if (parsedData.success) {
          return { success: true, reservations: parsedData.reservations }
        }
      }

      return { success: false, error: 'Failed to fetch reservations' }

    } catch (error: any) {
      console.error('Expedia reservations fetch error:', error)
      return {
        success: false,
        error: error.response?.data || 'Failed to fetch reservations'
      }
    }
  }

  static async confirmReservation(credentials: {
    username: string
    password: string
    testMode?: boolean
  }, reservationId: string, confirmationNumber: string): Promise<{ success: boolean; error?: string }> {
    try {
      const baseUrl = credentials.testMode ? this.BOOKING_RETRIEVAL_URL : this.BOOKING_RETRIEVAL_URL

      const soapEnvelope = `<?xml version="1.0" encoding="UTF-8"?>
        <soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
          <soap:Header>
            <Interface xmlns="http://www.expediaconnect.com/EQC/BC/2007/02">
              <PayloadInfo correlationId="${Date.now()}" requestId="${Date.now()}" timestamp="${new Date().toISOString()}"/>
            </Interface>
          </soap:Header>
          <soap:Body>
            <BookingConfirmRQ xmlns="http://www.expediaconnect.com/EQC/BC/2007/02">
              <Authentication>
                <username>${credentials.username}</username>
                <password>${credentials.password}</password>
              </Authentication>
              <Booking id="${reservationId}" confirmNumber="${confirmationNumber}"/>
            </BookingConfirmRQ>
          </soap:Body>
        </soap:Envelope>`

      const response = await axios.post(baseUrl, soapEnvelope, {
        headers: {
          'Content-Type': 'text/xml; charset=utf-8',
          'SOAPAction': 'http://www.expediaconnect.com/EQC/BC/2007/02/BookingConfirmRQ',
          'User-Agent': 'BaithakaGHAR-PMS/1.0'
        },
        timeout: 30000
      })

      if (response.status === 200) {
        return { success: true }
      }

      return { success: false, error: 'Confirmation failed' }

    } catch (error: any) {
      console.error('Expedia reservation confirmation error:', error)
      return {
        success: false,
        error: error.response?.data || 'Confirmation failed'
      }
    }
  }

  static async cancelReservation(credentials: {
    username: string
    password: string
    testMode?: boolean
  }, reservationId: string, reason: string): Promise<{ success: boolean; error?: string }> {
    try {
      const baseUrl = credentials.testMode ? this.BOOKING_RETRIEVAL_URL : this.BOOKING_RETRIEVAL_URL

      const soapEnvelope = `<?xml version="1.0" encoding="UTF-8"?>
        <soap:Envelope xmlns="http://schemas.xmlsoap.org/soap/envelope/">
          <soap:Header>
            <Interface xmlns="http://www.expediaconnect.com/EQC/BC/2007/02">
              <PayloadInfo correlationId="${Date.now()}" requestId="${Date.now()}" timestamp="${new Date().toISOString()}"/>
            </Interface>
          </soap:Header>
          <soap:Body>
            <BookingCancelRQ xmlns="http://www.expediaconnect.com/EQC/BC/2007/02">
              <Authentication>
                <username>${credentials.username}</username>
                <password>${credentials.password}</password>
              </Authentication>
              <Booking id="${reservationId}">
                <CancelReason>${reason}</CancelReason>
              </Booking>
            </BookingCancelRQ>
          </soap:Body>
        </soap:Envelope>`

      const response = await axios.post(baseUrl, soapEnvelope, {
        headers: {
          'Content-Type': 'text/xml; charset=utf-8',
          'SOAPAction': 'http://www.expediaconnect.com/EQC/BC/2007/02/BookingCancelRQ',
          'User-Agent': 'BaithakaGHAR-PMS/1.0'
        },
        timeout: 30000
      })

      if (response.status === 200) {
        return { success: true }
      }

      return { success: false, error: 'Cancellation failed' }

    } catch (error: any) {
      console.error('Expedia reservation cancellation error:', error)
      return {
        success: false,
        error: error.response?.data || 'Cancellation failed'
      }
    }
  }

  static async getPropertyConfiguration(credentials: {
    username: string
    password: string
    propertyId: string
    testMode?: boolean
  }): Promise<{ success: boolean; configuration?: any; error?: string }> {
    try {
      const baseUrl = credentials.testMode ? this.TEST_URL : this.PRODUCTION_URL

      const soapEnvelope = `<?xml version="1.0" encoding="UTF-8"?>
        <soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
          <soap:Header>
            <Interface xmlns="http://www.expediaconnect.com/EQC/PC/2013/07">
              <PayloadInfo correlationId="${Date.now()}" requestId="${Date.now()}" timestamp="${new Date().toISOString()}"/>
            </Interface>
          </soap:Header>
          <soap:Body>
            <ProductConfigRQ xmlns="http://www.expediaconnect.com/EQC/PC/2013/07">
              <Authentication>
                <username>${credentials.username}</username>
                <password>${credentials.password}</password>
              </Authentication>
              <Hotel id="${credentials.propertyId}"/>
            </ProductConfigRQ>
          </soap:Body>
        </soap:Envelope>`

      const response = await axios.post(baseUrl, soapEnvelope, {
        headers: {
          'Content-Type': 'text/xml; charset=utf-8',
          'SOAPAction': 'http://www.expediaconnect.com/EQC/PC/2013/07/ProductConfigRQ',
          'User-Agent': 'BaithakaGHAR-PMS/1.0'
        },
        timeout: 30000
      })

      if (response.status === 200) {
        const parsedData = await this.parseXMLResponse(response.data)
        return { success: true, configuration: parsedData }
      }

      return { success: false, error: 'Failed to fetch configuration' }

    } catch (error: any) {
      console.error('Expedia configuration fetch error:', error)
      return {
        success: false,
        error: error.response?.data || 'Failed to fetch configuration'
      }
    }
  }

  private static async parseXMLResponse(xmlData: string): Promise<{ success: boolean; data?: any; error?: string }> {
    return new Promise((resolve) => {
      parseString(xmlData, (err, result) => {
        if (err) {
          resolve({ success: false, error: 'XML parsing failed' })
        } else {
          resolve({ success: true, data: result })
        }
      })
    })
  }

  private static async parseReservationsXML(xmlData: string): Promise<{ success: boolean; reservations?: ExpediaReservation[]; error?: string }> {
    try {
      const parsedData = await this.parseXMLResponse(xmlData)

      if (!parsedData.success) {
        return { success: false, error: 'Failed to parse reservations XML' }
      }

      // Extract reservations from parsed XML
      // This is a simplified example - actual implementation would need to handle Expedia's complex XML structure
      const reservations: ExpediaReservation[] = []

      // Parse the XML data and convert to ExpediaReservation objects
      // The actual structure depends on Expedia's XML schema

      return { success: true, reservations }

    } catch (error) {
      console.error('Error parsing reservations XML:', error)
      return { success: false, error: 'Failed to parse reservations' }
    }
  }

  static async testConnection(credentials: {
    username: string
    password: string
    propertyId: string
    testMode?: boolean
  }): Promise<{ success: boolean; message: string }> {
    try {
      const result = await this.authenticateProperty(credentials)

      if (result.success) {
        return {
          success: true,
          message: 'Connection to Expedia successful'
        }
      }

      return {
        success: false,
        message: result.error || 'Connection test failed'
      }

    } catch (error: any) {
      console.error('Expedia connection test error:', error)
      return {
        success: false,
        message: 'Connection test failed'
      }
    }
  }

  static async handleExpediaMessage(messageData: any): Promise<void> {
    try {
      // Handle different types of messages from Expedia
      const messageType = messageData.type || 'unknown'

      switch (messageType) {
        case 'booking_notification':
          await this.processBookingNotification(messageData)
          break
        case 'modification_notification':
          await this.processModificationNotification(messageData)
          break
        case 'cancellation_notification':
          await this.processCancellationNotification(messageData)
          break
        default:
          console.log('Unknown Expedia message type:', messageType)
      }

    } catch (error) {
      console.error('Error processing Expedia message:', error)
    }
  }

  private static async processBookingNotification(data: any): Promise<void> {
    console.log('Processing Expedia booking notification:', data.bookingId)
    // Implement booking notification processing
  }

  private static async processModificationNotification(data: any): Promise<void> {
    console.log('Processing Expedia modification notification:', data.bookingId)
    // Implement modification notification processing
  }

  private static async processCancellationNotification(data: any): Promise<void> {
    console.log('Processing Expedia cancellation notification:', data.bookingId)
    // Implement cancellation notification processing
  }

  static async getPropertyStatistics(credentials: {
    username: string
    password: string
    propertyId: string
    testMode?: boolean
  }, dateRange: { from: Date; to: Date }): Promise<{
    success: boolean
    statistics?: {
      totalReservations: number
      totalRevenue: number
      averageRate: number
      occupancyRate: number
      cancellationRate: number
      roomTypePerformance: Array<{ roomTypeId: string; bookings: number; revenue: number }>
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
      const cancellationRate = (cancelledReservations / Math.max(totalReservations, 1)) * 100

      const roomTypeStats = reservations.reduce((acc, res) => {
        if (!acc[res.roomDetails.roomTypeId]) {
          acc[res.roomDetails.roomTypeId] = { bookings: 0, revenue: 0 }
        }
        acc[res.roomDetails.roomTypeId].bookings++
        acc[res.roomDetails.roomTypeId].revenue += res.stayDetails.totalAmount
        return acc
      }, {} as { [key: string]: { bookings: number; revenue: number } })

      const roomTypePerformance = Object.entries(roomTypeStats)
        .map(([roomTypeId, stats]) => ({ roomTypeId, ...stats }))
        .sort((a, b) => b.revenue - a.revenue)

      return {
        success: true,
        statistics: {
          totalReservations,
          totalRevenue,
          averageRate,
          occupancyRate: 0,
          cancellationRate,
          roomTypePerformance
        }
      }

    } catch (error: any) {
      console.error('Expedia statistics error:', error)
      return {
        success: false,
        error: error.message || 'Failed to calculate statistics'
      }
    }
  }

  static async bulkUpdateAvailability(credentials: {
    username: string
    password: string
    propertyId: string
    testMode?: boolean
  }, updates: Array<{
    roomTypeId: string
    dateRange: { from: Date; to: Date }
    availability: number
    rate?: number
    restrictions?: {
      minimumLengthOfStay?: number
      maximumLengthOfStay?: number
      closedToArrival?: boolean
      closedToDeparture?: boolean
      stopSell?: boolean
    }
  }>): Promise<{ success: boolean; processedRooms: number; errors?: string[] }> {
    try {
      let processedRooms = 0
      const errors: string[] = []

      for (const update of updates) {
        const dates: ExpediaProductUpdate['dates'] = []
        const currentDate = new Date(update.dateRange.from)
        const endDate = new Date(update.dateRange.to)

        while (currentDate <= endDate) {
          dates.push({
            date: new Date(currentDate),
            baseRate: update.rate || 0,
            availability: update.availability,
            restrictions: update.restrictions || {}
          })
          currentDate.setDate(currentDate.getDate() + 1)
        }

        const productUpdate: ExpediaProductUpdate = {
          roomTypeId: update.roomTypeId,
          rateTypeId: 'standard',
          dates
        }

        const result = await this.updateAvailabilityAndRates(credentials, [productUpdate])
        if (result.success) {
          processedRooms++
        } else {
          errors.push(...(result.errors || [`${update.roomTypeId}: Update failed`]))
        }
      }

      return {
        success: errors.length === 0,
        processedRooms,
        errors: errors.length > 0 ? errors : undefined
      }

    } catch (error: any) {
      console.error('Expedia bulk availability update error:', error)
      return {
        success: false,
        processedRooms: 0,
        errors: [error.message || 'Bulk update failed']
      }
    }
  }

  static async getReservationDetails(credentials: {
    username: string
    password: string
    testMode?: boolean
  }, reservationId: string): Promise<{ success: boolean; reservation?: ExpediaReservation; error?: string }> {
    try {
      const baseUrl = credentials.testMode ? this.BOOKING_RETRIEVAL_URL : this.BOOKING_RETRIEVAL_URL

      const soapEnvelope = `<?xml version="1.0" encoding="UTF-8"?>
        <soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
          <soap:Header>
            <Interface xmlns="http://www.expediaconnect.com/EQC/BR/2014/01">
              <PayloadInfo correlationId="${Date.now()}" requestId="${Date.now()}" timestamp="${new Date().toISOString()}"/>
            </Interface>
          </soap:Header>
          <soap:Body>
            <BookingRetrievalRQ xmlns="http://www.expediaconnect.com/EQC/BR/2014/01">
              <Authentication>
                <username>${credentials.username}</username>
                <password>${credentials.password}</password>
              </Authentication>
              <ParamSet>
                <BookingId>${reservationId}</BookingId>
              </ParamSet>
            </BookingRetrievalRQ>
          </soap:Body>
        </soap:Envelope>`

      const response = await axios.post(baseUrl, soapEnvelope, {
        headers: {
          'Content-Type': 'text/xml; charset=utf-8',
          'SOAPAction': 'http://www.expediaconnect.com/EQC/BR/2014/01/BookingRetrievalRQ',
          'User-Agent': 'BaithakaGHAR-PMS/1.0'
        },
        timeout: 30000
      })

      if (response.status === 200) {
        const parsedData = await this.parseReservationsXML(response.data)

        if (parsedData.success && parsedData.reservations && parsedData.reservations.length > 0) {
          return { success: true, reservation: parsedData.reservations[0] }
        }
      }

      return { success: false, error: 'Reservation not found' }

    } catch (error: any) {
      console.error('Expedia reservation details error:', error)
      return {
        success: false,
        error: error.response?.data || 'Failed to fetch reservation details'
      }
    }
  }
}