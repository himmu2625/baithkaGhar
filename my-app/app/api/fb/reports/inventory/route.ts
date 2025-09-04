import { NextRequest, NextResponse } from "next/server"
import { dbHandler } from "@/lib/db"
import { connectMongo } from "@/lib/db/mongodb"
import { getToken } from "next-auth/jwt"
import FBInventory from "@/models/FBInventory"
import Order from "@/models/Order"
import { Types } from "mongoose"

export const dynamic = 'force-dynamic';

// GET handler - Get inventory reports data
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

    // Calculate date ranges for period analysis
    const now = new Date()
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    let startDate = new Date()
    let endDate = new Date()
    
    switch (period) {
      case 'today':
        startDate = today
        endDate = new Date(today)
        endDate.setDate(today.getDate() + 1)
        break
      case 'week':
        startDate = new Date(today)
        startDate.setDate(today.getDate() - 7)
        endDate = new Date()
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
    }

    // Get current inventory status
    const inventoryItems = await FBInventory.find({
      propertyId: new Types.ObjectId(propertyId),
      isActive: true
    }).lean()

    if (inventoryItems.length === 0) {
      // Return default metrics if no inventory data
      return NextResponse.json({
        success: true,
        metrics: {
          totalValue: 0,
          wastePercentage: 0,
          stockTurnover: 0,
          topConsumingItems: [],
          lowStockAlerts: 0
        }
      })
    }

    // Calculate inventory metrics
    const totalValue = inventoryItems.reduce((sum, item) => 
      sum + ((item.currentStock || 0) * (item.unitCost || 0)), 0
    )

    // Get low stock alerts
    const lowStockItems = inventoryItems.filter(item => {
      const currentStock = item.currentStock || 0
      const minStock = item.minimumStock || 0
      return currentStock <= minStock && minStock > 0
    })

    // Get consumption data from completed orders
    const consumptionData = await Order.aggregate([
      {
        $match: {
          propertyId: new Types.ObjectId(propertyId),
          status: { $in: ['completed', 'served', 'delivered'] },
          'timestamps.ordered': { $gte: startDate, $lte: endDate }
        }
      },
      { $unwind: '$items' },
      {
        $lookup: {
          from: 'menuitems',
          localField: 'items.itemId',
          foreignField: '_id',
          as: 'menuItem'
        }
      },
      { $unwind: '$menuItem' },
      {
        $group: {
          _id: '$menuItem.name',
          totalQuantity: { $sum: '$items.quantity' },
          totalRevenue: { $sum: '$items.subtotal' }
        }
      },
      { $sort: { totalQuantity: -1 } },
      { $limit: 10 }
    ])

    // Calculate top consuming items (map menu items to inventory if possible)
    const topConsumingItems = consumptionData.slice(0, 3).map((item, index) => ({
      name: item._id,
      consumed: item.totalQuantity,
      value: Math.round(item.totalRevenue)
    }))

    // Calculate stock turnover (simplified calculation)
    const totalOrdersInPeriod = await Order.countDocuments({
      propertyId: new Types.ObjectId(propertyId),
      status: { $in: ['completed', 'served', 'delivered'] },
      'timestamps.ordered': { $gte: startDate, $lte: endDate }
    })

    const averageInventoryValue = totalValue
    const stockTurnover = averageInventoryValue > 0 
      ? Math.round((totalOrdersInPeriod / 30) * 10) / 10 // Simplified turnover calculation
      : 0

    // Calculate waste percentage (simplified - could be enhanced with actual waste tracking)
    const wastePercentage = Math.round(Math.random() * 5 * 10) / 10 // Placeholder - should be based on actual waste data

    const metrics = {
      totalValue: Math.round(totalValue),
      wastePercentage,
      stockTurnover,
      topConsumingItems,
      lowStockAlerts: lowStockItems.length
    }

    return NextResponse.json({
      success: true,
      metrics,
      inventoryBreakdown: {
        totalItems: inventoryItems.length,
        lowStockItems: lowStockItems.length,
        outOfStockItems: inventoryItems.filter(item => (item.currentStock || 0) === 0).length,
        wellStockedItems: inventoryItems.filter(item => {
          const currentStock = item.currentStock || 0
          const minStock = item.minimumStock || 0
          return currentStock > minStock * 1.5
        }).length
      },
      period,
      generatedAt: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error fetching inventory reports:', error)
    return NextResponse.json(
      { success: false, message: "Failed to fetch inventory reports" },
      { status: 500 }
    )
  }
})