import { NextResponse } from "next/server";
import { connectMongo } from "@/lib/db/mongodb";
import User from "@/models/User";
import { auth } from "@/lib/auth";

export const dynamic = 'force-dynamic'; // Ensure this is always fresh

export async function POST(request: Request) {
  try {
    // Get current session
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: "Not authenticated" },
        { status: 401 }
      );
    }
    
    // Connect to MongoDB
    await connectMongo();
    
    // Update user profile completion status
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
    
    console.log(`Profile marked as complete for user: ${session.user.id}`);
    
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
    console.error("Error marking profile as complete:", error);
    return NextResponse.json(
      { success: false, message: "Failed to update profile status" },
      { status: 500 }
    );
  }
} 