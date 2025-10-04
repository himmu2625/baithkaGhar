import { NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/db/dbConnect"
import Property from "@/models/Property"
import { withCache, cacheKeys } from "@/lib/cache"

const getHandler = async (
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    await dbConnect()

    // Await params in Next.js 15
    const { id } = await params

    const { searchParams } = new URL(req.url)
    const category = searchParams.get("category")

    if (!category) {
      return NextResponse.json(
        { success: false, error: "Category parameter is required" },
        { status: 400 }
      )
    }

    const property = await Property.findById(id).select("propertyUnits").lean()

    if (!property) {
      return NextResponse.json(
        { success: false, error: "Property not found" },
        { status: 404 }
      )
    }

    // Find the selected category unit
    const selectedUnit = property.propertyUnits?.find(
      (unit: any) => unit.unitTypeCode === category || unit.unitTypeName === category
    )

    if (!selectedUnit) {
      return NextResponse.json(
        { success: false, error: "Category not found" },
        { status: 404 }
      )
    }

    // Extract plan-based pricing if available
    const pricingMatrix = selectedUnit.planBasedPricing || []

    if (pricingMatrix.length === 0) {
      // Fallback: create basic pricing from legacy price
      const basePrice = selectedUnit.pricing?.price ? parseFloat(selectedUnit.pricing.price) : 0

      if (basePrice > 0) {
        // Create a basic matrix with EP plan and DOUBLE occupancy
        return NextResponse.json({
          success: true,
          pricingMatrix: [
            { planType: "EP", occupancyType: "DOUBLE", price: basePrice }
          ]
        })
      }

      return NextResponse.json({
        success: true,
        pricingMatrix: []
      })
    }

    // Return the pricing matrix with cache headers
    const response = NextResponse.json({
      success: true,
      pricingMatrix: pricingMatrix.map((pricing: any) => ({
        planType: pricing.planType,
        occupancyType: pricing.occupancyType,
        price: pricing.price
      }))
    })
    response.headers.set('Cache-Control', 'public, s-maxage=600, stale-while-revalidate=1200')

    return response

  } catch (error) {
    console.error("[API/pricing-matrix] Error:", error)
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    )
  }
}

export const GET = withCache(
  getHandler,
  {
    keyGenerator: async (req, context) => {
      const params = (context as any)?.params
      if (!params) {
        // Fallback for when params is not available
        const url = new URL(req.url)
        const category = url.searchParams.get('category') || ''
        return `pricing:matrix:unknown:${category}`
      }
      const { id } = await params
      const url = new URL(req.url)
      const category = url.searchParams.get('category') || ''
      return cacheKeys.pricing.matrix(id, category)
    },
    ttl: 600, // 10 minutes cache
  }
)
