import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/get-session'
import { getToken } from 'next-auth/jwt'
import { AutoCancellationService } from '@/lib/services/auto-cancellation-service'

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    console.log("[API/bookings/auto-cancel/POST] Request received")
    
    // Get session - try multiple approaches
    let session;
    let userEmail;
    let userId;
    
    try {
      // Try getSession first
      session = await getSession()
      console.log("[API/bookings/auto-cancel/POST] Session retrieved successfully via getSession")
      userEmail = session?.user?.email;
      userId = session?.user?.id;
    } catch (sessionError: any) {
      console.error("[API/bookings/auto-cancel/POST] getSession error:", sessionError)
      
      // Fallback: Try getToken
      try {
        const token = await getToken({ 
          req: req as any, 
          secret: process.env.NEXTAUTH_SECRET 
        });
        console.log("[API/bookings/auto-cancel/POST] Token retrieved successfully")
        userEmail = token?.email;
        userId = token?.sub;
        console.log("[API/bookings/auto-cancel/POST] Using token data:", { userEmail, userId });
      } catch (tokenError: any) {
        console.error("[API/bookings/auto-cancel/POST] getToken error:", tokenError)
        return NextResponse.json({ 
          error: "Authentication error", 
          details: "Both getSession and getToken failed" 
        }, { status: 500 });
      }
    }
    
    if (!userEmail) {
      console.log("[API/bookings/auto-cancel/POST] Unauthorized - no user email")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    console.log("[API/bookings/auto-cancel/POST] User:", userEmail)
    
    // For regular users, we'll only check and cancel their own expired bookings
    // This is a simplified version that doesn't require admin privileges
    try {
      const result = await AutoCancellationService.checkAndCancelExpiredBookingsForUser(userEmail)
      
      console.log("[API/bookings/auto-cancel/POST] Auto-cancellation result:", result)
      
      return NextResponse.json({
        success: true,
        message: `Auto-cancellation completed. Cancelled: ${result.cancelled}, Errors: ${result.errors.length}`,
        result
      })
    } catch (error: any) {
      console.error("[API/bookings/auto-cancel/POST] Auto-cancellation error:", error)
      return NextResponse.json({ 
        error: "Auto-cancellation failed", 
        details: error.message 
      }, { status: 500 })
    }
  } catch (error: any) {
    console.error("[API/bookings/auto-cancel/POST] Outer error:", error)
    return NextResponse.json({ 
      error: "Internal server error", 
      details: error.message 
    }, { status: 500 })
  }
}