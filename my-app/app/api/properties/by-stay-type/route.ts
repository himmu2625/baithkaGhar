import { NextRequest, NextResponse } from 'next/server'
import { connectMongo } from '@/lib/db/mongodb'
import Property from '@/models/Property'

export async function GET(req: NextRequest) {
  try {
    await connectMongo()

    const { searchParams } = new URL(req.url)
    const stayType = searchParams.get('stayType')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit

    if (!stayType) {
      return NextResponse.json(
        { success: false, message: 'Stay type parameter is required' },
        { status: 400 }
      )
    }

    // Build query to find properties with the specified stay type
    const query: any = {
      status: { $in: ['available'] }, // Include available properties (mapped from 'active' in frontend)
      isPublished: true,
      verificationStatus: { $in: ['approved', 'pending'] }, // Include both approved and pending for now
      stayTypes: { $in: [stayType] }
    }

    console.log(`[by-stay-type] Searching for properties with stay type: ${stayType}`)
    console.log(`[by-stay-type] Query:`, JSON.stringify(query))

    // First, let's check what properties exist in the database at all
    const allProperties = await Property.find({}).select('title status stayTypes isPublished verificationStatus').lean();
    console.log(`[by-stay-type] Total properties in database: ${allProperties.length}`);
    if (allProperties.length > 0) {
      console.log(`[by-stay-type] Sample properties:`, allProperties.slice(0, 3).map(p => ({
        title: p.title,
        status: p.status,
        stayTypes: p.stayTypes,
        isPublished: p.isPublished,
        verificationStatus: p.verificationStatus
      })));
    }

    // Get properties
    const properties = await Property.find(query)
      .populate('userId', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean()

    // Get total count for pagination
    const total = await Property.countDocuments(query)

    console.log(`[by-stay-type] Found ${properties.length} properties for stay type: ${stayType}`)

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
        thumbnail = typeof property.images[0] === 'string' 
          ? property.images[0]
          : (property.images[0] as any)?.url || null;
      }

      // Get price from appropriate field
      const price = property.price?.base || 
                   (property.pricing?.perNight ? parseFloat(property.pricing.perNight as string) : 0);

      return {
        id: property._id.toString(),
        title: property.title || property.name || 'Unnamed Property',
        location: `${property.address?.city || 'Unknown'}, ${property.address?.state || 'Unknown'}`,
        price: price,
        rating: property.rating || 0,
        reviews: property.reviewCount || 0,
        image: thumbnail || '/placeholder.svg',
        stayTypes: property.stayTypes || [],
        bedrooms: property.bedrooms || 0,
        bathrooms: property.bathrooms || 0,
        maxGuests: property.maxGuests || 2,
        amenities: property.amenities || []
      }
    })

    return NextResponse.json({
      success: true,
      properties: formattedProperties,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })

  } catch (error) {
    console.error('[by-stay-type] Error fetching properties:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to fetch properties' },
      { status: 500 }
    )
  }
} 