import 'server-only'
import { NextResponse, type NextRequest } from "next/server"
import { connectMongo } from "@/lib/db/mongodb"
import { OtpMethod, OtpPurpose, generateOtp, saveOtp } from "@/lib/auth/otp"
import User from "@/models/User"

// Cooldown time in seconds
const OTP_COOLDOWN = 60

// Define the valid purposes and methods directly
const VALID_PURPOSES = ['login', 'registration', 'password-reset', 'email-verification', 'phone-verification'];
const VALID_METHODS = ['email', 'sms'];

export async function POST(req: NextRequest) {
  try {
    const { destination, purpose, method } = await req.json()

    if (!destination) {
      return NextResponse.json({ error: "Destination is required" }, { status: 400 })
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

    // Connect to MongoDB
    try {
      await connectMongo()
    } catch (error) {
      console.error("MongoDB connection error:", error)
      return NextResponse.json({ error: "Database connection failed" }, { status: 500 })
    }

    // For login/verification, check if user exists with given phone/email
    if (purpose === 'login') {
      const field = method === 'email' ? "email" : "phone"
      const user = await User.findOne({ [field]: destination })

      if (!user) {
        return NextResponse.json(
          { error: `No account found with this ${field}. Please register first.` },
          { status: 404 }
        )
      }
    }

    // Generate a 6-digit OTP
    const otp = generateOtp(6)
    
    // For testing, always use this static OTP
    const testOtp = "123456"

    try {
      // Save OTP to database with proper casting
      await saveOtp({
        destination,
        purpose: purpose as OtpPurpose,
        method: method as OtpMethod,
        otp: testOtp, // Use test OTP instead of random one
        expiresIn: 10 * 60, // 10 minutes
      })
    } catch (error) {
      console.error("Error saving OTP:", error)
      return NextResponse.json({ error: "Failed to create OTP" }, { status: 500 })
    }

    // In production, we would send the OTP via SMS or email here
    // But for testing, we'll just return success and use the test OTP

    return NextResponse.json({
      success: true,
      message: "OTP sent successfully. For testing use code: 123456",
    })
  } catch (error) {
    console.error("Error sending OTP:", error)
    return NextResponse.json(
      { error: "Failed to send OTP" },
      { status: 500 }
    )
  }
} 