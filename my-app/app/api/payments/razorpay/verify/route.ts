/**
 * Razorpay Verify Payment API
 * Verifies payment signature and updates booking status
 */

import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { connectMongoDb } from '@/lib/db';
import Booking from '@/models/Booking';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { paymentId, orderId, signature, bookingId } = body;

    // Validate required fields
    if (!paymentId || !orderId || !signature || !bookingId) {
      return NextResponse.json(
        { error: 'Missing required payment verification fields' },
        { status: 400 }
      );
    }

    // Verify signature
    const razorpaySecret = process.env.RAZORPAY_KEY_SECRET || '';
    const generatedSignature = crypto
      .createHmac('sha256', razorpaySecret)
      .update(`${orderId}|${paymentId}`)
      .digest('hex');

    const isValid = generatedSignature === signature;

    if (!isValid) {
      return NextResponse.json(
        {
          success: false,
          verified: false,
          error: 'Invalid payment signature',
        },
        { status: 400 }
      );
    }

    // Update booking in database
    await connectMongoDb();

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return NextResponse.json(
        {
          success: false,
          verified: false,
          error: 'Booking not found',
        },
        { status: 404 }
      );
    }

    // Update booking status
    booking.paymentStatus = 'paid';
    booking.paymentDetails = {
      method: 'razorpay',
      transactionId: paymentId,
      orderId: orderId,
      paidAt: new Date(),
    };
    booking.status = 'confirmed';

    await booking.save();

    return NextResponse.json({
      success: true,
      verified: true,
      booking: {
        _id: booking._id,
        status: booking.status,
        paymentStatus: booking.paymentStatus,
      },
    });
  } catch (error: any) {
    console.error('Razorpay verify payment error:', error);
    return NextResponse.json(
      {
        success: false,
        verified: false,
        error: error.message || 'Failed to verify payment',
      },
      { status: 500 }
    );
  }
}
