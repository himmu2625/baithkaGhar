import mongoose, { Schema, Document } from "mongoose"
import { OtpMethod, OtpPurpose } from "@/lib/auth/otp"
import crypto from "crypto"

export interface IOtp extends Document {
  otp: string
  hashedOtp: string
  email?: string
  phone?: string
  purpose: string
  method: string
  userId?: mongoose.Types.ObjectId
  expiresAt: Date
  createdAt: Date
  isUsed: boolean
  verify(otpToVerify: string): Promise<boolean>
}

// Hash an OTP for secure storage
function hashOtp(otp: string): string {
  return crypto
    .createHash('sha256')
    .update(String(otp))
    .digest('hex')
}

// Create the schema with proper validation
const OtpSchema = new Schema<IOtp>(
  {
    otp: { type: String }, // Store plain OTP for testing
    hashedOtp: { type: String, required: true },
    email: { type: String, sparse: true },
    phone: { type: String, sparse: true },
    purpose: { 
      type: String, 
      required: true,
      enum: Object.values(OtpPurpose),
    },
    method: { 
      type: String, 
      required: true,
      enum: Object.values(OtpMethod),
    },
    userId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    expiresAt: { type: Date, required: true },
    isUsed: { type: Boolean, default: false },
  },
  { timestamps: true }
)

// Method to verify OTP
OtpSchema.methods.verify = async function (otpToVerify: string): Promise<boolean> {
  if (this.isUsed) {
    return false
  }

  if (new Date() > this.expiresAt) {
    return false
  }

  const hashedOtpToVerify = hashOtp(otpToVerify)
  const isValid = this.hashedOtp === hashedOtpToVerify

  if (isValid) {
    this.isUsed = true
    await this.save()
  }

  return isValid
}

// Add indexes for efficient lookups
OtpSchema.index({ email: 1, purpose: 1, isUsed: 1 })
OtpSchema.index({ phone: 1, purpose: 1, isUsed: 1 })
// TTL index for automatic deletion of expired OTPs
OtpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 })

/**
 * Safe initialization for both ESM and CommonJS
 */
const Otp = mongoose.models.Otp || mongoose.model<IOtp>("Otp", OtpSchema)

export default Otp 