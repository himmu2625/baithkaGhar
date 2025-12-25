import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@/lib/db';
import Property from '@/models/Property';
import { adminApiAuth } from '@/lib/admin-auth';

// GET - Fetch all available properties for travel picks selection
export async function GET(request: NextRequest) {
  try {
    const adminAuth = await adminApiAuth(request);
    if (adminAuth instanceof NextResponse) {
      return adminAuth;
    }

    await dbConnect();
    
    const properties = await Property.find({
      isPublished: true,
      $or: [
        { isAvailable: true },
        { isAvailable: { $exists: false } }
      ]
    })
    .select('title location address price rating reviewCount images categorizedImages legacyGeneralImages propertyType maxGuests bedrooms generalAmenities createdAt')
    .sort({ createdAt: -1 })
    .lean();

    // Format the properties for easier display
    const formattedProperties = properties.map(property => {
      const exteriorImage = Array.isArray(property.categorizedImages)
        ? property.categorizedImages.find((img: any) => img.category === 'exterior')?.files?.[0]?.url
        : undefined;
      return {
        _id: property._id,
        title: property.title,
        location: property.location || property.address?.city || 'Location not specified',
        price: property.price?.base || 0,
        rating: property.rating || 0,
        reviewCount: property.reviewCount || 0,
        propertyType: property.propertyType || 'Property',
        maxGuests: property.maxGuests || 1,
        bedrooms: property.bedrooms || 1,
        image: exteriorImage ||
               property.legacyGeneralImages?.[0] ||
               property.images?.[0] ||
               null
      };
    });

    return NextResponse.json({
      success: true,
      properties: formattedProperties,
      count: formattedProperties.length
    });

  } catch (error) {
    console.error('Error fetching available properties:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch available properties' },
      { status: 500 }
    );
  }
} 