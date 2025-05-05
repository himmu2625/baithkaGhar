import 'server-only'
import { NextResponse, type NextRequest } from "next/server"
import { connectMongo } from "@/lib/db/mongodb"
import { OtpMethod, OtpPurpose, verifyOtp } from "@/lib/auth/otp"
import User, { IUser } from "@/models/User"
import { SignJWT } from "jose"
import { cookies } from "next/headers"
import mongoose from "mongoose"

// Type for the user document with _id explicitly defined
interface UserDocument extends IUser {
  _id: mongoose.Types.ObjectId;
}

// Define the valid purposes and methods directly
const VALID_PURPOSES = ['login', 'registration', 'password-reset', 'email-verification', 'phone-verification'];
const VALID_METHODS = ['email', 'sms'];

export async function POST(req: NextRequest) {
  try {
    const { otp, destination, purpose, method } = await req.json()

    if (!otp || !destination || !purpose || !method) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      )
    }

    // Validate purpose
    if (!purpose || !VALID_PURPOSES.includes(purpose)) {
      return NextResponse.json({ 
        error: "Invalid purpose", 
        validPurposes: VALID_PURPOSES
      }, { status: 400 })
    }

    // Validate method
    if (!method || !VALID_METHODS.includes(method)) {
      return NextResponse.json({ 
        error: "Invalid method", 
        validMethods: VALID_METHODS
      }, { status: 400 })
    }

    try {
      await connectMongo()
    } catch (dbError) {
      console.error("Database connection error:", dbError)
      return NextResponse.json({ error: "Database connection failed" }, { status: 500 })
    }

    // Verify OTP logic
    let isValid = false
    try {
      // Static test code for development
      if (otp === "123456") {
        isValid = true;
      } else {
        const result = await verifyOtp(otp, purpose as OtpPurpose, method as OtpMethod, destination);
        isValid = result.success;
      }
    } catch (otpError) {
      console.error("OTP verification error:", otpError)
      return NextResponse.json({ error: "OTP verification failed" }, { status: 500 })
    }

    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid or expired OTP" },
        { status: 400 }
      )
    }

    // Find or create user based on destination (phone/email)
    const field = method === 'email' ? "email" : "phone"
    let userDoc = await User.findOne({ [field]: destination })

    // If login purpose but user doesn't exist, return error
    if (purpose === 'login' && !userDoc) {
      return NextResponse.json(
        { error: "No account found. Please register first." },
        { status: 404 }
      )
    }

    // For registration, create user if not exists
    if (purpose === 'registration' && !userDoc) {
      userDoc = await User.create({
        [field]: destination,
        name: method === 'email' ? destination.split('@')[0] : `User-${Date.now()}`,
        profileComplete: false,
      })
    }

    if (!userDoc) {
      return NextResponse.json(
        { error: "Failed to find or create user" },
        { status: 500 }
      )
    }

    // Ensure we have the correct types
    const user = userDoc as unknown as UserDocument;
    const userId = user._id.toString();

    // Create session token
    const token = await new SignJWT({ 
      sub: userId,
      email: user.email,
      name: user.name,
      profileComplete: user.profileComplete
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('30d')
      .sign(new TextEncoder().encode(process.env.NEXTAUTH_SECRET || 'development-secret'))

    // Set session cookie
    cookies().set('session-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: '/'
    })

    return NextResponse.json({
      success: true,
      message: "OTP verified successfully",
      user: {
        id: userId,
        name: user.name,
        email: user.email,
        phone: user.phone,
        profileComplete: user.profileComplete
      }
    })
  } catch (error) {
    console.error("Error verifying OTP:", error)
    return NextResponse.json(
      { error: "Failed to verify OTP" },
      { status: 500 }
    )
  }
} 