import mongoose, { Schema, Document } from 'mongoose';

export interface ICommission extends Document {
  // Core commission information
  commissionNumber: string; // Unique commission number
  commissionReference: string; // Additional reference
  propertyId: mongoose.Types.ObjectId;
  bookingId: mongoose.Types.ObjectId;
  paymentId?: mongoose.Types.ObjectId;
  
  // Commission recipient details
  recipient: {
    recipientType: 'travel_agent' | 'influencer' | 'affiliate' | 'sales_agent' | 'channel_partner' | 'referral' | 'employee' | 'corporate';
    recipientId: mongoose.Types.ObjectId; // ID of the recipient entity
    recipientDetails: {
      name: string;
      email: string;
      phone?: string;
      companyName?: string;
      licenseNumber?: string;
      taxId?: string;
      registrationNumber?: string;
    };
    contractDetails?: {
      contractId: string;
      contractType: string;
      contractStartDate: Date;
      contractEndDate?: Date;
      exclusivityClause: boolean;
      minimumCommitment?: number;
    };
  };
  
  // Commission structure and calculation
  commissionStructure: {
    calculationType: 'percentage' | 'fixed_amount' | 'tiered' | 'performance_based' | 'hybrid';
    baseAmount: number; // Amount on which commission is calculated
    
    // For percentage-based
    commissionPercentage?: number;
    
    // For fixed amount
    fixedAmount?: number;
    
    // For tiered commission
    tiers?: [{
      tierLevel: number;
      threshold: number; // Minimum booking value/volume
      commissionRate: number;
      isActive: boolean;
    }];
    
    // For performance-based
    performanceMetrics?: [{
      metricType: 'booking_volume' | 'revenue_target' | 'customer_satisfaction' | 'repeat_bookings';
      targetValue: number;
      achievedValue?: number;
      bonusPercentage: number;
      penaltyPercentage?: number;
    }];
    
    // Additional modifiers
    modifiers: {
      seasonalBonus?: number; // Additional percentage for peak season
      volumeBonus?: number; // Bonus for high volume
      qualityBonus?: number; // Bonus for quality metrics
      earlyPaymentDiscount?: number; // Discount for early payment
      latePaymentPenalty?: number; // Penalty for late payment
    };
  };
  
  // Commission calculation details
  calculation: {
    grossCommission: number;
    adjustments: [{
      adjustmentType: 'bonus' | 'penalty' | 'discount' | 'fee' | 'tax_deduction' | 'advance_deduction';
      adjustmentAmount: number;
      adjustmentPercentage?: number;
      adjustmentReason: string;
      appliedBy: mongoose.Types.ObjectId;
      appliedAt: Date;
    }];
    netCommission: number;
    currency: string;
    exchangeRate?: number; // If different from base currency
    baseCurrencyAmount?: number;
  };
  
  // Tax and compliance
  taxDetails: {
    taxApplicable: boolean;
    taxType: 'TDS' | 'GST' | 'VAT' | 'withholding_tax' | 'other';
    taxPercentage: number;
    taxAmount: number;
    taxAfterCommission: number; // Final amount after tax deduction
    taxCertificate?: {
      certificateNumber: string;
      issueDate: Date;
      validUntil: Date;
      documentUrl?: string;
    };
    exemptionDetails?: {
      isExempt: boolean;
      exemptionReason: string;
      exemptionCertificate?: string;
    };
  };
  
  // Commission periods and timing
  timing: {
    earnedDate: Date; // When commission was earned
    eligibilityDate: Date; // When commission becomes eligible for payment
    dueDate: Date; // When commission payment is due
    paymentDate?: Date; // When commission was actually paid
    
    // Period details
    commissionPeriod: {
      periodType: 'immediate' | 'monthly' | 'quarterly' | 'annual' | 'custom';
      periodStart: Date;
      periodEnd: Date;
      periodDescription?: string;
    };
    
    // Holdback and release
    holdback?: {
      holdbackAmount: number;
      holdbackPercentage: number;
      holdbackReason: string;
      releaseDate: Date;
      released: boolean;
      releasedAmount?: number;
    };
  };
  
  // Status and workflow
  status: {
    current: 'pending' | 'calculated' | 'approved' | 'paid' | 'disputed' | 'cancelled' | 'on_hold' | 'partially_paid';
    history: [{
      status: string;
      timestamp: Date;
      changedBy: mongoose.Types.ObjectId;
      reason?: string;
      notes?: string;
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
  
  // Payment information
  payment: {
    paymentMethod: 'bank_transfer' | 'check' | 'cash' | 'digital_wallet' | 'adjustment' | 'offset';
    paymentDetails: {
      // For bank transfer
      bankDetails?: {
        accountHolderName: string;
        bankName: string;
        accountNumber: string;
        routingNumber?: string;
        ifscCode?: string;
        swiftCode?: string;
        branchCode?: string;
      };
      
      // For digital payments
      digitalWallet?: {
        walletProvider: string;
        walletId: string;
        walletPhone?: string;
      };
      
      // Payment reference
      paymentReference?: string;
      transactionId?: string;
      checkNumber?: string;
    };
    
    paymentSchedule: [{
      installmentNumber: number;
      dueDate: Date;
      amount: number;
      paidDate?: Date;
      paidAmount?: number;
      status: 'pending' | 'paid' | 'overdue' | 'cancelled';
    }];
    
    totalPaid: number;
    balanceAmount: number;
  };
  
  // Related booking and performance data
  bookingDetails: {
    bookingReference: string;
    bookingDate: Date;
    checkInDate: Date;
    checkOutDate: Date;
    totalBookingValue: number;
    netBookingValue: number; // After discounts
    guestCount: number;
    roomNights: number;
    
    // Channel information
    bookingChannel: string;
    channelCommission?: number; // If booked through channel
    sourceCode?: string;
    campaignCode?: string;
  };
  
  // Performance tracking
  performance: {
    metrics: {
      bookingConversionRate?: number;
      averageBookingValue?: number;
      customerSatisfactionScore?: number;
      repeatCustomerRate?: number;
      cancellationRate?: number;
      noShowRate?: number;
    };
    
    // Year-to-date performance
    ytdPerformance: {
      totalBookings: number;
      totalRevenue: number;
      totalCommission: number;
      averageCommissionRate: number;
    };
    
    // Targets and achievements
    targets?: {
      monthlyTarget: number;
      quarterlyTarget: number;
      annualTarget: number;
      currentAchievement: number;
      achievementPercentage: number;
    };
  };
  
  // Dispute and resolution
  disputes: [{
    disputeId: string;
    disputeType: 'calculation_error' | 'payment_delay' | 'rate_dispute' | 'terms_violation' | 'other';
    disputeAmount: number;
    disputeReason: string;
    disputeDate: Date;
    disputeStatus: 'open' | 'investigating' | 'resolved' | 'escalated' | 'closed';
    
    resolution?: {
      resolutionDate: Date;
      resolutionType: 'adjustment' | 'payment' | 'policy_change' | 'dismissed';
      resolutionAmount?: number;
      resolutionNotes: string;
      resolvedBy: mongoose.Types.ObjectId;
    };
    
    communications: [{
      direction: 'inbound' | 'outbound';
      message: string;
      sentBy: mongoose.Types.ObjectId;
      sentAt: Date;
      medium: 'email' | 'phone' | 'chat' | 'in_person';
    }];
  }];
  
  // Clawback and recovery
  clawback?: {
    clawbackRequired: boolean;
    clawbackReason: string;
    clawbackAmount: number;
    clawbackDate: Date;
    
    triggers: [{
      triggerType: 'cancellation' | 'refund' | 'chargeback' | 'fraud' | 'policy_violation';
      triggerDate: Date;
      triggerAmount: number;
      triggerReference: string;
    }];
    
    recovery: {
      recoveryMethod: 'deduction' | 'invoice' | 'offset' | 'legal_action';
      recoveryStatus: 'pending' | 'in_progress' | 'recovered' | 'written_off';
      recoveredAmount?: number;
      recoveryDate?: Date;
      recoveryNotes?: string;
    };
  };
  
  // Multi-currency support
  multiCurrency?: {
    originalCurrency: string;
    commissionCurrency: string;
    exchangeRate: number;
    conversionDate: Date;
    conversionFees: number;
    hedging?: {
      hedged: boolean;
      hedgingRate: number;
      hedgingExpiry: Date;
    };
  };
  
  // Analytics and reporting
  analytics: {
    profitability: {
      grossProfit: number;
      netProfit: number;
      profitMargin: number;
      roi: number; // Return on investment
    };
    
    efficiency: {
      costPerAcquisition: number;
      customerLifetimeValue: number;
      paybackPeriod: number; // in months
    };
    
    trends: {
      monthOverMonth: number; // percentage change
      yearOverYear: number; // percentage change
      seasonalTrend: string;
    };
    
    benchmarking: {
      industryAverage: number;
      competitorRates: number;
      performanceRating: 'below_average' | 'average' | 'above_average' | 'excellent';
    };
  };
  
  // Compliance and audit
  compliance: {
    auditTrail: [{
      action: string;
      performedBy: mongoose.Types.ObjectId;
      performedAt: Date;
      oldValues?: mongoose.Schema.Types.Mixed;
      newValues?: mongoose.Schema.Types.Mixed;
      ipAddress: string;
      reason?: string;
    }];
    
    regulatoryCompliance: {
      antiMoneyLaundering: boolean;
      knowYourCustomer: boolean;
      taxCompliance: boolean;
      dataProtection: boolean;
      complianceScore: number; // 0-100
    };
    
    documentation: {
      contractSigned: boolean;
      taxFormsCollected: boolean;
      bankDetailsVerified: boolean;
      identityVerified: boolean;
      complianceChecks: [{
        checkType: string;
        checkDate: Date;
        checkResult: 'pass' | 'fail' | 'pending';
        checkNotes?: string;
      }];
    };
  };
  
  // Integration data
  integrations: {
    accountingSystem?: {
      entryId: string;
      accountCode: string;
      syncStatus: 'pending' | 'synced' | 'failed';
      lastSyncAt?: Date;
      syncErrors?: string[];
    };
    
    payrollSystem?: {
      payrollId: string;
      payrollPeriod: string;
      included: boolean;
    };
    
    crmSystem?: {
      contactId: string;
      opportunityId?: string;
      lastActivity?: Date;
    };
    
    externalSystems: [{
      systemName: string;
      referenceId: string;
      syncRequired: boolean;
      lastSync?: Date;
    }];
  };
  
  // Communication and notifications
  communications: {
    notifications: [{
      type: 'commission_calculated' | 'commission_approved' | 'commission_paid' | 'commission_disputed' | 'payment_reminder';
      channel: 'email' | 'sms' | 'push' | 'phone' | 'portal';
      sentAt: Date;
      deliveryStatus: 'sent' | 'delivered' | 'read' | 'failed';
      template: string;
      recipient: string;
    }];
    
    statements: [{
      statementId: string;
      statementPeriod: string;
      generatedAt: Date;
      sentAt?: Date;
      documentUrl?: string;
      includesCommissions: string[]; // Array of commission IDs
    }];
  };
  
  // Special arrangements
  specialArrangements?: {
    customTerms: string[];
    exceptions: [{
      exceptionType: string;
      exceptionReason: string;
      approvedBy: mongoose.Types.ObjectId;
      approvalDate: Date;
      conditions?: string[];
    }];
    
    incentives: [{
      incentiveType: 'volume_bonus' | 'quality_bonus' | 'loyalty_bonus' | 'milestone_bonus';
      incentiveAmount: number;
      incentiveCondition: string;
      achieved: boolean;
      achievedDate?: Date;
    }];
  };
  
  // System fields
  isActive: boolean;
  isRecurring: boolean;
  parentCommissionId?: mongoose.Types.ObjectId; // For recurring commissions
  childCommissions?: mongoose.Types.ObjectId[]; // For split commissions
  
  // Audit fields
  calculatedBy: mongoose.Types.ObjectId;
  approvedBy?: mongoose.Types.ObjectId;
  paidBy?: mongoose.Types.ObjectId;
  createdBy: mongoose.Types.ObjectId;
  lastModifiedBy: mongoose.Types.ObjectId;
  
  createdAt: Date;
  updatedAt: Date;
}

const CommissionSchema = new Schema<ICommission>({
  commissionNumber: { 
    type: String, 
    required: true, 
    unique: true 
  },
  commissionReference: { 
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
    ref: 'EnhancedPayment' 
  },
  
  recipient: {
    recipientType: { 
      type: String, 
      enum: ['travel_agent', 'influencer', 'affiliate', 'sales_agent', 'channel_partner', 'referral', 'employee', 'corporate'],
      required: true 
    },
    recipientId: { 
      type: Schema.Types.ObjectId, 
      required: true,
      refPath: 'recipient.recipientType' 
    },
    recipientDetails: {
      name: { type: String, required: true },
      email: { type: String, required: true },
      phone: { type: String },
      companyName: { type: String },
      licenseNumber: { type: String },
      taxId: { type: String },
      registrationNumber: { type: String }
    },
    contractDetails: {
      contractId: { type: String },
      contractType: { type: String },
      contractStartDate: { type: Date },
      contractEndDate: { type: Date },
      exclusivityClause: { type: Boolean, default: false },
      minimumCommitment: { type: Number, min: 0 }
    }
  },
  
  commissionStructure: {
    calculationType: { 
      type: String, 
      enum: ['percentage', 'fixed_amount', 'tiered', 'performance_based', 'hybrid'],
      required: true 
    },
    baseAmount: { type: Number, required: true, min: 0 },
    commissionPercentage: { type: Number, min: 0, max: 100 },
    fixedAmount: { type: Number, min: 0 },
    tiers: [{
      tierLevel: { type: Number, required: true, min: 1 },
      threshold: { type: Number, required: true, min: 0 },
      commissionRate: { type: Number, required: true, min: 0 },
      isActive: { type: Boolean, default: true }
    }],
    performanceMetrics: [{
      metricType: { 
        type: String, 
        enum: ['booking_volume', 'revenue_target', 'customer_satisfaction', 'repeat_bookings'],
        required: true 
      },
      targetValue: { type: Number, required: true, min: 0 },
      achievedValue: { type: Number, min: 0 },
      bonusPercentage: { type: Number, required: true, min: 0 },
      penaltyPercentage: { type: Number, min: 0 }
    }],
    modifiers: {
      seasonalBonus: { type: Number, min: 0 },
      volumeBonus: { type: Number, min: 0 },
      qualityBonus: { type: Number, min: 0 },
      earlyPaymentDiscount: { type: Number, min: 0 },
      latePaymentPenalty: { type: Number, min: 0 }
    }
  },
  
  calculation: {
    grossCommission: { type: Number, required: true, min: 0 },
    adjustments: [{
      adjustmentType: { 
        type: String, 
        enum: ['bonus', 'penalty', 'discount', 'fee', 'tax_deduction', 'advance_deduction'],
        required: true 
      },
      adjustmentAmount: { type: Number, required: true },
      adjustmentPercentage: { type: Number, min: 0, max: 100 },
      adjustmentReason: { type: String, required: true },
      appliedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
      appliedAt: { type: Date, default: Date.now }
    }],
    netCommission: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'INR' },
    exchangeRate: { type: Number, min: 0 },
    baseCurrencyAmount: { type: Number, min: 0 }
  },
  
  taxDetails: {
    taxApplicable: { type: Boolean, required: true },
    taxType: { 
      type: String, 
      enum: ['TDS', 'GST', 'VAT', 'withholding_tax', 'other'],
      required: function(this: any) { return this.taxDetails?.taxApplicable; }
    },
    taxPercentage: { type: Number, default: 0, min: 0, max: 100 },
    taxAmount: { type: Number, default: 0, min: 0 },
    taxAfterCommission: { type: Number, required: true, min: 0 },
    taxCertificate: {
      certificateNumber: { type: String },
      issueDate: { type: Date },
      validUntil: { type: Date },
      documentUrl: { type: String }
    },
    exemptionDetails: {
      isExempt: { type: Boolean, default: false },
      exemptionReason: { type: String },
      exemptionCertificate: { type: String }
    }
  },
  
  timing: {
    earnedDate: { type: Date, required: true },
    eligibilityDate: { type: Date, required: true },
    dueDate: { type: Date, required: true },
    paymentDate: { type: Date },
    commissionPeriod: {
      periodType: { 
        type: String, 
        enum: ['immediate', 'monthly', 'quarterly', 'annual', 'custom'],
        default: 'monthly' 
      },
      periodStart: { type: Date, required: true },
      periodEnd: { type: Date, required: true },
      periodDescription: { type: String }
    },
    holdback: {
      holdbackAmount: { type: Number, min: 0 },
      holdbackPercentage: { type: Number, min: 0, max: 100 },
      holdbackReason: { type: String },
      releaseDate: { type: Date },
      released: { type: Boolean, default: false },
      releasedAmount: { type: Number, min: 0 }
    }
  },
  
  status: {
    current: { 
      type: String, 
      enum: ['pending', 'calculated', 'approved', 'paid', 'disputed', 'cancelled', 'on_hold', 'partially_paid'],
      default: 'pending' 
    },
    history: [{
      status: { type: String, required: true },
      timestamp: { type: Date, default: Date.now },
      changedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
      reason: { type: String },
      notes: { type: String }
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
  
  payment: {
    paymentMethod: { 
      type: String, 
      enum: ['bank_transfer', 'check', 'cash', 'digital_wallet', 'adjustment', 'offset'],
      required: true 
    },
    paymentDetails: {
      bankDetails: {
        accountHolderName: { type: String },
        bankName: { type: String },
        accountNumber: { type: String },
        routingNumber: { type: String },
        ifscCode: { type: String },
        swiftCode: { type: String },
        branchCode: { type: String }
      },
      digitalWallet: {
        walletProvider: { type: String },
        walletId: { type: String },
        walletPhone: { type: String }
      },
      paymentReference: { type: String },
      transactionId: { type: String },
      checkNumber: { type: String }
    },
    paymentSchedule: [{
      installmentNumber: { type: Number, required: true, min: 1 },
      dueDate: { type: Date, required: true },
      amount: { type: Number, required: true, min: 0 },
      paidDate: { type: Date },
      paidAmount: { type: Number, min: 0 },
      status: { 
        type: String, 
        enum: ['pending', 'paid', 'overdue', 'cancelled'],
        default: 'pending' 
      }
    }],
    totalPaid: { type: Number, default: 0, min: 0 },
    balanceAmount: { type: Number, default: 0 }
  },
  
  bookingDetails: {
    bookingReference: { type: String, required: true },
    bookingDate: { type: Date, required: true },
    checkInDate: { type: Date, required: true },
    checkOutDate: { type: Date, required: true },
    totalBookingValue: { type: Number, required: true, min: 0 },
    netBookingValue: { type: Number, required: true, min: 0 },
    guestCount: { type: Number, required: true, min: 1 },
    roomNights: { type: Number, required: true, min: 1 },
    bookingChannel: { type: String, required: true },
    channelCommission: { type: Number, min: 0 },
    sourceCode: { type: String },
    campaignCode: { type: String }
  },
  
  performance: {
    metrics: {
      bookingConversionRate: { type: Number, min: 0, max: 100 },
      averageBookingValue: { type: Number, min: 0 },
      customerSatisfactionScore: { type: Number, min: 0, max: 10 },
      repeatCustomerRate: { type: Number, min: 0, max: 100 },
      cancellationRate: { type: Number, min: 0, max: 100 },
      noShowRate: { type: Number, min: 0, max: 100 }
    },
    ytdPerformance: {
      totalBookings: { type: Number, default: 0, min: 0 },
      totalRevenue: { type: Number, default: 0, min: 0 },
      totalCommission: { type: Number, default: 0, min: 0 },
      averageCommissionRate: { type: Number, default: 0, min: 0 }
    },
    targets: {
      monthlyTarget: { type: Number, min: 0 },
      quarterlyTarget: { type: Number, min: 0 },
      annualTarget: { type: Number, min: 0 },
      currentAchievement: { type: Number, default: 0, min: 0 },
      achievementPercentage: { type: Number, default: 0, min: 0 }
    }
  },
  
  disputes: [{
    disputeId: { type: String, required: true },
    disputeType: { 
      type: String, 
      enum: ['calculation_error', 'payment_delay', 'rate_dispute', 'terms_violation', 'other'],
      required: true 
    },
    disputeAmount: { type: Number, required: true, min: 0 },
    disputeReason: { type: String, required: true },
    disputeDate: { type: Date, required: true },
    disputeStatus: { 
      type: String, 
      enum: ['open', 'investigating', 'resolved', 'escalated', 'closed'],
      default: 'open' 
    },
    resolution: {
      resolutionDate: { type: Date },
      resolutionType: { type: String, enum: ['adjustment', 'payment', 'policy_change', 'dismissed'] },
      resolutionAmount: { type: Number, min: 0 },
      resolutionNotes: { type: String },
      resolvedBy: { type: Schema.Types.ObjectId, ref: 'User' }
    },
    communications: [{
      direction: { type: String, enum: ['inbound', 'outbound'], required: true },
      message: { type: String, required: true },
      sentBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
      sentAt: { type: Date, default: Date.now },
      medium: { type: String, enum: ['email', 'phone', 'chat', 'in_person'], required: true }
    }]
  }],
  
  clawback: {
    clawbackRequired: { type: Boolean, default: false },
    clawbackReason: { type: String },
    clawbackAmount: { type: Number, min: 0 },
    clawbackDate: { type: Date },
    triggers: [{
      triggerType: { 
        type: String, 
        enum: ['cancellation', 'refund', 'chargeback', 'fraud', 'policy_violation'],
        required: true 
      },
      triggerDate: { type: Date, required: true },
      triggerAmount: { type: Number, required: true, min: 0 },
      triggerReference: { type: String, required: true }
    }],
    recovery: {
      recoveryMethod: { 
        type: String, 
        enum: ['deduction', 'invoice', 'offset', 'legal_action'],
        default: 'deduction' 
      },
      recoveryStatus: { 
        type: String, 
        enum: ['pending', 'in_progress', 'recovered', 'written_off'],
        default: 'pending' 
      },
      recoveredAmount: { type: Number, min: 0 },
      recoveryDate: { type: Date },
      recoveryNotes: { type: String }
    }
  },
  
  multiCurrency: {
    originalCurrency: { type: String },
    commissionCurrency: { type: String },
    exchangeRate: { type: Number, min: 0 },
    conversionDate: { type: Date },
    conversionFees: { type: Number, default: 0, min: 0 },
    hedging: {
      hedged: { type: Boolean, default: false },
      hedgingRate: { type: Number, min: 0 },
      hedgingExpiry: { type: Date }
    }
  },
  
  analytics: {
    profitability: {
      grossProfit: { type: Number, default: 0 },
      netProfit: { type: Number, default: 0 },
      profitMargin: { type: Number, default: 0 },
      roi: { type: Number, default: 0 }
    },
    efficiency: {
      costPerAcquisition: { type: Number, default: 0, min: 0 },
      customerLifetimeValue: { type: Number, default: 0, min: 0 },
      paybackPeriod: { type: Number, default: 0, min: 0 }
    },
    trends: {
      monthOverMonth: { type: Number, default: 0 },
      yearOverYear: { type: Number, default: 0 },
      seasonalTrend: { type: String, default: 'stable' }
    },
    benchmarking: {
      industryAverage: { type: Number, default: 0, min: 0 },
      competitorRates: { type: Number, default: 0, min: 0 },
      performanceRating: { 
        type: String, 
        enum: ['below_average', 'average', 'above_average', 'excellent'],
        default: 'average' 
      }
    }
  },
  
  compliance: {
    auditTrail: [{
      action: { type: String, required: true },
      performedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
      performedAt: { type: Date, default: Date.now },
      oldValues: { type: Schema.Types.Mixed },
      newValues: { type: Schema.Types.Mixed },
      ipAddress: { type: String, required: true },
      reason: { type: String }
    }],
    regulatoryCompliance: {
      antiMoneyLaundering: { type: Boolean, default: true },
      knowYourCustomer: { type: Boolean, default: true },
      taxCompliance: { type: Boolean, default: true },
      dataProtection: { type: Boolean, default: true },
      complianceScore: { type: Number, default: 100, min: 0, max: 100 }
    },
    documentation: {
      contractSigned: { type: Boolean, default: false },
      taxFormsCollected: { type: Boolean, default: false },
      bankDetailsVerified: { type: Boolean, default: false },
      identityVerified: { type: Boolean, default: false },
      complianceChecks: [{
        checkType: { type: String, required: true },
        checkDate: { type: Date, required: true },
        checkResult: { type: String, enum: ['pass', 'fail', 'pending'], required: true },
        checkNotes: { type: String }
      }]
    }
  },
  
  integrations: {
    accountingSystem: {
      entryId: { type: String },
      accountCode: { type: String },
      syncStatus: { type: String, enum: ['pending', 'synced', 'failed'], default: 'pending' },
      lastSyncAt: { type: Date },
      syncErrors: [{ type: String }]
    },
    payrollSystem: {
      payrollId: { type: String },
      payrollPeriod: { type: String },
      included: { type: Boolean, default: false }
    },
    crmSystem: {
      contactId: { type: String },
      opportunityId: { type: String },
      lastActivity: { type: Date }
    },
    externalSystems: [{
      systemName: { type: String, required: true },
      referenceId: { type: String, required: true },
      syncRequired: { type: Boolean, default: false },
      lastSync: { type: Date }
    }]
  },
  
  communications: {
    notifications: [{
      type: { 
        type: String, 
        enum: ['commission_calculated', 'commission_approved', 'commission_paid', 'commission_disputed', 'payment_reminder'],
        required: true 
      },
      channel: { 
        type: String, 
        enum: ['email', 'sms', 'push', 'phone', 'portal'],
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
    statements: [{
      statementId: { type: String, required: true },
      statementPeriod: { type: String, required: true },
      generatedAt: { type: Date, default: Date.now },
      sentAt: { type: Date },
      documentUrl: { type: String },
      includesCommissions: [{ type: String }]
    }]
  },
  
  specialArrangements: {
    customTerms: [{ type: String }],
    exceptions: [{
      exceptionType: { type: String, required: true },
      exceptionReason: { type: String, required: true },
      approvedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
      approvalDate: { type: Date, required: true },
      conditions: [{ type: String }]
    }],
    incentives: [{
      incentiveType: { 
        type: String, 
        enum: ['volume_bonus', 'quality_bonus', 'loyalty_bonus', 'milestone_bonus'],
        required: true 
      },
      incentiveAmount: { type: Number, required: true, min: 0 },
      incentiveCondition: { type: String, required: true },
      achieved: { type: Boolean, default: false },
      achievedDate: { type: Date }
    }]
  },
  
  isActive: { type: Boolean, default: true },
  isRecurring: { type: Boolean, default: false },
  parentCommissionId: { type: Schema.Types.ObjectId, ref: 'Commission' },
  childCommissions: [{ type: Schema.Types.ObjectId, ref: 'Commission' }],
  
  calculatedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  approvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  paidBy: { type: Schema.Types.ObjectId, ref: 'User' },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  lastModifiedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
CommissionSchema.index({ commissionNumber: 1 });
CommissionSchema.index({ propertyId: 1 });
CommissionSchema.index({ bookingId: 1 });
CommissionSchema.index({ 'recipient.recipientId': 1 });
CommissionSchema.index({ 'status.current': 1 });
CommissionSchema.index({ 'timing.dueDate': 1 });

// Compound indexes
CommissionSchema.index({ propertyId: 1, 'status.current': 1 });
CommissionSchema.index({ 'recipient.recipientId': 1, 'timing.earnedDate': -1 });
CommissionSchema.index({ 'timing.dueDate': 1, 'status.current': 1 });

// Text search
CommissionSchema.index({ 
  commissionNumber: 'text',
  'recipient.recipientDetails.name': 'text',
  'bookingDetails.bookingReference': 'text'
});

// Pre-save middleware
CommissionSchema.pre('save', function(next) {
  // Calculate net commission after adjustments
  let netCommission = this.calculation.grossCommission;
  
  this.calculation.adjustments.forEach((adj: any) => {
    if (adj.adjustmentType === 'bonus') {
      netCommission += adj.adjustmentAmount;
    } else {
      netCommission -= adj.adjustmentAmount;
    }
  });
  
  this.calculation.netCommission = netCommission;
  
  // Calculate tax after commission
  this.taxDetails.taxAfterCommission = this.calculation.netCommission - this.taxDetails.taxAmount;
  
  // Calculate balance amount
  this.payment.balanceAmount = this.calculation.netCommission - this.payment.totalPaid;
  
  // Update achievement percentage
  if (this.performance.targets?.monthlyTarget) {
    this.performance.targets.achievementPercentage = 
      (this.performance.targets.currentAchievement / this.performance.targets.monthlyTarget) * 100;
  }
  
  next();
});

// Generate unique commission number
CommissionSchema.statics.generateCommissionNumber = async function() {
  const prefix = 'COM';
  const year = new Date().getFullYear().toString().slice(-2);
  const month = String(new Date().getMonth() + 1).padStart(2, '0');
  const randomString = Math.random().toString(36).substring(2, 8).toUpperCase();
  
  let commissionNumber = `${prefix}${year}${month}${randomString}`;
  
  // Ensure uniqueness
  let existing = await this.findOne({ commissionNumber });
  while (existing) {
    const newRandomString = Math.random().toString(36).substring(2, 8).toUpperCase();
    commissionNumber = `${prefix}${year}${month}${newRandomString}`;
    existing = await this.findOne({ commissionNumber });
  }
  
  return commissionNumber;
};

// Virtual for days until due
CommissionSchema.virtual('daysUntilDue').get(function() {
  if (this.timing.dueDate && this.status.current !== 'paid') {
    const today = new Date();
    const dueDate = new Date(this.timing.dueDate);
    return Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  }
  return 0;
});

// Virtual for effective commission rate
CommissionSchema.virtual('effectiveCommissionRate').get(function() {
  if (this.commissionStructure.baseAmount > 0) {
    return (this.calculation.netCommission / this.commissionStructure.baseAmount) * 100;
  }
  return 0;
});

// Methods
CommissionSchema.methods.calculateCommission = function() {
  let commission = 0;
  
  switch (this.commissionStructure.calculationType) {
    case 'percentage':
      commission = (this.commissionStructure.baseAmount * this.commissionStructure.commissionPercentage) / 100;
      break;
    case 'fixed_amount':
      commission = this.commissionStructure.fixedAmount || 0;
      break;
    case 'tiered':
      // Find applicable tier
      const applicableTier = this.commissionStructure.tiers?.find((tier: any) => 
        this.commissionStructure.baseAmount >= tier.threshold && tier.isActive
      );
      if (applicableTier) {
        commission = (this.commissionStructure.baseAmount * applicableTier.commissionRate) / 100;
      }
      break;
  }
  
  this.calculation.grossCommission = commission;
  return this.save();
};

CommissionSchema.methods.addPayment = function(paymentAmount: number, paidBy: string, paymentReference?: string) {
  this.payment.totalPaid += paymentAmount;
  this.payment.balanceAmount = this.calculation.netCommission - this.payment.totalPaid;
  
  if (this.payment.balanceAmount <= 0) {
    this.status.current = 'paid';
    this.timing.paymentDate = new Date();
    this.paidBy = paidBy;
  } else {
    this.status.current = 'partially_paid';
  }
  
  if (paymentReference) {
    this.payment.paymentDetails.paymentReference = paymentReference;
  }
  
  return this.save();
};

CommissionSchema.methods.addDispute = function(disputeData: any) {
  this.disputes.push(disputeData);
  this.status.current = 'disputed';
  return this.save();
};

// Static methods
CommissionSchema.statics.getCommissionsByRecipient = function(recipientId: string, status?: string) {
  const filter: any = { 'recipient.recipientId': recipientId };
  if (status) {
    filter['status.current'] = status;
  }
  return this.find(filter).sort({ 'timing.earnedDate': -1 });
};

CommissionSchema.statics.getDueCommissions = function(propertyId?: string) {
  const filter: any = {
    'timing.dueDate': { $lte: new Date() },
    'status.current': { $in: ['calculated', 'approved'] }
  };
  
  if (propertyId) {
    filter.propertyId = propertyId;
  }
  
  return this.find(filter).sort({ 'timing.dueDate': 1 });
};

CommissionSchema.statics.getCommissionSummary = function(recipientId: string, startDate: Date, endDate: Date) {
  return this.aggregate([
    {
      $match: {
        'recipient.recipientId': new mongoose.Types.ObjectId(recipientId),
        'timing.earnedDate': { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: null,
        totalCommissions: { $sum: 1 },
        totalAmount: { $sum: '$calculation.netCommission' },
        totalPaid: { $sum: '$payment.totalPaid' },
        totalPending: { $sum: '$payment.balanceAmount' },
        averageCommissionRate: { $avg: '$effectiveCommissionRate' }
      }
    }
  ]);
};

export default mongoose.models.Commission || mongoose.model<ICommission>('Commission', CommissionSchema);