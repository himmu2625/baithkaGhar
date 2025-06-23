import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    const dbConnect = (await import('@/lib/db/dbConnect')).default;
    const TravelPick = (await import('@/models/TravelPick')).default;
    const Property = (await import('@/models/Property')).default;
    
    await dbConnect();
    
    console.log('🚀 Initializing travel picks for ALL properties...');
    
    // Step 1: Get ALL properties (don't filter by status)
    const allProperties = await Property.find({})
      .select('title location price rating reviewCount images categorizedImages legacyGeneralImages propertyType maxGuests bedrooms generalAmenities isPublished isAvailable verificationStatus')
      .lean();
    
    console.log(`Found ${allProperties.length} total properties in database`);
    
    if (allProperties.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'No properties found in database'
      });
    }
    
    // Step 2: Update ALL properties to be published and available
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
    
    console.log(`Updated ${updateResult.modifiedCount} properties to published/available/approved status`);
    
    // Step 3: Clear existing travel picks
    await TravelPick.deleteMany({});
    console.log('Cleared all existing travel picks');
    
    // Step 4: Create travel picks for ALL properties
    const travelPicksData = allProperties.map((property, index) => ({
      propertyId: property._id,
      rank: index + 1,
      score: 90 - (index * 2) + Math.random() * 5, // Decreasing scores: 90-95, 88-93, 86-91, etc.
      metrics: {
        rating: property.rating || (4.2 + Math.random() * 0.8), // 4.2-5.0
        reviewCount: property.reviewCount || (15 + Math.floor(Math.random() * 50)), // 15-65
        bookingCount: 8 + Math.floor(Math.random() * 25), // 8-33
        recentBookings: 1 + Math.floor(Math.random() * 6), // 1-6
        revenue: 40000 + Math.floor(Math.random() * 80000), // 40k-120k
        occupancyRate: 0.65 + Math.random() * 0.35 // 65%-100%
      },
      isActive: true
    }));
    
    // Step 5: Insert new travel picks
    const insertedTravelPicks = await TravelPick.insertMany(travelPicksData);
    console.log(`Created ${insertedTravelPicks.length} travel picks`);
    
    // Step 6: Fetch and return the created travel picks with property details
    const finalTravelPicks = await TravelPick.find({ isActive: true })
      .populate({
        path: 'propertyId',
        model: Property,
        select: 'title location price rating reviewCount images categorizedImages legacyGeneralImages propertyType maxGuests bedrooms generalAmenities'
      })
      .sort({ rank: 1 });
    
    return NextResponse.json({
      success: true,
      message: `Successfully initialized travel picks with ${insertedTravelPicks.length} properties`,
      data: {
        totalPropertiesFound: allProperties.length,
        propertiesUpdated: updateResult.modifiedCount,
        travelPicksCreated: insertedTravelPicks.length,
        travelPicks: finalTravelPicks.map(tp => ({
          id: tp._id,
          rank: tp.rank,
          score: tp.score.toFixed(1),
          property: {
            id: tp.propertyId._id,
            title: tp.propertyId.title,
            location: tp.propertyId.location,
            price: tp.propertyId.price?.base || 'No price set',
            rating: tp.propertyId.rating || tp.metrics.rating,
            reviewCount: tp.propertyId.reviewCount || tp.metrics.reviewCount,
            propertyType: tp.propertyId.propertyType,
            maxGuests: tp.propertyId.maxGuests,
            bedrooms: tp.propertyId.bedrooms
          },
          metrics: tp.metrics
        }))
      }
    });

  } catch (error) {
    console.error('Error initializing travel picks:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to initialize travel picks',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 