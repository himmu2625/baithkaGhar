import mongoose, { Schema, Document } from 'mongoose';

export interface IMaintenanceRequest extends Document {
  // Basic Information
  propertyId: mongoose.Types.ObjectId;
  requestNumber: string; // Unique identifier (e.g., "MNT-2024-0001")

  // Request Details
  title: string;
  description: string;
  requestType: 'corrective' | 'preventive' | 'emergency' | 'inspection' | 'upgrade' | 'installation' | 'removal' | 'calibration';
  category: 'electrical' | 'plumbing' | 'hvac' | 'mechanical' | 'structural' | 'safety' | 'security' | 'it_telecom' | 'furniture' | 'appliances' | 'landscaping' | 'other';
  subCategory?: string;

  // Priority and Impact
  priority: 'low' | 'medium' | 'high' | 'urgent' | 'emergency';
  severity: 'minor' | 'moderate' | 'major' | 'critical' | 'catastrophic';
  impact: {
    businessImpact: 'none' | 'low' | 'medium' | 'high' | 'severe';
    safetyImpact: 'none' | 'low' | 'medium' | 'high' | 'critical';
    guestImpact: 'none' | 'low' | 'medium' | 'high' | 'severe';
    operationalImpact: 'none' | 'low' | 'medium' | 'high' | 'severe';
    financialImpact?: {
      estimatedLoss: number;
      currency: string;
      period: 'hour' | 'day' | 'week' | 'month';
    };
  };

  // Location Information
  location: {
    roomId?: mongoose.Types.ObjectId;
    areaId?: mongoose.Types.ObjectId;
    assetId?: mongoose.Types.ObjectId;
    building?: string;
    floor?: number;
    specificLocation: string; // Detailed location description
    coordinates?: {
      x: number;
      y: number;
      z?: number;
    };
    accessInstructions?: string;
    keyRequired?: boolean;
    specialAccessNeeded?: string[];
  };

  // Request Lifecycle
  lifecycle: {
    status: 'draft' | 'submitted' | 'acknowledged' | 'assigned' | 'in_progress' | 'waiting_parts' | 'waiting_approval' | 'on_hold' | 'completed' | 'verified' | 'closed' | 'cancelled' | 'rejected';
    statusHistory: [{
      status: string;
      changedBy: mongoose.Types.ObjectId;
      changedAt: Date;
      reason?: string;
      notes?: string;
      automaticChange?: boolean;
    }];

    // Key timestamps
    submittedAt?: Date;
    acknowledgedAt?: Date;
    assignedAt?: Date;
    workStartedAt?: Date;
    workCompletedAt?: Date;
    verifiedAt?: Date;
    closedAt?: Date;
  };

  // Reporting
  reporting: {
    reportedBy: mongoose.Types.ObjectId;
    reportedAt: Date;
    reportingSource: 'guest' | 'staff' | 'inspection' | 'preventive' | 'system' | 'contractor' | 'audit';
    discoveryMethod: 'visual_inspection' | 'guest_complaint' | 'routine_check' | 'malfunction' | 'scheduled_maintenance' | 'accident' | 'monitoring_system' | 'other';
    contactInfo?: {
      name?: string;
      phone?: string;
      email?: string;
      room?: string;
    };
    witnesses?: [{
      name: string;
      role: string;
      contact?: string;
      statement?: string;
    }];
  };

  // Assignment and Resources
  assignment: {
    assignedTo?: mongoose.Types.ObjectId; // Primary technician/team lead
    assignedBy?: mongoose.Types.ObjectId;
    department?: string;
    team?: string;
    additionalTechnicians?: mongoose.Types.ObjectId[];

    // Skills and requirements
    skillsRequired?: string[];
    certificationsRequired?: string[];
    experienceLevel?: 'junior' | 'intermediate' | 'senior' | 'expert';

    // External resources
    contractorRequired?: boolean;
    contractorAssigned?: {
      companyName: string;
      contactPerson: string;
      phone: string;
      email: string;
      contractNumber?: string;
      specialtyArea: string;
    };

    // Vendor support
    vendorSupport?: {
      vendorName: string;
      contactInfo: string;
      supportLevel: 'phone' | 'remote' | 'onsite';
      responseTime?: number; // in hours
      warrantyWork?: boolean;
    };
  };

  // Scheduling
  scheduling: {
    requestedCompletionDate?: Date;
    scheduledStartDate?: Date;
    scheduledEndDate?: Date;
    estimatedDuration?: number; // in hours
    actualDuration?: number; // in hours

    // Constraints
    workWindowStart?: string; // "09:00"
    workWindowEnd?: string;   // "17:00"
    availableDays?: number[]; // 0-6 (Sunday-Saturday)
    guestPresenceRequired?: boolean;
    guestAbsenceRequired?: boolean;
    roomEvacuationRequired?: boolean;

    // Dependencies
    prerequisiteWork?: string[];
    blockedBy?: mongoose.Types.ObjectId[]; // Other maintenance requests
    dependentRequests?: mongoose.Types.ObjectId[]; // Requests that depend on this one
  };

  // Work Details
  workDetails: {
    workPerformed?: string;
    methodology?: string;
    toolsUsed?: string[];
    proceduresFollowed?: string[];

    // Parts and materials
    partsUsed?: [{
      partName: string;
      partNumber?: string;
      manufacturer?: string;
      quantity: number;
      unitCost?: number;
      totalCost?: number;
      warrantyPeriod?: number; // in months
      supplier?: string;
      orderDate?: Date;
      deliveryDate?: Date;
    }];

    // Consumables
    consumablesUsed?: [{
      item: string;
      quantity: number;
      unit: string;
      cost?: number;
    }];

    // Equipment used
    equipmentUsed?: [{
      equipmentName: string;
      equipmentId?: string;
      usageTime?: number; // in hours
      condition?: 'good' | 'fair' | 'needs_attention';
    }];
  };

  // Cost Tracking
  costs: {
    // Labor costs
    laborCosts: [{
      technicianId?: mongoose.Types.ObjectId;
      technicianName: string;
      rate: number;
      hours: number;
      overtimeHours?: number;
      overtimeRate?: number;
      totalCost: number;
    }];

    // Material costs
    materialCosts: {
      parts: number;
      consumables: number;
      specialMaterials: number;
      shipping?: number;
      tax?: number;
      total: number;
    };

    // External costs
    externalCosts: {
      contractorFees?: number;
      consultingFees?: number;
      equipmentRental?: number;
      permits?: number;
      inspectionFees?: number;
      other?: number;
      total: number;
    };

    // Total costs
    grandTotal: number;
    currency: string;
    budgetCode?: string;
    approvalRequired?: boolean;
    approvedBy?: mongoose.Types.ObjectId;
    approvedAt?: Date;
    budgetVariance?: number; // actual vs estimated
  };

  // Quality Control
  qualityControl: {
    inspectionRequired: boolean;
    inspectionType?: 'internal' | 'external' | 'regulatory';
    inspectedBy?: mongoose.Types.ObjectId;
    inspectedAt?: Date;
    inspectionResults?: {
      passed: boolean;
      score?: number; // 1-10
      notes?: string;
      deficienciesFound?: [{
        issue: string;
        severity: 'minor' | 'major' | 'critical';
        correctionRequired: boolean;
        correctedAt?: Date;
      }];
    };

    // Testing
    testingRequired?: boolean;
    testingPerformed?: [{
      testType: string;
      testDate: Date;
      testResults: string;
      passed: boolean;
      testedBy: string;
      equipment?: string;
      conditions?: string;
    }];

    // Warranties
    workWarranty?: {
      warrantyPeriod: number; // in months
      warrantyProvider: string;
      warrantyTerms?: string;
      warrantyStartDate: Date;
      warrantyEndDate: Date;
    };
  };

  // Safety and Compliance
  safety: {
    safetyAssessmentDone: boolean;
    hazardsIdentified?: [{
      hazardType: string;
      riskLevel: 'low' | 'medium' | 'high' | 'extreme';
      mitigationMeasures: string[];
      ppeRequired?: string[];
    }];

    safetyIncidents?: [{
      incidentType: string;
      description: string;
      injuryOccurred: boolean;
      severity?: 'minor' | 'moderate' | 'serious' | 'critical';
      reportedToSupervisor: boolean;
      incidentReportNumber?: string;
      followUpRequired?: boolean;
    }];

    // Compliance requirements
    complianceChecks?: [{
      regulation: string;
      requirement: string;
      compliant: boolean;
      evidence?: string;
      checkedBy: string;
      checkedAt: Date;
    }];

    environmentalConsiderations?: {
      wasteGenerated?: string[];
      disposalMethod?: string;
      environmentalImpact?: string;
      mitigationMeasures?: string[];
    };
  };

  // Guest and Service Impact
  guestImpact: {
    guestPresent?: boolean;
    guestInformed?: boolean;
    roomEvacuated?: boolean;
    alternativeAccommodation?: {
      provided: boolean;
      roomNumber?: string;
      compensation?: string;
      guestSatisfied?: boolean;
    };

    serviceDisruption?: {
      servicesAffected: string[];
      duration?: number; // in hours
      alternativesProvided?: string[];
      compensationOffered?: string;
    };

    guestComplaints?: [{
      complaint: string;
      severity: 'minor' | 'moderate' | 'serious';
      resolution?: string;
      compensationProvided?: string;
      satisfactionLevel?: number; // 1-5
    }];
  };

  // Communication and Notifications
  communication: {
    notificationsSent: [{
      recipient: mongoose.Types.ObjectId;
      recipientType: 'staff' | 'manager' | 'guest' | 'contractor' | 'vendor';
      method: 'email' | 'sms' | 'phone' | 'in_app' | 'push';
      message: string;
      sentAt: Date;
      delivered?: boolean;
      read?: boolean;
      responded?: boolean;
    }];

    updates: [{
      updateType: 'status_change' | 'progress_update' | 'delay_notification' | 'completion_notice';
      message: string;
      postedBy: mongoose.Types.ObjectId;
      postedAt: Date;
      visibility: 'internal' | 'guest' | 'public';
      urgent?: boolean;
    }];

    escalations: [{
      escalatedTo: mongoose.Types.ObjectId;
      escalatedBy: mongoose.Types.ObjectId;
      escalatedAt: Date;
      reason: string;
      urgency: 'normal' | 'urgent' | 'critical';
      resolved?: boolean;
      resolutionTime?: number; // in hours
    }];
  };

  // Documentation and Evidence
  documentation: {
    photos: {
      before: string[];
      during: string[];
      after: string[];
      issues: string[];
      damage?: string[];
    };

    videos?: {
      diagnostic: string[];
      procedure: string[];
      training?: string[];
    };

    documents: {
      workOrders: string[];
      receipts: string[];
      warranties: string[];
      certificates: string[];
      permits?: string[];
      inspectionReports?: string[];
      testResults?: string[];
      manuals?: string[];
    };

    sketches?: string[]; // URLs to technical drawings/sketches
    measurements?: [{
      parameter: string;
      value: number;
      unit: string;
      location?: string;
      notes?: string;
    }];
  };

  // Follow-up and Future Actions
  followUp: {
    followUpRequired: boolean;
    followUpDate?: Date;
    followUpType?: 'inspection' | 'testing' | 'monitoring' | 'preventive_maintenance' | 'warranty_check';
    followUpAssignedTo?: mongoose.Types.ObjectId;
    followUpNotes?: string;
    followUpCompleted?: boolean;
    followUpCompletedAt?: Date;

    recommendations?: [{
      recommendation: string;
      recommendedBy: mongoose.Types.ObjectId;
      priority: 'low' | 'medium' | 'high';
      estimatedCost?: number;
      timeframe?: string;
      approved?: boolean;
      implementationDate?: Date;
    }];

    preventiveMeasures?: string[];
    futureMaintenanceSchedule?: Date;
  };

  // Performance Metrics
  metrics: {
    responseTime?: number; // hours from submission to acknowledgment
    resolutionTime?: number; // hours from submission to completion
    firstTimeFixRate?: boolean;
    reworkRequired?: boolean;
    customerSatisfaction?: number; // 1-5 scale

    efficiency: {
      estimatedHours?: number;
      actualHours?: number;
      variance?: number;
      reason?: string;
    };

    quality: {
      defectRate?: number;
      reworkTime?: number;
      warrantyClaimsRate?: number;
    };
  };

  // Integration and Automation
  integration: {
    sourceSystem?: string; // e.g., "PMS", "BMS", "IoT_Sensor"
    sourceReference?: string;

    relatedSystems?: [{
      systemName: string;
      referenceId: string;
      syncStatus: 'synced' | 'pending' | 'failed';
      lastSyncAt?: Date;
    }];

    automatedActions?: [{
      trigger: string;
      action: string;
      executedAt?: Date;
      result?: 'success' | 'failure';
      errorMessage?: string;
    }];

    // AI/ML insights
    aiInsights?: [{
      insight: string;
      confidence: number; // 0-1
      source: string;
      generatedAt: Date;
      actionTaken?: boolean;
    }];
  };

  // Recurring Maintenance
  recurringMaintenance?: {
    isRecurring: boolean;
    parentRequestId?: mongoose.Types.ObjectId;
    recurrencePattern?: {
      frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'custom';
      interval: number;
      endDate?: Date;
      maxOccurrences?: number;
    };
    nextOccurrence?: Date;
  };

  // Custom Fields and Tags
  customFields: [{
    fieldName: string;
    fieldValue: any;
    fieldType: 'string' | 'number' | 'boolean' | 'date' | 'select' | 'multiselect';
    displayOrder?: number;
  }];

  tags: string[];

  // System Fields
  isActive: boolean;
  isArchived: boolean;
  archivedAt?: Date;
  archivedBy?: mongoose.Types.ObjectId;
  version: number;

  // Audit Trail
  createdBy: mongoose.Types.ObjectId;
  lastModifiedBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const MaintenanceRequestSchema = new Schema<IMaintenanceRequest>({
  // Basic Information
  propertyId: {
    type: Schema.Types.ObjectId,
    ref: 'Property',
    required: true,
    index: true
  },
  requestNumber: {
    type: String,
    required: true,
    unique: true,
    uppercase: true
  },

  // Request Details
  title: {
    type: String,
    required: true,
    trim: true,
    maxLength: 200
  },
  description: {
    type: String,
    required: true,
    maxLength: 2000
  },
  requestType: {
    type: String,
    enum: ['corrective', 'preventive', 'emergency', 'inspection', 'upgrade', 'installation', 'removal', 'calibration'],
    required: true,
    index: true
  },
  category: {
    type: String,
    enum: ['electrical', 'plumbing', 'hvac', 'mechanical', 'structural', 'safety', 'security', 'it_telecom', 'furniture', 'appliances', 'landscaping', 'other'],
    required: true,
    index: true
  },
  subCategory: {
    type: String,
    trim: true
  },

  // Priority and Impact
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent', 'emergency'],
    required: true,
    default: 'medium',
    index: true
  },
  severity: {
    type: String,
    enum: ['minor', 'moderate', 'major', 'critical', 'catastrophic'],
    required: true,
    default: 'moderate'
  },
  impact: {
    businessImpact: {
      type: String,
      enum: ['none', 'low', 'medium', 'high', 'severe'],
      default: 'low'
    },
    safetyImpact: {
      type: String,
      enum: ['none', 'low', 'medium', 'high', 'critical'],
      default: 'none'
    },
    guestImpact: {
      type: String,
      enum: ['none', 'low', 'medium', 'high', 'severe'],
      default: 'low'
    },
    operationalImpact: {
      type: String,
      enum: ['none', 'low', 'medium', 'high', 'severe'],
      default: 'low'
    },
    financialImpact: {
      estimatedLoss: { type: Number, min: 0 },
      currency: { type: String, default: 'INR' },
      period: {
        type: String,
        enum: ['hour', 'day', 'week', 'month']
      }
    }
  },

  // Location Information
  location: {
    roomId: { type: Schema.Types.ObjectId, ref: 'Room' },
    areaId: { type: Schema.Types.ObjectId, ref: 'Area' },
    assetId: { type: Schema.Types.ObjectId, ref: 'RoomAsset' },
    building: String,
    floor: Number,
    specificLocation: { type: String, required: true },
    coordinates: {
      x: Number,
      y: Number,
      z: Number
    },
    accessInstructions: String,
    keyRequired: { type: Boolean, default: false },
    specialAccessNeeded: [String]
  },

  // Request Lifecycle
  lifecycle: {
    status: {
      type: String,
      enum: ['draft', 'submitted', 'acknowledged', 'assigned', 'in_progress', 'waiting_parts', 'waiting_approval', 'on_hold', 'completed', 'verified', 'closed', 'cancelled', 'rejected'],
      default: 'submitted',
      index: true
    },
    statusHistory: [{
      status: { type: String, required: true },
      changedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
      changedAt: { type: Date, default: Date.now },
      reason: String,
      notes: String,
      automaticChange: { type: Boolean, default: false }
    }],
    submittedAt: Date,
    acknowledgedAt: Date,
    assignedAt: Date,
    workStartedAt: Date,
    workCompletedAt: Date,
    verifiedAt: Date,
    closedAt: Date
  },

  // Reporting
  reporting: {
    reportedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    reportedAt: { type: Date, default: Date.now },
    reportingSource: {
      type: String,
      enum: ['guest', 'staff', 'inspection', 'preventive', 'system', 'contractor', 'audit'],
      required: true
    },
    discoveryMethod: {
      type: String,
      enum: ['visual_inspection', 'guest_complaint', 'routine_check', 'malfunction', 'scheduled_maintenance', 'accident', 'monitoring_system', 'other'],
      required: true
    },
    contactInfo: {
      name: String,
      phone: String,
      email: String,
      room: String
    },
    witnesses: [{
      name: { type: String, required: true },
      role: { type: String, required: true },
      contact: String,
      statement: String
    }]
  },

  // Assignment and Resources
  assignment: {
    assignedTo: { type: Schema.Types.ObjectId, ref: 'Staff' },
    assignedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    department: String,
    team: String,
    additionalTechnicians: [{ type: Schema.Types.ObjectId, ref: 'Staff' }],
    skillsRequired: [String],
    certificationsRequired: [String],
    experienceLevel: {
      type: String,
      enum: ['junior', 'intermediate', 'senior', 'expert']
    },
    contractorRequired: { type: Boolean, default: false },
    contractorAssigned: {
      companyName: String,
      contactPerson: String,
      phone: String,
      email: String,
      contractNumber: String,
      specialtyArea: String
    },
    vendorSupport: {
      vendorName: String,
      contactInfo: String,
      supportLevel: {
        type: String,
        enum: ['phone', 'remote', 'onsite']
      },
      responseTime: { type: Number, min: 0 },
      warrantyWork: { type: Boolean, default: false }
    }
  },

  // Scheduling
  scheduling: {
    requestedCompletionDate: Date,
    scheduledStartDate: { type: Date, index: true },
    scheduledEndDate: Date,
    estimatedDuration: { type: Number, min: 0 },
    actualDuration: { type: Number, min: 0 },
    workWindowStart: String,
    workWindowEnd: String,
    availableDays: [{ type: Number, min: 0, max: 6 }],
    guestPresenceRequired: { type: Boolean, default: false },
    guestAbsenceRequired: { type: Boolean, default: false },
    roomEvacuationRequired: { type: Boolean, default: false },
    prerequisiteWork: [String],
    blockedBy: [{ type: Schema.Types.ObjectId, ref: 'MaintenanceRequest' }],
    dependentRequests: [{ type: Schema.Types.ObjectId, ref: 'MaintenanceRequest' }]
  },

  // Work Details
  workDetails: {
    workPerformed: String,
    methodology: String,
    toolsUsed: [String],
    proceduresFollowed: [String],
    partsUsed: [{
      partName: { type: String, required: true },
      partNumber: String,
      manufacturer: String,
      quantity: { type: Number, required: true, min: 1 },
      unitCost: { type: Number, min: 0 },
      totalCost: { type: Number, min: 0 },
      warrantyPeriod: { type: Number, min: 0 },
      supplier: String,
      orderDate: Date,
      deliveryDate: Date
    }],
    consumablesUsed: [{
      item: { type: String, required: true },
      quantity: { type: Number, required: true, min: 0 },
      unit: { type: String, required: true },
      cost: { type: Number, min: 0 }
    }],
    equipmentUsed: [{
      equipmentName: { type: String, required: true },
      equipmentId: String,
      usageTime: { type: Number, min: 0 },
      condition: {
        type: String,
        enum: ['good', 'fair', 'needs_attention']
      }
    }]
  },

  // Cost Tracking
  costs: {
    laborCosts: [{
      technicianId: { type: Schema.Types.ObjectId, ref: 'Staff' },
      technicianName: { type: String, required: true },
      rate: { type: Number, required: true, min: 0 },
      hours: { type: Number, required: true, min: 0 },
      overtimeHours: { type: Number, min: 0 },
      overtimeRate: { type: Number, min: 0 },
      totalCost: { type: Number, required: true, min: 0 }
    }],
    materialCosts: {
      parts: { type: Number, default: 0, min: 0 },
      consumables: { type: Number, default: 0, min: 0 },
      specialMaterials: { type: Number, default: 0, min: 0 },
      shipping: { type: Number, default: 0, min: 0 },
      tax: { type: Number, default: 0, min: 0 },
      total: { type: Number, default: 0, min: 0 }
    },
    externalCosts: {
      contractorFees: { type: Number, default: 0, min: 0 },
      consultingFees: { type: Number, default: 0, min: 0 },
      equipmentRental: { type: Number, default: 0, min: 0 },
      permits: { type: Number, default: 0, min: 0 },
      inspectionFees: { type: Number, default: 0, min: 0 },
      other: { type: Number, default: 0, min: 0 },
      total: { type: Number, default: 0, min: 0 }
    },
    grandTotal: { type: Number, default: 0, min: 0 },
    currency: { type: String, default: 'INR' },
    budgetCode: String,
    approvalRequired: { type: Boolean, default: false },
    approvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    approvedAt: Date,
    budgetVariance: { type: Number, default: 0 }
  },

  // Quality Control
  qualityControl: {
    inspectionRequired: { type: Boolean, default: true },
    inspectionType: {
      type: String,
      enum: ['internal', 'external', 'regulatory']
    },
    inspectedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    inspectedAt: Date,
    inspectionResults: {
      passed: { type: Boolean, default: true },
      score: { type: Number, min: 1, max: 10 },
      notes: String,
      deficienciesFound: [{
        issue: { type: String, required: true },
        severity: {
          type: String,
          enum: ['minor', 'major', 'critical'],
          required: true
        },
        correctionRequired: { type: Boolean, default: false },
        correctedAt: Date
      }]
    },
    testingRequired: { type: Boolean, default: false },
    testingPerformed: [{
      testType: { type: String, required: true },
      testDate: { type: Date, required: true },
      testResults: { type: String, required: true },
      passed: { type: Boolean, required: true },
      testedBy: { type: String, required: true },
      equipment: String,
      conditions: String
    }],
    workWarranty: {
      warrantyPeriod: { type: Number, min: 0 },
      warrantyProvider: String,
      warrantyTerms: String,
      warrantyStartDate: Date,
      warrantyEndDate: Date
    }
  },

  // System Fields
  isActive: { type: Boolean, default: true },
  isArchived: { type: Boolean, default: false },
  archivedAt: Date,
  archivedBy: { type: Schema.Types.ObjectId, ref: 'User' },
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
MaintenanceRequestSchema.index({ propertyId: 1, 'lifecycle.status': 1 });
MaintenanceRequestSchema.index({ requestNumber: 1 }, { unique: true });
MaintenanceRequestSchema.index({ 'reporting.reportedAt': 1 });
MaintenanceRequestSchema.index({ 'assignment.assignedTo': 1, 'lifecycle.status': 1 });
MaintenanceRequestSchema.index({ priority: 1, severity: 1 });
MaintenanceRequestSchema.index({ 'scheduling.scheduledStartDate': 1 });

// Compound indexes
MaintenanceRequestSchema.index({ propertyId: 1, category: 1, 'lifecycle.status': 1 });
MaintenanceRequestSchema.index({ 'location.roomId': 1, 'lifecycle.status': 1 });

// Text search index
MaintenanceRequestSchema.index({
  title: 'text',
  description: 'text'
});

// Virtuals
MaintenanceRequestSchema.virtual('isOverdue').get(function() {
  if (!this.scheduling.scheduledEndDate) return false;
  return new Date() > this.scheduling.scheduledEndDate &&
         !['completed', 'verified', 'closed', 'cancelled'].includes(this.lifecycle.status);
});

MaintenanceRequestSchema.virtual('timeElapsed').get(function() {
  const start = this.lifecycle.workStartedAt || this.reporting.reportedAt;
  return Math.floor((new Date().getTime() - start.getTime()) / (1000 * 60 * 60)); // hours
});

MaintenanceRequestSchema.virtual('responseTime').get(function() {
  if (!this.lifecycle.acknowledgedAt) return null;
  return Math.floor((this.lifecycle.acknowledgedAt.getTime() - this.reporting.reportedAt.getTime()) / (1000 * 60 * 60)); // hours
});

MaintenanceRequestSchema.virtual('resolutionTime').get(function() {
  if (!this.lifecycle.workCompletedAt) return null;
  return Math.floor((this.lifecycle.workCompletedAt.getTime() - this.reporting.reportedAt.getTime()) / (1000 * 60 * 60)); // hours
});

// Pre-save middleware
MaintenanceRequestSchema.pre('save', function(next) {
  // Auto-generate request number if not provided
  if (!this.requestNumber && this.isNew) {
    const year = new Date().getFullYear();
    const timestamp = Date.now().toString().slice(-6);
    this.requestNumber = `MNT-${year}-${timestamp}`;
  }

  // Calculate total costs
  const laborTotal = this.costs.laborCosts.reduce((sum, labor) => sum + labor.totalCost, 0);
  this.costs.materialCosts.total = this.costs.materialCosts.parts +
                                   this.costs.materialCosts.consumables +
                                   this.costs.materialCosts.specialMaterials +
                                   (this.costs.materialCosts.shipping || 0) +
                                   (this.costs.materialCosts.tax || 0);

  this.costs.externalCosts.total = (this.costs.externalCosts.contractorFees || 0) +
                                   (this.costs.externalCosts.consultingFees || 0) +
                                   (this.costs.externalCosts.equipmentRental || 0) +
                                   (this.costs.externalCosts.permits || 0) +
                                   (this.costs.externalCosts.inspectionFees || 0) +
                                   (this.costs.externalCosts.other || 0);

  this.costs.grandTotal = laborTotal + this.costs.materialCosts.total + this.costs.externalCosts.total;

  // Update version on modifications
  if (this.isModified() && !this.isNew) {
    this.version += 1;
  }

  next();
});

// Static methods
MaintenanceRequestSchema.statics.getStatistics = function(propertyId: string, dateRange?: { start: Date; end: Date }) {
  const matchStage: any = { propertyId: new mongoose.Types.ObjectId(propertyId) };

  if (dateRange) {
    matchStage['reporting.reportedAt'] = {
      $gte: dateRange.start,
      $lte: dateRange.end
    };
  }

  return this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: null,
        totalRequests: { $sum: 1 },
        completedRequests: { $sum: { $cond: [{ $eq: ['$lifecycle.status', 'completed'] }, 1, 0] } },
        pendingRequests: { $sum: { $cond: [{ $nin: ['$lifecycle.status', ['completed', 'closed', 'cancelled']] }, 1, 0] } },
        emergencyRequests: { $sum: { $cond: [{ $eq: ['$priority', 'emergency'] }, 1, 0] } },
        averageResolutionTime: { $avg: '$metrics.resolutionTime' },
        totalCost: { $sum: '$costs.grandTotal' },
        categoryBreakdown: {
          $push: {
            category: '$category',
            priority: '$priority',
            status: '$lifecycle.status'
          }
        }
      }
    }
  ]);
};

MaintenanceRequestSchema.statics.getOverdueRequests = function(propertyId: string) {
  const now = new Date();
  return this.find({
    propertyId: new mongoose.Types.ObjectId(propertyId),
    'scheduling.scheduledEndDate': { $lt: now },
    'lifecycle.status': { $nin: ['completed', 'verified', 'closed', 'cancelled'] },
    isActive: true
  }).populate('assignment.assignedTo', 'name email')
    .populate('location.roomId', 'roomNumber floor')
    .sort({ 'scheduling.scheduledEndDate': 1 });
};

export default mongoose.models.MaintenanceRequest || mongoose.model<IMaintenanceRequest>('MaintenanceRequest', MaintenanceRequestSchema);