import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IPropertyLogin extends Document {
  // Basic Information
  propertyId: mongoose.Types.ObjectId;
  username: string;
  passwordHash: string;
  isActive: boolean;
  lastLogin?: Date;

  // Additional Security Fields
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  failedLoginAttempts: number;
  accountLocked: boolean;
  lockedUntil?: Date;
  lastLoginIp?: string;
  lastLoginUserAgent?: string;

  // Activity Tracking
  loginHistory: Array<{
    timestamp: Date;
    ipAddress: string;
    userAgent: string;
    success: boolean;
    failureReason?: string;
  }>;

  // System Fields
  createdAt: Date;
  updatedAt: Date;
}

const PropertyLoginSchema = new Schema<IPropertyLogin>({
  // Basic Information
  propertyId: {
    type: Schema.Types.ObjectId,
    ref: 'Property',
    required: true,
    unique: true
  },
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 30
  },
  passwordHash: {
    type: String,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: Date,

  // Additional Security Fields
  passwordResetToken: String,
  passwordResetExpires: Date,
  failedLoginAttempts: {
    type: Number,
    default: 0
  },
  accountLocked: {
    type: Boolean,
    default: false
  },
  lockedUntil: Date,
  lastLoginIp: String,
  lastLoginUserAgent: String,

  // Activity Tracking
  loginHistory: [{
    timestamp: { type: Date, required: true },
    ipAddress: { type: String, required: true },
    userAgent: { type: String, required: true },
    success: { type: Boolean, required: true },
    failureReason: String
  }],

  // System Fields
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes (propertyId and username already have unique indexes from schema definition)
PropertyLoginSchema.index({ isActive: 1 });
PropertyLoginSchema.index({ accountLocked: 1 });

// Instance methods
PropertyLoginSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

PropertyLoginSchema.methods.isAccountLocked = function(): boolean {
  if (!this.accountLocked) return false;
  if (!this.lockedUntil) return false;
  return new Date() < this.lockedUntil;
};

PropertyLoginSchema.methods.addLoginAttempt = function(success: boolean, ipAddress: string, userAgent: string) {
  this.loginHistory.push({
    timestamp: new Date(),
    ipAddress,
    userAgent,
    success,
    failureReason: success ? undefined : 'Invalid credentials'
  });

  if (!success) {
    this.failedLoginAttempts += 1;
    if (this.failedLoginAttempts >= 5) {
      this.accountLocked = true;
      this.lockedUntil = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
    }
  } else {
    this.failedLoginAttempts = 0;
    this.accountLocked = false;
    this.lockedUntil = undefined;
    this.lastLogin = new Date();
    this.lastLoginIp = ipAddress;
    this.lastLoginUserAgent = userAgent;
  }
};

// Static methods
PropertyLoginSchema.statics.findByPropertyId = function(propertyId: string) {
  return this.findOne({ propertyId: new mongoose.Types.ObjectId(propertyId) });
};

PropertyLoginSchema.statics.findByUsername = function(username: string) {
  return this.findOne({ username });
};

PropertyLoginSchema.statics.findActiveLogins = function() {
  return this.find({ isActive: true, accountLocked: false });
};

export default mongoose.models.PropertyLogin || mongoose.model<IPropertyLogin>('PropertyLogin', PropertyLoginSchema); 