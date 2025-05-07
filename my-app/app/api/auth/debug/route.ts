import { NextResponse } from 'next/server';
import { connectMongo } from '@/lib/db/mongodb';
import mongoose from 'mongoose';
import { cookies, headers } from 'next/headers';
import { OtpMethod, OtpPurpose } from '@/lib/auth/otp';

export const dynamic = 'force-dynamic';

export async function GET() {
  const headersList = headers();
  const host = headersList.get('host') || 'unknown';
  const userAgent = headersList.get('user-agent') || 'unknown';
  const cookieStore = cookies();
  const allCookies = cookieStore.getAll().map(c => c.name);
  const hasSessionToken = cookieStore.has('next-auth.session-token');
  const hasCsrfToken = cookieStore.has('next-auth.csrf-token');

  const diagnostics: Record<string, any> = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    host: {
      hostname: host,
      userAgent: userAgent,
    },
    auth: {
      secrets: {
        authSecret: !!process.env.AUTH_SECRET,
        nextAuthSecret: !!process.env.NEXTAUTH_SECRET,
      },
      urls: {
        authUrl: process.env.AUTH_URL,
        nextAuthUrl: process.env.NEXTAUTH_URL,
        vercelUrl: process.env.VERCEL_URL,
      },
      trustHost: process.env.AUTH_TRUST_HOST === 'true' || !!process.env.VERCEL,
      cookies: {
        allCookies,
        hasSessionToken,
        hasCsrfToken,
      },
    },
    database: {
      uri: !!process.env.MONGODB_URI,
      connection: 'Not tested',
    }
  };

  // Check MongoDB connection
  try {
    await connectMongo();
    diagnostics.database.connection = 'Connected';
    diagnostics.database.version = mongoose.version;
    diagnostics.database.readyState = mongoose.connection.readyState;
    
    // Test if we can read data from a simple collection
    try {
      const testColl = mongoose.connection.collection('system.version');
      if (testColl) {
        const doc = await testColl.findOne({});
        diagnostics.database.readTest = doc ? 'Success' : 'No data';
      }
    } catch (dbOpError: any) {
      diagnostics.database.readTest = `Error: ${dbOpError.message}`;
    }
  } catch (error: any) {
    diagnostics.database.connection = 'Failed';
    diagnostics.database.error = error.message;
  }

  // Check OTP configuration
  diagnostics.otp = {
    purposes: Object.values(OtpPurpose),
    methods: Object.values(OtpMethod),
  };

  // OAuth providers
  diagnostics.oauth = {
    google: {
      clientId: !!process.env.GOOGLE_CLIENT_ID,
      clientSecret: !!process.env.GOOGLE_CLIENT_SECRET,
    }
  };

  // Check if vercel functions are available
  diagnostics.deployment = {
    platform: process.env.VERCEL ? 'Vercel' : 'Other',
    region: process.env.VERCEL_REGION || 'unknown',
  };

  return NextResponse.json({
    status: 'ok',
    message: 'Auth diagnostics',
    diagnostics
  });
} 