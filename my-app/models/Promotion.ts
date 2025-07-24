import mongoose, { Schema, Document } from 'mongoose';

export interface IPromotion extends Document {
  name: string;
  description?: string;
  type: 'last_minute' | 'early_bird' | 'long_stay' | 'seasonal' | 'volume' | 'first_time' | 'repeat_customer' | 'custom';
  discountType: 'percentage' | 'fixed_amount' | 'buy_x_get_y' | 'free_nights';
  
  // Discount configuration
  discountValue: number; // percentage (0-100) or fixed amount
  maxDiscountAmount?: number; // cap for percentage discounts
  minDiscountAmount?: number; // minimum discount to apply
  
  // Special discount types
  buyXGetY?: {
    buyNights: number;
    getFreeNights: number;
    maxFreeNights?: number;
  };
  
  // Conditions
  conditions: {
    // Date and timing conditions
    validFrom: Date;
    validTo: Date;
    advanceBookingDays?: {
      min?: number; // for early bird
      max?: number; // for last minute
    };
    
    // Stay duration conditions
    minStayNights?: number;
    maxStayNights?: number;
    
    // Booking value conditions
    minBookingAmount?: number;
    maxBookingAmount?: number;
    
    // Guest conditions
    minGuests?: number;
    maxGuests?: number;
    
    // Room conditions
    minRooms?: number;
    maxRooms?: number;
    
    // Day of week conditions
    daysOfWeek?: string[]; // ['monday', 'tuesday', etc.]
    excludeWeekends?: boolean;
    weekendsOnly?: boolean;
    
    // Customer conditions
    firstTimeCustomer?: boolean;
    repeatCustomer?: boolean;
    customerTier?: 'bronze' | 'silver' | 'gold' | 'platinum';
    
    // Usage limits
    usageLimit?: number; // total times this promotion can be used
    usageLimitPerCustomer?: number;
    
    // Property conditions
    applicableProperties?: string[]; // property IDs
    excludeProperties?: string[];
    propertyTypes?: string[];
    
    // Seasonal conditions
    seasons?: ('spring' | 'summer' | 'fall' | 'winter')[];
    months?: number[]; // 1-12
    
    // Special conditions
    combinableWithOtherPromotions?: boolean;
    requiresCouponCode?: boolean;
    minimumRating?: number; // property must have this rating
  };
  
  // Targeting and personalization
  targeting?: {
    userSegments?: string[];
    locationTargeting?: {
      countries?: string[];
      states?: string[];
      cities?: string[];
    };
    deviceTargeting?: ('mobile' | 'desktop' | 'tablet')[];
  };
  
  // Display and messaging
  displaySettings: {
    title: string;
    subtitle?: string;
    badgeText?: string;
    urgencyMessage?: string; // "Only 2 days left!"
    highlightColor?: string;
    showInSearch?: boolean;
    showOnPropertyPage?: boolean;
    showAtCheckout?: boolean;
    priority: number; // higher = more prominent
  };
  
  // Automation settings
  automation: {
    autoActivate: boolean;
    autoDeactivate: boolean;
    triggerConditions?: {
      lowOccupancy?: number; // activate when occupancy < threshold
      highOccupancy?: number; // deactivate when occupancy > threshold
      inventoryLevel?: number; // activate when rooms available < threshold
      seasonalTrigger?: boolean;
      competitorPricing?: boolean;
    };
  };
  
  // Analytics and tracking
  analytics: {
    usageCount: number;
    totalDiscountGiven: number;
    revenue: number;
    bookingsGenerated: number;
    conversionRate: number;
    avgBookingValue: number;
  };
  
  // Admin settings
  createdBy: mongoose.Types.ObjectId;
  updatedBy?: mongoose.Types.ObjectId;
  isActive: boolean;
  isPaused: boolean;
  
  // Audit fields
  createdAt: Date;
  updatedAt: Date;
  activatedAt?: Date;
  deactivatedAt?: Date;
  
  // Coupon code (if required)
  couponCode?: string;
  couponCodeType?: 'fixed' | 'auto_generated';
  
  // Status
  status: 'draft' | 'active' | 'paused' | 'expired' | 'completed';
  
  // Approval workflow
  approvalStatus?: 'pending' | 'approved' | 'rejected';
  approvedBy?: mongoose.Types.ObjectId;
  approvedAt?: Date;
  rejectionReason?: string;
}

const PromotionSchema = new Schema<IPromotion>({
  name: { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  type: { 
    type: String, 
    enum: ['last_minute', 'early_bird', 'long_stay', 'seasonal', 'volume', 'first_time', 'repeat_customer', 'custom'],
    required: true 
  },
  discountType: { 
    type: String, 
    enum: ['percentage', 'fixed_amount', 'buy_x_get_y', 'free_nights'],
    required: true 
  },
  
  discountValue: { type: Number, required: true, min: 0 },
  maxDiscountAmount: { type: Number, min: 0 },
  minDiscountAmount: { type: Number, min: 0 },
  
  buyXGetY: {
    buyNights: { type: Number, min: 1 },
    getFreeNights: { type: Number, min: 1 },
    maxFreeNights: { type: Number, min: 1 }
  },
  
  conditions: {
    validFrom: { type: Date, required: true },
    validTo: { type: Date, required: true },
    advanceBookingDays: {
      min: { type: Number, min: 0 },
      max: { type: Number, min: 0 }
    },
    minStayNights: { type: Number, min: 1 },
    maxStayNights: { type: Number, min: 1 },
    minBookingAmount: { type: Number, min: 0 },
    maxBookingAmount: { type: Number, min: 0 },
    minGuests: { type: Number, min: 1 },
    maxGuests: { type: Number, min: 1 },
    minRooms: { type: Number, min: 1 },
    maxRooms: { type: Number, min: 1 },
    daysOfWeek: [{ type: String, enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] }],
    excludeWeekends: { type: Boolean, default: false },
    weekendsOnly: { type: Boolean, default: false },
    firstTimeCustomer: { type: Boolean },
    repeatCustomer: { type: Boolean },
    customerTier: { type: String, enum: ['bronze', 'silver', 'gold', 'platinum'] },
    usageLimit: { type: Number, min: 1 },
    usageLimitPerCustomer: { type: Number, min: 1 },
    applicableProperties: [{ type: String }],
    excludeProperties: [{ type: String }],
    propertyTypes: [{ type: String }],
    seasons: [{ type: String, enum: ['spring', 'summer', 'fall', 'winter'] }],
    months: [{ type: Number, min: 1, max: 12 }],
    combinableWithOtherPromotions: { type: Boolean, default: false },
    requiresCouponCode: { type: Boolean, default: false },
    minimumRating: { type: Number, min: 1, max: 5 }
  },
  
  targeting: {
    userSegments: [{ type: String }],
    locationTargeting: {
      countries: [{ type: String }],
      states: [{ type: String }],
      cities: [{ type: String }]
    },
    deviceTargeting: [{ type: String, enum: ['mobile', 'desktop', 'tablet'] }]
  },
  
  displaySettings: {
    title: { type: String, required: true },
    subtitle: { type: String },
    badgeText: { type: String },
    urgencyMessage: { type: String },
    highlightColor: { type: String, default: '#ef4444' },
    showInSearch: { type: Boolean, default: true },
    showOnPropertyPage: { type: Boolean, default: true },
    showAtCheckout: { type: Boolean, default: true },
    priority: { type: Number, default: 1, min: 1, max: 10 }
  },
  
  automation: {
    autoActivate: { type: Boolean, default: false },
    autoDeactivate: { type: Boolean, default: false },
    triggerConditions: {
      lowOccupancy: { type: Number, min: 0, max: 100 },
      highOccupancy: { type: Number, min: 0, max: 100 },
      inventoryLevel: { type: Number, min: 0 },
      seasonalTrigger: { type: Boolean, default: false },
      competitorPricing: { type: Boolean, default: false }
    }
  },
  
  analytics: {
    usageCount: { type: Number, default: 0 },
    totalDiscountGiven: { type: Number, default: 0 },
    revenue: { type: Number, default: 0 },
    bookingsGenerated: { type: Number, default: 0 },
    conversionRate: { type: Number, default: 0 },
    avgBookingValue: { type: Number, default: 0 }
  },
  
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  isActive: { type: Boolean, default: false },
  isPaused: { type: Boolean, default: false },
  
  activatedAt: { type: Date },
  deactivatedAt: { type: Date },
  
  couponCode: { type: String, trim: true, uppercase: true },
  couponCodeType: { type: String, enum: ['fixed', 'auto_generated'], default: 'fixed' },
  
  status: { 
    type: String, 
    enum: ['draft', 'active', 'paused', 'expired', 'completed'],
    default: 'draft'
  },
  
  approvalStatus: { 
    type: String, 
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  approvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  approvedAt: { type: Date },
  rejectionReason: { type: String }
}, {
  timestamps: true
});

// Indexes for performance
PromotionSchema.index({ status: 1, isActive: 1 });
PromotionSchema.index({ 'conditions.validFrom': 1, 'conditions.validTo': 1 });
PromotionSchema.index({ 'conditions.applicableProperties': 1 });
PromotionSchema.index({ type: 1, discountType: 1 });
PromotionSchema.index({ couponCode: 1 });
PromotionSchema.index({ createdBy: 1 });

// Validation
PromotionSchema.pre('save', function(next) {
  // Validate date range
  if (this.conditions.validFrom >= this.conditions.validTo) {
    next(new Error('Valid from date must be before valid to date'));
    return;
  }
  
  // Validate discount value
  if (this.discountType === 'percentage' && this.discountValue > 100) {
    next(new Error('Percentage discount cannot exceed 100%'));
    return;
  }
  
  // Auto-generate coupon code if needed
  if (this.conditions.requiresCouponCode && !this.couponCode && this.couponCodeType === 'auto_generated') {
    this.couponCode = `PROMO${Date.now().toString(36).toUpperCase()}`;
  }
  
  next();
});

export default mongoose.models.Promotion || mongoose.model<IPromotion>('Promotion', PromotionSchema); 