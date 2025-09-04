import { NextRequest, NextResponse } from "next/server"
import { dbHandler } from "@/lib/db"
import { connectMongo } from "@/lib/db/mongodb"
import { getToken } from "next-auth/jwt"
import Order from "@/models/Order"
import { Types } from "mongoose"

export const dynamic = 'force-dynamic';

// GET handler - Get order statistics for a property
export const GET = dbHandler(async (req: NextRequest) => {
  try {
    await connectMongo()

    const { searchParams } = new URL(req.url)
    const propertyId = searchParams.get('propertyId')
    const period = searchParams.get('period') || 'today' // today, week, month

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
    }

    // Get comprehensive order statistics
    const [
      overallStats,
      statusBreakdown,
      orderTypeStats,
      revenueStats,
      timeAnalysis
    ] = await Promise.all([
      // Overall statistics
      Order.aggregate([
        {
          $match: {
            propertyId: new Types.ObjectId(propertyId),
            'timestamps.ordered': { $gte: startDate, $lte: endDate }
          }
        },
        {
          $group: {
            _id: null,
            totalOrders: { $sum: 1 },
            completedOrders: {
              $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
            },
            averageOrderValue: { $avg: '$pricing.total' },
            totalRevenue: { $sum: '$pricing.total' }
          }
        }
      ]),

      // Breakdown by status
      Order.aggregate([
        {
          $match: {
            propertyId: new Types.ObjectId(propertyId),
            'timestamps.ordered': { $gte: startDate, $lte: endDate }
          }
        },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ]),

      // Breakdown by order type
      Order.aggregate([
        {
          $match: {
            propertyId: new Types.ObjectId(propertyId),
            'timestamps.ordered': { $gte: startDate, $lte: endDate }
          }
        },
        {
          $group: {
            _id: '$orderType',
            count: { $sum: 1 },
            revenue: { $sum: '$pricing.total' }
          }
        }
      ]),

      // Revenue statistics
      Order.aggregate([
        {
          $match: {
            propertyId: new Types.ObjectId(propertyId),
            status: 'completed',
            'timestamps.ordered': { $gte: startDate, $lte: endDate }
          }
        },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: '$pricing.total' },
            totalTax: { $sum: '$pricing.tax' },
            totalDiscount: { $sum: '$pricing.discount' },
            averageOrderValue: { $avg: '$pricing.total' },
            highestOrder: { $max: '$pricing.total' },
            lowestOrder: { $min: '$pricing.total' }
          }
        }
      ]),

      // Time-based analysis (average preparation/completion times)
      Order.aggregate([
        {
          $match: {
            propertyId: new Types.ObjectId(propertyId),
            status: 'completed',
            'timestamps.ordered': { $exists: true },
            'timestamps.ready': { $exists: true },
            'timestamps.ordered': { $gte: startDate, $lte: endDate }
          }
        },
        {
          $project: {
            preparationTime: {
              $divide: [
                { $subtract: ['$timestamps.ready', '$timestamps.ordered'] },
                1000 * 60 // Convert to minutes
              ]
            },
            completionTime: {
              $divide: [
                { $subtract: [
                  { $ifNull: ['$timestamps.served', '$timestamps.ready'] },
                  '$timestamps.ordered'
                ] },
                1000 * 60 // Convert to minutes
              ]
            }
          }
        },
        {
          $group: {
            _id: null,
            averagePreparationTime: { $avg: '$preparationTime' },
            averageCompletionTime: { $avg: '$completionTime' },
            maxPreparationTime: { $max: '$preparationTime' },
            minPreparationTime: { $min: '$preparationTime' }
          }
        }
      ])
    ])

    // Process results
    const overall = overallStats[0] || {
      totalOrders: 0,
      completedOrders: 0,
      averageOrderValue: 0,
      totalRevenue: 0
    }

    const revenue = revenueStats[0] || {
      totalRevenue: 0,
      totalTax: 0,
      totalDiscount: 0,
      averageOrderValue: 0,
      highestOrder: 0,
      lowestOrder: 0
    }

    const timing = timeAnalysis[0] || {
      averagePreparationTime: 0,
      averageCompletionTime: 0,
      maxPreparationTime: 0,
      minPreparationTime: 0
    }

    // Process status breakdown
    const statusCounts = statusBreakdown.reduce((acc: any, status: any) => {
      acc[status._id] = status.count
      return acc
    }, {})

    // Process order type breakdown
    const orderTypeCounts = orderTypeStats.reduce((acc: any, type: any) => {
      acc[type._id] = {
        count: type.count,
        revenue: type.revenue || 0
      }
      return acc
    }, {})

    // Current queue (active orders)
    const kitchenQueue = statusCounts.preparing || 0
    const readyOrders = statusCounts.ready || 0
    
    const stats = {
      totalOrders: overall.totalOrders,
      pendingOrders: statusCounts.pending || 0,
      confirmedOrders: statusCounts.confirmed || 0,
      preparingOrders: statusCounts.preparing || 0,
      readyOrders: statusCounts.ready || 0,
      servedOrders: statusCounts.served || 0,
      completedOrders: overall.completedOrders,
      cancelledOrders: statusCounts.cancelled || 0,
      kitchenQueue,
      totalRevenue: Math.round(revenue.totalRevenue),
      totalTax: Math.round(revenue.totalTax),
      totalDiscount: Math.round(revenue.totalDiscount),
      averageOrderValue: Math.round(overall.averageOrderValue || 0),
      highestOrderValue: Math.round(revenue.highestOrder || 0),
      lowestOrderValue: Math.round(revenue.lowestOrder || 0),
      averagePreparationTime: Math.round(timing.averagePreparationTime || 0),
      averageCompletionTime: Math.round(timing.averageCompletionTime || 0),
      orderTypeBreakdown: orderTypeCounts,
      statusBreakdown: statusCounts,
      completionRate: overall.totalOrders > 0 
        ? Math.round((overall.completedOrders / overall.totalOrders) * 100) 
        : 0,
      period,
      dateRange: {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      }
    }

    return NextResponse.json({
      success: true,
      stats
    })

  } catch (error) {
    console.error('Error fetching order statistics:', error)
    return NextResponse.json(
      { success: false, message: "Failed to fetch order statistics" },
      { status: 500 }
    )
  }
})