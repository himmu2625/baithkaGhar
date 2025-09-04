import { Schema, model, models } from 'mongoose';

const EventInvoiceSchema = new Schema({
  propertyId: {
    type: String,
    required: true,
    ref: 'Property'
  },
  
  invoiceNumber: {
    type: String,
    required: true,
    unique: true
  },
  
  eventBookingId: {
    type: Schema.Types.ObjectId,
    ref: 'EventBooking',
    required: true
  },
  
  invoiceType: {
    type: String,
    enum: ['proforma', 'advance_payment', 'interim', 'final', 'credit_note', 'debit_note'],
    default: 'final'
  },
  
  client: {
    type: {
      type: String,
      enum: ['individual', 'corporate', 'government'],
      required: true
    },
    
    billingInfo: {
      name: {
        type: String,
        required: true
      },
      companyName: String,
      address: {
        street: String,
        city: String,
        state: String,
        zipCode: String,
        country: { type: String, default: 'India' }
      },
      
      taxInfo: {
        gstNumber: String,
        panNumber: String,
        tanNumber: String,
        taxRegistrationType: {
          type: String,
          enum: ['registered', 'unregistered', 'composition', 'exempt']
        },
        placeOfSupply: String
      },
      
      contactDetails: {
        email: String,
        phone: String,
        contactPerson: String
      }
    }
  },
  
  eventDetails: {
    eventName: String,
    eventDate: Date,
    eventVenue: String,
    guestCount: Number,
    eventDuration: Number, // hours
    eventType: String
  },
  
  invoiceDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  
  dueDate: {
    type: Date,
    required: true
  },
  
  lineItems: [{
    itemId: String,
    description: {
      type: String,
      required: true
    },
    category: {
      type: String,
      enum: ['venue', 'catering', 'decoration', 'audio_visual', 'photography', 'entertainment', 'accommodation', 'transportation', 'equipment', 'service', 'other'],
      required: true
    },
    
    quantity: {
      type: Number,
      required: true,
      min: 0
    },
    unit: String, // 'guests', 'hours', 'days', 'pieces', 'service'
    
    pricing: {
      unitPrice: {
        type: Number,
        required: true,
        min: 0
      },
      lineTotal: {
        type: Number,
        required: true,
        min: 0
      },
      discount: {
        type: Number,
        default: 0
      },
      discountType: {
        type: String,
        enum: ['percentage', 'fixed_amount'],
        default: 'percentage'
      },
      netAmount: {
        type: Number,
        required: true
      }
    },
    
    taxDetails: {
      taxable: { type: Boolean, default: true },
      taxRate: { type: Number, default: 0 },
      cgst: { type: Number, default: 0 },
      sgst: { type: Number, default: 0 },
      igst: { type: Number, default: 0 },
      cess: { type: Number, default: 0 },
      totalTax: { type: Number, default: 0 }
    },
    
    serviceDetails: {
      serviceDate: Date,
      serviceLocation: String,
      serviceProvider: String,
      notes: String
    }
  }],
  
  financialSummary: {
    subtotal: {
      type: Number,
      required: true,
      min: 0
    },
    
    discounts: [{
      description: String,
      type: {
        type: String,
        enum: ['early_bird', 'bulk', 'loyalty', 'promotional', 'negotiated', 'other']
      },
      amount: Number,
      percentage: Number,
      appliedTo: String // 'subtotal', 'specific_items'
    }],
    
    totalDiscount: { type: Number, default: 0 },
    discountedAmount: { type: Number, required: true },
    
    taxes: {
      cgst: {
        rate: Number,
        amount: { type: Number, default: 0 }
      },
      sgst: {
        rate: Number,
        amount: { type: Number, default: 0 }
      },
      igst: {
        rate: Number,
        amount: { type: Number, default: 0 }
      },
      cess: {
        rate: Number,
        amount: { type: Number, default: 0 }
      },
      totalTaxAmount: { type: Number, default: 0 }
    },
    
    additionalCharges: [{
      description: String,
      type: {
        type: String,
        enum: ['service_charge', 'delivery_charge', 'setup_fee', 'overtime_charge', 'damage_charge', 'other']
      },
      amount: Number,
      taxable: { type: Boolean, default: false }
    }],
    
    totalAdditionalCharges: { type: Number, default: 0 },
    
    roundingAdjustment: { type: Number, default: 0 },
    
    grandTotal: {
      type: Number,
      required: true,
      min: 0
    },
    
    currency: { type: String, default: 'INR' }
  },
  
  paymentDetails: {
    paymentTerms: {
      type: String,
      enum: ['immediate', 'net_15', 'net_30', 'advance_50_balance_on_event', 'custom'],
      default: 'net_15'
    },
    
    customPaymentTerms: String,
    
    paymentMethods: [{
      type: String,
      enum: ['cash', 'cheque', 'bank_transfer', 'credit_card', 'debit_card', 'upi', 'online_payment']
    }],
    
    bankDetails: {
      bankName: String,
      accountNumber: String,
      ifscCode: String,
      accountHolderName: String,
      branchAddress: String
    },
    
    paymentSchedule: [{
      milestone: String,
      dueDate: Date,
      amount: Number,
      percentage: Number,
      description: String,
      status: {
        type: String,
        enum: ['pending', 'paid', 'overdue', 'waived'],
        default: 'pending'
      }
    }]
  },
  
  status: {
    type: String,
    enum: ['draft', 'sent', 'viewed', 'paid', 'partially_paid', 'overdue', 'cancelled', 'refunded'],
    default: 'draft'
  },
  
  paymentHistory: [{
    transactionId: String,
    paymentDate: Date,
    amount: Number,
    paymentMethod: String,
    reference: String,
    status: {
      type: String,
      enum: ['successful', 'failed', 'pending', 'refunded'],
      default: 'successful'
    },
    notes: String,
    recordedBy: {
      type: Schema.Types.ObjectId,
      ref: 'StaffMember'
    }
  }],
  
  paidAmount: { type: Number, default: 0 },
  balanceAmount: { type: Number, default: 0 },
  
  reminders: [{
    reminderDate: Date,
    type: {
      type: String,
      enum: ['payment_due', 'overdue_notice', 'final_notice', 'custom']
    },
    method: {
      type: String,
      enum: ['email', 'sms', 'phone', 'whatsapp', 'postal']
    },
    sentBy: {
      type: Schema.Types.ObjectId,
      ref: 'StaffMember'
    },
    status: {
      type: String,
      enum: ['sent', 'delivered', 'opened', 'responded'],
      default: 'sent'
    },
    response: String
  }],
  
  adjustments: [{
    adjustmentDate: Date,
    type: {
      type: String,
      enum: ['credit_note', 'debit_note', 'discount', 'penalty', 'refund'],
      required: true
    },
    amount: Number,
    reason: String,
    description: String,
    approvedBy: {
      type: Schema.Types.ObjectId,
      ref: 'StaffMember'
    },
    referenceDocument: String
  }],
  
  compliance: {
    gstCompliant: { type: Boolean, default: true },
    einvoice: {
      required: { type: Boolean, default: false },
      generated: { type: Boolean, default: false },
      irn: String,
      acknowledgmentNumber: String,
      acknowledgmentDate: Date,
      qrCode: String
    },
    
    tds: {
      applicable: { type: Boolean, default: false },
      rate: Number,
      amount: Number,
      section: String,
      certificate: String
    },
    
    reverseCharge: { type: Boolean, default: false },
    placeOfSupply: String,
    
    digitalSignature: {
      signed: { type: Boolean, default: false },
      signedBy: String,
      signedAt: Date,
      certificate: String
    }
  },
  
  documents: [{
    documentType: {
      type: String,
      enum: ['invoice_pdf', 'proforma_invoice', 'tax_invoice', 'credit_note', 'debit_note', 'payment_receipt', 'quotation'],
      required: true
    },
    documentName: String,
    url: String,
    generatedDate: Date,
    generatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'StaffMember'
    },
    version: { type: Number, default: 1 }
  }],
  
  communications: [{
    date: Date,
    type: {
      type: String,
      enum: ['invoice_sent', 'payment_reminder', 'payment_received', 'dispute_raised', 'dispute_resolved', 'other']
    },
    method: String,
    recipient: String,
    subject: String,
    message: String,
    status: String,
    response: String,
    sentBy: {
      type: Schema.Types.ObjectId,
      ref: 'StaffMember'
    }
  }],
  
  disputes: [{
    disputeDate: Date,
    disputeType: {
      type: String,
      enum: ['billing_error', 'service_issue', 'quality_concern', 'delivery_issue', 'pricing_dispute', 'other']
    },
    description: String,
    raisedBy: String, // Client contact
    amount: Number,
    status: {
      type: String,
      enum: ['raised', 'under_review', 'resolved', 'escalated', 'closed'],
      default: 'raised'
    },
    assignedTo: {
      type: Schema.Types.ObjectId,
      ref: 'StaffMember'
    },
    resolution: String,
    resolvedDate: Date,
    resolutionAmount: Number
  }],
  
  approvals: [{
    level: Number,
    approverRole: String,
    approver: {
      type: Schema.Types.ObjectId,
      ref: 'StaffMember'
    },
    approvalDate: Date,
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending'
    },
    comments: String,
    conditions: String
  }],
  
  auditTrail: [{
    action: {
      type: String,
      enum: ['created', 'modified', 'sent', 'payment_recorded', 'cancelled', 'approved'],
      required: true
    },
    timestamp: { type: Date, default: Date.now },
    performedBy: {
      type: Schema.Types.ObjectId,
      ref: 'StaffMember',
      required: true
    },
    changes: [{
      field: String,
      oldValue: Schema.Types.Mixed,
      newValue: Schema.Types.Mixed
    }],
    ipAddress: String,
    userAgent: String,
    notes: String
  }],
  
  template: {
    templateId: String,
    templateName: String,
    customization: {
      logo: String,
      colorScheme: String,
      footer: String,
      terms: String
    }
  },
  
  delivery: {
    method: {
      type: String,
      enum: ['email', 'postal', 'courier', 'hand_delivery', 'portal'],
      default: 'email'
    },
    
    email: {
      emailAddress: String,
      sentDate: Date,
      deliveryStatus: String,
      openedDate: Date,
      downloadedDate: Date
    },
    
    postal: {
      address: String,
      courierCompany: String,
      trackingNumber: String,
      dispatchDate: Date,
      deliveryDate: Date,
      receivedBy: String
    }
  },
  
  linkedInvoices: [{
    invoiceId: {
      type: Schema.Types.ObjectId,
      ref: 'EventInvoice'
    },
    relationship: {
      type: String,
      enum: ['parent', 'child', 'amendment', 'replacement', 'credit_note', 'debit_note']
    },
    description: String
  }],
  
  analytics: {
    daysToPayment: Number,
    paymentEfficiency: Number, // percentage on time
    clientPaymentHistory: String,
    collectionEffort: Number, // number of reminders sent
    disputeResolutionTime: Number, // days
    profitability: {
      grossProfit: Number,
      grossMargin: Number,
      netProfit: Number,
      netMargin: Number
    }
  },
  
  notes: {
    internalNotes: String,
    clientNotes: String,
    accountingNotes: String,
    termsAndConditions: String,
    paymentInstructions: String
  },
  
  isActive: {
    type: Boolean,
    default: true
  },
  
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'StaffMember',
    required: true
  },
  
  lastUpdatedBy: {
    type: Schema.Types.ObjectId,
    ref: 'StaffMember'
  },
  
  createdAt: {
    type: Date,
    default: Date.now
  },
  
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

EventInvoiceSchema.pre('save', function() {
  this.updatedAt = new Date();
  
  // Generate invoice number if not provided
  if (!this.invoiceNumber) {
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    const timestamp = Date.now().toString().slice(-6);
    this.invoiceNumber = `INV${year}${month}${timestamp}`;
  }
  
  // Calculate line item totals
  if (this.lineItems) {
    this.lineItems.forEach(item => {
      // Ensure pricing and taxDetails exist
      if (!item.pricing) return;
      
      // Calculate line total
      item.pricing.lineTotal = item.quantity * item.pricing.unitPrice;
      
      // Apply discount
      let discountAmount = 0;
      if (item.pricing.discountType === 'percentage') {
        discountAmount = (item.pricing.lineTotal * (item.pricing.discount || 0)) / 100;
      } else {
        discountAmount = item.pricing.discount || 0;
      }
      
      item.pricing.netAmount = item.pricing.lineTotal - discountAmount;
      
      // Calculate taxes
      if (item.taxDetails?.taxable) {
        const taxableAmount = item.pricing.netAmount;
        
        if (item.taxDetails.igst) {
          item.taxDetails.igst = (taxableAmount * (item.taxDetails.taxRate || 0)) / 100;
          item.taxDetails.totalTax = item.taxDetails.igst;
        } else {
          item.taxDetails.cgst = (taxableAmount * (item.taxDetails.taxRate || 0)) / 200; // Half of tax rate
          item.taxDetails.sgst = (taxableAmount * (item.taxDetails.taxRate || 0)) / 200; // Half of tax rate
          item.taxDetails.totalTax = (item.taxDetails.cgst || 0) + (item.taxDetails.sgst || 0);
        }
        
        if (item.taxDetails.cess) {
          item.taxDetails.totalTax = (item.taxDetails.totalTax || 0) + item.taxDetails.cess;
        }
      }
    });
  }
  
  // Calculate financial summary
  if (this.lineItems?.length > 0 && this.financialSummary) {
    // Calculate subtotal
    this.financialSummary.subtotal = this.lineItems.reduce((sum, item) => sum + (item.pricing?.lineTotal || 0), 0);
    
    // Calculate total discount
    this.financialSummary.totalDiscount = this.lineItems.reduce((sum, item) => {
      if (!item.pricing) return sum;
      let discount = 0;
      if (item.pricing.discountType === 'percentage') {
        discount = (item.pricing.lineTotal * (item.pricing.discount || 0)) / 100;
      } else {
        discount = item.pricing.discount || 0;
      }
      return sum + discount;
    }, 0);
    
    // Add invoice-level discounts
    if (this.financialSummary.discounts) {
      this.financialSummary.discounts.forEach(discount => {
        this.financialSummary!.totalDiscount += discount.amount || 0;
      });
    }
    
    this.financialSummary.discountedAmount = this.financialSummary.subtotal - this.financialSummary.totalDiscount;
    
    // Calculate taxes
    if (this.financialSummary.taxes) {
      if (this.financialSummary.taxes.cgst) {
        this.financialSummary.taxes.cgst.amount = this.lineItems.reduce((sum, item) => sum + (item.taxDetails?.cgst || 0), 0);
      }
      if (this.financialSummary.taxes.sgst) {
        this.financialSummary.taxes.sgst.amount = this.lineItems.reduce((sum, item) => sum + (item.taxDetails?.sgst || 0), 0);
      }
      if (this.financialSummary.taxes.igst) {
        this.financialSummary.taxes.igst.amount = this.lineItems.reduce((sum, item) => sum + (item.taxDetails?.igst || 0), 0);
      }
      if (this.financialSummary.taxes.cess) {
        this.financialSummary.taxes.cess.amount = this.lineItems.reduce((sum, item) => sum + (item.taxDetails?.cess || 0), 0);
      }
      
      this.financialSummary.taxes.totalTaxAmount = 
        (this.financialSummary.taxes.cgst?.amount || 0) +
        (this.financialSummary.taxes.sgst?.amount || 0) +
        (this.financialSummary.taxes.igst?.amount || 0) +
        (this.financialSummary.taxes.cess?.amount || 0);
    }
    
    // Calculate additional charges
    this.financialSummary.totalAdditionalCharges = this.financialSummary.additionalCharges?.reduce((sum, charge) => sum + (charge.amount || 0), 0) || 0;
    
    // Calculate grand total
    this.financialSummary.grandTotal = 
      this.financialSummary.discountedAmount +
      (this.financialSummary.taxes?.totalTaxAmount || 0) +
      this.financialSummary.totalAdditionalCharges +
      (this.financialSummary.roundingAdjustment || 0);
  }
  
  // Calculate balance amount
  this.balanceAmount = (this.financialSummary?.grandTotal || 0) - (this.paidAmount || 0);
  
  // Update payment status based on amounts
  if (this.balanceAmount <= 0) {
    this.status = 'paid';
  } else if (this.paidAmount > 0) {
    this.status = 'partially_paid';
  } else if (this.dueDate && new Date() > this.dueDate) {
    this.status = 'overdue';
  }
  
  // Add audit trail entry
  if (this.isModified() && !this.isNew) {
    this.auditTrail = this.auditTrail || [];
    this.auditTrail.push({
      action: 'modified',
      timestamp: new Date(),
      performedBy: this.lastUpdatedBy,
      notes: 'Invoice updated'
    });
  }
});

EventInvoiceSchema.index({ propertyId: 1, invoiceNumber: 1 }, { unique: true });
EventInvoiceSchema.index({ eventBookingId: 1 });
EventInvoiceSchema.index({ propertyId: 1, status: 1 });
EventInvoiceSchema.index({ invoiceDate: -1 });
EventInvoiceSchema.index({ dueDate: 1 });
EventInvoiceSchema.index({ 'client.billingInfo.gstNumber': 1 });

EventInvoiceSchema.methods.recordPayment = function(paymentData: any, recordedBy: string) {
  this.paymentHistory = this.paymentHistory || [];
  
  const payment = {
    ...paymentData,
    paymentDate: paymentData.paymentDate || new Date(),
    recordedBy
  };
  
  this.paymentHistory.push(payment);
  
  // Update paid amount if payment is successful
  if (payment.status === 'successful') {
    this.paidAmount = (this.paidAmount || 0) + payment.amount;
    this.balanceAmount = (this.financialSummary?.grandTotal || 0) - this.paidAmount;
  }
  
  // Add audit trail
  this.auditTrail = this.auditTrail || [];
  this.auditTrail.push({
    action: 'payment_recorded',
    timestamp: new Date(),
    performedBy: recordedBy,
    notes: `Payment of ${payment.amount} recorded via ${payment.paymentMethod}`
  });
  
  return this.save();
};

EventInvoiceSchema.methods.sendReminder = function(reminderType: string, method: string, sentBy: string) {
  this.reminders = this.reminders || [];
  
  this.reminders.push({
    reminderDate: new Date(),
    type: reminderType,
    method,
    sentBy,
    status: 'sent'
  });
  
  return this.save();
};

EventInvoiceSchema.methods.addAdjustment = function(adjustmentData: any, approvedBy: string) {
  this.adjustments = this.adjustments || [];
  
  this.adjustments.push({
    ...adjustmentData,
    adjustmentDate: new Date(),
    approvedBy
  });
  
  // Recalculate totals based on adjustment type
  if (adjustmentData.type === 'credit_note' || adjustmentData.type === 'refund') {
    this.balanceAmount -= adjustmentData.amount;
  } else if (adjustmentData.type === 'debit_note' || adjustmentData.type === 'penalty') {
    this.balanceAmount += adjustmentData.amount;
  }
  
  return this.save();
};

EventInvoiceSchema.methods.raiseDispute = function(disputeData: any) {
  this.disputes = this.disputes || [];
  
  this.disputes.push({
    ...disputeData,
    disputeDate: new Date(),
    status: 'raised'
  });
  
  return this.save();
};

EventInvoiceSchema.methods.generateDocument = function(documentType: string, generatedBy: string) {
  this.documents = this.documents || [];
  
  const document = {
    documentType,
    documentName: `${this.invoiceNumber}_${documentType}`,
    generatedDate: new Date(),
    generatedBy,
    version: 1
  };
  
  this.documents.push(document);
  
  return this.save();
};

EventInvoiceSchema.methods.updateStatus = function(newStatus: string, updatedBy?: string) {
  this.status = newStatus;
  if (updatedBy) {
    this.lastUpdatedBy = updatedBy;
  }
  
  // Add audit trail
  this.auditTrail = this.auditTrail || [];
  this.auditTrail.push({
    action: 'modified',
    timestamp: new Date(),
    performedBy: updatedBy,
    notes: `Status changed to ${newStatus}`
  });
  
  return this.save();
};

EventInvoiceSchema.methods.calculateDaysOverdue = function() {
  if (!this.dueDate) return 0;
  
  const today = new Date();
  const dueDate = new Date(this.dueDate);
  
  if (today <= dueDate) return 0;
  
  return Math.ceil((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
};

EventInvoiceSchema.statics.findByProperty = function(propertyId: string) {
  return this.find({ propertyId }).sort({ invoiceDate: -1 });
};

EventInvoiceSchema.statics.findByStatus = function(propertyId: string, status: string) {
  return this.find({ propertyId, status }).sort({ invoiceDate: -1 });
};

EventInvoiceSchema.statics.findOverdue = function(propertyId: string) {
  const today = new Date();
  return this.find({
    propertyId,
    dueDate: { $lt: today },
    status: { $in: ['sent', 'viewed', 'partially_paid'] }
  }).sort({ dueDate: 1 });
};

EventInvoiceSchema.statics.findByEventBooking = function(eventBookingId: string) {
  return this.find({ eventBookingId }).sort({ invoiceDate: -1 });
};

EventInvoiceSchema.statics.getRevenueReport = function(propertyId: string, startDate: Date, endDate: Date) {
  return this.aggregate([
    {
      $match: {
        propertyId,
        invoiceDate: { $gte: startDate, $lte: endDate },
        status: { $in: ['paid', 'partially_paid'] }
      }
    },
    {
      $group: {
        _id: {
          year: { $year: '$invoiceDate' },
          month: { $month: '$invoiceDate' }
        },
        totalInvoices: { $sum: 1 },
        totalAmount: { $sum: '$financialSummary.grandTotal' },
        totalPaid: { $sum: '$paidAmount' },
        totalTaxes: { $sum: '$financialSummary.taxes.totalTaxAmount' },
        averageInvoiceValue: { $avg: '$financialSummary.grandTotal' }
      }
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } }
  ]);
};

EventInvoiceSchema.statics.getAgeingReport = function(propertyId: string) {
  const today = new Date();
  
  return this.aggregate([
    {
      $match: {
        propertyId,
        status: { $in: ['sent', 'viewed', 'partially_paid', 'overdue'] }
      }
    },
    {
      $addFields: {
        daysOverdue: {
          $divide: [
            { $subtract: [today, '$dueDate'] },
            1000 * 60 * 60 * 24
          ]
        }
      }
    },
    {
      $group: {
        _id: {
          $switch: {
            branches: [
              { case: { $lte: ['$daysOverdue', 0] }, then: 'Current' },
              { case: { $lte: ['$daysOverdue', 30] }, then: '1-30 Days' },
              { case: { $lte: ['$daysOverdue', 60] }, then: '31-60 Days' },
              { case: { $lte: ['$daysOverdue', 90] }, then: '61-90 Days' }
            ],
            default: '90+ Days'
          }
        },
        count: { $sum: 1 },
        totalAmount: { $sum: '$balanceAmount' }
      }
    }
  ]);
};

const EventInvoice = models.EventInvoice || model('EventInvoice', EventInvoiceSchema);

export default EventInvoice;