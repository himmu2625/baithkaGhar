import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { advancedCache } from '@/lib/cache/advanced-cache';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get cache statistics
    const cacheStats = advancedCache.getStats();
    
    // Calculate performance metrics
    const performanceData = {
      pageLoadTime: Math.floor(Math.random() * 500) + 200, // Simulated for demo
      memoryUsage: process.memoryUsage().heapUsed,
      cacheHitRate: cacheStats.hits > 0 
        ? Math.round((cacheStats.hits / (cacheStats.hits + cacheStats.misses)) * 100)
        : 0,
      networkRequests: cacheStats.sets + cacheStats.deletes,
      cacheSize: cacheStats.size,
      cacheMemoryUsage: cacheStats.memoryUsage,
      uptime: process.uptime(),
      timestamp: Date.now(),
    };

    return NextResponse.json({
      success: true,
      data: performanceData,
    });

  } catch (error) {
    console.error('Performance metrics error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch performance metrics' 
      },
      { status: 500 }
    );
  }
} 