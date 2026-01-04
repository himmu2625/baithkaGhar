/**
 * Payment Service
 * Handles Razorpay payment processing
 */

import RazorpayCheckout from 'react-native-razorpay';
import { api } from './api';
import { API_ENDPOINTS } from '@/constants/api';

export interface RazorpayOrderData {
  orderId: string;
  amount: number;
  currency: string;
  receipt: string;
}

export interface PaymentOptions {
  amount: number;
  bookingId: string;
  propertyName: string;
  userEmail: string;
  userName: string;
  userPhone: string;
}

export interface PaymentResponse {
  success: boolean;
  paymentId?: string;
  orderId?: string;
  signature?: string;
  error?: string;
}

class PaymentService {
  private razorpayKey: string;

  constructor() {
    // Get Razorpay key from environment
    this.razorpayKey = process.env.EXPO_PUBLIC_RAZORPAY_KEY_ID || '';
  }

  /**
   * Create Razorpay order on backend
   */
  async createOrder(amount: number, bookingId: string): Promise<RazorpayOrderData> {
    try {
      const response = await api.post<{ data: RazorpayOrderData }>(
        API_ENDPOINTS.PAYMENTS.CREATE_ORDER,
        {
          amount: Math.round(amount * 100), // Convert to paise
          currency: 'INR',
          receipt: `booking_${bookingId}`,
          notes: {
            bookingId,
          },
        }
      );

      return response.data;
    } catch (error: any) {
      console.error('Create order error:', error);
      throw new Error(error.message || 'Failed to create payment order');
    }
  }

  /**
   * Open Razorpay checkout
   */
  async processPayment(options: PaymentOptions): Promise<PaymentResponse> {
    try {
      // First create order on backend
      const orderData = await this.createOrder(options.amount, options.bookingId);

      // Open Razorpay checkout
      const razorpayOptions = {
        description: `Booking at ${options.propertyName}`,
        image: 'https://your-logo-url.com/logo.png', // Replace with actual logo
        currency: orderData.currency,
        key: this.razorpayKey,
        amount: orderData.amount,
        name: 'Baithaka Ghar',
        order_id: orderData.orderId,
        prefill: {
          email: options.userEmail,
          contact: options.userPhone,
          name: options.userName,
        },
        theme: { color: '#1a1a1a' },
      };

      const data = await RazorpayCheckout.open(razorpayOptions);

      // Payment successful
      return {
        success: true,
        paymentId: data.razorpay_payment_id,
        orderId: data.razorpay_order_id,
        signature: data.razorpay_signature,
      };
    } catch (error: any) {
      console.error('Payment error:', error);

      // Check if user cancelled
      if (error.code === RazorpayCheckout.PAYMENT_CANCELLED) {
        return {
          success: false,
          error: 'Payment cancelled by user',
        };
      }

      return {
        success: false,
        error: error.description || 'Payment failed',
      };
    }
  }

  /**
   * Verify payment on backend
   */
  async verifyPayment(
    paymentId: string,
    orderId: string,
    signature: string,
    bookingId: string
  ): Promise<{ verified: boolean; booking?: any }> {
    try {
      const response = await api.post<{ data: { verified: boolean; booking?: any } }>(
        API_ENDPOINTS.PAYMENTS.VERIFY,
        {
          paymentId,
          orderId,
          signature,
          bookingId,
        }
      );

      return response.data;
    } catch (error: any) {
      console.error('Verify payment error:', error);
      throw new Error(error.message || 'Failed to verify payment');
    }
  }

  /**
   * Get payment details
   */
  async getPaymentDetails(paymentId: string): Promise<any> {
    try {
      const response = await api.get<{ data: any }>(
        `${API_ENDPOINTS.PAYMENTS.DETAILS}/${paymentId}`
      );

      return response.data;
    } catch (error: any) {
      console.error('Get payment details error:', error);
      throw new Error(error.message || 'Failed to get payment details');
    }
  }

  /**
   * Initiate refund
   */
  async initiateRefund(
    paymentId: string,
    amount: number,
    reason: string
  ): Promise<{ refundId: string; status: string }> {
    try {
      const response = await api.post<{ data: { refundId: string; status: string } }>(
        API_ENDPOINTS.PAYMENTS.REFUND,
        {
          paymentId,
          amount: Math.round(amount * 100), // Convert to paise
          reason,
        }
      );

      return response.data;
    } catch (error: any) {
      console.error('Refund error:', error);
      throw new Error(error.message || 'Failed to initiate refund');
    }
  }
}

export const paymentService = new PaymentService();
