import { z } from 'zod'
import { startOfDay, endOfDay, addDays, isAfter, isBefore, differenceInDays } from 'date-fns'

// Enhanced booking validation schemas
export const createBookingSchema = z.object({
  guestDetails: z.object({
    name: z.string()
      .min(2, 'Guest name must be at least 2 characters')
      .max(100, 'Guest name must be less than 100 characters')
      .regex(/^[a-zA-Z\s]+$/, 'Guest name can only contain letters and spaces'),
    email: z.string()
      .email('Invalid email format')
      .min(5, 'Email must be at least 5 characters')
      .max(255, 'Email must be less than 255 characters')
      .toLowerCase(),
    phone: z.string()
      .optional()
      .refine((val) => !val || /^[\+]?[\d\s\-\(\)]+$/.test(val), {
        message: 'Invalid phone number format'
      })
  }),
  dateFrom: z.string()
    .datetime('Invalid check-in date format')
    .transform((val) => new Date(val)),
  dateTo: z.string()
    .datetime('Invalid check-out date format')
    .transform((val) => new Date(val)),
  guests: z.number()
    .int('Guest count must be a whole number')
    .min(1, 'At least 1 guest is required')
    .max(20, 'Maximum 20 guests allowed'),
  children: z.number()
    .int('Children count must be a whole number')
    .min(0, 'Children count cannot be negative')
    .max(10, 'Maximum 10 children allowed')
    .optional()
    .default(0),
  rooms: z.number()
    .int('Room count must be a whole number')
    .min(1, 'At least 1 room is required')
    .max(10, 'Maximum 10 rooms allowed'),
  totalAmount: z.number()
    .positive('Total amount must be positive')
    .max(1000000, 'Maximum booking amount is ₹10,00,000'),
  specialRequests: z.string()
    .max(1000, 'Special requests must be less than 1000 characters')
    .optional(),
  paymentStatus: z.enum(['pending', 'paid', 'failed', 'refunded'])
    .optional()
    .default('pending'),
  status: z.enum(['pending', 'confirmed', 'cancelled', 'completed'])
    .optional()
    .default('confirmed'),
  adminNotes: z.string()
    .max(2000, 'Admin notes must be less than 2000 characters')
    .optional(),
  source: z.enum(['direct', 'booking.com', 'airbnb', 'expedia', 'agoda', 'phone', 'walkin'])
    .optional()
    .default('direct'),
  referralCode: z.string()
    .max(50, 'Referral code must be less than 50 characters')
    .optional(),
  roomPreference: z.object({
    type: z.string().optional(),
    floor: z.string().optional(),
    view: z.string().optional(),
    accessibility: z.boolean().optional()
  }).optional()
}).refine((data) => {
  // Date validation: check-out must be after check-in
  return isAfter(data.dateTo, data.dateFrom)
}, {
  message: 'Check-out date must be after check-in date',
  path: ['dateTo']
}).refine((data) => {
  // Date validation: check-in must be today or in the future
  const today = startOfDay(new Date())
  return !isBefore(startOfDay(data.dateFrom), today)
}, {
  message: 'Check-in date cannot be in the past',
  path: ['dateFrom']
}).refine((data) => {
  // Maximum stay validation (e.g., 30 days)
  const nights = differenceInDays(data.dateTo, data.dateFrom)
  return nights <= 30
}, {
  message: 'Maximum stay duration is 30 nights',
  path: ['dateTo']
}).refine((data) => {
  // Minimum stay validation
  const nights = differenceInDays(data.dateTo, data.dateFrom)
  return nights >= 1
}, {
  message: 'Minimum stay duration is 1 night',
  path: ['dateTo']
}).refine((data) => {
  // Guest to room ratio validation
  const totalGuests = data.guests + (data.children || 0)
  const maxGuestsPerRoom = 4 // Configurable
  return totalGuests <= (data.rooms * maxGuestsPerRoom)
}, {
  message: 'Too many guests for the number of rooms selected',
  path: ['guests']
})

export const updateBookingSchema = z.object({
  guestDetails: z.object({
    name: z.string()
      .min(2, 'Guest name must be at least 2 characters')
      .max(100, 'Guest name must be less than 100 characters')
      .optional(),
    email: z.string()
      .email('Invalid email format')
      .toLowerCase()
      .optional(),
    phone: z.string()
      .refine((val) => !val || /^[\+]?[\d\s\-\(\)]+$/.test(val), {
        message: 'Invalid phone number format'
      })
      .optional()
  }).optional(),
  dateFrom: z.string()
    .datetime('Invalid check-in date format')
    .transform((val) => new Date(val))
    .optional(),
  dateTo: z.string()
    .datetime('Invalid check-out date format')
    .transform((val) => new Date(val))
    .optional(),
  guests: z.number()
    .int('Guest count must be a whole number')
    .min(1, 'At least 1 guest is required')
    .max(20, 'Maximum 20 guests allowed')
    .optional(),
  children: z.number()
    .int('Children count must be a whole number')
    .min(0, 'Children count cannot be negative')
    .max(10, 'Maximum 10 children allowed')
    .optional(),
  rooms: z.number()
    .int('Room count must be a whole number')
    .min(1, 'At least 1 room is required')
    .max(10, 'Maximum 10 rooms allowed')
    .optional(),
  totalPrice: z.number()
    .positive('Total amount must be positive')
    .max(1000000, 'Maximum booking amount is ₹10,00,000')
    .optional(),
  specialRequests: z.string()
    .max(1000, 'Special requests must be less than 1000 characters')
    .optional(),
  paymentStatus: z.enum(['pending', 'paid', 'failed', 'refunded'])
    .optional(),
  status: z.enum(['pending', 'confirmed', 'cancelled', 'completed'])
    .optional(),
  adminNotes: z.string()
    .max(2000, 'Admin notes must be less than 2000 characters')
    .optional(),
  allocatedRoom: z.object({
    unitTypeCode: z.string(),
    unitTypeName: z.string(),
    roomNumber: z.string(),
    roomId: z.string()
  }).optional(),
  checkInTime: z.string()
    .datetime('Invalid check-in time format')
    .transform((val) => new Date(val))
    .optional(),
  checkOutTime: z.string()
    .datetime('Invalid check-out time format')
    .transform((val) => new Date(val))
    .optional(),
  rating: z.number()
    .int('Rating must be a whole number')
    .min(1, 'Minimum rating is 1')
    .max(5, 'Maximum rating is 5')
    .optional(),
  review: z.string()
    .max(2000, 'Review must be less than 2000 characters')
    .optional(),
  cancellationReason: z.string()
    .max(500, 'Cancellation reason must be less than 500 characters')
    .optional(),
  refundAmount: z.number()
    .min(0, 'Refund amount cannot be negative')
    .optional(),
  refundReason: z.string()
    .max(500, 'Refund reason must be less than 500 characters')
    .optional()
}).refine((data) => {
  // Date validation for updates
  if (data.dateFrom && data.dateTo) {
    return isAfter(data.dateTo, data.dateFrom)
  }
  return true
}, {
  message: 'Check-out date must be after check-in date',
  path: ['dateTo']
}).refine((data) => {
  // Check-in time validation
  if (data.checkInTime && data.dateFrom) {
    const checkInDate = startOfDay(data.dateFrom)
    const checkInTime = data.checkInTime
    return checkInTime >= checkInDate && checkInTime <= endOfDay(data.dateFrom)
  }
  return true
}, {
  message: 'Check-in time must be on the check-in date',
  path: ['checkInTime']
}).refine((data) => {
  // Check-out time validation
  if (data.checkOutTime && data.dateTo) {
    const checkOutDate = startOfDay(data.dateTo)
    const checkOutTime = data.checkOutTime
    return checkOutTime >= checkOutDate && checkOutTime <= endOfDay(data.dateTo)
  }
  return true
}, {
  message: 'Check-out time must be on the check-out date',
  path: ['checkOutTime']
}).refine((data) => {
  // Rating and review validation
  if (data.rating && !data.review) {
    return false
  }
  return true
}, {
  message: 'Review is required when providing a rating',
  path: ['review']
})

export const bulkUpdateSchema = z.object({
  bookingIds: z.array(z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid booking ID format'))
    .min(1, 'At least one booking ID is required')
    .max(100, 'Maximum 100 bookings can be updated at once'),
  status: z.enum(['pending', 'confirmed', 'cancelled', 'completed']).optional(),
  paymentStatus: z.enum(['pending', 'paid', 'failed', 'refunded']).optional(),
  cancellationReason: z.string()
    .max(500, 'Cancellation reason must be less than 500 characters')
    .optional(),
  refundAmount: z.number()
    .min(0, 'Refund amount cannot be negative')
    .optional(),
  adminNotes: z.string()
    .max(2000, 'Admin notes must be less than 2000 characters')
    .optional()
}).refine((data) => {
  // Require cancellation reason when setting status to cancelled
  if (data.status === 'cancelled' && !data.cancellationReason) {
    return false
  }
  return true
}, {
  message: 'Cancellation reason is required when cancelling bookings',
  path: ['cancellationReason']
})

export const availabilityCheckSchema = z.object({
  dateFrom: z.string()
    .datetime('Invalid check-in date format')
    .transform((val) => new Date(val)),
  dateTo: z.string()
    .datetime('Invalid check-out date format')
    .transform((val) => new Date(val)),
  rooms: z.number()
    .int('Room count must be a whole number')
    .min(1, 'At least 1 room is required')
    .max(10, 'Maximum 10 rooms allowed'),
  guests: z.number()
    .int('Guest count must be a whole number')
    .min(1, 'At least 1 guest is required')
    .max(20, 'Maximum 20 guests allowed'),
  excludeBookingId: z.string()
    .regex(/^[0-9a-fA-F]{24}$/, 'Invalid booking ID format')
    .optional()
}).refine((data) => {
  return isAfter(data.dateTo, data.dateFrom)
}, {
  message: 'Check-out date must be after check-in date',
  path: ['dateTo']
}).refine((data) => {
  const today = startOfDay(new Date())
  return !isBefore(startOfDay(data.dateFrom), today)
}, {
  message: 'Check-in date cannot be in the past',
  path: ['dateFrom']
})

export const exportBookingsSchema = z.object({
  format: z.enum(['csv', 'excel', 'pdf']).default('csv'),
  fields: z.array(z.string()).min(1, 'At least one field must be selected'),
  filters: z.object({
    dateRange: z.object({
      from: z.string().datetime().transform((val) => new Date(val)).optional(),
      to: z.string().datetime().transform((val) => new Date(val)).optional()
    }).optional(),
    status: z.array(z.enum(['pending', 'confirmed', 'cancelled', 'completed'])).optional(),
    paymentStatus: z.array(z.enum(['pending', 'paid', 'failed', 'refunded'])).optional(),
    includePersonalInfo: z.boolean().default(true),
    includePaymentInfo: z.boolean().default(true),
    includeNotes: z.boolean().default(false)
  }).optional(),
  selectedBookings: z.array(z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid booking ID format'))
    .optional()
})

// Business logic validation functions
export class BookingValidator {
  static async validateAvailability(
    propertyId: string,
    dateFrom: Date,
    dateTo: Date,
    rooms: number,
    excludeBookingId?: string
  ): Promise<{ available: boolean; conflicts: any[]; message: string }> {
    try {
      // Import here to avoid circular dependencies
      const { connectToDatabase } = await import('@/lib/mongodb')
      const Booking = (await import('@/models/Booking')).default

      await connectToDatabase()

      // Build query to check for conflicts
      const query: any = {
        propertyId,
        status: { $in: ['confirmed', 'pending'] },
        $or: [
          {
            dateFrom: { $lt: dateTo },
            dateTo: { $gt: dateFrom }
          }
        ]
      }

      // Exclude specific booking if provided (for updates)
      if (excludeBookingId) {
        query._id = { $ne: excludeBookingId }
      }

      const conflicts = await Booking.find(query).lean()

      if (conflicts.length === 0) {
        return {
          available: true,
          conflicts: [],
          message: 'Dates are available'
        }
      }

      // Check if we have enough room capacity
      const totalConflictingRooms = conflicts.reduce((sum, booking) => sum + (booking.rooms || 1), 0)

      // Assuming property has a total room capacity (this should come from Property model)
      const maxRooms = 50 // This should be fetched from property configuration
      const availableRooms = maxRooms - totalConflictingRooms

      if (availableRooms >= rooms) {
        return {
          available: true,
          conflicts,
          message: `${availableRooms} rooms available (${rooms} requested)`
        }
      }

      return {
        available: false,
        conflicts,
        message: `Only ${availableRooms} rooms available for selected dates`
      }
    } catch (error) {
      console.error('Availability validation error:', error)
      return {
        available: false,
        conflicts: [],
        message: 'Error checking availability'
      }
    }
  }

  static validateBusinessRules(bookingData: any): { valid: boolean; errors: string[] } {
    const errors: string[] = []

    // Business rule: No bookings more than 365 days in advance
    const maxAdvanceBooking = addDays(new Date(), 365)
    if (bookingData.dateFrom && isAfter(bookingData.dateFrom, maxAdvanceBooking)) {
      errors.push('Bookings cannot be made more than 365 days in advance')
    }

    // Business rule: No same-day cancellations for confirmed bookings
    if (bookingData.status === 'cancelled' && bookingData.originalStatus === 'confirmed') {
      const today = startOfDay(new Date())
      const checkInDate = startOfDay(new Date(bookingData.dateFrom))
      if (checkInDate <= today) {
        errors.push('Same-day cancellations require manager approval')
      }
    }

    // Business rule: Minimum age for primary guest
    if (bookingData.guestDetails?.age && bookingData.guestDetails.age < 18) {
      errors.push('Primary guest must be at least 18 years old')
    }

    // Business rule: Special pricing rules
    const nights = differenceInDays(bookingData.dateTo, bookingData.dateFrom)
    const averageRate = bookingData.totalAmount / nights
    const maxRate = 50000 // Maximum rate per night
    if (averageRate > maxRate) {
      errors.push(`Rate per night (₹${averageRate.toFixed(2)}) exceeds maximum allowed (₹${maxRate})`)
    }

    return {
      valid: errors.length === 0,
      errors
    }
  }

  static validateRefundAmount(
    originalAmount: number,
    refundAmount: number,
    bookingDate: Date,
    cancellationDate: Date = new Date()
  ): { valid: boolean; maxRefund: number; errors: string[] } {
    const errors: string[] = []
    let maxRefund = originalAmount

    // Calculate refund based on cancellation policy
    const daysUntilCheckIn = differenceInDays(bookingDate, cancellationDate)

    if (daysUntilCheckIn >= 7) {
      // Full refund if cancelled 7+ days before
      maxRefund = originalAmount
    } else if (daysUntilCheckIn >= 3) {
      // 50% refund if cancelled 3-6 days before
      maxRefund = originalAmount * 0.5
    } else if (daysUntilCheckIn >= 1) {
      // 25% refund if cancelled 1-2 days before
      maxRefund = originalAmount * 0.25
    } else {
      // No refund for same-day cancellations
      maxRefund = 0
    }

    if (refundAmount > maxRefund) {
      errors.push(`Maximum refund allowed is ₹${maxRefund.toFixed(2)} based on cancellation policy`)
    }

    if (refundAmount > originalAmount) {
      errors.push('Refund amount cannot exceed original booking amount')
    }

    if (refundAmount < 0) {
      errors.push('Refund amount cannot be negative')
    }

    return {
      valid: errors.length === 0,
      maxRefund,
      errors
    }
  }
}

// Type exports for API usage
export type CreateBookingData = z.infer<typeof createBookingSchema>
export type UpdateBookingData = z.infer<typeof updateBookingSchema>
export type BulkUpdateData = z.infer<typeof bulkUpdateSchema>
export type AvailabilityCheckData = z.infer<typeof availabilityCheckSchema>
export type ExportBookingsData = z.infer<typeof exportBookingsSchema>