import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db/dbConnect';
import TravelPick from '@/models/TravelPick';
import Property from '@/models/Property';
import Booking from '@/models/Booking';
import { adminApiAuth } from '@/lib/admin-auth';
import TravelPicksAutoUpdater from '@/lib/services/travel-picks-auto-update';

// GET - Fetch current travel picks
export async function GET() {
  try {
    await dbConnect();
    
    const travelPicks = await TravelPick.find({ isActive: true })
      .populate({
        path: 'propertyId',
        model: Property,
        select: 'title location price rating reviewCount images propertyType maxGuests bedrooms generalAmenities'
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

// POST - Update travel picks based on current metrics
export async function POST(request: NextRequest) {
  try {
    const { isAdminRequest } = await request.json();
    
    if (isAdminRequest) {
      const adminAuth = await adminApiAuth(request);
      if (adminAuth instanceof NextResponse) {
        return adminAuth; // Return the error response
      }
    }

    // Use the auto-updater service
    const success = await TravelPicksAutoUpdater.manualUpdate();

    if (success) {
      return NextResponse.json({
        success: true,
        message: 'Travel picks updated successfully'
      });
    } else {
      return NextResponse.json({
        success: false,
        error: 'Failed to update travel picks'
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Error updating travel picks:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update travel picks' },
      { status: 500 }
    );
  }
} 