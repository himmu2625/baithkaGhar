import { NextRequest, NextResponse } from 'next/server'
import { PaymentService } from '@/lib/services/payment-service'
import crypto from 'crypto'

// POST /api/webhooks/razorpay - Handle Razorpay webhooks
export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get('x-razorpay-signature')

    if (!signature) {
      console.error('Missing Razorpay signature header')
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
    }

    // Verify webhook signature
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET
    if (!webhookSecret) {
      console.error('Razorpay webhook secret not configured')
      return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 })
    }

    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(body)
      .digest('hex')

    if (expectedSignature !== signature) {
      console.error('Webhook signature verification failed')
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    // Parse webhook data
    let webhookData
    try {
      webhookData = JSON.parse(body)
    } catch (error) {
      console.error('Invalid webhook JSON:', error)
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
    }

    console.log(`Processing webhook event: ${webhookData.event}`)

    // Process webhook with PaymentService
    const processed = await PaymentService.handleWebhook(webhookData, signature)

    if (!processed) {
      console.error('Failed to process webhook')
      return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      event: webhookData.event,
      processed: true
    })

  } catch (error) {
    console.error('Webhook processing error:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}

// GET /api/webhooks/razorpay - Health check for webhook endpoint
export async function GET() {
  return NextResponse.json({
    status: 'active',
    timestamp: new Date().toISOString(),
    webhook: 'razorpay',
    events: [
      'payment.captured',
      'payment.failed',
      'payment.authorized',
      'order.paid',
      'refund.processed',
      'refund.failed'
    ]
  })
}