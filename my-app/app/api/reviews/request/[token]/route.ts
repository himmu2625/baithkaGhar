import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db/dbConnect';
import ReviewRequest from '@/models/ReviewRequest';
import Property from '@/models/Property';

export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    await dbConnect();

    const { token } = params;

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

    // Update link clicked tracking
    if (!reviewRequest.linkClickedAt) {
      reviewRequest.linkClickedAt = new Date();
      await reviewRequest.save();
    }

    // Fetch property details
    const property = await Property.findById(reviewRequest.propertyId).select(
      'name images location'
    );

    return NextResponse.json({
      success: true,
      reviewRequest: {
        bookingId: reviewRequest.bookingId,
        propertyId: reviewRequest.propertyId,
        guestName: reviewRequest.guestName,
        checkInDate: reviewRequest.checkInDate,
        checkOutDate: reviewRequest.checkOutDate,
        roomCategory: reviewRequest.roomCategory,
        nightsStayed: reviewRequest.nightsStayed,
        status: reviewRequest.status,
        expiresAt: reviewRequest.expiresAt,
      },
      property: property ? {
        name: property.name,
        images: property.images,
        location: property.location,
      } : null,
    });
  } catch (error: any) {
    console.error('Error fetching review request:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch review request' },
      { status: 500 }
    );
  }
}
