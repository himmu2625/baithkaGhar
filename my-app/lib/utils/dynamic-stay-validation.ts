import { differenceInDays, parseISO, isBefore, isAfter, isWithinInterval } from 'date-fns';

interface DynamicStayRule {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  minStay: number;
  maxStay?: number;
  triggerType: 'season' | 'demand' | 'occupancy' | 'event' | 'custom';
  triggerCondition?: {
    occupancyThreshold?: number;
    demandLevel?: 'low' | 'medium' | 'high';
    eventType?: string;
  };
  priority: number;
  isActive: boolean;
  description?: string;
}

interface BookingWindowRule {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  minAdvanceBooking: number;
  maxAdvanceBooking?: number;
  lastMinuteBooking: boolean;
  triggerType: 'season' | 'demand' | 'occupancy' | 'event' | 'custom';
  triggerCondition?: {
    occupancyThreshold?: number;
    demandLevel?: 'low' | 'medium' | 'high';
    eventType?: string;
  };
  priority: number;
  isActive: boolean;
  description?: string;
}

interface DynamicStayRulesConfig {
  enabled: boolean;
  minimumStayRules: DynamicStayRule[];
  bookingWindowRules: BookingWindowRule[];
  defaultRules: {
    minStay: number;
    maxStay?: number;
    minAdvanceBooking: number;
    maxAdvanceBooking?: number;
    lastMinuteBooking: boolean;
  };
}

interface BookingRequest {
  checkInDate: Date;
  checkOutDate: Date;
  bookingDate: Date;
  guests: number;
  propertyId: string;
}

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  appliedRules: {
    stayRule?: DynamicStayRule;
    windowRule?: BookingWindowRule;
  };
  requirements: {
    minStay: number;
    maxStay?: number;
    minAdvanceBooking: number;
    maxAdvanceBooking?: number;
    lastMinuteBooking: boolean;
  };
}

interface OccupancyData {
  date: string;
  occupancyRate: number;
  demandLevel: 'low' | 'medium' | 'high';
}

export class DynamicStayValidator {
  private config: DynamicStayRulesConfig;
  private occupancyData: OccupancyData[];

  constructor(config: DynamicStayRulesConfig, occupancyData: OccupancyData[] = []) {
    this.config = config;
    this.occupancyData = occupancyData;
  }

  /**
   * Validate a booking request against dynamic stay rules
   */
  validateBooking(booking: BookingRequest): ValidationResult {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
      appliedRules: {},
      requirements: {
        minStay: this.config.defaultRules.minStay,
        maxStay: this.config.defaultRules.maxStay,
        minAdvanceBooking: this.config.defaultRules.minAdvanceBooking,
        maxAdvanceBooking: this.config.defaultRules.maxAdvanceBooking,
        lastMinuteBooking: this.config.defaultRules.lastMinuteBooking,
      }
    };

    // If dynamic stay rules are disabled, use default rules only
    if (!this.config.enabled) {
      return this.validateAgainstDefaults(booking, result);
    }

    // Find applicable rules
    const applicableStayRule = this.findApplicableStayRule(booking);
    const applicableWindowRule = this.findApplicableBookingWindowRule(booking);

    // Apply stay rule requirements
    if (applicableStayRule) {
      result.appliedRules.stayRule = applicableStayRule;
      result.requirements.minStay = applicableStayRule.minStay;
      result.requirements.maxStay = applicableStayRule.maxStay;
    }

    // Apply booking window rule requirements
    if (applicableWindowRule) {
      result.appliedRules.windowRule = applicableWindowRule;
      result.requirements.minAdvanceBooking = applicableWindowRule.minAdvanceBooking;
      result.requirements.maxAdvanceBooking = applicableWindowRule.maxAdvanceBooking;
      result.requirements.lastMinuteBooking = applicableWindowRule.lastMinuteBooking;
    }

    // Validate stay duration
    this.validateStayDuration(booking, result);

    // Validate booking window
    this.validateBookingWindow(booking, result);

    return result;
  }

  /**
   * Find the applicable minimum stay rule for the booking dates
   */
  private findApplicableStayRule(booking: BookingRequest): DynamicStayRule | null {
    const activeRules = this.config.minimumStayRules
      .filter(rule => rule.isActive)
      .filter(rule => this.isRuleApplicableForDates(rule, booking))
      .filter(rule => this.isRuleTriggerConditionMet(rule, booking))
      .sort((a, b) => b.priority - a.priority); // Higher priority first

    return activeRules[0] || null;
  }

  /**
   * Find the applicable booking window rule for the booking dates
   */
  private findApplicableBookingWindowRule(booking: BookingRequest): BookingWindowRule | null {
    const activeRules = this.config.bookingWindowRules
      .filter(rule => rule.isActive)
      .filter(rule => this.isRuleApplicableForDates(rule, booking))
      .filter(rule => this.isRuleTriggerConditionMet(rule, booking))
      .sort((a, b) => b.priority - a.priority); // Higher priority first

    return activeRules[0] || null;
  }

  /**
   * Check if a rule applies to the given booking dates
   */
  private isRuleApplicableForDates(rule: DynamicStayRule | BookingWindowRule, booking: BookingRequest): boolean {
    const ruleStart = parseISO(rule.startDate);
    const ruleEnd = parseISO(rule.endDate);
    
    // Check if booking dates overlap with rule period
    return isWithinInterval(booking.checkInDate, { start: ruleStart, end: ruleEnd }) ||
           isWithinInterval(booking.checkOutDate, { start: ruleStart, end: ruleEnd }) ||
           (isBefore(booking.checkInDate, ruleStart) && isAfter(booking.checkOutDate, ruleEnd));
  }

  /**
   * Check if the rule's trigger condition is met
   */
  private isRuleTriggerConditionMet(rule: DynamicStayRule | BookingWindowRule, booking: BookingRequest): boolean {
    if (!rule.triggerCondition) {
      return true; // No specific condition, rule always applies when dates match
    }

    switch (rule.triggerType) {
      case 'season':
        // Season-based rules always apply during their date range
        return true;

      case 'demand':
        return this.isDemandConditionMet(rule.triggerCondition.demandLevel!, booking);

      case 'occupancy':
        return this.isOccupancyConditionMet(rule.triggerCondition.occupancyThreshold!, booking);

      case 'event':
        // Event-based rules apply during their date range (event type is informational)
        return true;

      case 'custom':
        // Custom rules always apply during their date range
        return true;

      default:
        return true;
    }
  }

  /**
   * Check if demand condition is met
   */
  private isDemandConditionMet(demandLevel: 'low' | 'medium' | 'high', booking: BookingRequest): boolean {
    // Get average demand for the booking period
    const bookingDates = this.getDatesBetween(booking.checkInDate, booking.checkOutDate);
    const relevantOccupancy = this.occupancyData.filter(data => 
      bookingDates.includes(data.date)
    );

    if (relevantOccupancy.length === 0) {
      return demandLevel === 'medium'; // Default to medium demand if no data
    }

    const averageDemand = this.calculateAverageDemandLevel(relevantOccupancy);
    return averageDemand === demandLevel;
  }

  /**
   * Check if occupancy condition is met
   */
  private isOccupancyConditionMet(threshold: number, booking: BookingRequest): boolean {
    // Get average occupancy for the booking period
    const bookingDates = this.getDatesBetween(booking.checkInDate, booking.checkOutDate);
    const relevantOccupancy = this.occupancyData.filter(data => 
      bookingDates.includes(data.date)
    );

    if (relevantOccupancy.length === 0) {
      return false; // No occupancy data, condition not met
    }

    const averageOccupancy = relevantOccupancy.reduce((sum, data) => sum + data.occupancyRate, 0) / relevantOccupancy.length;
    return averageOccupancy >= threshold;
  }

  /**
   * Validate stay duration against requirements
   */
  private validateStayDuration(booking: BookingRequest, result: ValidationResult): void {
    const stayDuration = differenceInDays(booking.checkOutDate, booking.checkInDate);

    // Validate minimum stay
    if (stayDuration < result.requirements.minStay) {
      result.isValid = false;
      result.errors.push(
        `Minimum stay requirement not met. Required: ${result.requirements.minStay} night${result.requirements.minStay !== 1 ? 's' : ''}, Requested: ${stayDuration} night${stayDuration !== 1 ? 's' : ''}`
      );
    }

    // Validate maximum stay
    if (result.requirements.maxStay && stayDuration > result.requirements.maxStay) {
      result.isValid = false;
      result.errors.push(
        `Maximum stay limit exceeded. Maximum: ${result.requirements.maxStay} nights, Requested: ${stayDuration} nights`
      );
    }
  }

  /**
   * Validate booking window requirements
   */
  private validateBookingWindow(booking: BookingRequest, result: ValidationResult): void {
    const advanceBookingDays = differenceInDays(booking.checkInDate, booking.bookingDate);

    // Validate minimum advance booking
    if (advanceBookingDays < result.requirements.minAdvanceBooking) {
      if (advanceBookingDays === 0 && !result.requirements.lastMinuteBooking) {
        result.isValid = false;
        result.errors.push('Same-day bookings are not allowed for this period');
      } else if (advanceBookingDays < result.requirements.minAdvanceBooking) {
        result.isValid = false;
        result.errors.push(
          `Minimum advance booking requirement not met. Required: ${result.requirements.minAdvanceBooking} day${result.requirements.minAdvanceBooking !== 1 ? 's' : ''} in advance, Current: ${advanceBookingDays} day${advanceBookingDays !== 1 ? 's' : ''}`
        );
      }
    }

    // Validate maximum advance booking
    if (result.requirements.maxAdvanceBooking && advanceBookingDays > result.requirements.maxAdvanceBooking) {
      result.isValid = false;
      result.errors.push(
        `Booking too far in advance. Maximum: ${result.requirements.maxAdvanceBooking} days, Current: ${advanceBookingDays} days`
      );
    }

    // Add warnings for edge cases
    if (advanceBookingDays <= 1 && result.requirements.minAdvanceBooking > 1) {
      result.warnings.push('This is a last-minute booking and may be subject to additional fees');
    }

    if (result.requirements.maxAdvanceBooking && advanceBookingDays > (result.requirements.maxAdvanceBooking * 0.8)) {
      result.warnings.push('This booking is quite far in advance - policies may change');
    }
  }

  /**
   * Validate against default rules only
   */
  private validateAgainstDefaults(booking: BookingRequest, result: ValidationResult): ValidationResult {
    this.validateStayDuration(booking, result);
    this.validateBookingWindow(booking, result);
    return result;
  }

  /**
   * Helper function to get dates between two dates
   */
  private getDatesBetween(startDate: Date, endDate: Date): string[] {
    const dates: string[] = [];
    const currentDate = new Date(startDate);
    
    while (currentDate < endDate) {
      dates.push(currentDate.toISOString().split('T')[0]);
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return dates;
  }

  /**
   * Calculate average demand level from occupancy data
   */
  private calculateAverageDemandLevel(occupancyData: OccupancyData[]): 'low' | 'medium' | 'high' {
    const demandCounts = { low: 0, medium: 0, high: 0 };
    
    occupancyData.forEach(data => {
      demandCounts[data.demandLevel]++;
    });

    // Return the most frequent demand level
    const maxCount = Math.max(demandCounts.low, demandCounts.medium, demandCounts.high);
    if (demandCounts.high === maxCount) return 'high';
    if (demandCounts.medium === maxCount) return 'medium';
    return 'low';
  }

  /**
   * Get a human-readable summary of the validation result
   */
  getValidationSummary(result: ValidationResult): string {
    if (result.isValid) {
      let summary = 'Booking meets all requirements';
      
      if (result.appliedRules.stayRule || result.appliedRules.windowRule) {
        summary += ' (special rules applied)';
      }
      
      if (result.warnings.length > 0) {
        summary += `. Warnings: ${result.warnings.join(', ')}`;
      }
      
      return summary;
    } else {
      return `Booking cannot be processed: ${result.errors.join(', ')}`;
    }
  }

  /**
   * Check if a property has any active dynamic stay rules
   */
  hasActiveRules(): boolean {
    if (!this.config.enabled) return false;
    
    return this.config.minimumStayRules.some(rule => rule.isActive) ||
           this.config.bookingWindowRules.some(rule => rule.isActive);
  }

  /**
   * Get applicable rules for a specific date range (for display purposes)
   */
  getApplicableRulesForPeriod(startDate: Date, endDate: Date): {
    stayRules: DynamicStayRule[];
    windowRules: BookingWindowRule[];
  } {
    const mockBooking: BookingRequest = {
      checkInDate: startDate,
      checkOutDate: endDate,
      bookingDate: new Date(),
      guests: 2,
      propertyId: ''
    };

    return {
      stayRules: this.config.minimumStayRules
        .filter(rule => rule.isActive)
        .filter(rule => this.isRuleApplicableForDates(rule, mockBooking)),
      windowRules: this.config.bookingWindowRules
        .filter(rule => rule.isActive)
        .filter(rule => this.isRuleApplicableForDates(rule, mockBooking))
    };
  }
}

// Utility function to create validator instance
export function createDynamicStayValidator(
  config: DynamicStayRulesConfig, 
  occupancyData: OccupancyData[] = []
): DynamicStayValidator {
  return new DynamicStayValidator(config, occupancyData);
}

// Helper function for quick validation
export function validateBookingQuick(
  booking: BookingRequest,
  config: DynamicStayRulesConfig,
  occupancyData: OccupancyData[] = []
): ValidationResult {
  const validator = new DynamicStayValidator(config, occupancyData);
  return validator.validateBooking(booking);
} 