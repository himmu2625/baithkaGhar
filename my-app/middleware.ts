import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

const PUBLIC_PATHS = [
  '/', '/login', '/signup',
  '/api/auth/signin', '/api/auth/signout', '/api/auth/session',
  '/api/auth/callback', '/api/auth/csrf', '/api/auth/providers',
  '/api/auth/register', '/api/auth/register-simple',
  '/api/test', '/test', '/test-signup',
];

const PROFILE_EXEMPT_PATHS = [
  '/complete-profile', '/api/user/complete-profile',
  '/api/profile/complete', '/complete-profile-alt',
  '/api/user/complete-profile-alt',
];

interface UserToken {
  profileComplete?: boolean;
  [key: string]: any;
}

const pathMatches = (path: string, patterns: string[]) =>
  patterns.some((pattern) => path.toLowerCase() === pattern.toLowerCase());

export default async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Skip middleware for static files or internal paths
  if (
    pathname.startsWith('/_next') ||
    pathname.includes('.') ||
    pathname.startsWith('/favicon')
  ) {
    return NextResponse.next();
  }

  // Skip middleware for API routes that aren't auth-related
  if (pathname.startsWith('/api/') && !pathname.startsWith('/api/auth')) {
    return NextResponse.next();
  }

  const isPublicRoute = pathMatches(pathname, PUBLIC_PATHS);

  let token: UserToken | null = null;

  try {
    token = (await getToken({
      req,
      secret: process.env.NEXTAUTH_SECRET!,
    })) as UserToken | null;
  } catch (err) {
    console.error('❌ Error getting token in middleware:', err);
    // Token error fallback: treat as unauthenticated
  }

  if (!token && !isPublicRoute) {
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(url);
  }

  if (
    token &&
    token.profileComplete === false &&
    !pathMatches(pathname, PROFILE_EXEMPT_PATHS)
  ) {
    const url = req.nextUrl.clone();
    url.pathname = '/complete-profile';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

// Middleware matcher config
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)'],
};
