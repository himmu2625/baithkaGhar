import Razorpay from 'razorpay'
import crypto from 'crypto'
import { connectToDatabase } from '@/lib/mongodb'
import Booking from '@/models/Booking'

export interface PaymentRequest {
  bookingId: string
  amount: number
  currency?: string
  description?: string
  customerDetails: {
    name: string
    email: string
    contact: string
  }
  paymentType: 'full' | 'partial' | 'security_deposit'
  metadata?: Record<string, any>
}

export interface PaymentResponse {
  success: boolean
  orderId?: string
  paymentId?: string
  amount?: number
  currency?: string
  status?: 'created' | 'authorized' | 'captured' | 'refunded' | 'failed'
  errorCode?: string
  errorDescription?: string
  razorpayOrderId?: string
  razorpayPaymentId?: string
  razorpaySignature?: string
}

export interface RefundRequest {
  paymentId: string
  amount?: number
  reason?: string
  notes?: Record<string, string>
  speed?: 'normal' | 'optimum'
}

export interface RefundResponse {
  success: boolean
  refundId?: string
  amount?: number
  status?: string
  errorCode?: string
  errorDescription?: string
}

export interface PaymentWebhookData {
  event: string
  account_id: string
  entity: 'payment' | 'order' | 'refund'
  contains: string[]
  payload: {
    payment?: {
      entity: any
    }
    order?: {
      entity: any
    }
    refund?: {
      entity: any
    }
  }
}

export class PaymentService {
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

  // Create payment order
  static async createPaymentOrder(request: PaymentRequest): Promise<PaymentResponse> {
    try {
      await connectToDatabase()

      // Validate booking exists
      const booking = await Booking.findById(request.bookingId)
      if (!booking) {
        return {
          success: false,
          errorCode: 'BOOKING_NOT_FOUND',
          errorDescription: 'Booking not found'
        }
      }

      // Calculate amount in paise (Razorpay uses smallest currency unit)
      const amountInPaise = Math.round(request.amount * 100)

      const razorpay = this.getRazorpayInstance()

      // Create Razorpay order
      const orderOptions = {
        amount: amountInPaise,
        currency: request.currency || 'INR',
        receipt: `booking_${request.bookingId}_${Date.now()}`,
        notes: {
          bookingId: request.bookingId,
          paymentType: request.paymentType,
          customerName: request.customerDetails.name,
          customerEmail: request.customerDetails.email,
          ...request.metadata
        },
        payment_capture: false // Manual capture for better control
      }

      const order = await razorpay.orders.create(orderOptions)

      // Store payment intent in booking
      const paymentIntent = {
        razorpayOrderId: order.id,
        amount: request.amount,
        currency: order.currency,
        status: 'created',
        paymentType: request.paymentType,
        customerDetails: request.customerDetails,
        createdAt: new Date(),
        receipt: order.receipt
      }

      if (!booking.paymentIntents) {
        booking.paymentIntents = []
      }
      booking.paymentIntents.push(paymentIntent)

      await booking.save()

      return {
        success: true,
        orderId: order.id,
        amount: request.amount,
        currency: order.currency,
        status: 'created',
        razorpayOrderId: order.id
      }

    } catch (error) {
      console.error('Payment order creation error:', error)
      return {
        success: false,
        errorCode: 'ORDER_CREATION_FAILED',
        errorDescription: error instanceof Error ? error.message : 'Failed to create payment order'
      }
    }
  }

  // Verify payment signature
  static verifyPaymentSignature(
    razorpayOrderId: string,
    razorpayPaymentId: string,
    razorpaySignature: string
  ): boolean {
    try {
      const keySecret = process.env.RAZORPAY_KEY_SECRET
      if (!keySecret) {
        throw new Error('Razorpay key secret not configured')
      }

      const body = razorpayOrderId + '|' + razorpayPaymentId
      const expectedSignature = crypto
        .createHmac('sha256', keySecret)
        .update(body.toString())
        .digest('hex')

      return expectedSignature === razorpaySignature
    } catch (error) {
      console.error('Signature verification error:', error)
      return false
    }
  }

  // Process payment success
  static async processPaymentSuccess(
    razorpayOrderId: string,
    razorpayPaymentId: string,
    razorpaySignature: string
  ): Promise<PaymentResponse> {
    try {
      // Verify signature
      if (!this.verifyPaymentSignature(razorpayOrderId, razorpayPaymentId, razorpaySignature)) {
        return {
          success: false,
          errorCode: 'SIGNATURE_VERIFICATION_FAILED',
          errorDescription: 'Payment signature verification failed'
        }
      }

      await connectToDatabase()

      // Find booking with this order
      const booking = await Booking.findOne({
        'paymentIntents.razorpayOrderId': razorpayOrderId
      })

      if (!booking) {
        return {
          success: false,
          errorCode: 'BOOKING_NOT_FOUND',
          errorDescription: 'Booking not found for this payment'
        }
      }

      const razorpay = this.getRazorpayInstance()

      // Fetch payment details from Razorpay
      const payment = await razorpay.payments.fetch(razorpayPaymentId)

      // Capture the payment
      const capturedPayment = await razorpay.payments.capture(
        razorpayPaymentId,
        payment.amount
      )

      // Update payment intent in booking
      const paymentIntentIndex = booking.paymentIntents.findIndex(
        (intent: any) => intent.razorpayOrderId === razorpayOrderId
      )

      if (paymentIntentIndex !== -1) {
        booking.paymentIntents[paymentIntentIndex].razorpayPaymentId = razorpayPaymentId
        booking.paymentIntents[paymentIntentIndex].status = 'captured'
        booking.paymentIntents[paymentIntentIndex].capturedAt = new Date()
        booking.paymentIntents[paymentIntentIndex].method = payment.method
        booking.paymentIntents[paymentIntentIndex].card = payment.card_id ? {
          id: payment.card_id,
          last4: payment.card?.last4,
          network: payment.card?.network
        } : undefined
      }

      // Update main payment fields
      const paymentAmount = payment.amount / 100 // Convert from paise

      if (!booking.payments) {
        booking.payments = []
      }

      booking.payments.push({
        paymentId: razorpayPaymentId,
        orderId: razorpayOrderId,
        amount: paymentAmount,
        currency: payment.currency,
        status: 'completed',
        method: payment.method,
        processedAt: new Date(),
        fee: payment.fee / 100,
        tax: payment.tax / 100
      })

      // Update total paid amount
      booking.paidAmount = (booking.paidAmount || 0) + paymentAmount

      // Update payment status
      if (booking.paidAmount >= booking.totalPrice) {
        booking.paymentStatus = 'completed'
        booking.status = booking.status === 'pending' ? 'confirmed' : booking.status
      } else {
        booking.paymentStatus = 'partial'
      }

      booking.lastPaymentDate = new Date()

      await booking.save()

      return {
        success: true,
        paymentId: razorpayPaymentId,
        orderId: razorpayOrderId,
        amount: paymentAmount,
        currency: payment.currency,
        status: 'captured',
        razorpayOrderId,
        razorpayPaymentId,
        razorpaySignature
      }

    } catch (error) {
      console.error('Payment processing error:', error)
      return {
        success: false,
        errorCode: 'PAYMENT_PROCESSING_FAILED',
        errorDescription: error instanceof Error ? error.message : 'Failed to process payment'
      }
    }
  }

  // Process payment failure
  static async processPaymentFailure(
    razorpayOrderId: string,
    errorCode: string,
    errorDescription: string
  ): Promise<void> {
    try {
      await connectToDatabase()

      const booking = await Booking.findOne({
        'paymentIntents.razorpayOrderId': razorpayOrderId
      })

      if (booking) {
        const paymentIntentIndex = booking.paymentIntents.findIndex(
          (intent: any) => intent.razorpayOrderId === razorpayOrderId
        )

        if (paymentIntentIndex !== -1) {
          booking.paymentIntents[paymentIntentIndex].status = 'failed'
          booking.paymentIntents[paymentIntentIndex].failureReason = errorDescription
          booking.paymentIntents[paymentIntentIndex].errorCode = errorCode
          booking.paymentIntents[paymentIntentIndex].failedAt = new Date()
        }

        // Add to payment failures
        if (!booking.paymentFailures) {
          booking.paymentFailures = []
        }

        booking.paymentFailures.push({
          orderId: razorpayOrderId,
          errorCode,
          errorDescription,
          attemptedAt: new Date()
        })

        await booking.save()
      }

    } catch (error) {
      console.error('Payment failure processing error:', error)
    }
  }

  // Process refund
  static async processRefund(request: RefundRequest): Promise<RefundResponse> {
    try {
      const razorpay = this.getRazorpayInstance()

      // Fetch original payment
      const payment = await razorpay.payments.fetch(request.paymentId)

      if (!payment) {
        return {
          success: false,
          errorCode: 'PAYMENT_NOT_FOUND',
          errorDescription: 'Original payment not found'
        }
      }

      // Calculate refund amount
      const refundAmount = request.amount ? Math.round(request.amount * 100) : payment.amount

      if (refundAmount > payment.amount) {
        return {
          success: false,
          errorCode: 'INVALID_REFUND_AMOUNT',
          errorDescription: 'Refund amount cannot exceed original payment amount'
        }
      }

      // Process refund
      const refundOptions: any = {
        amount: refundAmount,
        speed: request.speed || 'normal'
      }

      if (request.notes) {
        refundOptions.notes = request.notes
      }

      const refund = await razorpay.payments.refund(request.paymentId, refundOptions)

      // Update booking record
      await connectToDatabase()

      const booking = await Booking.findOne({
        'payments.paymentId': request.paymentId
      })

      if (booking) {
        if (!booking.refunds) {
          booking.refunds = []
        }

        booking.refunds.push({
          refundId: refund.id,
          paymentId: request.paymentId,
          amount: refundAmount / 100,
          currency: refund.currency,
          status: refund.status,
          reason: request.reason,
          processedAt: new Date(),
          receipt: refund.receipt
        })

        // Update refunded amount
        booking.refundedAmount = (booking.refundedAmount || 0) + (refundAmount / 100)

        // Update payment status
        if (booking.refundedAmount >= booking.paidAmount) {
          booking.paymentStatus = 'refunded'
        } else {
          booking.paymentStatus = 'partial_refund'
        }

        await booking.save()
      }

      return {
        success: true,
        refundId: refund.id,
        amount: refundAmount / 100,
        status: refund.status
      }

    } catch (error) {
      console.error('Refund processing error:', error)
      return {
        success: false,
        errorCode: 'REFUND_PROCESSING_FAILED',
        errorDescription: error instanceof Error ? error.message : 'Failed to process refund'
      }
    }
  }

  // Handle webhooks
  static async handleWebhook(webhookData: PaymentWebhookData, signature: string): Promise<boolean> {
    try {
      // Verify webhook signature
      if (!this.verifyWebhookSignature(JSON.stringify(webhookData), signature)) {
        console.error('Webhook signature verification failed')
        return false
      }

      await connectToDatabase()

      switch (webhookData.event) {
        case 'payment.captured':
          await this.handlePaymentCapturedWebhook(webhookData.payload.payment?.entity)
          break

        case 'payment.failed':
          await this.handlePaymentFailedWebhook(webhookData.payload.payment?.entity)
          break

        case 'refund.processed':
          await this.handleRefundProcessedWebhook(webhookData.payload.refund?.entity)
          break

        case 'order.paid':
          await this.handleOrderPaidWebhook(webhookData.payload.order?.entity)
          break

        default:
          console.log(`Unhandled webhook event: ${webhookData.event}`)
      }

      return true

    } catch (error) {
      console.error('Webhook processing error:', error)
      return false
    }
  }

  // Get payment status
  static async getPaymentStatus(bookingId: string): Promise<{
    totalAmount: number
    paidAmount: number
    refundedAmount: number
    paymentStatus: string
    payments: any[]
    refunds: any[]
    pendingPayments: any[]
  }> {
    try {
      await connectToDatabase()

      const booking = await Booking.findById(bookingId)

      if (!booking) {
        throw new Error('Booking not found')
      }

      return {
        totalAmount: booking.totalPrice || 0,
        paidAmount: booking.paidAmount || 0,
        refundedAmount: booking.refundedAmount || 0,
        paymentStatus: booking.paymentStatus || 'pending',
        payments: booking.payments || [],
        refunds: booking.refunds || [],
        pendingPayments: booking.paymentIntents?.filter((intent: any) =>
          intent.status === 'created' || intent.status === 'authorized'
        ) || []
      }

    } catch (error) {
      console.error('Get payment status error:', error)
      throw error
    }
  }

  // Private helper methods
  private static verifyWebhookSignature(body: string, signature: string): boolean {
    try {
      const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET
      if (!webhookSecret) {
        console.error('Webhook secret not configured')
        return false
      }

      const expectedSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(body)
        .digest('hex')

      return expectedSignature === signature
    } catch (error) {
      console.error('Webhook signature verification error:', error)
      return false
    }
  }

  private static async handlePaymentCapturedWebhook(payment: any): Promise<void> {
    if (!payment) return

    const booking = await Booking.findOne({
      'payments.paymentId': payment.id
    })

    if (booking) {
      // Update payment status if needed
      const paymentIndex = booking.payments.findIndex((p: any) => p.paymentId === payment.id)
      if (paymentIndex !== -1) {
        booking.payments[paymentIndex].status = 'completed'
        booking.payments[paymentIndex].capturedAt = new Date()
        await booking.save()
      }
    }
  }

  private static async handlePaymentFailedWebhook(payment: any): Promise<void> {
    if (!payment) return

    await this.processPaymentFailure(
      payment.order_id,
      payment.error_code || 'PAYMENT_FAILED',
      payment.error_description || 'Payment failed'
    )
  }

  private static async handleRefundProcessedWebhook(refund: any): Promise<void> {
    if (!refund) return

    const booking = await Booking.findOne({
      'refunds.refundId': refund.id
    })

    if (booking) {
      const refundIndex = booking.refunds.findIndex((r: any) => r.refundId === refund.id)
      if (refundIndex !== -1) {
        booking.refunds[refundIndex].status = refund.status
        booking.refunds[refundIndex].processedAt = new Date()
        await booking.save()
      }
    }
  }

  private static async handleOrderPaidWebhook(order: any): Promise<void> {
    if (!order) return

    const booking = await Booking.findOne({
      'paymentIntents.razorpayOrderId': order.id
    })

    if (booking) {
      // Order is fully paid - update status
      booking.paymentStatus = 'completed'
      if (booking.status === 'pending') {
        booking.status = 'confirmed'
      }
      await booking.save()
    }
  }
}