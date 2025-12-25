import { NextRequest, NextResponse } from 'next/server';
import { getOwnerSession, canAccessProperty } from '@/lib/auth/os-auth';
import { dbConnect } from '@/lib/db';
import Booking from '@/models/Booking';

export async function GET(
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

    // Fetch booking with populated data
    const booking = await Booking.findById(params.id)
      .populate('userId', 'name email phone')
      .populate('propertyId', 'title slug location address images price')
      .lean();

    if (!booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      );
    }

    // Authorization check - verify owner has access to this property
    const hasAccess = await canAccessProperty(
      session.user.id!,
      booking.propertyId._id.toString()
    );

    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Unauthorized - You do not have access to this booking' },
        { status: 403 }
      );
    }

    // Build payment history
    const paymentHistory = [];

    // Add online payment if exists
    if (booking.onlinePaymentAmount && booking.onlinePaymentAmount > 0) {
      paymentHistory.push({
        type: 'online',
        amount: booking.onlinePaymentAmount,
        status: 'completed',
        date: booking.createdAt || new Date(),
        method: booking.paymentMethod || 'razorpay',
        collectedBy: 'System (Online)',
        notes: 'Payment made online during booking'
      });
    }

    // Add hotel payment if collected
    if (booking.isPartialPayment && booking.hotelPaymentStatus === 'collected') {
      paymentHistory.push({
        type: 'hotel',
        amount: booking.hotelPaymentAmount || 0,
        status: 'collected',
        date: booking.hotelPaymentDate || new Date(),
        method: booking.hotelPaymentMethod || 'cash',
        collectedBy: booking.hotelPaymentCollectedBy || 'Property Staff',
        notes: booking.hotelPaymentNotes || 'Payment collected at property'
      });
    }

    // Sort by date (oldest first)
    paymentHistory.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Calculate stay duration
    const checkIn = new Date(booking.dateFrom);
    const checkOut = new Date(booking.dateTo);
    const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));

    // Calculate days until check-in
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const daysUntilCheckIn = Math.ceil((checkIn.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    // Prepare enhanced booking object
    const enhancedBooking = {
      ...booking,
      paymentHistory,
      nights,
      daysUntilCheckIn,
      canCollectPayment:
        booking.isPartialPayment &&
        booking.hotelPaymentStatus === 'pending' &&
        ['confirmed', 'completed'].includes(booking.status),
    };

    return NextResponse.json({
      success: true,
      booking: enhancedBooking
    });

  } catch (error) {
    console.error('Error fetching booking:', error);
    return NextResponse.json(
      { error: 'Failed to fetch booking details' },
      { status: 500 }
    );
  }
}
