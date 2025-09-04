import { NextRequest, NextResponse } from "next/server"
import { dbHandler } from "@/lib/db"
import { connectMongo } from "@/lib/db/mongodb"
import { getToken } from "next-auth/jwt"
import Order from "@/models/Order"
import FBInventory from "@/models/FBInventory"
import MenuItem from "@/models/MenuItem"
import { Types } from "mongoose"

export const dynamic = 'force-dynamic';

// GET handler - Export various reports
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
    const reportType = searchParams.get('reportType')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const period = searchParams.get('period') || 'month'

    if (!propertyId || !Types.ObjectId.isValid(propertyId)) {
      return NextResponse.json(
        { success: false, message: "Valid property ID is required" },
        { status: 400 }
      )
    }

    if (!reportType) {
      return NextResponse.json(
        { success: false, message: "Report type is required" },
        { status: 400 }
      )
    }

    // Calculate date range
    let dateRange = calculateDateRange(startDate, endDate, period)

    let exportData: any[] = []
    let summary: any = {}

    switch (reportType) {
      case 'sales':
        const salesReport = await generateSalesReport(propertyId, dateRange)
        exportData = salesReport.data
        summary = salesReport.summary
        break

      case 'menu-performance':
        const menuReport = await generateMenuPerformanceReport(propertyId, dateRange)
        exportData = menuReport.data
        summary = menuReport.summary
        break

      case 'inventory-status':
        const inventoryReport = await generateInventoryStatusReport(propertyId)
        exportData = inventoryReport.data
        summary = inventoryReport.summary
        break

      case 'customer-analytics':
        const customerReport = await generateCustomerAnalyticsReport(propertyId, dateRange)
        exportData = customerReport.data
        summary = customerReport.summary
        break

      case 'operational':
        const operationalReport = await generateOperationalReport(propertyId, dateRange)
        exportData = operationalReport.data
        summary = operationalReport.summary
        break

      default:
        return NextResponse.json(
          { success: false, message: "Invalid report type" },
          { status: 400 }
        )
    }

    return NextResponse.json({
      success: true,
      reportType,
      period,
      dateRange: {
        from: dateRange.start.toISOString(),
        to: dateRange.end.toISOString()
      },
      data: exportData,
      summary,
      metadata: {
        totalRecords: exportData.length,
        generatedAt: new Date().toISOString(),
        generatedBy: token.email || token.name || 'Unknown',
        propertyId
      }
    })

  } catch (error) {
    console.error('Error exporting report:', error)
    return NextResponse.json(
      { success: false, message: "Failed to export report" },
      { status: 500 }
    )
  }
})

// Sales Report Generator
async function generateSalesReport(propertyId: string, dateRange: { start: Date; end: Date }) {
  const orders = await Order.aggregate([
    {
      $match: {
        propertyId: new Types.ObjectId(propertyId),
        status: { $in: ['completed', 'served', 'delivered'] },
        'timestamps.ordered': { $gte: dateRange.start, $lte: dateRange.end }
      }
    },
    {
      $group: {
        _id: {
          date: { $dateToString: { format: "%Y-%m-%d", date: "$timestamps.ordered" } },
          orderType: "$orderType"
        },
        totalOrders: { $sum: 1 },
        totalRevenue: { $sum: "$pricing.total" },
        averageOrderValue: { $avg: "$pricing.total" },
        totalTax: { $sum: "$pricing.tax" },
        totalDiscount: { $sum: "$pricing.discount" }
      }
    },
    { $sort: { "_id.date": 1 } }
  ])

  const data = orders.map(item => ({
    'Date': item._id.date,
    'Order Type': item._id.orderType,
    'Total Orders': item.totalOrders,
    'Total Revenue': Math.round(item.totalRevenue),
    'Average Order Value': Math.round(item.averageOrderValue),
    'Total Tax': Math.round(item.totalTax),
    'Total Discount': Math.round(item.totalDiscount),
    'Net Revenue': Math.round(item.totalRevenue - item.totalTax - item.totalDiscount)
  }))

  const summary = {
    totalRevenue: orders.reduce((sum, item) => sum + item.totalRevenue, 0),
    totalOrders: orders.reduce((sum, item) => sum + item.totalOrders, 0),
    averageDaily: Math.round(orders.reduce((sum, item) => sum + item.totalRevenue, 0) / Math.max(orders.length, 1)),
    bestDay: orders.reduce((best, current) => current.totalRevenue > best.totalRevenue ? current : best, orders[0])
  }

  return { data, summary }
}

// Menu Performance Report Generator
async function generateMenuPerformanceReport(propertyId: string, dateRange: { start: Date; end: Date }) {
  const menuPerformance = await Order.aggregate([
    {
      $match: {
        propertyId: new Types.ObjectId(propertyId),
        status: { $in: ['completed', 'served', 'delivered'] },
        'timestamps.ordered': { $gte: dateRange.start, $lte: dateRange.end }
      }
    },
    { $unwind: "$items" },
    {
      $lookup: {
        from: 'menuitems',
        localField: 'items.itemId',
        foreignField: '_id',
        as: 'menuItem'
      }
    },
    { $unwind: "$menuItem" },
    {
      $group: {
        _id: "$items.itemId",
        itemName: { $first: "$menuItem.name" },
        category: { $first: "$menuItem.categoryId" },
        totalQuantity: { $sum: "$items.quantity" },
        totalRevenue: { $sum: "$items.subtotal" },
        averagePrice: { $avg: "$items.unitPrice" },
        orderCount: { $sum: 1 }
      }
    },
    { $sort: { totalQuantity: -1 } }
  ])

  const data = menuPerformance.map(item => ({
    'Item Name': item.itemName,
    'Category': item.category || 'Unknown',
    'Total Quantity Sold': item.totalQuantity,
    'Total Revenue': Math.round(item.totalRevenue),
    'Average Price': Math.round(item.averagePrice),
    'Number of Orders': item.orderCount,
    'Revenue per Order': Math.round(item.totalRevenue / item.orderCount)
  }))

  const summary = {
    totalItems: data.length,
    bestSelling: data[0]?.['Item Name'] || 'N/A',
    totalQuantitySold: data.reduce((sum, item) => sum + item['Total Quantity Sold'], 0),
    totalMenuRevenue: data.reduce((sum, item) => sum + item['Total Revenue'], 0)
  }

  return { data, summary }
}

// Inventory Status Report Generator
async function generateInventoryStatusReport(propertyId: string) {
  const inventory = await FBInventory.find({
    propertyId: new Types.ObjectId(propertyId),
    isActive: true
  }).lean()

  const data = inventory.map(item => ({
    'Item Code': item.itemCode,
    'Item Name': item.itemName,
    'Category': item.category,
    'Current Stock': item.stockLevels?.currentStock || 0,
    'Minimum Stock': item.stockLevels?.minimumStock || 0,
    'Maximum Stock': item.stockLevels?.maximumStock || 0,
    'Stock Status': getStockStatus(item),
    'Unit Cost': item.costingInfo?.unitCost || 0,
    'Total Value': item.costingInfo?.totalValue || 0,
    'Reorder Needed': (item.stockLevels?.currentStock || 0) <= (item.stockLevels?.reorderPoint || 0) ? 'Yes' : 'No',
    'Last Updated': item.stockLevels?.lastStockUpdate ? new Date(item.stockLevels.lastStockUpdate).toISOString() : ''
  }))

  const summary = {
    totalItems: inventory.length,
    totalValue: inventory.reduce((sum, item) => sum + (item.costingInfo?.totalValue || 0), 0),
    lowStockItems: inventory.filter(item => (item.stockLevels?.currentStock || 0) <= (item.stockLevels?.minimumStock || 0)).length,
    outOfStockItems: inventory.filter(item => (item.stockLevels?.currentStock || 0) === 0).length,
    reorderItems: inventory.filter(item => (item.stockLevels?.currentStock || 0) <= (item.stockLevels?.reorderPoint || 0)).length
  }

  return { data, summary }
}

// Customer Analytics Report Generator
async function generateCustomerAnalyticsReport(propertyId: string, dateRange: { start: Date; end: Date }) {
  const customerAnalytics = await Order.aggregate([
    {
      $match: {
        propertyId: new Types.ObjectId(propertyId),
        'timestamps.ordered': { $gte: dateRange.start, $lte: dateRange.end }
      }
    },
    {
      $group: {
        _id: {
          phone: "$guestInfo.phone",
          name: "$guestInfo.name"
        },
        totalOrders: { $sum: 1 },
        totalSpent: { $sum: "$pricing.total" },
        averageOrderValue: { $avg: "$pricing.total" },
        lastOrderDate: { $max: "$timestamps.ordered" },
        orderTypes: { $addToSet: "$orderType" }
      }
    },
    { $sort: { totalSpent: -1 } }
  ])

  const data = customerAnalytics.map(customer => ({
    'Customer Name': customer._id.name || 'Unknown',
    'Phone Number': customer._id.phone || '',
    'Total Orders': customer.totalOrders,
    'Total Spent': Math.round(customer.totalSpent),
    'Average Order Value': Math.round(customer.averageOrderValue),
    'Last Order Date': new Date(customer.lastOrderDate).toISOString(),
    'Preferred Order Types': customer.orderTypes.join(', '),
    'Customer Tier': getCustomerTier(customer.totalSpent)
  }))

  const summary = {
    totalCustomers: data.length,
    totalRevenue: data.reduce((sum, customer) => sum + customer['Total Spent'], 0),
    averageCustomerValue: Math.round(data.reduce((sum, customer) => sum + customer['Total Spent'], 0) / data.length),
    topCustomer: data[0]?.['Customer Name'] || 'N/A',
    repeatCustomers: data.filter(customer => customer['Total Orders'] > 1).length
  }

  return { data, summary }
}

// Operational Report Generator
async function generateOperationalReport(propertyId: string, dateRange: { start: Date; end: Date }) {
  const operationalData = await Order.aggregate([
    {
      $match: {
        propertyId: new Types.ObjectId(propertyId),
        'timestamps.ordered': { $gte: dateRange.start, $lte: dateRange.end }
      }
    },
    {
      $group: {
        _id: {
          date: { $dateToString: { format: "%Y-%m-%d", date: "$timestamps.ordered" } },
          hour: { $hour: "$timestamps.ordered" }
        },
        totalOrders: { $sum: 1 },
        averagePreparationTime: {
          $avg: {
            $cond: [
              { $and: ["$timestamps.ordered", "$timestamps.ready"] },
              { $divide: [{ $subtract: ["$timestamps.ready", "$timestamps.ordered"] }, 60000] },
              null
            ]
          }
        },
        onTimeOrders: {
          $sum: {
            $cond: [
              { $lte: ["$timestamps.ready", "$estimatedCompletionTime"] },
              1,
              0
            ]
          }
        }
      }
    },
    { $sort: { "_id.date": 1, "_id.hour": 1 } }
  ])

  const data = operationalData.map(item => ({
    'Date': item._id.date,
    'Hour': `${item._id.hour}:00`,
    'Total Orders': item.totalOrders,
    'Average Prep Time (min)': Math.round(item.averagePreparationTime || 0),
    'On-Time Orders': item.onTimeOrders,
    'On-Time Rate (%)': Math.round((item.onTimeOrders / item.totalOrders) * 100),
    'Peak Hour': item.totalOrders > 10 ? 'Yes' : 'No'
  }))

  const summary = {
    totalOrders: data.reduce((sum, item) => sum + item['Total Orders'], 0),
    averagePreparationTime: Math.round(data.reduce((sum, item) => sum + (item['Average Prep Time (min)'] * item['Total Orders']), 0) / data.reduce((sum, item) => sum + item['Total Orders'], 1)),
    overallOnTimeRate: Math.round((data.reduce((sum, item) => sum + item['On-Time Orders'], 0) / data.reduce((sum, item) => sum + item['Total Orders'], 1)) * 100),
    peakHours: data.filter(item => item['Peak Hour'] === 'Yes').map(item => `${item.Date} ${item.Hour}`)
  }

  return { data, summary }
}

// Helper functions
function calculateDateRange(startDate?: string | null, endDate?: string | null, period: string = 'month') {
  const now = new Date()
  let start = new Date()
  let end = new Date()

  if (startDate && endDate) {
    start = new Date(startDate)
    end = new Date(endDate)
  } else {
    switch (period) {
      case 'today':
        start.setHours(0, 0, 0, 0)
        end.setHours(23, 59, 59, 999)
        break
      case 'week':
        start.setDate(now.getDate() - 7)
        break
      case 'month':
        start.setMonth(now.getMonth() - 1)
        break
      case 'quarter':
        start.setMonth(now.getMonth() - 3)
        break
      case 'year':
        start.setFullYear(now.getFullYear() - 1)
        break
    }
  }

  return { start, end }
}

function getStockStatus(item: any): string {
  const current = item.stockLevels?.currentStock || 0
  const minimum = item.stockLevels?.minimumStock || 0
  const maximum = item.stockLevels?.maximumStock || 0

  if (current === 0) return 'Out of Stock'
  if (current <= minimum) return 'Low Stock'
  if (maximum && current > maximum) return 'Overstock'
  return 'Normal'
}

function getCustomerTier(totalSpent: number): string {
  if (totalSpent >= 50000) return 'VIP'
  if (totalSpent >= 25000) return 'Gold'
  if (totalSpent >= 10000) return 'Silver'
  return 'Bronze'
}