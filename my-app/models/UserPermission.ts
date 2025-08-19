import mongoose, { Document, Schema } from 'mongoose';

export interface IUserPermission extends Document {
  userId: mongoose.Types.ObjectId;
  roleId: mongoose.Types.ObjectId;
  propertyId?: mongoose.Types.ObjectId; // Optional for global permissions
  
  // Granular Permissions (overrides role permissions)
  permissions: {
    // Property Management
    canViewProperties: boolean;
    canCreateProperties: boolean;
    canEditProperties: boolean;
    canDeleteProperties: boolean;
    canManagePropertySettings: boolean;
    
    // Booking Management
    canViewBookings: boolean;
    canCreateBookings: boolean;
    canEditBookings: boolean;
    canCancelBookings: boolean;
    canManageBookingSettings: boolean;
    
    // Guest Management
    canViewGuests: boolean;
    canCreateGuests: boolean;
    canEditGuests: boolean;
    canDeleteGuests: boolean;
    canAccessGuestHistory: boolean;
    
    // Financial Management
    canViewPayments: boolean;
    canProcessPayments: boolean;
    canViewInvoices: boolean;
    canCreateInvoices: boolean;
    canManageRefunds: boolean;
    canViewFinancialReports: boolean;
    
    // Staff Management
    canViewStaff: boolean;
    canCreateStaff: boolean;
    canEditStaff: boolean;
    canDeleteStaff: boolean;
    canManageStaffSchedules: boolean;
    canViewStaffPerformance: boolean;
    
    // Reports & Analytics
    canViewReports: boolean;
    canGenerateReports: boolean;
    canExportData: boolean;
    canViewAnalytics: boolean;
    
    // System Administration
    canManageUsers: boolean;
    canManageRoles: boolean;
    canManageSystemSettings: boolean;
    canViewAuditLogs: boolean;
    canManageBackups: boolean;
    
    // Content Management
    canManageContent: boolean;
    canManagePromotions: boolean;
    canManageSpecialOffers: boolean;
    canManageTravelPicks: boolean;
    
    // Communication
    canSendNotifications: boolean;
    canManageTemplates: boolean;
    canViewCommunicationLogs: boolean;
  };
  
  // Permission Scope
  scope: 'global' | 'property' | 'department' | 'team' | 'individual';
  scopeIds: mongoose.Types.ObjectId[]; // Additional scope identifiers
  
  // Permission Overrides
  overrides: Array<{
    permissionId: mongoose.Types.ObjectId;
    action: 'grant' | 'deny';
    reason: string;
    timestamp: Date;
    grantedBy: mongoose.Types.ObjectId;
  }>;
  
  // Conditions & Restrictions
  conditions?: {
    timeRestrictions?: {
      startTime?: string;
      endTime?: string;
      daysOfWeek?: number[];
      timezone: string;
    };
    locationRestrictions?: {
      allowedLocations: string[];
      excludedLocations: string[];
    };
    dataRestrictions?: {
      maxRecords?: number;
      allowedDataTypes?: string[];
      excludedDataTypes?: string[];
    };
  };
  
  // Access Control
  isActive: boolean;
  expiresAt?: Date;
  priority: number; // Higher priority overrides lower priority
  
  // Audit Trail
  grantedBy: mongoose.Types.ObjectId;
  grantedAt: Date;
  lastModifiedBy: mongoose.Types.ObjectId;
  lastModifiedAt: Date;
  
  // Usage Tracking
  usageCount: number;
  lastUsedAt?: Date;
  usageHistory: Array<{
    action: string;
    timestamp: Date;
    resourceId?: mongoose.Types.ObjectId;
    details?: object;
  }>;
  
  createdAt: Date;
  updatedAt: Date;
}

const UserPermissionSchema = new Schema<IUserPermission>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  roleId: { type: Schema.Types.ObjectId, ref: 'UserRole', required: true },
  propertyId: { type: Schema.Types.ObjectId, ref: 'Property' },
  
  // Granular Permissions
  permissions: {
    // Property Management
    canViewProperties: { type: Boolean, default: false },
    canCreateProperties: { type: Boolean, default: false },
    canEditProperties: { type: Boolean, default: false },
    canDeleteProperties: { type: Boolean, default: false },
    canManagePropertySettings: { type: Boolean, default: false },
    
    // Booking Management
    canViewBookings: { type: Boolean, default: false },
    canCreateBookings: { type: Boolean, default: false },
    canEditBookings: { type: Boolean, default: false },
    canCancelBookings: { type: Boolean, default: false },
    canManageBookingSettings: { type: Boolean, default: false },
    
    // Guest Management
    canViewGuests: { type: Boolean, default: false },
    canCreateGuests: { type: Boolean, default: false },
    canEditGuests: { type: Boolean, default: false },
    canDeleteGuests: { type: Boolean, default: false },
    canAccessGuestHistory: { type: Boolean, default: false },
    
    // Financial Management
    canViewPayments: { type: Boolean, default: false },
    canProcessPayments: { type: Boolean, default: false },
    canViewInvoices: { type: Boolean, default: false },
    canCreateInvoices: { type: Boolean, default: false },
    canManageRefunds: { type: Boolean, default: false },
    canViewFinancialReports: { type: Boolean, default: false },
    
    // Staff Management
    canViewStaff: { type: Boolean, default: false },
    canCreateStaff: { type: Boolean, default: false },
    canEditStaff: { type: Boolean, default: false },
    canDeleteStaff: { type: Boolean, default: false },
    canManageStaffSchedules: { type: Boolean, default: false },
    canViewStaffPerformance: { type: Boolean, default: false },
    
    // Reports & Analytics
    canViewReports: { type: Boolean, default: false },
    canGenerateReports: { type: Boolean, default: false },
    canExportData: { type: Boolean, default: false },
    canViewAnalytics: { type: Boolean, default: false },
    
    // System Administration
    canManageUsers: { type: Boolean, default: false },
    canManageRoles: { type: Boolean, default: false },
    canManageSystemSettings: { type: Boolean, default: false },
    canViewAuditLogs: { type: Boolean, default: false },
    canManageBackups: { type: Boolean, default: false },
    
    // Content Management
    canManageContent: { type: Boolean, default: false },
    canManagePromotions: { type: Boolean, default: false },
    canManageSpecialOffers: { type: Boolean, default: false },
    canManageTravelPicks: { type: Boolean, default: false },
    
    // Communication
    canSendNotifications: { type: Boolean, default: false },
    canManageTemplates: { type: Boolean, default: false },
    canViewCommunicationLogs: { type: Boolean, default: false }
  },
  
  // Permission Scope
  scope: { type: String, enum: ['global', 'property', 'department', 'team', 'individual'], default: 'global' },
  scopeIds: [{ type: Schema.Types.ObjectId }],
  
  // Permission Overrides
  overrides: [{
    permissionId: { type: Schema.Types.ObjectId, ref: 'UserPermission', required: true },
    action: { type: String, enum: ['grant', 'deny'], required: true },
    reason: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    grantedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true }
  }],
  
  // Conditions & Restrictions
  conditions: {
    timeRestrictions: {
      startTime: String,
      endTime: String,
      daysOfWeek: [Number],
      timezone: { type: String, default: 'UTC' }
    },
    locationRestrictions: {
      allowedLocations: [String],
      excludedLocations: [String]
    },
    dataRestrictions: {
      maxRecords: Number,
      allowedDataTypes: [String],
      excludedDataTypes: [String]
    }
  },
  
  // Access Control
  isActive: { type: Boolean, default: true },
  expiresAt: Date,
  priority: { type: Number, default: 0 },
  
  // Audit Trail
  grantedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  grantedAt: { type: Date, default: Date.now },
  lastModifiedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  lastModifiedAt: { type: Date, default: Date.now },
  
  // Usage Tracking
  usageCount: { type: Number, default: 0 },
  lastUsedAt: Date,
  usageHistory: [{
    action: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    resourceId: { type: Schema.Types.ObjectId },
    details: Schema.Types.Mixed
  }],
  
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

// Indexes
UserPermissionSchema.index({ userId: 1, roleId: 1, propertyId: 1 }, { unique: true });
UserPermissionSchema.index({ userId: 1, isActive: 1 });
UserPermissionSchema.index({ roleId: 1, isActive: 1 });
UserPermissionSchema.index({ propertyId: 1, isActive: 1 });
UserPermissionSchema.index({ scope: 1, scopeIds: 1 });
UserPermissionSchema.index({ expiresAt: 1 });
UserPermissionSchema.index({ priority: -1 });
UserPermissionSchema.index({ lastUsedAt: -1 });

// Virtual for effective permissions
UserPermissionSchema.virtual('effectivePermissions').get(function() {
  const basePermissions = this.permissions;
  const effectivePermissions = { ...basePermissions };
  
  // Apply overrides
  this.overrides.forEach(override => {
    if (override.action === 'grant') {
      (effectivePermissions as any)[override.permissionId.toString()] = true;
    } else if (override.action === 'deny') {
      (effectivePermissions as any)[override.permissionId.toString()] = false;
    }
  });
  
  return effectivePermissions;
});

// Virtual for is expired
UserPermissionSchema.virtual('isExpired').get(function() {
  if (!this.expiresAt) return false;
  return new Date() > this.expiresAt;
});

// Virtual for is accessible now
UserPermissionSchema.virtual('isAccessibleNow').get(function() {
  if (!this.isActive) return false;
  
  // Check if expired
  if (this.expiresAt && new Date() > this.expiresAt) return false;
  
  if (!this.conditions?.timeRestrictions) return true;
  
  const now = new Date();
  const currentTime = now.getHours() * 60 + now.getMinutes();
  const currentDay = now.getDay();
  const restrictions = this.conditions.timeRestrictions;
  
  if (restrictions.daysOfWeek && !restrictions.daysOfWeek.includes(currentDay)) {
    return false;
  }
  
  if (restrictions.startTime) {
    const startMinutes = parseInt(restrictions.startTime.split(':')[0]) * 60 + 
                        parseInt(restrictions.startTime.split(':')[1]);
    if (currentTime < startMinutes) return false;
  }
  
  if (restrictions.endTime) {
    const endMinutes = parseInt(restrictions.endTime.split(':')[0]) * 60 + 
                      parseInt(restrictions.endTime.split(':')[1]);
    if (currentTime > endMinutes) return false;
  }
  
  return true;
});

// Methods
UserPermissionSchema.methods.hasPermission = function(permission: string): boolean {
  if (!this.isAccessibleNow) return false;
  const effectivePermissions = this.effectivePermissions;
  return effectivePermissions[permission as keyof typeof effectivePermissions] || false;
};

UserPermissionSchema.methods.canPerformAction = function(action: string, context?: any): boolean {
  if (!this.hasPermission(action)) return false;
  
  // Check location restrictions
  if (this.conditions?.locationRestrictions && context?.location) {
    const restrictions = this.conditions.locationRestrictions;
    if (restrictions.excludedLocations.includes(context.location)) return false;
    if (restrictions.allowedLocations.length && !restrictions.allowedLocations.includes(context.location)) return false;
  }
  
  // Check data restrictions
  if (this.conditions?.dataRestrictions && context?.dataType) {
    const restrictions = this.conditions.dataRestrictions;
    if (restrictions.excludedDataTypes.includes(context.dataType)) return false;
    if (restrictions.allowedDataTypes.length && !restrictions.allowedDataTypes.includes(context.dataType)) return false;
  }
  
  return true;
};

UserPermissionSchema.methods.recordUsage = function(action: string, resourceId?: mongoose.Types.ObjectId, details?: object) {
  this.usageCount += 1;
  this.lastUsedAt = new Date();
  this.usageHistory.push({
    action,
    timestamp: new Date(),
    resourceId,
    details
  });
  
  // Keep only last 100 usage records
  if (this.usageHistory.length > 100) {
    this.usageHistory = this.usageHistory.slice(-100);
  }
};

UserPermissionSchema.methods.addOverride = function(permissionId: mongoose.Types.ObjectId, action: 'grant' | 'deny', reason: string, grantedBy: mongoose.Types.ObjectId) {
  this.overrides.push({
    permissionId,
    action,
    reason,
    timestamp: new Date(),
    grantedBy
  });
};

// Static methods
UserPermissionSchema.statics.findByUser = function(userId: string, propertyId?: string) {
  const query: any = { userId: new mongoose.Types.ObjectId(userId), isActive: true };
  if (propertyId) {
    query.$or = [
      { propertyId: new mongoose.Types.ObjectId(propertyId) },
      { scope: 'global' }
    ];
  }
  return this.find(query).populate('roleId').sort({ priority: -1 });
};

UserPermissionSchema.statics.findByRole = function(roleId: string) {
  return this.find({ roleId: new mongoose.Types.ObjectId(roleId), isActive: true });
};

UserPermissionSchema.statics.findByProperty = function(propertyId: string) {
  return this.find({ propertyId: new mongoose.Types.ObjectId(propertyId), isActive: true }).populate('userId roleId');
};

UserPermissionSchema.statics.getPermissionAnalytics = function(userId: string) {
  return this.aggregate([
    { $match: { userId: new mongoose.Types.ObjectId(userId), isActive: true } },
    { $group: {
      _id: '$scope',
      totalPermissions: { $sum: 1 },
      avgUsageCount: { $avg: '$usageCount' },
      mostUsedPermission: { $max: { usageCount: '$usageCount', scope: '$scope' } }
    }}
  ]);
};

export default mongoose.models.UserPermission || mongoose.model<IUserPermission>('UserPermission', UserPermissionSchema); 