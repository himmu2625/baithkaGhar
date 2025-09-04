import { Schema, model, models } from 'mongoose';

const EventPackageSchema = new Schema({
  propertyId: {
    type: String,
    required: true,
    ref: 'Property'
  },
  
  packageName: {
    type: String,
    required: true,
    trim: true
  },
  
  packageCode: {
    type: String,
    required: true,
    trim: true,
    uppercase: true
  },
  
  description: {
    type: String,
    trim: true
  },
  
  category: {
    type: String,
    enum: ['wedding', 'corporate', 'birthday', 'anniversary', 'conference', 'social', 'cultural', 'combo', 'seasonal'],
    required: true
  },
  
  eventTypeCompatibility: [{
    eventTypeId: {
      type: Schema.Types.ObjectId,
      ref: 'EventType'
    },
    eventTypeName: String,
    isPreferred: { type: Boolean, default: false }
  }],
  
  guestCapacity: {
    minimum: { type: Number, required: true, min: 1 },
    maximum: { type: Number, required: true },
    optimal: { type: Number, required: true }
  },
  
  duration: {
    hours: { type: Number, required: true, min: 1 },
    isFlexible: { type: Boolean, default: false },
    additionalHourRate: { type: Number, default: 0 }
  },
  
  inclusions: {
    venue: {
      included: { type: Boolean, default: true },
      venueOptions: [{
        venueId: {
          type: Schema.Types.ObjectId,
          ref: 'EventVenue'
        },
        venueName: String,
        isPrimary: { type: Boolean, default: false },
        additionalCost: { type: Number, default: 0 }
      }],
      setupIncluded: { type: Boolean, default: true },
      decorBasicIncluded: { type: Boolean, default: false }
    },
    
    catering: {
      included: { type: Boolean, default: true },
      serviceType: {
        type: String,
        enum: ['buffet', 'plated', 'cocktail_style', 'family_style', 'mixed'],
        default: 'buffet'
      },
      menuOptions: [{
        menuId: {
          type: Schema.Types.ObjectId,
          ref: 'EventMenu'
        },
        menuName: String,
        cuisineType: String,
        pricePerPerson: Number,
        isVegetarian: { type: Boolean, default: false },
        isDefault: { type: Boolean, default: false }
      }],
      beverageService: {
        type: String,
        enum: ['none', 'non_alcoholic', 'beer_wine', 'full_bar', 'premium_bar'],
        default: 'non_alcoholic'
      },
      staffService: { type: Boolean, default: true }
    },
    
    decoration: {
      included: { type: Boolean, default: true },
      decorationLevel: {
        type: String,
        enum: ['basic', 'standard', 'premium', 'luxury'],
        default: 'basic'
      },
      themes: [{
        themeName: String,
        description: String,
        colorScheme: [String],
        additionalCost: { type: Number, default: 0 },
        isPopular: { type: Boolean, default: false }
      }],
      floralArrangements: { type: Boolean, default: false },
      centerpieces: { type: Boolean, default: false },
      drapery: { type: Boolean, default: false },
      lighting: { type: Boolean, default: false }
    },
    
    audioVisual: {
      included: { type: Boolean, default: false },
      basicEquipment: { type: Boolean, default: false },
      equipment: [{
        equipmentName: String,
        quantity: Number,
        additionalCost: { type: Number, default: 0 }
      }],
      technicianSupport: { type: Boolean, default: false },
      duration: Number // hours of support
    },
    
    photography: {
      included: { type: Boolean, default: false },
      type: {
        type: String,
        enum: ['photography', 'videography', 'both']
      },
      duration: Number, // hours
      deliverables: [String],
      additionalCost: { type: Number, default: 0 }
    },
    
    entertainment: {
      included: { type: Boolean, default: false },
      entertainmentTypes: [{
        type: String, // "DJ", "Live Band", "Cultural Show"
        duration: Number,
        additionalCost: { type: Number, default: 0 }
      }]
    },
    
    accommodation: {
      included: { type: Boolean, default: false },
      roomsIncluded: { type: Number, default: 0 },
      roomType: String,
      nights: { type: Number, default: 1 },
      additionalRoomRate: { type: Number, default: 0 }
    },
    
    transportation: {
      included: { type: Boolean, default: false },
      serviceType: String,
      capacity: Number,
      additionalCost: { type: Number, default: 0 }
    }
  },
  
  exclusions: [{
    service: String,
    description: String,
    alternativeOption: String,
    additionalCost: Number
  }],
  
  addOns: [{
    serviceName: String,
    description: String,
    category: {
      type: String,
      enum: ['decoration', 'catering', 'entertainment', 'photography', 'transportation', 'accommodation', 'other']
    },
    price: { type: Number, required: true },
    isPopular: { type: Boolean, default: false },
    quantityBased: { type: Boolean, default: false },
    maxQuantity: Number
  }],
  
  pricing: {
    basePrice: {
      type: Number,
      required: true,
      min: 0
    },
    pricePerGuest: {
      type: Number,
      default: 0
    },
    priceCalculation: {
      type: String,
      enum: ['fixed', 'per_guest', 'hybrid'],
      default: 'hybrid'
    },
    
    tierPricing: [{
      guestRange: {
        min: Number,
        max: Number
      },
      pricePerGuest: Number,
      totalPrice: Number
    }],
    
    seasonalPricing: [{
      season: String,
      startDate: Date,
      endDate: Date,
      multiplier: { type: Number, default: 1.0 },
      description: String
    }],
    
    dayOfWeekPricing: [{
      days: [String],
      multiplier: { type: Number, default: 1.0 }
    }],
    
    advanceBookingDiscount: {
      enabled: { type: Boolean, default: false },
      days: Number, // book X days in advance
      discountPercentage: { type: Number, default: 0 }
    },
    
    currency: { type: String, default: 'INR' }
  },
  
  terms: {
    paymentTerms: {
      advancePayment: { type: Number, default: 30 }, // percentage
      balancePaymentDays: { type: Number, default: 7 } // days before event
    },
    
    cancellation: {
      cancellationPolicy: String,
      refundSlabs: [{
        daysBeforeEvent: Number,
        refundPercentage: Number
      }]
    },
    
    modifications: {
      allowModifications: { type: Boolean, default: true },
      modificationDeadline: { type: Number, default: 7 }, // days before event
      modificationFee: { type: Number, default: 0 }
    },
    
    forceMAjeure: String,
    liabilityClause: String,
    additionalTerms: [String]
  },
  
  customization: {
    isCustomizable: { type: Boolean, default: true },
    customizableElements: [String],
    customizationFee: { type: Number, default: 0 },
    
    substitutions: [{
      originalItem: String,
      alternatives: [{
        item: String,
        priceAdjustment: Number,
        description: String
      }]
    }]
  },
  
  marketing: {
    isPromoted: { type: Boolean, default: false },
    promotionEndDate: Date,
    specialOffers: [{
      offerName: String,
      discountPercentage: Number,
      validFrom: Date,
      validTill: Date,
      conditions: String
    }],
    
    targetAudience: [String],
    sellingPoints: [String],
    competitiveAdvantages: [String]
  },
  
  requirements: {
    minimumNotice: { type: Number, default: 7 }, // days
    maxAdvanceBooking: { type: Number, default: 365 }, // days
    
    clientRequirements: [String],
    specialInstructions: String,
    
    staffRequirements: [{
      role: String,
      count: Number,
      skillsRequired: [String],
      experience: String
    }],
    
    equipmentRequirements: [{
      equipment: String,
      quantity: Number,
      specifications: String,
      isOptional: { type: Boolean, default: false }
    }]
  },
  
  analytics: {
    totalBookings: { type: Number, default: 0 },
    totalRevenue: { type: Number, default: 0 },
    averageBookingValue: { type: Number, default: 0 },
    conversionRate: { type: Number, default: 0 }, // inquiries to bookings
    customerSatisfactionRating: { type: Number, default: 0 },
    
    popularityScore: { type: Number, default: 0 },
    profitMargin: { type: Number, default: 0 },
    
    monthlyStats: [{
      month: Number,
      year: Number,
      bookings: Number,
      revenue: Number,
      averageGuestCount: Number,
      averageRating: Number
    }],
    
    clientFeedback: [{
      rating: Number,
      comment: String,
      bookingId: {
        type: Schema.Types.ObjectId,
        ref: 'EventBooking'
      },
      date: Date
    }],
    
    lastAnalysisUpdate: Date
  },
  
  compliance: {
    licenses: [{
      licenseName: String,
      isRequired: { type: Boolean, default: false },
      number: String,
      expiryDate: Date
    }],
    
    insurance: {
      liabilityInsurance: { type: Boolean, default: false },
      minimumCoverage: Number
    },
    
    healthAndSafety: {
      haccp: { type: Boolean, default: false },
      foodSafety: { type: Boolean, default: false },
      fireSafety: { type: Boolean, default: false }
    }
  },
  
  media: {
    images: [{
      url: String,
      alt: String,
      caption: String,
      category: {
        type: String,
        enum: ['package_overview', 'venue_setup', 'catering', 'decoration', 'entertainment', 'testimonial']
      },
      isPrimary: { type: Boolean, default: false }
    }],
    
    videos: [{
      url: String,
      title: String,
      description: String,
      duration: Number, // seconds
      type: {
        type: String,
        enum: ['promotional', 'testimonial', 'walkthrough', 'setup_demo']
      }
    }],
    
    brochure: String, // URL to package brochure
    sampleContracts: [String] // URLs to sample contracts
  },
  
  status: {
    type: String,
    enum: ['active', 'inactive', 'seasonal', 'discontinued', 'coming_soon'],
    default: 'active'
  },
  
  visibility: {
    isPublic: { type: Boolean, default: true },
    isOnline: { type: Boolean, default: true },
    showOnWebsite: { type: Boolean, default: true },
    featuredPackage: { type: Boolean, default: false }
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

EventPackageSchema.pre('save', function() {
  this.updatedAt = new Date();
  
  // Calculate optimal guest count if not set
  if (this.guestCapacity?.minimum && this.guestCapacity?.maximum && !this.guestCapacity?.optimal) {
    this.guestCapacity.optimal = Math.floor((this.guestCapacity.minimum + this.guestCapacity.maximum) / 2);
  }
});

EventPackageSchema.index({ propertyId: 1, packageCode: 1 }, { unique: true });
EventPackageSchema.index({ propertyId: 1, category: 1 });
EventPackageSchema.index({ propertyId: 1, status: 1 });
EventPackageSchema.index({ 'guestCapacity.minimum': 1, 'guestCapacity.maximum': 1 });
EventPackageSchema.index({ 'pricing.basePrice': 1 });
EventPackageSchema.index({ 'analytics.popularityScore': -1 });
EventPackageSchema.index({ displayOrder: 1 });

EventPackageSchema.methods.calculatePrice = function(guestCount: number, eventDate?: Date) {
  let totalPrice = 0;
  
  // Base pricing calculation
  if (this.pricing?.priceCalculation === 'fixed') {
    totalPrice = this.pricing.basePrice;
  } else if (this.pricing?.priceCalculation === 'per_guest') {
    totalPrice = (this.pricing.pricePerGuest || 0) * guestCount;
  } else {
    // Hybrid pricing
    totalPrice = this.pricing?.basePrice || 0;
    
    // Check tier pricing
    if (this.pricing?.tierPricing?.length > 0) {
      const tier = this.pricing.tierPricing.find(t => 
        guestCount >= (t.guestRange?.min || 0) && guestCount <= (t.guestRange?.max || Infinity)
      );
      
      if (tier) {
        totalPrice = tier.totalPrice || ((tier.pricePerGuest || 0) * guestCount);
      } else {
        totalPrice += (this.pricing.pricePerGuest || 0) * guestCount;
      }
    } else {
      totalPrice += (this.pricing.pricePerGuest || 0) * guestCount;
    }
  }
  
  // Apply seasonal pricing
  if (eventDate && this.pricing?.seasonalPricing) {
    const seasonalRate = this.pricing.seasonalPricing.find(s => 
      eventDate >= new Date(s.startDate) && eventDate <= new Date(s.endDate)
    );
    
    if (seasonalRate) {
      totalPrice *= seasonalRate.multiplier;
    }
  }
  
  // Apply day-of-week pricing
  if (eventDate && this.pricing?.dayOfWeekPricing) {
    const dayOfWeek = eventDate.toLocaleLowerCase('en-US', { weekday: 'long' });
    const dayPricing = this.pricing.dayOfWeekPricing.find(d => d.days?.includes(dayOfWeek));
    
    if (dayPricing) {
      totalPrice *= dayPricing.multiplier;
    }
  }
  
  // Apply advance booking discount
  if (eventDate && this.pricing?.advanceBookingDiscount?.enabled) {
    const daysInAdvance = Math.ceil((eventDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    
    if (daysInAdvance >= (this.pricing.advanceBookingDiscount.days || 0)) {
      const discount = (this.pricing.advanceBookingDiscount.discountPercentage || 0) / 100;
      totalPrice *= (1 - discount);
    }
  }
  
  return Math.round(totalPrice);
};

EventPackageSchema.methods.canAccommodate = function(guestCount: number) {
  return guestCount >= (this.guestCapacity?.minimum || 0) && 
         guestCount <= (this.guestCapacity?.maximum || Infinity);
};

EventPackageSchema.methods.isCompatibleWithEventType = function(eventTypeId: string) {
  if (!this.eventTypeCompatibility?.length) return true;
  
  return this.eventTypeCompatibility.some(compat => 
    compat.eventTypeId?.toString() === eventTypeId
  );
};

EventPackageSchema.methods.getIncludedServices = function() {
  const services = [];
  
  if (this.inclusions?.venue?.included) services.push('venue');
  if (this.inclusions?.catering?.included) services.push('catering');
  if (this.inclusions?.decoration?.included) services.push('decoration');
  if (this.inclusions?.audioVisual?.included) services.push('audio_visual');
  if (this.inclusions?.photography?.included) services.push('photography');
  if (this.inclusions?.entertainment?.included) services.push('entertainment');
  if (this.inclusions?.accommodation?.included) services.push('accommodation');
  if (this.inclusions?.transportation?.included) services.push('transportation');
  
  return services;
};

EventPackageSchema.methods.addBookingAnalytics = function(bookingValue: number, guestCount: number, rating?: number) {
  this.analytics = this.analytics || {};
  
  this.analytics.totalBookings = (this.analytics.totalBookings || 0) + 1;
  this.analytics.totalRevenue = (this.analytics.totalRevenue || 0) + bookingValue;
  this.analytics.averageBookingValue = this.analytics.totalRevenue / this.analytics.totalBookings;
  
  if (rating) {
    const currentTotal = (this.analytics.customerSatisfactionRating || 0) * (this.analytics.totalBookings - 1);
    this.analytics.customerSatisfactionRating = (currentTotal + rating) / this.analytics.totalBookings;
  }
  
  // Update popularity score
  this.analytics.popularityScore = (this.analytics.totalBookings * 0.4) + 
                                   ((this.analytics.customerSatisfactionRating || 0) * 12);
  
  this.analytics.lastAnalysisUpdate = new Date();
  
  return this.save();
};

EventPackageSchema.methods.getRefundAmount = function(eventDate: Date, cancellationDate = new Date()) {
  if (!this.terms?.cancellation?.refundSlabs?.length) return 0;
  
  const daysUntilEvent = Math.ceil((eventDate.getTime() - cancellationDate.getTime()) / (1000 * 60 * 60 * 24));
  
  // Find applicable refund slab
  const refundSlab = this.terms.cancellation.refundSlabs
    .sort((a, b) => (b.daysBeforeEvent || 0) - (a.daysBeforeEvent || 0))
    .find(slab => daysUntilEvent >= (slab.daysBeforeEvent || 0));
  
  return refundSlab ? (refundSlab.refundPercentage || 0) : 0;
};

EventPackageSchema.statics.findByProperty = function(propertyId: string) {
  return this.find({ propertyId, isActive: true }).sort({ category: 1, displayOrder: 1, packageName: 1 });
};

EventPackageSchema.statics.findByCategory = function(propertyId: string, category: string) {
  return this.find({ propertyId, category, isActive: true }).sort({ displayOrder: 1, packageName: 1 });
};

EventPackageSchema.statics.findForGuestCount = function(propertyId: string, guestCount: number) {
  return this.find({
    propertyId,
    isActive: true,
    'guestCapacity.minimum': { $lte: guestCount },
    'guestCapacity.maximum': { $gte: guestCount }
  }).sort({ 'analytics.popularityScore': -1 });
};

EventPackageSchema.statics.findFeatured = function(propertyId: string) {
  return this.find({ 
    propertyId, 
    isActive: true,
    'visibility.featuredPackage': true 
  }).sort({ 'analytics.popularityScore': -1 });
};

EventPackageSchema.statics.findPopular = function(propertyId: string, limit = 10) {
  return this.find({ propertyId, isActive: true })
    .sort({ 'analytics.popularityScore': -1 })
    .limit(limit);
};

EventPackageSchema.statics.getAnalyticsSummary = function(propertyId: string) {
  return this.aggregate([
    { $match: { propertyId, isActive: true } },
    {
      $group: {
        _id: '$category',
        totalPackages: { $sum: 1 },
        totalBookings: { $sum: '$analytics.totalBookings' },
        totalRevenue: { $sum: '$analytics.totalRevenue' },
        averageRating: { $avg: '$analytics.customerSatisfactionRating' },
        averagePrice: { $avg: '$pricing.basePrice' }
      }
    },
    { $sort: { totalRevenue: -1 } }
  ]);
};

const EventPackage = models.EventPackage || model('EventPackage', EventPackageSchema);

export default EventPackage;