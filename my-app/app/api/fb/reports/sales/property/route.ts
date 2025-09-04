import { NextRequest, NextResponse } from "next/server"
import { dbHandler } from "@/lib/db"
import { connectMongo } from "@/lib/db/mongodb"
import { getToken } from "next-auth/jwt"
import Order from "@/models/Order"
import MenuItem from "@/models/MenuItem"
import MenuCategory from "@/models/MenuCategory"
import { Types } from "mongoose"

export const dynamic = 'force-dynamic';

// GET handler - Get sales reports for a property
export const GET = dbHandler(async (req: NextRequest) => {
  try {
    // Validate authentication
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
    if (!token || !token.sub) {
      return NextResponse.json(
        { success: false, message: "Unauthorized - Please log in" },
        { status: 401 }
      )
    }

    await connectMongo()
    const { searchParams } = new URL(req.url)
    const propertyId = searchParams.get('propertyId')

    if (!propertyId || !Types.ObjectId.isValid(propertyId)) {
      return NextResponse.json(
        { success: false, message: "Valid property ID is required as query parameter" },
        { status: 400 }
      )
    }
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const reportType = searchParams.get('type') || 'daily' // daily, weekly, monthly, custom
    const groupBy = searchParams.get('groupBy') || 'day' // day, week, month, category, item

    // Calculate date range based on report type
    let dateRange = {}
    const now = new Date()
    
    if (startDate && endDate) {
      dateRange = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      }
    } else {
      switch (reportType) {
        case 'daily':
          const today = new Date()
          today.setHours(0, 0, 0, 0)
          const tomorrow = new Date(today)
          tomorrow.setDate(tomorrow.getDate() + 1)
          dateRange = { $gte: today, $lt: tomorrow }
          break
        case 'weekly':
          const weekAgo = new Date()
          weekAgo.setDate(weekAgo.getDate() - 7)
          dateRange = { $gte: weekAgo, $lte: now }
          break
        case 'monthly':
          const monthAgo = new Date()
          monthAgo.setMonth(monthAgo.getMonth() - 1)
          dateRange = { $gte: monthAgo, $lte: now }
          break
        default:
          // Default to today
          const defaultToday = new Date()
          defaultToday.setHours(0, 0, 0, 0)
          const defaultTomorrow = new Date(defaultToday)
          defaultTomorrow.setDate(defaultTomorrow.getDate() + 1)
          dateRange = { $gte: defaultToday, $lt: defaultTomorrow }
      }
    }

    // Base query for completed orders
    const baseQuery = {
      propertyId: new Types.ObjectId(propertyId),
      status: { $in: ['served', 'delivered'] },
      paymentStatus: 'paid',
      'timestamps.ordered': dateRange
    }

    // Overall Summary
    const overallSummary = await Order.aggregate([
      { $match: baseQuery },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalRevenue: { $sum: '$pricing.total' },
          totalSubtotal: { $sum: '$pricing.subtotal' },
          totalTax: { $sum: '$pricing.tax' },
          totalServiceCharge: { $sum: '$pricing.serviceCharge' },
          totalDiscount: { $sum: '$pricing.discount' },
          averageOrderValue: { $avg: '$pricing.total' },
          totalItemsOrdered: {
            $sum: {
              $sum: '$items.quantity'
            }
          }
        }
      }
    ])

    // Sales by Order Type
    const salesByOrderType = await Order.aggregate([
      { $match: baseQuery },
      {
        $group: {
          _id: '$orderType',
          count: { $sum: 1 },
          revenue: { $sum: '$pricing.total' },
          averageValue: { $avg: '$pricing.total' }
        }
      }
    ])

    // Sales by Hour (for daily reports)
    const salesByHour = await Order.aggregate([
      { $match: baseQuery },
      {
        $group: {
          _id: { $hour: '$timestamps.ordered' },
          count: { $sum: 1 },
          revenue: { $sum: '$pricing.total' }
        }
      },
      { $sort: { '_id': 1 } }
    ])

    // Top Selling Items
    const topSellingItems = await Order.aggregate([
      { $match: baseQuery },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.itemId',
          totalQuantity: { $sum: '$items.quantity' },
          totalRevenue: { $sum: '$items.subtotal' },
          orderCount: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'menuitems',
          localField: '_id',
          foreignField: '_id',
          as: 'itemDetails'
        }
      },
      { $unwind: '$itemDetails' },
      {
        $project: {
          itemName: '$itemDetails.name',
          categoryId: '$itemDetails.categoryId',
          totalQuantity: 1,
          totalRevenue: 1,
          orderCount: 1,
          averagePrice: { $divide: ['$totalRevenue', '$totalQuantity'] }
        }
      },
      { $sort: { totalQuantity: -1 } },
      { $limit: 10 }
    ])

    // Sales by Category
    const salesByCategory = await Order.aggregate([
      { $match: baseQuery },
      { $unwind: '$items' },
      {
        $lookup: {
          from: 'menuitems',
          localField: 'items.itemId',
          foreignField: '_id',
          as: 'itemDetails'
        }
      },
      { $unwind: '$itemDetails' },
      {
        $lookup: {
          from: 'menucategories',
          localField: 'itemDetails.categoryId',
          foreignField: '_id',
          as: 'categoryDetails'
        }
      },
      { $unwind: '$categoryDetails' },
      {
        $group: {
          _id: {
            categoryId: '$categoryDetails._id',
            categoryName: '$categoryDetails.name'
          },
          totalQuantity: { $sum: '$items.quantity' },
          totalRevenue: { $sum: '$items.subtotal' },
          itemCount: { $addToSet: '$items.itemId' }
        }
      },
      {
        $project: {
          categoryName: '$_id.categoryName',
          totalQuantity: 1,
          totalRevenue: 1,
          uniqueItems: { $size: '$itemCount' }
        }
      },
      { $sort: { totalRevenue: -1 } }
    ])

    // Payment Method Breakdown
    const paymentMethodBreakdown = await Order.aggregate([
      { $match: baseQuery },
      {
        $group: {
          _id: '$paymentMethod',
          count: { $sum: 1 },
          revenue: { $sum: '$pricing.total' }
        }
      }
    ])

    // Sales Trend (based on groupBy parameter)
    let salesTrend = []
    switch (groupBy) {
      case 'day':
        salesTrend = await Order.aggregate([
          { $match: baseQuery },
          {
            $group: {
              _id: {
                year: { $year: '$timestamps.ordered' },
                month: { $month: '$timestamps.ordered' },
                day: { $dayOfMonth: '$timestamps.ordered' }
              },
              count: { $sum: 1 },
              revenue: { $sum: '$pricing.total' }
            }
          },
          { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
        ])
        break
      case 'week':
        salesTrend = await Order.aggregate([
          { $match: baseQuery },
          {
            $group: {
              _id: {
                year: { $year: '$timestamps.ordered' },
                week: { $week: '$timestamps.ordered' }
              },
              count: { $sum: 1 },
              revenue: { $sum: '$pricing.total' }
            }
          },
          { $sort: { '_id.year': 1, '_id.week': 1 } }
        ])
        break
      case 'month':
        salesTrend = await Order.aggregate([
          { $match: baseQuery },
          {
            $group: {
              _id: {
                year: { $year: '$timestamps.ordered' },
                month: { $month: '$timestamps.ordered' }
              },
              count: { $sum: 1 },
              revenue: { $sum: '$pricing.total' }
            }
          },
          { $sort: { '_id.year': 1, '_id.month': 1 } }
        ])
        break
    }

    // Performance Metrics
    const performanceMetrics = {
      averagePreparationTime: await Order.aggregate([
        { $match: baseQuery },
        {
          $project: {
            prepTime: {
              $divide: [
                { $subtract: ['$timestamps.ready', '$timestamps.confirmed'] },
                1000 * 60 // Convert to minutes
              ]
            }
          }
        },
        {
          $group: {
            _id: null,
            averagePrepTime: { $avg: '$prepTime' }
          }
        }
      ]),
      
      orderFulfillmentRate: await Order.aggregate([
        {
          $match: {
            propertyId: new Types.ObjectId(propertyId),
            'timestamps.ordered': dateRange
          }
        },
        {
          $group: {
            _id: null,
            totalOrders: { $sum: 1 },
            completedOrders: {
              $sum: {
                $cond: [{ $in: ['$status', ['served', 'delivered']] }, 1, 0]
              }
            },
            cancelledOrders: {
              $sum: {
                $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0]
              }
            }
          }
        },
        {
          $project: {
            fulfillmentRate: {
              $multiply: [
                { $divide: ['$completedOrders', '$totalOrders'] },
                100
              ]
            },
            cancellationRate: {
              $multiply: [
                { $divide: ['$cancelledOrders', '$totalOrders'] },
                100
              ]
            }
          }
        }
      ])
    }

    const summary = overallSummary[0] || {
      totalOrders: 0,
      totalRevenue: 0,
      totalSubtotal: 0,
      totalTax: 0,
      totalServiceCharge: 0,
      totalDiscount: 0,
      averageOrderValue: 0,
      totalItemsOrdered: 0
    }

    return NextResponse.json({
      success: true,
      report: {
        summary,
        salesByOrderType,
        salesByHour,
        topSellingItems,
        salesByCategory,
        paymentMethodBreakdown,
        salesTrend,
        performanceMetrics
      },
      filters: {
        propertyId,
        dateRange: {
          start: startDate || (dateRange as any).$gte?.toISOString(),
          end: endDate || (dateRange as any).$lte?.toISOString()
        },
        reportType,
        groupBy
      },
      generatedAt: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error generating sales report:', error)
    return NextResponse.json(
      { success: false, message: "Failed to generate sales report" },
      { status: 500 }
    )
  }
})