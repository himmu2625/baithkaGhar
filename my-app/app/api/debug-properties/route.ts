import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const dbConnect = (await import('@/lib/db/dbConnect')).default;
    const Property = (await import('@/models/Property')).default;
    
    await dbConnect();
    
    // Get all properties
    const allProperties = await Property.find({})
      .select('title location isPublished isAvailable verificationStatus createdAt price rating reviewCount')
      .sort({ createdAt: -1 })
      .lean();
    
    // Get specifically published and available
    const publishedAndAvailable = await Property.find({
      isPublished: true,
      isAvailable: true
    }).select('title location verificationStatus').lean();
    
    // Get with approved status
    const approvedProperties = await Property.find({
      isPublished: true,
      isAvailable: true,
      verificationStatus: 'approved'
    }).select('title location').lean();
    
    return NextResponse.json({
      success: true,
      summary: {
        total: allProperties.length,
        publishedAndAvailable: publishedAndAvailable.length,
        approved: approvedProperties.length
      },
      allProperties: allProperties.map(p => ({
        id: p._id,
        title: p.title,
        location: p.location,
        isPublished: p.isPublished,
        isAvailable: p.isAvailable,
        verificationStatus: p.verificationStatus,
        price: p.price?.base || 'No price',
        rating: p.rating || 'No rating',
        reviewCount: p.reviewCount || 0,
        createdAt: p.createdAt
      })),
      publishedAndAvailable: publishedAndAvailable.map(p => ({
        id: p._id,
        title: p.title,
        location: p.location,
        verificationStatus: p.verificationStatus
      })),
      approvedProperties: approvedProperties.map(p => ({
        id: p._id,
        title: p.title,
        location: p.location
      }))
    });

  } catch (error) {
    console.error('Error fetching properties:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch properties',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 