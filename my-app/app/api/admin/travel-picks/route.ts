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

// POST - Update travel picks based on current metrics (automatic)
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

// PUT - Manually select travel picks
export async function PUT(request: NextRequest) {
  try {
    const adminAuth = await adminApiAuth(request);
    if (adminAuth instanceof NextResponse) {
      return adminAuth;
    }

    const { selectedPropertyIds } = await request.json();

    if (!Array.isArray(selectedPropertyIds) || selectedPropertyIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Please select at least one property' },
        { status: 400 }
      );
    }

    if (selectedPropertyIds.length > 5) {
      return NextResponse.json(
        { success: false, error: 'Cannot select more than 5 properties' },
        { status: 400 }
      );
    }

    await dbConnect();

    // Clear existing travel picks
    await TravelPick.deleteMany({});

    // Get property details for selected properties
    const selectedProperties = await Property.find({
      _id: { $in: selectedPropertyIds },
      isPublished: true
    }).lean();

    if (selectedProperties.length !== selectedPropertyIds.length) {
      return NextResponse.json(
        { success: false, error: 'Some selected properties are not available' },
        { status: 400 }
      );
    }

    // Create manual travel picks with proper ranking
    const manualTravelPicks = selectedPropertyIds.map((propertyId, index) => {
      const property = selectedProperties.find(p => p._id.toString() === propertyId);
      
      return {
        propertyId,
        rank: index + 1,
        score: 100 - (index * 2), // Give highest scores to manually selected
        metrics: {
          rating: property?.rating || 4.5,
          reviewCount: property?.reviewCount || 50,
          bookingCount: 20 + (5 - index) * 5, // Simulate metrics based on rank
          recentBookings: 5 + (5 - index),
          revenue: 50000 + (5 - index) * 10000,
          occupancyRate: 0.8 + (5 - index) * 0.02
        },
        isActive: true,
        isManuallySelected: true
      };
    });

    await TravelPick.insertMany(manualTravelPicks);

    // Fetch the created travel picks with property details
    const newTravelPicks = await TravelPick.find({ isActive: true })
      .populate({
        path: 'propertyId',
        model: Property,
        select: 'title location price rating reviewCount images categorizedImages legacyGeneralImages propertyType maxGuests bedrooms generalAmenities'
      })
      .sort({ rank: 1 });

    return NextResponse.json({
      success: true,
      message: `Successfully selected ${manualTravelPicks.length} properties for Travel Picks`,
      data: newTravelPicks
    });

  } catch (error) {
    console.error('Error saving manual travel picks:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to save travel picks selection' },
      { status: 500 }
    );
  }
} 