import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import Room from '@/models/Room';
import Property from '@/models/Property';
import { createLogger } from '@/src/channels/utils/Logger';

const logger = createLogger('rooms-api');

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id: propertyId } = params;
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const floor = searchParams.get('floor') || '';
    const condition = searchParams.get('condition') || '';

    if (!mongoose.Types.ObjectId.isValid(propertyId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid property ID' },
        { status: 400 }
      );
    }

    await mongoose.connect(process.env.MONGODB_URI!);

    // Verify property exists
    const property = await Property.findById(propertyId);
    if (!property) {
      return NextResponse.json(
        { success: false, error: 'Property not found' },
        { status: 404 }
      );
    }

    // Build query
    const query: any = { propertyId };
    
    if (search) {
      query.$or = [
        { roomNumber: { $regex: search, $options: 'i' } },
        { wing: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (status && status !== 'all') {
      query.status = status;
    }
    
    if (floor && floor !== 'all') {
      query.floor = parseInt(floor);
    }
    
    if (condition && condition !== 'all') {
      query.condition = condition;
    }

    // Execute query with pagination
    const skip = (page - 1) * limit;
    const [rooms, totalCount] = await Promise.all([
      Room.find(query)
        .populate('roomTypeId', 'name basePrice')
        .sort({ floor: 1, roomNumber: 1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Room.countDocuments(query)
    ]);

    // Calculate room statistics
    const roomStats = await Room.aggregate([
      { $match: { propertyId: new mongoose.Types.ObjectId(propertyId) } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const statusMap = roomStats.reduce((acc: any, stat) => {
      acc[stat._id] = stat.count;
      return acc;
    }, {});

    const totalRooms = await Room.countDocuments({ propertyId });
    const occupancyRate = totalRooms > 0 ? ((statusMap.occupied || 0) / totalRooms) * 100 : 0;

    // Calculate revenue statistics
    const revenueStats = await Room.aggregate([
      { $match: { propertyId: new mongoose.Types.ObjectId(propertyId) } },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$revenue.monthlyRevenue' },
          averageDailyRate: { $avg: '$revenue.averageDailyRate' }
        }
      }
    ]);

    const revenue = revenueStats[0] || { totalRevenue: 0, averageDailyRate: 0 };

    logger.info('Rooms retrieved successfully', {
      propertyId,
      count: rooms.length,
      totalCount,
      page,
      limit,
      statusFilter: status,
      floorFilter: floor
    });

    return NextResponse.json({
      success: true,
      data: {
        rooms,
        pagination: {
          page,
          limit,
          totalCount,
          totalPages: Math.ceil(totalCount / limit),
          hasNextPage: page < Math.ceil(totalCount / limit),
          hasPrevPage: page > 1
        },
        stats: {
          totalRooms,
          available: statusMap.available || 0,
          occupied: statusMap.occupied || 0,
          maintenance: statusMap.maintenance || 0,
          cleaning: statusMap.cleaning || 0,
          outOfOrder: statusMap.out_of_order || 0,
          reserved: statusMap.reserved || 0,
          occupancyRate: Math.round(occupancyRate * 10) / 10,
          totalRevenue: revenue.totalRevenue,
          averageDailyRate: Math.round(revenue.averageDailyRate || 0)
        }
      }
    });

  } catch (error) {
    logger.error('Error fetching rooms', error as Error);
    return NextResponse.json(
      { 
        success: false, 
        error: `Failed to fetch rooms: ${(error as Error).message}` 
      },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id: propertyId } = params;
    const roomData = await request.json();

    if (!mongoose.Types.ObjectId.isValid(propertyId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid property ID' },
        { status: 400 }
      );
    }

    await mongoose.connect(process.env.MONGODB_URI!);

    // Verify property exists
    const property = await Property.findById(propertyId);
    if (!property) {
      return NextResponse.json(
        { success: false, error: 'Property not found' },
        { status: 404 }
      );
    }

    // Validate required fields
    const requiredFields = [
      'roomNumber', 'floor', 'roomTypeId', 'actualSize', 'pricing', 'createdBy'
    ];

    for (const field of requiredFields) {
      if (!roomData[field]) {
        return NextResponse.json(
          { 
            success: false, 
            error: `Missing required field: ${field}` 
          },
          { status: 400 }
        );
      }
    }

    // Check if room number already exists in this property
    const existingRoom = await Room.findOne({ 
      propertyId, 
      roomNumber: roomData.roomNumber 
    });

    if (existingRoom) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Room number ${roomData.roomNumber} already exists in this property` 
        },
        { status: 409 }
      );
    }

    // Create new room
    const room = new Room({
      ...roomData,
      propertyId,
      status: 'available',
      condition: 'good',
      isActive: true,
      isBookable: true,
      housekeeping: {
        lastCleaned: new Date(),
        cleaningStatus: 'clean'
      },
      maintenance: {
        lastMaintenance: new Date(),
        currentIssues: []
      },
      revenue: {
        monthlyRevenue: 0,
        averageDailyRate: roomData.pricing.baseRate || 0
      },
      lastModifiedBy: roomData.createdBy
    });

    await room.save();

    logger.info('Room created successfully', {
      roomId: room._id,
      propertyId,
      roomNumber: room.roomNumber,
      floor: room.floor
    });

    return NextResponse.json({
      success: true,
      data: {
        room,
        message: 'Room created successfully'
      }
    });

  } catch (error) {
    logger.error('Error creating room', error as Error);
    return NextResponse.json(
      { 
        success: false, 
        error: `Failed to create room: ${(error as Error).message}` 
      },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id: propertyId } = params;
    const { action, roomIds, ...updateData } = await request.json();

    if (!mongoose.Types.ObjectId.isValid(propertyId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid property ID' },
        { status: 400 }
      );
    }

    await mongoose.connect(process.env.MONGODB_URI!);

    if (action && roomIds && Array.isArray(roomIds)) {
      // Bulk action
      let updateFields: any = {};
      
      switch (action) {
        case 'maintenance':
          updateFields = { 
            status: 'maintenance',
            isBookable: false,
            updatedAt: new Date()
          };
          break;
        case 'cleaning':
          updateFields = { 
            status: 'cleaning',
            'housekeeping.cleaningStatus': 'cleaning_in_progress',
            'housekeeping.nextCleaningScheduled': new Date(),
            updatedAt: new Date()
          };
          break;
        case 'available':
          updateFields = { 
            status: 'available',
            isBookable: true,
            'housekeeping.cleaningStatus': 'clean',
            updatedAt: new Date()
          };
          break;
        default:
          return NextResponse.json(
            { success: false, error: 'Invalid bulk action' },
            { status: 400 }
          );
      }

      const result = await Room.updateMany(
        { 
          _id: { $in: roomIds },
          propertyId 
        },
        updateFields
      );

      logger.info('Bulk room action completed', {
        action,
        propertyId,
        roomCount: roomIds.length,
        modifiedCount: result.modifiedCount
      });

      return NextResponse.json({
        success: true,
        data: {
          message: `${action} action applied to ${result.modifiedCount} rooms`,
          modifiedCount: result.modifiedCount
        }
      });
    }

    return NextResponse.json(
      { success: false, error: 'Invalid request format' },
      { status: 400 }
    );

  } catch (error) {
    logger.error('Error performing bulk room action', error as Error);
    return NextResponse.json(
      { 
        success: false, 
        error: `Failed to perform room action: ${(error as Error).message}` 
      },
      { status: 500 }
    );
  }
}