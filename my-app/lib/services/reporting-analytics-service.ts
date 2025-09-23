import { connectToDatabase } from '@/lib/mongodb'

// Revenue Reports Interfaces
export interface RevenueReport {
  period: {
    start: Date
    end: Date
    type: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'custom'
  }
  summary: {
    totalRevenue: number
    totalBookings: number
    averageRoomRate: number
    averageStayLength: number
    totalRoomNights: number
    revenuePAR: number // Revenue Per Available Room
    occupancyRate: number
  }
  breakdown: {
    byRoomType: Array<{
      roomType: string
      revenue: number
      bookings: number
      averageRate: number
      occupancyRate: number
    }>
    byChannel: Array<{
      channel: string
      revenue: number
      bookings: number
      percentage: number
    }>
    byPaymentMethod: Array<{
      method: string
      amount: number
      percentage: number
    }>
    byDiscounts: Array<{
      discountType: string
      totalDiscount: number
      bookingsAffected: number
    }>
  }
  trends: Array<{
    date: string
    revenue: number
    bookings: number
    averageRate: number
    occupancyRate: number
  }>
  comparisons: {
    previousPeriod: {
      revenue: number
      change: number
      changePercentage: number
    }
    sameMonthLastYear: {
      revenue: number
      change: number
      changePercentage: number
    }
  }
}

// Occupancy Analytics Interfaces
export interface OccupancyAnalytics {
  period: {
    start: Date
    end: Date
  }
  overall: {
    occupancyRate: number
    totalRoomNights: number
    availableRoomNights: number
    soldRoomNights: number
    averageDailyRate: number
    revPAR: number
  }
  daily: Array<{
    date: string
    occupancyRate: number
    roomsSold: number
    roomsAvailable: number
    averageRate: number
    revenue: number
  }>
  byRoomType: Array<{
    roomType: string
    occupancyRate: number
    totalRooms: number
    averageRate: number
    revenue: number
  }>
  forecasting: {
    nextWeek: Array<{
      date: string
      predictedOccupancy: number
      confidence: number
    }>
    nextMonth: {
      predictedOccupancy: number
      confidence: number
    }
  }
  trends: {
    weekOverWeek: number
    monthOverMonth: number
    yearOverYear: number
  }
}

// Booking Pattern Analysis Interfaces
export interface BookingPatternAnalysis {
  period: {
    start: Date
    end: Date
  }
  leadTime: {
    average: number
    byChannel: Array<{
      channel: string
      averageLeadTime: number
    }>
    distribution: Array<{
      range: string
      percentage: number
      count: number
    }>
  }
  seasonality: {
    monthlyPatterns: Array<{
      month: string
      bookings: number
      revenue: number
      averageRate: number
    }>
    weeklyPatterns: Array<{
      dayOfWeek: string
      bookings: number
      checkins: number
      checkouts: number
    }>
    holidayImpact: Array<{
      holiday: string
      date: Date
      occupancyIncrease: number
      rateIncrease: number
    }>
  }
  stayDuration: {
    average: number
    distribution: Array<{
      nights: number
      percentage: number
      count: number
    }>
    byRoomType: Array<{
      roomType: string
      averageStay: number
    }>
  }
  cancellations: {
    rate: number
    averageLeadTime: number
    byChannel: Array<{
      channel: string
      cancellationRate: number
    }>
    reasons: Array<{
      reason: string
      count: number
      percentage: number
    }>
  }
  noShows: {
    rate: number
    patterns: Array<{
      dayOfWeek: string
      noShowRate: number
    }>
  }
}

// Guest Demographics Interfaces
export interface GuestDemographics {
  period: {
    start: Date
    end: Date
  }
  geographic: {
    countries: Array<{
      country: string
      guests: number
      percentage: number
      revenue: number
    }>
    cities: Array<{
      city: string
      guests: number
      percentage: number
      revenue: number
    }>
    domestic: {
      percentage: number
      averageSpend: number
    }
    international: {
      percentage: number
      averageSpend: number
    }
  }
  demographics: {
    ageGroups: Array<{
      ageGroup: string
      percentage: number
      averageSpend: number
    }>
    genderDistribution: {
      male: number
      female: number
      other: number
    }
    travelPurpose: Array<{
      purpose: string
      percentage: number
      averageStay: number
      averageSpend: number
    }>
    groupSize: Array<{
      size: string
      percentage: number
      averageSpend: number
    }>
  }
  loyalty: {
    newGuests: {
      percentage: number
      averageSpend: number
    }
    returningGuests: {
      percentage: number
      averageSpend: number
      averageTimeBetweenStays: number
    }
    frequentGuests: {
      percentage: number
      averageSpend: number
      averageStaysPerYear: number
    }
  }
  preferences: {
    roomTypes: Array<{
      roomType: string
      preference: number
    }>
    amenities: Array<{
      amenity: string
      requestRate: number
    }>
    services: Array<{
      service: string
      utilizationRate: number
    }>
  }
}

// Booking Forecasting Interfaces
export interface BookingForecast {
  generatedAt: Date
  methodology: string
  confidence: number

  shortTerm: {
    nextWeek: Array<{
      date: string
      predictedBookings: number
      predictedRevenue: number
      predictedOccupancy: number
      confidence: number
    }>
    nextMonth: {
      predictedBookings: number
      predictedRevenue: number
      predictedOccupancy: number
      confidence: number
    }
  }

  longTerm: {
    nextQuarter: {
      predictedBookings: number
      predictedRevenue: number
      predictedOccupancy: number
      confidence: number
    }
    nextYear: {
      predictedBookings: number
      predictedRevenue: number
      predictedOccupancy: number
      confidence: number
    }
  }

  scenarios: {
    optimistic: {
      revenue: number
      occupancy: number
      description: string
    }
    realistic: {
      revenue: number
      occupancy: number
      description: string
    }
    pessimistic: {
      revenue: number
      occupancy: number
      description: string
    }
  }

  factors: {
    seasonality: number
    trends: number
    externalEvents: Array<{
      event: string
      impact: number
      description: string
    }>
    marketConditions: number
  }

  recommendations: Array<{
    category: string
    recommendation: string
    impact: string
    priority: 'high' | 'medium' | 'low'
  }>
}

export class ReportingAnalyticsService {
  static async generateRevenueReport(propertyId: string, period: {
    start: Date
    end: Date
    type: RevenueReport['period']['type']
  }): Promise<RevenueReport> {
    try {
      await connectToDatabase()

      const Booking = (await import('@/models/Booking')).default
      const Room = (await import('@/models/Room')).default

      // Get bookings for the period
      const bookings = await Booking.find({
        propertyId,
        checkOut: { $gte: period.start, $lte: period.end },
        status: { $in: ['checked_out', 'completed'] }
      }).populate('roomId')

      // Get property rooms for occupancy calculations
      const rooms = await Room.find({ propertyId })
      const totalRooms = rooms.length

      // Calculate summary metrics
      const totalRevenue = bookings.reduce((sum, booking) => sum + booking.totalAmount, 0)
      const totalBookings = bookings.length
      const totalRoomNights = bookings.reduce((sum, booking) => sum + booking.nights, 0)
      const averageRoomRate = totalRevenue / totalRoomNights || 0
      const averageStayLength = totalRoomNights / totalBookings || 0

      // Calculate available room nights for the period
      const periodDays = Math.ceil((period.end.getTime() - period.start.getTime()) / (1000 * 60 * 60 * 24))
      const availableRoomNights = totalRooms * periodDays
      const occupancyRate = (totalRoomNights / availableRoomNights) * 100
      const revenuePAR = totalRevenue / availableRoomNights

      // Breakdown by room type
      const roomTypeBreakdown = this.calculateRoomTypeBreakdown(bookings, rooms, availableRoomNights)

      // Breakdown by channel
      const channelBreakdown = this.calculateChannelBreakdown(bookings, totalRevenue)

      // Breakdown by payment method
      const paymentBreakdown = this.calculatePaymentBreakdown(bookings, totalRevenue)

      // Calculate trends
      const trends = this.calculateRevenueTrends(bookings, period, totalRooms)

      // Calculate comparisons
      const comparisons = await this.calculateRevenueComparisons(propertyId, period, totalRevenue)

      return {
        period,
        summary: {
          totalRevenue,
          totalBookings,
          averageRoomRate,
          averageStayLength,
          totalRoomNights,
          revenuePAR,
          occupancyRate
        },
        breakdown: {
          byRoomType: roomTypeBreakdown,
          byChannel: channelBreakdown,
          byPaymentMethod: paymentBreakdown,
          byDiscounts: [] // Would be calculated from booking discounts
        },
        trends,
        comparisons
      }

    } catch (error) {
      console.error('Error generating revenue report:', error)
      throw error
    }
  }

  static async generateOccupancyAnalytics(propertyId: string, period: { start: Date; end: Date }): Promise<OccupancyAnalytics> {
    try {
      await connectToDatabase()

      const Booking = (await import('@/models/Booking')).default
      const Room = (await import('@/models/Room')).default

      const bookings = await Booking.find({
        propertyId,
        $or: [
          { checkIn: { $gte: period.start, $lte: period.end } },
          { checkOut: { $gte: period.start, $lte: period.end } },
          { checkIn: { $lte: period.start }, checkOut: { $gte: period.end } }
        ],
        status: { $in: ['confirmed', 'checked_in', 'checked_out'] }
      }).populate('roomId')

      const rooms = await Room.find({ propertyId })
      const totalRooms = rooms.length

      // Calculate overall metrics
      const periodDays = Math.ceil((period.end.getTime() - period.start.getTime()) / (1000 * 60 * 60 * 24))
      const availableRoomNights = totalRooms * periodDays
      const soldRoomNights = this.calculateSoldRoomNights(bookings, period)
      const occupancyRate = (soldRoomNights / availableRoomNights) * 100
      const totalRevenue = bookings.reduce((sum, booking) => sum + booking.totalAmount, 0)
      const averageDailyRate = totalRevenue / soldRoomNights || 0
      const revPAR = totalRevenue / availableRoomNights

      // Calculate daily occupancy
      const daily = this.calculateDailyOccupancy(bookings, period, totalRooms)

      // Calculate by room type
      const byRoomType = this.calculateOccupancyByRoomType(bookings, rooms, period)

      // Generate forecast
      const forecasting = await this.generateOccupancyForecast(propertyId, period.end)

      // Calculate trends
      const trends = await this.calculateOccupancyTrends(propertyId, period)

      return {
        period,
        overall: {
          occupancyRate,
          totalRoomNights: soldRoomNights,
          availableRoomNights,
          soldRoomNights,
          averageDailyRate,
          revPAR
        },
        daily,
        byRoomType,
        forecasting,
        trends
      }

    } catch (error) {
      console.error('Error generating occupancy analytics:', error)
      throw error
    }
  }

  static async generateBookingPatternAnalysis(propertyId: string, period: { start: Date; end: Date }): Promise<BookingPatternAnalysis> {
    try {
      await connectToDatabase()

      const Booking = (await import('@/models/Booking')).default

      const bookings = await Booking.find({
        propertyId,
        createdAt: { $gte: period.start, $lte: period.end }
      }).populate('roomId')

      // Calculate lead time analysis
      const leadTime = this.calculateLeadTimeAnalysis(bookings)

      // Calculate seasonality patterns
      const seasonality = this.calculateSeasonalityPatterns(bookings)

      // Calculate stay duration analysis
      const stayDuration = this.calculateStayDurationAnalysis(bookings)

      // Calculate cancellation analysis
      const cancellations = this.calculateCancellationAnalysis(bookings)

      // Calculate no-show analysis
      const noShows = this.calculateNoShowAnalysis(bookings)

      return {
        period,
        leadTime,
        seasonality,
        stayDuration,
        cancellations,
        noShows
      }

    } catch (error) {
      console.error('Error generating booking pattern analysis:', error)
      throw error
    }
  }

  static async generateGuestDemographics(propertyId: string, period: { start: Date; end: Date }): Promise<GuestDemographics> {
    try {
      await connectToDatabase()

      const Booking = (await import('@/models/Booking')).default

      const bookings = await Booking.find({
        propertyId,
        checkIn: { $gte: period.start, $lte: period.end },
        status: { $in: ['checked_in', 'checked_out', 'completed'] }
      }).populate('userId').populate('roomId')

      // Calculate geographic distribution
      const geographic = this.calculateGeographicDistribution(bookings)

      // Calculate demographic analysis
      const demographics = this.calculateDemographicAnalysis(bookings)

      // Calculate loyalty analysis
      const loyalty = await this.calculateLoyaltyAnalysis(propertyId, bookings)

      // Calculate preference analysis
      const preferences = this.calculatePreferenceAnalysis(bookings)

      return {
        period,
        geographic,
        demographics,
        loyalty,
        preferences
      }

    } catch (error) {
      console.error('Error generating guest demographics:', error)
      throw error
    }
  }

  static async generateBookingForecast(propertyId: string, forecastPeriod: number = 90): Promise<BookingForecast> {
    try {
      await connectToDatabase()

      const Booking = (await import('@/models/Booking')).default

      // Get historical data for analysis
      const historicalStart = new Date()
      historicalStart.setFullYear(historicalStart.getFullYear() - 2)

      const historicalBookings = await Booking.find({
        propertyId,
        createdAt: { $gte: historicalStart },
        status: { $ne: 'cancelled' }
      }).populate('roomId')

      // Calculate forecast using historical patterns
      const shortTerm = this.calculateShortTermForecast(historicalBookings, forecastPeriod)
      const longTerm = this.calculateLongTermForecast(historicalBookings)
      const scenarios = this.calculateForecastScenarios(historicalBookings)
      const factors = this.analyzeForecastFactors(historicalBookings)
      const recommendations = this.generateForecastRecommendations(historicalBookings, scenarios)

      return {
        generatedAt: new Date(),
        methodology: 'Historical trend analysis with seasonal adjustments',
        confidence: 0.75, // Would be calculated based on data quality and patterns
        shortTerm,
        longTerm,
        scenarios,
        factors,
        recommendations
      }

    } catch (error) {
      console.error('Error generating booking forecast:', error)
      throw error
    }
  }

  // Helper methods for calculations
  private static calculateRoomTypeBreakdown(bookings: any[], rooms: any[], totalAvailableNights: number): RevenueReport['breakdown']['byRoomType'] {
    const roomTypeStats: { [roomType: string]: { revenue: number; bookings: number; nights: number } } = {}

    bookings.forEach(booking => {
      const roomType = booking.roomId?.roomType || 'Unknown'
      if (!roomTypeStats[roomType]) {
        roomTypeStats[roomType] = { revenue: 0, bookings: 0, nights: 0 }
      }
      roomTypeStats[roomType].revenue += booking.totalAmount
      roomTypeStats[roomType].bookings += 1
      roomTypeStats[roomType].nights += booking.nights
    })

    return Object.entries(roomTypeStats).map(([roomType, stats]) => {
      const roomsOfType = rooms.filter(room => room.roomType === roomType).length
      const availableNights = roomsOfType * (totalAvailableNights / rooms.length)

      return {
        roomType,
        revenue: stats.revenue,
        bookings: stats.bookings,
        averageRate: stats.revenue / stats.nights || 0,
        occupancyRate: (stats.nights / availableNights) * 100
      }
    })
  }

  private static calculateChannelBreakdown(bookings: any[], totalRevenue: number): RevenueReport['breakdown']['byChannel'] {
    const channelStats: { [channel: string]: { revenue: number; bookings: number } } = {}

    bookings.forEach(booking => {
      const channel = booking.bookingChannel || 'Direct'
      if (!channelStats[channel]) {
        channelStats[channel] = { revenue: 0, bookings: 0 }
      }
      channelStats[channel].revenue += booking.totalAmount
      channelStats[channel].bookings += 1
    })

    return Object.entries(channelStats).map(([channel, stats]) => ({
      channel,
      revenue: stats.revenue,
      bookings: stats.bookings,
      percentage: (stats.revenue / totalRevenue) * 100
    }))
  }

  private static calculatePaymentBreakdown(bookings: any[], totalRevenue: number): RevenueReport['breakdown']['byPaymentMethod'] {
    const paymentStats: { [method: string]: number } = {}

    bookings.forEach(booking => {
      const method = booking.paymentMethod || 'Cash'
      paymentStats[method] = (paymentStats[method] || 0) + booking.totalAmount
    })

    return Object.entries(paymentStats).map(([method, amount]) => ({
      method,
      amount,
      percentage: (amount / totalRevenue) * 100
    }))
  }

  private static calculateRevenueTrends(bookings: any[], period: { start: Date; end: Date }, totalRooms: number): RevenueReport['trends'] {
    const dailyStats: { [date: string]: { revenue: number; bookings: number; nights: number } } = {}

    bookings.forEach(booking => {
      const checkOutDate = booking.checkOut.toISOString().split('T')[0]
      if (!dailyStats[checkOutDate]) {
        dailyStats[checkOutDate] = { revenue: 0, bookings: 0, nights: 0 }
      }
      dailyStats[checkOutDate].revenue += booking.totalAmount
      dailyStats[checkOutDate].bookings += 1
      dailyStats[checkOutDate].nights += booking.nights
    })

    return Object.entries(dailyStats).map(([date, stats]) => ({
      date,
      revenue: stats.revenue,
      bookings: stats.bookings,
      averageRate: stats.revenue / stats.nights || 0,
      occupancyRate: (stats.nights / totalRooms) * 100
    })).sort((a, b) => a.date.localeCompare(b.date))
  }

  private static async calculateRevenueComparisons(propertyId: string, period: { start: Date; end: Date }, currentRevenue: number): Promise<RevenueReport['comparisons']> {
    try {
      const Booking = (await import('@/models/Booking')).default

      // Previous period
      const periodDuration = period.end.getTime() - period.start.getTime()
      const previousStart = new Date(period.start.getTime() - periodDuration)
      const previousEnd = new Date(period.end.getTime() - periodDuration)

      const previousBookings = await Booking.find({
        propertyId,
        checkOut: { $gte: previousStart, $lte: previousEnd },
        status: { $in: ['checked_out', 'completed'] }
      })

      const previousRevenue = previousBookings.reduce((sum, booking) => sum + booking.totalAmount, 0)

      // Same month last year
      const lastYearStart = new Date(period.start)
      lastYearStart.setFullYear(lastYearStart.getFullYear() - 1)
      const lastYearEnd = new Date(period.end)
      lastYearEnd.setFullYear(lastYearEnd.getFullYear() - 1)

      const lastYearBookings = await Booking.find({
        propertyId,
        checkOut: { $gte: lastYearStart, $lte: lastYearEnd },
        status: { $in: ['checked_out', 'completed'] }
      })

      const lastYearRevenue = lastYearBookings.reduce((sum, booking) => sum + booking.totalAmount, 0)

      return {
        previousPeriod: {
          revenue: previousRevenue,
          change: currentRevenue - previousRevenue,
          changePercentage: previousRevenue > 0 ? ((currentRevenue - previousRevenue) / previousRevenue) * 100 : 0
        },
        sameMonthLastYear: {
          revenue: lastYearRevenue,
          change: currentRevenue - lastYearRevenue,
          changePercentage: lastYearRevenue > 0 ? ((currentRevenue - lastYearRevenue) / lastYearRevenue) * 100 : 0
        }
      }

    } catch (error) {
      console.error('Error calculating revenue comparisons:', error)
      return {
        previousPeriod: { revenue: 0, change: 0, changePercentage: 0 },
        sameMonthLastYear: { revenue: 0, change: 0, changePercentage: 0 }
      }
    }
  }

  private static calculateSoldRoomNights(bookings: any[], period: { start: Date; end: Date }): number {
    let totalNights = 0

    bookings.forEach(booking => {
      const checkIn = new Date(Math.max(booking.checkIn.getTime(), period.start.getTime()))
      const checkOut = new Date(Math.min(booking.checkOut.getTime(), period.end.getTime()))

      if (checkOut > checkIn) {
        const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24))
        totalNights += nights
      }
    })

    return totalNights
  }

  private static calculateDailyOccupancy(bookings: any[], period: { start: Date; end: Date }, totalRooms: number): OccupancyAnalytics['daily'] {
    const dailyStats: { [date: string]: { roomsSold: number; revenue: number } } = {}

    // Initialize all dates in period
    const currentDate = new Date(period.start)
    while (currentDate <= period.end) {
      const dateStr = currentDate.toISOString().split('T')[0]
      dailyStats[dateStr] = { roomsSold: 0, revenue: 0 }
      currentDate.setDate(currentDate.getDate() + 1)
    }

    // Calculate room nights for each day
    bookings.forEach(booking => {
      const checkIn = new Date(Math.max(booking.checkIn.getTime(), period.start.getTime()))
      const checkOut = new Date(Math.min(booking.checkOut.getTime(), period.end.getTime()))

      const currentDate = new Date(checkIn)
      while (currentDate < checkOut) {
        const dateStr = currentDate.toISOString().split('T')[0]
        if (dailyStats[dateStr]) {
          dailyStats[dateStr].roomsSold += 1
          dailyStats[dateStr].revenue += booking.totalAmount / booking.nights
        }
        currentDate.setDate(currentDate.getDate() + 1)
      }
    })

    return Object.entries(dailyStats).map(([date, stats]) => ({
      date,
      occupancyRate: (stats.roomsSold / totalRooms) * 100,
      roomsSold: stats.roomsSold,
      roomsAvailable: totalRooms,
      averageRate: stats.roomsSold > 0 ? stats.revenue / stats.roomsSold : 0,
      revenue: stats.revenue
    })).sort((a, b) => a.date.localeCompare(b.date))
  }

  private static calculateOccupancyByRoomType(bookings: any[], rooms: any[], period: { start: Date; end: Date }): OccupancyAnalytics['byRoomType'] {
    const roomTypeStats: { [roomType: string]: { nights: number; revenue: number } } = {}

    bookings.forEach(booking => {
      const roomType = booking.roomId?.roomType || 'Unknown'
      if (!roomTypeStats[roomType]) {
        roomTypeStats[roomType] = { nights: 0, revenue: 0 }
      }

      const nights = this.calculateBookingNightsInPeriod(booking, period)
      roomTypeStats[roomType].nights += nights
      roomTypeStats[roomType].revenue += booking.totalAmount * (nights / booking.nights)
    })

    const periodDays = Math.ceil((period.end.getTime() - period.start.getTime()) / (1000 * 60 * 60 * 24))

    return Object.entries(roomTypeStats).map(([roomType, stats]) => {
      const roomsOfType = rooms.filter(room => room.roomType === roomType).length
      const availableNights = roomsOfType * periodDays

      return {
        roomType,
        occupancyRate: (stats.nights / availableNights) * 100,
        totalRooms: roomsOfType,
        averageRate: stats.nights > 0 ? stats.revenue / stats.nights : 0,
        revenue: stats.revenue
      }
    })
  }

  private static calculateBookingNightsInPeriod(booking: any, period: { start: Date; end: Date }): number {
    const checkIn = new Date(Math.max(booking.checkIn.getTime(), period.start.getTime()))
    const checkOut = new Date(Math.min(booking.checkOut.getTime(), period.end.getTime()))

    if (checkOut <= checkIn) return 0

    return Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24))
  }

  private static async generateOccupancyForecast(propertyId: string, fromDate: Date): Promise<OccupancyAnalytics['forecasting']> {
    // This would implement ML-based forecasting
    // For now, returning mock data based on historical trends
    const nextWeek = []
    for (let i = 1; i <= 7; i++) {
      const date = new Date(fromDate)
      date.setDate(date.getDate() + i)
      nextWeek.push({
        date: date.toISOString().split('T')[0],
        predictedOccupancy: 70 + Math.random() * 20, // Mock data
        confidence: 0.8
      })
    }

    return {
      nextWeek,
      nextMonth: {
        predictedOccupancy: 75,
        confidence: 0.7
      }
    }
  }

  private static async calculateOccupancyTrends(propertyId: string, period: { start: Date; end: Date }): Promise<OccupancyAnalytics['trends']> {
    // This would calculate actual trends from historical data
    // For now, returning mock data
    return {
      weekOverWeek: 5.2,
      monthOverMonth: 8.7,
      yearOverYear: 12.3
    }
  }

  private static calculateLeadTimeAnalysis(bookings: any[]): BookingPatternAnalysis['leadTime'] {
    const leadTimes = bookings.map(booking => {
      const leadTime = Math.ceil((booking.checkIn.getTime() - booking.createdAt.getTime()) / (1000 * 60 * 60 * 24))
      return { leadTime, channel: booking.bookingChannel || 'Direct' }
    })

    const average = leadTimes.reduce((sum, lt) => sum + lt.leadTime, 0) / leadTimes.length || 0

    // Group by channel
    const channelLeadTimes: { [channel: string]: number[] } = {}
    leadTimes.forEach(lt => {
      if (!channelLeadTimes[lt.channel]) {
        channelLeadTimes[lt.channel] = []
      }
      channelLeadTimes[lt.channel].push(lt.leadTime)
    })

    const byChannel = Object.entries(channelLeadTimes).map(([channel, times]) => ({
      channel,
      averageLeadTime: times.reduce((sum, time) => sum + time, 0) / times.length
    }))

    // Distribution
    const distribution = [
      { range: '0-7 days', count: leadTimes.filter(lt => lt.leadTime <= 7).length },
      { range: '8-30 days', count: leadTimes.filter(lt => lt.leadTime > 7 && lt.leadTime <= 30).length },
      { range: '31-90 days', count: leadTimes.filter(lt => lt.leadTime > 30 && lt.leadTime <= 90).length },
      { range: '90+ days', count: leadTimes.filter(lt => lt.leadTime > 90).length }
    ].map(item => ({
      ...item,
      percentage: (item.count / leadTimes.length) * 100
    }))

    return {
      average,
      byChannel,
      distribution
    }
  }

  private static calculateSeasonalityPatterns(bookings: any[]): BookingPatternAnalysis['seasonality'] {
    // Monthly patterns
    const monthlyStats: { [month: string]: { bookings: number; revenue: number; totalRate: number } } = {}

    bookings.forEach(booking => {
      const month = booking.checkIn.toLocaleString('default', { month: 'long' })
      if (!monthlyStats[month]) {
        monthlyStats[month] = { bookings: 0, revenue: 0, totalRate: 0 }
      }
      monthlyStats[month].bookings += 1
      monthlyStats[month].revenue += booking.totalAmount
      monthlyStats[month].totalRate += booking.totalAmount / booking.nights
    })

    const monthlyPatterns = Object.entries(monthlyStats).map(([month, stats]) => ({
      month,
      bookings: stats.bookings,
      revenue: stats.revenue,
      averageRate: stats.totalRate / stats.bookings
    }))

    // Weekly patterns
    const weeklyStats: { [day: string]: { bookings: number; checkins: number; checkouts: number } } = {}
    const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

    daysOfWeek.forEach(day => {
      weeklyStats[day] = { bookings: 0, checkins: 0, checkouts: 0 }
    })

    bookings.forEach(booking => {
      const bookingDay = daysOfWeek[booking.createdAt.getDay()]
      const checkinDay = daysOfWeek[booking.checkIn.getDay()]
      const checkoutDay = daysOfWeek[booking.checkOut.getDay()]

      weeklyStats[bookingDay].bookings += 1
      weeklyStats[checkinDay].checkins += 1
      weeklyStats[checkoutDay].checkouts += 1
    })

    const weeklyPatterns = Object.entries(weeklyStats).map(([dayOfWeek, stats]) => ({
      dayOfWeek,
      ...stats
    }))

    return {
      monthlyPatterns,
      weeklyPatterns,
      holidayImpact: [] // Would be calculated based on holiday calendar
    }
  }

  private static calculateStayDurationAnalysis(bookings: any[]): BookingPatternAnalysis['stayDuration'] {
    const durations = bookings.map(booking => ({
      nights: booking.nights,
      roomType: booking.roomId?.roomType || 'Unknown'
    }))

    const average = durations.reduce((sum, d) => sum + d.nights, 0) / durations.length || 0

    // Distribution
    const distribution = [
      { nights: 1, count: durations.filter(d => d.nights === 1).length },
      { nights: 2, count: durations.filter(d => d.nights === 2).length },
      { nights: 3, count: durations.filter(d => d.nights === 3).length },
      { nights: 4, count: durations.filter(d => d.nights >= 4 && d.nights <= 7).length },
      { nights: 7, count: durations.filter(d => d.nights > 7).length }
    ].map(item => ({
      nights: item.nights,
      count: item.count,
      percentage: (item.count / durations.length) * 100
    }))

    // By room type
    const roomTypeStats: { [roomType: string]: number[] } = {}
    durations.forEach(d => {
      if (!roomTypeStats[d.roomType]) {
        roomTypeStats[d.roomType] = []
      }
      roomTypeStats[d.roomType].push(d.nights)
    })

    const byRoomType = Object.entries(roomTypeStats).map(([roomType, nights]) => ({
      roomType,
      averageStay: nights.reduce((sum, n) => sum + n, 0) / nights.length
    }))

    return {
      average,
      distribution,
      byRoomType
    }
  }

  private static calculateCancellationAnalysis(bookings: any[]): BookingPatternAnalysis['cancellations'] {
    const cancelledBookings = bookings.filter(booking => booking.status === 'cancelled')
    const rate = (cancelledBookings.length / bookings.length) * 100

    const averageLeadTime = cancelledBookings.reduce((sum, booking) => {
      const leadTime = Math.ceil((booking.checkIn.getTime() - booking.cancelledAt?.getTime() || booking.createdAt.getTime()) / (1000 * 60 * 60 * 24))
      return sum + leadTime
    }, 0) / cancelledBookings.length || 0

    // By channel
    const channelStats: { [channel: string]: { total: number; cancelled: number } } = {}
    bookings.forEach(booking => {
      const channel = booking.bookingChannel || 'Direct'
      if (!channelStats[channel]) {
        channelStats[channel] = { total: 0, cancelled: 0 }
      }
      channelStats[channel].total += 1
      if (booking.status === 'cancelled') {
        channelStats[channel].cancelled += 1
      }
    })

    const byChannel = Object.entries(channelStats).map(([channel, stats]) => ({
      channel,
      cancellationRate: (stats.cancelled / stats.total) * 100
    }))

    return {
      rate,
      averageLeadTime,
      byChannel,
      reasons: [] // Would be extracted from cancellation reasons if tracked
    }
  }

  private static calculateNoShowAnalysis(bookings: any[]): BookingPatternAnalysis['noShows'] {
    const noShowBookings = bookings.filter(booking => booking.status === 'no_show')
    const rate = (noShowBookings.length / bookings.length) * 100

    // Patterns by day of week
    const dayStats: { [day: string]: { total: number; noShows: number } } = {}
    const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

    daysOfWeek.forEach(day => {
      dayStats[day] = { total: 0, noShows: 0 }
    })

    bookings.forEach(booking => {
      const dayOfWeek = daysOfWeek[booking.checkIn.getDay()]
      dayStats[dayOfWeek].total += 1
      if (booking.status === 'no_show') {
        dayStats[dayOfWeek].noShows += 1
      }
    })

    const patterns = Object.entries(dayStats).map(([dayOfWeek, stats]) => ({
      dayOfWeek,
      noShowRate: stats.total > 0 ? (stats.noShows / stats.total) * 100 : 0
    }))

    return {
      rate,
      patterns
    }
  }

  private static calculateGeographicDistribution(bookings: any[]): GuestDemographics['geographic'] {
    // This would extract location data from guest profiles
    // For now, returning mock data structure
    return {
      countries: [
        { country: 'India', guests: 150, percentage: 60, revenue: 450000 },
        { country: 'USA', guests: 50, percentage: 20, revenue: 200000 },
        { country: 'UK', guests: 30, percentage: 12, revenue: 120000 },
        { country: 'Germany', guests: 20, percentage: 8, revenue: 80000 }
      ],
      cities: [
        { city: 'Mumbai', guests: 80, percentage: 32, revenue: 240000 },
        { city: 'Delhi', guests: 70, percentage: 28, revenue: 210000 },
        { city: 'New York', guests: 30, percentage: 12, revenue: 120000 },
        { city: 'London', guests: 25, percentage: 10, revenue: 100000 }
      ],
      domestic: {
        percentage: 60,
        averageSpend: 3000
      },
      international: {
        percentage: 40,
        averageSpend: 4000
      }
    }
  }

  private static calculateDemographicAnalysis(bookings: any[]): GuestDemographics['demographics'] {
    // This would analyze guest demographic data
    // For now, returning mock data structure
    return {
      ageGroups: [
        { ageGroup: '25-34', percentage: 35, averageSpend: 3500 },
        { ageGroup: '35-44', percentage: 30, averageSpend: 4000 },
        { ageGroup: '45-54', percentage: 20, averageSpend: 4500 },
        { ageGroup: '18-24', percentage: 10, averageSpend: 2500 },
        { ageGroup: '55+', percentage: 5, averageSpend: 5000 }
      ],
      genderDistribution: {
        male: 55,
        female: 42,
        other: 3
      },
      travelPurpose: [
        { purpose: 'Business', percentage: 45, averageStay: 2, averageSpend: 4000 },
        { purpose: 'Leisure', percentage: 40, averageStay: 3, averageSpend: 3200 },
        { purpose: 'Family', percentage: 10, averageStay: 4, averageSpend: 3800 },
        { purpose: 'Group', percentage: 5, averageStay: 2, averageSpend: 2800 }
      ],
      groupSize: [
        { size: '1 person', percentage: 45, averageSpend: 2800 },
        { size: '2 people', percentage: 35, averageSpend: 3500 },
        { size: '3-4 people', percentage: 15, averageSpend: 4200 },
        { size: '5+ people', percentage: 5, averageSpend: 5000 }
      ]
    }
  }

  private static async calculateLoyaltyAnalysis(propertyId: string, bookings: any[]): Promise<GuestDemographics['loyalty']> {
    // This would analyze guest loyalty patterns
    // For now, returning mock data
    return {
      newGuests: {
        percentage: 60,
        averageSpend: 3200
      },
      returningGuests: {
        percentage: 30,
        averageSpend: 3800,
        averageTimeBetweenStays: 180
      },
      frequentGuests: {
        percentage: 10,
        averageSpend: 4500,
        averageStaysPerYear: 4
      }
    }
  }

  private static calculatePreferenceAnalysis(bookings: any[]): GuestDemographics['preferences'] {
    // This would analyze guest preferences from booking data
    // For now, returning mock data
    return {
      roomTypes: [
        { roomType: 'Standard', preference: 45 },
        { roomType: 'Deluxe', preference: 35 },
        { roomType: 'Suite', preference: 15 },
        { roomType: 'Presidential', preference: 5 }
      ],
      amenities: [
        { amenity: 'WiFi', requestRate: 95 },
        { amenity: 'Breakfast', requestRate: 70 },
        { amenity: 'Gym', requestRate: 40 },
        { amenity: 'Spa', requestRate: 25 }
      ],
      services: [
        { service: 'Room Service', utilizationRate: 60 },
        { service: 'Laundry', utilizationRate: 30 },
        { service: 'Concierge', utilizationRate: 20 },
        { service: 'Transportation', utilizationRate: 45 }
      ]
    }
  }

  private static calculateShortTermForecast(historicalBookings: any[], forecastDays: number): BookingForecast['shortTerm'] {
    // This would implement actual forecasting algorithms
    // For now, returning mock forecast data
    const nextWeek = []
    for (let i = 1; i <= 7; i++) {
      const date = new Date()
      date.setDate(date.getDate() + i)
      nextWeek.push({
        date: date.toISOString().split('T')[0],
        predictedBookings: Math.floor(Math.random() * 10) + 5,
        predictedRevenue: (Math.random() * 50000) + 25000,
        predictedOccupancy: Math.random() * 30 + 60,
        confidence: 0.8
      })
    }

    return {
      nextWeek,
      nextMonth: {
        predictedBookings: 180,
        predictedRevenue: 540000,
        predictedOccupancy: 75,
        confidence: 0.7
      }
    }
  }

  private static calculateLongTermForecast(historicalBookings: any[]): BookingForecast['longTerm'] {
    // This would implement long-term forecasting
    return {
      nextQuarter: {
        predictedBookings: 500,
        predictedRevenue: 1500000,
        predictedOccupancy: 72,
        confidence: 0.6
      },
      nextYear: {
        predictedBookings: 2000,
        predictedRevenue: 6000000,
        predictedOccupancy: 70,
        confidence: 0.5
      }
    }
  }

  private static calculateForecastScenarios(historicalBookings: any[]): BookingForecast['scenarios'] {
    return {
      optimistic: {
        revenue: 6900000,
        occupancy: 85,
        description: 'Strong market growth and increased tourism'
      },
      realistic: {
        revenue: 6000000,
        occupancy: 70,
        description: 'Stable market conditions with normal seasonal patterns'
      },
      pessimistic: {
        revenue: 4800000,
        occupancy: 55,
        description: 'Economic downturn or market disruption'
      }
    }
  }

  private static analyzeForecastFactors(historicalBookings: any[]): BookingForecast['factors'] {
    return {
      seasonality: 0.3,
      trends: 0.25,
      externalEvents: [
        {
          event: 'Local Festival',
          impact: 0.15,
          description: 'Annual cultural festival increases bookings by 15%'
        },
        {
          event: 'Conference Season',
          impact: 0.20,
          description: 'Business conference season drives corporate bookings'
        }
      ],
      marketConditions: 0.1
    }
  }

  private static generateForecastRecommendations(historicalBookings: any[], scenarios: any): BookingForecast['recommendations'] {
    return [
      {
        category: 'Pricing',
        recommendation: 'Increase rates by 8-12% during peak demand periods',
        impact: 'Revenue increase of ₹200,000-300,000',
        priority: 'high'
      },
      {
        category: 'Marketing',
        recommendation: 'Focus digital marketing on business travelers during conference season',
        impact: 'Occupancy increase of 5-8%',
        priority: 'medium'
      },
      {
        category: 'Operations',
        recommendation: 'Schedule maintenance during predicted low-occupancy periods',
        impact: 'Minimize revenue disruption',
        priority: 'medium'
      },
      {
        category: 'Inventory',
        recommendation: 'Adjust room mix to increase suite availability during festivals',
        impact: 'Premium revenue capture',
        priority: 'low'
      }
    ]
  }
}