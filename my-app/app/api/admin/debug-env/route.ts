import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"

export async function GET(req: NextRequest) {
  try {
    // Get session
    const session = await auth()
    
    // Environment check that doesn't expose sensitive values
    const envCheck = {
      NODE_ENV: process.env.NODE_ENV,
      hasNEXTAUTH_SECRET: !!process.env.NEXTAUTH_SECRET,
      hasAUTH_SECRET: !!process.env.AUTH_SECRET,
      hasNEXTAUTH_URL: !!process.env.NEXTAUTH_URL,
      NEXTAUTH_URL_value: process.env.NEXTAUTH_URL, // Safe to show URL
      hasMONGODB_URI: !!process.env.MONGODB_URI,
      hasGOOGLE_CLIENT_ID: !!process.env.GOOGLE_CLIENT_ID,
      hasGOOGLE_CLIENT_SECRET: !!process.env.GOOGLE_CLIENT_SECRET,
      
      // Cookie configuration info
      cookieName: process.env.NODE_ENV === 'production' 
        ? '__Secure-next-auth.session-token' 
        : 'next-auth.session-token',
      isProduction: process.env.NODE_ENV === 'production',
      
      // Session information
      hasSession: !!session,
      sessionUser: session?.user ? {
        email: session.user.email,
        role: (session.user as any).role,
        id: (session.user as any).id
      } : null,
      
      // Headers for debugging
      userAgent: req.headers.get('user-agent'),
      origin: req.headers.get('origin'),
      host: req.headers.get('host'),
      
      // Cookie information (without values for security)
      cookies: req.cookies.getAll().map(cookie => ({
        name: cookie.name,
        hasValue: !!cookie.value,
        // Only show nextauth cookies pattern
        isNextAuthCookie: cookie.name.includes('next-auth')
      }))
    }

    return NextResponse.json({
      success: true,
      environment: envCheck,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error("Environment debug error:", error)
    return NextResponse.json(
      { 
        success: false, 
        error: "Environment check failed",
        message: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    )
  }
} 