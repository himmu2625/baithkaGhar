export interface YieldMetrics {
  occupancyRate: number
  averageDailyRate: number
  revPAR: number
  totalRevenue: number
  availableRooms: number
  soldRooms: number
  noShows: number
  cancellations: number
  walkIns: number
  upgrades: number
  downgrades: number
}

export interface YieldStrategy {
  id: string
  name: string
  description: string
  conditions: YieldCondition[]
  actions: YieldAction[]
  priority: number
  active: boolean
  validFrom: Date
  validTo: Date
}

export interface YieldCondition {
  type: 'occupancy' | 'lead_time' | 'day_of_week' | 'season' | 'event' | 'competitor_rate' | 'booking_pace'
  operator: 'gt' | 'gte' | 'lt' | 'lte' | 'eq' | 'between' | 'in'
  value: any
  weight: number
}

export interface YieldAction {
  type: 'adjust_rate' | 'close_room_type' | 'open_room_type' | 'set_minimum_stay' | 'remove_restrictions' | 'upgrade_offer'
  parameters: {
    roomTypeId?: string
    adjustment?: number
    adjustmentType?: 'percentage' | 'fixed'
    minimumStay?: number
    upgradeIncentive?: number
    maxAdjustment?: number
  }
  executeAt: 'immediate' | 'daily' | 'hourly'
}

export interface YieldOpportunity {
  type: 'rate_increase' | 'inventory_control' | 'length_of_stay' | 'upgrade_revenue' | 'overbooking'
  description: string
  impact: 'high' | 'medium' | 'low'
  revenue_potential: number
  risk_level: 'low' | 'medium' | 'high'
  action_required: string
  deadline?: Date
  confidence: number
}

export interface BookingPace {
  date: Date
  daysOut: number
  bookingsToDate: number
  historicalAverage: number
  paceVariance: number
  trend: 'ahead' | 'behind' | 'on_pace'
}

export interface RevenueOptimization {
  currentRevenue: number
  optimizedRevenue: number
  uplift: number
  uplifPercent: number
  strategies: YieldStrategy[]
  forecast: {
    occupancy: number
    adr: number
    revpar: number
  }
  risks: {
    demandDestruction: number
    competitiveLoss: number
    brandImpact: number
  }
}

export interface OverbookingRecommendation {
  roomTypeId: string
  currentInventory: number
  recommendedOverbooking: number
  expectedNoShows: number
  expectedCancellations: number
  riskAssessment: {
    walkProbability: number
    walkCost: number
    revenueUpside: number
    netBenefit: number
  }
}

export interface SegmentPerformance {
  segment: string
  bookings: number
  revenue: number
  adr: number
  leadTime: number
  cancellationRate: number
  noShowRate: number
  profitability: number
  growthRate: number
}

export interface YieldDashboard {
  date: Date
  metrics: YieldMetrics
  pace: BookingPace[]
  opportunities: YieldOpportunity[]
  activeStrategies: YieldStrategy[]
  segmentPerformance: SegmentPerformance[]
  overbookingRecommendations: OverbookingRecommendation[]
  alerts: YieldAlert[]
}

export interface YieldAlert {
  type: 'pace_behind' | 'rate_opportunity' | 'inventory_shortage' | 'competitor_action' | 'demand_spike'
  severity: 'critical' | 'warning' | 'info'
  message: string
  date: Date
  actionRequired: boolean
  suggestedActions: string[]
}

export class YieldManagementService {
  private strategies = new Map<string, YieldStrategy>()
  private cache = new Map<string, YieldDashboard>()
  private automationInterval?: NodeJS.Timeout

  constructor() {
    this.initializeDefaultStrategies()
  }

  async analyzeYieldOpportunities(propertyId: string, date: Date = new Date()): Promise<YieldDashboard> {
    const cacheKey = `${propertyId}:${date.toDateString()}`
    const cached = this.cache.get(cacheKey)

    if (cached && this.isCacheValid(cached.date)) {
      return cached
    }

    const metrics = await this.calculateYieldMetrics(propertyId, date)
    const pace = await this.analyzBookingPace(propertyId, date)
    const opportunities = await this.identifyOpportunities(propertyId, metrics, pace)
    const activeStrategies = Array.from(this.strategies.values()).filter(s =>
      s.active && date >= s.validFrom && date <= s.validTo
    )
    const segmentPerformance = await this.analyzeSegmentPerformance(propertyId, date)
    const overbookingRecommendations = await this.calculateOverbookingStrategy(propertyId, date)
    const alerts = this.generateYieldAlerts(metrics, pace, opportunities)

    const dashboard: YieldDashboard = {
      date,
      metrics,
      pace,
      opportunities,
      activeStrategies,
      segmentPerformance,
      overbookingRecommendations,
      alerts
    }

    this.cache.set(cacheKey, dashboard)
    return dashboard
  }

  private async calculateYieldMetrics(propertyId: string, date: Date): Promise<YieldMetrics> {
    try {
      const response = await fetch(`/api/os/properties/${propertyId}/yield-metrics`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: date.toISOString() })
      })

      if (!response.ok) {
        throw new Error('Failed to fetch yield metrics')
      }

      return await response.json()
    } catch (error) {
      return this.generateMockMetrics()
    }
  }

  private generateMockMetrics(): YieldMetrics {
    return {
      occupancyRate: 0.75 + (Math.random() * 0.2),
      averageDailyRate: 150 + (Math.random() * 50),
      revPAR: 0,
      totalRevenue: 0,
      availableRooms: 100,
      soldRooms: 75,
      noShows: 3,
      cancellations: 5,
      walkIns: 2,
      upgrades: 4,
      downgrades: 1
    }
  }

  private async analyzBookingPace(propertyId: string, targetDate: Date): Promise<BookingPace[]> {
    const pace: BookingPace[] = []
    const daysOut = [1, 7, 14, 30, 60, 90]

    for (const days of daysOut) {
      const bookingDate = new Date(targetDate)
      bookingDate.setDate(bookingDate.getDate() - days)

      const bookingsToDate = await this.getBookingsToDate(propertyId, targetDate, bookingDate)
      const historicalAverage = await this.getHistoricalBookingPace(propertyId, targetDate, days)
      const paceVariance = ((bookingsToDate - historicalAverage) / historicalAverage) * 100

      let trend: 'ahead' | 'behind' | 'on_pace'
      if (paceVariance > 5) trend = 'ahead'
      else if (paceVariance < -5) trend = 'behind'
      else trend = 'on_pace'

      pace.push({
        date: targetDate,
        daysOut: days,
        bookingsToDate,
        historicalAverage,
        paceVariance,
        trend
      })
    }

    return pace
  }

  private async getBookingsToDate(propertyId: string, targetDate: Date, asOfDate: Date): Promise<number> {
    return Math.floor(10 + Math.random() * 20)
  }

  private async getHistoricalBookingPace(propertyId: string, targetDate: Date, daysOut: number): Promise<number> {
    return Math.floor(8 + Math.random() * 15)
  }

  private async identifyOpportunities(
    propertyId: string,
    metrics: YieldMetrics,
    pace: BookingPace[]
  ): Promise<YieldOpportunity[]> {
    const opportunities: YieldOpportunity[] = []

    if (metrics.occupancyRate > 0.9 && metrics.averageDailyRate < 200) {
      opportunities.push({
        type: 'rate_increase',
        description: 'High occupancy with rate increase opportunity',
        impact: 'high',
        revenue_potential: (metrics.soldRooms * 25),
        risk_level: 'low',
        action_required: 'Increase rates by 10-15% for remaining inventory',
        confidence: 0.85
      })
    }

    if (metrics.occupancyRate < 0.6) {
      const behindPace = pace.find(p => p.trend === 'behind' && p.daysOut <= 14)
      if (behindPace) {
        opportunities.push({
          type: 'rate_increase',
          description: 'Low occupancy with booking pace behind - stimulate demand',
          impact: 'medium',
          revenue_potential: (metrics.availableRooms - metrics.soldRooms) * 30,
          risk_level: 'medium',
          action_required: 'Implement promotional pricing or packages',
          confidence: 0.7
        })
      }
    }

    if (metrics.upgrades < metrics.soldRooms * 0.1) {
      opportunities.push({
        type: 'upgrade_revenue',
        description: 'Low upgrade penetration - revenue opportunity',
        impact: 'medium',
        revenue_potential: metrics.soldRooms * 25,
        risk_level: 'low',
        action_required: 'Implement targeted upgrade offers',
        confidence: 0.75
      })
    }

    const aheadPace = pace.find(p => p.trend === 'ahead' && p.paceVariance > 15)
    if (aheadPace && metrics.occupancyRate > 0.8) {
      opportunities.push({
        type: 'inventory_control',
        description: 'Strong pace ahead - control inventory for rate optimization',
        impact: 'high',
        revenue_potential: metrics.soldRooms * 15,
        risk_level: 'medium',
        action_required: 'Close lower rate channels and implement minimum stay',
        confidence: 0.8
      })
    }

    return opportunities
  }

  private async analyzeSegmentPerformance(propertyId: string, date: Date): Promise<SegmentPerformance[]> {
    const segments = ['Corporate', 'Leisure', 'Group', 'Government', 'Online Travel Agent']

    return segments.map(segment => ({
      segment,
      bookings: Math.floor(5 + Math.random() * 25),
      revenue: Math.floor(1000 + Math.random() * 5000),
      adr: Math.floor(120 + Math.random() * 80),
      leadTime: Math.floor(5 + Math.random() * 25),
      cancellationRate: Math.random() * 0.15,
      noShowRate: Math.random() * 0.05,
      profitability: Math.random() * 0.4 + 0.6,
      growthRate: (Math.random() - 0.5) * 0.3
    }))
  }

  private async calculateOverbookingStrategy(
    propertyId: string,
    date: Date
  ): Promise<OverbookingRecommendation[]> {
    const roomTypes = await this.getRoomTypes(propertyId)
    const recommendations: OverbookingRecommendation[] = []

    for (const roomType of roomTypes) {
      const historicalNoShows = await this.getHistoricalNoShows(propertyId, roomType.id, date)
      const historicalCancellations = await this.getHistoricalCancellations(propertyId, roomType.id, date)

      const expectedNoShows = historicalNoShows * 0.8
      const expectedCancellations = historicalCancellations * 0.9
      const recommendedOverbooking = Math.floor(expectedNoShows + expectedCancellations)

      const walkCost = 200
      const averageRate = 150
      const walkProbability = Math.max(0, (recommendedOverbooking - expectedNoShows - expectedCancellations) / roomType.inventory)

      recommendations.push({
        roomTypeId: roomType.id,
        currentInventory: roomType.inventory,
        recommendedOverbooking,
        expectedNoShows,
        expectedCancellations,
        riskAssessment: {
          walkProbability,
          walkCost,
          revenueUpside: recommendedOverbooking * averageRate,
          netBenefit: (recommendedOverbooking * averageRate) - (walkProbability * walkCost * recommendedOverbooking)
        }
      })
    }

    return recommendations
  }

  private async getRoomTypes(propertyId: string): Promise<any[]> {
    return [
      { id: 'standard', name: 'Standard Room', inventory: 50 },
      { id: 'deluxe', name: 'Deluxe Room', inventory: 30 },
      { id: 'suite', name: 'Suite', inventory: 20 }
    ]
  }

  private async getHistoricalNoShows(propertyId: string, roomTypeId: string, date: Date): Promise<number> {
    return Math.floor(1 + Math.random() * 3)
  }

  private async getHistoricalCancellations(propertyId: string, roomTypeId: string, date: Date): Promise<number> {
    return Math.floor(2 + Math.random() * 4)
  }

  private generateYieldAlerts(
    metrics: YieldMetrics,
    pace: BookingPace[],
    opportunities: YieldOpportunity[]
  ): YieldAlert[] {
    const alerts: YieldAlert[] = []

    const criticalPace = pace.find(p => p.trend === 'behind' && p.paceVariance < -20 && p.daysOut <= 7)
    if (criticalPace) {
      alerts.push({
        type: 'pace_behind',
        severity: 'critical',
        message: `Booking pace ${Math.abs(criticalPace.paceVariance).toFixed(1)}% behind historical average`,
        date: new Date(),
        actionRequired: true,
        suggestedActions: ['Launch promotional campaign', 'Reduce rates', 'Increase marketing spend']
      })
    }

    if (metrics.occupancyRate > 0.95) {
      alerts.push({
        type: 'inventory_shortage',
        severity: 'warning',
        message: 'Very high occupancy - potential revenue loss due to inventory constraints',
        date: new Date(),
        actionRequired: true,
        suggestedActions: ['Increase rates', 'Implement overbooking strategy', 'Close discount channels']
      })
    }

    const highImpactOpportunities = opportunities.filter(o => o.impact === 'high')
    if (highImpactOpportunities.length > 0) {
      alerts.push({
        type: 'rate_opportunity',
        severity: 'info',
        message: `${highImpactOpportunities.length} high-impact revenue opportunities identified`,
        date: new Date(),
        actionRequired: false,
        suggestedActions: highImpactOpportunities.map(o => o.action_required)
      })
    }

    return alerts
  }

  async optimizeRevenue(propertyId: string, date: Date): Promise<RevenueOptimization> {
    const currentMetrics = await this.calculateYieldMetrics(propertyId, date)
    const currentRevenue = currentMetrics.soldRooms * currentMetrics.averageDailyRate

    const applicableStrategies = await this.getApplicableStrategies(propertyId, date, currentMetrics)
    const optimizedMetrics = await this.simulateStrategyImpact(currentMetrics, applicableStrategies)
    const optimizedRevenue = optimizedMetrics.soldRooms * optimizedMetrics.averageDailyRate

    return {
      currentRevenue,
      optimizedRevenue,
      uplift: optimizedRevenue - currentRevenue,
      uplifPercent: ((optimizedRevenue - currentRevenue) / currentRevenue) * 100,
      strategies: applicableStrategies,
      forecast: {
        occupancy: optimizedMetrics.occupancyRate,
        adr: optimizedMetrics.averageDailyRate,
        revpar: optimizedMetrics.occupancyRate * optimizedMetrics.averageDailyRate
      },
      risks: {
        demandDestruction: 0.1,
        competitiveLoss: 0.05,
        brandImpact: 0.02
      }
    }
  }

  private async getApplicableStrategies(
    propertyId: string,
    date: Date,
    metrics: YieldMetrics
  ): Promise<YieldStrategy[]> {
    const applicable: YieldStrategy[] = []

    for (const strategy of this.strategies.values()) {
      if (!strategy.active || date < strategy.validFrom || date > strategy.validTo) {
        continue
      }

      const conditionsMet = await this.evaluateConditions(strategy.conditions, propertyId, date, metrics)
      if (conditionsMet) {
        applicable.push(strategy)
      }
    }

    return applicable.sort((a, b) => b.priority - a.priority)
  }

  private async evaluateConditions(
    conditions: YieldCondition[],
    propertyId: string,
    date: Date,
    metrics: YieldMetrics
  ): Promise<boolean> {
    for (const condition of conditions) {
      const met = await this.evaluateCondition(condition, propertyId, date, metrics)
      if (!met) return false
    }
    return true
  }

  private async evaluateCondition(
    condition: YieldCondition,
    propertyId: string,
    date: Date,
    metrics: YieldMetrics
  ): Promise<boolean> {
    let actualValue: any

    switch (condition.type) {
      case 'occupancy':
        actualValue = metrics.occupancyRate
        break
      case 'day_of_week':
        actualValue = date.getDay()
        break
      case 'lead_time':
        actualValue = this.calculateLeadTime(date)
        break
      default:
        return true
    }

    return this.compareValues(actualValue, condition.operator, condition.value)
  }

  private compareValues(actual: any, operator: string, expected: any): boolean {
    switch (operator) {
      case 'gt': return actual > expected
      case 'gte': return actual >= expected
      case 'lt': return actual < expected
      case 'lte': return actual <= expected
      case 'eq': return actual === expected
      case 'between': return actual >= expected[0] && actual <= expected[1]
      case 'in': return Array.isArray(expected) && expected.includes(actual)
      default: return false
    }
  }

  private calculateLeadTime(date: Date): number {
    const today = new Date()
    return Math.ceil((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  }

  private async simulateStrategyImpact(
    currentMetrics: YieldMetrics,
    strategies: YieldStrategy[]
  ): Promise<YieldMetrics> {
    let optimizedMetrics = { ...currentMetrics }

    for (const strategy of strategies) {
      for (const action of strategy.actions) {
        optimizedMetrics = await this.applyActionSimulation(optimizedMetrics, action)
      }
    }

    optimizedMetrics.revPAR = optimizedMetrics.occupancyRate * optimizedMetrics.averageDailyRate
    optimizedMetrics.totalRevenue = optimizedMetrics.soldRooms * optimizedMetrics.averageDailyRate

    return optimizedMetrics
  }

  private async applyActionSimulation(metrics: YieldMetrics, action: YieldAction): Promise<YieldMetrics> {
    const result = { ...metrics }

    switch (action.type) {
      case 'adjust_rate':
        if (action.parameters.adjustment && action.parameters.adjustmentType) {
          const adjustment = action.parameters.adjustmentType === 'percentage'
            ? (action.parameters.adjustment / 100) * result.averageDailyRate
            : action.parameters.adjustment

          result.averageDailyRate += adjustment

          const demandElasticity = -1.2
          const priceChange = adjustment / metrics.averageDailyRate
          const demandChange = demandElasticity * priceChange
          result.occupancyRate = Math.max(0.1, Math.min(1.0, result.occupancyRate * (1 + demandChange)))
          result.soldRooms = Math.floor(result.availableRooms * result.occupancyRate)
        }
        break

      case 'set_minimum_stay':
        result.occupancyRate = Math.max(0.1, result.occupancyRate * 0.95)
        result.averageDailyRate *= 1.05
        result.soldRooms = Math.floor(result.availableRooms * result.occupancyRate)
        break
    }

    return result
  }

  async executeStrategy(propertyId: string, strategyId: string): Promise<boolean> {
    const strategy = this.strategies.get(strategyId)
    if (!strategy || !strategy.active) {
      throw new Error('Strategy not found or inactive')
    }

    try {
      for (const action of strategy.actions) {
        await this.executeAction(propertyId, action)
      }
      return true
    } catch (error) {
      console.error('Error executing strategy:', error)
      return false
    }
  }

  private async executeAction(propertyId: string, action: YieldAction): Promise<void> {
    const response = await fetch(`/api/os/properties/${propertyId}/yield-actions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action })
    })

    if (!response.ok) {
      throw new Error(`Failed to execute action: ${action.type}`)
    }
  }

  private initializeDefaultStrategies(): void {
    const strategies: YieldStrategy[] = [
      {
        id: 'high-occupancy-rate-increase',
        name: 'High Occupancy Rate Increase',
        description: 'Increase rates when occupancy exceeds 85%',
        conditions: [
          {
            type: 'occupancy',
            operator: 'gte',
            value: 0.85,
            weight: 1.0
          }
        ],
        actions: [
          {
            type: 'adjust_rate',
            parameters: {
              adjustment: 10,
              adjustmentType: 'percentage',
              maxAdjustment: 25
            },
            executeAt: 'immediate'
          }
        ],
        priority: 100,
        active: true,
        validFrom: new Date('2024-01-01'),
        validTo: new Date('2025-12-31')
      },
      {
        id: 'weekend-premium',
        name: 'Weekend Premium Pricing',
        description: 'Apply premium rates for Friday and Saturday nights',
        conditions: [
          {
            type: 'day_of_week',
            operator: 'in',
            value: [5, 6],
            weight: 1.0
          }
        ],
        actions: [
          {
            type: 'adjust_rate',
            parameters: {
              adjustment: 15,
              adjustmentType: 'percentage'
            },
            executeAt: 'daily'
          }
        ],
        priority: 80,
        active: true,
        validFrom: new Date('2024-01-01'),
        validTo: new Date('2025-12-31')
      }
    ]

    strategies.forEach(strategy => this.strategies.set(strategy.id, strategy))
  }

  private isCacheValid(date: Date): boolean {
    const ageHours = (Date.now() - date.getTime()) / (1000 * 60 * 60)
    return ageHours < 2
  }

  async createStrategy(strategy: Omit<YieldStrategy, 'id'>): Promise<string> {
    const id = `strategy-${Date.now()}`
    const newStrategy: YieldStrategy = { ...strategy, id }
    this.strategies.set(id, newStrategy)
    return id
  }

  async updateStrategy(strategyId: string, updates: Partial<YieldStrategy>): Promise<void> {
    const existing = this.strategies.get(strategyId)
    if (!existing) {
      throw new Error('Strategy not found')
    }
    this.strategies.set(strategyId, { ...existing, ...updates })
  }

  async deleteStrategy(strategyId: string): Promise<void> {
    this.strategies.delete(strategyId)
  }

  async getStrategies(): Promise<YieldStrategy[]> {
    return Array.from(this.strategies.values())
  }

  clearCache(): void {
    this.cache.clear()
  }

  startAutomation(): void {
    if (this.automationInterval) {
      clearInterval(this.automationInterval)
    }

    this.automationInterval = setInterval(async () => {
      try {
        await this.runAutomatedYieldManagement()
      } catch (error) {
        console.error('Automated yield management error:', error)
      }
    }, 60 * 60 * 1000)
  }

  private async runAutomatedYieldManagement(): Promise<void> {
  }

  stopAutomation(): void {
    if (this.automationInterval) {
      clearInterval(this.automationInterval)
      this.automationInterval = undefined
    }
  }
}

export const yieldManagementService = new YieldManagementService()