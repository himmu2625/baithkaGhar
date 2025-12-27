import mongoose, { Document, Schema } from 'mongoose';

export interface ISession extends Document {
  userId: mongoose.Types.ObjectId;
  propertyId?: mongoose.Types.ObjectId;
  
  // Session Identification
  sessionId: string;
  token: string;
  refreshToken?: string;
  
  // Session Details
  sessionType: 'web' | 'mobile' | 'api' | 'desktop' | 'cli';
  isActive: boolean;
  isRemembered: boolean;
  isSecure: boolean; // HTTPS/secure connection
  
  // Device & Location
  deviceInfo: {
    deviceId: string;
    deviceName: string;
    deviceType: 'desktop' | 'mobile' | 'tablet' | 'other';
    browser: string;
    browserVersion: string;
    os: string;
    osVersion: string;
    screenResolution?: string;
    timezone: string;
    language: string;
  };
  
  location: {
    ipAddress: string;
    country?: string;
    city?: string;
    region?: string;
    coordinates?: [number, number];
    isp?: string;
    proxy?: boolean;
    vpn?: boolean;
  };
  
  // Session Lifecycle
  startedAt: Date;
  expiresAt: Date;
  lastActivityAt: Date;
  endedAt?: Date;
  
  // Security Features
  securityLevel: 'low' | 'medium' | 'high' | 'critical';
  isSuspicious: boolean;
  suspiciousReasons: string[];
  securityFlags: Array<{
    flag: string;
    timestamp: Date;
    description: string;
    severity: 'info' | 'warning' | 'error' | 'critical';
  }>;
  
  // Activity Tracking
  activityCount: number;
  pageViews: number;
  apiCalls: number;
  actionsPerformed: Array<{
    action: string;
    timestamp: Date;
    resource?: string;
    details?: object;
  }>;
  
  // Performance Metrics
  sessionDuration: number; // in minutes
  avgResponseTime?: number;
  errorCount: number;
  
  // User Agent & Headers
  userAgent: string;
  requestHeaders?: object;
  
  // Session Management
  parentSession?: mongoose.Types.ObjectId; // For session splitting
  childSessions: mongoose.Types.ObjectId[];
  sessionGroup?: string; // For grouping related sessions
  
  // Property-specific Access
  propertyAccess: {
    canView: boolean;
    canEdit: boolean;
    canDelete: boolean;
    canManage: boolean;
    restrictedAreas?: string[];
  };
  
  // Metadata
  tags: string[];
  notes?: string;
  
  createdAt: Date;
  updatedAt: Date;
}

const SessionSchema = new Schema<ISession>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  propertyId: { type: Schema.Types.ObjectId, ref: 'Property' },
  
  // Session Identification
  sessionId: { type: String, required: true, unique: true },
  token: { type: String, required: true, unique: true },
  refreshToken: String,
  
  // Session Details
  sessionType: { type: String, enum: ['web', 'mobile', 'api', 'desktop', 'cli'], required: true },
  isActive: { type: Boolean, default: true },
  isRemembered: { type: Boolean, default: false },
  isSecure: { type: Boolean, default: false },
  
  // Device & Location
  deviceInfo: {
    deviceId: { type: String, required: true },
    deviceName: { type: String, required: true },
    deviceType: { type: String, enum: ['desktop', 'mobile', 'tablet', 'other'], required: true },
    browser: { type: String, required: true },
    browserVersion: { type: String, required: true },
    os: { type: String, required: true },
    osVersion: { type: String, required: true },
    screenResolution: String,
    timezone: { type: String, required: true },
    language: { type: String, required: true }
  },
  
  location: {
    ipAddress: { type: String, required: true },
    country: String,
    city: String,
    region: String,
    coordinates: [Number],
    isp: String,
    proxy: { type: Boolean, default: false },
    vpn: { type: Boolean, default: false }
  },
  
  // Session Lifecycle
  startedAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, required: true },
  lastActivityAt: { type: Date, default: Date.now },
  endedAt: Date,
  
  // Security Features
  securityLevel: { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'medium' },
  isSuspicious: { type: Boolean, default: false },
  suspiciousReasons: [String],
  securityFlags: [{
    flag: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    description: String,
    severity: { type: String, enum: ['info', 'warning', 'error', 'critical'], default: 'info' }
  }],
  
  // Activity Tracking
  activityCount: { type: Number, default: 0 },
  pageViews: { type: Number, default: 0 },
  apiCalls: { type: Number, default: 0 },
  actionsPerformed: [{
    action: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    resource: String,
    details: Schema.Types.Mixed
  }],
  
  // Performance Metrics
  sessionDuration: { type: Number, default: 0 },
  avgResponseTime: Number,
  errorCount: { type: Number, default: 0 },
  
  // User Agent & Headers
  userAgent: { type: String, required: true },
  requestHeaders: Schema.Types.Mixed,
  
  // Session Management
  parentSession: { type: Schema.Types.ObjectId, ref: 'Session' },
  childSessions: [{ type: Schema.Types.ObjectId, ref: 'Session' }],
  sessionGroup: String,
  
  // Property-specific Access
  propertyAccess: {
    canView: { type: Boolean, default: true },
    canEdit: { type: Boolean, default: false },
    canDelete: { type: Boolean, default: false },
    canManage: { type: Boolean, default: false },
    restrictedAreas: [String]
  },
  
  // Metadata
  tags: [String],
  notes: String,
  
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

// Indexes
SessionSchema.index({ userId: 1, isActive: 1 });
SessionSchema.index({ propertyId: 1, isActive: 1 });
SessionSchema.index({ sessionId: 1 }, { unique: true });
SessionSchema.index({ token: 1 }, { unique: true });
SessionSchema.index({ refreshToken: 1 });
SessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index for automatic session cleanup
SessionSchema.index({ lastActivityAt: -1 });
SessionSchema.index({ 'location.ipAddress': 1 });
SessionSchema.index({ sessionType: 1 });
SessionSchema.index({ isSuspicious: 1 });
SessionSchema.index({ securityLevel: 1 });
SessionSchema.index({ sessionGroup: 1 });

// Virtual for session age in minutes
SessionSchema.virtual('sessionAge').get(function() {
  return Math.floor((Date.now() - this.startedAt.getTime()) / (1000 * 60));
});

// Virtual for time until expiry in minutes
SessionSchema.virtual('timeUntilExpiry').get(function() {
  return Math.floor((this.expiresAt.getTime() - Date.now()) / (1000 * 60));
});

// Virtual for is expired
SessionSchema.virtual('isExpired').get(function() {
  return new Date() > this.expiresAt;
});

// Virtual for is idle (no activity for 30 minutes)
SessionSchema.virtual('isIdle').get(function() {
  const idleThreshold = 30 * 60 * 1000; // 30 minutes
  return (Date.now() - this.lastActivityAt.getTime()) > idleThreshold;
});

// Virtual for session health score
SessionSchema.virtual('healthScore').get(function() {
  let score = 100;
  
  if (this.isSuspicious) score -= 30;
  if (this.errorCount > 5) score -= 20;
  if (this.securityLevel === 'critical') score -= 25;
  
  // Check if session is idle (no activity for 30 minutes)
  const idleThreshold = 30 * 60 * 1000; // 30 minutes
  const isIdle = (Date.now() - this.lastActivityAt.getTime()) > idleThreshold;
  if (isIdle) score -= 10;
  
  if (!this.isSecure) score -= 15;
  
  return Math.max(0, score);
});

// Virtual for property access level
SessionSchema.virtual('accessLevel').get(function() {
  const access = this.propertyAccess;
  if (access.canManage) return 'admin';
  if (access.canEdit) return 'editor';
  if (access.canView) return 'viewer';
  return 'none';
});

// Methods
SessionSchema.methods.updateActivity = function(action?: string, resource?: string, details?: object) {
  this.lastActivityAt = new Date();
  this.activityCount += 1;
  this.sessionDuration = Math.floor((Date.now() - this.startedAt.getTime()) / (1000 * 60));
  
  if (action) {
    this.actionsPerformed.push({
      action,
      timestamp: new Date(),
      resource,
      details
    });
    
    // Keep only last 100 actions
    if (this.actionsPerformed.length > 100) {
      this.actionsPerformed = this.actionsPerformed.slice(-100);
    }
  }
};

SessionSchema.methods.addSecurityFlag = function(flag: string, description?: string, severity: 'info' | 'warning' | 'error' | 'critical' = 'info') {
  this.securityFlags.push({
    flag,
    timestamp: new Date(),
    description: description || flag,
    severity
  });
};

SessionSchema.methods.markSuspicious = function(reason: string) {
  this.isSuspicious = true;
  if (!this.suspiciousReasons.includes(reason)) {
    this.suspiciousReasons.push(reason);
  }
};

SessionSchema.methods.extendSession = function(additionalMinutes: number) {
  this.expiresAt = new Date(this.expiresAt.getTime() + additionalMinutes * 60 * 1000);
};

SessionSchema.methods.endSession = function(reason?: string) {
  this.isActive = false;
  this.endedAt = new Date();
  if (reason) {
    this.notes = `${this.notes || ''}\nSession ended: ${reason}`;
  }
};

SessionSchema.methods.canAccessProperty = function(propertyId: mongoose.Types.ObjectId, action: 'view' | 'edit' | 'delete' | 'manage'): boolean {
  if (this.propertyId && !this.propertyId.equals(propertyId)) return false;
  
  switch (action) {
    case 'view': return this.propertyAccess.canView;
    case 'edit': return this.propertyAccess.canEdit;
    case 'delete': return this.propertyAccess.canDelete;
    case 'manage': return this.propertyAccess.canManage;
    default: return false;
  }
};

// Static methods
SessionSchema.statics.findByUser = function(userId: string, activeOnly: boolean = true) {
  const query: any = { userId: new mongoose.Types.ObjectId(userId) };
  if (activeOnly) {
    query.isActive = true;
    query.expiresAt = { $gt: new Date() };
  }
  return this.find(query).sort({ lastActivityAt: -1 });
};

SessionSchema.statics.findByProperty = function(propertyId: string, activeOnly: boolean = true) {
  const query: any = { propertyId: new mongoose.Types.ObjectId(propertyId) };
  if (activeOnly) {
    query.isActive = true;
    query.expiresAt = { $gt: new Date() };
  }
  return this.find(query).sort({ lastActivityAt: -1 });
};

SessionSchema.statics.findByToken = function(token: string) {
  return this.findOne({ token, isActive: true, expiresAt: { $gt: new Date() } });
};

SessionSchema.statics.findBySessionId = function(sessionId: string) {
  return this.findOne({ sessionId, isActive: true, expiresAt: { $gt: new Date() } });
};

SessionSchema.statics.findActiveSessions = function() {
  return this.find({ isActive: true, expiresAt: { $gt: new Date() } });
};

SessionSchema.statics.findSuspiciousSessions = function() {
  return this.find({ isSuspicious: true, isActive: true });
};

SessionSchema.statics.cleanupExpiredSessions = function() {
  return this.updateMany(
    { expiresAt: { $lt: new Date() }, isActive: true },
    { isActive: false, endedAt: new Date() }
  );
};

SessionSchema.statics.getSessionAnalytics = function(startDate: Date, endDate: Date) {
  return this.aggregate([
    { $match: { startedAt: { $gte: startDate, $lte: endDate } } },
    { $group: {
      _id: '$sessionType',
      totalSessions: { $sum: 1 },
      avgSessionDuration: { $avg: '$sessionDuration' },
      avgActivityCount: { $avg: '$activityCount' },
      suspiciousSessions: { $sum: { $cond: ['$isSuspicious', 1, 0] } },
      avgHealthScore: { $avg: '$healthScore' }
    }}
  ]);
};

export default mongoose.models.Session || mongoose.model<ISession>('Session', SessionSchema); 