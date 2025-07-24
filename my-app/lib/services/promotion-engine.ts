import { differenceInDays, format, isWithinInterval, parseISO } from 'date-fns';
import Promotion from '@/models/Promotion';
import Booking from '@/models/Booking';

interface BookingDetails {
  propertyId: string;
  checkInDate: Date;
  checkOutDate: Date;
  guests: number;
  rooms: number;
  totalAmount: number;
  userId?: string;
  bookingDate?: Date;
}

interface ApplicablePromotion {
  promotion: any;
  discountAmount: number;
  finalAmount: number;
  discountPercentage: number;
  validationResult: PromotionValidationResult;
}

interface PromotionValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  conditions: {
    dateRange: boolean;
    stayDuration: boolean;
    bookingAmount: boolean;
    advanceBooking: boolean;
    guestCount: boolean;
    roomCount: boolean;
    dayOfWeek: boolean;
    propertyEligibility: boolean;
    usageLimit: boolean;
    customerEligibility: boolean;
  };
}

export class PromotionEngine {
  /**
   * Find all applicable promotions for a booking
   */
  static async findApplicablePromotions(
    bookingDetails: BookingDetails,
    couponCode?: string
  ): Promise<ApplicablePromotion[]> {
    try {
      // Build query for active promotions
      const query: any = {
        isActive: true,
        status: 'active',
        'conditions.validFrom': { $lte: new Date() },
        'conditions.validTo': { $gte: new Date() }
      };

      // If coupon code provided, filter by it
      if (couponCode) {
        query.couponCode = couponCode.toUpperCase();
      } else {
        // Only get promotions that don't require coupon codes
        query['conditions.requiresCouponCode'] = { $ne: true };
      }

      const promotions = await Promotion.find(query)
        .sort({ 'displaySettings.priority': -1, 'discountValue': -1 })
        .lean();

      const applicablePromotions: ApplicablePromotion[] = [];

      for (const promotion of promotions) {
        const validationResult = await this.validatePromotion(promotion, bookingDetails);
        
        if (validationResult.isValid) {
          const discountAmount = this.calculateDiscountAmount(promotion, bookingDetails);
          const finalAmount = Math.max(0, bookingDetails.totalAmount - discountAmount);
          const discountPercentage = (discountAmount / bookingDetails.totalAmount) * 100;

          applicablePromotions.push({
            promotion,
            discountAmount,
            finalAmount,
            discountPercentage,
            validationResult
          });
        }
      }

      // Sort by highest discount amount
      return applicablePromotions.sort((a, b) => b.discountAmount - a.discountAmount);

    } catch (error) {
      console.error('Error finding applicable promotions:', error);
      return [];
    }
  }

  /**
   * Validate if a promotion is applicable to a booking
   */
  static async validatePromotion(
    promotion: any,
    bookingDetails: BookingDetails
  ): Promise<PromotionValidationResult> {
    const result: PromotionValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
      conditions: {
        dateRange: false,
        stayDuration: false,
        bookingAmount: false,
        advanceBooking: false,
        guestCount: false,
        roomCount: false,
        dayOfWeek: false,
        propertyEligibility: false,
        usageLimit: false,
        customerEligibility: false
      }
    };

    const conditions = promotion.conditions;
    const stayNights = differenceInDays(bookingDetails.checkOutDate, bookingDetails.checkInDate);
    const bookingDate = bookingDetails.bookingDate || new Date();
    const advanceBookingDays = differenceInDays(bookingDetails.checkInDate, bookingDate);

    // 1. Date range validation
    const validFrom = new Date(conditions.validFrom);
    const validTo = new Date(conditions.validTo);
    const now = new Date();
    
    if (isWithinInterval(now, { start: validFrom, end: validTo })) {
      result.conditions.dateRange = true;
    } else {
      result.isValid = false;
      result.errors.push(`Promotion is not valid for current date range`);
    }

    // 2. Stay duration validation
    if (conditions.minStayNights && stayNights < conditions.minStayNights) {
      result.isValid = false;
      result.errors.push(`Minimum stay of ${conditions.minStayNights} nights required`);
    } else if (conditions.maxStayNights && stayNights > conditions.maxStayNights) {
      result.isValid = false;
      result.errors.push(`Maximum stay of ${conditions.maxStayNights} nights exceeded`);
    } else {
      result.conditions.stayDuration = true;
    }

    // 3. Booking amount validation
    if (conditions.minBookingAmount && bookingDetails.totalAmount < conditions.minBookingAmount) {
      result.isValid = false;
      result.errors.push(`Minimum booking amount of ₹${conditions.minBookingAmount} required`);
    } else if (conditions.maxBookingAmount && bookingDetails.totalAmount > conditions.maxBookingAmount) {
      result.isValid = false;
      result.errors.push(`Maximum booking amount of ₹${conditions.maxBookingAmount} exceeded`);
    } else {
      result.conditions.bookingAmount = true;
    }

    // 4. Advance booking validation
    if (conditions.advanceBookingDays) {
      const { min, max } = conditions.advanceBookingDays;
      
      if (min && advanceBookingDays < min) {
        result.isValid = false;
        result.errors.push(`Must book at least ${min} days in advance`);
      } else if (max && advanceBookingDays > max) {
        result.isValid = false;
        result.errors.push(`Must book within ${max} days of stay`);
      } else {
        result.conditions.advanceBooking = true;
      }
    } else {
      result.conditions.advanceBooking = true;
    }

    // 5. Guest count validation
    if (conditions.minGuests && bookingDetails.guests < conditions.minGuests) {
      result.isValid = false;
      result.errors.push(`Minimum ${conditions.minGuests} guests required`);
    } else if (conditions.maxGuests && bookingDetails.guests > conditions.maxGuests) {
      result.isValid = false;
      result.errors.push(`Maximum ${conditions.maxGuests} guests allowed`);
    } else {
      result.conditions.guestCount = true;
    }

    // 6. Room count validation
    if (conditions.minRooms && bookingDetails.rooms < conditions.minRooms) {
      result.isValid = false;
      result.errors.push(`Minimum ${conditions.minRooms} rooms required`);
    } else if (conditions.maxRooms && bookingDetails.rooms > conditions.maxRooms) {
      result.isValid = false;
      result.errors.push(`Maximum ${conditions.maxRooms} rooms allowed`);
    } else {
      result.conditions.roomCount = true;
    }

    // 7. Day of week validation
    if (conditions.daysOfWeek && conditions.daysOfWeek.length > 0) {
      const checkInDay = format(bookingDetails.checkInDate, 'EEEE').toLowerCase();
      
      if (conditions.daysOfWeek.includes(checkInDay)) {
        result.conditions.dayOfWeek = true;
      } else {
        result.isValid = false;
        result.errors.push(`Promotion only valid for: ${conditions.daysOfWeek.join(', ')}`);
      }
    } else if (conditions.excludeWeekends) {
      const checkInDay = bookingDetails.checkInDate.getDay();
      if (checkInDay === 0 || checkInDay === 6) { // Sunday or Saturday
        result.isValid = false;
        result.errors.push('Promotion excludes weekends');
      } else {
        result.conditions.dayOfWeek = true;
      }
    } else if (conditions.weekendsOnly) {
      const checkInDay = bookingDetails.checkInDate.getDay();
      if (checkInDay !== 0 && checkInDay !== 6) { // Not Sunday or Saturday
        result.isValid = false;
        result.errors.push('Promotion only valid for weekends');
      } else {
        result.conditions.dayOfWeek = true;
      }
    } else {
      result.conditions.dayOfWeek = true;
    }

    // 8. Property eligibility validation
    if (conditions.applicableProperties && conditions.applicableProperties.length > 0) {
      if (conditions.applicableProperties.includes(bookingDetails.propertyId)) {
        result.conditions.propertyEligibility = true;
      } else {
        result.isValid = false;
        result.errors.push('Property not eligible for this promotion');
      }
    } else if (conditions.excludeProperties && conditions.excludeProperties.length > 0) {
      if (conditions.excludeProperties.includes(bookingDetails.propertyId)) {
        result.isValid = false;
        result.errors.push('Property excluded from this promotion');
      } else {
        result.conditions.propertyEligibility = true;
      }
    } else {
      result.conditions.propertyEligibility = true;
    }

    // 9. Usage limit validation
    if (conditions.usageLimit && promotion.analytics.usageCount >= conditions.usageLimit) {
      result.isValid = false;
      result.errors.push('Promotion usage limit reached');
    } else {
      result.conditions.usageLimit = true;
    }

    // 10. Customer eligibility (if user provided)
    if (bookingDetails.userId) {
      result.conditions.customerEligibility = await this.validateCustomerEligibility(
        promotion, 
        bookingDetails.userId, 
        result
      );
    } else {
      result.conditions.customerEligibility = true;
    }

    return result;
  }

  /**
   * Calculate discount amount for a validated promotion
   */
  static calculateDiscountAmount(promotion: any, bookingDetails: BookingDetails): number {
    const { discountType, discountValue, maxDiscountAmount, minDiscountAmount } = promotion;
    let discountAmount = 0;

    switch (discountType) {
      case 'percentage':
        discountAmount = (bookingDetails.totalAmount * discountValue) / 100;
        if (maxDiscountAmount) {
          discountAmount = Math.min(discountAmount, maxDiscountAmount);
        }
        break;

      case 'fixed_amount':
        discountAmount = discountValue;
        break;

      case 'buy_x_get_y':
        if (promotion.buyXGetY) {
          const stayNights = differenceInDays(bookingDetails.checkOutDate, bookingDetails.checkInDate);
          const eligibleSets = Math.floor(stayNights / promotion.buyXGetY.buyNights);
          let freeNights = eligibleSets * promotion.buyXGetY.getFreeNights;
          
          if (promotion.buyXGetY.maxFreeNights) {
            freeNights = Math.min(freeNights, promotion.buyXGetY.maxFreeNights);
          }
          
          const nightlyRate = bookingDetails.totalAmount / stayNights;
          discountAmount = freeNights * nightlyRate;
        }
        break;

      case 'free_nights':
        const stayNights = differenceInDays(bookingDetails.checkOutDate, bookingDetails.checkInDate);
        const freeNights = Math.min(discountValue, stayNights);
        const nightlyRate = bookingDetails.totalAmount / stayNights;
        discountAmount = freeNights * nightlyRate;
        break;

      default:
        discountAmount = 0;
    }

    // Apply minimum discount if specified
    if (minDiscountAmount && discountAmount < minDiscountAmount) {
      discountAmount = 0; // Don't apply if below minimum
    }

    // Ensure discount doesn't exceed total amount
    return Math.min(discountAmount, bookingDetails.totalAmount);
  }

  /**
   * Apply promotion to booking and update analytics
   */
  static async applyPromotionToBooking(
    promotionId: string, 
    bookingDetails: BookingDetails,
    discountAmount: number
  ): Promise<boolean> {
    try {
      // Update promotion analytics
      await Promotion.findByIdAndUpdate(promotionId, {
        $inc: {
          'analytics.usageCount': 1,
          'analytics.totalDiscountGiven': discountAmount,
          'analytics.revenue': bookingDetails.totalAmount - discountAmount,
          'analytics.bookingsGenerated': 1
        }
      });

      // Calculate new averages
      const promotion = await Promotion.findById(promotionId);
      if (promotion) {
        const newAvgBookingValue = promotion.analytics.revenue / promotion.analytics.bookingsGenerated;
        await Promotion.findByIdAndUpdate(promotionId, {
          'analytics.avgBookingValue': newAvgBookingValue
        });
      }

      return true;
    } catch (error) {
      console.error('Error applying promotion to booking:', error);
      return false;
    }
  }

  /**
   * Validate customer eligibility for promotion
   */
  private static async validateCustomerEligibility(
    promotion: any,
    userId: string,
    result: PromotionValidationResult
  ): Promise<boolean> {
    try {
      const conditions = promotion.conditions;

      // Check usage limit per customer
      if (conditions.usageLimitPerCustomer) {
        const customerUsage = await Booking.countDocuments({
          userId,
          promotionId: promotion._id,
          status: { $in: ['confirmed', 'completed'] }
        });

        if (customerUsage >= conditions.usageLimitPerCustomer) {
          result.isValid = false;
          result.errors.push('Customer usage limit reached for this promotion');
          return false;
        }
      }

      // Check first-time customer requirement
      if (conditions.firstTimeCustomer) {
        const existingBookings = await Booking.countDocuments({
          userId,
          status: { $in: ['confirmed', 'completed'] }
        });

        if (existingBookings > 0) {
          result.isValid = false;
          result.errors.push('Promotion only available for first-time customers');
          return false;
        }
      }

      // Check repeat customer requirement
      if (conditions.repeatCustomer) {
        const existingBookings = await Booking.countDocuments({
          userId,
          status: { $in: ['confirmed', 'completed'] }
        });

        if (existingBookings === 0) {
          result.isValid = false;
          result.errors.push('Promotion only available for repeat customers');
          return false;
        }
      }

      return true;
    } catch (error) {
      console.error('Error validating customer eligibility:', error);
      return false;
    }
  }

  /**
   * Get promotion display information for user interfaces
   */
  static getPromotionDisplayInfo(promotion: any, discountAmount: number): {
    badge: string;
    title: string;
    description: string;
    urgency?: string;
    savings: string;
  } {
    const { displaySettings, conditions } = promotion;
    
    return {
      badge: displaySettings.badgeText || this.getDefaultBadgeText(promotion.type),
      title: displaySettings.title,
      description: displaySettings.subtitle || promotion.description || '',
      urgency: this.generateUrgencyMessage(promotion),
      savings: `Save ₹${discountAmount.toLocaleString()}`
    };
  }

  /**
   * Generate default badge text based on promotion type
   */
  private static getDefaultBadgeText(type: string): string {
    const badges = {
      last_minute: 'Last Minute Deal',
      early_bird: 'Early Bird Special',
      long_stay: 'Extended Stay Discount',
      seasonal: 'Seasonal Offer',
      volume: 'Volume Discount',
      first_time: 'Welcome Offer',
      repeat_customer: 'Loyalty Reward',
      custom: 'Special Offer'
    };
    
    return badges[type as keyof typeof badges] || 'Special Offer';
  }

  /**
   * Generate urgency message
   */
  private static generateUrgencyMessage(promotion: any): string | undefined {
    const validTo = new Date(promotion.conditions.validTo);
    const now = new Date();
    const daysLeft = differenceInDays(validTo, now);

    if (promotion.displaySettings.urgencyMessage) {
      return promotion.displaySettings.urgencyMessage;
    }

    if (daysLeft <= 1) {
      return 'Expires today!';
    } else if (daysLeft <= 3) {
      return `Only ${daysLeft} days left!`;
    } else if (daysLeft <= 7) {
      return `Ends in ${daysLeft} days`;
    }

    return undefined;
  }
}

export default PromotionEngine; 