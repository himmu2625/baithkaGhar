import mongoose, { Document, Schema } from 'mongoose';

export interface IPropertyPermission extends Document {
  // Basic Information
  propertyId: mongoose.Types.ObjectId;
  featureName: string;
  canAccess: boolean;
  canEdit: boolean;
  canDelete: boolean;

  // Additional Permission Details
  canCreate: boolean;
  canView: boolean;
  canExport: boolean;
  canImport: boolean;
  canApprove: boolean;
  canReject: boolean;
  canAssign: boolean;
  canTransfer: boolean;

  // Permission Scope
  scope: 'global' | 'department' | 'team' | 'individual';
  scopeIds: mongoose.Types.ObjectId[]; // IDs of departments, teams, or individuals
  conditions?: {
    timeRestrictions?: {
      startTime?: string; // HH:MM format
      endTime?: string; // HH:MM format
      daysOfWeek?: number[]; // 0-6 (Sunday-Saturday)
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

  // Permission Hierarchy
  inheritedFrom?: mongoose.Types.ObjectId; // Reference to parent permission
  overrides: Array<{
    permissionId: mongoose.Types.ObjectId;
    action: 'grant' | 'deny';
    reason: string;
    timestamp: Date;
  }>;

  // Audit & Tracking
  grantedBy?: mongoose.Types.ObjectId;
  grantedAt: Date;
  lastModifiedBy?: mongoose.Types.ObjectId;
  lastModifiedAt: Date;
  expiresAt?: Date;
  isActive: boolean;

  // Usage Tracking
  usageCount: number;
  lastUsedAt?: Date;
  usageHistory: Array<{
    action: string;
    timestamp: Date;
    userId?: mongoose.Types.ObjectId;
    details?: object;
  }>;

  // System Fields
  createdAt: Date;
  updatedAt: Date;
}

const PropertyPermissionSchema = new Schema<IPropertyPermission>({
  // Basic Information
  propertyId: {
    type: Schema.Types.ObjectId,
    ref: 'Property',
    required: true
  },
  featureName: {
    type: String,
    required: true,
    trim: true
  },
  canAccess: {
    type: Boolean,
    default: false
  },
  canEdit: {
    type: Boolean,
    default: false
  },
  canDelete: {
    type: Boolean,
    default: false
  },

  // Additional Permission Details
  canCreate: {
    type: Boolean,
    default: false
  },
  canView: {
    type: Boolean,
    default: true
  },
  canExport: {
    type: Boolean,
    default: false
  },
  canImport: {
    type: Boolean,
    default: false
  },
  canApprove: {
    type: Boolean,
    default: false
  },
  canReject: {
    type: Boolean,
    default: false
  },
  canAssign: {
    type: Boolean,
    default: false
  },
  canTransfer: {
    type: Boolean,
    default: false
  },

  // Permission Scope
  scope: {
    type: String,
    enum: ['global', 'department', 'team', 'individual'],
    default: 'global'
  },
  scopeIds: [{
    type: Schema.Types.ObjectId
  }],
  conditions: {
    timeRestrictions: {
      startTime: String,
      endTime: String,
      daysOfWeek: [Number]
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

  // Permission Hierarchy
  inheritedFrom: {
    type: Schema.Types.ObjectId,
    ref: 'PropertyPermission'
  },
  overrides: [{
    permissionId: {
      type: Schema.Types.ObjectId,
      ref: 'PropertyPermission',
      required: true
    },
    action: {
      type: String,
      enum: ['grant', 'deny'],
      required: true
    },
    reason: { type: String, required: true },
    timestamp: { type: Date, default: Date.now }
  }],

  // Audit & Tracking
  grantedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  grantedAt: {
    type: Date,
    default: Date.now
  },
  lastModifiedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  lastModifiedAt: {
    type: Date,
    default: Date.now
  },
  expiresAt: Date,
  isActive: {
    type: Boolean,
    default: true
  },

  // Usage Tracking
  usageCount: {
    type: Number,
    default: 0
  },
  lastUsedAt: Date,
  usageHistory: [{
    action: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    details: Schema.Types.Mixed
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

// Indexes
PropertyPermissionSchema.index({ propertyId: 1, featureName: 1 }, { unique: true });
PropertyPermissionSchema.index({ propertyId: 1, isActive: 1 });
PropertyPermissionSchema.index({ scope: 1, scopeIds: 1 });
PropertyPermissionSchema.index({ expiresAt: 1 });
PropertyPermissionSchema.index({ lastUsedAt: -1 });

// Virtual for permission level
PropertyPermissionSchema.virtual('permissionLevel').get(function() {
  if (this.canDelete) return 'full';
  if (this.canEdit) return 'edit';
  if (this.canAccess) return 'read';
  return 'none';
});

// Virtual for is expired
PropertyPermissionSchema.virtual('isExpired').get(function() {
  if (!this.expiresAt) return false;
  return new Date() > this.expiresAt;
});

// Virtual for effective permissions
PropertyPermissionSchema.virtual('effectivePermissions').get(function() {
  const base = {
    access: this.canAccess,
    view: this.canView,
    create: this.canCreate,
    edit: this.canEdit,
    delete: this.canDelete,
    export: this.canExport,
    import: this.canImport,
    approve: this.canApprove,
    reject: this.canReject,
    assign: this.canAssign,
    transfer: this.canTransfer
  };

  // Apply overrides
  this.overrides.forEach(override => {
    if (override.action === 'grant') {
      (base as any)[override.permissionId.toString()] = true;
    } else if (override.action === 'deny') {
      (base as any)[override.permissionId.toString()] = false;
    }
  });

  return base;
});

// Instance methods
PropertyPermissionSchema.methods.hasPermission = function(action: string): boolean {
  const permissions = this.effectivePermissions;
  return permissions[action as keyof typeof permissions] || false;
};

PropertyPermissionSchema.methods.canPerformAction = function(action: string, context?: any): boolean {
  if (!this.isActive || this.isExpired) return false;
  
  // Check basic permission
  if (!this.hasPermission(action)) return false;

  // Check time restrictions
  if (this.conditions?.timeRestrictions) {
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
  }

  return true;
};

PropertyPermissionSchema.methods.recordUsage = function(action: string, userId?: mongoose.Types.ObjectId, details?: object) {
  this.usageCount += 1;
  this.lastUsedAt = new Date();
  this.usageHistory.push({
    action,
    timestamp: new Date(),
    userId,
    details
  });

  // Keep only last 100 usage records
  if (this.usageHistory.length > 100) {
    this.usageHistory = this.usageHistory.slice(-100);
  }
};

PropertyPermissionSchema.methods.addOverride = function(permissionId: mongoose.Types.ObjectId, action: 'grant' | 'deny', reason: string) {
  this.overrides.push({
    permissionId,
    action,
    reason,
    timestamp: new Date()
  });
};

// Static methods
PropertyPermissionSchema.statics.findByPropertyAndFeature = function(propertyId: string, featureName: string) {
  return this.findOne({
    propertyId: new mongoose.Types.ObjectId(propertyId),
    featureName,
    isActive: true
  });
};

PropertyPermissionSchema.statics.findActivePermissions = function(propertyId: string) {
  return this.find({
    propertyId: new mongoose.Types.ObjectId(propertyId),
    isActive: true,
    $or: [
      { expiresAt: { $exists: false } },
      { expiresAt: { $gt: new Date() } }
    ]
  });
};

PropertyPermissionSchema.statics.getPermissionAnalytics = function(propertyId: string) {
  return this.aggregate([
    {
      $match: {
        propertyId: new mongoose.Types.ObjectId(propertyId),
        isActive: true
      }
    },
    {
      $group: {
        _id: '$featureName',
        totalPermissions: { $sum: 1 },
        avgUsageCount: { $avg: '$usageCount' },
        mostUsedPermission: {
          $max: {
            usageCount: '$usageCount',
            featureName: '$featureName'
          }
        }
      }
    }
  ]);
};

export default mongoose.models.PropertyPermission || mongoose.model<IPropertyPermission>('PropertyPermission', PropertyPermissionSchema); 