import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import Property from '@/models/Property';
import { connectToDatabase } from '@/lib/mongodb';

export const dynamic = 'force-dynamic';

// POST /api/admin/properties/toggle-prices
// Toggle price visibility for all properties or specific property
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    // Check if user is authenticated and is admin
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user is admin or super_admin
    const userRole = (session.user as any).role;
    if (!['admin', 'super_admin'].includes(userRole)) {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      );
    }

    await connectToDatabase();

    const body = await request.json();
    const { propertyId, hidePrices } = body;

    // If propertyId is provided, toggle for single property
    if (propertyId) {
      const property = await Property.findByIdAndUpdate(
        propertyId,
        { hidePrices: hidePrices },
        { new: true }
      );

      if (!property) {
        return NextResponse.json(
          { error: 'Property not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        message: `Price visibility ${hidePrices ? 'hidden' : 'shown'} for property`,
        property: {
          id: property._id,
          title: property.title,
          hidePrices: property.hidePrices
        }
      });
    }

    // If no propertyId, toggle for all properties
    const result = await Property.updateMany(
      {},
      { $set: { hidePrices: hidePrices } }
    );

    return NextResponse.json({
      success: true,
      message: `Price visibility ${hidePrices ? 'hidden' : 'shown'} for all properties`,
      updated: result.modifiedCount
    });

  } catch (error) {
    console.error('Error toggling price visibility:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// GET /api/admin/properties/toggle-prices
// Get current price visibility status
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userRole = (session.user as any).role;
    if (!['admin', 'super_admin'].includes(userRole)) {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      );
    }

    await connectToDatabase();

    // Count properties with hidden prices
    const totalProperties = await Property.countDocuments({});
    const hiddenPricesCount = await Property.countDocuments({ hidePrices: true });

    return NextResponse.json({
      success: true,
      totalProperties,
      hiddenPricesCount,
      visiblePricesCount: totalProperties - hiddenPricesCount,
      allPricesHidden: totalProperties === hiddenPricesCount,
      allPricesVisible: hiddenPricesCount === 0
    });

  } catch (error) {
    console.error('Error getting price visibility status:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
