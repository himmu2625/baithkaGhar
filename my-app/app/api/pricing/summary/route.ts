import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import PropertyPricing from '@/models/PropertyPricing';
import Property from '@/models/Property';
import { connectToDatabase } from '@/lib/mongodb';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get('propertyId');

    if (!propertyId) {
      return NextResponse.json({
        error: 'Property ID is required'
      }, { status: 400 });
    }

    // Get property details
    const property = await Property.findById(propertyId);
    if (!property) {
      return NextResponse.json({
        error: 'Property not found'
      }, { status: 404 });
    }

    // Get all pricing data for the property
    const pricingData = await PropertyPricing.find({
      propertyId,
      isActive: true
    });

    // Calculate summary statistics
    const summary = {
      totalRules: pricingData.length,
      activeRules: pricingData.filter(p => p.isActive).length,
      roomCategories: [...new Set(pricingData.map(p => p.roomCategory))].length,
      planTypes: [...new Set(pricingData.map(p => p.planType))],
      occupancyTypes: [...new Set(pricingData.map(p => p.occupancyType))],
      priceRange: {
        min: pricingData.length > 0 ? Math.min(...pricingData.map(p => p.price)) : 0,
        max: pricingData.length > 0 ? Math.max(...pricingData.map(p => p.price)) : 0
      },
      dateRange: {
        min: pricingData.length > 0 ? new Date(Math.min(...pricingData.map(p => p.startDate.getTime()))).toISOString().split('T')[0] : '',
        max: pricingData.length > 0 ? new Date(Math.max(...pricingData.map(p => p.endDate.getTime()))).toISOString().split('T')[0] : ''
      },
      seasonTypes: [...new Set(pricingData.map(p => p.seasonType).filter(Boolean))],
      avgPrice: pricingData.length > 0 ? Math.round(pricingData.reduce((sum, p) => sum + p.price, 0) / pricingData.length) : 0
    };

    // Room category breakdown
    const roomCategoryBreakdown = pricingData.reduce((acc, pricing) => {
      if (!acc[pricing.roomCategory]) {
        acc[pricing.roomCategory] = {
          totalRules: 0,
          planTypes: new Set(),
          occupancyTypes: new Set(),
          priceRange: { min: Infinity, max: 0 },
          avgPrice: 0,
          totalPrice: 0
        };
      }

      const category = acc[pricing.roomCategory];
      category.totalRules++;
      category.planTypes.add(pricing.planType);
      category.occupancyTypes.add(pricing.occupancyType);
      category.priceRange.min = Math.min(category.priceRange.min, pricing.price);
      category.priceRange.max = Math.max(category.priceRange.max, pricing.price);
      category.totalPrice += pricing.price;

      return acc;
    }, {});

    // Convert sets to arrays and calculate averages
    Object.keys(roomCategoryBreakdown).forEach(category => {
      const data = roomCategoryBreakdown[category];
      data.planTypes = Array.from(data.planTypes);
      data.occupancyTypes = Array.from(data.occupancyTypes);
      data.avgPrice = Math.round(data.totalPrice / data.totalRules);
      delete data.totalPrice;
    });

    return NextResponse.json({
      success: true,
      property: {
        id: property._id,
        name: property.name
      },
      summary,
      roomCategoryBreakdown
    });

  } catch (error) {
    console.error('Pricing summary error:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message
    }, { status: 500 });
  }
}