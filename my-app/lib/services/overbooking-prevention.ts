/**
 * Smart Overbooking Prevention System
 * Advanced availability management with intelligent safeguards
 */

import Booking from "@/models/Booking"
import Property from "@/models/Property"
import Room from "@/models/Room"
import RoomAvailability from "@/models/RoomAvailability"
import dbConnect from "@/lib/db/dbConnect"

export interface AvailabilityCheck {
  available: boolean
  totalCapacity: number
  bookedUnits: number
  availableUnits: number
  conflictingBookings: string[]
  riskLevel: 'low' | 'medium' | 'high'
  recommendations: string[]
  alternativeDates?: Array<{
    dateFrom: string
    dateTo: string
    available: boolean
  }>
}

export interface OverbookingConfig {
  enabled: boolean
  maxOverbookingPercentage: number // e.g., 10 for 10%
  bufferHours: number // Hours before/after to check
  alertThreshold: number // Percentage at which to send alerts
  autoBlockHighRisk: boolean
  allowedPropertyTypes: string[]
  excludedDates: Date[] // Blackout dates
}

export interface BookingConflict {
  conflictType: 'room_overlap' | 'capacity_exceeded' | 'maintenance_conflict'
  severity: 'low' | 'medium' | 'high'
  affectedBookings: string[]
  description: string
  suggestedActions: string[]
}

class OverbookingPrevention {
  private config: OverbookingConfig = {
    enabled: true,
    maxOverbookingPercentage: 5, // Allow 5% overbooking by default
    bufferHours: 2, // 2-hour buffer for check-in/out times
    alertThreshold: 80, // Alert when 80% capacity reached
    autoBlockHighRisk: true,
    allowedPropertyTypes: ['hotel', 'resort', 'apartment'],
    excludedDates: []
  }

  /**
   * Comprehensive availability check with overbooking intelligence
   */
  async checkAdvancedAvailability(
    propertyId: string,
    checkIn: Date,
    checkOut: Date,
    requiredCapacity: number = 1,
    excludeBookingId?: string
  ): Promise<AvailabilityCheck> {
    await dbConnect()

    try {
      console.log(`🔍 [OverbookingPrevention] Checking availability for property ${propertyId}`)
      
      const property = await Property.findById(propertyId).lean()
      if (!property) {
        throw new Error('Property not found')
      }

      // Get all existing bookings that overlap with requested dates
      const overlappingBookings = await this.getOverlappingBookings(
        propertyId,
        checkIn,
        checkOut,
        excludeBookingId
      )

      // Calculate current occupancy
      const occupancyData = await this.calculateOccupancy(
        property,
        checkIn,
        checkOut,
        overlappingBookings
      )

      // Analyze risk factors
      const riskAnalysis = await this.analyzeBookingRisk(
        property,
        checkIn,
        checkOut,
        requiredCapacity,
        occupancyData
      )

      // Generate availability result
      const availabilityCheck: AvailabilityCheck = {
        available: this.determineAvailability(occupancyData, riskAnalysis, requiredCapacity),
        totalCapacity: occupancyData.totalCapacity,
        bookedUnits: occupancyData.bookedUnits,
        availableUnits: occupancyData.availableUnits,
        conflictingBookings: overlappingBookings.map(b => b._id.toString()),
        riskLevel: riskAnalysis.riskLevel,
        recommendations: riskAnalysis.recommendations,
        alternativeDates: await this.findAlternativeDates(
          propertyId,
          checkIn,
          checkOut,
          requiredCapacity
        )
      }

      console.log(`✅ [OverbookingPrevention] Availability check completed:`, {
        available: availabilityCheck.available,
        riskLevel: availabilityCheck.riskLevel,
        occupancy: `${occupancyData.bookedUnits}/${occupancyData.totalCapacity}`
      })

      return availabilityCheck

    } catch (error) {
      console.error('❌ [OverbookingPrevention] Error in availability check:', error)
      throw error
    }
  }

  /**
   * Get all bookings that overlap with the requested dates
   */
  private async getOverlappingBookings(
    propertyId: string,
    checkIn: Date,
    checkOut: Date,
    excludeBookingId?: string
  ): Promise<any[]> {
    const filter: any = {
      propertyId,
      status: { $in: ['confirmed', 'pending'] },
      $or: [
        { dateFrom: { $lt: checkOut }, dateTo: { $gt: checkIn } }, // Standard overlap
        { dateFrom: { $gte: checkIn, $lt: checkOut } }, // Starts within range
        { dateTo: { $gt: checkIn, $lte: checkOut } } // Ends within range
      ]
    }

    if (excludeBookingId) {
      filter._id = { $ne: excludeBookingId }
    }

    // Add buffer time consideration
    if (this.config.bufferHours > 0) {
      const bufferMs = this.config.bufferHours * 60 * 60 * 1000
      const bufferedCheckIn = new Date(checkIn.getTime() - bufferMs)
      const bufferedCheckOut = new Date(checkOut.getTime() + bufferMs)
      
      filter.$or = [
        { dateFrom: { $lt: bufferedCheckOut }, dateTo: { $gt: bufferedCheckIn } }
      ]
    }

    return await Booking.find(filter).lean()
  }

  /**
   * Calculate current occupancy for the property
   */
  private async calculateOccupancy(
    property: any,
    checkIn: Date,
    checkOut: Date,
    overlappingBookings: any[]
  ): Promise<{
    totalCapacity: number
    bookedUnits: number
    availableUnits: number
    occupancyPercentage: number
    unitDetails?: any[]
  }> {
    // Calculate total capacity
    let totalCapacity = 1 // Default single unit
    let unitDetails: any[] = []

    if (property.propertyUnits && property.propertyUnits.length > 0) {
      // Multi-unit property (hotel, apartment complex)
      totalCapacity = 0
      for (const unit of property.propertyUnits) {
        const unitCapacity = unit.roomNumbers?.length || 1
        totalCapacity += unitCapacity
        unitDetails.push({
          unitType: unit.unitTypeCode,
          capacity: unitCapacity,
          pricePerNight: unit.pricePerNight
        })
      }
    } else if (property.maxGuests) {
      // Single unit with guest capacity
      totalCapacity = Math.ceil(property.maxGuests / 2) // Rough unit estimation
    }

    // Calculate booked units during the period
    let bookedUnits = 0
    const bookingGuests: Record<string, number> = {}

    for (const booking of overlappingBookings) {
      const guestCount = booking.guests || 1
      bookedUnits += 1 // Each booking takes at least 1 unit
      bookingGuests[booking._id] = guestCount
    }

    const availableUnits = Math.max(0, totalCapacity - bookedUnits)
    const occupancyPercentage = totalCapacity > 0 ? (bookedUnits / totalCapacity) * 100 : 0

    return {
      totalCapacity,
      bookedUnits,
      availableUnits,
      occupancyPercentage,
      unitDetails
    }
  }

  /**
   * Analyze booking risk factors
   */
  private async analyzeBookingRisk(
    property: any,
    checkIn: Date,
    checkOut: Date,
    requiredCapacity: number,
    occupancyData: any
  ): Promise<{
    riskLevel: 'low' | 'medium' | 'high'
    riskFactors: string[]
    recommendations: string[]
    canOverbook: boolean
  }> {
    const riskFactors: string[] = []
    const recommendations: string[] = []
    let riskScore = 0

    // Occupancy risk
    if (occupancyData.occupancyPercentage > 90) {
      riskFactors.push('Very high occupancy (>90%)')
      riskScore += 30
    } else if (occupancyData.occupancyPercentage > 75) {
      riskFactors.push('High occupancy (>75%)')
      riskScore += 15
    }

    // Capacity vs demand risk
    if (occupancyData.availableUnits < requiredCapacity) {
      riskFactors.push('Insufficient available units for request')
      riskScore += 25
    }

    // Date proximity risk (bookings too close together)
    const bufferTime = this.config.bufferHours * 60 * 60 * 1000
    const hasCloseBookings = await this.checkCloseBookings(
      property._id,
      checkIn,
      checkOut,
      bufferTime
    )
    
    if (hasCloseBookings) {
      riskFactors.push('Bookings with insufficient buffer time')
      riskScore += 15
    }

    // Seasonal/event risk
    const isHighDemandPeriod = await this.checkHighDemandPeriod(checkIn, checkOut)
    if (isHighDemandPeriod) {
      riskFactors.push('High demand period (holidays/events)')
      riskScore += 20
    }

    // Property type risk
    if (!this.config.allowedPropertyTypes.includes(property.propertyType)) {
      riskFactors.push('Property type not suitable for overbooking')
      riskScore += 35
    }

    // Generate recommendations
    if (riskScore > 20) {
      recommendations.push('Consider manual review before confirming')
    }
    if (occupancyData.occupancyPercentage > 80) {
      recommendations.push('Monitor for potential conflicts')
      recommendations.push('Prepare backup accommodation options')
    }
    if (hasCloseBookings) {
      recommendations.push('Coordinate with housekeeping for quick turnovers')
    }
    if (occupancyData.availableUnits <= 1) {
      recommendations.push('Block further bookings until current ones are confirmed')
    }

    // Determine risk level
    let riskLevel: 'low' | 'medium' | 'high' = 'low'
    if (riskScore >= 40) {
      riskLevel = 'high'
    } else if (riskScore >= 20) {
      riskLevel = 'medium'
    }

    // Determine if overbooking is allowed
    const overbookingPercentage = ((occupancyData.bookedUnits + requiredCapacity - occupancyData.totalCapacity) / occupancyData.totalCapacity) * 100
    const canOverbook = this.config.enabled && 
                       overbookingPercentage <= this.config.maxOverbookingPercentage &&
                       riskLevel !== 'high'

    return {
      riskLevel,
      riskFactors,
      recommendations,
      canOverbook
    }
  }

  /**
   * Determine final availability based on analysis
   */
  private determineAvailability(
    occupancyData: any,
    riskAnalysis: any,
    requiredCapacity: number
  ): boolean {
    // Direct availability (no overbooking needed)
    if (occupancyData.availableUnits >= requiredCapacity) {
      return true
    }

    // Check if overbooking is possible
    if (!this.config.enabled) {
      return false
    }

    // Auto-block high-risk bookings
    if (this.config.autoBlockHighRisk && riskAnalysis.riskLevel === 'high') {
      return false
    }

    // Allow overbooking within limits
    return riskAnalysis.canOverbook
  }

  /**
   * Check for bookings with insufficient buffer time
   */
  private async checkCloseBookings(
    propertyId: string,
    checkIn: Date,
    checkOut: Date,
    bufferTime: number
  ): Promise<boolean> {
    const closeCheckIn = new Date(checkIn.getTime() - bufferTime)
    const closeCheckOut = new Date(checkOut.getTime() + bufferTime)

    const closeBookings = await Booking.find({
      propertyId,
      status: { $in: ['confirmed', 'pending'] },
      $or: [
        { dateTo: { $gte: closeCheckIn, $lte: checkIn } },
        { dateFrom: { $gte: checkOut, $lte: closeCheckOut } }
      ]
    }).lean()

    return closeBookings.length > 0
  }

  /**
   * Check if dates fall within high-demand periods
   */
  private async checkHighDemandPeriod(checkIn: Date, checkOut: Date): Promise<boolean> {
    // Simple implementation - can be enhanced with external data
    const month = checkIn.getMonth()
    const day = checkIn.getDate()
    
    // Holiday periods (can be expanded)
    const highDemandPeriods = [
      { start: { month: 11, day: 20 }, end: { month: 0, day: 5 } }, // Christmas/New Year
      { start: { month: 3, day: 1 }, end: { month: 3, day: 30 } }, // Easter season
      { start: { month: 6, day: 1 }, end: { month: 7, day: 31 } }, // Summer vacation
    ]
    
    return highDemandPeriods.some(period => {
      if (period.start.month <= period.end.month) {
        return month >= period.start.month && month <= period.end.month
      } else {
        // Cross-year period (like Christmas)
        return month >= period.start.month || month <= period.end.month
      }
    })
  }

  /**
   * Find alternative available dates
   */
  private async findAlternativeDates(
    propertyId: string,
    originalCheckIn: Date,
    originalCheckOut: Date,
    requiredCapacity: number
  ): Promise<Array<{ dateFrom: string; dateTo: string; available: boolean }>> {
    const alternatives = []
    const stayDuration = originalCheckOut.getTime() - originalCheckIn.getTime()
    
    // Check 7 days before and after the original dates
    for (let i = -7; i <= 7; i++) {
      if (i === 0) continue // Skip original dates
      
      const newCheckIn = new Date(originalCheckIn.getTime() + i * 24 * 60 * 60 * 1000)
      const newCheckOut = new Date(newCheckIn.getTime() + stayDuration)
      
      try {
        const availability = await this.checkAdvancedAvailability(
          propertyId,
          newCheckIn,
          newCheckOut,
          requiredCapacity
        )
        
        alternatives.push({
          dateFrom: newCheckIn.toISOString().split('T')[0],
          dateTo: newCheckOut.toISOString().split('T')[0],
          available: availability.available
        })
      } catch (error) {
        alternatives.push({
          dateFrom: newCheckIn.toISOString().split('T')[0],
          dateTo: newCheckOut.toISOString().split('T')[0],
          available: false
        })
      }
    }
    
    return alternatives.filter(alt => alt.available).slice(0, 5) // Return top 5 alternatives
  }

  /**
   * Detect potential booking conflicts
   */
  async detectConflicts(propertyId?: string): Promise<BookingConflict[]> {
    await dbConnect()
    
    const conflicts: BookingConflict[] = []
    
    try {
      const filter: any = { status: { $in: ['confirmed', 'pending'] } }
      if (propertyId) filter.propertyId = propertyId
      
      const bookings = await Booking.find(filter)
        .populate('propertyId', 'title propertyUnits')
        .sort({ dateFrom: 1 })
        .lean()
      
      // Group by property
      const bookingsByProperty: Record<string, any[]> = {}
      bookings.forEach(booking => {
        const propId = booking.propertyId._id.toString()
        if (!bookingsByProperty[propId]) {
          bookingsByProperty[propId] = []
        }
        bookingsByProperty[propId].push(booking)
      })
      
      // Check each property for conflicts
      for (const [propId, propBookings] of Object.entries(bookingsByProperty)) {
        const propertyConflicts = await this.detectPropertyConflicts(propId, propBookings)
        conflicts.push(...propertyConflicts)
      }
      
    } catch (error) {
      console.error('❌ [OverbookingPrevention] Error detecting conflicts:', error)
    }
    
    return conflicts
  }

  /**
   * Detect conflicts within a specific property
   */
  private async detectPropertyConflicts(propertyId: string, bookings: any[]): Promise<BookingConflict[]> {
    const conflicts: BookingConflict[] = []
    
    // Sort bookings by check-in date
    bookings.sort((a, b) => new Date(a.dateFrom).getTime() - new Date(b.dateFrom).getTime())
    
    for (let i = 0; i < bookings.length; i++) {
      const booking1 = bookings[i]
      
      for (let j = i + 1; j < bookings.length; j++) {
        const booking2 = bookings[j]
        
        // Check for date overlap
        const overlap = this.checkDateOverlap(
          booking1.dateFrom,
          booking1.dateTo,
          booking2.dateFrom,
          booking2.dateTo
        )
        
        if (overlap) {
          const conflict: BookingConflict = {
            conflictType: 'room_overlap',
            severity: this.calculateConflictSeverity(booking1, booking2),
            affectedBookings: [booking1._id.toString(), booking2._id.toString()],
            description: `Booking overlap detected between ${booking1.dateFrom.toISOString().split('T')[0]} and ${booking2.dateFrom.toISOString().split('T')[0]}`,
            suggestedActions: [
              'Review room allocation',
              'Contact guests for date modification',
              'Arrange alternative accommodation'
            ]
          }
          
          conflicts.push(conflict)
        }
      }
    }
    
    return conflicts
  }

  /**
   * Check if two date ranges overlap
   */
  private checkDateOverlap(start1: Date, end1: Date, start2: Date, end2: Date): boolean {
    return start1 < end2 && end1 > start2
  }

  /**
   * Calculate severity of a booking conflict
   */
  private calculateConflictSeverity(booking1: any, booking2: any): 'low' | 'medium' | 'high' {
    const overlapDays = this.calculateOverlapDays(
      booking1.dateFrom,
      booking1.dateTo,
      booking2.dateFrom,
      booking2.dateTo
    )
    
    if (overlapDays >= 3) return 'high'
    if (overlapDays >= 1) return 'medium'
    return 'low'
  }

  /**
   * Calculate number of overlapping days
   */
  private calculateOverlapDays(start1: Date, end1: Date, start2: Date, end2: Date): number {
    const overlapStart = new Date(Math.max(start1.getTime(), start2.getTime()))
    const overlapEnd = new Date(Math.min(end1.getTime(), end2.getTime()))
    
    if (overlapStart >= overlapEnd) return 0
    
    return Math.ceil((overlapEnd.getTime() - overlapStart.getTime()) / (1000 * 60 * 60 * 24))
  }

  /**
   * Update overbooking configuration
   */
  updateConfig(newConfig: Partial<OverbookingConfig>) {
    this.config = { ...this.config, ...newConfig }
    console.log('🔧 [OverbookingPrevention] Configuration updated:', newConfig)
  }

  /**
   * Get current configuration
   */
  getConfig(): OverbookingConfig {
    return { ...this.config }
  }

  /**
   * Get overbooking statistics
   */
  async getStats() {
    await dbConnect()
    
    const now = new Date()
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    
    const stats = {
      totalProperties: await Property.countDocuments(),
      activeBookings: await Booking.countDocuments({ 
        status: { $in: ['confirmed', 'pending'] },
        dateTo: { $gte: now }
      }),
      recentConflicts: (await this.detectConflicts()).length,
      overbookedProperties: 0, // Would require more complex calculation
      preventedOverbookings: 0, // Would be tracked separately
      configStatus: {
        enabled: this.config.enabled,
        maxOverbookingPercentage: this.config.maxOverbookingPercentage,
        alertThreshold: this.config.alertThreshold
      }
    }
    
    return stats
  }
}

// Export singleton instance
export const overbookingPrevention = new OverbookingPrevention()

export default OverbookingPrevention