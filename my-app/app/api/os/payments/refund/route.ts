import { NextRequest, NextResponse } from 'next/server';
import Razorpay from 'razorpay';

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { paymentId, amount, reason = 'requested_by_customer' } = body;

    if (!paymentId) {
      return NextResponse.json(
        { success: false, error: 'Payment ID is required' },
        { status: 400 }
      );
    }

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid refund amount' },
        { status: 400 }
      );
    }

    // Create refund
    const refund = await razorpay.payments.refund(paymentId, {
      amount: amount * 100, // Amount in paisa
      speed: 'normal',
      notes: {
        reason,
        refund_processed_at: new Date().toISOString()
      }
    });

    // Here you would typically:
    // 1. Update the payment status in database
    // 2. Update booking status if fully refunded
    // 3. Send refund confirmation emails
    // 4. Update room availability if booking is cancelled

    // Mock database update
    console.log(`Refund created for payment ${paymentId}:`, {
      refund_id: refund.id,
      amount: refund.amount,
      status: refund.status,
      created_at: refund.created_at
    });

    // TODO: Implement actual database operations
    // await updatePaymentRefundStatus(paymentId, {
    //   refund_id: refund.id,
    //   refund_amount: amount,
    //   refund_status: refund.status,
    //   refunded_at: new Date()
    // });

    return NextResponse.json({
      success: true,
      refund_id: refund.id,
      amount: refund.amount / 100, // Convert back to rupees
      status: refund.status,
      message: 'Refund processed successfully'
    });

  } catch (error: any) {
    console.error('Refund processing error:', error);

    // Handle specific Razorpay errors
    if (error.statusCode === 400) {
      return NextResponse.json(
        { success: false, error: error.error?.description || 'Invalid refund request' },
        { status: 400 }
      );
    }

    if (error.statusCode === 404) {
      return NextResponse.json(
        { success: false, error: 'Payment not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to process refund' },
      { status: 500 }
    );
  }
}