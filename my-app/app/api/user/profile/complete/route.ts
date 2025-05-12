import { NextResponse } from "next/server";
import { connectMongo } from "@/lib/db/mongodb";
import User from "@/models/User";
import { auth, signIn, signOut } from "@/lib/auth";
import { cookies } from "next/headers";
import { getToken } from "next-auth/jwt";
import { encode, decode } from "next-auth/jwt";

export const dynamic = 'force-dynamic'; // Ensure this is always fresh

export async function POST(request: Request) {
  try {
    // Get the current user session
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: "Not authenticated" },
        { status: 401 }
      );
    }
    
    // Connect to database
    await connectMongo();
    
    // Update the user's profileComplete status
    const updatedUser = await User.findByIdAndUpdate(
      session.user.id,
      { 
        profileComplete: true,
        updatedAt: new Date()
      },
      { new: true }
    );
    
    if (!updatedUser) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }
    
    console.log(`User ${session.user.id} profile marked as complete`);
    
    // Try to update the session directly
    try {
      // Get the token directly
      const token = await getToken({ 
        req: request, 
        secret: process.env.NEXTAUTH_SECRET as string,
      });
      
      if (token) {
        // Force a token update by trying to refresh it
        // Update the profileComplete status in the token
        token.profileComplete = true;
        
        // Create a new cookie with updated values
        const cookieStore = cookies();
        const sessionCookie = cookieStore.get('next-auth.session-token');
        
        if (sessionCookie) {
          // We need to manually encode the token if possible
          try {
            // Set a far-future expiration to force a refresh
            cookieStore.set('next-auth.session-token', sessionCookie.value, {
              expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
              secure: process.env.NODE_ENV === 'production',
              httpOnly: true,
              path: '/',
              sameSite: 'lax'
            });
            
            console.log("Session cookie updated");
          } catch (err) {
            console.error("Failed to set cookie:", err);
          }
        }
      }
    } catch (tokenError) {
      console.error("Error updating token:", tokenError);
    }
    
    // Return success response with cache control headers to prevent caching
    const response = NextResponse.json({ 
      success: true, 
      message: "Profile marked as complete",
      user: {
        id: updatedUser._id.toString(),
        email: updatedUser.email,
        profileComplete: true,
        // Add timestamp to prevent caching
        timestamp: Date.now()
      }
    });
    
    // Add cache control headers
    response.headers.set('Cache-Control', 'no-store, max-age=0');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    
    return response;
  } catch (error) {
    console.error("Error updating profile complete status:", error);
    
    return NextResponse.json(
      { 
        success: false, 
        message: "Failed to update profile status",
        error: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
} 