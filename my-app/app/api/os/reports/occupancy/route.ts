import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { validateOSAccess } from '@/lib/auth/os-auth'
import { ReportingAnalyticsService } from '@/lib/services/reporting-analytics-service'
import { z } from 'zod'

const occupancyAnalyticsSchema = z.object({
  propertyId: z.string(),
  startDate: z.string().datetime().transform(val => new Date(val)),
  endDate: z.string().datetime().transform(val => new Date(val))
})

// POST /api/os/reports/occupancy - Generate occupancy analytics
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()
    const body = await request.json()

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Validate request body
    let validatedData
    try {
      validatedData = occupancyAnalyticsSchema.parse(body)
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json({
          error: 'Validation failed',
          details: error.errors.map(e => ({
            field: e.path.join('.'),
            message: e.message
          }))
        }, { status: 400 })
      }
      throw error
    }

    const hasAccess = await validateOSAccess(session.user?.email, validatedData.propertyId)
    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const analytics = await ReportingAnalyticsService.generateOccupancyAnalytics(
      validatedData.propertyId,
      {
        start: validatedData.startDate,
        end: validatedData.endDate
      }
    )

    return NextResponse.json({
      success: true,
      analytics
    })

  } catch (error) {
    console.error('Generate occupancy analytics API error:', error)
    return NextResponse.json(
      { error: 'Failed to generate occupancy analytics' },
      { status: 500 }
    )
  }
}