import mongoose, { Schema, Document, Types, models, model } from 'mongoose';

export interface IEventLead extends Document {
  _id: Types.ObjectId;
  propertyId: Types.ObjectId;
  leadNumber: string;

  // Lead Source & Tracking
  source: 'website' | 'phone' | 'email' | 'referral' | 'walk-in' | 'social-media' | 'advertisement' | 'other';
  sourceDetails: string;
  referredBy?: string;
  
  // Client Information
  client: {
    name: string;
    email: string;
    phone: string;
    company?: string;
    designation?: string;
    address?: any;
    alternateContact?: {
      name: string;
      phone: string;
      relation: string;
    };
  };

  // Event Requirements
  eventRequirements: {
    eventType: 'wedding' | 'conference' | 'birthday' | 'corporate' | 'exhibition' | 'other';
    eventName?: string;
    preferredDates: Date[];
    flexibleDates: boolean;
    expectedGuests: {
      min: number;
      max: number;
    };
    budget: {
      min?: number;
      max?: number;
      currency: string;
    };
    specialRequirements?: string;
    cateringRequired: boolean;
    decorationRequired: boolean;
    accommodationRequired: boolean;
    transportationRequired: boolean;
  };

  // Lead Management
  priority: 'low' | 'normal' | 'high' | 'urgent';
  status: 'new' | 'contacted' | 'interested' | 'quoted' | 'negotiating' | 'won' | 'lost' | 'inactive';
  stage: 'inquiry' | 'qualification' | 'proposal' | 'negotiation' | 'closing' | 'completed';
  
  // Interactions & Communications
  interactions: [{
    type: 'call' | 'email' | 'meeting' | 'site-visit' | 'whatsapp' | 'other';
    date: Date;
    duration?: number; // minutes
    summary: string;
    followUpRequired: boolean;
    followUpDate?: Date;
    contactedBy: Types.ObjectId;
    outcome: 'positive' | 'neutral' | 'negative' | 'no-response';
    nextAction?: string;
  }];

  // Quotation & Proposal
  quotations: [{
    quotationNumber: string;
    sentDate: Date;
    validUntil: Date;
    amount: number;
    currency: string;
    status: 'draft' | 'sent' | 'viewed' | 'accepted' | 'rejected' | 'expired';
    responseDate?: Date;
    clientFeedback?: string;
    revisionCount: number;
    documentUrl?: string;
  }];

  // Conversion Tracking
  conversionData: {
    convertedToBooking: boolean;
    bookingId?: Types.ObjectId;
    conversionDate?: Date;
    conversionValue?: number;
    lostReason?: string;
    lostToCompetitor?: string;
  };

  // Assignment & Ownership
  assignedTo: Types.ObjectId;
  assignedDate: Date;
  reassignmentHistory: [{
    from: Types.ObjectId;
    to: Types.ObjectId;
    date: Date;
    reason: string;
  }];

  // Timeline & Reminders
  nextFollowUp?: Date;
  reminderSet: boolean;
  lastContactDate?: Date;
  responseTime?: number; // hours from inquiry to first response

  // Analytics & Scoring
  leadScore: number; // 0-100
  scoreFactors: {
    budgetFit: number;
    timingUrgency: number;
    decisionMakerContact: boolean;
    competitorInvolvement: boolean;
    eventComplexity: number;
  };

  // Tags & Categories
  tags: string[];
  category: string;

  // Metadata
  isActive: boolean;
  createdBy: Types.ObjectId;
  lastUpdatedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;

  // Methods
  updateStatus(newStatus: string, staffMemberId?: string): Promise<IEventLead>;
  addInteraction(interactionData: any, staffMemberId: string): Promise<IEventLead>;
  generateQuotation(quotationData: any): Promise<IEventLead>;
  calculateLeadScore(): number;
}

const EventLeadSchema = new Schema<IEventLead>({
  propertyId: {
    type: Schema.Types.ObjectId,
    ref: 'Property',
    required: [true, 'Property ID is required'],
    index: true
  },

  leadNumber: {
    type: String,
    required: [true, 'Lead number is required'],
    unique: true,
    trim: true
  },

  // Lead Source & Tracking
  source: {
    type: String,
    required: [true, 'Lead source is required'],
    enum: {
      values: ['website', 'phone', 'email', 'referral', 'walk-in', 'social-media', 'advertisement', 'other'],
      message: 'Invalid lead source'
    }
  },

  sourceDetails: {
    type: String,
    trim: true,
    maxlength: [500, 'Source details cannot exceed 500 characters']
  },

  referredBy: {
    type: String,
    trim: true
  },

  // Client Information
  client: {
    name: {
      type: String,
      required: [true, 'Client name is required'],
      trim: true,
      maxlength: [100, 'Client name cannot exceed 100 characters']
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
      required: [true, 'Client phone is required'],
      validate: {
        validator: function(v: string) {
          return /^[0-9+\-\s()]{10,15}$/.test(v);
        },
        message: 'Invalid phone number format'
      }
    },
    company: String,
    designation: String,
    address: Schema.Types.Mixed,
    alternateContact: {
      name: String,
      phone: String,
      relation: String
    }
  },

  // Event Requirements
  eventRequirements: {
    eventType: {
      type: String,
      required: [true, 'Event type is required'],
      enum: {
        values: ['wedding', 'conference', 'birthday', 'corporate', 'exhibition', 'other'],
        message: 'Invalid event type'
      }
    },
    eventName: String,
    preferredDates: [{
      type: Date,
      required: true
    }],
    flexibleDates: {
      type: Boolean,
      default: false
    },
    expectedGuests: {
      min: {
        type: Number,
        required: [true, 'Minimum guest count is required'],
        min: [1, 'Minimum guests must be at least 1']
      },
      max: {
        type: Number,
        required: [true, 'Maximum guest count is required'],
        min: [1, 'Maximum guests must be at least 1']
      }
    },
    budget: {
      min: {
        type: Number,
        min: [0, 'Budget cannot be negative']
      },
      max: {
        type: Number,
        min: [0, 'Budget cannot be negative']
      },
      currency: {
        type: String,
        default: 'INR'
      }
    },
    specialRequirements: String,
    cateringRequired: {
      type: Boolean,
      default: true
    },
    decorationRequired: {
      type: Boolean,
      default: true
    },
    accommodationRequired: {
      type: Boolean,
      default: false
    },
    transportationRequired: {
      type: Boolean,
      default: false
    }
  },

  // Lead Management
  priority: {
    type: String,
    enum: {
      values: ['low', 'normal', 'high', 'urgent'],
      message: 'Invalid priority level'
    },
    default: 'normal'
  },

  status: {
    type: String,
    required: [true, 'Lead status is required'],
    enum: {
      values: ['new', 'contacted', 'interested', 'quoted', 'negotiating', 'won', 'lost', 'inactive'],
      message: 'Invalid lead status'
    },
    default: 'new'
  },

  stage: {
    type: String,
    required: [true, 'Lead stage is required'],
    enum: {
      values: ['inquiry', 'qualification', 'proposal', 'negotiation', 'closing', 'completed'],
      message: 'Invalid lead stage'
    },
    default: 'inquiry'
  },

  // Interactions & Communications
  interactions: [{
    type: {
      type: String,
      required: true,
      enum: ['call', 'email', 'meeting', 'site-visit', 'whatsapp', 'other']
    },
    date: {
      type: Date,
      required: true
    },
    duration: Number,
    summary: {
      type: String,
      required: true,
      maxlength: [1000, 'Summary cannot exceed 1000 characters']
    },
    followUpRequired: {
      type: Boolean,
      default: false
    },
    followUpDate: Date,
    contactedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    outcome: {
      type: String,
      required: true,
      enum: ['positive', 'neutral', 'negative', 'no-response']
    },
    nextAction: String
  }],

  // Quotation & Proposal
  quotations: [{
    quotationNumber: {
      type: String,
      required: true
    },
    sentDate: {
      type: Date,
      required: true
    },
    validUntil: {
      type: Date,
      required: true
    },
    amount: {
      type: Number,
      required: true,
      min: [0, 'Amount cannot be negative']
    },
    currency: {
      type: String,
      default: 'INR'
    },
    status: {
      type: String,
      enum: ['draft', 'sent', 'viewed', 'accepted', 'rejected', 'expired'],
      default: 'draft'
    },
    responseDate: Date,
    clientFeedback: String,
    revisionCount: {
      type: Number,
      default: 0
    },
    documentUrl: String
  }],

  // Conversion Tracking
  conversionData: {
    convertedToBooking: {
      type: Boolean,
      default: false
    },
    bookingId: {
      type: Schema.Types.ObjectId,
      ref: 'EventBooking'
    },
    conversionDate: Date,
    conversionValue: Number,
    lostReason: String,
    lostToCompetitor: String
  },

  // Assignment & Ownership
  assignedTo: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Lead must be assigned to someone']
  },

  assignedDate: {
    type: Date,
    required: true,
    default: Date.now
  },

  reassignmentHistory: [{
    from: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    to: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    date: Date,
    reason: String
  }],

  // Timeline & Reminders
  nextFollowUp: Date,
  reminderSet: {
    type: Boolean,
    default: false
  },
  lastContactDate: Date,
  responseTime: Number,

  // Analytics & Scoring
  leadScore: {
    type: Number,
    min: 0,
    max: 100,
    default: 50
  },

  scoreFactors: {
    budgetFit: {
      type: Number,
      min: 0,
      max: 100,
      default: 50
    },
    timingUrgency: {
      type: Number,
      min: 0,
      max: 100,
      default: 50
    },
    decisionMakerContact: {
      type: Boolean,
      default: false
    },
    competitorInvolvement: {
      type: Boolean,
      default: false
    },
    eventComplexity: {
      type: Number,
      min: 0,
      max: 100,
      default: 50
    }
  },

  // Tags & Categories
  tags: [String],
  category: String,

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
  collection: 'eventleads'
});

// Pre-save middleware
EventLeadSchema.pre('save', function() {
  const doc = this as any;
  
  // Generate lead number if not provided
  if (!doc.leadNumber) {
    const date = new Date();
    const dateStr = date.toISOString().slice(2, 10).replace(/-/g, '');
    const timeStr = Date.now().toString().slice(-4);
    doc.leadNumber = `LEAD${dateStr}${timeStr}`;
  }

  // Calculate lead score
  doc.leadScore = doc.calculateLeadScore();

  // Update last contact date if new interaction added
  if (doc.interactions && doc.interactions.length > 0) {
    const lastInteraction = doc.interactions[doc.interactions.length - 1];
    if (lastInteraction.date > (doc.lastContactDate || new Date(0))) {
      doc.lastContactDate = lastInteraction.date;
    }
  }
});

// Indexes
EventLeadSchema.index({ propertyId: 1, leadNumber: 1 }, { unique: true });
EventLeadSchema.index({ propertyId: 1, status: 1 });
EventLeadSchema.index({ assignedTo: 1, status: 1 });
EventLeadSchema.index({ 'eventRequirements.preferredDates': 1 });
EventLeadSchema.index({ nextFollowUp: 1 });
EventLeadSchema.index({ leadScore: -1 });
EventLeadSchema.index({ createdAt: -1 });

// Methods
EventLeadSchema.methods.updateStatus = function(newStatus: string, staffMemberId?: string) {
  const doc = this as any;
  doc.status = newStatus;
  if (staffMemberId) {
    doc.lastUpdatedBy = staffMemberId;
  }
  return doc.save();
};

EventLeadSchema.methods.addInteraction = function(interactionData: any, staffMemberId: string) {
  const doc = this as any;
  doc.interactions = doc.interactions || [];
  
  doc.interactions.push({
    ...interactionData,
    date: interactionData.date || new Date(),
    contactedBy: staffMemberId
  });
  
  doc.lastContactDate = interactionData.date || new Date();
  return doc.save();
};

EventLeadSchema.methods.generateQuotation = function(quotationData: any) {
  const doc = this as any;
  doc.quotations = doc.quotations || [];
  
  const quotationNumber = `QT${Date.now().toString().slice(-6)}`;
  doc.quotations.push({
    ...quotationData,
    quotationNumber,
    sentDate: new Date(),
    revisionCount: 0
  });
  
  doc.status = 'quoted';
  doc.stage = 'proposal';
  
  return doc.save();
};

EventLeadSchema.methods.calculateLeadScore = function() {
  const doc = this as any;
  let score = 0;
  
  // Budget fit (25 points)
  score += doc.scoreFactors.budgetFit * 0.25;
  
  // Timing urgency (20 points)
  score += doc.scoreFactors.timingUrgency * 0.20;
  
  // Decision maker contact (15 points)
  if (doc.scoreFactors.decisionMakerContact) {
    score += 15;
  }
  
  // Competitor involvement (-10 points if involved)
  if (doc.scoreFactors.competitorInvolvement) {
    score -= 10;
  }
  
  // Event complexity (15 points)
  score += doc.scoreFactors.eventComplexity * 0.15;
  
  // Interaction recency (15 points)
  if (doc.lastContactDate) {
    const daysSinceContact = (Date.now() - doc.lastContactDate.getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceContact <= 3) score += 15;
    else if (daysSinceContact <= 7) score += 10;
    else if (daysSinceContact <= 14) score += 5;
  }
  
  // Source quality (10 points)
  const sourceScores = {
    'referral': 10,
    'website': 8,
    'phone': 6,
    'email': 5,
    'walk-in': 7,
    'social-media': 4,
    'advertisement': 3,
    'other': 2
  };
  score += sourceScores[doc.source as keyof typeof sourceScores] || 0;
  
  return Math.max(0, Math.min(100, Math.round(score)));
};

// Static methods
EventLeadSchema.statics.findByProperty = function(propertyId: string) {
  return this.find({ propertyId, isActive: true }).sort({ createdAt: -1 });
};

EventLeadSchema.statics.findHighPriorityLeads = function(propertyId: string) {
  return this.find({ 
    propertyId, 
    isActive: true, 
    priority: { $in: ['high', 'urgent'] },
    status: { $nin: ['won', 'lost'] }
  }).sort({ leadScore: -1 });
};

EventLeadSchema.statics.findOverdueFollowUps = function(propertyId: string) {
  return this.find({
    propertyId,
    isActive: true,
    nextFollowUp: { $lt: new Date() },
    status: { $nin: ['won', 'lost'] }
  }).sort({ nextFollowUp: 1 });
};

EventLeadSchema.statics.getConversionStats = function(propertyId: string, startDate: Date, endDate: Date) {
  return this.aggregate([
    {
      $match: {
        propertyId,
        createdAt: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: null,
        totalLeads: { $sum: 1 },
        convertedLeads: { 
          $sum: { $cond: ['$conversionData.convertedToBooking', 1, 0] }
        },
        totalValue: { 
          $sum: { $ifNull: ['$conversionData.conversionValue', 0] }
        },
        averageLeadScore: { $avg: '$leadScore' }
      }
    },
    {
      $project: {
        totalLeads: 1,
        convertedLeads: 1,
        conversionRate: { 
          $multiply: [{ $divide: ['$convertedLeads', '$totalLeads'] }, 100]
        },
        totalValue: 1,
        averageLeadScore: { $round: ['$averageLeadScore', 1] }
      }
    }
  ]);
};

const EventLead = models.EventLead || model('EventLead', EventLeadSchema);

export default EventLead;