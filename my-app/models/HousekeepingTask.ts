import mongoose, { Schema, Document } from 'mongoose';

export interface IHousekeepingTask extends Document {
  // Basic Information
  propertyId: mongoose.Types.ObjectId;
  roomId?: mongoose.Types.ObjectId;
  areaId?: mongoose.Types.ObjectId; // For common areas like lobby, restaurant
  taskCode: string; // Unique identifier (e.g., "HK-R101-20241213-001")

  // Task Classification
  taskType: 'cleaning' | 'inspection' | 'maintenance' | 'setup' | 'inventory_check' | 'deep_cleaning' | 'sanitization' | 'laundry' | 'restocking';
  taskCategory: 'routine' | 'checkout_cleaning' | 'checkin_preparation' | 'maintenance_support' | 'special_request' | 'emergency' | 'preventive';
  priority: 'low' | 'medium' | 'high' | 'urgent' | 'emergency';

  // Task Details
  title: string;
  description: string;
  instructions?: string[];
  estimatedDuration: number; // in minutes
  actualDuration?: number; // in minutes

  // Scheduling
  scheduling: {
    scheduledDate: Date;
    scheduledStartTime: string; // "14:30" format
    scheduledEndTime: string;   // "15:30" format
    actualStartTime?: Date;
    actualEndTime?: Date;
    isRecurring: boolean;
    recurrencePattern?: {
      frequency: 'daily' | 'weekly' | 'monthly' | 'custom';
      interval: number; // every X days/weeks/months
      daysOfWeek?: number[]; // 0-6 (Sunday-Saturday)
      dayOfMonth?: number; // 1-31
      endDate?: Date;
      maxOccurrences?: number;
    };
    parentTaskId?: mongoose.Types.ObjectId; // For recurring task instances
  };

  // Assignment
  assignment: {
    assignedTo?: mongoose.Types.ObjectId; // Staff member
    assignedBy: mongoose.Types.ObjectId;  // Who assigned the task
    assignedAt: Date;
    teamLead?: mongoose.Types.ObjectId;
    additionalStaff?: mongoose.Types.ObjectId[]; // For tasks requiring multiple people
    skillsRequired?: string[];
    equipmentRequired?: string[];
    suppliesRequired?: [{
      item: string;
      quantity: number;
      unit: string;
      critical: boolean; // Task cannot proceed without this
    }];
  };

  // Status Tracking
  status: 'scheduled' | 'assigned' | 'in_progress' | 'paused' | 'completed' | 'cancelled' | 'delayed' | 'failed' | 'requires_inspection';
  statusHistory: [{
    status: string;
    changedBy: mongoose.Types.ObjectId;
    changedAt: Date;
    reason?: string;
    notes?: string;
  }];

  // Progress Tracking
  progress: {
    percentComplete: number; // 0-100
    checklistItems?: [{
      item: string;
      completed: boolean;
      completedAt?: Date;
      completedBy?: mongoose.Types.ObjectId;
      notes?: string;
      verificationRequired: boolean;
      verified?: boolean;
      verifiedBy?: mongoose.Types.ObjectId;
      verifiedAt?: Date;
    }];
    milestones?: [{
      milestone: string;
      targetTime: Date;
      actualTime?: Date;
      achieved: boolean;
    }];
  };

  // Room State
  roomState: {
    preCleaning: {
      guestPresent: boolean;
      roomCondition: 'excellent' | 'good' | 'fair' | 'poor' | 'damaged';
      specialIssues?: string[];
      photosBeforeCleaning?: string[];
      inventoryCheck?: [{
        item: string;
        condition: 'excellent' | 'good' | 'fair' | 'poor' | 'missing' | 'damaged';
        notes?: string;
      }];
    };
    postCleaning: {
      roomCondition: 'excellent' | 'good' | 'fair' | 'poor' | 'requires_attention';
      qualityScore?: number; // 1-10
      photosAfterCleaning?: string[];
      issuesFound?: [{
        issue: string;
        severity: 'minor' | 'major' | 'critical';
        location: string;
        requiresFollowUp: boolean;
        reportedToMaintenance: boolean;
      }];
      suppliesUsed?: [{
        item: string;
        quantity: number;
        unit: string;
        cost?: number;
      }];
    };
  };

  // Quality Control
  qualityControl: {
    requiresInspection: boolean;
    inspectedBy?: mongoose.Types.ObjectId;
    inspectedAt?: Date;
    inspectionScore?: number; // 1-10
    inspectionNotes?: string;
    inspectionPhotos?: string[];
    qualityIssues?: [{
      issue: string;
      severity: 'minor' | 'major' | 'critical';
      correctionRequired: boolean;
      correctedAt?: Date;
      correctedBy?: mongoose.Types.ObjectId;
    }];
    approvedBy?: mongoose.Types.ObjectId;
    approvedAt?: Date;
    rejectionReason?: string;
    retaskRequired: boolean;
  };

  // Guest Interaction
  guestInteraction: {
    guestPresent: boolean;
    guestInformed: boolean;
    guestRequests?: string[];
    guestComplaints?: string[];
    guestFeedback?: {
      rating: number; // 1-5
      comments?: string;
      feedbackDate: Date;
    };
    specialInstructions?: string[];
    doNotDisturb: boolean;
    guestPreferences?: [{
      preference: string;
      value: string;
    }];
  };

  // Environmental Considerations
  environmental: {
    ecoFriendlyProducts: boolean;
    waterUsage?: number; // liters
    electricityUsage?: number; // kWh
    wasteGenerated?: number; // kg
    recyclingItems?: string[];
    sustainabilityScore?: number; // 1-10
  };

  // Health & Safety
  safety: {
    safetyCheckCompleted: boolean;
    safetyIssuesFound?: [{
      issue: string;
      severity: 'low' | 'medium' | 'high' | 'critical';
      location: string;
      actionTaken: string;
      reportedToSupervisor: boolean;
    }];
    ppeUsed?: string[];
    accidentsReported?: [{
      type: string;
      description: string;
      injuryReported: boolean;
      reportedAt: Date;
      followUpRequired: boolean;
    }];
    chemicalSafetyCompliant: boolean;
    ventilationCheck: boolean;
  };

  // Compliance & Standards
  compliance: {
    standardsFollowed: string[]; // e.g., ["WHO Guidelines", "Local Health Dept"]
    auditTrailRequired: boolean;
    documentationComplete: boolean;
    certificationsRequired?: string[];
    complianceScore?: number; // 1-10
    nonComplianceIssues?: [{
      standard: string;
      issue: string;
      severity: 'minor' | 'major' | 'critical';
      correctionDeadline?: Date;
      corrected: boolean;
    }];
  };

  // Cost Tracking
  costs: {
    laborCost: number;
    supplyCost: number;
    equipmentCost: number;
    additionalCosts: [{
      description: string;
      amount: number;
      category: string;
    }];
    totalCost: number;
    budgetAllocated?: number;
    costVariance: number; // actual vs budget
    currency: string;
  };

  // Performance Metrics
  performance: {
    efficiencyRating: number; // 1-10
    accuracyRating: number;   // 1-10
    timelinessRating: number; // 1-10
    qualityRating: number;    // 1-10
    guestSatisfactionRating?: number; // 1-10
    repeatWork: boolean;
    trainingSuggestions?: string[];
  };

  // Integration Data
  integration: {
    pmsTaskId?: string; // Property Management System
    maintenanceTicketId?: string;
    inventoryTransactionId?: string;
    payrollEntryId?: string;
    externalSystemReferences?: [{
      system: string;
      referenceId: string;
      syncStatus: 'synced' | 'pending' | 'failed';
      lastSyncAt?: Date;
    }];
  };

  // Communication
  communication: {
    notificationsSent: [{
      recipient: mongoose.Types.ObjectId;
      type: 'sms' | 'email' | 'push' | 'in_app';
      message: string;
      sentAt: Date;
      delivered: boolean;
      read?: boolean;
    }];
    comments: [{
      commentBy: mongoose.Types.ObjectId;
      comment: string;
      commentedAt: Date;
      visibility: 'public' | 'staff_only' | 'management_only';
      urgent: boolean;
    }];
    escalations: [{
      escalatedTo: mongoose.Types.ObjectId;
      escalatedBy: mongoose.Types.ObjectId;
      escalatedAt: Date;
      reason: string;
      resolved: boolean;
      resolutionNotes?: string;
    }];
  };

  // Documentation
  documentation: {
    photos: {
      before: string[];
      during: string[];
      after: string[];
      issues: string[];
    };
    videos?: string[];
    signatures?: [{
      signedBy: mongoose.Types.ObjectId;
      signature: string; // base64 or URL
      signedAt: Date;
      signatureType: 'completion' | 'inspection' | 'approval' | 'guest_acknowledgment';
    }];
    reports?: string[]; // URLs to generated reports
    certificates?: string[]; // URLs to certificates if applicable
  };

  // Dependencies
  dependencies: {
    prerequisiteTasks?: mongoose.Types.ObjectId[]; // Tasks that must be completed first
    blockedBy?: mongoose.Types.ObjectId[];        // Tasks that block this one
    dependentTasks?: mongoose.Types.ObjectId[];   // Tasks that depend on this one
    roomAvailabilityRequired: boolean;
    guestAbsenceRequired: boolean;
    maintenanceCompleted?: boolean;
  };

  // Automation
  automation: {
    autoAssigned: boolean;
    autoScheduled: boolean;
    triggerConditions?: [{
      condition: string;
      value: any;
      operator: 'equals' | 'greater_than' | 'less_than' | 'contains';
    }];
    automationRules?: string[];
    aiRecommendations?: [{
      recommendation: string;
      confidence: number; // 0-1
      reasoning: string;
      accepted: boolean;
    }];
  };

  // Special Considerations
  special: {
    vipGuest: boolean;
    allergyConsiderations?: string[];
    culturalConsiderations?: string[];
    accessibilityRequirements?: string[];
    petFriendlySetup: boolean;
    businessTravelSetup: boolean;
    familyTravelSetup: boolean;
    longStayGuest: boolean;
  };

  // System Fields
  isActive: boolean;
  isTemplate: boolean; // For creating recurring tasks
  templateId?: mongoose.Types.ObjectId; // Reference to template if created from one
  version: number;
  archivedAt?: Date;
  archivedBy?: mongoose.Types.ObjectId;

  // Audit Trail
  createdBy: mongoose.Types.ObjectId;
  lastModifiedBy: mongoose.Types.ObjectId;

  createdAt: Date;
  updatedAt: Date;
}

const HousekeepingTaskSchema = new Schema<IHousekeepingTask>({
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
    ref: 'Area', // Assuming you have an Area model for common areas
    index: true
  },
  taskCode: {
    type: String,
    required: true,
    unique: true,
    uppercase: true
  },

  // Task Classification
  taskType: {
    type: String,
    enum: ['cleaning', 'inspection', 'maintenance', 'setup', 'inventory_check', 'deep_cleaning', 'sanitization', 'laundry', 'restocking'],
    required: true,
    index: true
  },
  taskCategory: {
    type: String,
    enum: ['routine', 'checkout_cleaning', 'checkin_preparation', 'maintenance_support', 'special_request', 'emergency', 'preventive'],
    required: true,
    index: true
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent', 'emergency'],
    required: true,
    default: 'medium',
    index: true
  },

  // Task Details
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  instructions: [String],
  estimatedDuration: {
    type: Number,
    required: true,
    min: 5, // minimum 5 minutes
    max: 480 // maximum 8 hours
  },
  actualDuration: {
    type: Number,
    min: 0
  },

  // Scheduling
  scheduling: {
    scheduledDate: { type: Date, required: true, index: true },
    scheduledStartTime: { type: String, required: true },
    scheduledEndTime: { type: String, required: true },
    actualStartTime: Date,
    actualEndTime: Date,
    isRecurring: { type: Boolean, default: false },
    recurrencePattern: {
      frequency: {
        type: String,
        enum: ['daily', 'weekly', 'monthly', 'custom']
      },
      interval: { type: Number, min: 1 },
      daysOfWeek: [{ type: Number, min: 0, max: 6 }],
      dayOfMonth: { type: Number, min: 1, max: 31 },
      endDate: Date,
      maxOccurrences: { type: Number, min: 1 }
    },
    parentTaskId: { type: Schema.Types.ObjectId, ref: 'HousekeepingTask' }
  },

  // Assignment
  assignment: {
    assignedTo: { type: Schema.Types.ObjectId, ref: 'Staff' },
    assignedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    assignedAt: { type: Date, default: Date.now },
    teamLead: { type: Schema.Types.ObjectId, ref: 'Staff' },
    additionalStaff: [{ type: Schema.Types.ObjectId, ref: 'Staff' }],
    skillsRequired: [String],
    equipmentRequired: [String],
    suppliesRequired: [{
      item: { type: String, required: true },
      quantity: { type: Number, required: true, min: 0 },
      unit: { type: String, required: true },
      critical: { type: Boolean, default: false }
    }]
  },

  // Status Tracking
  status: {
    type: String,
    enum: ['scheduled', 'assigned', 'in_progress', 'paused', 'completed', 'cancelled', 'delayed', 'failed', 'requires_inspection'],
    default: 'scheduled',
    index: true
  },
  statusHistory: [{
    status: { type: String, required: true },
    changedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    changedAt: { type: Date, default: Date.now },
    reason: String,
    notes: String
  }],

  // Progress Tracking
  progress: {
    percentComplete: { type: Number, default: 0, min: 0, max: 100 },
    checklistItems: [{
      item: { type: String, required: true },
      completed: { type: Boolean, default: false },
      completedAt: Date,
      completedBy: { type: Schema.Types.ObjectId, ref: 'User' },
      notes: String,
      verificationRequired: { type: Boolean, default: false },
      verified: { type: Boolean, default: false },
      verifiedBy: { type: Schema.Types.ObjectId, ref: 'User' },
      verifiedAt: Date
    }],
    milestones: [{
      milestone: { type: String, required: true },
      targetTime: { type: Date, required: true },
      actualTime: Date,
      achieved: { type: Boolean, default: false }
    }]
  },

  // Room State
  roomState: {
    preCleaning: {
      guestPresent: { type: Boolean, default: false },
      roomCondition: {
        type: String,
        enum: ['excellent', 'good', 'fair', 'poor', 'damaged'],
        default: 'good'
      },
      specialIssues: [String],
      photosBeforeCleaning: [String],
      inventoryCheck: [{
        item: { type: String, required: true },
        condition: {
          type: String,
          enum: ['excellent', 'good', 'fair', 'poor', 'missing', 'damaged'],
          required: true
        },
        notes: String
      }]
    },
    postCleaning: {
      roomCondition: {
        type: String,
        enum: ['excellent', 'good', 'fair', 'poor', 'requires_attention']
      },
      qualityScore: { type: Number, min: 1, max: 10 },
      photosAfterCleaning: [String],
      issuesFound: [{
        issue: { type: String, required: true },
        severity: {
          type: String,
          enum: ['minor', 'major', 'critical'],
          required: true
        },
        location: { type: String, required: true },
        requiresFollowUp: { type: Boolean, default: false },
        reportedToMaintenance: { type: Boolean, default: false }
      }],
      suppliesUsed: [{
        item: { type: String, required: true },
        quantity: { type: Number, required: true, min: 0 },
        unit: { type: String, required: true },
        cost: { type: Number, min: 0 }
      }]
    }
  },

  // Quality Control
  qualityControl: {
    requiresInspection: { type: Boolean, default: true },
    inspectedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    inspectedAt: Date,
    inspectionScore: { type: Number, min: 1, max: 10 },
    inspectionNotes: String,
    inspectionPhotos: [String],
    qualityIssues: [{
      issue: { type: String, required: true },
      severity: {
        type: String,
        enum: ['minor', 'major', 'critical'],
        required: true
      },
      correctionRequired: { type: Boolean, default: false },
      correctedAt: Date,
      correctedBy: { type: Schema.Types.ObjectId, ref: 'User' }
    }],
    approvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    approvedAt: Date,
    rejectionReason: String,
    retaskRequired: { type: Boolean, default: false }
  },

  // Guest Interaction
  guestInteraction: {
    guestPresent: { type: Boolean, default: false },
    guestInformed: { type: Boolean, default: false },
    guestRequests: [String],
    guestComplaints: [String],
    guestFeedback: {
      rating: { type: Number, min: 1, max: 5 },
      comments: String,
      feedbackDate: Date
    },
    specialInstructions: [String],
    doNotDisturb: { type: Boolean, default: false },
    guestPreferences: [{
      preference: { type: String, required: true },
      value: { type: String, required: true }
    }]
  },

  // Environmental Considerations
  environmental: {
    ecoFriendlyProducts: { type: Boolean, default: false },
    waterUsage: { type: Number, min: 0 },
    electricityUsage: { type: Number, min: 0 },
    wasteGenerated: { type: Number, min: 0 },
    recyclingItems: [String],
    sustainabilityScore: { type: Number, min: 1, max: 10 }
  },

  // Health & Safety
  safety: {
    safetyCheckCompleted: { type: Boolean, default: false },
    safetyIssuesFound: [{
      issue: { type: String, required: true },
      severity: {
        type: String,
        enum: ['low', 'medium', 'high', 'critical'],
        required: true
      },
      location: { type: String, required: true },
      actionTaken: { type: String, required: true },
      reportedToSupervisor: { type: Boolean, default: false }
    }],
    ppeUsed: [String],
    accidentsReported: [{
      type: { type: String, required: true },
      description: { type: String, required: true },
      injuryReported: { type: Boolean, default: false },
      reportedAt: { type: Date, default: Date.now },
      followUpRequired: { type: Boolean, default: false }
    }],
    chemicalSafetyCompliant: { type: Boolean, default: true },
    ventilationCheck: { type: Boolean, default: false }
  },

  // Compliance & Standards
  compliance: {
    standardsFollowed: [String],
    auditTrailRequired: { type: Boolean, default: false },
    documentationComplete: { type: Boolean, default: false },
    certificationsRequired: [String],
    complianceScore: { type: Number, min: 1, max: 10 },
    nonComplianceIssues: [{
      standard: { type: String, required: true },
      issue: { type: String, required: true },
      severity: {
        type: String,
        enum: ['minor', 'major', 'critical'],
        required: true
      },
      correctionDeadline: Date,
      corrected: { type: Boolean, default: false }
    }]
  },

  // Cost Tracking
  costs: {
    laborCost: { type: Number, default: 0, min: 0 },
    supplyCost: { type: Number, default: 0, min: 0 },
    equipmentCost: { type: Number, default: 0, min: 0 },
    additionalCosts: [{
      description: { type: String, required: true },
      amount: { type: Number, required: true, min: 0 },
      category: { type: String, required: true }
    }],
    totalCost: { type: Number, default: 0, min: 0 },
    budgetAllocated: { type: Number, min: 0 },
    costVariance: { type: Number, default: 0 },
    currency: { type: String, default: 'INR' }
  },

  // Performance Metrics
  performance: {
    efficiencyRating: { type: Number, min: 1, max: 10, default: 5 },
    accuracyRating: { type: Number, min: 1, max: 10, default: 5 },
    timelinessRating: { type: Number, min: 1, max: 10, default: 5 },
    qualityRating: { type: Number, min: 1, max: 10, default: 5 },
    guestSatisfactionRating: { type: Number, min: 1, max: 10 },
    repeatWork: { type: Boolean, default: false },
    trainingSuggestions: [String]
  },

  // Integration Data
  integration: {
    pmsTaskId: String,
    maintenanceTicketId: String,
    inventoryTransactionId: String,
    payrollEntryId: String,
    externalSystemReferences: [{
      system: { type: String, required: true },
      referenceId: { type: String, required: true },
      syncStatus: {
        type: String,
        enum: ['synced', 'pending', 'failed'],
        default: 'pending'
      },
      lastSyncAt: Date
    }]
  },

  // Communication
  communication: {
    notificationsSent: [{
      recipient: { type: Schema.Types.ObjectId, ref: 'User', required: true },
      type: {
        type: String,
        enum: ['sms', 'email', 'push', 'in_app'],
        required: true
      },
      message: { type: String, required: true },
      sentAt: { type: Date, default: Date.now },
      delivered: { type: Boolean, default: false },
      read: { type: Boolean, default: false }
    }],
    comments: [{
      commentBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
      comment: { type: String, required: true },
      commentedAt: { type: Date, default: Date.now },
      visibility: {
        type: String,
        enum: ['public', 'staff_only', 'management_only'],
        default: 'staff_only'
      },
      urgent: { type: Boolean, default: false }
    }],
    escalations: [{
      escalatedTo: { type: Schema.Types.ObjectId, ref: 'User', required: true },
      escalatedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
      escalatedAt: { type: Date, default: Date.now },
      reason: { type: String, required: true },
      resolved: { type: Boolean, default: false },
      resolutionNotes: String
    }]
  },

  // Documentation
  documentation: {
    photos: {
      before: [String],
      during: [String],
      after: [String],
      issues: [String]
    },
    videos: [String],
    signatures: [{
      signedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
      signature: { type: String, required: true },
      signedAt: { type: Date, default: Date.now },
      signatureType: {
        type: String,
        enum: ['completion', 'inspection', 'approval', 'guest_acknowledgment'],
        required: true
      }
    }],
    reports: [String],
    certificates: [String]
  },

  // Dependencies
  dependencies: {
    prerequisiteTasks: [{ type: Schema.Types.ObjectId, ref: 'HousekeepingTask' }],
    blockedBy: [{ type: Schema.Types.ObjectId, ref: 'HousekeepingTask' }],
    dependentTasks: [{ type: Schema.Types.ObjectId, ref: 'HousekeepingTask' }],
    roomAvailabilityRequired: { type: Boolean, default: true },
    guestAbsenceRequired: { type: Boolean, default: false },
    maintenanceCompleted: { type: Boolean, default: false }
  },

  // Automation
  automation: {
    autoAssigned: { type: Boolean, default: false },
    autoScheduled: { type: Boolean, default: false },
    triggerConditions: [{
      condition: { type: String, required: true },
      value: Schema.Types.Mixed,
      operator: {
        type: String,
        enum: ['equals', 'greater_than', 'less_than', 'contains'],
        required: true
      }
    }],
    automationRules: [String],
    aiRecommendations: [{
      recommendation: { type: String, required: true },
      confidence: { type: Number, min: 0, max: 1, required: true },
      reasoning: { type: String, required: true },
      accepted: { type: Boolean, default: false }
    }]
  },

  // Special Considerations
  special: {
    vipGuest: { type: Boolean, default: false },
    allergyConsiderations: [String],
    culturalConsiderations: [String],
    accessibilityRequirements: [String],
    petFriendlySetup: { type: Boolean, default: false },
    businessTravelSetup: { type: Boolean, default: false },
    familyTravelSetup: { type: Boolean, default: false },
    longStayGuest: { type: Boolean, default: false }
  },

  // System Fields
  isActive: { type: Boolean, default: true },
  isTemplate: { type: Boolean, default: false },
  templateId: { type: Schema.Types.ObjectId, ref: 'HousekeepingTask' },
  version: { type: Number, default: 1 },
  archivedAt: Date,
  archivedBy: { type: Schema.Types.ObjectId, ref: 'User' },

  // Audit Trail
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  lastModifiedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
HousekeepingTaskSchema.index({ propertyId: 1, status: 1 });
HousekeepingTaskSchema.index({ roomId: 1, status: 1 });
HousekeepingTaskSchema.index({ taskCode: 1 }, { unique: true });
HousekeepingTaskSchema.index({ 'scheduling.scheduledDate': 1 });
HousekeepingTaskSchema.index({ 'assignment.assignedTo': 1, status: 1 });
HousekeepingTaskSchema.index({ taskType: 1, taskCategory: 1 });
HousekeepingTaskSchema.index({ priority: 1, status: 1 });

// Compound indexes
HousekeepingTaskSchema.index({ propertyId: 1, taskType: 1, status: 1 });
HousekeepingTaskSchema.index({ roomId: 1, taskType: 1, 'scheduling.scheduledDate': 1 });

// Text search index
HousekeepingTaskSchema.index({
  title: 'text',
  description: 'text'
});

// Virtuals
HousekeepingTaskSchema.virtual('isOverdue').get(function() {
  const now = new Date();
  const scheduledEnd = new Date(this.scheduling.scheduledDate);
  const [hours, minutes] = this.scheduling.scheduledEndTime.split(':');
  scheduledEnd.setHours(parseInt(hours), parseInt(minutes));

  return now > scheduledEnd && !['completed', 'cancelled'].includes(this.status);
});

HousekeepingTaskSchema.virtual('timeRemaining').get(function() {
  const now = new Date();
  const scheduledEnd = new Date(this.scheduling.scheduledDate);
  const [hours, minutes] = this.scheduling.scheduledEndTime.split(':');
  scheduledEnd.setHours(parseInt(hours), parseInt(minutes));

  return Math.max(0, Math.floor((scheduledEnd.getTime() - now.getTime()) / (1000 * 60))); // minutes
});

HousekeepingTaskSchema.virtual('actualDurationDeviation').get(function() {
  if (!this.actualDuration) return 0;
  return this.actualDuration - this.estimatedDuration;
});

HousekeepingTaskSchema.virtual('overallPerformanceScore').get(function() {
  const { efficiencyRating, accuracyRating, timelinessRating, qualityRating } = this.performance;
  return Math.round((efficiencyRating + accuracyRating + timelinessRating + qualityRating) / 4 * 10) / 10;
});

// Pre-save middleware
HousekeepingTaskSchema.pre('save', function(next) {
  // Auto-generate task code if not provided
  if (!this.taskCode && this.isNew) {
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const roomNumber = this.roomId ? `R${this.roomId.toString().slice(-3)}` : 'AREA';
    const timestamp = Date.now().toString().slice(-3);
    this.taskCode = `HK-${roomNumber}-${date}-${timestamp}`;
  }

  // Calculate total cost
  const additionalCostTotal = this.costs.additionalCosts.reduce((sum, cost) => sum + cost.amount, 0);
  this.costs.totalCost = this.costs.laborCost + this.costs.supplyCost + this.costs.equipmentCost + additionalCostTotal;

  // Calculate cost variance
  if (this.costs.budgetAllocated) {
    this.costs.costVariance = this.costs.totalCost - this.costs.budgetAllocated;
  }

  // Update version on modifications
  if (this.isModified() && !this.isNew) {
    this.version += 1;
  }

  // Update progress percentage based on checklist
  if (this.progress.checklistItems.length > 0) {
    const completedItems = this.progress.checklistItems.filter(item => item.completed).length;
    this.progress.percentComplete = Math.round((completedItems / this.progress.checklistItems.length) * 100);
  }

  next();
});

// Post-save middleware
HousekeepingTaskSchema.post('save', async function(doc) {
  // Update room housekeeping status if task is completed
  if (doc.status === 'completed' && doc.roomId && doc.taskType === 'cleaning') {
    const Room = mongoose.model('Room');
    await Room.findByIdAndUpdate(doc.roomId, {
      $set: {
        'housekeeping.cleaningStatus': 'clean',
        'housekeeping.lastCleaned': new Date(),
        'housekeeping.lastCleanedBy': doc.assignment.assignedTo
      }
    });
  }
});

// Static methods
HousekeepingTaskSchema.statics.generateRecurringTasks = async function(templateTask: IHousekeepingTask, endDate: Date) {
  const tasks = [];
  let currentDate = new Date(templateTask.scheduling.scheduledDate);

  while (currentDate <= endDate) {
    if (templateTask.scheduling.recurrencePattern?.maxOccurrences &&
        tasks.length >= templateTask.scheduling.recurrencePattern.maxOccurrences) {
      break;
    }

    const newTask = new this({
      ...templateTask.toObject(),
      _id: new mongoose.Types.ObjectId(),
      taskCode: undefined, // Will be auto-generated
      parentTaskId: templateTask._id,
      scheduling: {
        ...templateTask.scheduling,
        scheduledDate: new Date(currentDate),
        isRecurring: false
      },
      status: 'scheduled',
      isTemplate: false,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    tasks.push(newTask);

    // Calculate next occurrence
    switch (templateTask.scheduling.recurrencePattern?.frequency) {
      case 'daily':
        currentDate.setDate(currentDate.getDate() + (templateTask.scheduling.recurrencePattern.interval || 1));
        break;
      case 'weekly':
        currentDate.setDate(currentDate.getDate() + (7 * (templateTask.scheduling.recurrencePattern.interval || 1)));
        break;
      case 'monthly':
        currentDate.setMonth(currentDate.getMonth() + (templateTask.scheduling.recurrencePattern.interval || 1));
        break;
    }
  }

  return await this.insertMany(tasks);
};

HousekeepingTaskSchema.statics.getTaskStatistics = function(propertyId: string, dateRange?: { start: Date; end: Date }) {
  const matchStage: any = { propertyId: new mongoose.Types.ObjectId(propertyId) };

  if (dateRange) {
    matchStage['scheduling.scheduledDate'] = {
      $gte: dateRange.start,
      $lte: dateRange.end
    };
  }

  return this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: null,
        totalTasks: { $sum: 1 },
        completedTasks: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
        pendingTasks: { $sum: { $cond: [{ $eq: ['$status', 'scheduled'] }, 1, 0] } },
        inProgressTasks: { $sum: { $cond: [{ $eq: ['$status', 'in_progress'] }, 1, 0] } },
        averageQualityScore: { $avg: '$roomState.postCleaning.qualityScore' },
        averageDuration: { $avg: '$actualDuration' },
        totalCost: { $sum: '$costs.totalCost' },
        averagePerformanceScore: {
          $avg: {
            $avg: [
              '$performance.efficiencyRating',
              '$performance.accuracyRating',
              '$performance.timelinessRating',
              '$performance.qualityRating'
            ]
          }
        }
      }
    }
  ]);
};

export default mongoose.models.HousekeepingTask || mongoose.model<IHousekeepingTask>('HousekeepingTask', HousekeepingTaskSchema);