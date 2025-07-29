import { NextRequest, NextResponse } from "next/server";
import { dbHandler } from "@/lib/db";
import { getSession } from "@/lib/get-session";
import { RoomAvailabilityService } from "@/lib/services/room-availability-service";

export const dynamic = 'force-dynamic';

// PUT - Update room status (admin only)
export const PUT = dbHandler(async (req: NextRequest) => {
  try {
    const session = await getSession();
    
    // Check if user is authenticated and is admin
    if (!session || !session.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { propertyId, unitTypeCode, roomNumber, status, action } = body;

    if (!propertyId || !unitTypeCode || !roomNumber) {
      return NextResponse.json(
        { error: "propertyId, unitTypeCode, and roomNumber are required" },
        { status: 400 }
      );
    }

    if (action === 'updateStatus') {
      if (!status || !['available', 'booked', 'maintenance'].includes(status)) {
        return NextResponse.json(
          { error: "Valid status is required: available, booked, or maintenance" },
          { status: 400 }
        );
      }

      const success = await RoomAvailabilityService.updateRoomStatus(
        propertyId,
        unitTypeCode,
        roomNumber,
        status
      );

      if (success) {
        return NextResponse.json({ 
          message: "Room status updated successfully",
          propertyId,
          unitTypeCode,
          roomNumber,
          status
        });
      } else {
        return NextResponse.json(
          { error: "Failed to update room status" },
          { status: 500 }
        );
      }
    }

    return NextResponse.json(
      { error: "Invalid action" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Error in room management:", error);
    return NextResponse.json(
      { error: "Failed to process room management request" },
      { status: 500 }
    );
  }
});

// POST - Manually allocate room for booking (admin only)
export const POST = dbHandler(async (req: NextRequest) => {
  try {
    const session = await getSession();
    
    // Check if user is authenticated and is admin
    if (!session || !session.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { bookingId, unitTypeCode, roomNumber } = body;

    if (!bookingId || !unitTypeCode || !roomNumber) {
      return NextResponse.json(
        { error: "bookingId, unitTypeCode, and roomNumber are required" },
        { status: 400 }
      );
    }

    const success = await RoomAvailabilityService.manuallyAllocateRoom(
      bookingId,
      unitTypeCode,
      roomNumber
    );

    if (success) {
      return NextResponse.json({ 
        message: "Room allocated successfully",
        bookingId,
        unitTypeCode,
        roomNumber
      });
    } else {
      return NextResponse.json(
        { error: "Failed to allocate room" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error in manual room allocation:", error);
    return NextResponse.json(
      { error: "Failed to allocate room" },
      { status: 500 }
    );
  }
}); 