import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { auth } from '@/lib/auth';
import { cookies } from 'next/headers';
import { debugAdminAuth } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();

    const token = await getToken({
      req,
      secret: process.env.NEXTAUTH_SECRET,
      secureCookie: process.env.NODE_ENV === 'production',
    });

    // ✅ FIX 1: cookies() returns a `ReadonlyRequestCookies` object, no await needed.
    const cookieStore = await cookies();
    const allCookies = cookieStore.getAll();

    const adminValidation = debugAdminAuth(session);

    const sessionInfo = session
      ? {
          hasSession: true,
          userEmail: session.user?.email ?? null,
          userName: session.user?.name ?? null,
          userId: session.user?.id ?? null,
          userRole: session.user?.role ?? null,
          profileComplete: session.user?.profileComplete ?? false,
          expiresAt: session.expires ?? null,
        }
      : { hasSession: false };

    const tokenInfo = token
      ? {
          hasToken: true,
          tokenSub: token.sub ?? null,
          tokenRole: token.role ?? null,
          tokenProfileComplete: token.profileComplete ?? false,
          tokenEmail: token.email ?? null,
          tokenExp: token.exp ?? null,
        }
      : { hasToken: false };

    const cookieInfo = {
      cookieCount: allCookies.length,
      // ✅ FIX 2: Do not call cookies() with arguments — just use cookies()
      hasSessionToken: allCookies.some((c: { name: string }) =>
        c.name.includes('session-token')
      ),
      hasNextAuth: allCookies.some((c: { name: string }) =>
        c.name.includes('next-auth')
      ),
      cookieNames: allCookies.map((c: { name: string }) => c.name),
    };

    return NextResponse.json({
      environment: {
        nodeEnv: process.env.NODE_ENV,
        nextAuthUrl: process.env.NEXTAUTH_URL || 'not-set',
        hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
        isVercel: !!process.env.VERCEL,
      },
      request: {
        url: req.url,
        headers: {
          host: req.headers.get('host'),
          userAgent: req.headers.get('user-agent')?.substring(0, 100) ?? null,
          referer: req.headers.get('referer') ?? null,
          // ✅ FIX 3: cookie is never nullish, so use `||` instead of `??`
          cookie: (req.headers.get('cookie')?.substring(0, 100) || '') + '...',
        },
      },
      session: sessionInfo,
      token: tokenInfo,
      cookies: cookieInfo,
      adminStatus: {
        ...adminValidation,
        isAuthConfigured:
          !!process.env.NEXTAUTH_SECRET && !!process.env.NEXTAUTH_URL,
      },
      time: {
        serverTime: new Date().toISOString(),
        timestamp: Date.now(),
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Error in debug endpoint',
        message: error instanceof Error ? error.message : 'Unknown error',
        stack:
          process.env.NODE_ENV === 'development'
            ? error instanceof Error
              ? error.stack
              : null
            : null,
        time: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
