export interface PaymentCancellationConfig {
  propertyId: string
  enabled: boolean
  rules: CancellationRule[]
  graceSettings: GraceSettings
  notificationSettings: NotificationSettings
  refundSettings: RefundSettings
  retrySettings: RetrySettings
  escalationSettings: EscalationSettings
}

export interface CancellationRule {
  id: string
  name: string
  description: string
  conditions: CancellationCondition[]
  triggers: CancellationTrigger[]
  actions: CancellationAction[]
  priority: number
  active: boolean
  exemptions?: Exemption[]
}

export interface CancellationCondition {
  type: 'payment_status' | 'payment_method' | 'booking_value' | 'guest_type' | 'lead_time' | 'retry_count'
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'in' | 'not_in'
  value: any
  weight: number
}

export interface CancellationTrigger {
  event: 'payment_failed' | 'payment_timeout' | 'payment_declined' | 'chargeback_received' | 'scheduled_check'
  delay: number
  repeatInterval?: number
  maxRepeats?: number
}

export interface CancellationAction {
  type: 'cancel_booking' | 'hold_room' | 'notify_guest' | 'notify_staff' | 'create_task' | 'apply_penalty' | 'offer_alternative'
  parameters: ActionParameters
  executeAt: 'immediate' | 'delayed' | 'scheduled'
  delay?: number
}

export interface ActionParameters {
  holdDuration?: number
  penaltyAmount?: number
  penaltyType?: 'fixed' | 'percentage'
  notificationTemplate?: string
  alternativeOffers?: AlternativeOffer[]
  taskAssignee?: string
  taskPriority?: 'low' | 'medium' | 'high' | 'urgent'
}

export interface AlternativeOffer {
  type: 'payment_plan' | 'date_change' | 'room_downgrade' | 'partial_refund'
  description: string
  terms: OfferTerms
  validUntil: Date
}

export interface OfferTerms {
  paymentPlan?: {
    installments: number
    firstPaymentDue: Date
    interestRate: number
  }
  dateChange?: {
    minDaysOut: number
    maxDaysOut: number
    rateDifference: number
  }
  roomDowngrade?: {
    targetRoomTypes: string[]
    refundAmount: number
  }
  partialRefund?: {
    refundPercentage: number
    retainedAmount: number
  }
}

export interface Exemption {
  type: 'guest_tier' | 'booking_value' | 'payment_method' | 'special_circumstances'
  criteria: any
  reason: string
  approvalRequired: boolean
}

export interface GraceSettings {
  enabled: boolean
  defaultGracePeriod: number
  tierGracePeriods: Record<string, number>
  maxGraceExtensions: number
  gracePeriodNotifications: boolean
}

export interface NotificationSettings {
  notifyGuest: boolean
  notifyStaff: boolean
  notifyManagement: boolean
  channels: string[]
  templates: Record<string, string>
  escalationLevels: NotificationEscalation[]
}

export interface NotificationEscalation {
  level: number
  delay: number
  recipients: string[]
  severity: 'info' | 'warning' | 'critical'
}

export interface RefundSettings {
  automaticRefunds: boolean
  refundPolicy: RefundPolicy[]
  partialRefundRules: PartialRefundRule[]
  processingTime: number
  refundMethods: string[]
}

export interface RefundPolicy {
  timeframe: number
  refundPercentage: number
  conditions: string[]
}

export interface PartialRefundRule {
  trigger: string
  refundPercentage: number
  maxAmount?: number
  conditions: string[]
}

export interface RetrySettings {
  enabled: boolean
  maxRetries: number
  retryIntervals: number[]
  retryMethods: string[]
  escalateAfterRetries: boolean
}

export interface EscalationSettings {
  enabled: boolean
  escalationLevels: EscalationLevel[]
  autoEscalationRules: AutoEscalationRule[]
}

export interface EscalationLevel {
  level: number
  name: string
  assignees: string[]
  timeToEscalate: number
  actions: string[]
}

export interface AutoEscalationRule {
  trigger: string
  targetLevel: number
  conditions: string[]
}

export interface PaymentFailureEvent {
  bookingId: string
  paymentId: string
  paymentMethod: string
  amount: number
  currency: string
  failureReason: string
  failureCode: string
  timestamp: Date
  retryCount: number
  lastRetryAt?: Date
  guestId: string
  propertyId: string
}

export interface CancellationDecision {
  bookingId: string
  decision: 'cancel' | 'hold' | 'retry' | 'escalate' | 'exempt'
  reason: string
  appliedRule?: string
  gracePeriodGranted?: number
  actions: ExecutedAction[]
  alternativesOffered?: AlternativeOffer[]
  nextReviewDate?: Date
  decidedBy: 'system' | 'staff'
  decidedAt: Date
}

export interface ExecutedAction {
  type: string
  status: 'pending' | 'completed' | 'failed'
  executedAt?: Date
  result?: any
  error?: string
}

export interface CancellationReport {
  period: {
    start: Date
    end: Date
  }
  summary: {
    totalFailures: number
    totalCancellations: number
    totalGraceGranted: number
    totalExemptions: number
    cancellationRate: number
    recoveryRate: number
  }
  breakdown: {
    byReason: Record<string, number>
    byPaymentMethod: Record<string, number>
    byGuestTier: Record<string, number>
    byRoomType: Record<string, number>
  }
  financialImpact: {
    lostRevenue: number
    recoveredRevenue: number
    refundsProcessed: number
    penaltiesCollected: number
  }
  trends: TrendData[]
}

export interface TrendData {
  date: Date
  failures: number
  cancellations: number
  recoveries: number
}

export class PaymentCancellationService {
  private configs = new Map<string, PaymentCancellationConfig>()
  private pendingCancellations = new Map<string, CancellationDecision>()
  private gracePeriods = new Map<string, Date>()
  private retryQueues = new Map<string, PaymentFailureEvent[]>()
  private cancellationHistory = new Map<string, CancellationDecision[]>()
  private processingInterval?: NodeJS.Timeout

  constructor() {
    this.initializeDefaultConfigs()
    this.startPaymentMonitoring()
  }

  async handlePaymentFailure(event: PaymentFailureEvent): Promise<CancellationDecision> {
    const config = this.configs.get(event.propertyId)
    if (!config || !config.enabled) {
      throw new Error('Payment cancellation not configured or disabled for this property')
    }

    const applicableRules = await this.findApplicableRules(event, config)
    const exemption = await this.checkExemptions(event, applicableRules)

    if (exemption) {
      return this.createExemptionDecision(event, exemption)
    }

    const decision = await this.evaluateCancellationDecision(event, applicableRules, config)
    await this.executeDecision(decision, config)

    this.storeCancellationDecision(event.bookingId, decision)
    return decision
  }

  private async findApplicableRules(
    event: PaymentFailureEvent,
    config: PaymentCancellationConfig
  ): Promise<CancellationRule[]> {
    const applicable: CancellationRule[] = []

    for (const rule of config.rules) {
      if (!rule.active) continue

      const triggerMatches = rule.triggers.some(trigger =>
        this.evaluateTrigger(trigger, event)
      )

      if (!triggerMatches) continue

      const conditionsMet = await this.evaluateConditions(rule.conditions, event)
      if (conditionsMet) {
        applicable.push(rule)
      }
    }

    return applicable.sort((a, b) => b.priority - a.priority)
  }

  private evaluateTrigger(trigger: CancellationTrigger, event: PaymentFailureEvent): boolean {
    switch (trigger.event) {
      case 'payment_failed':
        return true
      case 'payment_timeout':
        return event.failureReason.includes('timeout')
      case 'payment_declined':
        return event.failureReason.includes('declined') || event.failureReason.includes('insufficient')
      case 'chargeback_received':
        return event.failureReason.includes('chargeback')
      default:
        return false
    }
  }

  private async evaluateConditions(
    conditions: CancellationCondition[],
    event: PaymentFailureEvent
  ): Promise<boolean> {
    for (const condition of conditions) {
      const actualValue = await this.extractConditionValue(condition.type, event)
      const conditionMet = this.compareValues(actualValue, condition.operator, condition.value)

      if (!conditionMet) {
        return false
      }
    }

    return true
  }

  private async extractConditionValue(type: string, event: PaymentFailureEvent): Promise<any> {
    switch (type) {
      case 'payment_status':
        return 'failed'
      case 'payment_method':
        return event.paymentMethod
      case 'booking_value':
        return event.amount
      case 'retry_count':
        return event.retryCount
      case 'guest_type':
        return await this.getGuestType(event.guestId)
      case 'lead_time':
        return await this.getBookingLeadTime(event.bookingId)
      default:
        return null
    }
  }

  private compareValues(actual: any, operator: string, expected: any): boolean {
    switch (operator) {
      case 'equals': return actual === expected
      case 'not_equals': return actual !== expected
      case 'greater_than': return actual > expected
      case 'less_than': return actual < expected
      case 'in': return Array.isArray(expected) && expected.includes(actual)
      case 'not_in': return Array.isArray(expected) && !expected.includes(actual)
      default: return false
    }
  }

  private async getGuestType(guestId: string): Promise<string> {
    try {
      const response = await fetch(`/api/os/guests/${guestId}/profile`)
      if (response.ok) {
        const guest = await response.json()
        return guest.loyaltyTier || 'standard'
      }
    } catch (error) {
      console.error('Error fetching guest type:', error)
    }
    return 'standard'
  }

  private async getBookingLeadTime(bookingId: string): Promise<number> {
    try {
      const response = await fetch(`/api/os/bookings/${bookingId}`)
      if (response.ok) {
        const booking = await response.json()
        const checkInDate = new Date(booking.checkIn)
        return Math.ceil((checkInDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      }
    } catch (error) {
      console.error('Error fetching booking lead time:', error)
    }
    return 0
  }

  private async checkExemptions(
    event: PaymentFailureEvent,
    rules: CancellationRule[]
  ): Promise<Exemption | null> {
    for (const rule of rules) {
      if (!rule.exemptions) continue

      for (const exemption of rule.exemptions) {
        if (await this.evaluateExemption(exemption, event)) {
          return exemption
        }
      }
    }

    return null
  }

  private async evaluateExemption(exemption: Exemption, event: PaymentFailureEvent): Promise<boolean> {
    switch (exemption.type) {
      case 'guest_tier':
        const guestTier = await this.getGuestType(event.guestId)
        return exemption.criteria.includes(guestTier)

      case 'booking_value':
        return event.amount >= exemption.criteria.minimumValue

      case 'payment_method':
        return exemption.criteria.includes(event.paymentMethod)

      case 'special_circumstances':
        return await this.checkSpecialCircumstances(event, exemption.criteria)

      default:
        return false
    }
  }

  private async checkSpecialCircumstances(event: PaymentFailureEvent, criteria: any): Promise<boolean> {
    return false
  }

  private createExemptionDecision(event: PaymentFailureEvent, exemption: Exemption): CancellationDecision {
    return {
      bookingId: event.bookingId,
      decision: 'exempt',
      reason: exemption.reason,
      actions: [],
      decidedBy: exemption.approvalRequired ? 'staff' : 'system',
      decidedAt: new Date()
    }
  }

  private async evaluateCancellationDecision(
    event: PaymentFailureEvent,
    rules: CancellationRule[],
    config: PaymentCancellationConfig
  ): Promise<CancellationDecision> {
    if (rules.length === 0) {
      return this.createDefaultDecision(event, config)
    }

    const primaryRule = rules[0]
    const gracePeriodEnd = this.gracePeriods.get(event.bookingId)

    if (config.graceSettings.enabled && !gracePeriodEnd) {
      return this.createGraceDecision(event, config, primaryRule)
    }

    if (gracePeriodEnd && new Date() < gracePeriodEnd) {
      return this.createHoldDecision(event, primaryRule)
    }

    if (config.retrySettings.enabled && event.retryCount < config.retrySettings.maxRetries) {
      return this.createRetryDecision(event, config, primaryRule)
    }

    return this.createCancellationDecision(event, primaryRule, config)
  }

  private createDefaultDecision(event: PaymentFailureEvent, config: PaymentCancellationConfig): CancellationDecision {
    const gracePeriod = config.graceSettings.enabled ? config.graceSettings.defaultGracePeriod : 0

    if (gracePeriod > 0) {
      const graceEnd = new Date(Date.now() + gracePeriod * 60 * 60 * 1000)
      this.gracePeriods.set(event.bookingId, graceEnd)

      return {
        bookingId: event.bookingId,
        decision: 'hold',
        reason: 'Default grace period applied',
        gracePeriodGranted: gracePeriod,
        actions: [
          {
            type: 'notify_guest',
            status: 'pending'
          }
        ],
        nextReviewDate: graceEnd,
        decidedBy: 'system',
        decidedAt: new Date()
      }
    }

    return {
      bookingId: event.bookingId,
      decision: 'cancel',
      reason: 'No applicable rules found, default cancellation',
      actions: [
        {
          type: 'cancel_booking',
          status: 'pending'
        },
        {
          type: 'notify_guest',
          status: 'pending'
        }
      ],
      decidedBy: 'system',
      decidedAt: new Date()
    }
  }

  private createGraceDecision(
    event: PaymentFailureEvent,
    config: PaymentCancellationConfig,
    rule: CancellationRule
  ): CancellationDecision {
    const guestType = 'standard'
    const gracePeriod = config.graceSettings.tierGracePeriods[guestType] || config.graceSettings.defaultGracePeriod
    const graceEnd = new Date(Date.now() + gracePeriod * 60 * 60 * 1000)

    this.gracePeriods.set(event.bookingId, graceEnd)

    return {
      bookingId: event.bookingId,
      decision: 'hold',
      reason: 'Grace period granted for payment retry',
      appliedRule: rule.id,
      gracePeriodGranted: gracePeriod,
      actions: [
        {
          type: 'notify_guest',
          status: 'pending'
        },
        {
          type: 'hold_room',
          status: 'pending'
        }
      ],
      nextReviewDate: graceEnd,
      decidedBy: 'system',
      decidedAt: new Date()
    }
  }

  private createHoldDecision(event: PaymentFailureEvent, rule: CancellationRule): CancellationDecision {
    return {
      bookingId: event.bookingId,
      decision: 'hold',
      reason: 'Within grace period, holding room',
      appliedRule: rule.id,
      actions: [],
      decidedBy: 'system',
      decidedAt: new Date()
    }
  }

  private createRetryDecision(
    event: PaymentFailureEvent,
    config: PaymentCancellationConfig,
    rule: CancellationRule
  ): CancellationDecision {
    const retryDelay = config.retrySettings.retryIntervals[event.retryCount] || 60
    const nextRetryAt = new Date(Date.now() + retryDelay * 60 * 1000)

    return {
      bookingId: event.bookingId,
      decision: 'retry',
      reason: `Automatic retry ${event.retryCount + 1} of ${config.retrySettings.maxRetries}`,
      appliedRule: rule.id,
      actions: [
        {
          type: 'retry_payment',
          status: 'pending'
        }
      ],
      nextReviewDate: nextRetryAt,
      decidedBy: 'system',
      decidedAt: new Date()
    }
  }

  private createCancellationDecision(
    event: PaymentFailureEvent,
    rule: CancellationRule,
    config: PaymentCancellationConfig
  ): CancellationDecision {
    const actions: ExecutedAction[] = []

    for (const ruleAction of rule.actions) {
      actions.push({
        type: ruleAction.type,
        status: 'pending'
      })
    }

    const alternatives = this.generateAlternativeOffers(event, rule)

    return {
      bookingId: event.bookingId,
      decision: 'cancel',
      reason: `Payment failure exceeded retry limits: ${event.failureReason}`,
      appliedRule: rule.id,
      actions,
      alternativesOffered: alternatives,
      decidedBy: 'system',
      decidedAt: new Date()
    }
  }

  private generateAlternativeOffers(event: PaymentFailureEvent, rule: CancellationRule): AlternativeOffer[] {
    const offers: AlternativeOffer[] = []

    const offerPaymentPlan = rule.actions.some(a => a.parameters.alternativeOffers?.some(o => o.type === 'payment_plan'))
    if (offerPaymentPlan && event.amount > 200) {
      offers.push({
        type: 'payment_plan',
        description: 'Split payment into 3 installments',
        terms: {
          paymentPlan: {
            installments: 3,
            firstPaymentDue: new Date(Date.now() + 24 * 60 * 60 * 1000),
            interestRate: 0
          }
        },
        validUntil: new Date(Date.now() + 48 * 60 * 60 * 1000)
      })
    }

    const offerDateChange = rule.actions.some(a => a.parameters.alternativeOffers?.some(o => o.type === 'date_change'))
    if (offerDateChange) {
      offers.push({
        type: 'date_change',
        description: 'Move your booking to a different date with flexible rates',
        terms: {
          dateChange: {
            minDaysOut: 7,
            maxDaysOut: 90,
            rateDifference: -10
          }
        },
        validUntil: new Date(Date.now() + 72 * 60 * 60 * 1000)
      })
    }

    return offers
  }

  private async executeDecision(decision: CancellationDecision, config: PaymentCancellationConfig): Promise<void> {
    for (const action of decision.actions) {
      try {
        await this.executeAction(action, decision, config)
        action.status = 'completed'
        action.executedAt = new Date()
      } catch (error) {
        action.status = 'failed'
        action.error = error instanceof Error ? error.message : 'Unknown error'
        console.error(`Failed to execute action ${action.type}:`, error)
      }
    }
  }

  private async executeAction(
    action: ExecutedAction,
    decision: CancellationDecision,
    config: PaymentCancellationConfig
  ): Promise<void> {
    switch (action.type) {
      case 'cancel_booking':
        await this.cancelBooking(decision.bookingId)
        break

      case 'hold_room':
        await this.holdRoom(decision.bookingId, 24)
        break

      case 'notify_guest':
        await this.notifyGuest(decision, config)
        break

      case 'notify_staff':
        await this.notifyStaff(decision, config)
        break

      case 'create_task':
        await this.createTask(decision)
        break

      case 'apply_penalty':
        await this.applyPenalty(decision)
        break

      case 'retry_payment':
        await this.schedulePaymentRetry(decision)
        break

      default:
        console.warn(`Unknown action type: ${action.type}`)
    }
  }

  private async cancelBooking(bookingId: string): Promise<void> {
    const response = await fetch(`/api/os/bookings/${bookingId}/cancel`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        reason: 'Payment failure - automatic cancellation',
        cancelledBy: 'system'
      })
    })

    if (!response.ok) {
      throw new Error(`Failed to cancel booking: ${response.statusText}`)
    }
  }

  private async holdRoom(bookingId: string, hours: number): Promise<void> {
    const response = await fetch(`/api/os/bookings/${bookingId}/hold`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        holdUntil: new Date(Date.now() + hours * 60 * 60 * 1000),
        reason: 'Payment failure - holding for grace period'
      })
    })

    if (!response.ok) {
      throw new Error(`Failed to hold room: ${response.statusText}`)
    }
  }

  private async notifyGuest(decision: CancellationDecision, config: PaymentCancellationConfig): Promise<void> {
    if (!config.notificationSettings.notifyGuest) return

    const templateKey = decision.decision === 'cancel' ? 'cancellation' : 'payment_reminder'
    const template = config.notificationSettings.templates[templateKey]

    for (const channel of config.notificationSettings.channels) {
      try {
        await this.sendNotification(channel, decision.bookingId, template, decision)
      } catch (error) {
        console.error(`Failed to send ${channel} notification:`, error)
      }
    }
  }

  private async notifyStaff(decision: CancellationDecision, config: PaymentCancellationConfig): Promise<void> {
    if (!config.notificationSettings.notifyStaff) return

    const notification = {
      type: 'payment_cancellation',
      severity: decision.decision === 'cancel' ? 'warning' : 'info',
      message: `Booking ${decision.bookingId}: ${decision.reason}`,
      bookingId: decision.bookingId,
      decision: decision.decision,
      timestamp: new Date()
    }

    await fetch('/api/notifications/staff', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(notification)
    })
  }

  private async createTask(decision: CancellationDecision): Promise<void> {
    const task = {
      title: `Review cancelled booking: ${decision.bookingId}`,
      description: `Booking cancelled due to payment failure: ${decision.reason}`,
      priority: 'medium',
      type: 'payment_review',
      bookingId: decision.bookingId,
      dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000)
    }

    await fetch('/api/os/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(task)
    })
  }

  private async applyPenalty(decision: CancellationDecision): Promise<void> {
  }

  private async schedulePaymentRetry(decision: CancellationDecision): Promise<void> {
    const retryAt = decision.nextReviewDate || new Date(Date.now() + 60 * 60 * 1000)

    setTimeout(async () => {
      try {
        await fetch(`/api/payments/${decision.bookingId}/retry`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        })
      } catch (error) {
        console.error('Payment retry failed:', error)
      }
    }, retryAt.getTime() - Date.now())
  }

  private async sendNotification(
    channel: string,
    bookingId: string,
    template: string,
    decision: CancellationDecision
  ): Promise<void> {
    const endpoint = `/api/communications/${channel}/send`

    await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        bookingId,
        template,
        data: {
          decision: decision.decision,
          reason: decision.reason,
          alternatives: decision.alternativesOffered
        }
      })
    })
  }

  private storeCancellationDecision(bookingId: string, decision: CancellationDecision): void {
    if (!this.cancellationHistory.has(bookingId)) {
      this.cancellationHistory.set(bookingId, [])
    }
    this.cancellationHistory.get(bookingId)!.push(decision)
  }

  private startPaymentMonitoring(): void {
    this.processingInterval = setInterval(() => {
      this.processScheduledActions()
    }, 60000)
  }

  private async processScheduledActions(): Promise<void> {
    const now = new Date()

    for (const [bookingId, decision] of this.pendingCancellations) {
      if (decision.nextReviewDate && decision.nextReviewDate <= now) {
        try {
          await this.reviewPendingCancellation(bookingId, decision)
        } catch (error) {
          console.error(`Error reviewing pending cancellation for ${bookingId}:`, error)
        }
      }
    }

    for (const [bookingId, graceEnd] of this.gracePeriods) {
      if (graceEnd <= now) {
        this.gracePeriods.delete(bookingId)
        try {
          await this.processExpiredGracePeriod(bookingId)
        } catch (error) {
          console.error(`Error processing expired grace period for ${bookingId}:`, error)
        }
      }
    }
  }

  private async reviewPendingCancellation(bookingId: string, decision: CancellationDecision): Promise<void> {
    this.pendingCancellations.delete(bookingId)

    if (decision.decision === 'retry') {
      const paymentStatus = await this.checkPaymentStatus(bookingId)
      if (paymentStatus === 'success') {
        return
      }
    }

    await this.executeDecision(decision, this.configs.get('default')!)
  }

  private async processExpiredGracePeriod(bookingId: string): Promise<void> {
    const paymentStatus = await this.checkPaymentStatus(bookingId)
    if (paymentStatus === 'success') {
      return
    }

    const failureEvent: PaymentFailureEvent = {
      bookingId,
      paymentId: `grace-expired-${bookingId}`,
      paymentMethod: 'unknown',
      amount: 0,
      currency: 'USD',
      failureReason: 'Grace period expired without payment',
      failureCode: 'GRACE_EXPIRED',
      timestamp: new Date(),
      retryCount: 999,
      guestId: 'unknown',
      propertyId: 'default'
    }

    await this.handlePaymentFailure(failureEvent)
  }

  private async checkPaymentStatus(bookingId: string): Promise<string> {
    try {
      const response = await fetch(`/api/payments/booking/${bookingId}/status`)
      if (response.ok) {
        const data = await response.json()
        return data.status
      }
    } catch (error) {
      console.error('Error checking payment status:', error)
    }
    return 'unknown'
  }

  private initializeDefaultConfigs(): void {
    const defaultConfig: PaymentCancellationConfig = {
      propertyId: 'default',
      enabled: true,
      rules: [
        {
          id: 'standard-payment-failure',
          name: 'Standard Payment Failure',
          description: 'Default rule for payment failures',
          conditions: [
            {
              type: 'payment_status',
              operator: 'equals',
              value: 'failed',
              weight: 1.0
            }
          ],
          triggers: [
            {
              event: 'payment_failed',
              delay: 0
            }
          ],
          actions: [
            {
              type: 'notify_guest',
              parameters: {
                notificationTemplate: 'payment_failure'
              },
              executeAt: 'immediate'
            },
            {
              type: 'hold_room',
              parameters: {
                holdDuration: 24
              },
              executeAt: 'immediate'
            }
          ],
          priority: 100,
          active: true
        }
      ],
      graceSettings: {
        enabled: true,
        defaultGracePeriod: 24,
        tierGracePeriods: {
          'gold': 48,
          'platinum': 72
        },
        maxGraceExtensions: 2,
        gracePeriodNotifications: true
      },
      notificationSettings: {
        notifyGuest: true,
        notifyStaff: true,
        notifyManagement: false,
        channels: ['email', 'sms'],
        templates: {
          'payment_failure': 'payment-failure-template',
          'cancellation': 'booking-cancelled-template',
          'grace_period': 'grace-period-template'
        },
        escalationLevels: []
      },
      refundSettings: {
        automaticRefunds: true,
        refundPolicy: [
          {
            timeframe: 24,
            refundPercentage: 100,
            conditions: ['system_cancellation']
          }
        ],
        partialRefundRules: [],
        processingTime: 5,
        refundMethods: ['original_payment_method', 'bank_transfer']
      },
      retrySettings: {
        enabled: true,
        maxRetries: 3,
        retryIntervals: [60, 180, 360],
        retryMethods: ['same_method', 'alternative_method'],
        escalateAfterRetries: true
      },
      escalationSettings: {
        enabled: true,
        escalationLevels: [
          {
            level: 1,
            name: 'Front Desk',
            assignees: ['front_desk'],
            timeToEscalate: 4,
            actions: ['contact_guest', 'offer_alternatives']
          },
          {
            level: 2,
            name: 'Management',
            assignees: ['manager'],
            timeToEscalate: 8,
            actions: ['review_case', 'approve_exceptions']
          }
        ],
        autoEscalationRules: []
      }
    }

    this.configs.set('default', defaultConfig)
  }

  async updateConfiguration(propertyId: string, config: PaymentCancellationConfig): Promise<void> {
    this.configs.set(propertyId, config)
    await this.saveConfiguration(propertyId, config)
  }

  async getConfiguration(propertyId: string): Promise<PaymentCancellationConfig | null> {
    return this.configs.get(propertyId) || null
  }

  async getCancellationHistory(bookingId: string): Promise<CancellationDecision[]> {
    return this.cancellationHistory.get(bookingId) || []
  }

  async generateReport(propertyId: string, startDate: Date, endDate: Date): Promise<CancellationReport> {
    const decisions = Array.from(this.cancellationHistory.values())
      .flat()
      .filter(d => d.decidedAt >= startDate && d.decidedAt <= endDate)

    const totalFailures = decisions.length
    const totalCancellations = decisions.filter(d => d.decision === 'cancel').length
    const totalGraceGranted = decisions.filter(d => d.gracePeriodGranted).length
    const totalExemptions = decisions.filter(d => d.decision === 'exempt').length

    return {
      period: { start: startDate, end: endDate },
      summary: {
        totalFailures,
        totalCancellations,
        totalGraceGranted,
        totalExemptions,
        cancellationRate: totalFailures > 0 ? totalCancellations / totalFailures : 0,
        recoveryRate: totalFailures > 0 ? (totalFailures - totalCancellations) / totalFailures : 0
      },
      breakdown: {
        byReason: {},
        byPaymentMethod: {},
        byGuestTier: {},
        byRoomType: {}
      },
      financialImpact: {
        lostRevenue: 0,
        recoveredRevenue: 0,
        refundsProcessed: 0,
        penaltiesCollected: 0
      },
      trends: []
    }
  }

  private async saveConfiguration(propertyId: string, config: PaymentCancellationConfig): Promise<void> {
  }

  async manualIntervention(bookingId: string, decision: 'approve' | 'deny' | 'extend_grace', reason: string): Promise<void> {
    const pendingDecision = this.pendingCancellations.get(bookingId)
    if (!pendingDecision) {
      throw new Error('No pending cancellation decision found')
    }

    if (decision === 'approve') {
      await this.cancelBooking(bookingId)
    } else if (decision === 'extend_grace') {
      const newGraceEnd = new Date(Date.now() + 24 * 60 * 60 * 1000)
      this.gracePeriods.set(bookingId, newGraceEnd)
    }

    pendingDecision.decidedBy = 'staff'
    pendingDecision.reason = `${pendingDecision.reason} - Manual intervention: ${reason}`

    this.pendingCancellations.delete(bookingId)
  }

  stopMonitoring(): void {
    if (this.processingInterval) {
      clearInterval(this.processingInterval)
      this.processingInterval = undefined
    }
  }
}

export const paymentCancellationService = new PaymentCancellationService()