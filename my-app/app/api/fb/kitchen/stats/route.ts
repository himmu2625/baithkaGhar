import { NextRequest, NextResponse } from "next/server"
import { dbHandler } from "@/lib/db"
import { connectMongo } from "@/lib/db/mongodb"
import { getToken } from "next-auth/jwt"
import Order from "@/models/Order"
import { Types } from "mongoose"

export const dynamic = 'force-dynamic';

// GET handler - Get kitchen statistics
export const GET = dbHandler(async (req: NextRequest) => {
  try {
    await connectMongo()

    const { searchParams } = new URL(req.url)
    const propertyId = searchParams.get('propertyId')

    if (!propertyId || !Types.ObjectId.isValid(propertyId)) {
      return NextResponse.json(
        { success: false, message: "Valid property ID is required" },
        { status: 400 }
      )
    }

    // Calculate today's date range
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    // Get comprehensive kitchen statistics
    const [
      activeOrderStats,
      todayStats,
      preparationTimeStats
    ] = await Promise.all([
      // Active orders breakdown
      Order.aggregate([
        {
          $match: {
            propertyId: new Types.ObjectId(propertyId),
            status: { $in: ['pending', 'confirmed', 'preparing', 'ready'] }
          }
        },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
            totalItems: { $sum: { $sum: '$items.quantity' } }
          }
        }
      ]),

      // Today's completed orders
      Order.aggregate([
        {
          $match: {
            propertyId: new Types.ObjectId(propertyId),
            'timestamps.ordered': { $gte: today, $lt: tomorrow }
          }
        },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ]),

      // Average preparation times
      Order.aggregate([
        {
          $match: {
            propertyId: new Types.ObjectId(propertyId),
            status: { $in: ['ready', 'served', 'completed'] },
            'timestamps.ordered': { $exists: true },
            'timestamps.ready': { $exists: true },
            'timestamps.ordered': { $gte: today, $lt: tomorrow }
          }
        },
        {
          $project: {
            preparationTime: {
              $divide: [
                { $subtract: ['$timestamps.ready', '$timestamps.ordered'] },
                1000 * 60 // Convert to minutes
              ]
            }
          }
        },
        {
          $group: {
            _id: null,
            averagePreparationTime: { $avg: '$preparationTime' },
            minPreparationTime: { $min: '$preparationTime' },
            maxPreparationTime: { $max: '$preparationTime' },
            totalPreparedOrders: { $sum: 1 }
          }
        }
      ])
    ])

    // Process active order stats
    const activeStats = activeOrderStats.reduce((acc: any, status: any) => {
      acc[status._id] = {
        count: status.count,
        totalItems: status.totalItems
      }
      return acc
    }, {})

    // Process today's order stats
    const todayOrderStats = todayStats.reduce((acc: any, status: any) => {
      acc[status._id] = status.count
      return acc
    }, {})

    // Process preparation time stats
    const prepTimeStats = preparationTimeStats[0] || {
      averagePreparationTime: 0,
      minPreparationTime: 0,
      maxPreparationTime: 0,
      totalPreparedOrders: 0
    }

    // Calculate queue statistics
    const pendingOrders = activeStats.pending?.count || 0
    const preparingOrders = activeStats.preparing?.count || 0
    const readyOrders = activeStats.ready?.count || 0
    const confirmedOrders = activeStats.confirmed?.count || 0

    // Today's totals
    const totalOrdersToday = Object.values(todayOrderStats).reduce((sum: any, count: any) => sum + count, 0)
    const completedOrdersToday = todayOrderStats.completed || todayOrderStats.served || 0

    // Calculate efficiency metrics
    const averagePreparationTime = Math.round(prepTimeStats.averagePreparationTime || 0)
    const kitchenEfficiency = prepTimeStats.totalPreparedOrders > 0 
      ? Math.round((completedOrdersToday / totalOrdersToday) * 100) 
      : 0

    const stats = {
      // Current queue status
      pendingOrders,
      preparingOrders,  
      readyOrders,
      confirmedOrders,
      totalActiveOrders: pendingOrders + preparingOrders + readyOrders + confirmedOrders,

      // Performance metrics
      averagePreparationTime,
      minPreparationTime: Math.round(prepTimeStats.minPreparationTime || 0),
      maxPreparationTime: Math.round(prepTimeStats.maxPreparationTime || 0),
      
      // Daily statistics
      totalOrdersToday,
      completedOrdersToday,
      kitchenEfficiency,
      
      // Queue breakdown with item counts
      queueDetails: {
        pending: {
          orders: pendingOrders,
          items: activeStats.pending?.totalItems || 0
        },
        preparing: {
          orders: preparingOrders,
          items: activeStats.preparing?.totalItems || 0
        },
        ready: {
          orders: readyOrders,
          items: activeStats.ready?.totalItems || 0
        },
        confirmed: {
          orders: confirmedOrders,
          items: activeStats.confirmed?.totalItems || 0
        }
      },

      // Status breakdown for today
      todayBreakdown: {
        total: totalOrdersToday,
        completed: completedOrdersToday,
        cancelled: todayOrderStats.cancelled || 0,
        pending: todayOrderStats.pending || 0,
        preparing: todayOrderStats.preparing || 0,
        ready: todayOrderStats.ready || 0,
        served: todayOrderStats.served || 0
      },

      generatedAt: new Date().toISOString()
    }

    return NextResponse.json({
      success: true,
      stats
    })

  } catch (error) {
    console.error('Error fetching kitchen statistics:', error)
    return NextResponse.json(
      { success: false, message: "Failed to fetch kitchen statistics" },
      { status: 500 }
    )
  }
})