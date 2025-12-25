import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { authOptions } from "@/lib/auth";
import { dbConnect } from "@/lib/db";
import User from "@/models/User";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";

export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/owners/[id]/reset-password
 * Reset property owner password
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Authenticate admin
    const token = await getToken({ req, secret: authOptions.secret });

    if (!token || !['admin', 'super_admin'].includes(token.role as string)) {
      return NextResponse.json(
        { success: false, message: "Unauthorized - Admin access required" },
        { status: 401 }
      );
    }

    await dbConnect();

    const { id } = await params;
    const ownerId = id;

    if (!mongoose.Types.ObjectId.isValid(ownerId)) {
      return NextResponse.json(
        { success: false, message: "Invalid owner ID" },
        { status: 400 }
      );
    }

    const body = await req.json();
    const { newPassword, generateRandom } = body;

    if (!newPassword && !generateRandom) {
      return NextResponse.json(
        { success: false, message: "New password is required or set generateRandom to true" },
        { status: 400 }
      );
    }

    // Check if owner exists
    const owner = await User.findOne({
      _id: ownerId,
      role: 'property_owner'
    });

    if (!owner) {
      return NextResponse.json(
        { success: false, message: "Owner not found" },
        { status: 404 }
      );
    }

    // Generate random password if requested
    let password = newPassword;
    if (generateRandom) {
      // Generate a secure random password
      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*';
      password = Array.from(
        { length: 12 },
        () => chars[Math.floor(Math.random() * chars.length)]
      ).join('');
    }

    if (!password || password.length < 6) {
      return NextResponse.json(
        { success: false, message: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Update password
    await User.findByIdAndUpdate(ownerId, {
      $set: {
        password: hashedPassword,
        updatedAt: new Date()
      }
    });

    return NextResponse.json({
      success: true,
      message: "Password reset successfully",
      // Return plain password only if generated (admin needs to share it)
      ...(generateRandom && { temporaryPassword: password })
    });

  } catch (error) {
    console.error('Error resetting password:', error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to reset password",
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
