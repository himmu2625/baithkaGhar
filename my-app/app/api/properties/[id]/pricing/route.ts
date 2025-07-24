import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db/dbConnect';
import Property from '@/models/Property';
import Booking from '@/models/Booking';
import Event from '@/models/Event';

// Utility functions for enhanced pricing features
function isDateBlocked(
  date: string,
  blockedDates: Array<{ startDate: string; endDate: string; isActive: boolean }>
): boolean {
  if (!blockedDates || blockedDates.length === 0) return false;
  
  const checkDate = new Date(date);
  
  return blockedDates.some(blocked => {
    if (!blocked.isActive) return false;
    
    const startDate = new Date(blocked.startDate);
    const endDate = new Date(blocked.endDate);
    
    return checkDate >= startDate && checkDate <= endDate;
  });
}

function getCustomPrice(
  date: string,
  customPrices: Array<{ startDate: string; endDate: string; price: number; isActive: boolean }>
): number | null {
  if (!customPrices || customPrices.length === 0) return null;
  
  const checkDate = new Date(date);
  
  const matchingPrice = customPrices.find(custom => {
    if (!custom.isActive) return false;
    
    const startDate = new Date(custom.startDate);
    const endDate = new Date(custom.endDate);
    
    return checkDate >= startDate && checkDate <= endDate;
  });
  
  return matchingPrice ? matchingPrice.price : null;
}

// GET: Calculate dynamic pricing for a property (public)
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  await dbConnect();
  const { id } = params;
  const { searchParams } = new URL(req.url);
  
  try {
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const guests = parseInt(searchParams.get('guests') || '1', 10);
    const categoryId = searchParams.get('category'); // Room category selection

    if (!startDate || !endDate) {
      return NextResponse.json({ error: 'startDate and endDate are required' }, { status: 400 });
    }

    const property = await Property.findById(id).select('dynamicPricing price propertyUnits');
    if (!property) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 });
    }

    // Get base price for selected category or fallback to property base price
    let basePrice = property.price?.base || 1000;
    let selectedCategory = null;
    
    if (categoryId && property.propertyUnits && Array.isArray(property.propertyUnits)) {
      const category = property.propertyUnits.find((unit: any) => 
        unit.unitTypeCode === categoryId || unit.unitTypeName === categoryId
      );
      if (category) {
        basePrice = parseFloat(category.pricing?.price) || basePrice;
        selectedCategory = {
          id: category.unitTypeCode,
          name: category.unitTypeName,
          price: basePrice,
          count: category.count
        };
      }
    }

    // Get occupancy data for demand-based pricing
    const occupancyData = await getOccupancyData(id, startDate, endDate);

    // Calculate dynamic pricing
    const result = calculateDynamicPricing(
      property.dynamicPricing,
      basePrice,
      startDate,
      endDate,
      guests,
      occupancyData
    );

    // Add category information to response
    return NextResponse.json({
      ...result,
      selectedCategory,
      availableCategories: property.propertyUnits ? property.propertyUnits.map((unit: any) => ({
        id: unit.unitTypeCode,
        name: unit.unitTypeName,
        price: parseFloat(unit.pricing?.price) || basePrice,
        count: unit.count
      })) : []
    });
  } catch (error) {
    console.error('Dynamic pricing calculation error:', error);
    return NextResponse.json({ error: 'Server error', details: error }, { status: 500 });
  }
}

async function getOccupancyData(propertyId: string, startDate: string, endDate: string) {
  try {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    // Get existing bookings for the date range
    const existingBookings = await Booking.find({
      propertyId,
      status: { $in: ['confirmed', 'completed'] },
      $or: [
        { dateFrom: { $lte: end, $gte: start } },
        { dateTo: { $gte: start, $lte: end } },
        { $and: [{ dateFrom: { $lte: start } }, { dateTo: { $gte: end } }] }
      ]
    }).select('dateFrom dateTo');

    // Calculate occupancy percentage for each day
    const occupancyMap = new Map();
    const currentDate = new Date(start);
    
    while (currentDate <= end) {
      const dateKey = currentDate.toISOString().split('T')[0];
      let overlappingBookings = 0;
      
      for (const booking of existingBookings) {
        const bookingStart = new Date(booking.dateFrom);
        const bookingEnd = new Date(booking.dateTo);
        
        if (currentDate >= bookingStart && currentDate < bookingEnd) {
          overlappingBookings++;
        }
      }
      
      // Assume property can accommodate 1 booking at a time (single unit)
      const occupancyPercentage = Math.min(overlappingBookings, 1);
      occupancyMap.set(dateKey, occupancyPercentage);
      
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return occupancyMap;
  } catch (error) {
    console.error('Error getting occupancy data:', error);
    return new Map();
  }
}

function calculateDynamicPricing(
  dynamicPricing: any,
  basePrice: number,
  startDate: string,
  endDate: string,
  guests: number,
  occupancyData: Map<string, number>
) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const nights = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
  
  const dailyPrices = [];
  let totalPrice = 0;

  for (let i = 0; i < nights; i++) {
    const currentDate = new Date(start);
    currentDate.setDate(start.getDate() + i);
    const dateKey = currentDate.toISOString().split('T')[0];
    
    let price = basePrice;

    // 1. Check for custom direct pricing first (highest priority)
    if (dynamicPricing?.directPricing?.enabled && dynamicPricing.directPricing.customPrices) {
      const customPrice = getCustomPrice(dateKey, dynamicPricing.directPricing.customPrices);
      if (customPrice !== null) {
        price = customPrice;
        // Skip other calculations when custom price is set
        dailyPrices.push({
          date: dateKey,
          price: Math.round(price),
          basePrice: basePrice,
          seasonalMultiplier: 1,
          weeklyMultiplier: 1,
          demandMultiplier: 1,
          advanceDiscount: 0,
          lastMinutePremium: 0,
          guestMultiplier: 1,
          weekendMultiplier: 1,
          holidayMultiplier: 1,
          occupancy: occupancyData.get(dateKey) || 0,
          isCustomPrice: true
        });
        totalPrice += Math.round(price);
        continue; // Skip to next day
      }
    }

    // 2. Check if date is blocked (property unavailable)
    if (dynamicPricing?.availabilityControl?.enabled && dynamicPricing.availabilityControl.blockedDates) {
      const isBlocked = isDateBlocked(dateKey, dynamicPricing.availabilityControl.blockedDates);
      if (isBlocked) {
        // Return error for blocked dates
        return NextResponse.json({ 
          error: 'Property is not available for the selected dates',
          blockedDates: dynamicPricing.availabilityControl.blockedDates.filter((b: any) => b.isActive)
        }, { status: 400 });
      }
    }

    // 3. Apply admin-configured seasonal rules only
    if (dynamicPricing?.seasonalPricing?.rules && Array.isArray(dynamicPricing.seasonalPricing.rules)) {
      dynamicPricing.seasonalPricing.rules.forEach((rule: any) => {
        if (rule.isActive && 
            currentDate >= new Date(rule.dateRange.start) && 
            currentDate <= new Date(rule.dateRange.end)) {
          price *= rule.multiplier;
        }
      });
    }

    // Store daily price with real factors only
    dailyPrices.push({
      date: dateKey,
      price: Math.round(price),
      basePrice: basePrice,
      seasonalMultiplier: price / basePrice, // Actual multiplier applied
      weeklyMultiplier: 1,
      demandMultiplier: 1,
      advanceDiscount: 0,
      lastMinutePremium: 0,
      guestMultiplier: 1,
      weekendMultiplier: 1,
      holidayMultiplier: 1,
      occupancy: occupancyData.get(dateKey) || 0,
      isCustomPrice: false
    });

    totalPrice += Math.round(price);
  }

  return {
    totalPrice,
    nightlyAverage: Math.round(totalPrice / nights),
    nights,
    dailyPrices,
    guests,
    currency: 'INR',
    dynamicPricingEnabled: !!dynamicPricing,
    pricingFactors: {
      hasCustomPrices: dailyPrices.some(d => d.isCustomPrice),
      hasSeasonalRules: dynamicPricing?.seasonalPricing?.rules?.length > 0,
      customPricesCount: dynamicPricing?.directPricing?.customPrices?.length || 0,
      seasonalRulesCount: dynamicPricing?.seasonalPricing?.rules?.length || 0
    }
  };
} 