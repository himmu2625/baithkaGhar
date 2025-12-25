import { NextRequest, NextResponse } from 'next/server';
import { getOwnerSession, canAccessProperty } from '@/lib/auth/os-auth';
import { dbConnect } from '@/lib/db';
import Room from '@/models/Room';
import RoomType from '@/models/RoomType';

// GET /api/os/rooms/[propertyId] - List all rooms for a property
export async function GET(
  request: NextRequest,
  { params }: { params: { propertyId: string } }
) {
  try {
    // Authentication check
    const session = await getOwnerSession();
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Authorization check
    const hasAccess = await canAccessProperty(session.user.id!, params.propertyId);
    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Unauthorized - You do not have access to this property' },
        { status: 403 }
      );
    }

    await dbConnect();

    // Get query parameters for filtering
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const floor = searchParams.get('floor');
    const roomTypeId = searchParams.get('roomTypeId');
    const isBookable = searchParams.get('isBookable');

    // Build query
    const query: any = {
      propertyId: params.propertyId,
      isActive: true,
    };

    if (status) query.status = status;
    if (floor) query.floor = parseInt(floor);
    if (roomTypeId) query.roomTypeId = roomTypeId;
    if (isBookable !== null && isBookable !== undefined) {
      query.isBookable = isBookable === 'true';
    }

    // Fetch rooms with room type populated
    const rooms = await Room.find(query)
      .populate('roomTypeId', 'name description maxGuests amenities images basePrice')
      .populate('currentBooking.bookingId', 'status dateFrom dateTo')
      .sort({ floor: 1, roomNumber: 1 })
      .lean();

    // Get room count by status for stats
    const statusCounts = await Room.aggregate([
      { $match: { propertyId: params.propertyId, isActive: true } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    const stats = {
      total: rooms.length,
      byStatus: statusCounts.reduce((acc: any, item: any) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
    };

    return NextResponse.json({
      success: true,
      rooms,
      stats,
    });

  } catch (error) {
    console.error('Error fetching rooms:', error);
    return NextResponse.json(
      { error: 'Failed to fetch rooms' },
      { status: 500 }
    );
  }
}

// POST /api/os/rooms/[propertyId] - Create a new room
export async function POST(
  request: NextRequest,
  { params }: { params: { propertyId: string } }
) {
  try {
    // Authentication check
    const session = await getOwnerSession();
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Authorization check
    const hasAccess = await canAccessProperty(session.user.id!, params.propertyId);
    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Unauthorized - You do not have access to this property' },
        { status: 403 }
      );
    }

    await dbConnect();

    const body = await request.json();

    // Validate required fields
    if (!body.roomTypeId || !body.roomNumber || !body.floor || !body.baseRate) {
      return NextResponse.json(
        { error: 'Missing required fields: roomTypeId, roomNumber, floor, baseRate' },
        { status: 400 }
      );
    }

    // Check if room number already exists for this property
    const existingRoom = await Room.findOne({
      propertyId: params.propertyId,
      roomNumber: body.roomNumber,
      isActive: true,
    });

    if (existingRoom) {
      return NextResponse.json(
        { error: 'Room number already exists for this property' },
        { status: 400 }
      );
    }

    // Verify room type exists and belongs to this property
    const roomType = await RoomType.findOne({
      _id: body.roomTypeId,
      propertyId: params.propertyId,
    });

    if (!roomType) {
      return NextResponse.json(
        { error: 'Invalid room type for this property' },
        { status: 400 }
      );
    }

    // Create new room with minimal required data
    const newRoom = new Room({
      propertyId: params.propertyId,
      roomTypeId: body.roomTypeId,
      roomNumber: body.roomNumber,
      floor: body.floor,
      wing: body.wing || undefined,
      block: body.block || undefined,
      status: body.status || 'available',
      condition: body.condition || 'good',

      // Required nested objects with defaults
      actualSize: {
        area: body.actualSize?.area || roomType.size || 300,
        unit: body.actualSize?.unit || 'sqft',
      },

      actualBeds: {
        singleBeds: body.actualBeds?.singleBeds || 0,
        doubleBeds: body.actualBeds?.doubleBeds || 0,
        queenBeds: body.actualBeds?.queenBeds || 0,
        kingBeds: body.actualBeds?.kingBeds || 1,
        sofaBeds: body.actualBeds?.sofaBeds || 0,
        bunkBeds: body.actualBeds?.bunkBeds || 0,
      },

      view: body.view || [],
      orientation: body.orientation || undefined,

      specificAmenities: {
        hasBalcony: body.specificAmenities?.hasBalcony || false,
        hasTerrace: body.specificAmenities?.hasTerrace || false,
        hasGarden: body.specificAmenities?.hasGarden || false,
        hasKitchen: body.specificAmenities?.hasKitchen || false,
        hasWorkDesk: body.specificAmenities?.hasWorkDesk || false,
        hasSmartTV: body.specificAmenities?.hasSmartTV || false,
        hasAC: body.specificAmenities?.hasAC || true,
        hasMinibar: body.specificAmenities?.hasMinibar || false,
        hasSafe: body.specificAmenities?.hasSafe || false,
        hasJacuzzi: body.specificAmenities?.hasJacuzzi || false,
        customAmenities: body.specificAmenities?.customAmenities || [],
      },

      housekeeping: {
        lastCleaned: new Date(),
        lastCleanedBy: session.user.id,
        cleaningStatus: 'clean',
        cleaningDuration: 30,
        housekeepingIssues: [],
      },

      maintenance: {
        lastMaintenance: new Date(),
        maintenanceHistory: [],
        currentIssues: [],
      },

      pricing: {
        baseRate: body.baseRate,
        seasonalMultiplier: body.seasonalMultiplier || 1,
        dynamicPricing: {
          currentRate: body.baseRate,
          lastUpdated: new Date(),
          updatedBy: 'manual',
        },
        specialRates: [],
      },

      accessibility: {
        wheelchairAccessible: body.accessibility?.wheelchairAccessible || false,
        features: body.accessibility?.features || [],
      },

      safety: {
        smokeDetectorStatus: 'working',
        lastSafetyCheck: new Date(),
        emergencyEquipment: [],
        securityFeatures: {
          keyCardAccess: false,
          deadbolt: true,
          chainLock: false,
          peephole: true,
          balconyLock: false,
        },
      },

      feedback: {
        averageRating: 0,
        totalReviews: 0,
        commonComplaints: [],
        commonPraises: [],
      },

      inventory: [],

      energyConsumption: {
        electricityUsage: 0,
        waterUsage: 0,
        lastMeterReading: new Date(),
        monthlyAverage: 0,
      },

      revenue: {
        monthlyRevenue: 0,
        yearlyRevenue: 0,
        averageDailyRate: 0,
        revenuePAR: 0,
        lastRevenueUpdate: new Date(),
      },

      isActive: true,
      isBookable: body.isBookable !== undefined ? body.isBookable : true,
      notes: body.notes || '',

      createdBy: session.user.id,
      lastModifiedBy: session.user.id,
    });

    await newRoom.save();

    // Populate and return the created room
    const populatedRoom = await Room.findById(newRoom._id)
      .populate('roomTypeId', 'name description maxGuests amenities images basePrice')
      .lean();

    return NextResponse.json({
      success: true,
      room: populatedRoom,
      message: 'Room created successfully',
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating room:', error);
    return NextResponse.json(
      { error: 'Failed to create room' },
      { status: 500 }
    );
  }
}
