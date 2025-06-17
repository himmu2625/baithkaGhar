import { NextRequest, NextResponse } from "next/server";
import { connectMongo } from "@/lib/db/mongodb";
import Property from "@/models/Property";

export async function GET(req: NextRequest) {
  try {
    await connectMongo();

    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q')?.trim();
    const limit = parseInt(searchParams.get('limit') || '10');

    if (!query || query.length < 2) {
      return NextResponse.json({
        success: true,
        results: []
      });
    }

    // Create regex pattern for case-insensitive search
    const searchRegex = new RegExp(query, 'i');

    // Search across multiple fields
    const searchQuery = {
      $and: [
        {
          status: 'available',
          isPublished: true,
          verificationStatus: 'approved'
        },
        {
          $or: [
            // Search in property title/name
            { title: searchRegex },
            { name: searchRegex },
            
            // Search in address fields
            { 'address.city': searchRegex },
            { 'address.state': searchRegex },
            { 'address.street': searchRegex },
            
            // Search in legacy location field
            { location: searchRegex },
            
            // Search in legacy city field (if exists)
            { city: searchRegex },
            
            // Search in property type
            { propertyType: searchRegex }
          ]
        }
      ]
    };

    const properties = await Property.find(searchQuery)
      .select('title name address location city propertyType price.base categorizedImages legacyGeneralImages images')
      .limit(limit)
      .lean();

    // Format results for frontend
    const results = properties.map(property => {
      // Get thumbnail image
      let thumbnail = null;
      if (property.categorizedImages && property.categorizedImages.length > 0) {
        const firstCategory = property.categorizedImages[0];
        if (firstCategory.files && firstCategory.files.length > 0) {
          thumbnail = firstCategory.files[0]?.url || null;
        }
      } else if (property.legacyGeneralImages && property.legacyGeneralImages.length > 0) {
        thumbnail = property.legacyGeneralImages[0]?.url || null;
      } else if (property.images && property.images.length > 0) {
        thumbnail = typeof property.images[0] === 'string' 
          ? property.images[0]
          : (property.images[0] as any)?.url || null;
      }

      const city = property.address?.city || (property as any).city || 'Unknown City';
      const displayName = property.title || property.name || 'Unnamed Property';
      const fullAddress = property.address ? 
        `${property.address.street}, ${property.address.city}, ${property.address.state}` :
        (property.location || city);

      return {
        id: property._id.toString(),
        name: displayName,
        city: city,
        address: fullAddress,
        type: property.propertyType,
        price: property.price?.base || 0,
        thumbnail: thumbnail,
        // Indicate what field matched the search
        matchType: getMatchType(property, query)
      };
    });

    // Also get unique cities for location suggestions
    const cityAggregation = await Property.aggregate([
      {
        $match: {
          status: 'available',
          isPublished: true,
          verificationStatus: 'approved',
          $or: [
            { 'address.city': searchRegex },
            { city: searchRegex }
          ]
        }
      },
      {
        $group: {
          _id: { $ifNull: ['$address.city', '$city'] },
          count: { $sum: 1 }
        }
      },
      {
        $match: {
          _id: { $ne: null }
        }
      },
      {
        $sort: { count: -1 }
      },
      {
        $limit: 5
      }
    ]);

    const cities = cityAggregation.map(item => ({
      name: item._id,
      count: item.count,
      type: 'city'
    }));

    return NextResponse.json({
      success: true,
      results: results,
      cities: cities,
      total: results.length
    });

  } catch (error) {
    console.error('Advanced search error:', error);
    return NextResponse.json(
      { success: false, message: "Search failed" },
      { status: 500 }
    );
  }
}

// Helper function to determine what field matched the search
function getMatchType(property: any, query: string): string {
  const queryLower = query.toLowerCase();
  
  if (property.title?.toLowerCase().includes(queryLower) || 
      property.name?.toLowerCase().includes(queryLower)) {
    return 'property';
  }
  
  if (property.address?.city?.toLowerCase().includes(queryLower) ||
      property.city?.toLowerCase().includes(queryLower)) {
    return 'city';
  }
  
  if (property.address?.street?.toLowerCase().includes(queryLower) ||
      property.location?.toLowerCase().includes(queryLower)) {
    return 'address';
  }
  
  if (property.propertyType?.toLowerCase().includes(queryLower)) {
    return 'type';
  }
  
  return 'other';
} 