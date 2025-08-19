import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import Property from '@/models/Property'
import Booking from '@/models/Booking'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectToDatabase()

    const propertyId = params.id
    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || 'thisMonth'

    // Verify property exists
    const property = await Property.findById(propertyId)
    if (!property) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 })
    }

    // Calculate date ranges based on period
    const currentDate = new Date()
    let startDate: Date
    let endDate: Date
    let lastPeriodStart: Date
    let lastPeriodEnd: Date

    switch (period) {
      case 'thisMonth':
        startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
        endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)
        lastPeriodStart = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1)
        lastPeriodEnd = new Date(currentDate.getFullYear(), currentDate.getMonth(), 0)
        break
      case 'lastMonth':
        startDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1)
        endDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 0)
        lastPeriodStart = new Date(currentDate.getFullYear(), currentDate.getMonth() - 2, 1)
        lastPeriodEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 0)
        break
      case 'last3Months':
        startDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 3, 1)
        endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)
        lastPeriodStart = new Date(currentDate.getFullYear(), currentDate.getMonth() - 6, 1)
        lastPeriodEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() - 3, 0)
        break
      case 'thisYear':
        startDate = new Date(currentDate.getFullYear(), 0, 1)
        endDate = new Date(currentDate.getFullYear(), 11, 31)
        lastPeriodStart = new Date(currentDate.getFullYear() - 1, 0, 1)
        lastPeriodEnd = new Date(currentDate.getFullYear() - 1, 11, 31)
        break
      default:
        startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
        endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)
        lastPeriodStart = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1)
        lastPeriodEnd = new Date(currentDate.getFullYear(), currentDate.getMonth(), 0)
    }

    // Define a lean booking type to satisfy TypeScript when using .lean()
    type LeanBooking = {
      _id: { toString(): string } | string
      userId?: { name?: string; email?: string } | null
      totalAmount?: number
      status?: string
      paymentStatus?: string
      createdAt: Date
    }

    // Get bookings for current period
    const currentBookings = (await Booking.find({
      propertyId: propertyId,
      createdAt: { $gte: startDate, $lte: endDate }
    })
      .populate('userId', 'name email')
      .lean()) as unknown as LeanBooking[]

    // Get bookings for last period for comparison
    const lastPeriodBookings = await Booking.find({
      propertyId: propertyId,
      createdAt: { $gte: lastPeriodStart, $lte: lastPeriodEnd }
    }).lean()

    // Calculate revenue
    const currentRevenue = currentBookings.reduce((sum, booking) => sum + (booking.totalAmount || 0), 0)
    const lastPeriodRevenue = lastPeriodBookings.reduce((sum, booking) => sum + (booking.totalAmount || 0), 0)
    const revenueGrowth = lastPeriodRevenue > 0 ? ((currentRevenue - lastPeriodRevenue) / lastPeriodRevenue) * 100 : 0

    // Revenue by source (mock data - can be enhanced with actual tracking)
    const revenueBySource = [
      { source: 'Direct Bookings', amount: currentRevenue * 0.6, percentage: 60 },
      { source: 'Online Platforms', amount: currentRevenue * 0.3, percentage: 30 },
      { source: 'Travel Agents', amount: currentRevenue * 0.1, percentage: 10 }
    ]

    // Mock expenses data (can be enhanced with actual expense tracking)
    const totalExpenses = currentRevenue * 0.3 // Assume 30% expenses
    const expenseCategories = [
      { category: 'Maintenance', amount: totalExpenses * 0.4, percentage: 40 },
      { category: 'Utilities', amount: totalExpenses * 0.25, percentage: 25 },
      { category: 'Staff', amount: totalExpenses * 0.2, percentage: 20 },
      { category: 'Marketing', amount: totalExpenses * 0.1, percentage: 10 },
      { category: 'Other', amount: totalExpenses * 0.05, percentage: 5 }
    ]

    // Calculate profit
    const grossProfit = currentRevenue - totalExpenses
    const netProfit = grossProfit * 0.85 // After taxes and other deductions
    const profitMargin = currentRevenue > 0 ? (netProfit / currentRevenue) * 100 : 0

    // Booking statistics
    const completedBookings = currentBookings.filter(b => b.status === 'confirmed').length
    const pendingPayments = currentBookings.filter(b => b.paymentStatus === 'pending').length
    const averageBookingValue = completedBookings > 0 ? currentRevenue / completedBookings : 0

    // Generate payment history from bookings
    const payments = currentBookings.map(booking => ({
      id: booking._id.toString(),
      bookingId: booking._id.toString(),
      guestName: booking.userId?.name || 'Guest',
      amount: booking.totalAmount || 0,
      method: 'Card', // Mock data
      status: booking.paymentStatus || 'completed',
      date: booking.createdAt,
      type: 'booking'
    }))

    // Tax information (mock data)
    const taxRate = 18 // GST rate
    const taxCollected = currentRevenue * (taxRate / 100)
    const pendingTax = pendingPayments * (taxRate / 100)

    const financialData = {
      revenue: {
        total: currentRevenue,
        thisMonth: currentRevenue,
        lastMonth: lastPeriodRevenue,
        growth: revenueGrowth,
        daily: [], // Can be enhanced with daily breakdown
        bySource: revenueBySource
      },
      expenses: {
        total: totalExpenses,
        thisMonth: totalExpenses,
        categories: expenseCategories
      },
      profit: {
        gross: grossProfit,
        net: netProfit,
        margin: profitMargin
      },
      bookings: {
        totalValue: currentRevenue,
        averageValue: averageBookingValue,
        completedBookings,
        pendingPayments
      },
      payments: payments.slice(0, 20), // Limit to recent 20 payments
      taxes: {
        totalCollected: taxCollected,
        pending: pendingTax,
        rate: taxRate
      }
    }

    return NextResponse.json({
      success: true,
      financials: financialData,
      period
    })
  } catch (error) {
    console.error('Error fetching financial data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch financial data' },
      { status: 500 }
    )
  }
}




