import mongoose, { Document, Schema } from 'mongoose';

export interface IAccessLog extends Document {
  userId: mongoose.Types.ObjectId;
  propertyId?: mongoose.Types.ObjectId;
  action: string;
  resource: string;
  resourceId?: mongoose.Types.ObjectId;
  
  // Access Details
  accessType: 'read' | 'write' | 'delete' | 'create' | 'update' | 'login' | 'logout' | 'export' | 'import';
  accessLevel: 'public' | 'user' | 'admin' | 'super_admin';
  accessMethod: 'web' | 'api' | 'mobile' | 'desktop' | 'cli';
  
  // Request Information
  requestMethod: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  requestUrl: string;
  requestHeaders?: object;
  requestBody?: object;
  requestParams?: object;
  
  // Response Information
  responseStatus: number;
  responseTime: number; // in milliseconds
  responseSize?: number; // in bytes
  
  // User Context
  userAgent: string;
  ipAddress: string;
  location?: {
    country?: string;
    city?: string;
    coordinates?: [number, number];
    timezone?: string;
  };
  
  // Session Information
  sessionId?: string;
  sessionToken?: string;
  deviceInfo?: {
    deviceId: string;
    deviceName: string;
    deviceType: 'desktop' | 'mobile' | 'tablet' | 'other';
    browser: string;
    browserVersion: string;
    os: string;
    osVersion: string;
  };
  
  // Security & Risk Assessment
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  riskFactors: string[];
  isSuspicious: boolean;
  suspiciousReasons: string[];
  securityFlags: Array<{
    flag: string;
    timestamp: Date;
    description: string;
    severity: 'info' | 'warning' | 'error' | 'critical';
  }>;
  
  // Performance Metrics
  databaseQueries?: number;
  databaseQueryTime?: number;
  memoryUsage?: number;
  cpuUsage?: number;
  
  // Business Context
  businessImpact: 'none' | 'low' | 'medium' | 'high' | 'critical';
  dataSensitivity: 'public' | 'internal' | 'confidential' | 'restricted';
  complianceRelevant: boolean;
  complianceCategory?: string;
  
  // Error Information
  errorOccurred: boolean;
  errorMessage?: string;
  errorStack?: string;
  errorCode?: string;
  
  // Metadata
  tags: string[];
  notes?: string;
  relatedLogs: mongoose.Types.ObjectId[];
  
  // Timestamps
  timestamp: Date;
  createdAt: Date;
  updatedAt: Date;
}

const AccessLogSchema = new Schema<IAccessLog>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  propertyId: { type: Schema.Types.ObjectId, ref: 'Property' },
  action: { type: String, required: true, trim: true },
  resource: { type: String, required: true, trim: true },
  resourceId: { type: Schema.Types.ObjectId },
  
  // Access Details
  accessType: { type: String, enum: ['read', 'write', 'delete', 'create', 'update', 'login', 'logout', 'export', 'import'], required: true },
  accessLevel: { type: String, enum: ['public', 'user', 'admin', 'super_admin'], required: true },
  accessMethod: { type: String, enum: ['web', 'api', 'mobile', 'desktop', 'cli'], required: true },
  
  // Request Information
  requestMethod: { type: String, enum: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'], required: true },
  requestUrl: { type: String, required: true },
  requestHeaders: Schema.Types.Mixed,
  requestBody: Schema.Types.Mixed,
  requestParams: Schema.Types.Mixed,
  
  // Response Information
  responseStatus: { type: Number, required: true },
  responseTime: { type: Number, required: true },
  responseSize: Number,
  
  // User Context
  userAgent: { type: String, required: true },
  ipAddress: { type: String, required: true },
  location: {
    country: String,
    city: String,
    coordinates: [Number],
    timezone: String
  },
  
  // Session Information
  sessionId: String,
  sessionToken: String,
  deviceInfo: {
    deviceId: String,
    deviceName: String,
    deviceType: { type: String, enum: ['desktop', 'mobile', 'tablet', 'other'] },
    browser: String,
    browserVersion: String,
    os: String,
    osVersion: String
  },
  
  // Security & Risk Assessment
  riskLevel: { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'low' },
  riskFactors: [String],
  isSuspicious: { type: Boolean, default: false },
  suspiciousReasons: [String],
  securityFlags: [{
    flag: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    description: String,
    severity: { type: String, enum: ['info', 'warning', 'error', 'critical'], default: 'info' }
  }],
  
  // Performance Metrics
  databaseQueries: Number,
  databaseQueryTime: Number,
  memoryUsage: Number,
  cpuUsage: Number,
  
  // Business Context
  businessImpact: { type: String, enum: ['none', 'low', 'medium', 'high', 'critical'], default: 'none' },
  dataSensitivity: { type: String, enum: ['public', 'internal', 'confidential', 'restricted'], default: 'internal' },
  complianceRelevant: { type: Boolean, default: false },
  complianceCategory: String,
  
  // Error Information
  errorOccurred: { type: Boolean, default: false },
  errorMessage: String,
  errorStack: String,
  errorCode: String,
  
  // Metadata
  tags: [String],
  notes: String,
  relatedLogs: [{ type: Schema.Types.ObjectId, ref: 'AccessLog' }],
  
  // Timestamps
  timestamp: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

// Indexes
AccessLogSchema.index({ userId: 1, timestamp: -1 });
AccessLogSchema.index({ propertyId: 1, timestamp: -1 });
AccessLogSchema.index({ action: 1, timestamp: -1 });
AccessLogSchema.index({ accessType: 1, timestamp: -1 });
AccessLogSchema.index({ accessLevel: 1, timestamp: -1 });
AccessLogSchema.index({ ipAddress: 1, timestamp: -1 });
AccessLogSchema.index({ sessionId: 1, timestamp: -1 });
AccessLogSchema.index({ riskLevel: 1, timestamp: -1 });
AccessLogSchema.index({ isSuspicious: 1, timestamp: -1 });
AccessLogSchema.index({ errorOccurred: 1, timestamp: -1 });
AccessLogSchema.index({ responseStatus: 1, timestamp: -1 });
AccessLogSchema.index({ businessImpact: 1, timestamp: -1 });
AccessLogSchema.index({ dataSensitivity: 1, timestamp: -1 });
AccessLogSchema.index({ complianceRelevant: 1, timestamp: -1 });
AccessLogSchema.index({ tags: 1, timestamp: -1 });

// Virtual for log age in minutes
AccessLogSchema.virtual('logAge').get(function() {
  return Math.floor((Date.now() - this.timestamp.getTime()) / (1000 * 60));
});

// Virtual for is recent (within last hour)
AccessLogSchema.virtual('isRecent').get(function() {
  const logAge = Math.floor((Date.now() - this.timestamp.getTime()) / (1000 * 60));
  return logAge < 60;
});

// Virtual for is high risk
AccessLogSchema.virtual('isHighRisk').get(function() {
  return this.riskLevel === 'high' || this.riskLevel === 'critical';
});

// Virtual for is successful
AccessLogSchema.virtual('isSuccessful').get(function() {
  return this.responseStatus >= 200 && this.responseStatus < 300;
});

// Virtual for is error
AccessLogSchema.virtual('isError').get(function() {
  return this.responseStatus >= 400 || this.errorOccurred;
});

// Methods
AccessLogSchema.methods.addSecurityFlag = function(flag: string, description?: string, severity: 'info' | 'warning' | 'error' | 'critical' = 'info') {
  this.securityFlags.push({
    flag,
    timestamp: new Date(),
    description: description || flag,
    severity
  });
};

AccessLogSchema.methods.markSuspicious = function(reason: string) {
  this.isSuspicious = true;
  if (!this.suspiciousReasons.includes(reason)) {
    this.suspiciousReasons.push(reason);
  }
};

AccessLogSchema.methods.addRiskFactor = function(factor: string) {
  if (!this.riskFactors.includes(factor)) {
    this.riskFactors.push(factor);
  }
};

AccessLogSchema.methods.calculateRiskLevel = function() {
  let riskScore = 0;
  
  // High risk factors
  if (this.accessType === 'delete') riskScore += 3;
  if (this.accessLevel === 'super_admin') riskScore += 2;
  if (this.isSuspicious) riskScore += 3;
  if (this.errorOccurred) riskScore += 1;
  if (this.businessImpact === 'high' || this.businessImpact === 'critical') riskScore += 2;
  if (this.dataSensitivity === 'confidential' || this.dataSensitivity === 'restricted') riskScore += 2;
  
  // Medium risk factors
  if (this.accessType === 'write' || this.accessType === 'update') riskScore += 1;
  if (this.accessLevel === 'admin') riskScore += 1;
  if (this.responseStatus >= 400) riskScore += 1;
  
  // Determine risk level
  if (riskScore >= 6) this.riskLevel = 'critical';
  else if (riskScore >= 4) this.riskLevel = 'high';
  else if (riskScore >= 2) this.riskLevel = 'medium';
  else this.riskLevel = 'low';
};

// Static methods
AccessLogSchema.statics.findByUser = function(userId: string, startDate: Date, endDate: Date) {
  return this.find({
    userId: new mongoose.Types.ObjectId(userId),
    timestamp: { $gte: startDate, $lte: endDate }
  }).sort({ timestamp: -1 });
};

AccessLogSchema.statics.findByProperty = function(propertyId: string, startDate: Date, endDate: Date) {
  return this.find({
    propertyId: new mongoose.Types.ObjectId(propertyId),
    timestamp: { $gte: startDate, $lte: endDate }
  }).sort({ timestamp: -1 });
};

AccessLogSchema.statics.findSuspiciousActivity = function(startDate: Date, endDate: Date) {
  return this.find({
    isSuspicious: true,
    timestamp: { $gte: startDate, $lte: endDate }
  }).sort({ timestamp: -1 });
};

AccessLogSchema.statics.findHighRiskActivity = function(startDate: Date, endDate: Date) {
  return this.find({
    riskLevel: { $in: ['high', 'critical'] },
    timestamp: { $gte: startDate, $lte: endDate }
  }).sort({ timestamp: -1 });
};

AccessLogSchema.statics.findErrors = function(startDate: Date, endDate: Date) {
  return this.find({
    $or: [
      { errorOccurred: true },
      { responseStatus: { $gte: 400 } }
    ],
    timestamp: { $gte: startDate, $lte: endDate }
  }).sort({ timestamp: -1 });
};

AccessLogSchema.statics.getAccessAnalytics = function(startDate: Date, endDate: Date) {
  return this.aggregate([
    { $match: { timestamp: { $gte: startDate, $lte: endDate } } },
    { $group: {
      _id: {
        accessType: '$accessType',
        accessLevel: '$accessLevel',
        riskLevel: '$riskLevel'
      },
      count: { $sum: 1 },
      avgResponseTime: { $avg: '$responseTime' },
      errorCount: { $sum: { $cond: ['$errorOccurred', 1, 0] } },
      suspiciousCount: { $sum: { $cond: ['$isSuspicious', 1, 0] } }
    }},
    { $sort: { count: -1 } }
  ]);
};

AccessLogSchema.statics.getSecurityAnalytics = function(startDate: Date, endDate: Date) {
  return this.aggregate([
    { $match: { timestamp: { $gte: startDate, $lte: endDate } } },
    { $group: {
      _id: null,
      totalLogs: { $sum: 1 },
      suspiciousLogs: { $sum: { $cond: ['$isSuspicious', 1, 0] } },
      highRiskLogs: { $sum: { $cond: [{ $in: ['$riskLevel', ['high', 'critical']] }, 1, 0] } },
      errorLogs: { $sum: { $cond: ['$errorOccurred', 1, 0] } },
      avgResponseTime: { $avg: '$responseTime' },
      uniqueUsers: { $addToSet: '$userId' },
      uniqueIPs: { $addToSet: '$ipAddress' }
    }},
    { $project: {
      totalLogs: 1,
      suspiciousLogs: 1,
      highRiskLogs: 1,
      errorLogs: 1,
      avgResponseTime: 1,
      uniqueUserCount: { $size: '$uniqueUsers' },
      uniqueIPCount: { $size: '$uniqueIPs' }
    }}
  ]);
};

export default mongoose.models.AccessLog || mongoose.model<IAccessLog>('AccessLog', AccessLogSchema); 