import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath, revalidateTag } from 'next/cache';
import { auth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET /api/clear-cache - Clear Next.js cache (admin only)
export async function GET(req: NextRequest) {
  try {
    const session = await auth();

    // Check if user is admin
    if (session?.user?.role !== 'admin' && session?.user?.role !== 'super_admin') {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required' },
        { status: 403 }
      );
    }

    const clearedPaths: string[] = [];

    // Revalidate homepage
    try {
      revalidatePath('/');
      clearedPaths.push('/');
    } catch (err) {
      console.error('Error revalidating /:', err);
    }

    // Revalidate cities pages
    try {
      revalidatePath('/cities');
      clearedPaths.push('/cities');
    } catch (err) {
      console.error('Error revalidating /cities:', err);
    }

    // Revalidate API routes
    try {
      revalidatePath('/api/cities/visible');
      clearedPaths.push('/api/cities/visible');
    } catch (err) {
      console.error('Error revalidating /api/cities/visible:', err);
    }

    return NextResponse.json({
      success: true,
      message: 'Cache cleared successfully',
      clearedPaths,
      note: 'Please refresh your browser to see changes',
    });
  } catch (error: any) {
    console.error('Error clearing cache:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to clear cache',
      },
      { status: 500 }
    );
  }
}
