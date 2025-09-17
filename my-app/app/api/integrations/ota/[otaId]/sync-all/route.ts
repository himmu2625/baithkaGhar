import { NextRequest, NextResponse } from "next/server"

export async function POST(
  request: NextRequest,
  { params }: { params: { otaId: string } }
) {
  try {
    const { otaId } = params
    const body = await request.json()
    const { propertyId, rateRules, roomTypes } = body

    console.log(`🔄 [OTA Sync All] Starting complete sync for ${otaId} - Property: ${propertyId}`)

    // Validate required parameters
    if (!propertyId) {
      return NextResponse.json(
        { error: "Missing required parameter: propertyId" },
        { status: 400 }
      )
    }

    // OTA configuration
    const otaConfigs = {
      booking: {
        name: "Booking.com",
        endpoint: "https://api.booking.com/sync",
        apiKey: process.env.BOOKING_API_KEY,
        features: ["rates", "inventory", "availability", "policies"]
      },
      expedia: {
        name: "Expedia",
        endpoint: "https://api.expedia.com/sync",
        apiKey: process.env.EXPEDIA_API_KEY,
        features: ["rates", "inventory", "availability", "policies"]
      },
      airbnb: {
        name: "Airbnb",
        endpoint: "https://api.airbnb.com/sync",
        apiKey: process.env.AIRBNB_API_KEY,
        features: ["rates", "availability", "house_rules"]
      },
      agoda: {
        name: "Agoda",
        endpoint: "https://api.agoda.com/sync",
        apiKey: process.env.AGODA_API_KEY,
        features: ["rates", "inventory", "availability"]
      },
      makemytrip: {
        name: "MakeMyTrip",
        endpoint: "https://api.makemytrip.com/sync",
        apiKey: process.env.MAKEMYTRIP_API_KEY,
        features: ["rates", "inventory", "availability"]
      }
    }

    const otaConfig = otaConfigs[otaId as keyof typeof otaConfigs]

    if (!otaConfig) {
      return NextResponse.json(
        { error: `Unsupported OTA: ${otaId}` },
        { status: 400 }
      )
    }

    // Prepare sync data
    const syncResults = {
      propertyId,
      otaId,
      otaName: otaConfig.name,
      syncStarted: new Date().toISOString(),
      syncData: {
        rates: {
          total: rateRules?.length || 0,
          synced: 0,
          failed: 0,
          rules: []
        },
        roomTypes: {
          total: roomTypes?.length || 0,
          synced: 0,
          failed: 0,
          types: []
        },
        availability: {
          synced: true,
          periods: 365 // days ahead
        },
        policies: {
          synced: true,
          features: otaConfig.features
        }
      }
    }

    // Sync Rate Rules
    if (rateRules && Array.isArray(rateRules)) {
      console.log(`📊 [${otaConfig.name}] Syncing ${rateRules.length} rate rules`)

      for (const rule of rateRules) {
        try {
          // Simulate syncing each rate rule
          await new Promise(resolve => setTimeout(resolve, 200))

          const ruleSync = {
            ruleId: rule._id,
            name: rule.name,
            basePrice: rule.basePrice,
            currency: rule.currency || "INR",
            validFrom: rule.validFrom,
            validTo: rule.validTo,
            isActive: rule.isActive,
            syncStatus: "success"
          }

          syncResults.syncData.rates.rules.push(ruleSync)
          syncResults.syncData.rates.synced++

          console.log(`✅ [${otaConfig.name}] Synced rate rule: ${rule.name}`)
        } catch (error) {
          console.error(`❌ [${otaConfig.name}] Failed to sync rate rule: ${rule.name}`, error)
          syncResults.syncData.rates.failed++
        }
      }
    }

    // Sync Room Types
    if (roomTypes && Array.isArray(roomTypes)) {
      console.log(`🏠 [${otaConfig.name}] Syncing ${roomTypes.length} room types`)

      for (const roomType of roomTypes) {
        try {
          // Simulate syncing each room type
          await new Promise(resolve => setTimeout(resolve, 200))

          const roomTypeSync = {
            roomTypeId: roomType.id,
            name: roomType.name,
            description: roomType.description,
            basePrice: roomType.basePrice,
            maxGuests: roomType.maxGuests,
            count: roomType.count,
            syncStatus: "success"
          }

          syncResults.syncData.roomTypes.types.push(roomTypeSync)
          syncResults.syncData.roomTypes.synced++

          console.log(`✅ [${otaConfig.name}] Synced room type: ${roomType.name}`)
        } catch (error) {
          console.error(`❌ [${otaConfig.name}] Failed to sync room type: ${roomType.name}`, error)
          syncResults.syncData.roomTypes.failed++
        }
      }
    }

    // Finalize sync results
    syncResults.syncData.availability.syncStatus = "success"
    syncResults.syncData.policies.syncStatus = "success"

    const syncCompleted = new Date().toISOString()
    const syncDuration = new Date(syncCompleted).getTime() - new Date(syncResults.syncStarted).getTime()

    const response = {
      success: true,
      ...syncResults,
      syncCompleted,
      syncDuration: `${syncDuration}ms`,
      summary: {
        totalItems: (syncResults.syncData.rates.total + syncResults.syncData.roomTypes.total + 2), // +2 for availability and policies
        successfulItems: (syncResults.syncData.rates.synced + syncResults.syncData.roomTypes.synced + 2),
        failedItems: (syncResults.syncData.rates.failed + syncResults.syncData.roomTypes.failed),
        successRate: `${Math.round(((syncResults.syncData.rates.synced + syncResults.syncData.roomTypes.synced + 2) / (syncResults.syncData.rates.total + syncResults.syncData.roomTypes.total + 2)) * 100)}%`
      },
      message: `Complete sync with ${otaConfig.name} completed successfully`
    }

    console.log(`✅ [${otaConfig.name}] Complete sync finished - Success Rate: ${response.summary.successRate}`)

    return NextResponse.json(response)

  } catch (error) {
    console.error(`❌ [OTA Sync All] Error during complete sync for ${params.otaId}:`, error)

    return NextResponse.json(
      {
        error: "Failed to complete sync with OTA",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    )
  }
}