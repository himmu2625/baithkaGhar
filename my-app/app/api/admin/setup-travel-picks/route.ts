import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db/dbConnect';
import Property from '@/models/Property';
import TravelPick from '@/models/TravelPick';

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    
    const results = {
      stepsCompleted: [] as string[],
      success: false,
      travelPicks: [] as any[]
    };

    // Step 1: Get available properties
    const properties = await Property.find({
      isPublished: true,
      status: 'available'
    }).select('title location address price rating reviewCount propertyType maxGuests bedrooms isPublished verificationStatus status').lean();

    results.stepsCompleted.push(`Found ${properties.length} available properties`);

    if (properties.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'No available properties found',
        results
      });
    }

    // Step 2: Clear existing travel picks
    await TravelPick.deleteMany({});
    results.stepsCompleted.push('Cleared existing travel picks');

    // Step 3: Select up to 5 properties for travel picks
    const selectedProperties = properties.slice(0, 5);
    results.stepsCompleted.push(`Selected ${selectedProperties.length} properties for travel picks`);

    // Step 4: Create travel picks with rankings and realistic metrics
    const travelPicksData = selectedProperties.map((property, index) => {
      const rank = index + 1;
      const baseScore = 95 - (index * 5); // Decreasing scores: 95, 90, 85, 80, 75
      
      return {
        propertyId: property._id,
        rank: rank,
        score: baseScore + (Math.random() * 3), // Add some randomness
        metrics: {
          rating: property.rating || (4.2 + Math.random() * 0.8), // 4.2-5.0
          reviewCount: property.reviewCount || (20 + Math.floor(Math.random() * 80)), // 20-100
          bookingCount: Math.max(1, 25 - (index * 4) + Math.floor(Math.random() * 10)), // Decreasing with rank
          recentBookings: Math.max(1, 8 - index + Math.floor(Math.random() * 3)), // Recent activity
          revenue: Math.max(10000, 80000 - (index * 15000) + Math.floor(Math.random() * 20000)), // Revenue based on rank
          occupancyRate: Math.max(0.6, 0.9 - (index * 0.05) + Math.random() * 0.1) // High occupancy for top ranks
        },
        isActive: true
      };
    });

    // Step 5: Insert travel picks
    const insertedTravelPicks = await TravelPick.insertMany(travelPicksData);
    results.stepsCompleted.push(`Created ${insertedTravelPicks.length} travel picks`);

    // Step 6: Fetch and return the created travel picks with property details
    const finalTravelPicks = await TravelPick.find({ isActive: true })
      .populate({
        path: 'propertyId',
        model: Property,
        select: 'title location address price rating reviewCount propertyType maxGuests bedrooms'
      })
      .sort({ rank: 1 });

    results.success = true;
    results.travelPicks = finalTravelPicks.map(tp => ({
      rank: tp.rank,
      score: tp.score.toFixed(1),
      property: {
        id: tp.propertyId._id,
        title: tp.propertyId.title,
        location: tp.propertyId.location || tp.propertyId.address?.city || 'Unknown',
        price: tp.propertyId.price?.base || 'Not set',
        rating: tp.metrics.rating.toFixed(1),
        reviewCount: tp.metrics.reviewCount,
        propertyType: tp.propertyId.propertyType,
        maxGuests: tp.propertyId.maxGuests,
        bedrooms: tp.propertyId.bedrooms
      },
      metrics: {
        rating: tp.metrics.rating.toFixed(1),
        reviewCount: tp.metrics.reviewCount,
        bookingCount: tp.metrics.bookingCount,
        recentBookings: tp.metrics.recentBookings,
        revenue: tp.metrics.revenue.toLocaleString(),
        occupancyRate: (tp.metrics.occupancyRate * 100).toFixed(1) + '%'
      }
    }));

    results.stepsCompleted.push('Travel picks setup completed successfully');

    return NextResponse.json({
      success: true,
      message: `Successfully set up ${insertedTravelPicks.length} travel picks with rankings`,
      results
    });

  } catch (error) {
    console.error('Error setting up travel picks:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to set up travel picks',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 