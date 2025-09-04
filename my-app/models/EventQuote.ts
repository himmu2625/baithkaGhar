import mongoose, { Schema, Document, Types, models, model } from 'mongoose';

export interface IEventQuote extends Document {
  _id: Types.ObjectId;
  propertyId: Types.ObjectId;
  quoteNumber: string;
  
  // Related Records
  leadId?: Types.ObjectId;
  eventBookingId?: Types.ObjectId;
  
  // Quote Details
  quoteVersion: number;
  parentQuoteId?: Types.ObjectId; // For revisions
  
  // Client Information
  client: {
    name: string;
    email: string;
    phone: string;
    company?: string;
    address: any;
  };
  
  // Event Details
  eventDetails: {
    eventType: 'wedding' | 'conference' | 'birthday' | 'corporate' | 'exhibition' | 'other';
    eventName: string;
    eventDate: Date;
    startTime: string;
    endTime: string;
    expectedGuests: number;
    duration: number; // hours
    specialRequirements?: string;
  };
  
  // Venue & Setup
  venue: {
    venueId: Types.ObjectId;
    venueName: string;
    setupStyle: 'theatre' | 'classroom' | 'u-shape' | 'boardroom' | 'banquet' | 'cocktail';
    capacity: number;
    baseRate: number;
    setupCharges: number;
  };
  
  // Services & Packages
  selectedPackage?: {
    packageId: Types.ObjectId;
    packageName: string;
    description: string;
    basePrice: number;
    inclusions: string[];
  };
  
  additionalServices: [{
    serviceId: Types.ObjectId;
    serviceName: string;
    category: 'catering' | 'decoration' | 'equipment' | 'entertainment' | 'photography' | 'transportation' | 'other';
    description: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    isOptional: boolean;
  }];
  
  // Catering Details
  catering: {
    required: boolean;
    menuId?: Types.ObjectId;
    menuName?: string;
    mealType: 'breakfast' | 'lunch' | 'dinner' | 'cocktail' | 'tea-break' | 'buffet' | 'plated';
    guestCount: number;
    pricePerGuest: number;
    totalCateringCost: number;
    specialDietaryRequirements?: string[];
    beveragePackage?: {
      type: 'non-alcoholic' | 'beer-wine' | 'full-bar' | 'premium-bar';
      pricePerGuest: number;
    };
  };
  
  // Detailed Pricing Breakdown
  pricing: {
    venueCharges: number;
    cateringCharges: number;
    decorationCharges: number;
    equipmentCharges: number;
    entertainmentCharges: number;
    serviceCharges: number;
    staffCharges: number;
    transportationCharges: number;
    miscellaneousCharges: number;
    
    subtotal: number;
    
    discounts: [{
      type: 'percentage' | 'fixed';
      name: string;
      description?: string;
      value: number; // percentage or amount
      amount: number; // calculated discount amount
    }];
    
    totalDiscount: number;
    
    taxes: [{
      name: string;
      type: 'percentage' | 'fixed';
      rate: number;
      amount: number;
      taxableAmount: number;
    }];
    
    totalTax: number;
    totalAmount: number;
    
    advancePercentage: number;
    advanceAmount: number;
    balanceAmount: number;
    
    currency: string;
  };
  
  // Payment Terms
  paymentTerms: {
    advancePercentage: number;
    advanceDueDate: Date;
    balancePaymentDays: number; // days before event
    paymentMethods: string[];
    lateFeePercentage?: number;
    cancellationPolicy: string;
    refundPolicy: string;
  };
  
  // Terms & Conditions
  terms: {
    inclusions: string[];
    exclusions: string[];
    conditions: string[];
    cancellationTerms: string;
    forceMAjeureClause: string;
    liabilityClause: string;
    modificationPolicy: string;
  };
  
  // Quote Status & Timeline
  status: 'draft' | 'sent' | 'viewed' | 'under-review' | 'revised' | 'accepted' | 'rejected' | 'expired' | 'cancelled';
  
  timeline: {
    createdDate: Date;
    sentDate?: Date;
    viewedDate?: Date;
    responseDate?: Date;
    acceptedDate?: Date;
    rejectedDate?: Date;
    expiredDate?: Date;
  };
  
  validityPeriod: {
    validFrom: Date;
    validUntil: Date;
    isExpired: boolean;
  };
  
  // Client Feedback & Negotiation
  clientFeedback: [{
    date: Date;
    feedback: string;
    requestedChanges?: string[];
    priceExpectation?: number;
    concerns?: string[];
  }];
  
  negotiationHistory: [{
    date: Date;
    type: 'price-change' | 'service-modification' | 'terms-update' | 'other';
    description: string;
    oldValue?: any;
    newValue?: any;
    initiatedBy: 'client' | 'staff';
    staffMember?: Types.ObjectId;
  }];
  
  // Revision History
  revisionHistory: [{
    version: number;
    date: Date;
    changes: string[];
    reason: string;
    revisedBy: Types.ObjectId;
    parentQuoteId?: Types.ObjectId;
  }];
  
  // Follow-up & Reminders
  followUpSchedule: [{
    date: Date;
    type: 'email' | 'call' | 'meeting' | 'whatsapp';
    message?: string;
    completed: boolean;
    completedDate?: Date;
    response?: string;
  }];
  
  nextFollowUp?: Date;
  reminderCount: number;
  
  // Document Management
  documents: [{
    type: 'quote-pdf' | 'brochure' | 'floor-plan' | 'menu-card' | 'contract-draft' | 'other';
    name: string;
    url: string;
    uploadDate: Date;
    version?: string;
  }];
  
  // Conversion & Analytics
  analytics: {
    openCount: number;
    downloadCount: number;
    shareCount: number;
    timeSpentViewing?: number; // seconds
    devicesUsed: string[];
    referrerSources: string[];
  };
  
  competitorComparison?: {
    competitorName: string;
    theirQuote?: number;
    advantages: string[];
    disadvantages: string[];
    differentiators: string[];
  };
  
  // Assignment & Ownership
  createdBy: Types.ObjectId;
  assignedTo: Types.ObjectId;
  approvedBy?: Types.ObjectId;
  
  // Metadata
  isActive: boolean;
  tags: string[];
  notes: string;
  lastUpdatedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  
  // Methods
  generatePDF(): Promise<string>;
  sendToClient(channel: 'email' | 'whatsapp'): Promise<boolean>;
  createRevision(changes: string[], reason: string): Promise<IEventQuote>;
  markAsAccepted(): Promise<IEventQuote>;
  addClientFeedback(feedback: any): Promise<IEventQuote>;
  scheduleFollowUp(date: Date, type: string): Promise<IEventQuote>;
}

const EventQuoteSchema = new Schema<IEventQuote>({
  propertyId: {
    type: Schema.Types.ObjectId,
    ref: 'Property',
    required: [true, 'Property ID is required'],
    index: true
  },
  
  quoteNumber: {
    type: String,
    required: [true, 'Quote number is required'],
    unique: true,
    trim: true
  },
  
  // Related Records
  leadId: {
    type: Schema.Types.ObjectId,
    ref: 'EventLead'
  },
  
  eventBookingId: {
    type: Schema.Types.ObjectId,
    ref: 'EventBooking'
  },
  
  // Quote Details
  quoteVersion: {
    type: Number,
    required: true,
    default: 1
  },
  
  parentQuoteId: {
    type: Schema.Types.ObjectId,
    ref: 'EventQuote'
  },
  
  // Client Information
  client: {
    name: {
      type: String,
      required: [true, 'Client name is required'],
      trim: true
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
    address: Schema.Types.Mixed
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
      required: [true, 'Event name is required'],
      trim: true
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
    expectedGuests: {
      type: Number,
      required: [true, 'Expected guests count is required'],
      min: [1, 'Guest count must be at least 1']
    },
    duration: {
      type: Number,
      required: [true, 'Event duration is required'],
      min: [1, 'Duration must be at least 1 hour']
    },
    specialRequirements: String
  },
  
  // Venue & Setup
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
    setupStyle: {
      type: String,
      required: [true, 'Setup style is required'],
      enum: {
        values: ['theatre', 'classroom', 'u-shape', 'boardroom', 'banquet', 'cocktail'],
        message: 'Invalid setup style'
      }
    },
    capacity: {
      type: Number,
      required: [true, 'Venue capacity is required'],
      min: [1, 'Capacity must be at least 1']
    },
    baseRate: {
      type: Number,
      required: [true, 'Base rate is required'],
      min: [0, 'Rate cannot be negative']
    },
    setupCharges: {
      type: Number,
      default: 0,
      min: [0, 'Setup charges cannot be negative']
    }
  },
  
  // Services & Packages
  selectedPackage: {
    packageId: {
      type: Schema.Types.ObjectId,
      ref: 'EventPackage'
    },
    packageName: String,
    description: String,
    basePrice: Number,
    inclusions: [String]
  },
  
  additionalServices: [{
    serviceId: {
      type: Schema.Types.ObjectId,
      ref: 'EventService',
      required: true
    },
    serviceName: {
      type: String,
      required: true
    },
    category: {
      type: String,
      required: true,
      enum: ['catering', 'decoration', 'equipment', 'entertainment', 'photography', 'transportation', 'other']
    },
    description: String,
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
    isOptional: {
      type: Boolean,
      default: false
    }
  }],
  
  // Catering Details
  catering: {
    required: {
      type: Boolean,
      required: true,
      default: false
    },
    menuId: {
      type: Schema.Types.ObjectId,
      ref: 'EventMenu'
    },
    menuName: String,
    mealType: {
      type: String,
      enum: ['breakfast', 'lunch', 'dinner', 'cocktail', 'tea-break', 'buffet', 'plated']
    },
    guestCount: {
      type: Number,
      min: [0, 'Guest count cannot be negative']
    },
    pricePerGuest: {
      type: Number,
      min: [0, 'Price per guest cannot be negative']
    },
    totalCateringCost: {
      type: Number,
      min: [0, 'Total catering cost cannot be negative']
    },
    specialDietaryRequirements: [String],
    beveragePackage: {
      type: {
        type: String,
        enum: ['non-alcoholic', 'beer-wine', 'full-bar', 'premium-bar']
      },
      pricePerGuest: {
        type: Number,
        min: [0, 'Beverage price cannot be negative']
      }
    }
  },
  
  // Detailed Pricing Breakdown
  pricing: {
    venueCharges: {
      type: Number,
      required: true,
      min: [0, 'Venue charges cannot be negative']
    },
    cateringCharges: {
      type: Number,
      default: 0,
      min: [0, 'Catering charges cannot be negative']
    },
    decorationCharges: {
      type: Number,
      default: 0,
      min: [0, 'Decoration charges cannot be negative']
    },
    equipmentCharges: {
      type: Number,
      default: 0,
      min: [0, 'Equipment charges cannot be negative']
    },
    entertainmentCharges: {
      type: Number,
      default: 0,
      min: [0, 'Entertainment charges cannot be negative']
    },
    serviceCharges: {
      type: Number,
      default: 0,
      min: [0, 'Service charges cannot be negative']
    },
    staffCharges: {
      type: Number,
      default: 0,
      min: [0, 'Staff charges cannot be negative']
    },
    transportationCharges: {
      type: Number,
      default: 0,
      min: [0, 'Transportation charges cannot be negative']
    },
    miscellaneousCharges: {
      type: Number,
      default: 0,
      min: [0, 'Miscellaneous charges cannot be negative']
    },
    
    subtotal: {
      type: Number,
      required: true,
      min: [0, 'Subtotal cannot be negative']
    },
    
    discounts: [{
      type: {
        type: String,
        enum: ['percentage', 'fixed'],
        required: true
      },
      name: {
        type: String,
        required: true
      },
      description: String,
      value: {
        type: Number,
        required: true,
        min: [0, 'Discount value cannot be negative']
      },
      amount: {
        type: Number,
        required: true,
        min: [0, 'Discount amount cannot be negative']
      }
    }],
    
    totalDiscount: {
      type: Number,
      default: 0,
      min: [0, 'Total discount cannot be negative']
    },
    
    taxes: [{
      name: {
        type: String,
        required: true
      },
      type: {
        type: String,
        enum: ['percentage', 'fixed'],
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
    
    totalTax: {
      type: Number,
      default: 0,
      min: [0, 'Total tax cannot be negative']
    },
    
    totalAmount: {
      type: Number,
      required: true,
      min: [0, 'Total amount cannot be negative']
    },
    
    advancePercentage: {
      type: Number,
      required: true,
      min: [0, 'Advance percentage cannot be negative'],
      max: [100, 'Advance percentage cannot exceed 100']
    },
    
    advanceAmount: {
      type: Number,
      required: true,
      min: [0, 'Advance amount cannot be negative']
    },
    
    balanceAmount: {
      type: Number,
      required: true,
      min: [0, 'Balance amount cannot be negative']
    },
    
    currency: {
      type: String,
      default: 'INR'
    }
  },
  
  // Payment Terms
  paymentTerms: {
    advancePercentage: {
      type: Number,
      required: true,
      min: [0, 'Advance percentage cannot be negative'],
      max: [100, 'Advance percentage cannot exceed 100']
    },
    advanceDueDate: {
      type: Date,
      required: true
    },
    balancePaymentDays: {
      type: Number,
      required: true,
      min: [0, 'Balance payment days cannot be negative']
    },
    paymentMethods: [{
      type: String,
      required: true
    }],
    lateFeePercentage: {
      type: Number,
      min: [0, 'Late fee percentage cannot be negative']
    },
    cancellationPolicy: {
      type: String,
      required: true
    },
    refundPolicy: {
      type: String,
      required: true
    }
  },
  
  // Terms & Conditions
  terms: {
    inclusions: [{
      type: String,
      required: true
    }],
    exclusions: [String],
    conditions: [String],
    cancellationTerms: {
      type: String,
      required: true
    },
    forceMAjeureClause: String,
    liabilityClause: String,
    modificationPolicy: String
  },
  
  // Quote Status & Timeline
  status: {
    type: String,
    required: true,
    enum: {
      values: ['draft', 'sent', 'viewed', 'under-review', 'revised', 'accepted', 'rejected', 'expired', 'cancelled'],
      message: 'Invalid quote status'
    },
    default: 'draft'
  },
  
  timeline: {
    createdDate: {
      type: Date,
      required: true,
      default: Date.now
    },
    sentDate: Date,
    viewedDate: Date,
    responseDate: Date,
    acceptedDate: Date,
    rejectedDate: Date,
    expiredDate: Date
  },
  
  validityPeriod: {
    validFrom: {
      type: Date,
      required: true,
      default: Date.now
    },
    validUntil: {
      type: Date,
      required: true
    },
    isExpired: {
      type: Boolean,
      default: false
    }
  },
  
  // Client Feedback & Negotiation
  clientFeedback: [{
    date: {
      type: Date,
      required: true
    },
    feedback: {
      type: String,
      required: true
    },
    requestedChanges: [String],
    priceExpectation: Number,
    concerns: [String]
  }],
  
  negotiationHistory: [{
    date: {
      type: Date,
      required: true
    },
    type: {
      type: String,
      required: true,
      enum: ['price-change', 'service-modification', 'terms-update', 'other']
    },
    description: {
      type: String,
      required: true
    },
    oldValue: Schema.Types.Mixed,
    newValue: Schema.Types.Mixed,
    initiatedBy: {
      type: String,
      required: true,
      enum: ['client', 'staff']
    },
    staffMember: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
  
  // Revision History
  revisionHistory: [{
    version: {
      type: Number,
      required: true
    },
    date: {
      type: Date,
      required: true
    },
    changes: [{
      type: String,
      required: true
    }],
    reason: {
      type: String,
      required: true
    },
    revisedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    parentQuoteId: {
      type: Schema.Types.ObjectId,
      ref: 'EventQuote'
    }
  }],
  
  // Follow-up & Reminders
  followUpSchedule: [{
    date: {
      type: Date,
      required: true
    },
    type: {
      type: String,
      required: true,
      enum: ['email', 'call', 'meeting', 'whatsapp']
    },
    message: String,
    completed: {
      type: Boolean,
      default: false
    },
    completedDate: Date,
    response: String
  }],
  
  nextFollowUp: Date,
  reminderCount: {
    type: Number,
    default: 0
  },
  
  // Document Management
  documents: [{
    type: {
      type: String,
      required: true,
      enum: ['quote-pdf', 'brochure', 'floor-plan', 'menu-card', 'contract-draft', 'other']
    },
    name: {
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
    version: String
  }],
  
  // Conversion & Analytics
  analytics: {
    openCount: {
      type: Number,
      default: 0
    },
    downloadCount: {
      type: Number,
      default: 0
    },
    shareCount: {
      type: Number,
      default: 0
    },
    timeSpentViewing: Number,
    devicesUsed: [String],
    referrerSources: [String]
  },
  
  competitorComparison: {
    competitorName: String,
    theirQuote: Number,
    advantages: [String],
    disadvantages: [String],
    differentiators: [String]
  },
  
  // Assignment & Ownership
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
  
  // Metadata
  isActive: {
    type: Boolean,
    default: true
  },
  
  tags: [String],
  notes: String,
  
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
  collection: 'eventquotes'
});

// Pre-save middleware
EventQuoteSchema.pre('save', function() {
  const doc = this as any;
  
  // Generate quote number if not provided
  if (!doc.quoteNumber) {
    const date = new Date();
    const dateStr = date.toISOString().slice(2, 10).replace(/-/g, '');
    const timeStr = Date.now().toString().slice(-4);
    doc.quoteNumber = `QT${dateStr}${timeStr}`;
  }
  
  // Calculate pricing
  if (doc.pricing) {
    // Calculate subtotal
    let subtotal = 0;
    subtotal += doc.pricing.venueCharges || 0;
    subtotal += doc.pricing.cateringCharges || 0;
    subtotal += doc.pricing.decorationCharges || 0;
    subtotal += doc.pricing.equipmentCharges || 0;
    subtotal += doc.pricing.entertainmentCharges || 0;
    subtotal += doc.pricing.serviceCharges || 0;
    subtotal += doc.pricing.staffCharges || 0;
    subtotal += doc.pricing.transportationCharges || 0;
    subtotal += doc.pricing.miscellaneousCharges || 0;
    
    doc.pricing.subtotal = subtotal;
    
    // Calculate total after discounts and taxes
    let total = subtotal - (doc.pricing.totalDiscount || 0);
    total += doc.pricing.totalTax || 0;
    
    doc.pricing.totalAmount = Math.round(total);
    
    // Calculate advance and balance
    if (doc.pricing.advancePercentage) {
      doc.pricing.advanceAmount = Math.round((doc.pricing.totalAmount * doc.pricing.advancePercentage) / 100);
      doc.pricing.balanceAmount = doc.pricing.totalAmount - doc.pricing.advanceAmount;
    }
  }
  
  // Check if expired
  if (doc.validityPeriod && doc.validityPeriod.validUntil < new Date()) {
    doc.validityPeriod.isExpired = true;
    if (doc.status === 'sent' || doc.status === 'viewed') {
      doc.status = 'expired';
    }
  }
});

// Indexes
EventQuoteSchema.index({ propertyId: 1, quoteNumber: 1 }, { unique: true });
EventQuoteSchema.index({ propertyId: 1, status: 1 });
EventQuoteSchema.index({ leadId: 1 });
EventQuoteSchema.index({ assignedTo: 1, status: 1 });
EventQuoteSchema.index({ 'validityPeriod.validUntil': 1 });
EventQuoteSchema.index({ nextFollowUp: 1 });
EventQuoteSchema.index({ createdAt: -1 });

// Methods
EventQuoteSchema.methods.generatePDF = function() {
  // Implementation for PDF generation
  return Promise.resolve('pdf-url');
};

EventQuoteSchema.methods.sendToClient = function(channel: 'email' | 'whatsapp') {
  const doc = this as any;
  // Implementation for sending quote to client
  doc.timeline.sentDate = new Date();
  doc.status = 'sent';
  return doc.save();
};

EventQuoteSchema.methods.createRevision = function(changes: string[], reason: string) {
  const doc = this as any;
  
  // Create revision history entry
  doc.revisionHistory = doc.revisionHistory || [];
  doc.revisionHistory.push({
    version: doc.quoteVersion + 1,
    date: new Date(),
    changes,
    reason,
    revisedBy: doc.lastUpdatedBy,
    parentQuoteId: doc._id
  });
  
  doc.quoteVersion += 1;
  doc.status = 'revised';
  
  return doc.save();
};

EventQuoteSchema.methods.markAsAccepted = function() {
  const doc = this as any;
  doc.status = 'accepted';
  doc.timeline.acceptedDate = new Date();
  return doc.save();
};

EventQuoteSchema.methods.addClientFeedback = function(feedbackData: any) {
  const doc = this as any;
  doc.clientFeedback = doc.clientFeedback || [];
  doc.clientFeedback.push({
    ...feedbackData,
    date: new Date()
  });
  
  doc.status = 'under-review';
  doc.timeline.responseDate = new Date();
  
  return doc.save();
};

EventQuoteSchema.methods.scheduleFollowUp = function(date: Date, type: string) {
  const doc = this as any;
  doc.followUpSchedule = doc.followUpSchedule || [];
  doc.followUpSchedule.push({
    date,
    type,
    completed: false
  });
  
  doc.nextFollowUp = date;
  return doc.save();
};

// Static methods
EventQuoteSchema.statics.findByProperty = function(propertyId: string) {
  return this.find({ propertyId, isActive: true }).sort({ createdAt: -1 });
};

EventQuoteSchema.statics.findPendingQuotes = function(propertyId: string) {
  return this.find({
    propertyId,
    isActive: true,
    status: { $in: ['sent', 'viewed', 'under-review'] },
    'validityPeriod.isExpired': false
  }).sort({ 'validityPeriod.validUntil': 1 });
};

EventQuoteSchema.statics.findExpiredQuotes = function(propertyId: string) {
  return this.find({
    propertyId,
    isActive: true,
    'validityPeriod.validUntil': { $lt: new Date() }
  }).sort({ 'validityPeriod.validUntil': -1 });
};

EventQuoteSchema.statics.getConversionStats = function(propertyId: string, startDate: Date, endDate: Date) {
  return this.aggregate([
    {
      $match: {
        propertyId,
        createdAt: { $gte: startDate, $lte: endDate },
        isActive: true
      }
    },
    {
      $group: {
        _id: null,
        totalQuotes: { $sum: 1 },
        acceptedQuotes: { 
          $sum: { $cond: [{ $eq: ['$status', 'accepted'] }, 1, 0] }
        },
        rejectedQuotes: { 
          $sum: { $cond: [{ $eq: ['$status', 'rejected'] }, 1, 0] }
        },
        expiredQuotes: { 
          $sum: { $cond: [{ $eq: ['$status', 'expired'] }, 1, 0] }
        },
        totalValue: { $sum: '$pricing.totalAmount' },
        acceptedValue: { 
          $sum: { 
            $cond: [
              { $eq: ['$status', 'accepted'] }, 
              '$pricing.totalAmount', 
              0
            ] 
          }
        }
      }
    },
    {
      $project: {
        totalQuotes: 1,
        acceptedQuotes: 1,
        rejectedQuotes: 1,
        expiredQuotes: 1,
        conversionRate: { 
          $multiply: [{ $divide: ['$acceptedQuotes', '$totalQuotes'] }, 100]
        },
        totalValue: 1,
        acceptedValue: 1,
        averageQuoteValue: { $divide: ['$totalValue', '$totalQuotes'] }
      }
    }
  ]);
};

const EventQuote = models.EventQuote || model('EventQuote', EventQuoteSchema);

export default EventQuote;