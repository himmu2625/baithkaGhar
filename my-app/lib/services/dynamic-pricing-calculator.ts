import DynamicPricingRule, { IDynamicPricingRule } from '@/models/DynamicPricingRule';
import { PlanType } from '@/types/property';

interface DynamicPriceCalculation {
  basePrice: number;
  finalPrice: number;
  appliedRules: {
    name: string;
    adjustment: number;
    type: string;
  }[];
  breakdown: {
    basePrice: number;
    adjustments: number;
    finalPrice: number;
  };
}

/**
 * Calculate dynamic price based on property rules
 */
export async function calculateDynamicPrice(
  propertyId: string,
  basePrice: number,
  planType: PlanType,
  checkInDate: Date,
  bookingDate: Date = new Date()
): Promise<DynamicPriceCalculation> {
  // Fetch active rules for this property, sorted by priority
  const rules = await DynamicPricingRule.find({
    propertyId,
    isActive: true
  })
    .sort({ priority: -1 }) // Higher priority first
    .lean();

  let currentPrice = basePrice;
  const appliedRules: any[] = [];

  for (const rule of rules) {
    if (isRuleApplicable(rule, checkInDate, bookingDate)) {
      const adjustment = rule.adjustment[planType] || 1;
      const oldPrice = currentPrice;

      switch (rule.type) {
        case 'multiplier':
          currentPrice *= adjustment;
          break;
        case 'percentage':
          currentPrice *= (1 + adjustment / 100);
          break;
        case 'fixed_amount':
          currentPrice += adjustment;
          break;
      }

      appliedRules.push({
        name: rule.name,
        adjustment: currentPrice - oldPrice,
        type: rule.type
      });
    }
  }

  const finalPrice = Math.round(currentPrice);

  return {
    basePrice,
    finalPrice,
    appliedRules,
    breakdown: {
      basePrice,
      adjustments: finalPrice - basePrice,
      finalPrice
    }
  };
}

/**
 * Check if a pricing rule is applicable
 */
function isRuleApplicable(
  rule: any,
  checkInDate: Date,
  bookingDate: Date
): boolean {
  const { condition } = rule;

  // Check day of week
  if (condition.dayOfWeek && condition.dayOfWeek.length > 0) {
    const dayOfWeek = checkInDate.getDay();
    if (!condition.dayOfWeek.includes(dayOfWeek)) {
      return false;
    }
  }

  // Check date range
  if (condition.dateRange) {
    const { start, end } = condition.dateRange;
    if (checkInDate < new Date(start) || checkInDate > new Date(end)) {
      return false;
    }
  }

  // Check days before check-in (for last-minute deals)
  if (condition.daysBeforeCheckIn !== undefined) {
    const daysUntilCheckIn = Math.floor(
      (checkInDate.getTime() - bookingDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    if (daysUntilCheckIn > condition.daysBeforeCheckIn) {
      return false;
    }
  }

  return true;
}

/**
 * Calculate price for entire stay with dynamic pricing
 */
export async function calculateStayPrice(
  propertyId: string,
  basePrice: number,
  planType: PlanType,
  checkInDate: Date,
  checkOutDate: Date,
  bookingDate: Date = new Date()
): Promise<{
  totalPrice: number;
  nights: number;
  nightlyPrices: Array<{
    date: Date;
    price: number;
    appliedRules: string[];
  }>;
}> {
  const nights = Math.ceil(
    (checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  const nightlyPrices: any[] = [];
  let totalPrice = 0;

  // Calculate price for each night
  for (let i = 0; i < nights; i++) {
    const currentNight = new Date(checkInDate);
    currentNight.setDate(currentNight.getDate() + i);

    const priceCalc = await calculateDynamicPrice(
      propertyId,
      basePrice,
      planType,
      currentNight,
      bookingDate
    );

    nightlyPrices.push({
      date: currentNight,
      price: priceCalc.finalPrice,
      appliedRules: priceCalc.appliedRules.map(r => r.name)
    });

    totalPrice += priceCalc.finalPrice;
  }

  return {
    totalPrice: Math.round(totalPrice),
    nights,
    nightlyPrices
  };
}

/**
 * Get weekend pricing rule template
 */
export function getWeekendPricingTemplate(propertyId: string) {
  return {
    propertyId,
    name: 'Weekend Pricing',
    type: 'multiplier' as const,
    ruleType: 'weekend' as const,
    condition: {
      dayOfWeek: [5, 6] // Friday, Saturday
    },
    adjustment: {
      EP: 1.2,
      CP: 1.25,
      MAP: 1.3,
      AP: 1.35
    },
    isActive: true,
    priority: 10
  };
}

/**
 * Get seasonal pricing rule template
 */
export function getSeasonalPricingTemplate(
  propertyId: string,
  startDate: Date,
  endDate: Date,
  seasonName: string
) {
  return {
    propertyId,
    name: `${seasonName} Season`,
    type: 'multiplier' as const,
    ruleType: 'seasonal' as const,
    condition: {
      dateRange: {
        start: startDate,
        end: endDate
      }
    },
    adjustment: {
      EP: 1.5,
      CP: 1.6,
      MAP: 1.7,
      AP: 1.8
    },
    isActive: true,
    priority: 20
  };
}

/**
 * Get last-minute discount template
 */
export function getLastMinuteDiscountTemplate(propertyId: string) {
  return {
    propertyId,
    name: 'Last Minute Discount',
    type: 'percentage' as const,
    ruleType: 'last_minute' as const,
    condition: {
      daysBeforeCheckIn: 3 // Within 3 days
    },
    adjustment: {
      EP: -10,
      CP: -10,
      MAP: -10,
      AP: -10
    },
    isActive: true,
    priority: 5
  };
}
