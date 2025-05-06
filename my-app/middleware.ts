import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

// Public routes (do not require authentication)
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
];

// Profile completion exempt routes
const PROFILE_EXEMPT_PATHS = [
  '/complete-profile',
  '/api/user/complete-profile',
  '/api/profile/complete',
  '/complete-profile-alt',
  '/api/user/complete-profile-alt',
];

interface UserToken {
  profileComplete?: boolean;
  [key: string]: any;
}

// Utility: Match path to list
const pathMatches = (path: string, patterns: string[]): boolean => {
  const pathLower = path.toLowerCase();
  return patterns.some((pattern) => pathLower === pattern.toLowerCase());
};

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  console.log('🧩 Middleware hit:', pathname);

  // Skip for static files and Next.js internals
  if (
    pathname.startsWith('/_next') ||
    pathname.includes('.') ||
    pathname.startsWith('/favicon')
  ) {
    return NextResponse.next();
  }

  // Allow all /api routes to handle their own auth
  if (pathname.startsWith('/api/')) {
    console.log('Skipping middleware for API:', pathname);
    return NextResponse.next();
  }

  const isPublicRoute = pathMatches(pathname, PUBLIC_PATHS);

  const token = (await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
  })) as UserToken | null;

  console.log('Session token:', token ? '✅ Found' : '❌ Not found');

  if (!token && !isPublicRoute) {
    console.log('🔒 Redirecting unauthenticated user to login...');
    const url = new URL('/login', req.url);
    url.searchParams.set('callbackUrl', encodeURIComponent(pathname));
    return NextResponse.redirect(url);
  }

  if (
    token &&
    token.profileComplete === false &&
    !pathMatches(pathname, PROFILE_EXEMPT_PATHS)
  ) {
    console.log('🔧 Redirecting to complete profile...');
    return NextResponse.redirect(new URL('/complete-profile', req.url));
  }

  return NextResponse.next();
}

// Apply middleware to all routes except static files and assets
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)'],
};
