import { connectToDatabase } from '@/lib/mongodb'
import Booking from '@/models/Booking'
import Room from '@/models/Room'
import RoomType from '@/models/RoomType'
import { Types } from 'mongoose'
import { addDays, subDays, startOfDay, endOfDay, isAfter, isBefore } from 'date-fns'

export interface OverbookingRule {
  propertyId: string
  roomTypeId?: string
  maxOverbookingPercentage: number
  maxOverbookingCount: number
  seasonalAdjustments: Array<{
    startDate: Date
    endDate: Date
    maxOverbookingPercentage: number
  }>
  blackoutDates: Date[]
  allowedBookingSources: string[]
  minimumLeadTime: number // hours
  autoUpgradeEnabled: boolean
  compensationPolicy: {
    enabled: boolean
    amount: number
    currency: string
    type: 'fixed' | 'percentage'
  }
}

export interface OverbookingAnalysis {
  propertyId: string
  date: Date
  roomType?: string
  totalRooms: number
  confirmedBookings: number
  pendingBookings: number
  availableRooms: number
  overbookingCount: number
  overbookingPercentage: number
  riskLevel: 'low' | 'medium' | 'high' | 'critical'
  recommendations: string[]
  alternativeActions: Array<{
    action: string
    description: string
    estimatedImpact: string
  }>
}

export interface OverbookingPreventionResult {
  allowed: boolean
  reason: string
  riskLevel: 'low' | 'medium' | 'high' | 'critical'
  currentOverbooking: number
  maxAllowedOverbooking: number
  alternatives?: Array<{
    type: 'upgrade' | 'alternative_dates' | 'sister_property'
    description: string
    available: boolean
  }>
  warnings: string[]
}

export class OverbookingPreventionService {
  // Check if a booking can be accepted without violating overbooking rules
  static async checkOverbookingRisk(
    propertyId: string,
    checkInDate: Date,
    checkOutDate: Date,
    roomTypeId?: string,
    bookingSource?: string
  ): Promise<OverbookingPreventionResult> {
    try {
      await connectToDatabase()

      // Get overbooking rules for the property
      const rules = await this.getOverbookingRules(propertyId, roomTypeId)

      // Get current booking situation
      const analysis = await this.analyzeOverbookingSituation(
        propertyId,
        checkInDate,
        checkOutDate,
        roomTypeId
      )

      // Check if booking source is allowed for overbooking
      if (bookingSource && rules.allowedBookingSources.length > 0) {
        if (!rules.allowedBookingSources.includes(bookingSource)) {
          return {
            allowed: false,
            reason: 'Booking source not authorized for overbooking',
            riskLevel: 'high',
            currentOverbooking: analysis.overbookingCount,
            maxAllowedOverbooking: rules.maxOverbookingCount,
            warnings: ['Only direct bookings allowed when overbooked']
          }
        }
      }

      // Check blackout dates
      const isBlackoutDate = rules.blackoutDates.some(date =>
        this.isDateInRange(date, checkInDate, checkOutDate)
      )

      if (isBlackoutDate) {
        return {
          allowed: false,
          reason: 'Booking dates include blackout periods',
          riskLevel: 'critical',
          currentOverbooking: analysis.overbookingCount,
          maxAllowedOverbooking: 0,
          warnings: ['No overbooking allowed during blackout dates']
        }
      }

      // Check seasonal adjustments
      const seasonalRule = this.getSeasonalOverbookingLimit(rules, checkInDate)
      const effectiveMaxPercentage = seasonalRule?.maxOverbookingPercentage || rules.maxOverbookingPercentage

      // Calculate if adding this booking would exceed limits
      const newOverbookingCount = Math.max(0, analysis.confirmedBookings + analysis.pendingBookings + 1 - analysis.totalRooms)
      const newOverbookingPercentage = analysis.totalRooms > 0 ? (newOverbookingCount / analysis.totalRooms) * 100 : 0

      // Check against limits
      const exceedsCountLimit = newOverbookingCount > rules.maxOverbookingCount
      const exceedsPercentageLimit = newOverbookingPercentage > effectiveMaxPercentage

      if (exceedsCountLimit || exceedsPercentageLimit) {
        // Generate alternatives
        const alternatives = await this.generateAlternatives(
          propertyId,
          checkInDate,
          checkOutDate,
          roomTypeId
        )

        return {
          allowed: false,
          reason: exceedsCountLimit
            ? `Would exceed maximum overbooking count (${rules.maxOverbookingCount})`
            : `Would exceed maximum overbooking percentage (${effectiveMaxPercentage}%)`,
          riskLevel: this.calculateRiskLevel(newOverbookingPercentage, effectiveMaxPercentage),
          currentOverbooking: analysis.overbookingCount,
          maxAllowedOverbooking: rules.maxOverbookingCount,
          alternatives,
          warnings: this.generateWarnings(analysis, rules)
        }
      }

      // Booking is allowed
      return {
        allowed: true,
        reason: 'Booking within acceptable overbooking limits',
        riskLevel: this.calculateRiskLevel(newOverbookingPercentage, effectiveMaxPercentage),
        currentOverbooking: analysis.overbookingCount,
        maxAllowedOverbooking: rules.maxOverbookingCount,
        warnings: this.generateWarnings(analysis, rules)
      }

    } catch (error) {
      console.error('Overbooking risk check error:', error)
      return {
        allowed: false,
        reason: 'Error checking overbooking risk',
        riskLevel: 'critical',
        currentOverbooking: 0,
        maxAllowedOverbooking: 0,
        warnings: ['System error - manual review required']
      }
    }
  }

  // Analyze current overbooking situation
  static async analyzeOverbookingSituation(
    propertyId: string,
    checkInDate: Date,
    checkOutDate: Date,
    roomTypeId?: string
  ): Promise<OverbookingAnalysis> {
    await connectToDatabase()

    const query: any = {
      propertyId: new Types.ObjectId(propertyId),
      $or: [
        {
          dateFrom: { $lt: checkOutDate },
          dateTo: { $gt: checkInDate }
        }
      ],
      status: { $in: ['confirmed', 'pending'] }
    }

    if (roomTypeId) {
      query['allocatedRoom.roomTypeId'] = roomTypeId
    }

    // Get conflicting bookings
    const bookings = await Booking.find(query).lean()

    // Get total rooms
    const roomQuery: any = {
      propertyId: new Types.ObjectId(propertyId),
      isActive: true,
      isBookable: true
    }

    if (roomTypeId) {
      roomQuery.roomTypeId = new Types.ObjectId(roomTypeId)
    }

    const totalRooms = await Room.countDocuments(roomQuery)

    // Separate confirmed and pending bookings
    const confirmedBookings = bookings.filter(b => b.status === 'confirmed').length
    const pendingBookings = bookings.filter(b => b.status === 'pending').length

    const availableRooms = Math.max(0, totalRooms - confirmedBookings)
    const overbookingCount = Math.max(0, confirmedBookings + pendingBookings - totalRooms)
    const overbookingPercentage = totalRooms > 0 ? (overbookingCount / totalRooms) * 100 : 0

    const riskLevel = this.calculateRiskLevel(overbookingPercentage, 10) // Assuming 10% default threshold

    return {
      propertyId,
      date: checkInDate,
      roomType: roomTypeId,
      totalRooms,
      confirmedBookings,
      pendingBookings,
      availableRooms,
      overbookingCount,
      overbookingPercentage,
      riskLevel,
      recommendations: this.generateRecommendations(riskLevel, overbookingCount, availableRooms),
      alternativeActions: this.generateAlternativeActions(riskLevel, overbookingCount)
    }
  }

  // Get overbooking rules for property/room type
  static async getOverbookingRules(propertyId: string, roomTypeId?: string): Promise<OverbookingRule> {
    // In production, this would be stored in a database
    // For now, returning default rules with some property-specific logic

    const defaultRules: OverbookingRule = {
      propertyId,
      roomTypeId,
      maxOverbookingPercentage: 10,
      maxOverbookingCount: 5,
      seasonalAdjustments: [
        {
          startDate: new Date('2024-12-20'),
          endDate: new Date('2025-01-05'),
          maxOverbookingPercentage: 5 // Reduce during peak season
        },
        {
          startDate: new Date('2024-06-01'),
          endDate: new Date('2024-08-31'),
          maxOverbookingPercentage: 15 // Allow more during summer
        }
      ],
      blackoutDates: [
        new Date('2024-12-25'), // Christmas
        new Date('2025-01-01'),  // New Year
      ],
      allowedBookingSources: ['direct', 'phone', 'email'], // Only direct bookings when overbooked
      minimumLeadTime: 24, // 24 hours minimum
      autoUpgradeEnabled: true,
      compensationPolicy: {
        enabled: true,
        amount: 5000,
        currency: 'INR',
        type: 'fixed'
      }
    }

    // Room type specific adjustments
    if (roomTypeId) {
      const roomType = await RoomType.findById(roomTypeId)
      if (roomType?.category === 'presidential') {
        defaultRules.maxOverbookingPercentage = 0 // No overbooking for premium rooms
        defaultRules.maxOverbookingCount = 0
      } else if (roomType?.category === 'economy') {
        defaultRules.maxOverbookingPercentage = 20 // Higher tolerance for economy rooms
      }
    }

    return defaultRules
  }

  // Generate alternatives when overbooking is not allowed
  static async generateAlternatives(
    propertyId: string,
    checkInDate: Date,
    checkOutDate: Date,
    roomTypeId?: string
  ): Promise<Array<{ type: string; description: string; available: boolean }>> {
    const alternatives = []

    // Check for upgrade options
    if (roomTypeId) {
      const upgradeOptions = await this.checkUpgradeAvailability(
        propertyId,
        checkInDate,
        checkOutDate,
        roomTypeId
      )

      if (upgradeOptions.length > 0) {
        alternatives.push({
          type: 'upgrade',
          description: `Upgrade to ${upgradeOptions[0].roomTypeName} available`,
          available: true
        })
      }
    }

    // Check alternative dates (±3 days)
    const alternativeDates = await this.checkAlternativeDates(
      propertyId,
      checkInDate,
      checkOutDate,
      roomTypeId
    )

    if (alternativeDates.length > 0) {
      alternatives.push({
        type: 'alternative_dates',
        description: `Available dates: ${alternativeDates.map(d => d.toDateString()).join(', ')}`,
        available: true
      })
    }

    // Check sister properties (placeholder)
    alternatives.push({
      type: 'sister_property',
      description: 'Similar properties available in the area',
      available: false // Would need actual implementation
    })

    return alternatives
  }

  // Monitor overbooking situations in real-time
  static async monitorOverbookingRisk(propertyId: string): Promise<{
    currentStatus: 'safe' | 'warning' | 'critical'
    riskAreas: Array<{
      date: Date
      roomType: string
      riskLevel: string
      overbookingCount: number
    }>
    recommendations: string[]
    nextActions: Array<{
      action: string
      priority: 'low' | 'medium' | 'high'
      deadline: Date
    }>
  }> {
    await connectToDatabase()

    const next30Days = Array.from({ length: 30 }, (_, i) => addDays(new Date(), i))
    const riskAreas = []
    let maxRiskLevel = 'safe'

    // Check each day for overbooking risk
    for (const date of next30Days) {
      const roomTypes = await RoomType.find({
        propertyId: new Types.ObjectId(propertyId),
        isActive: true
      })

      for (const roomType of roomTypes) {
        const analysis = await this.analyzeOverbookingSituation(
          propertyId,
          startOfDay(date),
          endOfDay(date),
          roomType._id.toString()
        )

        if (analysis.riskLevel !== 'low') {
          riskAreas.push({
            date,
            roomType: roomType.name,
            riskLevel: analysis.riskLevel,
            overbookingCount: analysis.overbookingCount
          })

          if (analysis.riskLevel === 'critical') maxRiskLevel = 'critical'
          else if (analysis.riskLevel === 'high' && maxRiskLevel !== 'critical') maxRiskLevel = 'warning'
        }
      }
    }

    const recommendations = this.generateMonitoringRecommendations(riskAreas)
    const nextActions = this.generateNextActions(riskAreas)

    return {
      currentStatus: maxRiskLevel as 'safe' | 'warning' | 'critical',
      riskAreas,
      recommendations,
      nextActions
    }
  }

  // Handle overbooking compensation
  static async processOverbookingCompensation(
    bookingId: string,
    compensationType: 'monetary' | 'upgrade' | 'future_credit',
    amount?: number,
    reason?: string
  ): Promise<{
    success: boolean
    compensationId?: string
    amount?: number
    error?: string
  }> {
    try {
      await connectToDatabase()

      const booking = await Booking.findById(bookingId)
      if (!booking) {
        return { success: false, error: 'Booking not found' }
      }

      const compensationId = `COMP-${Date.now()}`

      // Create compensation record
      const compensation = {
        compensationId,
        type: compensationType,
        amount: amount || 0,
        reason: reason || 'Overbooking compensation',
        processedAt: new Date(),
        status: 'approved'
      }

      // Add to booking record
      if (!booking.compensations) {
        booking.compensations = []
      }
      booking.compensations.push(compensation)

      // Update booking status
      booking.status = 'compensated'

      await booking.save()

      return {
        success: true,
        compensationId,
        amount: compensation.amount
      }

    } catch (error) {
      console.error('Compensation processing error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  // Utility methods
  private static isDateInRange(targetDate: Date, startDate: Date, endDate: Date): boolean {
    return targetDate >= startDate && targetDate <= endDate
  }

  private static getSeasonalOverbookingLimit(
    rules: OverbookingRule,
    date: Date
  ): { maxOverbookingPercentage: number } | null {
    return rules.seasonalAdjustments.find(adj =>
      date >= adj.startDate && date <= adj.endDate
    ) || null
  }

  private static calculateRiskLevel(
    currentPercentage: number,
    maxPercentage: number
  ): 'low' | 'medium' | 'high' | 'critical' {
    const ratio = currentPercentage / maxPercentage

    if (ratio >= 1) return 'critical'
    if (ratio >= 0.8) return 'high'
    if (ratio >= 0.5) return 'medium'
    return 'low'
  }

  private static generateWarnings(analysis: OverbookingAnalysis, rules: OverbookingRule): string[] {
    const warnings = []

    if (analysis.overbookingPercentage > rules.maxOverbookingPercentage * 0.8) {
      warnings.push('Approaching maximum overbooking percentage')
    }

    if (analysis.overbookingCount > rules.maxOverbookingCount * 0.8) {
      warnings.push('Approaching maximum overbooking count')
    }

    if (analysis.riskLevel === 'high' || analysis.riskLevel === 'critical') {
      warnings.push('High risk of guest displacement')
    }

    return warnings
  }

  private static generateRecommendations(
    riskLevel: string,
    overbookingCount: number,
    availableRooms: number
  ): string[] {
    const recommendations = []

    if (riskLevel === 'critical') {
      recommendations.push('Stop accepting new bookings immediately')
      recommendations.push('Contact guests to arrange alternative accommodations')
      recommendations.push('Prepare compensation packages')
    } else if (riskLevel === 'high') {
      recommendations.push('Restrict new bookings to direct channels only')
      recommendations.push('Implement automatic upgrade offers')
      recommendations.push('Monitor cancellation trends closely')
    } else if (riskLevel === 'medium') {
      recommendations.push('Consider implementing upgrade incentives')
      recommendations.push('Monitor booking patterns hourly')
    }

    return recommendations
  }

  private static generateAlternativeActions(
    riskLevel: string,
    overbookingCount: number
  ): Array<{ action: string; description: string; estimatedImpact: string }> {
    const actions = []

    if (riskLevel === 'high' || riskLevel === 'critical') {
      actions.push({
        action: 'Proactive upgrades',
        description: 'Offer free upgrades to reduce demand on overbooked room types',
        estimatedImpact: `Could reduce overbooking by up to ${Math.min(overbookingCount, 3)} rooms`
      })

      actions.push({
        action: 'Alternative accommodation',
        description: 'Partner with nearby hotels for guest relocation',
        estimatedImpact: 'Eliminate overbooking risk but may incur costs'
      })
    }

    actions.push({
      action: 'Dynamic pricing',
      description: 'Increase rates to reduce demand',
      estimatedImpact: 'May reduce new bookings by 20-30%'
    })

    return actions
  }

  private static async checkUpgradeAvailability(
    propertyId: string,
    checkInDate: Date,
    checkOutDate: Date,
    roomTypeId: string
  ): Promise<Array<{ roomTypeName: string; available: boolean }>> {
    // This would integrate with the room allocation service
    // Simplified implementation for now
    return [
      { roomTypeName: 'Deluxe Room', available: true },
      { roomTypeName: 'Suite', available: false }
    ]
  }

  private static async checkAlternativeDates(
    propertyId: string,
    checkInDate: Date,
    checkOutDate: Date,
    roomTypeId?: string
  ): Promise<Date[]> {
    const alternatives = []
    const nights = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24))

    // Check ±3 days
    for (let offset = -3; offset <= 3; offset++) {
      if (offset === 0) continue

      const altCheckIn = addDays(checkInDate, offset)
      const altCheckOut = addDays(altCheckIn, nights)

      const analysis = await this.analyzeOverbookingSituation(
        propertyId,
        altCheckIn,
        altCheckOut,
        roomTypeId
      )

      if (analysis.availableRooms > 0) {
        alternatives.push(altCheckIn)
      }
    }

    return alternatives
  }

  private static generateMonitoringRecommendations(riskAreas: any[]): string[] {
    const recommendations = []

    if (riskAreas.length === 0) {
      recommendations.push('No immediate overbooking risks detected')
      return recommendations
    }

    const criticalAreas = riskAreas.filter(area => area.riskLevel === 'critical')
    const highRiskAreas = riskAreas.filter(area => area.riskLevel === 'high')

    if (criticalAreas.length > 0) {
      recommendations.push(`Critical: ${criticalAreas.length} dates with overbooking risk`)
      recommendations.push('Implement immediate preventive measures')
    }

    if (highRiskAreas.length > 0) {
      recommendations.push(`Warning: ${highRiskAreas.length} dates approaching overbooking limits`)
      recommendations.push('Consider proactive guest management')
    }

    return recommendations
  }

  private static generateNextActions(riskAreas: any[]): Array<{
    action: string
    priority: 'low' | 'medium' | 'high'
    deadline: Date
  }> {
    const actions = []

    const criticalAreas = riskAreas.filter(area => area.riskLevel === 'critical')
    const highRiskAreas = riskAreas.filter(area => area.riskLevel === 'high')

    if (criticalAreas.length > 0) {
      actions.push({
        action: 'Review critical overbooking situations',
        priority: 'high' as const,
        deadline: addDays(new Date(), 1)
      })

      actions.push({
        action: 'Prepare guest relocation plans',
        priority: 'high' as const,
        deadline: addDays(new Date(), 2)
      })
    }

    if (highRiskAreas.length > 0) {
      actions.push({
        action: 'Implement upgrade incentives',
        priority: 'medium' as const,
        deadline: addDays(new Date(), 3)
      })
    }

    actions.push({
      action: 'Review overbooking policies',
      priority: 'low' as const,
      deadline: addDays(new Date(), 7)
    })

    return actions
  }
}