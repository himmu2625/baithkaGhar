import mongoose, { Document, Schema } from 'mongoose';

export interface IUserSession extends Document {
  userId: mongoose.Types.ObjectId;
  sessionToken: string;
  refreshToken?: string;
  
  // Session Details
  sessionType: 'web' | 'mobile' | 'api' | 'desktop' | 'cli';
  isActive: boolean;
  isRemembered: boolean;
  
  // Device Information
  deviceInfo: {
    deviceId: string;
    deviceName: string;
    deviceType: 'desktop' | 'mobile' | 'tablet' | 'other';
    browser: string;
    browserVersion: string;
    os: string;
    osVersion: string;
    screenResolution?: string;
    colorDepth?: number;
    timezone: string;
    language: string;
  };
  
  // Location Information
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
  
  // Metadata
  tags: string[];
  notes?: string;
  
  createdAt: Date;
  updatedAt: Date;
}

const UserSessionSchema = new Schema<IUserSession>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  sessionToken: { type: String, required: true, unique: true },
  refreshToken: String,
  
  // Session Details
  sessionType: { type: String, enum: ['web', 'mobile', 'api', 'desktop', 'cli'], required: true },
  isActive: { type: Boolean, default: true },
  isRemembered: { type: Boolean, default: false },
  
  // Device Information
  deviceInfo: {
    deviceId: { type: String, required: true },
    deviceName: { type: String, required: true },
    deviceType: { type: String, enum: ['desktop', 'mobile', 'tablet', 'other'], required: true },
    browser: { type: String, required: true },
    browserVersion: { type: String, required: true },
    os: { type: String, required: true },
    osVersion: { type: String, required: true },
    screenResolution: String,
    colorDepth: Number,
    timezone: { type: String, required: true },
    language: { type: String, required: true }
  },
  
  // Location Information
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
  parentSession: { type: Schema.Types.ObjectId, ref: 'UserSession' },
  childSessions: [{ type: Schema.Types.ObjectId, ref: 'UserSession' }],
  sessionGroup: String,
  
  // Metadata
  tags: [String],
  notes: String,
  
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

// Indexes
UserSessionSchema.index({ userId: 1, isActive: 1 });
UserSessionSchema.index({ sessionToken: 1 }, { unique: true });
UserSessionSchema.index({ refreshToken: 1 });
UserSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index for automatic session cleanup
UserSessionSchema.index({ lastActivityAt: -1 });
UserSessionSchema.index({ 'location.ipAddress': 1 });
UserSessionSchema.index({ sessionType: 1 });
UserSessionSchema.index({ isSuspicious: 1 });
UserSessionSchema.index({ securityLevel: 1 });
UserSessionSchema.index({ sessionGroup: 1 });

// Virtual for session age in minutes
UserSessionSchema.virtual('sessionAge').get(function() {
  return Math.floor((Date.now() - this.startedAt.getTime()) / (1000 * 60));
});

// Virtual for time until expiry in minutes
UserSessionSchema.virtual('timeUntilExpiry').get(function() {
  return Math.floor((this.expiresAt.getTime() - Date.now()) / (1000 * 60));
});

// Virtual for is expired
UserSessionSchema.virtual('isExpired').get(function() {
  return new Date() > this.expiresAt;
});

// Virtual for is idle (no activity for 30 minutes)
UserSessionSchema.virtual('isIdle').get(function() {
  const idleThreshold = 30 * 60 * 1000; // 30 minutes
  return (Date.now() - this.lastActivityAt.getTime()) > idleThreshold;
});

// Virtual for session health score
UserSessionSchema.virtual('healthScore').get(function() {
  let score = 100;
  
  if (this.isSuspicious) score -= 30;
  if (this.errorCount > 5) score -= 20;
  if (this.securityLevel === 'critical') score -= 25;
  
  // Check if session is idle (no activity for 30 minutes)
  const idleThreshold = 30 * 60 * 1000; // 30 minutes
  const isIdle = (Date.now() - this.lastActivityAt.getTime()) > idleThreshold;
  if (isIdle) score -= 10;
  
  return Math.max(0, score);
});

// Methods
UserSessionSchema.methods.updateActivity = function(action?: string, resource?: string, details?: object) {
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

UserSessionSchema.methods.addSecurityFlag = function(flag: string, description?: string, severity: 'info' | 'warning' | 'error' | 'critical' = 'info') {
  this.securityFlags.push({
    flag,
    timestamp: new Date(),
    description: description || flag,
    severity
  });
};

UserSessionSchema.methods.markSuspicious = function(reason: string) {
  this.isSuspicious = true;
  if (!this.suspiciousReasons.includes(reason)) {
    this.suspiciousReasons.push(reason);
  }
};

UserSessionSchema.methods.extendSession = function(additionalMinutes: number) {
  this.expiresAt = new Date(this.expiresAt.getTime() + additionalMinutes * 60 * 1000);
};

UserSessionSchema.methods.endSession = function(reason?: string) {
  this.isActive = false;
  this.endedAt = new Date();
  if (reason) {
    this.notes = `${this.notes || ''}\nSession ended: ${reason}`;
  }
};

// Static methods
UserSessionSchema.statics.findByUser = function(userId: string, activeOnly: boolean = true) {
  const query: any = { userId: new mongoose.Types.ObjectId(userId) };
  if (activeOnly) {
    query.isActive = true;
    query.expiresAt = { $gt: new Date() };
  }
  return this.find(query).sort({ lastActivityAt: -1 });
};

UserSessionSchema.statics.findByToken = function(sessionToken: string) {
  return this.findOne({ sessionToken, isActive: true, expiresAt: { $gt: new Date() } });
};

UserSessionSchema.statics.findActiveSessions = function() {
  return this.find({ isActive: true, expiresAt: { $gt: new Date() } });
};

UserSessionSchema.statics.findSuspiciousSessions = function() {
  return this.find({ isSuspicious: true, isActive: true });
};

UserSessionSchema.statics.cleanupExpiredSessions = function() {
  return this.updateMany(
    { expiresAt: { $lt: new Date() }, isActive: true },
    { isActive: false, endedAt: new Date() }
  );
};

UserSessionSchema.statics.getSessionAnalytics = function(startDate: Date, endDate: Date) {
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

export default mongoose.models.UserSession || mongoose.model<IUserSession>('UserSession', UserSessionSchema); 