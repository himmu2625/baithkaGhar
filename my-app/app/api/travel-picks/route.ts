import { NextResponse } from 'next/server';
import TravelPicksAutoUpdater from '@/lib/services/travel-picks-auto-update';

// GET - Fetch current travel picks (public version)
export async function GET() {
  try {
    const dbConnect = (await import('@/lib/db/dbConnect')).default;
    const TravelPick = (await import('@/models/TravelPick')).default;
    const Property = (await import('@/models/Property')).default;
    
    await dbConnect();
    
    const travelPicks = await TravelPick.find({ isActive: true })
      .populate({
        path: 'propertyId',
        model: Property,
        select: 'title location price rating reviewCount images categorizedImages legacyGeneralImages propertyType maxGuests bedrooms generalAmenities'
      })
      .sort({ rank: 1 })
      .limit(5);

    return NextResponse.json({
      success: true,
      data: travelPicks
    });

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