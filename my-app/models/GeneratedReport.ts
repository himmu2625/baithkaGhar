import mongoose, { Document, Schema } from 'mongoose';

export interface IGeneratedReport extends Document {
  // Basic Information
  reportId: string;
  templateId: mongoose.Types.ObjectId;
  propertyId: mongoose.Types.ObjectId;
  name: string;
  description: string;
  category: 'financial' | 'operational' | 'guest' | 'staff' | 'inventory' | 'maintenance' | 'marketing' | 'analytics' | 'compliance' | 'custom';
  type: 'dashboard' | 'detailed' | 'summary' | 'comparative' | 'trend' | 'forecast' | 'audit' | 'custom';

  // Generation Details
  generation: {
    status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
    startedAt: Date;
    completedAt?: Date;
    duration?: number; // in seconds
    progress: number; // 0-100
    errorMessage?: string;
    retryCount: number;
    maxRetries: number;
    priority: 'low' | 'normal' | 'high' | 'urgent';
    triggeredBy: 'manual' | 'scheduled' | 'api' | 'system';
    triggeredByUser?: mongoose.Types.ObjectId;
  };

  // Data & Parameters
  parameters: {
    dateRange: {
      startDate: Date;
      endDate: Date;
      type: 'fixed' | 'relative' | 'custom';
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
      lastUpdated: Date;
      recordCount: number;
    }>;
  };

  // Content & Structure
  content: {
    sections: Array<{
      id: string;
      name: string;
      type: string;
      data: any;
      metadata: {
        rowCount: number;
        columnCount: number;
        dataSize: number; // in bytes
        processingTime: number; // in seconds
      };
    }>;
    visualizations: Array<{
      id: string;
      name: string;
      type: string;
      data: any;
      configuration: object;
      metadata: {
        dataPoints: number;
        processingTime: number;
      };
    }>;
    summary: {
      totalRecords: number;
      totalSections: number;
      totalVisualizations: number;
      dataProcessingTime: number;
      renderingTime: number;
      totalSize: number; // in bytes
    };
  };

  // File Storage & Formats
  files: Array<{
    format: 'pdf' | 'excel' | 'csv' | 'html' | 'json' | 'xml';
    url: string;
    filename: string;
    size: number; // in bytes
    checksum: string;
    compression: {
      enabled: boolean;
      originalSize: number;
      compressedSize: number;
      ratio: number; // percentage
    };
    security: {
      password?: string;
      encrypted: boolean;
      watermark: boolean;
      readOnly: boolean;
    };
    metadata: {
      generatedAt: Date;
      generatedBy: mongoose.Types.ObjectId;
      version: string;
      quality: 'draft' | 'standard' | 'high' | 'print';
    };
  }>;

  // Delivery & Distribution
  delivery: {
    status: 'pending' | 'sent' | 'delivered' | 'failed' | 'bounced';
    recipients: Array<{
      type: 'email' | 'user' | 'role' | 'department' | 'webhook';
      value: string;
      format: 'pdf' | 'excel' | 'csv' | 'html';
      status: 'pending' | 'sent' | 'delivered' | 'failed';
      sentAt?: Date;
      deliveredAt?: Date;
      errorMessage?: string;
      retryCount: number;
    }>;
    scheduledDelivery?: {
      scheduledAt: Date;
      timezone: string;
      frequency: 'once' | 'daily' | 'weekly' | 'monthly';
      nextDelivery?: Date;
    };
    notifications: {
      emailSent: boolean;
      smsSent: boolean;
      pushSent: boolean;
      webhookCalled: boolean;
    };
  };

  // Quality & Validation
  quality: {
    validationStatus: 'pending' | 'passed' | 'failed' | 'warning';
    validationChecks: Array<{
      name: string;
      status: 'passed' | 'failed' | 'warning';
      message?: string;
      timestamp: Date;
    }>;
    dataQuality: {
      completeness: number; // percentage
      accuracy: number; // percentage
      consistency: number; // percentage
      timeliness: number; // percentage
      validity: number; // percentage
    };
    performance: {
      generationTime: number; // in seconds
      memoryUsage: number; // in MB
      cpuUsage: number; // percentage
      networkUsage: number; // in MB
      optimizationScore: number; // 0-100
    };
  };

  // Access & Security
  access: {
    permissions: Array<{
      type: 'user' | 'role' | 'department';
      id: string;
      accessLevel: 'view' | 'download' | 'share' | 'edit';
      grantedAt: Date;
      grantedBy: mongoose.Types.ObjectId;
    }>;
    security: {
      encrypted: boolean;
      password?: string;
      watermark: boolean;
      watermarkText?: string;
      watermarkImage?: string;
      expirationDate?: Date;
      maxDownloads: number;
      downloadCount: number;
    };
    audit: {
      accessLog: Array<{
        userId: mongoose.Types.ObjectId;
        action: 'view' | 'download' | 'share' | 'edit';
        timestamp: Date;
        ipAddress?: string;
        userAgent?: string;
      }>;
      shareLog: Array<{
        sharedBy: mongoose.Types.ObjectId;
        sharedWith: string;
        sharedAt: Date;
        format: string;
        expiresAt?: Date;
      }>;
    };
  };

  // Analytics & Usage
  analytics: {
    views: number;
    downloads: number;
    shares: number;
    averageViewTime: number; // in seconds
    popularFormats: Array<{
      format: string;
      count: number;
    }>;
    userEngagement: Array<{
      userId: mongoose.Types.ObjectId;
      views: number;
      downloads: number;
      lastAccessed: Date;
    }>;
    performance: {
      loadTime: number; // in seconds
      renderTime: number; // in seconds
      errorRate: number; // percentage
      successRate: number; // percentage
    };
  };

  // Version Control
  versioning: {
    version: number;
    parentReport?: mongoose.Types.ObjectId;
    changes: Array<{
      field: string;
      oldValue: any;
      newValue: any;
      timestamp: Date;
      changedBy: mongoose.Types.ObjectId;
    }>;
    isLatest: boolean;
    archived: boolean;
    archiveDate?: Date;
  };

  // Notifications & Alerts
  notifications: {
    generationComplete: boolean;
    generationFailed: boolean;
    deliveryComplete: boolean;
    deliveryFailed: boolean;
    qualityAlert: boolean;
    securityAlert: boolean;
    recipients: Array<{
      type: 'email' | 'sms' | 'push' | 'webhook';
      value: string;
      sent: boolean;
      sentAt?: Date;
      status: 'pending' | 'sent' | 'delivered' | 'failed';
    }>;
  };

  // Custom Fields & Metadata
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

const GeneratedReportSchema = new Schema<IGeneratedReport>({
  // Basic Information
  reportId: {
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
  category: {
    type: String,
    enum: ['financial', 'operational', 'guest', 'staff', 'inventory', 'maintenance', 'marketing', 'analytics', 'compliance', 'custom'],
    required: true
  },
  type: {
    type: String,
    enum: ['dashboard', 'detailed', 'summary', 'comparative', 'trend', 'forecast', 'audit', 'custom'],
    required: true
  },

  // Generation Details
  generation: {
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed', 'cancelled'],
      default: 'pending'
    },
    startedAt: {
      type: Date,
      required: true
    },
    completedAt: Date,
    duration: Number,
    progress: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    errorMessage: String,
    retryCount: { type: Number, default: 0 },
    maxRetries: { type: Number, default: 3 },
    priority: {
      type: String,
      enum: ['low', 'normal', 'high', 'urgent'],
      default: 'normal'
    },
    triggeredBy: {
      type: String,
      enum: ['manual', 'scheduled', 'api', 'system'],
      required: true
    },
    triggeredByUser: {
      type: Schema.Types.ObjectId,
      ref: 'Staff'
    }
  },

  // Data & Parameters
  parameters: {
    dateRange: {
      startDate: { type: Date, required: true },
      endDate: { type: Date, required: true },
      type: {
        type: String,
        enum: ['fixed', 'relative', 'custom'],
        required: true
      }
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
      lastUpdated: { type: Date, required: true },
      recordCount: { type: Number, required: true }
    }]
  },

  // Content & Structure
  content: {
    sections: [{
      id: { type: String, required: true },
      name: { type: String, required: true },
      type: { type: String, required: true },
      data: Schema.Types.Mixed,
      metadata: {
        rowCount: { type: Number, default: 0 },
        columnCount: { type: Number, default: 0 },
        dataSize: { type: Number, default: 0 },
        processingTime: { type: Number, default: 0 }
      }
    }],
    visualizations: [{
      id: { type: String, required: true },
      name: { type: String, required: true },
      type: { type: String, required: true },
      data: Schema.Types.Mixed,
      configuration: Schema.Types.Mixed,
      metadata: {
        dataPoints: { type: Number, default: 0 },
        processingTime: { type: Number, default: 0 }
      }
    }],
    summary: {
      totalRecords: { type: Number, default: 0 },
      totalSections: { type: Number, default: 0 },
      totalVisualizations: { type: Number, default: 0 },
      dataProcessingTime: { type: Number, default: 0 },
      renderingTime: { type: Number, default: 0 },
      totalSize: { type: Number, default: 0 }
    }
  },

  // File Storage & Formats
  files: [{
    format: {
      type: String,
      enum: ['pdf', 'excel', 'csv', 'html', 'json', 'xml'],
      required: true
    },
    url: { type: String, required: true },
    filename: { type: String, required: true },
    size: { type: Number, required: true },
    checksum: { type: String, required: true },
    compression: {
      enabled: { type: Boolean, default: false },
      originalSize: { type: Number, default: 0 },
      compressedSize: { type: Number, default: 0 },
      ratio: { type: Number, default: 0 }
    },
    security: {
      password: String,
      encrypted: { type: Boolean, default: false },
      watermark: { type: Boolean, default: false },
      readOnly: { type: Boolean, default: false }
    },
    metadata: {
      generatedAt: { type: Date, required: true },
      generatedBy: {
        type: Schema.Types.ObjectId,
        ref: 'Staff',
        required: true
      },
      version: { type: String, required: true },
      quality: {
        type: String,
        enum: ['draft', 'standard', 'high', 'print'],
        default: 'standard'
      }
    }
  }],

  // Delivery & Distribution
  delivery: {
    status: {
      type: String,
      enum: ['pending', 'sent', 'delivered', 'failed', 'bounced'],
      default: 'pending'
    },
    recipients: [{
      type: {
        type: String,
        enum: ['email', 'user', 'role', 'department', 'webhook'],
        required: true
      },
      value: { type: String, required: true },
      format: {
        type: String,
        enum: ['pdf', 'excel', 'csv', 'html'],
        default: 'pdf'
      },
      status: {
        type: String,
        enum: ['pending', 'sent', 'delivered', 'failed'],
        default: 'pending'
      },
      sentAt: Date,
      deliveredAt: Date,
      errorMessage: String,
      retryCount: { type: Number, default: 0 }
    }],
    scheduledDelivery: {
      scheduledAt: Date,
      timezone: { type: String, default: 'UTC' },
      frequency: {
        type: String,
        enum: ['once', 'daily', 'weekly', 'monthly']
      },
      nextDelivery: Date
    },
    notifications: {
      emailSent: { type: Boolean, default: false },
      smsSent: { type: Boolean, default: false },
      pushSent: { type: Boolean, default: false },
      webhookCalled: { type: Boolean, default: false }
    }
  },

  // Quality & Validation
  quality: {
    validationStatus: {
      type: String,
      enum: ['pending', 'passed', 'failed', 'warning'],
      default: 'pending'
    },
    validationChecks: [{
      name: { type: String, required: true },
      status: {
        type: String,
        enum: ['passed', 'failed', 'warning'],
        required: true
      },
      message: String,
      timestamp: { type: Date, required: true }
    }],
    dataQuality: {
      completeness: { type: Number, min: 0, max: 100, default: 0 },
      accuracy: { type: Number, min: 0, max: 100, default: 0 },
      consistency: { type: Number, min: 0, max: 100, default: 0 },
      timeliness: { type: Number, min: 0, max: 100, default: 0 },
      validity: { type: Number, min: 0, max: 100, default: 0 }
    },
    performance: {
      generationTime: { type: Number, default: 0 },
      memoryUsage: { type: Number, default: 0 },
      cpuUsage: { type: Number, default: 0 },
      networkUsage: { type: Number, default: 0 },
      optimizationScore: { type: Number, min: 0, max: 100, default: 0 }
    }
  },

  // Access & Security
  access: {
    permissions: [{
      type: {
        type: String,
        enum: ['user', 'role', 'department'],
        required: true
      },
      id: { type: String, required: true },
      accessLevel: {
        type: String,
        enum: ['view', 'download', 'share', 'edit'],
        default: 'view'
      },
      grantedAt: { type: Date, required: true },
      grantedBy: {
        type: Schema.Types.ObjectId,
        ref: 'Staff',
        required: true
      }
    }],
    security: {
      encrypted: { type: Boolean, default: false },
      password: String,
      watermark: { type: Boolean, default: false },
      watermarkText: String,
      watermarkImage: String,
      expirationDate: Date,
      maxDownloads: { type: Number, default: -1 }, // -1 means unlimited
      downloadCount: { type: Number, default: 0 }
    },
    audit: {
      accessLog: [{
        userId: {
          type: Schema.Types.ObjectId,
          ref: 'Staff',
          required: true
        },
        action: {
          type: String,
          enum: ['view', 'download', 'share', 'edit'],
          required: true
        },
        timestamp: { type: Date, required: true },
        ipAddress: String,
        userAgent: String
      }],
      shareLog: [{
        sharedBy: {
          type: Schema.Types.ObjectId,
          ref: 'Staff',
          required: true
        },
        sharedWith: { type: String, required: true },
        sharedAt: { type: Date, required: true },
        format: { type: String, required: true },
        expiresAt: Date
      }]
    }
  },

  // Analytics & Usage
  analytics: {
    views: { type: Number, default: 0 },
    downloads: { type: Number, default: 0 },
    shares: { type: Number, default: 0 },
    averageViewTime: { type: Number, default: 0 },
    popularFormats: [{
      format: { type: String, required: true },
      count: { type: Number, default: 0 }
    }],
    userEngagement: [{
      userId: {
        type: Schema.Types.ObjectId,
        ref: 'Staff',
        required: true
      },
      views: { type: Number, default: 0 },
      downloads: { type: Number, default: 0 },
      lastAccessed: { type: Date, required: true }
    }],
    performance: {
      loadTime: { type: Number, default: 0 },
      renderTime: { type: Number, default: 0 },
      errorRate: { type: Number, min: 0, max: 100, default: 0 },
      successRate: { type: Number, min: 0, max: 100, default: 100 }
    }
  },

  // Version Control
  versioning: {
    version: { type: Number, default: 1 },
    parentReport: {
      type: Schema.Types.ObjectId,
      ref: 'GeneratedReport'
    },
    changes: [{
      field: { type: String, required: true },
      oldValue: Schema.Types.Mixed,
      newValue: Schema.Types.Mixed,
      timestamp: { type: Date, required: true },
      changedBy: {
        type: Schema.Types.ObjectId,
        ref: 'Staff',
        required: true
      }
    }],
    isLatest: { type: Boolean, default: true },
    archived: { type: Boolean, default: false },
    archiveDate: Date
  },

  // Notifications & Alerts
  notifications: {
    generationComplete: { type: Boolean, default: true },
    generationFailed: { type: Boolean, default: true },
    deliveryComplete: { type: Boolean, default: true },
    deliveryFailed: { type: Boolean, default: true },
    qualityAlert: { type: Boolean, default: false },
    securityAlert: { type: Boolean, default: false },
    recipients: [{
      type: {
        type: String,
        enum: ['email', 'sms', 'push', 'webhook'],
        required: true
      },
      value: { type: String, required: true },
      sent: { type: Boolean, default: false },
      sentAt: Date,
      status: {
        type: String,
        enum: ['pending', 'sent', 'delivered', 'failed'],
        default: 'pending'
      }
    }]
  },

  // Custom Fields & Metadata
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
GeneratedReportSchema.index({ propertyId: 1, 'generation.status': 1 });
GeneratedReportSchema.index({ templateId: 1, 'generation.status': 1 });
GeneratedReportSchema.index({ category: 1, type: 1 });
GeneratedReportSchema.index({ 'generation.startedAt': 1 });
GeneratedReportSchema.index({ reportId: 1 });

// Virtual for generation duration
GeneratedReportSchema.virtual('generationDuration').get(function() {
  if (!this.generation.completedAt || !this.generation.startedAt) return 0;
  return (this.generation.completedAt.getTime() - this.generation.startedAt.getTime()) / 1000;
});

// Virtual for report status
GeneratedReportSchema.virtual('isCompleted').get(function() {
  return this.generation.status === 'completed';
});

// Virtual for report size
GeneratedReportSchema.virtual('totalFileSize').get(function() {
  return this.files.reduce((total: number, file: any) => total + file.size, 0);
});

// Virtual for delivery status
GeneratedReportSchema.virtual('deliveryStatus').get(function() {
  if (this.delivery.recipients.length === 0) return 'no-recipients';
  const delivered = this.delivery.recipients.filter((r: any) => r.status === 'delivered').length;
  const failed = this.delivery.recipients.filter((r: any) => r.status === 'failed').length;
  const total = this.delivery.recipients.length;
  
  if (delivered === total) return 'all-delivered';
  if (failed === total) return 'all-failed';
  if (delivered > 0) return 'partially-delivered';
  return 'pending';
});

// Pre-save middleware
GeneratedReportSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Static methods
GeneratedReportSchema.statics.findByProperty = function(propertyId: string, status?: string) {
  const query: any = { propertyId };
  if (status) query['generation.status'] = status;
  return this.find(query).sort({ 'generation.startedAt': -1 });
};

GeneratedReportSchema.statics.findByTemplate = function(templateId: string) {
  return this.find({ templateId }).sort({ 'generation.startedAt': -1 });
};

GeneratedReportSchema.statics.getReportAnalytics = function(propertyId: string, startDate: Date, endDate: Date) {
  return this.aggregate([
    {
      $match: {
        propertyId: new mongoose.Types.ObjectId(propertyId),
        'generation.startedAt': { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: '$category',
        count: { $sum: 1 },
        avgGenerationTime: { $avg: '$generation.duration' },
        avgFileSize: { $avg: '$totalFileSize' },
        successRate: {
          $multiply: [
            {
              $divide: [
                { $sum: { $cond: [{ $eq: ['$generation.status', 'completed'] }, 1, 0] } },
                { $sum: 1 }
              ]
            },
            100
          ]
        } as any
      }
    }
  ]);
};

export default mongoose.models.GeneratedReport || mongoose.model<IGeneratedReport>('GeneratedReport', GeneratedReportSchema); 