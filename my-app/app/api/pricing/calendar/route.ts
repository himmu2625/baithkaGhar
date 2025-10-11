import { NextRequest, NextResponse } from 'next/server';
import PropertyPricing from '@/models/PropertyPricing';
import { connectToDatabase } from '@/lib/mongodb';
import { format, eachDayOfInterval, parseISO } from 'date-fns';

export async function GET(request: NextRequest) {
  try {
    console.log('[Pricing Calendar API] Request received');

    // Allow public access to pricing calendar - no authentication required
    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get('propertyId');
    const roomCategory = searchParams.get('roomCategory');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    console.log('[Pricing Calendar API] Parameters:', { propertyId, roomCategory, startDate, endDate });

    if (!propertyId || !startDate || !endDate) {
      return NextResponse.json({
        error: 'Missing required parameters: propertyId, startDate, endDate'
      }, { status: 400 });
    }

    const start = parseISO(startDate);
    const end = parseISO(endDate);

    // Get all pricing data for the date range
    const query: any = {
      propertyId,
      startDate: { $lte: end },
      endDate: { $gte: start },
      isActive: true
    };

    if (roomCategory) {
      query.roomCategory = roomCategory;
    }

    const pricingData = await PropertyPricing.find(query).sort({
      roomCategory: 1,
      planType: 1,
      occupancyType: 1,
      startDate: 1
    });

    // Generate calendar data for each day
    const calendarDays = eachDayOfInterval({ start, end });
    const pricingCalendar = calendarDays.map(date => {
      const dateStr = format(date, 'yyyy-MM-dd');

      // Find pricing for this specific date
      const dayPricing = pricingData.filter(pricing => {
        const pricingStart = format(new Date(pricing.startDate), 'yyyy-MM-dd');
        const pricingEnd = format(new Date(pricing.endDate), 'yyyy-MM-dd');
        return dateStr >= pricingStart && dateStr <= pricingEnd;
      });

      // Process pricing data
      const prices = dayPricing.map(pricing => ({
        planType: pricing.planType,
        occupancyType: pricing.occupancyType,
        roomCategory: pricing.roomCategory,
        price: pricing.price,
        seasonType: pricing.seasonType
      }));

      // Find lowest price for the date
      const allPrices = prices.map(p => p.price);
      const lowestPrice = allPrices.length > 0 ? Math.min(...allPrices) : 0;

      // Mark lowest price entries
      const pricesWithLowest = prices.map(p => ({
        ...p,
        isLowest: p.price === lowestPrice
      }));

      return {
        date: dateStr,
        prices: pricesWithLowest,
        lowestPrice,
        isAvailable: prices.length > 0,
        seasonType: prices[0]?.seasonType || 'Regular'
      };
    });

    // Calculate summary statistics
    const summary = {
      totalDays: calendarDays.length,
      availableDays: pricingCalendar.filter(day => day.isAvailable).length,
      priceRange: {
        min: Math.min(...pricingCalendar.filter(day => day.lowestPrice > 0).map(day => day.lowestPrice)),
        max: Math.max(...pricingCalendar.map(day => day.lowestPrice))
      },
      planTypes: [...new Set(pricingData.map(p => p.planType))],
      occupancyTypes: [...new Set(pricingData.map(p => p.occupancyType))],
      roomCategories: [...new Set(pricingData.map(p => p.roomCategory))]
    };

    return NextResponse.json({
      success: true,
      pricing: pricingCalendar,
      summary
    });

  } catch (error: any) {
    console.error('Calendar pricing error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error?.message || 'Unknown error',
      pricing: [], // Return empty array to prevent frontend errors
      summary: {
        totalDays: 0,
        availableDays: 0,
        priceRange: { min: 0, max: 0 },
        planTypes: [],
        occupancyTypes: [],
        roomCategories: []
      }
    }, { status: 200 }); // Return 200 to prevent HTML error pages
  }
}