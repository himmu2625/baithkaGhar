import { NextRequest, NextResponse } from "next/server"
import { dbHandler } from "@/lib/db"
import { connectMongo } from "@/lib/db/mongodb"
import { getToken } from "next-auth/jwt"
import Order from "@/models/Order"
import Reservation from "@/models/Reservation"
import { Types } from "mongoose"

export const dynamic = 'force-dynamic';

// GET handler - Get customer analytics reports
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
    let previousStartDate = new Date()
    let previousEndDate = new Date()
    
    switch (period) {
      case 'today':
        startDate = today
        endDate = new Date(today)
        endDate.setDate(today.getDate() + 1)
        // Previous day
        previousStartDate = new Date(today)
        previousStartDate.setDate(today.getDate() - 1)
        previousEndDate = today
        break
      case 'week':
        startDate = new Date(today)
        startDate.setDate(today.getDate() - 7)
        endDate = new Date()
        // Previous week
        previousStartDate = new Date(startDate)
        previousStartDate.setDate(startDate.getDate() - 7)
        previousEndDate = startDate
        break
      case 'month':
        startDate = new Date(today.getFullYear(), today.getMonth(), 1)
        endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0)
        endDate.setHours(23, 59, 59, 999)
        // Previous month
        previousStartDate = new Date(today.getFullYear(), today.getMonth() - 1, 1)
        previousEndDate = new Date(today.getFullYear(), today.getMonth(), 0)
        previousEndDate.setHours(23, 59, 59, 999)
        break
      case 'quarter':
        const quarterStartMonth = Math.floor(today.getMonth() / 3) * 3
        startDate = new Date(today.getFullYear(), quarterStartMonth, 1)
        endDate = new Date(today.getFullYear(), quarterStartMonth + 3, 0)
        endDate.setHours(23, 59, 59, 999)
        // Previous quarter
        previousStartDate = new Date(today.getFullYear(), quarterStartMonth - 3, 1)
        previousEndDate = new Date(today.getFullYear(), quarterStartMonth, 0)
        previousEndDate.setHours(23, 59, 59, 999)
        break
    }

    // Get customer analytics from orders
    const [
      currentPeriodStats,
      previousPeriodStats,
      customerSpendingPatterns,
      reservationStats
    ] = await Promise.all([
      // Current period customer stats
      Order.aggregate([
        {
          $match: {
            propertyId: new Types.ObjectId(propertyId),
            status: { $in: ['completed', 'served', 'delivered'] },
            'timestamps.ordered': { $gte: startDate, $lte: endDate }
          }
        },
        {
          $group: {
            _id: null,
            totalCustomers: { $addToSet: '$guestInfo.phone' },
            totalOrders: { $sum: 1 },
            totalRevenue: { $sum: '$pricing.total' },
            averageSpend: { $avg: '$pricing.total' }
          }
        },
        {
          $project: {
            totalCustomers: { $size: '$totalCustomers' },
            totalOrders: 1,
            totalRevenue: 1,
            averageSpend: 1
          }
        }
      ]),

      // Previous period for comparison
      Order.aggregate([
        {
          $match: {
            propertyId: new Types.ObjectId(propertyId),
            status: { $in: ['completed', 'served', 'delivered'] },
            'timestamps.ordered': { $gte: previousStartDate, $lte: previousEndDate }
          }
        },
        {
          $group: {
            _id: null,
            previousCustomers: { $addToSet: '$guestInfo.phone' },
            previousOrders: { $sum: 1 }
          }
        },
        {
          $project: {
            previousCustomers: { $size: '$previousCustomers' },
            previousOrders: 1
          }
        }
      ]),

      // Customer spending patterns
      Order.aggregate([
        {
          $match: {
            propertyId: new Types.ObjectId(propertyId),
            status: { $in: ['completed', 'served', 'delivered'] },
            'timestamps.ordered': { $gte: startDate, $lte: endDate },
            'guestInfo.phone': { $exists: true, $ne: null }
          }
        },
        {
          $group: {
            _id: '$guestInfo.phone',
            customerName: { $first: '$guestInfo.name' },
            orderCount: { $sum: 1 },
            totalSpend: { $sum: '$pricing.total' },
            averageOrderValue: { $avg: '$pricing.total' },
            firstOrder: { $min: '$timestamps.ordered' },
            lastOrder: { $max: '$timestamps.ordered' }
          }
        },
        {
          $project: {
            phone: '$_id',
            customerName: 1,
            orderCount: 1,
            totalSpend: 1,
            averageOrderValue: 1,
            isReturning: { $gt: ['$orderCount', 1] },
            daysSinceFirst: {
              $divide: [
                { $subtract: [new Date(), '$firstOrder'] },
                1000 * 60 * 60 * 24
              ]
            }
          }
        },
        { $sort: { totalSpend: -1 } }
      ]),

      // Reservation-based customer data
      Reservation.aggregate([
        {
          $match: {
            propertyId,
            'reservationDetails.reservationDate': { $gte: startDate, $lte: endDate },
            status: { $in: ['completed', 'seated'] },
            isActive: true
          }
        },
        {
          $group: {
            _id: null,
            totalReservationCustomers: { $addToSet: '$customer.contactInfo.phone' },
            averageSatisfaction: { $avg: '$feedback.customerRating.overall' }
          }
        },
        {
          $project: {
            totalReservationCustomers: { $size: '$totalReservationCustomers' },
            averageSatisfaction: 1
          }
        }
      ])
    ])

    const currentStats = currentPeriodStats[0] || {
      totalCustomers: 0,
      totalOrders: 0,
      totalRevenue: 0,
      averageSpend: 0
    }

    const previousStats = previousPeriodStats[0] || {
      previousCustomers: 0,
      previousOrders: 0
    }

    const reservationData = reservationStats[0] || {
      totalReservationCustomers: 0,
      averageSatisfaction: 0
    }

    // Determine new vs returning customers
    const returningCustomers = customerSpendingPatterns.filter(c => c.isReturning).length
    const newCustomers = currentStats.totalCustomers - returningCustomers

    // Calculate retention rate (simplified)
    const retentionRate = currentStats.totalCustomers > 0 
      ? Math.round((returningCustomers / currentStats.totalCustomers) * 100)
      : 0

    // Customer satisfaction (from reservations feedback)
    const satisfactionScore = reservationData.averageSatisfaction || 4.2

    const metrics = {
      totalCustomers: currentStats.totalCustomers,
      newCustomers,
      returningCustomers,
      averageSpend: Math.round(currentStats.averageSpend),
      satisfactionScore: Math.round(satisfactionScore * 10) / 10,
      retentionRate
    }

    // Top customers by spending
    const topCustomers = customerSpendingPatterns.slice(0, 10).map(customer => ({
      name: customer.customerName || 'Unknown Customer',
      phone: customer.phone,
      totalSpend: Math.round(customer.totalSpend),
      orderCount: customer.orderCount,
      averageOrderValue: Math.round(customer.averageOrderValue),
      isReturning: customer.isReturning,
      customerSince: customer.firstOrder
    }))

    // Customer segments
    const segments = {
      highValue: customerSpendingPatterns.filter(c => c.totalSpend >= 1000).length,
      regular: customerSpendingPatterns.filter(c => c.totalSpend >= 300 && c.totalSpend < 1000).length,
      occasional: customerSpendingPatterns.filter(c => c.totalSpend < 300).length,
      newCustomers,
      returningCustomers
    }

    return NextResponse.json({
      success: true,
      metrics,
      topCustomers,
      segments,
      analytics: {
        totalUniqueCustomers: customerSpendingPatterns.length,
        averageOrdersPerCustomer: customerSpendingPatterns.length > 0 
          ? Math.round(currentStats.totalOrders / customerSpendingPatterns.length * 10) / 10 
          : 0,
        customerGrowth: previousStats.previousCustomers > 0
          ? Math.round(((currentStats.totalCustomers - previousStats.previousCustomers) / previousStats.previousCustomers) * 100)
          : 0,
        reservationCustomers: reservationData.totalReservationCustomers
      },
      period,
      dateRange: {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      },
      generatedAt: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error fetching customer analytics:', error)
    return NextResponse.json(
      { success: false, message: "Failed to fetch customer analytics" },
      { status: 500 }
    )
  }
})