import mongoose, { Document, Schema } from 'mongoose';

export interface IReportSchedule extends Document {
  // Basic Information
  scheduleId: string;
  templateId: mongoose.Types.ObjectId;
  propertyId: mongoose.Types.ObjectId;
  name: string;
  description: string;
  status: 'active' | 'inactive' | 'paused' | 'completed' | 'cancelled';

  // Schedule Configuration
  schedule: {
    frequency: 'once' | 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'custom';
    startDate: Date;
    endDate?: Date;
    time: {
      hour: number; // 0-23
      minute: number; // 0-59
      timezone: string;
    };
    daysOfWeek?: number[]; // 0-6 (Sunday-Saturday)
    dayOfMonth?: number; // 1-31
    weekOfMonth?: number; // 1-5
    customCron?: string;
    nextRun: Date;
    lastRun?: Date;
    totalRuns: number;
    successfulRuns: number;
    failedRuns: number;
  };

  // Report Parameters
  parameters: {
    dateRange: {
      type: 'fixed' | 'relative' | 'dynamic';
      startDate?: Date;
      endDate?: Date;
      relativePeriod?: 'today' | 'yesterday' | 'last_7_days' | 'last_30_days' | 'last_90_days' | 'this_month' | 'last_month' | 'this_quarter' | 'last_quarter' | 'this_year' | 'last_year';
      dynamicOffset?: number; // days to offset from current date
    };
    filters: Array<{
      field: string;
      operator: string;
      value: any;
      dataType: string;
    }>;
    customParameters: Array<{
      name: string;
      value: any;
      type: string;
    }>;
    dataSources: Array<{
      name: string;
      type: string;
      refreshRequired: boolean;
    }>;
  };

  // Recipients & Delivery
  recipients: Array<{
    type: 'email' | 'user' | 'role' | 'department' | 'webhook' | 'ftp' | 's3';
    value: string;
    name?: string;
    format: 'pdf' | 'excel' | 'csv' | 'html' | 'all';
    priority: 'low' | 'normal' | 'high' | 'urgent';
    status: 'active' | 'inactive' | 'error';
    lastDelivery?: Date;
    deliveryCount: number;
    failureCount: number;
    errorMessage?: string;
    retryCount: number;
    maxRetries: number;
  }>;

  // Conditions & Triggers
  conditions: Array<{
    type: 'data' | 'time' | 'event' | 'threshold' | 'custom';
    field: string;
    operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains' | 'between';
    value: any;
    action: 'generate' | 'skip' | 'alert' | 'modify';
    description: string;
    enabled: boolean;
  }>;

  // Execution & Performance
  execution: {
    maxConcurrentRuns: number;
    timeout: number; // in seconds
    retryOnFailure: boolean;
    maxRetries: number;
    retryDelay: number; // in minutes
    priority: 'low' | 'normal' | 'high' | 'urgent';
    resourceLimits: {
      maxMemory: number; // in MB
      maxCpu: number; // percentage
      maxDuration: number; // in seconds
    };
    performance: {
      averageExecutionTime: number; // in seconds
      averageFileSize: number; // in bytes
      successRate: number; // percentage
      lastExecutionTime?: number;
      lastFileSize?: number;
    };
  };

  // Notifications & Alerts
  notifications: {
    onSuccess: boolean;
    onFailure: boolean;
    onSkipped: boolean;
    onConditionMet: boolean;
    recipients: Array<{
      type: 'email' | 'sms' | 'push' | 'webhook';
      value: string;
      events: string[]; // ['success', 'failure', 'skipped', 'condition']
    }>;
    alertThresholds: Array<{
      metric: 'execution_time' | 'file_size' | 'error_rate' | 'success_rate';
      operator: 'greater_than' | 'less_than' | 'equals';
      value: number;
      action: 'alert' | 'pause' | 'modify';
    }>;
  };

  // Quality & Validation
  quality: {
    validationRequired: boolean;
    validationRules: Array<{
      name: string;
      type: 'data_quality' | 'format_check' | 'size_limit' | 'content_check';
      parameters: object;
      enabled: boolean;
    }>;
    qualityThresholds: {
      minDataCompleteness: number; // percentage
      maxErrorRate: number; // percentage
      minFileSize: number; // in bytes
      maxFileSize: number; // in bytes
    };
    autoCorrection: {
      enabled: boolean;
      rules: Array<{
        condition: string;
        action: string;
        parameters: object;
      }>;
    };
  };

  // Security & Access Control
  security: {
    encryption: {
      enabled: boolean;
      algorithm: string;
      keySize: number;
    };
    watermark: {
      enabled: boolean;
      text?: string;
      image?: string;
      position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';
      opacity: number; // 0-1
    };
    accessControl: {
      password?: string;
      expirationDate?: Date;
      maxDownloads: number;
      ipRestrictions?: string[];
      userRestrictions?: mongoose.Types.ObjectId[];
    };
    audit: {
      enabled: boolean;
      logAccess: boolean;
      logModifications: boolean;
      retentionPeriod: number; // in days
    };
  };

  // Storage & Archival
  storage: {
    retentionPolicy: {
      enabled: boolean;
      keepReports: number; // number of reports to keep
      keepDays: number; // number of days to keep
      archiveAfter: number; // days after which to archive
      deleteAfter: number; // days after which to delete
    };
    compression: {
      enabled: boolean;
      algorithm: 'gzip' | 'zip' | '7zip';
      level: number; // 1-9
    };
    backup: {
      enabled: boolean;
      frequency: 'daily' | 'weekly' | 'monthly';
      location: string;
      encryption: boolean;
    };
  };

  // Monitoring & Analytics
  monitoring: {
    enabled: boolean;
    metrics: Array<{
      name: string;
      type: 'counter' | 'gauge' | 'histogram';
      description: string;
      unit?: string;
    }>;
    alerts: Array<{
      name: string;
      condition: string;
      threshold: number;
      action: 'email' | 'sms' | 'webhook' | 'pause_schedule';
      enabled: boolean;
    }>;
    dashboard: {
      enabled: boolean;
      refreshInterval: number; // in seconds
      widgets: Array<{
        type: string;
        title: string;
        configuration: object;
      }>;
    };
  };

  // Dependencies & Relationships
  dependencies: {
    prerequisites: Array<{
      type: 'report' | 'data_source' | 'system' | 'external';
      id: string;
      name: string;
      status: 'pending' | 'ready' | 'failed';
      timeout: number; // in minutes
    }>;
    postActions: Array<{
      type: 'notification' | 'webhook' | 'data_update' | 'system_action';
      name: string;
      parameters: object;
      enabled: boolean;
    }>;
    rollback: {
      enabled: boolean;
      actions: Array<{
        type: string;
        parameters: object;
      }>;
    };
  };

  // Custom Fields & Extensions
  customFields: Array<{
    name: string;
    value: any;
    type: string;
  }>;
  tags: string[];
  notes: string;

  // System Tracking
  createdBy: mongoose.Types.ObjectId;
  lastModifiedBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ReportScheduleSchema = new Schema<IReportSchedule>({
  // Basic Information
  scheduleId: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  templateId: {
    type: Schema.Types.ObjectId,
    ref: 'ReportTemplate',
    required: true
  },
  propertyId: {
    type: Schema.Types.ObjectId,
    ref: 'Property',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'paused', 'completed', 'cancelled'],
    default: 'active'
  },

  // Schedule Configuration
  schedule: {
    frequency: {
      type: String,
      enum: ['once', 'daily', 'weekly', 'monthly', 'quarterly', 'yearly', 'custom'],
      required: true
    },
    startDate: {
      type: Date,
      required: true
    },
    endDate: Date,
    time: {
      hour: { type: Number, min: 0, max: 23, required: true },
      minute: { type: Number, min: 0, max: 59, required: true },
      timezone: { type: String, default: 'UTC' }
    },
    daysOfWeek: [Number],
    dayOfMonth: Number,
    weekOfMonth: Number,
    customCron: String,
    nextRun: {
      type: Date,
      required: true
    },
    lastRun: Date,
    totalRuns: { type: Number, default: 0 },
    successfulRuns: { type: Number, default: 0 },
    failedRuns: { type: Number, default: 0 }
  },

  // Report Parameters
  parameters: {
    dateRange: {
      type: {
        type: String,
        enum: ['fixed', 'relative', 'dynamic'],
        required: true
      },
      startDate: Date,
      endDate: Date,
      relativePeriod: {
        type: String,
        enum: ['today', 'yesterday', 'last_7_days', 'last_30_days', 'last_90_days', 'this_month', 'last_month', 'this_quarter', 'last_quarter', 'this_year', 'last_year']
      },
      dynamicOffset: Number
    },
    filters: [{
      field: { type: String, required: true },
      operator: { type: String, required: true },
      value: Schema.Types.Mixed,
      dataType: { type: String, required: true }
    }],
    customParameters: [{
      name: { type: String, required: true },
      value: Schema.Types.Mixed,
      type: { type: String, required: true }
    }],
    dataSources: [{
      name: { type: String, required: true },
      type: { type: String, required: true },
      refreshRequired: { type: Boolean, default: false }
    }]
  },

  // Recipients & Delivery
  recipients: [{
    type: {
      type: String,
      enum: ['email', 'user', 'role', 'department', 'webhook', 'ftp', 's3'],
      required: true
    },
    value: { type: String, required: true },
    name: String,
    format: {
      type: String,
      enum: ['pdf', 'excel', 'csv', 'html', 'all'],
      default: 'pdf'
    },
    priority: {
      type: String,
      enum: ['low', 'normal', 'high', 'urgent'],
      default: 'normal'
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'error'],
      default: 'active'
    },
    lastDelivery: Date,
    deliveryCount: { type: Number, default: 0 },
    failureCount: { type: Number, default: 0 },
    errorMessage: String,
    retryCount: { type: Number, default: 0 },
    maxRetries: { type: Number, default: 3 }
  }],

  // Conditions & Triggers
  conditions: [{
    type: {
      type: String,
      enum: ['data', 'time', 'event', 'threshold', 'custom'],
      required: true
    },
    field: { type: String, required: true },
    operator: {
      type: String,
      enum: ['equals', 'not_equals', 'greater_than', 'less_than', 'contains', 'between'],
      required: true
    },
    value: Schema.Types.Mixed,
    action: {
      type: String,
      enum: ['generate', 'skip', 'alert', 'modify'],
      default: 'generate'
    },
    description: { type: String, required: true },
    enabled: { type: Boolean, default: true }
  }],

  // Execution & Performance
  execution: {
    maxConcurrentRuns: { type: Number, default: 1 },
    timeout: { type: Number, default: 300 }, // in seconds
    retryOnFailure: { type: Boolean, default: true },
    maxRetries: { type: Number, default: 3 },
    retryDelay: { type: Number, default: 5 }, // in minutes
    priority: {
      type: String,
      enum: ['low', 'normal', 'high', 'urgent'],
      default: 'normal'
    },
    resourceLimits: {
      maxMemory: { type: Number, default: 512 }, // in MB
      maxCpu: { type: Number, default: 80 }, // percentage
      maxDuration: { type: Number, default: 600 } // in seconds
    },
    performance: {
      averageExecutionTime: { type: Number, default: 0 },
      averageFileSize: { type: Number, default: 0 },
      successRate: { type: Number, min: 0, max: 100, default: 100 },
      lastExecutionTime: Number,
      lastFileSize: Number
    }
  },

  // Notifications & Alerts
  notifications: {
    onSuccess: { type: Boolean, default: true },
    onFailure: { type: Boolean, default: true },
    onSkipped: { type: Boolean, default: false },
    onConditionMet: { type: Boolean, default: false },
    recipients: [{
      type: {
        type: String,
        enum: ['email', 'sms', 'push', 'webhook'],
        required: true
      },
      value: { type: String, required: true },
      events: [String]
    }],
    alertThresholds: [{
      metric: {
        type: String,
        enum: ['execution_time', 'file_size', 'error_rate', 'success_rate'],
        required: true
      },
      operator: {
        type: String,
        enum: ['greater_than', 'less_than', 'equals'],
        required: true
      },
      value: { type: Number, required: true },
      action: {
        type: String,
        enum: ['alert', 'pause', 'modify'],
        default: 'alert'
      }
    }]
  },

  // Quality & Validation
  quality: {
    validationRequired: { type: Boolean, default: false },
    validationRules: [{
      name: { type: String, required: true },
      type: {
        type: String,
        enum: ['data_quality', 'format_check', 'size_limit', 'content_check'],
        required: true
      },
      parameters: Schema.Types.Mixed,
      enabled: { type: Boolean, default: true }
    }],
    qualityThresholds: {
      minDataCompleteness: { type: Number, min: 0, max: 100, default: 90 },
      maxErrorRate: { type: Number, min: 0, max: 100, default: 5 },
      minFileSize: { type: Number, default: 0 },
      maxFileSize: { type: Number, default: 100 * 1024 * 1024 } // 100MB
    },
    autoCorrection: {
      enabled: { type: Boolean, default: false },
      rules: [{
        condition: { type: String, required: true },
        action: { type: String, required: true },
        parameters: Schema.Types.Mixed
      }]
    }
  },

  // Security & Access Control
  security: {
    encryption: {
      enabled: { type: Boolean, default: false },
      algorithm: { type: String, default: 'AES-256' },
      keySize: { type: Number, default: 256 }
    },
    watermark: {
      enabled: { type: Boolean, default: false },
      text: String,
      image: String,
      position: {
        type: String,
        enum: ['top-left', 'top-right', 'bottom-left', 'bottom-right', 'center'],
        default: 'center'
      },
      opacity: { type: Number, min: 0, max: 1, default: 0.5 }
    },
    accessControl: {
      password: String,
      expirationDate: Date,
      maxDownloads: { type: Number, default: -1 }, // -1 means unlimited
      ipRestrictions: [String],
      userRestrictions: [{
        type: Schema.Types.ObjectId,
        ref: 'Staff'
      }]
    },
    audit: {
      enabled: { type: Boolean, default: true },
      logAccess: { type: Boolean, default: true },
      logModifications: { type: Boolean, default: true },
      retentionPeriod: { type: Number, default: 365 } // in days
    }
  },

  // Storage & Archival
  storage: {
    retentionPolicy: {
      enabled: { type: Boolean, default: true },
      keepReports: { type: Number, default: 10 },
      keepDays: { type: Number, default: 30 },
      archiveAfter: { type: Number, default: 7 },
      deleteAfter: { type: Number, default: 90 }
    },
    compression: {
      enabled: { type: Boolean, default: true },
      algorithm: {
        type: String,
        enum: ['gzip', 'zip', '7zip'],
        default: 'gzip'
      },
      level: { type: Number, min: 1, max: 9, default: 6 }
    },
    backup: {
      enabled: { type: Boolean, default: true },
      frequency: {
        type: String,
        enum: ['daily', 'weekly', 'monthly'],
        default: 'daily'
      },
      location: { type: String, default: 'backup' },
      encryption: { type: Boolean, default: true }
    }
  },

  // Monitoring & Analytics
  monitoring: {
    enabled: { type: Boolean, default: true },
    metrics: [{
      name: { type: String, required: true },
      type: {
        type: String,
        enum: ['counter', 'gauge', 'histogram'],
        required: true
      },
      description: { type: String, required: true },
      unit: String
    }],
    alerts: [{
      name: { type: String, required: true },
      condition: { type: String, required: true },
      threshold: { type: Number, required: true },
      action: {
        type: String,
        enum: ['email', 'sms', 'webhook', 'pause_schedule'],
        required: true
      },
      enabled: { type: Boolean, default: true }
    }],
    dashboard: {
      enabled: { type: Boolean, default: true },
      refreshInterval: { type: Number, default: 60 }, // in seconds
      widgets: [{
        type: { type: String, required: true },
        title: { type: String, required: true },
        configuration: Schema.Types.Mixed
      }]
    }
  },

  // Dependencies & Relationships
  dependencies: {
    prerequisites: [{
      type: {
        type: String,
        enum: ['report', 'data_source', 'system', 'external'],
        required: true
      },
      id: { type: String, required: true },
      name: { type: String, required: true },
      status: {
        type: String,
        enum: ['pending', 'ready', 'failed'],
        default: 'pending'
      },
      timeout: { type: Number, default: 30 } // in minutes
    }],
    postActions: [{
      type: {
        type: String,
        enum: ['notification', 'webhook', 'data_update', 'system_action'],
        required: true
      },
      name: { type: String, required: true },
      parameters: Schema.Types.Mixed,
      enabled: { type: Boolean, default: true }
    }],
    rollback: {
      enabled: { type: Boolean, default: false },
      actions: [{
        type: { type: String, required: true },
        parameters: Schema.Types.Mixed
      }]
    }
  },

  // Custom Fields & Extensions
  customFields: [{
    name: { type: String, required: true },
    value: Schema.Types.Mixed,
    type: { type: String, required: true }
  }],
  tags: [String],
  notes: String,

  // System Tracking
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'Staff',
    required: true
  },
  lastModifiedBy: {
    type: Schema.Types.ObjectId,
    ref: 'Staff',
    required: true
  },
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
ReportScheduleSchema.index({ propertyId: 1, status: 1 });
ReportScheduleSchema.index({ templateId: 1, status: 1 });
ReportScheduleSchema.index({ 'schedule.nextRun': 1 });
ReportScheduleSchema.index({ scheduleId: 1 });

// Virtual for schedule status
ReportScheduleSchema.virtual('isActive').get(function() {
  return this.status === 'active';
});

// Virtual for next run status
ReportScheduleSchema.virtual('isOverdue').get(function() {
  return this.schedule.nextRun < new Date() && this.status === 'active';
});

// Virtual for success rate
ReportScheduleSchema.virtual('successRate').get(function() {
  if (this.schedule.totalRuns === 0) return 100;
  return (this.schedule.successfulRuns / this.schedule.totalRuns) * 100;
});

// Virtual for average execution time
ReportScheduleSchema.virtual('avgExecutionTime').get(function() {
  return this.execution.performance.averageExecutionTime;
});

// Pre-save middleware
ReportScheduleSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Static methods
ReportScheduleSchema.statics.findByProperty = function(propertyId: string, status?: string) {
  const query: any = { propertyId };
  if (status) query.status = status;
  return this.find(query).sort({ 'schedule.nextRun': 1 });
};

ReportScheduleSchema.statics.findOverdueSchedules = function() {
  return this.find({
    'schedule.nextRun': { $lt: new Date() },
    status: 'active'
  });
};

ReportScheduleSchema.statics.getScheduleAnalytics = function(propertyId: string) {
  return this.aggregate([
    {
      $match: {
        propertyId: new mongoose.Types.ObjectId(propertyId)
      }
    },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        avgSuccessRate: { $avg: '$successRate' },
        avgExecutionTime: { $avg: '$execution.performance.averageExecutionTime' },
        totalRuns: { $sum: '$schedule.totalRuns' }
      }
    }
  ]);
};

export default mongoose.models.ReportSchedule || mongoose.model<IReportSchedule>('ReportSchedule', ReportScheduleSchema); 