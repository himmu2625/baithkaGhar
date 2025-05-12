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
  "/api/auth/signin",
  "/api/auth/signout",
  "/api/auth/session",
  "/api/auth/callback",
  "/api/auth/csrf",
  "/api/auth/providers",
  "/api/auth/register",
  "/api/auth/register-simple",
  "/api/auth/debug",
  "/api/test",
  "/test",
  "/test-signup",
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

export async function middleware(req: NextRequest) {
  try {
    const { pathname } = req.nextUrl

    // Absolute bypass for setup paths to ensure they're never blocked
    if (pathname === "/admin/setup" || 
        pathname === "/api/admin/setup-super-admin" || 
        pathname === "/admin-setup-direct.html" ||
        pathname === "/admin/troubleshoot" ||
        pathname === "/admin/fix-role" ||
        pathname === "/api/admin/check-role") {
      return NextResponse.next()
    }
    
    // Check for redirect loops
    const redirectCount = getRedirectCount(req)
    if (redirectCount > 5) {
      // Reset the counter and send to home page to break the loop
      const homeUrl = req.nextUrl.clone()
      homeUrl.pathname = "/"
      const res = NextResponse.redirect(homeUrl)
      res.cookies.set('redirect_count', '0', { maxAge: 0, path: '/' })
      return res
    }

    // Special handling for list-property page - bypass middleware for this path
    // Let client component handle authentication instead
    if (pathname === "/list-property") {
      return NextResponse.next()
    }

    // Special handling for admin routes - we need to verify admin role
    const isAdminRoute = pathMatches(pathname, ADMIN_ROUTES)
    if (isAdminRoute || pathname.startsWith('/admin/')) {
      // Special case for API routes starting with /admin/ that are used by the admin panel
      if (pathname.startsWith('/admin/api/') || pathname.startsWith('/admin/images/')) {
        // Allow admin API and image routes to pass through without additional checks
        return NextResponse.next();
      }

      // Admin special paths that bypass all checks
      const adminSpecialPaths = [
        '/admin/login', 
        '/admin/auth', 
        '/admin/forgot-password',
        '/admin/reset-password',
        '/admin/auth/error',
        '/admin/loading',
        '/admin/login/callback',
        '/admin/signin',
        '/admin/signin/callback',
      ];

      // If it's a special admin path, bypass all checks
      if (adminSpecialPaths.includes(pathname) || pathname.startsWith('/admin/auth/')) {
        // Add a debug header to check in production
        const response = NextResponse.next();
        response.headers.set('X-Admin-Auth-Debug', 'Special-Path-Bypass');
        return response;
      }

      // For all other admin routes, check if user is admin or super_admin
      const token = await getToken({ 
        req, 
        secret: process.env.NEXTAUTH_SECRET,
        // Ensure we're using secure settings
        secureCookie: process.env.NODE_ENV === 'production'
      });

      // Debug in production
      if (!token) {
        // No token, redirect to admin login
        const response = NextResponse.redirect(new URL('/admin/login', req.url));
        response.headers.set('X-Admin-Auth-Debug', 'No-Token-Redirect');
        return response;
      }

      // Check if user has admin or super_admin role
      const userRole = token.role;
      const isAdmin = userRole === 'admin' || userRole === 'super_admin';
      
      if (isAdmin) {
        // User is admin, allow access with debug info
        const response = NextResponse.next();
        response.headers.set('X-Admin-Auth-Debug', `Admin-Access-Granted:${userRole}`);
        return response;
      } else {
        // User is not admin, redirect to unauthorized page
        const response = NextResponse.redirect(new URL('/unauthorized', req.url));
        response.headers.set('X-Admin-Auth-Debug', `Not-Admin:${userRole || 'no-role'}`);
        return response;
      }
    }

    // Debug logging in development environment
    if (process.env.NODE_ENV === 'development') {
      console.log(`Middleware checking: ${pathname}`);
    }

    // Skip middleware for static files or internal paths
    if (pathname.startsWith("/_next") || pathname.includes(".") || pathname.startsWith("/favicon")) {
      return NextResponse.next()
    }

    // Special case for the auth debug endpoint
    if (pathname === "/api/auth/debug") {
      return NextResponse.next()
    }

    // Skip middleware for API routes except those that need auth checks
    if (
      pathname.startsWith("/api/") &&
      !pathname.startsWith("/api/auth/") &&
      !pathname.startsWith("/api/user/") &&
      !pathname.startsWith("/api/profile/")
    ) {
      return NextResponse.next()
    }

    const isPublicRoute = pathMatches(pathname, PUBLIC_PATHS)
    const isAuthRequiredNoProfileCheck = pathMatches(pathname, AUTH_REQUIRED_NO_PROFILE_CHECK)

    // If it's a public route, no need to check token
    if (isPublicRoute) {
      if (process.env.NODE_ENV === 'development') {
        console.log(`${pathname} is a public route, skipping auth check`);
      }
      return NextResponse.next()
    }

    // Critical auth paths should never be blocked
    if (pathname.startsWith("/api/auth/")) {
      return NextResponse.next()
    }

    let token: UserToken | null = null

    try {
      // Check for secret - support both NextAuth v4 and v5 environment variable names
      const secret = process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET
      
      if (!secret) {
        console.warn("Authentication secret is not set in environment variables")
        // For public routes, continue without auth
        if (isPublicRoute) {
          return NextResponse.next()
        }
        // For protected routes, redirect to login
        return redirectToLogin(req, pathname)
      }

      // Only attempt to get token if we need it (non-public routes)
      token = (await getToken({
        req,
        secret,
      })) as UserToken | null

      // For debugging - log token info
      if (process.env.NODE_ENV === 'development') {
        console.log(`Token for ${pathname}:`, token ? 'found' : 'not found')
      }
    } catch (err) {
      console.error("❌ Error getting token in middleware:", err)
      // Token error fallback: treat as unauthenticated
      return redirectToLogin(req, pathname)
    }

    if (!token) {
      console.log(`No token found for ${pathname}, redirecting to login`);
      return redirectToLogin(req, pathname)
    }

    // Special handling for routes that need auth but NOT profile completion check
    if (isAuthRequiredNoProfileCheck) {
      // Add specific debug logging for list-property page to help troubleshoot
      if (pathname === "/list-property") {
        console.log(`[DEBUG] List Property page accessed. Auth state: ${!!token}, Path: ${pathname}`);
      }
      if (process.env.NODE_ENV === 'development') {
        console.log(`${pathname} requires auth but not profile completion check, continuing`);
      }
      return NextResponse.next()
    }

    // Only check profile completion for non-exempt paths
    if (token.profileComplete === false && !pathMatches(pathname, PROFILE_EXEMPT_PATHS)) {
      if (process.env.NODE_ENV === 'development') {
        console.log(`Profile not complete for ${pathname}, redirecting to complete-profile`);
      }
      const url = req.nextUrl.clone()
      url.pathname = "/complete-profile"
      const res = NextResponse.redirect(url)
      incrementRedirectCount(res)
      return res
    }

    // If we got here, the user is authenticated and has a complete profile, so allow access
    return NextResponse.next()
    
  } catch (error) {
    console.error("❌ Unhandled error in middleware:", error)
    // In case of unhandled errors, default to allowing the request
    // This prevents the site from becoming inaccessible due to middleware errors
    return NextResponse.next()
  }
}

// Helper function for login redirects
function redirectToLogin(req: NextRequest, pathname: string) {
  const url = req.nextUrl.clone()
  url.pathname = "/login"
  url.searchParams.set("callbackUrl", pathname)
  
  // Track this redirect to prevent loops
  const res = NextResponse.redirect(url)
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
    '/api/property/:path*',
    '/api/booking/:path*',
    '/api/v1/:path*'
  ],
};
