import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { validateOSAccess } from '@/lib/auth/os-auth'
import { RoomAllocationService } from '@/lib/services/room-allocation-service'
import { z } from 'zod'

const availabilityQuerySchema = z.object({
  checkIn: z.string().datetime().transform(val => new Date(val)),
  checkOut: z.string().datetime().transform(val => new Date(val)),
  guests: z.string().transform(val => parseInt(val)).pipe(z.number().min(1).max(20)),
  roomTypeId: z.string().optional(),
  floor: z.string().transform(val => parseInt(val)).pipe(z.number().min(0)).optional(),
  wing: z.string().optional(),
  amenities: z.string().optional().transform(val => val ? val.split(',') : undefined),
  accessibility: z.string().transform(val => val === 'true').optional(),
  view: z.string().optional().transform(val => val ? val.split(',') : undefined)
})

const roomAllocationSchema = z.object({
  checkInDate: z.string().datetime().transform(val => new Date(val)),
  checkOutDate: z.string().datetime().transform(val => new Date(val)),
  guestCount: z.number().min(1).max(20),
  preferences: z.object({
    roomTypeId: z.string().optional(),
    floor: z.number().min(0).optional(),
    wing: z.string().optional(),
    amenities: z.array(z.string()).optional(),
    accessibility: z.boolean().optional(),
    view: z.array(z.string()).optional()
  }).optional(),
  specialRequests: z.string().optional()
})

// GET /api/os/rooms/[propertyId]/availability
export async function GET(
  request: NextRequest,
  { params }: { params: { propertyId: string } }
) {
  try {
    const session = await getServerSession()
    const propertyId = params.propertyId

    if (!session || !propertyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const hasAccess = await validateOSAccess(session.user?.email, propertyId)
    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const { searchParams } = request.nextUrl

    // Validate query parameters
    let validatedParams
    try {
      validatedParams = availabilityQuerySchema.parse({
        checkIn: searchParams.get('checkIn'),
        checkOut: searchParams.get('checkOut'),
        guests: searchParams.get('guests'),
        roomTypeId: searchParams.get('roomTypeId'),
        floor: searchParams.get('floor'),
        wing: searchParams.get('wing'),
        amenities: searchParams.get('amenities'),
        accessibility: searchParams.get('accessibility'),
        view: searchParams.get('view')
      })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json({
          error: 'Invalid parameters',
          details: error.errors.map(e => ({
            field: e.path.join('.'),
            message: e.message
          }))
        }, { status: 400 })
      }
      throw error
    }

    // Validate date range
    if (validatedParams.checkOut <= validatedParams.checkIn) {
      return NextResponse.json({
        error: 'Check-out date must be after check-in date'
      }, { status: 400 })
    }

    // Get available rooms
    const availableRooms = await RoomAllocationService.getAvailableRooms(
      propertyId,
      validatedParams.checkIn,
      validatedParams.checkOut,
      validatedParams.guests,
      {
        roomTypeId: validatedParams.roomTypeId,
        floor: validatedParams.floor,
        wing: validatedParams.wing,
        amenities: validatedParams.amenities,
        accessibility: validatedParams.accessibility,
        view: validatedParams.view
      }
    )

    // Get availability report
    const report = await RoomAllocationService.getAvailabilityReport(
      propertyId,
      validatedParams.checkIn,
      validatedParams.checkOut
    )

    // Calculate pricing for each available room
    const roomsWithPricing = await Promise.all(
      availableRooms.map(async (room) => {
        const pricing = await RoomAllocationService.calculateRoomPricing(
          room._id.toString(),
          validatedParams.checkIn,
          validatedParams.checkOut
        )

        return {
          roomId: room._id.toString(),
          roomNumber: room.roomNumber,
          roomType: {
            id: room.roomTypeId.toString(),
            name: room.roomType?.name || 'Unknown',
            category: room.roomType?.category || 'standard'
          },
          floor: room.floor,
          wing: room.wing,
          condition: room.condition,
          status: room.status,
          amenities: {
            hasBalcony: room.specificAmenities?.hasBalcony || false,
            hasKitchen: room.specificAmenities?.hasKitchen || false,
            hasAC: room.specificAmenities?.hasAC || false,
            hasSmartTV: room.specificAmenities?.hasSmartTV || false,
            hasSafe: room.specificAmenities?.hasSafe || false,
            hasMinibar: room.specificAmenities?.hasMinibar || false,
            hasJacuzzi: room.specificAmenities?.hasJacuzzi || false,
            customAmenities: room.specificAmenities?.customAmenities || []
          },
          view: room.view || [],
          accessibility: room.accessibility || {},
          housekeeping: {
            status: room.housekeeping?.cleaningStatus || 'unknown',
            lastCleaned: room.housekeeping?.lastCleaned
          },
          pricing: {
            baseRate: pricing.baseRate,
            totalPrice: pricing.totalPrice,
            pricePerNight: pricing.pricePerNight,
            nights: pricing.nights,
            seasonalMultiplier: pricing.seasonalMultiplier,
            specialRates: pricing.specialRates
          },
          feedback: {
            averageRating: room.feedback?.averageRating || 0,
            totalReviews: room.feedback?.totalReviews || 0
          }
        }
      })
    )

    return NextResponse.json({
      success: true,
      searchCriteria: {
        propertyId,
        checkIn: validatedParams.checkIn.toISOString(),
        checkOut: validatedParams.checkOut.toISOString(),
        guests: validatedParams.guests,
        preferences: {
          roomTypeId: validatedParams.roomTypeId,
          floor: validatedParams.floor,
          wing: validatedParams.wing,
          amenities: validatedParams.amenities,
          accessibility: validatedParams.accessibility,
          view: validatedParams.view
        }
      },
      availability: {
        totalAvailable: availableRooms.length,
        rooms: roomsWithPricing
      },
      summary: {
        totalRooms: report.totalRooms,
        availableRooms: report.availableRooms,
        occupiedRooms: report.occupiedRooms,
        maintenanceRooms: report.maintenanceRooms,
        occupancyRate: report.occupancyRate,
        revenueProjection: report.revenueProjection
      },
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Availability check error:', error)
    return NextResponse.json(
      { error: 'Failed to check availability' },
      { status: 500 }
    )
  }
}

// POST /api/os/rooms/[propertyId]/availability - Room allocation request
export async function POST(
  request: NextRequest,
  { params }: { params: { propertyId: string } }
) {
  try {
    const session = await getServerSession()
    const propertyId = params.propertyId
    const body = await request.json()

    if (!session || !propertyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const hasAccess = await validateOSAccess(session.user?.email, propertyId)
    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Validate request body
    let validatedData
    try {
      validatedData = roomAllocationSchema.parse(body)
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json({
          error: 'Validation failed',
          details: error.errors.map(e => ({
            field: e.path.join('.'),
            message: e.message
          }))
        }, { status: 400 })
      }
      throw error
    }

    // Validate date range
    if (validatedData.checkOutDate <= validatedData.checkInDate) {
      return NextResponse.json({
        error: 'Check-out date must be after check-in date'
      }, { status: 400 })
    }

    // Attempt room allocation
    const allocationResult = await RoomAllocationService.allocateRoom({
      propertyId,
      checkInDate: validatedData.checkInDate,
      checkOutDate: validatedData.checkOutDate,
      guestCount: validatedData.guestCount,
      preferences: validatedData.preferences,
      specialRequests: validatedData.specialRequests
    })

    if (!allocationResult.success) {
      return NextResponse.json({
        success: false,
        error: allocationResult.error,
        alternatives: allocationResult.alternatives || [],
        overbookingWarning: allocationResult.overbookingWarning || false
      }, { status: allocationResult.overbookingWarning ? 202 : 404 })
    }

    // Get room upgrade options
    const upgradeOptions = allocationResult.allocatedRoom
      ? await RoomAllocationService.getRoomUpgradeOptions(
          propertyId,
          allocationResult.allocatedRoom.roomTypeId,
          validatedData.checkInDate,
          validatedData.checkOutDate,
          validatedData.guestCount
        )
      : []

    return NextResponse.json({
      success: true,
      allocation: allocationResult.allocatedRoom,
      alternatives: allocationResult.alternatives || [],
      upgradeOptions,
      holdExpiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(), // 5 minute hold
      message: 'Room allocated successfully. Hold expires in 5 minutes.',
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Room allocation error:', error)
    return NextResponse.json(
      { error: 'Failed to allocate room' },
      { status: 500 }
    )
  }
}

// PUT /api/os/rooms/[propertyId]/availability - Update room availability status
export async function PUT(
  request: NextRequest,
  { params }: { params: { propertyId: string } }
) {
  try {
    const session = await getServerSession()
    const propertyId = params.propertyId
    const body = await request.json()

    if (!session || !propertyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const hasAccess = await validateOSAccess(session.user?.email, propertyId)
    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const { roomId, status, reason, scheduledUntil } = body

    if (!roomId || !status) {
      return NextResponse.json({
        error: 'Room ID and status are required'
      }, { status: 400 })
    }

    const validStatuses = ['available', 'occupied', 'maintenance', 'cleaning', 'out_of_order', 'reserved']
    if (!validStatuses.includes(status)) {
      return NextResponse.json({
        error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      }, { status: 400 })
    }

    // Update room status
    const { connectToDatabase } = await import('@/lib/mongodb')
    const Room = (await import('@/models/Room')).default

    await connectToDatabase()

    const room = await Room.findOne({
      _id: roomId,
      propertyId
    })

    if (!room) {
      return NextResponse.json({
        error: 'Room not found'
      }, { status: 404 })
    }

    const oldStatus = room.status
    room.status = status
    room.lastModifiedBy = session.user?.id || session.user?.email

    // Add status change to maintenance history if relevant
    if (status === 'maintenance' || status === 'out_of_order') {
      room.maintenance.currentIssues.push({
        issueType: 'other',
        description: reason || `Room set to ${status} status`,
        severity: status === 'out_of_order' ? 'major' : 'moderate',
        reportedBy: session.user?.id || session.user?.email,
        reportedAt: new Date(),
        status: 'reported'
      })
    }

    // Handle cleaning status
    if (status === 'cleaning') {
      room.housekeeping.cleaningStatus = 'cleaning_in_progress'
      if (scheduledUntil) {
        room.housekeeping.nextCleaningScheduled = new Date(scheduledUntil)
      }
    } else if (status === 'available' && oldStatus === 'cleaning') {
      room.housekeeping.cleaningStatus = 'clean'
      room.housekeeping.lastCleaned = new Date()
    }

    await room.save()

    return NextResponse.json({
      success: true,
      roomId,
      oldStatus,
      newStatus: status,
      updatedAt: new Date().toISOString(),
      updatedBy: session.user?.email
    })

  } catch (error) {
    console.error('Room status update error:', error)
    return NextResponse.json(
      { error: 'Failed to update room status' },
      { status: 500 }
    )
  }
}