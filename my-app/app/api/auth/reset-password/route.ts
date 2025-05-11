import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import User from "@/models/User";
import { OtpMethod, OtpPurpose, verifyOtp } from "@/lib/auth/otp";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, otp, newPassword, isAdmin = false } = body;

    // Validate required fields
    if (!email || !otp || !newPassword) {
      return NextResponse.json(
        { success: false, message: "Email, OTP, and new password are required" },
        { status: 400 }
      );
    }

    // Validate password strength
    if (newPassword.length < 8) {
      return NextResponse.json(
        { success: false, message: "Password must be at least 8 characters long" },
        { status: 400 }
      );
    }

    // Connect to database
    await dbConnect();

    // Verify OTP
    const otpVerification = await verifyOtp(
      otp,
      OtpPurpose.PASSWORD_RESET,
      OtpMethod.EMAIL,
      email
    );

    if (!otpVerification.success) {
      return NextResponse.json(
        { success: false, message: otpVerification.error || "Invalid or expired code" },
        { status: 400 }
      );
    }

    // Find user by email and admin status
    const query = isAdmin 
      ? { email: email.toLowerCase(), isAdmin: true } 
      : { email: email.toLowerCase() };
      
    const user = await User.findOne(query);
    
    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update user's password
    user.password = hashedPassword;
    await user.save();

    return NextResponse.json({
      success: true,
      message: "Password has been reset successfully",
    });
  } catch (error: any) {
    console.error("Password reset error:", error);
    return NextResponse.json(
      { success: false, message: "An error occurred while resetting your password" },
      { status: 500 }
    );
  }
} 