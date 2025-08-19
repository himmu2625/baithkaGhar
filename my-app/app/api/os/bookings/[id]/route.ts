import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import Booking from '@/models/Booking'
import Property from '@/models/Property'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectToDatabase()

    const propertyId = params.id

    // Verify property exists
    const property = await Property.findById(propertyId)
    if (!property) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 })
    }

    // Get current month date range
    const currentDate = new Date()
    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
    const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)

    // Get all bookings for this property
    const bookings = await Booking.find({ propertyId: propertyId })
      .populate('userId', 'name email phone')
      .sort({ createdAt: -1 })
      .lean()

    // Get bookings for current month for stats
    const monthlyBookings = await Booking.find({
      propertyId: propertyId,
      createdAt: { $gte: startOfMonth, $lte: endOfMonth }
    }).lean()

    // Calculate stats
    const stats = {
      total: monthlyBookings.length,
      confirmed: monthlyBookings.filter(b => b.status === 'confirmed').length,
      pending: monthlyBookings.filter(b => b.status === 'pending').length,
      cancelled: monthlyBookings.filter(b => b.status === 'cancelled').length,
      todayArrivals: 0,
      todayDepartures: 0,
      revenue: monthlyBookings.reduce((sum, booking) => sum + (booking.totalAmount || 0), 0)
    }

    // Calculate today's arrivals and departures
    const today = new Date()
    const todayStr = today.toISOString().split('T')[0]

    const todayArrivals = await Booking.countDocuments({
      propertyId: propertyId,
      checkInDate: {
        $gte: new Date(todayStr),
        $lt: new Date(new Date(todayStr).getTime() + 24 * 60 * 60 * 1000)
      },
      status: 'confirmed'
    })

    const todayDepartures = await Booking.countDocuments({
      propertyId: propertyId,
      checkOutDate: {
        $gte: new Date(todayStr),
        $lt: new Date(new Date(todayStr).getTime() + 24 * 60 * 60 * 1000)
      },
      status: 'confirmed'
    })

    stats.todayArrivals = todayArrivals
    stats.todayDepartures = todayDepartures

    return NextResponse.json({
      success: true,
      bookings,
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
    await connectToDatabase()

    const propertyId = params.id
    const { bookingId, status, paymentStatus } = await request.json()

    // Verify property exists
    const property = await Property.findById(propertyId)
    if (!property) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 })
    }

    // Update booking
    const updateData: any = { updatedAt: new Date() }
    
    if (status) updateData.status = status
    if (paymentStatus) updateData.paymentStatus = paymentStatus

    const updatedBooking = await Booking.findByIdAndUpdate(
      bookingId,
      updateData,
      { new: true }
    ).populate('userId', 'name email phone')

    if (!updatedBooking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      booking: updatedBooking
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
    await connectToDatabase()

    const propertyId = params.id
    const bookingData = await request.json()

    // Verify property exists
    const property = await Property.findById(propertyId)
    if (!property) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 })
    }

    // Create new booking
    const newBooking = new Booking({
      ...bookingData,
      propertyId,
      createdAt: new Date(),
      updatedAt: new Date()
    })

    const savedBooking = await newBooking.save()
    const populatedBooking = await Booking.findById(savedBooking._id)
      .populate('userId', 'name email phone')

    return NextResponse.json({
      success: true,
      booking: populatedBooking
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating booking:', error)
    return NextResponse.json(
      { error: 'Failed to create booking' },
      { status: 500 }
    )
  }
}







