import mongoose, { Schema, Document } from 'mongoose';

export interface IPropertyManagement extends Document {
  propertyId: mongoose.Types.ObjectId;
  managementType: 'self_managed' | 'company_managed' | 'third_party';
  managementCompany?: {
    name: string;
    contactPerson: string;
    email: string;
    phone: string;
    address: string;
    licenseNumber?: string;
    contractStartDate: Date;
    contractEndDate: Date;
    commissionPercentage: number;
  };
  operationalStatus: 'active' | 'inactive' | 'under_maintenance' | 'seasonal_closed' | 'temporarily_closed';
  operationalHours: {
    reception: {
      open24x7: boolean;
      openTime?: string; // HH:MM format
      closeTime?: string; // HH:MM format
      timezone: string;
    };
    checkinCheckout: {
      checkInFrom: string; // HH:MM format
      checkInTo: string; // HH:MM format
      checkOutFrom: string; // HH:MM format
      checkOutTo: string; // HH:MM format
      lateCheckInFee?: number;
      earlyCheckOutPolicy?: string;
    };
  };
  contactInformation: {
    primaryContact: {
      name: string;
      designation: string;
      email: string;
      phone: string;
      whatsapp?: string;
    };
    emergencyContact: {
      name: string;
      phone: string;
      email?: string;
      relationship: string;
    };
    reservationsContact?: {
      email: string;
      phone: string;
      department: string;
    };
  };
  policies: {
    cancellationPolicy: {
      type: 'flexible' | 'moderate' | 'strict' | 'super_strict' | 'custom';
      customPolicy?: string;
      refundPercentage: {
        before24Hours: number;
        before7Days: number;
        before30Days: number;
      };
    };
    petPolicy: {
      allowed: boolean;
      restrictions?: string;
      additionalFee?: number;
      deposit?: number;
    };
    smokingPolicy: {
      allowed: boolean;
      designatedAreas?: string[];
      fine?: number;
    };
    childPolicy: {
      welcomeChildren: boolean;
      ageLimit?: number;
      additionalBedFee?: number;
      childrenStayFree?: number; // Age under which children stay free
    };
    guestPolicy: {
      maxGuestsAllowed: number;
      additionalGuestFee?: number;
      visitorPolicy: string;
      quietHours?: {
        start: string; // HH:MM
        end: string; // HH:MM
      };
    };
  };
  certifications: [{
    type: 'tourism_license' | 'fire_safety' | 'food_license' | 'environmental' | 'accessibility' | 'other';
    certificateName: string;
    issuingAuthority: string;
    certificateNumber: string;
    issueDate: Date;
    expiryDate: Date;
    isActive: boolean;
    documentUrl?: string;
  }];
  insuranceDetails: {
    propertyInsurance: {
      provider: string;
      policyNumber: string;
      coverageAmount: number;
      expiryDate: Date;
      isActive: boolean;
    };
    liabilityInsurance: {
      provider: string;
      policyNumber: string;
      coverageAmount: number;
      expiryDate: Date;
      isActive: boolean;
    };
    businessInsurance?: {
      provider: string;
      policyNumber: string;
      coverageAmount: number;
      expiryDate: Date;
      isActive: boolean;
    };
  };
  performanceMetrics: {
    averageOccupancyRate: number;
    averageDailyRate: number;
    revenuePAR: number; // Revenue Per Available Room
    guestSatisfactionScore: number;
    responseTime: {
      averageInquiryResponse: number; // in minutes
      averageIssueResolution: number; // in hours
    };
    cleanlinessRating: number;
    maintenanceScore: number;
  };
  seasonalOperations: [{
    season: string;
    startDate: Date;
    endDate: Date;
    operationalChanges: {
      roomsAvailable?: number;
      serviceRestrictions?: string[];
      pricingMultiplier?: number;
      staffAdjustments?: string;
    };
    isActive: boolean;
  }];
  specialServices: {
    airportTransfer: {
      available: boolean;
      fee?: number;
      advanceBookingRequired?: boolean;
    };
    laundryService: {
      available: boolean;
      fee?: number;
      turnaroundTime?: string;
    };
    roomService: {
      available: boolean;
      hours?: string;
      menu?: string;
    };
    conciergeService: {
      available: boolean;
      services?: string[];
    };
    tourBooking: {
      available: boolean;
      partnerAgencies?: string[];
    };
  };
  sustainabilityMeasures: {
    energyEfficiency: {
      solarPower: boolean;
      ledLighting: boolean;
      energyStarAppliances: boolean;
      smartThermostats: boolean;
    };
    waterConservation: {
      rainwaterHarvesting: boolean;
      lowFlowFixtures: boolean;
      greyWaterRecycling: boolean;
    };
    wasteManagement: {
      recyclingProgram: boolean;
      composting: boolean;
      plasticReduction: boolean;
    };
    certification?: {
      greenCertification: string;
      certifyingBody: string;
      validUntil: Date;
    };
  };
  lastUpdated: Date;
  updatedBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const PropertyManagementSchema = new Schema<IPropertyManagement>({
  propertyId: { 
    type: Schema.Types.ObjectId, 
    ref: 'Property', 
    required: true,
    unique: true 
  },
  managementType: { 
    type: String, 
    enum: ['self_managed', 'company_managed', 'third_party'],
    required: true 
  },
  managementCompany: {
    name: { type: String },
    contactPerson: { type: String },
    email: { type: String },
    phone: { type: String },
    address: { type: String },
    licenseNumber: { type: String },
    contractStartDate: { type: Date },
    contractEndDate: { type: Date },
    commissionPercentage: { type: Number, min: 0, max: 100 }
  },
  operationalStatus: { 
    type: String, 
    enum: ['active', 'inactive', 'under_maintenance', 'seasonal_closed', 'temporarily_closed'],
    default: 'active' 
  },
  operationalHours: {
    reception: {
      open24x7: { type: Boolean, default: false },
      openTime: { type: String },
      closeTime: { type: String },
      timezone: { type: String, default: 'Asia/Kolkata' }
    },
    checkinCheckout: {
      checkInFrom: { type: String, default: '14:00' },
      checkInTo: { type: String, default: '23:00' },
      checkOutFrom: { type: String, default: '07:00' },
      checkOutTo: { type: String, default: '11:00' },
      lateCheckInFee: { type: Number, min: 0 },
      earlyCheckOutPolicy: { type: String }
    }
  },
  contactInformation: {
    primaryContact: {
      name: { type: String, required: true },
      designation: { type: String, required: true },
      email: { type: String, required: true },
      phone: { type: String, required: true },
      whatsapp: { type: String }
    },
    emergencyContact: {
      name: { type: String, required: true },
      phone: { type: String, required: true },
      email: { type: String },
      relationship: { type: String, required: true }
    },
    reservationsContact: {
      email: { type: String },
      phone: { type: String },
      department: { type: String }
    }
  },
  policies: {
    cancellationPolicy: {
      type: { 
        type: String, 
        enum: ['flexible', 'moderate', 'strict', 'super_strict', 'custom'],
        default: 'moderate' 
      },
      customPolicy: { type: String },
      refundPercentage: {
        before24Hours: { type: Number, default: 0, min: 0, max: 100 },
        before7Days: { type: Number, default: 50, min: 0, max: 100 },
        before30Days: { type: Number, default: 80, min: 0, max: 100 }
      }
    },
    petPolicy: {
      allowed: { type: Boolean, default: false },
      restrictions: { type: String },
      additionalFee: { type: Number, min: 0 },
      deposit: { type: Number, min: 0 }
    },
    smokingPolicy: {
      allowed: { type: Boolean, default: false },
      designatedAreas: [{ type: String }],
      fine: { type: Number, min: 0 }
    },
    childPolicy: {
      welcomeChildren: { type: Boolean, default: true },
      ageLimit: { type: Number, min: 0 },
      additionalBedFee: { type: Number, min: 0 },
      childrenStayFree: { type: Number, default: 5, min: 0 }
    },
    guestPolicy: {
      maxGuestsAllowed: { type: Number, required: true, min: 1 },
      additionalGuestFee: { type: Number, min: 0 },
      visitorPolicy: { type: String, default: 'Not allowed after 10 PM' },
      quietHours: {
        start: { type: String, default: '22:00' },
        end: { type: String, default: '07:00' }
      }
    }
  },
  certifications: [{
    type: { 
      type: String, 
      enum: ['tourism_license', 'fire_safety', 'food_license', 'environmental', 'accessibility', 'other'],
      required: true 
    },
    certificateName: { type: String, required: true },
    issuingAuthority: { type: String, required: true },
    certificateNumber: { type: String, required: true },
    issueDate: { type: Date, required: true },
    expiryDate: { type: Date, required: true },
    isActive: { type: Boolean, default: true },
    documentUrl: { type: String }
  }],
  insuranceDetails: {
    propertyInsurance: {
      provider: { type: String, required: true },
      policyNumber: { type: String, required: true },
      coverageAmount: { type: Number, required: true, min: 0 },
      expiryDate: { type: Date, required: true },
      isActive: { type: Boolean, default: true }
    },
    liabilityInsurance: {
      provider: { type: String, required: true },
      policyNumber: { type: String, required: true },
      coverageAmount: { type: Number, required: true, min: 0 },
      expiryDate: { type: Date, required: true },
      isActive: { type: Boolean, default: true }
    },
    businessInsurance: {
      provider: { type: String },
      policyNumber: { type: String },
      coverageAmount: { type: Number, min: 0 },
      expiryDate: { type: Date },
      isActive: { type: Boolean, default: true }
    }
  },
  performanceMetrics: {
    averageOccupancyRate: { type: Number, default: 0, min: 0, max: 100 },
    averageDailyRate: { type: Number, default: 0, min: 0 },
    revenuePAR: { type: Number, default: 0, min: 0 },
    guestSatisfactionScore: { type: Number, default: 0, min: 0, max: 10 },
    responseTime: {
      averageInquiryResponse: { type: Number, default: 0, min: 0 },
      averageIssueResolution: { type: Number, default: 0, min: 0 }
    },
    cleanlinessRating: { type: Number, default: 0, min: 0, max: 10 },
    maintenanceScore: { type: Number, default: 0, min: 0, max: 10 }
  },
  seasonalOperations: [{
    season: { type: String, required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    operationalChanges: {
      roomsAvailable: { type: Number, min: 0 },
      serviceRestrictions: [{ type: String }],
      pricingMultiplier: { type: Number, min: 0 },
      staffAdjustments: { type: String }
    },
    isActive: { type: Boolean, default: true }
  }],
  specialServices: {
    airportTransfer: {
      available: { type: Boolean, default: false },
      fee: { type: Number, min: 0 },
      advanceBookingRequired: { type: Boolean, default: true }
    },
    laundryService: {
      available: { type: Boolean, default: false },
      fee: { type: Number, min: 0 },
      turnaroundTime: { type: String }
    },
    roomService: {
      available: { type: Boolean, default: false },
      hours: { type: String },
      menu: { type: String }
    },
    conciergeService: {
      available: { type: Boolean, default: false },
      services: [{ type: String }]
    },
    tourBooking: {
      available: { type: Boolean, default: false },
      partnerAgencies: [{ type: String }]
    }
  },
  sustainabilityMeasures: {
    energyEfficiency: {
      solarPower: { type: Boolean, default: false },
      ledLighting: { type: Boolean, default: false },
      energyStarAppliances: { type: Boolean, default: false },
      smartThermostats: { type: Boolean, default: false }
    },
    waterConservation: {
      rainwaterHarvesting: { type: Boolean, default: false },
      lowFlowFixtures: { type: Boolean, default: false },
      greyWaterRecycling: { type: Boolean, default: false }
    },
    wasteManagement: {
      recyclingProgram: { type: Boolean, default: false },
      composting: { type: Boolean, default: false },
      plasticReduction: { type: Boolean, default: false }
    },
    certification: {
      greenCertification: { type: String },
      certifyingBody: { type: String },
      validUntil: { type: Date }
    }
  },
  lastUpdated: { 
    type: Date, 
    default: Date.now 
  },
  updatedBy: { 
    type: Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
PropertyManagementSchema.index({ propertyId: 1 });
PropertyManagementSchema.index({ operationalStatus: 1 });
PropertyManagementSchema.index({ managementType: 1 });
PropertyManagementSchema.index({ 'performanceMetrics.averageOccupancyRate': 1 });
PropertyManagementSchema.index({ 'certifications.expiryDate': 1 });

// Virtual for property details
PropertyManagementSchema.virtual('property', {
  ref: 'Property',
  localField: 'propertyId',
  foreignField: '_id',
  justOne: true
});

// Method to check if any certifications are expiring soon (within 30 days)
PropertyManagementSchema.methods.getExpiringCertifications = function(days: number = 30) {
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + days);
  
  return this.certifications.filter((cert: any) => 
    cert.isActive && cert.expiryDate <= futureDate && cert.expiryDate >= new Date()
  );
};

// Method to calculate overall property score
PropertyManagementSchema.methods.calculateOverallScore = function() {
  const metrics = this.performanceMetrics;
  const weights = {
    occupancy: 0.25,
    satisfaction: 0.30,
    cleanliness: 0.25,
    maintenance: 0.20
  };
  
  return (
    (metrics.averageOccupancyRate * weights.occupancy) +
    (metrics.guestSatisfactionScore * 10 * weights.satisfaction) +
    (metrics.cleanlinessRating * 10 * weights.cleanliness) +
    (metrics.maintenanceScore * 10 * weights.maintenance)
  );
};

export default mongoose.models.PropertyManagement || mongoose.model<IPropertyManagement>('PropertyManagement', PropertyManagementSchema);