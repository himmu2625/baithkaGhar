import { NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/utils/dbConnect"
import Booking from "@/models/Booking"
import Room from "@/models/Room"
import Task from "@/models/Task"
import Guest from "@/models/Guest"
import Property from "@/models/Property"

export async function GET(request: NextRequest) {
  try {
    await dbConnect()
    
    const { searchParams } = new URL(request.url)
    const propertyId = searchParams.get('propertyId')
    const reportDate = searchParams.get('date') || new Date().toISOString().split('T')[0]

    if (!propertyId) {
      return NextResponse.json(
        { error: "Property ID is required" },
        { status: 400 }
      )
    }

    // Define date range for the report
    const startDate = new Date(reportDate)
    startDate.setHours(0, 0, 0, 0)
    const endDate = new Date(startDate)
    endDate.setDate(endDate.getDate() + 1)

    // Define yesterday's date range for comparisons
    const yesterdayStart = new Date(startDate)
    yesterdayStart.setDate(yesterdayStart.getDate() - 1)
    const yesterdayEnd = new Date(startDate)

    // Parallel queries for better performance
    const [
      propertyInfo,
      totalRoomsCount,
      todayBookings,
      yesterdayBookings,
      checkInToday,
      checkOutToday,
      noShowsToday,
      cancellationsToday,
      activeTasks,
      housekeepingRooms,
      bookingsBySource
    ] = await Promise.all([
      // Property information
      Property.findById(propertyId).select('totalHotelRooms propertyUnits'),

      // Total rooms count
      Room.countDocuments({ propertyId }),

      // Today's bookings
      Booking.find({
        propertyId,
        $or: [
          { dateFrom: { $gte: startDate, $lt: endDate } },
          { dateTo: { $gte: startDate, $lt: endDate } },
          { 
            dateFrom: { $lte: startDate }, 
            dateTo: { $gte: endDate }
          }
        ],
        status: { $ne: 'cancelled' }
      }),

      // Yesterday's bookings for comparison
      Booking.find({
        propertyId,
        $or: [
          { dateFrom: { $gte: yesterdayStart, $lt: yesterdayEnd } },
          { dateTo: { $gte: yesterdayStart, $lt: yesterdayEnd } },
          { 
            dateFrom: { $lte: yesterdayStart }, 
            dateTo: { $gte: yesterdayEnd }
          }
        ],
        status: { $ne: 'cancelled' }
      }),

      // Today's check-ins
      Booking.find({
        propertyId,
        dateFrom: { $gte: startDate, $lt: endDate },
        status: 'confirmed'
      }),

      // Today's check-outs
      Booking.find({
        propertyId,
        dateTo: { $gte: startDate, $lt: endDate },
        status: 'confirmed'
      }),

      // No-shows today
      Booking.find({
        propertyId,
        dateFrom: { $gte: startDate, $lt: endDate },
        status: 'confirmed',
        checkInTime: { $exists: false },
        // Assuming no-show if check-in time has passed and no check-in recorded
        createdAt: { $lt: new Date(Date.now() - 4 * 60 * 60 * 1000) } // 4 hours ago
      }),

      // Cancellations today
      Booking.find({
        propertyId,
        cancelledAt: { $gte: startDate, $lt: endDate }
      }),

      // Active tasks
      Task.find({
        propertyId,
        status: { $in: ['pending', 'in_progress'] }
      }),

      // Room status for housekeeping
      Room.aggregate([
        {
          $match: { propertyId }
        },
        {
          $group: {
            _id: "$housekeepingStatus",
            count: { $sum: 1 }
          }
        }
      ]),

      // Bookings by source
      Booking.aggregate([
        {
          $match: {
            propertyId,
            createdAt: { $gte: startDate, $lt: endDate },
            status: { $ne: 'cancelled' }
          }
        },
        {
          $group: {
            _id: { $ifNull: ["$bookingSource", "Direct Booking"] },
            bookings: { $sum: 1 },
            revenue: { $sum: "$totalPrice" }
          }
        },
        {
          $sort: { revenue: -1 }
        }
      ])
    ])

    // Calculate metrics
    const totalRooms = propertyInfo?.totalHotelRooms || 
                      propertyInfo?.propertyUnits?.reduce((sum: number, unit: any) => sum + (unit.count || 0), 0) ||
                      totalRoomsCount || 1

    const occupiedRooms = todayBookings.length
    const occupancyRate = Math.round((occupiedRooms / totalRooms) * 100)

    const todayRevenue = todayBookings.reduce((sum, booking) => sum + (booking.totalPrice || 0), 0)
    const yesterdayRevenue = yesterdayBookings.reduce((sum, booking) => sum + (booking.totalPrice || 0), 0)

    const avgRoomRate = occupiedRooms > 0 ? Math.round(todayRevenue / occupiedRooms) : 0
    const totalGuests = todayBookings.reduce((sum, booking) => sum + (booking.guests || 0), 0)

    // Process housekeeping status
    const housekeepingStatus = {
      clean: 0,
      dirty: 0,
      maintenance: 0,
      inspected: 0
    }

    housekeepingRooms.forEach((status: any) => {
      if (status._id && housekeepingStatus.hasOwnProperty(status._id)) {
        housekeepingStatus[status._id as keyof typeof housekeepingStatus] = status.count
      }
    })

    // Format booking sources
    const formattedBookingSources = bookingsBySource.map((source: any) => ({
      source: source._id || 'Direct Booking',
      bookings: source.bookings,
      revenue: source.revenue || 0
    }))

    const reportData = {
      date: reportDate,
      occupancyRate,
      totalRooms,
      occupiedRooms,
      revenue: todayRevenue,
      checkIns: checkInToday.length,
      checkOuts: checkOutToday.length,
      noShows: noShowsToday.length,
      cancellations: cancellationsToday.length,
      avgRoomRate,
      totalGuests,
      pendingTasks: activeTasks.length,
      housekeepingTasks: housekeepingStatus,
      bookingSources: formattedBookingSources,
      // Additional metrics
      revenueChange: yesterdayRevenue > 0 ? 
        Math.round(((todayRevenue - yesterdayRevenue) / yesterdayRevenue) * 100) : 0,
      occupancyChange: yesterdayBookings.length > 0 ?
        Math.round(((occupiedRooms - yesterdayBookings.length) / yesterdayBookings.length) * 100) : 0
    }

    return NextResponse.json({
      success: true,
      data: reportData
    })

  } catch (error) {
    console.error("Daily Reports API error:", error)
    
    return NextResponse.json(
      { 
        error: "Failed to generate daily report",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    )
  }
}

// POST endpoint for generating custom reports
export async function POST(request: NextRequest) {
  try {
    await dbConnect()
    
    const { searchParams } = new URL(request.url)
    const propertyId = searchParams.get('propertyId')
    const body = await request.json()

    if (!propertyId) {
      return NextResponse.json(
        { error: "Property ID is required" },
        { status: 400 }
      )
    }

    const { reportType, startDate, endDate, filters } = body

    // This can be extended to generate different types of reports
    // For now, we'll just confirm the request
    return NextResponse.json({
      success: true,
      message: `${reportType} report generation initiated`,
      reportId: `RPT-${Date.now()}`,
      status: 'processing'
    })

  } catch (error) {
    console.error("Daily Reports POST API error:", error)
    
    return NextResponse.json(
      { 
        error: "Failed to initiate report generation",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    )
  }
}