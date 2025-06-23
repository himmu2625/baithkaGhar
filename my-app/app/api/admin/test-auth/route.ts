import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { authOptions } from "@/lib/auth";
import { connectMongo } from "@/lib/db/mongodb";
import User from "@/models/User";
import { auth as nextAuthAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export const GET = async (req: NextRequest) => {
  try {
    console.log('=== Admin Test Auth Endpoint ===');
    
    // Get the session
    const session = await nextAuthAuth();
    console.log('Session found:', !!session);
    console.log('User email:', session?.user?.email);
    console.log('User role:', session?.user?.role);
    
    if (!session?.user) {
      return NextResponse.json({
        success: false,
        error: 'No session found',
        requiresAuth: true
      }, { status: 401 });
    }
    
    const userRole = session.user.role;
    const userEmail = session.user.email;
    const isAdmin = userRole === 'admin' || userRole === 'super_admin' || userEmail === 'anuragsingh@baithakaghar.com';
    
    if (!isAdmin) {
      return NextResponse.json({
        success: false,
        error: 'Admin access required',
        userRole,
        userEmail,
        requiresAdminRole: true
      }, { status: 403 });
    }
    
    return NextResponse.json({
      success: true,
      message: 'Admin authentication successful',
      user: {
        email: session.user.email,
        role: session.user.role,
        id: session.user.id
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Admin test auth error:', error);
    return NextResponse.json({
      success: false,
      error: 'Authentication test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}; 