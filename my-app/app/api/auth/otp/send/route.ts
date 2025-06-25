// import 'server-only'; // Commented out for Vercel compatibility
import { NextResponse, type NextRequest } from "next/server"
import { connectMongo } from "@/lib/db/mongodb"
import { OtpMethod, OtpPurpose, createAndSendOtp } from "@/lib/auth/otp"
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

    // Use the proper createAndSendOtp function which handles both email and SMS
    const result = await createAndSendOtp(
      purpose as OtpPurpose,
      method as OtpMethod,
      destination,
      undefined, // userId - will be determined in the function
      'User' // default name
    );

    if (!result.success) {
      console.error("Failed to create and send OTP:", result.error);
      return NextResponse.json(
        { 
          error: result.error,
          ...(result.cooldownSeconds && { cooldownSeconds: result.cooldownSeconds })
        }, 
        { status: 400 }
      )
    }

    console.log("OTP send completed successfully");
    return NextResponse.json({
      success: true,
      message: method === 'sms' 
        ? "OTP sent successfully to your phone number" 
        : "OTP sent successfully to your email",
    })
  } catch (error) {
    console.error("Unhandled error in OTP send:", error)
    return NextResponse.json(
      { error: "Failed to send OTP" },
      { status: 500 }
    )
  }
} 