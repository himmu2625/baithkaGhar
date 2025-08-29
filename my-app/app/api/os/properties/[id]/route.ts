import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import Property from '@/models/Property';
import Room from '@/models/Room';
import { createLogger } from '@/src/channels/utils/Logger';

const logger = createLogger('property-api');

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid property ID' },
        { status: 400 }
      );
    }

    await mongoose.connect(process.env.MONGODB_URI!);

    const property = await Property.findById(id).lean();

    if (!property) {
      return NextResponse.json(
        { success: false, error: 'Property not found' },
        { status: 404 }
      );
    }

    // Get room statistics for this property
    const roomStats = await Room.aggregate([
      { $match: { propertyId: new mongoose.Types.ObjectId(id) } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const roomStatusMap = roomStats.reduce((acc: any, stat) => {
      acc[stat._id] = stat.count;
      return acc;
    }, {});

    const totalRooms = await Room.countDocuments({ propertyId: id });

    // Get recent activity for this property
    const recentActivity = await Room.find(
      { 
        propertyId: id,
        $or: [
          { 'housekeeping.cleaningStatus': { $ne: 'clean' } },
          { 'maintenance.currentIssues.0': { $exists: true } },
          { 'currentBooking.bookingId': { $exists: true } }
        ]
      },
      {
        roomNumber: 1,
        status: 1,
        'currentBooking.guestName': 1,
        'currentBooking.checkIn': 1,
        'currentBooking.checkOut': 1,
        'housekeeping.cleaningStatus': 1,
        'maintenance.currentIssues': 1,
        updatedAt: 1
      }
    ).sort({ updatedAt: -1 }).limit(10);

    logger.info('Property details retrieved successfully', {
      propertyId: id,
      propertyName: property.name,
      totalRooms,
      roomStats: roomStatusMap
    });

    return NextResponse.json({
      success: true,
      data: {
        property,
        roomStats: {
          total: totalRooms,
          available: roomStatusMap.available || 0,
          occupied: roomStatusMap.occupied || 0,
          maintenance: roomStatusMap.maintenance || 0,
          cleaning: roomStatusMap.cleaning || 0,
          outOfOrder: roomStatusMap.out_of_order || 0,
          reserved: roomStatusMap.reserved || 0
        },
        recentActivity
      }
    });

  } catch (error) {
    logger.error('Error fetching property details', error as Error);
    return NextResponse.json(
      { 
        success: false, 
        error: `Failed to fetch property: ${(error as Error).message}` 
      },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const updateData = await request.json();

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid property ID' },
        { status: 400 }
      );
    }

    await mongoose.connect(process.env.MONGODB_URI!);

    const property = await Property.findById(id);

    if (!property) {
      return NextResponse.json(
        { success: false, error: 'Property not found' },
        { status: 404 }
      );
    }

    // Update property with new data
    Object.keys(updateData).forEach(key => {
      if (key !== '_id' && key !== 'createdAt') {
        property[key] = updateData[key];
      }
    });

    property.updatedAt = new Date();
    await property.save();

    logger.info('Property updated successfully', {
      propertyId: id,
      propertyName: property.name,
      updatedFields: Object.keys(updateData)
    });

    return NextResponse.json({
      success: true,
      data: {
        property,
        message: 'Property updated successfully'
      }
    });

  } catch (error) {
    logger.error('Error updating property', error as Error);
    return NextResponse.json(
      { 
        success: false, 
        error: `Failed to update property: ${(error as Error).message}` 
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid property ID' },
        { status: 400 }
      );
    }

    await mongoose.connect(process.env.MONGODB_URI!);

    const property = await Property.findById(id);

    if (!property) {
      return NextResponse.json(
        { success: false, error: 'Property not found' },
        { status: 404 }
      );
    }

    // Check if property has active bookings
    const activeRooms = await Room.countDocuments({
      propertyId: id,
      $or: [
        { status: 'occupied' },
        { 'currentBooking.bookingId': { $exists: true } }
      ]
    });

    if (activeRooms > 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Cannot delete property with active bookings. Please complete or cancel all bookings first.' 
        },
        { status: 400 }
      );
    }

    // Soft delete - mark as deleted instead of removing from database
    property.status = 'deleted';
    property.isPublished = false;
    property.updatedAt = new Date();
    await property.save();

    // Also mark all rooms as inactive
    await Room.updateMany(
      { propertyId: id },
      { 
        isActive: false,
        isBookable: false,
        status: 'out_of_order',
        updatedAt: new Date()
      }
    );

    logger.info('Property deleted successfully', {
      propertyId: id,
      propertyName: property.name
    });

    return NextResponse.json({
      success: true,
      data: {
        message: 'Property deleted successfully'
      }
    });

  } catch (error) {
    logger.error('Error deleting property', error as Error);
    return NextResponse.json(
      { 
        success: false, 
        error: `Failed to delete property: ${(error as Error).message}` 
      },
      { status: 500 }
    );
  }
}