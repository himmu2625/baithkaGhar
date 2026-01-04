/**
 * Razorpay Refund API
 * Initiates a refund for a payment
 */

import { NextRequest, NextResponse } from 'next/server';
import Razorpay from 'razorpay';

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || '',
  key_secret: process.env.RAZORPAY_KEY_SECRET || '',
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { paymentId, amount, reason } = body;

    // Validate required fields
    if (!paymentId) {
      return NextResponse.json(
        { error: 'Payment ID is required' },
        { status: 400 }
      );
    }

    // Create refund
    const refundData: any = {};

    if (amount) {
      refundData.amount = Math.round(amount); // Amount in paise
    }

    if (reason) {
      refundData.notes = { reason };
    }

    const refund = await razorpay.payments.refund(paymentId, refundData);

    return NextResponse.json({
      success: true,
      data: {
        refundId: refund.id,
        paymentId: refund.payment_id,
        amount: refund.amount,
        status: refund.status,
        createdAt: refund.created_at,
      },
    });
  } catch (error: any) {
    console.error('Razorpay refund error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to process refund',
      },
      { status: 500 }
    );
  }
}
