import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { cookies } from "next/headers";
import { auth } from "@/lib/auth";
import { connectMongo } from "@/lib/db/mongodb";
import User from "@/models/User";

export const dynamic = 'force-dynamic';

/**
 * Endpoint to force session update
 * This is a safer approach to refresh session state without logging out the user
 */
export async function POST(request: NextRequest) {
  try {
    // Get the current session using auth() function
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: "Not authenticated" },
        { status: 401 }
      );
    }
    
    // Get the token
    const token = await getToken({ 
      req: request, 
      secret: process.env.NEXTAUTH_SECRET as string,
    });
    
    if (!token) {
      return NextResponse.json(
        { success: false, message: "Token not found" },
        { status: 400 }
      );
    }
    
    // Check the database for current user state
    await connectMongo();
    const user = await User.findById(session.user.id);
    
    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found in database" },
        { status: 404 }
      );
    }
    
    // Update profileComplete in database if needed
    const needsUpdate = user.profileComplete !== true;
    
    if (needsUpdate) {
      await User.findByIdAndUpdate(
        session.user.id,
        { profileComplete: true, updatedAt: new Date() },
        { new: true }
      );
      console.log(`Updated profileComplete in database for user ${session.user.id}`);
    }
    
    // We do NOT try to manipulate cookie tokens directly as this is unreliable
    // Instead, we just return the updated user information
    
    // Create a response with updated session data
    const response = NextResponse.json({
      success: true,
      message: "User data updated in database",
      user: {
        ...session.user,
        profileComplete: true,
        // Add timestamp to prevent caching
        _timestamp: Date.now()
      }
    });
    
    // Add cache control headers
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    response.headers.set('Surrogate-Control', 'no-store');
    
    return response;
  } catch (error) {
    console.error("Error in force-update route:", error);
    return NextResponse.json(
      { success: false, message: "Failed to update session" },
      { status: 500 }
    );
  }
} 