import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import dbConnect from '@/lib/db/dbConnect'
import Booking from '@/models/Booking'
import { z } from 'zod'

const planRevenueSchema = z.object({
  propertyId: z.string().optional(),
  startDate: z.string().transform(val => new Date(val)),
  endDate: z.string().transform(val => new Date(val)),
})

// GET /api/reports/plan-based-revenue - Get revenue breakdown by plan type
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession()

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const propertyId = searchParams.get('propertyId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    let validatedData
    try {
      validatedData = planRevenueSchema.parse({
        propertyId,
        startDate,
        endDate
      })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json({
          error: 'Validation failed',
          details: error.errors
        }, { status: 400 })
      }
      throw error
    }

    await dbConnect()

    // Build query
    const query: any = {
      status: { $in: ['confirmed', 'completed'] },
      dateFrom: { $gte: validatedData.startDate },
      dateTo: { $lte: validatedData.endDate }
    }

    if (validatedData.propertyId) {
      query.propertyId = validatedData.propertyId
    }

    // Fetch all bookings in the date range
    const bookings = await Booking.find(query).lean()

    // Calculate revenue by plan type
    const planRevenue: Record<string, any> = {
      EP: { revenue: 0, bookings: 0, nights: 0, avgPrice: 0 },
      CP: { revenue: 0, bookings: 0, nights: 0, avgPrice: 0 },
      MAP: { revenue: 0, bookings: 0, nights: 0, avgPrice: 0 },
      AP: { revenue: 0, bookings: 0, nights: 0, avgPrice: 0 },
      UNKNOWN: { revenue: 0, bookings: 0, nights: 0, avgPrice: 0 }
    }

    // Calculate revenue by occupancy type
    const occupancyRevenue: Record<string, any> = {
      SINGLE: { revenue: 0, bookings: 0, avgPrice: 0 },
      DOUBLE: { revenue: 0, bookings: 0, avgPrice: 0 },
      TRIPLE: { revenue: 0, bookings: 0, avgPrice: 0 },
      QUAD: { revenue: 0, bookings: 0, avgPrice: 0 },
      UNKNOWN: { revenue: 0, bookings: 0, avgPrice: 0 }
    }

    // Calculate revenue by room category
    const categoryRevenue: Record<string, any> = {}

    let totalRevenue = 0
    let totalBookings = 0

    bookings.forEach((booking: any) => {
      const revenue = booking.totalPrice || 0
      const nights = booking.nightsCount || 1
      totalRevenue += revenue
      totalBookings++

      // By plan type
      const planType = booking.planType || 'UNKNOWN'
      if (!planRevenue[planType]) {
        planRevenue[planType] = { revenue: 0, bookings: 0, nights: 0, avgPrice: 0 }
      }
      planRevenue[planType].revenue += revenue
      planRevenue[planType].bookings++
      planRevenue[planType].nights += nights

      // By occupancy type
      const occupancyType = booking.occupancyType || 'UNKNOWN'
      if (!occupancyRevenue[occupancyType]) {
        occupancyRevenue[occupancyType] = { revenue: 0, bookings: 0, avgPrice: 0 }
      }
      occupancyRevenue[occupancyType].revenue += revenue
      occupancyRevenue[occupancyType].bookings++

      // By room category
      const category = booking.roomCategory || 'Unknown'
      if (!categoryRevenue[category]) {
        categoryRevenue[category] = { revenue: 0, bookings: 0, avgPrice: 0 }
      }
      categoryRevenue[category].revenue += revenue
      categoryRevenue[category].bookings++
    })

    // Calculate averages
    Object.keys(planRevenue).forEach(plan => {
      if (planRevenue[plan].bookings > 0) {
        planRevenue[plan].avgPrice = planRevenue[plan].revenue / planRevenue[plan].bookings
        planRevenue[plan].percentage = (planRevenue[plan].revenue / totalRevenue) * 100
      }
    })

    Object.keys(occupancyRevenue).forEach(occupancy => {
      if (occupancyRevenue[occupancy].bookings > 0) {
        occupancyRevenue[occupancy].avgPrice = occupancyRevenue[occupancy].revenue / occupancyRevenue[occupancy].bookings
        occupancyRevenue[occupancy].percentage = (occupancyRevenue[occupancy].revenue / totalRevenue) * 100
      }
    })

    Object.keys(categoryRevenue).forEach(category => {
      if (categoryRevenue[category].bookings > 0) {
        categoryRevenue[category].avgPrice = categoryRevenue[category].revenue / categoryRevenue[category].bookings
        categoryRevenue[category].percentage = (categoryRevenue[category].revenue / totalRevenue) * 100
      }
    })

    // Format response
    const report = {
      period: {
        start: validatedData.startDate,
        end: validatedData.endDate
      },
      summary: {
        totalRevenue,
        totalBookings,
        averageBookingValue: totalBookings > 0 ? totalRevenue / totalBookings : 0
      },
      byPlanType: Object.keys(planRevenue)
        .filter(plan => planRevenue[plan].bookings > 0)
        .map(plan => ({
          planType: plan,
          planName: getPlanName(plan),
          revenue: planRevenue[plan].revenue,
          bookings: planRevenue[plan].bookings,
          nights: planRevenue[plan].nights,
          avgPrice: planRevenue[plan].avgPrice,
          percentage: planRevenue[plan].percentage
        }))
        .sort((a, b) => b.revenue - a.revenue),

      byOccupancyType: Object.keys(occupancyRevenue)
        .filter(occupancy => occupancyRevenue[occupancy].bookings > 0)
        .map(occupancy => ({
          occupancyType: occupancy,
          occupancyName: getOccupancyName(occupancy),
          revenue: occupancyRevenue[occupancy].revenue,
          bookings: occupancyRevenue[occupancy].bookings,
          avgPrice: occupancyRevenue[occupancy].avgPrice,
          percentage: occupancyRevenue[occupancy].percentage
        }))
        .sort((a, b) => b.revenue - a.revenue),

      byRoomCategory: Object.keys(categoryRevenue)
        .map(category => ({
          category,
          revenue: categoryRevenue[category].revenue,
          bookings: categoryRevenue[category].bookings,
          avgPrice: categoryRevenue[category].avgPrice,
          percentage: categoryRevenue[category].percentage
        }))
        .sort((a, b) => b.revenue - a.revenue),

      insights: {
        mostPopularPlan: Object.keys(planRevenue)
          .filter(plan => planRevenue[plan].bookings > 0)
          .sort((a, b) => planRevenue[b].bookings - planRevenue[a].bookings)[0] || 'N/A',

        mostPopularOccupancy: Object.keys(occupancyRevenue)
          .filter(occ => occupancyRevenue[occ].bookings > 0)
          .sort((a, b) => occupancyRevenue[b].bookings - occupancyRevenue[a].bookings)[0] || 'N/A',

        highestRevenueCategory: Object.keys(categoryRevenue)
          .sort((a, b) => categoryRevenue[b].revenue - categoryRevenue[a].revenue)[0] || 'N/A'
      }
    }

    return NextResponse.json({
      success: true,
      report
    })

  } catch (error) {
    console.error('Plan-based revenue report error:', error)
    return NextResponse.json(
      { error: 'Failed to generate report' },
      { status: 500 }
    )
  }
}

function getPlanName(code: string): string {
  const names: Record<string, string> = {
    EP: 'European Plan (Room Only)',
    CP: 'Continental Plan (Room + Breakfast)',
    MAP: 'Modified American Plan (Breakfast + 1 Meal)',
    AP: 'American Plan (All Meals)',
    UNKNOWN: 'No Plan Specified'
  }
  return names[code] || code
}

function getOccupancyName(code: string): string {
  const names: Record<string, string> = {
    SINGLE: 'Single Occupancy',
    DOUBLE: 'Double Occupancy',
    TRIPLE: 'Triple Occupancy',
    QUAD: 'Quad Occupancy',
    UNKNOWN: 'No Occupancy Specified'
  }
  return names[code] || code
}
