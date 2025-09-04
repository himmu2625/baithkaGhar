import mongoose, { Schema, Document, Types, models, model } from 'mongoose';

export interface IEventContract extends Document {
  _id: Types.ObjectId;
  propertyId: Types.ObjectId;
  contractNumber: string;
  
  // Related Records
  quoteId: Types.ObjectId;
  eventBookingId: Types.ObjectId;
  leadId?: Types.ObjectId;
  
  // Contract Parties
  parties: {
    serviceProvider: {
      companyName: string;
      address: any;
      contactPerson: string;
      email: string;
      phone: string;
      registrationNumber?: string;
      taxId?: string;
    };
    client: {
      name: string;
      email: string;
      phone: string;
      company?: string;
      address: any;
      idProof?: {
        type: 'passport' | 'driving-license' | 'aadhar' | 'other';
        number: string;
        documentUrl?: string;
      };
    };
  };
  
  // Event Details (from quote)
  eventDetails: {
    eventType: 'wedding' | 'conference' | 'birthday' | 'corporate' | 'exhibition' | 'other';
    eventName: string;
    eventDate: Date;
    startTime: string;
    endTime: string;
    duration: number;
    expectedGuests: number;
    venue: {
      venueId: Types.ObjectId;
      venueName: string;
      address: any;
    };
    specialRequirements?: string;
  };
  
  // Services & Deliverables
  services: [{
    category: 'venue' | 'catering' | 'decoration' | 'equipment' | 'entertainment' | 'photography' | 'other';
    serviceName: string;
    description: string;
    specifications?: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    deliveryDate?: Date;
    deliveryLocation?: string;
    qualityStandards?: string;
  }];
  
  // Financial Terms
  financialTerms: {
    totalContractValue: number;
    currency: string;
    
    paymentSchedule: [{
      milestone: string;
      description?: string;
      amount: number;
      percentage: number;
      dueDate: Date;
      paymentMethod: 'cash' | 'cheque' | 'bank-transfer' | 'card' | 'upi';
      status: 'pending' | 'paid' | 'overdue' | 'waived';
      paidDate?: Date;
      transactionReference?: string;
    }];
    
    taxes: [{
      name: string;
      rate: number;
      amount: number;
      taxableAmount: number;
    }];
    
    lateFeeStructure: {
      enabled: boolean;
      feePercentage?: number;
      gracePeriodDays?: number;
      maximumFeeAmount?: number;
    };
    
    securityDeposit?: {
      amount: number;
      purpose: string;
      refundConditions: string;
      refundTimeline: string;
    };
  };
  
  // Terms & Conditions
  termsAndConditions: {
    serviceDelivery: {
      setupStartTime: string;
      setupCompletionDeadline: string;
      eventStartTime: string;
      cleanupCompletionTime: string;
      deliveryStandards: string[];
      qualityAssurance: string[];
    };
    
    clientObligations: {
      advanceNotice: number; // days
      accessRequirements: string[];
      approvals: string[];
      coordinationRequirements: string[];
      paymentObligations: string[];
    };
    
    serviceProviderObligations: {
      staffing: string[];
      insurance: string[];
      licenses: string[];
      qualityStandards: string[];
      backupPlans: string[];
    };
    
    changeManagement: {
      changeRequestDeadline: number; // days before event
      additionalChargesPolicy: string;
      scopeReductionPolicy: string;
      approvalProcess: string;
    };
    
    cancellationPolicy: {
      clientCancellation: [{
        timeframeDays: number;
        refundPercentage: number;
        conditions?: string;
      }];
      serviceProviderCancellation: {
        noticeRequiredDays: number;
        refundPolicy: string;
        alternativeArrangements: string;
      };
      forceMAjeure: {
        definition: string;
        notificationRequirement: number; // hours
        resolutionOptions: string[];
        refundPolicy: string;
      };
    };
    
    liabilityAndInsurance: {
      serviceProviderLiability: {
        propertyDamage: number;
        personalInjury: number;
        eventDisruption: number;
        equipmentLoss: number;
      };
      clientLiability: {
        guestBehavior: string;
        propertyDamage: string;
        unauthorizedChanges: string;
      };
      insuranceRequirements: {
        generalLiability: boolean;
        propertyInsurance: boolean;
        eventInsurance: boolean;
        minimumCoverage: number;
      };
    };
    
    intellectualProperty: {
      photography: string;
      videography: string;
      decorationDesign: string;
      eventConcept: string;
      marketing: string;
    };
    
    disputeResolution: {
      mediationRequired: boolean;
      arbitrationClause: boolean;
      jurisdiction: string;
      governingLaw: string;
      noticeRequirement: number; // days
    };
  };
  
  // Contract Lifecycle
  contractStatus: 'draft' | 'sent' | 'under-review' | 'negotiating' | 'signed' | 'active' | 'completed' | 'cancelled' | 'expired';
  
  lifecycle: {
    createdDate: Date;
    sentDate?: Date;
    reviewStartDate?: Date;
    negotiationStartDate?: Date;
    finalizedDate?: Date;
    signedDate?: Date;
    activationDate?: Date;
    completionDate?: Date;
    cancellationDate?: Date;
    expiryDate?: Date;
  };
  
  // Digital Signatures
  signatures: {
    serviceProvider: {
      signedBy?: Types.ObjectId;
      signedDate?: Date;
      ipAddress?: string;
      deviceInfo?: string;
      documentHash?: string;
      digitalSignature?: string;
    };
    client: {
      signedBy?: string; // Client name
      signedDate?: Date;
      ipAddress?: string;
      deviceInfo?: string;
      documentHash?: string;
      digitalSignature?: string;
      verificationMethod?: 'email-otp' | 'phone-otp' | 'document-upload' | 'physical-presence';
    };
    witnesses?: [{
      name: string;
      role: string;
      signedDate: Date;
      signature?: string;
    }];
  };
  
  // Amendments & Modifications
  amendments: [{
    amendmentNumber: number;
    date: Date;
    reason: string;
    description: string;
    changes: [{
      section: string;
      oldValue: any;
      newValue: any;
      justification: string;
    }];
    financialImpact?: {
      previousAmount: number;
      newAmount: number;
      difference: number;
    };
    approvedBy: {
      serviceProvider: Types.ObjectId;
      client: string;
    };
    effectiveDate: Date;
    documentUrl?: string;
  }];
  
  // Compliance & Milestones
  milestones: [{
    name: string;
    description: string;
    dueDate: Date;
    responsible: 'service-provider' | 'client' | 'both';
    status: 'pending' | 'in-progress' | 'completed' | 'delayed' | 'cancelled';
    completedDate?: Date;
    notes?: string;
    evidence?: [{
      type: 'document' | 'photo' | 'video' | 'signature';
      url: string;
      uploadDate: Date;
      description?: string;
    }];
  }];
  
  // Performance Tracking
  performance: {
    serviceDeliveryScore?: number; // 1-10
    clientSatisfactionScore?: number; // 1-10
    timelyCompletionScore?: number; // 1-10
    qualityScore?: number; // 1-10
    communicationScore?: number; // 1-10
    
    issues: [{
      reportedDate: Date;
      category: 'service-quality' | 'timing' | 'communication' | 'billing' | 'other';
      description: string;
      severity: 'low' | 'medium' | 'high' | 'critical';
      reportedBy: 'client' | 'service-provider';
      status: 'open' | 'investigating' | 'resolved' | 'closed';
      resolution?: string;
      resolvedDate?: Date;
      preventiveActions?: string[];
    }];
    
    clientFeedback?: [{
      date: Date;
      rating: number;
      feedback: string;
      category: 'overall' | 'service' | 'staff' | 'communication' | 'value';
    }];
  };
  
  // Legal & Compliance
  legalCompliance: {
    permits: [{
      type: string;
      number: string;
      issuingAuthority: string;
      validFrom: Date;
      validUntil: Date;
      documentUrl?: string;
    }];
    
    insurancePolicies: [{
      policyType: 'general-liability' | 'property' | 'event' | 'professional-indemnity' | 'other';
      policyNumber: string;
      insurer: string;
      coverageAmount: number;
      validFrom: Date;
      validUntil: Date;
      documentUrl?: string;
    }];
    
    taxCompliance: {
      taxRegistrationNumber?: string;
      serviceTaxApplicable: boolean;
      gstNumber?: string;
      taxExemptions?: string[];
    };
  };
  
  // Document Management
  documents: [{
    type: 'contract-pdf' | 'amendment' | 'permit' | 'insurance' | 'payment-receipt' | 'delivery-proof' | 'other';
    name: string;
    version: string;
    url: string;
    uploadDate: Date;
    uploadedBy: string;
    isActive: boolean;
    expiryDate?: Date;
  }];
  
  // Communication Log
  communications: [{
    date: Date;
    type: 'email' | 'call' | 'meeting' | 'message' | 'legal-notice';
    subject: string;
    participants: string[];
    summary: string;
    followUpRequired: boolean;
    followUpDate?: Date;
    recordedBy: Types.ObjectId;
    attachments?: string[];
  }];
  
  // Automation & Alerts
  alerts: [{
    type: 'payment-due' | 'milestone-approaching' | 'document-expiry' | 'contract-expiry' | 'custom';
    triggerDate: Date;
    message: string;
    severity: 'info' | 'warning' | 'critical';
    recipients: string[];
    sent: boolean;
    sentDate?: Date;
  }];
  
  // Metadata
  createdBy: Types.ObjectId;
  assignedTo: Types.ObjectId;
  approvedBy?: Types.ObjectId;
  legalReviewBy?: Types.ObjectId;
  
  tags: string[];
  priority: 'low' | 'normal' | 'high' | 'urgent';
  confidentiality: 'public' | 'internal' | 'confidential' | 'restricted';
  
  isActive: boolean;
  lastUpdatedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  
  // Methods
  generatePDF(): Promise<string>;
  sendForSignature(): Promise<boolean>;
  addAmendment(amendmentData: any): Promise<IEventContract>;
  updateMilestone(milestoneId: string, status: string): Promise<IEventContract>;
  recordPayment(paymentData: any): Promise<IEventContract>;
  generateAlerts(): Promise<void>;
}

const EventContractSchema = new Schema<IEventContract>({
  propertyId: {
    type: Schema.Types.ObjectId,
    ref: 'Property',
    required: [true, 'Property ID is required'],
    index: true
  },
  
  contractNumber: {
    type: String,
    required: [true, 'Contract number is required'],
    unique: true,
    trim: true
  },
  
  // Related Records
  quoteId: {
    type: Schema.Types.ObjectId,
    ref: 'EventQuote',
    required: [true, 'Quote ID is required']
  },
  
  eventBookingId: {
    type: Schema.Types.ObjectId,
    ref: 'EventBooking',
    required: [true, 'Event Booking ID is required']
  },
  
  leadId: {
    type: Schema.Types.ObjectId,
    ref: 'EventLead'
  },
  
  // Contract Parties
  parties: {
    serviceProvider: {
      companyName: {
        type: String,
        required: [true, 'Company name is required']
      },
      address: {
        type: Schema.Types.Mixed,
        required: [true, 'Service provider address is required']
      },
      contactPerson: {
        type: String,
        required: [true, 'Contact person is required']
      },
      email: {
        type: String,
        required: [true, 'Service provider email is required'],
        validate: {
          validator: function(v: string) {
            return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
          },
          message: 'Invalid email format'
        }
      },
      phone: {
        type: String,
        required: [true, 'Service provider phone is required']
      },
      registrationNumber: String,
      taxId: String
    },
    client: {
      name: {
        type: String,
        required: [true, 'Client name is required']
      },
      email: {
        type: String,
        required: [true, 'Client email is required'],
        validate: {
          validator: function(v: string) {
            return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
          },
          message: 'Invalid email format'
        }
      },
      phone: {
        type: String,
        required: [true, 'Client phone is required']
      },
      company: String,
      address: {
        type: Schema.Types.Mixed,
        required: [true, 'Client address is required']
      },
      idProof: {
        type: {
          type: String,
          enum: ['passport', 'driving-license', 'aadhar', 'other']
        },
        number: String,
        documentUrl: String
      }
    }
  },
  
  // Event Details
  eventDetails: {
    eventType: {
      type: String,
      required: [true, 'Event type is required'],
      enum: {
        values: ['wedding', 'conference', 'birthday', 'corporate', 'exhibition', 'other'],
        message: 'Invalid event type'
      }
    },
    eventName: {
      type: String,
      required: [true, 'Event name is required']
    },
    eventDate: {
      type: Date,
      required: [true, 'Event date is required']
    },
    startTime: {
      type: String,
      required: [true, 'Start time is required']
    },
    endTime: {
      type: String,
      required: [true, 'End time is required']
    },
    duration: {
      type: Number,
      required: [true, 'Duration is required'],
      min: [1, 'Duration must be at least 1 hour']
    },
    expectedGuests: {
      type: Number,
      required: [true, 'Expected guests count is required'],
      min: [1, 'Guest count must be at least 1']
    },
    venue: {
      venueId: {
        type: Schema.Types.ObjectId,
        ref: 'EventVenue',
        required: [true, 'Venue ID is required']
      },
      venueName: {
        type: String,
        required: [true, 'Venue name is required']
      },
      address: {
        type: Schema.Types.Mixed,
        required: [true, 'Venue address is required']
      }
    },
    specialRequirements: String
  },
  
  // Services & Deliverables
  services: [{
    category: {
      type: String,
      required: true,
      enum: ['venue', 'catering', 'decoration', 'equipment', 'entertainment', 'photography', 'other']
    },
    serviceName: {
      type: String,
      required: true
    },
    description: {
      type: String,
      required: true
    },
    specifications: String,
    quantity: {
      type: Number,
      required: true,
      min: [1, 'Quantity must be at least 1']
    },
    unitPrice: {
      type: Number,
      required: true,
      min: [0, 'Unit price cannot be negative']
    },
    totalPrice: {
      type: Number,
      required: true,
      min: [0, 'Total price cannot be negative']
    },
    deliveryDate: Date,
    deliveryLocation: String,
    qualityStandards: String
  }],
  
  // Financial Terms
  financialTerms: {
    totalContractValue: {
      type: Number,
      required: [true, 'Total contract value is required'],
      min: [0, 'Contract value cannot be negative']
    },
    currency: {
      type: String,
      default: 'INR'
    },
    
    paymentSchedule: [{
      milestone: {
        type: String,
        required: true
      },
      description: String,
      amount: {
        type: Number,
        required: true,
        min: [0, 'Payment amount cannot be negative']
      },
      percentage: {
        type: Number,
        required: true,
        min: [0, 'Percentage cannot be negative'],
        max: [100, 'Percentage cannot exceed 100']
      },
      dueDate: {
        type: Date,
        required: true
      },
      paymentMethod: {
        type: String,
        required: true,
        enum: ['cash', 'cheque', 'bank-transfer', 'card', 'upi']
      },
      status: {
        type: String,
        enum: ['pending', 'paid', 'overdue', 'waived'],
        default: 'pending'
      },
      paidDate: Date,
      transactionReference: String
    }],
    
    taxes: [{
      name: {
        type: String,
        required: true
      },
      rate: {
        type: Number,
        required: true,
        min: [0, 'Tax rate cannot be negative']
      },
      amount: {
        type: Number,
        required: true,
        min: [0, 'Tax amount cannot be negative']
      },
      taxableAmount: {
        type: Number,
        required: true,
        min: [0, 'Taxable amount cannot be negative']
      }
    }],
    
    lateFeeStructure: {
      enabled: {
        type: Boolean,
        default: false
      },
      feePercentage: {
        type: Number,
        min: [0, 'Late fee percentage cannot be negative'],
        max: [100, 'Late fee percentage cannot exceed 100']
      },
      gracePeriodDays: {
        type: Number,
        min: [0, 'Grace period cannot be negative']
      },
      maximumFeeAmount: {
        type: Number,
        min: [0, 'Maximum fee amount cannot be negative']
      }
    },
    
    securityDeposit: {
      amount: {
        type: Number,
        min: [0, 'Security deposit cannot be negative']
      },
      purpose: String,
      refundConditions: String,
      refundTimeline: String
    }
  },
  
  // Contract Status
  contractStatus: {
    type: String,
    required: true,
    enum: {
      values: ['draft', 'sent', 'under-review', 'negotiating', 'signed', 'active', 'completed', 'cancelled', 'expired'],
      message: 'Invalid contract status'
    },
    default: 'draft'
  },
  
  // Lifecycle timestamps
  lifecycle: {
    createdDate: {
      type: Date,
      required: true,
      default: Date.now
    },
    sentDate: Date,
    reviewStartDate: Date,
    negotiationStartDate: Date,
    finalizedDate: Date,
    signedDate: Date,
    activationDate: Date,
    completionDate: Date,
    cancellationDate: Date,
    expiryDate: Date
  },
  
  // Digital Signatures
  signatures: {
    serviceProvider: {
      signedBy: {
        type: Schema.Types.ObjectId,
        ref: 'User'
      },
      signedDate: Date,
      ipAddress: String,
      deviceInfo: String,
      documentHash: String,
      digitalSignature: String
    },
    client: {
      signedBy: String,
      signedDate: Date,
      ipAddress: String,
      deviceInfo: String,
      documentHash: String,
      digitalSignature: String,
      verificationMethod: {
        type: String,
        enum: ['email-otp', 'phone-otp', 'document-upload', 'physical-presence']
      }
    },
    witnesses: [{
      name: String,
      role: String,
      signedDate: Date,
      signature: String
    }]
  },
  
  // Amendments
  amendments: [{
    amendmentNumber: {
      type: Number,
      required: true
    },
    date: {
      type: Date,
      required: true
    },
    reason: {
      type: String,
      required: true
    },
    description: {
      type: String,
      required: true
    },
    changes: [{
      section: String,
      oldValue: Schema.Types.Mixed,
      newValue: Schema.Types.Mixed,
      justification: String
    }],
    financialImpact: {
      previousAmount: Number,
      newAmount: Number,
      difference: Number
    },
    approvedBy: {
      serviceProvider: {
        type: Schema.Types.ObjectId,
        ref: 'User'
      },
      client: String
    },
    effectiveDate: Date,
    documentUrl: String
  }],
  
  // Milestones
  milestones: [{
    name: {
      type: String,
      required: true
    },
    description: String,
    dueDate: {
      type: Date,
      required: true
    },
    responsible: {
      type: String,
      required: true,
      enum: ['service-provider', 'client', 'both']
    },
    status: {
      type: String,
      enum: ['pending', 'in-progress', 'completed', 'delayed', 'cancelled'],
      default: 'pending'
    },
    completedDate: Date,
    notes: String,
    evidence: [{
      type: {
        type: String,
        enum: ['document', 'photo', 'video', 'signature']
      },
      url: String,
      uploadDate: Date,
      description: String
    }]
  }],
  
  // Performance tracking
  performance: {
    serviceDeliveryScore: {
      type: Number,
      min: 1,
      max: 10
    },
    clientSatisfactionScore: {
      type: Number,
      min: 1,
      max: 10
    },
    timelyCompletionScore: {
      type: Number,
      min: 1,
      max: 10
    },
    qualityScore: {
      type: Number,
      min: 1,
      max: 10
    },
    communicationScore: {
      type: Number,
      min: 1,
      max: 10
    },
    
    issues: [{
      reportedDate: {
        type: Date,
        required: true
      },
      category: {
        type: String,
        required: true,
        enum: ['service-quality', 'timing', 'communication', 'billing', 'other']
      },
      description: {
        type: String,
        required: true
      },
      severity: {
        type: String,
        required: true,
        enum: ['low', 'medium', 'high', 'critical']
      },
      reportedBy: {
        type: String,
        required: true,
        enum: ['client', 'service-provider']
      },
      status: {
        type: String,
        enum: ['open', 'investigating', 'resolved', 'closed'],
        default: 'open'
      },
      resolution: String,
      resolvedDate: Date,
      preventiveActions: [String]
    }],
    
    clientFeedback: [{
      date: {
        type: Date,
        required: true
      },
      rating: {
        type: Number,
        required: true,
        min: 1,
        max: 10
      },
      feedback: String,
      category: {
        type: String,
        enum: ['overall', 'service', 'staff', 'communication', 'value']
      }
    }]
  },
  
  // Documents
  documents: [{
    type: {
      type: String,
      required: true,
      enum: ['contract-pdf', 'amendment', 'permit', 'insurance', 'payment-receipt', 'delivery-proof', 'other']
    },
    name: {
      type: String,
      required: true
    },
    version: {
      type: String,
      required: true
    },
    url: {
      type: String,
      required: true
    },
    uploadDate: {
      type: Date,
      required: true,
      default: Date.now
    },
    uploadedBy: {
      type: String,
      required: true
    },
    isActive: {
      type: Boolean,
      default: true
    },
    expiryDate: Date
  }],
  
  // Communications
  communications: [{
    date: {
      type: Date,
      required: true
    },
    type: {
      type: String,
      required: true,
      enum: ['email', 'call', 'meeting', 'message', 'legal-notice']
    },
    subject: {
      type: String,
      required: true
    },
    participants: [String],
    summary: {
      type: String,
      required: true
    },
    followUpRequired: {
      type: Boolean,
      default: false
    },
    followUpDate: Date,
    recordedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    attachments: [String]
  }],
  
  // Alerts
  alerts: [{
    type: {
      type: String,
      required: true,
      enum: ['payment-due', 'milestone-approaching', 'document-expiry', 'contract-expiry', 'custom']
    },
    triggerDate: {
      type: Date,
      required: true
    },
    message: {
      type: String,
      required: true
    },
    severity: {
      type: String,
      required: true,
      enum: ['info', 'warning', 'critical']
    },
    recipients: [String],
    sent: {
      type: Boolean,
      default: false
    },
    sentDate: Date
  }],
  
  // Metadata
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  assignedTo: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  approvedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  
  legalReviewBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  
  tags: [String],
  
  priority: {
    type: String,
    enum: ['low', 'normal', 'high', 'urgent'],
    default: 'normal'
  },
  
  confidentiality: {
    type: String,
    enum: ['public', 'internal', 'confidential', 'restricted'],
    default: 'internal'
  },
  
  isActive: {
    type: Boolean,
    default: true
  },
  
  lastUpdatedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
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
  timestamps: true,
  collection: 'eventcontracts'
});

// Pre-save middleware
EventContractSchema.pre('save', function() {
  const doc = this as any;
  
  // Generate contract number if not provided
  if (!doc.contractNumber) {
    const date = new Date();
    const dateStr = date.toISOString().slice(2, 10).replace(/-/g, '');
    const timeStr = Date.now().toString().slice(-4);
    doc.contractNumber = `CT${dateStr}${timeStr}`;
  }
  
  // Auto-generate alerts for payment due dates and milestones
  if (doc.isNew || doc.isModified('financialTerms.paymentSchedule') || doc.isModified('milestones')) {
    doc.alerts = doc.alerts || [];
    
    // Payment due alerts
    doc.financialTerms?.paymentSchedule?.forEach((payment: any) => {
      if (payment.status === 'pending') {
        const alertDate = new Date(payment.dueDate);
        alertDate.setDate(alertDate.getDate() - 3); // 3 days before due date
        
        doc.alerts.push({
          type: 'payment-due',
          triggerDate: alertDate,
          message: `Payment of ${payment.amount} is due on ${payment.dueDate.toDateString()}`,
          severity: 'warning',
          recipients: [doc.parties.client.email],
          sent: false
        });
      }
    });
    
    // Milestone alerts
    doc.milestones?.forEach((milestone: any) => {
      if (milestone.status === 'pending' || milestone.status === 'in-progress') {
        const alertDate = new Date(milestone.dueDate);
        alertDate.setDate(alertDate.getDate() - 2); // 2 days before milestone
        
        doc.alerts.push({
          type: 'milestone-approaching',
          triggerDate: alertDate,
          message: `Milestone "${milestone.name}" is due on ${milestone.dueDate.toDateString()}`,
          severity: 'info',
          recipients: [doc.parties.client.email],
          sent: false
        });
      }
    });
  }
});

// Indexes
EventContractSchema.index({ propertyId: 1, contractNumber: 1 }, { unique: true });
EventContractSchema.index({ propertyId: 1, contractStatus: 1 });
EventContractSchema.index({ quoteId: 1 });
EventContractSchema.index({ eventBookingId: 1 });
EventContractSchema.index({ assignedTo: 1, contractStatus: 1 });
EventContractSchema.index({ 'eventDetails.eventDate': 1 });
EventContractSchema.index({ 'lifecycle.signedDate': -1 });
EventContractSchema.index({ createdAt: -1 });

// Methods
EventContractSchema.methods.generatePDF = function() {
  // Implementation for contract PDF generation
  return Promise.resolve('contract-pdf-url');
};

EventContractSchema.methods.sendForSignature = function() {
  const doc = this as any;
  doc.contractStatus = 'sent';
  doc.lifecycle.sentDate = new Date();
  return doc.save();
};

EventContractSchema.methods.addAmendment = function(amendmentData: any) {
  const doc = this as any;
  doc.amendments = doc.amendments || [];
  
  const amendmentNumber = (doc.amendments.length || 0) + 1;
  doc.amendments.push({
    ...amendmentData,
    amendmentNumber,
    date: new Date()
  });
  
  return doc.save();
};

EventContractSchema.methods.updateMilestone = function(milestoneId: string, status: string) {
  const doc = this as any;
  const milestone = doc.milestones?.find((m: any) => m._id.toString() === milestoneId);
  
  if (milestone) {
    milestone.status = status;
    if (status === 'completed') {
      milestone.completedDate = new Date();
    }
  }
  
  return doc.save();
};

EventContractSchema.methods.recordPayment = function(paymentData: any) {
  const doc = this as any;
  const payment = doc.financialTerms.paymentSchedule?.find((p: any) => 
    p._id.toString() === paymentData.paymentId
  );
  
  if (payment) {
    payment.status = 'paid';
    payment.paidDate = new Date();
    payment.transactionReference = paymentData.transactionReference;
  }
  
  return doc.save();
};

EventContractSchema.methods.generateAlerts = function() {
  const doc = this as any;
  const now = new Date();
  
  // Send pending alerts
  const pendingAlerts = doc.alerts?.filter((alert: any) => 
    !alert.sent && alert.triggerDate <= now
  );
  
  pendingAlerts?.forEach((alert: any) => {
    // Implementation for sending alerts (email, SMS, etc.)
    alert.sent = true;
    alert.sentDate = new Date();
  });
  
  return doc.save();
};

// Static methods
EventContractSchema.statics.findByProperty = function(propertyId: string) {
  return this.find({ propertyId, isActive: true }).sort({ createdAt: -1 });
};

EventContractSchema.statics.findActiveContracts = function(propertyId: string) {
  return this.find({
    propertyId,
    isActive: true,
    contractStatus: { $in: ['signed', 'active'] }
  }).sort({ 'eventDetails.eventDate': 1 });
};

EventContractSchema.statics.findContractsRequiringAttention = function(propertyId: string) {
  return this.find({
    propertyId,
    isActive: true,
    $or: [
      { 'alerts.sent': false, 'alerts.triggerDate': { $lte: new Date() } },
      { 'milestones.status': 'delayed' },
      { 'financialTerms.paymentSchedule.status': 'overdue' }
    ]
  }).sort({ priority: -1, createdAt: -1 });
};

const EventContract = models.EventContract || model('EventContract', EventContractSchema);

export default EventContract;