import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { authOptions } from "@/lib/auth";
import { connectMongo } from "@/lib/db/mongodb";
import Booking from "@/models/Booking";
import Review from "@/models/Review";

export async function GET(req: NextRequest) {
  try {
    const token = await getToken({ req, secret: authOptions.secret });
    if (!token || !token.sub) {
      return NextResponse.json({ canReview: false, reason: "Unauthorized" });
    }

    const { searchParams } = new URL(req.url);
    const propertyId = searchParams.get("propertyId");

    if (!propertyId) {
      return NextResponse.json({ success: false, message: "Property ID is required" }, { status: 400 });
    }

    await connectMongo();

    // 1. Check if the user has already reviewed this property
    const existingReview = await Review.findOne({ userId: token.sub, propertyId });
    if (existingReview) {
      return NextResponse.json({ canReview: false, reason: "Already reviewed" });
    }

    // 2. Check for a completed booking for this property by the user
    const completedBooking = await Booking.findOne({
      userId: token.sub,
      propertyId: propertyId,
      status: 'completed',
    });

    if (!completedBooking) {
      return NextResponse.json({ canReview: false, reason: "No completed stay found" });
    }

    return NextResponse.json({ canReview: true });

  } catch (error: any) {
    console.error("Error checking review eligibility:", error);
    return NextResponse.json(
      { success: false, message: "Internal Server Error", details: error.message },
      { status: 500 }
    );
  }
} 