import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { validateOSAccess } from '@/lib/auth/os-auth'
import { GuestFeedbackService } from '@/lib/services/guest-feedback-service'

// GET /api/os/feedback/analytics - Get feedback analytics for property
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession()
    const { searchParams } = new URL(request.url)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const propertyId = searchParams.get('propertyId')
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')

    if (!propertyId) {
      return NextResponse.json({ error: 'Property ID is required' }, { status: 400 })
    }

    const hasAccess = await validateOSAccess(session.user?.email, propertyId)
    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const period = (dateFrom && dateTo) ? {
      from: new Date(dateFrom),
      to: new Date(dateTo)
    } : undefined

    const analytics = await GuestFeedbackService.getFeedbackAnalytics(propertyId, period)

    return NextResponse.json({
      success: true,
      analytics
    })

  } catch (error) {
    console.error('Get feedback analytics API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch feedback analytics' },
      { status: 500 }
    )
  }
}