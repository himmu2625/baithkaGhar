// import 'server-only'; // Commented out for Vercel compatibility
import { NextResponse, type NextRequest } from "next/server"
import { connectMongo } from "@/lib/db/mongodb"
import { OtpMethod, OtpPurpose, verifyOtp } from "@/lib/auth/otp"
import User from "@/models/User"
import jwt from "jsonwebtoken"

// Define the valid purposes and methods directly
const VALID_PURPOSES = ['login', 'registration', 'password-reset', 'email-verification', 'phone-verification'];
const VALID_METHODS = ['email', 'sms'];

export async function POST(req: NextRequest) {
  try {
    console.log("OTP verification request received");
    const { otp, destination, purpose, method } = await req.json()

    if (!otp || !destination || !purpose || !method) {
      console.error("OTP verification failed: Missing required fields", { otp: !!otp, destination: !!destination, purpose, method });
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      )
    }

    // Validate purpose
    if (!purpose || !VALID_PURPOSES.includes(purpose)) {
      console.error("OTP verification failed: Invalid purpose", { purpose });
      return NextResponse.json({ 
        error: "Invalid purpose", 
        validPurposes: VALID_PURPOSES
      }, { status: 400 })
    }

    // Validate method
    if (!method || !VALID_METHODS.includes(method)) {
      console.error("OTP verification failed: Invalid method", { method });
      return NextResponse.json({ 
        error: "Invalid method", 
        validMethods: VALID_METHODS
      }, { status: 400 })
    }

    try {
      console.log("Connecting to MongoDB for OTP verification");
      await connectMongo()
      console.log("MongoDB connection successful");
    } catch (dbError) {
      console.error("Database connection error in OTP verification:", dbError)
      return NextResponse.json({ error: "Database connection failed" }, { status: 500 })
    }

    // Verify OTP logic
    let isValid = false
    try {
      console.log("Attempting to verify OTP", { purpose, method, destination });
      const result = await verifyOtp(otp, purpose as OtpPurpose, method as OtpMethod, destination);
      isValid = result.success;
      console.log("OTP verification result:", result);
    } catch (otpError) {
      console.error("OTP verification error:", otpError)
      return NextResponse.json({ error: "OTP verification failed" }, { status: 500 })
    }

    if (!isValid) {
      console.error("Invalid or expired OTP provided");
      return NextResponse.json(
        { error: "Invalid or expired OTP" },
        { status: 400 }
      )
    }

    // Find or create user based on destination (phone/email)
    const field = method === 'email' ? "email" : "phone"
    console.log(`Looking for user with ${field}:`, destination);
    let userDoc = await User.findOne({ [field]: destination })

    // If login purpose but user doesn't exist, return error
    if (purpose === 'login' && !userDoc) {
      console.error("No account found for login attempt");
      return NextResponse.json(
        { error: "No account found. Please register first." },
        { status: 404 }
      )
    }

    // For registration, create user if not exists
    if (purpose === 'registration' && !userDoc) {
      console.log("Creating new user account during registration");
      userDoc = await User.create({
        [field]: destination,
        name: method === 'email' ? destination.split('@')[0] : `User-${Date.now()}`,
        profileComplete: false,
      })
    }

    if (!userDoc) {
      console.error("Failed to find or create user");
      return NextResponse.json(
        { error: "Failed to find or create user" },
        { status: 500 }
      )
    }

    // Generate a JWT token for the authenticated user
    const token = jwt.sign(
      { 
        userId: userDoc._id, 
        email: userDoc.email, 
        phone: userDoc.phone 
      },
      process.env.NEXTAUTH_SECRET || 'default-secret',
      { expiresIn: '7d' }
    )

    console.log("OTP verification successful, user authenticated");
    return NextResponse.json({
      success: true,
      message: "OTP verified successfully",
      user: {
        id: userDoc._id,
        name: userDoc.name,
        email: userDoc.email,
        phone: userDoc.phone,
        profileComplete: userDoc.profileComplete,
      },
      token,
    })
  } catch (error) {
    console.error("Unhandled error in OTP verification:", error)
    return NextResponse.json(
      { error: "OTP verification failed" },
      { status: 500 }
    )
  }
} 