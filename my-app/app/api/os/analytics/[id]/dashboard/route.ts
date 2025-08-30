import { NextRequest, NextResponse } from 'next/server'
import { AnalyticsService } from '@/lib/services/os/analytics-service'
import { auth } from '@/lib/auth'

// GET /api/os/analytics/[id]/dashboard - Get comprehensive analytics dashboard
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log(`📊 [GET /api/os/analytics/${params.id}/dashboard] Fetching analytics dashboard`)
    
    // Check authentication
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: propertyId } = params
    const { searchParams } = new URL(request.url)

    if (!propertyId) {
      return NextResponse.json(
        { error: 'Property ID is required' },
        { status: 400 }
      )
    }

    // Parse query parameters
    const requestedPeriod = searchParams.get('period') || 'monthly'
    const period = (['daily', 'weekly', 'monthly'].includes(requestedPeriod) ? requestedPeriod : 'monthly') as 'daily' | 'weekly' | 'monthly'
    const startDate = searchParams.get('startDate') ? new Date(searchParams.get('startDate')!) : undefined
    const endDate = searchParams.get('endDate') ? new Date(searchParams.get('endDate')!) : undefined
    const analytics = searchParams.get('analytics')?.split(',') || ['revenue', 'occupancy', 'bookings']

    // Get analytics data based on requested types
    const analyticsPromises: any = {}
    
    if (analytics.includes('revenue')) {
      analyticsPromises.revenue = AnalyticsService.getRevenueAnalytics(propertyId, period, startDate, endDate)
    }
    
    if (analytics.includes('occupancy')) {
      analyticsPromises.occupancy = AnalyticsService.getOccupancyAnalytics(propertyId, period, startDate, endDate)
    }
    
    if (analytics.includes('bookings')) {
      analyticsPromises.bookings = AnalyticsService.getBookingAnalytics(propertyId, period, startDate, endDate)
    }
    
    // If no specific analytics requested or 'dashboard' included, get full dashboard summary
    if (analytics.length === 0 || analytics.includes('dashboard')) {
      analyticsPromises.dashboard = AnalyticsService.getDashboardSummary(propertyId)
    }

    const results = await Promise.all(
      Object.entries(analyticsPromises).map(async ([key, promise]) => {
        try {
          const result = await promise
          return [key, result]
        } catch (error) {
          console.error(`Error fetching ${key} analytics:`, error)
          return [key, null]
        }
      })
    )

    const analyticsData = Object.fromEntries(results)
    
    console.log(`✅ [GET /api/os/analytics/${propertyId}/dashboard] Analytics retrieved successfully`)

    return NextResponse.json({
      success: true,
      propertyId,
      period,
      dateRange: {
        start: startDate?.toISOString() || null,
        end: endDate?.toISOString() || null
      },
      analytics: analyticsData,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error(`💥 [GET /api/os/analytics/${params?.id}/dashboard] Error:`, error)
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// POST /api/os/analytics/[id]/dashboard - Get custom analytics report
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log(`📊 [POST /api/os/analytics/${params.id}/dashboard] Generating custom analytics report`)
    
    // Check authentication and authorization
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has permission to view analytics
    if (!['admin', 'super_admin', 'property_manager', 'analyst'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id: propertyId } = params
    const body = await request.json()

    if (!propertyId) {
      return NextResponse.json(
        { error: 'Property ID is required' },
        { status: 400 }
      )
    }

    const {
      reportType,
      dateRange,
      metrics,
      period = 'monthly',
      compareWith,
      filters = {}
    } = body

    if (!reportType || !dateRange || !metrics) {
      return NextResponse.json(
        { error: 'Report type, date range, and metrics are required' },
        { status: 400 }
      )
    }

    const startDate = new Date(dateRange.start)
    const endDate = new Date(dateRange.end)

    // Generate custom analytics based on requested metrics
    const analyticsPromises: any = {}
    
    for (const metric of metrics) {
      switch (metric) {
        case 'revenue':
          analyticsPromises.revenue = AnalyticsService.getRevenueAnalytics(
            propertyId, period, startDate, endDate
          )
          break
        case 'occupancy':
          analyticsPromises.occupancy = AnalyticsService.getOccupancyAnalytics(
            propertyId, period, startDate, endDate
          )
          break
        case 'bookings':
          analyticsPromises.bookings = AnalyticsService.getBookingAnalytics(
            propertyId, period, startDate, endDate
          )
          break
      }
    }

    // Add comparison data if requested
    if (compareWith) {
      const compareStartDate = new Date(compareWith.start)
      const compareEndDate = new Date(compareWith.end)
      
      for (const metric of metrics) {
        switch (metric) {
          case 'revenue':
            analyticsPromises.revenueComparison = AnalyticsService.getRevenueAnalytics(
              propertyId, period, compareStartDate, compareEndDate
            )
            break
          case 'occupancy':
            analyticsPromises.occupancyComparison = AnalyticsService.getOccupancyAnalytics(
              propertyId, period, compareStartDate, compareEndDate
            )
            break
          case 'bookings':
            analyticsPromises.bookingsComparison = AnalyticsService.getBookingAnalytics(
              propertyId, period, compareStartDate, compareEndDate
            )
            break
        }
      }
    }

    const results = await Promise.all(
      Object.entries(analyticsPromises).map(async ([key, promise]) => {
        try {
          const result = await promise
          return [key, result]
        } catch (error) {
          console.error(`Error fetching ${key} analytics:`, error)
          return [key, null]
        }
      })
    )

    const analyticsData = Object.fromEntries(results)

    // Generate insights and recommendations based on the data
    const insights = generateInsights(analyticsData, reportType)
    const recommendations = generateRecommendations(analyticsData, reportType)
    
    console.log(`✅ [POST /api/os/analytics/${propertyId}/dashboard] Custom report generated successfully`)

    return NextResponse.json({
      success: true,
      propertyId,
      reportType,
      period,
      dateRange: {
        start: startDate.toISOString(),
        end: endDate.toISOString()
      },
      ...(compareWith && {
        compareWith: {
          start: new Date(compareWith.start).toISOString(),
          end: new Date(compareWith.end).toISOString()
        }
      }),
      metrics,
      analytics: analyticsData,
      insights,
      recommendations,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error(`💥 [POST /api/os/analytics/${params?.id}/dashboard] Error:`, error)
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }

}

// Helper function for generating insights
function generateInsights(analyticsData: any, reportType: string): string[] {
    const insights = []

    if (analyticsData.revenue) {
      const revenue = analyticsData.revenue
      if (revenue.revenueGrowth > 10) {
        insights.push(`Strong revenue growth of ${revenue.revenueGrowth}% indicates positive market performance`)
      } else if (revenue.revenueGrowth < -10) {
        insights.push(`Revenue decline of ${Math.abs(revenue.revenueGrowth)}% requires immediate attention`)
      }
      
      if (revenue.averageDailyRate > 0) {
        insights.push(`Average daily rate of ₹${revenue.averageDailyRate} shows competitive pricing`)
      }
    }

    if (analyticsData.occupancy) {
      const occupancy = analyticsData.occupancy
      if (occupancy.occupancyRate > 80) {
        insights.push(`High occupancy rate of ${occupancy.occupancyRate}% indicates strong demand`)
      } else if (occupancy.occupancyRate < 50) {
        insights.push(`Low occupancy rate of ${occupancy.occupancyRate}% suggests need for marketing initiatives`)
      }
      
      if (occupancy.cancellationRate > 15) {
        insights.push(`High cancellation rate of ${occupancy.cancellationRate}% may indicate pricing or policy issues`)
      }
    }

    if (analyticsData.bookings) {
      const bookings = analyticsData.bookings
      if (bookings.leadTimeAnalysis.averageLeadTime < 7) {
        insights.push(`Short booking lead time suggests strong local/last-minute demand`)
      } else if (bookings.leadTimeAnalysis.averageLeadTime > 30) {
        insights.push(`Long booking lead time indicates advance planning travelers`)
      }
    }

    return insights.length > 0 ? insights : ['Analytics data processed successfully']
  }

// Helper function for generating recommendations
function generateRecommendations(analyticsData: any, reportType: string): string[] {
    const recommendations = []

    if (analyticsData.revenue) {
      const revenue = analyticsData.revenue
      if (revenue.revenueGrowth < 0) {
        recommendations.push('Consider implementing dynamic pricing strategies to boost revenue')
        recommendations.push('Review and enhance marketing campaigns to increase bookings')
      }
      
      if (revenue.revenuePerAvailableRoom < revenue.averageDailyRate * 0.7) {
        recommendations.push('Focus on improving occupancy rates to maximize RevPAR')
      }
    }

    if (analyticsData.occupancy) {
      const occupancy = analyticsData.occupancy
      if (occupancy.occupancyRate < 70) {
        recommendations.push('Implement targeted promotions to increase occupancy during low-demand periods')
        recommendations.push('Consider partnerships with OTAs to expand distribution channels')
      }
      
      if (occupancy.cancellationRate > 15) {
        recommendations.push('Review cancellation policies and consider flexible booking options')
      }
    }

    if (analyticsData.bookings) {
      const bookings = analyticsData.bookings
      const directBookingsPercent = bookings.sourceAnalysis?.direct?.percentage || 0
      if (directBookingsPercent < 40) {
        recommendations.push('Increase direct booking initiatives to reduce commission costs')
        recommendations.push('Enhance website booking experience and offer direct booking incentives')
      }
    }

    return recommendations.length > 0 ? recommendations : ['Continue monitoring key metrics for optimization opportunities']
  }