import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import PropertyPricing from '@/models/PropertyPricing'
import Property from '@/models/Property'

// GET: Fetch plan-based pricing for a property
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectToDatabase()
    const { id } = params

    // Get property to fetch room categories
    const property = await Property.findById(id).select('propertyUnits price')
    if (!property) {
      return NextResponse.json(
        { error: 'Property not found' },
        { status: 404 }
      )
    }

    // Get all plan-based pricing entries for this property
    const pricingEntries = await PropertyPricing.find({
      propertyId: id,
      pricingType: { $in: ['PLAN_BASED', 'BASE'] },
      isActive: true,
    }).sort({ roomCategory: 1, planType: 1, occupancyType: 1 })

    // Extract room categories from propertyUnits
    const roomCategories =
      property.propertyUnits?.map((unit: any) => ({
        code: unit.unitTypeCode,
        name: unit.unitTypeName,
        basePrice: parseFloat(unit.pricing?.price) || property.price?.base || 0,
      })) || []

    return NextResponse.json({
      success: true,
      pricingEntries,
      roomCategories,
      basePrice: property.price?.base || 0,
    })
  } catch (error) {
    console.error('Error fetching plan pricing:', error)
    return NextResponse.json(
      {
        error: 'Server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

// POST: Create or update plan-based pricing
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectToDatabase()
    const { id } = params
    const body = await req.json()

    const {
      roomCategory,
      planType,
      occupancyType,
      price,
      pricingType = 'PLAN_BASED',
      startDate,
      endDate,
      seasonType,
      reason,
    } = body

    // Validate required fields
    if (!roomCategory || !planType || !occupancyType || !price) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Check if property exists
    const property = await Property.findById(id)
    if (!property) {
      return NextResponse.json(
        { error: 'Property not found' },
        { status: 404 }
      )
    }

    // Set default dates for BASE pricing (1 year range)
    const defaultStartDate = startDate || new Date()
    const defaultEndDate =
      endDate || new Date(new Date().setFullYear(new Date().getFullYear() + 1))

    // Check if entry already exists
    const existingEntry = await PropertyPricing.findOne({
      propertyId: id,
      roomCategory,
      planType,
      occupancyType,
      pricingType,
      isActive: true,
    })

    let result
    if (existingEntry) {
      // Update existing entry
      existingEntry.price = price
      existingEntry.startDate = defaultStartDate
      existingEntry.endDate = defaultEndDate
      if (seasonType) existingEntry.seasonType = seasonType
      if (reason) existingEntry.reason = reason
      result = await existingEntry.save()
    } else {
      // Create new entry
      result = await PropertyPricing.create({
        propertyId: id,
        roomCategory,
        planType,
        occupancyType,
        pricingType,
        price,
        startDate: defaultStartDate,
        endDate: defaultEndDate,
        seasonType,
        reason,
        isActive: true,
      })
    }

    return NextResponse.json({
      success: true,
      message: existingEntry
        ? 'Pricing updated successfully'
        : 'Pricing created successfully',
      pricing: result,
    })
  } catch (error) {
    console.error('Error saving plan pricing:', error)
    return NextResponse.json(
      {
        error: 'Server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

// PUT: Bulk update plan-based pricing
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectToDatabase()
    const { id } = params
    const body = await req.json()
    const { pricingEntries } = body

    if (!Array.isArray(pricingEntries)) {
      return NextResponse.json(
        { error: 'pricingEntries must be an array' },
        { status: 400 }
      )
    }

    // Check if property exists
    const property = await Property.findById(id)
    if (!property) {
      return NextResponse.json(
        { error: 'Property not found' },
        { status: 404 }
      )
    }

    const results = []
    const errors = []

    for (const entry of pricingEntries) {
      try {
        const {
          roomCategory,
          planType,
          occupancyType,
          price,
          pricingType = 'PLAN_BASED',
          startDate,
          endDate,
          seasonType,
          reason,
          isAvailable = true, // NEW: Accept availability from frontend
        } = entry

        if (!roomCategory || !planType || !occupancyType || !price) {
          errors.push({ entry, error: 'Missing required fields' })
          continue
        }

        const defaultStartDate = startDate || new Date()
        const defaultEndDate =
          endDate ||
          new Date(new Date().setFullYear(new Date().getFullYear() + 1))

        // Upsert: Update if exists, create if doesn't
        const result = await PropertyPricing.findOneAndUpdate(
          {
            propertyId: id,
            roomCategory,
            planType,
            occupancyType,
            pricingType,
          },
          {
            price,
            startDate: defaultStartDate,
            endDate: defaultEndDate,
            seasonType,
            reason,
            isActive: true,
            isAvailable, // NEW: Save availability status
          },
          {
            upsert: true,
            new: true,
            runValidators: true,
          }
        )

        results.push(result)
      } catch (error) {
        errors.push({
          entry,
          error: error instanceof Error ? error.message : 'Unknown error',
        })
      }
    }

    return NextResponse.json({
      success: true,
      message: `Processed ${pricingEntries.length} entries`,
      results,
      errors: errors.length > 0 ? errors : undefined,
      summary: {
        total: pricingEntries.length,
        successful: results.length,
        failed: errors.length,
      },
    })
  } catch (error) {
    console.error('Error bulk updating plan pricing:', error)
    return NextResponse.json(
      {
        error: 'Server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

// DELETE: Remove pricing entries
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectToDatabase()
    const { id } = params
    const { searchParams } = new URL(req.url)

    const roomCategory = searchParams.get('roomCategory')
    const planType = searchParams.get('planType')
    const occupancyType = searchParams.get('occupancyType')
    const pricingType = searchParams.get('pricingType')

    const query: any = { propertyId: id }
    if (roomCategory) query.roomCategory = roomCategory
    if (planType) query.planType = planType
    if (occupancyType) query.occupancyType = occupancyType
    if (pricingType) query.pricingType = pricingType

    // Soft delete by setting isActive to false
    const result = await PropertyPricing.updateMany(query, {
      isActive: false,
    })

    return NextResponse.json({
      success: true,
      message: 'Pricing entries deleted successfully',
      deletedCount: result.modifiedCount,
    })
  } catch (error) {
    console.error('Error deleting plan pricing:', error)
    return NextResponse.json(
      {
        error: 'Server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
