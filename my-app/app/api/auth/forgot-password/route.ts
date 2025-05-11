import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import User from "@/models/User";
import { OtpMethod, OtpPurpose, sendPasswordResetOtp } from "@/lib/auth/otp";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, isAdmin = false } = body;

    if (!email) {
      return NextResponse.json(
        { success: false, message: "Email is required" },
        { status: 400 }
      );
    }

    // Connect to database
    await dbConnect();

    // Check if user exists
    const query = isAdmin 
      ? { email: email.toLowerCase(), isAdmin: true } 
      : { email: email.toLowerCase() };
    
    const user = await User.findOne(query);

    // For security reasons, always return success even if user doesn't exist
    // This prevents email enumeration attacks
    if (!user) {
      return NextResponse.json({
        success: true,
        message: "If your email is registered, you will receive a password reset code",
      });
    }

    // Send password reset OTP
    const result = await sendPasswordResetOtp(email, user.name);

    if (!result.success) {
      console.error("Failed to send password reset OTP:", result.error);
      
      // If there's a cooldown, inform the user
      if (result.cooldownSeconds) {
        return NextResponse.json(
          { 
            success: false, 
            message: `Please wait ${result.cooldownSeconds} seconds before requesting another code`,
            cooldownSeconds: result.cooldownSeconds
          },
          { status: 429 }
        );
      }
      
      return NextResponse.json(
        { success: false, message: "Failed to send password reset code" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Password reset code has been sent to your email",
    });
  } catch (error: any) {
    console.error("Forgot password error:", error);
    return NextResponse.json(
      { success: false, message: "An error occurred" },
      { status: 500 }
    );
  }
} 