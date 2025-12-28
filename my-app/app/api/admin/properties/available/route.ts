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

    // Fetch ALL properties for admin, not just published ones
    // Admins should be able to assign any property to an owner
    const properties = await Property.find({})
    .select('title name slug location address price rating reviewCount images categorizedImages legacyGeneralImages propertyType maxGuests bedrooms generalAmenities createdAt status isPublished')
    .sort({ createdAt: -1 })
    .lean();

    // Format the properties for easier display
    const formattedProperties = properties.map(property => {
      // Try to get the best image available
      let propertyImage = null;

      // First try categorized images (exterior)
      if (Array.isArray(property.categorizedImages) && property.categorizedImages.length > 0) {
        const exteriorImages = property.categorizedImages.find((img: any) => img.category === 'exterior');
        if (exteriorImages?.files?.[0]?.url) {
          propertyImage = exteriorImages.files[0].url;
        } else {
          // If no exterior, get first available category image
          const firstCategoryWithImages = property.categorizedImages.find((img: any) => img.files?.length > 0);
          propertyImage = firstCategoryWithImages?.files?.[0]?.url || null;
        }
      }

      // Fallback to legacyGeneralImages
      if (!propertyImage && Array.isArray(property.legacyGeneralImages) && property.legacyGeneralImages.length > 0) {
        propertyImage = property.legacyGeneralImages[0]?.url || property.legacyGeneralImages[0] || null;
      }

      // Fallback to images array
      if (!propertyImage && Array.isArray(property.images) && property.images.length > 0) {
        propertyImage = property.images[0];
      }

      return {
        _id: property._id,
        title: property.title,
        name: property.name || property.title, // Include name field
        location: property.location || property.address?.city || 'Location not specified',
        price: property.price?.base || 0,
        rating: property.rating || 0,
        reviewCount: property.reviewCount || 0,
        propertyType: property.propertyType || 'Property',
        maxGuests: property.maxGuests || 1,
        bedrooms: property.bedrooms || 1,
        image: propertyImage,
        status: property.status,
        isPublished: property.isPublished
      };
    });

    return NextResponse.json({
      success: true,
      properties: formattedProperties,
      data: formattedProperties,
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