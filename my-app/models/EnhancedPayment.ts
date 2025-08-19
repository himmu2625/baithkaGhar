import mongoose, { Schema, Document } from 'mongoose';

export interface IEnhancedPayment extends Document {
  // Core payment information
  paymentReference: string; // Unique payment reference
  bookingId: mongoose.Types.ObjectId;
  propertyId: mongoose.Types.ObjectId;
  guestId: mongoose.Types.ObjectId;
  userId?: mongoose.Types.ObjectId;
  
  // Payment details
  paymentDetails: {
    amount: number;
    currency: string;
    paymentType: 'full_payment' | 'partial_payment' | 'deposit' | 'advance' | 'balance' | 'additional_charges';
    paymentPurpose: 'booking' | 'room_service' | 'amenities' | 'penalty' | 'deposit' | 'upgrade' | 'services' | 'other';
    originalAmount?: number; // Before any adjustments
    adjustedAmount?: number; // After discounts/fees
    exchangeRate?: number; // If foreign currency
    baseCurrency?: string; // Property's base currency
  };
  
  // Payment method and gateway
  paymentMethod: {
    type: 'credit_card' | 'debit_card' | 'net_banking' | 'upi' | 'wallet' | 'cash' | 'cheque' | 'bank_transfer' | 'corporate_credit' | 'bnpl' | 'cryptocurrency';
    subType?: string; // Visa, MasterCard, PayPal, etc.
    provider: string; // Razorpay, Stripe, PayU, etc.
    cardDetails?: {
      cardType: 'credit' | 'debit';
      cardBrand: string; // Visa, MasterCard, etc.
      lastFourDigits: string;
      expiryMonth: number;
      expiryYear: number;
      cardHolderName: string;
      issuingBank?: string;
      cardCountry?: string;
    };
    bankDetails?: {
      bankName: string;
      accountNumber?: string; // Masked
      routingNumber?: string;
      branchCode?: string;
    };
    walletDetails?: {
      walletProvider: string;
      walletId?: string;
    };
    upiDetails?: {
      vpa: string;
      upiProvider: string;
    };
  };
  
  // Transaction details
  transaction: {
    transactionId: string;
    gatewayTransactionId?: string;
    merchantTransactionId?: string;
    gatewayOrderId?: string;
    authorizationCode?: string;
    rrn?: string; // Retrieval Reference Number
    acquirerTransactionId?: string;
    processingFee: number;
    gatewayFee: number;
    netAmount: number; // Amount after deducting fees
  };
  
  // Status and workflow
  status: {
    current: 'initiated' | 'pending' | 'processing' | 'authorized' | 'captured' | 'succeeded' | 'failed' | 'cancelled' | 'refunded' | 'partially_refunded' | 'disputed' | 'chargeback';
    history: [{
      status: string;
      timestamp: Date;
      reason?: string;
      gatewayResponse?: string;
      errorCode?: string;
      errorMessage?: string;
      updatedBy?: mongoose.Types.ObjectId;
    }];
    failureReason?: string;
    retryCount: number;
    maxRetries: number;
    canRetry: boolean;
  };
  
  // Timing information
  timing: {
    initiatedAt: Date;
    authorizedAt?: Date;
    capturedAt?: Date;
    settledAt?: Date;
    expiresAt?: Date;
    processingTime?: number; // in milliseconds
    settlementTime?: number; // in hours
  };
  
  // Security and fraud detection
  security: {
    ipAddress: string;
    userAgent?: string;
    deviceFingerprint?: string;
    geolocation?: {
      country: string;
      state: string;
      city: string;
      latitude?: number;
      longitude?: number;
    };
    fraudScore: number; // 0-100
    fraudChecks: {
      avsCheck?: 'pass' | 'fail' | 'unavailable';
      cvvCheck?: 'pass' | 'fail' | 'unavailable';
      velocityCheck: boolean;
      blacklistCheck: boolean;
      binCheck: boolean;
      riskScore: number;
    };
    threeDSAuthentication?: {
      enabled: boolean;
      version?: string; // 1.0, 2.0, 2.1
      status?: 'authenticated' | 'not_authenticated' | 'attempted' | 'failed';
      eci?: string; // Electronic Commerce Indicator
      cavv?: string; // Cardholder Authentication Verification Value
      xid?: string; // Transaction ID
    };
  };
  
  // Billing information
  billing: {
    billingAddress: {
      name: string;
      email: string;
      phone: string;
      address: string;
      city: string;
      state: string;
      country: string;
      zipCode: string;
    };
    taxDetails: {
      taxAmount: number;
      taxPercentage: number;
      taxBreakdown: [{
        taxType: string; // GST, VAT, Service Tax, etc.
        taxRate: number;
        taxAmount: number;
        taxableAmount: number;
      }];
      taxExempt: boolean;
      exemptionReason?: string;
    };
    invoiceDetails: {
      invoiceNumber?: string;
      invoiceDate?: Date;
      dueDate?: Date;
      invoiceStatus: 'pending' | 'sent' | 'paid' | 'overdue' | 'cancelled';
    };
  };
  
  // Refund information
  refunds: [{
    refundId: string;
    refundReference: string;
    refundAmount: number;
    refundReason: string;
    refundType: 'full' | 'partial' | 'processing_fee_only';
    refundMethod: 'original_payment_method' | 'bank_transfer' | 'cash' | 'voucher' | 'credit_note';
    refundStatus: 'initiated' | 'processing' | 'completed' | 'failed' | 'cancelled';
    refundedAt?: Date;
    refundProcessingTime?: number; // in hours
    refundFee?: number;
    netRefundAmount?: number;
    refundedBy: mongoose.Types.ObjectId;
    gatewayRefundId?: string;
    refundNotes?: string;
  }];
  
  // Installment/EMI details
  installment?: {
    isInstallment: boolean;
    installmentProvider?: string;
    installmentPlan: {
      totalInstallments: number;
      installmentAmount: number;
      interestRate: number;
      processingFee: number;
      firstInstallmentDate: Date;
      frequency: 'monthly' | 'weekly' | 'bi_weekly';
    };
    installmentHistory: [{
      installmentNumber: number;
      dueDate: Date;
      amount: number;
      paidDate?: Date;
      status: 'pending' | 'paid' | 'overdue' | 'failed';
      lateFee?: number;
    }];
  };
  
  // Dispute and chargeback management
  disputes: [{
    disputeId: string;
    disputeType: 'chargeback' | 'pre_arbitration' | 'arbitration' | 'fraud' | 'authorization' | 'processing_error' | 'consumer_dispute';
    disputeAmount: number;
    disputeReason: string;
    disputeDate: Date;
    disputeStatus: 'received' | 'under_review' | 'accepted' | 'lost' | 'won' | 'expired';
    evidenceSubmitted: boolean;
    evidenceDeadline?: Date;
    responseDeadline?: Date;
    representmentAmount?: number;
    liabilityShift: boolean;
    disputeDocuments: [{
      documentType: string;
      documentUrl: string;
      uploadedAt: Date;
    }];
    resolution?: {
      resolvedAt: Date;
      resolutionType: 'accepted' | 'representment_won' | 'representment_lost';
      finalAmount: number;
      resolutionNotes: string;
    };
  }];
  
  // Reconciliation
  reconciliation: {
    reconciledDate?: Date;
    reconciledBy?: mongoose.Types.ObjectId;
    bankStatementMatch: boolean;
    gatewayStatementMatch: boolean;
    reconciliationNotes?: string;
    discrepancies: [{
      type: string;
      description: string;
      amount: number;
      resolvedAt?: Date;
    }];
  };
  
  // Integration and webhook data
  integrations: {
    webhookData: [{
      webhookId: string;
      eventType: string;
      receivedAt: Date;
      processed: boolean;
      processedAt?: Date;
      rawData: mongoose.Schema.Types.Mixed;
      processingErrors?: string[];
    }];
    gatewayMetadata: mongoose.Schema.Types.Mixed;
    externalReferences: [{
      system: string;
      referenceId: string;
      referenceType: string;
    }];
  };
  
  // Analytics and reporting
  analytics: {
    paymentChannel: string;
    conversionFunnel: {
      checkoutInitiated: Date;
      paymentInitiated: Date;
      paymentCompleted?: Date;
      abandonedAt?: Date;
      conversionTime?: number; // in seconds
    };
    customerBehavior: {
      paymentAttempts: number;
      methodSwitches: number;
      timeSpentOnPayment: number; // in seconds
      deviceType: 'mobile' | 'tablet' | 'desktop';
      browserType?: string;
    };
    riskMetrics: {
      velocityScore: number;
      patternScore: number;
      deviceScore: number;
      locationScore: number;
      overallRiskScore: number;
    };
  };
  
  // Compliance and audit
  compliance: {
    pciCompliant: boolean;
    gdprCompliant: boolean;
    dataRetentionPolicy: string;
    auditTrail: [{
      action: string;
      performedBy: mongoose.Types.ObjectId;
      performedAt: Date;
      oldValues?: mongoose.Schema.Types.Mixed;
      newValues?: mongoose.Schema.Types.Mixed;
      ipAddress: string;
      userAgent?: string;
    }];
    complianceFlags: string[];
    retentionPeriod: number; // in days
  };
  
  // Settlement information
  settlement: {
    settlementId?: string;
    settlementBatchId?: string;
    settlementDate?: Date;
    settlementAmount: number;
    settlementCurrency: string;
    settlementStatus: 'pending' | 'in_progress' | 'settled' | 'failed';
    bankAccount: {
      accountNumber: string; // Masked
      accountHolderName: string;
      bankName: string;
      ifscCode?: string;
      routingNumber?: string;
    };
    settlementFees: number;
    netSettlementAmount: number;
    settlementReference?: string;
  };
  
  // Customer communication
  notifications: [{
    type: 'payment_initiated' | 'payment_success' | 'payment_failed' | 'refund_initiated' | 'refund_completed' | 'dispute_received';
    channel: 'email' | 'sms' | 'push' | 'whatsapp';
    sentAt: Date;
    deliveryStatus: 'sent' | 'delivered' | 'read' | 'failed';
    template: string;
    recipient: string;
  }];
  
  // Multi-currency support
  multiCurrency?: {
    originalCurrency: string;
    originalAmount: number;
    conversionRate: number;
    conversionDate: Date;
    markupPercentage: number;
    providerRate: number;
    finalRate: number;
  };
  
  // Subscription/recurring payment details
  subscription?: {
    subscriptionId: string;
    recurringType: 'fixed' | 'variable';
    frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
    nextPaymentDate?: Date;
    totalRecurrences?: number;
    currentRecurrence: number;
    subscriptionStatus: 'active' | 'paused' | 'cancelled' | 'expired';
  };
  
  // System fields
  isActive: boolean;
  isTestPayment: boolean;
  version: number;
  
  // Audit fields
  createdBy: mongoose.Types.ObjectId;
  lastModifiedBy: mongoose.Types.ObjectId;
  
  createdAt: Date;
  updatedAt: Date;
}

const EnhancedPaymentSchema = new Schema<IEnhancedPayment>({
  paymentReference: { 
    type: String, 
    required: true, 
    unique: true,
    uppercase: true 
  },
  bookingId: { 
    type: Schema.Types.ObjectId, 
    ref: 'EnhancedBooking', 
    required: true 
  },
  propertyId: { 
    type: Schema.Types.ObjectId, 
    ref: 'Property', 
    required: true 
  },
  guestId: { 
    type: Schema.Types.ObjectId, 
    ref: 'Guest', 
    required: true 
  },
  userId: { 
    type: Schema.Types.ObjectId, 
    ref: 'User' 
  },
  
  paymentDetails: {
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, required: true, default: 'INR' },
    paymentType: { 
      type: String, 
      enum: ['full_payment', 'partial_payment', 'deposit', 'advance', 'balance', 'additional_charges'],
      required: true 
    },
    paymentPurpose: { 
      type: String, 
      enum: ['booking', 'room_service', 'amenities', 'penalty', 'deposit', 'upgrade', 'services', 'other'],
      required: true 
    },
    originalAmount: { type: Number, min: 0 },
    adjustedAmount: { type: Number, min: 0 },
    exchangeRate: { type: Number, min: 0 },
    baseCurrency: { type: String }
  },
  
  paymentMethod: {
    type: { 
      type: String, 
      enum: ['credit_card', 'debit_card', 'net_banking', 'upi', 'wallet', 'cash', 'cheque', 'bank_transfer', 'corporate_credit', 'bnpl', 'cryptocurrency'],
      required: true 
    },
    subType: { type: String },
    provider: { type: String, required: true },
    cardDetails: {
      cardType: { type: String, enum: ['credit', 'debit'] },
      cardBrand: { type: String },
      lastFourDigits: { type: String },
      expiryMonth: { type: Number, min: 1, max: 12 },
      expiryYear: { type: Number },
      cardHolderName: { type: String },
      issuingBank: { type: String },
      cardCountry: { type: String }
    },
    bankDetails: {
      bankName: { type: String },
      accountNumber: { type: String },
      routingNumber: { type: String },
      branchCode: { type: String }
    },
    walletDetails: {
      walletProvider: { type: String },
      walletId: { type: String }
    },
    upiDetails: {
      vpa: { type: String },
      upiProvider: { type: String }
    }
  },
  
  transaction: {
    transactionId: { type: String, required: true },
    gatewayTransactionId: { type: String },
    merchantTransactionId: { type: String },
    gatewayOrderId: { type: String },
    authorizationCode: { type: String },
    rrn: { type: String },
    acquirerTransactionId: { type: String },
    processingFee: { type: Number, default: 0, min: 0 },
    gatewayFee: { type: Number, default: 0, min: 0 },
    netAmount: { type: Number, required: true, min: 0 }
  },
  
  status: {
    current: { 
      type: String, 
      enum: ['initiated', 'pending', 'processing', 'authorized', 'captured', 'succeeded', 'failed', 'cancelled', 'refunded', 'partially_refunded', 'disputed', 'chargeback'],
      default: 'initiated' 
    },
    history: [{
      status: { type: String, required: true },
      timestamp: { type: Date, default: Date.now },
      reason: { type: String },
      gatewayResponse: { type: String },
      errorCode: { type: String },
      errorMessage: { type: String },
      updatedBy: { type: Schema.Types.ObjectId, ref: 'User' }
    }],
    failureReason: { type: String },
    retryCount: { type: Number, default: 0, min: 0 },
    maxRetries: { type: Number, default: 3, min: 0 },
    canRetry: { type: Boolean, default: true }
  },
  
  timing: {
    initiatedAt: { type: Date, default: Date.now },
    authorizedAt: { type: Date },
    capturedAt: { type: Date },
    settledAt: { type: Date },
    expiresAt: { type: Date },
    processingTime: { type: Number, min: 0 },
    settlementTime: { type: Number, min: 0 }
  },
  
  security: {
    ipAddress: { type: String, required: true },
    userAgent: { type: String },
    deviceFingerprint: { type: String },
    geolocation: {
      country: { type: String },
      state: { type: String },
      city: { type: String },
      latitude: { type: Number },
      longitude: { type: Number }
    },
    fraudScore: { type: Number, default: 0, min: 0, max: 100 },
    fraudChecks: {
      avsCheck: { type: String, enum: ['pass', 'fail', 'unavailable'] },
      cvvCheck: { type: String, enum: ['pass', 'fail', 'unavailable'] },
      velocityCheck: { type: Boolean, default: true },
      blacklistCheck: { type: Boolean, default: true },
      binCheck: { type: Boolean, default: true },
      riskScore: { type: Number, default: 0, min: 0, max: 100 }
    },
    threeDSAuthentication: {
      enabled: { type: Boolean, default: false },
      version: { type: String },
      status: { type: String, enum: ['authenticated', 'not_authenticated', 'attempted', 'failed'] },
      eci: { type: String },
      cavv: { type: String },
      xid: { type: String }
    }
  },
  
  billing: {
    billingAddress: {
      name: { type: String, required: true },
      email: { type: String, required: true },
      phone: { type: String, required: true },
      address: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
      country: { type: String, required: true },
      zipCode: { type: String, required: true }
    },
    taxDetails: {
      taxAmount: { type: Number, default: 0, min: 0 },
      taxPercentage: { type: Number, default: 0, min: 0, max: 100 },
      taxBreakdown: [{
        taxType: { type: String, required: true },
        taxRate: { type: Number, required: true, min: 0 },
        taxAmount: { type: Number, required: true, min: 0 },
        taxableAmount: { type: Number, required: true, min: 0 }
      }],
      taxExempt: { type: Boolean, default: false },
      exemptionReason: { type: String }
    },
    invoiceDetails: {
      invoiceNumber: { type: String },
      invoiceDate: { type: Date },
      dueDate: { type: Date },
      invoiceStatus: { 
        type: String, 
        enum: ['pending', 'sent', 'paid', 'overdue', 'cancelled'],
        default: 'pending' 
      }
    }
  },
  
  refunds: [{
    refundId: { type: String, required: true },
    refundReference: { type: String, required: true },
    refundAmount: { type: Number, required: true, min: 0 },
    refundReason: { type: String, required: true },
    refundType: { 
      type: String, 
      enum: ['full', 'partial', 'processing_fee_only'],
      required: true 
    },
    refundMethod: { 
      type: String, 
      enum: ['original_payment_method', 'bank_transfer', 'cash', 'voucher', 'credit_note'],
      required: true 
    },
    refundStatus: { 
      type: String, 
      enum: ['initiated', 'processing', 'completed', 'failed', 'cancelled'],
      default: 'initiated' 
    },
    refundedAt: { type: Date },
    refundProcessingTime: { type: Number, min: 0 },
    refundFee: { type: Number, default: 0, min: 0 },
    netRefundAmount: { type: Number, min: 0 },
    refundedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    gatewayRefundId: { type: String },
    refundNotes: { type: String }
  }],
  
  installment: {
    isInstallment: { type: Boolean, default: false },
    installmentProvider: { type: String },
    installmentPlan: {
      totalInstallments: { type: Number, min: 2 },
      installmentAmount: { type: Number, min: 0 },
      interestRate: { type: Number, min: 0, max: 100 },
      processingFee: { type: Number, default: 0, min: 0 },
      firstInstallmentDate: { type: Date },
      frequency: { type: String, enum: ['monthly', 'weekly', 'bi_weekly'] }
    },
    installmentHistory: [{
      installmentNumber: { type: Number, required: true, min: 1 },
      dueDate: { type: Date, required: true },
      amount: { type: Number, required: true, min: 0 },
      paidDate: { type: Date },
      status: { 
        type: String, 
        enum: ['pending', 'paid', 'overdue', 'failed'],
        default: 'pending' 
      },
      lateFee: { type: Number, default: 0, min: 0 }
    }]
  },
  
  disputes: [{
    disputeId: { type: String, required: true },
    disputeType: { 
      type: String, 
      enum: ['chargeback', 'pre_arbitration', 'arbitration', 'fraud', 'authorization', 'processing_error', 'consumer_dispute'],
      required: true 
    },
    disputeAmount: { type: Number, required: true, min: 0 },
    disputeReason: { type: String, required: true },
    disputeDate: { type: Date, required: true },
    disputeStatus: { 
      type: String, 
      enum: ['received', 'under_review', 'accepted', 'lost', 'won', 'expired'],
      default: 'received' 
    },
    evidenceSubmitted: { type: Boolean, default: false },
    evidenceDeadline: { type: Date },
    responseDeadline: { type: Date },
    representmentAmount: { type: Number, min: 0 },
    liabilityShift: { type: Boolean, default: false },
    disputeDocuments: [{
      documentType: { type: String, required: true },
      documentUrl: { type: String, required: true },
      uploadedAt: { type: Date, default: Date.now }
    }],
    resolution: {
      resolvedAt: { type: Date },
      resolutionType: { type: String, enum: ['accepted', 'representment_won', 'representment_lost'] },
      finalAmount: { type: Number, min: 0 },
      resolutionNotes: { type: String }
    }
  }],
  
  reconciliation: {
    reconciledDate: { type: Date },
    reconciledBy: { type: Schema.Types.ObjectId, ref: 'User' },
    bankStatementMatch: { type: Boolean, default: false },
    gatewayStatementMatch: { type: Boolean, default: false },
    reconciliationNotes: { type: String },
    discrepancies: [{
      type: { type: String, required: true },
      description: { type: String, required: true },
      amount: { type: Number, required: true },
      resolvedAt: { type: Date }
    }]
  },
  
  integrations: {
    webhookData: [{
      webhookId: { type: String, required: true },
      eventType: { type: String, required: true },
      receivedAt: { type: Date, default: Date.now },
      processed: { type: Boolean, default: false },
      processedAt: { type: Date },
      rawData: { type: Schema.Types.Mixed },
      processingErrors: [{ type: String }]
    }],
    gatewayMetadata: { type: Schema.Types.Mixed },
    externalReferences: [{
      system: { type: String, required: true },
      referenceId: { type: String, required: true },
      referenceType: { type: String, required: true }
    }]
  },
  
  analytics: {
    paymentChannel: { type: String, required: true },
    conversionFunnel: {
      checkoutInitiated: { type: Date, required: true },
      paymentInitiated: { type: Date, required: true },
      paymentCompleted: { type: Date },
      abandonedAt: { type: Date },
      conversionTime: { type: Number, min: 0 }
    },
    customerBehavior: {
      paymentAttempts: { type: Number, default: 1, min: 1 },
      methodSwitches: { type: Number, default: 0, min: 0 },
      timeSpentOnPayment: { type: Number, default: 0, min: 0 },
      deviceType: { type: String, enum: ['mobile', 'tablet', 'desktop'], required: true },
      browserType: { type: String }
    },
    riskMetrics: {
      velocityScore: { type: Number, default: 0, min: 0, max: 100 },
      patternScore: { type: Number, default: 0, min: 0, max: 100 },
      deviceScore: { type: Number, default: 0, min: 0, max: 100 },
      locationScore: { type: Number, default: 0, min: 0, max: 100 },
      overallRiskScore: { type: Number, default: 0, min: 0, max: 100 }
    }
  },
  
  compliance: {
    pciCompliant: { type: Boolean, default: true },
    gdprCompliant: { type: Boolean, default: true },
    dataRetentionPolicy: { type: String, required: true },
    auditTrail: [{
      action: { type: String, required: true },
      performedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
      performedAt: { type: Date, default: Date.now },
      oldValues: { type: Schema.Types.Mixed },
      newValues: { type: Schema.Types.Mixed },
      ipAddress: { type: String, required: true },
      userAgent: { type: String }
    }],
    complianceFlags: [{ type: String }],
    retentionPeriod: { type: Number, default: 2555, min: 365 } // 7 years default
  },
  
  settlement: {
    settlementId: { type: String },
    settlementBatchId: { type: String },
    settlementDate: { type: Date },
    settlementAmount: { type: Number, default: 0, min: 0 },
    settlementCurrency: { type: String, default: 'INR' },
    settlementStatus: { 
      type: String, 
      enum: ['pending', 'in_progress', 'settled', 'failed'],
      default: 'pending' 
    },
    bankAccount: {
      accountNumber: { type: String },
      accountHolderName: { type: String },
      bankName: { type: String },
      ifscCode: { type: String },
      routingNumber: { type: String }
    },
    settlementFees: { type: Number, default: 0, min: 0 },
    netSettlementAmount: { type: Number, default: 0, min: 0 },
    settlementReference: { type: String }
  },
  
  notifications: [{
    type: { 
      type: String, 
      enum: ['payment_initiated', 'payment_success', 'payment_failed', 'refund_initiated', 'refund_completed', 'dispute_received'],
      required: true 
    },
    channel: { 
      type: String, 
      enum: ['email', 'sms', 'push', 'whatsapp'],
      required: true 
    },
    sentAt: { type: Date, default: Date.now },
    deliveryStatus: { 
      type: String, 
      enum: ['sent', 'delivered', 'read', 'failed'],
      default: 'sent' 
    },
    template: { type: String, required: true },
    recipient: { type: String, required: true }
  }],
  
  multiCurrency: {
    originalCurrency: { type: String },
    originalAmount: { type: Number, min: 0 },
    conversionRate: { type: Number, min: 0 },
    conversionDate: { type: Date },
    markupPercentage: { type: Number, min: 0, max: 100 },
    providerRate: { type: Number, min: 0 },
    finalRate: { type: Number, min: 0 }
  },
  
  subscription: {
    subscriptionId: { type: String },
    recurringType: { type: String, enum: ['fixed', 'variable'] },
    frequency: { type: String, enum: ['daily', 'weekly', 'monthly', 'quarterly', 'yearly'] },
    nextPaymentDate: { type: Date },
    totalRecurrences: { type: Number, min: 1 },
    currentRecurrence: { type: Number, default: 1, min: 1 },
    subscriptionStatus: { 
      type: String, 
      enum: ['active', 'paused', 'cancelled', 'expired'],
      default: 'active' 
    }
  },
  
  isActive: { type: Boolean, default: true },
  isTestPayment: { type: Boolean, default: false },
  version: { type: Number, default: 1, min: 1 },
  
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  lastModifiedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
EnhancedPaymentSchema.index({ paymentReference: 1 });
EnhancedPaymentSchema.index({ bookingId: 1 });
EnhancedPaymentSchema.index({ propertyId: 1 });
EnhancedPaymentSchema.index({ guestId: 1 });
EnhancedPaymentSchema.index({ 'status.current': 1 });
EnhancedPaymentSchema.index({ 'transaction.transactionId': 1 });
EnhancedPaymentSchema.index({ 'settlement.settlementDate': 1 });
EnhancedPaymentSchema.index({ 'timing.initiatedAt': 1 });

// Compound indexes
EnhancedPaymentSchema.index({ propertyId: 1, 'status.current': 1 });
EnhancedPaymentSchema.index({ guestId: 1, 'timing.initiatedAt': -1 });
EnhancedPaymentSchema.index({ 'paymentMethod.type': 1, 'status.current': 1 });
EnhancedPaymentSchema.index({ 'settlement.settlementStatus': 1, 'settlement.settlementDate': 1 });

// Text search
EnhancedPaymentSchema.index({ 
  paymentReference: 'text',
  'transaction.transactionId': 'text',
  'billing.billingAddress.email': 'text'
});

// Pre-save middleware
EnhancedPaymentSchema.pre('save', function(next) {
  // Calculate net amount after fees
  this.transaction.netAmount = this.paymentDetails.amount - this.transaction.processingFee - this.transaction.gatewayFee;
  
  // Calculate net settlement amount
  this.settlement.netSettlementAmount = this.settlement.settlementAmount - this.settlement.settlementFees;
  
  // Update overall risk score
  const riskMetrics = this.analytics.riskMetrics;
  this.analytics.riskMetrics.overallRiskScore = Math.round(
    (riskMetrics.velocityScore + riskMetrics.patternScore + riskMetrics.deviceScore + riskMetrics.locationScore) / 4
  );
  
  // Update fraud score based on checks
  if (this.security.fraudChecks) {
    let score = 0;
    if (this.security.fraudChecks.avsCheck === 'fail') score += 20;
    if (this.security.fraudChecks.cvvCheck === 'fail') score += 20;
    if (!this.security.fraudChecks.velocityCheck) score += 15;
    if (!this.security.fraudChecks.blacklistCheck) score += 25;
    if (!this.security.fraudChecks.binCheck) score += 10;
    
    this.security.fraudScore = Math.min(score, 100);
  }
  
  // Update version
  if (this.isModified() && !this.isNew) {
    this.version += 1;
  }
  
  next();
});

// Generate unique payment reference
EnhancedPaymentSchema.statics.generatePaymentReference = async function() {
  const prefix = 'PAY';
  const year = new Date().getFullYear().toString().slice(-2);
  const randomString = Math.random().toString(36).substring(2, 10).toUpperCase();
  
  let reference = `${prefix}${year}${randomString}`;
  
  // Ensure uniqueness
  let existing = await this.findOne({ paymentReference: reference });
  while (existing) {
    const newRandomString = Math.random().toString(36).substring(2, 10).toUpperCase();
    reference = `${prefix}${year}${newRandomString}`;
    existing = await this.findOne({ paymentReference: reference });
  }
  
  return reference;
};

// Virtual for total refunded amount
EnhancedPaymentSchema.virtual('totalRefundedAmount').get(function() {
  return this.refunds.reduce((total: number, refund: any) => {
    return refund.refundStatus === 'completed' ? total + refund.refundAmount : total;
  }, 0);
});

// Virtual for net amount received
EnhancedPaymentSchema.virtual('netAmountReceived').get(function() {
  const totalRefunded = this.refunds.reduce((total: number, refund: any) => {
    return refund.refundStatus === 'completed' ? total + refund.refundAmount : total;
  }, 0);
  return this.transaction.netAmount - totalRefunded;
});

// Methods
EnhancedPaymentSchema.methods.updateStatus = function(newStatus: string, reason?: string, gatewayResponse?: string) {
  this.status.history.push({
    status: this.status.current,
    timestamp: new Date(),
    reason,
    gatewayResponse
  });
  this.status.current = newStatus;
  
  // Update timing based on status
  if (newStatus === 'authorized') {
    this.timing.authorizedAt = new Date();
  } else if (newStatus === 'captured' || newStatus === 'succeeded') {
    this.timing.capturedAt = new Date();
    this.timing.processingTime = Date.now() - this.timing.initiatedAt.getTime();
  }
  
  return this.save();
};

EnhancedPaymentSchema.methods.addRefund = function(refundData: any) {
  this.refunds.push(refundData);
  
  // Update status if fully refunded
  const totalRefunded = this.refunds
    .filter((refund: any) => refund.refundStatus === 'completed')
    .reduce((sum: number, refund: any) => sum + refund.refundAmount, 0);
    
  if (totalRefunded >= this.paymentDetails.amount) {
    this.status.current = 'refunded';
  } else if (totalRefunded > 0) {
    this.status.current = 'partially_refunded';
  }
  
  return this.save();
};

EnhancedPaymentSchema.methods.addDispute = function(disputeData: any) {
  this.disputes.push(disputeData);
  this.status.current = 'disputed';
  return this.save();
};

// Static methods
EnhancedPaymentSchema.statics.getByTransactionId = function(transactionId: string) {
  return this.findOne({ 'transaction.transactionId': transactionId });
};

EnhancedPaymentSchema.statics.getPaymentsByStatus = function(propertyId: string, status: string) {
  return this.find({ propertyId, 'status.current': status }).sort({ 'timing.initiatedAt': -1 });
};

EnhancedPaymentSchema.statics.getSettlementsForDate = function(settlementDate: Date) {
  const startOfDay = new Date(settlementDate);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(settlementDate);
  endOfDay.setHours(23, 59, 59, 999);
  
  return this.find({
    'settlement.settlementDate': { $gte: startOfDay, $lte: endOfDay },
    'settlement.settlementStatus': 'settled'
  });
};

export default mongoose.models.EnhancedPayment || mongoose.model<IEnhancedPayment>('EnhancedPayment', EnhancedPaymentSchema);