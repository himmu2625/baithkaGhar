/**
 * Dynamic Pricing Utility Functions
 * Handles all dynamic pricing calculations and logic
 */

export interface DynamicPricingConfig {
  enabled: boolean;
  basePrice: number;
  minPrice: number;
  maxPrice: number;
  seasonalRates: {
    peak: { multiplier: number; months: number[] };
    offPeak: { multiplier: number; months: number[] };
    shoulder: { multiplier: number; months: number[] };
  };
  weeklyRates: {
    monday: number;
    tuesday: number;
    wednesday: number;
    thursday: number;
    friday: number;
    saturday: number;
    sunday: number;
  };
  demandPricing: {
    lowOccupancy: number;
    mediumOccupancy: number;
    highOccupancy: number;
  };
  competitionSensitivity: number;
  advanceBookingDiscounts: {
    "30+ days": number;
    "15-30 days": number;
    "7-15 days": number;
    "1-7 days": number;
  };
  eventPricing: {
    localEvents: number;
    festivals: number;
    conferences: number;
  };
  lastMinutePremium: number;
  autoPricing: {
    enabled: boolean;
    minMultiplier: number;
    maxMultiplier: number;
  };
  // Enhanced features
  directPricing?: {
    enabled: boolean;
    customPrices: Array<{
      startDate: string;
      endDate: string;
      price: number;
      reason: string;
      isActive: boolean;
    }>;
  };
  availabilityControl?: {
    enabled: boolean;
    blockedDates: Array<{
      startDate: string;
      endDate: string;
      reason: string;
      isActive: boolean;
    }>;
    demandControlSettings: {
      enabled: boolean;
      minBlockDuration: number;
      maxBlockDuration: number;
      targetOccupancyIncrease: number;
    };
  };
}

export interface DailyPrice {
  date: string;
  price: number;
  basePrice: number;
  seasonalMultiplier: number;
  weeklyMultiplier: number;
  advanceDiscount: number;
  lastMinutePremium: number;
}

export interface PricingResult {
  totalPrice: number;
  nightlyAverage: number;
  nights: number;
  dailyPrices: DailyPrice[];
  guests: number;
  currency: string;
  dynamicPricingEnabled: boolean;
}

/**
 * Calculate dynamic pricing for a property
 */
export function calculateDynamicPricing(
  property: any,
  startDate: string,
  endDate: string,
  guests: number = 1
): PricingResult {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const nights = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  
  // If dynamic pricing is not enabled, return base price
  if (!property.dynamicPricing?.enabled) {
    const totalPrice = property.price.base * nights;
    
    return {
      totalPrice: Math.round(totalPrice),
      nightlyAverage: Math.round(totalPrice / nights),
      nights,
      dailyPrices: [],
      guests,
      currency: 'INR',
      dynamicPricingEnabled: false
    };
  }
  
  let totalPrice = 0;
  const dailyPrices: DailyPrice[] = [];
  
  for (let i = 0; i < nights; i++) {
    const currentDate = new Date(start);
    currentDate.setDate(start.getDate() + i);
    
    let price = property.dynamicPricing.basePrice || property.price.base;
    
    // Apply seasonal multiplier
    const month = currentDate.getMonth();
    const seasonalMultiplier = getSeasonalMultiplier(property.dynamicPricing.seasonalRates, month);
    price *= seasonalMultiplier;
    
    // Apply weekly multiplier
    const dayOfWeek = currentDate.getDay();
    const weeklyMultiplier = getWeeklyMultiplier(property.dynamicPricing.weeklyRates, dayOfWeek);
    price *= weeklyMultiplier;
    
    // Apply demand multiplier (simplified - would be calculated based on occupancy)
    const demandMultiplier = 1.0; // This would be calculated based on occupancy
    price *= demandMultiplier;
    
    // Apply advance booking discount
    const daysUntilBooking = Math.ceil((start.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    const advanceDiscount = getAdvanceBookingDiscount(property.dynamicPricing.advanceBookingDiscounts, daysUntilBooking);
    price *= (1 - advanceDiscount / 100);
    
    // Apply last-minute premium
    if (daysUntilBooking <= 7) {
      price *= (1 + property.dynamicPricing.lastMinutePremium / 100);
    }
    
    // Ensure price is within bounds
    const minPrice = property.dynamicPricing.minPrice || property.price.base * 0.5;
    const maxPrice = property.dynamicPricing.maxPrice || property.price.base * 3;
    price = Math.max(minPrice, Math.min(maxPrice, price));
    
    dailyPrices.push({
      date: currentDate.toISOString().split('T')[0],
      price: Math.round(price),
      basePrice: property.dynamicPricing.basePrice || property.price.base,
      seasonalMultiplier,
      weeklyMultiplier,
      advanceDiscount,
      lastMinutePremium: daysUntilBooking <= 7 ? property.dynamicPricing.lastMinutePremium : 0
    });
    
    totalPrice += price;
  }
  
  return {
    totalPrice: Math.round(totalPrice),
    nightlyAverage: Math.round(totalPrice / nights),
    nights,
    dailyPrices,
    guests,
    currency: 'INR',
    dynamicPricingEnabled: true
  };
}

/**
 * Get seasonal multiplier based on month
 */
function getSeasonalMultiplier(seasonalRates: any, month: number): number {
  if (seasonalRates.peak.months.includes(month)) return seasonalRates.peak.multiplier;
  if (seasonalRates.offPeak.months.includes(month)) return seasonalRates.offPeak.multiplier;
  return seasonalRates.shoulder.multiplier;
}

/**
 * Get weekly multiplier based on day of week
 */
function getWeeklyMultiplier(weeklyRates: any, dayOfWeek: number): number {
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  return weeklyRates[days[dayOfWeek]] || 1.0;
}

/**
 * Get advance booking discount based on days until booking
 */
function getAdvanceBookingDiscount(discounts: any, daysUntilBooking: number): number {
  if (daysUntilBooking >= 30) return discounts["30+ days"];
  if (daysUntilBooking >= 15) return discounts["15-30 days"];
  if (daysUntilBooking >= 7) return discounts["7-15 days"];
  return discounts["1-7 days"];
}

/**
 * Get default dynamic pricing configuration (empty - no defaults)
 */
export function getDefaultDynamicPricingConfig(): DynamicPricingConfig {
  return {
    enabled: false,
    basePrice: 0,
    minPrice: 0,
    maxPrice: 0,
    // No defaults - admin must explicitly configure these
    seasonalRates: {
      peak: { multiplier: 1, months: [] },
      offPeak: { multiplier: 1, months: [] },
      shoulder: { multiplier: 1, months: [] }
    },
    weeklyRates: {
      monday: 1.0,
      tuesday: 1.0,
      wednesday: 1.0,
      thursday: 1.0,
      friday: 1.0,
      saturday: 1.0,
      sunday: 1.0
    },
    demandPricing: {
      lowOccupancy: 1.0,
      mediumOccupancy: 1.0,
      highOccupancy: 1.0
    },
    competitionSensitivity: 1.0,
    advanceBookingDiscounts: {
      "30+ days": 0,
      "15-30 days": 0,
      "7-15 days": 0,
      "1-7 days": 0
    },
    eventPricing: {
      localEvents: 0,
      festivals: 0,
      conferences: 0
    },
    lastMinutePremium: 0,
    autoPricing: {
      enabled: false,
      minMultiplier: 1.0,
      maxMultiplier: 1.0
    }
  };
}

/**
 * Validate dynamic pricing configuration
 */
export function validateDynamicPricingConfig(config: DynamicPricingConfig): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (config.basePrice <= 0) {
    errors.push('Base price must be greater than 0');
  }
  
  if (config.minPrice < 0) {
    errors.push('Minimum price cannot be negative');
  }
  
  if (config.maxPrice <= config.minPrice) {
    errors.push('Maximum price must be greater than minimum price');
  }
  
  if (config.seasonalRates.peak.multiplier < 0.5 || config.seasonalRates.peak.multiplier > 3.0) {
    errors.push('Peak season multiplier must be between 0.5 and 3.0');
  }
  
  if (config.seasonalRates.offPeak.multiplier < 0.3 || config.seasonalRates.offPeak.multiplier > 1.5) {
    errors.push('Off-peak season multiplier must be between 0.3 and 1.5');
  }
  
  if (config.seasonalRates.shoulder.multiplier < 0.5 || config.seasonalRates.shoulder.multiplier > 2.0) {
    errors.push('Shoulder season multiplier must be between 0.5 and 2.0');
  }
  
  // Validate weekly rates
  Object.entries(config.weeklyRates).forEach(([day, rate]) => {
    if (rate < 0.5 || rate > 2.0) {
      errors.push(`${day} rate must be between 0.5 and 2.0`);
    }
  });
  
  // Validate demand pricing
  if (config.demandPricing.lowOccupancy < 0.5 || config.demandPricing.lowOccupancy > 1.0) {
    errors.push('Low occupancy multiplier must be between 0.5 and 1.0');
  }
  
  if (config.demandPricing.mediumOccupancy < 0.8 || config.demandPricing.mediumOccupancy > 1.2) {
    errors.push('Medium occupancy multiplier must be between 0.8 and 1.2');
  }
  
  if (config.demandPricing.highOccupancy < 1.0 || config.demandPricing.highOccupancy > 2.0) {
    errors.push('High occupancy multiplier must be between 1.0 and 2.0');
  }
  
  // Validate enhanced features
  if (config.directPricing?.enabled) {
    if (!config.directPricing.customPrices || config.directPricing.customPrices.length === 0) {
      errors.push('Direct pricing is enabled but no custom prices are set');
    }
    
    config.directPricing.customPrices?.forEach((customPrice, index) => {
      if (new Date(customPrice.startDate) >= new Date(customPrice.endDate)) {
        errors.push(`Custom price ${index + 1}: Start date must be before end date`);
      }
      if (customPrice.price <= 0) {
        errors.push(`Custom price ${index + 1}: Price must be greater than 0`);
      }
    });
  }
  
  if (config.availabilityControl?.enabled) {
    if (!config.availabilityControl.blockedDates || config.availabilityControl.blockedDates.length === 0) {
      errors.push('Availability control is enabled but no blocked dates are set');
    }
    
    config.availabilityControl.blockedDates?.forEach((blockedDate, index) => {
      if (new Date(blockedDate.startDate) >= new Date(blockedDate.endDate)) {
        errors.push(`Blocked date ${index + 1}: Start date must be before end date`);
      }
    });
    
    const settings = config.availabilityControl.demandControlSettings;
    if (settings.enabled) {
      if (settings.minBlockDuration < 1) {
        errors.push('Minimum block duration must be at least 1 day');
      }
      if (settings.maxBlockDuration < settings.minBlockDuration) {
        errors.push('Maximum block duration must be greater than minimum block duration');
      }
      if (settings.targetOccupancyIncrease < 5 || settings.targetOccupancyIncrease > 100) {
        errors.push('Target occupancy increase must be between 5% and 100%');
      }
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Check if a date is blocked for availability control
 */
export function isDateBlocked(
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

/**
 * Get custom price for a specific date
 */
export function getCustomPrice(
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

/**
 * Calculate demand control impact
 */
export function calculateDemandControlImpact(
  blockedDates: Array<{ startDate: string; endDate: string; reason: string; isActive: boolean }>,
  targetOccupancyIncrease: number
): {
  totalBlockedDays: number;
  estimatedOccupancyIncrease: number;
  revenueImpact: number;
} {
  if (!blockedDates || blockedDates.length === 0) {
    return { totalBlockedDays: 0, estimatedOccupancyIncrease: 0, revenueImpact: 0 };
  }
  
  let totalBlockedDays = 0;
  
  blockedDates.forEach(blocked => {
    if (!blocked.isActive || blocked.reason !== 'demand_control') return;
    
    const startDate = new Date(blocked.startDate);
    const endDate = new Date(blocked.endDate);
    const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    totalBlockedDays += daysDiff;
  });
  
  const estimatedOccupancyIncrease = Math.min(targetOccupancyIncrease, 50); // Cap at 50%
  const revenueImpact = totalBlockedDays * (estimatedOccupancyIncrease / 100);
  
  return {
    totalBlockedDays,
    estimatedOccupancyIncrease,
    revenueImpact
  };
} 