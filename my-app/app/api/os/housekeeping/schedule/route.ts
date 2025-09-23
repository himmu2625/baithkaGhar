import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { validateOSAccess } from '@/lib/auth/os-auth'
import { HousekeepingService } from '@/lib/services/housekeeping-service'

// GET /api/os/housekeeping/schedule - Get daily housekeeping schedule
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession()
    const { searchParams } = new URL(request.url)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const propertyId = searchParams.get('propertyId')
    const date = searchParams.get('date')

    if (!propertyId) {
      return NextResponse.json({ error: 'Property ID is required' }, { status: 400 })
    }

    const hasAccess = await validateOSAccess(session.user?.email, propertyId)
    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const scheduleDate = date ? new Date(date) : new Date()
    const schedule = await HousekeepingService.getDailySchedule(propertyId, scheduleDate)

    return NextResponse.json({
      success: true,
      schedule
    })

  } catch (error) {
    console.error('Get housekeeping schedule API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch housekeeping schedule' },
      { status: 500 }
    )
  }
}