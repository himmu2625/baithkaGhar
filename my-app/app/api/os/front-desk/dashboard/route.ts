import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { validateOSAccess } from '@/lib/auth/os-auth'
import { FrontDeskDashboardService } from '@/lib/services/front-desk-dashboard'

// GET /api/os/front-desk/dashboard - Get front desk dashboard
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

    const dashboardDate = date ? new Date(date) : new Date()
    const dashboard = await FrontDeskDashboardService.getDashboard(propertyId, dashboardDate)

    return NextResponse.json({
      success: true,
      dashboard
    })

  } catch (error) {
    console.error('Get front desk dashboard API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch front desk dashboard' },
      { status: 500 }
    )
  }
}