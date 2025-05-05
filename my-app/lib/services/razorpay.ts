import Razorpay from 'razorpay';
import crypto from 'crypto';

// Initialize Razorpay instance
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || '',
  key_secret: process.env.RAZORPAY_KEY_SECRET || '',
});

/**
 * Create a new Razorpay order
 * @param options - Order options
 * @returns Created order object
 */
export async function createOrder({
  amount,
  currency = 'INR',
  receipt,
  notes = {},
}: {
  amount: number;
  currency?: string;
  receipt: string;
  notes?: Record<string, string>;
}) {
  try {
    // Validate required environment variables
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      throw new Error('Razorpay API keys are not configured');
    }

    // Create order with Razorpay
    const order = await razorpay.orders.create({
      amount: Math.round(amount * 100), // Convert to paise
      currency,
      receipt,
      notes,
    });

    return order;
  } catch (error) {
    console.error('Error creating Razorpay order:', error);
    throw error;
  }
}

/**
 * Verify Razorpay payment signature
 * @param params - Payment parameters
 * @returns Boolean indicating if signature is valid
 */
export function verifyPaymentSignature({
  orderId,
  paymentId,
  signature,
}: {
  orderId: string;
  paymentId: string;
  signature: string;
}): boolean {
  try {
    // Validate required environment variables
    if (!process.env.RAZORPAY_KEY_SECRET) {
      throw new Error('Razorpay key secret is not configured');
    }

    // Generate expected signature
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${orderId}|${paymentId}`)
      .digest('hex');

    // Compare with received signature
    return expectedSignature === signature;
  } catch (error) {
    console.error('Error verifying Razorpay signature:', error);
    return false;
  }
}

/**
 * Fetch payment details from Razorpay
 * @param paymentId - Razorpay payment ID
 * @returns Payment details
 */
export async function getPaymentDetails(paymentId: string) {
  try {
    return await razorpay.payments.fetch(paymentId);
  } catch (error) {
    console.error('Error fetching Razorpay payment details:', error);
    throw error;
  }
}

/**
 * Fetch order details from Razorpay
 * @param orderId - Razorpay order ID
 * @returns Order details
 */
export async function getOrderDetails(orderId: string) {
  try {
    return await razorpay.orders.fetch(orderId);
  } catch (error) {
    console.error('Error fetching Razorpay order details:', error);
    throw error;
  }
}

/**
 * Capture a payment that was authorized
 * @param paymentId - Razorpay payment ID
 * @param amount - Amount to capture in INR
 * @returns Capture result
 */
export async function capturePayment(paymentId: string, amount: number) {
  try {
    // Convert amount to paise
    const amountInPaise = Math.round(amount * 100);
    
    // Use the correct API signature for capture
    return await razorpay.payments.capture(paymentId, amountInPaise);
  } catch (error) {
    console.error('Error capturing Razorpay payment:', error);
    throw error;
  }
}

/**
 * Refund a payment
 * @param paymentId - Razorpay payment ID
 * @param amount - Amount to refund in INR (optional, if not provided, full amount is refunded)
 * @returns Refund result
 */
export async function refundPayment(paymentId: string, amount?: number) {
  try {
    const refundOptions: any = {};
    
    if (amount) {
      refundOptions.amount = Math.round(amount * 100); // Convert to paise
    }
    
    return await razorpay.payments.refund(paymentId, refundOptions);
  } catch (error) {
    console.error('Error refunding Razorpay payment:', error);
    throw error;
  }
}

// Export the razorpay instance
export { razorpay }; 