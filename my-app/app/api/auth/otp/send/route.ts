// import 'server-only'; // Commented out for Vercel compatibility
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
    console.log("OTP send request received");
    const { destination, purpose, method } = await req.json()

    if (!destination) {
      console.error("OTP send failed: Missing destination");
      return NextResponse.json({ error: "Destination is required" }, { status: 400 })
    }

    // Validate purpose
    if (!purpose || !VALID_PURPOSES.includes(purpose)) {
      console.error("OTP send failed: Invalid purpose", { purpose });
      return NextResponse.json({ 
        error: "Invalid purpose", 
        validPurposes: VALID_PURPOSES
      }, { status: 400 })
    }

    // Validate method
    if (!method || !VALID_METHODS.includes(method)) {
      console.error("OTP send failed: Invalid method", { method });
      return NextResponse.json({ 
        error: "Invalid method", 
        validMethods: VALID_METHODS
      }, { status: 400 })
    }

    // Connect to MongoDB
    try {
      console.log("Connecting to MongoDB for OTP send");
      await connectMongo()
      console.log("MongoDB connection successful");
    } catch (error) {
      console.error("MongoDB connection error in OTP send:", error)
      return NextResponse.json({ error: "Database connection failed" }, { status: 500 })
    }

    // For login/verification, check if user exists with given phone/email
    if (purpose === 'login') {
      const field = method === 'email' ? "email" : "phone"
      console.log(`Looking for user with ${field}:`, destination);
      const user = await User.findOne({ [field]: destination })

      if (!user) {
        console.error(`No account found with ${field}:`, destination);
        return NextResponse.json(
          { error: `No account found with this ${field}. Please register first.` },
          { status: 404 }
        )
      }
      console.log("User found for OTP login");
    }

    // Generate a 6-digit OTP
    const otp = generateOtp(6)
    
    // For all environments, use static OTP for easier testing
    const testOtp = "123456"
    console.log("Generated test OTP:", testOtp);

    try {
      // Save OTP to database with proper casting
      console.log("Saving OTP to database");
      await saveOtp({
        destination,
        purpose: purpose as OtpPurpose,
        method: method as OtpMethod,
        otp: testOtp, // Use test OTP instead of random one
        expiresIn: 10 * 60, // 10 minutes
      })
      console.log("OTP saved successfully");
    } catch (error) {
      console.error("Error saving OTP:", error)
      return NextResponse.json({ error: "Failed to create OTP" }, { status: 500 })
    }

    // In production, we would send the OTP via SMS or email here
    // But for testing, we'll just return success and use the test OTP
    console.log("OTP send completed successfully");
    return NextResponse.json({
      success: true,
      message: "OTP sent successfully. For testing use code: 123456",
    })
  } catch (error) {
    console.error("Unhandled error in OTP send:", error)
    return NextResponse.json(
      { error: "Failed to send OTP" },
      { status: 500 }
    )
  }
} 