import { Schema, model, models } from 'mongoose';

const EventTypeSchema = new Schema({
  propertyId: {
    type: String,
    required: true,
    ref: 'Property'
  },
  
  name: {
    type: String,
    required: true,
    trim: true
  },
  
  category: {
    type: String,
    enum: ['wedding', 'corporate', 'social', 'religious', 'cultural', 'entertainment', 'sports', 'educational', 'charity'],
    required: true
  },
  
  subCategory: {
    type: String,
    trim: true // e.g., "Product Launch", "Birthday Party", "Anniversary"
  },
  
  description: {
    type: String,
    trim: true
  },
  
  characteristics: {
    averageDuration: { type: Number, default: 4 }, // hours
    typicalGuestCount: {
      min: { type: Number, default: 1 },
      max: { type: Number, default: 500 }
    },
    peakSeason: [String], // months when this event type is popular
    
    commonRequirements: {
      catering: { type: Boolean, default: true },
      decoration: { type: Boolean, default: true },
      audioVisual: { type: Boolean, default: true },
      photography: { type: Boolean, default: false },
      entertainment: { type: Boolean, default: false },
      accommodation: { type: Boolean, default: false },
      transportation: { type: Boolean, default: false }
    },
    
    timing: {
      preferredTimeSlots: [String], // "morning", "afternoon", "evening", "night"
      preferredDays: [{
        type: String,
        enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
      }],
      seasonality: String,
      advanceBookingDays: { type: Number, default: 30 }
    }
  },
  
  venueRequirements: {
    spaceTypes: [{
      type: String,
      enum: ['indoor', 'outdoor', 'semi_outdoor', 'banquet_hall', 'conference_room', 'lawn', 'poolside', 'terrace']
    }],
    minimumCapacity: { type: Number, default: 1 },
    layoutPreferences: [String], // "theater", "classroom", "u_shape", "round_table"
    
    specificNeeds: {
      parking: { type: Boolean, default: true },
      accessibility: { type: Boolean, default: true },
      climateControl: { type: Boolean, default: true },
      naturalLight: { type: Boolean, default: false },
      soundproofing: { type: Boolean, default: false },
      proximityToAccommodation: { type: Boolean, default: false }
    }
  },
  
  serviceRequirements: {
    staffing: {
      eventCoordinator: { required: { type: Boolean, default: true }, count: { type: Number, default: 1 } },
      servers: { required: { type: Boolean, default: true }, ratio: { type: Number, default: 15 } }, // guests per server
      bartenders: { required: { type: Boolean, default: false }, ratio: { type: Number, default: 50 } },
      security: { required: { type: Boolean, default: false }, count: { type: Number, default: 1 } },
      valet: { required: { type: Boolean, default: false }, count: { type: Number, default: 2 } }
    },
    
    catering: {
      mealTypes: [String], // "breakfast", "lunch", "dinner", "cocktail", "snacks"
      serviceStyle: {
        type: String,
        enum: ['buffet', 'plated', 'family_style', 'cocktail_style', 'mixed'],
        default: 'buffet'
      },
      dietaryConsiderations: [String], // "vegetarian", "vegan", "halal", "kosher"
      beverageService: {
        type: String,
        enum: ['non_alcoholic', 'beer_wine', 'full_bar', 'cash_bar'],
        default: 'non_alcoholic'
      }
    },
    
    equipment: {
      audioVisual: {
        microphones: { type: Number, default: 0 },
        speakers: { type: Number, default: 0 },
        projectors: { type: Number, default: 0 },
        screens: { type: Number, default: 0 },
        lightingSystem: { type: Boolean, default: false },
        staging: { type: Boolean, default: false }
      },
      furniture: {
        roundTables: { type: Number, default: 0 },
        rectangularTables: { type: Number, default: 0 },
        chairs: { type: Number, default: 0 },
        linens: { type: Boolean, default: true },
        specialSeating: [String]
      }
    }
  },
  
  decorationThemes: [{
    themeName: String,
    description: String,
    colorScheme: [String],
    decorativeElements: [String],
    flowerArrangements: String,
    lightingStyle: String,
    additionalCost: { type: Number, default: 0 }
  }],
  
  packages: [{
    packageName: String,
    description: String,
    inclusions: [String],
    exclusions: [String],
    basePrice: { type: Number, required: true },
    pricePerGuest: { type: Number, default: 0 },
    minimumGuests: { type: Number, default: 1 },
    maximumGuests: Number,
    validityPeriod: String
  }],
  
  pricing: {
    basePricing: {
      venueCharge: { type: Number, default: 0 },
      decorationCharge: { type: Number, default: 0 },
      serviceCharge: { type: Number, default: 0 },
      equipmentCharge: { type: Number, default: 0 }
    },
    
    dynamicPricing: {
      peakSeasonMultiplier: { type: Number, default: 1.0 },
      weekendMultiplier: { type: Number, default: 1.2 },
      holidayMultiplier: { type: Number, default: 1.5 },
      lastMinuteDiscount: { type: Number, default: 0 }, // percentage
      advanceBookingDiscount: { type: Number, default: 0 }
    },
    
    currency: { type: String, default: 'INR' }
  },
  
  policies: {
    cancellation: {
      cancellationPolicy: String,
      refundPolicy: String,
      noShowPolicy: String
    },
    
    payment: {
      advancePayment: { type: Number, default: 50 }, // percentage
      finalPaymentDays: { type: Number, default: 7 }, // days before event
      acceptedMethods: [String]
    },
    
    restrictions: {
      ageRestrictions: String,
      dressCode: String,
      behaviorGuidelines: String,
      noiseRestrictions: String,
      decorationLimitations: String,
      outsideCateringAllowed: { type: Boolean, default: false },
      outsideAlcoholAllowed: { type: Boolean, default: false }
    }
  },
  
  marketingInfo: {
    targetAudience: [String],
    competitiveAdvantages: [String],
    marketingChannels: [String],
    seasonalPromotions: [{
      season: String,
      promotion: String,
      discount: Number
    }],
    
    sampleEvents: [{
      eventName: String,
      description: String,
      guestCount: Number,
      images: [String],
      testimonial: String
    }]
  },
  
  compliance: {
    licenses: [{
      licenseName: String,
      isRequired: { type: Boolean, default: false },
      expiryDate: Date,
      renewalReminder: { type: Boolean, default: false }
    }],
    
    insurance: {
      liabilityInsurance: { type: Boolean, default: false },
      eventInsurance: { type: Boolean, default: false },
      minimumCoverage: Number
    },
    
    permits: [String], // Special permits required for this event type
    
    safetyRequirements: {
      emergencyPlan: { type: Boolean, default: false },
      firstAidStation: { type: Boolean, default: false },
      securityProtocol: String,
      crowdControlMeasures: String
    }
  },
  
  customization: {
    customizableElements: [String],
    addOnServices: [{
      serviceName: String,
      description: String,
      price: Number,
      isPopular: { type: Boolean, default: false }
    }],
    
    flexibilityLevel: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium'
    }
  },
  
  analytics: {
    popularityScore: { type: Number, default: 0 },
    averageBookingValue: { type: Number, default: 0 },
    averageGuestCount: { type: Number, default: 0 },
    customerSatisfactionRating: { type: Number, default: 0 },
    repeatBookingRate: { type: Number, default: 0 },
    profitMargin: { type: Number, default: 0 },
    
    seasonalTrends: [{
      month: Number,
      bookingCount: Number,
      averageValue: Number
    }],
    
    lastAnalysisUpdate: Date
  },
  
  images: [{
    url: String,
    alt: String,
    caption: String,
    type: {
      type: String,
      enum: ['setup', 'decoration', 'catering', 'entertainment', 'guests']
    },
    isPrimary: { type: Boolean, default: false }
  }],
  
  status: {
    type: String,
    enum: ['active', 'inactive', 'seasonal', 'discontinued'],
    default: 'active'
  },
  
  isActive: {
    type: Boolean,
    default: true
  },
  
  displayOrder: {
    type: Number,
    default: 0
  },
  
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'StaffMember',
    required: true
  },
  
  lastUpdatedBy: {
    type: Schema.Types.ObjectId,
    ref: 'StaffMember'
  },
  
  createdAt: {
    type: Date,
    default: Date.now
  },
  
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

EventTypeSchema.pre('save', function() {
  this.updatedAt = new Date();
});

EventTypeSchema.index({ propertyId: 1, category: 1 });
EventTypeSchema.index({ propertyId: 1, status: 1 });
EventTypeSchema.index({ 'analytics.popularityScore': -1 });
EventTypeSchema.index({ displayOrder: 1 });

EventTypeSchema.methods.calculateEstimatedCost = function(guestCount: number, venueId?: string, duration?: number) {
  let totalCost = 0;
  
  // Base costs
  totalCost += this.pricing?.basePricing?.venueCharge || 0;
  totalCost += this.pricing?.basePricing?.decorationCharge || 0;
  totalCost += this.pricing?.basePricing?.serviceCharge || 0;
  totalCost += this.pricing?.basePricing?.equipmentCharge || 0;
  
  // Per guest costs from packages
  const defaultPackage = this.packages?.[0];
  if (defaultPackage) {
    totalCost += defaultPackage.basePrice;
    totalCost += (defaultPackage.pricePerGuest || 0) * guestCount;
  }
  
  // Duration adjustments (if event is longer than typical)
  const eventDuration = duration || this.characteristics?.averageDuration || 4;
  const durationMultiplier = eventDuration / (this.characteristics?.averageDuration || 4);
  if (durationMultiplier > 1) {
    totalCost *= durationMultiplier;
  }
  
  return Math.round(totalCost);
};

EventTypeSchema.methods.getRequiredStaffing = function(guestCount: number) {
  const staffing = this.serviceRequirements?.staffing || {};
  const requiredStaff: any = {};
  
  if (staffing.eventCoordinator?.required) {
    requiredStaff.eventCoordinator = staffing.eventCoordinator.count || 1;
  }
  
  if (staffing.servers?.required && staffing.servers.ratio) {
    requiredStaff.servers = Math.ceil(guestCount / staffing.servers.ratio);
  }
  
  if (staffing.bartenders?.required && staffing.bartenders.ratio) {
    requiredStaff.bartenders = Math.ceil(guestCount / staffing.bartenders.ratio);
  }
  
  if (staffing.security?.required) {
    requiredStaff.security = staffing.security.count || 1;
  }
  
  if (staffing.valet?.required) {
    requiredStaff.valet = staffing.valet.count || 2;
  }
  
  return requiredStaff;
};

EventTypeSchema.methods.isAvailableForDate = function(eventDate: Date) {
  // Check if event type is seasonal and date falls within season
  if (this.status === 'seasonal' && this.characteristics?.peakSeason) {
    const month = eventDate.toLocaleDateString('en-US', { month: 'long' }).toLowerCase();
    return this.characteristics.peakSeason.includes(month);
  }
  
  return this.status === 'active';
};

EventTypeSchema.methods.updateAnalytics = function(bookingValue: number, guestCount: number, rating?: number) {
  this.analytics = this.analytics || {};
  
  // Update averages
  const currentBookings = this.analytics.popularityScore || 0;
  const newBookingCount = currentBookings + 1;
  
  this.analytics.averageBookingValue = 
    ((this.analytics.averageBookingValue || 0) * currentBookings + bookingValue) / newBookingCount;
  
  this.analytics.averageGuestCount = 
    ((this.analytics.averageGuestCount || 0) * currentBookings + guestCount) / newBookingCount;
  
  if (rating) {
    this.analytics.customerSatisfactionRating = 
      ((this.analytics.customerSatisfactionRating || 0) * currentBookings + rating) / newBookingCount;
  }
  
  this.analytics.popularityScore = newBookingCount;
  this.analytics.lastAnalysisUpdate = new Date();
  
  return this.save();
};

EventTypeSchema.statics.findByProperty = function(propertyId: string) {
  return this.find({ propertyId, isActive: true }).sort({ category: 1, displayOrder: 1, name: 1 });
};

EventTypeSchema.statics.findByCategory = function(propertyId: string, category: string) {
  return this.find({ propertyId, category, isActive: true }).sort({ displayOrder: 1, name: 1 });
};

EventTypeSchema.statics.findForCapacity = function(propertyId: string, guestCount: number) {
  return this.find({
    propertyId,
    isActive: true,
    'characteristics.typicalGuestCount.min': { $lte: guestCount },
    'characteristics.typicalGuestCount.max': { $gte: guestCount }
  }).sort({ 'analytics.popularityScore': -1 });
};

EventTypeSchema.statics.getPopular = function(propertyId: string, limit = 10) {
  return this.find({ propertyId, isActive: true })
    .sort({ 'analytics.popularityScore': -1 })
    .limit(limit);
};

EventTypeSchema.statics.getAnalyticsSummary = function(propertyId: string) {
  return this.aggregate([
    { $match: { propertyId, isActive: true } },
    {
      $group: {
        _id: '$category',
        totalTypes: { $sum: 1 },
        averagePopularity: { $avg: '$analytics.popularityScore' },
        averageBookingValue: { $avg: '$analytics.averageBookingValue' },
        totalBookings: { $sum: '$analytics.popularityScore' }
      }
    },
    { $sort: { totalBookings: -1 } }
  ]);
};

const EventType = models.EventType || model('EventType', EventTypeSchema);

export default EventType;