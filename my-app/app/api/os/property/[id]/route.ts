import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import Property from '@/models/Property'
import Booking from '@/models/Booking'
import PropertyLogin from '@/models/PropertyLogin'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectToDatabase()

    const propertyId = params.id

    // Find the property
    const property = await Property.findById(propertyId).lean()
    
    if (!property) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 })
    }

    // Get property metrics
    const currentDate = new Date()
    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
    const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)

    // Get bookings for this property
    const bookings = await Booking.find({
      propertyId: propertyId,
      createdAt: { $gte: startOfMonth, $lte: endOfMonth }
    }).lean()

    // Calculate metrics
    const totalRooms = property.totalHotelRooms ? parseInt(property.totalHotelRooms) : property.propertyUnits?.reduce((sum, unit) => sum + unit.count, 0) || 1
    const occupiedRooms = bookings.filter(booking => booking.status === 'confirmed').length
    const occupancyRate = totalRooms > 0 ? (occupiedRooms / totalRooms) * 100 : 0

    const todayRevenue = bookings
      .filter(booking => {
        const bookingDate = new Date(booking.createdAt)
        return bookingDate.toDateString() === currentDate.toDateString()
      })
      .reduce((sum, booking) => sum + (booking.totalAmount || 0), 0)

    const monthlyRevenue = bookings.reduce((sum, booking) => sum + (booking.totalAmount || 0), 0)

    // Get recent bookings
    const recentBookings = await Booking.find({
      propertyId: propertyId
    })
    .sort({ createdAt: -1 })
    .limit(10)
    .populate('userId', 'name email')
    .lean()

    // Get today's arrivals and departures
    const today = new Date()
    const todayStr = today.toISOString().split('T')[0]

    const todayArrivals = await Booking.find({
      propertyId: propertyId,
      checkInDate: { $gte: today, $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000) },
      status: 'confirmed'
    }).populate('userId', 'name email phone').lean()

    const todayDepartures = await Booking.find({
      propertyId: propertyId,
      checkOutDate: { $gte: today, $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000) },
      status: 'confirmed'
    }).populate('userId', 'name email phone').lean()

    // Calculate previous month for comparison
    const prevMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1)
    const prevMonthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth(), 0)
    
    const prevMonthBookings = await Booking.find({
      propertyId: propertyId,
      createdAt: { $gte: prevMonth, $lte: prevMonthEnd }
    }).lean()

    const prevMonthRevenue = prevMonthBookings.reduce((sum, booking) => sum + (booking.totalAmount || 0), 0)
    const revenueChange = prevMonthRevenue > 0 ? ((monthlyRevenue - prevMonthRevenue) / prevMonthRevenue) * 100 : 0

    // Property data with metrics
    const propertyData = {
      ...property,
      metrics: {
        totalRooms,
        occupiedRooms,
        occupancyRate: Math.round(occupancyRate * 100) / 100,
        todayRevenue,
        monthlyRevenue,
        revenueChange: Math.round(revenueChange * 100) / 100,
        totalBookings: bookings.length,
        todayArrivals: todayArrivals.length,
        todayDepartures: todayDepartures.length
      },
      bookings: {
        recent: recentBookings,
        arrivals: todayArrivals,
        departures: todayDepartures,
        total: bookings.length
      }
    }

    return NextResponse.json({ 
      success: true, 
      property: propertyData 
    })
  } catch (error) {
    console.error('Error fetching property data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch property data' },
      { status: 500 }
    )
  }
}