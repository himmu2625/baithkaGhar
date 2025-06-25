// import 'server-only'; // Commented out for Vercel compatibility
import axios from 'axios';

// SMS service configuration for Twilio
const SMS_API_KEY = process.env.TWILIO_AUTH_TOKEN;
const SMS_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const SMS_FROM_NUMBER = process.env.TWILIO_PHONE_NUMBER;

// Alternative: MSG91 configuration (popular in India)
const MSG91_API_KEY = process.env.MSG91_API_KEY;
const MSG91_SENDER_ID = process.env.MSG91_SENDER_ID || 'BTHKGR';

// Alternative: Fast2SMS configuration (Indian provider)
const FAST2SMS_API_KEY = process.env.FAST2SMS_API_KEY;

/**
 * Send SMS using Twilio (Recommended - Global coverage)
 */
export async function sendSmsViaTwilio({
  to,
  message,
}: {
  to: string;
  message: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    if (!SMS_API_KEY || !SMS_ACCOUNT_SID || !SMS_FROM_NUMBER) {
      console.error('Twilio configuration missing');
      return { success: false, error: 'SMS configuration missing' };
    }

    // Clean up the phone number and ensure proper format
    const cleanPhone = to.replace(/\D/g, '');
    const phoneWithCode = cleanPhone.startsWith('91') 
      ? `+${cleanPhone}` 
      : `+91${cleanPhone}`;

    // Twilio API endpoint
    const url = `https://api.twilio.com/2010-04-01/Accounts/${SMS_ACCOUNT_SID}/Messages.json`;

    // Create form data
    const data = new URLSearchParams();
    data.append('To', phoneWithCode);
    data.append('From', SMS_FROM_NUMBER);
    data.append('Body', message);

    // Send SMS via Twilio
    const response = await axios.post(url, data, {
      auth: {
        username: SMS_ACCOUNT_SID,
        password: SMS_API_KEY,
      },
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    if (response.status === 201) {
      console.log('SMS sent successfully via Twilio', response.data);
      return { success: true };
    } else {
      console.error('Twilio API returned error:', response.data);
      return { 
        success: false, 
        error: 'Failed to send SMS' 
      };
    }
  } catch (error: any) {
    console.error('Error sending SMS via Twilio:', error);
    return { 
      success: false, 
      error: error.response?.data?.message || error.message || 'Failed to send SMS'
    };
  }
}

/**
 * Send SMS using MSG91 (Alternative - Good for India)
 */
export async function sendSmsViaMSG91({
  to,
  message,
}: {
  to: string;
  message: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    if (!MSG91_API_KEY) {
      console.error('MSG91 API key missing');
      return { success: false, error: 'SMS configuration missing' };
    }

    const cleanPhone = to.replace(/\D/g, '');
    const phoneWithCode = cleanPhone.startsWith('91') 
      ? cleanPhone 
      : `91${cleanPhone}`;

    const url = 'https://api.msg91.com/api/v5/flow/';
    
    const payload = {
      template_id: process.env.MSG91_TEMPLATE_ID, // You'll need to create a template
      short_url: '0',
      realTimeResponse: '1',
      recipients: [{
        mobiles: phoneWithCode,
        message: message
      }]
    };

    const response = await axios.post(url, payload, {
      headers: {
        'authkey': MSG91_API_KEY,
        'Content-Type': 'application/json',
      },
    });

    if (response.data.type === 'success') {
      console.log('SMS sent successfully via MSG91', response.data);
      return { success: true };
    } else {
      console.error('MSG91 API returned error:', response.data);
      return { 
        success: false, 
        error: response.data.message || 'Failed to send SMS' 
      };
    }
  } catch (error: any) {
    console.error('Error sending SMS via MSG91:', error);
    return { 
      success: false, 
      error: error.response?.data?.message || error.message || 'Failed to send SMS'
    };
  }
}

/**
 * Send SMS using Fast2SMS (Alternative - Indian provider)
 */
export async function sendSmsViaFast2SMS({
  to,
  message,
}: {
  to: string;
  message: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    if (!FAST2SMS_API_KEY) {
      console.error('Fast2SMS API key missing');
      return { success: false, error: 'SMS configuration missing' };
    }

    const cleanPhone = to.replace(/\D/g, '');
    
    const url = 'https://www.fast2sms.com/dev/bulkV2';
    
    const payload = {
      authorization: FAST2SMS_API_KEY,
      message: message,
      numbers: cleanPhone,
      route: 'dlt', // or 'q' for promotional
      sender_id: process.env.FAST2SMS_SENDER_ID || 'FSTSMS'
    };

    const response = await axios.post(url, payload, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (response.data.return === true) {
      console.log('SMS sent successfully via Fast2SMS', response.data);
      return { success: true };
    } else {
      console.error('Fast2SMS API returned error:', response.data);
      return { 
        success: false, 
        error: response.data.message || 'Failed to send SMS' 
      };
    }
  } catch (error: any) {
    console.error('Error sending SMS via Fast2SMS:', error);
    return { 
      success: false, 
      error: error.response?.data?.message || error.message || 'Failed to send SMS'
    };
  }
}

/**
 * Main SMS function - tries multiple providers for reliability
 */
export async function sendSms({
  to,
  message,
}: {
  to: string;
  message: string;
}): Promise<{ success: boolean; error?: string }> {
  // Try Twilio first (most reliable)
  if (SMS_API_KEY && SMS_ACCOUNT_SID && SMS_FROM_NUMBER) {
    const twilioResult = await sendSmsViaTwilio({ to, message });
    if (twilioResult.success) {
      return twilioResult;
    }
    console.log('Twilio failed, trying MSG91...');
  }

  // Fallback to MSG91 if Twilio fails
  if (MSG91_API_KEY) {
    const msg91Result = await sendSmsViaMSG91({ to, message });
    if (msg91Result.success) {
      return msg91Result;
    }
    console.log('MSG91 failed, trying Fast2SMS...');
  }

  // Fallback to Fast2SMS if others fail
  if (FAST2SMS_API_KEY) {
    const fast2smsResult = await sendSmsViaFast2SMS({ to, message });
    if (fast2smsResult.success) {
      return fast2smsResult;
    }
  }

  return { 
    success: false, 
    error: 'All SMS providers failed. Please check your configuration.' 
  };
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