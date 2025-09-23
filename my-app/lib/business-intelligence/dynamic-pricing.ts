import { auditLogger } from '../security/audit-logger'

export interface PricingRule {
  id: string
  name: string
  description: string
  priority: number
  isActive: boolean
  conditions: PricingCondition[]
  adjustments: PricingAdjustment[]
  validFrom: Date
  validTo?: Date
  roomTypes: string[]
  properties: string[]
  dayOfWeek?: number[]
  minAdvanceBooking?: number
  maxAdvanceBooking?: number
  createdAt: Date
  createdBy: string
}

export interface PricingCondition {
  type: 'occupancy' | 'demand' | 'season' | 'event' | 'weather' | 'competitor' | 'inventory' | 'booking_window'
  operator: 'gt' | 'gte' | 'lt' | 'lte' | 'eq' | 'between' | 'in'
  value: number | string | [number, number]
  weight: number
}

export interface PricingAdjustment {
  type: 'percentage' | 'fixed_amount' | 'multiplier' | 'set_price'
  value: number
  minPrice?: number
  maxPrice?: number
  currency: string
}

export interface DynamicPriceRequest {
  propertyId: string
  roomTypeId: string
  checkInDate: Date
  checkOutDate: Date
  guestCount: number
  requestedAt: Date
  channelId?: string
  advanceBookingDays: number
  lengthOfStay: number
}

export interface PriceCalculationResult {
  basePrice: number
  finalPrice: number
  currency: string
  appliedRules: Array<{
    ruleId: string
    ruleName: string
    adjustment: number
    reason: string
  }>
  confidence: number
  metadata: {
    calculatedAt: Date
    validUntil: Date
    factors: PricingFactors
    alternatives?: AlternativePricing[]
  }
}

export interface PricingFactors {
  occupancyRate: number
  demandScore: number
  seasonalMultiplier: number
  competitorIndex: number
  eventImpact: number
  weatherScore: number
  bookingWindow: number
  lengthOfStayBonus: number
}

export interface AlternativePricing {
  checkInDate: Date
  checkOutDate: Date
  price: number
  savings: number
  reason: string
}

export interface MarketData {
  propertyId: string
  date: Date
  occupancyRate: number
  averageDailyRate: number
  revenuePAR: number
  bookingCount: number
  cancellationRate: number
  noShowRate: number
  walkInRate: number
  repeatGuestRate: number
  channelMix: Record<string, number>
  marketSegmentMix: Record<string, number>
}

export interface SeasonalPattern {
  id: string
  name: string
  propertyId: string
  startDate: string // MM-DD format
  endDate: string
  multiplier: number
  description: string
  year?: number
  isRecurring: boolean
}

export interface EventImpact {
  id: string
  name: string
  location: string
  startDate: Date
  endDate: Date
  category: 'conference' | 'concert' | 'sports' | 'festival' | 'trade_show' | 'other'
  expectedAttendees: number
  impactRadius: number // km
  demandMultiplier: number
  confidence: number
}

class DynamicPricingService {
  private pricingRules: Map<string, PricingRule> = new Map()
  private marketData: Map<string, MarketData[]> = new Map()
  private seasonalPatterns: Map<string, SeasonalPattern[]> = new Map()
  private eventImpacts: Map<string, EventImpact[]> = new Map()
  private priceCache: Map<string, PriceCalculationResult> = new Map()

  constructor() {
    this.initializeDefaultRules()
    this.startPriceUpdater()
  }

  /**
   * Calculate dynamic price for a booking request
   */
  async calculatePrice(request: DynamicPriceRequest): Promise<PriceCalculationResult> {
    try {
      // Check cache first
      const cacheKey = this.generateCacheKey(request)
      const cached = this.priceCache.get(cacheKey)

      if (cached && cached.metadata.validUntil > new Date()) {
        return cached
      }

      // Get base price
      const basePrice = await this.getBasePrice(request.propertyId, request.roomTypeId)

      // Calculate pricing factors
      const factors = await this.calculatePricingFactors(request)

      // Apply pricing rules
      const { finalPrice, appliedRules } = await this.applyPricingRules(basePrice, request, factors)

      // Calculate confidence score
      const confidence = this.calculateConfidence(factors, appliedRules)

      // Generate alternative pricing suggestions
      const alternatives = await this.generateAlternativePricing(request, finalPrice)

      const result: PriceCalculationResult = {
        basePrice,
        finalPrice: Math.max(finalPrice, basePrice * 0.5), // Minimum 50% of base price
        currency: 'USD',
        appliedRules,
        confidence,
        metadata: {
          calculatedAt: new Date(),
          validUntil: new Date(Date.now() + 15 * 60 * 1000), // Valid for 15 minutes
          factors,
          alternatives
        }
      }

      // Cache the result
      this.priceCache.set(cacheKey, result)

      // Log pricing calculation
      await auditLogger.logUserAction({
        userId: 'system',
        action: 'price_calculated',
        resource: 'dynamic_pricing',
        resourceId: request.propertyId,
        ip: 'system',
        userAgent: 'pricing-service',
        details: {
          basePrice,
          finalPrice: result.finalPrice,
          rulesApplied: appliedRules.length,
          confidence
        }
      })

      return result
    } catch (error) {
      console.error('Dynamic pricing calculation failed:', error)

      // Return base price as fallback
      const basePrice = await this.getBasePrice(request.propertyId, request.roomTypeId)
      return {
        basePrice,
        finalPrice: basePrice,
        currency: 'USD',
        appliedRules: [],
        confidence: 0,
        metadata: {
          calculatedAt: new Date(),
          validUntil: new Date(Date.now() + 5 * 60 * 1000),
          factors: {} as PricingFactors
        }
      }
    }
  }

  /**
   * Create or update pricing rule
   */
  async createPricingRule(rule: Omit<PricingRule, 'id' | 'createdAt'>): Promise<PricingRule> {
    const fullRule: PricingRule = {
      ...rule,
      id: `rule_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      createdAt: new Date()
    }

    this.pricingRules.set(fullRule.id, fullRule)

    await auditLogger.logUserAction({
      userId: rule.createdBy,
      action: 'pricing_rule_created',
      resource: 'pricing_rule',
      resourceId: fullRule.id,
      ip: 'system',
      userAgent: 'pricing-service',
      details: {
        ruleName: rule.name,
        priority: rule.priority,
        properties: rule.properties
      }
    })

    return fullRule
  }

  /**
   * Get pricing recommendations for a property
   */
  async getPricingRecommendations(propertyId: string, dateRange: { start: Date, end: Date }): Promise<Array<{
    date: Date
    currentPrice: number
    recommendedPrice: number
    expectedRevenue: number
    confidence: number
    factors: string[]
  }>> {
    const recommendations = []
    const current = new Date(dateRange.start)

    while (current <= dateRange.end) {
      try {
        const request: DynamicPriceRequest = {
          propertyId,
          roomTypeId: 'standard', // Default room type
          checkInDate: current,
          checkOutDate: new Date(current.getTime() + 24 * 60 * 60 * 1000),
          guestCount: 2,
          requestedAt: new Date(),
          advanceBookingDays: Math.ceil((current.getTime() - Date.now()) / (24 * 60 * 60 * 1000)),
          lengthOfStay: 1
        }

        const pricing = await this.calculatePrice(request)
        const currentPrice = await this.getCurrentPrice(propertyId, 'standard', current)

        recommendations.push({
          date: new Date(current),
          currentPrice,
          recommendedPrice: pricing.finalPrice,
          expectedRevenue: pricing.finalPrice * await this.estimateOccupancy(propertyId, current),
          confidence: pricing.confidence,
          factors: pricing.appliedRules.map(rule => rule.reason)
        })
      } catch (error) {
        console.error(`Failed to get recommendation for ${current}:`, error)
      }

      current.setDate(current.getDate() + 1)
    }

    return recommendations
  }

  /**
   * Calculate pricing factors
   */
  private async calculatePricingFactors(request: DynamicPriceRequest): Promise<PricingFactors> {
    const occupancyRate = await this.getOccupancyRate(request.propertyId, request.checkInDate)
    const demandScore = await this.calculateDemandScore(request)
    const seasonalMultiplier = await this.getSeasonalMultiplier(request.propertyId, request.checkInDate)
    const competitorIndex = await this.getCompetitorIndex(request.propertyId, request.checkInDate)
    const eventImpact = await this.getEventImpact(request.propertyId, request.checkInDate)
    const weatherScore = await this.getWeatherScore(request.propertyId, request.checkInDate)
    const bookingWindow = this.calculateBookingWindowScore(request.advanceBookingDays)
    const lengthOfStayBonus = this.calculateLengthOfStayBonus(request.lengthOfStay)

    return {
      occupancyRate,
      demandScore,
      seasonalMultiplier,
      competitorIndex,
      eventImpact,
      weatherScore,
      bookingWindow,
      lengthOfStayBonus
    }
  }

  /**
   * Apply pricing rules to calculate final price
   */
  private async applyPricingRules(
    basePrice: number,
    request: DynamicPriceRequest,
    factors: PricingFactors
  ): Promise<{ finalPrice: number, appliedRules: Array<{ ruleId: string, ruleName: string, adjustment: number, reason: string }> }> {
    let currentPrice = basePrice
    const appliedRules = []

    // Get applicable rules sorted by priority
    const applicableRules = Array.from(this.pricingRules.values())
      .filter(rule => this.isRuleApplicable(rule, request))
      .sort((a, b) => b.priority - a.priority)

    for (const rule of applicableRules) {
      const conditionsMet = await this.evaluateConditions(rule.conditions, request, factors)

      if (conditionsMet) {
        for (const adjustment of rule.adjustments) {
          const adjustmentAmount = this.calculateAdjustment(currentPrice, adjustment)
          currentPrice += adjustmentAmount

          appliedRules.push({
            ruleId: rule.id,
            ruleName: rule.name,
            adjustment: adjustmentAmount,
            reason: rule.description
          })

          // Apply min/max constraints
          if (adjustment.minPrice && currentPrice < adjustment.minPrice) {
            currentPrice = adjustment.minPrice
          }
          if (adjustment.maxPrice && currentPrice > adjustment.maxPrice) {
            currentPrice = adjustment.maxPrice
          }
        }
      }
    }

    return {
      finalPrice: Math.round(currentPrice * 100) / 100, // Round to 2 decimal places
      appliedRules
    }
  }

  /**
   * Check if a pricing rule is applicable
   */
  private isRuleApplicable(rule: PricingRule, request: DynamicPriceRequest): boolean {
    if (!rule.isActive) return false

    const now = new Date()
    if (rule.validFrom > now) return false
    if (rule.validTo && rule.validTo < now) return false

    if (rule.properties.length > 0 && !rule.properties.includes(request.propertyId)) return false
    if (rule.roomTypes.length > 0 && !rule.roomTypes.includes(request.roomTypeId)) return false

    if (rule.dayOfWeek) {
      const dayOfWeek = request.checkInDate.getDay()
      if (!rule.dayOfWeek.includes(dayOfWeek)) return false
    }

    if (rule.minAdvanceBooking && request.advanceBookingDays < rule.minAdvanceBooking) return false
    if (rule.maxAdvanceBooking && request.advanceBookingDays > rule.maxAdvanceBooking) return false

    return true
  }

  /**
   * Evaluate pricing conditions
   */
  private async evaluateConditions(
    conditions: PricingCondition[],
    request: DynamicPriceRequest,
    factors: PricingFactors
  ): Promise<boolean> {
    if (conditions.length === 0) return true

    for (const condition of conditions) {
      const conditionValue = await this.getConditionValue(condition.type, request, factors)

      if (!this.evaluateCondition(condition, conditionValue)) {
        return false
      }
    }

    return true
  }

  /**
   * Get value for a specific condition type
   */
  private async getConditionValue(
    type: PricingCondition['type'],
    request: DynamicPriceRequest,
    factors: PricingFactors
  ): Promise<number> {
    switch (type) {
      case 'occupancy':
        return factors.occupancyRate
      case 'demand':
        return factors.demandScore
      case 'season':
        return factors.seasonalMultiplier
      case 'event':
        return factors.eventImpact
      case 'weather':
        return factors.weatherScore
      case 'competitor':
        return factors.competitorIndex
      case 'inventory':
        return await this.getAvailableInventory(request.propertyId, request.roomTypeId, request.checkInDate)
      case 'booking_window':
        return request.advanceBookingDays
      default:
        return 0
    }
  }

  /**
   * Evaluate a single condition
   */
  private evaluateCondition(condition: PricingCondition, value: number): boolean {
    switch (condition.operator) {
      case 'gt':
        return value > (condition.value as number)
      case 'gte':
        return value >= (condition.value as number)
      case 'lt':
        return value < (condition.value as number)
      case 'lte':
        return value <= (condition.value as number)
      case 'eq':
        return value === (condition.value as number)
      case 'between':
        const [min, max] = condition.value as [number, number]
        return value >= min && value <= max
      default:
        return false
    }
  }

  /**
   * Calculate adjustment amount
   */
  private calculateAdjustment(currentPrice: number, adjustment: PricingAdjustment): number {
    switch (adjustment.type) {
      case 'percentage':
        return currentPrice * (adjustment.value / 100)
      case 'fixed_amount':
        return adjustment.value
      case 'multiplier':
        return currentPrice * adjustment.value - currentPrice
      case 'set_price':
        return adjustment.value - currentPrice
      default:
        return 0
    }
  }

  /**
   * Calculate confidence score based on factors and rules
   */
  private calculateConfidence(factors: PricingFactors, appliedRules: any[]): number {
    let confidence = 0.5 // Base confidence

    // Higher confidence with more data points
    if (factors.occupancyRate > 0) confidence += 0.1
    if (factors.demandScore > 0) confidence += 0.1
    if (factors.competitorIndex > 0) confidence += 0.15
    if (factors.eventImpact > 0) confidence += 0.1

    // Higher confidence with more rules applied
    confidence += Math.min(appliedRules.length * 0.05, 0.15)

    return Math.min(confidence, 1.0)
  }

  /**
   * Generate alternative pricing suggestions
   */
  private async generateAlternativePricing(
    request: DynamicPriceRequest,
    currentPrice: number
  ): Promise<AlternativePricing[]> {
    const alternatives: AlternativePricing[] = []

    // Check nearby dates for better pricing
    for (let offset = -2; offset <= 2; offset++) {
      if (offset === 0) continue

      const altCheckIn = new Date(request.checkInDate)
      altCheckIn.setDate(altCheckIn.getDate() + offset)

      const altCheckOut = new Date(request.checkOutDate)
      altCheckOut.setDate(altCheckOut.getDate() + offset)

      try {
        const altRequest = { ...request, checkInDate: altCheckIn, checkOutDate: altCheckOut }
        const altPricing = await this.calculatePrice(altRequest)

        if (altPricing.finalPrice < currentPrice) {
          alternatives.push({
            checkInDate: altCheckIn,
            checkOutDate: altCheckOut,
            price: altPricing.finalPrice,
            savings: currentPrice - altPricing.finalPrice,
            reason: `${Math.abs(offset)} day${Math.abs(offset) > 1 ? 's' : ''} ${offset > 0 ? 'later' : 'earlier'}`
          })
        }
      } catch (error) {
        // Skip this alternative if calculation fails
      }
    }

    return alternatives.sort((a, b) => b.savings - a.savings).slice(0, 3)
  }

  // Helper methods for data retrieval

  private async getBasePrice(propertyId: string, roomTypeId: string): Promise<number> {
    // Mock base price - in production, would query database
    const basePrices: Record<string, number> = {
      'standard': 150,
      'deluxe': 220,
      'suite': 350,
      'presidential': 750
    }
    return basePrices[roomTypeId] || 150
  }

  private async getOccupancyRate(propertyId: string, date: Date): Promise<number> {
    // Mock occupancy rate - in production, would calculate from bookings
    const dayOfWeek = date.getDay()
    const baseOccupancy = dayOfWeek >= 1 && dayOfWeek <= 4 ? 0.65 : 0.85 // Higher on weekends
    return baseOccupancy + (Math.random() - 0.5) * 0.2
  }

  private async calculateDemandScore(request: DynamicPriceRequest): Promise<number> {
    // Mock demand calculation based on historical booking patterns
    const bookingWindow = request.advanceBookingDays
    let score = 0.5

    // Higher demand for shorter booking windows
    if (bookingWindow < 7) score += 0.3
    else if (bookingWindow < 14) score += 0.2
    else if (bookingWindow < 30) score += 0.1

    // Seasonal adjustments
    const month = request.checkInDate.getMonth()
    if ([5, 6, 7, 11].includes(month)) score += 0.2 // Summer and December

    return Math.min(score, 1.0)
  }

  private async getSeasonalMultiplier(propertyId: string, date: Date): Promise<number> {
    const patterns = this.seasonalPatterns.get(propertyId) || []
    const dateStr = `${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`

    for (const pattern of patterns) {
      if (this.isDateInRange(dateStr, pattern.startDate, pattern.endDate)) {
        return pattern.multiplier
      }
    }

    return 1.0 // No seasonal adjustment
  }

  private async getCompetitorIndex(propertyId: string, date: Date): Promise<number> {
    // Mock competitor pricing index - in production, would use actual competitor data
    return 0.95 + Math.random() * 0.1 // Slightly below to above market average
  }

  private async getEventImpact(propertyId: string, date: Date): Promise<number> {
    const events = this.eventImpacts.get(propertyId) || []

    for (const event of events) {
      if (date >= event.startDate && date <= event.endDate) {
        return event.demandMultiplier
      }
    }

    return 1.0 // No event impact
  }

  private async getWeatherScore(propertyId: string, date: Date): Promise<number> {
    // Mock weather impact - in production, would use weather API
    return 0.9 + Math.random() * 0.2 // Weather slightly impacts demand
  }

  private calculateBookingWindowScore(advanceDays: number): number {
    // Higher scores for last-minute or optimal advance bookings
    if (advanceDays <= 3) return 1.2 // Last minute premium
    if (advanceDays <= 7) return 1.1
    if (advanceDays >= 14 && advanceDays <= 21) return 1.05 // Sweet spot
    return 1.0
  }

  private calculateLengthOfStayBonus(lengthOfStay: number): number {
    // Longer stays get slight discounts
    if (lengthOfStay >= 7) return 0.9 // 10% discount for week+
    if (lengthOfStay >= 3) return 0.95 // 5% discount for 3+ nights
    return 1.0
  }

  private async getAvailableInventory(propertyId: string, roomTypeId: string, date: Date): Promise<number> {
    // Mock inventory - in production, would query actual availability
    return Math.floor(Math.random() * 20) + 5 // 5-25 rooms available
  }

  private async getCurrentPrice(propertyId: string, roomTypeId: string, date: Date): Promise<number> {
    // Mock current price - in production, would query current rates
    return await this.getBasePrice(propertyId, roomTypeId)
  }

  private async estimateOccupancy(propertyId: string, date: Date): Promise<number> {
    // Mock occupancy estimation
    return await this.getOccupancyRate(propertyId, date)
  }

  private isDateInRange(dateStr: string, startStr: string, endStr: string): boolean {
    // Simple date range check for MM-DD format
    return dateStr >= startStr && dateStr <= endStr
  }

  private generateCacheKey(request: DynamicPriceRequest): string {
    return `${request.propertyId}-${request.roomTypeId}-${request.checkInDate.toISOString().split('T')[0]}-${request.guestCount}`
  }

  /**
   * Initialize default pricing rules
   */
  private initializeDefaultRules(): void {
    const defaultRules: Array<Omit<PricingRule, 'id' | 'createdAt'>> = [
      {
        name: 'High Occupancy Premium',
        description: 'Increase price when occupancy is above 80%',
        priority: 100,
        isActive: true,
        conditions: [
          { type: 'occupancy', operator: 'gt', value: 0.8, weight: 1.0 }
        ],
        adjustments: [
          { type: 'percentage', value: 15, currency: 'USD' }
        ],
        validFrom: new Date(),
        roomTypes: [],
        properties: [],
        createdBy: 'system'
      },
      {
        name: 'Last Minute Booking Premium',
        description: 'Premium for bookings within 48 hours',
        priority: 90,
        isActive: true,
        conditions: [
          { type: 'booking_window', operator: 'lte', value: 2, weight: 1.0 }
        ],
        adjustments: [
          { type: 'percentage', value: 20, currency: 'USD' }
        ],
        validFrom: new Date(),
        roomTypes: [],
        properties: [],
        createdBy: 'system'
      },
      {
        name: 'Weekend Premium',
        description: 'Premium pricing for weekend stays',
        priority: 80,
        isActive: true,
        conditions: [],
        adjustments: [
          { type: 'percentage', value: 25, currency: 'USD' }
        ],
        validFrom: new Date(),
        dayOfWeek: [5, 6], // Friday, Saturday
        roomTypes: [],
        properties: [],
        createdBy: 'system'
      },
      {
        name: 'Extended Stay Discount',
        description: 'Discount for stays of 7+ nights',
        priority: 70,
        isActive: true,
        conditions: [],
        adjustments: [
          { type: 'percentage', value: -10, currency: 'USD' }
        ],
        validFrom: new Date(),
        roomTypes: [],
        properties: [],
        createdBy: 'system'
      }
    ]

    defaultRules.forEach(rule => {
      const fullRule: PricingRule = {
        ...rule,
        id: `default_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
        createdAt: new Date()
      }
      this.pricingRules.set(fullRule.id, fullRule)
    })

    // Initialize seasonal patterns
    this.initializeSeasonalPatterns()
  }

  private initializeSeasonalPatterns(): void {
    const patterns: SeasonalPattern[] = [
      {
        id: 'summer_peak',
        name: 'Summer Peak Season',
        propertyId: 'all',
        startDate: '06-01',
        endDate: '08-31',
        multiplier: 1.3,
        description: 'Summer vacation period',
        isRecurring: true
      },
      {
        id: 'winter_holidays',
        name: 'Winter Holiday Season',
        propertyId: 'all',
        startDate: '12-15',
        endDate: '01-15',
        multiplier: 1.4,
        description: 'Christmas and New Year period',
        isRecurring: true
      },
      {
        id: 'spring_break',
        name: 'Spring Break',
        propertyId: 'all',
        startDate: '03-15',
        endDate: '04-15',
        multiplier: 1.2,
        description: 'Spring break period',
        isRecurring: true
      }
    ]

    this.seasonalPatterns.set('all', patterns)
  }

  /**
   * Start periodic price cache updates
   */
  private startPriceUpdater(): void {
    // Clear cache every 10 minutes
    setInterval(() => {
      const now = new Date()
      for (const [key, result] of this.priceCache.entries()) {
        if (result.metadata.validUntil <= now) {
          this.priceCache.delete(key)
        }
      }
    }, 10 * 60 * 1000)
  }
}

export const dynamicPricingService = new DynamicPricingService()

// Convenience functions
export const calculatePrice = (request: DynamicPriceRequest) =>
  dynamicPricingService.calculatePrice(request)

export const createPricingRule = (rule: any) =>
  dynamicPricingService.createPricingRule(rule)

export const getPricingRecommendations = (propertyId: string, dateRange: any) =>
  dynamicPricingService.getPricingRecommendations(propertyId, dateRange)