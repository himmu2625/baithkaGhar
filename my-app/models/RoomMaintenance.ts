import mongoose, { Schema, Document } from 'mongoose';

export interface IRoomMaintenance extends Document {
  propertyId: mongoose.Types.ObjectId;
  roomId: mongoose.Types.ObjectId;
  roomNumber: string; // For quick reference
  
  // Maintenance request details
  issueType: 'electrical' | 'plumbing' | 'hvac' | 'furniture' | 'fixtures' | 'electronics' | 'structural' | 'cleaning' | 'safety' | 'pest_control' | 'other';
  subCategory?: string; // e.g., "air conditioning", "toilet", "light fixture"
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent' | 'emergency';
  severity: 'minor' | 'moderate' | 'major' | 'critical';
  
  // Status tracking
  status: 'reported' | 'acknowledged' | 'assigned' | 'in_progress' | 'on_hold' | 'completed' | 'verified' | 'closed' | 'cancelled';
  workOrderNumber: string; // Unique identifier for tracking
  
  // Personnel involved
  reportedBy: {
    userId: mongoose.Types.ObjectId;
    name: string;
    role: 'guest' | 'staff' | 'housekeeping' | 'maintenance' | 'manager' | 'owner';
    contactInfo?: string;
  };
  assignedTo?: {
    userId: mongoose.Types.ObjectId;
    name: string;
    specialty: string;
    contactInfo: string;
    assignedAt: Date;
  };
  supervisorId?: mongoose.Types.ObjectId;
  
  // Timeline
  reportedAt: Date;
  acknowledgedAt?: Date;
  assignedAt?: Date;
  workStartedAt?: Date;
  workCompletedAt?: Date;
  verifiedAt?: Date;
  closedAt?: Date;
  
  // Scheduling
  scheduling: {
    scheduledDate?: Date;
    estimatedDuration: number; // in hours
    actualDuration?: number; // in hours
    preferredTimeSlot?: string;
    urgentRepair: boolean;
    canWorkAroundGuests: boolean;
    requiresRoomEvacuation: boolean;
  };
  
  // Cost and resources
  cost: {
    laborCost: number;
    materialCost: number;
    equipmentCost: number;
    outsourcingCost: number;
    totalCost: number;
    currency: string;
    budgetApprovalRequired: boolean;
    budgetApprovedBy?: mongoose.Types.ObjectId;
    budgetApprovedAt?: Date;
  };
  
  // Materials and parts
  materialsUsed: [{
    itemName: string;
    itemCode?: string;
    quantity: number;
    unit: string;
    unitCost: number;
    totalCost: number;
    supplier?: string;
    purchaseDate?: Date;
    warrantyPeriod?: number; // in months
  }];
  
  // Tools and equipment
  equipmentUsed: [{
    equipmentName: string;
    equipmentId?: string;
    usage: string;
    condition: 'good' | 'fair' | 'needs_repair' | 'damaged';
  }];
  
  // Work performed
  workPerformed: [{
    taskDescription: string;
    performedBy: mongoose.Types.ObjectId;
    startTime: Date;
    endTime: Date;
    status: 'completed' | 'partial' | 'failed';
    notes?: string;
    photosBeforeWork: string[];
    photosAfterWork: string[];
  }];
  
  // Quality assurance
  qualityCheck: {
    performed: boolean;
    performedBy?: mongoose.Types.ObjectId;
    checkDate?: Date;
    checklistUsed?: mongoose.Types.ObjectId;
    passed: boolean;
    issues?: string[];
    retestRequired: boolean;
    certificationRequired: boolean;
  };
  
  // Images and documentation
  documentation: {
    beforeImages: string[];
    afterImages: string[];
    receipts: string[];
    invoices: string[];
    warranties: string[];
    technicalSpecs: string[];
    videoLinks: string[];
  };
  
  // Guest impact
  guestImpact: {
    guestPresent: boolean;
    guestInformed: boolean;
    guestRelocated: boolean;
    relocationDetails?: {
      newRoomNumber: string;
      compensationOffered: string;
      guestSatisfied: boolean;
    };
    guestComplaint: boolean;
    complaintDetails?: string;
    compensationGiven?: {
      type: 'room_upgrade' | 'discount' | 'free_service' | 'refund' | 'voucher';
      value: number;
      description: string;
    };
  };
  
  // Follow-up requirements
  followUp: {
    required: boolean;
    followUpDate?: Date;
    followUpType?: 'inspection' | 'retest' | 'preventive_maintenance' | 'warranty_check';
    followUpAssignedTo?: mongoose.Types.ObjectId;
    followUpNotes?: string;
    followUpCompleted: boolean;
    followUpCompletedAt?: Date;
  };
  
  // Preventive maintenance
  preventiveMaintenance: {
    isPreventive: boolean;
    maintenanceScheduleId?: mongoose.Types.ObjectId;
    nextScheduledMaintenance?: Date;
    recommendedActions: string[];
    lifespanEstimate?: number; // in months
  };
  
  // Vendor information
  vendorInfo?: {
    vendorName: string;
    vendorContact: string;
    vendorId?: string;
    serviceType: string;
    warranty: {
      warrantyPeriod: number; // in months
      warrantyStartDate: Date;
      warrantyDetails: string;
    };
    serviceLevel: 'basic' | 'standard' | 'premium' | 'emergency';
    responseTime: number; // in hours
  };
  
  // Safety and compliance
  safety: {
    safetyHazard: boolean;
    hazardType?: string[];
    safetyMeasuresTaken: string[];
    ppERequired: string[];
    incidentReport?: mongoose.Types.ObjectId;
    regulatoryCompliance: boolean;
    complianceNotes?: string;
  };
  
  // Recurring issue tracking
  recurringIssue: {
    isRecurring: boolean;
    previousOccurrences: number;
    lastOccurrence?: Date;
    patternIdentified: boolean;
    rootCauseAnalysis?: string;
    permanentSolutionRequired: boolean;
    escalationRequired: boolean;
  };
  
  // Integration with other systems
  integrations: {
    pmsTicketId?: string; // Property Management System
    fmTicketId?: string; // Facility Management
    inventorySystemId?: string;
    accountingSystemId?: string;
    notificationsSent: string[];
    externalReferences: string[];
  };
  
  // Notes and comments
  notes: [{
    noteType: 'general' | 'technical' | 'guest_related' | 'cost' | 'timeline' | 'safety';
    note: string;
    addedBy: mongoose.Types.ObjectId;
    addedAt: Date;
    visibility: 'public' | 'staff_only' | 'management_only';
    isImportant: boolean;
  }];
  
  // Customer satisfaction
  satisfaction: {
    guestFeedback?: {
      rating: number; // 1-5
      comments?: string;
      wouldRecommend: boolean;
    };
    internalRating?: {
      qualityRating: number; // 1-5
      timelinessRating: number; // 1-5
      costEffectivenessRating: number; // 1-5
      communicationRating: number; // 1-5
    };
  };
  
  // Automation and alerts
  automation: {
    autoAssigned: boolean;
    autoEscalated: boolean;
    alertsSent: string[];
    remindersSent: number;
    slaBreached: boolean;
    slaDeadline?: Date;
  };
  
  // Performance metrics
  metrics: {
    responseTime: number; // hours from report to acknowledgment
    resolutionTime: number; // hours from report to completion
    firstTimeFixRate: boolean;
    customerSatisfactionScore: number;
    costPerIssue: number;
    downtimeHours: number;
  };
  
  isActive: boolean;
  isArchived: boolean;
  lastModifiedBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const RoomMaintenanceSchema = new Schema<IRoomMaintenance>({
  propertyId: { 
    type: Schema.Types.ObjectId, 
    ref: 'Property', 
    required: true 
  },
  roomId: { 
    type: Schema.Types.ObjectId, 
    ref: 'Room', 
    required: true 
  },
  roomNumber: { 
    type: String, 
    required: true 
  },
  issueType: { 
    type: String, 
    enum: ['electrical', 'plumbing', 'hvac', 'furniture', 'fixtures', 'electronics', 'structural', 'cleaning', 'safety', 'pest_control', 'other'],
    required: true 
  },
  subCategory: { 
    type: String 
  },
  title: { 
    type: String, 
    required: true,
    trim: true 
  },
  description: { 
    type: String, 
    required: true 
  },
  priority: { 
    type: String, 
    enum: ['low', 'medium', 'high', 'urgent', 'emergency'],
    required: true 
  },
  severity: { 
    type: String, 
    enum: ['minor', 'moderate', 'major', 'critical'],
    required: true 
  },
  status: { 
    type: String, 
    enum: ['reported', 'acknowledged', 'assigned', 'in_progress', 'on_hold', 'completed', 'verified', 'closed', 'cancelled'],
    default: 'reported' 
  },
  workOrderNumber: { 
    type: String, 
    required: true,
    unique: true 
  },
  reportedBy: {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    role: { type: String, enum: ['guest', 'staff', 'housekeeping', 'maintenance', 'manager', 'owner'], required: true },
    contactInfo: { type: String }
  },
  assignedTo: {
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    name: { type: String },
    specialty: { type: String },
    contactInfo: { type: String },
    assignedAt: { type: Date }
  },
  supervisorId: { 
    type: Schema.Types.ObjectId, 
    ref: 'User' 
  },
  reportedAt: { 
    type: Date, 
    default: Date.now 
  },
  acknowledgedAt: { type: Date },
  assignedAt: { type: Date },
  workStartedAt: { type: Date },
  workCompletedAt: { type: Date },
  verifiedAt: { type: Date },
  closedAt: { type: Date },
  scheduling: {
    scheduledDate: { type: Date },
    estimatedDuration: { type: Number, default: 2, min: 0.5 },
    actualDuration: { type: Number, min: 0 },
    preferredTimeSlot: { type: String },
    urgentRepair: { type: Boolean, default: false },
    canWorkAroundGuests: { type: Boolean, default: true },
    requiresRoomEvacuation: { type: Boolean, default: false }
  },
  cost: {
    laborCost: { type: Number, default: 0, min: 0 },
    materialCost: { type: Number, default: 0, min: 0 },
    equipmentCost: { type: Number, default: 0, min: 0 },
    outsourcingCost: { type: Number, default: 0, min: 0 },
    totalCost: { type: Number, default: 0, min: 0 },
    currency: { type: String, default: 'INR' },
    budgetApprovalRequired: { type: Boolean, default: false },
    budgetApprovedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    budgetApprovedAt: { type: Date }
  },
  materialsUsed: [{
    itemName: { type: String, required: true },
    itemCode: { type: String },
    quantity: { type: Number, required: true, min: 1 },
    unit: { type: String, required: true },
    unitCost: { type: Number, required: true, min: 0 },
    totalCost: { type: Number, required: true, min: 0 },
    supplier: { type: String },
    purchaseDate: { type: Date },
    warrantyPeriod: { type: Number, min: 0 }
  }],
  equipmentUsed: [{
    equipmentName: { type: String, required: true },
    equipmentId: { type: String },
    usage: { type: String, required: true },
    condition: { type: String, enum: ['good', 'fair', 'needs_repair', 'damaged'], default: 'good' }
  }],
  workPerformed: [{
    taskDescription: { type: String, required: true },
    performedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    status: { type: String, enum: ['completed', 'partial', 'failed'], required: true },
    notes: { type: String },
    photosBeforeWork: [{ type: String }],
    photosAfterWork: [{ type: String }]
  }],
  qualityCheck: {
    performed: { type: Boolean, default: false },
    performedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    checkDate: { type: Date },
    checklistUsed: { type: Schema.Types.ObjectId, ref: 'MaintenanceChecklist' },
    passed: { type: Boolean, default: true },
    issues: [{ type: String }],
    retestRequired: { type: Boolean, default: false },
    certificationRequired: { type: Boolean, default: false }
  },
  documentation: {
    beforeImages: [{ type: String }],
    afterImages: [{ type: String }],
    receipts: [{ type: String }],
    invoices: [{ type: String }],
    warranties: [{ type: String }],
    technicalSpecs: [{ type: String }],
    videoLinks: [{ type: String }]
  },
  guestImpact: {
    guestPresent: { type: Boolean, default: false },
    guestInformed: { type: Boolean, default: false },
    guestRelocated: { type: Boolean, default: false },
    relocationDetails: {
      newRoomNumber: { type: String },
      compensationOffered: { type: String },
      guestSatisfied: { type: Boolean }
    },
    guestComplaint: { type: Boolean, default: false },
    complaintDetails: { type: String },
    compensationGiven: {
      type: { type: String, enum: ['room_upgrade', 'discount', 'free_service', 'refund', 'voucher'] },
      value: { type: Number, min: 0 },
      description: { type: String }
    }
  },
  followUp: {
    required: { type: Boolean, default: false },
    followUpDate: { type: Date },
    followUpType: { type: String, enum: ['inspection', 'retest', 'preventive_maintenance', 'warranty_check'] },
    followUpAssignedTo: { type: Schema.Types.ObjectId, ref: 'User' },
    followUpNotes: { type: String },
    followUpCompleted: { type: Boolean, default: false },
    followUpCompletedAt: { type: Date }
  },
  preventiveMaintenance: {
    isPreventive: { type: Boolean, default: false },
    maintenanceScheduleId: { type: Schema.Types.ObjectId, ref: 'MaintenanceSchedule' },
    nextScheduledMaintenance: { type: Date },
    recommendedActions: [{ type: String }],
    lifespanEstimate: { type: Number, min: 1 }
  },
  vendorInfo: {
    vendorName: { type: String },
    vendorContact: { type: String },
    vendorId: { type: String },
    serviceType: { type: String },
    warranty: {
      warrantyPeriod: { type: Number, min: 0 },
      warrantyStartDate: { type: Date },
      warrantyDetails: { type: String }
    },
    serviceLevel: { type: String, enum: ['basic', 'standard', 'premium', 'emergency'] },
    responseTime: { type: Number, min: 0 }
  },
  safety: {
    safetyHazard: { type: Boolean, default: false },
    hazardType: [{ type: String }],
    safetyMeasuresTaken: [{ type: String }],
    ppERequired: [{ type: String }],
    incidentReport: { type: Schema.Types.ObjectId, ref: 'IncidentReport' },
    regulatoryCompliance: { type: Boolean, default: true },
    complianceNotes: { type: String }
  },
  recurringIssue: {
    isRecurring: { type: Boolean, default: false },
    previousOccurrences: { type: Number, default: 0, min: 0 },
    lastOccurrence: { type: Date },
    patternIdentified: { type: Boolean, default: false },
    rootCauseAnalysis: { type: String },
    permanentSolutionRequired: { type: Boolean, default: false },
    escalationRequired: { type: Boolean, default: false }
  },
  integrations: {
    pmsTicketId: { type: String },
    fmTicketId: { type: String },
    inventorySystemId: { type: String },
    accountingSystemId: { type: String },
    notificationsSent: [{ type: String }],
    externalReferences: [{ type: String }]
  },
  notes: [{
    noteType: { type: String, enum: ['general', 'technical', 'guest_related', 'cost', 'timeline', 'safety'], required: true },
    note: { type: String, required: true },
    addedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    addedAt: { type: Date, default: Date.now },
    visibility: { type: String, enum: ['public', 'staff_only', 'management_only'], default: 'staff_only' },
    isImportant: { type: Boolean, default: false }
  }],
  satisfaction: {
    guestFeedback: {
      rating: { type: Number, min: 1, max: 5 },
      comments: { type: String },
      wouldRecommend: { type: Boolean }
    },
    internalRating: {
      qualityRating: { type: Number, min: 1, max: 5 },
      timelinessRating: { type: Number, min: 1, max: 5 },
      costEffectivenessRating: { type: Number, min: 1, max: 5 },
      communicationRating: { type: Number, min: 1, max: 5 }
    }
  },
  automation: {
    autoAssigned: { type: Boolean, default: false },
    autoEscalated: { type: Boolean, default: false },
    alertsSent: [{ type: String }],
    remindersSent: { type: Number, default: 0, min: 0 },
    slaBreached: { type: Boolean, default: false },
    slaDeadline: { type: Date }
  },
  metrics: {
    responseTime: { type: Number, default: 0, min: 0 },
    resolutionTime: { type: Number, default: 0, min: 0 },
    firstTimeFixRate: { type: Boolean, default: false },
    customerSatisfactionScore: { type: Number, default: 0, min: 0, max: 10 },
    costPerIssue: { type: Number, default: 0, min: 0 },
    downtimeHours: { type: Number, default: 0, min: 0 }
  },
  isActive: { 
    type: Boolean, 
    default: true 
  },
  isArchived: { 
    type: Boolean, 
    default: false 
  },
  lastModifiedBy: { 
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
RoomMaintenanceSchema.index({ propertyId: 1 });
RoomMaintenanceSchema.index({ roomId: 1 });
RoomMaintenanceSchema.index({ workOrderNumber: 1 });
RoomMaintenanceSchema.index({ status: 1 });
RoomMaintenanceSchema.index({ priority: 1 });
RoomMaintenanceSchema.index({ issueType: 1 });
RoomMaintenanceSchema.index({ reportedAt: 1 });
RoomMaintenanceSchema.index({ 'assignedTo.userId': 1 });

// Compound indexes
RoomMaintenanceSchema.index({ propertyId: 1, status: 1 });
RoomMaintenanceSchema.index({ propertyId: 1, priority: 1 });
RoomMaintenanceSchema.index({ roomId: 1, status: 1 });
RoomMaintenanceSchema.index({ status: 1, priority: 1 });

// Text search index
RoomMaintenanceSchema.index({ 
  title: 'text', 
  description: 'text',
  'notes.note': 'text' 
});

// Pre-save middleware
RoomMaintenanceSchema.pre('save', function(next) {
  // Calculate total cost
  this.cost.totalCost = this.cost.laborCost + this.cost.materialCost + this.cost.equipmentCost + this.cost.outsourcingCost;
  
  // Calculate metrics
  if (this.acknowledgedAt && this.reportedAt) {
    this.metrics.responseTime = (this.acknowledgedAt.getTime() - this.reportedAt.getTime()) / (1000 * 60 * 60);
  }
  
  if (this.workCompletedAt && this.reportedAt) {
    this.metrics.resolutionTime = (this.workCompletedAt.getTime() - this.reportedAt.getTime()) / (1000 * 60 * 60);
  }
  
  this.metrics.costPerIssue = this.cost.totalCost;
  
  next();
});

// Virtuals
RoomMaintenanceSchema.virtual('isOverdue').get(function() {
  if (!this.scheduling.scheduledDate) return false;
  return new Date() > this.scheduling.scheduledDate && !['completed', 'verified', 'closed'].includes(this.status);
});

RoomMaintenanceSchema.virtual('daysOpen').get(function() {
  const now = new Date();
  const reportDate = this.reportedAt;
  return Math.ceil((now.getTime() - reportDate.getTime()) / (1000 * 60 * 60 * 24));
});

// Methods
RoomMaintenanceSchema.methods.assignTechnician = function(userId: string, name: string, specialty: string, contactInfo: string) {
  this.assignedTo = {
    userId,
    name,
    specialty,
    contactInfo,
    assignedAt: new Date()
  };
  this.status = 'assigned';
  this.assignedAt = new Date();
  return this.save();
};

RoomMaintenanceSchema.methods.startWork = function() {
  this.status = 'in_progress';
  this.workStartedAt = new Date();
  return this.save();
};

RoomMaintenanceSchema.methods.completeWork = function() {
  this.status = 'completed';
  this.workCompletedAt = new Date();
  return this.save();
};

// Static methods
RoomMaintenanceSchema.statics.generateWorkOrderNumber = async function() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const date = String(today.getDate()).padStart(2, '0');
  
  const prefix = `WO${year}${month}${date}`;
  
  const lastOrder = await this.findOne({
    workOrderNumber: new RegExp(`^${prefix}`)
  }).sort({ workOrderNumber: -1 });
  
  let sequence = 1;
  if (lastOrder) {
    const lastSequence = parseInt(lastOrder.workOrderNumber.slice(-4));
    sequence = lastSequence + 1;
  }
  
  return `${prefix}${String(sequence).padStart(4, '0')}`;
};

RoomMaintenanceSchema.statics.getActiveIssues = function(propertyId: string) {
  return this.find({
    propertyId,
    status: { $nin: ['completed', 'verified', 'closed', 'cancelled'] },
    isActive: true
  }).sort({ priority: 1, reportedAt: 1 });
};

RoomMaintenanceSchema.statics.getOverdueIssues = function(propertyId: string) {
  return this.find({
    propertyId,
    'scheduling.scheduledDate': { $lt: new Date() },
    status: { $nin: ['completed', 'verified', 'closed', 'cancelled'] },
    isActive: true
  });
};

export default mongoose.models.RoomMaintenance || mongoose.model<IRoomMaintenance>('RoomMaintenance', RoomMaintenanceSchema);