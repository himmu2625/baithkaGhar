import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import PropertyPricing from '@/models/PropertyPricing'
import Property from '@/models/Property'
import { parseISO } from 'date-fns'

// GET: Fetch direct pricing entries for a property
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectToDatabase()
    const { id } = params

    // Check if property exists
    const property = await Property.findById(id)
    if (!property) {
      return NextResponse.json(
        { error: 'Property not found' },
        { status: 404 }
      )
    }

    // Get all direct pricing entries
    const directPricing = await PropertyPricing.find({
      propertyId: id,
      pricingType: 'DIRECT',
      isActive: true,
    }).sort({ startDate: 1 })

    return NextResponse.json({
      success: true,
      directPricing,
    })
  } catch (error) {
    console.error('Error fetching direct pricing:', error)
    return NextResponse.json(
      {
        error: 'Server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

// POST: Create a new direct pricing entry
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
      startDate,
      endDate,
      price,
      reason,
    } = body

    // Validate required fields
    if (
      !roomCategory ||
      !planType ||
      !occupancyType ||
      !startDate ||
      !endDate ||
      !price
    ) {
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

    // Parse dates
    const start = parseISO(startDate)
    const end = parseISO(endDate)

    if (end <= start) {
      return NextResponse.json(
        { error: 'End date must be after start date' },
        { status: 400 }
      )
    }

    // Create direct pricing entry
    const directPricing = await PropertyPricing.create({
      propertyId: id,
      roomCategory,
      planType,
      occupancyType,
      pricingType: 'DIRECT',
      startDate: start,
      endDate: end,
      price,
      reason: reason || 'Custom pricing',
      isActive: true,
    })

    return NextResponse.json({
      success: true,
      message: 'Direct pricing created successfully',
      directPricing,
    })
  } catch (error) {
    console.error('Error creating direct pricing:', error)
    return NextResponse.json(
      {
        error: 'Server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

// PUT: Update a direct pricing entry
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectToDatabase()
    const { id } = params
    const body = await req.json()

    const { pricingId, price, startDate, endDate, reason } = body

    if (!pricingId) {
      return NextResponse.json(
        { error: 'Pricing ID is required' },
        { status: 400 }
      )
    }

    // Find and update the pricing entry
    const pricing = await PropertyPricing.findOne({
      _id: pricingId,
      propertyId: id,
      pricingType: 'DIRECT',
    })

    if (!pricing) {
      return NextResponse.json(
        { error: 'Direct pricing entry not found' },
        { status: 404 }
      )
    }

    if (price !== undefined) pricing.price = price
    if (startDate) pricing.startDate = parseISO(startDate)
    if (endDate) pricing.endDate = parseISO(endDate)
    if (reason !== undefined) pricing.reason = reason

    await pricing.save()

    return NextResponse.json({
      success: true,
      message: 'Direct pricing updated successfully',
      pricing,
    })
  } catch (error) {
    console.error('Error updating direct pricing:', error)
    return NextResponse.json(
      {
        error: 'Server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

// DELETE: Remove a direct pricing entry
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectToDatabase()
    const { id } = params
    const { searchParams } = new URL(req.url)
    const pricingId = searchParams.get('pricingId')

    if (!pricingId) {
      return NextResponse.json(
        { error: 'Pricing ID is required' },
        { status: 400 }
      )
    }

    // Soft delete by setting isActive to false
    const result = await PropertyPricing.findOneAndUpdate(
      {
        _id: pricingId,
        propertyId: id,
        pricingType: 'DIRECT',
      },
      { isActive: false },
      { new: true }
    )

    if (!result) {
      return NextResponse.json(
        { error: 'Direct pricing entry not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Direct pricing deleted successfully',
    })
  } catch (error) {
    console.error('Error deleting direct pricing:', error)
    return NextResponse.json(
      {
        error: 'Server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
