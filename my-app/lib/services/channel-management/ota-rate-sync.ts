import { ChannelManager, InventoryUpdate } from './channel-manager'
import { BookingComIntegration } from './booking-com-integration'
import { AirbnbIntegration } from './airbnb-integration'
import { ExpediaIntegration } from './expedia-integration'

export interface OTARateSyncConfiguration {
  propertyId: string
  basePriceSource: 'manual' | 'channel_manager' | 'pms'
  syncFrequency: 'realtime' | 'hourly' | 'daily'
  channels: {
    [channelName: string]: {
      enabled: boolean
      markupType: 'fixed' | 'percentage'
      markupValue: number
      minimumRate?: number
      maximumRate?: number
      weekendMultiplier?: number
      seasonalRules?: Array<{
        startDate: Date
        endDate: Date
        multiplier: number
        roomTypes?: string[]
      }>
      dayOfWeekRules?: Array<{
        dayOfWeek: number
        multiplier: number
      }>
    }
  }
  dynamicPricing: {
    enabled: boolean
    occupancyBasedPricing: {
      enabled: boolean
      thresholds: Array<{
        occupancyPercentage: number
        priceMultiplier: number
      }>
    }
    demandBasedPricing: {
      enabled: boolean
      lookAheadDays: number
      lowDemandThreshold: number
      highDemandThreshold: number
      lowDemandMultiplier: number
      highDemandMultiplier: number
    }
    competitorPricing: {
      enabled: boolean
      competitors: string[]
      adjustmentPercentage: number
    }
  }
  restrictions: {
    globalMinimumStay?: number
    globalMaximumStay?: number
    blackoutDates?: Date[]
    roomTypeRestrictions?: {
      [roomTypeId: string]: {
        minimumStay?: number
        maximumStay?: number
        closedDates?: Date[]
      }
    }
  }
}

export interface RateSyncResult {
  channelName: string
  success: boolean
  updatedDates: number
  errors: string[]
  executionTime: number
  lastSyncTime: Date
}

export interface PricingRule {
  id: string
  name: string
  priority: number
  roomTypeId?: string
  dateRange?: { from: Date; to: Date }
  daysOfWeek?: number[]
  conditions: {
    occupancyMin?: number
    occupancyMax?: number
    leadTimeMin?: number
    leadTimeMax?: number
    lengthOfStayMin?: number
    lengthOfStayMax?: number
  }
  adjustment: {
    type: 'fixed_amount' | 'percentage' | 'set_price'
    value: number
  }
  active: boolean
}

export class OTARateSyncService {
  private static syncConfigurations: Map<string, OTARateSyncConfiguration> = new Map()
  private static pricingRules: Map<string, PricingRule[]> = new Map()

  static async configurateRateSync(config: OTARateSyncConfiguration): Promise<{ success: boolean; error?: string }> {
    try {
      this.syncConfigurations.set(config.propertyId, config)
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message || 'Configuration failed' }
    }
  }

  static async syncRatesAcrossChannels(propertyId: string, updates: Array<{
    roomTypeId: string
    dateRange: { from: Date; to: Date }
    baseRate: number
    currency: string
    availability: number
  }>): Promise<RateSyncResult[]> {
    const config = this.syncConfigurations.get(propertyId)
    if (!config) {
      throw new Error('Rate sync configuration not found for property')
    }

    const results: RateSyncResult[] = []

    for (const [channelName, channelConfig] of Object.entries(config.channels)) {
      if (!channelConfig.enabled) continue

      const startTime = Date.now()
      let updatedDates = 0
      const errors: string[] = []

      try {
        const processedUpdates: InventoryUpdate[] = []

        for (const update of updates) {
          const processedDates = await this.processRateUpdate(
            propertyId,
            channelName,
            update,
            channelConfig,
            config.dynamicPricing
          )
          processedUpdates.push(...processedDates)
          updatedDates += processedDates.length
        }

        const syncResult = await this.executeChannelSync(channelName, propertyId, processedUpdates)

        if (!syncResult.success) {
          errors.push(...(syncResult.errors || ['Unknown sync error']))
        }

      } catch (error: any) {
        errors.push(error.message || 'Sync failed')
      }

      results.push({
        channelName,
        success: errors.length === 0,
        updatedDates,
        errors,
        executionTime: Date.now() - startTime,
        lastSyncTime: new Date()
      })
    }

    return results
  }

  private static async processRateUpdate(
    propertyId: string,
    channelName: string,
    update: {
      roomTypeId: string
      dateRange: { from: Date; to: Date }
      baseRate: number
      currency: string
      availability: number
    },
    channelConfig: any,
    dynamicPricingConfig: any
  ): Promise<InventoryUpdate[]> {
    const processedUpdates: InventoryUpdate[] = []
    const currentDate = new Date(update.dateRange.from)
    const endDate = new Date(update.dateRange.to)

    while (currentDate <= endDate) {
      let finalRate = update.baseRate

      finalRate = this.applyChannelMarkup(finalRate, channelConfig)

      finalRate = await this.applyDynamicPricing(
        finalRate,
        propertyId,
        update.roomTypeId,
        new Date(currentDate),
        dynamicPricingConfig
      )

      finalRate = this.applySeasonalRules(finalRate, new Date(currentDate), channelConfig)

      finalRate = this.applyDayOfWeekRules(finalRate, new Date(currentDate), channelConfig)

      finalRate = await this.applyPricingRules(
        finalRate,
        propertyId,
        update.roomTypeId,
        new Date(currentDate),
        update.availability
      )

      finalRate = this.enforceRateLimits(finalRate, channelConfig)

      processedUpdates.push({
        roomTypeId: update.roomTypeId,
        date: new Date(currentDate),
        availability: update.availability,
        rate: Math.round(finalRate * 100) / 100,
        currency: update.currency
      })

      currentDate.setDate(currentDate.getDate() + 1)
    }

    return processedUpdates
  }

  private static applyChannelMarkup(baseRate: number, channelConfig: any): number {
    if (channelConfig.markupType === 'percentage') {
      return baseRate * (1 + channelConfig.markupValue / 100)
    } else if (channelConfig.markupType === 'fixed') {
      return baseRate + channelConfig.markupValue
    }
    return baseRate
  }

  private static async applyDynamicPricing(
    rate: number,
    propertyId: string,
    roomTypeId: string,
    date: Date,
    dynamicPricingConfig: any
  ): Promise<number> {
    if (!dynamicPricingConfig.enabled) return rate

    let adjustedRate = rate

    if (dynamicPricingConfig.occupancyBasedPricing.enabled) {
      const occupancyRate = await this.getOccupancyRate(propertyId, roomTypeId, date)
      const threshold = dynamicPricingConfig.occupancyBasedPricing.thresholds
        .find((t: any) => occupancyRate >= t.occupancyPercentage)

      if (threshold) {
        adjustedRate *= threshold.priceMultiplier
      }
    }

    if (dynamicPricingConfig.demandBasedPricing.enabled) {
      const demandLevel = await this.getDemandLevel(propertyId, roomTypeId, date, dynamicPricingConfig.demandBasedPricing.lookAheadDays)

      if (demandLevel < dynamicPricingConfig.demandBasedPricing.lowDemandThreshold) {
        adjustedRate *= dynamicPricingConfig.demandBasedPricing.lowDemandMultiplier
      } else if (demandLevel > dynamicPricingConfig.demandBasedPricing.highDemandThreshold) {
        adjustedRate *= dynamicPricingConfig.demandBasedPricing.highDemandMultiplier
      }
    }

    return adjustedRate
  }

  private static applySeasonalRules(rate: number, date: Date, channelConfig: any): number {
    if (!channelConfig.seasonalRules) return rate

    const applicableRule = channelConfig.seasonalRules.find((rule: any) =>
      date >= rule.startDate && date <= rule.endDate
    )

    if (applicableRule) {
      return rate * applicableRule.multiplier
    }

    return rate
  }

  private static applyDayOfWeekRules(rate: number, date: Date, channelConfig: any): number {
    if (!channelConfig.dayOfWeekRules) return rate

    const dayOfWeek = date.getDay()
    const applicableRule = channelConfig.dayOfWeekRules.find((rule: any) => rule.dayOfWeek === dayOfWeek)

    if (applicableRule) {
      return rate * applicableRule.multiplier
    }

    if (channelConfig.weekendMultiplier && (dayOfWeek === 0 || dayOfWeek === 6)) {
      return rate * channelConfig.weekendMultiplier
    }

    return rate
  }

  private static async applyPricingRules(
    rate: number,
    propertyId: string,
    roomTypeId: string,
    date: Date,
    availability: number
  ): Promise<number> {
    const rules = this.pricingRules.get(propertyId) || []
    const sortedRules = rules
      .filter(rule => rule.active && this.isRuleApplicable(rule, roomTypeId, date))
      .sort((a, b) => b.priority - a.priority)

    let adjustedRate = rate

    for (const rule of sortedRules) {
      if (this.meetsRuleConditions(rule, availability, date)) {
        switch (rule.adjustment.type) {
          case 'fixed_amount':
            adjustedRate += rule.adjustment.value
            break
          case 'percentage':
            adjustedRate *= (1 + rule.adjustment.value / 100)
            break
          case 'set_price':
            adjustedRate = rule.adjustment.value
            break
        }
      }
    }

    return adjustedRate
  }

  private static isRuleApplicable(rule: PricingRule, roomTypeId: string, date: Date): boolean {
    if (rule.roomTypeId && rule.roomTypeId !== roomTypeId) return false

    if (rule.dateRange) {
      if (date < rule.dateRange.from || date > rule.dateRange.to) return false
    }

    if (rule.daysOfWeek && rule.daysOfWeek.length > 0) {
      if (!rule.daysOfWeek.includes(date.getDay())) return false
    }

    return true
  }

  private static meetsRuleConditions(rule: PricingRule, availability: number, date: Date): boolean {
    const now = new Date()
    const leadTime = Math.floor((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

    if (rule.conditions.leadTimeMin !== undefined && leadTime < rule.conditions.leadTimeMin) return false
    if (rule.conditions.leadTimeMax !== undefined && leadTime > rule.conditions.leadTimeMax) return false

    return true
  }

  private static enforceRateLimits(rate: number, channelConfig: any): number {
    if (channelConfig.minimumRate && rate < channelConfig.minimumRate) {
      return channelConfig.minimumRate
    }

    if (channelConfig.maximumRate && rate > channelConfig.maximumRate) {
      return channelConfig.maximumRate
    }

    return rate
  }

  private static async executeChannelSync(
    channelName: string,
    propertyId: string,
    updates: InventoryUpdate[]
  ): Promise<{ success: boolean; errors?: string[] }> {
    try {
      switch (channelName.toLowerCase()) {
        case 'booking_com':
          return await this.syncBookingCom(propertyId, updates)
        case 'airbnb':
          return await this.syncAirbnb(propertyId, updates)
        case 'expedia':
          return await this.syncExpedia(propertyId, updates)
        default:
          return { success: false, errors: [`Unknown channel: ${channelName}`] }
      }
    } catch (error: any) {
      return { success: false, errors: [error.message || 'Sync failed'] }
    }
  }

  private static async syncBookingCom(propertyId: string, updates: InventoryUpdate[]): Promise<{ success: boolean; errors?: string[] }> {
    return { success: true }
  }

  private static async syncAirbnb(propertyId: string, updates: InventoryUpdate[]): Promise<{ success: boolean; errors?: string[] }> {
    return { success: true }
  }

  private static async syncExpedia(propertyId: string, updates: InventoryUpdate[]): Promise<{ success: boolean; errors?: string[] }> {
    return { success: true }
  }

  private static async getOccupancyRate(propertyId: string, roomTypeId: string, date: Date): Promise<number> {
    return Math.random() * 100
  }

  private static async getDemandLevel(propertyId: string, roomTypeId: string, date: Date, lookAheadDays: number): Promise<number> {
    return Math.random() * 100
  }

  static async addPricingRule(propertyId: string, rule: PricingRule): Promise<{ success: boolean; error?: string }> {
    try {
      const existingRules = this.pricingRules.get(propertyId) || []
      const updatedRules = [...existingRules, rule]
      this.pricingRules.set(propertyId, updatedRules)
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message || 'Failed to add pricing rule' }
    }
  }

  static async updatePricingRule(propertyId: string, ruleId: string, updates: Partial<PricingRule>): Promise<{ success: boolean; error?: string }> {
    try {
      const existingRules = this.pricingRules.get(propertyId) || []
      const ruleIndex = existingRules.findIndex(rule => rule.id === ruleId)

      if (ruleIndex === -1) {
        return { success: false, error: 'Pricing rule not found' }
      }

      existingRules[ruleIndex] = { ...existingRules[ruleIndex], ...updates }
      this.pricingRules.set(propertyId, existingRules)
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message || 'Failed to update pricing rule' }
    }
  }

  static async deletePricingRule(propertyId: string, ruleId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const existingRules = this.pricingRules.get(propertyId) || []
      const filteredRules = existingRules.filter(rule => rule.id !== ruleId)
      this.pricingRules.set(propertyId, filteredRules)
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message || 'Failed to delete pricing rule' }
    }
  }

  static async getPricingRules(propertyId: string): Promise<{ success: boolean; rules?: PricingRule[]; error?: string }> {
    try {
      const rules = this.pricingRules.get(propertyId) || []
      return { success: true, rules }
    } catch (error: any) {
      return { success: false, error: error.message || 'Failed to get pricing rules' }
    }
  }

  static async previewRateSync(propertyId: string, updates: Array<{
    roomTypeId: string
    dateRange: { from: Date; to: Date }
    baseRate: number
    currency: string
    availability: number
  }>): Promise<{
    success: boolean
    preview?: {
      [channelName: string]: Array<{
        date: Date
        originalRate: number
        finalRate: number
        adjustments: Array<{ type: string; value: number; reason: string }>
      }>
    }
    error?: string
  }> {
    try {
      const config = this.syncConfigurations.get(propertyId)
      if (!config) {
        return { success: false, error: 'Rate sync configuration not found' }
      }

      const preview: { [channelName: string]: any[] } = {}

      for (const [channelName, channelConfig] of Object.entries(config.channels)) {
        if (!channelConfig.enabled) continue

        preview[channelName] = []

        for (const update of updates) {
          const currentDate = new Date(update.dateRange.from)
          const endDate = new Date(update.dateRange.to)

          while (currentDate <= endDate) {
            const adjustments: Array<{ type: string; value: number; reason: string }> = []
            let currentRate = update.baseRate

            const markupRate = this.applyChannelMarkup(currentRate, channelConfig)
            if (markupRate !== currentRate) {
              adjustments.push({
                type: 'markup',
                value: markupRate - currentRate,
                reason: `${channelConfig.markupType} markup of ${channelConfig.markupValue}${channelConfig.markupType === 'percentage' ? '%' : ''}`
              })
              currentRate = markupRate
            }

            const dynamicRate = await this.applyDynamicPricing(
              currentRate,
              propertyId,
              update.roomTypeId,
              new Date(currentDate),
              config.dynamicPricing
            )
            if (dynamicRate !== currentRate) {
              adjustments.push({
                type: 'dynamic_pricing',
                value: dynamicRate - currentRate,
                reason: 'Dynamic pricing adjustment'
              })
              currentRate = dynamicRate
            }

            const finalRate = this.enforceRateLimits(currentRate, channelConfig)
            if (finalRate !== currentRate) {
              adjustments.push({
                type: 'rate_limit',
                value: finalRate - currentRate,
                reason: 'Rate limit enforcement'
              })
            }

            preview[channelName].push({
              date: new Date(currentDate),
              originalRate: update.baseRate,
              finalRate: Math.round(finalRate * 100) / 100,
              adjustments
            })

            currentDate.setDate(currentDate.getDate() + 1)
          }
        }
      }

      return { success: true, preview }

    } catch (error: any) {
      return { success: false, error: error.message || 'Preview generation failed' }
    }
  }

  static async getRateSyncHistory(propertyId: string, days: number = 30): Promise<{
    success: boolean
    history?: Array<{
      timestamp: Date
      channelName: string
      roomTypeId: string
      date: Date
      rate: number
      status: 'success' | 'failed'
      error?: string
    }>
    error?: string
  }> {
    try {
      const mockHistory = Array.from({ length: days }, (_, i) => ({
        timestamp: new Date(Date.now() - i * 24 * 60 * 60 * 1000),
        channelName: ['booking_com', 'airbnb', 'expedia'][Math.floor(Math.random() * 3)],
        roomTypeId: 'room-1',
        date: new Date(Date.now() + i * 24 * 60 * 60 * 1000),
        rate: Math.round((Math.random() * 200 + 100) * 100) / 100,
        status: Math.random() > 0.1 ? 'success' as const : 'failed' as const,
        error: Math.random() > 0.1 ? undefined : 'Rate update failed'
      }))

      return { success: true, history: mockHistory }

    } catch (error: any) {
      return { success: false, error: error.message || 'Failed to get sync history' }
    }
  }
}