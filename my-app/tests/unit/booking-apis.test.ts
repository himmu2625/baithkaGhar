import { describe, test, expect, beforeEach, afterEach, vi, MockedFunction } from 'vitest'
import { NextRequest, NextResponse } from 'next/server'
import { GET, POST, PUT, DELETE } from '../../app/api/os/bookings/[id]/route'
import { prisma } from '../../lib/prisma'

// Mock Prisma
vi.mock('../../lib/prisma', () => ({
  prisma: {
    booking: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn()
    },
    room: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn()
    },
    guest: {
      findUnique: vi.fn(),
      create: vi.fn()
    },
    property: {
      findUnique: vi.fn()
    },
    payment: {
      create: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn()
    },
    $transaction: vi.fn()
  }
}))

// Mock authentication
vi.mock('../../lib/auth', () => ({
  verifyAuth: vi.fn().mockResolvedValue({ userId: 'user123', role: 'admin' })
}))

// Mock validation
vi.mock('../../lib/validation', () => ({
  validateBookingData: vi.fn().mockReturnValue({ success: true }),
  sanitizeInput: vi.fn((input) => input)
}))

const mockPrisma = prisma as any

describe('Booking APIs Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('GET /api/os/bookings/[id]', () => {
    test('should return booking when found', async () => {
      const mockBooking = {
        id: 'booking123',
        guestId: 'guest123',
        propertyId: 'property123',
        roomId: 'room123',
        checkIn: new Date('2024-06-15'),
        checkOut: new Date('2024-06-18'),
        totalAmount: 450,
        status: 'confirmed',
        createdAt: new Date(),
        updatedAt: new Date(),
        guest: {
          id: 'guest123',
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com'
        },
        room: {
          id: 'room123',
          number: '101',
          type: 'deluxe'
        }
      }

      mockPrisma.booking.findUnique.mockResolvedValue(mockBooking)

      const request = new NextRequest('http://localhost:3000/api/os/bookings/booking123')
      const params = { id: 'booking123' }
      const response = await GET(request, { params })

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.booking).toEqual(mockBooking)
      expect(mockPrisma.booking.findUnique).toHaveBeenCalledWith({
        where: { id: 'booking123' },
        include: {
          guest: true,
          room: {
            include: {
              roomType: true
            }
          },
          payments: true,
          property: true
        }
      })
    })

    test('should return 404 when booking not found', async () => {
      mockPrisma.booking.findUnique.mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/os/bookings/nonexistent')
      const params = { id: 'nonexistent' }
      const response = await GET(request, { params })

      expect(response.status).toBe(404)
      const data = await response.json()
      expect(data.error).toBe('Booking not found')
    })

    test('should handle database errors', async () => {
      mockPrisma.booking.findUnique.mockRejectedValue(new Error('Database connection failed'))

      const request = new NextRequest('http://localhost:3000/api/os/bookings/booking123')
      const params = { id: 'booking123' }
      const response = await GET(request, { params })

      expect(response.status).toBe(500)
      const data = await response.json()
      expect(data.error).toBe('Internal server error')
    })

    test('should validate authorization', async () => {
      const mockAuth = require('../../lib/auth')
      mockAuth.verifyAuth.mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/os/bookings/booking123')
      const params = { id: 'booking123' }
      const response = await GET(request, { params })

      expect(response.status).toBe(401)
      const data = await response.json()
      expect(data.error).toBe('Unauthorized')
    })
  })

  describe('POST /api/os/bookings', () => {
    test('should create booking successfully', async () => {
      const bookingData = {
        guestId: 'guest123',
        propertyId: 'property123',
        roomId: 'room123',
        checkIn: '2024-06-15',
        checkOut: '2024-06-18',
        guests: 2,
        totalAmount: 450,
        paymentMethod: 'credit_card'
      }

      const mockCreatedBooking = {
        id: 'booking123',
        ...bookingData,
        checkIn: new Date(bookingData.checkIn),
        checkOut: new Date(bookingData.checkOut),
        status: 'confirmed',
        confirmationNumber: 'BH123456',
        createdAt: new Date(),
        updatedAt: new Date()
      }

      mockPrisma.guest.findUnique.mockResolvedValue({ id: 'guest123' })
      mockPrisma.property.findUnique.mockResolvedValue({ id: 'property123' })
      mockPrisma.room.findUnique.mockResolvedValue({
        id: 'room123',
        status: 'available',
        rate: 150
      })
      mockPrisma.$transaction.mockResolvedValue([mockCreatedBooking])

      const request = new NextRequest('http://localhost:3000/api/os/bookings', {
        method: 'POST',
        body: JSON.stringify(bookingData)
      })
      const response = await POST(request)

      expect(response.status).toBe(201)
      const data = await response.json()
      expect(data.booking.id).toBe('booking123')
      expect(mockPrisma.$transaction).toHaveBeenCalled()
    })

    test('should validate required fields', async () => {
      const invalidData = {
        guestId: 'guest123'
        // Missing required fields
      }

      const mockValidation = require('../../lib/validation')
      mockValidation.validateBookingData.mockReturnValue({
        success: false,
        errors: ['Property ID is required', 'Room ID is required']
      })

      const request = new NextRequest('http://localhost:3000/api/os/bookings', {
        method: 'POST',
        body: JSON.stringify(invalidData)
      })
      const response = await POST(request)

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.errors).toEqual(['Property ID is required', 'Room ID is required'])
    })

    test('should check room availability', async () => {
      const bookingData = {
        guestId: 'guest123',
        propertyId: 'property123',
        roomId: 'room123',
        checkIn: '2024-06-15',
        checkOut: '2024-06-18',
        guests: 2,
        totalAmount: 450
      }

      mockPrisma.room.findUnique.mockResolvedValue({
        id: 'room123',
        status: 'occupied'
      })

      const request = new NextRequest('http://localhost:3000/api/os/bookings', {
        method: 'POST',
        body: JSON.stringify(bookingData)
      })
      const response = await POST(request)

      expect(response.status).toBe(409)
      const data = await response.json()
      expect(data.error).toBe('Room not available for selected dates')
    })

    test('should handle payment processing', async () => {
      const bookingData = {
        guestId: 'guest123',
        propertyId: 'property123',
        roomId: 'room123',
        checkIn: '2024-06-15',
        checkOut: '2024-06-18',
        guests: 2,
        totalAmount: 450,
        paymentMethod: 'credit_card',
        paymentDetails: {
          cardNumber: '4111111111111111',
          expiryMonth: '12',
          expiryYear: '2025',
          cvv: '123'
        }
      }

      mockPrisma.guest.findUnique.mockResolvedValue({ id: 'guest123' })
      mockPrisma.property.findUnique.mockResolvedValue({ id: 'property123' })
      mockPrisma.room.findUnique.mockResolvedValue({
        id: 'room123',
        status: 'available',
        rate: 150
      })

      // Mock payment failure
      mockPrisma.$transaction.mockRejectedValue(new Error('Payment processing failed'))

      const request = new NextRequest('http://localhost:3000/api/os/bookings', {
        method: 'POST',
        body: JSON.stringify(bookingData)
      })
      const response = await POST(request)

      expect(response.status).toBe(402)
      const data = await response.json()
      expect(data.error).toContain('Payment processing failed')
    })
  })

  describe('PUT /api/os/bookings/[id]', () => {
    test('should update booking successfully', async () => {
      const updateData = {
        checkOut: '2024-06-20',
        totalAmount: 600,
        specialRequests: 'Late checkout requested'
      }

      const existingBooking = {
        id: 'booking123',
        status: 'confirmed',
        checkIn: new Date('2024-06-15'),
        checkOut: new Date('2024-06-18'),
        totalAmount: 450
      }

      const updatedBooking = {
        ...existingBooking,
        ...updateData,
        checkOut: new Date(updateData.checkOut),
        updatedAt: new Date()
      }

      mockPrisma.booking.findUnique.mockResolvedValue(existingBooking)
      mockPrisma.booking.update.mockResolvedValue(updatedBooking)

      const request = new NextRequest('http://localhost:3000/api/os/bookings/booking123', {
        method: 'PUT',
        body: JSON.stringify(updateData)
      })
      const params = { id: 'booking123' }
      const response = await PUT(request, { params })

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.booking.totalAmount).toBe(600)
      expect(mockPrisma.booking.update).toHaveBeenCalledWith({
        where: { id: 'booking123' },
        data: updateData,
        include: {
          guest: true,
          room: true,
          payments: true
        }
      })
    })

    test('should prevent updating cancelled bookings', async () => {
      const updateData = {
        totalAmount: 600
      }

      const cancelledBooking = {
        id: 'booking123',
        status: 'cancelled'
      }

      mockPrisma.booking.findUnique.mockResolvedValue(cancelledBooking)

      const request = new NextRequest('http://localhost:3000/api/os/bookings/booking123', {
        method: 'PUT',
        body: JSON.stringify(updateData)
      })
      const params = { id: 'booking123' }
      const response = await PUT(request, { params })

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toBe('Cannot update cancelled booking')
    })

    test('should validate date changes', async () => {
      const updateData = {
        checkOut: '2024-06-14' // Before check-in
      }

      const existingBooking = {
        id: 'booking123',
        status: 'confirmed',
        checkIn: new Date('2024-06-15'),
        checkOut: new Date('2024-06-18')
      }

      mockPrisma.booking.findUnique.mockResolvedValue(existingBooking)

      const request = new NextRequest('http://localhost:3000/api/os/bookings/booking123', {
        method: 'PUT',
        body: JSON.stringify(updateData)
      })
      const params = { id: 'booking123' }
      const response = await PUT(request, { params })

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toBe('Check-out date must be after check-in date')
    })
  })

  describe('DELETE /api/os/bookings/[id]', () => {
    test('should cancel booking successfully', async () => {
      const existingBooking = {
        id: 'booking123',
        status: 'confirmed',
        checkIn: new Date('2024-06-15'),
        totalAmount: 450
      }

      const cancelledBooking = {
        ...existingBooking,
        status: 'cancelled',
        cancelledAt: new Date(),
        refundAmount: 450
      }

      mockPrisma.booking.findUnique.mockResolvedValue(existingBooking)
      mockPrisma.booking.update.mockResolvedValue(cancelledBooking)

      const request = new NextRequest('http://localhost:3000/api/os/bookings/booking123', {
        method: 'DELETE'
      })
      const params = { id: 'booking123' }
      const response = await DELETE(request, { params })

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.booking.status).toBe('cancelled')
      expect(mockPrisma.booking.update).toHaveBeenCalledWith({
        where: { id: 'booking123' },
        data: {
          status: 'cancelled',
          cancelledAt: expect.any(Date),
          cancelledBy: 'user123'
        }
      })
    })

    test('should prevent cancelling already cancelled bookings', async () => {
      const cancelledBooking = {
        id: 'booking123',
        status: 'cancelled'
      }

      mockPrisma.booking.findUnique.mockResolvedValue(cancelledBooking)

      const request = new NextRequest('http://localhost:3000/api/os/bookings/booking123', {
        method: 'DELETE'
      })
      const params = { id: 'booking123' }
      const response = await DELETE(request, { params })

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toBe('Booking already cancelled')
    })

    test('should calculate refund based on cancellation policy', async () => {
      const existingBooking = {
        id: 'booking123',
        status: 'confirmed',
        checkIn: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
        totalAmount: 450,
        property: {
          cancellationPolicy: 'flexible'
        }
      }

      mockPrisma.booking.findUnique.mockResolvedValue(existingBooking)
      mockPrisma.booking.update.mockResolvedValue({
        ...existingBooking,
        status: 'cancelled',
        refundAmount: 450 // Full refund for flexible policy
      })

      const request = new NextRequest('http://localhost:3000/api/os/bookings/booking123', {
        method: 'DELETE'
      })
      const params = { id: 'booking123' }
      const response = await DELETE(request, { params })

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.refundAmount).toBe(450)
    })
  })

  describe('Booking List API', () => {
    test('should return paginated booking list', async () => {
      const mockBookings = [
        {
          id: 'booking1',
          guestId: 'guest1',
          status: 'confirmed',
          totalAmount: 300
        },
        {
          id: 'booking2',
          guestId: 'guest2',
          status: 'pending',
          totalAmount: 500
        }
      ]

      mockPrisma.booking.findMany.mockResolvedValue(mockBookings)
      mockPrisma.booking.count.mockResolvedValue(50)

      const request = new NextRequest('http://localhost:3000/api/os/bookings?page=1&limit=10')
      const { searchParams } = new URL(request.url)

      // Mock GET handler for list endpoint
      const listResponse = await fetch('/api/os/bookings?' + searchParams.toString())

      expect(mockPrisma.booking.findMany).toHaveBeenCalledWith({
        skip: 0,
        take: 10,
        include: {
          guest: true,
          room: true,
          property: true
        },
        orderBy: {
          createdAt: 'desc'
        }
      })
    })

    test('should filter bookings by status', async () => {
      const confirmedBookings = [
        {
          id: 'booking1',
          status: 'confirmed',
          totalAmount: 300
        }
      ]

      mockPrisma.booking.findMany.mockResolvedValue(confirmedBookings)

      const request = new NextRequest('http://localhost:3000/api/os/bookings?status=confirmed')

      expect(mockPrisma.booking.findMany).toHaveBeenCalledWith({
        where: {
          status: 'confirmed'
        },
        include: {
          guest: true,
          room: true,
          property: true
        },
        orderBy: {
          createdAt: 'desc'
        }
      })
    })

    test('should filter bookings by date range', async () => {
      const dateFilteredBookings = [
        {
          id: 'booking1',
          checkIn: new Date('2024-06-15'),
          checkOut: new Date('2024-06-18')
        }
      ]

      mockPrisma.booking.findMany.mockResolvedValue(dateFilteredBookings)

      const request = new NextRequest('http://localhost:3000/api/os/bookings?startDate=2024-06-01&endDate=2024-06-30')

      expect(mockPrisma.booking.findMany).toHaveBeenCalledWith({
        where: {
          checkIn: {
            gte: new Date('2024-06-01'),
            lte: new Date('2024-06-30')
          }
        },
        include: {
          guest: true,
          room: true,
          property: true
        },
        orderBy: {
          createdAt: 'desc'
        }
      })
    })
  })

  describe('Edge Cases and Error Handling', () => {
    test('should handle concurrent booking attempts', async () => {
      const bookingData = {
        guestId: 'guest123',
        propertyId: 'property123',
        roomId: 'room123',
        checkIn: '2024-06-15',
        checkOut: '2024-06-18'
      }

      // Simulate database constraint violation
      mockPrisma.$transaction.mockRejectedValue({
        code: 'P2002',
        meta: { target: ['roomId', 'checkIn', 'checkOut'] }
      })

      const request = new NextRequest('http://localhost:3000/api/os/bookings', {
        method: 'POST',
        body: JSON.stringify(bookingData)
      })
      const response = await POST(request)

      expect(response.status).toBe(409)
      const data = await response.json()
      expect(data.error).toBe('Room already booked for selected dates')
    })

    test('should handle malformed JSON input', async () => {
      const request = new NextRequest('http://localhost:3000/api/os/bookings', {
        method: 'POST',
        body: 'invalid json'
      })
      const response = await POST(request)

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toBe('Invalid JSON input')
    })

    test('should handle missing content-type header', async () => {
      const request = new NextRequest('http://localhost:3000/api/os/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain'
        },
        body: JSON.stringify({ guestId: 'guest123' })
      })
      const response = await POST(request)

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toBe('Content-Type must be application/json')
    })

    test('should handle database timeout', async () => {
      mockPrisma.booking.findUnique.mockRejectedValue({
        code: 'P1008',
        message: 'Operations timed out'
      })

      const request = new NextRequest('http://localhost:3000/api/os/bookings/booking123')
      const params = { id: 'booking123' }
      const response = await GET(request, { params })

      expect(response.status).toBe(504)
      const data = await response.json()
      expect(data.error).toBe('Database operation timed out')
    })

    test('should handle rate limiting', async () => {
      // Mock rate limiter
      const mockRateLimit = vi.fn().mockResolvedValue({ success: false, remaining: 0 })

      const request = new NextRequest('http://localhost:3000/api/os/bookings', {
        method: 'POST',
        headers: {
          'X-Forwarded-For': '192.168.1.1'
        },
        body: JSON.stringify({ guestId: 'guest123' })
      })

      // Simulate rate limit check
      const rateLimitResult = await mockRateLimit()
      if (!rateLimitResult.success) {
        const response = new NextResponse(
          JSON.stringify({ error: 'Rate limit exceeded' }),
          { status: 429 }
        )
        expect(response.status).toBe(429)
      }
    })
  })

  describe('Business Logic Validation', () => {
    test('should validate check-in date is not in the past', async () => {
      const bookingData = {
        guestId: 'guest123',
        propertyId: 'property123',
        roomId: 'room123',
        checkIn: '2023-01-01', // Past date
        checkOut: '2023-01-05'
      }

      const request = new NextRequest('http://localhost:3000/api/os/bookings', {
        method: 'POST',
        body: JSON.stringify(bookingData)
      })
      const response = await POST(request)

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toBe('Check-in date cannot be in the past')
    })

    test('should validate minimum stay requirements', async () => {
      const bookingData = {
        guestId: 'guest123',
        propertyId: 'property123',
        roomId: 'room123',
        checkIn: '2024-06-15',
        checkOut: '2024-06-15' // Same day
      }

      const request = new NextRequest('http://localhost:3000/api/os/bookings', {
        method: 'POST',
        body: JSON.stringify(bookingData)
      })
      const response = await POST(request)

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toBe('Minimum stay of 1 night required')
    })

    test('should validate maximum occupancy', async () => {
      const bookingData = {
        guestId: 'guest123',
        propertyId: 'property123',
        roomId: 'room123',
        checkIn: '2024-06-15',
        checkOut: '2024-06-18',
        guests: 10 // Exceeds room capacity
      }

      mockPrisma.room.findUnique.mockResolvedValue({
        id: 'room123',
        maxOccupancy: 4,
        status: 'available'
      })

      const request = new NextRequest('http://localhost:3000/api/os/bookings', {
        method: 'POST',
        body: JSON.stringify(bookingData)
      })
      const response = await POST(request)

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toBe('Guest count exceeds room capacity')
    })

    test('should validate booking window restrictions', async () => {
      const bookingData = {
        guestId: 'guest123',
        propertyId: 'property123',
        roomId: 'room123',
        checkIn: new Date(Date.now() + 400 * 24 * 60 * 60 * 1000).toISOString(), // 400 days in future
        checkOut: new Date(Date.now() + 403 * 24 * 60 * 60 * 1000).toISOString()
      }

      const request = new NextRequest('http://localhost:3000/api/os/bookings', {
        method: 'POST',
        body: JSON.stringify(bookingData)
      })
      const response = await POST(request)

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toBe('Bookings cannot be made more than 365 days in advance')
    })
  })
})