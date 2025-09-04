import { NextRequest, NextResponse } from "next/server"
import { dbHandler } from "@/lib/db"
import { connectMongo } from "@/lib/db/mongodb"
import { getToken } from "next-auth/jwt"
import Order from "@/models/Order"
import { Types } from "mongoose"

export const dynamic = 'force-dynamic';

// GET handler - Get sales reports data
export const GET = dbHandler(async (req: NextRequest) => {
  try {
    await connectMongo()

    const { searchParams } = new URL(req.url)
    const propertyId = searchParams.get('propertyId')
    const period = searchParams.get('period') || 'month'

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

    let startDate = new Date()
    let endDate = new Date()
    
    switch (period) {
      case 'today':
        startDate = today
        endDate = tomorrow
        break
      case 'week':
        startDate = new Date(today)
        startDate.setDate(today.getDate() - 7)
        endDate = tomorrow
        break
      case 'month':
        startDate = new Date(today.getFullYear(), today.getMonth(), 1)
        endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0)
        endDate.setHours(23, 59, 59, 999)
        break
      case 'quarter':
        const quarterStartMonth = Math.floor(today.getMonth() / 3) * 3
        startDate = new Date(today.getFullYear(), quarterStartMonth, 1)
        endDate = new Date(today.getFullYear(), quarterStartMonth + 3, 0)
        endDate.setHours(23, 59, 59, 999)
        break
      case 'year':
        startDate = new Date(today.getFullYear(), 0, 1)
        endDate = new Date(today.getFullYear(), 11, 31, 23, 59, 59, 999)
        break
    }

    const baseQuery = {
      propertyId: new Types.ObjectId(propertyId),
      status: { $in: ['completed', 'served', 'delivered'] },
      paymentStatus: 'paid',
      'timestamps.ordered': { $gte: startDate, $lte: endDate }
    }

    // Get overall statistics
    const [
      overallStats,
      dailyTrend,
      growthStats
    ] = await Promise.all([
      // Overall statistics
      Order.aggregate([
        { $match: baseQuery },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: '$pricing.total' },
            totalOrders: { $sum: 1 },
            averageOrderValue: { $avg: '$pricing.total' },
            totalTax: { $sum: '$pricing.tax' },
            totalDiscount: { $sum: '$pricing.discount' }
          }
        }
      ]),

      // Daily trend for the period
      Order.aggregate([
        { $match: baseQuery },
        {
          $group: {
            _id: {
              year: { $year: '$timestamps.ordered' },
              month: { $month: '$timestamps.ordered' },
              day: { $dayOfMonth: '$timestamps.ordered' }
            },
            revenue: { $sum: '$pricing.total' },
            orders: { $sum: 1 },
            averageOrderValue: { $avg: '$pricing.total' }
          }
        },
        {
          $project: {
            period: {
              $dateFromParts: {
                year: '$_id.year',
                month: '$_id.month',
                day: '$_id.day'
              }
            },
            revenue: 1,
            orders: 1,
            averageOrderValue: 1
          }
        },
        { $sort: { period: 1 } }
      ]),

      // Growth calculation (compare with previous period)
      Order.aggregate([
        {
          $match: {
            propertyId: new Types.ObjectId(propertyId),
            status: { $in: ['completed', 'served', 'delivered'] },
            paymentStatus: 'paid',
            'timestamps.ordered': {
              $gte: new Date(startDate.getTime() - (endDate.getTime() - startDate.getTime())),
              $lt: startDate
            }
          }
        },
        {
          $group: {
            _id: null,
            previousRevenue: { $sum: '$pricing.total' },
            previousOrders: { $sum: 1 }
          }
        }
      ])
    ])

    const stats = overallStats[0] || {
      totalRevenue: 0,
      totalOrders: 0,
      averageOrderValue: 0,
      totalTax: 0,
      totalDiscount: 0
    }

    const previousStats = growthStats[0] || { previousRevenue: 0, previousOrders: 0 }
    
    // Calculate growth rate
    const growthRate = previousStats.previousRevenue > 0 
      ? ((stats.totalRevenue - previousStats.previousRevenue) / previousStats.previousRevenue) * 100
      : 0

    // Format daily reports
    const dailyReports = dailyTrend.map(day => ({
      period: day.period.toISOString().split('T')[0],
      revenue: Math.round(day.revenue),
      orders: day.orders,
      averageOrderValue: Math.round(day.averageOrderValue),
      growth: 0 // Could calculate day-over-day growth if needed
    }))

    return NextResponse.json({
      success: true,
      totalRevenue: Math.round(stats.totalRevenue),
      totalOrders: stats.totalOrders,
      averageOrderValue: Math.round(stats.averageOrderValue),
      growthRate: Math.round(growthRate * 10) / 10,
      dailyReports,
      weeklyReports: [], // Could group dailyReports into weeks
      monthlyReports: [], // Could group dailyReports into months
      period,
      dateRange: {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      }
    })

  } catch (error) {
    console.error('Error fetching sales reports:', error)
    return NextResponse.json(
      { success: false, message: "Failed to fetch sales reports" },
      { status: 500 }
    )
  }
})