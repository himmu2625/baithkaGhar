import { NextRequest, NextResponse } from 'next/server';
import PropertyPricing from '@/models/PropertyPricing';
import { connectToDatabase } from '@/lib/mongodb';
import { format, eachDayOfInterval, parseISO } from 'date-fns';

// Calendar API - handles pricing calendar display with availability
export async function GET(request: NextRequest) {
  try {
    // Allow public access to pricing calendar - no authentication required
    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get('propertyId');
    const roomCategory = searchParams.get('roomCategory');
    const selectedPlan = searchParams.get('selectedPlan');
    const selectedOccupancy = searchParams.get('selectedOccupancy');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    if (!propertyId || !roomCategory || !startDate || !endDate) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    const start = parseISO(startDate);
    const end = parseISO(endDate);

    // Query PropertyPricing collection - SINGLE SOURCE OF TRUTH
    const query: any = {
      propertyId,
      // Case-insensitive room category matching
      roomCategory: new RegExp(`^${roomCategory}$`, 'i'),
      isActive: true
    };

    // Filter by selected plan and occupancy if provided
    if (selectedPlan) {
      query.planType = selectedPlan;
    }

    if (selectedOccupancy) {
      query.occupancyType = selectedOccupancy;
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
        // BASE pricing has no date range - it applies to all dates
        if (pricing.pricingType === 'BASE') {
          return true;
        }

        // DIRECT and PLAN_BASED pricing have specific date ranges
        if (!pricing.startDate || !pricing.endDate) {
          return false;
        }

        const pricingStart = format(new Date(pricing.startDate), 'yyyy-MM-dd');
        const pricingEnd = format(new Date(pricing.endDate), 'yyyy-MM-dd');
        return dateStr >= pricingStart && dateStr <= pricingEnd;
      });

      // Process pricing data with availability check
      const prices = dayPricing
        .filter(pricing => pricing.isAvailable !== false) // Only include available plans
        .map(pricing => ({
          planType: pricing.planType,
          occupancyType: pricing.occupancyType,
          roomCategory: pricing.roomCategory,
          price: pricing.price,
          seasonType: pricing.seasonType || 'Regular',
          isAvailable: pricing.isAvailable !== false
        }));

      // If no available prices, mark date as unavailable
      if (prices.length === 0) {
        return {
          date: dateStr,
          prices: [],
          isAvailable: false,
          seasonType: 'unavailable',
          message: 'This plan/occupancy combination is not available'
        };
      }

      // Find lowest price for the date
      const lowestPrice = Math.min(...prices.map(p => p.price));

      // Mark the lowest price
      prices.forEach(p => {
        p.isLowest = p.price === lowestPrice;
      });

      return {
        date: dateStr,
        prices: prices,
        isAvailable: true,
        seasonType: prices[0]?.seasonType || 'regular'
      };
    });

    return NextResponse.json({
      success: true,
      pricing: pricingCalendar
    });

  } catch (error) {
    console.error('Calendar pricing error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch pricing calendar',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
