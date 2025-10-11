import { NextRequest, NextResponse } from 'next/server'
import PropertyPricing from '@/models/PropertyPricing'
import Property from '@/models/Property'
import PlanType from '@/models/PlanType'
import { connectToDatabase } from '@/lib/mongodb'
import { format, parseISO, eachDayOfInterval } from 'date-fns'

interface PricingOption {
  roomCategory: string
  planType: string
  occupancyType: string
  prices: Array<{
    price: number
    startDate: Date
    endDate: Date
    seasonType: string
  }>
  lowestPrice: number
  highestPrice: number
  seasonTypes: Set<string>
}

interface GroupedPricing {
  [key: string]: PricingOption
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

    // Build query
    const query = {
      propertyId,
      startDate: { $lte: checkOut },
      endDate: { $gte: checkIn },
      isActive: true,
      ...(roomCategory && { roomCategory }),
      ...(planType && { planType }),
      ...(occupancyType && { occupancyType }),
    }

    // Get pricing data from PropertyPricing collection
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let pricingData: any[] = await PropertyPricing.find(query).sort({
      roomCategory: 1,
      planType: 1,
      occupancyType: 1,
      price: 1,
    })

    // If no pricing data found, check Property.dynamicPricing as fallback
    if (!pricingData || pricingData.length === 0) {
      const property = await Property.findById(propertyId).select(
        'dynamicPricing propertyUnits price'
      )

      if (property) {
        // Extract base price from room category or property
        let basePrice = property.price?.base || 5000

        if (roomCategory && property.propertyUnits) {
          const unit = property.propertyUnits.find(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (u: any) => u.unitTypeCode === roomCategory
          )
          if (unit && unit.pricing?.price) {
            basePrice = parseFloat(unit.pricing.price)
          }
        }

        // Calculate price for each day using dynamic pricing rules
        const daysInRange = eachDayOfInterval({ start: checkIn, end: checkOut })
        let calculatedPrice = basePrice

        // Apply seasonal rules if they exist
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const seasonalRules = (property.dynamicPricing as any)?.seasonalPricing?.rules
        if (seasonalRules && Array.isArray(seasonalRules)) {
          daysInRange.forEach((day) => {
            const dayStr = format(day, 'yyyy-MM-dd')

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            seasonalRules.forEach((rule: any) => {
              if (
                rule.isActive &&
                dayStr >= format(new Date(rule.startDate), 'yyyy-MM-dd') &&
                dayStr <= format(new Date(rule.endDate), 'yyyy-MM-dd')
              ) {
                calculatedPrice *= rule.multiplier
              }
            })
          })
        }

        // Check for custom prices
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const customPrices = (property.dynamicPricing as any)?.directPricing?.customPrices
        if (customPrices && Array.isArray(customPrices)) {
          daysInRange.forEach((day) => {
            const dayStr = format(day, 'yyyy-MM-dd')

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const customPrice = customPrices.find((cp: any) =>
              cp.isActive &&
              dayStr >= format(new Date(cp.startDate), 'yyyy-MM-dd') &&
              dayStr <= format(new Date(cp.endDate), 'yyyy-MM-dd')
            )

            if (customPrice) {
              calculatedPrice = customPrice.price
            }
          })
        }

        // Create a virtual pricing entry
        pricingData = [
          {
            roomCategory: roomCategory || 'standard',
            planType: planType || 'EP',
            occupancyType: occupancyType || 'DOUBLE',
            price: Math.round(calculatedPrice),
            startDate: checkIn,
            endDate: checkOut,
            seasonType: 'dynamic',
            isActive: true,
          },
        ]
      }
    }

    // Get plan type definitions
    const planTypes = await PlanType.find({ isActive: true }).sort({
      sortOrder: 1,
    })

    // Group by room category and plan/occupancy combinations
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const groupedPricing: GroupedPricing = pricingData.reduce((acc: GroupedPricing, pricing: any) => {
      const key = `${pricing.roomCategory}_${pricing.planType}_${pricing.occupancyType}`

      if (!acc[key]) {
        acc[key] = {
          roomCategory: pricing.roomCategory,
          planType: pricing.planType,
          occupancyType: pricing.occupancyType,
          prices: [],
          lowestPrice: Infinity,
          highestPrice: 0,
          seasonTypes: new Set<string>(),
        }
      }

      acc[key].prices.push({
        price: pricing.price,
        startDate: pricing.startDate,
        endDate: pricing.endDate,
        seasonType: pricing.seasonType,
      })

      acc[key].lowestPrice = Math.min(acc[key].lowestPrice, pricing.price)
      acc[key].highestPrice = Math.max(acc[key].highestPrice, pricing.price)

      if (pricing.seasonType) {
        acc[key].seasonTypes.add(pricing.seasonType)
      }

      return acc
    }, {})

    // Convert to array and add plan details
    const pricingOptions = Object.values(groupedPricing).map((option: PricingOption) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const planDetails = planTypes.find((plan: any) => plan.code === option.planType)

      return {
        ...option,
        seasonTypes: Array.from(option.seasonTypes),
        planDetails: planDetails
          ? {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              name: (planDetails as any).name,
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              description: (planDetails as any).description,
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              inclusions: (planDetails as any).inclusions,
            }
          : null,
        totalPrice: option.lowestPrice,
        pricePerNight: option.lowestPrice,
      }
    })

    // Find absolute lowest prices by room category
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const roomCategoryMinPrices: Record<string, number> = pricingOptions.reduce((acc: any, option) => {
      if (
        !acc[option.roomCategory] ||
        option.lowestPrice < acc[option.roomCategory]
      ) {
        acc[option.roomCategory] = option.lowestPrice
      }
      return acc
    }, {})

    // Convert Set to Array for room categories
    const roomCategoriesArray = Array.from(
      new Set(pricingOptions.map((opt) => opt.roomCategory))
    )

    return NextResponse.json({
      success: true,
      checkInDate,
      checkOutDate,
      pricingOptions,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      planTypes: planTypes.map((plan: any) => ({
        code: plan.code,
        name: plan.name,
        description: plan.description,
        inclusions: plan.inclusions,
      })),
      roomCategoryMinPrices,
      summary: {
        totalOptions: pricingOptions.length,
        roomCategories: roomCategoriesArray,
        priceRange: {
          min: Math.min(...pricingOptions.map((opt) => opt.lowestPrice)),
          max: Math.max(...pricingOptions.map((opt) => opt.highestPrice)),
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
