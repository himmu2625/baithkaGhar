import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import Booking from "@/models/Booking"
import Property from "@/models/Property"
import dbConnect from "@/lib/db/dbConnect"

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    console.log(`🔍 [GET /api/admin/analytics/bookings] Starting analytics request...`);
    
    await dbConnect()
    
    const session = await auth()
    
    if (!session?.user || !["admin", "super_admin"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }
    
    const { searchParams } = new URL(req.url)
    const timeframe = searchParams.get("timeframe") || "30" // days
    const propertyId = searchParams.get("propertyId")
    
    const daysAgo = parseInt(timeframe)
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - daysAgo)
    
    // Base filter
    const baseFilter: any = {
      createdAt: { $gte: startDate }
    }
    
    if (propertyId) {
      baseFilter.propertyId = propertyId
    }
    
    console.log(`🔍 [GET /api/admin/analytics/bookings] Filter:`, baseFilter);
    
    // Parallel analytics queries
    const [
      totalBookings,
      bookingsByStatus,
      revenueByMonth,
      bookingsByProperty,
      averageBookingValue,
      occupancyData,
      bookingTrends,
      upcomingCheckIns,
      cancelledBookings
    ] = await Promise.all([
      // Total bookings count
      Booking.countDocuments(baseFilter),
      
      // Bookings by status
      Booking.aggregate([
        { $match: baseFilter },
        { $group: { _id: "$status", count: { $sum: 1 }, revenue: { $sum: "$totalPrice" } } }
      ]),
      
      // Revenue by month
      Booking.aggregate([
        { $match: { ...baseFilter, status: { $in: ["confirmed", "completed"] } } },
        {
          $group: {
            _id: {
              year: { $year: "$createdAt" },
              month: { $month: "$createdAt" }
            },
            revenue: { $sum: "$totalPrice" },
            count: { $sum: 1 }
          }
        },
        { $sort: { "_id.year": 1, "_id.month": 1 } }
      ]),
      
      // Top performing properties
      Booking.aggregate([
        { $match: { ...baseFilter, status: { $in: ["confirmed", "completed"] } } },
        {
          $group: {
            _id: "$propertyId",
            bookings: { $sum: 1 },
            revenue: { $sum: "$totalPrice" },
            averageGuests: { $avg: "$guests" }
          }
        },
        { $sort: { revenue: -1 } },
        { $limit: 10 },
        {
          $lookup: {
            from: "properties",
            localField: "_id",
            foreignField: "_id",
            as: "property"
          }
        }
      ]),
      
      // Average booking value
      Booking.aggregate([
        { $match: { ...baseFilter, status: { $in: ["confirmed", "completed"] } } },
        {
          $group: {
            _id: null,
            averageValue: { $avg: "$totalPrice" },
            medianValue: { $avg: "$totalPrice" }, // Simplified median
            totalRevenue: { $sum: "$totalPrice" }
          }
        }
      ]),
      
      // Occupancy data (simplified)
      Booking.aggregate([
        { $match: { ...baseFilter, status: { $in: ["confirmed", "completed"] } } },
        {
          $group: {
            _id: {
              $dateToString: {
                format: "%Y-%m-%d",
                date: "$dateFrom"
              }
            },
            bookings: { $sum: 1 },
            guests: { $sum: "$guests" }
          }
        },
        { $sort: { "_id": 1 } }
      ]),
      
      // Daily booking trends
      Booking.aggregate([
        { $match: baseFilter },
        {
          $group: {
            _id: {
              $dateToString: {
                format: "%Y-%m-%d",
                date: "$createdAt"
              }
            },
            bookings: { $sum: 1 },
            revenue: { $sum: "$totalPrice" }
          }
        },
        { $sort: { "_id": 1 } }
      ]),
      
      // Upcoming check-ins (next 7 days)
      Booking.find({
        dateFrom: {
          $gte: new Date(),
          $lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        },
        status: { $in: ["confirmed", "completed"] }
      }).countDocuments(),
      
      // Cancelled bookings analysis
      Booking.aggregate([
        { 
          $match: { 
            ...baseFilter, 
            status: "cancelled",
            cancelledAt: { $exists: true }
          } 
        },
        {
          $group: {
            _id: null,
            count: { $sum: 1 },
            lostRevenue: { $sum: "$totalPrice" },
            avgDaysToCancellation: {
              $avg: {
                $divide: [
                  { $subtract: ["$cancelledAt", "$createdAt"] },
                  1000 * 60 * 60 * 24
                ]
              }
            }
          }
        }
      ])
    ])
    
    // Process and format the data
    const analytics = {
      overview: {
        totalBookings,
        totalRevenue: revenueByMonth.reduce((sum, month) => sum + month.revenue, 0),
        averageBookingValue: averageBookingValue[0]?.averageValue || 0,
        upcomingCheckIns
      },
      
      statusBreakdown: bookingsByStatus.reduce((acc, status) => {
        acc[status._id] = {
          count: status.count,
          revenue: status.revenue || 0
        }
        return acc
      }, {} as Record<string, { count: number; revenue: number }>),
      
      revenueByMonth: revenueByMonth.map(month => ({
        period: `${month._id.year}-${String(month._id.month).padStart(2, '0')}`,
        revenue: month.revenue,
        bookings: month.count
      })),
      
      topProperties: bookingsByProperty.map(prop => ({
        propertyId: prop._id,
        propertyName: prop.property[0]?.title || "Unknown Property",
        bookings: prop.bookings,
        revenue: prop.revenue,
        averageGuests: Math.round(prop.averageGuests || 0)
      })),
      
      occupancyTrend: occupancyData.map(day => ({
        date: day._id,
        bookings: day.bookings,
        guests: day.guests
      })),
      
      bookingTrends: bookingTrends.map(day => ({
        date: day._id,
        bookings: day.bookings,
        revenue: day.revenue
      })),
      
      cancellationAnalysis: cancelledBookings[0] || {
        count: 0,
        lostRevenue: 0,
        avgDaysToCancellation: 0
      },
      
      // Key metrics
      metrics: {
        conversionRate: totalBookings > 0 ? 
          ((bookingsByStatus.find(s => s._id === 'confirmed')?.count || 0) / totalBookings * 100) : 0,
        cancellationRate: totalBookings > 0 ? 
          ((bookingsByStatus.find(s => s._id === 'cancelled')?.count || 0) / totalBookings * 100) : 0,
        averageLeadTime: 14, // Placeholder - could be calculated from actual data
        repeatBookingRate: 15 // Placeholder - requires user analysis
      }
    }
    
    console.log(`✅ [GET /api/admin/analytics/bookings] Analytics computed successfully`);
    
    return NextResponse.json(analytics)
    
  } catch (error: any) {
    console.error("💥 [GET /api/admin/analytics/bookings] Error:", error)
    return NextResponse.json({ 
      error: "Failed to fetch booking analytics",
      details: error.message
    }, { status: 500 })
  }
}