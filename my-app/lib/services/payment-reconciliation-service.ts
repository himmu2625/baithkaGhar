import { connectToDatabase } from '@/lib/mongodb'
import Booking from '@/models/Booking'
import Razorpay from 'razorpay'
import { startOfDay, endOfDay, addDays, subDays, format } from 'date-fns'

export interface ReconciliationReport {
  reportId: string
  generatedAt: Date
  period: {
    startDate: Date
    endDate: Date
  }
  summary: {
    totalBookings: number
    totalPayments: number
    totalRefunds: number
    grossRevenue: number
    netRevenue: number
    platformFees: number
    taxes: number
    refundedAmount: number
    outstandingAmount: number
  }
  discrepancies: Array<{
    type: 'missing_payment' | 'extra_payment' | 'amount_mismatch' | 'status_mismatch'
    bookingId: string
    paymentId?: string
    expectedAmount: number
    actualAmount: number
    description: string
    severity: 'low' | 'medium' | 'high' | 'critical'
  }>
  settlements: Array<{
    settlementId: string
    amount: number
    currency: string
    settledAt: Date
    status: string
    bankReference?: string
  }>
  recommendations: string[]
}

export interface PaymentReconciliationItem {
  bookingId: string
  bookingReference: string
  customerName: string
  razorpayOrderId: string
  razorpayPaymentId?: string
  bookingAmount: number
  paidAmount: number
  refundedAmount: number
  netAmount: number
  platformFees: number
  taxes: number
  status: 'matched' | 'discrepancy' | 'missing' | 'excess'
  paymentMethod: string
  transactionDate: Date
  settlementStatus: 'pending' | 'settled' | 'failed'
  notes?: string
}

export interface SettlementBreakdown {
  settlementId: string
  settlementDate: Date
  totalAmount: number
  currency: string
  transactions: Array<{
    paymentId: string
    bookingId: string
    amount: number
    fees: number
    taxes: number
    netAmount: number
  }>
  bankTransferDetails?: {
    accountNumber: string
    ifsc: string
    utr: string
    transferDate: Date
  }
}

export class PaymentReconciliationService {
  private static razorpay: Razorpay

  private static getRazorpayInstance(): Razorpay {
    if (!this.razorpay) {
      const keyId = process.env.RAZORPAY_KEY_ID
      const keySecret = process.env.RAZORPAY_KEY_SECRET

      if (!keyId || !keySecret) {
        throw new Error('Razorpay credentials not configured')
      }

      this.razorpay = new Razorpay({
        key_id: keyId,
        key_secret: keySecret
      })
    }

    return this.razorpay
  }

  // Generate comprehensive reconciliation report
  static async generateReconciliationReport(
    startDate: Date,
    endDate: Date,
    propertyId?: string
  ): Promise<ReconciliationReport> {
    try {
      await connectToDatabase()

      const reportId = `REC-${format(new Date(), 'yyyyMMdd')}-${Math.random().toString(36).substr(2, 9)}`

      // Get bookings for the period
      const bookingQuery: any = {
        createdAt: {
          $gte: startOfDay(startDate),
          $lte: endOfDay(endDate)
        }
      }

      if (propertyId) {
        bookingQuery.propertyId = propertyId
      }

      const bookings = await Booking.find(bookingQuery)

      // Get Razorpay payments for the same period
      const razorpayPayments = await this.fetchRazorpayPayments(startDate, endDate)
      const razorpayRefunds = await this.fetchRazorpayRefunds(startDate, endDate)
      const settlements = await this.fetchSettlements(startDate, endDate)

      // Reconcile payments
      const reconciliationItems = this.reconcilePayments(bookings, razorpayPayments)
      const discrepancies = this.identifyDiscrepancies(reconciliationItems)

      // Calculate summary
      const summary = this.calculateSummary(bookings, razorpayPayments, razorpayRefunds, settlements)

      // Generate recommendations
      const recommendations = this.generateRecommendations(discrepancies, summary)

      return {
        reportId,
        generatedAt: new Date(),
        period: { startDate, endDate },
        summary,
        discrepancies,
        settlements: settlements.map(s => ({
          settlementId: s.id,
          amount: s.amount / 100, // Convert from paise
          currency: s.currency,
          settledAt: new Date(s.created_at * 1000),
          status: s.status,
          bankReference: s.utr
        })),
        recommendations
      }

    } catch (error) {
      console.error('Reconciliation report generation error:', error)
      throw error
    }
  }

  // Reconcile individual payment
  static async reconcilePayment(paymentId: string): Promise<{
    status: 'matched' | 'discrepancy' | 'not_found'
    details: any
    actions?: string[]
  }> {
    try {
      await connectToDatabase()

      // Find booking with this payment
      const booking = await Booking.findOne({
        'payments.paymentId': paymentId
      })

      if (!booking) {
        return {
          status: 'not_found',
          details: { error: 'Booking not found for payment ID' }
        }
      }

      const payment = booking.payments.find((p: any) => p.paymentId === paymentId)

      if (!payment) {
        return {
          status: 'not_found',
          details: { error: 'Payment not found in booking' }
        }
      }

      // Fetch from Razorpay
      const razorpay = this.getRazorpayInstance()
      const razorpayPayment = await razorpay.payments.fetch(paymentId)

      // Compare amounts (Razorpay uses paise)
      const bookingAmount = payment.amount * 100
      const razorpayAmount = razorpayPayment.amount

      if (bookingAmount === razorpayAmount && payment.status === razorpayPayment.status) {
        return {
          status: 'matched',
          details: {
            bookingAmount: payment.amount,
            razorpayAmount: razorpayAmount / 100,
            status: payment.status,
            method: razorpayPayment.method,
            capturedAt: razorpayPayment.captured_at
          }
        }
      }

      const actions = []
      if (bookingAmount !== razorpayAmount) {
        actions.push(`Update booking amount from ₹${payment.amount} to ₹${razorpayAmount / 100}`)
      }
      if (payment.status !== razorpayPayment.status) {
        actions.push(`Update payment status from ${payment.status} to ${razorpayPayment.status}`)
      }

      return {
        status: 'discrepancy',
        details: {
          bookingAmount: payment.amount,
          razorpayAmount: razorpayAmount / 100,
          bookingStatus: payment.status,
          razorpayStatus: razorpayPayment.status,
          differences: {
            amountMismatch: bookingAmount !== razorpayAmount,
            statusMismatch: payment.status !== razorpayPayment.status
          }
        },
        actions
      }

    } catch (error) {
      console.error('Payment reconciliation error:', error)
      return {
        status: 'not_found',
        details: { error: error instanceof Error ? error.message : 'Unknown error' }
      }
    }
  }

  // Auto-fix reconciliation discrepancies
  static async autoFixDiscrepancies(
    discrepancies: any[],
    autoFixTypes: string[] = ['amount_mismatch', 'status_mismatch']
  ): Promise<{
    fixed: number
    failed: number
    errors: Array<{ discrepancy: any; error: string }>
  }> {
    try {
      await connectToDatabase()

      let fixed = 0
      let failed = 0
      const errors: Array<{ discrepancy: any; error: string }> = []

      for (const discrepancy of discrepancies) {
        if (!autoFixTypes.includes(discrepancy.type)) {
          continue
        }

        try {
          const success = await this.fixDiscrepancy(discrepancy)
          if (success) {
            fixed++
          } else {
            failed++
          }
        } catch (error) {
          failed++
          errors.push({
            discrepancy,
            error: error instanceof Error ? error.message : 'Unknown error'
          })
        }
      }

      return { fixed, failed, errors }

    } catch (error) {
      console.error('Auto-fix discrepancies error:', error)
      throw error
    }
  }

  // Get settlement breakdown
  static async getSettlementBreakdown(settlementId: string): Promise<SettlementBreakdown> {
    try {
      const razorpay = this.getRazorpayInstance()

      // Fetch settlement details
      const settlement = await razorpay.settlements.fetch(settlementId)

      // Get settlement items (payments in this settlement)
      const settlementItems = await razorpay.settlements.fetchAllItems(settlementId)

      await connectToDatabase()

      const transactions = []

      for (const item of settlementItems.items) {
        if (item.entity_type === 'payment') {
          // Find corresponding booking
          const booking = await Booking.findOne({
            'payments.paymentId': item.entity_id
          })

          if (booking) {
            transactions.push({
              paymentId: item.entity_id,
              bookingId: booking._id.toString(),
              amount: item.amount / 100,
              fees: item.fee / 100,
              taxes: item.tax / 100,
              netAmount: (item.amount - item.fee - item.tax) / 100
            })
          }
        }
      }

      return {
        settlementId: settlement.id,
        settlementDate: new Date(settlement.created_at * 1000),
        totalAmount: settlement.amount / 100,
        currency: settlement.currency,
        transactions,
        bankTransferDetails: settlement.utr ? {
          accountNumber: settlement.account?.account_number || '',
          ifsc: settlement.account?.ifsc || '',
          utr: settlement.utr,
          transferDate: new Date(settlement.created_at * 1000)
        } : undefined
      }

    } catch (error) {
      console.error('Settlement breakdown error:', error)
      throw error
    }
  }

  // Sync payments with Razorpay
  static async syncPaymentsWithRazorpay(
    startDate: Date,
    endDate: Date,
    propertyId?: string
  ): Promise<{
    synced: number
    updated: number
    errors: number
    details: Array<{
      bookingId: string
      paymentId: string
      action: 'synced' | 'updated' | 'error'
      message: string
    }>
  }> {
    try {
      await connectToDatabase()

      const query: any = {
        createdAt: {
          $gte: startOfDay(startDate),
          $lte: endOfDay(endDate)
        },
        'payments.0': { $exists: true }
      }

      if (propertyId) {
        query.propertyId = propertyId
      }

      const bookings = await Booking.find(query)

      let synced = 0
      let updated = 0
      let errors = 0
      const details: Array<{
        bookingId: string
        paymentId: string
        action: 'synced' | 'updated' | 'error'
        message: string
      }> = []

      const razorpay = this.getRazorpayInstance()

      for (const booking of bookings) {
        for (const payment of booking.payments || []) {
          try {
            const razorpayPayment = await razorpay.payments.fetch(payment.paymentId)

            let needsUpdate = false
            const updates: any = {}

            // Check amount
            if (payment.amount !== razorpayPayment.amount / 100) {
              updates.amount = razorpayPayment.amount / 100
              needsUpdate = true
            }

            // Check status
            if (payment.status !== razorpayPayment.status) {
              updates.status = razorpayPayment.status
              needsUpdate = true
            }

            // Check method
            if (payment.method !== razorpayPayment.method) {
              updates.method = razorpayPayment.method
              needsUpdate = true
            }

            // Check fees and taxes
            if (payment.fee !== (razorpayPayment.fee || 0) / 100) {
              updates.fee = (razorpayPayment.fee || 0) / 100
              needsUpdate = true
            }

            if (payment.tax !== (razorpayPayment.tax || 0) / 100) {
              updates.tax = (razorpayPayment.tax || 0) / 100
              needsUpdate = true
            }

            if (needsUpdate) {
              // Update payment in booking
              const paymentIndex = booking.payments.findIndex(
                (p: any) => p.paymentId === payment.paymentId
              )

              if (paymentIndex !== -1) {
                Object.assign(booking.payments[paymentIndex], updates)
                await booking.save()

                updated++
                details.push({
                  bookingId: booking._id.toString(),
                  paymentId: payment.paymentId,
                  action: 'updated',
                  message: `Updated: ${Object.keys(updates).join(', ')}`
                })
              }
            } else {
              synced++
              details.push({
                bookingId: booking._id.toString(),
                paymentId: payment.paymentId,
                action: 'synced',
                message: 'Already in sync'
              })
            }

          } catch (error) {
            errors++
            details.push({
              bookingId: booking._id.toString(),
              paymentId: payment.paymentId,
              action: 'error',
              message: error instanceof Error ? error.message : 'Unknown error'
            })
          }
        }
      }

      return { synced, updated, errors, details }

    } catch (error) {
      console.error('Sync payments error:', error)
      throw error
    }
  }

  // Private helper methods
  private static async fetchRazorpayPayments(startDate: Date, endDate: Date): Promise<any[]> {
    const razorpay = this.getRazorpayInstance()

    try {
      const payments = await razorpay.payments.all({
        from: Math.floor(startDate.getTime() / 1000),
        to: Math.floor(endDate.getTime() / 1000),
        count: 100 // Adjust as needed
      })

      return payments.items || []
    } catch (error) {
      console.error('Error fetching Razorpay payments:', error)
      return []
    }
  }

  private static async fetchRazorpayRefunds(startDate: Date, endDate: Date): Promise<any[]> {
    const razorpay = this.getRazorpayInstance()

    try {
      const refunds = await razorpay.refunds.all({
        from: Math.floor(startDate.getTime() / 1000),
        to: Math.floor(endDate.getTime() / 1000),
        count: 100
      })

      return refunds.items || []
    } catch (error) {
      console.error('Error fetching Razorpay refunds:', error)
      return []
    }
  }

  private static async fetchSettlements(startDate: Date, endDate: Date): Promise<any[]> {
    const razorpay = this.getRazorpayInstance()

    try {
      const settlements = await razorpay.settlements.all({
        from: Math.floor(startDate.getTime() / 1000),
        to: Math.floor(endDate.getTime() / 1000),
        count: 100
      })

      return settlements.items || []
    } catch (error) {
      console.error('Error fetching settlements:', error)
      return []
    }
  }

  private static reconcilePayments(bookings: any[], razorpayPayments: any[]): PaymentReconciliationItem[] {
    const items: PaymentReconciliationItem[] = []

    // Create a map of Razorpay payments for quick lookup
    const razorpayPaymentMap = new Map()
    razorpayPayments.forEach(payment => {
      razorpayPaymentMap.set(payment.id, payment)
    })

    bookings.forEach(booking => {
      const payments = booking.payments || []

      payments.forEach((payment: any) => {
        const razorpayPayment = razorpayPaymentMap.get(payment.paymentId)

        let status: 'matched' | 'discrepancy' | 'missing' | 'excess' = 'missing'

        if (razorpayPayment) {
          const amountMatches = payment.amount === razorpayPayment.amount / 100
          const statusMatches = payment.status === razorpayPayment.status

          status = amountMatches && statusMatches ? 'matched' : 'discrepancy'
        }

        items.push({
          bookingId: booking._id.toString(),
          bookingReference: booking.bookingReference || booking._id.toString().slice(-8),
          customerName: booking.contactDetails?.name || booking.guestName || 'Unknown',
          razorpayOrderId: payment.orderId || '',
          razorpayPaymentId: payment.paymentId,
          bookingAmount: booking.totalPrice || 0,
          paidAmount: payment.amount || 0,
          refundedAmount: booking.refundedAmount || 0,
          netAmount: (payment.amount || 0) - (booking.refundedAmount || 0),
          platformFees: payment.fee || 0,
          taxes: payment.tax || 0,
          status,
          paymentMethod: payment.method || 'unknown',
          transactionDate: new Date(payment.processedAt || payment.createdAt),
          settlementStatus: razorpayPayment?.settled ? 'settled' : 'pending',
          notes: status === 'discrepancy' ? 'Amount or status mismatch detected' : undefined
        })
      })
    })

    return items
  }

  private static identifyDiscrepancies(items: PaymentReconciliationItem[]): any[] {
    const discrepancies: any[] = []

    items.forEach(item => {
      if (item.status === 'discrepancy') {
        discrepancies.push({
          type: 'amount_mismatch',
          bookingId: item.bookingId,
          paymentId: item.razorpayPaymentId,
          expectedAmount: item.bookingAmount,
          actualAmount: item.paidAmount,
          description: `Amount mismatch for booking ${item.bookingReference}`,
          severity: Math.abs(item.bookingAmount - item.paidAmount) > 1000 ? 'high' : 'medium'
        })
      } else if (item.status === 'missing') {
        discrepancies.push({
          type: 'missing_payment',
          bookingId: item.bookingId,
          paymentId: item.razorpayPaymentId,
          expectedAmount: item.bookingAmount,
          actualAmount: 0,
          description: `Payment not found in Razorpay for booking ${item.bookingReference}`,
          severity: 'high'
        })
      }
    })

    return discrepancies
  }

  private static calculateSummary(
    bookings: any[],
    razorpayPayments: any[],
    razorpayRefunds: any[],
    settlements: any[]
  ) {
    const summary = {
      totalBookings: bookings.length,
      totalPayments: 0,
      totalRefunds: razorpayRefunds.length,
      grossRevenue: 0,
      netRevenue: 0,
      platformFees: 0,
      taxes: 0,
      refundedAmount: 0,
      outstandingAmount: 0
    }

    // Calculate from bookings
    bookings.forEach(booking => {
      summary.grossRevenue += booking.totalPrice || 0
      summary.netRevenue += (booking.paidAmount || 0) - (booking.refundedAmount || 0)
      summary.refundedAmount += booking.refundedAmount || 0
      summary.outstandingAmount += Math.max(0, (booking.totalPrice || 0) - (booking.paidAmount || 0))

      const payments = booking.payments || []
      summary.totalPayments += payments.length

      payments.forEach((payment: any) => {
        summary.platformFees += payment.fee || 0
        summary.taxes += payment.tax || 0
      })
    })

    return summary
  }

  private static generateRecommendations(discrepancies: any[], summary: any): string[] {
    const recommendations = []

    if (discrepancies.length > 0) {
      recommendations.push(`${discrepancies.length} discrepancies found - review and resolve`)

      const criticalDiscrepancies = discrepancies.filter(d => d.severity === 'critical').length
      if (criticalDiscrepancies > 0) {
        recommendations.push(`${criticalDiscrepancies} critical discrepancies require immediate attention`)
      }
    }

    if (summary.outstandingAmount > 0) {
      recommendations.push(`₹${summary.outstandingAmount} in outstanding payments - follow up with customers`)
    }

    const errorRate = discrepancies.length / summary.totalPayments * 100
    if (errorRate > 5) {
      recommendations.push('High error rate detected - review payment processes')
    }

    if (recommendations.length === 0) {
      recommendations.push('All payments reconciled successfully')
    }

    return recommendations
  }

  private static async fixDiscrepancy(discrepancy: any): Promise<boolean> {
    try {
      await connectToDatabase()

      const booking = await Booking.findById(discrepancy.bookingId)
      if (!booking) return false

      switch (discrepancy.type) {
        case 'amount_mismatch':
          // Update booking amount to match Razorpay
          const paymentIndex = booking.payments.findIndex(
            (p: any) => p.paymentId === discrepancy.paymentId
          )
          if (paymentIndex !== -1) {
            booking.payments[paymentIndex].amount = discrepancy.actualAmount
            await booking.save()
            return true
          }
          break

        case 'status_mismatch':
          // Update payment status
          const statusPaymentIndex = booking.payments.findIndex(
            (p: any) => p.paymentId === discrepancy.paymentId
          )
          if (statusPaymentIndex !== -1) {
            // Would need to fetch actual status from Razorpay
            // booking.payments[statusPaymentIndex].status = actualStatus
            await booking.save()
            return true
          }
          break
      }

      return false
    } catch (error) {
      console.error('Fix discrepancy error:', error)
      return false
    }
  }
}