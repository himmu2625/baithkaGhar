import { connectToDatabase } from '@/lib/mongodb'
import Booking from '@/models/Booking'
import { PaymentService } from './payment-service'
import { addDays, addHours, isAfter } from 'date-fns'

export interface PaymentFailureAnalysis {
  bookingId: string
  totalFailures: number
  consecutiveFailures: number
  failureReasons: Record<string, number>
  lastFailureTime: Date
  riskLevel: 'low' | 'medium' | 'high' | 'critical'
  recommendations: string[]
  nextRetryTime?: Date
  shouldBlockBooking: boolean
}

export interface PaymentRetryConfig {
  maxRetries: number
  retryIntervals: number[] // in hours
  autoRetryEnabled: boolean
  escalationThresholds: {
    medium: number
    high: number
    critical: number
  }
  blockingReasons: string[]
  gracePeriod: number // hours
}

export interface PaymentFailureAction {
  action: 'retry' | 'escalate' | 'cancel' | 'hold' | 'manual_review'
  reason: string
  scheduledTime?: Date
  requiresManualIntervention: boolean
  notificationRequired: boolean
  priority: 'low' | 'medium' | 'high' | 'urgent'
}

export class PaymentFailureHandler {
  private static readonly DEFAULT_CONFIG: PaymentRetryConfig = {
    maxRetries: 3,
    retryIntervals: [2, 24, 72], // 2 hours, 1 day, 3 days
    autoRetryEnabled: true,
    escalationThresholds: {
      medium: 2,
      high: 3,
      critical: 5
    },
    blockingReasons: [
      'INSUFFICIENT_FUNDS',
      'CARD_BLOCKED',
      'BANK_DECLINE',
      'RISK_THRESHOLD_EXCEEDED'
    ],
    gracePeriod: 48 // 48 hours grace period for critical bookings
  }

  // Analyze payment failure for a booking
  static async analyzePaymentFailure(bookingId: string): Promise<PaymentFailureAnalysis> {
    try {
      await connectToDatabase()

      const booking = await Booking.findById(bookingId)
      if (!booking) {
        throw new Error('Booking not found')
      }

      const failures = booking.paymentFailures || []
      const totalFailures = failures.length

      // Calculate consecutive failures
      let consecutiveFailures = 0
      for (let i = failures.length - 1; i >= 0; i--) {
        if (failures[i].errorCode) {
          consecutiveFailures++
        } else {
          break
        }
      }

      // Analyze failure reasons
      const failureReasons: Record<string, number> = {}
      failures.forEach(failure => {
        const reason = failure.errorCode || 'UNKNOWN'
        failureReasons[reason] = (failureReasons[reason] || 0) + 1
      })

      const lastFailureTime = failures.length > 0
        ? new Date(failures[failures.length - 1].attemptedAt)
        : new Date()

      const riskLevel = this.calculateRiskLevel(totalFailures, consecutiveFailures, failureReasons)
      const recommendations = this.generateRecommendations(riskLevel, failureReasons, booking)
      const nextRetryTime = this.calculateNextRetryTime(failures, booking)
      const shouldBlockBooking = this.shouldBlockBooking(failureReasons, consecutiveFailures)

      return {
        bookingId,
        totalFailures,
        consecutiveFailures,
        failureReasons,
        lastFailureTime,
        riskLevel,
        recommendations,
        nextRetryTime,
        shouldBlockBooking
      }

    } catch (error) {
      console.error('Payment failure analysis error:', error)
      throw error
    }
  }

  // Handle payment failure
  static async handlePaymentFailure(
    bookingId: string,
    orderId: string,
    errorCode: string,
    errorDescription: string,
    paymentMethod?: string
  ): Promise<PaymentFailureAction> {
    try {
      await connectToDatabase()

      // Record the failure
      await PaymentService.processPaymentFailure(orderId, errorCode, errorDescription)

      // Analyze the failure
      const analysis = await this.analyzePaymentFailure(bookingId)

      // Determine action based on analysis
      const action = this.determineFailureAction(analysis, errorCode)

      // Execute the action
      await this.executeFailureAction(bookingId, action, analysis)

      // Send notifications if required
      if (action.notificationRequired) {
        await this.sendFailureNotifications(bookingId, action, analysis)
      }

      return action

    } catch (error) {
      console.error('Payment failure handling error:', error)
      return {
        action: 'manual_review',
        reason: 'Error processing payment failure',
        requiresManualIntervention: true,
        notificationRequired: true,
        priority: 'urgent'
      }
    }
  }

  // Retry failed payment
  static async retryFailedPayment(
    bookingId: string,
    retryType: 'automatic' | 'manual' = 'manual',
    newPaymentMethod?: string
  ): Promise<{
    success: boolean
    orderId?: string
    error?: string
    nextRetryTime?: Date
  }> {
    try {
      await connectToDatabase()

      const booking = await Booking.findById(bookingId)
      if (!booking) {
        return { success: false, error: 'Booking not found' }
      }

      const analysis = await this.analyzePaymentFailure(bookingId)

      // Check if retry is allowed
      if (analysis.shouldBlockBooking && retryType === 'automatic') {
        return {
          success: false,
          error: 'Automatic retry blocked due to failure pattern',
          nextRetryTime: analysis.nextRetryTime
        }
      }

      // Check if we've exceeded max retries
      const config = this.DEFAULT_CONFIG
      if (analysis.consecutiveFailures >= config.maxRetries && retryType === 'automatic') {
        return {
          success: false,
          error: 'Maximum retry attempts exceeded',
          nextRetryTime: addDays(new Date(), 1) // Manual review in 1 day
        }
      }

      // Calculate remaining amount to pay
      const remainingAmount = (booking.totalPrice || 0) - (booking.paidAmount || 0)

      if (remainingAmount <= 0) {
        return { success: false, error: 'Booking is already fully paid' }
      }

      // Create new payment order
      const paymentResponse = await PaymentService.createPaymentOrder({
        bookingId,
        amount: remainingAmount,
        currency: 'INR',
        description: `Retry payment for booking ${bookingId}`,
        customerDetails: {
          name: booking.contactDetails?.name || booking.guestName || 'Guest',
          email: booking.contactDetails?.email || booking.email || '',
          contact: booking.contactDetails?.phone || booking.phone || ''
        },
        paymentType: 'full',
        metadata: {
          retryAttempt: analysis.consecutiveFailures + 1,
          retryType,
          originalBookingId: bookingId,
          newPaymentMethod
        }
      })

      if (!paymentResponse.success) {
        return {
          success: false,
          error: paymentResponse.errorDescription || 'Failed to create retry payment order'
        }
      }

      // Update booking with retry information
      if (!booking.paymentRetries) {
        booking.paymentRetries = []
      }

      booking.paymentRetries.push({
        orderId: paymentResponse.orderId,
        retryType,
        retryAttempt: analysis.consecutiveFailures + 1,
        scheduledAt: new Date(),
        newPaymentMethod,
        status: 'initiated'
      })

      await booking.save()

      return {
        success: true,
        orderId: paymentResponse.orderId
      }

    } catch (error) {
      console.error('Payment retry error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  // Process automatic payment retries
  static async processAutomaticRetries(): Promise<{
    processed: number
    successful: number
    failed: number
    errors: Array<{ bookingId: string; error: string }>
  }> {
    try {
      await connectToDatabase()

      const config = this.DEFAULT_CONFIG
      const cutoffTime = addHours(new Date(), -config.retryIntervals[0])

      // Find bookings with recent payment failures that are eligible for retry
      const bookingsWithFailures = await Booking.find({
        paymentStatus: { $in: ['pending', 'failed'] },
        'paymentFailures.0': { $exists: true },
        'paymentFailures.attemptedAt': { $gte: cutoffTime },
        status: { $in: ['pending', 'confirmed'] },
        // Don't retry if already exceeded max retries
        $expr: {
          $lt: [
            { $size: { $ifNull: ['$paymentFailures', []] } },
            config.maxRetries
          ]
        }
      })

      let processed = 0
      let successful = 0
      let failed = 0
      const errors: Array<{ bookingId: string; error: string }> = []

      for (const booking of bookingsWithFailures) {
        try {
          const analysis = await this.analyzePaymentFailure(booking._id.toString())

          // Check if it's time for the next retry
          if (analysis.nextRetryTime && isAfter(analysis.nextRetryTime, new Date())) {
            continue // Not time yet
          }

          // Skip if booking should be blocked
          if (analysis.shouldBlockBooking) {
            continue
          }

          const retryResult = await this.retryFailedPayment(
            booking._id.toString(),
            'automatic'
          )

          processed++

          if (retryResult.success) {
            successful++
          } else {
            failed++
            errors.push({
              bookingId: booking._id.toString(),
              error: retryResult.error || 'Unknown error'
            })
          }

        } catch (error) {
          console.error(`Error processing retry for booking ${booking._id}:`, error)
          failed++
          errors.push({
            bookingId: booking._id.toString(),
            error: error instanceof Error ? error.message : 'Unknown error'
          })
        }
      }

      return { processed, successful, failed, errors }

    } catch (error) {
      console.error('Automatic retry processing error:', error)
      return {
        processed: 0,
        successful: 0,
        failed: 0,
        errors: [{ bookingId: 'system', error: error instanceof Error ? error.message : 'Unknown error' }]
      }
    }
  }

  // Get payment failure statistics
  static async getFailureStatistics(
    propertyId?: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<{
    totalFailures: number
    uniqueBookings: number
    failureRate: number
    commonReasons: Array<{ reason: string; count: number; percentage: number }>
    recoveryRate: number
    averageRetriesToSuccess: number
    timeline: Array<{ date: string; failures: number; recoveries: number }>
  }> {
    try {
      await connectToDatabase()

      const query: any = {}
      if (propertyId) query.propertyId = propertyId
      if (startDate || endDate) {
        query.createdAt = {}
        if (startDate) query.createdAt.$gte = startDate
        if (endDate) query.createdAt.$lte = endDate
      }

      const bookings = await Booking.find(query)

      let totalFailures = 0
      let uniqueBookings = 0
      let successfulRecoveries = 0
      const failureReasons: Record<string, number> = {}
      const timeline: Record<string, { failures: number; recoveries: number }> = {}

      bookings.forEach(booking => {
        const failures = booking.paymentFailures || []
        if (failures.length > 0) {
          uniqueBookings++
          totalFailures += failures.length

          failures.forEach(failure => {
            const reason = failure.errorCode || 'UNKNOWN'
            failureReasons[reason] = (failureReasons[reason] || 0) + 1

            const date = new Date(failure.attemptedAt).toISOString().split('T')[0]
            if (!timeline[date]) {
              timeline[date] = { failures: 0, recoveries: 0 }
            }
            timeline[date].failures++
          })

          // Check if eventually succeeded
          if (booking.paymentStatus === 'completed' || booking.paidAmount > 0) {
            successfulRecoveries++

            const lastPaymentDate = booking.lastPaymentDate
              ? new Date(booking.lastPaymentDate).toISOString().split('T')[0]
              : new Date().toISOString().split('T')[0]

            if (!timeline[lastPaymentDate]) {
              timeline[lastPaymentDate] = { failures: 0, recoveries: 0 }
            }
            timeline[lastPaymentDate].recoveries++
          }
        }
      })

      const totalBookings = bookings.length
      const failureRate = totalBookings > 0 ? (uniqueBookings / totalBookings) * 100 : 0
      const recoveryRate = uniqueBookings > 0 ? (successfulRecoveries / uniqueBookings) * 100 : 0

      const commonReasons = Object.entries(failureReasons)
        .map(([reason, count]) => ({
          reason,
          count,
          percentage: totalFailures > 0 ? (count / totalFailures) * 100 : 0
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10)

      const timelineArray = Object.entries(timeline)
        .map(([date, data]) => ({
          date,
          failures: data.failures,
          recoveries: data.recoveries
        }))
        .sort((a, b) => a.date.localeCompare(b.date))

      const averageRetriesToSuccess = successfulRecoveries > 0
        ? totalFailures / successfulRecoveries
        : 0

      return {
        totalFailures,
        uniqueBookings,
        failureRate,
        commonReasons,
        recoveryRate,
        averageRetriesToSuccess,
        timeline: timelineArray
      }

    } catch (error) {
      console.error('Failure statistics error:', error)
      throw error
    }
  }

  // Private helper methods
  private static calculateRiskLevel(
    totalFailures: number,
    consecutiveFailures: number,
    failureReasons: Record<string, number>
  ): 'low' | 'medium' | 'high' | 'critical' {
    const config = this.DEFAULT_CONFIG

    if (consecutiveFailures >= config.escalationThresholds.critical) {
      return 'critical'
    }

    if (consecutiveFailures >= config.escalationThresholds.high) {
      return 'high'
    }

    if (consecutiveFailures >= config.escalationThresholds.medium) {
      return 'medium'
    }

    // Check for blocking reasons
    const hasBlockingReason = Object.keys(failureReasons).some(reason =>
      config.blockingReasons.includes(reason)
    )

    if (hasBlockingReason) {
      return 'high'
    }

    return 'low'
  }

  private static generateRecommendations(
    riskLevel: string,
    failureReasons: Record<string, number>,
    booking: any
  ): string[] {
    const recommendations = []

    if (riskLevel === 'critical') {
      recommendations.push('Immediate manual intervention required')
      recommendations.push('Consider alternative payment methods')
      recommendations.push('Review booking for potential fraud')
    } else if (riskLevel === 'high') {
      recommendations.push('Contact guest to resolve payment issues')
      recommendations.push('Offer alternative payment options')
      recommendations.push('Consider extending payment deadline')
    } else if (riskLevel === 'medium') {
      recommendations.push('Monitor payment retry attempts')
      recommendations.push('Send payment reminder to guest')
    }

    // Specific recommendations based on failure reasons
    const commonReasons = Object.keys(failureReasons)

    if (commonReasons.includes('INSUFFICIENT_FUNDS')) {
      recommendations.push('Suggest partial payment option')
      recommendations.push('Offer payment plan')
    }

    if (commonReasons.includes('CARD_EXPIRED')) {
      recommendations.push('Request updated payment method')
    }

    if (commonReasons.includes('BANK_DECLINE')) {
      recommendations.push('Suggest alternative payment method')
      recommendations.push('Contact guest bank for clarification')
    }

    return recommendations
  }

  private static calculateNextRetryTime(failures: any[], booking: any): Date | undefined {
    const config = this.DEFAULT_CONFIG
    const failureCount = failures.length

    if (failureCount >= config.maxRetries) {
      return undefined // No more retries
    }

    const intervalIndex = Math.min(failureCount, config.retryIntervals.length - 1)
    const intervalHours = config.retryIntervals[intervalIndex]

    const lastFailure = failures[failures.length - 1]
    const lastFailureTime = new Date(lastFailure?.attemptedAt || new Date())

    return addHours(lastFailureTime, intervalHours)
  }

  private static shouldBlockBooking(
    failureReasons: Record<string, number>,
    consecutiveFailures: number
  ): boolean {
    const config = this.DEFAULT_CONFIG

    // Block if too many consecutive failures
    if (consecutiveFailures >= config.maxRetries) {
      return true
    }

    // Block if failure reasons indicate blocking conditions
    const hasBlockingReason = Object.keys(failureReasons).some(reason =>
      config.blockingReasons.includes(reason)
    )

    return hasBlockingReason
  }

  private static determineFailureAction(
    analysis: PaymentFailureAnalysis,
    errorCode: string
  ): PaymentFailureAction {
    const config = this.DEFAULT_CONFIG

    // Critical cases require immediate manual review
    if (analysis.riskLevel === 'critical') {
      return {
        action: 'manual_review',
        reason: 'Critical payment failure pattern detected',
        requiresManualIntervention: true,
        notificationRequired: true,
        priority: 'urgent'
      }
    }

    // Blocking reasons require escalation
    if (config.blockingReasons.includes(errorCode)) {
      return {
        action: 'escalate',
        reason: `Blocking error code: ${errorCode}`,
        requiresManualIntervention: true,
        notificationRequired: true,
        priority: 'high'
      }
    }

    // High risk cases require manual review
    if (analysis.riskLevel === 'high') {
      return {
        action: 'hold',
        reason: 'High risk payment failure - holding for review',
        scheduledTime: addHours(new Date(), 4),
        requiresManualIntervention: true,
        notificationRequired: true,
        priority: 'high'
      }
    }

    // Medium risk cases can be retried with monitoring
    if (analysis.riskLevel === 'medium') {
      return {
        action: 'retry',
        reason: 'Scheduled automatic retry',
        scheduledTime: analysis.nextRetryTime,
        requiresManualIntervention: false,
        notificationRequired: true,
        priority: 'medium'
      }
    }

    // Low risk cases get automatic retry
    return {
      action: 'retry',
      reason: 'Automatic retry scheduled',
      scheduledTime: analysis.nextRetryTime,
      requiresManualIntervention: false,
      notificationRequired: false,
      priority: 'low'
    }
  }

  private static async executeFailureAction(
    bookingId: string,
    action: PaymentFailureAction,
    analysis: PaymentFailureAnalysis
  ): Promise<void> {
    const booking = await Booking.findById(bookingId)
    if (!booking) return

    switch (action.action) {
      case 'retry':
        if (action.scheduledTime && isAfter(action.scheduledTime, new Date())) {
          // Schedule retry for later
          booking.nextPaymentRetry = action.scheduledTime
        } else {
          // Immediate retry
          await this.retryFailedPayment(bookingId, 'automatic')
        }
        break

      case 'hold':
        booking.paymentStatus = 'on_hold'
        booking.holdReason = action.reason
        booking.holdUntil = action.scheduledTime
        break

      case 'escalate':
      case 'manual_review':
        booking.paymentStatus = 'requires_review'
        booking.reviewReason = action.reason
        booking.reviewPriority = action.priority
        break

      case 'cancel':
        booking.status = 'cancelled'
        booking.cancellationReason = action.reason
        booking.cancelledAt = new Date()
        break
    }

    await booking.save()
  }

  private static async sendFailureNotifications(
    bookingId: string,
    action: PaymentFailureAction,
    analysis: PaymentFailureAnalysis
  ): Promise<void> {
    // This would integrate with your notification service
    // For now, just log the notification
    console.log(`Payment failure notification for booking ${bookingId}:`, {
      action: action.action,
      reason: action.reason,
      priority: action.priority,
      riskLevel: analysis.riskLevel,
      failureCount: analysis.totalFailures
    })

    // In production, this would send:
    // - Email to guest for payment retry requests
    // - SMS for urgent payment issues
    // - Admin notifications for manual review cases
    // - Slack/Teams alerts for critical failures
  }
}