import { describe, test, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest'
import { createTestClient, TestClient } from '../utils/test-client'
import { setupTestDatabase, cleanupTestDatabase, seedTestData } from '../utils/test-database'
import { createTestUser, createTestProperty, createTestRoom, createTestGuest } from '../utils/test-fixtures'

describe('Booking Flow Integration Tests', () => {
  let client: TestClient
  let testUser: any
  let testProperty: any
  let testRoom: any
  let testGuest: any

  beforeAll(async () => {
    await setupTestDatabase()
    client = createTestClient()
  })

  afterAll(async () => {
    await cleanupTestDatabase()
  })

  beforeEach(async () => {
    await seedTestData()
    testUser = await createTestUser({
      email: 'test@example.com',
      role: 'admin'
    })
    testProperty = await createTestProperty({
      name: 'Test Hotel',
      address: '123 Test Street'
    })
    testRoom = await createTestRoom({
      propertyId: testProperty.id,
      number: '101',
      type: 'standard',
      rate: 150,
      maxOccupancy: 2
    })
    testGuest = await createTestGuest({
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      phone: '+1234567890'
    })
  })

  afterEach(async () => {
    await client.cleanup()
  })

  describe('Complete Booking Flow', () => {
    test('should complete full booking workflow from search to confirmation', async () => {
      // Step 1: Search for available rooms
      const searchResponse = await client.post('/api/os/search/rooms', {
        propertyId: testProperty.id,
        checkIn: '2024-07-15',
        checkOut: '2024-07-18',
        guests: 2
      })

      expect(searchResponse.status).toBe(200)
      expect(searchResponse.data.rooms).toHaveLength(1)
      expect(searchResponse.data.rooms[0].id).toBe(testRoom.id)

      // Step 2: Get room availability details
      const availabilityResponse = await client.get(
        `/api/os/rooms/${testRoom.id}/availability?checkIn=2024-07-15&checkOut=2024-07-18`
      )

      expect(availabilityResponse.status).toBe(200)
      expect(availabilityResponse.data.available).toBe(true)
      expect(availabilityResponse.data.rate).toBe(150)

      // Step 3: Create booking
      const bookingData = {
        guestId: testGuest.id,
        propertyId: testProperty.id,
        roomId: testRoom.id,
        checkIn: '2024-07-15',
        checkOut: '2024-07-18',
        guests: 2,
        totalAmount: 450, // 3 nights * 150
        paymentMethod: 'credit_card',
        paymentDetails: {
          cardNumber: '4111111111111111',
          expiryMonth: '12',
          expiryYear: '2025',
          cvv: '123',
          cardholderName: 'John Doe'
        }
      }

      const bookingResponse = await client.post('/api/os/bookings', bookingData)

      expect(bookingResponse.status).toBe(201)
      expect(bookingResponse.data.booking.status).toBe('confirmed')
      expect(bookingResponse.data.booking.confirmationNumber).toBeDefined()
      expect(bookingResponse.data.booking.totalAmount).toBe(450)

      const bookingId = bookingResponse.data.booking.id

      // Step 4: Verify booking details
      const bookingDetailsResponse = await client.get(`/api/os/bookings/${bookingId}`)

      expect(bookingDetailsResponse.status).toBe(200)
      expect(bookingDetailsResponse.data.booking.guest.email).toBe('john.doe@example.com')
      expect(bookingDetailsResponse.data.booking.room.number).toBe('101')

      // Step 5: Verify room status updated
      const roomStatusResponse = await client.get(`/api/os/rooms/${testRoom.id}`)

      expect(roomStatusResponse.status).toBe(200)
      expect(roomStatusResponse.data.room.bookings).toHaveLength(1)

      // Step 6: Verify payment was processed
      const paymentsResponse = await client.get(`/api/os/bookings/${bookingId}/payments`)

      expect(paymentsResponse.status).toBe(200)
      expect(paymentsResponse.data.payments).toHaveLength(1)
      expect(paymentsResponse.data.payments[0].status).toBe('completed')
      expect(paymentsResponse.data.payments[0].amount).toBe(450)
    })

    test('should handle booking conflicts gracefully', async () => {
      // Create first booking
      const firstBookingData = {
        guestId: testGuest.id,
        propertyId: testProperty.id,
        roomId: testRoom.id,
        checkIn: '2024-07-15',
        checkOut: '2024-07-18',
        guests: 2,
        totalAmount: 450
      }

      const firstBookingResponse = await client.post('/api/os/bookings', firstBookingData)
      expect(firstBookingResponse.status).toBe(201)

      // Attempt to create conflicting booking
      const conflictingBookingData = {
        guestId: testGuest.id,
        propertyId: testProperty.id,
        roomId: testRoom.id,
        checkIn: '2024-07-16', // Overlapping dates
        checkOut: '2024-07-19',
        guests: 2,
        totalAmount: 450
      }

      const conflictResponse = await client.post('/api/os/bookings', conflictingBookingData)

      expect(conflictResponse.status).toBe(409)
      expect(conflictResponse.data.error).toBe('Room not available for selected dates')
    })

    test('should handle payment failures and rollback booking', async () => {
      const bookingData = {
        guestId: testGuest.id,
        propertyId: testProperty.id,
        roomId: testRoom.id,
        checkIn: '2024-07-15',
        checkOut: '2024-07-18',
        guests: 2,
        totalAmount: 450,
        paymentMethod: 'credit_card',
        paymentDetails: {
          cardNumber: '4000000000000002', // Declined card
          expiryMonth: '12',
          expiryYear: '2025',
          cvv: '123'
        }
      }

      const bookingResponse = await client.post('/api/os/bookings', bookingData)

      expect(bookingResponse.status).toBe(402)
      expect(bookingResponse.data.error).toContain('Payment declined')

      // Verify no booking was created
      const bookingsResponse = await client.get('/api/os/bookings')
      expect(bookingsResponse.data.bookings).toHaveLength(0)

      // Verify room is still available
      const availabilityResponse = await client.get(
        `/api/os/rooms/${testRoom.id}/availability?checkIn=2024-07-15&checkOut=2024-07-18`
      )
      expect(availabilityResponse.data.available).toBe(true)
    })
  })

  describe('Booking Modification Flow', () => {
    let bookingId: string

    beforeEach(async () => {
      // Create a booking for modification tests
      const bookingData = {
        guestId: testGuest.id,
        propertyId: testProperty.id,
        roomId: testRoom.id,
        checkIn: '2024-07-15',
        checkOut: '2024-07-18',
        guests: 2,
        totalAmount: 450
      }

      const response = await client.post('/api/os/bookings', bookingData)
      bookingId = response.data.booking.id
    })

    test('should extend booking checkout date', async () => {
      const updateData = {
        checkOut: '2024-07-20',
        totalAmount: 750 // 5 nights * 150
      }

      const updateResponse = await client.put(`/api/os/bookings/${bookingId}`, updateData)

      expect(updateResponse.status).toBe(200)
      expect(updateResponse.data.booking.checkOut).toBe('2024-07-20T00:00:00.000Z')
      expect(updateResponse.data.booking.totalAmount).toBe(750)

      // Verify additional payment was processed
      const paymentsResponse = await client.get(`/api/os/bookings/${bookingId}/payments`)
      expect(paymentsResponse.data.payments).toHaveLength(2) // Original + additional
    })

    test('should add special requests to booking', async () => {
      const updateData = {
        specialRequests: 'Late checkout requested, extra towels needed'
      }

      const updateResponse = await client.put(`/api/os/bookings/${bookingId}`, updateData)

      expect(updateResponse.status).toBe(200)
      expect(updateResponse.data.booking.specialRequests).toBe(updateData.specialRequests)
    })

    test('should prevent invalid date modifications', async () => {
      const updateData = {
        checkOut: '2024-07-14' // Before check-in
      }

      const updateResponse = await client.put(`/api/os/bookings/${bookingId}`, updateData)

      expect(updateResponse.status).toBe(400)
      expect(updateResponse.data.error).toBe('Check-out date must be after check-in date')
    })
  })

  describe('Booking Cancellation Flow', () => {
    let bookingId: string

    beforeEach(async () => {
      const bookingData = {
        guestId: testGuest.id,
        propertyId: testProperty.id,
        roomId: testRoom.id,
        checkIn: '2024-07-15',
        checkOut: '2024-07-18',
        guests: 2,
        totalAmount: 450
      }

      const response = await client.post('/api/os/bookings', bookingData)
      bookingId = response.data.booking.id
    })

    test('should cancel booking with full refund', async () => {
      const cancellationResponse = await client.delete(`/api/os/bookings/${bookingId}`)

      expect(cancellationResponse.status).toBe(200)
      expect(cancellationResponse.data.booking.status).toBe('cancelled')
      expect(cancellationResponse.data.refundAmount).toBe(450)

      // Verify booking is marked as cancelled
      const bookingResponse = await client.get(`/api/os/bookings/${bookingId}`)
      expect(bookingResponse.data.booking.status).toBe('cancelled')
      expect(bookingResponse.data.booking.cancelledAt).toBeDefined()

      // Verify room is available again
      const availabilityResponse = await client.get(
        `/api/os/rooms/${testRoom.id}/availability?checkIn=2024-07-15&checkOut=2024-07-18`
      )
      expect(availabilityResponse.data.available).toBe(true)
    })

    test('should process partial refund for late cancellations', async () => {
      // Mock late cancellation (within 24 hours of check-in)
      const checkInTomorrow = new Date()
      checkInTomorrow.setDate(checkInTomorrow.getDate() + 1)

      // Update booking to be tomorrow
      await client.put(`/api/os/bookings/${bookingId}`, {
        checkIn: checkInTomorrow.toISOString().split('T')[0]
      })

      const cancellationResponse = await client.delete(`/api/os/bookings/${bookingId}`)

      expect(cancellationResponse.status).toBe(200)
      expect(cancellationResponse.data.refundAmount).toBeLessThan(450) // Partial refund
      expect(cancellationResponse.data.cancellationFee).toBeGreaterThan(0)
    })
  })

  describe('Multi-Room Booking Flow', () => {
    let secondRoom: any

    beforeEach(async () => {
      secondRoom = await createTestRoom({
        propertyId: testProperty.id,
        number: '102',
        type: 'deluxe',
        rate: 200,
        maxOccupancy: 4
      })
    })

    test('should create group booking with multiple rooms', async () => {
      const groupBookingData = {
        guestId: testGuest.id,
        propertyId: testProperty.id,
        rooms: [
          {
            roomId: testRoom.id,
            guests: 2
          },
          {
            roomId: secondRoom.id,
            guests: 4
          }
        ],
        checkIn: '2024-07-15',
        checkOut: '2024-07-18',
        groupName: 'Wedding Party',
        totalAmount: 1050 // (150 + 200) * 3 nights
      }

      const groupBookingResponse = await client.post('/api/os/bookings/group', groupBookingData)

      expect(groupBookingResponse.status).toBe(201)
      expect(groupBookingResponse.data.groupBooking.bookings).toHaveLength(2)
      expect(groupBookingResponse.data.groupBooking.totalAmount).toBe(1050)

      // Verify individual bookings were created
      const bookingsResponse = await client.get('/api/os/bookings')
      expect(bookingsResponse.data.bookings).toHaveLength(2)

      // Verify rooms are booked
      for (const booking of groupBookingResponse.data.groupBooking.bookings) {
        const bookingDetails = await client.get(`/api/os/bookings/${booking.id}`)
        expect(bookingDetails.data.booking.status).toBe('confirmed')
      }
    })

    test('should handle partial failure in group booking', async () => {
      // Book one room first to create conflict
      await client.post('/api/os/bookings', {
        guestId: testGuest.id,
        roomId: testRoom.id,
        checkIn: '2024-07-15',
        checkOut: '2024-07-18',
        totalAmount: 450
      })

      const groupBookingData = {
        guestId: testGuest.id,
        propertyId: testProperty.id,
        rooms: [
          {
            roomId: testRoom.id, // This will conflict
            guests: 2
          },
          {
            roomId: secondRoom.id,
            guests: 4
          }
        ],
        checkIn: '2024-07-15',
        checkOut: '2024-07-18',
        totalAmount: 1050
      }

      const groupBookingResponse = await client.post('/api/os/bookings/group', groupBookingData)

      expect(groupBookingResponse.status).toBe(409)
      expect(groupBookingResponse.data.error).toContain('Some rooms not available')

      // Verify no bookings were created for the group
      const bookingsResponse = await client.get('/api/os/bookings')
      expect(bookingsResponse.data.bookings).toHaveLength(1) // Only the first booking
    })
  })

  describe('Check-in/Check-out Flow', () => {
    let bookingId: string

    beforeEach(async () => {
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      const dayAfterTomorrow = new Date()
      dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 3)

      const bookingData = {
        guestId: testGuest.id,
        propertyId: testProperty.id,
        roomId: testRoom.id,
        checkIn: tomorrow.toISOString().split('T')[0],
        checkOut: dayAfterTomorrow.toISOString().split('T')[0],
        guests: 2,
        totalAmount: 300
      }

      const response = await client.post('/api/os/bookings', bookingData)
      bookingId = response.data.booking.id
    })

    test('should process check-in successfully', async () => {
      const checkInData = {
        actualCheckIn: new Date().toISOString(),
        roomAssigned: testRoom.number,
        guestSignature: 'data:image/png;base64,signature_data',
        additionalGuests: []
      }

      const checkInResponse = await client.post(`/api/os/bookings/${bookingId}/checkin`, checkInData)

      expect(checkInResponse.status).toBe(200)
      expect(checkInResponse.data.booking.status).toBe('checked_in')
      expect(checkInResponse.data.booking.actualCheckIn).toBeDefined()

      // Verify room status updated
      const roomResponse = await client.get(`/api/os/rooms/${testRoom.id}`)
      expect(roomResponse.data.room.status).toBe('occupied')
    })

    test('should process check-out successfully', async () => {
      // First check in
      await client.post(`/api/os/bookings/${bookingId}/checkin`, {
        actualCheckIn: new Date().toISOString()
      })

      const checkOutData = {
        actualCheckOut: new Date().toISOString(),
        damages: [],
        additionalCharges: [],
        guestFeedback: {
          rating: 5,
          comments: 'Great stay!'
        }
      }

      const checkOutResponse = await client.post(`/api/os/bookings/${bookingId}/checkout`, checkOutData)

      expect(checkOutResponse.status).toBe(200)
      expect(checkOutResponse.data.booking.status).toBe('checked_out')
      expect(checkOutResponse.data.booking.actualCheckOut).toBeDefined()

      // Verify room status updated
      const roomResponse = await client.get(`/api/os/rooms/${testRoom.id}`)
      expect(roomResponse.data.room.status).toBe('dirty')
    })

    test('should handle early check-out with partial refund', async () => {
      // Check in first
      await client.post(`/api/os/bookings/${bookingId}/checkin`, {
        actualCheckIn: new Date().toISOString()
      })

      const earlyCheckOutData = {
        actualCheckOut: new Date().toISOString(),
        earlyCheckOut: true,
        reason: 'Emergency'
      }

      const checkOutResponse = await client.post(`/api/os/bookings/${bookingId}/checkout`, earlyCheckOutData)

      expect(checkOutResponse.status).toBe(200)
      expect(checkOutResponse.data.refund).toBeGreaterThan(0)
      expect(checkOutResponse.data.booking.status).toBe('checked_out')
    })
  })

  describe('Booking Notifications Flow', () => {
    test('should send confirmation email after booking', async () => {
      const bookingData = {
        guestId: testGuest.id,
        propertyId: testProperty.id,
        roomId: testRoom.id,
        checkIn: '2024-07-15',
        checkOut: '2024-07-18',
        guests: 2,
        totalAmount: 450
      }

      const bookingResponse = await client.post('/api/os/bookings', bookingData)
      const bookingId = bookingResponse.data.booking.id

      // Verify notification was queued
      const notificationsResponse = await client.get(`/api/os/bookings/${bookingId}/notifications`)

      expect(notificationsResponse.status).toBe(200)
      expect(notificationsResponse.data.notifications).toHaveLength(1)
      expect(notificationsResponse.data.notifications[0].type).toBe('booking_confirmation')
      expect(notificationsResponse.data.notifications[0].status).toBe('sent')
    })

    test('should send reminder notifications before check-in', async () => {
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)

      const bookingData = {
        guestId: testGuest.id,
        propertyId: testProperty.id,
        roomId: testRoom.id,
        checkIn: tomorrow.toISOString().split('T')[0],
        checkOut: '2024-07-18',
        guests: 2,
        totalAmount: 450
      }

      const bookingResponse = await client.post('/api/os/bookings', bookingData)
      const bookingId = bookingResponse.data.booking.id

      // Trigger reminder job
      await client.post('/api/os/jobs/reminder-notifications')

      // Check if reminder was sent
      const notificationsResponse = await client.get(`/api/os/bookings/${bookingId}/notifications`)
      const reminderNotification = notificationsResponse.data.notifications.find(
        (n: any) => n.type === 'check_in_reminder'
      )

      expect(reminderNotification).toBeDefined()
      expect(reminderNotification.status).toBe('sent')
    })
  })

  describe('Booking Analytics Integration', () => {
    test('should update analytics after booking creation', async () => {
      const bookingData = {
        guestId: testGuest.id,
        propertyId: testProperty.id,
        roomId: testRoom.id,
        checkIn: '2024-07-15',
        checkOut: '2024-07-18',
        guests: 2,
        totalAmount: 450
      }

      await client.post('/api/os/bookings', bookingData)

      // Check analytics were updated
      const analyticsResponse = await client.get(`/api/os/analytics/bookings?propertyId=${testProperty.id}&period=daily`)

      expect(analyticsResponse.status).toBe(200)
      expect(analyticsResponse.data.metrics.totalBookings).toBeGreaterThan(0)
      expect(analyticsResponse.data.metrics.totalRevenue).toBe(450)
    })

    test('should track booking source and channel', async () => {
      const bookingData = {
        guestId: testGuest.id,
        propertyId: testProperty.id,
        roomId: testRoom.id,
        checkIn: '2024-07-15',
        checkOut: '2024-07-18',
        guests: 2,
        totalAmount: 450,
        source: 'website',
        channel: 'direct',
        utmSource: 'google',
        utmMedium: 'cpc'
      }

      const bookingResponse = await client.post('/api/os/bookings', bookingData)

      expect(bookingResponse.data.booking.source).toBe('website')
      expect(bookingResponse.data.booking.channel).toBe('direct')

      // Verify tracking data
      const trackingResponse = await client.get(`/api/os/analytics/sources?propertyId=${testProperty.id}`)
      expect(trackingResponse.data.sources.website).toBeGreaterThan(0)
    })
  })
})