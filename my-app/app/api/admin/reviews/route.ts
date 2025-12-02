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

    // Get query parameters
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') || 'all';
    const search = searchParams.get('search') || '';
    const rating = searchParams.get('rating');

    // Build query
    let query: any = {};

    // Filter by status
    if (status === 'pending') {
      query.isPublished = false;
    } else if (status === 'approved') {
      query.isPublished = true;
    } else if (status === 'rejected') {
      query.isPublished = false;
      // Add rejected flag if you have one
    }

    // Filter by rating
    if (rating && rating !== 'all') {
      query.rating = parseInt(rating);
    }

    // Search by guest name or comment
    if (search) {
      query.$or = [
        { userName: { $regex: search, $options: 'i' } },
        { comment: { $regex: search, $options: 'i' } },
      ];
    }

    // Fetch reviews with property details
    const reviews = await Review.find(query)
      .populate('propertyId', 'name title images')
      .sort({ createdAt: -1 })
      .limit(200)
      .lean();

    // Format reviews for frontend
    const formattedReviews = reviews.map((review: any) => ({
      _id: review._id.toString(),
      id: review._id.toString(),
      propertyId: {
        _id: review.propertyId?._id?.toString() || 'unknown',
        name: review.propertyId?.name || review.propertyId?.title || 'Unknown Property'
      },
      propertyName: review.propertyId?.name || review.propertyId?.title || 'Unknown Property',
      guestName: review.userName || 'Anonymous User',
      userName: review.userName || 'Anonymous User',
      userImage: review.userImage,
      guestImage: review.userImage,
      rating: review.rating || 0,
      comment: review.comment || '',
      ratingBreakdown: review.ratingBreakdown || {
        cleanliness: review.rating || 0,
        accuracy: review.rating || 0,
        communication: review.rating || 0,
        location: review.rating || 0,
        checkIn: review.rating || 0,
        value: review.rating || 0,
      },
      status: review.isPublished ? 'approved' : 'pending',
      isPublished: review.isPublished,
      isVerified: review.isVerified,
      source: review.source,
      date: review.createdAt?.toISOString().split('T')[0] || new Date().toISOString().split('T')[0],
      createdAt: review.createdAt,
      response: review.hostResponse || review.adminResponse || '',
      helpfulCount: review.helpfulCount || 0
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