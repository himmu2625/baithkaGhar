import { NextRequest, NextResponse } from "next/server";
import { BookingService } from "@/services/booking-service";
import { dbHandler } from "@/lib/db";
import { getSession } from "@/lib/get-session";
import mongoose from "mongoose";
import Booking from "@/models/Booking";
import { convertDocToObj } from "@/lib/db";
import { sendReactEmail } from "@/lib/services/email";

interface Params {
  params: {
    id: string;
  };
}

type PopulatedBooking = {
  _id: mongoose.Types.ObjectId;
  propertyId?: { ownerId?: mongoose.Types.ObjectId };
  userId?: { _id?: mongoose.Types.ObjectId; name?: string; email?: string } | mongoose.Types.ObjectId;
  status?: string;
};

// Mark this route as dynamic since it uses session
export const dynamic = 'force-dynamic';

export const GET = dbHandler(async (_: Request, { params }: Params) => {
  const { id } = params;
  const session = await getSession();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({ error: "Invalid booking ID" }, { status: 400 });
  }

  try {
    const booking = await Booking.findById(id)
      .populate("propertyId")
      .populate("userId", "name email")
      .lean() as PopulatedBooking | null;

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    const isOwner = booking.propertyId?.ownerId?.toString() === session.user.id;
    const isBooker = (booking.userId as any)?._id?.toString() === session.user.id;

    if (!isOwner && !isBooker && session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    return NextResponse.json(convertDocToObj(booking));
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
});

export const PATCH = dbHandler(async (req: Request, { params }: Params) => {
  const { id } = params;
  const session = await getSession();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { status } = await req.json();

    if (!status) {
      return NextResponse.json({ error: "Status is required" }, { status: 400 });
    }

    const validStatuses = ["confirmed", "cancelled", "completed"];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const booking = await Booking.findById(id)
      .populate("propertyId")
      .lean() as PopulatedBooking | null;

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    const isOwner = booking.propertyId?.ownerId?.toString() === session.user.id;
    const isBooker = (booking.userId as mongoose.Types.ObjectId)?.toString?.() === session.user.id;

    if (status === "cancelled") {
      if (!isOwner && !isBooker && session.user.role !== "admin") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
      }

      const cancelledBooking = await BookingService.cancelBooking(id, session.user.id);
      return NextResponse.json(cancelledBooking);
    }

    if (!isOwner && session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const updatedBooking = await Booking.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    ).lean();

    return NextResponse.json(convertDocToObj(updatedBooking));
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
});
