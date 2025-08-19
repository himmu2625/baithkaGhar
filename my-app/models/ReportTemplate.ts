import mongoose, { Document, Schema } from 'mongoose';

export interface IReportTemplate extends Document {
  // Basic Information
  templateId: string;
  name: string;
  description: string;
  propertyId: mongoose.Types.ObjectId;
  category: 'financial' | 'operational' | 'guest' | 'staff' | 'inventory' | 'maintenance' | 'marketing' | 'analytics' | 'compliance' | 'custom';
  subCategory?: string;
  type: 'dashboard' | 'detailed' | 'summary' | 'comparative' | 'trend' | 'forecast' | 'audit' | 'custom';
  status: 'active' | 'inactive' | 'draft' | 'archived';

  // Report Configuration
  configuration: {
    dataSource: {
      primary: string;
      secondary?: string[];
      filters: Array<{
        field: string;
        operator: 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'greater_than' | 'less_than' | 'between' | 'in' | 'not_in';
        value: any;
        dataType: 'string' | 'number' | 'date' | 'boolean' | 'array';
      }>;
      dateRange: {
        type: 'fixed' | 'relative' | 'custom';
        startDate?: Date;
        endDate?: Date;
        relativePeriod?: 'today' | 'yesterday' | 'last_7_days' | 'last_30_days' | 'last_90_days' | 'this_month' | 'last_month' | 'this_quarter' | 'last_quarter' | 'this_year' | 'last_year';
      };
    };
    layout: {
      orientation: 'portrait' | 'landscape';
      pageSize: 'A4' | 'A3' | 'letter' | 'legal';
      margins: {
        top: number;
        bottom: number;
        left: number;
        right: number;
      };
      header: {
        enabled: boolean;
        logo?: string;
        title: string;
        subtitle?: string;
        showDate: boolean;
        showPageNumbers: boolean;
      };
      footer: {
        enabled: boolean;
        text?: string;
        showPageNumbers: boolean;
        showTotalPages: boolean;
      };
    };
    sections: Array<{
      id: string;
      name: string;
      type: 'text' | 'table' | 'chart' | 'image' | 'summary' | 'details';
      position: {
        x: number;
        y: number;
        width: number;
        height: number;
      };
      content: {
        text?: string;
        table?: {
          columns: Array<{
            field: string;
            header: string;
            width?: number;
            align?: 'left' | 'center' | 'right';
            format?: string;
            sortable: boolean;
            filterable: boolean;
          }>;
          dataSource: string;
          pagination: {
            enabled: boolean;
            pageSize: number;
          };
          sorting: {
            enabled: boolean;
            defaultSort: string;
            defaultOrder: 'asc' | 'desc';
          };
        };
        chart?: {
          type: 'bar' | 'line' | 'pie' | 'doughnut' | 'area' | 'scatter' | 'radar' | 'bubble';
          dataSource: string;
          xAxis: string;
          yAxis: string;
          series?: string[];
          options: object;
        };
        summary?: {
          metrics: Array<{
            name: string;
            calculation: string;
            format: string;
            color?: string;
          }>;
          layout: 'horizontal' | 'vertical' | 'grid';
        };
      };
      styling: {
        backgroundColor?: string;
        borderColor?: string;
        borderWidth?: number;
        padding?: number;
        fontSize?: number;
        fontFamily?: string;
        fontWeight?: string;
      };
    }>;
  };

  // Data Processing
  dataProcessing: {
    aggregations: Array<{
      field: string;
      function: 'sum' | 'avg' | 'count' | 'min' | 'max' | 'distinct';
      alias: string;
    }>;
    groupings: Array<{
      field: string;
      order: 'asc' | 'desc';
    }>;
    calculations: Array<{
      name: string;
      formula: string;
      dataType: 'number' | 'string' | 'date' | 'boolean';
      format?: string;
    }>;
    transformations: Array<{
      type: 'filter' | 'sort' | 'limit' | 'offset' | 'custom';
      parameters: object;
    }>;
  };

  // Visualization & Charts
  visualizations: Array<{
    id: string;
    name: string;
    type: 'chart' | 'table' | 'gauge' | 'progress' | 'metric' | 'heatmap' | 'treemap';
    dataSource: string;
    configuration: {
      chartType?: 'bar' | 'line' | 'pie' | 'doughnut' | 'area' | 'scatter' | 'radar' | 'bubble';
      dimensions: string[];
      measures: Array<{
        field: string;
        aggregation: string;
        format?: string;
      }>;
      options: object;
    };
    position: {
      x: number;
      y: number;
      width: number;
      height: number;
    };
    styling: {
      backgroundColor?: string;
      borderColor?: string;
      borderWidth?: number;
      title?: string;
      subtitle?: string;
    };
  }>;

  // Scheduling & Automation
  scheduling: {
    enabled: boolean;
    frequency: 'once' | 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'custom';
    schedule: {
      dayOfWeek?: number; // 0-6 (Sunday-Saturday)
      dayOfMonth?: number; // 1-31
      hour: number; // 0-23
      minute: number; // 0-59
      timezone: string;
    };
    recipients: Array<{
      type: 'email' | 'user' | 'role' | 'department';
      value: string;
      format: 'pdf' | 'excel' | 'csv' | 'html';
    }>;
    conditions: Array<{
      field: string;
      operator: string;
      value: any;
      action: 'generate' | 'skip' | 'alert';
    }>;
  };

  // Access Control & Permissions
  permissions: {
    viewAccess: Array<{
      type: 'user' | 'role' | 'department';
      id: string;
    }>;
    editAccess: Array<{
      type: 'user' | 'role' | 'department';
      id: string;
    }>;
    shareAccess: Array<{
      type: 'user' | 'role' | 'department';
      id: string;
    }>;
    exportAccess: Array<{
      type: 'user' | 'role' | 'department';
      id: string;
    }>;
  };

  // Export Options
  exportOptions: {
    formats: Array<{
      format: 'pdf' | 'excel' | 'csv' | 'html' | 'json' | 'xml';
      enabled: boolean;
      options?: object;
    }>;
    compression: {
      enabled: boolean;
      level: number; // 1-9
    };
    watermark: {
      enabled: boolean;
      text?: string;
      image?: string;
      position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';
      opacity: number; // 0-1
    };
    security: {
      password?: string;
      encryption?: boolean;
      watermark?: boolean;
      readOnly?: boolean;
    };
  };

  // Performance & Caching
  performance: {
    caching: {
      enabled: boolean;
      duration: number; // in minutes
      strategy: 'memory' | 'disk' | 'redis';
    };
    optimization: {
      queryOptimization: boolean;
      dataCompression: boolean;
      lazyLoading: boolean;
    };
    limits: {
      maxRows: number;
      maxColumns: number;
      maxFileSize: number; // in MB
      timeout: number; // in seconds
    };
  };

  // Version Control
  versioning: {
    currentVersion: number;
    versions: Array<{
      version: number;
      changes: string;
      createdBy: mongoose.Types.ObjectId;
      createdAt: Date;
      isActive: boolean;
    }>;
    autoSave: boolean;
    backupFrequency: 'daily' | 'weekly' | 'monthly';
  };

  // Notifications & Alerts
  notifications: {
    generationComplete: boolean;
    generationFailed: boolean;
    scheduleReminder: boolean;
    dataUpdateAlert: boolean;
    performanceAlert: boolean;
    recipients: Array<{
      type: 'email' | 'sms' | 'push' | 'webhook';
      value: string;
      conditions: Array<{
        field: string;
        operator: string;
        value: any;
      }>;
    }>;
  };

  // Usage Analytics
  analytics: {
    usageCount: number;
    lastUsed: Date;
    averageGenerationTime: number; // in seconds
    successRate: number; // percentage
    userFeedback: Array<{
      rating: number; // 1-5
      comment: string;
      userId: mongoose.Types.ObjectId;
      date: Date;
    }>;
    popularExports: Array<{
      format: string;
      count: number;
    }>;
  };

  // Custom Fields & Extensions
  customFields: Array<{
    name: string;
    type: 'text' | 'number' | 'date' | 'boolean' | 'select';
    value: any;
    required: boolean;
    validation?: string;
  }>;

  // System Tracking
  createdBy: mongoose.Types.ObjectId;
  lastModifiedBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ReportTemplateSchema = new Schema<IReportTemplate>({
  // Basic Information
  templateId: {
    type: String,
    required: true,
    unique: true,
    trim: true
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
  propertyId: {
    type: Schema.Types.ObjectId,
    ref: 'Property',
    required: true
  },
  category: {
    type: String,
    enum: ['financial', 'operational', 'guest', 'staff', 'inventory', 'maintenance', 'marketing', 'analytics', 'compliance', 'custom'],
    required: true
  },
  subCategory: String,
  type: {
    type: String,
    enum: ['dashboard', 'detailed', 'summary', 'comparative', 'trend', 'forecast', 'audit', 'custom'],
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'draft', 'archived'],
    default: 'draft'
  },

  // Report Configuration
  configuration: {
    dataSource: {
      primary: { type: String, required: true },
      secondary: [String],
      filters: [{
        field: { type: String, required: true },
        operator: {
          type: String,
          enum: ['equals', 'not_equals', 'contains', 'not_contains', 'greater_than', 'less_than', 'between', 'in', 'not_in'],
          required: true
        },
        value: Schema.Types.Mixed,
        dataType: {
          type: String,
          enum: ['string', 'number', 'date', 'boolean', 'array'],
          required: true
        }
      }],
      dateRange: {
        type: {
          type: String,
          enum: ['fixed', 'relative', 'custom'],
          required: true
        },
        startDate: Date,
        endDate: Date,
        relativePeriod: {
          type: String,
          enum: ['today', 'yesterday', 'last_7_days', 'last_30_days', 'last_90_days', 'this_month', 'last_month', 'this_quarter', 'last_quarter', 'this_year', 'last_year']
        }
      }
    },
    layout: {
      orientation: {
        type: String,
        enum: ['portrait', 'landscape'],
        default: 'portrait'
      },
      pageSize: {
        type: String,
        enum: ['A4', 'A3', 'letter', 'legal'],
        default: 'A4'
      },
      margins: {
        top: { type: Number, default: 20 },
        bottom: { type: Number, default: 20 },
        left: { type: Number, default: 20 },
        right: { type: Number, default: 20 }
      },
      header: {
        enabled: { type: Boolean, default: true },
        logo: String,
        title: { type: String, required: true },
        subtitle: String,
        showDate: { type: Boolean, default: true },
        showPageNumbers: { type: Boolean, default: true }
      },
      footer: {
        enabled: { type: Boolean, default: true },
        text: String,
        showPageNumbers: { type: Boolean, default: true },
        showTotalPages: { type: Boolean, default: true }
      }
    },
    sections: [{
      id: { type: String, required: true },
      name: { type: String, required: true },
      type: {
        type: String,
        enum: ['text', 'table', 'chart', 'image', 'summary', 'details'],
        required: true
      },
      position: {
        x: { type: Number, required: true },
        y: { type: Number, required: true },
        width: { type: Number, required: true },
        height: { type: Number, required: true }
      },
      content: {
        text: String,
        table: {
          columns: [{
            field: { type: String, required: true },
            header: { type: String, required: true },
            width: Number,
            align: {
              type: String,
              enum: ['left', 'center', 'right'],
              default: 'left'
            },
            format: String,
            sortable: { type: Boolean, default: true },
            filterable: { type: Boolean, default: true }
          }],
          dataSource: String,
          pagination: {
            enabled: { type: Boolean, default: false },
            pageSize: { type: Number, default: 10 }
          },
          sorting: {
            enabled: { type: Boolean, default: true },
            defaultSort: String,
            defaultOrder: {
              type: String,
              enum: ['asc', 'desc'],
              default: 'asc'
            }
          }
        },
        chart: {
          type: {
            type: String,
            enum: ['bar', 'line', 'pie', 'doughnut', 'area', 'scatter', 'radar', 'bubble']
          },
          dataSource: String,
          xAxis: String,
          yAxis: String,
          series: [String],
          options: Schema.Types.Mixed
        },
        summary: {
          metrics: [{
            name: { type: String, required: true },
            calculation: { type: String, required: true },
            format: { type: String, required: true },
            color: String
          }],
          layout: {
            type: String,
            enum: ['horizontal', 'vertical', 'grid'],
            default: 'horizontal'
          }
        }
      },
      styling: {
        backgroundColor: String,
        borderColor: String,
        borderWidth: Number,
        padding: Number,
        fontSize: Number,
        fontFamily: String,
        fontWeight: String
      }
    }]
  },

  // Data Processing
  dataProcessing: {
    aggregations: [{
      field: { type: String, required: true },
      function: {
        type: String,
        enum: ['sum', 'avg', 'count', 'min', 'max', 'distinct'],
        required: true
      },
      alias: { type: String, required: true }
    }],
    groupings: [{
      field: { type: String, required: true },
      order: {
        type: String,
        enum: ['asc', 'desc'],
        default: 'asc'
      }
    }],
    calculations: [{
      name: { type: String, required: true },
      formula: { type: String, required: true },
      dataType: {
        type: String,
        enum: ['number', 'string', 'date', 'boolean'],
        required: true
      },
      format: String
    }],
    transformations: [{
      type: {
        type: String,
        enum: ['filter', 'sort', 'limit', 'offset', 'custom'],
        required: true
      },
      parameters: Schema.Types.Mixed
    }]
  },

  // Visualization & Charts
  visualizations: [{
    id: { type: String, required: true },
    name: { type: String, required: true },
    type: {
      type: String,
      enum: ['chart', 'table', 'gauge', 'progress', 'metric', 'heatmap', 'treemap'],
      required: true
    },
    dataSource: { type: String, required: true },
    configuration: {
      chartType: {
        type: String,
        enum: ['bar', 'line', 'pie', 'doughnut', 'area', 'scatter', 'radar', 'bubble']
      },
      dimensions: [String],
      measures: [{
        field: { type: String, required: true },
        aggregation: { type: String, required: true },
        format: String
      }],
      options: Schema.Types.Mixed
    },
    position: {
      x: { type: Number, required: true },
      y: { type: Number, required: true },
      width: { type: Number, required: true },
      height: { type: Number, required: true }
    },
    styling: {
      backgroundColor: String,
      borderColor: String,
      borderWidth: Number,
      title: String,
      subtitle: String
    }
  }],

  // Scheduling & Automation
  scheduling: {
    enabled: { type: Boolean, default: false },
    frequency: {
      type: String,
      enum: ['once', 'daily', 'weekly', 'monthly', 'quarterly', 'yearly', 'custom'],
      required: true
    },
    schedule: {
      dayOfWeek: Number,
      dayOfMonth: Number,
      hour: { type: Number, required: true },
      minute: { type: Number, required: true },
      timezone: { type: String, default: 'UTC' }
    },
    recipients: [{
      type: {
        type: String,
        enum: ['email', 'user', 'role', 'department'],
        required: true
      },
      value: { type: String, required: true },
      format: {
        type: String,
        enum: ['pdf', 'excel', 'csv', 'html'],
        default: 'pdf'
      }
    }],
    conditions: [{
      field: { type: String, required: true },
      operator: { type: String, required: true },
      value: Schema.Types.Mixed,
      action: {
        type: String,
        enum: ['generate', 'skip', 'alert'],
        default: 'generate'
      }
    }]
  },

  // Access Control & Permissions
  permissions: {
    viewAccess: [{
      type: {
        type: String,
        enum: ['user', 'role', 'department'],
        required: true
      },
      id: { type: String, required: true }
    }],
    editAccess: [{
      type: {
        type: String,
        enum: ['user', 'role', 'department'],
        required: true
      },
      id: { type: String, required: true }
    }],
    shareAccess: [{
      type: {
        type: String,
        enum: ['user', 'role', 'department'],
        required: true
      },
      id: { type: String, required: true }
    }],
    exportAccess: [{
      type: {
        type: String,
        enum: ['user', 'role', 'department'],
        required: true
      },
      id: { type: String, required: true }
    }]
  },

  // Export Options
  exportOptions: {
    formats: [{
      format: {
        type: String,
        enum: ['pdf', 'excel', 'csv', 'html', 'json', 'xml'],
        required: true
      },
      enabled: { type: Boolean, default: true },
      options: Schema.Types.Mixed
    }],
    compression: {
      enabled: { type: Boolean, default: false },
      level: { type: Number, min: 1, max: 9, default: 6 }
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
    security: {
      password: String,
      encryption: { type: Boolean, default: false },
      watermark: { type: Boolean, default: false },
      readOnly: { type: Boolean, default: false }
    }
  },

  // Performance & Caching
  performance: {
    caching: {
      enabled: { type: Boolean, default: true },
      duration: { type: Number, default: 30 }, // in minutes
      strategy: {
        type: String,
        enum: ['memory', 'disk', 'redis'],
        default: 'memory'
      }
    },
    optimization: {
      queryOptimization: { type: Boolean, default: true },
      dataCompression: { type: Boolean, default: true },
      lazyLoading: { type: Boolean, default: true }
    },
    limits: {
      maxRows: { type: Number, default: 10000 },
      maxColumns: { type: Number, default: 100 },
      maxFileSize: { type: Number, default: 50 }, // in MB
      timeout: { type: Number, default: 300 } // in seconds
    }
  },

  // Version Control
  versioning: {
    currentVersion: { type: Number, default: 1 },
    versions: [{
      version: { type: Number, required: true },
      changes: { type: String, required: true },
      createdBy: {
        type: Schema.Types.ObjectId,
        ref: 'Staff',
        required: true
      },
      createdAt: { type: Date, required: true },
      isActive: { type: Boolean, default: false }
    }],
    autoSave: { type: Boolean, default: true },
    backupFrequency: {
      type: String,
      enum: ['daily', 'weekly', 'monthly'],
      default: 'weekly'
    }
  },

  // Notifications & Alerts
  notifications: {
    generationComplete: { type: Boolean, default: true },
    generationFailed: { type: Boolean, default: true },
    scheduleReminder: { type: Boolean, default: true },
    dataUpdateAlert: { type: Boolean, default: false },
    performanceAlert: { type: Boolean, default: false },
    recipients: [{
      type: {
        type: String,
        enum: ['email', 'sms', 'push', 'webhook'],
        required: true
      },
      value: { type: String, required: true },
      conditions: [{
        field: { type: String, required: true },
        operator: { type: String, required: true },
        value: Schema.Types.Mixed
      }]
    }]
  },

  // Usage Analytics
  analytics: {
    usageCount: { type: Number, default: 0 },
    lastUsed: Date,
    averageGenerationTime: { type: Number, default: 0 }, // in seconds
    successRate: { type: Number, min: 0, max: 100, default: 100 }, // percentage
    userFeedback: [{
      rating: { type: Number, min: 1, max: 5, required: true },
      comment: String,
      userId: {
        type: Schema.Types.ObjectId,
        ref: 'Staff',
        required: true
      },
      date: { type: Date, required: true }
    }],
    popularExports: [{
      format: { type: String, required: true },
      count: { type: Number, default: 0 }
    }]
  },

  // Custom Fields & Extensions
  customFields: [{
    name: { type: String, required: true },
    type: {
      type: String,
      enum: ['text', 'number', 'date', 'boolean', 'select'],
      required: true
    },
    value: Schema.Types.Mixed,
    required: { type: Boolean, default: false },
    validation: String
  }],

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
ReportTemplateSchema.index({ propertyId: 1, status: 1 });
ReportTemplateSchema.index({ category: 1, type: 1 });
ReportTemplateSchema.index({ templateId: 1 });
ReportTemplateSchema.index({ 'scheduling.enabled': 1 });

// Virtual for template complexity
ReportTemplateSchema.virtual('complexity').get(function() {
  const sections = this.configuration.sections.length;
  const visualizations = this.visualizations.length;
  const dataSources = this.configuration.dataSource.secondary ? this.configuration.dataSource.secondary.length + 1 : 1;
  
  let complexity = 'simple';
  if (sections > 5 || visualizations > 3 || dataSources > 2) complexity = 'complex';
  else if (sections > 3 || visualizations > 2 || dataSources > 1) complexity = 'moderate';
  
  return complexity;
});

// Virtual for estimated generation time
ReportTemplateSchema.virtual('estimatedGenerationTime').get(function() {
  const sections = this.configuration.sections.length;
  const visualizations = this.visualizations.length;
  const dataProcessing = this.dataProcessing.aggregations.length + this.dataProcessing.calculations.length;
  
  return Math.max(30, sections * 10 + visualizations * 15 + dataProcessing * 5); // in seconds
});

// Virtual for template popularity
ReportTemplateSchema.virtual('popularity').get(function() {
  if (this.analytics.usageCount > 100) return 'high';
  if (this.analytics.usageCount > 50) return 'medium';
  if (this.analytics.usageCount > 10) return 'low';
  return 'new';
});

// Pre-save middleware
ReportTemplateSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Static methods
ReportTemplateSchema.statics.findByProperty = function(propertyId: string, status?: string) {
  const query: any = { propertyId };
  if (status) query.status = status;
  return this.find(query).sort({ name: 1 });
};

ReportTemplateSchema.statics.findByCategory = function(propertyId: string, category: string) {
  return this.find({ propertyId, category, status: 'active' });
};

ReportTemplateSchema.statics.getPopularTemplates = function(propertyId: string, limit: number = 10) {
  return this.find({ propertyId, status: 'active' })
    .sort({ 'analytics.usageCount': -1 })
    .limit(limit);
};

ReportTemplateSchema.statics.getTemplateAnalytics = function(propertyId: string) {
  return this.aggregate([
    {
      $match: {
        propertyId: new mongoose.Types.ObjectId(propertyId)
      }
    },
    {
      $group: {
        _id: '$category',
        count: { $sum: 1 },
        avgUsageCount: { $avg: '$analytics.usageCount' },
        avgGenerationTime: { $avg: '$analytics.averageGenerationTime' },
        avgSuccessRate: { $avg: '$analytics.successRate' }
      }
    }
  ]);
};

export default mongoose.models.ReportTemplate || mongoose.model<IReportTemplate>('ReportTemplate', ReportTemplateSchema); 