import { NextRequest, NextResponse } from "next/server";
import { dbHandler } from "@/lib/db";
import { RoomAvailabilityService } from "@/lib/services/room-availability-service";

export const dynamic = 'force-dynamic';

export const GET = dbHandler(async (req: NextRequest, { params }: { params: { id: string } }) => {
  try {
    const { searchParams } = new URL(req.url);
    const checkInDate = searchParams.get('checkInDate');
    const checkOutDate = searchParams.get('checkOutDate');
    const unitTypeCode = searchParams.get('unitTypeCode');

    if (!checkInDate || !checkOutDate) {
      return NextResponse.json(
        { error: "checkInDate and checkOutDate are required" },
        { status: 400 }
      );
    }

    const checkIn = new Date(checkInDate);
    const checkOut = new Date(checkOutDate);

    if (isNaN(checkIn.getTime()) || isNaN(checkOut.getTime())) {
      return NextResponse.json(
        { error: "Invalid date format" },
        { status: 400 }
      );
    }

    if (checkIn >= checkOut) {
      return NextResponse.json(
        { error: "Check-out date must be after check-in date" },
        { status: 400 }
      );
    }

    const availabilities = await RoomAvailabilityService.getAvailableRooms(
      params.id,
      checkIn,
      checkOutDate,
      unitTypeCode || undefined
    );

    return NextResponse.json({ availabilities });
  } catch (error) {
    console.error("Error getting room availability:", error);
    return NextResponse.json(
      { error: "Failed to get room availability" },
      { status: 500 }
    );
  }
}); 