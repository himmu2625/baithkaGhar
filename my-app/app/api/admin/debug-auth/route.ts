import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/db/dbConnect";
import User from "@/models/User";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    // Get the current session
    const session = await auth();
    
    // Connect to database
    await dbConnect();
    
    let user = null;
    let dbRole = null;
    let sessionRole = null;
    
    if (session?.user?.email) {
      user = await User.findOne({ email: session.user.email });
      if (user) {
        dbRole = user.role || (user.isAdmin ? "admin" : "user");
      }
      sessionRole = session.user.role;
    }
    
    const isAdmin = sessionRole === "admin" || sessionRole === "super_admin";
    
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      session: {
        exists: !!session,
        email: session?.user?.email || null,
        role: sessionRole || null,
        authenticated: !!session?.user
      },
      database: {
        userExists: !!user,
        email: user?.email || null,
        role: dbRole || null,
        isAdmin: user?.isAdmin || false
      },
      adminStatus: {
        isAdmin: isAdmin,
        hasValidRole: isAdmin,
        roleMismatch: dbRole !== sessionRole,
        isSuperAdmin: sessionRole === "super_admin" || session?.user?.email === "anuragsingh@baithakaghar.com"
      },
      debug: {
        url: req.url,
        method: req.method,
        hasSession: !!session,
        hasUser: !!user,
        environment: process.env.NODE_ENV
      }
    });
  } catch (error: any) {
    console.error("Debug auth error:", error);
    return NextResponse.json({
      success: false,
      error: error.message || "Debug authentication failed",
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
} 