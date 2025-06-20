import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getToken } from "next-auth/jwt";
import { headers } from "next/headers";
import { connectMongo } from "@/lib/db/mongodb";
import User from "@/models/User";

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    console.log("=== Admin Debug Auth Endpoint Called ===");
    
    // Get current URL and headers for debugging
    const url = new URL(req.url);
    const headersList = await headers();
    const userAgent = headersList.get('user-agent') || 'Unknown';
    const forwarded = headersList.get('x-forwarded-for') || 'Unknown';
    const host = headersList.get('host') || 'Unknown';
    
    // Get session using auth()
    let session = null;
    let sessionError = null;
    try {
      session = await auth();
      console.log("Debug Auth: Session found via auth():", !!session);
    } catch (error) {
      sessionError = error instanceof Error ? error.message : 'Unknown session error';
      console.error("Debug Auth: Session error:", sessionError);
    }
    
    // Get token using getToken
    let token = null;
    let tokenError = null;
    try {
      token = await getToken({ 
        req, 
        secret: process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET,
        secureCookie: process.env.NODE_ENV === 'production' && req.url.startsWith('https://'),
        salt: 'next-auth.session-token'
      });
      console.log("Debug Auth: Token found via getToken():", !!token);
    } catch (error) {
      tokenError = error instanceof Error ? error.message : 'Unknown token error';
      console.error("Debug Auth: Token error:", tokenError);
    }
    
    // Check database connection and user
    let dbUser = null;
    let dbError = null;
    try {
      await connectMongo();
      console.log("Debug Auth: Database connected successfully");
      
      const userEmail = session?.user?.email || token?.email;
      if (userEmail) {
        dbUser = await User.findOne({ email: userEmail }).select('name email role isAdmin');
        console.log("Debug Auth: User found in DB:", !!dbUser);
        if (dbUser) {
          console.log("Debug Auth: User role from DB:", dbUser.role);
          console.log("Debug Auth: User isAdmin from DB:", dbUser.isAdmin);
        }
      }
    } catch (error) {
      dbError = error instanceof Error ? error.message : 'Unknown database error';
      console.error("Debug Auth: Database error:", dbError);
    }
    
    // Get all cookies for debugging
    const cookies = req.headers.get('cookie') || '';
    const authCookies = {
      sessionToken: cookies.includes('next-auth.session-token'),
      callbackUrl: cookies.includes('next-auth.callback-url'),
      csrfToken: cookies.includes('next-auth.csrf-token'),
      all: cookies.split(';').map(c => c.trim().split('=')[0]).filter(name => name.includes('auth'))
    };
    
    // Check admin status from different sources
    const adminFromSession = session?.user?.role === 'admin' || session?.user?.role === 'super_admin';
    const adminFromToken = token?.role === 'admin' || token?.role === 'super_admin';
    const adminFromDb = dbUser && (dbUser.role === 'admin' || dbUser.role === 'super_admin' || dbUser.isAdmin);
    
    // Environment info
    const envInfo = {
      nodeEnv: process.env.NODE_ENV,
      nextAuthUrl: process.env.NEXTAUTH_URL,
      hasSecret: !!(process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET),
      isSecure: req.url.startsWith('https://'),
      shouldUseSecureCookies: process.env.NODE_ENV === 'production' && req.url.startsWith('https://')
    };
    
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      requestInfo: {
        url: url.toString(),
        userAgent,
        forwarded,
        host,
        isSecure: req.url.startsWith('https://'),
        method: req.method
      },
      session: {
        exists: !!session,
        error: sessionError,
        user: session?.user ? {
          id: session.user.id,
          email: session.user.email,
          name: session.user.name,
          role: session.user.role,
          profileComplete: session.user.profileComplete
        } : null
      },
      token: {
        exists: !!token,
        error: tokenError,
        data: token ? {
          id: token.sub,
          email: token.email,
          name: token.name,
          role: token.role,
          profileComplete: token.profileComplete
        } : null
      },
      database: {
        connected: !dbError,
        error: dbError,
        user: dbUser ? {
          id: (dbUser as any)._id.toString(),
          email: dbUser.email,
          name: dbUser.name,
          role: dbUser.role,
          isAdmin: dbUser.isAdmin
        } : null
      },
      cookies: authCookies,
      adminStatus: {
        fromSession: adminFromSession,
        fromToken: adminFromToken,
        fromDatabase: adminFromDb,
        isAdmin: adminFromSession || adminFromToken || adminFromDb,
        hasAnyAdminIndicator: !!(session?.user?.role || token?.role || dbUser?.role || dbUser?.isAdmin)
      },
      environment: envInfo,
      diagnosis: {
        canAccessAdmin: adminFromSession || adminFromToken || adminFromDb,
        potentialIssues: [
          !session && !token ? 'No session or token found' : null,
          sessionError ? `Session error: ${sessionError}` : null,
          tokenError ? `Token error: ${tokenError}` : null,
          dbError ? `Database error: ${dbError}` : null,
          !authCookies.sessionToken ? 'Session token cookie missing' : null,
          envInfo.nodeEnv === 'production' && !envInfo.isSecure ? 'Production environment but not HTTPS' : null,
          !envInfo.hasSecret ? 'Auth secret missing' : null,
          session && !adminFromSession && !tokenError ? 'User authenticated but not admin' : null
        ].filter(Boolean)
      }
    });
    
  } catch (error) {
    console.error("Debug Auth endpoint error:", error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
} 