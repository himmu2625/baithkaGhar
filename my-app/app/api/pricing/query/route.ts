import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import PropertyPricing from '@/models/PropertyPricing';
import PlanType from '@/models/PlanType';
import { connectToDatabase } from '@/lib/mongodb';
import { format, parseISO } from 'date-fns';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const body = await request.json();
    const {
      propertyId,
      roomCategory,
      checkInDate,
      checkOutDate,
      planType,
      occupancyType
    } = body;

    if (!propertyId || !checkInDate || !checkOutDate) {
      return NextResponse.json({
        error: 'Missing required parameters'
      }, { status: 400 });
    }

    const checkIn = parseISO(checkInDate);
    const checkOut = parseISO(checkOutDate);

    // Build query
    const query: any = {
      propertyId,
      startDate: { $lte: checkOut },
      endDate: { $gte: checkIn },
      isActive: true
    };

    if (roomCategory) query.roomCategory = roomCategory;
    if (planType) query.planType = planType;
    if (occupancyType) query.occupancyType = occupancyType;

    // Get pricing data
    const pricingData = await PropertyPricing.find(query).sort({
      roomCategory: 1,
      planType: 1,
      occupancyType: 1,
      price: 1
    });

    // Get plan type definitions
    const planTypes = await PlanType.find({ isActive: true }).sort({ sortOrder: 1 });

    // Group by room category and plan/occupancy combinations
    const groupedPricing = pricingData.reduce((acc, pricing) => {
      const key = `${pricing.roomCategory}_${pricing.planType}_${pricing.occupancyType}`;

      if (!acc[key]) {
        acc[key] = {
          roomCategory: pricing.roomCategory,
          planType: pricing.planType,
          occupancyType: pricing.occupancyType,
          prices: [],
          lowestPrice: Infinity,
          highestPrice: 0,
          seasonTypes: new Set()
        };
      }

      acc[key].prices.push({
        price: pricing.price,
        startDate: pricing.startDate,
        endDate: pricing.endDate,
        seasonType: pricing.seasonType
      });

      acc[key].lowestPrice = Math.min(acc[key].lowestPrice, pricing.price);
      acc[key].highestPrice = Math.max(acc[key].highestPrice, pricing.price);

      if (pricing.seasonType) {
        acc[key].seasonTypes.add(pricing.seasonType);
      }

      return acc;
    }, {});

    // Convert to array and add plan details
    const pricingOptions = Object.values(groupedPricing).map((option: any) => {
      const planDetails = planTypes.find(plan => plan.code === option.planType);

      return {
        ...option,
        seasonTypes: Array.from(option.seasonTypes),
        planDetails: planDetails ? {
          name: planDetails.name,
          description: planDetails.description,
          inclusions: planDetails.inclusions
        } : null,
        totalPrice: option.lowestPrice, // This could be calculated for multiple nights
        pricePerNight: option.lowestPrice
      };
    });

    // Find absolute lowest prices by room category
    const roomCategoryMinPrices = pricingOptions.reduce((acc, option) => {
      if (!acc[option.roomCategory] || option.lowestPrice < acc[option.roomCategory]) {
        acc[option.roomCategory] = option.lowestPrice;
      }
      return acc;
    }, {});

    return NextResponse.json({
      success: true,
      checkInDate,
      checkOutDate,
      pricingOptions,
      planTypes: planTypes.map(plan => ({
        code: plan.code,
        name: plan.name,
        description: plan.description,
        inclusions: plan.inclusions
      })),
      roomCategoryMinPrices,
      summary: {
        totalOptions: pricingOptions.length,
        roomCategories: [...new Set(pricingOptions.map(opt => opt.roomCategory))],
        priceRange: {
          min: Math.min(...pricingOptions.map(opt => opt.lowestPrice)),
          max: Math.max(...pricingOptions.map(opt => opt.highestPrice))
        }
      }
    });

  } catch (error) {
    console.error('Pricing query error:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message
    }, { status: 500 });
  }
}