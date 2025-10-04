/**
 * Unified Pricing Calculator Service
 *
 * This service handles all pricing calculations for bookings, ensuring consistency
 * across the platform. It integrates:
 * 1. Base plan-based pricing (room category + plan + occupancy)
 * 2. Date-specific pricing from PropertyPricing collection
 * 3. Dynamic pricing rules (seasonal, demand-based, etc.)
 * 4. Multi-room calculations
 *
 * @module lib/services/pricing-calculator
 */

import Property from '@/models/Property';
import PropertyPricing from '@/models/PropertyPricing';
import { differenceInDays } from 'date-fns';

// ==================== TYPES ====================

export interface PricingRequest {
  propertyId: string;
  roomCategory: string;
  planType: 'EP' | 'CP' | 'MAP' | 'AP';
  occupancyType: 'SINGLE' | 'DOUBLE' | 'TRIPLE' | 'QUAD';
  checkIn: Date;
  checkOut: Date;
  numberOfRooms: number;
}

export interface PricingResult {
  // Price per room per night (base pricing)
  basePrice: number;
  planCharges: number;
  occupancyCharges: number;

  // Dynamic adjustments
  dynamicAdjustment: number;
  seasonalMultiplier: number;

  // Totals
  pricePerRoomPerNight: number;
  pricePerNight: number; // All rooms
  totalForStay: number; // All rooms, all nights

  // Breakdown
  breakdown: {
    nights: number;
    roomsCount: number;
    baseRate: number;
    mealPlanCharges: number;
    extraOccupancyCharges: number;
    dynamicAdjustments: number;
  };

  // Meal plan details
  mealPlanInclusions: {
    breakfast: boolean;
    lunch: boolean;
    dinner: boolean;
  };

  // Date-specific pricing applied (if any)
  dateSpecificPricing?: {
    startDate: string;
    endDate: string;
    overridePrice: number;
    reason: string;
  }[];
}

// ==================== HELPER FUNCTIONS ====================

/**
 * Get meal plan inclusions based on plan type
 */
function getMealPlanInclusions(planType: 'EP' | 'CP' | 'MAP' | 'AP') {
  switch (planType) {
    case 'EP': // European Plan - Room Only
      return { breakfast: false, lunch: false, dinner: false };
    case 'CP': // Continental Plan - Room + Breakfast
      return { breakfast: true, lunch: false, dinner: false };
    case 'MAP': // Modified American Plan - Room + Breakfast + (Lunch OR Dinner)
      return { breakfast: true, lunch: true, dinner: false };
    case 'AP': // American Plan - All Meals
      return { breakfast: true, lunch: true, dinner: true };
    default:
      return { breakfast: false, lunch: false, dinner: false };
  }
}

/**
 * Calculate seasonal multiplier based on dynamic pricing settings
 */
function calculateSeasonalMultiplier(
  checkInDate: Date,
  dynamicPricing: any
): number {
  if (!dynamicPricing?.enabled || !dynamicPricing?.seasonalRates) {
    return 1; // No adjustment
  }

  const month = checkInDate.getMonth() + 1; // 1-12

  // Check peak season
  if (dynamicPricing.seasonalRates.peak?.months?.includes(month)) {
    return dynamicPricing.seasonalRates.peak.multiplier || 1;
  }

  // Check off-peak season
  if (dynamicPricing.seasonalRates.offPeak?.months?.includes(month)) {
    return dynamicPricing.seasonalRates.offPeak.multiplier || 1;
  }

  // Check shoulder season
  if (dynamicPricing.seasonalRates.shoulder?.months?.includes(month)) {
    return dynamicPricing.seasonalRates.shoulder.multiplier || 1;
  }

  return 1; // Default, no adjustment
}

/**
 * Calculate weekday/weekend multiplier
 */
function calculateWeekdayMultiplier(
  checkInDate: Date,
  dynamicPricing: any
): number {
  if (!dynamicPricing?.enabled || !dynamicPricing?.weeklyRates) {
    return 1;
  }

  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const dayName = dayNames[checkInDate.getDay()];

  return dynamicPricing.weeklyRates[dayName] || 1;
}

// ==================== MAIN CALCULATOR ====================

/**
 * Calculate booking price with all adjustments
 */
export async function calculateBookingPrice(
  request: PricingRequest
): Promise<PricingResult> {
  const {
    propertyId,
    roomCategory,
    planType,
    occupancyType,
    checkIn,
    checkOut,
    numberOfRooms
  } = request;

  // Validate inputs
  if (!propertyId || !roomCategory || !planType || !occupancyType) {
    throw new Error('Missing required pricing parameters');
  }

  if (!checkIn || !checkOut || checkIn >= checkOut) {
    throw new Error('Invalid check-in/check-out dates');
  }

  const nights = differenceInDays(checkOut, checkIn);
  if (nights <= 0) {
    throw new Error('Number of nights must be positive');
  }

  // Step 1: Fetch property
  const property = await Property.findById(propertyId);
  if (!property) {
    throw new Error('Property not found');
  }

  // Step 2: Find the property unit (room category)
  const propertyUnit = property.propertyUnits?.find(
    (unit: any) => unit.unitTypeCode === roomCategory || unit.unitTypeName === roomCategory
  );

  if (!propertyUnit) {
    throw new Error(`Room category "${roomCategory}" not found`);
  }

  // Step 3: Get base price from plan-based pricing
  let basePrice = 0;
  let planBasedEntry = null;

  if (propertyUnit.planBasedPricing && propertyUnit.planBasedPricing.length > 0) {
    // Find exact match for plan + occupancy
    planBasedEntry = propertyUnit.planBasedPricing.find(
      (pricing: any) =>
        pricing.planType === planType &&
        pricing.occupancyType === occupancyType
    );

    if (planBasedEntry) {
      basePrice = planBasedEntry.price;
    } else {
      // Fallback: try to find same plan with different occupancy
      const samePlanEntry = propertyUnit.planBasedPricing.find(
        (pricing: any) => pricing.planType === planType
      );
      if (samePlanEntry) {
        basePrice = samePlanEntry.price;
        console.warn(`Exact pricing not found for ${planType}+${occupancyType}, using ${samePlanEntry.occupancyType} as base`);
      }
    }
  }

  // Fallback to legacy pricing if no plan-based pricing found
  if (basePrice === 0) {
    const legacyPrice = parseFloat(propertyUnit.pricing?.price || '0');
    basePrice = legacyPrice;
    console.warn(`No plan-based pricing found, using legacy price: ${legacyPrice}`);
  }

  // Step 4: Check for date-specific pricing overrides
  const dateSpecificPricing: any[] = [];
  try {
    const pricingOverrides = await PropertyPricing.find({
      propertyId: propertyId,
      roomCategory: roomCategory,
      planType: planType,
      occupancyType: occupancyType,
      isActive: true,
      $or: [
        // Check if booking dates overlap with pricing period
        {
          startDate: { $lte: checkOut },
          endDate: { $gte: checkIn }
        }
      ]
    });

    if (pricingOverrides && pricingOverrides.length > 0) {
      // Use the first matching override (could be enhanced to handle multiple)
      const override = pricingOverrides[0];
      basePrice = override.price;
      dateSpecificPricing.push({
        startDate: override.startDate.toISOString(),
        endDate: override.endDate.toISOString(),
        overridePrice: override.price,
        reason: override.seasonType || 'date-specific pricing'
      });
    }
  } catch (error) {
    console.error('Error fetching date-specific pricing:', error);
    // Continue with base pricing if date-specific lookup fails
  }

  // Step 5: Calculate plan charges (difference from EP to other plans)
  // This is already included in basePrice from planBasedPricing
  const planCharges = 0; // Keeping as separate field for future use

  // Step 6: Calculate occupancy charges (difference from single to multi)
  // This is already included in basePrice from planBasedPricing
  const occupancyCharges = 0; // Keeping as separate field for future use

  // Step 7: Apply dynamic pricing adjustments
  let dynamicAdjustment = 0;
  let seasonalMultiplier = 1;
  let weekdayMultiplier = 1;

  if (property.dynamicPricing?.enabled) {
    seasonalMultiplier = calculateSeasonalMultiplier(checkIn, property.dynamicPricing);
    weekdayMultiplier = calculateWeekdayMultiplier(checkIn, property.dynamicPricing);

    // Calculate adjustment amount (not multiplier)
    const combinedMultiplier = seasonalMultiplier * weekdayMultiplier;
    dynamicAdjustment = basePrice * (combinedMultiplier - 1);
  }

  // Step 8: Calculate totals
  const pricePerRoomPerNight = basePrice + planCharges + occupancyCharges + dynamicAdjustment;
  const pricePerNight = pricePerRoomPerNight * numberOfRooms;
  const totalForStay = pricePerNight * nights;

  // Step 9: Build result
  const result: PricingResult = {
    basePrice,
    planCharges,
    occupancyCharges,
    dynamicAdjustment,
    seasonalMultiplier,
    pricePerRoomPerNight,
    pricePerNight,
    totalForStay,
    breakdown: {
      nights,
      roomsCount: numberOfRooms,
      baseRate: basePrice,
      mealPlanCharges: planCharges,
      extraOccupancyCharges: occupancyCharges,
      dynamicAdjustments: dynamicAdjustment
    },
    mealPlanInclusions: getMealPlanInclusions(planType),
    dateSpecificPricing: dateSpecificPricing.length > 0 ? dateSpecificPricing : undefined
  };

  return result;
}

/**
 * Quick price lookup for displaying on property cards
 * Returns the cheapest price across all plan/occupancy combinations
 */
export async function getStartingPrice(propertyId: string): Promise<number> {
  const property = await Property.findById(propertyId);
  if (!property) {
    return 0;
  }

  let lowestPrice = Number.MAX_SAFE_INTEGER;

  // Check all property units
  if (property.propertyUnits && property.propertyUnits.length > 0) {
    for (const unit of property.propertyUnits) {
      // Check plan-based pricing
      if (unit.planBasedPricing && unit.planBasedPricing.length > 0) {
        for (const pricing of unit.planBasedPricing) {
          if (pricing.price < lowestPrice) {
            lowestPrice = pricing.price;
          }
        }
      } else {
        // Fallback to legacy pricing
        const legacyPrice = parseFloat(unit.pricing?.price || '0');
        if (legacyPrice > 0 && legacyPrice < lowestPrice) {
          lowestPrice = legacyPrice;
        }
      }
    }
  }

  // Fallback to base property price
  if (lowestPrice === Number.MAX_SAFE_INTEGER) {
    lowestPrice = property.price?.base || 0;
  }

  return lowestPrice;
}

/**
 * Get all available pricing options for a property
 * Useful for displaying pricing matrix on property detail page
 */
export async function getPropertyPricingMatrix(propertyId: string) {
  const property = await Property.findById(propertyId);
  if (!property) {
    throw new Error('Property not found');
  }

  const matrix: any[] = [];

  if (property.propertyUnits && property.propertyUnits.length > 0) {
    for (const unit of property.propertyUnits) {
      if (unit.planBasedPricing && unit.planBasedPricing.length > 0) {
        for (const pricing of unit.planBasedPricing) {
          matrix.push({
            roomCategory: unit.unitTypeName,
            roomCategoryCode: unit.unitTypeCode,
            planType: pricing.planType,
            occupancyType: pricing.occupancyType,
            price: pricing.price,
            mealInclusions: getMealPlanInclusions(pricing.planType)
          });
        }
      }
    }
  }

  return matrix;
}
