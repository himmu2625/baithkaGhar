import mongoose, { Schema, Document } from 'mongoose';

export interface IBookingStatus extends Document {
  name: string;
  code: string; // Short code for status (e.g., 'CONF', 'CANC', 'PEND')
  category: 'active' | 'inactive' | 'pending' | 'cancelled' | 'completed';
  description: string;
  
  // Workflow configuration
  workflow: {
    canTransitionTo: string[]; // Array of status codes this can transition to
    requiresApproval: boolean;
    approvalLevel: 'staff' | 'supervisor' | 'manager' | 'admin';
    autoTransitionRules: [{
      condition: string; // JSON condition
      targetStatus: string;
      delayHours?: number;
    }];
  };
  
  // Display configuration
  display: {
    color: string; // Hex color for UI
    icon: string; // Icon name/class
    priority: number; // Display priority
    showToGuest: boolean;
    guestDisplayName?: string; // Different name for guest-facing
  };
  
  // Business rules
  businessRules: {
    allowModification: boolean;
    allowCancellation: boolean;
    allowRefund: boolean;
    requiresPayment: boolean;
    blocksInventory: boolean;
    affectsRevenue: boolean;
    sendsNotifications: boolean;
    requiresConfirmation: boolean;
  };
  
  // Revenue impact
  revenueImpact: {
    type: 'positive' | 'negative' | 'neutral';
    includeInReports: boolean;
    revenuePercentage: number; // 0-100, how much of booking value counts as revenue
  };
  
  // Inventory impact
  inventoryImpact: {
    blocksRoom: boolean;
    blockType?: 'hard' | 'soft'; // Hard = cannot be overbooked, Soft = can be overbooked with approval
    releaseOnCancel: boolean;
    holdDuration?: number; // Hours to hold without confirmation
  };
  
  // Communication settings
  communications: {
    emailTemplates: {
      guestTemplate?: string;
      propertyTemplate?: string;
      adminTemplate?: string;
    };
    smsTemplates: {
      guestTemplate?: string;
      propertyTemplate?: string;
    };
    notificationSettings: {
      notifyGuest: boolean;
      notifyProperty: boolean;
      notifyAdmin: boolean;
      urgencyLevel: 'low' | 'medium' | 'high' | 'urgent';
    };
  };
  
  // SLA (Service Level Agreement) settings
  sla: {
    responseTimeHours?: number;
    resolutionTimeHours?: number;
    escalationRules: [{
      afterHours: number;
      escalateTo: 'supervisor' | 'manager' | 'admin';
      action: 'notify' | 'auto_approve' | 'auto_cancel';
    }];
  };
  
  // Integration settings
  integrations: {
    syncToChannels: boolean;
    pmsMapping?: string; // Property Management System status mapping
    accountingCode?: string;
    reportingCategory?: string;
  };
  
  // Permissions
  permissions: {
    whoCanSet: string[]; // Array of user roles
    whoCanModify: string[]; // Array of user roles
    restrictedProperties?: mongoose.Types.ObjectId[]; // Property-specific restrictions
  };
  
  // Analytics and tracking
  analytics: {
    trackingEnabled: boolean;
    conversionEvents: string[]; // Events to track for this status
    kpiCategory?: string;
    benchmarkTarget?: number;
  };
  
  // Audit and compliance
  audit: {
    requiresReason: boolean;
    reasonCategories: string[];
    retentionPeriodDays: number;
    complianceNotes?: string;
  };
  
  // Custom fields for specific business needs
  customFields: [{
    fieldName: string;
    fieldType: 'text' | 'number' | 'boolean' | 'date' | 'select';
    isRequired: boolean;
    options?: string[]; // For select type
    defaultValue?: string;
  }];
  
  // System behavior
  systemBehavior: {
    isSystemGenerated: boolean;
    isUserGenerated: boolean;
    isTemporary: boolean;
    expiryCondition?: string;
    cleanupRules?: string;
  };
  
  // Multi-language support
  localization: [{
    language: string;
    displayName: string;
    description: string;
    guestMessage?: string;
  }];
  
  // Usage statistics
  statistics: {
    totalUsage: number;
    last30DaysUsage: number;
    averageDurationHours: number;
    conversionRate: number;
    satisfactionScore: number;
  };
  
  // Validation rules
  validation: {
    requiredFields: string[];
    businessValidations: string[]; // Array of validation rule names
    warningConditions: string[];
    blockingConditions: string[];
  };
  
  isActive: boolean;
  isDefault: boolean;
  isSystemStatus: boolean; // Cannot be deleted/modified
  deprecatedAt?: Date;
  replacedBy?: mongoose.Types.ObjectId;
  
  createdBy: mongoose.Types.ObjectId;
  lastModifiedBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const BookingStatusSchema = new Schema<IBookingStatus>({
  name: { 
    type: String, 
    required: true, 
    trim: true,
    unique: true 
  },
  code: { 
    type: String, 
    required: true, 
    uppercase: true,
    trim: true,
    unique: true,
    maxlength: 10 
  },
  category: { 
    type: String, 
    enum: ['active', 'inactive', 'pending', 'cancelled', 'completed'],
    required: true 
  },
  description: { 
    type: String, 
    required: true 
  },
  
  workflow: {
    canTransitionTo: [{ type: String, uppercase: true }],
    requiresApproval: { type: Boolean, default: false },
    approvalLevel: { 
      type: String, 
      enum: ['staff', 'supervisor', 'manager', 'admin'],
      default: 'staff' 
    },
    autoTransitionRules: [{
      condition: { type: String, required: true },
      targetStatus: { type: String, required: true, uppercase: true },
      delayHours: { type: Number, min: 0 }
    }]
  },
  
  display: {
    color: { 
      type: String, 
      required: true,
      match: /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/ 
    },
    icon: { type: String, required: true },
    priority: { type: Number, default: 50, min: 1, max: 100 },
    showToGuest: { type: Boolean, default: true },
    guestDisplayName: { type: String }
  },
  
  businessRules: {
    allowModification: { type: Boolean, default: true },
    allowCancellation: { type: Boolean, default: true },
    allowRefund: { type: Boolean, default: false },
    requiresPayment: { type: Boolean, default: false },
    blocksInventory: { type: Boolean, default: true },
    affectsRevenue: { type: Boolean, default: true },
    sendsNotifications: { type: Boolean, default: true },
    requiresConfirmation: { type: Boolean, default: false }
  },
  
  revenueImpact: {
    type: { 
      type: String, 
      enum: ['positive', 'negative', 'neutral'],
      default: 'positive' 
    },
    includeInReports: { type: Boolean, default: true },
    revenuePercentage: { type: Number, default: 100, min: 0, max: 100 }
  },
  
  inventoryImpact: {
    blocksRoom: { type: Boolean, default: true },
    blockType: { type: String, enum: ['hard', 'soft'], default: 'hard' },
    releaseOnCancel: { type: Boolean, default: true },
    holdDuration: { type: Number, min: 0 }
  },
  
  communications: {
    emailTemplates: {
      guestTemplate: { type: String },
      propertyTemplate: { type: String },
      adminTemplate: { type: String }
    },
    smsTemplates: {
      guestTemplate: { type: String },
      propertyTemplate: { type: String }
    },
    notificationSettings: {
      notifyGuest: { type: Boolean, default: true },
      notifyProperty: { type: Boolean, default: true },
      notifyAdmin: { type: Boolean, default: false },
      urgencyLevel: { 
        type: String, 
        enum: ['low', 'medium', 'high', 'urgent'],
        default: 'medium' 
      }
    }
  },
  
  sla: {
    responseTimeHours: { type: Number, min: 0 },
    resolutionTimeHours: { type: Number, min: 0 },
    escalationRules: [{
      afterHours: { type: Number, required: true, min: 0 },
      escalateTo: { 
        type: String, 
        enum: ['supervisor', 'manager', 'admin'],
        required: true 
      },
      action: { 
        type: String, 
        enum: ['notify', 'auto_approve', 'auto_cancel'],
        required: true 
      }
    }]
  },
  
  integrations: {
    syncToChannels: { type: Boolean, default: true },
    pmsMapping: { type: String },
    accountingCode: { type: String },
    reportingCategory: { type: String }
  },
  
  permissions: {
    whoCanSet: [{ type: String }],
    whoCanModify: [{ type: String }],
    restrictedProperties: [{ type: Schema.Types.ObjectId, ref: 'Property' }]
  },
  
  analytics: {
    trackingEnabled: { type: Boolean, default: true },
    conversionEvents: [{ type: String }],
    kpiCategory: { type: String },
    benchmarkTarget: { type: Number, min: 0 }
  },
  
  audit: {
    requiresReason: { type: Boolean, default: false },
    reasonCategories: [{ type: String }],
    retentionPeriodDays: { type: Number, default: 365, min: 1 },
    complianceNotes: { type: String }
  },
  
  customFields: [{
    fieldName: { type: String, required: true },
    fieldType: { 
      type: String, 
      enum: ['text', 'number', 'boolean', 'date', 'select'],
      required: true 
    },
    isRequired: { type: Boolean, default: false },
    options: [{ type: String }],
    defaultValue: { type: String }
  }],
  
  systemBehavior: {
    isSystemGenerated: { type: Boolean, default: false },
    isUserGenerated: { type: Boolean, default: true },
    isTemporary: { type: Boolean, default: false },
    expiryCondition: { type: String },
    cleanupRules: { type: String }
  },
  
  localization: [{
    language: { type: String, required: true },
    displayName: { type: String, required: true },
    description: { type: String, required: true },
    guestMessage: { type: String }
  }],
  
  statistics: {
    totalUsage: { type: Number, default: 0, min: 0 },
    last30DaysUsage: { type: Number, default: 0, min: 0 },
    averageDurationHours: { type: Number, default: 0, min: 0 },
    conversionRate: { type: Number, default: 0, min: 0, max: 100 },
    satisfactionScore: { type: Number, default: 0, min: 0, max: 5 }
  },
  
  validation: {
    requiredFields: [{ type: String }],
    businessValidations: [{ type: String }],
    warningConditions: [{ type: String }],
    blockingConditions: [{ type: String }]
  },
  
  isActive: { type: Boolean, default: true },
  isDefault: { type: Boolean, default: false },
  isSystemStatus: { type: Boolean, default: false },
  deprecatedAt: { type: Date },
  replacedBy: { type: Schema.Types.ObjectId, ref: 'BookingStatus' },
  
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  lastModifiedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
BookingStatusSchema.index({ code: 1 });
BookingStatusSchema.index({ category: 1 });
BookingStatusSchema.index({ isActive: 1 });
BookingStatusSchema.index({ isDefault: 1 });
BookingStatusSchema.index({ 'display.priority': 1 });

// Compound indexes
BookingStatusSchema.index({ category: 1, isActive: 1 });
BookingStatusSchema.index({ isActive: 1, 'display.priority': 1 });

// Ensure only one default status per category
BookingStatusSchema.index({ category: 1, isDefault: 1 }, { 
  unique: true, 
  partialFilterExpression: { isDefault: true } 
});

// Pre-save middleware
BookingStatusSchema.pre('save', function(next) {
  // Ensure code is uppercase
  if (this.code) {
    this.code = this.code.toUpperCase();
  }
  
  // Set guest display name if not provided
  if (!this.display.guestDisplayName) {
    this.display.guestDisplayName = this.name;
  }
  
  // Ensure at least one localization exists (English)
  if (!this.localization || (this.localization as any[]).length === 0) {
    this.localization = [{
      language: 'en',
      displayName: this.name,
      description: this.description
    }];
  }
  
  next();
});

// Methods
BookingStatusSchema.methods.canTransitionTo = function(targetStatusCode: string): boolean {
  return this.workflow.canTransitionTo.includes(targetStatusCode.toUpperCase());
};

BookingStatusSchema.methods.getGuestDisplayName = function(language: string = 'en'): string {
  const localization = this.localization.find((loc: any) => loc.language === language);
  return localization ? localization.displayName : this.display.guestDisplayName || this.name;
};

BookingStatusSchema.methods.incrementUsage = function(): Promise<any> {
  this.statistics.totalUsage += 1;
  this.statistics.last30DaysUsage += 1;
  return this.save();
};

// Static methods
BookingStatusSchema.statics.getByCode = function(code: string) {
  return this.findOne({ code: code.toUpperCase(), isActive: true });
};

BookingStatusSchema.statics.getByCategory = function(category: string) {
  return this.find({ category, isActive: true }).sort({ 'display.priority': 1 });
};

BookingStatusSchema.statics.getDefault = function(category: string) {
  return this.findOne({ category, isDefault: true, isActive: true });
};

BookingStatusSchema.statics.getValidTransitions = function(fromStatusCode: string) {
  return this.findOne({ code: fromStatusCode.toUpperCase(), isActive: true })
    .then((status: any) => {
      if (!status) return [];
      return this.find({ 
        code: { $in: status.workflow.canTransitionTo },
        isActive: true 
      }).sort({ 'display.priority': 1 });
    });
};

// Seed default statuses
BookingStatusSchema.statics.seedDefaultStatuses = async function() {
  const defaultStatuses = [
    {
      name: 'Pending Confirmation',
      code: 'PEND',
      category: 'pending',
      description: 'Booking awaiting confirmation',
      display: { color: '#FFA500', icon: 'clock', priority: 10 },
      workflow: { canTransitionTo: ['CONF', 'CANC'], requiresApproval: false },
      businessRules: { blocksInventory: true, affectsRevenue: false, requiresPayment: false }
    },
    {
      name: 'Confirmed',
      code: 'CONF',
      category: 'active',
      description: 'Booking confirmed and active',
      display: { color: '#28a745', icon: 'check-circle', priority: 20 },
      workflow: { canTransitionTo: ['CHKD', 'CANC', 'NOSH'], requiresApproval: false },
      businessRules: { blocksInventory: true, affectsRevenue: true, requiresPayment: true },
      isDefault: true
    },
    {
      name: 'Checked In',
      code: 'CHKD',
      category: 'active',
      description: 'Guest has checked in',
      display: { color: '#007bff', icon: 'door-open', priority: 30 },
      workflow: { canTransitionTo: ['COMP'], requiresApproval: false },
      businessRules: { allowCancellation: false, blocksInventory: true, affectsRevenue: true }
    },
    {
      name: 'Completed',
      code: 'COMP',
      category: 'completed',
      description: 'Stay completed successfully',
      display: { color: '#6f42c1', icon: 'flag-checkered', priority: 40 },
      workflow: { canTransitionTo: [], requiresApproval: false },
      businessRules: { allowModification: false, blocksInventory: false, affectsRevenue: true }
    },
    {
      name: 'Cancelled',
      code: 'CANC',
      category: 'cancelled',
      description: 'Booking cancelled',
      display: { color: '#dc3545', icon: 'times-circle', priority: 50 },
      workflow: { canTransitionTo: [], requiresApproval: false },
      businessRules: { allowModification: false, blocksInventory: false, affectsRevenue: false, allowRefund: true }
    },
    {
      name: 'No Show',
      code: 'NOSH',
      category: 'cancelled',
      description: 'Guest did not show up',
      display: { color: '#6c757d', icon: 'user-times', priority: 60 },
      workflow: { canTransitionTo: [], requiresApproval: false },
      businessRules: { allowModification: false, blocksInventory: false, affectsRevenue: true, allowRefund: false }
    }
  ];

  for (const statusData of defaultStatuses) {
    const existing = await this.findOne({ code: statusData.code });
    if (!existing) {
      await this.create({
        ...statusData,
        isSystemStatus: true,
        createdBy: new mongoose.Types.ObjectId(),
        lastModifiedBy: new mongoose.Types.ObjectId()
      });
    }
  }
};

export default mongoose.models.BookingStatus || mongoose.model<IBookingStatus>('BookingStatus', BookingStatusSchema);