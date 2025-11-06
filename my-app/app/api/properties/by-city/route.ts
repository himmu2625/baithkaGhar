import { NextRequest, NextResponse } from "next/server"
import { dbHandler } from "@/lib/db"
import { connectMongo } from "@/lib/db/mongodb"
import Property from "@/models/Property"
import { formatPropertyType } from "@/lib/utils"
import { withCache, cacheKeys } from "@/lib/cache"

// Mark this route as dynamic since it uses search params
export const dynamic = 'force-dynamic';

// Simple GET handler for properties by city with caching
export const GET = withCache(
  dbHandler(async (req: NextRequest) => {
  try {
    await connectMongo()

    const { searchParams } = new URL(req.url)
    const city = searchParams.get('city')

    if (!city) {
      return NextResponse.json(
        { success: false, message: "City parameter is required" },
        { status: 400 }
      )
    }

    // Optimized query with indexed fields
    const cityRegex = new RegExp(city, 'i');
    const query: any = {
      isPublished: true,
      verificationStatus: 'approved',
      status: { $in: ['available', 'active'] },
      $or: [
        { 'address.city': cityRegex },
        { city: cityRegex }
      ]
    };

    // Optimized query - select only needed fields (including slug for SEO-friendly URLs)
    const properties = await Property.find(query)
      .select('_id slug title name propertyType status address city price pricing rating bedrooms bathrooms maxGuests verificationStatus categorizedImages legacyGeneralImages images')
      .sort({ createdAt: -1 })
      .lean()
      .limit(50) // Limit results for better performance
    
    // Transform properties for the frontend
    const formattedProperties = properties.map(property => {
      // Find the first available image as thumbnail
      let thumbnail = null;
      if (property.categorizedImages && property.categorizedImages.length > 0) {
        const firstCategory = property.categorizedImages[0];
        if (firstCategory.files && firstCategory.files.length > 0) {
          thumbnail = firstCategory.files[0]?.url || null;
        }
      } else if (property.legacyGeneralImages && property.legacyGeneralImages.length > 0) {
        thumbnail = property.legacyGeneralImages[0]?.url || null;
      } else if (property.images && property.images.length > 0) {
        // Handle string or object with url property
        thumbnail = typeof property.images[0] === 'string' 
          ? property.images[0]
          : (property.images[0] as any)?.url || null;
      }
      
      // Get price from appropriate field
      const price = property.price?.base || 
                   (property.pricing?.perNight ? parseFloat(property.pricing.perNight as string) : 0);
      
      // Get property type from the correct field and make sure it's capitalized using the utility function
      const propertyType = formatPropertyType(property.propertyType);
      
      return {
        id: property._id.toString(),
        slug: (property as any).slug || null, // Include slug for SEO-friendly URLs
        title: property.title || property.name || 'Unnamed Property',
        type: propertyType,
        status: property.status, // Include status in the response
        address: property.address,
        city: property.address?.city || (property as any).city || 'Unknown City',
        price: price,
        thumbnail: thumbnail,
        rating: property.rating || 0,
        bedrooms: property.bedrooms || 0,
        bathrooms: property.bathrooms || 0,
        maxGuests: property.maxGuests || 1,
        verificationStatus: property.verificationStatus // Include verification status
      };
    });
    
    // Set cache control headers for client-side caching
    const response = NextResponse.json({
      success: true,
      properties: formattedProperties
    });
    response.headers.set('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');

    return response;
  } catch (error) {
    console.error("[by-city] Error fetching properties:", error)
    return NextResponse.json(
      { success: false, message: "Failed to fetch properties" },
      { status: 500 }
    )
  }
}),
{
  keyGenerator: (req) => {
    const url = new URL(req.url)
    const city = url.searchParams.get('city') || ''
    return cacheKeys.properties.byCity(city)
  },
  ttl: 300, // 5 minutes cache
}
)