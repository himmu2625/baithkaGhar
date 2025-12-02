import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db/dbConnect';
import Review from '@/models/Review';
import ReviewRequest from '@/models/ReviewRequest';
import Property from '@/models/Property';

export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const body = await request.json();
    const {
      token,
      overallRating,
      categoryRatings,
      comment,
      lovedMost,
      improvements,
      wouldRecommend,
      tripType,
      photos = [],
      guestLocation,
      displayName,
    } = body;

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Token is required' },
        { status: 400 }
      );
    }

    // Find review request
    const reviewRequest = await ReviewRequest.findOne({ token });

    if (!reviewRequest) {
      return NextResponse.json(
        { success: false, error: 'Invalid review link' },
        { status: 404 }
      );
    }

    // Check if already submitted
    if (reviewRequest.status === 'submitted') {
      return NextResponse.json(
        { success: false, error: 'Review already submitted for this booking' },
        { status: 409 }
      );
    }

    // Check if expired
    if (reviewRequest.isExpired()) {
      reviewRequest.status = 'expired';
      await reviewRequest.save();
      return NextResponse.json(
        { success: false, error: 'Review link has expired' },
        { status: 410 }
      );
    }

    // Validate required fields
    if (!overallRating || !comment || !categoryRatings) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Calculate reward points
    let rewardPoints = 50; // Base points
    if (photos.length > 0) rewardPoints += 50; // Bonus for photos
    if (comment.length > 200) rewardPoints += 25; // Bonus for detailed review

    // Create review
    const review = await Review.create({
      propertyId: reviewRequest.propertyId,
      bookingId: reviewRequest.bookingId,
      userName: displayName || reviewRequest.guestName,
      userImage: photos[0]?.url,
      rating: overallRating,
      comment,
      ratingBreakdown: categoryRatings,
      checkInDate: reviewRequest.checkInDate,
      checkOutDate: reviewRequest.checkOutDate,
      source: 'direct',
      isVerified: true,
      isPublished: false, // Requires admin approval
      helpfulCount: 0,
      // Enhanced fields (if Review model is updated)
      guestLocation,
      tripType,
      nightsStayed: reviewRequest.nightsStayed,
      roomCategory: reviewRequest.roomCategory,
      stayDate: reviewRequest.checkInDate,
      lovedMost,
      improvements,
      wouldRecommend,
      photos,
      rewardPoints,
      rewardClaimed: false,
      status: 'pending',
      verifiedBooking: true,
    });

    // Mark review request as submitted
    await reviewRequest.markAsSubmitted(review._id);

    // Update property rating (will be recalculated after approval)
    // This is just a placeholder - you'll want to implement proper rating calculation

    return NextResponse.json({
      success: true,
      review: {
        id: review._id,
        status: 'pending',
        rewardPoints,
      },
      message: 'Review submitted successfully! It will be published after admin approval.',
    });
  } catch (error: any) {
    console.error('Error submitting review:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to submit review' },
      { status: 500 }
    );
  }
}
