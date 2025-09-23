export interface UpsellConfig {
  propertyId: string
  enabled: boolean
  strategies: UpsellStrategy[]
  triggers: UpsellTrigger[]
  channels: UpsellChannel[]
  targeting: TargetingConfig
  timing: TimingConfig
  content: ContentConfig
  analytics: AnalyticsConfig
}

export interface UpsellStrategy {
  id: string
  name: string
  description: string
  category: 'room_upgrade' | 'service_addon' | 'dining' | 'spa' | 'activities' | 'transportation' | 'package'
  priority: number
  active: boolean
  conditions: UpsellCondition[]
  offers: UpsellOffer[]
  presentation: PresentationConfig
  conversion: ConversionConfig
}

export interface UpsellCondition {
  type: 'booking_value' | 'room_type' | 'guest_type' | 'loyalty_tier' | 'length_of_stay' | 'party_size' | 'lead_time' | 'season' | 'day_of_week'
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'in' | 'between' | 'contains'
  value: any
  weight: number
}

export interface UpsellOffer {
  id: string
  title: string
  description: string
  originalPrice: number
  salePrice: number
  discountPercentage: number
  value: number
  savings: number
  currency: string
  validUntil?: Date
  maxQuantity?: number
  bundle?: BundleDetails
  restrictions?: string[]
}

export interface BundleDetails {
  items: BundleItem[]
  bundleDiscount: number
  totalValue: number
  bundlePrice: number
}

export interface BundleItem {
  type: 'room' | 'service' | 'dining' | 'spa' | 'activity'
  name: string
  description: string
  value: number
  included: boolean
}

export interface PresentationConfig {
  displayType: 'popup' | 'banner' | 'inline' | 'email' | 'sms' | 'push'
  template: string
  images: string[]
  priority: number
  frequency: FrequencyConfig
  urgency: UrgencyConfig
}

export interface FrequencyConfig {
  maxPerDay: number
  maxPerStay: number
  cooldownPeriod: number
  respectOptOut: boolean
}

export interface UrgencyConfig {
  showCountdown: boolean
  showLimitedAvailability: boolean
  showLimitedTime: boolean
  urgencyMessages: string[]
}

export interface ConversionConfig {
  conversionGoal: 'click' | 'view' | 'purchase'
  incentives: ConversionIncentive[]
  followUp: FollowUpConfig
  abandonment: AbandonmentConfig
}

export interface ConversionIncentive {
  type: 'discount' | 'freebie' | 'points' | 'upgrade'
  trigger: 'immediate' | 'delayed' | 'conditional'
  value: number
  description: string
  conditions?: string[]
}

export interface FollowUpConfig {
  enabled: boolean
  delays: number[]
  channels: string[]
  templates: string[]
  maxFollowUps: number
}

export interface AbandonmentConfig {
  trackAbandonment: boolean
  retargetingDelay: number
  incentiveIncrease: number
  maxRetargetAttempts: number
}

export interface UpsellTrigger {
  id: string
  name: string
  event: 'booking_created' | 'pre_arrival' | 'check_in' | 'during_stay' | 'check_out' | 'post_stay' | 'browse_start' | 'cart_abandonment'
  timing: TriggerTiming
  conditions: TriggerCondition[]
  strategies: string[]
  active: boolean
}

export interface TriggerTiming {
  delay: number
  timeUnit: 'minutes' | 'hours' | 'days'
  specificTime?: string
  timezone: string
  respectQuietHours: boolean
}

export interface TriggerCondition {
  field: string
  operator: string
  value: any
  required: boolean
}

export interface UpsellChannel {
  type: 'email' | 'sms' | 'push' | 'web' | 'mobile_app' | 'voice' | 'chatbot'
  enabled: boolean
  priority: number
  config: ChannelConfig
  templates: ChannelTemplate[]
  tracking: ChannelTracking
}

export interface ChannelConfig {
  fromAddress?: string
  fromName?: string
  phoneNumber?: string
  appId?: string
  webhookUrl?: string
  apiKey?: string
  rateLimit?: RateLimit
}

export interface RateLimit {
  maxPerHour: number
  maxPerDay: number
  backoffStrategy: 'linear' | 'exponential'
}

export interface ChannelTemplate {
  id: string
  name: string
  subject?: string
  content: string
  variables: TemplateVariable[]
  personalization: PersonalizationRule[]
}

export interface TemplateVariable {
  name: string
  type: 'text' | 'number' | 'date' | 'currency' | 'image' | 'url'
  required: boolean
  defaultValue?: any
}

export interface PersonalizationRule {
  field: string
  mapping: string
  fallback?: string
  transformation?: string
}

export interface ChannelTracking {
  trackOpens: boolean
  trackClicks: boolean
  trackConversions: boolean
  utmParameters: UTMParameters
  customEvents: string[]
}

export interface UTMParameters {
  source: string
  medium: string
  campaign: string
  term?: string
  content?: string
}

export interface TargetingConfig {
  segmentation: SegmentationRule[]
  exclusions: ExclusionRule[]
  frequency: FrequencyConfig
  testing: TestingConfig
}

export interface SegmentationRule {
  id: string
  name: string
  criteria: SegmentCriteria[]
  strategies: string[]
  priority: number
}

export interface SegmentCriteria {
  dimension: 'demographics' | 'behavior' | 'preferences' | 'value' | 'loyalty'
  attribute: string
  operator: string
  value: any
}

export interface ExclusionRule {
  id: string
  name: string
  criteria: ExclusionCriteria[]
  reason: string
  duration?: number
}

export interface ExclusionCriteria {
  type: 'opt_out' | 'frequency_cap' | 'recent_purchase' | 'complaint' | 'dnc_list'
  value: any
  expiry?: Date
}

export interface TestingConfig {
  abTestEnabled: boolean
  testVariants: TestVariant[]
  splitRatio: number[]
  successMetric: 'conversion_rate' | 'revenue' | 'engagement'
  testDuration: number
}

export interface TestVariant {
  id: string
  name: string
  changes: VariantChange[]
  allocation: number
}

export interface VariantChange {
  component: string
  property: string
  value: any
}

export interface TimingConfig {
  optimalTimes: OptimalTime[]
  timezone: string
  respectPreferences: boolean
  businessHours: BusinessHours
  quietHours: QuietHours[]
}

export interface OptimalTime {
  channel: string
  dayOfWeek: number
  hour: number
  conversionRate: number
  engagement: number
}

export interface BusinessHours {
  start: string
  end: string
  daysOfWeek: number[]
}

export interface QuietHours {
  start: string
  end: string
  channels: string[]
}

export interface ContentConfig {
  personalization: PersonalizationConfig
  localization: LocalizationConfig
  branding: BrandingConfig
  compliance: ComplianceConfig
}

export interface PersonalizationConfig {
  useGuestName: boolean
  useBookingDetails: boolean
  usePastBehavior: boolean
  usePreferences: boolean
  dynamicContent: DynamicContentRule[]
}

export interface DynamicContentRule {
  trigger: string
  content: string
  conditions: string[]
  priority: number
}

export interface LocalizationConfig {
  enabled: boolean
  languages: string[]
  autoDetect: boolean
  fallbackLanguage: string
  currencyConversion: boolean
}

export interface BrandingConfig {
  logo: string
  colors: ColorPalette
  fonts: FontConfig
  voice: VoiceConfig
}

export interface ColorPalette {
  primary: string
  secondary: string
  accent: string
  text: string
  background: string
}

export interface FontConfig {
  heading: string
  body: string
  accent: string
}

export interface VoiceConfig {
  tone: 'professional' | 'friendly' | 'luxury' | 'casual'
  style: 'formal' | 'conversational' | 'persuasive'
  language: string[]
}

export interface ComplianceConfig {
  gdprCompliant: boolean
  ccpaCompliant: boolean
  canSpamCompliant: boolean
  optInRequired: boolean
  unsubscribeLink: boolean
}

export interface AnalyticsConfig {
  trackingEnabled: boolean
  metrics: string[]
  reporting: ReportingConfig
  integration: IntegrationConfig
}

export interface ReportingConfig {
  frequency: 'daily' | 'weekly' | 'monthly'
  recipients: string[]
  format: 'email' | 'dashboard' | 'api'
  customMetrics: CustomMetric[]
}

export interface CustomMetric {
  name: string
  formula: string
  description: string
  target: number
}

export interface IntegrationConfig {
  googleAnalytics?: string
  facebookPixel?: string
  hotjar?: string
  customTracking?: CustomTrackingConfig[]
}

export interface CustomTrackingConfig {
  name: string
  endpoint: string
  method: 'GET' | 'POST'
  headers: Record<string, string>
}

export interface UpsellRequest {
  guestId: string
  bookingId: string
  propertyId: string
  sessionId?: string
  context: UpsellContext
  preferences?: GuestPreferences
  history?: UpsellHistory
}

export interface UpsellContext {
  currentPage: string
  userAgent: string
  device: 'desktop' | 'mobile' | 'tablet'
  channel: string
  referrer?: string
  timestamp: Date
  location?: LocationData
}

export interface LocationData {
  country: string
  region: string
  city: string
  timezone: string
}

export interface GuestPreferences {
  communicationChannels: string[]
  categories: string[]
  priceRange: PriceRange
  optOuts: string[]
  language: string
  currency: string
}

export interface PriceRange {
  min: number
  max: number
  currency: string
}

export interface UpsellHistory {
  previousOffers: PreviousOffer[]
  conversions: ConversionHistory[]
  interactions: InteractionHistory[]
  preferences: PreferenceHistory[]
}

export interface PreviousOffer {
  offerId: string
  strategy: string
  presentedAt: Date
  channel: string
  response: 'converted' | 'dismissed' | 'ignored'
}

export interface ConversionHistory {
  offerId: string
  convertedAt: Date
  value: number
  category: string
  satisfaction?: number
}

export interface InteractionHistory {
  type: 'view' | 'click' | 'share' | 'save'
  offerId: string
  timestamp: Date
  duration?: number
}

export interface PreferenceHistory {
  category: string
  preference: 'interested' | 'not_interested' | 'maybe'
  timestamp: Date
  source: string
}

export interface UpsellResponse {
  recommendations: UpsellRecommendation[]
  targeting: TargetingInfo
  tracking: TrackingInfo
  nextActions: NextAction[]
  analytics: ResponseAnalytics
}

export interface UpsellRecommendation {
  id: string
  strategy: string
  offer: UpsellOffer
  presentation: PresentationDetails
  urgency: UrgencyDetails
  personalization: PersonalizationDetails
  tracking: RecommendationTracking
}

export interface PresentationDetails {
  channel: string
  template: string
  content: string
  images: string[]
  cta: CallToAction
  layout: LayoutConfig
}

export interface CallToAction {
  text: string
  style: 'primary' | 'secondary' | 'accent'
  action: string
  url: string
  tracking: string
}

export interface LayoutConfig {
  position: 'top' | 'bottom' | 'sidebar' | 'overlay' | 'inline'
  size: 'small' | 'medium' | 'large' | 'fullscreen'
  animation: 'none' | 'fade' | 'slide' | 'zoom'
}

export interface UrgencyDetails {
  type: 'time' | 'quantity' | 'demand'
  message: string
  countdown?: CountdownConfig
  availability?: AvailabilityConfig
}

export interface CountdownConfig {
  endTime: Date
  format: 'hours' | 'minutes' | 'seconds'
  showDays: boolean
}

export interface AvailabilityConfig {
  remaining: number
  total: number
  updateFrequency: number
}

export interface PersonalizationDetails {
  guestName: string
  customMessage: string
  relevanceScore: number
  recommendations: string[]
}

export interface RecommendationTracking {
  impressionId: string
  sessionId: string
  experimentId?: string
  variant?: string
  timestamp: Date
}

export interface TargetingInfo {
  segment: string
  rules: string[]
  score: number
  reasons: string[]
}

export interface TrackingInfo {
  sessionId: string
  visitorId: string
  experimentId?: string
  utm: UTMParameters
  events: TrackingEvent[]
}

export interface TrackingEvent {
  name: string
  properties: Record<string, any>
  timestamp: Date
}

export interface NextAction {
  type: 'follow_up' | 'retarget' | 'exclude' | 'escalate'
  delay: number
  conditions: string[]
  parameters: Record<string, any>
}

export interface ResponseAnalytics {
  conversionProbability: number
  valueScore: number
  engagementScore: number
  riskScore: number
  insights: string[]
}

export interface UpsellMetrics {
  period: {
    start: Date
    end: Date
  }
  summary: {
    totalOffers: number
    totalConversions: number
    conversionRate: number
    totalRevenue: number
    avgOrderValue: number
    roi: number
  }
  breakdown: {
    byStrategy: Record<string, StrategyMetrics>
    byChannel: Record<string, ChannelMetrics>
    bySegment: Record<string, SegmentMetrics>
    byOffer: Record<string, OfferMetrics>
  }
  trends: MetricTrend[]
  cohorts: CohortAnalysis[]
}

export interface StrategyMetrics {
  offers: number
  conversions: number
  revenue: number
  conversionRate: number
  avgValue: number
  engagement: number
}

export interface ChannelMetrics {
  sent: number
  delivered: number
  opened: number
  clicked: number
  converted: number
  revenue: number
  ctr: number
  conversionRate: number
}

export interface SegmentMetrics {
  size: number
  offers: number
  conversions: number
  revenue: number
  engagement: number
  satisfaction: number
}

export interface OfferMetrics {
  impressions: number
  clicks: number
  conversions: number
  revenue: number
  ctr: number
  conversionRate: number
  avgValue: number
}

export interface MetricTrend {
  date: Date
  offers: number
  conversions: number
  revenue: number
  conversionRate: number
}

export interface CohortAnalysis {
  cohort: string
  period: string
  size: number
  conversionRate: number
  ltv: number
  retention: number
}

export class UpsellService {
  private configs = new Map<string, UpsellConfig>()
  private recommendations = new Map<string, UpsellRecommendation[]>()
  private interactions = new Map<string, InteractionHistory[]>()
  private conversions = new Map<string, ConversionHistory[]>()
  private experiments = new Map<string, TestVariant[]>()

  constructor() {
    this.initializeDefaultConfig()
  }

  async generateUpsells(request: UpsellRequest): Promise<UpsellResponse> {
    const config = this.configs.get(request.propertyId)
    if (!config || !config.enabled) {
      return this.createEmptyResponse(request)
    }

    const activeStrategies = await this.getActiveStrategies(request, config)
    const targetingInfo = await this.evaluateTargeting(request, config)
    const recommendations = await this.generateRecommendations(request, activeStrategies, config)
    const trackingInfo = this.createTrackingInfo(request, config)
    const nextActions = await this.planNextActions(request, recommendations, config)
    const analytics = await this.calculateResponseAnalytics(request, recommendations)

    const response: UpsellResponse = {
      recommendations,
      targeting: targetingInfo,
      tracking: trackingInfo,
      nextActions,
      analytics
    }

    await this.trackResponse(request, response)
    return response
  }

  private createEmptyResponse(request: UpsellRequest): UpsellResponse {
    return {
      recommendations: [],
      targeting: {
        segment: 'none',
        rules: [],
        score: 0,
        reasons: ['Upselling disabled']
      },
      tracking: {
        sessionId: request.sessionId || '',
        visitorId: request.guestId,
        utm: {
          source: 'direct',
          medium: 'none',
          campaign: 'none'
        },
        events: []
      },
      nextActions: [],
      analytics: {
        conversionProbability: 0,
        valueScore: 0,
        engagementScore: 0,
        riskScore: 0,
        insights: []
      }
    }
  }

  private async getActiveStrategies(request: UpsellRequest, config: UpsellConfig): Promise<UpsellStrategy[]> {
    const applicableTriggers = config.triggers.filter(trigger =>
      trigger.active && this.evaluateTrigger(trigger, request)
    )

    const strategyIds = new Set<string>()
    applicableTriggers.forEach(trigger => {
      trigger.strategies.forEach(id => strategyIds.add(id))
    })

    const strategies = config.strategies.filter(strategy =>
      strategy.active && strategyIds.has(strategy.id)
    )

    const evaluatedStrategies: UpsellStrategy[] = []
    for (const strategy of strategies) {
      if (await this.evaluateStrategyConditions(strategy, request)) {
        evaluatedStrategies.push(strategy)
      }
    }

    return evaluatedStrategies.sort((a, b) => b.priority - a.priority)
  }

  private evaluateTrigger(trigger: UpsellTrigger, request: UpsellRequest): boolean {
    return trigger.conditions.every(condition => {
      const value = this.extractTriggerValue(condition.field, request)
      return this.compareValues(value, condition.operator, condition.value)
    })
  }

  private extractTriggerValue(field: string, request: UpsellRequest): any {
    switch (field) {
      case 'booking_id':
        return request.bookingId
      case 'guest_type':
        return request.preferences?.categories || []
      case 'device':
        return request.context.device
      case 'channel':
        return request.context.channel
      default:
        return null
    }
  }

  private async evaluateStrategyConditions(strategy: UpsellStrategy, request: UpsellRequest): Promise<boolean> {
    for (const condition of strategy.conditions) {
      const value = await this.extractConditionValue(condition, request)
      if (!this.compareValues(value, condition.operator, condition.value)) {
        return false
      }
    }
    return true
  }

  private async extractConditionValue(condition: UpsellCondition, request: UpsellRequest): Promise<any> {
    switch (condition.type) {
      case 'booking_value':
        return await this.getBookingValue(request.bookingId)
      case 'room_type':
        return await this.getBookingRoomType(request.bookingId)
      case 'guest_type':
        return await this.getGuestType(request.guestId)
      case 'loyalty_tier':
        return await this.getLoyaltyTier(request.guestId)
      case 'length_of_stay':
        return await this.getLengthOfStay(request.bookingId)
      case 'party_size':
        return await this.getPartySize(request.bookingId)
      case 'lead_time':
        return await this.getLeadTime(request.bookingId)
      case 'season':
        return this.getCurrentSeason()
      case 'day_of_week':
        return new Date().getDay()
      default:
        return null
    }
  }

  private async getBookingValue(bookingId: string): Promise<number> {
    try {
      const response = await fetch(`/api/os/bookings/${bookingId}`)
      if (response.ok) {
        const booking = await response.json()
        return booking.totalAmount || 0
      }
    } catch (error) {
      console.error('Error fetching booking value:', error)
    }
    return 0
  }

  private async getBookingRoomType(bookingId: string): Promise<string> {
    try {
      const response = await fetch(`/api/os/bookings/${bookingId}`)
      if (response.ok) {
        const booking = await response.json()
        return booking.roomType || 'standard'
      }
    } catch (error) {
      console.error('Error fetching room type:', error)
    }
    return 'standard'
  }

  private async getGuestType(guestId: string): Promise<string> {
    try {
      const response = await fetch(`/api/os/guests/${guestId}`)
      if (response.ok) {
        const guest = await response.json()
        return guest.type || 'leisure'
      }
    } catch (error) {
      console.error('Error fetching guest type:', error)
    }
    return 'leisure'
  }

  private async getLoyaltyTier(guestId: string): Promise<string> {
    try {
      const response = await fetch(`/api/os/guests/${guestId}/loyalty`)
      if (response.ok) {
        const loyalty = await response.json()
        return loyalty.tier || 'standard'
      }
    } catch (error) {
      console.error('Error fetching loyalty tier:', error)
    }
    return 'standard'
  }

  private async getLengthOfStay(bookingId: string): Promise<number> {
    try {
      const response = await fetch(`/api/os/bookings/${bookingId}`)
      if (response.ok) {
        const booking = await response.json()
        const checkIn = new Date(booking.checkIn)
        const checkOut = new Date(booking.checkOut)
        return Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24))
      }
    } catch (error) {
      console.error('Error fetching length of stay:', error)
    }
    return 1
  }

  private async getPartySize(bookingId: string): Promise<number> {
    try {
      const response = await fetch(`/api/os/bookings/${bookingId}`)
      if (response.ok) {
        const booking = await response.json()
        return booking.guests || 1
      }
    } catch (error) {
      console.error('Error fetching party size:', error)
    }
    return 1
  }

  private async getLeadTime(bookingId: string): Promise<number> {
    try {
      const response = await fetch(`/api/os/bookings/${bookingId}`)
      if (response.ok) {
        const booking = await response.json()
        const checkIn = new Date(booking.checkIn)
        return Math.ceil((checkIn.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      }
    } catch (error) {
      console.error('Error fetching lead time:', error)
    }
    return 0
  }

  private getCurrentSeason(): string {
    const month = new Date().getMonth()
    if (month >= 2 && month <= 4) return 'spring'
    if (month >= 5 && month <= 7) return 'summer'
    if (month >= 8 && month <= 10) return 'fall'
    return 'winter'
  }

  private compareValues(actual: any, operator: string, expected: any): boolean {
    switch (operator) {
      case 'equals': return actual === expected
      case 'not_equals': return actual !== expected
      case 'greater_than': return actual > expected
      case 'less_than': return actual < expected
      case 'in': return Array.isArray(expected) && expected.includes(actual)
      case 'between': return Array.isArray(expected) && actual >= expected[0] && actual <= expected[1]
      case 'contains': return String(actual).includes(String(expected))
      default: return false
    }
  }

  private async evaluateTargeting(request: UpsellRequest, config: UpsellConfig): Promise<TargetingInfo> {
    const segments = config.targeting.segmentation
    let matchedSegment = 'default'
    let score = 0
    const rules: string[] = []
    const reasons: string[] = []

    for (const segment of segments) {
      let segmentScore = 0
      const segmentRules: string[] = []

      for (const criteria of segment.criteria) {
        const value = await this.extractSegmentValue(criteria, request)
        if (this.compareValues(value, criteria.operator, criteria.value)) {
          segmentScore += 10
          segmentRules.push(`${criteria.attribute} ${criteria.operator} ${criteria.value}`)
        }
      }

      if (segmentScore > score) {
        score = segmentScore
        matchedSegment = segment.name
        rules.length = 0
        rules.push(...segmentRules)
        reasons.length = 0
        reasons.push(`Matched segment: ${segment.name}`)
      }
    }

    return {
      segment: matchedSegment,
      rules,
      score,
      reasons
    }
  }

  private async extractSegmentValue(criteria: SegmentCriteria, request: UpsellRequest): Promise<any> {
    switch (criteria.dimension) {
      case 'demographics':
        return await this.getGuestDemographics(request.guestId, criteria.attribute)
      case 'behavior':
        return await this.getGuestBehavior(request.guestId, criteria.attribute)
      case 'preferences':
        return request.preferences?.[criteria.attribute as keyof GuestPreferences]
      case 'value':
        return await this.getGuestValue(request.guestId, criteria.attribute)
      case 'loyalty':
        return await this.getLoyaltyAttribute(request.guestId, criteria.attribute)
      default:
        return null
    }
  }

  private async getGuestDemographics(guestId: string, attribute: string): Promise<any> {
    return null
  }

  private async getGuestBehavior(guestId: string, attribute: string): Promise<any> {
    return null
  }

  private async getGuestValue(guestId: string, attribute: string): Promise<any> {
    return null
  }

  private async getLoyaltyAttribute(guestId: string, attribute: string): Promise<any> {
    return null
  }

  private async generateRecommendations(
    request: UpsellRequest,
    strategies: UpsellStrategy[],
    config: UpsellConfig
  ): Promise<UpsellRecommendation[]> {
    const recommendations: UpsellRecommendation[] = []

    for (const strategy of strategies.slice(0, 3)) {
      for (const offer of strategy.offers) {
        const recommendation = await this.createRecommendation(strategy, offer, request, config)
        recommendations.push(recommendation)
      }
    }

    return recommendations.sort((a, b) => b.personalization.relevanceScore - a.personalization.relevanceScore)
  }

  private async createRecommendation(
    strategy: UpsellStrategy,
    offer: UpsellOffer,
    request: UpsellRequest,
    config: UpsellConfig
  ): Promise<UpsellRecommendation> {
    const channel = this.selectOptimalChannel(config.channels, request)
    const template = this.selectTemplate(channel, strategy)
    const personalizedContent = await this.personalizeContent(template, offer, request, config)

    return {
      id: `${strategy.id}-${offer.id}-${Date.now()}`,
      strategy: strategy.id,
      offer,
      presentation: {
        channel: channel.type,
        template: template.id,
        content: personalizedContent,
        images: strategy.presentation.images,
        cta: {
          text: this.generateCTAText(offer, strategy),
          style: 'primary',
          action: 'purchase',
          url: `/upsell/${offer.id}?booking=${request.bookingId}`,
          tracking: `upsell_${strategy.id}_${offer.id}`
        },
        layout: {
          position: strategy.presentation.displayType === 'popup' ? 'overlay' : 'inline',
          size: 'medium',
          animation: 'fade'
        }
      },
      urgency: {
        type: offer.validUntil ? 'time' : 'demand',
        message: this.generateUrgencyMessage(offer, strategy),
        countdown: offer.validUntil ? {
          endTime: offer.validUntil,
          format: 'hours',
          showDays: false
        } : undefined,
        availability: offer.maxQuantity ? {
          remaining: offer.maxQuantity,
          total: offer.maxQuantity,
          updateFrequency: 300
        } : undefined
      },
      personalization: {
        guestName: await this.getGuestName(request.guestId),
        customMessage: await this.generatePersonalizedMessage(request, offer, strategy),
        relevanceScore: await this.calculateRelevanceScore(request, offer, strategy),
        recommendations: await this.getRelatedRecommendations(request, offer)
      },
      tracking: {
        impressionId: `imp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        sessionId: request.sessionId || '',
        timestamp: new Date()
      }
    }
  }

  private selectOptimalChannel(channels: UpsellChannel[], request: UpsellRequest): UpsellChannel {
    const enabledChannels = channels.filter(c => c.enabled)
    const deviceOptimized = enabledChannels.filter(c =>
      (request.context.device === 'mobile' && c.type === 'mobile_app') ||
      (request.context.device === 'desktop' && c.type === 'web')
    )

    if (deviceOptimized.length > 0) {
      return deviceOptimized.sort((a, b) => b.priority - a.priority)[0]
    }

    return enabledChannels.sort((a, b) => b.priority - a.priority)[0] || channels[0]
  }

  private selectTemplate(channel: UpsellChannel, strategy: UpsellStrategy): ChannelTemplate {
    const templates = channel.templates.filter(t => t.name.includes(strategy.category))
    return templates[0] || channel.templates[0]
  }

  private async personalizeContent(
    template: ChannelTemplate,
    offer: UpsellOffer,
    request: UpsellRequest,
    config: UpsellConfig
  ): Promise<string> {
    let content = template.content

    const variables: Record<string, any> = {
      guest_name: await this.getGuestName(request.guestId),
      offer_title: offer.title,
      offer_description: offer.description,
      original_price: offer.originalPrice,
      sale_price: offer.salePrice,
      discount_percentage: offer.discountPercentage,
      savings: offer.savings,
      currency: offer.currency
    }

    for (const [key, value] of Object.entries(variables)) {
      content = content.replace(new RegExp(`{{${key}}}`, 'g'), String(value))
    }

    return content
  }

  private generateCTAText(offer: UpsellOffer, strategy: UpsellStrategy): string {
    const ctaOptions = {
      'room_upgrade': 'Upgrade Now',
      'service_addon': 'Add Service',
      'dining': 'Book Table',
      'spa': 'Book Spa',
      'activities': 'Book Activity',
      'transportation': 'Book Transfer',
      'package': 'Get Package'
    }

    return ctaOptions[strategy.category] || 'Get Offer'
  }

  private generateUrgencyMessage(offer: UpsellOffer, strategy: UpsellStrategy): string {
    if (offer.validUntil) {
      const hoursLeft = Math.ceil((offer.validUntil.getTime() - Date.now()) / (1000 * 60 * 60))
      return `Limited time offer - ${hoursLeft} hours remaining!`
    }

    if (offer.maxQuantity && offer.maxQuantity <= 5) {
      return `Only ${offer.maxQuantity} left available!`
    }

    return 'Popular choice - book now!'
  }

  private async getGuestName(guestId: string): Promise<string> {
    try {
      const response = await fetch(`/api/os/guests/${guestId}`)
      if (response.ok) {
        const guest = await response.json()
        return `${guest.firstName} ${guest.lastName}`
      }
    } catch (error) {
      console.error('Error fetching guest name:', error)
    }
    return 'Valued Guest'
  }

  private async generatePersonalizedMessage(
    request: UpsellRequest,
    offer: UpsellOffer,
    strategy: UpsellStrategy
  ): Promise<string> {
    const guestName = await this.getGuestName(request.guestId)
    const loyaltyTier = await this.getLoyaltyTier(request.guestId)

    if (loyaltyTier === 'platinum') {
      return `${guestName}, as our Platinum member, enjoy exclusive access to this premium ${strategy.category} offer.`
    }

    if (strategy.category === 'room_upgrade') {
      return `${guestName}, enhance your stay with a complimentary upgrade to our premium rooms.`
    }

    return `${guestName}, we've selected this special offer just for you based on your preferences.`
  }

  private async calculateRelevanceScore(
    request: UpsellRequest,
    offer: UpsellOffer,
    strategy: UpsellStrategy
  ): Promise<number> {
    let score = 0.5

    const guestHistory = request.history
    if (guestHistory) {
      const categoryInterest = guestHistory.interactions.filter(i =>
        i.offerId.includes(strategy.category)
      ).length
      score += Math.min(categoryInterest * 0.1, 0.3)

      const conversions = guestHistory.conversions.filter(c =>
        c.category === strategy.category
      ).length
      score += Math.min(conversions * 0.15, 0.2)
    }

    const loyaltyTier = await this.getLoyaltyTier(request.guestId)
    if (loyaltyTier === 'platinum') score += 0.1
    else if (loyaltyTier === 'gold') score += 0.05

    const bookingValue = await this.getBookingValue(request.bookingId)
    if (bookingValue > 500) score += 0.1

    return Math.min(1.0, score)
  }

  private async getRelatedRecommendations(request: UpsellRequest, offer: UpsellOffer): Promise<string[]> {
    return [
      'Consider our spa package for ultimate relaxation',
      'Add airport transfer for convenience',
      'Book dinner at our award-winning restaurant'
    ]
  }

  private createTrackingInfo(request: UpsellRequest, config: UpsellConfig): TrackingInfo {
    return {
      sessionId: request.sessionId || `session_${Date.now()}`,
      visitorId: request.guestId,
      utm: {
        source: 'website',
        medium: 'upsell',
        campaign: 'automated'
      },
      events: [
        {
          name: 'upsell_request',
          properties: {
            propertyId: request.propertyId,
            bookingId: request.bookingId,
            context: request.context
          },
          timestamp: new Date()
        }
      ]
    }
  }

  private async planNextActions(
    request: UpsellRequest,
    recommendations: UpsellRecommendation[],
    config: UpsellConfig
  ): Promise<NextAction[]> {
    const actions: NextAction[] = []

    if (recommendations.length > 0) {
      actions.push({
        type: 'follow_up',
        delay: 24 * 60,
        conditions: ['no_interaction'],
        parameters: {
          channel: 'email',
          template: 'follow_up',
          incentive: 5
        }
      })

      actions.push({
        type: 'retarget',
        delay: 3 * 24 * 60,
        conditions: ['viewed_but_not_converted'],
        parameters: {
          channels: ['web', 'mobile_app'],
          incentive: 10
        }
      })
    }

    return actions
  }

  private async calculateResponseAnalytics(
    request: UpsellRequest,
    recommendations: UpsellRecommendation[]
  ): Promise<ResponseAnalytics> {
    const guestHistory = request.history
    let conversionProbability = 0.1

    if (guestHistory) {
      const totalOffers = guestHistory.previousOffers.length
      const conversions = guestHistory.conversions.length
      if (totalOffers > 0) {
        conversionProbability = conversions / totalOffers
      }
    }

    const avgRelevance = recommendations.reduce((sum, r) => sum + r.personalization.relevanceScore, 0) / recommendations.length
    conversionProbability = conversionProbability * 0.7 + avgRelevance * 0.3

    return {
      conversionProbability,
      valueScore: 0.7,
      engagementScore: 0.6,
      riskScore: 0.2,
      insights: [
        `${recommendations.length} personalized offers generated`,
        `Average relevance score: ${avgRelevance.toFixed(2)}`,
        `Estimated conversion probability: ${(conversionProbability * 100).toFixed(1)}%`
      ]
    }
  }

  private async trackResponse(request: UpsellRequest, response: UpsellResponse): Promise<void> {
    const key = `${request.guestId}:${request.bookingId}`

    if (!this.recommendations.has(key)) {
      this.recommendations.set(key, [])
    }
    this.recommendations.get(key)!.push(...response.recommendations)

    for (const event of response.tracking.events) {
      await this.trackEvent(request.guestId, event)
    }
  }

  private async trackEvent(guestId: string, event: TrackingEvent): Promise<void> {
    if (!this.interactions.has(guestId)) {
      this.interactions.set(guestId, [])
    }

    this.interactions.get(guestId)!.push({
      type: event.name as any,
      offerId: event.properties.offerId || '',
      timestamp: event.timestamp,
      duration: event.properties.duration
    })
  }

  private initializeDefaultConfig(): void {
    const defaultConfig: UpsellConfig = {
      propertyId: 'default',
      enabled: true,
      strategies: [
        {
          id: 'room-upgrade-vip',
          name: 'VIP Room Upgrade',
          description: 'Automatic room upgrades for VIP guests',
          category: 'room_upgrade',
          priority: 100,
          active: true,
          conditions: [
            {
              type: 'loyalty_tier',
              operator: 'in',
              value: ['gold', 'platinum'],
              weight: 1.0
            }
          ],
          offers: [
            {
              id: 'deluxe-upgrade',
              title: 'Complimentary Deluxe Upgrade',
              description: 'Enjoy our premium deluxe room with ocean view',
              originalPrice: 100,
              salePrice: 0,
              discountPercentage: 100,
              value: 100,
              savings: 100,
              currency: 'USD'
            }
          ],
          presentation: {
            displayType: 'popup',
            template: 'upgrade-offer',
            images: [],
            priority: 1,
            frequency: {
              maxPerDay: 1,
              maxPerStay: 1,
              cooldownPeriod: 24,
              respectOptOut: true
            },
            urgency: {
              showCountdown: false,
              showLimitedAvailability: true,
              showLimitedTime: false,
              urgencyMessages: ['Limited availability']
            }
          },
          conversion: {
            conversionGoal: 'click',
            incentives: [],
            followUp: {
              enabled: false,
              delays: [],
              channels: [],
              templates: [],
              maxFollowUps: 0
            },
            abandonment: {
              trackAbandonment: false,
              retargetingDelay: 0,
              incentiveIncrease: 0,
              maxRetargetAttempts: 0
            }
          }
        }
      ],
      triggers: [
        {
          id: 'booking-confirmation',
          name: 'Post Booking Confirmation',
          event: 'booking_created',
          timing: {
            delay: 30,
            timeUnit: 'minutes',
            timezone: 'UTC',
            respectQuietHours: true
          },
          conditions: [],
          strategies: ['room-upgrade-vip'],
          active: true
        }
      ],
      channels: [
        {
          type: 'email',
          enabled: true,
          priority: 1,
          config: {
            fromAddress: 'noreply@baithakaghar.com',
            fromName: 'Baithaka GHAR',
            rateLimit: {
              maxPerHour: 10,
              maxPerDay: 50,
              backoffStrategy: 'exponential'
            }
          },
          templates: [
            {
              id: 'upgrade-offer-email',
              name: 'Room Upgrade Email',
              subject: 'Exclusive Upgrade Available',
              content: 'Dear {{guest_name}}, we have a special upgrade available for your stay...',
              variables: [],
              personalization: []
            }
          ],
          tracking: {
            trackOpens: true,
            trackClicks: true,
            trackConversions: true,
            utmParameters: {
              source: 'email',
              medium: 'upsell',
              campaign: 'upgrade'
            },
            customEvents: []
          }
        }
      ],
      targeting: {
        segmentation: [
          {
            id: 'vip-guests',
            name: 'VIP Guests',
            criteria: [
              {
                dimension: 'loyalty',
                attribute: 'tier',
                operator: 'in',
                value: ['gold', 'platinum']
              }
            ],
            strategies: ['room-upgrade-vip'],
            priority: 1
          }
        ],
        exclusions: [],
        frequency: {
          maxPerDay: 3,
          maxPerStay: 5,
          cooldownPeriod: 4,
          respectOptOut: true
        },
        testing: {
          abTestEnabled: false,
          testVariants: [],
          splitRatio: [],
          successMetric: 'conversion_rate',
          testDuration: 14
        }
      },
      timing: {
        optimalTimes: [],
        timezone: 'UTC',
        respectPreferences: true,
        businessHours: {
          start: '09:00',
          end: '18:00',
          daysOfWeek: [1, 2, 3, 4, 5]
        },
        quietHours: [
          {
            start: '22:00',
            end: '08:00',
            channels: ['sms', 'push']
          }
        ]
      },
      content: {
        personalization: {
          useGuestName: true,
          useBookingDetails: true,
          usePastBehavior: true,
          usePreferences: true,
          dynamicContent: []
        },
        localization: {
          enabled: true,
          languages: ['en', 'es', 'fr'],
          autoDetect: true,
          fallbackLanguage: 'en',
          currencyConversion: true
        },
        branding: {
          logo: '/assets/logo.png',
          colors: {
            primary: '#2c3e50',
            secondary: '#3498db',
            accent: '#e74c3c',
            text: '#333333',
            background: '#ffffff'
          },
          fonts: {
            heading: 'Helvetica Neue',
            body: 'Arial',
            accent: 'Georgia'
          },
          voice: {
            tone: 'friendly',
            style: 'conversational',
            language: ['en']
          }
        },
        compliance: {
          gdprCompliant: true,
          ccpaCompliant: true,
          canSpamCompliant: true,
          optInRequired: false,
          unsubscribeLink: true
        }
      },
      analytics: {
        trackingEnabled: true,
        metrics: ['impressions', 'clicks', 'conversions', 'revenue'],
        reporting: {
          frequency: 'weekly',
          recipients: ['marketing@baithakaghar.com'],
          format: 'email',
          customMetrics: []
        },
        integration: {
          googleAnalytics: 'GA-XXXX-X',
          customTracking: []
        }
      }
    }

    this.configs.set('default', defaultConfig)
  }

  async updateConfiguration(propertyId: string, config: UpsellConfig): Promise<void> {
    this.configs.set(propertyId, config)
    await this.saveConfiguration(propertyId, config)
  }

  async getConfiguration(propertyId: string): Promise<UpsellConfig | null> {
    return this.configs.get(propertyId) || null
  }

  async trackInteraction(guestId: string, interaction: InteractionHistory): Promise<void> {
    if (!this.interactions.has(guestId)) {
      this.interactions.set(guestId, [])
    }
    this.interactions.get(guestId)!.push(interaction)
  }

  async trackConversion(guestId: string, conversion: ConversionHistory): Promise<void> {
    if (!this.conversions.has(guestId)) {
      this.conversions.set(guestId, [])
    }
    this.conversions.get(guestId)!.push(conversion)
  }

  async getMetrics(propertyId: string, startDate: Date, endDate: Date): Promise<UpsellMetrics> {
    const recommendations = Array.from(this.recommendations.values()).flat()
      .filter(r => r.tracking.timestamp >= startDate && r.tracking.timestamp <= endDate)

    const conversions = Array.from(this.conversions.values()).flat()
      .filter(c => c.convertedAt >= startDate && c.convertedAt <= endDate)

    const totalOffers = recommendations.length
    const totalConversions = conversions.length
    const totalRevenue = conversions.reduce((sum, c) => sum + c.value, 0)

    return {
      period: { start: startDate, end: endDate },
      summary: {
        totalOffers,
        totalConversions,
        conversionRate: totalOffers > 0 ? totalConversions / totalOffers : 0,
        totalRevenue,
        avgOrderValue: totalConversions > 0 ? totalRevenue / totalConversions : 0,
        roi: 5.2
      },
      breakdown: {
        byStrategy: {},
        byChannel: {},
        bySegment: {},
        byOffer: {}
      },
      trends: [],
      cohorts: []
    }
  }

  private async saveConfiguration(propertyId: string, config: UpsellConfig): Promise<void> {
  }

  async pauseStrategy(strategyId: string): Promise<void> {
    for (const config of this.configs.values()) {
      const strategy = config.strategies.find(s => s.id === strategyId)
      if (strategy) {
        strategy.active = false
      }
    }
  }

  async resumeStrategy(strategyId: string): Promise<void> {
    for (const config of this.configs.values()) {
      const strategy = config.strategies.find(s => s.id === strategyId)
      if (strategy) {
        strategy.active = true
      }
    }
  }
}

export const upsellService = new UpsellService()