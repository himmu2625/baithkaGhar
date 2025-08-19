import mongoose, { Schema, Document } from 'mongoose';

export interface IRefund extends Document {
  // Core refund information
  refundNumber: string; // Unique refund number
  refundReference: string; // Additional reference
  propertyId: mongoose.Types.ObjectId;
  bookingId: mongoose.Types.ObjectId;
  paymentId: mongoose.Types.ObjectId;
  invoiceId?: mongoose.Types.ObjectId;
  guestId: mongoose.Types.ObjectId;
  
  // Refund details
  refundDetails: {
    refundType: 'full' | 'partial' | 'service_charge' | 'tax_only' | 'processing_fee' | 'adjustment';
    refundCategory: 'cancellation' | 'no_show' | 'overbooking' | 'service_failure' | 'billing_error' | 'goodwill' | 'dispute_resolution' | 'policy_violation' | 'force_majeure';
    refundReason: string;
    refundDescription?: string;
    originalAmount: number;
    refundAmount: number;
    currency: string;
    refundPercentage: number; // Percentage of original amount
  };
  
  // Eligibility and policy
  eligibility: {
    cancellationPolicy: string;
    isEligible: boolean;
    eligibilityReason: string;
    policyOverride: boolean;
    overrideReason?: string;
    overriddenBy?: mongoose.Types.ObjectId;
    overrideApprovedBy?: mongoose.Types.ObjectId;
    gracePeriodApplied: boolean;
    penaltyWaived: boolean;
    penaltyAmount?: number;
  };
  
  // Refund breakdown
  breakdown: {
    roomCharges: number;
    taxes: number;
    serviceCharges: number;
    additionalServices: number;
    penalties: number;
    processingFee: number;
    cancellationFee: number;
    netRefundAmount: number;
    retainedAmount: number;
    retentionReason?: string;
  };
  
  // Refund method and destination
  refundMethod: {
    method: 'original_payment_method' | 'bank_transfer' | 'cash' | 'check' | 'store_credit' | 'voucher' | 'wallet_credit';
    methodDetails: {
      // For bank transfer
      bankDetails?: {
        bankName: string;
        accountNumber: string;
        routingNumber?: string;
        ifscCode?: string;
        swiftCode?: string;
        accountHolderName: string;
        branchAddress?: string;
      };
      // For original payment method
      originalPaymentReference?: string;
      cardLastFourDigits?: string;
      // For voucher/credit
      voucherDetails?: {
        voucherCode: string;
        expiryDate: Date;
        restrictions: string[];
        transferable: boolean;
      };
      // For wallet credit
      walletDetails?: {
        walletId: string;
        walletProvider: string;
      };
    };
  };
  
  // Status and workflow
  status: {
    current: 'initiated' | 'pending_approval' | 'approved' | 'processing' | 'completed' | 'failed' | 'cancelled' | 'partially_completed' | 'disputed';
    history: [{
      status: string;
      timestamp: Date;
      changedBy: mongoose.Types.ObjectId;
      reason?: string;
      notes?: string;
      systemGenerated: boolean;
    }];
    approvals: [{
      level: number;
      approverRole: string;
      approverId: mongoose.Types.ObjectId;
      approvedAt: Date;
      decision: 'approved' | 'rejected' | 'pending';
      comments?: string;
      conditions?: string[];
    }];
  };
  
  // Timeline and processing
  timeline: {
    requestedAt: Date;
    approvedAt?: Date;
    processedAt?: Date;
    completedAt?: Date;
    failedAt?: Date;
    expectedCompletionDate?: Date;
    actualProcessingTime?: number; // in hours
    businessDaysToComplete?: number;
    processingDelay?: {
      delayReason: string;
      delayDuration: number; // in hours
      notifiedToGuest: boolean;
    };
  };
  
  // Financial gateway processing
  gatewayProcessing: {
    gatewayName: string;
    gatewayRefundId?: string;
    gatewayTransactionId?: string;
    gatewayStatus: string;
    gatewayResponse?: mongoose.Schema.Types.Mixed;
    gatewayFee: number;
    gatewayProcessingTime?: number; // in minutes
    retryCount: number;
    maxRetries: number;
    lastRetryAt?: Date;
    nextRetryAt?: Date;
    gatewayErrors: [{
      errorCode: string;
      errorMessage: string;
      occurredAt: Date;
      retryable: boolean;
    }];
  };
  
  // Multi-currency handling
  multiCurrency?: {
    originalCurrency: string;
    refundCurrency: string;
    exchangeRate: number;
    conversionDate: Date;
    originalCurrencyAmount: number;
    conversionFees: number;
    exchangeRateSource: string;
    rateGuaranteed: boolean;
  };
  
  // Tax implications
  taxImplications: {
    taxAdjustmentRequired: boolean;
    originalTaxAmount: number;
    refundedTaxAmount: number;
    taxRefundMethod: 'included' | 'separate' | 'adjustment_note';
    taxDocuments: [{
      documentType: string;
      documentNumber: string;
      issueDate: Date;
      documentUrl?: string;
    }];
    gstImpact?: {
      gstAmount: number;
      gstNumber: string;
      adjustmentEntry: boolean;
    };
  };
  
  // Compliance and audit
  compliance: {
    regulatoryCompliance: {
      pciCompliant: boolean;
      gdprCompliant: boolean;
      localLawsCompliant: boolean;
      complianceNotes?: string;
    };
    auditTrail: [{
      action: string;
      performedBy: mongoose.Types.ObjectId;
      performedAt: Date;
      details: string;
      ipAddress: string;
      userAgent?: string;
      dataChanges?: mongoose.Schema.Types.Mixed;
    }];
    documentRetention: {
      retentionPeriodYears: number;
      disposalDate?: Date;
      legalHold: boolean;
      archivalLocation?: string;
    };
  };
  
  // Guest communication
  communication: {
    notifications: [{
      type: 'refund_initiated' | 'refund_approved' | 'refund_processing' | 'refund_completed' | 'refund_failed' | 'refund_delayed';
      channel: 'email' | 'sms' | 'push' | 'whatsapp' | 'phone';
      sentAt: Date;
      deliveryStatus: 'sent' | 'delivered' | 'read' | 'failed';
      template: string;
      recipient: string;
      content?: string;
    }];
    guestConfirmation: {
      confirmationRequired: boolean;
      confirmationReceived: boolean;
      confirmationDate?: Date;
      confirmationMethod: string;
      confirmationReference?: string;
    };
    disputeResolution?: {
      disputeRaised: boolean;
      disputeReason: string;
      disputeDate?: Date;
      resolutionDate?: Date;
      resolutionDetails?: string;
      mediatorInvolved: boolean;
    };
  };
  
  // Business impact analysis
  businessImpact: {
    revenueImpact: {
      directImpact: number;
      indirectImpact: number;
      futureBookingImpact: number;
      customerLifetimeValueImpact: number;
    };
    operationalImpact: {
      roomNightsLost: number;
      occupancyImpact: number;
      revenuePARImpact: number;
      resourcesConsumed: number; // staff hours
    };
    customerRelationshipImpact: {
      satisfactionScore?: number;
      loyaltyImpact: 'positive' | 'neutral' | 'negative';
      futureProbability: number; // likelihood of future bookings
      referralImpact: 'positive' | 'neutral' | 'negative';
    };
  };
  
  // Fraud prevention and security
  security: {
    fraudCheck: {
      riskScore: number; // 0-100
      riskFactors: string[];
      verificationRequired: boolean;
      verificationStatus: 'pending' | 'verified' | 'failed';
      verificationMethod: string[];
      verifiedBy?: mongoose.Types.ObjectId;
      verifiedAt?: Date;
    };
    securityFlags: string[];
    ipAddress: string;
    deviceFingerprint?: string;
    geolocation?: {
      country: string;
      state: string;
      city: string;
      latitude?: number;
      longitude?: number;
    };
  };
  
  // Related transactions and references
  relatedTransactions: {
    originalBooking: {
      bookingReference: string;
      checkInDate: Date;
      checkOutDate: Date;
      bookingStatus: string;
    };
    originalPayment: {
      paymentReference: string;
      paymentAmount: number;
      paymentDate: Date;
      paymentMethod: string;
    };
    relatedRefunds: [{
      refundId: mongoose.Types.ObjectId;
      refundAmount: number;
      refundReason: string;
      relationType: 'split' | 'correction' | 'additional' | 'reversal';
    }];
    adjustments: [{
      adjustmentType: string;
      adjustmentAmount: number;
      adjustmentReason: string;
      adjustmentDate: Date;
      adjustmentBy: mongoose.Types.ObjectId;
    }];
  };
  
  // Analytics and insights
  analytics: {
    refundTriggers: {
      primaryTrigger: string;
      contributingFactors: string[];
      preventable: boolean;
      preventionSuggestions?: string[];
    };
    patterns: {
      isRecurringPattern: boolean;
      patternType?: string;
      frequency?: string;
      seasonality?: string;
    };
    benchmarking: {
      industryAverageTime: number; // hours
      competitorComparison: string;
      performanceScore: number; // 0-100
    };
  };
  
  // Integration data
  integrations: {
    accountingSystem?: {
      entryId: string;
      entryType: string;
      syncStatus: 'pending' | 'synced' | 'failed';
      lastSyncAt?: Date;
      syncErrors?: string[];
    };
    crmSystem?: {
      ticketId: string;
      caseId: string;
      contactUpdate: boolean;
    };
    reportingSystem?: {
      reportCategory: string;
      kpiImpact: string[];
      dashboardUpdate: boolean;
    };
    externalSystems: [{
      systemName: string;
      referenceId: string;
      syncRequired: boolean;
      lastSync?: Date;
    }];
  };
  
  // Quality assurance
  qualityAssurance: {
    reviewRequired: boolean;
    reviewCompleted: boolean;
    reviewedBy?: mongoose.Types.ObjectId;
    reviewDate?: Date;
    qualityScore?: number; // 0-100
    reviewNotes?: string;
    improvementSuggestions?: string[];
    processCompliance: boolean;
    policiesFollowed: boolean;
    exceptions: [{
      exceptionType: string;
      exceptionReason: string;
      approvedBy: mongoose.Types.ObjectId;
      approvalDate: Date;
    }];
  };
  
  // Chargeback and dispute handling
  chargebackInfo?: {
    chargebackReceived: boolean;
    chargebackDate?: Date;
    chargebackAmount?: number;
    chargebackReason?: string;
    disputeStatus: 'pending' | 'won' | 'lost' | 'settled';
    evidenceSubmitted: boolean;
    evidenceDocuments: [{
      documentType: string;
      documentUrl: string;
      submittedAt: Date;
    }];
    resolution?: {
      resolutionDate: Date;
      resolutionType: 'accepted' | 'representment_won' | 'representment_lost';
      finalAmount: number;
      resolutionNotes: string;
    };
  };
  
  // Recovery and collection
  recovery?: {
    recoveryRequired: boolean;
    recoveryAmount: number;
    recoveryReason: string;
    recoveryStatus: 'pending' | 'in_progress' | 'recovered' | 'written_off';
    recoveryAttempts: [{
      attemptDate: Date;
      attemptMethod: string;
      attemptBy: mongoose.Types.ObjectId;
      outcome: string;
      nextAttemptDate?: Date;
    }];
    finalOutcome?: {
      outcomeDate: Date;
      outcomeType: 'recovered' | 'settled' | 'written_off';
      finalAmount: number;
      outcomeNotes: string;
    };
  };
  
  // System fields
  isActive: boolean;
  isTestRefund: boolean;
  version: number;
  
  // Audit fields
  requestedBy: mongoose.Types.ObjectId;
  processedBy?: mongoose.Types.ObjectId;
  approvedBy?: mongoose.Types.ObjectId;
  createdBy: mongoose.Types.ObjectId;
  lastModifiedBy: mongoose.Types.ObjectId;
  
  createdAt: Date;
  updatedAt: Date;
}

const RefundSchema = new Schema<IRefund>({
  refundNumber: { 
    type: String, 
    required: true, 
    unique: true 
  },
  refundReference: { 
    type: String, 
    required: true 
  },
  propertyId: { 
    type: Schema.Types.ObjectId, 
    ref: 'Property', 
    required: true 
  },
  bookingId: { 
    type: Schema.Types.ObjectId, 
    ref: 'EnhancedBooking', 
    required: true 
  },
  paymentId: { 
    type: Schema.Types.ObjectId, 
    ref: 'EnhancedPayment', 
    required: true 
  },
  invoiceId: { 
    type: Schema.Types.ObjectId, 
    ref: 'Invoice' 
  },
  guestId: { 
    type: Schema.Types.ObjectId, 
    ref: 'Guest', 
    required: true 
  },
  
  refundDetails: {
    refundType: { 
      type: String, 
      enum: ['full', 'partial', 'service_charge', 'tax_only', 'processing_fee', 'adjustment'],
      required: true 
    },
    refundCategory: { 
      type: String, 
      enum: ['cancellation', 'no_show', 'overbooking', 'service_failure', 'billing_error', 'goodwill', 'dispute_resolution', 'policy_violation', 'force_majeure'],
      required: true 
    },
    refundReason: { type: String, required: true },
    refundDescription: { type: String },
    originalAmount: { type: Number, required: true, min: 0 },
    refundAmount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'INR' },
    refundPercentage: { type: Number, required: true, min: 0, max: 100 }
  },
  
  eligibility: {
    cancellationPolicy: { type: String, required: true },
    isEligible: { type: Boolean, required: true },
    eligibilityReason: { type: String, required: true },
    policyOverride: { type: Boolean, default: false },
    overrideReason: { type: String },
    overriddenBy: { type: Schema.Types.ObjectId, ref: 'User' },
    overrideApprovedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    gracePeriodApplied: { type: Boolean, default: false },
    penaltyWaived: { type: Boolean, default: false },
    penaltyAmount: { type: Number, min: 0 }
  },
  
  breakdown: {
    roomCharges: { type: Number, default: 0, min: 0 },
    taxes: { type: Number, default: 0, min: 0 },
    serviceCharges: { type: Number, default: 0, min: 0 },
    additionalServices: { type: Number, default: 0, min: 0 },
    penalties: { type: Number, default: 0, min: 0 },
    processingFee: { type: Number, default: 0, min: 0 },
    cancellationFee: { type: Number, default: 0, min: 0 },
    netRefundAmount: { type: Number, required: true, min: 0 },
    retainedAmount: { type: Number, default: 0, min: 0 },
    retentionReason: { type: String }
  },
  
  refundMethod: {
    method: { 
      type: String, 
      enum: ['original_payment_method', 'bank_transfer', 'cash', 'check', 'store_credit', 'voucher', 'wallet_credit'],
      required: true 
    },
    methodDetails: {
      bankDetails: {
        bankName: { type: String },
        accountNumber: { type: String },
        routingNumber: { type: String },
        ifscCode: { type: String },
        swiftCode: { type: String },
        accountHolderName: { type: String },
        branchAddress: { type: String }
      },
      originalPaymentReference: { type: String },
      cardLastFourDigits: { type: String },
      voucherDetails: {
        voucherCode: { type: String },
        expiryDate: { type: Date },
        restrictions: [{ type: String }],
        transferable: { type: Boolean, default: false }
      },
      walletDetails: {
        walletId: { type: String },
        walletProvider: { type: String }
      }
    }
  },
  
  status: {
    current: { 
      type: String, 
      enum: ['initiated', 'pending_approval', 'approved', 'processing', 'completed', 'failed', 'cancelled', 'partially_completed', 'disputed'],
      default: 'initiated' 
    },
    history: [{
      status: { type: String, required: true },
      timestamp: { type: Date, default: Date.now },
      changedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
      reason: { type: String },
      notes: { type: String },
      systemGenerated: { type: Boolean, default: false }
    }],
    approvals: [{
      level: { type: Number, required: true, min: 1 },
      approverRole: { type: String, required: true },
      approverId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
      approvedAt: { type: Date, required: true },
      decision: { 
        type: String, 
        enum: ['approved', 'rejected', 'pending'],
        required: true 
      },
      comments: { type: String },
      conditions: [{ type: String }]
    }]
  },
  
  timeline: {
    requestedAt: { type: Date, default: Date.now },
    approvedAt: { type: Date },
    processedAt: { type: Date },
    completedAt: { type: Date },
    failedAt: { type: Date },
    expectedCompletionDate: { type: Date },
    actualProcessingTime: { type: Number, min: 0 },
    businessDaysToComplete: { type: Number, min: 0 },
    processingDelay: {
      delayReason: { type: String },
      delayDuration: { type: Number, min: 0 },
      notifiedToGuest: { type: Boolean, default: false }
    }
  },
  
  gatewayProcessing: {
    gatewayName: { type: String, required: true },
    gatewayRefundId: { type: String },
    gatewayTransactionId: { type: String },
    gatewayStatus: { type: String, required: true },
    gatewayResponse: { type: Schema.Types.Mixed },
    gatewayFee: { type: Number, default: 0, min: 0 },
    gatewayProcessingTime: { type: Number, min: 0 },
    retryCount: { type: Number, default: 0, min: 0 },
    maxRetries: { type: Number, default: 3, min: 0 },
    lastRetryAt: { type: Date },
    nextRetryAt: { type: Date },
    gatewayErrors: [{
      errorCode: { type: String, required: true },
      errorMessage: { type: String, required: true },
      occurredAt: { type: Date, default: Date.now },
      retryable: { type: Boolean, default: true }
    }]
  },
  
  multiCurrency: {
    originalCurrency: { type: String },
    refundCurrency: { type: String },
    exchangeRate: { type: Number, min: 0 },
    conversionDate: { type: Date },
    originalCurrencyAmount: { type: Number, min: 0 },
    conversionFees: { type: Number, default: 0, min: 0 },
    exchangeRateSource: { type: String },
    rateGuaranteed: { type: Boolean, default: false }
  },
  
  taxImplications: {
    taxAdjustmentRequired: { type: Boolean, default: false },
    originalTaxAmount: { type: Number, default: 0, min: 0 },
    refundedTaxAmount: { type: Number, default: 0, min: 0 },
    taxRefundMethod: { 
      type: String, 
      enum: ['included', 'separate', 'adjustment_note'],
      default: 'included' 
    },
    taxDocuments: [{
      documentType: { type: String, required: true },
      documentNumber: { type: String, required: true },
      issueDate: { type: Date, required: true },
      documentUrl: { type: String }
    }],
    gstImpact: {
      gstAmount: { type: Number, min: 0 },
      gstNumber: { type: String },
      adjustmentEntry: { type: Boolean, default: false }
    }
  },
  
  compliance: {
    regulatoryCompliance: {
      pciCompliant: { type: Boolean, default: true },
      gdprCompliant: { type: Boolean, default: true },
      localLawsCompliant: { type: Boolean, default: true },
      complianceNotes: { type: String }
    },
    auditTrail: [{
      action: { type: String, required: true },
      performedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
      performedAt: { type: Date, default: Date.now },
      details: { type: String, required: true },
      ipAddress: { type: String, required: true },
      userAgent: { type: String },
      dataChanges: { type: Schema.Types.Mixed }
    }],
    documentRetention: {
      retentionPeriodYears: { type: Number, default: 7, min: 1 },
      disposalDate: { type: Date },
      legalHold: { type: Boolean, default: false },
      archivalLocation: { type: String }
    }
  },
  
  communication: {
    notifications: [{
      type: { 
        type: String, 
        enum: ['refund_initiated', 'refund_approved', 'refund_processing', 'refund_completed', 'refund_failed', 'refund_delayed'],
        required: true 
      },
      channel: { 
        type: String, 
        enum: ['email', 'sms', 'push', 'whatsapp', 'phone'],
        required: true 
      },
      sentAt: { type: Date, default: Date.now },
      deliveryStatus: { 
        type: String, 
        enum: ['sent', 'delivered', 'read', 'failed'],
        default: 'sent' 
      },
      template: { type: String, required: true },
      recipient: { type: String, required: true },
      content: { type: String }
    }],
    guestConfirmation: {
      confirmationRequired: { type: Boolean, default: false },
      confirmationReceived: { type: Boolean, default: false },
      confirmationDate: { type: Date },
      confirmationMethod: { type: String, default: 'email' },
      confirmationReference: { type: String }
    },
    disputeResolution: {
      disputeRaised: { type: Boolean, default: false },
      disputeReason: { type: String },
      disputeDate: { type: Date },
      resolutionDate: { type: Date },
      resolutionDetails: { type: String },
      mediatorInvolved: { type: Boolean, default: false }
    }
  },
  
  businessImpact: {
    revenueImpact: {
      directImpact: { type: Number, default: 0 },
      indirectImpact: { type: Number, default: 0 },
      futureBookingImpact: { type: Number, default: 0 },
      customerLifetimeValueImpact: { type: Number, default: 0 }
    },
    operationalImpact: {
      roomNightsLost: { type: Number, default: 0, min: 0 },
      occupancyImpact: { type: Number, default: 0 },
      revenuePARImpact: { type: Number, default: 0 },
      resourcesConsumed: { type: Number, default: 0, min: 0 }
    },
    customerRelationshipImpact: {
      satisfactionScore: { type: Number, min: 1, max: 10 },
      loyaltyImpact: { 
        type: String, 
        enum: ['positive', 'neutral', 'negative'],
        default: 'neutral' 
      },
      futureProbability: { type: Number, default: 50, min: 0, max: 100 },
      referralImpact: { 
        type: String, 
        enum: ['positive', 'neutral', 'negative'],
        default: 'neutral' 
      }
    }
  },
  
  security: {
    fraudCheck: {
      riskScore: { type: Number, default: 0, min: 0, max: 100 },
      riskFactors: [{ type: String }],
      verificationRequired: { type: Boolean, default: false },
      verificationStatus: { 
        type: String, 
        enum: ['pending', 'verified', 'failed'],
        default: 'pending' 
      },
      verificationMethod: [{ type: String }],
      verifiedBy: { type: Schema.Types.ObjectId, ref: 'User' },
      verifiedAt: { type: Date }
    },
    securityFlags: [{ type: String }],
    ipAddress: { type: String, required: true },
    deviceFingerprint: { type: String },
    geolocation: {
      country: { type: String },
      state: { type: String },
      city: { type: String },
      latitude: { type: Number },
      longitude: { type: Number }
    }
  },
  
  relatedTransactions: {
    originalBooking: {
      bookingReference: { type: String, required: true },
      checkInDate: { type: Date, required: true },
      checkOutDate: { type: Date, required: true },
      bookingStatus: { type: String, required: true }
    },
    originalPayment: {
      paymentReference: { type: String, required: true },
      paymentAmount: { type: Number, required: true, min: 0 },
      paymentDate: { type: Date, required: true },
      paymentMethod: { type: String, required: true }
    },
    relatedRefunds: [{
      refundId: { type: Schema.Types.ObjectId, ref: 'Refund', required: true },
      refundAmount: { type: Number, required: true, min: 0 },
      refundReason: { type: String, required: true },
      relationType: { 
        type: String, 
        enum: ['split', 'correction', 'additional', 'reversal'],
        required: true 
      }
    }],
    adjustments: [{
      adjustmentType: { type: String, required: true },
      adjustmentAmount: { type: Number, required: true },
      adjustmentReason: { type: String, required: true },
      adjustmentDate: { type: Date, required: true },
      adjustmentBy: { type: Schema.Types.ObjectId, ref: 'User', required: true }
    }]
  },
  
  analytics: {
    refundTriggers: {
      primaryTrigger: { type: String, required: true },
      contributingFactors: [{ type: String }],
      preventable: { type: Boolean, default: false },
      preventionSuggestions: [{ type: String }]
    },
    patterns: {
      isRecurringPattern: { type: Boolean, default: false },
      patternType: { type: String },
      frequency: { type: String },
      seasonality: { type: String }
    },
    benchmarking: {
      industryAverageTime: { type: Number, default: 72, min: 0 },
      competitorComparison: { type: String, default: 'average' },
      performanceScore: { type: Number, default: 50, min: 0, max: 100 }
    }
  },
  
  integrations: {
    accountingSystem: {
      entryId: { type: String },
      entryType: { type: String },
      syncStatus: { type: String, enum: ['pending', 'synced', 'failed'], default: 'pending' },
      lastSyncAt: { type: Date },
      syncErrors: [{ type: String }]
    },
    crmSystem: {
      ticketId: { type: String },
      caseId: { type: String },
      contactUpdate: { type: Boolean, default: false }
    },
    reportingSystem: {
      reportCategory: { type: String },
      kpiImpact: [{ type: String }],
      dashboardUpdate: { type: Boolean, default: false }
    },
    externalSystems: [{
      systemName: { type: String, required: true },
      referenceId: { type: String, required: true },
      syncRequired: { type: Boolean, default: false },
      lastSync: { type: Date }
    }]
  },
  
  qualityAssurance: {
    reviewRequired: { type: Boolean, default: false },
    reviewCompleted: { type: Boolean, default: false },
    reviewedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    reviewDate: { type: Date },
    qualityScore: { type: Number, min: 0, max: 100 },
    reviewNotes: { type: String },
    improvementSuggestions: [{ type: String }],
    processCompliance: { type: Boolean, default: true },
    policiesFollowed: { type: Boolean, default: true },
    exceptions: [{
      exceptionType: { type: String, required: true },
      exceptionReason: { type: String, required: true },
      approvedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
      approvalDate: { type: Date, required: true }
    }]
  },
  
  chargebackInfo: {
    chargebackReceived: { type: Boolean, default: false },
    chargebackDate: { type: Date },
    chargebackAmount: { type: Number, min: 0 },
    chargebackReason: { type: String },
    disputeStatus: { 
      type: String, 
      enum: ['pending', 'won', 'lost', 'settled'],
      default: 'pending' 
    },
    evidenceSubmitted: { type: Boolean, default: false },
    evidenceDocuments: [{
      documentType: { type: String, required: true },
      documentUrl: { type: String, required: true },
      submittedAt: { type: Date, default: Date.now }
    }],
    resolution: {
      resolutionDate: { type: Date },
      resolutionType: { type: String, enum: ['accepted', 'representment_won', 'representment_lost'] },
      finalAmount: { type: Number, min: 0 },
      resolutionNotes: { type: String }
    }
  },
  
  recovery: {
    recoveryRequired: { type: Boolean, default: false },
    recoveryAmount: { type: Number, min: 0 },
    recoveryReason: { type: String },
    recoveryStatus: { 
      type: String, 
      enum: ['pending', 'in_progress', 'recovered', 'written_off'],
      default: 'pending' 
    },
    recoveryAttempts: [{
      attemptDate: { type: Date, required: true },
      attemptMethod: { type: String, required: true },
      attemptBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
      outcome: { type: String, required: true },
      nextAttemptDate: { type: Date }
    }],
    finalOutcome: {
      outcomeDate: { type: Date },
      outcomeType: { type: String, enum: ['recovered', 'settled', 'written_off'] },
      finalAmount: { type: Number, min: 0 },
      outcomeNotes: { type: String }
    }
  },
  
  isActive: { type: Boolean, default: true },
  isTestRefund: { type: Boolean, default: false },
  version: { type: Number, default: 1, min: 1 },
  
  requestedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  processedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  approvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  lastModifiedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
RefundSchema.index({ refundNumber: 1 });
RefundSchema.index({ propertyId: 1 });
RefundSchema.index({ bookingId: 1 });
RefundSchema.index({ paymentId: 1 });
RefundSchema.index({ guestId: 1 });
RefundSchema.index({ 'status.current': 1 });
RefundSchema.index({ 'timeline.requestedAt': 1 });

// Compound indexes
RefundSchema.index({ propertyId: 1, 'status.current': 1 });
RefundSchema.index({ guestId: 1, 'timeline.requestedAt': -1 });
RefundSchema.index({ 'refundDetails.refundCategory': 1, 'timeline.requestedAt': -1 });

// Text search
RefundSchema.index({ 
  refundNumber: 'text',
  'refundDetails.refundReason': 'text',
  'relatedTransactions.originalBooking.bookingReference': 'text'
});

// Pre-save middleware
RefundSchema.pre('save', function(next) {
  // Calculate net refund amount
  this.breakdown.netRefundAmount = this.refundDetails.refundAmount - this.breakdown.processingFee;
  
  // Calculate retained amount
  this.breakdown.retainedAmount = this.refundDetails.originalAmount - this.refundDetails.refundAmount;
  
  // Calculate refund percentage
  if (this.refundDetails.originalAmount > 0) {
    this.refundDetails.refundPercentage = (this.refundDetails.refundAmount / this.refundDetails.originalAmount) * 100;
  }
  
  // Calculate processing time if completed
  if (this.status.current === 'completed' && this.timeline.completedAt && this.timeline.requestedAt) {
    this.timeline.actualProcessingTime = 
      (this.timeline.completedAt.getTime() - this.timeline.requestedAt.getTime()) / (1000 * 60 * 60);
  }
  
  // Update version
  if (this.isModified() && !this.isNew) {
    this.version += 1;
  }
  
  next();
});

// Generate unique refund number
RefundSchema.statics.generateRefundNumber = async function() {
  const prefix = 'REF';
  const year = new Date().getFullYear().toString().slice(-2);
  const month = String(new Date().getMonth() + 1).padStart(2, '0');
  const randomString = Math.random().toString(36).substring(2, 8).toUpperCase();
  
  let refundNumber = `${prefix}${year}${month}${randomString}`;
  
  // Ensure uniqueness
  let existing = await this.findOne({ refundNumber });
  while (existing) {
    const newRandomString = Math.random().toString(36).substring(2, 8).toUpperCase();
    refundNumber = `${prefix}${year}${month}${newRandomString}`;
    existing = await this.findOne({ refundNumber });
  }
  
  return refundNumber;
};

// Virtual for processing days
RefundSchema.virtual('processingDays').get(function() {
  if (this.timeline.completedAt && this.timeline.requestedAt) {
    return Math.ceil((this.timeline.completedAt.getTime() - this.timeline.requestedAt.getTime()) / (1000 * 60 * 60 * 24));
  }
  return 0;
});

// Virtual for is overdue
RefundSchema.virtual('isOverdue').get(function() {
  if (this.timeline.expectedCompletionDate && this.status.current !== 'completed') {
    return new Date() > this.timeline.expectedCompletionDate;
  }
  return false;
});

// Methods
RefundSchema.methods.updateStatus = function(newStatus: string, changedBy: string, reason?: string, notes?: string) {
  this.status.history.push({
    status: this.status.current,
    timestamp: new Date(),
    changedBy,
    reason,
    notes,
    systemGenerated: false
  });
  this.status.current = newStatus;
  
  // Update timeline based on status
  if (newStatus === 'approved') {
    this.timeline.approvedAt = new Date();
  } else if (newStatus === 'processing') {
    this.timeline.processedAt = new Date();
  } else if (newStatus === 'completed') {
    this.timeline.completedAt = new Date();
  } else if (newStatus === 'failed') {
    this.timeline.failedAt = new Date();
  }
  
  this.lastModifiedBy = changedBy;
  return this.save();
};

RefundSchema.methods.addApproval = function(approvalData: any) {
  this.status.approvals.push(approvalData);
  if (approvalData.decision === 'approved') {
    this.status.current = 'approved';
    this.approvedBy = approvalData.approverId;
  } else if (approvalData.decision === 'rejected') {
    this.status.current = 'cancelled';
  }
  return this.save();
};

RefundSchema.methods.processRefund = function(gatewayResponse: any, processedBy: string) {
  this.gatewayProcessing.gatewayResponse = gatewayResponse;
  this.gatewayProcessing.gatewayStatus = gatewayResponse.status;
  if (gatewayResponse.refundId) {
    this.gatewayProcessing.gatewayRefundId = gatewayResponse.refundId;
  }
  
  this.processedBy = processedBy;
  this.timeline.processedAt = new Date();
  
  if (gatewayResponse.status === 'completed') {
    this.status.current = 'completed';
    this.timeline.completedAt = new Date();
  } else if (gatewayResponse.status === 'failed') {
    this.status.current = 'failed';
    this.timeline.failedAt = new Date();
  }
  
  return this.save();
};

// Static methods
RefundSchema.statics.getRefundsByStatus = function(propertyId: string, status: string) {
  return this.find({ propertyId, 'status.current': status }).sort({ 'timeline.requestedAt': -1 });
};

RefundSchema.statics.getPendingRefunds = function(propertyId?: string) {
  const filter: any = {
    'status.current': { $in: ['initiated', 'pending_approval', 'approved', 'processing'] }
  };
  
  if (propertyId) {
    filter.propertyId = propertyId;
  }
  
  return this.find(filter).sort({ 'timeline.requestedAt': 1 });
};

RefundSchema.statics.getRefundAnalytics = function(propertyId: string, startDate: Date, endDate: Date) {
  return this.aggregate([
    {
      $match: {
        propertyId: new mongoose.Types.ObjectId(propertyId),
        'timeline.requestedAt': { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: '$refundDetails.refundCategory',
        totalRefunds: { $sum: 1 },
        totalAmount: { $sum: '$refundDetails.refundAmount' },
        averageAmount: { $avg: '$refundDetails.refundAmount' },
        averageProcessingTime: { $avg: '$timeline.actualProcessingTime' }
      }
    }
  ]);
};

export default mongoose.models.Refund || mongoose.model<IRefund>('Refund', RefundSchema);