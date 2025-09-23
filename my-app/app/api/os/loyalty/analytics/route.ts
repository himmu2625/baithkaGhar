import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { validateOSAccess } from '@/lib/auth/os-auth'
import { GuestLoyaltyService } from '@/lib/services/guest-loyalty-service'

// GET /api/os/loyalty/analytics - Get loyalty program analytics
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession()
    const { searchParams } = new URL(request.url)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const propertyId = searchParams.get('propertyId')

    // If property ID is provided, validate access
    if (propertyId) {
      const hasAccess = await validateOSAccess(session.user?.email, propertyId)
      if (!hasAccess) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 })
      }
    }

    const analytics = await GuestLoyaltyService.getLoyaltyAnalytics(propertyId || undefined)

    return NextResponse.json({
      success: true,
      analytics
    })

  } catch (error) {
    console.error('Get loyalty analytics API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch loyalty analytics' },
      { status: 500 }
    )
  }
}