import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { GuestServiceRequestService } from '@/lib/services/guest-service-request'

// GET /api/os/services/categories - Get service categories and types
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession()

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const categories = await GuestServiceRequestService.getServiceCategories()

    return NextResponse.json({
      success: true,
      categories
    })

  } catch (error) {
    console.error('Get service categories API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch service categories' },
      { status: 500 }
    )
  }
}