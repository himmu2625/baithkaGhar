import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import dbConnect from '@/lib/db/dbConnect';
import ReviewRequest from '@/models/ReviewRequest';
import Booking from '@/models/Booking';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();

    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await dbConnect();

    const body = await request.json();
    const { bookingId, sendVia = ['email'] } = body;

    if (!bookingId) {
      return NextResponse.json(
        { success: false, error: 'Booking ID is required' },
        { status: 400 }
      );
    }

    // Check if booking exists
    const booking = await Booking.findById(bookingId).populate('propertyId');

    if (!booking) {
      return NextResponse.json(
        { success: false, error: 'Booking not found' },
        { status: 404 }
      );
    }

    // Check if review request already exists
    const existingRequest = await ReviewRequest.findOne({ bookingId });

    if (existingRequest && existingRequest.status !== 'expired') {
      return NextResponse.json(
        {
          success: false,
          error: 'Review request already exists for this booking',
          reviewRequest: existingRequest
        },
        { status: 409 }
      );
    }

    // Calculate nights stayed
    const checkIn = new Date(booking.checkInDate);
    const checkOut = new Date(booking.checkOutDate);
    const nightsStayed = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));

    // Generate unique token
    const token = uuidv4();

    // Set expiry (30 days from now)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    // Set first reminder (3 days from now)
    const nextReminderAt = new Date();
    nextReminderAt.setDate(nextReminderAt.getDate() + 3);

    // Create review request
    const reviewRequest = await ReviewRequest.create({
      bookingId: booking._id,
      propertyId: booking.propertyId,
      guestName: booking.guestName || booking.userName,
      guestEmail: booking.guestEmail || booking.userEmail,
      guestPhone: booking.guestPhone,
      checkInDate: booking.checkInDate,
      checkOutDate: booking.checkOutDate,
      roomCategory: booking.roomType || booking.roomCategory,
      nightsStayed,
      token,
      requestSentVia: sendVia,
      expiresAt,
      nextReminderAt,
      generatedBy: (session.user as any)?._id,
      isAutomated: false,
    });

    // Generate review link
    const reviewLink = `${process.env.NEXTAUTH_URL}/review/${token}`;

    return NextResponse.json({
      success: true,
      reviewRequest,
      reviewLink,
      message: 'Review request generated successfully',
    });
  } catch (error: any) {
    console.error('Error generating review request:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to generate review request' },
      { status: 500 }
    );
  }
}
