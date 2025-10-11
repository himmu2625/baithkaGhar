import { NextRequest, NextResponse } from 'next/server'
import PropertyPricing from '@/models/PropertyPricing'
import Property from '@/models/Property'
import PlanType from '@/models/PlanType'
import { connectToDatabase } from '@/lib/mongodb'
import { format, parseISO, eachDayOfInterval, differenceInDays } from 'date-fns'

interface DailyPrice {
  date: string
  price: number
  pricingType: 'DIRECT' | 'PLAN_BASED' | 'BASE' | 'FALLBACK'
  source: string
  isAvailable?: boolean
}

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase()

    const body = await request.json()
    const {
      propertyId,
      roomCategory,
      checkInDate,
      checkOutDate,
      planType,
      occupancyType,
    } = body

    if (!propertyId || !checkInDate || !checkOutDate) {
      return NextResponse.json(
        {
          error: 'Missing required parameters',
        },
        { status: 400 }
      )
    }

    const checkIn = parseISO(checkInDate)
    const checkOut = parseISO(checkOutDate)
    const nights = differenceInDays(checkOut, checkIn)

    if (nights <= 0) {
      return NextResponse.json(
        { error: 'Check-out must be after check-in' },
        { status: 400 }
      )
    }

    // Get all dates in the range
    const daysInRange = eachDayOfInterval({ start: checkIn, end: checkOut })
    // Exclude the last day (check-out day)
    daysInRange.pop()

    const dailyPrices: DailyPrice[] = []

    // Get property for fallback
    const property = await Property.findById(propertyId).select(
      'price propertyUnits'
    )

    if (!property) {
      return NextResponse.json(
        { error: 'Property not found' },
        { status: 404 }
      )
    }

    // Calculate price for each day
    for (const day of daysInRange) {
      const dateStr = format(day, 'yyyy-MM-dd')
      let dailyPrice: DailyPrice | null = null

      // Priority 1: DIRECT pricing (exact date)
      const directPricing = await PropertyPricing.findOne({
        propertyId,
        roomCategory,
        planType,
        occupancyType,
        pricingType: 'DIRECT',
        startDate: { $lte: day },
        endDate: { $gte: day },
        isActive: true,
        isAvailable: { $ne: false }, // Filter out unavailable plans
      }).sort({ updatedAt: -1 })

      if (directPricing) {
        dailyPrice = {
          date: dateStr,
          price: directPricing.price,
          pricingType: 'DIRECT',
          source: directPricing.reason || 'Direct pricing override',
          isAvailable: directPricing.isAvailable !== false,
        }
      }

      // Priority 2: PLAN_BASED pricing (date range)
      if (!dailyPrice) {
        const planBasedPricing = await PropertyPricing.findOne({
          propertyId,
          roomCategory,
          planType,
          occupancyType,
          pricingType: 'PLAN_BASED',
          startDate: { $lte: day },
          endDate: { $gte: day },
          isActive: true,
          isAvailable: { $ne: false }, // Filter out unavailable plans
        }).sort({ updatedAt: -1 })

        if (planBasedPricing) {
          dailyPrice = {
            date: dateStr,
            price: planBasedPricing.price,
            pricingType: 'PLAN_BASED',
            source: planBasedPricing.reason || 'Plan-based pricing',
            isAvailable: planBasedPricing.isAvailable !== false,
          }
        }
      }

      // Priority 3: BASE pricing (default)
      if (!dailyPrice) {
        const basePricing = await PropertyPricing.findOne({
          propertyId,
          roomCategory,
          planType,
          occupancyType,
          pricingType: 'BASE',
          isActive: true,
          isAvailable: { $ne: false }, // Filter out unavailable plans
        }).sort({ updatedAt: -1 })

        if (basePricing) {
          dailyPrice = {
            date: dateStr,
            price: basePricing.price,
            pricingType: 'BASE',
            isAvailable: basePricing.isAvailable !== false,
            source: 'Base pricing',
          }
        }
      }

      // Priority 4: Fallback to property pricing
      if (!dailyPrice) {
        let fallbackPrice = property.price?.base || 5000

        // Check property units for room category
        if (roomCategory && property.propertyUnits) {
          const unit = property.propertyUnits.find(
            (u) => u.unitTypeCode === roomCategory
          )
          if (unit && unit.pricing?.price) {
            fallbackPrice = parseFloat(unit.pricing.price)
          }
        }

        dailyPrice = {
          date: dateStr,
          price: fallbackPrice,
          pricingType: 'FALLBACK',
          source: 'Property base price',
        }
      }

      dailyPrices.push(dailyPrice)
    }

    // Calculate totals
    const totalPrice = dailyPrices.reduce((sum, day) => sum + day.price, 0)
    const averagePrice = Math.round(totalPrice / nights)

    // Check if all dates are available
    const isFullyAvailable = dailyPrices.every((day) => day.isAvailable !== false)

    // Get plan types for reference
    const planTypes = await PlanType.find({ isActive: true }).sort({
      sortOrder: 1,
    })

    const planDetails = planTypes.find((plan) => plan.code === planType)

    // Group pricing options for response
    const pricingOptions = [
      {
        roomCategory: roomCategory || 'standard',
        planType: planType || 'EP',
        occupancyType: occupancyType || 'DOUBLE',
        prices: dailyPrices,
        lowestPrice: Math.min(...dailyPrices.map((d) => d.price)),
        highestPrice: Math.max(...dailyPrices.map((d) => d.price)),
        averagePrice: averagePrice,
        totalPrice: totalPrice,
        pricePerNight: averagePrice,
        isAvailable: isFullyAvailable,
        planDetails: planDetails
          ? {
              name: planDetails.name,
              description: planDetails.description,
              inclusions: planDetails.inclusions,
            }
          : null,
        breakdown: {
          daily: dailyPrices,
          summary: {
            directPricingDays: dailyPrices.filter((d) => d.pricingType === 'DIRECT').length,
            planBasedDays: dailyPrices.filter((d) => d.pricingType === 'PLAN_BASED').length,
            basePricingDays: dailyPrices.filter((d) => d.pricingType === 'BASE').length,
            fallbackDays: dailyPrices.filter((d) => d.pricingType === 'FALLBACK').length,
          },
        },
      },
    ]

    return NextResponse.json({
      success: true,
      checkInDate,
      checkOutDate,
      nights,
      pricingOptions,
      planTypes: planTypes.map((plan) => ({
        code: plan.code,
        name: plan.name,
        description: plan.description,
        inclusions: plan.inclusions,
      })),
      summary: {
        totalPrice,
        averagePrice,
        lowestDailyPrice: Math.min(...dailyPrices.map((d) => d.price)),
        highestDailyPrice: Math.max(...dailyPrices.map((d) => d.price)),
        pricingBreakdown: {
          directPricingDays: dailyPrices.filter((d) => d.pricingType === 'DIRECT').length,
          planBasedDays: dailyPrices.filter((d) => d.pricingType === 'PLAN_BASED').length,
          basePricingDays: dailyPrices.filter((d) => d.pricingType === 'BASE').length,
          fallbackDays: dailyPrices.filter((d) => d.pricingType === 'FALLBACK').length,
        },
      },
    })
  } catch (error) {
    console.error('Pricing query error:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
