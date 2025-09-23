import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      bookingId
    } = body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json(
        { success: false, error: 'Missing required payment parameters' },
        { status: 400 }
      );
    }

    // Verify signature
    const secret = process.env.RAZORPAY_KEY_SECRET!;
    const body_string = razorpay_order_id + '|' + razorpay_payment_id;

    const expected_signature = crypto
      .createHmac('sha256', secret)
      .update(body_string.toString())
      .digest('hex');

    const is_authentic = expected_signature === razorpay_signature;

    if (!is_authentic) {
      return NextResponse.json(
        { success: false, error: 'Invalid payment signature' },
        { status: 400 }
      );
    }

    // Here you would typically:
    // 1. Update the booking payment status in database
    // 2. Store payment details
    // 3. Send confirmation emails
    // 4. Update room allocation status

    // Mock database update
    console.log(`Payment verified for booking ${bookingId}:`, {
      order_id: razorpay_order_id,
      payment_id: razorpay_payment_id,
      signature: razorpay_signature,
      status: 'completed'
    });

    // TODO: Implement actual database operations
    // await updateBookingPaymentStatus(bookingId, {
    //   status: 'paid',
    //   razorpay_payment_id,
    //   razorpay_order_id,
    //   razorpay_signature,
    //   paid_at: new Date()
    // });

    return NextResponse.json({
      success: true,
      message: 'Payment verified successfully',
      payment_id: razorpay_payment_id,
      order_id: razorpay_order_id
    });

  } catch (error) {
    console.error('Payment verification error:', error);
    return NextResponse.json(
      { success: false, error: 'Payment verification failed' },
      { status: 500 }
    );
  }
}