import { NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/utils/dbConnect"
import FBOrder from "@/models/FBOrder"
import FBOrderItem from "@/models/FBOrderItem"
import MenuItem from "@/models/MenuItem"
import FBInventory from "@/models/FBInventory"
import Table from "@/models/Table"

export async function GET(request: NextRequest) {
  try {
    await dbConnect()
    
    const { searchParams } = new URL(request.url)
    const propertyId = searchParams.get('propertyId')

    if (!propertyId) {
      return NextResponse.json(
        { error: "Property ID is required" },
        { status: 400 }
      )
    }

    // Define today's date range
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    // Parallel queries for better performance
    const [
      todayOrders,
      orderStatuses,
      revenueData,
      topSellingItems,
      lowStockItems,
      recentOrders,
      tableStats
    ] = await Promise.all([
      // Today's total orders
      FBOrder.countDocuments({
        propertyId,
        createdAt: { $gte: today, $lt: tomorrow }
      }),

      // Order status breakdown
      FBOrder.aggregate([
        {
          $match: {
            propertyId,
            createdAt: { $gte: today, $lt: tomorrow }
          }
        },
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 }
          }
        }
      ]),

      // Revenue calculations
      FBOrder.aggregate([
        {
          $match: {
            propertyId,
            createdAt: { $gte: today, $lt: tomorrow },
            status: { $ne: "cancelled" }
          }
        },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: "$pricing.totalAmount" },
            orderCount: { $sum: 1 }
          }
        }
      ]),

      // Top selling items
      FBOrderItem.aggregate([
        {
          $lookup: {
            from: 'fborders',
            localField: 'orderId',
            foreignField: '_id',
            as: 'order'
          }
        },
        {
          $unwind: '$order'
        },
        {
          $match: {
            'order.propertyId': propertyId,
            'order.createdAt': { $gte: today, $lt: tomorrow },
            'order.status': { $ne: 'cancelled' }
          }
        },
        {
          $lookup: {
            from: 'menuitems',
            localField: 'menuItemId',
            foreignField: '_id',
            as: 'menuItem'
          }
        },
        {
          $unwind: '$menuItem'
        },
        {
          $group: {
            _id: '$menuItem._id',
            name: { $first: '$menuItem.name' },
            quantity: { $sum: '$quantity' },
            revenue: { $sum: '$totalPrice' }
          }
        },
        {
          $sort: { quantity: -1 }
        },
        {
          $limit: 5
        }
      ]),

      // Low stock items
      FBInventory.find({
        propertyId,
        $expr: { $lte: ['$currentStock', '$minStock'] }
      }).limit(10),

      // Recent orders
      FBOrder.find({
        propertyId,
        createdAt: { $gte: today, $lt: tomorrow }
      })
      .populate('dining.tableId', 'number name')
      .populate('items')
      .sort({ createdAt: -1 })
      .limit(10),

      // Table statistics
      Table.aggregate([
        {
          $match: { propertyId }
        },
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 }
          }
        }
      ])
    ])

    // Process order status data
    const statusCounts = {
      pending: 0,
      preparing: 0,
      ready: 0,
      served: 0,
      cancelled: 0
    }

    orderStatuses.forEach((status: any) => {
      statusCounts[status._id as keyof typeof statusCounts] = status.count
    })

    // Calculate metrics
    const totalRevenue = revenueData[0]?.totalRevenue || 0
    const orderCount = revenueData[0]?.orderCount || 0
    const averageOrderValue = orderCount > 0 ? Math.round(totalRevenue / orderCount) : 0

    // Calculate table occupancy
    const totalTables = tableStats.reduce((sum: number, stat: any) => sum + stat.count, 0)
    const occupiedTables = tableStats.find((stat: any) => stat._id === 'occupied')?.count || 0
    const tableOccupancy = totalTables > 0 ? Math.round((occupiedTables / totalTables) * 100) : 0

    // Format recent orders
    const formattedRecentOrders = recentOrders.map((order: any) => {
      const timeAgo = Math.floor((Date.now() - new Date(order.createdAt).getTime()) / (1000 * 60))
      const tableName = order.dining?.tableId ? 
        (order.dining.tableId.name || `Table ${order.dining.tableId.number}`) : 
        'Takeaway'

      return {
        id: order._id.toString(),
        orderNumber: order.orderNumber,
        table: tableName,
        items: order.items?.length || 0,
        total: order.pricing?.totalAmount || 0,
        status: order.status,
        time: timeAgo < 60 ? `${timeAgo} mins ago` : `${Math.floor(timeAgo / 60)}h ago`
      }
    })

    // Format top selling items
    const formattedTopItems = topSellingItems.map((item: any) => ({
      name: item.name,
      quantity: item.quantity,
      revenue: item.revenue
    }))

    // Format low stock items
    const formattedLowStock = lowStockItems.map((item: any) => ({
      name: item.name,
      currentStock: item.currentStock,
      minStock: item.minStock
    }))

    const dashboardData = {
      propertyId,
      todayOrders,
      todayRevenue: totalRevenue,
      averageOrderValue,
      tableOccupancy,
      pendingOrders: statusCounts.pending,
      completedOrders: statusCounts.served,
      cancelledOrders: statusCounts.cancelled,
      kitchenQueue: statusCounts.preparing + statusCounts.ready,
      topSellingItems: formattedTopItems,
      lowStockItems: formattedLowStock,
      recentOrders: formattedRecentOrders
    }

    return NextResponse.json({
      success: true,
      data: dashboardData
    })

  } catch (error) {
    console.error("F&B Dashboard API error:", error)
    
    return NextResponse.json(
      { 
        error: "Failed to fetch F&B dashboard data",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    )
  }
}

// POST endpoint for updating stats or triggering actions
export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const propertyId = searchParams.get('propertyId')
    const body = await request.json()

    if (!propertyId) {
      return NextResponse.json(
        { error: "Property ID is required" },
        { status: 400 }
      )
    }

    // Handle different action types
    switch (body.action) {
      case 'refresh_stats':
        // Trigger stats refresh
        console.log(`Refreshing F&B stats for property ${propertyId}`)
        break
      
      case 'update_table_status':
        // Update table status
        console.log(`Updating table ${body.tableId} status to ${body.status}`)
        break
      
      case 'alert_acknowledge':
        // Acknowledge an alert
        console.log(`Acknowledging alert ${body.alertId}`)
        break
      
      default:
        return NextResponse.json(
          { error: "Invalid action" },
          { status: 400 }
        )
    }

    return NextResponse.json({
      success: true,
      message: `Action ${body.action} completed successfully`
    })

  } catch (error) {
    console.error("F&B Dashboard POST API error:", error)
    
    return NextResponse.json(
      { 
        error: "Failed to process request",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    )
  }
}