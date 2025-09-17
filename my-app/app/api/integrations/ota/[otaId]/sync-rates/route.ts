import { NextRequest, NextResponse } from "next/server"

export async function POST(
  request: NextRequest,
  { params }: { params: { otaId: string } }
) {
  try {
    const { otaId } = params
    const body = await request.json()
    const { propertyId, ruleId, dynamicPricing } = body

    console.log(`🔄 [OTA Sync] Syncing rates for ${otaId} - Property: ${propertyId}, Rule: ${ruleId}`)

    // Validate required parameters
    if (!propertyId || !ruleId) {
      return NextResponse.json(
        { error: "Missing required parameters: propertyId, ruleId" },
        { status: 400 }
      )
    }

    // Simulate OTA-specific rate sync logic
    const otaConfigs = {
      booking: {
        name: "Booking.com",
        endpoint: "https://api.booking.com/rates",
        apiKey: process.env.BOOKING_API_KEY
      },
      expedia: {
        name: "Expedia",
        endpoint: "https://api.expedia.com/rates",
        apiKey: process.env.EXPEDIA_API_KEY
      },
      airbnb: {
        name: "Airbnb",
        endpoint: "https://api.airbnb.com/rates",
        apiKey: process.env.AIRBNB_API_KEY
      },
      agoda: {
        name: "Agoda",
        endpoint: "https://api.agoda.com/rates",
        apiKey: process.env.AGODA_API_KEY
      },
      makemytrip: {
        name: "MakeMyTrip",
        endpoint: "https://api.makemytrip.com/rates",
        apiKey: process.env.MAKEMYTRIP_API_KEY
      }
    }

    const otaConfig = otaConfigs[otaId as keyof typeof otaConfigs]

    if (!otaConfig) {
      return NextResponse.json(
        { error: `Unsupported OTA: ${otaId}` },
        { status: 400 }
      )
    }

    // Calculate adjusted price with dynamic pricing
    let adjustedPrice = dynamicPricing?.basePrice || 0

    if (dynamicPricing?.enabled) {
      // Apply demand multiplier
      adjustedPrice *= dynamicPricing.demandMultiplier || 1

      // Apply occupancy-based pricing
      if (dynamicPricing.occupancyThreshold && dynamicPricing.occupancyThreshold > 80) {
        adjustedPrice *= 1.15 // 15% increase for high occupancy
      }

      // Apply weekend multiplier (mock weekend detection)
      const isWeekend = new Date().getDay() === 0 || new Date().getDay() === 6
      if (isWeekend) {
        adjustedPrice *= dynamicPricing.weekendMultiplier || 1
      }

      // Ensure price is within bounds
      adjustedPrice = Math.max(
        dynamicPricing.minPrice || 0,
        Math.min(adjustedPrice, dynamicPricing.maxPrice || adjustedPrice)
      )
    }

    // Prepare sync data
    const syncData = {
      propertyId,
      ruleId,
      otaId,
      basePrice: dynamicPricing?.basePrice || 0,
      adjustedPrice: Math.round(adjustedPrice),
      currency: "INR",
      effectiveDate: new Date().toISOString(),
      dynamicPricing: dynamicPricing?.enabled || false,
      syncTimestamp: new Date().toISOString()
    }

    // In a real implementation, this would make actual API calls to the OTA
    console.log(`📤 [${otaConfig.name}] Syncing rate data:`, syncData)

    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000))

    // Mock successful response
    const response = {
      success: true,
      otaId,
      otaName: otaConfig.name,
      propertyId,
      ruleId,
      syncedAt: new Date().toISOString(),
      priceSync: {
        basePrice: syncData.basePrice,
        adjustedPrice: syncData.adjustedPrice,
        currency: syncData.currency,
        dynamicPricingApplied: syncData.dynamicPricing
      },
      message: `Rates successfully synced with ${otaConfig.name}`
    }

    console.log(`✅ [${otaConfig.name}] Rate sync completed successfully`)

    return NextResponse.json(response)

  } catch (error) {
    console.error(`❌ [OTA Sync] Error syncing rates for ${params.otaId}:`, error)

    return NextResponse.json(
      {
        error: "Failed to sync rates with OTA",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    )
  }
}