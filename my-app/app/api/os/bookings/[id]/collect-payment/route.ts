import { NextRequest, NextResponse } from 'next/server';
import { getOwnerSession, canAccessProperty } from '@/lib/auth/os-auth';
import { dbConnect } from '@/lib/db';
import Booking from '@/models/Booking';

interface CollectPaymentRequest {
  amount: number;
  method: 'cash' | 'card' | 'upi' | 'other';
  date?: string;
  notes?: string;
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Authentication check
    const session = await getOwnerSession();
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await dbConnect();

    // Parse request body
    const body: CollectPaymentRequest = await request.json();
    const { amount, method, date, notes } = body;

    // Validation
    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: 'Invalid amount' },
        { status: 400 }
      );
    }

    if (!method || !['cash', 'card', 'upi', 'other'].includes(method)) {
      return NextResponse.json(
        { error: 'Invalid payment method' },
        { status: 400 }
      );
    }

    // Fetch booking
    const booking = await Booking.findById(params.id);

    if (!booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      );
    }

    // Authorization check
    const hasAccess = await canAccessProperty(
      session.user.id!,
      booking.propertyId.toString()
    );

    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Unauthorized - You do not have access to this booking' },
        { status: 403 }
      );
    }

    // Business logic validation
    if (!booking.isPartialPayment) {
      return NextResponse.json(
        { error: 'This booking does not have partial payment' },
        { status: 400 }
      );
    }

    if (booking.hotelPaymentStatus === 'collected') {
      return NextResponse.json(
        { error: 'Payment has already been collected' },
        { status: 400 }
      );
    }

    if (booking.hotelPaymentStatus !== 'pending') {
      return NextResponse.json(
        { error: `Payment status is ${booking.hotelPaymentStatus}, cannot collect` },
        { status: 400 }
      );
    }

    if (!['confirmed', 'completed'].includes(booking.status)) {
      return NextResponse.json(
        { error: `Cannot collect payment for booking with status: ${booking.status}` },
        { status: 400 }
      );
    }

    // Verify amount matches expected amount
    const expectedAmount = booking.hotelPaymentAmount || 0;
    if (Math.abs(amount - expectedAmount) > 1) { // Allow 1 rupee difference for rounding
      return NextResponse.json(
        { error: `Amount mismatch. Expected ₹${expectedAmount}, received ₹${amount}` },
        { status: 400 }
      );
    }

    // Update booking with payment collection details
    const collectionDate = date ? new Date(date) : new Date();
    const paymentId = `HP-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    booking.hotelPaymentStatus = 'collected';
    booking.hotelPaymentCompletedAt = collectionDate;
    booking.hotelPaymentMethod = method;
    booking.hotelPaymentId = paymentId;
    booking.hotelPaymentCollectedBy = session.user.id;

    // Add to payment history (will be tracked by pre-save middleware)
    // The middleware will automatically create a payment history entry

    // If booking was pending and payment is now collected, mark as completed
    if (booking.status === 'pending') {
      booking.status = 'confirmed';
    }

    await booking.save();

    // Log payment collection
    console.log('[Payment Collection] Successfully collected:', {
      bookingId: booking._id,
      amount,
      method,
      collectedBy: session.user.id,
      paymentId
    });

    // Fetch updated booking with populated data
    const updatedBooking = await Booking.findById(params.id)
      .populate('userId', 'name email phone')
      .populate('propertyId', 'title location address')
      .populate('hotelPaymentCollectedBy', 'name email')
      .lean();

    return NextResponse.json({
      success: true,
      message: 'Payment collected successfully',
      booking: updatedBooking
    });

  } catch (error) {
    console.error('Error collecting payment:', error);
    return NextResponse.json(
      { error: 'Failed to collect payment' },
      { status: 500 }
      );
  }
}
