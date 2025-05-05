import 'server-only';
import * as crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { dbConnect } from '../db';
import mongoose from 'mongoose';
import { sendOtpEmail } from '../services/email';
import { sendOtpSms } from '../services/sms';

// Lazy-load the Otp model to avoid circular dependencies
let OtpModel: any = null;

// Ensure we're not running this on the client
const isServer = typeof window === 'undefined';

/**
 * Interface for OTP document (defined here to avoid circular imports)
 */
interface IOtp {
  otp: string;
  hashedOtp: string;
  email?: string;
  phone?: string;
  purpose: string;
  method: string;
  userId?: mongoose.Types.ObjectId;
  expiresAt: Date;
  createdAt: Date;
  isUsed: boolean;
}

/**
 * Get the Otp model (lazy-loaded)
 */
async function getOtpModel() {
  if (!OtpModel) {
    await dbConnect();
    try {
      // Try to get the model from mongoose if already registered
      OtpModel = mongoose.model('Otp');
    } catch (error) {
      // If not registered, define the schema and create the model
      const OtpSchema = new mongoose.Schema<IOtp>({
        otp: { type: String },
        hashedOtp: { type: String, required: true },
        email: { type: String, sparse: true },
        phone: { type: String, sparse: true },
        purpose: { type: String, required: true },
        method: { type: String, required: true },
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
        expiresAt: { type: Date, required: true, index: true },
        isUsed: { type: Boolean, default: false },
      }, { timestamps: true });
      
      // Add indexes for efficient lookups
      OtpSchema.index({ email: 1, purpose: 1, isUsed: 1 });
      OtpSchema.index({ phone: 1, purpose: 1, isUsed: 1 });
      
      OtpModel = mongoose.model<IOtp>('Otp', OtpSchema);
    }
  }
  return OtpModel;
}

/**
 * OTP (One-Time Password) generation and verification
 */

// OTP types
export enum OtpPurpose {
  LOGIN = 'login',
  REGISTRATION = 'registration',
  PASSWORD_RESET = 'password-reset',
  EMAIL_VERIFICATION = 'email-verification',
  PHONE_VERIFICATION = 'phone-verification',
}

// OTP methods
export enum OtpMethod {
  EMAIL = 'email',
  SMS = 'sms',
}

// OTP expiration times (in minutes)
const OTP_EXPIRY_MINUTES: Record<OtpPurpose, number> = {
  [OtpPurpose.LOGIN]: 5,
  [OtpPurpose.REGISTRATION]: 30,
  [OtpPurpose.PASSWORD_RESET]: 30,
  [OtpPurpose.EMAIL_VERIFICATION]: 60,
  [OtpPurpose.PHONE_VERIFICATION]: 5,
}

/**
 * Generate a random OTP
 * @param length - Length of the OTP to generate (default: 6)
 * @returns A randomly generated OTP
 */
export function generateOtp(length: number = 6): string {
  const digits = '0123456789';
  let otp = '';
  for (let i = 0; i < length; i++) {
    otp += digits[Math.floor(Math.random() * 10)];
  }
  return otp;
}

/**
 * Hash an OTP for secure storage
 * @param otp - The OTP to hash
 * @returns Hashed OTP
 */
export function hashOtp(otp: string): string {
  return crypto
    .createHash('sha256')
    .update(String(otp))
    .digest('hex');
}

/**
 * Save an OTP to the database
 * @param options - Options for saving OTP
 * @returns Promise that resolves when OTP is saved
 */
export async function saveOtp({
  destination,
  purpose,
  method,
  otp,
  expiresIn = 10 * 60, // Default 10 minutes
  userId,
}: {
  destination: string;
  purpose: OtpPurpose;
  method: OtpMethod;
  otp: string;
  expiresIn?: number;
  userId?: string;
}): Promise<void> {
  await dbConnect();
  const Otp = await getOtpModel();

  // Mark any existing unused OTPs for this purpose and destination as used
  const query = method === OtpMethod.EMAIL
    ? { email: destination, purpose, isUsed: false }
    : { phone: destination, purpose, isUsed: false };

  await Otp.updateMany(query, { isUsed: true });

  // Hash the OTP
  const hashedOtp = hashOtp(otp);
  
  // Set expiration time
  const expiresAt = new Date();
  expiresAt.setSeconds(expiresAt.getSeconds() + expiresIn);
  
  // Create OTP record
  const otpData: Partial<IOtp> = {
    otp, // Will not be returned in queries
    hashedOtp,
    purpose,
    method,
    expiresAt,
  };
  
  // Add destination and optional user ID
  if (method === OtpMethod.EMAIL) {
    otpData.email = destination;
  } else {
    otpData.phone = destination;
  }
  
  if (userId) {
    otpData.userId = new mongoose.Types.ObjectId(userId);
  }
  
  // Save to database
  await Otp.create(otpData);
}

/**
 * Create and send an OTP via email or SMS
 * @param purpose - The purpose of the OTP
 * @param method - The method to send the OTP
 * @param destination - Email address or phone number
 * @param userId - Optional user ID
 * @param name - Recipient name for personalized messages
 * @returns Success status and optional error message
 */
export async function createAndSendOtp(
  purpose: OtpPurpose,
  method: OtpMethod,
  destination: string,
  userId?: string,
  name: string = 'User'
): Promise<{ success: boolean; error?: string; cooldownSeconds?: number }> {
  if (!isServer) {
    console.error('OTP functions must be called from the server');
    return { success: false, error: 'OTP functions must be called from the server' };
  }

  try {
    await dbConnect();
    const Otp = await getOtpModel();

    // Check for existing recent OTPs to prevent spam/abuse
    // Find the most recent OTP for this destination and purpose
    const query = method === OtpMethod.EMAIL
      ? { email: destination, purpose, isUsed: false }
      : { phone: destination, purpose, isUsed: false };
    
    const existingOtp = await Otp.findOne(query).sort({ createdAt: -1 });
    
    // If there's a recent OTP sent within the last 30 seconds, enforce cooldown
    if (existingOtp) {
      const now = new Date();
      const otpCreatedAt = new Date(existingOtp.createdAt);
      const secondsSinceLastOtp = Math.floor((now.getTime() - otpCreatedAt.getTime()) / 1000);
      
      // 30-second cooldown
      if (secondsSinceLastOtp < 30) {
        const remainingCooldown = 30 - secondsSinceLastOtp;
        return { 
          success: false, 
          error: `Please wait ${remainingCooldown} seconds before requesting another OTP`,
          cooldownSeconds: remainingCooldown
        };
      }
    }

    // Generate new OTP
    const newOtp = generateOtp();
    
    // Set expiration time
    const expiryMinutes = OTP_EXPIRY_MINUTES[purpose] || 5; // Default to 5 minutes
    const expirySeconds = expiryMinutes * 60;
    
    // Save OTP to database
    await saveOtp({
      destination,
      purpose,
      method,
      otp: newOtp,
      expiresIn: expirySeconds,
      userId
    });
    
    // Send OTP
    if (method === OtpMethod.EMAIL) {
      const emailSent = await sendOtpEmail({
        to: destination,
        name,
        otp: newOtp,
      });
      
      if (!emailSent) {
        return { success: false, error: 'Failed to send OTP email' };
      }
    } else {
      const smsSent = await sendOtpSms({
        to: destination,
        otp: newOtp,
      });
      
      if (!smsSent.success) {
        return { success: false, error: smsSent.error || 'Failed to send OTP SMS' };
      }
    }
    
    return { success: true };
  } catch (error: any) {
    console.error('Error creating and sending OTP:', error);
    return { success: false, error: error.message || 'An error occurred while processing OTP' };
  }
}

/**
 * Verify an OTP
 * @param otp - The OTP to verify
 * @param purpose - The purpose of the OTP
 * @param method - The method of the OTP
 * @param destination - Email or phone number
 * @returns Success status, userId if available, and optional error message
 */
export async function verifyOtp(
  otp: string,
  purpose: OtpPurpose,
  method: OtpMethod,
  destination: string
): Promise<{ success: boolean; userId?: string; error?: string }> {
  if (!isServer) {
    return { success: false, error: 'OTP verification must be done on the server' };
  }

  try {
    await dbConnect();
    const Otp = await getOtpModel();

    // Find the most recent unexpired, unused OTP for this destination and purpose
    const query: any = method === OtpMethod.EMAIL
      ? { email: destination, purpose, isUsed: false }
      : { phone: destination, purpose, isUsed: false };
    
    // Add expiration check
    const now = new Date();
    query.expiresAt = { $gt: now };
    
    const otpRecord = await Otp.findOne(query).sort({ createdAt: -1 });
    
    if (!otpRecord) {
      return { success: false, error: 'OTP is invalid or expired' };
    }
    
    // Check the OTP
    const isValid = otpRecord.otp === otp || hashOtp(otp) === otpRecord.hashedOtp;
    
    if (!isValid) {
      return { success: false, error: 'Incorrect OTP' };
    }
    
    // Mark OTP as used
    otpRecord.isUsed = true;
    await otpRecord.save();
    
    // Return userId if available
    if (otpRecord.userId) {
      return { success: true, userId: otpRecord.userId.toString() };
    }
    
    return { success: true };
  } catch (error: any) {
    console.error('Error verifying OTP:', error);
    return { success: false, error: error.message || 'An error occurred while verifying OTP' };
  }
}

/**
 * Check if a user is in OTP cooldown period
 * @param method - The OTP method (email or SMS)
 * @param destination - Email address or phone number
 * @param purpose - The purpose of the OTP
 * @returns Remaining cooldown in seconds or 0 if no cooldown
 */
export async function getOtpCooldown(
  method: OtpMethod,
  destination: string,
  purpose: OtpPurpose
): Promise<number> {
  if (!isServer) {
    console.error('OTP functions must be called from the server');
    return 0;
  }

  try {
    await dbConnect();
    const Otp = await getOtpModel();
    
    const query = method === OtpMethod.EMAIL
      ? { email: destination, purpose, isUsed: false }
      : { phone: destination, purpose, isUsed: false };
    
    const otpRecord = await Otp.findOne(query).sort({ createdAt: -1 });
    
    if (!otpRecord) {
      return 0;
    }
    
    const now = new Date();
    const otpCreatedAt = new Date(otpRecord.createdAt);
    const secondsSinceLastOtp = Math.floor((now.getTime() - otpCreatedAt.getTime()) / 1000);
    
    // 30-second cooldown
    if (secondsSinceLastOtp < 30) {
      return 30 - secondsSinceLastOtp;
    }
    
    return 0;
  } catch (error) {
    console.error('Error checking OTP cooldown:', error);
    return 0;
  }
}

// Convenience functions for specific OTP use cases

/**
 * Send a login OTP via email
 * @param email - Email address
 * @param name - User's name
 * @returns Success status and optional error message
 */
export async function sendLoginOtp(
  email: string,
  name: string
): Promise<{ success: boolean; error?: string; cooldownSeconds?: number }> {
  return createAndSendOtp(
    OtpPurpose.LOGIN,
    OtpMethod.EMAIL,
    email,
    undefined,
    name
  );
}

/**
 * Send a login OTP via SMS
 * @param phone - Phone number
 * @param name - User's name
 * @returns Success status and optional error message
 */
export async function sendPhoneLoginOtp(
  phone: string,
  name: string = 'User'
): Promise<{ success: boolean; error?: string; cooldownSeconds?: number }> {
  return createAndSendOtp(
    OtpPurpose.LOGIN,
    OtpMethod.SMS,
    phone,
    undefined,
    name
  );
}

/**
 * Send a phone verification OTP
 * @param phone - Phone number
 * @param userId - User ID
 * @returns Success status and optional error message
 */
export async function sendPhoneVerificationOtp(
  phone: string,
  userId: string
): Promise<{ success: boolean; error?: string; cooldownSeconds?: number }> {
  return createAndSendOtp(
    OtpPurpose.PHONE_VERIFICATION,
    OtpMethod.SMS,
    phone,
    userId
  );
}

/**
 * Send an email verification OTP
 * @param email - Email address
 * @param userId - User ID
 * @param name - User's name
 * @returns Success status and optional error message
 */
export async function sendEmailVerificationOtp(
  email: string,
  userId: string,
  name: string
): Promise<{ success: boolean; error?: string; cooldownSeconds?: number }> {
  return createAndSendOtp(
    OtpPurpose.EMAIL_VERIFICATION,
    OtpMethod.EMAIL,
    email,
    userId,
    name
  );
}

/**
 * Send a password reset OTP
 * @param email - Email address
 * @param name - User's name
 * @returns Success status and optional error message
 */
export async function sendPasswordResetOtp(
  email: string,
  name: string
): Promise<{ success: boolean; error?: string; cooldownSeconds?: number }> {
  return createAndSendOtp(
    OtpPurpose.PASSWORD_RESET,
    OtpMethod.EMAIL,
    email,
    undefined,
    name
  );
} 