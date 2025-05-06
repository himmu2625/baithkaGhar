import { type NextRequest, NextResponse } from "next/server"
import { getToken } from "next-auth/jwt"

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
  "/api/test",
  "/test",
  "/test-signup",
]

const PROFILE_EXEMPT_PATHS = [
  "/complete-profile",
  "/api/user/complete-profile",
  "/api/profile/complete",
  "/complete-profile-alt",
  "/api/user/complete-profile-alt",
]

interface UserToken {
  profileComplete?: boolean
  [key: string]: any
}

const pathMatches = (path: string, patterns: string[]) =>
  patterns.some((pattern) => path.toLowerCase() === pattern.toLowerCase())

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Skip middleware for static files or internal paths
  if (pathname.startsWith("/_next") || pathname.includes(".") || pathname.startsWith("/favicon")) {
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

  // If it's a public route, no need to check token
  if (isPublicRoute) {
    return NextResponse.next()
  }

  let token: UserToken | null = null

  try {
    // Only attempt to get token if we need it (non-public routes)
    token = (await getToken({
      req,
      secret: process.env.NEXTAUTH_SECRET,
    })) as UserToken | null
  } catch (err) {
    console.error("❌ Error getting token in middleware:", err)
    // Token error fallback: treat as unauthenticated
  }

  if (!token) {
    const url = req.nextUrl.clone()
    url.pathname = "/login"
    url.searchParams.set("callbackUrl", pathname)
    return NextResponse.redirect(url)
  }

  if (token.profileComplete === false && !pathMatches(pathname, PROFILE_EXEMPT_PATHS)) {
    const url = req.nextUrl.clone()
    url.pathname = "/complete-profile"
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

// Updated matcher configuration
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - files with extensions (.svg, .jpg, etc)
     */
    "/((?!_next/static|_next/image|favicon.ico|public|.*\\..*).*)",
  ],
}
