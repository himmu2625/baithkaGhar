import { Schema, model, models } from 'mongoose';

const EventEquipmentSchema = new Schema({
  propertyId: {
    type: String,
    required: true,
    ref: 'Property'
  },
  
  equipmentName: {
    type: String,
    required: true,
    trim: true
  },
  
  equipmentCode: {
    type: String,
    required: true,
    trim: true,
    uppercase: true
  },
  
  category: {
    type: String,
    enum: ['audio_visual', 'lighting', 'furniture', 'decoration', 'catering', 'transportation', 'security', 'cleaning', 'staging', 'climate_control'],
    required: true
  },
  
  subCategory: {
    type: String,
    trim: true
  },
  
  description: {
    type: String,
    trim: true
  },
  
  specifications: {
    brand: String,
    model: String,
    serialNumber: String,
    dimensions: {
      length: Number,
      width: Number,
      height: Number,
      unit: { type: String, default: 'cm' }
    },
    weight: {
      value: Number,
      unit: { type: String, default: 'kg' }
    },
    capacity: String,
    power: {
      voltage: Number,
      wattage: Number,
      amperage: Number,
      powerType: {
        type: String,
        enum: ['AC', 'DC', 'battery', 'manual'],
        default: 'AC'
      }
    },
    connectivity: [String], // USB, HDMI, WiFi, etc.
    operatingConditions: {
      temperature: {
        min: Number,
        max: Number,
        unit: { type: String, default: 'C' }
      },
      humidity: {
        min: Number,
        max: Number
      },
      environment: {
        type: String,
        enum: ['indoor', 'outdoor', 'both'],
        default: 'indoor'
      }
    },
    technicalSpecs: String
  },
  
  procurement: {
    purchaseDate: Date,
    purchasePrice: Number,
    vendor: {
      vendorId: {
        type: Schema.Types.ObjectId,
        ref: 'Vendor'
      },
      vendorName: String,
      contact: String
    },
    warrantyPeriod: Number, // months
    warrantyExpiry: Date,
    insuranceValue: Number,
    depreciationRate: { type: Number, default: 10 }, // percentage per year
    currentValue: Number,
    currency: { type: String, default: 'INR' }
  },
  
  availability: {
    status: {
      type: String,
      enum: ['available', 'in_use', 'maintenance', 'repair', 'retired', 'lost', 'damaged'],
      default: 'available'
    },
    
    location: {
      storageLocation: String,
      currentLocation: String,
      building: String,
      floor: String,
      room: String,
      coordinates: {
        latitude: Number,
        longitude: Number
      }
    },
    
    booking: {
      isBookable: { type: Boolean, default: true },
      advanceBookingDays: { type: Number, default: 30 },
      minimumRentalPeriod: { type: Number, default: 1 }, // hours
      maximumRentalPeriod: { type: Number, default: 168 }, // hours (1 week)
      
      currentBooking: {
        eventBookingId: {
          type: Schema.Types.ObjectId,
          ref: 'EventBooking'
        },
        eventName: String,
        bookedBy: String,
        bookingStart: Date,
        bookingEnd: Date,
        returnDue: Date
      }
    },
    
    restrictions: {
      indoorOnly: { type: Boolean, default: false },
      outdoorOnly: { type: Boolean, default: false },
      climateControlRequired: { type: Boolean, default: false },
      specialHandlingRequired: { type: Boolean, default: false },
      certifiedOperatorRequired: { type: Boolean, default: false },
      insuranceRequired: { type: Boolean, default: false }
    }
  },
  
  pricing: {
    rentalRate: {
      hourly: { type: Number, default: 0 },
      daily: { type: Number, default: 0 },
      weekly: { type: Number, default: 0 },
      monthly: { type: Number, default: 0 }
    },
    
    additionalCharges: {
      deliveryFee: { type: Number, default: 0 },
      setupFee: { type: Number, default: 0 },
      operatorFee: { type: Number, default: 0 }, // per hour
      damageFee: { type: Number, default: 0 },
      lateFee: { type: Number, default: 0 }, // per hour
      cleaningFee: { type: Number, default: 0 }
    },
    
    discounts: {
      bulkDiscount: [{
        minimumQuantity: Number,
        discountPercentage: Number
      }],
      longTermDiscount: [{
        minimumDays: Number,
        discountPercentage: Number
      }],
      loyalClientDiscount: { type: Number, default: 0 }
    },
    
    securityDeposit: { type: Number, default: 0 },
    currency: { type: String, default: 'INR' }
  },
  
  maintenance: {
    maintenanceSchedule: {
      frequency: {
        type: String,
        enum: ['daily', 'weekly', 'monthly', 'quarterly', 'annually', 'usage_based'],
        default: 'monthly'
      },
      lastMaintenance: Date,
      nextMaintenance: Date,
      
      usageBasedMaintenance: {
        maintenanceAfter: Number, // hours of usage
        currentUsage: { type: Number, default: 0 },
        maintenanceDue: { type: Boolean, default: false }
      }
    },
    
    maintenanceHistory: [{
      maintenanceDate: Date,
      maintenanceType: {
        type: String,
        enum: ['routine', 'preventive', 'corrective', 'emergency', 'upgrade'],
        required: true
      },
      description: String,
      performedBy: {
        internal: { type: Boolean, default: true },
        technician: String,
        vendor: String,
        contact: String
      },
      partsReplaced: [{
        partName: String,
        partNumber: String,
        cost: Number,
        warranty: String
      }],
      laborHours: Number,
      totalCost: Number,
      nextMaintenanceDate: Date,
      notes: String,
      photos: [String],
      warrantyImpact: String
    }],
    
    issues: [{
      reportDate: Date,
      issueDescription: String,
      severity: {
        type: String,
        enum: ['minor', 'moderate', 'major', 'critical'],
        default: 'moderate'
      },
      reportedBy: {
        type: Schema.Types.ObjectId,
        ref: 'StaffMember'
      },
      category: {
        type: String,
        enum: ['mechanical', 'electrical', 'software', 'cosmetic', 'performance', 'safety']
      },
      status: {
        type: String,
        enum: ['reported', 'diagnosed', 'parts_ordered', 'repair_in_progress', 'testing', 'resolved', 'deferred'],
        default: 'reported'
      },
      resolution: String,
      resolvedDate: Date,
      cost: Number,
      preventedFutureUse: { type: Boolean, default: false },
      warrantyCase: { type: Boolean, default: false }
    }],
    
    calibration: {
      requiresCalibration: { type: Boolean, default: false },
      calibrationFrequency: Number, // days
      lastCalibration: Date,
      nextCalibration: Date,
      calibratedBy: String,
      certificate: String
    }
  },
  
  usage: {
    totalUsageHours: { type: Number, default: 0 },
    usageThisMonth: { type: Number, default: 0 },
    usageThisYear: { type: Number, default: 0 },
    
    usageLog: [{
      eventBookingId: {
        type: Schema.Types.ObjectId,
        ref: 'EventBooking'
      },
      eventName: String,
      usageStart: Date,
      usageEnd: Date,
      hoursUsed: Number,
      operator: String,
      location: String,
      purpose: String,
      condition: {
        before: {
          type: String,
          enum: ['excellent', 'good', 'fair', 'poor'],
          default: 'good'
        },
        after: {
          type: String,
          enum: ['excellent', 'good', 'fair', 'poor', 'damaged']
        }
      },
      issues: String,
      photos: [String]
    }],
    
    performance: {
      reliability: { type: Number, min: 0, max: 100, default: 100 }, // percentage
      uptime: { type: Number, min: 0, max: 100, default: 100 }, // percentage
      customerSatisfaction: { type: Number, min: 1, max: 5, default: 5 },
      
      metrics: [{
        date: Date,
        hoursUsed: Number,
        eventsUsed: Number,
        issuesReported: Number,
        clientRating: Number,
        revenue: Number
      }]
    }
  },
  
  accessories: [{
    accessoryName: String,
    quantity: Number,
    isIncluded: { type: Boolean, default: true },
    condition: String,
    serialNumber: String,
    additionalCost: { type: Number, default: 0 },
    essential: { type: Boolean, default: false },
    storageLocation: String
  }],
  
  documentation: {
    manuals: [{
      type: {
        type: String,
        enum: ['user_manual', 'technical_manual', 'setup_guide', 'safety_guide']
      },
      documentName: String,
      url: String,
      version: String,
      language: String
    }],
    
    certifications: [{
      certificationType: String,
      issuingBody: String,
      certificateNumber: String,
      issueDate: Date,
      expiryDate: Date,
      isValid: { type: Boolean, default: true }
    }],
    
    photos: [{
      url: String,
      caption: String,
      type: {
        type: String,
        enum: ['product_photo', 'setup_example', 'damage_photo', 'maintenance_photo']
      },
      date: Date
    }],
    
    videos: [{
      url: String,
      title: String,
      type: {
        type: String,
        enum: ['demo', 'setup_guide', 'maintenance', 'troubleshooting']
      },
      duration: Number // seconds
    }]
  },
  
  safety: {
    safetyRating: {
      type: String,
      enum: ['low_risk', 'medium_risk', 'high_risk'],
      default: 'low_risk'
    },
    
    safetyRequirements: [{
      requirement: String,
      mandatory: { type: Boolean, default: true },
      description: String
    }],
    
    operatorRequirements: {
      trainingRequired: { type: Boolean, default: false },
      certificationRequired: { type: Boolean, default: false },
      minimumExperience: Number, // months
      ageRestriction: Number,
      physicalRequirements: [String]
    },
    
    riskAssessment: {
      hazards: [String],
      riskMitigations: [String],
      emergencyProcedures: [String],
      firstAid: String,
      lastAssessment: Date,
      nextAssessment: Date
    },
    
    insurance: {
      covered: { type: Boolean, default: true },
      policyNumber: String,
      coverageAmount: Number,
      expiryDate: Date,
      specialConditions: [String]
    }
  },
  
  analytics: {
    utilizationRate: { type: Number, default: 0 }, // percentage
    revenue: {
      totalRevenue: { type: Number, default: 0 },
      thisMonth: { type: Number, default: 0 },
      thisYear: { type: Number, default: 0 },
      averageRevenuePerBooking: { type: Number, default: 0 }
    },
    
    costAnalysis: {
      totalMaintenanceCost: { type: Number, default: 0 },
      costPerUsageHour: { type: Number, default: 0 },
      roi: { type: Number, default: 0 }, // return on investment percentage
      breakEvenPoint: Date,
      profitability: { type: Number, default: 0 }
    },
    
    bookingStats: {
      totalBookings: { type: Number, default: 0 },
      averageBookingDuration: { type: Number, default: 0 }, // hours
      repeatClients: { type: Number, default: 0 },
      cancellationRate: { type: Number, default: 0 },
      noShowRate: { type: Number, default: 0 }
    },
    
    lastAnalysisUpdate: Date
  },
  
  environmentalImpact: {
    energyConsumption: {
      powerRating: Number, // watts
      energyEfficiencyRating: String,
      estimatedCostPerHour: Number,
      carbonFootprint: Number // kg CO2 per hour
    },
    
    sustainability: {
      recyclable: { type: Boolean, default: false },
      biodegradable: { type: Boolean, default: false },
      energyEfficient: { type: Boolean, default: false },
      certifications: [String] // Energy Star, etc.
    }
  },
  
  compliance: {
    regulations: [{
      regulationType: String,
      regulationName: String,
      compliant: { type: Boolean, default: true },
      lastCheck: Date,
      nextCheck: Date,
      certificate: String
    }],
    
    standards: [{
      standardType: String,
      standardName: String,
      version: String,
      compliant: { type: Boolean, default: true }
    }]
  },
  
  status: {
    type: String,
    enum: ['active', 'inactive', 'retired', 'sold', 'lost'],
    default: 'active'
  },
  
  tags: [String], // For categorization and search
  
  isActive: {
    type: Boolean,
    default: true
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

EventEquipmentSchema.pre('save', function() {
  this.updatedAt = new Date();
  
  // Calculate current value based on depreciation
  if (this.procurement?.purchaseDate && this.procurement?.purchasePrice && this.procurement?.depreciationRate) {
    const yearsOld = (Date.now() - new Date(this.procurement.purchaseDate).getTime()) / (1000 * 60 * 60 * 24 * 365);
    const depreciationAmount = this.procurement.purchasePrice * (this.procurement.depreciationRate / 100) * yearsOld;
    this.procurement.currentValue = Math.max(0, this.procurement.purchasePrice - depreciationAmount);
  }
  
  // Update utilization rate
  if (this.usage?.totalUsageHours && this.createdAt) {
    const daysSincePurchase = (Date.now() - this.createdAt.getTime()) / (1000 * 60 * 60 * 24);
    const availableHours = daysSincePurchase * 12; // Assume 12 hours available per day
    this.analytics = this.analytics || { utilizationRate: 0 };
    this.analytics.utilizationRate = Math.min(100, (this.usage.totalUsageHours / availableHours) * 100);
  }
  
  // Check maintenance due
  if (this.maintenance?.maintenanceSchedule?.usageBasedMaintenance) {
    const usageMaintenance = this.maintenance.maintenanceSchedule.usageBasedMaintenance;
    if (usageMaintenance.currentUsage && usageMaintenance.maintenanceAfter && 
        usageMaintenance.currentUsage >= usageMaintenance.maintenanceAfter) {
      usageMaintenance.maintenanceDue = true;
    }
  }
});

EventEquipmentSchema.index({ propertyId: 1, equipmentCode: 1 }, { unique: true });
EventEquipmentSchema.index({ propertyId: 1, category: 1 });
EventEquipmentSchema.index({ propertyId: 1, 'availability.status': 1 });
EventEquipmentSchema.index({ 'availability.booking.isBookable': 1 });
EventEquipmentSchema.index({ tags: 1 });
EventEquipmentSchema.index({ 'maintenance.maintenanceSchedule.nextMaintenance': 1 });

EventEquipmentSchema.virtual('isAvailable').get(function() {
  return this.availability?.status === 'available' && 
         this.availability?.booking?.isBookable &&
         this.status === 'active';
});

EventEquipmentSchema.methods.bookEquipment = function(bookingData: any) {
  this.availability = this.availability || {};
  this.availability.status = 'in_use';
  this.availability.booking = this.availability.booking || {};
  this.availability.booking.currentBooking = bookingData;
  
  return this.save();
};

EventEquipmentSchema.methods.returnEquipment = function(condition?: string, issues?: string, photos?: string[]) {
  this.availability = this.availability || {};
  this.availability.status = condition === 'damaged' ? 'damaged' : 'available';
  
  // Log usage
  const currentBooking = this.availability.booking?.currentBooking;
  if (currentBooking) {
    const usageHours = Math.round(
      (Date.now() - new Date(currentBooking.bookingStart).getTime()) / (1000 * 60 * 60)
    );
    
    this.usage = this.usage || { usageLog: [] };
    this.usage.usageLog.push({
      eventBookingId: currentBooking.eventBookingId,
      eventName: currentBooking.eventName,
      usageStart: currentBooking.bookingStart,
      usageEnd: new Date(),
      hoursUsed: usageHours,
      condition: {
        before: 'good',
        after: condition || 'good'
      },
      issues: issues || '',
      photos: photos || []
    });
    
    this.usage.totalUsageHours = (this.usage.totalUsageHours || 0) + usageHours;
    
    // Clear current booking
    this.availability.booking.currentBooking = null;
  }
  
  return this.save();
};

EventEquipmentSchema.methods.recordMaintenance = function(maintenanceData: any) {
  this.maintenance = this.maintenance || { maintenanceHistory: [] };
  
  this.maintenance.maintenanceHistory.push({
    ...maintenanceData,
    maintenanceDate: new Date()
  });
  
  // Update maintenance schedule
  this.maintenance.maintenanceSchedule = this.maintenance.maintenanceSchedule || {};
  this.maintenance.maintenanceSchedule.lastMaintenance = new Date();
  
  // Calculate next maintenance date
  if (this.maintenance.maintenanceSchedule.frequency && this.maintenance.maintenanceSchedule.frequency !== 'usage_based') {
    const intervals = {
      daily: 1,
      weekly: 7,
      monthly: 30,
      quarterly: 90,
      annually: 365
    };
    
    const days = intervals[this.maintenance.maintenanceSchedule.frequency as keyof typeof intervals] || 30;
    this.maintenance.maintenanceSchedule.nextMaintenance = new Date(Date.now() + (days * 24 * 60 * 60 * 1000));
  }
  
  return this.save();
};

EventEquipmentSchema.methods.reportIssue = function(issueData: any, reportedBy: string) {
  this.maintenance = this.maintenance || { issues: [] };
  
  this.maintenance.issues.push({
    ...issueData,
    reportDate: new Date(),
    reportedBy,
    status: 'reported'
  });
  
  // If critical issue, mark as out of service
  if (issueData.severity === 'critical') {
    this.availability = this.availability || {};
    this.availability.status = 'repair';
  }
  
  return this.save();
};

EventEquipmentSchema.methods.calculateRentalPrice = function(hours: number, additionalServices?: string[]) {
  let totalPrice = 0;
  
  if (!this.pricing?.rentalRate) return 0;
  
  // Calculate base rental price
  if (hours <= 24) {
    totalPrice = (this.pricing.rentalRate.hourly || 0) * hours;
  } else if (hours <= 168) { // 1 week
    const days = Math.ceil(hours / 24);
    totalPrice = (this.pricing.rentalRate.daily || 0) * days;
  } else {
    const weeks = Math.ceil(hours / 168);
    totalPrice = (this.pricing.rentalRate.weekly || 0) * weeks;
  }
  
  // Add additional charges
  if (additionalServices?.includes('delivery')) {
    totalPrice += this.pricing.additionalCharges?.deliveryFee || 0;
  }
  if (additionalServices?.includes('setup')) {
    totalPrice += this.pricing.additionalCharges?.setupFee || 0;
  }
  if (additionalServices?.includes('operator')) {
    totalPrice += (this.pricing.additionalCharges?.operatorFee || 0) * hours;
  }
  
  return totalPrice;
};

EventEquipmentSchema.statics.findByProperty = function(propertyId: string) {
  return this.find({ propertyId, isActive: true }).sort({ category: 1, equipmentName: 1 });
};

EventEquipmentSchema.statics.findAvailable = function(propertyId: string, startDate?: Date, endDate?: Date) {
  let query: any = {
    propertyId,
    status: 'active',
    isActive: true,
    'availability.status': 'available',
    'availability.booking.isBookable': true
  };
  
  // Check for booking conflicts
  if (startDate && endDate) {
    query['$or'] = [
      { 'availability.booking.currentBooking': { $exists: false } },
      { 'availability.booking.currentBooking': null },
      {
        $and: [
          { 'availability.booking.currentBooking.bookingEnd': { $lte: startDate } },
          { 'availability.booking.currentBooking.bookingStart': { $gte: endDate } }
        ]
      }
    ];
  }
  
  return this.find(query).sort({ category: 1, equipmentName: 1 });
};

EventEquipmentSchema.statics.findByCategory = function(propertyId: string, category: string) {
  return this.find({ propertyId, category, isActive: true }).sort({ equipmentName: 1 });
};

EventEquipmentSchema.statics.findMaintenanceDue = function(propertyId: string) {
  const now = new Date();
  
  return this.find({
    propertyId,
    isActive: true,
    $or: [
      { 'maintenance.maintenanceSchedule.nextMaintenance': { $lte: now } },
      { 'maintenance.maintenanceSchedule.usageBasedMaintenance.maintenanceDue': true }
    ]
  }).sort({ 'maintenance.maintenanceSchedule.nextMaintenance': 1 });
};

EventEquipmentSchema.statics.getUtilizationReport = function(propertyId: string) {
  return this.aggregate([
    { $match: { propertyId, isActive: true } },
    {
      $group: {
        _id: '$category',
        totalEquipment: { $sum: 1 },
        averageUtilization: { $avg: '$analytics.utilizationRate' },
        totalRevenue: { $sum: '$analytics.revenue.totalRevenue' },
        totalMaintenanceCost: { $sum: '$analytics.costAnalysis.totalMaintenanceCost' },
        availableEquipment: {
          $sum: { $cond: [{ $eq: ['$availability.status', 'available'] }, 1, 0] }
        }
      }
    },
    { $sort: { totalRevenue: -1 } }
  ]);
};

EventEquipmentSchema.set('toJSON', { virtuals: true });
EventEquipmentSchema.set('toObject', { virtuals: true });

const EventEquipment = models.EventEquipment || model('EventEquipment', EventEquipmentSchema);

export default EventEquipment;