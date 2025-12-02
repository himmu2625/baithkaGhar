import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { connectMongo } from "@/lib/db/mongodb";
import Review from "@/models/Review";
import { authOptions } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    // Verify admin authentication
    const token = await getToken({ req, secret: authOptions.secret });
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectMongo();

    // Get all reviews
    const allReviews = await Review.find().lean();

    // Calculate stats
    const total = allReviews.length;
    const pending = allReviews.filter(r => !r.isPublished).length;
    const approved = allReviews.filter(r => r.isPublished).length;
    const rejected = 0; // Add rejected logic if you have a rejected field

    const averageRating = total > 0
      ? allReviews.reduce((sum, r) => sum + r.rating, 0) / total
      : 0;

    // Calculate response rate (reviews with host responses)
    const withResponses = allReviews.filter(r => r.hostResponse || r.adminResponse).length;
    const responseRate = total > 0 ? Math.round((withResponses / total) * 100) : 0;

    return NextResponse.json({
      success: true,
      stats: {
        total,
        pending,
        approved,
        rejected,
        averageRating: parseFloat(averageRating.toFixed(2)),
        responseRate,
      }
    });

  } catch (error: any) {
    console.error("Review Stats API Error:", error);
    return NextResponse.json(
      { success: false, error: "Internal Server Error", details: error.message },
      { status: 500 }
    );
  }
}
