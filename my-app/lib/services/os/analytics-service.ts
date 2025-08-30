import { connectToDatabase } from '@/lib/db/enhanced-mongodb'
import Booking from '@/models/Booking'
import Payment from '@/models/Payment'
import Property from '@/models/Property'
import Room from '@/models/Room'
import User from '@/models/User'
import { ObjectId } from 'mongodb'

export interface RevenueAnalytics {
  totalRevenue: number
  periodRevenue: number
  revenueGrowth: number
  averageDailyRate: number
  revenuePerAvailableRoom: number
  bookingValue: number
  paidBookingsRevenue: number
  pendingBookingsRevenue: number
  refundedAmount: number
  netRevenue: number
}

export interface OccupancyAnalytics {
  occupancyRate: number
  availableRooms: number
  occupiedRooms: number
  totalRooms: number
  occupancyTrend: Array<{
    date: string
    occupancyRate: number
    totalRooms: number
    occupiedRooms: number
  }>
  averageLengthOfStay: number
  noShowRate: number
  cancellationRate: number
}

export interface BookingAnalytics {
  totalBookings: number
  confirmedBookings: number
  cancelledBookings: number
  noShowBookings: number
  averageBookingValue: number
  bookingTrends: Array<{
    date: string
    bookings: number
    revenue: number
    averageValue: number
  }>
  leadTimeAnalysis: {
    averageLeadTime: number
    distribution: {
      sameDay: number
      within7Days: number
      within30Days: number
      moreThan30Days: number
    }
  }
  sourceAnalysis: {
    [source: string]: {
      bookings: number
      revenue: number
      percentage: number
    }
  }
}

export interface GuestAnalytics {
  totalGuests: number
  newGuests: number
  returningGuests: number
  guestRetentionRate: number
  averageGuestRating: number
  guestSatisfactionScore: number
  topGuestLocations: Array<{
    location: string
    count: number
    percentage: number
  }>
  guestDemographics: {
    ageGroups: {
      [ageGroup: string]: number
    }
    countries: {
      [country: string]: number
    }
  }
}

export interface CompetitorAnalysis {
  marketPosition: string
  priceComparison: {
    propertyRate: number
    marketAverage: number
    competitorRates: Array<{
      name: string
      rate: number
      occupancy: number
    }>
  }
  reviewComparison: {
    propertyRating: number
    marketAverage: number
    competitorRatings: Array<{
      name: string
      rating: number
      reviewCount: number
    }>
  }
}

export interface FinancialMetrics {
  grossRevenue: number
  netRevenue: number
  operatingExpenses: number
  profitMargin: number
  costPerOccupiedRoom: number
  revenuePerAvailableRoom: number
  averageDailyRate: number
  totalRevenuePAR: number
  expenseBreakdown: {
    [category: string]: number
  }
  profitLossStatement: {
    revenue: number
    expenses: number
    netIncome: number
    margin: number
  }
}

export class AnalyticsService {
  static async getRevenueAnalytics(
    propertyId: string, 
    period: 'daily' | 'weekly' | 'monthly' | 'yearly' = 'monthly',
    startDate?: Date,
    endDate?: Date
  ): Promise<RevenueAnalytics> {
    try {
      await connectToDatabase()
      
      const now = new Date()
      const periodStart = startDate || this.getPeriodStart(now, period)
      const periodEnd = endDate || now
      
      // Get previous period for comparison
      const previousPeriodStart = new Date(periodStart)
      const periodLength = periodEnd.getTime() - periodStart.getTime()
      previousPeriodStart.setTime(previousPeriodStart.getTime() - periodLength)
      
      const [currentPeriodBookings, previousPeriodBookings, rooms] = await Promise.all([
        Booking.find({
          propertyId: new ObjectId(propertyId),
          createdAt: { $gte: periodStart, $lte: periodEnd },
          status: { $ne: 'cancelled' }
        }).lean(),
        
        Booking.find({
          propertyId: new ObjectId(propertyId),
          createdAt: { $gte: previousPeriodStart, $lt: periodStart },
          status: { $ne: 'cancelled' }
        }).lean(),
        
        Room.find({ propertyId: new ObjectId(propertyId) }).lean()
      ])
      
      const currentRevenue = currentPeriodBookings.reduce((sum, booking) => 
        sum + (booking.totalAmount || 0), 0)
      const previousRevenue = previousPeriodBookings.reduce((sum, booking) => 
        sum + (booking.totalAmount || 0), 0)
      
      const revenueGrowth = previousRevenue > 0 ? 
        ((currentRevenue - previousRevenue) / previousRevenue) * 100 : 0
      
      const totalRooms = rooms.length
      const daysDiff = Math.ceil((periodEnd.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24))
      const availableRoomNights = totalRooms * daysDiff
      
      const paidBookings = currentPeriodBookings.filter(b => b.paymentStatus === 'completed')
      const pendingBookings = currentPeriodBookings.filter(b => b.paymentStatus === 'pending')
      const refundedBookings = currentPeriodBookings.filter(b => b.paymentStatus === 'refunded')
      
      const averageDailyRate = currentPeriodBookings.length > 0 ? 
        currentRevenue / currentPeriodBookings.length : 0
      
      const revenuePerAvailableRoom = availableRoomNights > 0 ? 
        currentRevenue / availableRoomNights : 0
      
      return {
        totalRevenue: Math.round(currentRevenue),
        periodRevenue: Math.round(currentRevenue),
        revenueGrowth: Math.round(revenueGrowth * 100) / 100,
        averageDailyRate: Math.round(averageDailyRate),
        revenuePerAvailableRoom: Math.round(revenuePerAvailableRoom),
        bookingValue: Math.round(averageDailyRate),
        paidBookingsRevenue: Math.round(paidBookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0)),
        pendingBookingsRevenue: Math.round(pendingBookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0)),
        refundedAmount: Math.round(refundedBookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0)),
        netRevenue: Math.round(currentRevenue - refundedBookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0))
      }
    } catch (error) {
      console.error('Error getting revenue analytics:', error)
      return this.getDefaultRevenueAnalytics()
    }
  }

  static async getOccupancyAnalytics(
    propertyId: string,
    period: 'daily' | 'weekly' | 'monthly' = 'monthly',
    startDate?: Date,
    endDate?: Date
  ): Promise<OccupancyAnalytics> {
    try {
      await connectToDatabase()
      
      const now = new Date()
      const periodStart = startDate || this.getPeriodStart(now, period)
      const periodEnd = endDate || now
      
      const [bookings, rooms] = await Promise.all([
        Booking.find({
          propertyId: new ObjectId(propertyId),
          $or: [
            { dateFrom: { $gte: periodStart, $lte: periodEnd } },
            { dateTo: { $gte: periodStart, $lte: periodEnd } },
            { dateFrom: { $lte: periodStart }, dateTo: { $gte: periodEnd } }
          ],
          status: { $in: ['confirmed', 'checked_in', 'checked_out'] }
        }).lean(),
        
        Room.find({ propertyId: new ObjectId(propertyId) }).lean()
      ])
      
      const totalRooms = rooms.length
      const daysDiff = Math.ceil((periodEnd.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24))
      
      // Calculate occupancy trend
      const occupancyTrend = []
      const currentDate = new Date(periodStart)
      
      while (currentDate <= periodEnd) {
        const dayBookings = bookings.filter(booking => {
          const checkIn = new Date(booking.dateFrom)
          const checkOut = new Date(booking.dateTo)
          return currentDate >= checkIn && currentDate < checkOut
        })
        
        const occupiedRooms = dayBookings.length
        const occupancyRate = totalRooms > 0 ? (occupiedRooms / totalRooms) * 100 : 0
        
        occupancyTrend.push({
          date: currentDate.toISOString().split('T')[0],
          occupancyRate: Math.round(occupancyRate * 100) / 100,
          totalRooms,
          occupiedRooms
        })
        
        currentDate.setDate(currentDate.getDate() + 1)
      }
      
      // Calculate average occupancy
      const averageOccupancy = occupancyTrend.length > 0 ? 
        occupancyTrend.reduce((sum, day) => sum + day.occupancyRate, 0) / occupancyTrend.length : 0
      
      // Calculate average length of stay
      const avgLengthOfStay = bookings.length > 0 ? 
        bookings.reduce((sum, booking) => {
          const checkIn = new Date(booking.dateFrom)
          const checkOut = new Date(booking.dateTo)
          const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24))
          return sum + nights
        }, 0) / bookings.length : 0
      
      // Calculate rates
      const totalBookingsInPeriod = await Booking.countDocuments({
        propertyId: new ObjectId(propertyId),
        createdAt: { $gte: periodStart, $lte: periodEnd }
      })
      
      const noShowBookings = await Booking.countDocuments({
        propertyId: new ObjectId(propertyId),
        createdAt: { $gte: periodStart, $lte: periodEnd },
        status: 'no_show'
      })
      
      const cancelledBookings = await Booking.countDocuments({
        propertyId: new ObjectId(propertyId),
        createdAt: { $gte: periodStart, $lte: periodEnd },
        status: 'cancelled'
      })
      
      const noShowRate = totalBookingsInPeriod > 0 ? (noShowBookings / totalBookingsInPeriod) * 100 : 0
      const cancellationRate = totalBookingsInPeriod > 0 ? (cancelledBookings / totalBookingsInPeriod) * 100 : 0
      
      return {
        occupancyRate: Math.round(averageOccupancy * 100) / 100,
        availableRooms: totalRooms - Math.round(totalRooms * averageOccupancy / 100),
        occupiedRooms: Math.round(totalRooms * averageOccupancy / 100),
        totalRooms,
        occupancyTrend,
        averageLengthOfStay: Math.round(avgLengthOfStay * 10) / 10,
        noShowRate: Math.round(noShowRate * 100) / 100,
        cancellationRate: Math.round(cancellationRate * 100) / 100
      }
    } catch (error) {
      console.error('Error getting occupancy analytics:', error)
      return this.getDefaultOccupancyAnalytics()
    }
  }

  static async getBookingAnalytics(
    propertyId: string,
    period: 'daily' | 'weekly' | 'monthly' = 'monthly',
    startDate?: Date,
    endDate?: Date
  ): Promise<BookingAnalytics> {
    try {
      await connectToDatabase()
      
      const now = new Date()
      const periodStart = startDate || this.getPeriodStart(now, period)
      const periodEnd = endDate || now
      
      const bookings = await Booking.find({
        propertyId: new ObjectId(propertyId),
        createdAt: { $gte: periodStart, $lte: periodEnd }
      }).lean()
      
      const totalBookings = bookings.length
      const confirmedBookings = bookings.filter(b => b.status === 'confirmed').length
      const cancelledBookings = bookings.filter(b => b.status === 'cancelled').length
      const noShowBookings = bookings.filter(b => b.status === 'no_show').length
      
      const totalRevenue = bookings.reduce((sum, booking) => sum + (booking.totalAmount || 0), 0)
      const averageBookingValue = totalBookings > 0 ? totalRevenue / totalBookings : 0
      
      // Generate booking trends
      const bookingTrends = []
      const currentDate = new Date(periodStart)
      const daysDiff = Math.ceil((periodEnd.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24))
      const groupSize = period === 'daily' ? 1 : period === 'weekly' ? 7 : Math.ceil(daysDiff / 12)
      
      while (currentDate <= periodEnd) {
        const nextDate = new Date(currentDate)
        nextDate.setDate(nextDate.getDate() + groupSize)
        
        const periodBookings = bookings.filter(booking => 
          new Date(booking.createdAt) >= currentDate && 
          new Date(booking.createdAt) < nextDate
        )
        
        const periodRevenue = periodBookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0)
        const periodAverage = periodBookings.length > 0 ? periodRevenue / periodBookings.length : 0
        
        bookingTrends.push({
          date: currentDate.toISOString().split('T')[0],
          bookings: periodBookings.length,
          revenue: Math.round(periodRevenue),
          averageValue: Math.round(periodAverage)
        })
        
        currentDate.setTime(nextDate.getTime())
      }
      
      // Lead time analysis
      const leadTimes = bookings.map(booking => {
        const bookingDate = new Date(booking.createdAt)
        const checkInDate = new Date(booking.dateFrom)
        return Math.ceil((checkInDate.getTime() - bookingDate.getTime()) / (1000 * 60 * 60 * 24))
      }).filter(leadTime => leadTime >= 0)
      
      const averageLeadTime = leadTimes.length > 0 ? 
        leadTimes.reduce((sum, lt) => sum + lt, 0) / leadTimes.length : 0
      
      const leadTimeDistribution = {
        sameDay: leadTimes.filter(lt => lt === 0).length,
        within7Days: leadTimes.filter(lt => lt > 0 && lt <= 7).length,
        within30Days: leadTimes.filter(lt => lt > 7 && lt <= 30).length,
        moreThan30Days: leadTimes.filter(lt => lt > 30).length
      }
      
      // Source analysis
      const sourceAnalysis: any = {}
      for (const booking of bookings) {
        const source = booking.source || 'direct'
        if (!sourceAnalysis[source]) {
          sourceAnalysis[source] = {
            bookings: 0,
            revenue: 0,
            percentage: 0
          }
        }
        sourceAnalysis[source].bookings++
        sourceAnalysis[source].revenue += booking.totalAmount || 0
      }
      
      // Calculate percentages
      Object.keys(sourceAnalysis).forEach(source => {
        sourceAnalysis[source].percentage = Math.round(
          (sourceAnalysis[source].bookings / totalBookings) * 100 * 100
        ) / 100
      })
      
      return {
        totalBookings,
        confirmedBookings,
        cancelledBookings,
        noShowBookings,
        averageBookingValue: Math.round(averageBookingValue),
        bookingTrends,
        leadTimeAnalysis: {
          averageLeadTime: Math.round(averageLeadTime * 10) / 10,
          distribution: leadTimeDistribution
        },
        sourceAnalysis
      }
    } catch (error) {
      console.error('Error getting booking analytics:', error)
      return this.getDefaultBookingAnalytics()
    }
  }

  static async getDashboardSummary(propertyId: string): Promise<{
    revenue: RevenueAnalytics
    occupancy: OccupancyAnalytics
    bookings: BookingAnalytics
    summary: {
      totalRevenue: number
      totalBookings: number
      occupancyRate: number
      averageRate: number
      trends: {
        revenue: number
        bookings: number
        occupancy: number
      }
    }
  }> {
    try {
      const [revenue, occupancy, bookings] = await Promise.all([
        this.getRevenueAnalytics(propertyId),
        this.getOccupancyAnalytics(propertyId),
        this.getBookingAnalytics(propertyId)
      ])
      
      return {
        revenue,
        occupancy,
        bookings,
        summary: {
          totalRevenue: revenue.totalRevenue,
          totalBookings: bookings.totalBookings,
          occupancyRate: occupancy.occupancyRate,
          averageRate: revenue.averageDailyRate,
          trends: {
            revenue: revenue.revenueGrowth,
            bookings: 0, // Calculate from booking trends
            occupancy: 0 // Calculate from occupancy trends
          }
        }
      }
    } catch (error) {
      console.error('Error getting dashboard summary:', error)
      throw error
    }
  }

  // Helper methods
  private static getPeriodStart(date: Date, period: 'daily' | 'weekly' | 'monthly' | 'yearly'): Date {
    const start = new Date(date)
    
    switch (period) {
      case 'daily':
        start.setHours(0, 0, 0, 0)
        break
      case 'weekly':
        start.setDate(start.getDate() - start.getDay())
        start.setHours(0, 0, 0, 0)
        break
      case 'monthly':
        start.setDate(1)
        start.setHours(0, 0, 0, 0)
        break
      case 'yearly':
        start.setMonth(0, 1)
        start.setHours(0, 0, 0, 0)
        break
    }
    
    return start
  }

  private static getDefaultRevenueAnalytics(): RevenueAnalytics {
    return {
      totalRevenue: 0,
      periodRevenue: 0,
      revenueGrowth: 0,
      averageDailyRate: 0,
      revenuePerAvailableRoom: 0,
      bookingValue: 0,
      paidBookingsRevenue: 0,
      pendingBookingsRevenue: 0,
      refundedAmount: 0,
      netRevenue: 0
    }
  }

  private static getDefaultOccupancyAnalytics(): OccupancyAnalytics {
    return {
      occupancyRate: 0,
      availableRooms: 0,
      occupiedRooms: 0,
      totalRooms: 0,
      occupancyTrend: [],
      averageLengthOfStay: 0,
      noShowRate: 0,
      cancellationRate: 0
    }
  }

  private static getDefaultBookingAnalytics(): BookingAnalytics {
    return {
      totalBookings: 0,
      confirmedBookings: 0,
      cancelledBookings: 0,
      noShowBookings: 0,
      averageBookingValue: 0,
      bookingTrends: [],
      leadTimeAnalysis: {
        averageLeadTime: 0,
        distribution: {
          sameDay: 0,
          within7Days: 0,
          within30Days: 0,
          moreThan30Days: 0
        }
      },
      sourceAnalysis: {}
    }
  }
}

export default AnalyticsService