import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { connectMongo } from "@/lib/db/mongodb";
import Review from "@/models/Review";
import Property from "@/models/Property";
import User from "@/models/User";

export async function GET(req: NextRequest) {
  try {
    // Verify admin authentication
    const token = await getToken({ req });
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectMongo();

    // Fetch reviews with property and user details
    const reviews = await Review.find()
      .populate('propertyId', 'title')
      .populate('userId', 'name email')
      .sort({ createdAt: -1 })
      .lean();

    // Format reviews for frontend
    const formattedReviews = reviews.map((review: any) => ({
      id: review._id.toString(),
      propertyId: review.propertyId?._id?.toString() || 'unknown',
      propertyName: review.propertyId?.title || 'Unknown Property',
      guestName: review.userId?.name || 'Anonymous User',
      guestEmail: review.userId?.email || '',
      rating: review.rating || 0,
      comment: review.comment || '',
      status: review.status || 'pending',
      date: review.createdAt?.toISOString().split('T')[0] || new Date().toISOString().split('T')[0],
      response: review.adminResponse || ''
    }));

    return NextResponse.json({
      success: true,
      reviews: formattedReviews
    });

  } catch (error: any) {
    console.error("Reviews API Error:", error);
    return NextResponse.json(
      { success: false, error: "Internal Server Error", details: error.message },
      { status: 500 }
    );
  }
} 