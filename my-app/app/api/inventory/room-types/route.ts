import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import dbConnect from '@/lib/db/dbConnect'
import Property from '@/models/Property'
import RoomType from '@/models/RoomType'

export const dynamic = 'force-dynamic'

// GET: Room Types for Property
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

    console.log(`🏨 [Room Types] Loading data for property ${propertyId}`)

    // Verify property exists
    const property = await Property.findById(propertyId).lean()
    if (!property) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 })
    }

    // Fetch real room types from RoomType collection
    const roomTypeDocs = await RoomType.find({ propertyId, isActive: true }).sort({ displayOrder: 1, category: 1 }).lean()

    // Map to lightweight shape expected by frontend
    const roomTypes = roomTypeDocs.map((rt: any) => ({
      id: rt._id?.toString(),
      name: rt.name,
      basePrice: rt.basePrice?.perNight ?? 0,
      maxOccupancy: rt.maxOccupancy?.total ?? 0,
      amenities: rt.amenities || [],
      description: rt.description || '',
      isActive: !!rt.isActive,
      unitTypeCode: rt.code,
      count: rt.inventory?.totalRooms ?? 0,
      pricing: { price: String(rt.basePrice?.perNight ?? 0) },
      roomNumbers: [] as any[],
    }))

    console.log(`✅ [Room Types] Returned ${roomTypes.length} room types for property ${propertyId}`)

    return NextResponse.json({
      success: true,
      roomTypes,
      property: {
        id: propertyId,
        name: property.title || property.name,
        totalRoomTypes: roomTypes.length,
      },
      timestamp: new Date().toISOString(),
    })
  } catch (error: any) {
    console.error('💥 [Room Types] Error:', error)
    return NextResponse.json({
      error: 'Failed to load room types',
      details: error.message
    }, { status: 500 })
  }
}

// POST: Create New Room Type
export async function POST(request: NextRequest) {
  try {
    await dbConnect()

    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { propertyId, name, basePrice, maxOccupancy, amenities, description } = body

    if (!propertyId || !name || !basePrice) {
      return NextResponse.json({
        error: 'Property ID, name, and base price are required'
      }, { status: 400 })
    }

    console.log(`🏨 [Room Types] Creating room type ${name} for property ${propertyId}`)

    // Verify property exists
    const property = await Property.findById(propertyId)
    if (!property) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 })
    }

    // Check if room type name already exists
    const existingType = await RoomType.findOne({ propertyId, name })
    if (existingType) {
      return NextResponse.json({
        error: 'A room type with this name already exists'
      }, { status: 400 })
    }

    // Create room type
    const roomTypeData = {
      propertyId,
      name,
      code: name.substring(0, 3).toUpperCase(),
      description: description || '',
      category: 'standard',
      maxOccupancy: {
        adults: maxOccupancy || 2,
        children: 0,
        total: maxOccupancy || 2,
      },
      bedConfiguration: {
        singleBeds: 0,
        doubleBeds: 1,
        queenBeds: 0,
        kingBeds: 0,
        sofaBeds: 0,
        bunkBeds: 0,
        totalBeds: 1,
      },
      roomSize: { area: 200, unit: 'sqft' },
      basePrice: {
        perNight: basePrice,
        perWeek: basePrice * 7,
        perMonth: basePrice * 30,
        currency: 'INR',
      },
      amenities: amenities || {},
      views: [],
      floorPreference: [],
      accessibility: {},
      policies: { smokingAllowed: false, petsAllowed: false, maxAdditionalGuests: 0 },
      images: [],
      seasonalPricing: [],
      promotionalOffers: [],
      inventory: { totalRooms: 0, availableRooms: 0, maintenanceRooms: 0, bookedRooms: 0 },
      housekeeping: { cleaningTime: 30, supplies: [] },
      isActive: true,
      isBookable: true,
      displayOrder: 0,
      createdBy: session.user.id,
      lastModifiedBy: session.user.id,
    } as any

    const newRoomType = await RoomType.create(roomTypeData)

    console.log(`✅ [Room Types] Created room type ${name} successfully`)

    return NextResponse.json({
      success: true,
      roomType: {
        id: newRoomType._id.toString(),
        name: newRoomType.name,
        basePrice: newRoomType.basePrice.perNight,
        unitTypeCode: newRoomType.code,
        maxOccupancy: newRoomType.maxOccupancy.total,
      }
    })
  } catch (error: any) {
    console.error('💥 [Room Types] Error creating:', error)
    return NextResponse.json({
      error: 'Failed to create room type',
      details: error.message
    }, { status: 500 })
  }
}