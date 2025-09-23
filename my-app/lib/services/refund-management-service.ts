import { connectToDatabase } from '@/lib/mongodb'
import Booking from '@/models/Booking'
import { PaymentService } from './payment-service'
import { addDays, differenceInDays, differenceInHours, isAfter, isBefore } from 'date-fns'

export interface RefundPolicy {
  propertyId: string
  roomTypeId?: string
  rules: Array<{
    daysBeforeCheckIn: number
    refundPercentage: number
    description: string
    conditions: string[]
  }>
  nonRefundableItems: string[]
  processingFee: {
    enabled: boolean
    amount: number
    percentage?: number
    currency: string
  }
  specialCircumstances: Array<{
    circumstance: string
    refundPercentage: number
    requiresApproval: boolean
  }>
  blackoutPeriods: Array<{
    startDate: Date
    endDate: Date
    refundPercentage: number
    description: string
  }>
}

export interface RefundCalculation {
  bookingId: string
  originalAmount: number
  refundableAmount: number
  nonRefundableAmount: number
  processingFee: number
  finalRefundAmount: number
  refundPercentage: number
  appliedRule: string
  breakdown: Array<{
    item: string
    amount: number
    refundable: boolean
    reason?: string
  }>
  conditions: string[]
  approvalRequired: boolean
}

export interface RefundRequest {
  bookingId: string
  requestedBy: string
  requestType: 'guest_initiated' | 'admin_initiated' | 'system_initiated'
  reason: string
  category: 'cancellation' | 'modification' | 'service_issue' | 'force_majeure' | 'other'
  amount?: number // For partial refunds
  items?: string[] // Specific items to refund
  supportingDocuments?: Array<{
    type: string
    url: string
    description: string
  }>
  specialCircumstance?: string
  urgency: 'low' | 'medium' | 'high' | 'urgent'
  notes?: string
}

export interface RefundResponse {
  success: boolean
  refundId?: string
  requestId?: string
  amount?: number
  status: 'pending' | 'approved' | 'processing' | 'completed' | 'rejected'
  estimatedProcessingTime?: string
  approvalRequired?: boolean
  approver?: string
  rejectionReason?: string
  error?: string
}

export class RefundManagementService {
  // Calculate refund amount based on policy
  static async calculateRefund(
    bookingId: string,
    cancellationDate?: Date,
    specialCircumstance?: string
  ): Promise<RefundCalculation> {
    try {
      await connectToDatabase()

      const booking = await Booking.findById(bookingId).populate('propertyId')
      if (!booking) {
        throw new Error('Booking not found')
      }

      const checkInDate = new Date(booking.dateFrom)
      const requestDate = cancellationDate || new Date()
      const daysBeforeCheckIn = differenceInDays(checkInDate, requestDate)

      // Get refund policy
      const policy = await this.getRefundPolicy(
        booking.propertyId.toString(),
        booking.allocatedRoom?.roomTypeId
      )

      // Calculate based on timing
      const applicableRule = this.findApplicableRule(policy, daysBeforeCheckIn)

      let refundPercentage = applicableRule.refundPercentage

      // Check for special circumstances
      if (specialCircumstance) {
        const specialRule = policy.specialCircumstances.find(
          sc => sc.circumstance === specialCircumstance
        )
        if (specialRule) {
          refundPercentage = Math.max(refundPercentage, specialRule.refundPercentage)
        }
      }

      // Check blackout periods
      const blackoutPeriod = policy.blackoutPeriods.find(period =>
        requestDate >= period.startDate && requestDate <= period.endDate
      )
      if (blackoutPeriod) {
        refundPercentage = Math.min(refundPercentage, blackoutPeriod.refundPercentage)
      }

      // Calculate amounts
      const originalAmount = booking.totalPrice || 0
      const paidAmount = booking.paidAmount || 0
      const refundableBaseAmount = Math.min(originalAmount, paidAmount)

      // Calculate breakdown
      const breakdown = this.calculateItemBreakdown(booking, refundPercentage, policy)

      const refundableAmount = breakdown
        .filter(item => item.refundable)
        .reduce((sum, item) => sum + item.amount, 0)

      const nonRefundableAmount = breakdown
        .filter(item => !item.refundable)
        .reduce((sum, item) => sum + item.amount, 0)

      // Calculate processing fee
      let processingFee = 0
      if (policy.processingFee.enabled && refundableAmount > 0) {
        if (policy.processingFee.percentage) {
          processingFee = (refundableAmount * policy.processingFee.percentage) / 100
        } else {
          processingFee = policy.processingFee.amount
        }
      }

      const finalRefundAmount = Math.max(0, refundableAmount - processingFee)

      // Determine approval requirements
      const approvalRequired = this.requiresApproval(
        finalRefundAmount,
        refundPercentage,
        specialCircumstance,
        policy
      )

      return {
        bookingId,
        originalAmount,
        refundableAmount,
        nonRefundableAmount,
        processingFee,
        finalRefundAmount,
        refundPercentage,
        appliedRule: applicableRule.description,
        breakdown,
        conditions: applicableRule.conditions,
        approvalRequired
      }

    } catch (error) {
      console.error('Refund calculation error:', error)
      throw error
    }
  }

  // Process refund request
  static async processRefundRequest(request: RefundRequest): Promise<RefundResponse> {
    try {
      await connectToDatabase()

      const booking = await Booking.findById(request.bookingId)
      if (!booking) {
        return {
          success: false,
          status: 'rejected',
          error: 'Booking not found'
        }
      }

      // Generate request ID
      const requestId = `REF-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

      // Calculate refund amount
      const calculation = await this.calculateRefund(
        request.bookingId,
        new Date(),
        request.specialCircumstance
      )

      // Use requested amount if specified (for partial refunds)
      const refundAmount = request.amount || calculation.finalRefundAmount

      // Validate refund amount
      if (refundAmount > calculation.finalRefundAmount) {
        return {
          success: false,
          status: 'rejected',
          error: `Requested amount exceeds maximum refundable amount (₹${calculation.finalRefundAmount})`
        }
      }

      // Create refund request record
      const refundRequestRecord = {
        requestId,
        requestType: request.requestType,
        requestedBy: request.requestedBy,
        requestedAt: new Date(),
        reason: request.reason,
        category: request.category,
        amount: refundAmount,
        items: request.items,
        supportingDocuments: request.supportingDocuments,
        specialCircumstance: request.specialCircumstance,
        urgency: request.urgency,
        notes: request.notes,
        calculation,
        status: calculation.approvalRequired ? 'pending' : 'approved',
        approvalRequired: calculation.approvalRequired
      }

      // Add to booking
      if (!booking.refundRequests) {
        booking.refundRequests = []
      }
      booking.refundRequests.push(refundRequestRecord)

      await booking.save()

      // Auto-approve if no approval required
      if (!calculation.approvalRequired) {
        return await this.approveRefund(requestId, 'system', 'Auto-approved based on policy')
      }

      return {
        success: true,
        requestId,
        amount: refundAmount,
        status: 'pending',
        approvalRequired: true,
        estimatedProcessingTime: this.getEstimatedProcessingTime(request.urgency)
      }

    } catch (error) {
      console.error('Refund request processing error:', error)
      return {
        success: false,
        status: 'rejected',
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  // Approve refund request
  static async approveRefund(
    requestId: string,
    approver: string,
    approvalNotes?: string
  ): Promise<RefundResponse> {
    try {
      await connectToDatabase()

      const booking = await Booking.findOne({
        'refundRequests.requestId': requestId
      })

      if (!booking) {
        return {
          success: false,
          status: 'rejected',
          error: 'Refund request not found'
        }
      }

      const requestIndex = booking.refundRequests.findIndex(
        (req: any) => req.requestId === requestId
      )

      if (requestIndex === -1) {
        return {
          success: false,
          status: 'rejected',
          error: 'Refund request not found'
        }
      }

      const refundRequest = booking.refundRequests[requestIndex]

      if (refundRequest.status !== 'pending') {
        return {
          success: false,
          status: refundRequest.status,
          error: `Refund request is already ${refundRequest.status}`
        }
      }

      // Update request status
      refundRequest.status = 'approved'
      refundRequest.approvedBy = approver
      refundRequest.approvedAt = new Date()
      refundRequest.approvalNotes = approvalNotes

      // Process the actual refund
      const refundResult = await this.executeRefund(booking, refundRequest)

      if (refundResult.success) {
        refundRequest.status = 'processing'
        refundRequest.refundId = refundResult.refundId
        refundRequest.processedAt = new Date()
      } else {
        refundRequest.status = 'rejected'
        refundRequest.rejectionReason = refundResult.error
      }

      await booking.save()

      return refundResult

    } catch (error) {
      console.error('Refund approval error:', error)
      return {
        success: false,
        status: 'rejected',
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  // Reject refund request
  static async rejectRefund(
    requestId: string,
    rejector: string,
    rejectionReason: string
  ): Promise<RefundResponse> {
    try {
      await connectToDatabase()

      const booking = await Booking.findOne({
        'refundRequests.requestId': requestId
      })

      if (!booking) {
        return {
          success: false,
          status: 'rejected',
          error: 'Refund request not found'
        }
      }

      const requestIndex = booking.refundRequests.findIndex(
        (req: any) => req.requestId === requestId
      )

      if (requestIndex === -1) {
        return {
          success: false,
          status: 'rejected',
          error: 'Refund request not found'
        }
      }

      const refundRequest = booking.refundRequests[requestIndex]

      refundRequest.status = 'rejected'
      refundRequest.rejectedBy = rejector
      refundRequest.rejectedAt = new Date()
      refundRequest.rejectionReason = rejectionReason

      await booking.save()

      return {
        success: true,
        requestId,
        status: 'rejected',
        rejectionReason
      }

    } catch (error) {
      console.error('Refund rejection error:', error)
      return {
        success: false,
        status: 'rejected',
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  // Get refund requests requiring approval
  static async getPendingRefunds(
    propertyId?: string,
    urgencyFilter?: string
  ): Promise<Array<{
    requestId: string
    bookingId: string
    bookingReference: string
    guestName: string
    requestType: string
    reason: string
    amount: number
    urgency: string
    requestedAt: Date
    requestedBy: string
    estimatedProcessingTime: string
  }>> {
    try {
      await connectToDatabase()

      const query: any = {
        'refundRequests.status': 'pending'
      }

      if (propertyId) {
        query.propertyId = propertyId
      }

      const bookings = await Booking.find(query)

      const pendingRefunds = []

      for (const booking of bookings) {
        const pendingRequests = booking.refundRequests?.filter((req: any) => {
          const matchesUrgency = !urgencyFilter || req.urgency === urgencyFilter
          return req.status === 'pending' && matchesUrgency
        }) || []

        for (const request of pendingRequests) {
          pendingRefunds.push({
            requestId: request.requestId,
            bookingId: booking._id.toString(),
            bookingReference: booking.bookingReference || booking._id.toString().slice(-8),
            guestName: booking.contactDetails?.name || booking.guestName || 'Unknown',
            requestType: request.requestType,
            reason: request.reason,
            amount: request.amount,
            urgency: request.urgency,
            requestedAt: request.requestedAt,
            requestedBy: request.requestedBy,
            estimatedProcessingTime: this.getEstimatedProcessingTime(request.urgency)
          })
        }
      }

      // Sort by urgency and request date
      return pendingRefunds.sort((a, b) => {
        const urgencyOrder = { urgent: 0, high: 1, medium: 2, low: 3 }
        const urgencyDiff = urgencyOrder[a.urgency as keyof typeof urgencyOrder] -
                           urgencyOrder[b.urgency as keyof typeof urgencyOrder]

        if (urgencyDiff !== 0) return urgencyDiff

        return new Date(a.requestedAt).getTime() - new Date(b.requestedAt).getTime()
      })

    } catch (error) {
      console.error('Get pending refunds error:', error)
      throw error
    }
  }

  // Get refund statistics
  static async getRefundStatistics(
    propertyId?: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<{
    totalRefunds: number
    totalRefundAmount: number
    averageRefundAmount: number
    refundsByCategory: Record<string, number>
    refundsByStatus: Record<string, number>
    processingTimeStats: {
      average: number
      median: number
      fastest: number
      slowest: number
    }
    refundRate: number
    guestSatisfactionImpact: number
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

      let totalRefunds = 0
      let totalRefundAmount = 0
      const refundsByCategory: Record<string, number> = {}
      const refundsByStatus: Record<string, number> = {}
      const processingTimes: number[] = []

      let totalBookings = bookings.length
      let bookingsWithRefunds = 0

      bookings.forEach(booking => {
        const refundRequests = booking.refundRequests || []

        if (refundRequests.length > 0) {
          bookingsWithRefunds++
        }

        refundRequests.forEach((request: any) => {
          totalRefunds++
          totalRefundAmount += request.amount || 0

          // Category stats
          const category = request.category || 'other'
          refundsByCategory[category] = (refundsByCategory[category] || 0) + 1

          // Status stats
          const status = request.status || 'unknown'
          refundsByStatus[status] = (refundsByStatus[status] || 0) + 1

          // Processing time stats
          if (request.requestedAt && request.processedAt) {
            const processingTime = differenceInHours(
              new Date(request.processedAt),
              new Date(request.requestedAt)
            )
            processingTimes.push(processingTime)
          }
        })
      })

      const averageRefundAmount = totalRefunds > 0 ? totalRefundAmount / totalRefunds : 0
      const refundRate = totalBookings > 0 ? (bookingsWithRefunds / totalBookings) * 100 : 0

      // Processing time statistics
      let processingTimeStats = {
        average: 0,
        median: 0,
        fastest: 0,
        slowest: 0
      }

      if (processingTimes.length > 0) {
        processingTimes.sort((a, b) => a - b)
        processingTimeStats = {
          average: processingTimes.reduce((sum, time) => sum + time, 0) / processingTimes.length,
          median: processingTimes[Math.floor(processingTimes.length / 2)],
          fastest: processingTimes[0],
          slowest: processingTimes[processingTimes.length - 1]
        }
      }

      // Guest satisfaction impact (simplified calculation)
      const guestSatisfactionImpact = Math.max(0, 100 - refundRate * 2)

      return {
        totalRefunds,
        totalRefundAmount,
        averageRefundAmount,
        refundsByCategory,
        refundsByStatus,
        processingTimeStats,
        refundRate,
        guestSatisfactionImpact
      }

    } catch (error) {
      console.error('Refund statistics error:', error)
      throw error
    }
  }

  // Private helper methods
  private static async getRefundPolicy(
    propertyId: string,
    roomTypeId?: string
  ): Promise<RefundPolicy> {
    // In production, this would be stored in database
    // For now, returning a default policy
    return {
      propertyId,
      roomTypeId,
      rules: [
        {
          daysBeforeCheckIn: 30,
          refundPercentage: 100,
          description: 'Free cancellation up to 30 days',
          conditions: ['No processing fee applies']
        },
        {
          daysBeforeCheckIn: 14,
          refundPercentage: 75,
          description: 'Partial refund up to 14 days',
          conditions: ['Processing fee may apply']
        },
        {
          daysBeforeCheckIn: 7,
          refundPercentage: 50,
          description: 'Limited refund up to 7 days',
          conditions: ['Processing fee applies', 'Non-refundable items excluded']
        },
        {
          daysBeforeCheckIn: 1,
          refundPercentage: 25,
          description: 'Minimal refund up to 1 day',
          conditions: ['High processing fee', 'Only room charges refundable']
        },
        {
          daysBeforeCheckIn: 0,
          refundPercentage: 0,
          description: 'No refund for same-day cancellation',
          conditions: ['No refund available', 'Exceptional circumstances only']
        }
      ],
      nonRefundableItems: ['service_charges', 'taxes', 'booking_fees'],
      processingFee: {
        enabled: true,
        amount: 500,
        currency: 'INR'
      },
      specialCircumstances: [
        {
          circumstance: 'medical_emergency',
          refundPercentage: 90,
          requiresApproval: true
        },
        {
          circumstance: 'force_majeure',
          refundPercentage: 100,
          requiresApproval: true
        },
        {
          circumstance: 'property_issue',
          refundPercentage: 100,
          requiresApproval: false
        }
      ],
      blackoutPeriods: []
    }
  }

  private static findApplicableRule(policy: RefundPolicy, daysBeforeCheckIn: number) {
    // Find the rule with the highest days requirement that the cancellation meets
    const applicableRules = policy.rules.filter(
      rule => daysBeforeCheckIn >= rule.daysBeforeCheckIn
    )

    return applicableRules.length > 0
      ? applicableRules[0] // Assuming rules are ordered by daysBeforeCheckIn desc
      : policy.rules[policy.rules.length - 1] // Fallback to most restrictive
  }

  private static calculateItemBreakdown(
    booking: any,
    refundPercentage: number,
    policy: RefundPolicy
  ) {
    const breakdown = []
    const totalAmount = booking.totalPrice || 0

    // Base room charges (usually refundable)
    const roomCharges = totalAmount * 0.8 // Assuming 80% is room charges
    breakdown.push({
      item: 'Room Charges',
      amount: roomCharges * (refundPercentage / 100),
      refundable: true
    })

    // Service charges (may be non-refundable)
    const serviceCharges = totalAmount * 0.1
    const serviceRefundable = !policy.nonRefundableItems.includes('service_charges')
    breakdown.push({
      item: 'Service Charges',
      amount: serviceRefundable ? serviceCharges * (refundPercentage / 100) : 0,
      refundable: serviceRefundable,
      reason: serviceRefundable ? undefined : 'Non-refundable as per policy'
    })

    // Taxes (usually non-refundable)
    const taxes = totalAmount * 0.1
    const taxRefundable = !policy.nonRefundableItems.includes('taxes')
    breakdown.push({
      item: 'Taxes',
      amount: taxRefundable ? taxes * (refundPercentage / 100) : 0,
      refundable: taxRefundable,
      reason: taxRefundable ? undefined : 'Taxes are non-refundable'
    })

    return breakdown
  }

  private static requiresApproval(
    refundAmount: number,
    refundPercentage: number,
    specialCircumstance?: string,
    policy?: RefundPolicy
  ): boolean {
    // Require approval for high amounts
    if (refundAmount > 10000) return true

    // Require approval for full refunds outside policy
    if (refundPercentage === 100) return true

    // Require approval for special circumstances
    if (specialCircumstance) {
      const specialRule = policy?.specialCircumstances?.find(
        sc => sc.circumstance === specialCircumstance
      )
      if (specialRule?.requiresApproval) return true
    }

    return false
  }

  private static getEstimatedProcessingTime(urgency: string): string {
    switch (urgency) {
      case 'urgent': return '2-4 hours'
      case 'high': return '4-8 hours'
      case 'medium': return '1-2 business days'
      case 'low': return '3-5 business days'
      default: return '1-2 business days'
    }
  }

  private static async executeRefund(booking: any, refundRequest: any): Promise<RefundResponse> {
    try {
      // Find the most recent successful payment
      const payments = booking.payments || []
      const lastPayment = payments
        .filter((p: any) => p.status === 'completed')
        .sort((a: any, b: any) => new Date(b.processedAt).getTime() - new Date(a.processedAt).getTime())[0]

      if (!lastPayment) {
        return {
          success: false,
          status: 'rejected',
          error: 'No successful payment found to refund'
        }
      }

      // Process refund through payment service
      const refundResult = await PaymentService.processRefund({
        paymentId: lastPayment.paymentId,
        amount: refundRequest.amount,
        reason: refundRequest.reason,
        notes: {
          requestId: refundRequest.requestId,
          category: refundRequest.category,
          requestType: refundRequest.requestType
        }
      })

      return refundResult

    } catch (error) {
      console.error('Refund execution error:', error)
      return {
        success: false,
        status: 'rejected',
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }
}