import { NextRequest, NextResponse } from 'next/server';
// @ts-ignore
import getServerSession from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/db/dbConnect';
import Promotion from '@/models/Promotion';
import Property from '@/models/Property';

// GET: Fetch promotions for a specific property
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || !['admin', 'super_admin', 'host'].includes(session.user.role)) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await dbConnect();

    const propertyId = params.id;

    // Verify property exists and user has access
    const property = await Property.findById(propertyId);
    if (!property) {
      return NextResponse.json(
        { success: false, error: 'Property not found' },
        { status: 404 }
      );
    }

    // For hosts, check if they own the property
    if (session.user.role === 'host' && (property as any).host?.toString() !== session.user.id) {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      );
    }

    // Find promotions that apply to this property
    const promotions = await Promotion.find({
      $and: [
        { isActive: true },
        { status: { $in: ['active', 'scheduled'] } },
        {
          $or: [
            // Global promotions (no specific properties targeted)
            { 
              $and: [
                { targetProperties: { $exists: false } },
                { 'conditions.applicableProperties': { $exists: false } }
              ]
            },
            // Promotions specifically targeting this property
            { targetProperties: propertyId },
            { 'conditions.applicableProperties': propertyId }
          ]
        }
      ]
    }).sort({ 'displaySettings.priority': -1, updatedAt: -1 });

    // Also get property-specific coupon codes
    const propertyCoupons = await Promotion.find({
      $and: [
        { type: 'coupon' },
        { isActive: true },
        {
          $or: [
            { targetProperties: propertyId },
            { 'conditions.applicableProperties': propertyId },
            // Include global coupons that don't exclude this property
            {
              $and: [
                { targetProperties: { $exists: false } },
                { 'conditions.applicableProperties': { $exists: false } },
                { 'conditions.excludeProperties': { $ne: propertyId } }
              ]
            }
          ]
        }
      ]
    }).sort({ updatedAt: -1 });

    return NextResponse.json({
      success: true,
      promotions,
      coupons: propertyCoupons,
      property: {
        id: property._id,
        title: property.title,
        location: property.location
      }
    });

  } catch (error) {
    console.error('Error fetching property promotions:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch promotions' 
      },
      { status: 500 }
    );
  }
}

// POST: Create a property-specific promotion
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || !['admin', 'super_admin'].includes(session.user.role)) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - Admin access required' },
        { status: 401 }
      );
    }

    await dbConnect();

    const propertyId = params.id;
    const promotionData = await request.json();

    // Verify property exists
    const property = await Property.findById(propertyId);
    if (!property) {
      return NextResponse.json(
        { success: false, error: 'Property not found' },
        { status: 404 }
      );
    }

    // Create property-specific promotion
    const promotion = new Promotion({
      ...promotionData,
      targetProperties: [propertyId],
      createdBy: session.user.id,
      analytics: {
        usageCount: 0,
        totalDiscountGiven: 0,
        revenue: 0,
        bookingsGenerated: 0,
        conversionRate: 0,
        avgBookingValue: 0
      }
    });

    await promotion.save();

    return NextResponse.json({
      success: true,
      promotion,
      message: 'Property promotion created successfully'
    });

  } catch (error) {
    console.error('Error creating property promotion:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to create promotion' 
      },
      { status: 500 }
    );
  }
}

// PUT: Update a promotion's property targeting
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || !['admin', 'super_admin'].includes(session.user.role)) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await dbConnect();

    const propertyId = params.id;
    const { promotionId, action } = await request.json();

    // Verify property exists
    const property = await Property.findById(propertyId);
    if (!property) {
      return NextResponse.json(
        { success: false, error: 'Property not found' },
        { status: 404 }
      );
    }

    const promotion = await Promotion.findById(promotionId);
    if (!promotion) {
      return NextResponse.json(
        { success: false, error: 'Promotion not found' },
        { status: 404 }
      );
    }

    if (action === 'add') {
      // Add property to promotion targeting
      if (!promotion.targetProperties) {
        promotion.targetProperties = [];
      }
      if (!promotion.targetProperties.includes(propertyId)) {
        promotion.targetProperties.push(propertyId);
      }
    } else if (action === 'remove') {
      // Remove property from promotion targeting
      if (promotion.targetProperties) {
        promotion.targetProperties = promotion.targetProperties.filter(
          (id: string) => id !== propertyId
        );
      }
    }

    await promotion.save();

    return NextResponse.json({
      success: true,
      promotion,
      message: `Property ${action === 'add' ? 'added to' : 'removed from'} promotion targeting`
    });

  } catch (error) {
    console.error('Error updating promotion targeting:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to update promotion' 
      },
      { status: 500 }
    );
  }
} 