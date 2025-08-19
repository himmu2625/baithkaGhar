import mongoose, { Document, Schema } from 'mongoose';

export interface IUserRole extends Document {
  name: string;
  description: string;
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
  
  // Role Hierarchy
  parentRole?: mongoose.Types.ObjectId;
  childRoles: mongoose.Types.ObjectId[];
  
  // Access Control
  isActive: boolean;
  isSystemRole: boolean; // Cannot be deleted if true
  isDefaultRole: boolean; // Assigned to new users by default
  
  // Scope & Restrictions
  scope: 'global' | 'property' | 'department' | 'team';
  allowedProperties?: mongoose.Types.ObjectId[];
  excludedProperties?: mongoose.Types.ObjectId[];
  
  // Time-based Access
  timeRestrictions?: {
    startTime?: string; // HH:MM format
    endTime?: string; // HH:MM format
    daysOfWeek?: number[]; // 0-6 (Sunday-Saturday)
    timezone: string;
  };
  
  // Usage Tracking
  usageCount: number;
  lastUsedAt?: Date;
  createdBy: mongoose.Types.ObjectId;
  lastModifiedBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const UserRoleSchema = new Schema<IUserRole>({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 2,
    maxlength: 50
  },
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500
  },
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
  
  // Role Hierarchy
  parentRole: { type: Schema.Types.ObjectId, ref: 'UserRole' },
  childRoles: [{ type: Schema.Types.ObjectId, ref: 'UserRole' }],
  
  // Access Control
  isActive: { type: Boolean, default: true },
  isSystemRole: { type: Boolean, default: false },
  isDefaultRole: { type: Boolean, default: false },
  
  // Scope & Restrictions
  scope: { type: String, enum: ['global', 'property', 'department', 'team'], default: 'global' },
  allowedProperties: [{ type: Schema.Types.ObjectId, ref: 'Property' }],
  excludedProperties: [{ type: Schema.Types.ObjectId, ref: 'Property' }],
  
  // Time-based Access
  timeRestrictions: {
    startTime: String, // HH:MM format
    endTime: String, // HH:MM format
    daysOfWeek: [Number], // 0-6 (Sunday-Saturday)
    timezone: { type: String, default: 'UTC' }
  },
  
  // Usage Tracking
  usageCount: { type: Number, default: 0 },
  lastUsedAt: Date,
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  lastModifiedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

// Indexes
UserRoleSchema.index({ name: 1 }, { unique: true });
UserRoleSchema.index({ isActive: 1 });
UserRoleSchema.index({ isSystemRole: 1 });
UserRoleSchema.index({ isDefaultRole: 1 });
UserRoleSchema.index({ scope: 1 });
UserRoleSchema.index({ parentRole: 1 });
UserRoleSchema.index({ usageCount: -1 });

// Virtual for total permissions count
UserRoleSchema.virtual('totalPermissions').get(function() {
  const permissions = this.permissions;
  return Object.values(permissions).filter(Boolean).length;
});

// Virtual for permission level
UserRoleSchema.virtual('permissionLevel').get(function() {
  const permissions = this.permissions;
  const adminPermissions = [
    permissions.canManageUsers,
    permissions.canManageRoles,
    permissions.canManageSystemSettings
  ];
  
  if (adminPermissions.every(p => p)) return 'admin';
  if (permissions.canViewReports && permissions.canViewAnalytics) return 'manager';
  if (permissions.canViewBookings && permissions.canViewProperties) return 'staff';
  return 'basic';
});

// Virtual for is accessible now
UserRoleSchema.virtual('isAccessibleNow').get(function() {
  if (!this.timeRestrictions) return true;
  
  const now = new Date();
  const currentTime = now.getHours() * 60 + now.getMinutes();
  const currentDay = now.getDay();
  const restrictions = this.timeRestrictions;
  
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
UserRoleSchema.methods.hasPermission = function(permission: string): boolean {
  if (!this.isActive || !this.isAccessibleNow) return false;
  return this.permissions[permission as keyof typeof this.permissions] || false;
};

UserRoleSchema.methods.canAccessProperty = function(propertyId: mongoose.Types.ObjectId): boolean {
  if (this.scope === 'global') return true;
  if (this.excludedProperties?.includes(propertyId)) return false;
  if (this.allowedProperties?.length && !this.allowedProperties.includes(propertyId)) return false;
  return true;
};

UserRoleSchema.methods.recordUsage = function() {
  this.usageCount += 1;
  this.lastUsedAt = new Date();
};

UserRoleSchema.methods.addChildRole = function(childRoleId: mongoose.Types.ObjectId) {
  if (!this.childRoles.includes(childRoleId)) {
    this.childRoles.push(childRoleId);
  }
};

UserRoleSchema.methods.removeChildRole = function(childRoleId: mongoose.Types.ObjectId) {
  this.childRoles = this.childRoles.filter((id: mongoose.Types.ObjectId) => !id.equals(childRoleId));
};

// Static methods
UserRoleSchema.statics.findByName = function(name: string) {
  return this.findOne({ name, isActive: true });
};

UserRoleSchema.statics.findSystemRoles = function() {
  return this.find({ isSystemRole: true, isActive: true });
};

UserRoleSchema.statics.findDefaultRole = function() {
  return this.findOne({ isDefaultRole: true, isActive: true });
};

UserRoleSchema.statics.findByScope = function(scope: string) {
  return this.find({ scope, isActive: true });
};

UserRoleSchema.statics.getRoleAnalytics = function() {
  return this.aggregate([
    { $match: { isActive: true } },
    { $group: {
      _id: '$scope',
      count: { $sum: 1 },
      avgUsageCount: { $avg: '$usageCount' },
      totalPermissions: { $avg: '$totalPermissions' }
    }}
  ]);
};

export default mongoose.models.UserRole || mongoose.model<IUserRole>('UserRole', UserRoleSchema); 