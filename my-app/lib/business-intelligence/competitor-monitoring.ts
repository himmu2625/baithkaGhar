export interface CompetitorProperty {
  id: string
  name: string
  location: {
    address: string
    coordinates: {
      lat: number
      lng: number
    }
    distance: number
  }
  category: 'direct' | 'indirect' | 'aspirational'
  starRating: number
  amenities: string[]
  website?: string
  phone?: string
}

export interface CompetitorRate {
  propertyId: string
  date: Date
  roomType: string
  rate: number
  currency: string
  availability: number
  restrictions: {
    minStay?: number
    maxStay?: number
    nonRefundable?: boolean
    cancellationPolicy?: string
  }
  source: 'website' | 'ota' | 'api' | 'manual'
  lastUpdated: Date
}

export interface MarketPositioning {
  propertyId: string
  date: Date
  positioning: 'premium' | 'competitive' | 'value' | 'underpriced'
  percentile: number
  avgMarketRate: number
  ourRate: number
  competitorCount: number
  priceGap: number
  recommendations: string[]
}

export interface CompetitorAnalysis {
  date: Date
  market: {
    averageRate: number
    lowestRate: number
    highestRate: number
    availability: number
    competitorCount: number
  }
  positioning: MarketPositioning
  trends: {
    rateChange: number
    availabilityChange: number
    period: 'daily' | 'weekly' | 'monthly'
  }
  opportunities: CompetitorOpportunity[]
  alerts: CompetitorAlert[]
}

export interface CompetitorOpportunity {
  type: 'pricing' | 'availability' | 'market_gap' | 'competitor_weakness'
  description: string
  impact: 'high' | 'medium' | 'low'
  action: string
  expectedRevenue?: number
  confidence: number
}

export interface CompetitorAlert {
  type: 'price_drop' | 'price_increase' | 'new_competitor' | 'availability_change'
  severity: 'critical' | 'warning' | 'info'
  message: string
  affectedDates: Date[]
  competitorId: string
  suggestedAction?: string
}

export interface MonitoringConfig {
  propertyId: string
  competitors: string[]
  monitoringFrequency: 'hourly' | 'daily' | 'weekly'
  priceAlertThreshold: number
  availabilityAlertThreshold: number
  enableAutomaticPricing: boolean
  maxPriceAdjustment: number
}

export interface RateScrapingRequest {
  competitorId: string
  checkInDate: Date
  checkOutDate: Date
  roomTypes?: string[]
  guestCount?: number
}

export interface ScrapingResult {
  success: boolean
  rates: CompetitorRate[]
  errors: string[]
  scrapedAt: Date
  source: string
}

export class CompetitorMonitoringService {
  private cache = new Map<string, CompetitorAnalysis>()
  private competitors = new Map<string, CompetitorProperty>()
  private monitoringConfigs = new Map<string, MonitoringConfig>()
  private scrapingInterval?: NodeJS.Timeout

  constructor() {
    this.initializeDefaultCompetitors()
  }

  async addCompetitor(competitor: CompetitorProperty): Promise<void> {
    this.competitors.set(competitor.id, competitor)
    await this.saveCompetitorData()
  }

  async removeCompetitor(competitorId: string): Promise<void> {
    this.competitors.delete(competitorId)
    await this.saveCompetitorData()
  }

  async updateMonitoringConfig(config: MonitoringConfig): Promise<void> {
    this.monitoringConfigs.set(config.propertyId, config)
    await this.saveMonitoringConfig(config)

    if (config.monitoringFrequency === 'hourly') {
      this.startAutomaticMonitoring(config.propertyId)
    }
  }

  async getCompetitorAnalysis(
    propertyId: string,
    date: Date = new Date()
  ): Promise<CompetitorAnalysis> {
    const cacheKey = `${propertyId}:${date.toDateString()}`
    const cached = this.cache.get(cacheKey)

    if (cached && this.isCacheValid(cached.date)) {
      return cached
    }

    const config = this.monitoringConfigs.get(propertyId)
    if (!config) {
      throw new Error('Monitoring not configured for this property')
    }

    const competitorRates = await this.scrapeCompetitorRates(config, date)
    const ourRates = await this.getOurRates(propertyId, date)
    const analysis = await this.analyzeMarket(propertyId, competitorRates, ourRates, date)

    this.cache.set(cacheKey, analysis)
    return analysis
  }

  private async scrapeCompetitorRates(
    config: MonitoringConfig,
    date: Date
  ): Promise<CompetitorRate[]> {
    const rates: CompetitorRate[] = []
    const checkOutDate = new Date(date)
    checkOutDate.setDate(checkOutDate.getDate() + 1)

    for (const competitorId of config.competitors) {
      try {
        const competitor = this.competitors.get(competitorId)
        if (!competitor) continue

        const result = await this.scrapeCompetitorWebsite(competitor, date, checkOutDate)
        if (result.success) {
          rates.push(...result.rates)
        }
      } catch (error) {
        console.error(`Failed to scrape rates for competitor ${competitorId}:`, error)
      }
    }

    return rates
  }

  private async scrapeCompetitorWebsite(
    competitor: CompetitorProperty,
    checkIn: Date,
    checkOut: Date
  ): Promise<ScrapingResult> {
    if (!competitor.website) {
      return {
        success: false,
        rates: [],
        errors: ['No website configured for competitor'],
        scrapedAt: new Date(),
        source: 'website'
      }
    }

    try {
      const rates = await this.simulateRateScraping(competitor, checkIn, checkOut)
      return {
        success: true,
        rates,
        errors: [],
        scrapedAt: new Date(),
        source: 'website'
      }
    } catch (error) {
      return {
        success: false,
        rates: [],
        errors: [error instanceof Error ? error.message : 'Unknown error'],
        scrapedAt: new Date(),
        source: 'website'
      }
    }
  }

  private async simulateRateScraping(
    competitor: CompetitorProperty,
    checkIn: Date,
    checkOut: Date
  ): Promise<CompetitorRate[]> {
    const baseRate = 120 + (competitor.starRating * 30) + (Math.random() * 50)
    const seasonalMultiplier = this.getSeasonalMultiplier(checkIn)
    const availabilityMultiplier = 0.7 + (Math.random() * 0.3)

    const roomTypes = ['Standard', 'Deluxe', 'Suite']
    const rates: CompetitorRate[] = []

    roomTypes.forEach((roomType, index) => {
      const typeMultiplier = 1 + (index * 0.3)
      const finalRate = Math.round(baseRate * seasonalMultiplier * typeMultiplier)

      rates.push({
        propertyId: competitor.id,
        date: checkIn,
        roomType,
        rate: finalRate,
        currency: 'USD',
        availability: Math.floor(5 + Math.random() * 15),
        restrictions: {
          minStay: Math.random() > 0.7 ? 2 : undefined,
          nonRefundable: Math.random() > 0.6,
          cancellationPolicy: 'Free cancellation until 24 hours before check-in'
        },
        source: 'website',
        lastUpdated: new Date()
      })
    })

    return rates
  }

  private getSeasonalMultiplier(date: Date): number {
    const month = date.getMonth()
    const isWeekend = date.getDay() === 0 || date.getDay() === 6

    let multiplier = 1.0

    if (month >= 5 && month <= 8) {
      multiplier = 1.3
    } else if (month === 11 || month === 0) {
      multiplier = 1.4
    }

    if (isWeekend) {
      multiplier *= 1.15
    }

    return multiplier
  }

  private async getOurRates(propertyId: string, date: Date): Promise<CompetitorRate[]> {
    try {
      const response = await fetch(`/api/os/properties/${propertyId}/rates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: date.toISOString() })
      })

      if (!response.ok) {
        throw new Error('Failed to fetch our rates')
      }

      const data = await response.json()
      return data.rates || []
    } catch (error) {
      console.error('Error fetching our rates:', error)
      return []
    }
  }

  private async analyzeMarket(
    propertyId: string,
    competitorRates: CompetitorRate[],
    ourRates: CompetitorRate[],
    date: Date
  ): Promise<CompetitorAnalysis> {
    const market = this.calculateMarketMetrics(competitorRates)
    const positioning = this.calculatePositioning(propertyId, competitorRates, ourRates, date)
    const trends = await this.calculateTrends(propertyId, date)
    const opportunities = this.identifyOpportunities(competitorRates, ourRates, market)
    const alerts = this.generateAlerts(competitorRates, ourRates, market)

    return {
      date,
      market,
      positioning,
      trends,
      opportunities,
      alerts
    }
  }

  private calculateMarketMetrics(rates: CompetitorRate[]): CompetitorAnalysis['market'] {
    if (rates.length === 0) {
      return {
        averageRate: 0,
        lowestRate: 0,
        highestRate: 0,
        availability: 0,
        competitorCount: 0
      }
    }

    const rateValues = rates.map(r => r.rate)
    const availabilityValues = rates.map(r => r.availability)

    return {
      averageRate: rateValues.reduce((sum, rate) => sum + rate, 0) / rateValues.length,
      lowestRate: Math.min(...rateValues),
      highestRate: Math.max(...rateValues),
      availability: availabilityValues.reduce((sum, avail) => sum + avail, 0) / availabilityValues.length,
      competitorCount: new Set(rates.map(r => r.propertyId)).size
    }
  }

  private calculatePositioning(
    propertyId: string,
    competitorRates: CompetitorRate[],
    ourRates: CompetitorRate[],
    date: Date
  ): MarketPositioning {
    const allRates = competitorRates.concat(ourRates)
    const ourAvgRate = ourRates.length > 0
      ? ourRates.reduce((sum, rate) => sum + rate.rate, 0) / ourRates.length
      : 0

    const marketAvgRate = competitorRates.length > 0
      ? competitorRates.reduce((sum, rate) => sum + rate.rate, 0) / competitorRates.length
      : 0

    const sortedRates = allRates.map(r => r.rate).sort((a, b) => a - b)
    const ourPosition = sortedRates.findIndex(rate => rate >= ourAvgRate)
    const percentile = ourPosition / sortedRates.length

    let positioning: 'premium' | 'competitive' | 'value' | 'underpriced'
    if (percentile > 0.8) positioning = 'premium'
    else if (percentile > 0.6) positioning = 'competitive'
    else if (percentile > 0.3) positioning = 'value'
    else positioning = 'underpriced'

    const priceGap = ourAvgRate - marketAvgRate
    const recommendations = this.generatePositioningRecommendations(positioning, priceGap, percentile)

    return {
      propertyId,
      date,
      positioning,
      percentile,
      avgMarketRate: marketAvgRate,
      ourRate: ourAvgRate,
      competitorCount: competitorRates.length,
      priceGap,
      recommendations
    }
  }

  private generatePositioningRecommendations(
    positioning: 'premium' | 'competitive' | 'value' | 'underpriced',
    priceGap: number,
    percentile: number
  ): string[] {
    const recommendations: string[] = []

    switch (positioning) {
      case 'premium':
        recommendations.push('Maintain premium positioning with superior service quality')
        if (percentile > 0.9) {
          recommendations.push('Consider slight rate reduction to improve demand')
        }
        break

      case 'competitive':
        recommendations.push('Good market positioning - monitor competitor movements closely')
        break

      case 'value':
        recommendations.push('Strong value positioning - consider strategic rate increases')
        if (priceGap < -20) {
          recommendations.push('Significant pricing opportunity exists')
        }
        break

      case 'underpriced':
        recommendations.push('URGENT: Rates significantly below market - immediate increase recommended')
        recommendations.push(`Potential revenue loss: $${Math.abs(priceGap).toFixed(2)} per room`)
        break
    }

    return recommendations
  }

  private async calculateTrends(propertyId: string, date: Date): Promise<CompetitorAnalysis['trends']> {
    const previousWeek = new Date(date)
    previousWeek.setDate(previousWeek.getDate() - 7)

    try {
      const currentAnalysis = await this.getHistoricalAnalysis(propertyId, date)
      const previousAnalysis = await this.getHistoricalAnalysis(propertyId, previousWeek)

      const rateChange = currentAnalysis && previousAnalysis
        ? ((currentAnalysis.market.averageRate - previousAnalysis.market.averageRate) / previousAnalysis.market.averageRate) * 100
        : 0

      const availabilityChange = currentAnalysis && previousAnalysis
        ? currentAnalysis.market.availability - previousAnalysis.market.availability
        : 0

      return {
        rateChange,
        availabilityChange,
        period: 'weekly'
      }
    } catch (error) {
      return {
        rateChange: 0,
        availabilityChange: 0,
        period: 'weekly'
      }
    }
  }

  private async getHistoricalAnalysis(propertyId: string, date: Date): Promise<CompetitorAnalysis | null> {
    const cacheKey = `${propertyId}:${date.toDateString()}`
    return this.cache.get(cacheKey) || null
  }

  private identifyOpportunities(
    competitorRates: CompetitorRate[],
    ourRates: CompetitorRate[],
    market: CompetitorAnalysis['market']
  ): CompetitorOpportunity[] {
    const opportunities: CompetitorOpportunity[] = []

    const ourAvgRate = ourRates.length > 0
      ? ourRates.reduce((sum, rate) => sum + rate.rate, 0) / ourRates.length
      : 0

    if (ourAvgRate < market.averageRate * 0.8) {
      opportunities.push({
        type: 'pricing',
        description: 'Significant pricing opportunity - rates below market average',
        impact: 'high',
        action: `Increase rates to $${Math.round(market.averageRate * 0.9)}`,
        expectedRevenue: (market.averageRate * 0.9 - ourAvgRate) * 30,
        confidence: 0.85
      })
    }

    const lowAvailabilityCompetitors = competitorRates.filter(r => r.availability < 3)
    if (lowAvailabilityCompetitors.length > competitorRates.length * 0.3) {
      opportunities.push({
        type: 'availability',
        description: 'High demand period - competitors showing low availability',
        impact: 'medium',
        action: 'Increase rates for high-demand periods',
        expectedRevenue: ourAvgRate * 0.15 * 20,
        confidence: 0.75
      })
    }

    const premiumGap = competitorRates.filter(r => r.rate > ourAvgRate * 1.5)
    if (premiumGap.length === 0 && ourAvgRate < market.highestRate * 0.7) {
      opportunities.push({
        type: 'market_gap',
        description: 'Premium market segment opportunity',
        impact: 'medium',
        action: 'Develop premium room packages',
        confidence: 0.6
      })
    }

    return opportunities
  }

  private generateAlerts(
    competitorRates: CompetitorRate[],
    ourRates: CompetitorRate[],
    market: CompetitorAnalysis['market']
  ): CompetitorAlert[] {
    const alerts: CompetitorAlert[] = []

    const ourAvgRate = ourRates.length > 0
      ? ourRates.reduce((sum, rate) => sum + rate.rate, 0) / ourRates.length
      : 0

    if (market.lowestRate < ourAvgRate * 0.7) {
      const competitor = competitorRates.find(r => r.rate === market.lowestRate)
      alerts.push({
        type: 'price_drop',
        severity: 'warning',
        message: `Competitor dropped rates to $${market.lowestRate} (${((ourAvgRate - market.lowestRate) / ourAvgRate * 100).toFixed(1)}% below ours)`,
        affectedDates: [new Date()],
        competitorId: competitor?.propertyId || 'unknown',
        suggestedAction: 'Review pricing strategy and consider rate adjustment'
      })
    }

    if (market.averageRate > ourAvgRate * 1.3) {
      alerts.push({
        type: 'price_increase',
        severity: 'info',
        message: `Market rates increased significantly - average now $${market.averageRate.toFixed(2)}`,
        affectedDates: [new Date()],
        competitorId: 'market',
        suggestedAction: 'Consider increasing rates to match market'
      })
    }

    const veryLowAvailability = competitorRates.filter(r => r.availability < 2)
    if (veryLowAvailability.length > competitorRates.length * 0.5) {
      alerts.push({
        type: 'availability_change',
        severity: 'critical',
        message: 'High demand detected - multiple competitors showing very low availability',
        affectedDates: [new Date()],
        competitorId: 'market',
        suggestedAction: 'Implement surge pricing immediately'
      })
    }

    return alerts
  }

  private startAutomaticMonitoring(propertyId: string): void {
    if (this.scrapingInterval) {
      clearInterval(this.scrapingInterval)
    }

    this.scrapingInterval = setInterval(async () => {
      try {
        await this.getCompetitorAnalysis(propertyId)
      } catch (error) {
        console.error('Automatic monitoring error:', error)
      }
    }, 60 * 60 * 1000)
  }

  private initializeDefaultCompetitors(): void {
    const defaultCompetitors: CompetitorProperty[] = [
      {
        id: 'comp-001',
        name: 'Grand Plaza Hotel',
        location: {
          address: '123 Main Street',
          coordinates: { lat: 40.7128, lng: -74.0060 },
          distance: 0.5
        },
        category: 'direct',
        starRating: 4,
        amenities: ['pool', 'spa', 'restaurant', 'wifi'],
        website: 'https://grandplaza.example.com'
      },
      {
        id: 'comp-002',
        name: 'City Center Inn',
        location: {
          address: '456 Business Ave',
          coordinates: { lat: 40.7589, lng: -73.9851 },
          distance: 1.2
        },
        category: 'direct',
        starRating: 3,
        amenities: ['wifi', 'breakfast', 'parking'],
        website: 'https://citycenter.example.com'
      }
    ]

    defaultCompetitors.forEach(comp => this.competitors.set(comp.id, comp))
  }

  private async saveCompetitorData(): Promise<void> {
  }

  private async saveMonitoringConfig(config: MonitoringConfig): Promise<void> {
  }

  private isCacheValid(date: Date): boolean {
    const ageHours = (Date.now() - date.getTime()) / (1000 * 60 * 60)
    return ageHours < 6
  }

  async getCompetitors(category?: 'direct' | 'indirect' | 'aspirational'): Promise<CompetitorProperty[]> {
    const competitors = Array.from(this.competitors.values())
    return category ? competitors.filter(c => c.category === category) : competitors
  }

  async getMonitoringConfig(propertyId: string): Promise<MonitoringConfig | null> {
    return this.monitoringConfigs.get(propertyId) || null
  }

  async exportCompetitorData(propertyId: string, startDate: Date, endDate: Date): Promise<any[]> {
    const data: any[] = []
    const current = new Date(startDate)

    while (current <= endDate) {
      try {
        const analysis = await this.getCompetitorAnalysis(propertyId, current)
        data.push({
          date: current.toISOString(),
          marketAverage: analysis.market.averageRate,
          ourRate: analysis.positioning.ourRate,
          positioning: analysis.positioning.positioning,
          competitorCount: analysis.market.competitorCount,
          opportunities: analysis.opportunities.length,
          alerts: analysis.alerts.length
        })
      } catch (error) {
        console.error(`Failed to get analysis for ${current.toDateString()}:`, error)
      }

      current.setDate(current.getDate() + 1)
    }

    return data
  }

  stopMonitoring(): void {
    if (this.scrapingInterval) {
      clearInterval(this.scrapingInterval)
      this.scrapingInterval = undefined
    }
  }

  clearCache(): void {
    this.cache.clear()
  }
}

export const competitorMonitoringService = new CompetitorMonitoringService()