import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { bookingReminderService } from '@/lib/services/booking-reminder-service'

// Manual trigger for booking reminders (for testing and manual execution)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()

    // Only allow admin users to manually trigger reminders
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // In production, you might want additional authorization checks here
    // For now, we'll allow any authenticated user to trigger reminders

    const { searchParams } = request.nextUrl
    const reminderType = searchParams.get('type') // specific reminder type or 'all'
    const dryRun = searchParams.get('dryRun') === 'true' // test mode without sending emails

    console.log(`Manual reminder trigger by ${session.user.email}`, {
      type: reminderType || 'all',
      dryRun
    })

    let results

    if (dryRun) {
      // In dry run mode, return what would be processed without actually sending emails
      results = await getRemindersPreview(reminderType)
    } else {
      // Process actual reminders
      if (reminderType && reminderType !== 'all') {
        results = await processSingleReminderType(reminderType)
      } else {
        results = await bookingReminderService.processAllReminders()
      }
    }

    return NextResponse.json({
      success: true,
      dryRun,
      reminderType: reminderType || 'all',
      results,
      triggeredBy: session.user.email,
      triggeredAt: new Date().toISOString()
    })
  } catch (error) {
    console.error('Manual reminder trigger error:', error)
    return NextResponse.json(
      {
        error: 'Failed to process reminders',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// Get reminder processing status and recent activity
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession()

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = request.nextUrl
    const days = parseInt(searchParams.get('days') || '7')

    // This would typically come from a logging/activity table
    // For now, we'll return mock recent activity
    const recentActivity = await getRecentReminderActivity(days)
    const upcomingReminders = await getUpcomingReminders()

    return NextResponse.json({
      success: true,
      recentActivity,
      upcomingReminders,
      config: {
        checkInReminder: { enabled: true, daysBefore: 1 },
        checkOutReminder: { enabled: true, daysBefore: 0 },
        paymentReminder: { enabled: true, daysBefore: [7, 3, 1] },
        feedbackRequest: { enabled: true, daysAfterCheckOut: 1 },
        cancellationDeadline: { enabled: true, daysBefore: 2 }
      },
      lastUpdate: new Date().toISOString()
    })
  } catch (error) {
    console.error('Reminder status error:', error)
    return NextResponse.json(
      { error: 'Failed to get reminder status' },
      { status: 500 }
    )
  }
}

async function processSingleReminderType(type: string) {
  switch (type) {
    case 'check_in':
      return await bookingReminderService.processCheckInReminders()
    case 'check_out':
      return await bookingReminderService.processCheckOutReminders()
    case 'payment':
      return await bookingReminderService.processPaymentReminders()
    case 'feedback':
      return await bookingReminderService.processFeedbackRequests()
    case 'cancellation':
      return await bookingReminderService.processCancellationDeadlineReminders()
    default:
      throw new Error(`Unknown reminder type: ${type}`)
  }
}

async function getRemindersPreview(reminderType?: string | null) {
  // This would return a preview of what reminders would be sent
  // without actually sending them
  const { connectToDatabase } = await import('@/lib/mongodb')
  const Booking = (await import('@/models/Booking')).default
  const { addDays, subDays, startOfDay, endOfDay } = await import('date-fns')

  await connectToDatabase()

  const preview = {
    checkInReminders: 0,
    checkOutReminders: 0,
    paymentReminders: 0,
    feedbackRequests: 0,
    cancellationDeadlineReminders: 0
  }

  if (!reminderType || reminderType === 'all' || reminderType === 'check_in') {
    const targetDate = addDays(new Date(), 1)
    preview.checkInReminders = await Booking.countDocuments({
      dateFrom: { $gte: startOfDay(targetDate), $lte: endOfDay(targetDate) },
      status: { $in: ['confirmed', 'pending'] },
      $or: [
        { 'emailSent.checkInReminder': { $exists: false } },
        { 'emailSent.checkInReminder': null }
      ]
    })
  }

  if (!reminderType || reminderType === 'all' || reminderType === 'check_out') {
    const targetDate = new Date()
    preview.checkOutReminders = await Booking.countDocuments({
      dateTo: { $gte: startOfDay(targetDate), $lte: endOfDay(targetDate) },
      status: 'confirmed',
      checkInTime: { $exists: true },
      $or: [
        { 'emailSent.checkOutReminder': { $exists: false } },
        { 'emailSent.checkOutReminder': null }
      ]
    })
  }

  if (!reminderType || reminderType === 'all' || reminderType === 'payment') {
    const dates = [7, 3, 1].map(days => addDays(new Date(), days))
    for (const targetDate of dates) {
      const count = await Booking.countDocuments({
        dateFrom: { $gte: startOfDay(targetDate), $lte: endOfDay(targetDate) },
        status: { $in: ['confirmed', 'pending'] },
        paymentStatus: { $in: ['pending', 'failed'] },
        $expr: { $lt: [{ $ifNull: ['$emailSent.paymentReminderCount', 0] }, 3] }
      })
      preview.paymentReminders += count
    }
  }

  if (!reminderType || reminderType === 'all' || reminderType === 'feedback') {
    const targetDate = subDays(new Date(), 1)
    preview.feedbackRequests = await Booking.countDocuments({
      dateTo: { $gte: startOfDay(targetDate), $lte: endOfDay(targetDate) },
      status: 'completed',
      checkOutTime: { $exists: true },
      $or: [
        { 'emailSent.feedbackRequest': { $exists: false } },
        { 'emailSent.feedbackRequest': null }
      ]
    })
  }

  if (!reminderType || reminderType === 'all' || reminderType === 'cancellation') {
    const targetDate = addDays(new Date(), 2)
    preview.cancellationDeadlineReminders = await Booking.countDocuments({
      dateFrom: { $gte: startOfDay(targetDate), $lte: endOfDay(targetDate) },
      status: { $in: ['confirmed', 'pending'] },
      $or: [
        { 'emailSent.cancellationDeadline': { $exists: false } },
        { 'emailSent.cancellationDeadline': null }
      ]
    })
  }

  return {
    processed: Object.values(preview).reduce((sum, count) => sum + count, 0),
    sent: 0,
    failed: 0,
    preview,
    dryRun: true
  }
}

async function getRecentReminderActivity(days: number) {
  // This would typically query an activity log table
  // For now, return mock data
  return {
    totalReminders: 45,
    successRate: 95.6,
    dailyBreakdown: Array.from({ length: days }, (_, i) => ({
      date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      sent: Math.floor(Math.random() * 20),
      failed: Math.floor(Math.random() * 2)
    })).reverse(),
    typeBreakdown: {
      checkIn: 15,
      checkOut: 12,
      payment: 8,
      feedback: 7,
      cancellationDeadline: 3
    }
  }
}

async function getUpcomingReminders() {
  // This would calculate upcoming reminders based on current bookings
  const { connectToDatabase } = await import('@/lib/mongodb')
  const Booking = (await import('@/models/Booking')).default
  const { addDays, startOfDay, endOfDay } = await import('date-fns')

  await connectToDatabase()

  const upcoming = []

  // Next 7 days
  for (let i = 0; i < 7; i++) {
    const date = addDays(new Date(), i)
    const startDate = startOfDay(date)
    const endDate = endOfDay(date)

    const [checkIns, checkOuts, payments] = await Promise.all([
      Booking.countDocuments({
        dateFrom: { $gte: startDate, $lte: endDate },
        status: { $in: ['confirmed', 'pending'] }
      }),
      Booking.countDocuments({
        dateTo: { $gte: startDate, $lte: endDate },
        status: 'confirmed',
        checkInTime: { $exists: true }
      }),
      Booking.countDocuments({
        dateFrom: { $gte: startDate, $lte: endDate },
        status: { $in: ['confirmed', 'pending'] },
        paymentStatus: { $in: ['pending', 'failed'] }
      })
    ])

    if (checkIns > 0 || checkOuts > 0 || payments > 0) {
      upcoming.push({
        date: date.toISOString().slice(0, 10),
        checkInReminders: i === 1 ? checkIns : 0, // Check-in reminders sent 1 day before
        checkOutReminders: i === 0 ? checkOuts : 0, // Check-out reminders sent same day
        paymentReminders: [7, 3, 1].includes(i) ? payments : 0 // Payment reminders at specific intervals
      })
    }
  }

  return upcoming
}