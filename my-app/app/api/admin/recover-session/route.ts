import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectMongo } from "@/lib/db/mongodb";
import User from "@/models/User";
import { cookies } from "next/headers";

export const dynamic = 'force-dynamic';

/**
 * Admin Session Recovery Endpoint
 * This endpoint helps recover admin access when there are session issues
 */
export async function POST(req: NextRequest) {
  try {
    const { email, forceRefresh } = await req.json();
    
    if (!email) {
      return NextResponse.json({
        success: false,
        message: "Email is required"
      }, { status: 400 });
    }
    
    // Connect to database
    await connectMongo();
    
    // Find the user
    const user = await User.findOne({ email });
    
    if (!user) {
      return NextResponse.json({
        success: false,
        message: "User not found"
      }, { status: 404 });
    }
    
    // Check if user should have admin privileges
    const isAdminUser = user.role === 'admin' || 
                       user.role === 'super_admin' || 
                       user.isAdmin ||
                       email === 'anuragsingh@baithakaghar.com';
    
    if (!isAdminUser) {
      return NextResponse.json({
        success: false,
        message: "User does not have admin privileges"
      }, { status: 403 });
    }
    
    // Fix role issues if needed
    let roleFixed = false;
    if (email === 'anuragsingh@baithakaghar.com' && user.role !== 'super_admin') {
      user.role = 'super_admin';
      user.isAdmin = true;
      await user.save();
      roleFixed = true;
    } else if (!user.role && user.isAdmin) {
      user.role = 'admin';
      await user.save();
      roleFixed = true;
    }
    
    // If forceRefresh is requested, clear existing auth cookies
    if (forceRefresh) {
      const cookieStore = await cookies();
      
      // Clear NextAuth cookies
      const cookiesToClear = [
        'next-auth.session-token',
        'next-auth.callback-url',
        'next-auth.csrf-token',
        '__Secure-next-auth.session-token', // Secure cookie variant
        '__Host-next-auth.csrf-token' // Host cookie variant
      ];
      
      cookiesToClear.forEach(cookieName => {
        try {
          cookieStore.delete(cookieName);
        } catch (error) {
          console.log(`Could not clear cookie: ${cookieName}`);
        }
      });
    }
    
    return NextResponse.json({
      success: true,
      message: "Session recovery initiated",
      data: {
        userFound: true,
        isAdmin: isAdminUser,
        roleFixed: roleFixed,
        currentRole: user.role,
        nextSteps: [
          "Sign out completely",
          "Clear browser cache and cookies for this site",
          "Sign in again with your admin credentials",
          "If issues persist, contact technical support"
        ]
      }
    });
    
  } catch (error) {
    console.error("Session recovery error:", error);
    return NextResponse.json({
      success: false,
      message: "Failed to recover session",
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  // Provide instructions for session recovery
  return NextResponse.json({
    message: "Admin Session Recovery Endpoint",
    usage: "POST request with { email: 'admin@example.com', forceRefresh: true }",
    description: "This endpoint helps recover admin access when there are session issues",
    steps: [
      "1. POST your admin email to this endpoint",
      "2. Follow the provided next steps",
      "3. Clear all browser data for this site",
      "4. Sign in again with admin credentials"
    ]
  });
} 