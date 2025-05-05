import { NextRequest, NextResponse } from "next/server"
import { getToken } from "next-auth/jwt"

// Paths that don't require authentication
const PUBLIC_PATHS = [
  '/',
  '/login',
  '/signup',
  '/api/auth/signin',
  '/api/auth/signout',
  '/api/auth/session',
  '/api/auth/callback',
  '/api/auth/csrf',
  '/api/auth/providers',
  '/api/auth/register',
  '/api/auth/register-simple',
  '/api/test',
  '/test',
  '/test-signup',
  '/api/auth/*'  // Allow all auth API routes
]

// Paths that don't require profile completion
const PROFILE_EXEMPT_PATHS = [
  '/complete-profile',
  '/api/user/complete-profile',
  '/api/profile/complete',
  '/complete-profile-alt',
  '/api/user/complete-profile-alt',
]

// Check if a path starts with any of the given prefixes
const pathStartsWith = (path: string, prefixes: string[]): boolean => {
  const pathLower = path.toLowerCase()
  return prefixes.some(prefix => pathLower.startsWith(prefix.toLowerCase()))
}

// Check if a path matches exactly or starts with any of the given prefixes
const pathMatches = (path: string, patterns: string[]): boolean => {
  const pathLower = path.toLowerCase()
  return patterns.some(pattern => {
    const patternLower = pattern.toLowerCase()
    return pathLower === patternLower || 
           (patternLower.endsWith('*') && pathLower.startsWith(patternLower.slice(0, -1)))
  })
}

// Define the token type with the profileComplete property
interface UserToken {
  profileComplete?: boolean;
  [key: string]: any;
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  
  console.log('Middleware processing path:', pathname);
  
  // Skip middleware for next.js internals and static files
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/_next') ||
    pathname.includes('.') ||
    pathname.startsWith('/favicon')
  ) {
    return NextResponse.next()
  }
  
  // Skip authentication checks for all API routes
  // This ensures API routes handle their own auth and aren't redirected
  if (pathname.startsWith('/api/')) {
    console.log('Skipping middleware auth check for API route:', pathname);
    return NextResponse.next()
  }
  
  // Check if the route is public
  const isPublicRoute = pathMatches(pathname, PUBLIC_PATHS)
  
  // Get the user's session token
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET }) as UserToken | null
  
  console.log('User token:', token ? `Found (profileComplete: ${token.profileComplete})` : 'Not found');
  
  // If no token and route is protected, redirect to login
  if (!token && !isPublicRoute) {
    console.log('No token for protected route, redirecting to login');
    const url = new URL('/login', req.url)
    url.searchParams.set('callbackUrl', encodeURI(pathname))
    return NextResponse.redirect(url)
  }
  
  // If user is logged in but profile is not complete and not on profile completion page
  if (token && token.profileComplete === false && !pathMatches(pathname, PROFILE_EXEMPT_PATHS)) {
    console.log('Profile not complete, redirecting to profile completion page');
    return NextResponse.redirect(new URL('/complete-profile', req.url))
  }
  
  return NextResponse.next()
}

// Define which routes this middleware will run on
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - Static files (css, js, images, etc.)
     * - API routes that are explicitly excluded
     */
    '/((?!_next/static|_next/image|images|favicon.ico).*)',
  ],
}