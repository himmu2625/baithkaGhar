import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db/dbConnect";
import User from "@/models/User";
import { getDefaultPermissions } from "@/config/permissions";

export const dynamic = "force-dynamic";

// This endpoint directly makes anuragsingh@baithakaghar.com a super admin
export async function GET(req: NextRequest) {
  try {
    // Connect to database
    await dbConnect();

    // This is hardcoded for security, so only this specific email can be made super admin
    const SUPER_ADMIN_EMAIL = "anuragsingh@baithakaghar.com";

    // Find the user
    const user = await User.findOne({ email: SUPER_ADMIN_EMAIL });

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: `User with email ${SUPER_ADMIN_EMAIL} not found. Please register first.`,
        },
        { status: 404 }
      );
    }

    // Update the user to make them a super admin
    user.isAdmin = true;
    user.role = "super_admin";
    user.permissions = getDefaultPermissions("super_admin");
    
    await user.save();

    return NextResponse.json({
      success: true,
      message: `Successfully made ${user.name} (${user.email}) a super admin`,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error: any) {
    console.error("Error setting up super admin:", error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to set up super admin",
      },
      { status: 500 }
    );
  }
} 