import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { cookies } from "next/headers";
import { auth } from "@/lib/auth";
import { connectMongo } from "@/lib/db/mongodb";
import User from "@/models/User";
import { getServerSession } from "next-auth/next";
import mongoose from "mongoose";

export const dynamic = 'force-dynamic';

/**
 * Endpoint to force session update
 * This is a more aggressive approach to refresh session state
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
    
    // Force update profileComplete in both token and database
    const needsUpdate = user.profileComplete !== true;
    
    // Update in database if needed
    if (needsUpdate) {
      await User.findByIdAndUpdate(
        session.user.id,
        { profileComplete: true, updatedAt: new Date() },
        { new: true }
      );
      console.log(`Updated profileComplete in database for user ${session.user.id}`);
    }
    
    // Force session cookie update
    const cookieStore = cookies();
    const sessionCookie = cookieStore.get('next-auth.session-token');
    
    if (sessionCookie) {
      // Update expiration to force refresh
      cookieStore.set('next-auth.session-token', sessionCookie.value, {
        expires: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        path: '/',
        sameSite: 'lax'
      });
      console.log("Session cookie refreshed");
    } else {
      console.warn("No session cookie found to refresh");
    }
    
    // Create a response with updated session data
    const response = NextResponse.json({
      success: true,
      message: "Session update triggered",
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