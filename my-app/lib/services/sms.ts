import 'server-only';
import axios from 'axios';

// SMS service configuration
const SMS_API_KEY = process.env.SMS_API_KEY;
const SMS_API_URL = process.env.SMS_API_URL || 'https://api.textlocal.in/send/';
const SMS_SENDER = process.env.SMS_SENDER || 'BTHKGR';

/**
 * Send SMS using a third-party SMS service
 * This implementation uses TextLocal but can be replaced with any other SMS provider
 */
export async function sendSms({
  to,
  message,
}: {
  to: string;
  message: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    // Check if SMS configuration exists
    if (!SMS_API_KEY) {
      console.error('SMS API key missing');
      return { success: false, error: 'SMS configuration missing' };
    }
    
    // Clean up the phone number
    const cleanPhone = to.replace(/\D/g, '');
    
    // For India, ensure phone number has proper country code
    const phoneWithCode = cleanPhone.startsWith('91') 
      ? cleanPhone 
      : `91${cleanPhone}`;
    
    // Prepare the request payload
    const payload = new URLSearchParams();
    payload.append('apikey', SMS_API_KEY);
    payload.append('numbers', phoneWithCode);
    payload.append('message', message);
    payload.append('sender', SMS_SENDER);
    
    // Send the SMS
    const response = await axios.post(SMS_API_URL, payload);
    
    // Check response
    if (response.data && response.data.status === 'success') {
      console.log('SMS sent successfully', response.data);
      return { success: true };
    } else {
      console.error('SMS API returned error:', response.data);
      return { 
        success: false, 
        error: response.data?.errors?.[0] || 'Failed to send SMS' 
      };
    }
  } catch (error: any) {
    console.error('Error sending SMS:', error);
    return { 
      success: false, 
      error: error.message || 'Failed to send SMS'
    };
  }
}

/**
 * Send OTP via SMS
 */
export async function sendOtpSms({
  to,
  otp,
}: {
  to: string;
  otp: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    // Compose the OTP message
    const message = `${otp} is your verification code for Baithaka Ghar. Valid for 5 minutes. Do not share this with anyone.`;
    
    // Send the SMS
    return sendSms({
      to,
      message,
    });
  } catch (error: any) {
    console.error('Error sending OTP SMS:', error);
    return { 
      success: false, 
      error: error.message || 'Failed to send OTP SMS'
    };
  }
}

/**
 * Send booking confirmation SMS
 */
export async function sendBookingConfirmationSms({
  to,
  bookingId,
  propertyName,
  checkInDate,
}: {
  to: string;
  bookingId: string;
  propertyName: string;
  checkInDate: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    // Compose the booking confirmation message
    const message = `Your booking (ID: ${bookingId}) at ${propertyName} is confirmed for ${checkInDate}. Check your email for details or login to view.`;
    
    // Send the SMS
    return sendSms({
      to,
      message,
    });
  } catch (error: any) {
    console.error('Error sending booking confirmation SMS:', error);
    return { 
      success: false, 
      error: error.message || 'Failed to send booking confirmation SMS'
    };
  }
}

/**
 * Send payment confirmation SMS
 */
export async function sendPaymentConfirmationSms({
  to,
  amount,
  orderId,
}: {
  to: string;
  amount: number;
  orderId: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    // Format amount with commas for Indian currency format
    const formattedAmount = amount.toLocaleString('en-IN');
    
    // Compose the payment confirmation message
    const message = `Payment of Rs.${formattedAmount} received for order #${orderId}. Thank you for choosing Baithaka Ghar.`;
    
    // Send the SMS
    return sendSms({
      to,
      message,
    });
  } catch (error: any) {
    console.error('Error sending payment confirmation SMS:', error);
    return { 
      success: false, 
      error: error.message || 'Failed to send payment confirmation SMS'
    };
  }
} 