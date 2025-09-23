import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { validateOSAccess } from '@/lib/auth/os-auth'
import { connectToDatabase } from '@/lib/mongodb'
import Booking from '@/models/Booking'
import Property from '@/models/Property'
import { startOfDay, endOfDay, addDays } from 'date-fns'
import { createBookingSchema, updateBookingSchema, BookingValidator } from '@/lib/validation/booking-validation'
import { ZodError } from 'zod'
import {
  BookingErrorHandler,
  ValidationError,
  AuthorizationError,
  ResourceNotFoundError,
  AvailabilityError,
  DatabaseError,
  withErrorHandling
} from '@/lib/errors/booking-error-handler'

export const GET = withErrorHandling(async (
  request: NextRequest,
  { params }: { params: { propertyId: string } }
) => {
  const session = await getServerSession()
  const propertyId = params.propertyId
  const { searchParams } = request.nextUrl

  // Query parameters with validation
  const status = searchParams.get('status')
  const paymentStatus = searchParams.get('paymentStatus')
  const dateFrom = searchParams.get('dateFrom')
  const dateTo = searchParams.get('dateTo')
  const search = searchParams.get('search')
  const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100) // Max 100
  const offset = Math.max(parseInt(searchParams.get('offset') || '0'), 0)
  const sortBy = searchParams.get('sortBy') || 'createdAt'
  const sortOrder = searchParams.get('sortOrder') === 'asc' ? 1 : -1

  if (!session || !propertyId) {
    throw new AuthorizationError('Authentication required')
  }

  const hasAccess = await validateOSAccess(session.user?.email, propertyId)
  if (!hasAccess) {
    throw new AuthorizationError('Access denied to this property')
  }

  try {
    await connectToDatabase()
  } catch (error) {
    throw new DatabaseError('Failed to connect to database')
  }

  // Build query with enhanced error handling and validation
  const query: any = { propertyId }

  // Status filter with validation
  if (status && ['pending', 'confirmed', 'cancelled', 'completed'].includes(status)) {
    query.status = status
  }

  // Payment status filter with validation
  if (paymentStatus && ['pending', 'paid', 'failed', 'refunded'].includes(paymentStatus)) {
    query.paymentStatus = paymentStatus
  }

  // Date range filtering with proper validation
  if (dateFrom && dateTo) {
    try {
      const startDate = new Date(dateFrom)
      const endDate = new Date(dateTo)

      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        throw new ValidationError('Invalid date format provided')
      }

      if (startDate > endDate) {
        throw new ValidationError('Start date cannot be after end date')
      }

      query.$or = [
        {
          checkInDate: {
            $gte: startOfDay(startDate),
            $lte: endOfDay(endDate)
          }
        },
        {
          checkOutDate: {
            $gte: startOfDay(startDate),
            $lte: endOfDay(endDate)
          }
        },
        {
          $and: [
            { checkInDate: { $lte: startOfDay(startDate) } },
            { checkOutDate: { $gte: endOfDay(endDate) } }
          ]
        }
      ]
    } catch (error) {
      throw new ValidationError('Invalid date range provided')
    }
  }

  // Text search with enhanced safety
  if (search && search.trim().length > 0) {
    const searchTerm = search.trim()
    if (searchTerm.length > 100) {
      throw new ValidationError('Search term too long')
    }

    query.$or = [
      ...(query.$or || []),
      {
        $or: [
          { 'userId.name': { $regex: searchTerm, $options: 'i' } },
          { 'userId.email': { $regex: searchTerm, $options: 'i' } },
          { specialRequests: { $regex: searchTerm, $options: 'i' } }
        ]
      }
    ]
  }

  // Validate sort parameters
  const allowedSortFields = ['createdAt', 'checkInDate', 'checkOutDate', 'totalAmount', 'status']
  const validSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt'

  try {
    // Get total count for pagination with timeout
    const totalBookings = await Booking.countDocuments(query).maxTimeMS(5000)

    // Get bookings with enhanced population and timeout
    const bookings = await Booking.find(query)
      .populate({
        path: 'userId',
        select: 'name email phone',
        options: { strictPopulate: false }
      })
      .populate({
        path: 'propertyId',
        select: 'name',
        options: { strictPopulate: false }
      })
      .sort({ [validSortBy]: sortOrder })
      .limit(limit)
      .skip(offset)
      .lean()
      .maxTimeMS(10000)

    // Calculate enhanced statistics with error handling
    const stats = await calculateBookingStats(propertyId)

    // Add derived fields with null safety
    const enhancedBookings = bookings.map(booking => {
      const checkInDate = new Date(booking.checkInDate || booking.dateFrom)
      const checkOutDate = new Date(booking.checkOutDate || booking.dateTo)
      const nights = Math.max(1, Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 3600 * 24)))

      return {
        ...booking,
        nights,
        averageNightlyRate: booking.totalAmount && nights ? Math.round(booking.totalAmount / nights) : 0,
        daysUntilArrival: Math.ceil((checkInDate.getTime() - Date.now()) / (1000 * 3600 * 24)),
        isOverdue: booking.status === 'pending' && checkInDate < new Date(),
        formattedDates: {
          checkIn: checkInDate.toISOString(),
          checkOut: checkOutDate.toISOString(),
          created: new Date(booking.createdAt).toISOString()
        }
      }
    })

    return NextResponse.json({
      success: true,
      bookings: enhancedBookings,
      stats,
      pagination: {
        total: totalBookings,
        limit,
        offset,
        hasMore: offset + limit < totalBookings,
        page: Math.floor(offset / limit) + 1,
        totalPages: Math.ceil(totalBookings / limit)
      },
      filters: {
        status,
        paymentStatus,
        dateFrom,
        dateTo,
        search: search?.trim()
      },
      metadata: {
        propertyId,
        timestamp: new Date().toISOString(),
        resultCount: enhancedBookings.length
      }
    })

  } catch (error) {
    console.error('Database query error:', error)
    throw new DatabaseError('Failed to fetch booking data')
  }
})

// Enhanced statistics calculation with error handling
async function calculateBookingStats(propertyId: string) {
  try {
    const today = new Date()
    const startOfToday = startOfDay(today)
    const endOfToday = endOfDay(today)

    const [
      total,
      confirmed,
      pending,
      cancelled,
      completed,
      todayArrivals,
      todayDepartures,
      currentGuests,
      thisMonthRevenue,
      overdueBookings
    ] = await Promise.all([
      Booking.countDocuments({ propertyId }).maxTimeMS(5000),
      Booking.countDocuments({ propertyId, status: 'confirmed' }).maxTimeMS(5000),
      Booking.countDocuments({ propertyId, status: 'pending' }).maxTimeMS(5000),
      Booking.countDocuments({ propertyId, status: 'cancelled' }).maxTimeMS(5000),
      Booking.countDocuments({ propertyId, status: 'completed' }).maxTimeMS(5000),

      Booking.countDocuments({
        propertyId,
        status: 'confirmed',
        checkInDate: { $gte: startOfToday, $lte: endOfToday }
      }).maxTimeMS(5000),

      Booking.countDocuments({
        propertyId,
        status: 'confirmed',
        checkOutDate: { $gte: startOfToday, $lte: endOfToday }
      }).maxTimeMS(5000),

      Booking.countDocuments({
        propertyId,
        status: 'confirmed',
        checkInDate: { $lte: today },
        checkOutDate: { $gte: today }
      }).maxTimeMS(5000),

      Booking.aggregate([
        {
          $match: {
            propertyId,
            paymentStatus: 'paid',
            createdAt: {
              $gte: new Date(today.getFullYear(), today.getMonth(), 1),
              $lte: endOfToday
            }
          }
        },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
      ]).maxTimeMS(5000),

      Booking.countDocuments({
        propertyId,
        status: 'pending',
        checkInDate: { $lt: today }
      }).maxTimeMS(5000)
    ])

    const revenue = thisMonthRevenue.length > 0 ? thisMonthRevenue[0].total : 0

    return {
      total,
      confirmed,
      pending,
      cancelled,
      completed,
      todayArrivals,
      todayDepartures,
      currentGuests,
      revenue,
      overdueBookings,
      occupancyRate: currentGuests > 0 ? Math.round((currentGuests / (currentGuests + todayDepartures)) * 100) : 0,
      conversionRate: total > 0 ? Math.round((confirmed / total) * 100) : 0,
      averageBookingValue: confirmed > 0 ? Math.round(revenue / confirmed) : 0
    }
  } catch (error) {
    console.error('Stats calculation error:', error)
    // Return default stats if calculation fails
    return {
      total: 0,
      confirmed: 0,
      pending: 0,
      cancelled: 0,
      completed: 0,
      todayArrivals: 0,
      todayDepartures: 0,
      currentGuests: 0,
      revenue: 0,
      overdueBookings: 0,
      occupancyRate: 0,
      conversionRate: 0,
      averageBookingValue: 0
    }
  }
}

export const POST = withErrorHandling(async (
  request: NextRequest,
  { params }: { params: { propertyId: string } }
) => {
  const session = await getServerSession()
  const propertyId = params.propertyId

  if (!session || !propertyId) {
    throw new AuthorizationError('Authentication required')
  }

  const hasAccess = await validateOSAccess(session.user?.email, propertyId)
  if (!hasAccess) {
    throw new AuthorizationError('Access denied to this property')
  }

  try {
    const body = await request.json()
    const validatedData = await BookingValidator.validateCreate(body)

    await connectToDatabase()

    // Verify property exists
    const property = await Property.findById(propertyId).lean()
    if (!property) {
      throw new ResourceNotFoundError('Property not found')
    }

    // Create booking with enhanced validation
    const booking = new Booking({
      ...validatedData,
      propertyId,
      createdBy: session.user?.id || session.user?.email,
      status: validatedData.status || 'pending',
      paymentStatus: validatedData.paymentStatus || 'pending'
    })

    await booking.save()

    // Populate the created booking
    await booking.populate([
      { path: 'userId', select: 'name email phone' },
      { path: 'propertyId', select: 'name' }
    ])

    return NextResponse.json({
      success: true,
      booking,
      message: 'Booking created successfully'
    }, { status: 201 })

  } catch (error) {
    if (error instanceof ZodError) {
      throw new ValidationError('Invalid booking data', error.errors)
    }
    throw error
  }
})

export const PUT = withErrorHandling(async (
  request: NextRequest,
  { params }: { params: { propertyId: string } }
) => {
  const session = await getServerSession()
  const propertyId = params.propertyId

  if (!session || !propertyId) {
    throw new AuthorizationError('Authentication required')
  }

  const hasAccess = await validateOSAccess(session.user?.email, propertyId)
  if (!hasAccess) {
    throw new AuthorizationError('Access denied to this property')
  }

  try {
    const body = await request.json()
    const { bookingId, ...updateData } = body

    if (!bookingId) {
      throw new ValidationError('Booking ID is required')
    }

    const validatedData = await BookingValidator.validateUpdate(updateData)

    await connectToDatabase()

    const booking = await Booking.findOne({
      _id: bookingId,
      propertyId
    })

    if (!booking) {
      throw new ResourceNotFoundError('Booking not found')
    }

    // Update booking with validation
    Object.assign(booking, validatedData)
    booking.updatedBy = session.user?.id || session.user?.email
    booking.updatedAt = new Date()

    await booking.save()

    // Populate the updated booking
    await booking.populate([
      { path: 'userId', select: 'name email phone' },
      { path: 'propertyId', select: 'name' }
    ])

    return NextResponse.json({
      success: true,
      booking,
      message: 'Booking updated successfully'
    })

  } catch (error) {
    if (error instanceof ZodError) {
      throw new ValidationError('Invalid update data', error.errors)
    }
    throw error
  }
})

export const DELETE = withErrorHandling(async (
  request: NextRequest,
  { params }: { params: { propertyId: string } }
) => {
  const session = await getServerSession()
  const propertyId = params.propertyId
  const { searchParams } = request.nextUrl
  const bookingId = searchParams.get('bookingId')

  if (!session || !propertyId) {
    throw new AuthorizationError('Authentication required')
  }

  if (!bookingId) {
    throw new ValidationError('Booking ID is required')
  }

  const hasAccess = await validateOSAccess(session.user?.email, propertyId)
  if (!hasAccess) {
    throw new AuthorizationError('Access denied to this property')
  }

  try {
    await connectToDatabase()

    const booking = await Booking.findOne({
      _id: bookingId,
      propertyId
    })

    if (!booking) {
      throw new ResourceNotFoundError('Booking not found')
    }

    // Soft delete - mark as cancelled instead of actual deletion
    booking.status = 'cancelled'
    booking.updatedBy = session.user?.id || session.user?.email
    booking.updatedAt = new Date()
    booking.cancellationReason = 'Cancelled by admin'
    booking.cancelledAt = new Date()

    await booking.save()

    return NextResponse.json({
      success: true,
      message: 'Booking cancelled successfully',
      bookingId
    })

  } catch (error) {
    throw error
  }
})