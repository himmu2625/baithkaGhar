import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    const dbConnect = (await import('@/lib/db/dbConnect')).default;
    const Property = (await import('@/models/Property')).default;
    const TravelPick = (await import('@/models/TravelPick')).default;
    
    await dbConnect();
    
    console.log('🔧 Starting travel picks fix...');
    
    // Step 1: Find all properties
    const allProperties = await Property.find({}).lean();
    console.log(`Found ${allProperties.length} total properties`);
    
    if (allProperties.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'No properties found in database'
      });
    }
    
    // Step 2: Ensure all properties are published and available
    const updateResult = await Property.updateMany(
      {},
      {
        $set: {
          isPublished: true,
          isAvailable: true,
          verificationStatus: 'approved'
        }
      }
    );
    
    console.log(`Updated ${updateResult.modifiedCount} properties to be published and available`);
    
    // Step 3: Get updated properties
    const updatedProperties = await Property.find({
      isPublished: true,
      isAvailable: true
    }).lean();
    
    console.log(`Now have ${updatedProperties.length} published and available properties`);
    
    // Step 4: Clear existing travel picks
    await TravelPick.updateMany({}, { isActive: false });
    console.log('Cleared existing travel picks');
    
    // Step 5: Create travel picks for all properties
    const travelPicksData = updatedProperties.map((property, index) => ({
      propertyId: property._id,
      rank: index + 1,
      score: 85 + (Math.random() * 10), // Random score between 85-95
      metrics: {
        rating: property.rating || (4.0 + Math.random() * 1), // 4.0-5.0
        reviewCount: property.reviewCount || (20 + Math.floor(Math.random() * 80)), // 20-100
        bookingCount: 10 + Math.floor(Math.random() * 20), // 10-30
        recentBookings: 1 + Math.floor(Math.random() * 5), // 1-5
        revenue: 50000 + Math.floor(Math.random() * 100000), // 50k-150k
        occupancyRate: 0.7 + Math.random() * 0.3 // 70%-100%
      },
      isActive: true
    }));
    
    // Step 6: Insert new travel picks
    const insertedTravelPicks = await TravelPick.insertMany(travelPicksData);
    console.log(`Created ${insertedTravelPicks.length} travel picks`);
    
    // Step 7: Verify the travel picks
    const verifyTravelPicks = await TravelPick.find({ isActive: true })
      .populate({
        path: 'propertyId',
        model: Property,
        select: 'title location price rating reviewCount'
      })
      .sort({ rank: 1 });
    
    return NextResponse.json({
      success: true,
      message: `Fixed travel picks with ${insertedTravelPicks.length} properties`,
      data: {
        propertiesUpdated: updateResult.modifiedCount,
        travelPicksCreated: insertedTravelPicks.length,
        travelPicks: verifyTravelPicks.map(tp => ({
          rank: tp.rank,
          title: tp.propertyId?.title || 'Unknown',
          location: tp.propertyId?.location || 'Unknown',
          score: tp.score.toFixed(1)
        }))
      }
    });

  } catch (error) {
    console.error('Error fixing travel picks:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fix travel picks',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}