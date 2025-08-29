import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { validateOSAccess } from '@/lib/auth/os-auth'
import { connectToDatabase } from '@/lib/mongodb'
import Booking from '@/models/Booking'
import Property from '@/models/Property'
import { startOfDay, endOfDay, addDays } from 'date-fns'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession()
    const propertyId = params.id
    const { searchParams } = request.nextUrl
    
    // Query parameters
    const status = searchParams.get('status')
    const paymentStatus = searchParams.get('paymentStatus')
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')
    const search = searchParams.get('search')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortOrder = searchParams.get('sortOrder') === 'asc' ? 1 : -1

    if (!session || !propertyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const hasAccess = await validateOSAccess(session.user?.email, propertyId)
    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    await connectToDatabase()

    // Build query
    const query: any = { propertyId }
    
    // Status filter
    if (status && status !== 'all') {
      query.status = status
    }
    
    // Payment status filter
    if (paymentStatus && paymentStatus !== 'all') {
      query.paymentStatus = paymentStatus
    }
    
    // Date range filter
    if (dateFrom || dateTo) {
      query.dateFrom = {}
      if (dateFrom) query.dateFrom.$gte = new Date(dateFrom)
      if (dateTo) query.dateFrom.$lte = new Date(dateTo)
    }
    
    // Search filter (guest name, email, booking code)
    if (search) {
      query.$or = [
        { 'contactDetails.name': { $regex: search, $options: 'i' } },
        { 'contactDetails.email': { $regex: search, $options: 'i' } },
        { 'contactDetails.phone': { $regex: search, $options: 'i' } },
        { paymentId: { $regex: search, $options: 'i' } }
      ]
    }

    // Execute query with pagination
    const [bookings, totalCount, stats] = await Promise.all([
      Booking.find(query)
        .populate('userId', 'name email phone')
        .populate('propertyId', 'title')
        .sort({ [sortBy]: sortOrder })
        .limit(limit)
        .skip(offset)
        .lean(),
      
      Booking.countDocuments(query),
      
      generateBookingStats(propertyId)
    ])

    // Transform bookings for frontend
    const transformedBookings = bookings.map(booking => ({
      ...booking,
      _id: booking._id?.toString(),
      id: booking._id?.toString(),
      checkInDate: booking.dateFrom,
      checkOutDate: booking.dateTo,
      totalAmount: booking.totalPrice || 0,
      adults: booking.guests || 1,
      children: 0,
      rooms: 1
    }))

    return NextResponse.json({
      success: true,
      bookings: transformedBookings,
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: offset + bookings.length < totalCount
      },
      stats
    })
  } catch (error) {
    console.error('Error fetching bookings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch bookings' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession()
    const propertyId = params.id
    const updateData = await request.json()

    if (!session || !propertyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const hasAccess = await validateOSAccess(session.user?.email, propertyId)
    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    await connectToDatabase()

    const { bookingId, ...updates } = updateData

    if (!bookingId) {
      return NextResponse.json({ error: 'Booking ID is required' }, { status: 400 })
    }

    // Validate date changes if provided
    if (updates.dateFrom || updates.dateTo) {
      const booking = await Booking.findById(bookingId)
      if (!booking) {
        return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
      }

      const newCheckIn = new Date(updates.dateFrom || booking.dateFrom)
      const newCheckOut = new Date(updates.dateTo || booking.dateTo)

      if (newCheckOut <= newCheckIn) {
        return NextResponse.json(
          { error: 'Check-out date must be after check-in date' },
          { status: 400 }
        )
      }
    }

    // Prepare update object
    const updateFields: any = { 
      updatedAt: new Date()
    }
    
    // Handle status changes
    if (updates.status) {
      updateFields.status = updates.status
      if (updates.status === 'cancelled') {
        updateFields.cancelledAt = new Date()
        updateFields.cancellationReason = updates.cancellationReason || 'Cancelled by admin'
      } else if (updates.status === 'completed') {
        updateFields.completedAt = new Date()
      }
    }

    // Handle other updates
    if (updates.paymentStatus) updateFields.paymentStatus = updates.paymentStatus
    if (updates.dateFrom) updateFields.dateFrom = new Date(updates.dateFrom)
    if (updates.dateTo) updateFields.dateTo = new Date(updates.dateTo)
    if (updates.guests) updateFields.guests = updates.guests
    if (updates.totalPrice) updateFields.totalPrice = updates.totalPrice
    if (updates.specialRequests) updateFields.specialRequests = updates.specialRequests
    if (updates.adminNotes) updateFields.adminNotes = updates.adminNotes
    
    // Handle contact details updates
    if (updates.contactDetails) {
      updateFields.contactDetails = updates.contactDetails
    }

    // Handle room allocation
    if (updates.allocatedRoom) {
      updateFields.allocatedRoom = updates.allocatedRoom
      updateFields.roomAllocationStatus = 'allocated'
    }

    const updatedBooking = await Booking.findByIdAndUpdate(
      bookingId,
      updateFields,
      { new: true, runValidators: true }
    ).populate('userId', 'name email phone')

    if (!updatedBooking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      booking: {
        ...updatedBooking.toObject(),
        _id: updatedBooking._id?.toString(),
        id: updatedBooking._id?.toString()
      },
      message: 'Booking updated successfully'
    })
  } catch (error) {
    console.error('Error updating booking:', error)
    return NextResponse.json(
      { error: 'Failed to update booking' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession()
    const propertyId = params.id
    const bookingData = await request.json()

    if (!session || !propertyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const hasAccess = await validateOSAccess(session.user?.email, propertyId)
    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    await connectToDatabase()

    // Validate required fields
    const { guestDetails, dateFrom, dateTo, guests, totalAmount } = bookingData
    
    if (!guestDetails?.name || !guestDetails?.email || !dateFrom || !dateTo || !guests) {
      return NextResponse.json(
        { error: 'Missing required booking details' },
        { status: 400 }
      )
    }

    // Validate dates
    const checkIn = new Date(dateFrom)
    const checkOut = new Date(dateTo)
    const today = startOfDay(new Date())

    if (checkIn < today) {
      return NextResponse.json(
        { error: 'Check-in date cannot be in the past' },
        { status: 400 }
      )
    }

    if (checkOut <= checkIn) {
      return NextResponse.json(
        { error: 'Check-out date must be after check-in date' },
        { status: 400 }
      )
    }

    // Create booking
    const booking = new Booking({
      userId: session.user?.id || '000000000000000000000000',
      propertyId,
      status: bookingData.status || 'confirmed',
      dateFrom: checkIn,
      dateTo: checkOut,
      guests: guests,
      totalPrice: totalAmount || 0,
      contactDetails: {
        name: guestDetails.name,
        email: guestDetails.email,
        phone: guestDetails.phone || ''
      },
      specialRequests: bookingData.specialRequests || '',
      paymentStatus: bookingData.paymentStatus || 'pending',
      paymentId: bookingData.paymentId,
      adminNotes: bookingData.adminNotes || '',
      roomAllocationStatus: 'pending'
    })

    await booking.save()

    const populatedBooking = await Booking.findById(booking._id)
      .populate('userId', 'name email phone')

    return NextResponse.json({
      success: true,
      booking: {
        ...populatedBooking?.toObject(),
        _id: populatedBooking?._id?.toString(),
        id: populatedBooking?._id?.toString()
      },
      message: 'Booking created successfully'
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating booking:', error)
    return NextResponse.json(
      { error: 'Failed to create booking' },
      { status: 500 }
    )
  }
}

async function generateBookingStats(propertyId: string) {
  try {
    const today = startOfDay(new Date())
    const tomorrow = addDays(today, 1)
    const endOfToday = endOfDay(today)

    const [
      totalBookings,
      confirmedBookings,
      pendingBookings,
      cancelledBookings,
      todayArrivals,
      todayDepartures,
      revenueData
    ] = await Promise.all([
      // Total bookings
      Booking.countDocuments({ propertyId }),
      
      // Confirmed bookings
      Booking.countDocuments({ propertyId, status: 'confirmed' }),
      
      // Pending bookings
      Booking.countDocuments({ propertyId, status: 'pending' }),
      
      // Cancelled bookings
      Booking.countDocuments({ propertyId, status: 'cancelled' }),
      
      // Today's arrivals
      Booking.countDocuments({
        propertyId,
        dateFrom: { $gte: today, $lt: tomorrow },
        status: { $in: ['confirmed', 'completed'] }
      }),
      
      // Today's departures
      Booking.countDocuments({
        propertyId,
        dateTo: { $gte: today, $lt: tomorrow },
        status: { $in: ['confirmed', 'completed'] }
      }),
      
      // Revenue calculation
      Booking.aggregate([
        { 
          $match: { 
            propertyId: propertyId,
            status: { $in: ['confirmed', 'completed'] },
            paymentStatus: 'completed'
          }
        },
        { 
          $group: { 
            _id: null, 
            totalRevenue: { $sum: '$totalPrice' },
            count: { $sum: 1 }
          } 
        }
      ])
    ])

    return {
      total: totalBookings,
      confirmed: confirmedBookings,
      pending: pendingBookings,
      cancelled: cancelledBookings,
      todayArrivals,
      todayDepartures,
      revenue: revenueData[0]?.totalRevenue || 0,
      averageBookingValue: revenueData[0] ? 
        Math.round(revenueData[0].totalRevenue / revenueData[0].count) : 0
    }
  } catch (error) {
    console.error('Error generating booking stats:', error)
    return {
      total: 0,
      confirmed: 0,
      pending: 0,
      cancelled: 0,
      todayArrivals: 0,
      todayDepartures: 0,
      revenue: 0,
      averageBookingValue: 0
    }
  }
}







