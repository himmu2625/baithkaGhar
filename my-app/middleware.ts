import { type NextRequest, NextResponse } from "next/server"
import { getToken } from "next-auth/jwt"

// Add cookie helper functions to track redirects
function incrementRedirectCount(res: NextResponse): void {
  // Get current redirect count or start at 0
  const currentCount = parseInt(res.cookies.get('redirect_count')?.value || '0')
  // Set new count + expiration (2 minutes from now instead of 30 seconds)
  res.cookies.set('redirect_count', (currentCount + 1).toString(), { 
    maxAge: 120,
    path: '/'
  })
}

function getRedirectCount(req: NextRequest): number {
  return parseInt(req.cookies.get('redirect_count')?.value || '0')
}

const PUBLIC_PATHS = [
  "/",
  "/login",
  "/signup",
  // Critical NextAuth routes that MUST be public
  "/api/auth/*",
  "/api/auth/signin",
  "/api/auth/signout",
  "/api/auth/session",
  "/api/auth/callback",
  "/api/auth/callback/*",
  "/api/auth/csrf",
  "/api/auth/providers",
  "/api/auth/error",
  // User registration routes
  "/api/auth/register",
  "/api/auth/register-simple",
  "/api/auth/debug",
  // Add basic informational pages that should be accessible to all users
  "/about",
  "/contact",
  "/faq",
  "/terms",
  "/privacy",
  "/cookies",
  "/about/*",
  "/contact/*",
  "/faq/*",
  // Support pages added to public paths
  "/help",
  "/cancellation",
  "/safety",
  "/accessibility",
  // Allow access to cities and property pages
  "/cities",
  "/cities/*",
  "/property/*",
  // Add property API endpoints to public paths
  "/api/properties",
  "/api/properties/*",
  "/api/properties/by-city",
  // Add cities API endpoints to public paths
  "/api/cities",
  "/api/cities/*",
  "/api/seed-cities",
  "/api/update-city-counts",
  // Add travel picks API endpoints to public paths
  "/api/travel-picks",
  "/api/travel-picks/*",
  // Add search pages to public paths
  "/search",
  "/search/*",
  // Add stay-types pages to public paths
  "/stay-types",
  "/stay-types/*",
  // Add booking pages to public paths
  "/booking",
  "/booking/*",
  // Add pricing APIs to public paths
  "/api/pricing",
  "/api/pricing/*",
  "/api/pricing/calendar",
  "/api/pricing/query",

  // Admin login page should be publicly accessible
  "/admin/login",
  "/admin/register",
  // Special admin setup pages
  "/admin/setup",
  "/api/admin/setup-super-admin",
  // Direct access HTML helper
  "/admin-setup-direct.html",
  // Admin troubleshooting
  "/admin/troubleshoot",
  // Admin role fixing
  "/admin/fix-role",
  "/api/admin/check-role",
  // Critical admin debug routes
  "/api/admin/debug-auth",
  "/api/admin/debug-env",
  "/api/admin/recover-session",
]

// Pages that specifically require login but should never redirect to profile completion
const AUTH_REQUIRED_NO_PROFILE_CHECK = [
  "/list-property",
  "/list-property/*",
  "/host/dashboard",
  "/host/*"
]

// Admin routes that require authentication and admin role
const ADMIN_ROUTES = [
  "/admin/dashboard",
  "/admin/dashboard/*",
  "/admin/users",
  "/admin/users/*",
  "/admin/properties",
  "/admin/properties/*",
  "/admin/bookings",
  "/admin/bookings/*",
  "/admin/payments",
  "/admin/payments/*",
  "/admin/reviews",
  "/admin/reviews/*",
  "/admin/messages",
  "/admin/messages/*",
  "/admin/reports",
  "/admin/reports/*",
  "/admin/settings",
  "/admin/settings/*",
  "/admin/requests",
  "/admin/requests/*",
  "/admin/property-requests",
  "/admin/property-requests/*",
]

const PROFILE_EXEMPT_PATHS = [
  "/complete-profile",
  "/api/user/complete-profile",
  "/api/profile/complete",
  "/complete-profile-alt",
  "/api/user/complete-profile-alt",
  "/admin/*",
  "/test-admin-bookings",
  // Add booking paths to ensure they're never blocked by profile completion
  "/booking",
  "/booking/*",
  // Add dashboard to allow users to see their bookings
  "/dashboard",
  "/dashboard/*",
]

interface UserToken {
  profileComplete?: boolean
  role?: string
  [key: string]: any
}

const pathMatches = (path: string, patterns: string[]) =>
  patterns.some((pattern) => {
    if (pattern.endsWith('*')) {
      return path.toLowerCase().startsWith(pattern.slice(0, -1).toLowerCase())
    }
    return path.toLowerCase() === pattern.toLowerCase()
  })

// Add paths that should bypass authentication to allow testing without login
const API_AUTH_BYPASS_PATHS: string[] = [];

// Add a helper function to log API requests related to properties
function logPropertyRequests(req: NextRequest) {
  const url = req.nextUrl.pathname;
  
  // Check if this is a property update request
  if (url.includes('/api/properties/') && 
     (url.includes('/update') || req.method === 'PUT' || req.method === 'PATCH')) {
    console.log(`[Middleware] Property update request: ${req.method} ${url}`);
    
    // Try to log request body, but this may not work in middleware 
    // due to streaming limitations
    if (req.body) {
      try {
        const bodyText = 'Request has body but cannot be read in middleware';
        console.log('[Middleware] Request body info:', bodyText);
      } catch (e) {
        console.log('[Middleware] Could not read request body');
      }
    }
  }
}

// Handle referral tracking for influencer system
function handleReferralTracking(req: NextRequest): NextResponse | null {
  const { searchParams, pathname } = req.nextUrl;
  const refCode = searchParams.get('ref');
  
  // Only process referral codes on non-API routes and non-admin routes
  if (!refCode || pathname.startsWith('/api/') || pathname.startsWith('/admin/')) {
    return null;
  }
  
  // Create response to set cookie
  const response = NextResponse.next();
  
  // Set referral cookie that expires in 30 days
  response.cookies.set('influencer_ref', refCode.toUpperCase(), {
    maxAge: 30 * 24 * 60 * 60, // 30 days
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/'
  });
  
  // Also set a timestamp cookie for tracking purposes
  response.cookies.set('influencer_ref_time', Date.now().toString(), {
    maxAge: 30 * 24 * 60 * 60, // 30 days
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/'
  });
  
  console.log(`[Middleware] Referral tracking: Set cookie for ref code: ${refCode}`);
  
  // Redirect to clean URL (remove ref parameter)
  if (refCode) {
    const cleanUrl = new URL(req.url);
    cleanUrl.searchParams.delete('ref');
    return NextResponse.redirect(cleanUrl);
  }
  
  return response;
}

export async function middleware(req: NextRequest) {
  // Log property-related requests
  logPropertyRequests(req);
  
  // Handle referral tracking first
  const referralResponse = handleReferralTracking(req);
  if (referralResponse) {
    return referralResponse;
  }
  
  try {
    const { pathname } = req.nextUrl

    // Skip middleware for static files and Next.js internal routes
    if (pathname.startsWith("/_next") || 
        pathname.includes(".") || 
        pathname.startsWith("/favicon") ||
        pathname.startsWith("/api/auth/") || // Ensure ALL NextAuth routes are bypassed
        pathname.startsWith("/static/") ||
        // Skip middleware for all non-admin API routes
        (pathname.startsWith("/api/") && !pathname.startsWith("/api/admin/"))) {
      return NextResponse.next()
    }

    // Detect web crawlers and always allow them access to public pages
    const userAgent = req.headers.get('user-agent') || ''
    const isCrawler = /bot|crawler|spider|crawling|googlebot|bingbot|slurp|duckduckbot|baiduspider|yandexbot|facebookexternalhit|twitterbot|rogerbot|linkedinbot|embedly|quora link preview|showyoubot|outbrain|pinterest|slackbot|vkShare|W3C_Validator|Google-InspectionTool|google inspection tool/i.test(userAgent)
    
    // Always allow crawlers to access homepage and other public pages without any authentication checks
    if (isCrawler) {
      console.log(`[Middleware] Crawler detected (${userAgent}), allowing unrestricted access to: ${pathname}`)
      return NextResponse.next()
    }

    // Allow all HTTP methods for the test route 
    if (API_AUTH_BYPASS_PATHS.includes(pathname)) {
      console.log(`API auth bypass for test route: ${pathname}`);
      return NextResponse.next();
    }
    
    // Absolute bypass for setup paths to ensure they're never blocked
    if (pathname === "/admin/setup" || 
        pathname === "/api/admin/setup-super-admin" || 
        pathname === "/admin-setup-direct.html" ||
        pathname === "/admin/troubleshoot" ||
        pathname === "/admin/fix-role" ||
        pathname === "/api/admin/check-role") {
      return NextResponse.next()
    }
    
    // Check for redirect loops (simplified)
    const redirectCount = getRedirectCount(req)
    if (redirectCount > 3) {
      console.log(`[Middleware] Redirect loop detected for ${pathname}, breaking loop`)
      // Reset the counter and send to appropriate page
      const breakUrl = req.nextUrl.clone()
      breakUrl.pathname = pathname.startsWith('/admin') ? "/admin/login" : "/"
      breakUrl.searchParams.delete('error') // Remove error params to prevent loops
      const res = NextResponse.redirect(breakUrl)
      res.cookies.set('redirect_count', '0', { maxAge: 0, path: '/' })
      return res
    }

    // Allow all public paths without authentication
    if (pathMatches(pathname, PUBLIC_PATHS)) {
      return NextResponse.next()
    }

    let user: UserToken | null = null
    
    try {
      // Get token with proper NextAuth configuration for both development and production
      user = await getToken({ 
        req, 
        secret: process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET,
        cookieName: process.env.NODE_ENV === 'production' 
          ? "__Secure-next-auth.session-token" 
          : "next-auth.session-token"
      })
    } catch (error) {
      console.error("[Middleware] Error getting token:", error)
      // Continue with user as null to trigger authentication
    }

    console.log(`[Middleware] Checking ${pathname}:`, {
      hasUser: !!user,
      userEmail: user?.email || 'none',
      userRole: user?.role || 'none',
      environment: process.env.NODE_ENV
    })

    // If no user session and route requires authentication
    if (!user) {
      console.log(`[Middleware] No user session, checking if auth required for ${pathname}`)
      
      // Check if this is an admin route
      if (pathMatches(pathname, ADMIN_ROUTES)) {
        console.log(`[Middleware] Admin route ${pathname} requires authentication, redirecting to /admin/login`)
        return redirectToLogin(req, pathname, true)
      }
      
      // Check if this is a protected route that requires regular authentication
      if (!pathMatches(pathname, PUBLIC_PATHS)) {
        console.log(`[Middleware] Protected route ${pathname} requires authentication, redirecting to /login`)
        return redirectToLogin(req, pathname)
      }
      
      // Public path, continue
      return NextResponse.next()
    }

    console.log(`[Middleware] User found: ${user.email} with role: ${user.role}`)

    // Handle admin routes
    if (pathMatches(pathname, ADMIN_ROUTES)) {
      const userRole = user.role || ''
      const isAdmin = userRole === "admin" || userRole === "super_admin" || isUserSuperAdmin(user)
      
      console.log(`[Middleware] Admin route check for ${pathname}:`, {
        userRole,
        isAdmin,
        email: user.email,
        userId: user.sub || user.id
      })
      
      if (!isAdmin) {
        console.log(`[Middleware] Access denied to admin route ${pathname} for non-admin user ${user.email}`)
        // For admin routes, always redirect to admin login instead of home
        const loginUrl = req.nextUrl.clone()
        loginUrl.pathname = "/admin/login"
        loginUrl.searchParams.set("error", "AdminAccessRequired")
        loginUrl.searchParams.set("callbackUrl", pathname)
        const res = NextResponse.redirect(loginUrl)
        incrementRedirectCount(res)
        return res
      }
      
      console.log(`[Middleware] Admin access granted to ${pathname} for ${user.email}`)
      return NextResponse.next()
    }

    // Check profile completion for non-admin users on protected routes
    if (!pathMatches(pathname, PROFILE_EXEMPT_PATHS) && 
        !pathMatches(pathname, AUTH_REQUIRED_NO_PROFILE_CHECK) &&
        !pathMatches(pathname, PUBLIC_PATHS)) {
      
      if (user.role !== "admin" && user.role !== "super_admin" && !isUserSuperAdmin(user)) {
        if (user.profileComplete === false) {
          console.log(`[Middleware] Profile incomplete for ${user.email}, redirecting to complete-profile`)
          const completeProfileUrl = req.nextUrl.clone()
          completeProfileUrl.pathname = "/complete-profile"
          completeProfileUrl.searchParams.set("returnTo", pathname)
          const res = NextResponse.redirect(completeProfileUrl)
      incrementRedirectCount(res)
      return res
        }
      }
    }

    return NextResponse.next()
  } catch (error) {
    console.error("[Middleware] Unexpected error:", error)
    // Return next() to avoid blocking the request in case of errors
    return NextResponse.next()
  }
}

function redirectToLogin(req: NextRequest, pathname: string, isAdmin: boolean = false) {
  const loginUrl = req.nextUrl.clone()
  loginUrl.pathname = isAdmin ? "/admin/login" : "/login"
  loginUrl.searchParams.set("callbackUrl", pathname)
  loginUrl.searchParams.set("error", "SessionRequired")
  const res = NextResponse.redirect(loginUrl)
  incrementRedirectCount(res)
  return res
}

// Special handling for super admin email
const isUserSuperAdmin = (user: any): boolean => {
  // Check if user is the designated super admin
  return user?.email === "anuragsingh@baithakaghar.com" || user?.role === "super_admin";
};

// Configure which paths the middleware should run on
export const config = {
  matcher: [
    // Match all paths except static files and Next.js internals
    '/((?!api/auth|_next/static|_next/image|favicon.ico).*)',
    // Match specific API routes that need middleware
    '/api/user/:path*',
    '/api/profile/:path*',
    '/api/admin/:path*',
    '/api/properties/:path*',
    '/api/booking/:path*',
    '/api/v1/:path*'
  ],
};
