import { NextRequest, NextResponse } from "next/server"
import { dbHandler } from "@/lib/db"
import { connectMongo } from "@/lib/db/mongodb"
import { getToken } from "next-auth/jwt"
import Order from "@/models/Order"
import { Types } from "mongoose"

export const dynamic = 'force-dynamic';

// GET handler - Export orders
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
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const status = searchParams.get('status')
    const orderType = searchParams.get('orderType')
    const includeItems = searchParams.get('includeItems') === 'true'
    const fields = searchParams.get('fields')?.split(',') || []

    if (!propertyId || !Types.ObjectId.isValid(propertyId)) {
      return NextResponse.json(
        { success: false, message: "Valid property ID is required" },
        { status: 400 }
      )
    }

    // Build query
    const query: any = { 
      propertyId: new Types.ObjectId(propertyId)
    }

    // Date range filter
    if (startDate || endDate) {
      query['timestamps.ordered'] = {}
      if (startDate) query['timestamps.ordered'].$gte = new Date(startDate)
      if (endDate) query['timestamps.ordered'].$lte = new Date(endDate)
    }

    if (status) {
      query.status = status
    }

    if (orderType) {
      query.orderType = orderType
    }

    // Get orders with populated data
    const orders = await Order.find(query)
      .populate('items.itemId', 'name basePrice category')
      .populate('tableId', 'number section capacity')
      .populate('createdBy', 'name email')
      .sort({ 'timestamps.ordered': -1 })
      .lean()

    // Transform data for export
    const exportData = orders.map(order => {
      const baseData = {
        'Order ID': order._id.toString(),
        'Order Number': order.orderNumber,
        'Order Type': order.orderType,
        'Status': order.status,
        'Priority': order.priority || 'normal',
        
        // Customer Information
        'Customer Name': order.guestInfo?.name || '',
        'Customer Phone': order.guestInfo?.phone || '',
        'Customer Email': order.guestInfo?.email || '',
        'Room Number': order.guestInfo?.roomNumber || '',
        
        // Table Information
        'Table Number': order.tableId?.number || '',
        'Table Section': order.tableId?.section || '',
        'Table Capacity': order.tableId?.capacity || '',
        
        // Pricing Information
        'Subtotal': order.pricing?.subtotal || 0,
        'Tax': order.pricing?.tax || 0,
        'Tax Percentage': order.pricing?.taxPercentage || 0,
        'Discount': order.pricing?.discount || 0,
        'Discount Type': order.pricing?.discountType || '',
        'Delivery Fee': order.pricing?.deliveryFee || 0,
        'Service Charge': order.pricing?.serviceCharge || 0,
        'Total Amount': order.pricing?.total || 0,
        'Currency': order.pricing?.currency || 'INR',
        
        // Payment Information
        'Payment Status': order.paymentStatus,
        'Payment Method': order.paymentMethod || '',
        'Payment ID': order.paymentId || '',
        
        // Timing Information
        'Ordered At': order.timestamps?.ordered ? new Date(order.timestamps.ordered).toISOString() : '',
        'Confirmed At': order.timestamps?.confirmed ? new Date(order.timestamps.confirmed).toISOString() : '',
        'Preparing At': order.timestamps?.preparing ? new Date(order.timestamps.preparing).toISOString() : '',
        'Ready At': order.timestamps?.ready ? new Date(order.timestamps.ready).toISOString() : '',
        'Served At': order.timestamps?.served ? new Date(order.timestamps.served).toISOString() : '',
        'Delivered At': order.timestamps?.delivered ? new Date(order.timestamps.delivered).toISOString() : '',
        'Cancelled At': order.timestamps?.cancelled ? new Date(order.timestamps.cancelled).toISOString() : '',
        'Completed At': order.timestamps?.completed ? new Date(order.timestamps.completed).toISOString() : '',
        'Last Modified': order.timestamps?.lastModified ? new Date(order.timestamps.lastModified).toISOString() : '',
        
        // Estimated Times
        'Estimated Preparation Time': order.estimatedPreparationTime || 0,
        'Estimated Completion Time': order.estimatedCompletionTime ? new Date(order.estimatedCompletionTime).toISOString() : '',
        'Estimated Delivery Time': order.estimatedDeliveryTime ? new Date(order.estimatedDeliveryTime).toISOString() : '',
        
        // Actual Times (calculated)
        'Actual Preparation Time': calculatePreparationTime(order.timestamps),
        'Actual Completion Time': calculateCompletionTime(order.timestamps),
        'Total Order Time': calculateTotalOrderTime(order.timestamps),
        
        // Order Details
        'Total Items': order.items?.length || 0,
        'Total Quantity': order.items?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0,
        'Item Names': order.items?.map(item => `${item.itemId?.name || 'Unknown'} (${item.quantity})`).join('; ') || '',
        
        // Instructions and Notes
        'Special Instructions': order.specialInstructions || '',
        'Kitchen Notes': order.kitchenNotes || '',
        'Delivery Notes': order.deliveryNotes || '',
        'Customer Notes': order.notes || '',
        'Staff Notes': order.staffNotes || '',
        
        // Delivery Information (if applicable)
        'Delivery Address': order.deliveryAddress?.fullAddress || '',
        'Delivery City': order.deliveryAddress?.city || '',
        'Delivery Postal Code': order.deliveryAddress?.postalCode || '',
        'Delivery Contact': order.deliveryAddress?.contactNumber || '',
        'Delivery Instructions': order.deliveryAddress?.instructions || '',
        
        // Staff Information
        'Created By': order.createdBy?.name || order.createdBy?.email || '',
        'Assigned Chef': order.assignedChef?.name || '',
        'Assigned Server': order.assignedServer?.name || '',
        'Modified By': order.lastModifiedBy?.name || '',
        
        // Additional Metadata
        'Source': order.source || 'direct',
        'Channel': order.channel || 'restaurant',
        'Device Info': order.deviceInfo || '',
        'Location': order.location || '',
        'Weather': order.weather || '',
        'Occasion': order.occasion || '',
        'Group Size': order.groupSize || 1,
        'Loyalty Points Used': order.loyaltyPointsUsed || 0,
        'Loyalty Points Earned': order.loyaltyPointsEarned || 0,
        'Promo Code': order.promoCode || '',
        'Campaign ID': order.campaignId || '',
        'Reference Number': order.referenceNumber || '',
        'External Order ID': order.externalOrderId || '',
        
        // Quality and Feedback
        'Customer Rating': order.feedback?.rating || '',
        'Customer Review': order.feedback?.review || '',
        'Service Rating': order.feedback?.serviceRating || '',
        'Food Rating': order.feedback?.foodRating || '',
        'Delivery Rating': order.feedback?.deliveryRating || '',
        'Would Recommend': order.feedback?.wouldRecommend ? 'Yes' : 'No',
        
        // Analytics Fields
        'Peak Hour': isPeakHour(order.timestamps?.ordered),
        'Day of Week': order.timestamps?.ordered ? new Date(order.timestamps.ordered).toLocaleDateString('en-US', { weekday: 'long' }) : '',
        'Month': order.timestamps?.ordered ? new Date(order.timestamps.ordered).toLocaleDateString('en-US', { month: 'long' }) : '',
        'Season': getSeason(order.timestamps?.ordered),
        'Is Weekend': isWeekend(order.timestamps?.ordered) ? 'Yes' : 'No',
        'Order Value Category': getOrderValueCategory(order.pricing?.total || 0),
        'Customer Type': order.guestInfo?.isReturning ? 'Returning' : 'New'
      }

      // Add detailed item information if requested
      if (includeItems && order.items && order.items.length > 0) {
        order.items.forEach((item, index) => {
          const prefix = `Item ${index + 1}`
          baseData[`${prefix} Name`] = item.itemId?.name || 'Unknown'
          baseData[`${prefix} Category`] = item.categoryName || ''
          baseData[`${prefix} Quantity`] = item.quantity || 0
          baseData[`${prefix} Unit Price`] = item.unitPrice || 0
          baseData[`${prefix} Subtotal`] = item.subtotal || 0
          baseData[`${prefix} Special Instructions`] = item.specialRequests || ''
          baseData[`${prefix} Modifications`] = item.modifications?.join('; ') || ''
          baseData[`${prefix} Status`] = item.status || ''
          baseData[`${prefix} Preparation Time`] = item.preparationTime || 0
        })
      }

      // Filter by requested fields if specified
      if (fields.length > 0) {
        const filteredData: any = {}
        fields.forEach(field => {
          const key = field.trim()
          if (key in baseData) {
            filteredData[key] = baseData[key as keyof typeof baseData]
          }
        })
        return filteredData
      }

      return baseData
    })

    // Calculate summary statistics
    const summary = {
      totalOrders: exportData.length,
      ordersByStatus: getOrdersByStatus(orders),
      ordersByType: getOrdersByType(orders),
      totalRevenue: orders.reduce((sum, order) => sum + (order.pricing?.total || 0), 0),
      averageOrderValue: orders.length > 0 
        ? Math.round(orders.reduce((sum, order) => sum + (order.pricing?.total || 0), 0) / orders.length)
        : 0,
      dateRange: {
        from: startDate || 'All time',
        to: endDate || 'Present'
      },
      paymentMethods: getPaymentMethodBreakdown(orders),
      averagePreparationTime: calculateAveragePreparationTime(orders),
      peakHours: getPeakHours(orders),
      topCustomers: getTopCustomers(orders),
      exportedAt: new Date().toISOString(),
      exportedBy: token.email || token.name || 'Unknown'
    }

    return NextResponse.json({
      success: true,
      data: exportData,
      summary,
      metadata: {
        totalRecords: exportData.length,
        fields: Object.keys(exportData[0] || {}),
        filters: {
          propertyId,
          startDate,
          endDate,
          status,
          orderType,
          includeItems,
          customFields: fields.length > 0 ? fields : null
        }
      }
    })

  } catch (error) {
    console.error('Error exporting orders:', error)
    return NextResponse.json(
      { success: false, message: "Failed to export orders" },
      { status: 500 }
    )
  }
})

// Helper functions for calculations
function calculatePreparationTime(timestamps: any): number {
  if (!timestamps?.ordered || !timestamps?.ready) return 0
  return Math.round((new Date(timestamps.ready).getTime() - new Date(timestamps.ordered).getTime()) / 60000)
}

function calculateCompletionTime(timestamps: any): number {
  if (!timestamps?.ordered || !timestamps?.completed) return 0
  return Math.round((new Date(timestamps.completed).getTime() - new Date(timestamps.ordered).getTime()) / 60000)
}

function calculateTotalOrderTime(timestamps: any): number {
  if (!timestamps?.ordered) return 0
  const endTime = timestamps?.served || timestamps?.delivered || timestamps?.completed || timestamps?.ready
  if (!endTime) return 0
  return Math.round((new Date(endTime).getTime() - new Date(timestamps.ordered).getTime()) / 60000)
}

function isPeakHour(timestamp: any): string {
  if (!timestamp) return 'Unknown'
  const hour = new Date(timestamp).getHours()
  if ((hour >= 12 && hour <= 14) || (hour >= 19 && hour <= 21)) {
    return 'Peak'
  }
  return 'Off-Peak'
}

function getSeason(timestamp: any): string {
  if (!timestamp) return 'Unknown'
  const month = new Date(timestamp).getMonth()
  if (month >= 2 && month <= 4) return 'Spring'
  if (month >= 5 && month <= 7) return 'Summer'
  if (month >= 8 && month <= 10) return 'Autumn'
  return 'Winter'
}

function isWeekend(timestamp: any): boolean {
  if (!timestamp) return false
  const day = new Date(timestamp).getDay()
  return day === 0 || day === 6
}

function getOrderValueCategory(total: number): string {
  if (total < 500) return 'Low'
  if (total < 1500) return 'Medium'
  if (total < 3000) return 'High'
  return 'Premium'
}

function getOrdersByStatus(orders: any[]) {
  const breakdown: { [key: string]: number } = {}
  orders.forEach(order => {
    const status = order.status || 'unknown'
    breakdown[status] = (breakdown[status] || 0) + 1
  })
  return breakdown
}

function getOrdersByType(orders: any[]) {
  const breakdown: { [key: string]: number } = {}
  orders.forEach(order => {
    const type = order.orderType || 'unknown'
    breakdown[type] = (breakdown[type] || 0) + 1
  })
  return breakdown
}

function getPaymentMethodBreakdown(orders: any[]) {
  const breakdown: { [key: string]: number } = {}
  orders.forEach(order => {
    const method = order.paymentMethod || 'unknown'
    breakdown[method] = (breakdown[method] || 0) + 1
  })
  return breakdown
}

function calculateAveragePreparationTime(orders: any[]): number {
  const completedOrders = orders.filter(order => 
    order.timestamps?.ordered && order.timestamps?.ready
  )
  if (completedOrders.length === 0) return 0
  
  const totalTime = completedOrders.reduce((sum, order) => 
    sum + calculatePreparationTime(order.timestamps), 0
  )
  return Math.round(totalTime / completedOrders.length)
}

function getPeakHours(orders: any[]): { [hour: string]: number } {
  const hourBreakdown: { [key: string]: number } = {}
  orders.forEach(order => {
    if (order.timestamps?.ordered) {
      const hour = new Date(order.timestamps.ordered).getHours()
      const hourKey = `${hour}:00`
      hourBreakdown[hourKey] = (hourBreakdown[hourKey] || 0) + 1
    }
  })
  return hourBreakdown
}

function getTopCustomers(orders: any[]): { name: string; orders: number; total: number }[] {
  const customerStats: { [key: string]: { orders: number; total: number } } = {}
  
  orders.forEach(order => {
    const customerName = order.guestInfo?.name || 'Anonymous'
    if (!customerStats[customerName]) {
      customerStats[customerName] = { orders: 0, total: 0 }
    }
    customerStats[customerName].orders++
    customerStats[customerName].total += order.pricing?.total || 0
  })
  
  return Object.entries(customerStats)
    .map(([name, stats]) => ({ name, ...stats }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 10)
}