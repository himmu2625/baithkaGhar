import mongoose, { Document, Schema } from 'mongoose';

export interface ISecurityEvent extends Document {
  eventId: string;
  userId?: mongoose.Types.ObjectId;
  sessionId?: mongoose.Types.ObjectId;
  
  // Event Classification
  eventType: 'authentication' | 'authorization' | 'data_access' | 'system_change' | 'security_incident' | 'compliance' | 'audit';
  eventCategory: 'login' | 'logout' | 'password_change' | 'permission_change' | 'data_export' | 'data_import' | 'system_config' | 'suspicious_activity' | 'breach_attempt' | 'compliance_violation';
  severity: 'low' | 'medium' | 'high' | 'critical';
  
  // Event Details
  title: string;
  description: string;
  details: object;
  
  // Source Information
  source: {
    ipAddress: string;
    userAgent: string;
    location?: {
      country?: string;
      city?: string;
      coordinates?: [number, number];
    };
    deviceInfo?: {
      deviceType: string;
      browser: string;
      os: string;
    };
  };
  
  // Target Information
  target: {
    resource?: string;
    resourceId?: mongoose.Types.ObjectId;
    action?: string;
    method?: string;
    url?: string;
  };
  
  // Risk Assessment
  riskScore: number; // 0-100
  riskFactors: string[];
  threatLevel: 'none' | 'low' | 'medium' | 'high' | 'critical';
  isThreat: boolean;
  threatType?: string;
  
  // Response Information
  status: 'open' | 'investigating' | 'resolved' | 'false_positive' | 'escalated';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assignedTo?: mongoose.Types.ObjectId;
  
  // Investigation
  investigationNotes: Array<{
    note: string;
    timestamp: Date;
    investigator: mongoose.Types.ObjectId;
  }>;
  
  // Actions Taken
  actionsTaken: Array<{
    action: string;
    timestamp: Date;
    performedBy: mongoose.Types.ObjectId;
    details?: object;
  }>;
  
  // Compliance & Reporting
  complianceRelevant: boolean;
  complianceCategory?: string;
  reportable: boolean;
  reportedTo?: string[];
  
  // Related Events
  relatedEvents: mongoose.Types.ObjectId[];
  parentEvent?: mongoose.Types.ObjectId;
  childEvents: mongoose.Types.ObjectId[];
  
  // Timestamps
  detectedAt: Date;
  occurredAt: Date;
  resolvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const SecurityEventSchema = new Schema<ISecurityEvent>({
  eventId: { type: String, required: true, unique: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User' },
  sessionId: { type: Schema.Types.ObjectId, ref: 'UserSession' },
  
  // Event Classification
  eventType: { type: String, enum: ['authentication', 'authorization', 'data_access', 'system_change', 'security_incident', 'compliance', 'audit'], required: true },
  eventCategory: { type: String, enum: ['login', 'logout', 'password_change', 'permission_change', 'data_export', 'data_import', 'system_config', 'suspicious_activity', 'breach_attempt', 'compliance_violation'], required: true },
  severity: { type: String, enum: ['low', 'medium', 'high', 'critical'], required: true },
  
  // Event Details
  title: { type: String, required: true },
  description: { type: String, required: true },
  details: { type: Schema.Types.Mixed, required: true },
  
  // Source Information
  source: {
    ipAddress: { type: String, required: true },
    userAgent: { type: String, required: true },
    location: {
      country: String,
      city: String,
      coordinates: [Number]
    },
    deviceInfo: {
      deviceType: String,
      browser: String,
      os: String
    }
  },
  
  // Target Information
  target: {
    resource: String,
    resourceId: { type: Schema.Types.ObjectId },
    action: String,
    method: String,
    url: String
  },
  
  // Risk Assessment
  riskScore: { type: Number, min: 0, max: 100, default: 0 },
  riskFactors: [String],
  threatLevel: { type: String, enum: ['none', 'low', 'medium', 'high', 'critical'], default: 'none' },
  isThreat: { type: Boolean, default: false },
  threatType: String,
  
  // Response Information
  status: { type: String, enum: ['open', 'investigating', 'resolved', 'false_positive', 'escalated'], default: 'open' },
  priority: { type: String, enum: ['low', 'medium', 'high', 'urgent'], default: 'medium' },
  assignedTo: { type: Schema.Types.ObjectId, ref: 'User' },
  
  // Investigation
  investigationNotes: [{
    note: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    investigator: { type: Schema.Types.ObjectId, ref: 'User', required: true }
  }],
  
  // Actions Taken
  actionsTaken: [{
    action: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    performedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    details: Schema.Types.Mixed
  }],
  
  // Compliance & Reporting
  complianceRelevant: { type: Boolean, default: false },
  complianceCategory: String,
  reportable: { type: Boolean, default: false },
  reportedTo: [String],
  
  // Related Events
  relatedEvents: [{ type: Schema.Types.ObjectId, ref: 'SecurityEvent' }],
  parentEvent: { type: Schema.Types.ObjectId, ref: 'SecurityEvent' },
  childEvents: [{ type: Schema.Types.ObjectId, ref: 'SecurityEvent' }],
  
  // Timestamps
  detectedAt: { type: Date, default: Date.now },
  occurredAt: { type: Date, required: true },
  resolvedAt: Date,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

// Indexes
SecurityEventSchema.index({ eventId: 1 }, { unique: true });
SecurityEventSchema.index({ userId: 1, occurredAt: -1 });
SecurityEventSchema.index({ eventType: 1, eventCategory: 1 });
SecurityEventSchema.index({ severity: 1, occurredAt: -1 });
SecurityEventSchema.index({ status: 1, priority: 1 });
SecurityEventSchema.index({ isThreat: 1, threatLevel: 1 });
SecurityEventSchema.index({ 'source.ipAddress': 1 });
SecurityEventSchema.index({ complianceRelevant: 1 });
SecurityEventSchema.index({ occurredAt: -1 });

// Virtual for event age in minutes
SecurityEventSchema.virtual('eventAge').get(function() {
  return Math.floor((Date.now() - this.occurredAt.getTime()) / (1000 * 60));
});

// Virtual for is recent (within last hour)
SecurityEventSchema.virtual('isRecent').get(function() {
  const eventAge = Math.floor((Date.now() - this.occurredAt.getTime()) / (1000 * 60));
  return eventAge < 60;
});

// Virtual for is high priority
SecurityEventSchema.virtual('isHighPriority').get(function() {
  return this.priority === 'high' || this.priority === 'urgent';
});

// Virtual for is critical
SecurityEventSchema.virtual('isCritical').get(function() {
  return this.severity === 'critical' || this.threatLevel === 'critical';
});

// Virtual for is resolved
SecurityEventSchema.virtual('isResolved').get(function() {
  return this.status === 'resolved' || this.status === 'false_positive';
});

// Methods
SecurityEventSchema.methods.addInvestigationNote = function(note: string, investigator: mongoose.Types.ObjectId) {
  this.investigationNotes.push({
    note,
    timestamp: new Date(),
    investigator
  });
};

SecurityEventSchema.methods.addActionTaken = function(action: string, performedBy: mongoose.Types.ObjectId, details?: object) {
  this.actionsTaken.push({
    action,
    timestamp: new Date(),
    performedBy,
    details
  });
};

SecurityEventSchema.methods.calculateRiskScore = function() {
  let score = 0;
  
  // Base score based on severity
  switch (this.severity) {
    case 'low': score += 10; break;
    case 'medium': score += 30; break;
    case 'high': score += 60; break;
    case 'critical': score += 90; break;
  }
  
  // Add risk factors
  this.riskFactors.forEach((factor: string) => {
    if (factor.includes('suspicious')) score += 15;
    if (factor.includes('breach')) score += 25;
    if (factor.includes('unauthorized')) score += 20;
    if (factor.includes('multiple_failures')) score += 10;
  });
  
  // Threat level adjustment
  switch (this.threatLevel) {
    case 'low': score += 5; break;
    case 'medium': score += 15; break;
    case 'high': score += 30; break;
    case 'critical': score += 50; break;
  }
  
  this.riskScore = Math.min(100, score);
};

SecurityEventSchema.methods.resolve = function(resolution: string, resolvedBy: mongoose.Types.ObjectId) {
  this.status = 'resolved';
  this.resolvedAt = new Date();
  this.addActionTaken(`Resolved: ${resolution}`, resolvedBy);
};

SecurityEventSchema.methods.escalate = function(reason: string, escalatedBy: mongoose.Types.ObjectId) {
  this.status = 'escalated';
  this.priority = 'urgent';
  this.addActionTaken(`Escalated: ${reason}`, escalatedBy);
};

// Static methods
SecurityEventSchema.statics.findByUser = function(userId: string, startDate: Date, endDate: Date) {
  return this.find({
    userId: new mongoose.Types.ObjectId(userId),
    occurredAt: { $gte: startDate, $lte: endDate }
  }).sort({ occurredAt: -1 });
};

SecurityEventSchema.statics.findBySeverity = function(severity: string) {
  return this.find({ severity, status: { $ne: 'resolved' } }).sort({ occurredAt: -1 });
};

SecurityEventSchema.statics.findThreats = function() {
  return this.find({ isThreat: true, status: { $ne: 'resolved' } }).sort({ occurredAt: -1 });
};

SecurityEventSchema.statics.findOpenEvents = function() {
  return this.find({ status: { $in: ['open', 'investigating'] } }).sort({ priority: -1, occurredAt: -1 });
};

SecurityEventSchema.statics.findComplianceEvents = function(startDate: Date, endDate: Date) {
  return this.find({
    complianceRelevant: true,
    occurredAt: { $gte: startDate, $lte: endDate }
  }).sort({ occurredAt: -1 });
};

SecurityEventSchema.statics.getSecurityAnalytics = function(startDate: Date, endDate: Date) {
  return this.aggregate([
    { $match: { occurredAt: { $gte: startDate, $lte: endDate } } },
    { $group: {
      _id: {
        eventType: '$eventType',
        severity: '$severity',
        status: '$status'
      },
      count: { $sum: 1 },
      avgRiskScore: { $avg: '$riskScore' },
      threats: { $sum: { $cond: ['$isThreat', 1, 0] } },
      avgResolutionTime: { $avg: { $subtract: ['$resolvedAt', '$occurredAt'] } }
    }},
    { $sort: { count: -1 } }
  ]);
};

export default mongoose.models.SecurityEvent || mongoose.model<ISecurityEvent>('SecurityEvent', SecurityEventSchema); 