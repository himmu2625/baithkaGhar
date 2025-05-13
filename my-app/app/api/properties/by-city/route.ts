import { NextRequest, NextResponse } from "next/server"
import { dbHandler } from "@/lib/db"
import { connectMongo } from "@/lib/db/mongodb"
import Property from "@/models/Property"
import { formatPropertyType } from "@/lib/utils"

// Mark this route as dynamic since it uses search params
export const dynamic = 'force-dynamic';

// Simple GET handler for properties by city
export const GET = dbHandler(async (req: NextRequest) => {
  try {
    await connectMongo()

    const { searchParams } = new URL(req.url)
    const city = searchParams.get('city')
    
    console.log(`[by-city] Received city property search request for: ${city}`);
    
    if (!city) {
      return NextResponse.json(
        { success: false, message: "City parameter is required" },
        { status: 400 }
      )
    }
    
    // Create a more flexible query that includes both status fields
    // and verificationStatus to ensure properties show up correctly
    const query: any = { 
      // These are the essential conditions for a property to be visible
      isPublished: true,
      verificationStatus: 'approved',
      
      // Match one of these status options
      $or: [
        { status: 'available' },
        { status: 'active' }
      ]
    };
    
    // Add city filter as a separate condition
    if (city) {
      const cityRegex = new RegExp(city, 'i');
      query.$and = [{
        $or: [
          { 'address.city': cityRegex },
          { city: cityRegex }
        ]
      }];
    }
    
    console.log('[by-city] Executing property query:', JSON.stringify(query, null, 2));
    
    const properties = await Property.find(query)
      .populate('userId', 'name email')
      .sort({ createdAt: -1 })
      .lean()
    
    console.log(`[by-city] Found ${properties.length} properties for city: ${city}`);
    
    if (properties.length > 0) {
      // Log the status of each property to help debugging
      console.log('[by-city] Property statuses:', properties.map(p => ({
        id: p._id,
        title: p.title || p.name,
        status: p.status,
        verificationStatus: p.verificationStatus,
        isPublished: p.isPublished
      })));
    } else {
      console.log('[by-city] No properties found with query:', JSON.stringify(query, null, 2));
    }
    
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
    
    // Set cache control headers to prevent caching
    const response = NextResponse.json({
      success: true,
      properties: formattedProperties
    });
    response.headers.set('Cache-Control', 'no-store, max-age=0');
    
    return response;
  } catch (error) {
    console.error("[by-city] Error fetching properties:", error)
    return NextResponse.json(
      { success: false, message: "Failed to fetch properties" },
      { status: 500 }
    )
  }
}) 