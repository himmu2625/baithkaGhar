import { Schema, model, models } from 'mongoose';

const EventServiceSchema = new Schema({
  propertyId: {
    type: String,
    required: true,
    ref: 'Property'
  },
  
  serviceName: {
    type: String,
    required: true,
    trim: true
  },
  
  serviceCode: {
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
    enum: ['catering', 'decoration', 'audio_visual', 'photography', 'entertainment', 'transportation', 'accommodation', 'security', 'cleaning', 'coordination', 'other'],
    required: true
  },
  
  subCategory: {
    type: String,
    trim: true
  },
  
  serviceType: {
    type: String,
    enum: ['in_house', 'outsourced', 'vendor_managed', 'client_arranged'],
    default: 'in_house'
  },
  
  provider: {
    type: {
      type: String,
      enum: ['internal', 'external_vendor', 'partner', 'freelancer'],
      default: 'internal'
    },
    
    contact: {
      name: String,
      company: String,
      phone: String,
      email: String,
      address: String
    },
    
    vendorId: {
      type: Schema.Types.ObjectId,
      ref: 'Vendor'
    },
    
    contractDetails: {
      contractNumber: String,
      contractStartDate: Date,
      contractEndDate: Date,
      paymentTerms: String,
      deliverables: [String]
    }
  },
  
  availability: {
    isAvailable: { type: Boolean, default: true },
    
    operatingDays: [{
      type: String,
      enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
    }],
    
    operatingHours: {
      start: String, // "09:00"
      end: String,   // "22:00"
      isFlexible: { type: Boolean, default: true }
    },
    
    seasonalAvailability: [{
      season: String,
      startDate: Date,
      endDate: Date,
      isAvailable: { type: Boolean, default: true },
      notes: String
    }],
    
    capacity: {
      maxSimultaneousEvents: { type: Number, default: 1 },
      maxGuestsPerEvent: Number,
      resourceLimitations: String
    },
    
    leadTime: {
      minimumDays: { type: Number, default: 1 },
      preferredDays: { type: Number, default: 7 },
      setupTime: { type: Number, default: 2 } // hours
    }
  },
  
  pricing: {
    structure: {
      type: String,
      enum: ['fixed', 'hourly', 'per_guest', 'per_event', 'tiered', 'custom'],
      default: 'fixed'
    },
    
    basePrice: {
      type: Number,
      required: true,
      min: 0
    },
    
    pricePerUnit: {
      unit: String, // 'hour', 'guest', 'piece', 'sqft'
      price: { type: Number, default: 0 }
    },
    
    tierPricing: [{
      description: String,
      minQuantity: Number,
      maxQuantity: Number,
      unitPrice: Number,
      fixedPrice: Number
    }],
    
    additionalCharges: {
      setupFee: { type: Number, default: 0 },
      transportationFee: { type: Number, default: 0 },
      overtimeRate: { type: Number, default: 0 }, // per hour
      weekendSurcharge: { type: Number, default: 0 }, // percentage
      holidayMultiplier: { type: Number, default: 1.0 },
      equipmentRental: { type: Number, default: 0 },
      materialsCost: { type: Number, default: 0 }
    },
    
    discounts: {
      bulkDiscount: [{
        minQuantity: Number,
        discountPercentage: Number
      }],
      earlyBookingDiscount: {
        days: Number,
        discountPercentage: Number
      },
      loyalClientDiscount: { type: Number, default: 0 }
    },
    
    currency: { type: String, default: 'INR' }
  },
  
  specifications: {
    duration: {
      typical: { type: Number }, // hours
      minimum: { type: Number },
      maximum: { type: Number },
      isFlexible: { type: Boolean, default: true }
    },
    
    requirements: {
      equipment: [{
        itemName: String,
        quantity: Number,
        specifications: String,
        isProvided: { type: Boolean, default: true },
        rentalCost: { type: Number, default: 0 }
      }],
      
      personnel: [{
        role: String,
        count: Number,
        skillsRequired: [String],
        experience: String,
        certification: String
      }],
      
      space: {
        indoorSpace: String,
        outdoorSpace: String,
        powerRequirements: String,
        storageNeeded: String,
        accessRequirements: String
      },
      
      materials: [{
        materialName: String,
        quantity: String,
        quality: String,
        source: String,
        estimatedCost: Number
      }]
    },
    
    deliverables: [{
      deliverable: String,
      description: String,
      timeline: String,
      format: String,
      quantity: Number
    }],
    
    qualityStandards: {
      certifications: [String],
      standards: [String],
      qualityChecks: [String],
      performanceMetrics: [String]
    }
  },
  
  packages: [{
    packageName: String,
    description: String,
    inclusions: [String],
    duration: Number,
    guestCapacity: {
      min: Number,
      max: Number
    },
    price: Number,
    isPopular: { type: Boolean, default: false }
  }],
  
  customization: {
    isCustomizable: { type: Boolean, default: true },
    customizationOptions: [{
      optionName: String,
      description: String,
      additionalCost: Number,
      isPopular: { type: Boolean, default: false }
    }],
    
    addOns: [{
      addOnName: String,
      description: String,
      price: Number,
      category: String,
      isRecommended: { type: Boolean, default: false }
    }]
  },
  
  performance: {
    totalBookings: { type: Number, default: 0 },
    totalRevenue: { type: Number, default: 0 },
    averageBookingValue: { type: Number, default: 0 },
    customerSatisfactionRating: { type: Number, default: 0 },
    
    qualityMetrics: {
      onTimeDelivery: { type: Number, default: 100 }, // percentage
      clientRetentionRate: { type: Number, default: 0 },
      complaintRate: { type: Number, default: 0 },
      repeatedBookings: { type: Number, default: 0 }
    },
    
    financialMetrics: {
      profitMargin: { type: Number, default: 0 },
      costPerService: { type: Number, default: 0 },
      revenueGrowth: { type: Number, default: 0 }
    },
    
    monthlyStats: [{
      month: Number,
      year: Number,
      bookings: Number,
      revenue: Number,
      averageRating: Number,
      issuesReported: Number
    }]
  },
  
  qualityControl: {
    standardProcedures: [String],
    checkpoints: [{
      checkpoint: String,
      timing: String, // 'pre_event', 'during_event', 'post_event'
      responsible: String,
      criteria: String
    }],
    
    feedback: {
      collectFeedback: { type: Boolean, default: true },
      feedbackMethods: [String],
      followUpRequired: { type: Boolean, default: false }
    },
    
    issues: [{
      issueDate: Date,
      description: String,
      severity: {
        type: String,
        enum: ['low', 'medium', 'high', 'critical'],
        default: 'medium'
      },
      rootCause: String,
      resolution: String,
      preventiveMeasures: String,
      resolvedDate: Date,
      clientImpact: String
    }]
  },
  
  compliance: {
    licenses: [{
      licenseName: String,
      number: String,
      issuingAuthority: String,
      issueDate: Date,
      expiryDate: Date,
      isValid: { type: Boolean, default: true }
    }],
    
    certifications: [{
      certificationName: String,
      certifyingBody: String,
      certificationDate: Date,
      expiryDate: Date,
      certificateNumber: String
    }],
    
    insurance: {
      liabilityInsurance: { type: Boolean, default: false },
      equipmentInsurance: { type: Boolean, default: false },
      professionalIndemnity: { type: Boolean, default: false },
      coverageAmount: Number,
      policyNumber: String,
      expiryDate: Date
    },
    
    healthAndSafety: {
      safetyProtocols: [String],
      emergencyProcedures: [String],
      riskAssessment: String,
      safetyEquipment: [String]
    }
  },
  
  dependencies: {
    prerequisiteServices: [{
      serviceId: {
        type: Schema.Types.ObjectId,
        ref: 'EventService'
      },
      serviceName: String,
      relationship: {
        type: String,
        enum: ['prerequisite', 'concurrent', 'follows', 'optional']
      },
      notes: String
    }],
    
    conflictingServices: [{
      serviceId: {
        type: Schema.Types.ObjectId,
        ref: 'EventService'
      },
      serviceName: String,
      conflictReason: String
    }],
    
    complementaryServices: [{
      serviceId: {
        type: Schema.Types.ObjectId,
        ref: 'EventService'
      },
      serviceName: String,
      benefit: String,
      combinedDiscount: { type: Number, default: 0 }
    }]
  },
  
  media: {
    images: [{
      url: String,
      alt: String,
      caption: String,
      category: String,
      isPrimary: { type: Boolean, default: false }
    }],
    
    videos: [{
      url: String,
      title: String,
      description: String,
      type: String
    }],
    
    portfolio: [{
      eventName: String,
      eventDate: Date,
      images: [String],
      description: String,
      clientTestimonial: String
    }]
  },
  
  terms: {
    serviceTerms: String,
    cancellationPolicy: String,
    refundPolicy: String,
    liabilityClause: String,
    forceMAjeureClause: String,
    
    paymentTerms: {
      advancePayment: { type: Number, default: 50 }, // percentage
      paymentMethods: [String],
      lateFee: { type: Number, default: 0 },
      refundPolicy: String
    }
  },
  
  reviews: [{
    reviewId: String,
    clientName: String,
    eventDate: Date,
    rating: { type: Number, min: 1, max: 5 },
    comment: String,
    isVerified: { type: Boolean, default: false },
    response: String,
    responseDate: Date,
    bookingId: {
      type: Schema.Types.ObjectId,
      ref: 'EventBooking'
    }
  }],
  
  status: {
    type: String,
    enum: ['active', 'inactive', 'seasonal', 'discontinued', 'under_review'],
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

EventServiceSchema.pre('save', function() {
  this.updatedAt = new Date();
  
  // Calculate performance metrics
  if (this.performance) {
    if (this.performance.totalBookings > 0) {
      this.performance.averageBookingValue = this.performance.totalRevenue / this.performance.totalBookings;
    }
  }
});

EventServiceSchema.index({ propertyId: 1, serviceCode: 1 }, { unique: true });
EventServiceSchema.index({ propertyId: 1, category: 1 });
EventServiceSchema.index({ propertyId: 1, status: 1 });
EventServiceSchema.index({ 'availability.isAvailable': 1 });
EventServiceSchema.index({ 'pricing.basePrice': 1 });
EventServiceSchema.index({ displayOrder: 1 });

EventServiceSchema.methods.calculatePrice = function(quantity: number, duration?: number, options?: any) {
  let totalPrice = 0;
  
  switch (this.pricing?.structure) {
    case 'fixed':
      totalPrice = this.pricing.basePrice;
      break;
      
    case 'hourly':
      totalPrice = (this.pricing.pricePerUnit?.price || 0) * (duration || 1);
      break;
      
    case 'per_guest':
      totalPrice = (this.pricing.pricePerUnit?.price || 0) * quantity;
      break;
      
    case 'per_event':
      totalPrice = this.pricing.basePrice;
      break;
      
    case 'tiered':
      const tier = this.pricing.tierPricing?.find((t: any) => 
        quantity >= (t.minQuantity || 0) && quantity <= (t.maxQuantity || Infinity)
      );
      
      if (tier) {
        totalPrice = tier.fixedPrice || ((tier.unitPrice || 0) * quantity);
      } else {
        totalPrice = this.pricing.basePrice;
      }
      break;
      
    default:
      totalPrice = this.pricing?.basePrice || 0;
  }
  
  // Add additional charges
  if (this.pricing?.additionalCharges) {
    totalPrice += this.pricing.additionalCharges.setupFee || 0;
    totalPrice += this.pricing.additionalCharges.transportationFee || 0;
    totalPrice += this.pricing.additionalCharges.equipmentRental || 0;
    totalPrice += this.pricing.additionalCharges.materialsCost || 0;
    
    if (duration && (duration > (this.specifications?.duration?.typical || 0))) {
      const overtimeHours = duration - (this.specifications.duration.typical || 0);
      totalPrice += overtimeHours * (this.pricing.additionalCharges.overtimeRate || 0);
    }
  }
  
  // Apply discounts
  if (this.pricing?.discounts) {
    // Bulk discount
    if (this.pricing.discounts.bulkDiscount) {
      const bulkDiscount = this.pricing.discounts.bulkDiscount.find((d: any) => quantity >= (d.minQuantity || 0));
      if (bulkDiscount) {
        totalPrice *= (1 - (bulkDiscount.discountPercentage || 0) / 100);
      }
    }
  }
  
  return Math.round(totalPrice);
};

EventServiceSchema.methods.isAvailableForDate = function(eventDate: Date) {
  if (!this.availability?.isAvailable || this.status !== 'active') return false;
  
  // Check seasonal availability
  if (this.availability.seasonalAvailability) {
    const seasonalCheck = this.availability.seasonalAvailability.find((s: any) =>
      eventDate >= new Date(s.startDate) && eventDate <= new Date(s.endDate)
    );
    
    if (seasonalCheck && !seasonalCheck.isAvailable) return false;
  }
  
  // Check operating days
  if (this.availability.operatingDays?.length > 0) {
    const dayOfWeek = eventDate.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    if (!this.availability.operatingDays.includes(dayOfWeek)) return false;
  }
  
  return true;
};

EventServiceSchema.methods.addBooking = function(bookingValue: number, guestCount?: number, rating?: number) {
  this.performance = this.performance || {};
  
  this.performance.totalBookings = (this.performance.totalBookings || 0) + 1;
  this.performance.totalRevenue = (this.performance.totalRevenue || 0) + bookingValue;
  this.performance.averageBookingValue = this.performance.totalRevenue / this.performance.totalBookings;
  
  if (rating) {
    const currentTotal = (this.performance.customerSatisfactionRating || 0) * (this.performance.totalBookings - 1);
    this.performance.customerSatisfactionRating = (currentTotal + rating) / this.performance.totalBookings;
  }
  
  return this.save();
};

EventServiceSchema.methods.addReview = function(reviewData: any) {
  this.reviews = this.reviews || [];
  
  this.reviews.push({
    ...reviewData,
    reviewId: Date.now().toString()
  });
  
  // Update average rating
  const totalRating = this.reviews.reduce((sum: number, review: any) => sum + (review.rating || 0), 0);
  this.performance = this.performance || {};
  this.performance.customerSatisfactionRating = totalRating / this.reviews.length;
  
  return this.save();
};

EventServiceSchema.methods.reportIssue = function(issueData: any) {
  this.qualityControl = this.qualityControl || { issues: [] };
  
  this.qualityControl.issues.push({
    ...issueData,
    issueDate: new Date()
  });
  
  return this.save();
};

EventServiceSchema.statics.findByProperty = function(propertyId: string) {
  return this.find({ propertyId, isActive: true }).sort({ category: 1, displayOrder: 1, serviceName: 1 });
};

EventServiceSchema.statics.findByCategory = function(propertyId: string, category: string) {
  return this.find({ propertyId, category, isActive: true }).sort({ displayOrder: 1, serviceName: 1 });
};

EventServiceSchema.statics.findAvailableForDate = function(propertyId: string, eventDate: Date) {
  return this.find({
    propertyId,
    status: 'active',
    isActive: true,
    'availability.isAvailable': true
  });
};

EventServiceSchema.statics.findInHouseServices = function(propertyId: string) {
  return this.find({ 
    propertyId, 
    serviceType: 'in_house', 
    isActive: true 
  }).sort({ category: 1, serviceName: 1 });
};

EventServiceSchema.statics.findByPriceRange = function(propertyId: string, minPrice: number, maxPrice: number) {
  return this.find({
    propertyId,
    isActive: true,
    'pricing.basePrice': { $gte: minPrice, $lte: maxPrice }
  }).sort({ 'pricing.basePrice': 1 });
};

EventServiceSchema.statics.getPerformanceReport = function(propertyId: string) {
  return this.aggregate([
    { $match: { propertyId, isActive: true } },
    {
      $group: {
        _id: '$category',
        totalServices: { $sum: 1 },
        totalRevenue: { $sum: '$performance.totalRevenue' },
        totalBookings: { $sum: '$performance.totalBookings' },
        averageRating: { $avg: '$performance.customerSatisfactionRating' },
        averagePrice: { $avg: '$pricing.basePrice' }
      }
    },
    { $sort: { totalRevenue: -1 } }
  ]);
};

const EventService = models.EventService || model('EventService', EventServiceSchema);

export default EventService;