import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import Property from '@/models/Property'
import Booking from '@/models/Booking'
import PropertyLogin from '@/models/PropertyLogin'
import Room from '@/models/Room'

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

    // Calculate metrics - more robust room calculation
    let totalRooms = 0;
    
    // First try totalHotelRooms
    if (property.totalHotelRooms && property.totalHotelRooms !== "0") {
      totalRooms = parseInt(property.totalHotelRooms) || 0;
    }
    
    // If no totalHotelRooms, calculate from propertyUnits
    if (totalRooms === 0 && property.propertyUnits && property.propertyUnits.length > 0) {
      totalRooms = property.propertyUnits.reduce((sum, unit) => sum + (parseInt(unit.count) || 0), 0);
    }
    
    // If still no rooms, use a default of 1 to avoid division by zero
    if (totalRooms === 0) {
      totalRooms = 1;
    }
    // Get actual room occupancy from Room inventory
    const occupiedRoomsFromInventory = await Room.countDocuments({
      propertyId: propertyId,
      status: { $in: ['occupied', 'booked'] }
    });
    
    // Fallback to booking count if room inventory is not available
    const occupiedRoomsFromBookings = bookings.filter(booking => booking.status === 'confirmed').length;
    
    // Use room inventory data if available, otherwise fall back to bookings
    const occupiedRooms = occupiedRoomsFromInventory > 0 ? occupiedRoomsFromInventory : occupiedRoomsFromBookings;
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
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999)

    const todayArrivals = await Booking.find({
      propertyId: propertyId,
      checkInDate: { $gte: startOfDay, $lte: endOfDay },
      status: 'confirmed'
    }).populate('userId', 'name email phone').lean()

    const todayDepartures = await Booking.find({
      propertyId: propertyId,
      checkOutDate: { $gte: startOfDay, $lte: endOfDay },
      status: 'confirmed'
    }).populate('userId', 'name email phone').lean()

    // In-house (currently staying) bookings count - enhanced logic
    const inHouse = await Booking.countDocuments({
      propertyId: propertyId,
      status: 'confirmed',
      $or: [
        // Standard date fields
        {
          dateFrom: { $lte: endOfDay },
          dateTo: { $gte: startOfDay }
        },
        // Also check checkInDate and checkOutDate fields
        {
          checkInDate: { $lte: endOfDay },
          checkOutDate: { $gte: startOfDay }
        }
      ]
    })
    
    // Today's actual check-ins for additional context
    const todayCheckIns = await Booking.countDocuments({
      propertyId: propertyId,
      status: 'confirmed',
      $or: [
        { dateFrom: { $gte: startOfDay, $lte: endOfDay } },
        { checkInDate: { $gte: startOfDay, $lte: endOfDay } }
      ]
    })

    // Housekeeping summary by room cleaning status
    const rooms = await Room.find({ propertyId: propertyId })
      .select('housekeeping.cleaningStatus status')
      .lean()

    const housekeepingSummary = rooms.reduce(
      (acc: any, room: any) => {
        const status = room?.housekeeping?.cleaningStatus
        if (status === 'clean') acc.clean += 1
        else if (status === 'dirty') acc.dirty += 1
        else if (status === 'cleaning_in_progress') acc.cleaningInProgress += 1
        else if (status === 'inspected') acc.inspected += 1
        else if (status === 'maintenance_required') acc.maintenanceRequired += 1
        acc.totalRooms += 1
        return acc
      },
      { totalRooms: 0, clean: 0, dirty: 0, cleaningInProgress: 0, inspected: 0, maintenanceRequired: 0 }
    )

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
        inHouse,
        todayArrivals: todayArrivals.length,
        todayDepartures: todayDepartures.length,
        todayCheckIns,
        occupiedRoomsFromInventory,
        occupiedRoomsFromBookings
      },
      housekeeping: housekeepingSummary,
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