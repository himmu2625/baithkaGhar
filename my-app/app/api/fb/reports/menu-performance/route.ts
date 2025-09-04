import { NextRequest, NextResponse } from "next/server"
import { dbHandler } from "@/lib/db"
import { connectMongo } from "@/lib/db/mongodb"
import { getToken } from "next-auth/jwt"
import Order from "@/models/Order"
import MenuItem from "@/models/MenuItem"
import MenuCategory from "@/models/MenuCategory"
import { Types } from "mongoose"

export const dynamic = 'force-dynamic';

// GET handler - Get menu performance reports
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

    // Get top selling menu items with detailed performance metrics
    const topSellingItems = await Order.aggregate([
      {
        $match: {
          propertyId: new Types.ObjectId(propertyId),
          status: { $in: ['completed', 'served', 'delivered'] },
          'timestamps.ordered': { $gte: startDate, $lte: endDate }
        }
      },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.itemId',
          totalOrders: { $sum: '$items.quantity' },
          totalRevenue: { $sum: '$items.subtotal' },
          uniqueOrderCount: { $addToSet: '$_id' },
          averagePrice: { $avg: '$items.unitPrice' }
        }
      },
      {
        $lookup: {
          from: 'menuitems',
          localField: '_id',
          foreignField: '_id',
          as: 'menuItem'
        }
      },
      { $unwind: '$menuItem' },
      {
        $lookup: {
          from: 'menucategories',
          localField: 'menuItem.categoryId',
          foreignField: '_id',
          as: 'category'
        }
      },
      { $unwind: '$category' },
      {
        $project: {
          id: { $toString: '$_id' },
          name: '$menuItem.name',
          category: '$category.name',
          totalOrders: 1,
          totalRevenue: { $round: ['$totalRevenue', 2] },
          averageRating: { $ifNull: ['$menuItem.averageRating', 4.5] },
          profitMargin: { 
            $round: [
              { 
                $multiply: [
                  { $divide: [
                    { $subtract: ['$averagePrice', { $ifNull: ['$menuItem.costPrice', { $multiply: ['$averagePrice', 0.3] }] }] },
                    '$averagePrice'
                  ] },
                  100
                ]
              },
              0
            ]
          },
          popularityTrend: {
            $switch: {
              branches: [
                { case: { $gte: ['$totalOrders', 50] }, then: 'up' },
                { case: { $lte: ['$totalOrders', 10] }, then: 'down' }
              ],
              default: 'stable'
            }
          }
        }
      },
      { $sort: { totalOrders: -1 } },
      { $limit: 20 }
    ])

    // Get category performance
    const categoryPerformance = await Order.aggregate([
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
        $lookup: {
          from: 'menucategories',
          localField: 'menuItem.categoryId',
          foreignField: '_id',
          as: 'category'
        }
      },
      { $unwind: '$category' },
      {
        $group: {
          _id: {
            categoryId: '$category._id',
            categoryName: '$category.name'
          },
          totalQuantity: { $sum: '$items.quantity' },
          totalRevenue: { $sum: '$items.subtotal' },
          uniqueItems: { $addToSet: '$items.itemId' },
          averageItemPrice: { $avg: '$items.unitPrice' }
        }
      },
      {
        $project: {
          id: { $toString: '$_id.categoryId' },
          name: '$_id.categoryName',
          totalQuantity: 1,
          totalRevenue: { $round: ['$totalRevenue', 2] },
          uniqueItemsSold: { $size: '$uniqueItems' },
          averageItemPrice: { $round: ['$averageItemPrice', 2] }
        }
      },
      { $sort: { totalRevenue: -1 } }
    ])

    // Get slow-moving items (items with low sales)
    const allMenuItems = await MenuItem.find({
      propertyId: new Types.ObjectId(propertyId),
      isActive: true
    }).select('_id name basePrice categoryId').lean()

    const soldItemIds = new Set(topSellingItems.map(item => item.id))
    const slowMovingItems = allMenuItems
      .filter(item => !soldItemIds.has(item._id.toString()))
      .slice(0, 10)
      .map(item => ({
        id: item._id.toString(),
        name: item.name,
        price: item.basePrice,
        totalOrders: 0,
        totalRevenue: 0,
        status: 'slow_moving'
      }))

    return NextResponse.json({
      success: true,
      topItems: topSellingItems,
      categoryPerformance,
      slowMovingItems,
      summary: {
        totalItemsAnalyzed: allMenuItems.length,
        topPerformingItems: topSellingItems.length,
        slowMovingItems: slowMovingItems.length,
        totalCategoriesActive: categoryPerformance.length,
        period,
        dateRange: {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString()
        }
      },
      generatedAt: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error fetching menu performance:', error)
    return NextResponse.json(
      { success: false, message: "Failed to fetch menu performance data" },
      { status: 500 }
    )
  }
})