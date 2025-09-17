import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import dbConnect from '@/lib/db/dbConnect'
import Property from '@/models/Property'
import Booking from '@/models/Booking'

export const dynamic = 'force-dynamic'

// GET: Room Management Data
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

    console.log(`🏨 [Room Management] Loading data for property ${propertyId}`)

    // Get property info with room units
    const property = await Property.findById(propertyId).lean()
    if (!property) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 })
    }

    // Get current bookings to determine room status
    const today = new Date()
    const currentBookings = await Booking.find({
      propertyId,
      dateFrom: { $lte: today },
      dateTo: { $gte: today },
      status: { $in: ['confirmed', 'checked_in'] }
    }).lean()

    // Extract room data from propertyUnits and create individual rooms
    const propertyUnits = property.propertyUnits || []
    const transformedRooms: any[] = []

    propertyUnits.forEach((unit, unitIndex) => {
      const unitCount = unit.count || 0
      const basePrice = parseInt(unit.pricing?.price || '0') || 0

      // If room numbers are specified, use them
      if (unit.roomNumbers && unit.roomNumbers.length > 0) {
        unit.roomNumbers.forEach((roomNumber, roomIndex) => {
          const roomId = `${propertyId}_${unitIndex}_${roomIndex}`
          const currentBooking = currentBookings.find(booking =>
            booking.roomNumber === roomNumber.number ||
            booking.roomType === unit.unitTypeName
          )

          transformedRooms.push({
            id: roomId,
            number: roomNumber.number,
            floor: Math.floor(parseInt(roomNumber.number) / 100) || 1,
            type: {
              id: unit.unitTypeCode,
              name: unit.unitTypeName,
              basePrice: basePrice,
            },
            status: currentBooking ? 'occupied' : (roomNumber.status || 'available'),
            housekeepingStatus: currentBooking ? 'dirty' : 'clean',
            amenities: property.amenities || [],
            currentBooking: currentBooking ? {
              id: currentBooking._id?.toString() || '',
              guestName: currentBooking.guestName || 'Unknown Guest',
              checkIn: currentBooking.dateFrom,
              checkOut: currentBooking.dateTo,
              totalAmount: currentBooking.totalAmount || 0,
            } : undefined,
            lastCleaned: new Date(),
            notes: '',
            images: property.categorizedImages || [],
            unitTypeCode: unit.unitTypeCode,
            unitPricing: unit.pricing
          })
        })
      } else {
        // Generate rooms based on count
        for (let i = 1; i <= unitCount; i++) {
          const roomNumber = `${unit.unitTypeCode}${i.toString().padStart(2, '0')}`
          const roomId = `${propertyId}_${unitIndex}_${i}`
          const currentBooking = currentBookings.find(booking =>
            booking.roomType === unit.unitTypeName
          )

          transformedRooms.push({
            id: roomId,
            number: roomNumber,
            floor: Math.floor(i / 10) + 1,
            type: {
              id: unit.unitTypeCode,
              name: unit.unitTypeName,
              basePrice: basePrice,
            },
            status: currentBooking ? 'occupied' : 'available',
            housekeepingStatus: currentBooking ? 'dirty' : 'clean',
            amenities: property.amenities || [],
            currentBooking: currentBooking ? {
              id: currentBooking._id?.toString() || '',
              guestName: currentBooking.guestName || 'Unknown Guest',
              checkIn: currentBooking.dateFrom,
              checkOut: currentBooking.dateTo,
              totalAmount: currentBooking.totalAmount || 0,
            } : undefined,
            lastCleaned: new Date(),
            notes: '',
            images: property.categorizedImages || [],
            unitTypeCode: unit.unitTypeCode,
            unitPricing: unit.pricing
          })
        }
      }
    })

    console.log(`✅ [Room Management] Generated ${transformedRooms.length} rooms for property ${propertyId}`)

    return NextResponse.json({
      success: true,
      rooms: transformedRooms,
      property: {
        id: propertyId,
        name: property.title || property.name,
        totalRooms: transformedRooms.length,
        propertyUnits: propertyUnits.length
      },
      timestamp: new Date().toISOString()
    })

  } catch (error: any) {
    console.error('💥 [Room Management] Error:', error)
    return NextResponse.json({
      error: 'Failed to load room data',
      details: error.message
    }, { status: 500 })
  }
}

// POST: Create New Room
export async function POST(request: NextRequest) {
  try {
    await dbConnect()

    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { propertyId, number, floor, roomTypeId, amenities, notes } = body

    if (!propertyId || !number || !roomTypeId) {
      return NextResponse.json({
        error: 'Property ID, room number, and room type are required'
      }, { status: 400 })
    }

    console.log(`🏨 [Room Management] Creating room ${number} for property ${propertyId}`)

    // Verify property exists
    const property = await Property.findById(propertyId)
    if (!property) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 })
    }

    // Check if room number already exists
    let existingRoom;
    try {
      existingRoom = await EnhancedRoom.findOne({ propertyId, number })
    } catch (error) {
      existingRoom = await Room.findOne({ propertyId, number })
    }

    if (existingRoom) {
      return NextResponse.json({
        error: 'A room with this number already exists in this property'
      }, { status: 400 })
    }

    // Create room data
    const roomData = {
      propertyId,
      number,
      floor: floor || 1,
      roomTypeId,
      amenities: amenities || [],
      notes: notes || '',
      status: 'available',
      housekeeping: {
        cleaningStatus: 'clean',
        lastCleaned: new Date()
      },
      createdBy: session.user.id || session.user.email,
      createdAt: new Date(),
      isActive: true,
      isBookable: true
    }

    // Create room - try EnhancedRoom first
    let newRoom;
    try {
      newRoom = await EnhancedRoom.create(roomData)
      await newRoom.populate('roomTypeId', 'name basePrice')
    } catch (error) {
      newRoom = await Room.create(roomData)
      await newRoom.populate('roomTypeId', 'name basePrice')
    }

    console.log(`✅ [Room Management] Created room ${number} successfully`)

    return NextResponse.json({
      success: true,
      room: newRoom,
      message: 'Room created successfully',
      timestamp: new Date().toISOString()
    })

  } catch (error: any) {
    console.error('💥 [Room Management] Create Error:', error)
    return NextResponse.json({
      error: 'Failed to create room',
      details: error.message
    }, { status: 500 })
  }
}