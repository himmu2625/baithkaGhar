import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import dbConnect from '@/lib/db/dbConnect'
import Property from '@/models/Property'

export const dynamic = 'force-dynamic'

// GET: Rate Rules for Property
export async function GET(request: NextRequest) {
  try {
    await dbConnect()

    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const propertyId = searchParams.get('propertyId')

    if (!propertyId) {
      return NextResponse.json({ error: 'Property ID is required' }, { status: 400 })
    }

    console.log(`🏨 [Rate Rules] Loading data for property ${propertyId}`)

    // Get property info with dynamic pricing
    const property = await Property.findById(propertyId).select('dynamicPricing price propertyUnits')
    if (!property) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 })
    }

    // Extract rate rules from property's dynamic pricing and property units
    const rateRules = []
    const dynamicPricing = property.dynamicPricing || {}

    // Add base rate rules from property units
    if (property.propertyUnits && Array.isArray(property.propertyUnits)) {
      property.propertyUnits.forEach((unit: any, index: number) => {
        rateRules.push({
          _id: `base-rate-${index}`,
          name: `${unit.unitTypeName || 'Standard'} Base Rate`,
          ruleType: 'base_rate',
          roomTypeIds: [unit.unitTypeCode || `unit-${index}`],
          roomTypeName: unit.unitTypeName || 'Standard Room',
          basePrice: parseFloat(unit.pricing?.price) || 0,
          currency: 'INR',
          isActive: true,
          priority: 1,
          validFrom: new Date().toISOString(),
          validTo: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
          description: `Base rate for ${unit.unitTypeName || 'Standard Room'}`,
          conditions: {
            minStay: 1,
            maxStay: 30,
            advanceBooking: 0
          }
        })
      })
    }

    // Add seasonal pricing rules if they exist
    if (dynamicPricing.seasonalPricing?.enabled && dynamicPricing.seasonalPricing?.rules) {
      dynamicPricing.seasonalPricing.rules.forEach((rule: any, index: number) => {
        rateRules.push({
          _id: `seasonal-${index}`,
          name: rule.name || `Seasonal Rate ${index + 1}`,
          ruleType: 'seasonal',
          roomTypeIds: rule.roomTypes || [],
          basePrice: rule.basePrice || 0,
          multiplier: rule.multiplier || 1,
          adjustment: rule.adjustment || 0,
          currency: 'INR',
          isActive: rule.isActive !== false,
          priority: 2,
          validFrom: rule.startDate,
          validTo: rule.endDate,
          description: rule.description || 'Seasonal pricing adjustment',
          conditions: {
            minStay: rule.minStay || 1,
            maxStay: rule.maxStay || 30,
            advanceBooking: rule.advanceBooking || 0
          }
        })
      })
    }

    // Add demand-based pricing rules
    if (dynamicPricing.demandBased?.enabled) {
      const demandRule = dynamicPricing.demandBased
      rateRules.push({
        _id: 'demand-based',
        name: 'Demand-Based Pricing',
        ruleType: 'demand_based',
        roomTypeIds: [],
        basePrice: 0,
        multiplier: demandRule.multiplier || 1.2,
        currency: 'INR',
        isActive: demandRule.enabled,
        priority: 3,
        validFrom: new Date().toISOString(),
        validTo: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        description: 'Dynamic pricing based on demand and occupancy',
        conditions: {
          occupancyThreshold: demandRule.occupancyThreshold || 80,
          maxIncrease: demandRule.maxIncrease || 50
        }
      })
    }

    // Add custom pricing rules if they exist
    if (dynamicPricing.directPricing?.enabled && dynamicPricing.directPricing?.customPrices) {
      dynamicPricing.directPricing.customPrices.forEach((customPrice: any, index: number) => {
        rateRules.push({
          _id: `custom-${index}`,
          name: customPrice.name || `Custom Rate ${index + 1}`,
          ruleType: 'custom_rate',
          roomTypeIds: customPrice.roomTypes || [],
          basePrice: customPrice.price || 0,
          currency: 'INR',
          isActive: customPrice.isActive !== false,
          priority: 4,
          validFrom: customPrice.startDate,
          validTo: customPrice.endDate,
          description: customPrice.description || 'Custom pricing rule',
          conditions: {
            minStay: customPrice.minStay || 1,
            maxStay: customPrice.maxStay || 30
          }
        })
      })
    }

    console.log(`✅ [Rate Rules] Generated ${rateRules.length} rate rules from dynamic pricing for property ${propertyId}`)

    return NextResponse.json({
      success: true,
      rateRules: rateRules,
      property: {
        id: propertyId,
        name: property.name
      },
      timestamp: new Date().toISOString()
    })

  } catch (error: any) {
    console.error('💥 [Rate Rules] Error:', error)
    return NextResponse.json({
      error: 'Failed to load rate rules',
      details: error.message
    }, { status: 500 })
  }
}

// POST: Create or Update Rate Rule
export async function POST(request: NextRequest) {
  try {
    await dbConnect()

    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const propertyId = searchParams.get('propertyId')
    const body = await request.json()

    if (!propertyId) {
      return NextResponse.json({ error: 'Property ID is required' }, { status: 400 })
    }

    console.log(`🏨 [Rate Rules] Creating/updating rate rule for property ${propertyId}`)

    // Get property
    const property = await Property.findById(propertyId)
    if (!property) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 })
    }

    // Initialize dynamic pricing if not exists
    if (!property.dynamicPricing) {
      property.dynamicPricing = {}
    }

    const { ruleType, name, basePrice, multiplier, validFrom, validTo, roomTypeIds, conditions, isActive } = body

    // Handle different rule types
    switch (ruleType) {
      case 'seasonal':
        if (!property.dynamicPricing.seasonalPricing) {
          property.dynamicPricing.seasonalPricing = { enabled: true, rules: [] }
        }
        property.dynamicPricing.seasonalPricing.rules.push({
          name,
          basePrice,
          multiplier: multiplier || 1,
          startDate: validFrom,
          endDate: validTo,
          roomTypes: roomTypeIds || [],
          isActive: isActive !== false,
          minStay: conditions?.minStay || 1,
          maxStay: conditions?.maxStay || 30,
          description: body.description || ''
        })
        break

      case 'custom_rate':
        if (!property.dynamicPricing.directPricing) {
          property.dynamicPricing.directPricing = { enabled: true, customPrices: [] }
        }
        property.dynamicPricing.directPricing.customPrices.push({
          name,
          price: basePrice,
          startDate: validFrom,
          endDate: validTo,
          roomTypes: roomTypeIds || [],
          isActive: isActive !== false,
          minStay: conditions?.minStay || 1,
          maxStay: conditions?.maxStay || 30,
          description: body.description || ''
        })
        break

      case 'demand_based':
        property.dynamicPricing.demandBased = {
          enabled: isActive !== false,
          multiplier: multiplier || 1.2,
          occupancyThreshold: conditions?.occupancyThreshold || 80,
          maxIncrease: conditions?.maxIncrease || 50
        }
        break

      default:
        return NextResponse.json({ error: 'Unsupported rule type' }, { status: 400 })
    }

    // Save the updated property
    await property.save()

    console.log(`✅ [Rate Rules] Successfully created ${ruleType} rule for property ${propertyId}`)

    return NextResponse.json({
      success: true,
      message: 'Rate rule created successfully',
      ruleType,
      timestamp: new Date().toISOString()
    })

  } catch (error: any) {
    console.error('💥 [Rate Rules] Error creating rule:', error)
    return NextResponse.json({
      error: 'Failed to create rate rule',
      details: error.message
    }, { status: 500 })
  }
}

