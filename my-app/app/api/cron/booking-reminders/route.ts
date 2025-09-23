import { NextRequest, NextResponse } from 'next/server'
import { bookingReminderService } from '@/lib/services/booking-reminder-service'

// Cron job endpoint for automated booking reminders
// This endpoint should be called by a cron service (Vercel Cron, AWS EventBridge, etc.)
export async function GET(request: NextRequest) {
  try {
    // Verify cron authorization
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      console.error('Unauthorized cron request')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('Starting automated booking reminder processing...')

    const startTime = Date.now()
    const results = await bookingReminderService.processAllReminders()
    const processingTime = Date.now() - startTime

    console.log('Booking reminder processing completed', {
      duration: `${processingTime}ms`,
      results
    })

    // Log successful execution for monitoring
    await logCronExecution({
      type: 'booking_reminders',
      status: 'success',
      duration: processingTime,
      results
    })

    return NextResponse.json({
      success: true,
      processed: results.processed,
      sent: results.sent,
      failed: results.failed,
      duration: processingTime,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Automated booking reminder error:', error)

    // Log failed execution for monitoring
    await logCronExecution({
      type: 'booking_reminders',
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error'
    })

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to process reminders',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}

// POST endpoint for manual cron trigger (useful for testing)
export async function POST(request: NextRequest) {
  try {
    // For manual testing, we'll allow with basic auth
    const body = await request.json()
    const { secret } = body

    if (secret !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('Manual booking reminder trigger...')

    const startTime = Date.now()
    const results = await bookingReminderService.processAllReminders()
    const processingTime = Date.now() - startTime

    await logCronExecution({
      type: 'booking_reminders_manual',
      status: 'success',
      duration: processingTime,
      results
    })

    return NextResponse.json({
      success: true,
      processed: results.processed,
      sent: results.sent,
      failed: results.failed,
      duration: processingTime,
      manual: true,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Manual booking reminder error:', error)

    await logCronExecution({
      type: 'booking_reminders_manual',
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error'
    })

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to process reminders',
        details: error instanceof Error ? error.message : 'Unknown error',
        manual: true,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}

async function logCronExecution(logData: {
  type: string
  status: 'success' | 'error'
  duration?: number
  results?: any
  error?: string
}) {
  try {
    // In production, you would log this to a database or monitoring service
    console.log('Cron execution log:', {
      ...logData,
      timestamp: new Date().toISOString()
    })

    // Example: Send to monitoring service
    /*
    if (process.env.MONITORING_WEBHOOK_URL) {
      await fetch(process.env.MONITORING_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          service: 'booking-reminders',
          ...logData,
          timestamp: new Date().toISOString()
        })
      })
    }
    */

    // Example: Save to database
    /*
    const { connectToDatabase } = await import('@/lib/mongodb')
    const CronLog = await import('@/models/CronLog')

    await connectToDatabase()
    await CronLog.create({
      ...logData,
      timestamp: new Date()
    })
    */
  } catch (error) {
    console.error('Failed to log cron execution:', error)
  }
}
