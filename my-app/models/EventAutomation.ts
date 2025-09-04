import mongoose, { Schema, Document, Types, models, model } from 'mongoose';

export interface IEventAutomation extends Document {
  _id: Types.ObjectId;
  propertyId: Types.ObjectId;
  automationName: string;
  automationType: 'email' | 'sms' | 'whatsapp' | 'notification' | 'task' | 'workflow';
  
  // Trigger Configuration
  triggers: [{
    triggerType: 'event' | 'time' | 'status' | 'condition';
    triggerEvent?: 'booking-created' | 'booking-confirmed' | 'payment-received' | 'event-completed' | 'feedback-received' | 'custom';
    triggerCondition?: {
      field: string;
      operator: 'equals' | 'not-equals' | 'greater-than' | 'less-than' | 'contains' | 'starts-with' | 'ends-with';
      value: any;
    };
    timeDelay?: {
      value: number;
      unit: 'minutes' | 'hours' | 'days' | 'weeks';
    };
    scheduledTime?: {
      time: string; // HH:MM
      daysBeforeEvent?: number;
      daysAfterEvent?: number;
    };
  }];

  // Target Audience
  targetAudience: {
    recipientType: 'client' | 'staff' | 'vendor' | 'custom';
    clientCriteria?: {
      eventType?: string[];
      status?: string[];
      tags?: string[];
      customField?: {
        field: string;
        value: any;
      };
    };
    staffCriteria?: {
      roles?: string[];
      departments?: string[];
      eventInvolvement?: 'assigned' | 'coordinator' | 'manager';
    };
    customRecipients?: string[]; // email addresses
  };

  // Message Configuration
  messageConfig: {
    // Email specific
    emailConfig?: {
      subject: string;
      template: 'booking-confirmation' | 'reminder' | 'thank-you' | 'feedback-request' | 'payment-reminder' | 'custom';
      htmlContent?: string;
      textContent?: string;
      attachments?: string[];
      replyTo?: string;
      bcc?: string[];
    };

    // SMS specific
    smsConfig?: {
      message: string;
      shortUrl?: boolean;
      unicode?: boolean;
    };

    // WhatsApp specific
    whatsappConfig?: {
      template: string;
      parameters?: any[];
      mediaUrl?: string;
    };

    // Push notification specific
    notificationConfig?: {
      title: string;
      body: string;
      icon?: string;
      actionButtons?: [{
        text: string;
        action: string;
      }];
    };

    // Dynamic variables
    variables: string[]; // Available variables like {{clientName}}, {{eventDate}}, etc.
    personalization: boolean;
  };

  // Workflow Actions
  workflowActions?: [{
    actionType: 'send-message' | 'create-task' | 'update-status' | 'assign-staff' | 'schedule-followup' | 'webhook';
    actionConfig: any;
    executionOrder: number;
    conditions?: {
      field: string;
      operator: string;
      value: any;
    }[];
  }];

  // Execution Configuration
  executionConfig: {
    isActive: boolean;
    priority: 'low' | 'normal' | 'high' | 'urgent';
    maxRetries: number;
    retryInterval: number; // minutes
    failureAction: 'stop' | 'continue' | 'alert';
    rateLimiting?: {
      maxPerHour: number;
      maxPerDay: number;
    };
    quietHours?: {
      start: string; // HH:MM
      end: string;   // HH:MM
      timezone: string;
    };
  };

  // A/B Testing
  abTesting?: {
    enabled: boolean;
    variants: [{
      variantName: string;
      weight: number; // percentage 0-100
      messageConfig: any;
    }];
    testDuration: number; // days
    successMetric: 'open-rate' | 'click-rate' | 'conversion-rate';
    winningVariant?: string;
  };

  // Analytics & Performance
  analytics: {
    totalTriggers: number;
    totalExecutions: number;
    successfulExecutions: number;
    failedExecutions: number;
    averageExecutionTime: number; // seconds
    
    // Message specific metrics
    messageMetrics?: {
      sent: number;
      delivered: number;
      opened: number;
      clicked: number;
      bounced: number;
      unsubscribed: number;
      complained: number;
    };

    // Performance over time
    dailyStats: [{
      date: Date;
      triggers: number;
      executions: number;
      successes: number;
      failures: number;
    }];

    // Engagement metrics
    engagementMetrics?: {
      openRate: number;
      clickRate: number;
      responseRate: number;
      conversionRate: number;
    };
  };

  // Execution History
  executionHistory: [{
    executionId: string;
    triggeredDate: Date;
    executedDate?: Date;
    status: 'pending' | 'executing' | 'completed' | 'failed' | 'cancelled';
    
    // Target information
    recipientType: string;
    recipientId?: Types.ObjectId;
    recipientEmail?: string;
    recipientPhone?: string;
    
    // Execution details
    messageDetails?: {
      subject?: string;
      content: string;
      personalizedContent?: string;
    };
    
    // Results
    deliveryStatus?: 'sent' | 'delivered' | 'bounced' | 'failed';
    engagementData?: {
      opened?: Date;
      clicked?: Date;
      responded?: Date;
      converted?: Date;
    };
    
    // Error information
    error?: {
      code: string;
      message: string;
      details?: any;
    };
    
    retryCount: number;
    nextRetryDate?: Date;
    
    // Related records
    eventBookingId?: Types.ObjectId;
    leadId?: Types.ObjectId;
    quoteId?: Types.ObjectId;
    
    metadata?: any;
  }];

  // Integration Settings
  integrationSettings: {
    emailProvider: 'smtp' | 'sendgrid' | 'mailgun' | 'ses' | 'postmark';
    emailConfig?: {
      apiKey?: string;
      domain?: string;
      fromEmail: string;
      fromName: string;
    };
    
    smsProvider?: 'twilio' | 'vonage' | 'textlocal' | 'msg91';
    smsConfig?: {
      apiKey?: string;
      senderId: string;
      templateId?: string;
    };

    whatsappProvider?: 'twilio' | 'vonage' | 'gupshup';
    whatsappConfig?: {
      apiKey?: string;
      businessNumber: string;
    };

    webhookConfig?: {
      url: string;
      method: 'GET' | 'POST' | 'PUT';
      headers?: Record<string, string>;
      authentication?: {
        type: 'none' | 'basic' | 'bearer' | 'api-key';
        credentials?: any;
      };
    };
  };

  // Compliance & Permissions
  compliance: {
    gdprCompliant: boolean;
    consentRequired: boolean;
    optOutEnabled: boolean;
    dataRetention: number; // days
    unsubscribeLink: boolean;
    privacyPolicyUrl?: string;
  };

  // Testing & Debugging
  testingConfig?: {
    testMode: boolean;
    testRecipients: string[];
    logLevel: 'none' | 'basic' | 'detailed' | 'debug';
    enablePreview: boolean;
  };

  // Approval Workflow
  approvalWorkflow?: {
    requiresApproval: boolean;
    approvers: Types.ObjectId[];
    approvalStatus: 'pending' | 'approved' | 'rejected';
    approvedBy?: Types.ObjectId;
    approvedDate?: Date;
    rejectionReason?: string;
  };

  // Metadata
  isActive: boolean;
  createdBy: Types.ObjectId;
  lastModifiedBy?: Types.ObjectId;
  lastExecutedAt?: Date;
  nextExecutionAt?: Date;
  tags: string[];
  
  createdAt: Date;
  updatedAt: Date;

  // Methods
  executeAutomation(context: any): Promise<any>;
  scheduleExecution(triggerData: any): Promise<void>;
  trackEngagement(executionId: string, eventType: string): Promise<void>;
  generatePreview(context: any): Promise<string>;
  testAutomation(testContext: any): Promise<any>;
}

const EventAutomationSchema = new Schema<IEventAutomation>({
  propertyId: {
    type: Schema.Types.ObjectId,
    ref: 'Property',
    required: [true, 'Property ID is required'],
    index: true
  },

  automationName: {
    type: String,
    required: [true, 'Automation name is required'],
    trim: true,
    maxlength: [100, 'Automation name cannot exceed 100 characters']
  },

  automationType: {
    type: String,
    required: [true, 'Automation type is required'],
    enum: {
      values: ['email', 'sms', 'whatsapp', 'notification', 'task', 'workflow'],
      message: 'Invalid automation type'
    }
  },

  // Triggers
  triggers: [{
    triggerType: {
      type: String,
      required: true,
      enum: ['event', 'time', 'status', 'condition']
    },
    triggerEvent: {
      type: String,
      enum: ['booking-created', 'booking-confirmed', 'payment-received', 'event-completed', 'feedback-received', 'custom']
    },
    triggerCondition: {
      field: String,
      operator: {
        type: String,
        enum: ['equals', 'not-equals', 'greater-than', 'less-than', 'contains', 'starts-with', 'ends-with']
      },
      value: Schema.Types.Mixed
    },
    timeDelay: {
      value: {
        type: Number,
        min: [0, 'Time delay value cannot be negative']
      },
      unit: {
        type: String,
        enum: ['minutes', 'hours', 'days', 'weeks']
      }
    },
    scheduledTime: {
      time: String, // HH:MM format
      daysBeforeEvent: Number,
      daysAfterEvent: Number
    }
  }],

  // Target Audience
  targetAudience: {
    recipientType: {
      type: String,
      required: [true, 'Recipient type is required'],
      enum: {
        values: ['client', 'staff', 'vendor', 'custom'],
        message: 'Invalid recipient type'
      }
    },
    clientCriteria: {
      eventType: [String],
      status: [String],
      tags: [String],
      customField: {
        field: String,
        value: Schema.Types.Mixed
      }
    },
    staffCriteria: {
      roles: [String],
      departments: [String],
      eventInvolvement: {
        type: String,
        enum: ['assigned', 'coordinator', 'manager']
      }
    },
    customRecipients: [String]
  },

  // Message Configuration
  messageConfig: {
    emailConfig: {
      subject: {
        type: String,
        maxlength: [200, 'Subject cannot exceed 200 characters']
      },
      template: {
        type: String,
        enum: ['booking-confirmation', 'reminder', 'thank-you', 'feedback-request', 'payment-reminder', 'custom']
      },
      htmlContent: String,
      textContent: String,
      attachments: [String],
      replyTo: String,
      bcc: [String]
    },

    smsConfig: {
      message: {
        type: String,
        maxlength: [1600, 'SMS message cannot exceed 1600 characters']
      },
      shortUrl: {
        type: Boolean,
        default: false
      },
      unicode: {
        type: Boolean,
        default: false
      }
    },

    whatsappConfig: {
      template: String,
      parameters: [Schema.Types.Mixed],
      mediaUrl: String
    },

    notificationConfig: {
      title: {
        type: String,
        maxlength: [100, 'Notification title cannot exceed 100 characters']
      },
      body: {
        type: String,
        maxlength: [500, 'Notification body cannot exceed 500 characters']
      },
      icon: String,
      actionButtons: [{
        text: String,
        action: String
      }]
    },

    variables: [{
      type: String
    }],

    personalization: {
      type: Boolean,
      default: true
    }
  },

  // Workflow Actions
  workflowActions: [{
    actionType: {
      type: String,
      required: true,
      enum: ['send-message', 'create-task', 'update-status', 'assign-staff', 'schedule-followup', 'webhook']
    },
    actionConfig: {
      type: Schema.Types.Mixed,
      required: true
    },
    executionOrder: {
      type: Number,
      required: true,
      min: [1, 'Execution order must be at least 1']
    },
    conditions: [{
      field: String,
      operator: String,
      value: Schema.Types.Mixed
    }]
  }],

  // Execution Configuration
  executionConfig: {
    isActive: {
      type: Boolean,
      default: true
    },
    priority: {
      type: String,
      enum: ['low', 'normal', 'high', 'urgent'],
      default: 'normal'
    },
    maxRetries: {
      type: Number,
      default: 3,
      min: [0, 'Max retries cannot be negative'],
      max: [10, 'Max retries cannot exceed 10']
    },
    retryInterval: {
      type: Number,
      default: 30,
      min: [1, 'Retry interval must be at least 1 minute']
    },
    failureAction: {
      type: String,
      enum: ['stop', 'continue', 'alert'],
      default: 'stop'
    },
    rateLimiting: {
      maxPerHour: {
        type: Number,
        min: [1, 'Max per hour must be at least 1']
      },
      maxPerDay: {
        type: Number,
        min: [1, 'Max per day must be at least 1']
      }
    },
    quietHours: {
      start: String,
      end: String,
      timezone: {
        type: String,
        default: 'Asia/Kolkata'
      }
    }
  },

  // A/B Testing
  abTesting: {
    enabled: {
      type: Boolean,
      default: false
    },
    variants: [{
      variantName: String,
      weight: {
        type: Number,
        min: [0, 'Weight cannot be negative'],
        max: [100, 'Weight cannot exceed 100']
      },
      messageConfig: Schema.Types.Mixed
    }],
    testDuration: {
      type: Number,
      min: [1, 'Test duration must be at least 1 day']
    },
    successMetric: {
      type: String,
      enum: ['open-rate', 'click-rate', 'conversion-rate']
    },
    winningVariant: String
  },

  // Analytics
  analytics: {
    totalTriggers: {
      type: Number,
      default: 0,
      min: [0, 'Total triggers cannot be negative']
    },
    totalExecutions: {
      type: Number,
      default: 0,
      min: [0, 'Total executions cannot be negative']
    },
    successfulExecutions: {
      type: Number,
      default: 0,
      min: [0, 'Successful executions cannot be negative']
    },
    failedExecutions: {
      type: Number,
      default: 0,
      min: [0, 'Failed executions cannot be negative']
    },
    averageExecutionTime: {
      type: Number,
      default: 0,
      min: [0, 'Average execution time cannot be negative']
    },

    messageMetrics: {
      sent: { type: Number, default: 0 },
      delivered: { type: Number, default: 0 },
      opened: { type: Number, default: 0 },
      clicked: { type: Number, default: 0 },
      bounced: { type: Number, default: 0 },
      unsubscribed: { type: Number, default: 0 },
      complained: { type: Number, default: 0 }
    },

    dailyStats: [{
      date: {
        type: Date,
        required: true
      },
      triggers: { type: Number, default: 0 },
      executions: { type: Number, default: 0 },
      successes: { type: Number, default: 0 },
      failures: { type: Number, default: 0 }
    }],

    engagementMetrics: {
      openRate: { type: Number, default: 0 },
      clickRate: { type: Number, default: 0 },
      responseRate: { type: Number, default: 0 },
      conversionRate: { type: Number, default: 0 }
    }
  },

  // Execution History
  executionHistory: [{
    executionId: {
      type: String,
      required: true
    },
    triggeredDate: {
      type: Date,
      required: true,
      default: Date.now
    },
    executedDate: Date,
    status: {
      type: String,
      enum: ['pending', 'executing', 'completed', 'failed', 'cancelled'],
      default: 'pending'
    },
    
    recipientType: String,
    recipientId: Schema.Types.ObjectId,
    recipientEmail: String,
    recipientPhone: String,
    
    messageDetails: {
      subject: String,
      content: String,
      personalizedContent: String
    },
    
    deliveryStatus: {
      type: String,
      enum: ['sent', 'delivered', 'bounced', 'failed']
    },
    
    engagementData: {
      opened: Date,
      clicked: Date,
      responded: Date,
      converted: Date
    },
    
    error: {
      code: String,
      message: String,
      details: Schema.Types.Mixed
    },
    
    retryCount: {
      type: Number,
      default: 0
    },
    nextRetryDate: Date,
    
    eventBookingId: {
      type: Schema.Types.ObjectId,
      ref: 'EventBooking'
    },
    leadId: {
      type: Schema.Types.ObjectId,
      ref: 'EventLead'
    },
    quoteId: {
      type: Schema.Types.ObjectId,
      ref: 'EventQuote'
    },
    
    metadata: Schema.Types.Mixed
  }],

  // Integration Settings
  integrationSettings: {
    emailProvider: {
      type: String,
      enum: ['smtp', 'sendgrid', 'mailgun', 'ses', 'postmark'],
      default: 'smtp'
    },
    emailConfig: {
      apiKey: String,
      domain: String,
      fromEmail: {
        type: String,
        validate: {
          validator: function(v: string) {
            return !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
          },
          message: 'Invalid email format'
        }
      },
      fromName: String
    },
    
    smsProvider: {
      type: String,
      enum: ['twilio', 'vonage', 'textlocal', 'msg91']
    },
    smsConfig: {
      apiKey: String,
      senderId: String,
      templateId: String
    },

    whatsappProvider: {
      type: String,
      enum: ['twilio', 'vonage', 'gupshup']
    },
    whatsappConfig: {
      apiKey: String,
      businessNumber: String
    },

    webhookConfig: {
      url: String,
      method: {
        type: String,
        enum: ['GET', 'POST', 'PUT'],
        default: 'POST'
      },
      headers: Schema.Types.Mixed,
      authentication: {
        type: {
          type: String,
          enum: ['none', 'basic', 'bearer', 'api-key'],
          default: 'none'
        },
        credentials: Schema.Types.Mixed
      }
    }
  },

  // Compliance
  compliance: {
    gdprCompliant: {
      type: Boolean,
      default: true
    },
    consentRequired: {
      type: Boolean,
      default: false
    },
    optOutEnabled: {
      type: Boolean,
      default: true
    },
    dataRetention: {
      type: Number,
      default: 365, // days
      min: [1, 'Data retention must be at least 1 day']
    },
    unsubscribeLink: {
      type: Boolean,
      default: true
    },
    privacyPolicyUrl: String
  },

  // Testing
  testingConfig: {
    testMode: {
      type: Boolean,
      default: false
    },
    testRecipients: [String],
    logLevel: {
      type: String,
      enum: ['none', 'basic', 'detailed', 'debug'],
      default: 'basic'
    },
    enablePreview: {
      type: Boolean,
      default: true
    }
  },

  // Approval Workflow
  approvalWorkflow: {
    requiresApproval: {
      type: Boolean,
      default: false
    },
    approvers: [{
      type: Schema.Types.ObjectId,
      ref: 'User'
    }],
    approvalStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending'
    },
    approvedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    approvedDate: Date,
    rejectionReason: String
  },

  // Metadata
  isActive: {
    type: Boolean,
    default: true
  },

  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  lastModifiedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },

  lastExecutedAt: Date,
  nextExecutionAt: Date,

  tags: [{
    type: String,
    trim: true
  }],

  createdAt: {
    type: Date,
    default: Date.now
  },

  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  collection: 'eventautomations'
});

// Pre-save middleware
EventAutomationSchema.pre('save', function() {
  const doc = this as any;
  
  // Calculate engagement metrics
  if (doc.analytics.messageMetrics) {
    const metrics = doc.analytics.messageMetrics;
    if (metrics.sent > 0) {
      doc.analytics.engagementMetrics = doc.analytics.engagementMetrics || {};
      doc.analytics.engagementMetrics.openRate = Math.round((metrics.opened / metrics.sent) * 10000) / 100;
      doc.analytics.engagementMetrics.clickRate = Math.round((metrics.clicked / metrics.sent) * 10000) / 100;
    }
  }

  // Calculate success rate
  if (doc.analytics.totalExecutions > 0) {
    const successRate = (doc.analytics.successfulExecutions / doc.analytics.totalExecutions) * 100;
    doc.analytics.successRate = Math.round(successRate * 100) / 100;
  }
});

// Indexes
EventAutomationSchema.index({ propertyId: 1, automationName: 1 });
EventAutomationSchema.index({ propertyId: 1, automationType: 1 });
EventAutomationSchema.index({ 'executionConfig.isActive': 1 });
EventAutomationSchema.index({ nextExecutionAt: 1 });
EventAutomationSchema.index({ 'triggers.triggerEvent': 1 });
EventAutomationSchema.index({ createdAt: -1 });

// Methods
EventAutomationSchema.methods.executeAutomation = function(context: any) {
  const doc = this as any;
  
  // Implementation would handle actual automation execution
  // This is a simplified version
  const executionId = `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  doc.executionHistory.push({
    executionId,
    triggeredDate: new Date(),
    status: 'executing',
    ...context
  });
  
  doc.analytics.totalExecutions += 1;
  doc.lastExecutedAt = new Date();
  
  return doc.save().then(() => {
    // Actual execution logic would go here
    return { executionId, status: 'executing' };
  });
};

EventAutomationSchema.methods.scheduleExecution = function(triggerData: any) {
  const doc = this as any;
  
  // Calculate next execution time based on trigger configuration
  let nextExecution = new Date();
  
  if (doc.triggers[0]?.timeDelay) {
    const delay = doc.triggers[0].timeDelay;
    switch (delay.unit) {
      case 'minutes':
        nextExecution.setMinutes(nextExecution.getMinutes() + delay.value);
        break;
      case 'hours':
        nextExecution.setHours(nextExecution.getHours() + delay.value);
        break;
      case 'days':
        nextExecution.setDate(nextExecution.getDate() + delay.value);
        break;
      case 'weeks':
        nextExecution.setDate(nextExecution.getDate() + (delay.value * 7));
        break;
    }
  }
  
  doc.nextExecutionAt = nextExecution;
  doc.analytics.totalTriggers += 1;
  
  return doc.save();
};

EventAutomationSchema.methods.trackEngagement = function(executionId: string, eventType: string) {
  const doc = this as any;
  
  const execution = doc.executionHistory.find((ex: any) => ex.executionId === executionId);
  if (execution) {
    execution.engagementData = execution.engagementData || {};
    execution.engagementData[eventType] = new Date();
    
    // Update analytics
    if (!doc.analytics.messageMetrics) {
      doc.analytics.messageMetrics = {
        sent: 0, delivered: 0, opened: 0, clicked: 0,
        bounced: 0, unsubscribed: 0, complained: 0
      };
    }
    
    if (eventType === 'opened') {
      doc.analytics.messageMetrics.opened += 1;
    } else if (eventType === 'clicked') {
      doc.analytics.messageMetrics.clicked += 1;
    }
  }
  
  return doc.save();
};

EventAutomationSchema.methods.generatePreview = function(context: any) {
  const doc = this as any;
  
  // Generate preview based on message configuration and context
  let preview = '';
  
  if (doc.messageConfig.emailConfig) {
    preview = doc.messageConfig.emailConfig.subject || 'No subject';
    if (doc.messageConfig.emailConfig.htmlContent || doc.messageConfig.emailConfig.textContent) {
      preview += '\n\n' + (doc.messageConfig.emailConfig.textContent || 'HTML content');
    }
  } else if (doc.messageConfig.smsConfig) {
    preview = doc.messageConfig.smsConfig.message || 'No message';
  }
  
  // Replace variables with context data
  if (context && doc.messageConfig.variables) {
    doc.messageConfig.variables.forEach((variable: string) => {
      const key = variable.replace(/[{}]/g, '');
      if (context[key]) {
        preview = preview.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), context[key]);
      }
    });
  }
  
  return Promise.resolve(preview);
};

EventAutomationSchema.methods.testAutomation = function(testContext: any) {
  const doc = this as any;
  
  if (!doc.testingConfig?.testMode) {
    return Promise.reject(new Error('Test mode is not enabled'));
  }
  
  // Execute automation in test mode
  return doc.executeAutomation({
    ...testContext,
    isTest: true,
    recipientEmail: doc.testingConfig.testRecipients[0]
  });
};

// Static methods
EventAutomationSchema.statics.findActiveAutomations = function(propertyId: string, triggerEvent?: string) {
  const query: any = {
    propertyId,
    isActive: true,
    'executionConfig.isActive': true
  };
  
  if (triggerEvent) {
    query['triggers.triggerEvent'] = triggerEvent;
  }
  
  return this.find(query);
};

EventAutomationSchema.statics.findScheduledExecutions = function(beforeDate: Date = new Date()) {
  return this.find({
    isActive: true,
    'executionConfig.isActive': true,
    nextExecutionAt: { $lte: beforeDate }
  });
};

const EventAutomation = models.EventAutomation || model('EventAutomation', EventAutomationSchema);

export default EventAutomation;