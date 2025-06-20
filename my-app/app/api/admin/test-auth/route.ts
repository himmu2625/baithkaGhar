import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { authOptions } from "@/lib/auth";
import { connectMongo } from "@/lib/db/mongodb";
import User from "@/models/User";

export const dynamic = 'force-dynamic';

export const GET = async (req: NextRequest) => {
  try {
    console.log("Test Auth API: Starting authentication test");
    console.log("Test Auth API: Request headers:", Object.fromEntries(req.headers.entries()));
    console.log("Test Auth API: Request cookies:", req.cookies.getAll());
    
    // Test 1: Get token with detailed logging
    const token = await getToken({ req, secret: authOptions.secret });
    console.log("Test Auth API: Token result:", token);
    
    if (!token) {
      console.log("Test Auth API: No token found - checking alternative methods");
      
      // Check for session cookie manually
      const sessionCookie = req.cookies.get('next-auth.session-token') || req.cookies.get('__Secure-next-auth.session-token');
      console.log("Test Auth API: Session cookie:", sessionCookie ? "Found" : "Not found");
      
      return NextResponse.json({
        success: false,
        message: "No valid token found",
        debug: {
          hasCookies: req.cookies.getAll().length > 0,
          cookies: req.cookies.getAll().map(c => c.name),
          sessionCookie: !!sessionCookie
        }
      });
    }
    
    console.log("Test Auth API: Token ID:", token.id);
    console.log("Test Auth API: Token email:", token.email);
    console.log("Test Auth API: Token role:", token.role);
    
    if (!token.id) {
      return NextResponse.json({
        success: false,
        message: "Token found but missing user ID",
        tokenData: token
      });
    }
    
    // Test 2: Connect to database
    await connectMongo();
    console.log("Test Auth API: Database connected");
    
    // Test 3: Find user
    const user = await User.findById(token.id);
    console.log("Test Auth API: User lookup result:", user ? "Found" : "Not found");
    
    if (!user) {
      return NextResponse.json({
        success: false,
        message: "User not found in database",
        debug: {
          tokenId: token.id,
          tokenEmail: token.email
        }
      });
    }
    
    // Test 4: Check admin role
    const isAdmin = ['admin', 'super_admin'].includes(user.role);
    console.log("Test Auth API: User role from DB:", user.role);
    console.log("Test Auth API: Is admin:", isAdmin);
    
    return NextResponse.json({
      success: true,
      message: "Authentication test successful",
      data: {
        token: {
          present: true,
          id: token.id,
          email: token.email,
          role: token.role
        },
        user: {
          found: true,
          id: user._id.toString(),
          email: user.email,
          name: user.name,
          role: user.role,
          isAdmin: user.isAdmin
        },
        auth: {
          isAdmin: isAdmin,
          hasValidToken: true,
          canAccessAdminRoutes: isAdmin
        }
      }
    });
    
  } catch (error) {
    console.error("Test Auth API: Error:", error);
    return NextResponse.json({
      success: false,
      message: "Authentication test failed",
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}; 