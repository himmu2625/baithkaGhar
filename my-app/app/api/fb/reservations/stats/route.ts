import { NextRequest, NextResponse } from "next/server"
import { dbHandler } from "@/lib/db"
import { connectMongo } from "@/lib/db/mongodb"
import { getToken } from "next-auth/jwt"
import Reservation from "@/models/Reservation"
import { Types } from "mongoose"

export const dynamic = 'force-dynamic';

// GET handler - Get reservation statistics
export const GET = dbHandler(async (req: NextRequest) => {
  try {
    await connectMongo()

    const { searchParams } = new URL(req.url)
    const propertyId = searchParams.get('propertyId')
    const period = searchParams.get('period') || 'month' // day, week, month, year

    if (!propertyId || !Types.ObjectId.isValid(propertyId)) {
      return NextResponse.json(
        { success: false, message: "Valid property ID is required" },
        { status: 400 }
      )
    }

    // Calculate date ranges
    const now = new Date()
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    // Period start/end dates
    let startDate = new Date()
    let endDate = new Date()
    
    switch (period) {
      case 'day':
        startDate = new Date(today)
        endDate = new Date(tomorrow)
        break
      case 'week':
        startDate = new Date(today)
        startDate.setDate(today.getDate() - 7)
        endDate = new Date(tomorrow)
        break
      case 'month':
        startDate = new Date(today.getFullYear(), today.getMonth(), 1)
        endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0)
        endDate.setHours(23, 59, 59, 999)
        break
      case 'year':
        startDate = new Date(today.getFullYear(), 0, 1)
        endDate = new Date(today.getFullYear(), 11, 31, 23, 59, 59, 999)
        break
    }

    // Get comprehensive statistics using aggregation
    const [
      totalStats,
      todayStats,
      upcomingStats,
      statusBreakdown,
      revenueData,
      peakHours,
      noShowStats
    ] = await Promise.all([
      // Total reservations for the period
      Reservation.aggregate([
        {
          $match: {
            propertyId,
            'reservationDetails.reservationDate': { $gte: startDate, $lte: endDate },
            isActive: true
          }
        },
        {
          $group: {
            _id: null,
            totalReservations: { $sum: 1 },
            averagePartySize: { $avg: '$reservationDetails.partySize' },
            totalGuests: { $sum: '$reservationDetails.partySize' }
          }
        }
      ]),

      // Today's reservations
      Reservation.aggregate([
        {
          $match: {
            propertyId,
            'reservationDetails.reservationDate': { $gte: today, $lt: tomorrow },
            isActive: true
          }
        },
        {
          $group: {
            _id: null,
            todayReservations: { $sum: 1 },
            confirmedToday: {
              $sum: { $cond: [{ $eq: ['$status', 'confirmed'] }, 1, 0] }
            }
          }
        }
      ]),

      // Upcoming reservations (next 24 hours)
      Reservation.aggregate([
        {
          $match: {
            propertyId,
            'reservationDetails.reservationDate': { $gte: now },
            status: { $in: ['confirmed', 'pending'] },
            isActive: true
          }
        },
        {
          $group: {
            _id: null,
            upcomingReservations: { $sum: 1 },
            pendingReservations: {
              $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
            }
          }
        }
      ]),

      // Status breakdown
      Reservation.aggregate([
        {
          $match: {
            propertyId,
            'reservationDetails.reservationDate': { $gte: startDate, $lte: endDate },
            isActive: true
          }
        },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ]),

      // Revenue data (estimated from completed reservations)
      Reservation.aggregate([
        {
          $match: {
            propertyId,
            status: 'completed',
            'reservationDetails.reservationDate': { $gte: startDate, $lte: endDate },
            isActive: true
          }
        },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: '$orderInfo.actualOrderValue' },
            averageOrderValue: { $avg: '$orderInfo.actualOrderValue' },
            revenueReservations: { $sum: 1 }
          }
        }
      ]),

      // Peak booking hours
      Reservation.aggregate([
        {
          $match: {
            propertyId,
            'reservationDetails.reservationDate': { $gte: startDate, $lte: endDate },
            status: { $ne: 'cancelled' },
            isActive: true
          }
        },
        {
          $project: {
            hour: { $toInt: { $substr: ['$reservationDetails.reservationTime', 0, 2] } }
          }
        },
        {
          $group: {
            _id: '$hour',
            bookings: { $sum: 1 }
          }
        },
        {
          $sort: { bookings: -1 }
        },
        {
          $limit: 1
        }
      ]),

      // No-show statistics
      Reservation.aggregate([
        {
          $match: {
            propertyId,
            'reservationDetails.reservationDate': { $gte: startDate, $lte: endDate },
            isActive: true
          }
        },
        {
          $group: {
            _id: null,
            totalReservations: { $sum: 1 },
            noShows: {
              $sum: { $cond: [{ $eq: ['$status', 'no_show'] }, 1, 0] }
            },
            cancelled: {
              $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] }
            }
          }
        }
      ])
    ])

    // Process results
    const totalStatsData = totalStats[0] || { totalReservations: 0, averagePartySize: 0, totalGuests: 0 }
    const todayStatsData = todayStats[0] || { todayReservations: 0, confirmedToday: 0 }
    const upcomingStatsData = upcomingStats[0] || { upcomingReservations: 0, pendingReservations: 0 }
    const revenueStatsData = revenueData[0] || { totalRevenue: 0, averageOrderValue: 0, revenueReservations: 0 }
    const peakHourData = peakHours[0] || { _id: 19, bookings: 0 }
    const noShowData = noShowStats[0] || { totalReservations: 0, noShows: 0, cancelled: 0 }

    // Calculate no-show rate
    const noShowRate = noShowData.totalReservations > 0 
      ? Math.round((noShowData.noShows / noShowData.totalReservations) * 100 * 10) / 10
      : 0

    // Process status breakdown
    const statusCounts = statusBreakdown.reduce((acc: any, status: any) => {
      acc[status._id] = status.count
      return acc
    }, {})

    const stats = {
      totalReservations: totalStatsData.totalReservations,
      todayReservations: todayStatsData.todayReservations,
      upcomingReservations: upcomingStatsData.upcomingReservations,
      confirmedReservations: todayStatsData.confirmedToday,
      pendingReservations: upcomingStatsData.pendingReservations,
      cancelledReservations: statusCounts.cancelled || 0,
      noShowRate: noShowRate,
      averagePartySize: Math.round(totalStatsData.averagePartySize * 10) / 10 || 0,
      peakBookingHour: `${peakHourData._id}:00`,
      totalRevenue: Math.round(revenueStatsData.totalRevenue || 0),
      period,
      dateRange: {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      },
      breakdown: {
        byStatus: statusCounts,
        totalGuests: totalStatsData.totalGuests,
        averageOrderValue: Math.round(revenueStatsData.averageOrderValue || 0),
        revenueGeneratingReservations: revenueStatsData.revenueReservations
      }
    }

    return NextResponse.json({
      success: true,
      stats
    })

  } catch (error) {
    console.error('Error fetching reservation stats:', error)
    return NextResponse.json(
      { success: false, message: "Failed to fetch reservation statistics" },
      { status: 500 }
    )
  }
})