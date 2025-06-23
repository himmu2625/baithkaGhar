import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const dbConnect = (await import('@/lib/db/dbConnect')).default;
    const TravelPick = (await import('@/models/TravelPick')).default;
    const Property = (await import('@/models/Property')).default;
    
    await dbConnect();
    
    // Get all travel picks (including inactive ones)
    const allTravelPicks = await TravelPick.find({})
      .populate({
        path: 'propertyId',
        model: Property,
        select: 'title location isPublished isAvailable verificationStatus'
      })
      .sort({ rank: 1 });
    
    // Get all properties
    const allProperties = await Property.find({})
      .select('title location isPublished isAvailable verificationStatus createdAt')
      .sort({ createdAt: -1 });
    
    // Get eligible properties for travel picks
    const eligibleProperties = await Property.find({
      isPublished: true,
      isAvailable: true,
      verificationStatus: 'approved'
    }).select('title location isPublished isAvailable verificationStatus');
    
    return NextResponse.json({
      success: true,
      debug: {
        timestamp: new Date().toISOString(),
        totalProperties: allProperties.length,
        eligibleProperties: eligibleProperties.length,
        totalTravelPicks: allTravelPicks.length,
        activeTravelPicks: allTravelPicks.filter(tp => tp.isActive).length
      },
      data: {
        allTravelPicks: allTravelPicks.map(tp => ({
          id: tp._id,
          rank: tp.rank,
          score: tp.score,
          isActive: tp.isActive,
          property: tp.propertyId ? {
            id: tp.propertyId._id,
            title: tp.propertyId.title,
            location: tp.propertyId.location,
            isPublished: tp.propertyId.isPublished,
            isAvailable: tp.propertyId.isAvailable,
            verificationStatus: tp.propertyId.verificationStatus
          } : null
        })),
        allProperties: allProperties.map(p => ({
          id: p._id,
          title: p.title,
          location: p.location,
          isPublished: p.isPublished,
          isAvailable: p.isAvailable,
          verificationStatus: p.verificationStatus,
          createdAt: p.createdAt
        })),
        eligibleProperties: eligibleProperties.map(p => ({
          id: p._id,
          title: p.title,
          location: p.location,
          isPublished: p.isPublished,
          isAvailable: p.isAvailable,
          verificationStatus: p.verificationStatus
        }))
      }
    });

  } catch (error) {
    console.error('Error in travel picks debug:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to debug travel picks',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 