import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    const dbConnect = (await import('@/lib/db/dbConnect')).default;
    const TravelPick = (await import('@/models/TravelPick')).default;
    const Property = (await import('@/models/Property')).default;
    const Booking = (await import('@/models/Booking')).default;
    
    await dbConnect();
    
    console.log("🔄 Force updating travel picks...");
    
    // Get ALL published and available properties (not just approved ones)
    const allProperties = await Property.find({
      isPublished: true,
      isAvailable: true
      // Removed verificationStatus filter to include all your properties
    }).lean();
    
    console.log(`Found ${allProperties.length} published and available properties`);
    
    if (allProperties.length === 0) {
      // Show debug info about all properties
      const allPropsDebug = await Property.find({})
        .select('title isPublished isAvailable verificationStatus')
        .lean();
      
      return NextResponse.json({
        success: false,
        message: 'No published and available properties found',
        debug: {
          totalProperties: allPropsDebug.length,
          properties: allPropsDebug.map(p => ({
            title: p.title,
            isPublished: p.isPublished,
            isAvailable: p.isAvailable,
            verificationStatus: p.verificationStatus
          }))
        }
      });
    }
    
    const propertyScores = [];
    
    for (const property of allProperties) {
      // Get booking metrics for the last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const recentBookings = await Booking.countDocuments({
        propertyId: property._id,
        status: { $in: ["confirmed", "completed"] },
        createdAt: { $gte: thirtyDaysAgo },
      });

      const totalBookings = await Booking.countDocuments({
        propertyId: property._id,
        status: { $in: ["confirmed", "completed"] },
      });

      // Calculate revenue from bookings
      const bookingRevenue = await Booking.aggregate([
        {
          $match: {
            propertyId: property._id,
            status: { $in: ["confirmed", "completed"] },
            totalPrice: { $exists: true },
          },
        },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: "$totalPrice" },
          },
        },
      ]);

      const revenue = bookingRevenue.length > 0 ? bookingRevenue[0].totalRevenue : 0;

      // Calculate occupancy rate (simplified)
      const daysActive = Math.max(
        1,
        Math.floor((new Date().getTime() - property.createdAt) / (1000 * 60 * 60 * 24))
      );
      const occupancyRate = Math.min(totalBookings / (daysActive / 30), 1);

      // Calculate score with generous defaults
      const weights = {
        rating: 0.25, // 25% weight
        reviews: 0.15, // 15% weight
        bookings: 0.3, // 30% weight
        recent: 0.2, // 20% weight
        revenue: 0.1, // 10% weight
      };

      const ratingScore = (property.rating || 4.5) * 20; // Default 4.5 rating
      const reviewScore = Math.min((property.reviewCount || 10) * 2, 100); // Default 10 reviews
      const bookingScore = Math.min((totalBookings || 5) * 10, 100); // Minimum score
      const recentBookingScore = Math.min((recentBookings || 1) * 20, 100); // Minimum recent activity
      const revenueScore = Math.min((revenue || 10000) / 1000, 100); // Default revenue

      const totalScore =
        ratingScore * weights.rating +
        reviewScore * weights.reviews +
        bookingScore * weights.bookings +
        recentBookingScore * weights.recent +
        revenueScore * weights.revenue;

      propertyScores.push({
        propertyId: property._id,
        propertyTitle: property.title,
        score: totalScore,
        metrics: {
          rating: property.rating || 4.5,
          reviewCount: property.reviewCount || 10,
          bookingCount: totalBookings || 5,
          recentBookings: recentBookings || 1,
          revenue: revenue || 10000,
          occupancyRate,
        },
      });
    }

    // Sort by score and take all properties (up to 5)
    propertyScores.sort((a, b) => b.score - a.score);
    const topProperties = propertyScores.slice(0, Math.min(5, propertyScores.length));

    // Clear existing travel picks
    await TravelPick.updateMany({}, { isActive: false });

    // Create new travel picks
    const newTravelPicks = topProperties.map((prop, index) => ({
      propertyId: prop.propertyId,
      rank: index + 1,
      score: prop.score,
      metrics: prop.metrics,
      isActive: true,
    }));

    if (newTravelPicks.length > 0) {
      await TravelPick.insertMany(newTravelPicks);
      
      return NextResponse.json({
        success: true,
        message: `Travel picks force updated with ${newTravelPicks.length} properties`,
        data: {
          totalPropertiesFound: allProperties.length,
          travelPicksCreated: newTravelPicks.length,
          properties: topProperties.map((prop, index) => ({
            rank: index + 1,
            title: prop.propertyTitle,
            score: prop.score.toFixed(2),
            metrics: prop.metrics
          }))
        }
      });
    } else {
      return NextResponse.json({
        success: false,
        message: 'No properties found to create travel picks'
      });
    }

  } catch (error) {
    console.error('Error force updating travel picks:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to force update travel picks',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 