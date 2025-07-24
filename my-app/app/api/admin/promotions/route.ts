import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { authOptions } from '@/lib/auth';
import { connectMongo } from '@/lib/db/mongodb';
import Promotion from '@/models/Promotion';

// GET: Fetch all promotions with filtering and pagination
export async function GET(req: NextRequest) {
  await connectMongo();

  try {
    // Check authentication and admin permissions
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'admin' && session.user.role !== 'super_admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    
    // Parse query parameters
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status');
    const type = searchParams.get('type');
    const search = searchParams.get('search');
    const propertyId = searchParams.get('propertyId');
    const active = searchParams.get('active');
    
    const skip = (page - 1) * limit;

    // Build filter
    const filter: any = {};
    
    if (status) filter.status = status;
    if (type) filter.type = type;
    if (active === 'true') filter.isActive = true;
    if (active === 'false') filter.isActive = false;
    
    if (propertyId) {
      filter.$or = [
        { 'conditions.applicableProperties': propertyId },
        { 'conditions.applicableProperties': { $exists: false } }, // applies to all properties
        { 'conditions.applicableProperties': { $size: 0 } }
      ];
    }
    
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { 'displaySettings.title': { $regex: search, $options: 'i' } },
        { couponCode: { $regex: search, $options: 'i' } }
      ];
    }

    // Fetch promotions with pagination
    const promotions = await Promotion.find(filter)
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email')
      .populate('approvedBy', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await Promotion.countDocuments(filter);

    // Calculate some basic analytics
    const activePromotions = await Promotion.countDocuments({ isActive: true, status: 'active' });
    const totalDiscountGiven = await Promotion.aggregate([
      { $match: { status: 'active' } },
      { $group: { _id: null, total: { $sum: '$analytics.totalDiscountGiven' } } }
    ]);

    return NextResponse.json({
      success: true,
      promotions: promotions.map(promotion => ({
        ...promotion,
        _id: (promotion as any)._id?.toString?.() ?? '',
        createdBy: promotion.createdBy ? {
          ...promotion.createdBy,
          _id: (promotion.createdBy as any)._id?.toString?.() ?? ''
        } : null,
        updatedBy: promotion.updatedBy ? {
          ...promotion.updatedBy,
          _id: (promotion.updatedBy as any)._id?.toString?.() ?? ''
        } : null,
        approvedBy: promotion.approvedBy ? {
          ...promotion.approvedBy,
          _id: (promotion.approvedBy as any)._id?.toString?.() ?? ''
        } : null
      })),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      summary: {
        activePromotions,
        totalDiscountGiven: totalDiscountGiven[0]?.total || 0
      }
    });

  } catch (error) {
    console.error('Error fetching promotions:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch promotions',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    );
  }
}

// POST: Create a new promotion
export async function POST(req: NextRequest) {
  await connectMongo();

  try {
    // Check authentication and admin permissions
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'admin' && session.user.role !== 'super_admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await req.json();
    
    // Validate required fields
    const requiredFields = ['name', 'type', 'discountType', 'discountValue', 'conditions', 'displaySettings'];
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `${field} is required` },
          { status: 400 }
        );
      }
    }

    // Validate date range
    const validFrom = new Date(body.conditions.validFrom);
    const validTo = new Date(body.conditions.validTo);
    
    if (validFrom >= validTo) {
      return NextResponse.json(
        { error: 'Valid from date must be before valid to date' },
        { status: 400 }
      );
    }

    // Validate discount value
    if (body.discountType === 'percentage' && body.discountValue > 100) {
      return NextResponse.json(
        { error: 'Percentage discount cannot exceed 100%' },
        { status: 400 }
      );
    }

    if (body.discountValue <= 0) {
      return NextResponse.json(
        { error: 'Discount value must be greater than 0' },
        { status: 400 }
      );
    }

    // Check for duplicate coupon code if provided
    if (body.couponCode) {
      const existingPromotion = await Promotion.findOne({ 
        couponCode: body.couponCode.toUpperCase(),
        status: { $ne: 'expired' }
      });
      
      if (existingPromotion) {
        return NextResponse.json(
          { error: 'Coupon code already exists' },
          { status: 400 }
        );
      }
    }

    // Create promotion with defaults
    const promotionData = {
      ...body,
      createdBy: session.user.id,
      analytics: {
        usageCount: 0,
        totalDiscountGiven: 0,
        revenue: 0,
        bookingsGenerated: 0,
        conversionRate: 0,
        avgBookingValue: 0
      },
      status: body.isActive ? 'active' : 'draft',
      couponCode: body.couponCode ? body.couponCode.toUpperCase() : undefined
    };

    const promotion = new Promotion(promotionData);
    await promotion.save();

    return NextResponse.json({
      success: true,
      message: 'Promotion created successfully',
      promotion: {
        ...promotion.toObject(),
        _id: promotion._id.toString()
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating promotion:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to create promotion',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    );
  }
} 