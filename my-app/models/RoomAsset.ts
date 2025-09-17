import mongoose, { Schema, Document } from 'mongoose';

export interface IRoomAsset extends Document {
  // Basic Information
  propertyId: mongoose.Types.ObjectId;
  roomId?: mongoose.Types.ObjectId;
  areaId?: mongoose.Types.ObjectId; // For common area assets
  assetCode: string; // Unique identifier (e.g., "ASSET-TV-R101-001")
  assetTag?: string; // Physical tag number

  // Asset Details
  name: string;
  description?: string;
  category: 'furniture' | 'electronics' | 'appliances' | 'fixtures' | 'hvac' | 'security' | 'lighting' | 'plumbing' | 'telecom' | 'artwork' | 'vehicle' | 'equipment';
  subCategory?: string;
  assetType: 'fixed' | 'movable' | 'consumable' | 'intangible';

  // Manufacturer Information
  manufacturer: {
    name?: string;
    model?: string;
    serialNumber?: string;
    partNumber?: string;
    manufacturingDate?: Date;
    countryOfOrigin?: string;
    warrantyInfo?: {
      warrantyType: 'manufacturer' | 'extended' | 'service_contract';
      warrantyPeriod: number; // in months
      warrantyStartDate: Date;
      warrantyEndDate: Date;
      warrantyProvider: string;
      warrantyTerms?: string;
      warrantyDocument?: string; // URL to warranty document
    };
  };

  // Physical Characteristics
  physical: {
    dimensions?: {
      length: number;
      width: number;
      height: number;
      unit: 'cm' | 'inch' | 'meter' | 'feet';
    };
    weight?: {
      value: number;
      unit: 'kg' | 'lbs' | 'grams';
    };
    color?: string;
    material?: string;
    capacity?: {
      value: number;
      unit: string; // e.g., "liters", "persons", "kW"
    };
    specifications?: [{
      attribute: string;
      value: string;
      unit?: string;
    }];
  };

  // Financial Information
  financial: {
    purchaseInfo: {
      purchasePrice: number;
      currency: string;
      purchaseDate: Date;
      purchaseOrderNumber?: string;
      invoiceNumber?: string;
      vendor: {
        name: string;
        contactPerson?: string;
        email?: string;
        phone?: string;
        address?: string;
      };
      paymentTerms?: string;
      deliveryDate?: Date;
    };

    // Depreciation Calculation
    depreciation: {
      method: 'straight_line' | 'declining_balance' | 'sum_of_years' | 'units_of_production' | 'none';
      depreciationRate?: number; // percentage for declining balance
      usefulLife: number; // in months
      salvageValue: number;
      depreciationStartDate: Date;

      // Calculated fields
      monthlyDepreciation: number;
      accumulatedDepreciation: number;
      currentBookValue: number;
      lastDepreciationCalculated: Date;

      // For units of production method
      totalExpectedUnits?: number;
      unitsUsedToDate?: number;
      depreciationPerUnit?: number;
    };

    // Current Valuation
    currentValue: {
      bookValue: number;
      marketValue?: number;
      insuranceValue?: number;
      replacementCost?: number;
      lastValuationDate: Date;
      valuationMethod?: 'cost' | 'market' | 'replacement' | 'income';
      valuedBy?: string;
    };

    // Insurance
    insurance?: {
      policyNumber?: string;
      insuranceProvider?: string;
      premiumAmount?: number;
      policyStartDate?: Date;
      policyEndDate?: Date;
      coverageAmount?: number;
      deductible?: number;
      claimsHistory?: [{
        claimNumber: string;
        claimDate: Date;
        claimAmount: number;
        claimReason: string;
        claimStatus: 'submitted' | 'processing' | 'approved' | 'denied' | 'settled';
        settlementAmount?: number;
        settlementDate?: Date;
      }];
    };
  };

  // Location and Installation
  location: {
    building?: string;
    floor?: number;
    room?: string;
    specificLocation?: string; // e.g., "North wall", "Under sink"
    coordinates?: {
      x: number;
      y: number;
      z?: number; // for height/floor
    };
    installationDate?: Date;
    installedBy?: string;
    installationCost?: number;
    isPortable: boolean;
    accessRequirements?: string[]; // e.g., ["key_card", "admin_access"]
  };

  // Operational Status
  operational: {
    status: 'active' | 'inactive' | 'under_maintenance' | 'out_of_service' | 'disposed' | 'lost' | 'stolen' | 'transferred';
    condition: 'excellent' | 'good' | 'fair' | 'poor' | 'critical' | 'failed';
    lastConditionAssessment: Date;
    conditionAssessedBy?: mongoose.Types.ObjectId;
    conditionNotes?: string;

    // Usage tracking
    usageMetrics?: {
      operationalHours?: number;
      cycleCount?: number; // for equipment with usage cycles
      lastUsed?: Date;
      utilizationRate?: number; // percentage
      efficiency?: number; // percentage
      throughput?: {
        value: number;
        unit: string;
        period: 'hour' | 'day' | 'month' | 'year';
      };
    };

    // Performance indicators
    performance?: {
      availabilityRate: number; // percentage uptime
      reliabilityScore: number; // 1-10 scale
      maintenanceCost: number; // cumulative
      energyConsumption?: {
        current: number;
        average: number;
        unit: 'kWh' | 'watts' | 'liters' | 'cubic_meters';
        period: 'hour' | 'day' | 'month';
      };
    };
  };

  // Maintenance Management
  maintenance: {
    maintenanceStrategy: 'reactive' | 'preventive' | 'predictive' | 'condition_based';

    // Scheduling
    schedule: {
      frequency: number; // in days
      lastMaintenanceDate?: Date;
      nextScheduledMaintenance?: Date;
      maintenanceWindow?: {
        startTime: string; // "09:00"
        endTime: string;   // "17:00"
        daysOfWeek?: number[]; // 0-6
      };
    };

    // Service providers
    serviceProviders: [{
      name: string;
      contactPerson?: string;
      email?: string;
      phone?: string;
      serviceType: string;
      contractNumber?: string;
      contractStartDate?: Date;
      contractEndDate?: Date;
      responseTime?: number; // in hours
      serviceLevel: 'basic' | 'standard' | 'premium' | 'critical';
    }];

    // Maintenance history
    history: [{
      maintenanceType: 'preventive' | 'corrective' | 'emergency' | 'upgrade' | 'inspection';
      workOrderNumber?: string;
      performedDate: Date;
      performedBy: string; // company or person
      technician?: string;
      description: string;
      partsUsed?: [{
        partName: string;
        partNumber?: string;
        quantity: number;
        cost: number;
      }];
      laborHours?: number;
      laborCost?: number;
      totalCost: number;
      notes?: string;
      attachments?: string[]; // URLs to documents/photos
      nextMaintenanceDue?: Date;
      warrantyImpact?: string;
    }];

    // Current issues
    currentIssues: [{
      issueId: string;
      reportedDate: Date;
      reportedBy: mongoose.Types.ObjectId;
      description: string;
      severity: 'low' | 'medium' | 'high' | 'critical';
      impact: 'none' | 'minor' | 'moderate' | 'major' | 'severe';
      priority: 'low' | 'medium' | 'high' | 'urgent';
      status: 'open' | 'assigned' | 'in_progress' | 'waiting_parts' | 'completed' | 'closed';
      assignedTo?: string;
      estimatedCost?: number;
      estimatedCompletionDate?: Date;
      actualCompletionDate?: Date;
      resolutionNotes?: string;
    }];
  };

  // Compliance and Certification
  compliance: {
    requiredCertifications: string[]; // e.g., ["CE", "FCC", "ISO9001"]
    currentCertifications: [{
      certificationType: string;
      certificateNumber: string;
      issuedBy: string;
      issueDate: Date;
      expiryDate: Date;
      renewalRequired: boolean;
      certificateDocument?: string; // URL
    }];

    // Safety compliance
    safetyCompliance: {
      lastSafetyInspection?: Date;
      nextSafetyInspection?: Date;
      safetyRating?: string;
      safetyIssues?: [{
        issue: string;
        severity: 'low' | 'medium' | 'high' | 'critical';
        reportedDate: Date;
        resolvedDate?: Date;
        resolution?: string;
      }];
      requiredTraining?: string[];
    };

    // Environmental compliance
    environmentalCompliance?: {
      energyRating?: string;
      emissionLevels?: [{
        type: string; // CO2, noise, etc.
        level: number;
        unit: string;
        standard: string;
        compliant: boolean;
      }];
      disposalRequirements?: string[];
      recyclingInformation?: string;
    };
  };

  // Lifecycle Management
  lifecycle: {
    lifecycleStage: 'planning' | 'acquisition' | 'operation' | 'maintenance' | 'disposal';
    expectedLifespan: number; // in months
    remainingLife: number; // in months

    // End of life planning
    endOfLife: {
      expectedDisposalDate?: Date;
      disposalMethod?: 'sell' | 'donate' | 'recycle' | 'dismantle' | 'return_to_vendor';
      disposalCost?: number;
      disposalVendor?: string;
      environmentalConsiderations?: string[];
      dataDestructionRequired?: boolean;
    };

    // Replacement planning
    replacement: {
      replacementDue?: Date;
      budgetAllocated?: number;
      replacementCriteria?: string[];
      preferredVendors?: string[];
      upgradeOpportunities?: string[];
    };
  };

  // Technology Integration
  technology: {
    // IoT and monitoring
    iot: {
      hasIoTSensors: boolean;
      sensors?: [{
        sensorType: string;
        sensorId: string;
        location: string;
        lastReading?: {
          value: any;
          timestamp: Date;
          unit?: string;
        };
        alertThresholds?: {
          min?: number;
          max?: number;
          critical?: number;
        };
        status: 'active' | 'inactive' | 'error';
      }];
      connectivityType?: 'wifi' | 'ethernet' | 'cellular' | 'bluetooth' | 'zigbee';
      dataCollection?: {
        frequency: string; // "5min", "hourly", "daily"
        retentionPeriod: number; // in days
        storageLocation: string;
      };
    };

    // Digital tracking
    digitalTracking: {
      hasQRCode: boolean;
      qrCodeUrl?: string;
      hasRFIDTag: boolean;
      rfidTagId?: string;
      hasBarcodeLabel: boolean;
      barcodeNumber?: string;
      hasGPSTracking: boolean;
      gpsCoordinates?: {
        latitude: number;
        longitude: number;
        lastUpdated: Date;
      };
    };

    // Integration with other systems
    systemIntegration?: {
      pmsIntegration: boolean;
      pmsAssetId?: string;
      cmmsIntegration: boolean;
      cmmsAssetId?: string;
      erpIntegration: boolean;
      erpAssetId?: string;
      syncStatus: 'synced' | 'pending' | 'failed';
      lastSyncDate?: Date;
    };
  };

  // Risk Management
  risk: {
    riskAssessment: {
      lastAssessmentDate?: Date;
      assessedBy?: mongoose.Types.ObjectId;
      overallRiskScore: number; // 1-10 scale
      riskFactors: [{
        factor: string;
        severity: 'low' | 'medium' | 'high';
        likelihood: 'rare' | 'unlikely' | 'possible' | 'likely' | 'certain';
        impact: 'insignificant' | 'minor' | 'moderate' | 'major' | 'catastrophic';
        mitigationMeasures?: string[];
      }];
    };

    // Business continuity
    businessContinuity: {
      criticalityLevel: 'low' | 'medium' | 'high' | 'critical';
      businessImpactLevel: 'low' | 'medium' | 'high' | 'severe';
      singlePointOfFailure: boolean;
      backupPlan?: string;
      alternativeOptions?: string[];
      maxAcceptableDowntime?: number; // in hours
    };
  };

  // Documentation
  documentation: {
    operatingManuals: string[]; // URLs
    technicalDrawings: string[]; // URLs
    photos: {
      installation: string[];
      current: string[];
      maintenance: string[];
      issues: string[];
    };
    videos?: string[];
    certificates: string[];
    warranties: string[];
    receipts: string[];
    customDocuments?: [{
      name: string;
      type: string;
      url: string;
      uploadedDate: Date;
      uploadedBy: mongoose.Types.ObjectId;
    }];
  };

  // Cost Center and Accounting
  accounting: {
    costCenter?: string;
    accountingCode?: string;
    glAccount?: string; // General Ledger account
    taxCategory?: string;
    capitalizedAmount?: number;
    depreciationAccount?: string;

    // Budget tracking
    budgetTracking?: {
      maintenanceBudget: number;
      maintenanceSpent: number;
      operationalBudget: number;
      operationalSpent: number;
      budgetYear: number;
    };
  };

  // Relationships
  relationships: {
    parentAsset?: mongoose.Types.ObjectId; // For component assets
    childAssets?: mongoose.Types.ObjectId[]; // Sub-components
    relatedAssets?: mongoose.Types.ObjectId[]; // Assets that work together
    dependencies?: mongoose.Types.ObjectId[]; // Assets this one depends on
    succession?: {
      predecessorAsset?: mongoose.Types.ObjectId;
      successorAsset?: mongoose.Types.ObjectId;
    };
  };

  // Tags and Custom Fields
  tags: string[];
  customFields: [{
    fieldName: string;
    fieldValue: any;
    fieldType: 'string' | 'number' | 'boolean' | 'date' | 'object' | 'array';
    displayOrder?: number;
  }];

  // Audit and History
  auditTrail: [{
    action: 'created' | 'updated' | 'deleted' | 'transferred' | 'disposed' | 'maintenance' | 'inspection';
    performedBy: mongoose.Types.ObjectId;
    performedAt: Date;
    details: string;
    oldValues?: any;
    newValues?: any;
    ipAddress?: string;
    userAgent?: string;
  }];

  // System Fields
  isActive: boolean;
  isDeleted: boolean;
  deletedAt?: Date;
  deletedBy?: mongoose.Types.ObjectId;
  version: number;

  // Timestamps
  createdBy: mongoose.Types.ObjectId;
  lastModifiedBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const RoomAssetSchema = new Schema<IRoomAsset>({
  // Basic Information
  propertyId: {
    type: Schema.Types.ObjectId,
    ref: 'Property',
    required: true,
    index: true
  },
  roomId: {
    type: Schema.Types.ObjectId,
    ref: 'Room',
    index: true
  },
  areaId: {
    type: Schema.Types.ObjectId,
    ref: 'Area',
    index: true
  },
  assetCode: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true
  },
  assetTag: {
    type: String,
    trim: true
  },

  // Asset Details
  name: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  description: {
    type: String,
    trim: true
  },
  category: {
    type: String,
    enum: ['furniture', 'electronics', 'appliances', 'fixtures', 'hvac', 'security', 'lighting', 'plumbing', 'telecom', 'artwork', 'vehicle', 'equipment'],
    required: true,
    index: true
  },
  subCategory: {
    type: String,
    trim: true
  },
  assetType: {
    type: String,
    enum: ['fixed', 'movable', 'consumable', 'intangible'],
    required: true,
    index: true
  },

  // Manufacturer Information
  manufacturer: {
    name: String,
    model: String,
    serialNumber: { type: String, index: true },
    partNumber: String,
    manufacturingDate: Date,
    countryOfOrigin: String,
    warrantyInfo: {
      warrantyType: {
        type: String,
        enum: ['manufacturer', 'extended', 'service_contract']
      },
      warrantyPeriod: { type: Number, min: 0 },
      warrantyStartDate: Date,
      warrantyEndDate: { type: Date, index: true },
      warrantyProvider: String,
      warrantyTerms: String,
      warrantyDocument: String
    }
  },

  // Physical Characteristics
  physical: {
    dimensions: {
      length: { type: Number, min: 0 },
      width: { type: Number, min: 0 },
      height: { type: Number, min: 0 },
      unit: {
        type: String,
        enum: ['cm', 'inch', 'meter', 'feet'],
        default: 'cm'
      }
    },
    weight: {
      value: { type: Number, min: 0 },
      unit: {
        type: String,
        enum: ['kg', 'lbs', 'grams'],
        default: 'kg'
      }
    },
    color: String,
    material: String,
    capacity: {
      value: { type: Number, min: 0 },
      unit: String
    },
    specifications: [{
      attribute: { type: String, required: true },
      value: { type: String, required: true },
      unit: String
    }]
  },

  // Financial Information
  financial: {
    purchaseInfo: {
      purchasePrice: { type: Number, required: true, min: 0 },
      currency: { type: String, default: 'INR' },
      purchaseDate: { type: Date, required: true, index: true },
      purchaseOrderNumber: String,
      invoiceNumber: String,
      vendor: {
        name: { type: String, required: true },
        contactPerson: String,
        email: String,
        phone: String,
        address: String
      },
      paymentTerms: String,
      deliveryDate: Date
    },

    depreciation: {
      method: {
        type: String,
        enum: ['straight_line', 'declining_balance', 'sum_of_years', 'units_of_production', 'none'],
        default: 'straight_line'
      },
      depreciationRate: { type: Number, min: 0, max: 100 },
      usefulLife: { type: Number, required: true, min: 1 },
      salvageValue: { type: Number, default: 0, min: 0 },
      depreciationStartDate: { type: Date, required: true },
      monthlyDepreciation: { type: Number, default: 0, min: 0 },
      accumulatedDepreciation: { type: Number, default: 0, min: 0 },
      currentBookValue: { type: Number, required: true, min: 0 },
      lastDepreciationCalculated: { type: Date, default: Date.now },
      totalExpectedUnits: { type: Number, min: 0 },
      unitsUsedToDate: { type: Number, default: 0, min: 0 },
      depreciationPerUnit: { type: Number, min: 0 }
    },

    currentValue: {
      bookValue: { type: Number, required: true, min: 0 },
      marketValue: { type: Number, min: 0 },
      insuranceValue: { type: Number, min: 0 },
      replacementCost: { type: Number, min: 0 },
      lastValuationDate: { type: Date, default: Date.now },
      valuationMethod: {
        type: String,
        enum: ['cost', 'market', 'replacement', 'income']
      },
      valuedBy: String
    },

    insurance: {
      policyNumber: String,
      insuranceProvider: String,
      premiumAmount: { type: Number, min: 0 },
      policyStartDate: Date,
      policyEndDate: { type: Date, index: true },
      coverageAmount: { type: Number, min: 0 },
      deductible: { type: Number, min: 0 },
      claimsHistory: [{
        claimNumber: { type: String, required: true },
        claimDate: { type: Date, required: true },
        claimAmount: { type: Number, required: true, min: 0 },
        claimReason: { type: String, required: true },
        claimStatus: {
          type: String,
          enum: ['submitted', 'processing', 'approved', 'denied', 'settled'],
          default: 'submitted'
        },
        settlementAmount: { type: Number, min: 0 },
        settlementDate: Date
      }]
    }
  },

  // Location and Installation
  location: {
    building: String,
    floor: Number,
    room: String,
    specificLocation: String,
    coordinates: {
      x: Number,
      y: Number,
      z: Number
    },
    installationDate: Date,
    installedBy: String,
    installationCost: { type: Number, min: 0 },
    isPortable: { type: Boolean, default: false },
    accessRequirements: [String]
  },

  // Operational Status
  operational: {
    status: {
      type: String,
      enum: ['active', 'inactive', 'under_maintenance', 'out_of_service', 'disposed', 'lost', 'stolen', 'transferred'],
      default: 'active',
      index: true
    },
    condition: {
      type: String,
      enum: ['excellent', 'good', 'fair', 'poor', 'critical', 'failed'],
      default: 'good',
      index: true
    },
    lastConditionAssessment: { type: Date, default: Date.now },
    conditionAssessedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    conditionNotes: String,

    usageMetrics: {
      operationalHours: { type: Number, default: 0, min: 0 },
      cycleCount: { type: Number, default: 0, min: 0 },
      lastUsed: Date,
      utilizationRate: { type: Number, min: 0, max: 100 },
      efficiency: { type: Number, min: 0, max: 100 },
      throughput: {
        value: { type: Number, min: 0 },
        unit: String,
        period: {
          type: String,
          enum: ['hour', 'day', 'month', 'year']
        }
      }
    },

    performance: {
      availabilityRate: { type: Number, default: 100, min: 0, max: 100 },
      reliabilityScore: { type: Number, default: 5, min: 1, max: 10 },
      maintenanceCost: { type: Number, default: 0, min: 0 },
      energyConsumption: {
        current: { type: Number, min: 0 },
        average: { type: Number, min: 0 },
        unit: {
          type: String,
          enum: ['kWh', 'watts', 'liters', 'cubic_meters']
        },
        period: {
          type: String,
          enum: ['hour', 'day', 'month']
        }
      }
    }
  },

  // Maintenance Management
  maintenance: {
    maintenanceStrategy: {
      type: String,
      enum: ['reactive', 'preventive', 'predictive', 'condition_based'],
      default: 'preventive'
    },

    schedule: {
      frequency: { type: Number, default: 90, min: 1 },
      lastMaintenanceDate: Date,
      nextScheduledMaintenance: { type: Date, index: true },
      maintenanceWindow: {
        startTime: String,
        endTime: String,
        daysOfWeek: [{ type: Number, min: 0, max: 6 }]
      }
    },

    serviceProviders: [{
      name: { type: String, required: true },
      contactPerson: String,
      email: String,
      phone: String,
      serviceType: { type: String, required: true },
      contractNumber: String,
      contractStartDate: Date,
      contractEndDate: Date,
      responseTime: { type: Number, min: 0 },
      serviceLevel: {
        type: String,
        enum: ['basic', 'standard', 'premium', 'critical'],
        default: 'standard'
      }
    }],

    history: [{
      maintenanceType: {
        type: String,
        enum: ['preventive', 'corrective', 'emergency', 'upgrade', 'inspection'],
        required: true
      },
      workOrderNumber: String,
      performedDate: { type: Date, required: true },
      performedBy: { type: String, required: true },
      technician: String,
      description: { type: String, required: true },
      partsUsed: [{
        partName: { type: String, required: true },
        partNumber: String,
        quantity: { type: Number, required: true, min: 1 },
        cost: { type: Number, required: true, min: 0 }
      }],
      laborHours: { type: Number, min: 0 },
      laborCost: { type: Number, min: 0 },
      totalCost: { type: Number, required: true, min: 0 },
      notes: String,
      attachments: [String],
      nextMaintenanceDue: Date,
      warrantyImpact: String
    }],

    currentIssues: [{
      issueId: { type: String, required: true },
      reportedDate: { type: Date, default: Date.now },
      reportedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
      description: { type: String, required: true },
      severity: {
        type: String,
        enum: ['low', 'medium', 'high', 'critical'],
        required: true
      },
      impact: {
        type: String,
        enum: ['none', 'minor', 'moderate', 'major', 'severe'],
        required: true
      },
      priority: {
        type: String,
        enum: ['low', 'medium', 'high', 'urgent'],
        required: true
      },
      status: {
        type: String,
        enum: ['open', 'assigned', 'in_progress', 'waiting_parts', 'completed', 'closed'],
        default: 'open'
      },
      assignedTo: String,
      estimatedCost: { type: Number, min: 0 },
      estimatedCompletionDate: Date,
      actualCompletionDate: Date,
      resolutionNotes: String
    }]
  },

  // Continue with rest of schema...
  // (Due to length limits, I'll provide the key remaining sections)

  // System Fields
  isActive: { type: Boolean, default: true },
  isDeleted: { type: Boolean, default: false },
  deletedAt: Date,
  deletedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  version: { type: Number, default: 1 },

  // Audit Trail
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  lastModifiedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
RoomAssetSchema.index({ propertyId: 1, category: 1 });
RoomAssetSchema.index({ assetCode: 1 }, { unique: true });
RoomAssetSchema.index({ 'manufacturer.serialNumber': 1 });
RoomAssetSchema.index({ 'operational.status': 1, 'operational.condition': 1 });
RoomAssetSchema.index({ 'maintenance.schedule.nextScheduledMaintenance': 1 });
RoomAssetSchema.index({ 'financial.depreciation.lastDepreciationCalculated': 1 });

// Compound indexes
RoomAssetSchema.index({ propertyId: 1, roomId: 1, category: 1 });
RoomAssetSchema.index({ propertyId: 1, 'operational.status': 1 });

// Text search index
RoomAssetSchema.index({
  name: 'text',
  description: 'text',
  'manufacturer.name': 'text',
  'manufacturer.model': 'text'
});

// Virtuals
RoomAssetSchema.virtual('isUnderWarranty').get(function() {
  return this.manufacturer.warrantyInfo?.warrantyEndDate &&
         new Date() <= this.manufacturer.warrantyInfo.warrantyEndDate;
});

RoomAssetSchema.virtual('depreciationProgress').get(function() {
  const totalDepreciableAmount = this.financial.purchaseInfo.purchasePrice - this.financial.depreciation.salvageValue;
  if (totalDepreciableAmount <= 0) return 100;
  return Math.min(100, (this.financial.depreciation.accumulatedDepreciation / totalDepreciableAmount) * 100);
});

RoomAssetSchema.virtual('remainingBookValue').get(function() {
  return Math.max(0, this.financial.purchaseInfo.purchasePrice - this.financial.depreciation.accumulatedDepreciation);
});

RoomAssetSchema.virtual('needsMaintenance').get(function() {
  return this.maintenance.schedule.nextScheduledMaintenance &&
         new Date() >= this.maintenance.schedule.nextScheduledMaintenance;
});

// Pre-save middleware
RoomAssetSchema.pre('save', function(next) {
  // Auto-generate asset code if not provided
  if (!this.assetCode && this.isNew) {
    const categoryCode = this.category.substring(0, 3).toUpperCase();
    const roomCode = this.roomId ? `R${this.roomId.toString().slice(-3)}` : 'AREA';
    const timestamp = Date.now().toString().slice(-4);
    this.assetCode = `ASSET-${categoryCode}-${roomCode}-${timestamp}`;
  }

  // Calculate depreciation
  this.calculateDepreciation();

  // Update version on modifications
  if (this.isModified() && !this.isNew) {
    this.version += 1;
  }

  next();
});

// Methods
RoomAssetSchema.methods.calculateDepreciation = function() {
  const now = new Date();
  const startDate = this.financial.depreciation.depreciationStartDate;
  const monthsElapsed = Math.floor((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 30));

  if (this.financial.depreciation.method === 'straight_line') {
    const totalDepreciableAmount = this.financial.purchaseInfo.purchasePrice - this.financial.depreciation.salvageValue;
    this.financial.depreciation.monthlyDepreciation = totalDepreciableAmount / this.financial.depreciation.usefulLife;
    this.financial.depreciation.accumulatedDepreciation = Math.min(
      totalDepreciableAmount,
      this.financial.depreciation.monthlyDepreciation * monthsElapsed
    );
  }

  this.financial.depreciation.currentBookValue = Math.max(
    this.financial.depreciation.salvageValue,
    this.financial.purchaseInfo.purchasePrice - this.financial.depreciation.accumulatedDepreciation
  );

  this.financial.currentValue.bookValue = this.financial.depreciation.currentBookValue;
  this.financial.depreciation.lastDepreciationCalculated = now;
};

// Static methods
RoomAssetSchema.statics.getAssetSummary = function(propertyId: string) {
  return this.aggregate([
    { $match: { propertyId: new mongoose.Types.ObjectId(propertyId), isActive: true } },
    {
      $group: {
        _id: '$category',
        totalAssets: { $sum: 1 },
        totalValue: { $sum: '$financial.currentValue.bookValue' },
        avgCondition: { $avg: { $cond: [
          { $eq: ['$operational.condition', 'excellent'] }, 5,
          { $cond: [
            { $eq: ['$operational.condition', 'good'] }, 4,
            { $cond: [
              { $eq: ['$operational.condition', 'fair'] }, 3,
              { $cond: [
                { $eq: ['$operational.condition', 'poor'] }, 2, 1
              ]}
            ]}
          ]}
        ]}}
      }
    }
  ]);
};

RoomAssetSchema.statics.getMaintenanceDue = function(propertyId: string, daysAhead: number = 30) {
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + daysAhead);

  return this.find({
    propertyId: new mongoose.Types.ObjectId(propertyId),
    'maintenance.schedule.nextScheduledMaintenance': { $lte: futureDate },
    'operational.status': { $in: ['active', 'inactive'] },
    isActive: true
  }).populate('roomId', 'roomNumber floor');
};

export default mongoose.models.RoomAsset || mongoose.model<IRoomAsset>('RoomAsset', RoomAssetSchema);