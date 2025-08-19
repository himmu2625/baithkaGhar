import mongoose, { Document, Schema } from 'mongoose';

export interface ITwoFactorAuth extends Document {
  userId: mongoose.Types.ObjectId;
  
  // 2FA Status
  isEnabled: boolean;
  isRequired: boolean;
  method: 'sms' | 'email' | 'authenticator' | 'hardware_key' | 'backup_codes';
  primaryMethod: 'sms' | 'email' | 'authenticator' | 'hardware_key';
  
  // SMS Configuration
  sms?: {
    phoneNumber: string;
    isVerified: boolean;
    verificationCode?: string;
    verificationExpires?: Date;
    lastSentAt?: Date;
    sentCount: number;
  };
  
  // Email Configuration
  email?: {
    emailAddress: string;
    isVerified: boolean;
    verificationCode?: string;
    verificationExpires?: Date;
    lastSentAt?: Date;
    sentCount: number;
  };
  
  // Authenticator App Configuration
  authenticator?: {
    secret: string;
    qrCodeUrl?: string;
    backupCodes: string[];
    usedBackupCodes: string[];
    isSetup: boolean;
  };
  
  // Hardware Key Configuration
  hardwareKey?: {
    keyId: string;
    keyName: string;
    publicKey: string;
    isRegistered: boolean;
    lastUsedAt?: Date;
  };
  
  // Backup Codes
  backupCodes: Array<{
    code: string;
    isUsed: boolean;
    usedAt?: Date;
    usedFrom?: string;
  }>;
  
  // Security Settings
  securitySettings: {
    requireOnLogin: boolean;
    requireOnSensitiveActions: boolean;
    rememberDevice: boolean;
    deviceRememberDuration: number; // in days
    maxFailedAttempts: number;
    lockoutDuration: number; // in minutes
  };
  
  // Trusted Devices
  trustedDevices: Array<{
    deviceId: string;
    deviceName: string;
    deviceType: string;
    browser: string;
    os: string;
    ipAddress: string;
    location?: string;
    trustedAt: Date;
    expiresAt: Date;
    lastUsedAt: Date;
  }>;
  
  // Failed Attempts Tracking
  failedAttempts: Array<{
    timestamp: Date;
    method: string;
    ipAddress: string;
    userAgent: string;
    reason?: string;
  }>;
  
  // Recovery Options
  recoveryOptions: {
    recoveryEmail?: string;
    recoveryPhone?: string;
    securityQuestions: Array<{
      question: string;
      answerHash: string;
    }>;
  };
  
  // Usage Statistics
  usageStats: {
    totalLogins: number;
    successfulLogins: number;
    failedLogins: number;
    lastUsedAt?: Date;
    averageResponseTime?: number;
  };
  
  // Audit Trail
  auditLog: Array<{
    action: string;
    timestamp: Date;
    ipAddress: string;
    userAgent: string;
    details?: object;
  }>;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  lastModifiedAt: Date;
}

const TwoFactorAuthSchema = new Schema<ITwoFactorAuth>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  
  // 2FA Status
  isEnabled: { type: Boolean, default: false },
  isRequired: { type: Boolean, default: false },
  method: { type: String, enum: ['sms', 'email', 'authenticator', 'hardware_key', 'backup_codes'], required: true },
  primaryMethod: { type: String, enum: ['sms', 'email', 'authenticator', 'hardware_key'], required: true },
  
  // SMS Configuration
  sms: {
    phoneNumber: String,
    isVerified: { type: Boolean, default: false },
    verificationCode: String,
    verificationExpires: Date,
    lastSentAt: Date,
    sentCount: { type: Number, default: 0 }
  },
  
  // Email Configuration
  email: {
    emailAddress: String,
    isVerified: { type: Boolean, default: false },
    verificationCode: String,
    verificationExpires: Date,
    lastSentAt: Date,
    sentCount: { type: Number, default: 0 }
  },
  
  // Authenticator App Configuration
  authenticator: {
    secret: String,
    qrCodeUrl: String,
    backupCodes: [String],
    usedBackupCodes: [String],
    isSetup: { type: Boolean, default: false }
  },
  
  // Hardware Key Configuration
  hardwareKey: {
    keyId: String,
    keyName: String,
    publicKey: String,
    isRegistered: { type: Boolean, default: false },
    lastUsedAt: Date
  },
  
  // Backup Codes
  backupCodes: [{
    code: { type: String, required: true },
    isUsed: { type: Boolean, default: false },
    usedAt: Date,
    usedFrom: String
  }],
  
  // Security Settings
  securitySettings: {
    requireOnLogin: { type: Boolean, default: true },
    requireOnSensitiveActions: { type: Boolean, default: true },
    rememberDevice: { type: Boolean, default: true },
    deviceRememberDuration: { type: Number, default: 30 }, // 30 days
    maxFailedAttempts: { type: Number, default: 5 },
    lockoutDuration: { type: Number, default: 15 } // 15 minutes
  },
  
  // Trusted Devices
  trustedDevices: [{
    deviceId: { type: String, required: true },
    deviceName: { type: String, required: true },
    deviceType: { type: String, required: true },
    browser: { type: String, required: true },
    os: { type: String, required: true },
    ipAddress: { type: String, required: true },
    location: String,
    trustedAt: { type: Date, default: Date.now },
    expiresAt: { type: Date, required: true },
    lastUsedAt: { type: Date, default: Date.now }
  }],
  
  // Failed Attempts Tracking
  failedAttempts: [{
    timestamp: { type: Date, default: Date.now },
    method: { type: String, required: true },
    ipAddress: { type: String, required: true },
    userAgent: { type: String, required: true },
    reason: String
  }],
  
  // Recovery Options
  recoveryOptions: {
    recoveryEmail: String,
    recoveryPhone: String,
    securityQuestions: [{
      question: { type: String, required: true },
      answerHash: { type: String, required: true }
    }]
  },
  
  // Usage Statistics
  usageStats: {
    totalLogins: { type: Number, default: 0 },
    successfulLogins: { type: Number, default: 0 },
    failedLogins: { type: Number, default: 0 },
    lastUsedAt: Date,
    averageResponseTime: Number
  },
  
  // Audit Trail
  auditLog: [{
    action: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    ipAddress: { type: String, required: true },
    userAgent: { type: String, required: true },
    details: Schema.Types.Mixed
  }],
  
  // Timestamps
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  lastModifiedAt: { type: Date, default: Date.now }
}, { timestamps: true });

// Indexes
TwoFactorAuthSchema.index({ userId: 1 }, { unique: true });
TwoFactorAuthSchema.index({ isEnabled: 1 });
TwoFactorAuthSchema.index({ method: 1 });
TwoFactorAuthSchema.index({ 'sms.phoneNumber': 1 });
TwoFactorAuthSchema.index({ 'email.emailAddress': 1 });
TwoFactorAuthSchema.index({ 'trustedDevices.deviceId': 1 });
TwoFactorAuthSchema.index({ 'failedAttempts.timestamp': -1 });

// Virtual for is locked out
TwoFactorAuthSchema.virtual('isLockedOut').get(function() {
  const recentFailures = this.failedAttempts.filter(attempt => {
    const lockoutTime = new Date(Date.now() - this.securitySettings.lockoutDuration * 60 * 1000);
    return attempt.timestamp > lockoutTime;
  });
  
  return recentFailures.length >= this.securitySettings.maxFailedAttempts;
});

// Virtual for time until unlock
TwoFactorAuthSchema.virtual('timeUntilUnlock').get(function() {
  // Check if locked out directly
  const recentFailures = this.failedAttempts.filter(attempt => {
    const lockoutTime = new Date(Date.now() - this.securitySettings.lockoutDuration * 60 * 1000);
    return attempt.timestamp > lockoutTime;
  });
  
  const isLockedOut = recentFailures.length >= this.securitySettings.maxFailedAttempts;
  if (!isLockedOut) return 0;
  
  const sortedFailures = this.failedAttempts
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    .slice(0, this.securitySettings.maxFailedAttempts);
  
  const oldestFailure = sortedFailures[sortedFailures.length - 1];
  const unlockTime = new Date(oldestFailure.timestamp.getTime() + this.securitySettings.lockoutDuration * 60 * 1000);
  
  return Math.max(0, unlockTime.getTime() - Date.now());
});

// Virtual for success rate
TwoFactorAuthSchema.virtual('successRate').get(function() {
  if (this.usageStats.totalLogins === 0) return 0;
  return (this.usageStats.successfulLogins / this.usageStats.totalLogins) * 100;
});

// Virtual for active trusted devices
TwoFactorAuthSchema.virtual('activeTrustedDevices').get(function() {
  return this.trustedDevices.filter(device => device.expiresAt > new Date());
});

// Methods
TwoFactorAuthSchema.methods.addFailedAttempt = function(method: string, ipAddress: string, userAgent: string, reason?: string) {
  this.failedAttempts.push({
    timestamp: new Date(),
    method,
    ipAddress,
    userAgent,
    reason
  });
  
  // Keep only last 100 failed attempts
  if (this.failedAttempts.length > 100) {
    this.failedAttempts = this.failedAttempts.slice(-100);
  }
  
  this.usageStats.failedLogins += 1;
  this.usageStats.totalLogins += 1;
};

TwoFactorAuthSchema.methods.addSuccessfulLogin = function(ipAddress: string, userAgent: string) {
  this.usageStats.successfulLogins += 1;
  this.usageStats.totalLogins += 1;
  this.usageStats.lastUsedAt = new Date();
  
  // Clear failed attempts on successful login
  this.failedAttempts = [];
};

TwoFactorAuthSchema.methods.addTrustedDevice = function(deviceInfo: any) {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + this.securitySettings.deviceRememberDuration);
  
  this.trustedDevices.push({
    deviceId: deviceInfo.deviceId,
    deviceName: deviceInfo.deviceName,
    deviceType: deviceInfo.deviceType,
    browser: deviceInfo.browser,
    os: deviceInfo.os,
    ipAddress: deviceInfo.ipAddress,
    location: deviceInfo.location,
    trustedAt: new Date(),
    expiresAt,
    lastUsedAt: new Date()
  });
};

TwoFactorAuthSchema.methods.isDeviceTrusted = function(deviceId: string) {
  return this.trustedDevices.some((device: any) => 
    device.deviceId === deviceId && device.expiresAt > new Date()
  );
};

TwoFactorAuthSchema.methods.removeTrustedDevice = function(deviceId: string) {
  this.trustedDevices = this.trustedDevices.filter((device: any) => device.deviceId !== deviceId);
};

TwoFactorAuthSchema.methods.generateBackupCodes = function(count: number = 10) {
  const codes = [];
  for (let i = 0; i < count; i++) {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    codes.push({
      code,
      isUsed: false
    });
  }
  this.backupCodes = codes;
  return codes;
};

TwoFactorAuthSchema.methods.useBackupCode = function(code: string, usedFrom: string) {
  const backupCode = this.backupCodes.find((bc: any) => bc.code === code && !bc.isUsed);
  if (backupCode) {
    backupCode.isUsed = true;
    backupCode.usedAt = new Date();
    backupCode.usedFrom = usedFrom;
    return true;
  }
  return false;
};

TwoFactorAuthSchema.methods.addAuditLog = function(action: string, ipAddress: string, userAgent: string, details?: object) {
  this.auditLog.push({
    action,
    timestamp: new Date(),
    ipAddress,
    userAgent,
    details
  });
  
  // Keep only last 1000 audit entries
  if (this.auditLog.length > 1000) {
    this.auditLog = this.auditLog.slice(-1000);
  }
};

// Static methods
TwoFactorAuthSchema.statics.findByUser = function(userId: string) {
  return this.findOne({ userId: new mongoose.Types.ObjectId(userId) });
};

TwoFactorAuthSchema.statics.findEnabled = function() {
  return this.find({ isEnabled: true });
};

TwoFactorAuthSchema.statics.findByMethod = function(method: string) {
  return this.find({ method, isEnabled: true });
};

TwoFactorAuthSchema.statics.getTwoFactorAnalytics = function() {
  return this.aggregate([
    { $group: {
      _id: '$method',
      totalUsers: { $sum: 1 },
      enabledUsers: { $sum: { $cond: ['$isEnabled', 1, 0] } },
      avgSuccessRate: { $avg: '$successRate' },
      avgResponseTime: { $avg: '$usageStats.averageResponseTime' }
    }}
  ]);
};

export default mongoose.models.TwoFactorAuth || mongoose.model<ITwoFactorAuth>('TwoFactorAuth', TwoFactorAuthSchema); 