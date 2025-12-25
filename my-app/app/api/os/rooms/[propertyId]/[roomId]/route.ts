import { NextRequest, NextResponse } from 'next/server';
import { getOwnerSession, canAccessProperty } from '@/lib/auth/os-auth';
import { dbConnect } from '@/lib/db';
import Room from '@/models/Room';
import Booking from '@/models/Booking';

// GET /api/os/rooms/[propertyId]/[roomId] - Get single room details
export async function GET(
  request: NextRequest,
  { params }: { params: { propertyId: string; roomId: string } }
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

    const room = await Room.findOne({
      _id: params.roomId,
      propertyId: params.propertyId,
      isActive: true,
    })
      .populate('roomTypeId', 'name description maxGuests amenities images basePrice')
      .populate('currentBooking.bookingId', 'status dateFrom dateTo userId')
      .populate('createdBy', 'name email')
      .populate('lastModifiedBy', 'name email')
      .lean();

    if (!room) {
      return NextResponse.json(
        { error: 'Room not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      room,
    });

  } catch (error) {
    console.error('Error fetching room:', error);
    return NextResponse.json(
      { error: 'Failed to fetch room' },
      { status: 500 }
    );
  }
}

// PUT /api/os/rooms/[propertyId]/[roomId] - Update room
export async function PUT(
  request: NextRequest,
  { params }: { params: { propertyId: string; roomId: string } }
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

    // Find the room
    const room = await Room.findOne({
      _id: params.roomId,
      propertyId: params.propertyId,
      isActive: true,
    });

    if (!room) {
      return NextResponse.json(
        { error: 'Room not found' },
        { status: 404 }
      );
    }

    // If changing room number, check it doesn't conflict
    if (body.roomNumber && body.roomNumber !== room.roomNumber) {
      const existingRoom = await Room.findOne({
        propertyId: params.propertyId,
        roomNumber: body.roomNumber,
        isActive: true,
        _id: { $ne: params.roomId },
      });

      if (existingRoom) {
        return NextResponse.json(
          { error: 'Room number already exists for this property' },
          { status: 400 }
        );
      }
      room.roomNumber = body.roomNumber;
    }

    // Update basic fields
    if (body.floor !== undefined) room.floor = body.floor;
    if (body.wing !== undefined) room.wing = body.wing;
    if (body.block !== undefined) room.block = body.block;
    if (body.status !== undefined) room.status = body.status;
    if (body.condition !== undefined) room.condition = body.condition;
    if (body.orientation !== undefined) room.orientation = body.orientation;
    if (body.view !== undefined) room.view = body.view;
    if (body.isBookable !== undefined) room.isBookable = body.isBookable;
    if (body.notes !== undefined) room.notes = body.notes;

    // Update actualSize
    if (body.actualSize) {
      if (body.actualSize.area !== undefined) room.actualSize.area = body.actualSize.area;
      if (body.actualSize.unit !== undefined) room.actualSize.unit = body.actualSize.unit;
    }

    // Update actualBeds
    if (body.actualBeds) {
      if (body.actualBeds.singleBeds !== undefined) room.actualBeds.singleBeds = body.actualBeds.singleBeds;
      if (body.actualBeds.doubleBeds !== undefined) room.actualBeds.doubleBeds = body.actualBeds.doubleBeds;
      if (body.actualBeds.queenBeds !== undefined) room.actualBeds.queenBeds = body.actualBeds.queenBeds;
      if (body.actualBeds.kingBeds !== undefined) room.actualBeds.kingBeds = body.actualBeds.kingBeds;
      if (body.actualBeds.sofaBeds !== undefined) room.actualBeds.sofaBeds = body.actualBeds.sofaBeds;
      if (body.actualBeds.bunkBeds !== undefined) room.actualBeds.bunkBeds = body.actualBeds.bunkBeds;
    }

    // Update specificAmenities
    if (body.specificAmenities) {
      if (body.specificAmenities.hasBalcony !== undefined) room.specificAmenities.hasBalcony = body.specificAmenities.hasBalcony;
      if (body.specificAmenities.hasTerrace !== undefined) room.specificAmenities.hasTerrace = body.specificAmenities.hasTerrace;
      if (body.specificAmenities.hasGarden !== undefined) room.specificAmenities.hasGarden = body.specificAmenities.hasGarden;
      if (body.specificAmenities.hasKitchen !== undefined) room.specificAmenities.hasKitchen = body.specificAmenities.hasKitchen;
      if (body.specificAmenities.hasWorkDesk !== undefined) room.specificAmenities.hasWorkDesk = body.specificAmenities.hasWorkDesk;
      if (body.specificAmenities.hasSmartTV !== undefined) room.specificAmenities.hasSmartTV = body.specificAmenities.hasSmartTV;
      if (body.specificAmenities.hasAC !== undefined) room.specificAmenities.hasAC = body.specificAmenities.hasAC;
      if (body.specificAmenities.hasMinibar !== undefined) room.specificAmenities.hasMinibar = body.specificAmenities.hasMinibar;
      if (body.specificAmenities.hasSafe !== undefined) room.specificAmenities.hasSafe = body.specificAmenities.hasSafe;
      if (body.specificAmenities.hasJacuzzi !== undefined) room.specificAmenities.hasJacuzzi = body.specificAmenities.hasJacuzzi;
      if (body.specificAmenities.customAmenities !== undefined) room.specificAmenities.customAmenities = body.specificAmenities.customAmenities;
    }

    // Update pricing
    if (body.pricing) {
      if (body.pricing.baseRate !== undefined) {
        room.pricing.baseRate = body.pricing.baseRate;
        room.pricing.dynamicPricing.currentRate = body.pricing.baseRate;
        room.pricing.dynamicPricing.lastUpdated = new Date();
        room.pricing.dynamicPricing.updatedBy = 'manual';
      }
      if (body.pricing.seasonalMultiplier !== undefined) room.pricing.seasonalMultiplier = body.pricing.seasonalMultiplier;
    }

    // Update accessibility
    if (body.accessibility) {
      if (body.accessibility.wheelchairAccessible !== undefined) room.accessibility.wheelchairAccessible = body.accessibility.wheelchairAccessible;
      if (body.accessibility.features !== undefined) room.accessibility.features = body.accessibility.features;
    }

    // Update lastModifiedBy
    room.lastModifiedBy = session.user.id;

    await room.save();

    // Populate and return the updated room
    const updatedRoom = await Room.findById(room._id)
      .populate('roomTypeId', 'name description maxGuests amenities images basePrice')
      .lean();

    return NextResponse.json({
      success: true,
      room: updatedRoom,
      message: 'Room updated successfully',
    });

  } catch (error) {
    console.error('Error updating room:', error);
    return NextResponse.json(
      { error: 'Failed to update room' },
      { status: 500 }
    );
  }
}

// DELETE /api/os/rooms/[propertyId]/[roomId] - Delete (soft delete) room
export async function DELETE(
  request: NextRequest,
  { params }: { params: { propertyId: string; roomId: string } }
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

    // Find the room
    const room = await Room.findOne({
      _id: params.roomId,
      propertyId: params.propertyId,
      isActive: true,
    });

    if (!room) {
      return NextResponse.json(
        { error: 'Room not found' },
        { status: 404 }
      );
    }

    // Check if room has active bookings
    const activeBookings = await Booking.find({
      propertyId: params.propertyId,
      'rooms.roomId': params.roomId,
      status: { $in: ['confirmed', 'pending'] },
      dateTo: { $gte: new Date() },
    });

    if (activeBookings.length > 0) {
      return NextResponse.json(
        {
          error: 'Cannot delete room with active bookings',
          activeBookings: activeBookings.length,
        },
        { status: 400 }
      );
    }

    // Soft delete - set isActive to false
    room.isActive = false;
    room.isBookable = false;
    room.status = 'out_of_order';
    room.lastModifiedBy = session.user.id;
    await room.save();

    return NextResponse.json({
      success: true,
      message: 'Room deleted successfully',
    });

  } catch (error) {
    console.error('Error deleting room:', error);
    return NextResponse.json(
      { error: 'Failed to delete room' },
      { status: 500 }
    );
  }
}
