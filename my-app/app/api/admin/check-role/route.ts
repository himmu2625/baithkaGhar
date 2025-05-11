import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db/dbConnect";
import User from "@/models/User";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { getToken } from "next-auth/jwt";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    // Get the current session
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        {
          success: false,
          message: "No authenticated user found",
        },
        { status: 401 }
      );
    }

    // Connect to database
    await dbConnect();

    // Find user in database
    const user = await User.findOne({ email: session.user.email });

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "User not found in database",
          session
        },
        { status: 404 }
      );
    }

    const dbRole = user.role || (user.isAdmin ? "admin" : "user");
    const sessionRole = session.user.role;

    // Check if there's a role mismatch
    const hasRoleMismatch = dbRole !== sessionRole;

    // Check if this is the Baithaka super admin
    const isSuperAdminEmail = user.email === "anuragsingh@baithakaghar.com";
    const shouldBeSuperAdmin = isSuperAdminEmail && dbRole !== "super_admin";
    
    // Fix issues if needed
    if (shouldBeSuperAdmin) {
      user.role = "super_admin";
      user.isAdmin = true;
      await user.save();
    }

    return NextResponse.json({
      success: true,
      message: hasRoleMismatch 
        ? "Role mismatch detected. Please sign out and sign in again." 
        : "Role information is consistent",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        dbRole: dbRole,
        sessionRole: sessionRole,
        isAdmin: user.isAdmin,
        fixed: shouldBeSuperAdmin
      },
      session: session
    });
  } catch (error: any) {
    console.error("Error checking admin role:", error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to check admin role",
      },
      { status: 500 }
    );
  }
} 