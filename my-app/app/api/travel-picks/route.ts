import { NextResponse } from 'next/server';
import TravelPicksAutoUpdater from '@/lib/services/travel-picks-auto-update';

// GET - Fetch current travel picks (same as admin endpoint but public)
export async function GET() {
  try {
    const response = await fetch(`${process.env.NEXTAUTH_URL}/api/admin/travel-picks`);
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching travel picks:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch travel picks' },
      { status: 500 }
    );
  }
}

// POST - Trigger travel picks update (public endpoint for manual triggers)
export async function POST() {
  try {
    console.log('🔄 Manual travel picks update triggered via API');
    
    const success = await TravelPicksAutoUpdater.manualUpdate();

    if (success) {
      return NextResponse.json({
        success: true,
        message: 'Travel picks updated successfully',
        timestamp: new Date().toISOString()
      });
    } else {
      return NextResponse.json({
        success: false,
        error: 'Failed to update travel picks - check server logs'
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Error in manual travel picks update:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update travel picks' },
      { status: 500 }
    );
  }
} 