import { NextResponse } from 'next/server';
import { seedCities } from '@/lib/seed-cities';
import { auth } from '@/lib/auth';

export async function GET() {
  try {
    const session = await auth();
    
    // Only admin can trigger initialization
    if (session?.user?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required' },
        { status: 403 }
      );
    }
    
    await seedCities();
    
    return NextResponse.json({ 
      success: true,
      message: 'Application initialized successfully'
    });
  } catch (error) {
    console.error('Error in GET /api/initialize:', error);
    return NextResponse.json(
      { error: 'Failed to initialize application' },
      { status: 500 }
    );
  }
} 