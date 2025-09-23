import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { validateOSAccess } from '@/lib/auth/os-auth'
import { ReportingAnalyticsService } from '@/lib/services/reporting-analytics-service'
import { z } from 'zod'

const forecastSchema = z.object({
  propertyId: z.string(),
  forecastPeriod: z.number().min(30).max(365).default(90)
})

// POST /api/os/reports/forecast - Generate booking forecast
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
      validatedData = forecastSchema.parse(body)
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

    const forecast = await ReportingAnalyticsService.generateBookingForecast(
      validatedData.propertyId,
      validatedData.forecastPeriod
    )

    return NextResponse.json({
      success: true,
      forecast
    })

  } catch (error) {
    console.error('Generate forecast API error:', error)
    return NextResponse.json(
      { error: 'Failed to generate booking forecast' },
      { status: 500 }
    )
  }
}