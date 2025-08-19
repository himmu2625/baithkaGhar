import mongoose, { Document, Schema } from 'mongoose';

export interface ILoginAttempt extends Document {
  // Basic Information
  username: string;
  email?: string;
  userId?: mongoose.Types.ObjectId;
  propertyId?: mongoose.Types.ObjectId;
  
  // Attempt Details
  attemptType: 'login' | 'logout' | 'password_reset' | 'account_unlock' | 'two_factor';
  success: boolean;
  failureReason?: string;
  
  // Source Information
  ipAddress: string;
  userAgent: string;
  deviceInfo: {
    deviceId: string;
    deviceName: string;
    deviceType: 'desktop' | 'mobile' | 'tablet' | 'other';
    browser: string;
    browserVersion: string;
    os: string;
    osVersion: string;
  };
  
  location: {
    country?: string;
    city?: string;
    region?: string;
    coordinates?: [number, number];
    isp?: string;
    proxy?: boolean;
    vpn?: boolean;
  };
  
  // Security Assessment
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
  
  // Authentication Details
  authMethod: 'password' | 'two_factor' | 'sso' | 'magic_link' | 'biometric';
  twoFactorMethod?: 'sms' | 'email' | 'authenticator' | 'hardware_key';
  sessionToken?: string;
  
  // Performance Metrics
  responseTime: number; // in milliseconds
  serverLoad?: number;
  databaseQueries?: number;
  
  // Additional Context
  referrer?: string;
  requestHeaders?: object;
  requestBody?: object;
  
  // Error Information
  errorCode?: string;
  errorMessage?: string;
  errorStack?: string;
  
  // Rate Limiting
  rateLimitHit: boolean;
  rateLimitReason?: string;
  
  // Timestamps
  timestamp: Date;
  createdAt: Date;
  updatedAt: Date;
}

const LoginAttemptSchema = new Schema<ILoginAttempt>({
  // Basic Information
  username: { type: String, required: true },
  email: String,
  userId: { type: Schema.Types.ObjectId, ref: 'User' },
  propertyId: { type: Schema.Types.ObjectId, ref: 'Property' },
  
  // Attempt Details
  attemptType: { type: String, enum: ['login', 'logout', 'password_reset', 'account_unlock', 'two_factor'], required: true },
  success: { type: Boolean, required: true },
  failureReason: String,
  
  // Source Information
  ipAddress: { type: String, required: true },
  userAgent: { type: String, required: true },
  deviceInfo: {
    deviceId: { type: String, required: true },
    deviceName: { type: String, required: true },
    deviceType: { type: String, enum: ['desktop', 'mobile', 'tablet', 'other'], required: true },
    browser: { type: String, required: true },
    browserVersion: { type: String, required: true },
    os: { type: String, required: true },
    osVersion: { type: String, required: true }
  },
  
  location: {
    country: String,
    city: String,
    region: String,
    coordinates: [Number],
    isp: String,
    proxy: { type: Boolean, default: false },
    vpn: { type: Boolean, default: false }
  },
  
  // Security Assessment
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
  
  // Authentication Details
  authMethod: { type: String, enum: ['password', 'two_factor', 'sso', 'magic_link', 'biometric'], required: true },
  twoFactorMethod: { type: String, enum: ['sms', 'email', 'authenticator', 'hardware_key'] },
  sessionToken: String,
  
  // Performance Metrics
  responseTime: { type: Number, required: true },
  serverLoad: Number,
  databaseQueries: Number,
  
  // Additional Context
  referrer: String,
  requestHeaders: Schema.Types.Mixed,
  requestBody: Schema.Types.Mixed,
  
  // Error Information
  errorCode: String,
  errorMessage: String,
  errorStack: String,
  
  // Rate Limiting
  rateLimitHit: { type: Boolean, default: false },
  rateLimitReason: String,
  
  // Timestamps
  timestamp: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

// Indexes
LoginAttemptSchema.index({ username: 1, timestamp: -1 });
LoginAttemptSchema.index({ email: 1, timestamp: -1 });
LoginAttemptSchema.index({ userId: 1, timestamp: -1 });
LoginAttemptSchema.index({ propertyId: 1, timestamp: -1 });
LoginAttemptSchema.index({ ipAddress: 1, timestamp: -1 });
LoginAttemptSchema.index({ success: 1, timestamp: -1 });
LoginAttemptSchema.index({ attemptType: 1, timestamp: -1 });
LoginAttemptSchema.index({ riskLevel: 1, timestamp: -1 });
LoginAttemptSchema.index({ isSuspicious: 1, timestamp: -1 });
LoginAttemptSchema.index({ authMethod: 1, timestamp: -1 });
LoginAttemptSchema.index({ timestamp: -1 });

// Virtual for attempt age in minutes
LoginAttemptSchema.virtual('attemptAge').get(function() {
  return Math.floor((Date.now() - this.timestamp.getTime()) / (1000 * 60));
});

// Virtual for is recent (within last 5 minutes)
LoginAttemptSchema.virtual('isRecent').get(function() {
  const attemptAge = Math.floor((Date.now() - this.timestamp.getTime()) / (1000 * 60));
  return attemptAge < 5;
});

// Virtual for is high risk
LoginAttemptSchema.virtual('isHighRisk').get(function() {
  return this.riskLevel === 'high' || this.riskLevel === 'critical';
});

// Virtual for is suspicious
LoginAttemptSchema.virtual('isSuspiciousAttempt').get(function() {
  return this.isSuspicious || this.riskLevel === 'critical';
});

// Virtual for is rate limited
LoginAttemptSchema.virtual('isRateLimited').get(function() {
  return this.rateLimitHit;
});

// Methods
LoginAttemptSchema.methods.addSecurityFlag = function(flag: string, description?: string, severity: 'info' | 'warning' | 'error' | 'critical' = 'info') {
  this.securityFlags.push({
    flag,
    timestamp: new Date(),
    description: description || flag,
    severity
  });
};

LoginAttemptSchema.methods.markSuspicious = function(reason: string) {
  this.isSuspicious = true;
  if (!this.suspiciousReasons.includes(reason)) {
    this.suspiciousReasons.push(reason);
  }
};

LoginAttemptSchema.methods.addRiskFactor = function(factor: string) {
  if (!this.riskFactors.includes(factor)) {
    this.riskFactors.push(factor);
  }
};

LoginAttemptSchema.methods.calculateRiskLevel = function() {
  let riskScore = 0;
  
  // High risk factors
  if (!this.success) riskScore += 3;
  if (this.location.proxy || this.location.vpn) riskScore += 2;
  if (this.isSuspicious) riskScore += 3;
  if (this.rateLimitHit) riskScore += 2;
  if (this.attemptType === 'password_reset') riskScore += 1;
  
  // Medium risk factors
  if (this.authMethod === 'two_factor') riskScore += 1;
  if (this.responseTime > 5000) riskScore += 1; // Slow response
  if (this.deviceInfo.deviceType === 'mobile') riskScore += 1;
  
  // Determine risk level
  if (riskScore >= 6) this.riskLevel = 'critical';
  else if (riskScore >= 4) this.riskLevel = 'high';
  else if (riskScore >= 2) this.riskLevel = 'medium';
  else this.riskLevel = 'low';
};

LoginAttemptSchema.methods.setRateLimit = function(reason: string) {
  this.rateLimitHit = true;
  this.rateLimitReason = reason;
};

// Static methods
LoginAttemptSchema.statics.findByUsername = function(username: string, startDate: Date, endDate: Date) {
  return this.find({
    username,
    timestamp: { $gte: startDate, $lte: endDate }
  }).sort({ timestamp: -1 });
};

LoginAttemptSchema.statics.findByIP = function(ipAddress: string, startDate: Date, endDate: Date) {
  return this.find({
    ipAddress,
    timestamp: { $gte: startDate, $lte: endDate }
  }).sort({ timestamp: -1 });
};

LoginAttemptSchema.statics.findFailedAttempts = function(startDate: Date, endDate: Date) {
  return this.find({
    success: false,
    timestamp: { $gte: startDate, $lte: endDate }
  }).sort({ timestamp: -1 });
};

LoginAttemptSchema.statics.findSuspiciousAttempts = function(startDate: Date, endDate: Date) {
  return this.find({
    $or: [
      { isSuspicious: true },
      { riskLevel: { $in: ['high', 'critical'] } }
    ],
    timestamp: { $gte: startDate, $lte: endDate }
  }).sort({ timestamp: -1 });
};

LoginAttemptSchema.statics.findRateLimitedAttempts = function(startDate: Date, endDate: Date) {
  return this.find({
    rateLimitHit: true,
    timestamp: { $gte: startDate, $lte: endDate }
  }).sort({ timestamp: -1 });
};

LoginAttemptSchema.statics.getLoginAnalytics = function(startDate: Date, endDate: Date) {
  return this.aggregate([
    { $match: { timestamp: { $gte: startDate, $lte: endDate } } },
    { $group: {
      _id: {
        success: '$success',
        attemptType: '$attemptType',
        authMethod: '$authMethod',
        riskLevel: '$riskLevel'
      },
      count: { $sum: 1 },
      avgResponseTime: { $avg: '$responseTime' },
      suspiciousCount: { $sum: { $cond: ['$isSuspicious', 1, 0] } },
      rateLimitedCount: { $sum: { $cond: ['$rateLimitHit', 1, 0] } }
    }},
    { $sort: { count: -1 } }
  ]);
};

LoginAttemptSchema.statics.getSecurityAnalytics = function(startDate: Date, endDate: Date) {
  return this.aggregate([
    { $match: { timestamp: { $gte: startDate, $lte: endDate } } },
    { $group: {
      _id: null,
      totalAttempts: { $sum: 1 },
      successfulAttempts: { $sum: { $cond: ['$success', 1, 0] } },
      failedAttempts: { $sum: { $cond: ['$success', 0, 1] } },
      suspiciousAttempts: { $sum: { $cond: ['$isSuspicious', 1, 0] } },
      rateLimitedAttempts: { $sum: { $cond: ['$rateLimitHit', 1, 0] } },
      avgResponseTime: { $avg: '$responseTime' },
      uniqueIPs: { $addToSet: '$ipAddress' },
      uniqueUsernames: { $addToSet: '$username' }
    }},
    { $project: {
      totalAttempts: 1,
      successfulAttempts: 1,
      failedAttempts: 1,
      suspiciousAttempts: 1,
      rateLimitedAttempts: 1,
      avgResponseTime: 1,
      uniqueIPCount: { $size: '$uniqueIPs' },
      uniqueUsernameCount: { $size: '$uniqueUsernames' },
      successRate: { $multiply: [{ $divide: ['$successfulAttempts', '$totalAttempts'] }, 100] }
    }}
  ]);
};

export default mongoose.models.LoginAttempt || mongoose.model<ILoginAttempt>('LoginAttempt', LoginAttemptSchema); 