import mongoose, { Schema, Document, Types, models, model } from 'mongoose';

export interface IEventFeedback extends Document {
  _id: Types.ObjectId;
  propertyId: Types.ObjectId;
  eventBookingId: Types.ObjectId;
  feedbackNumber: string;

  // Event & Client Information
  eventDetails: {
    eventName: string;
    eventDate: Date;
    eventType: string;
    venueId: Types.ObjectId;
    venueName: string;
  };

  client: {
    name: string;
    email: string;
    phone: string;
    company?: string;
  };

  // Feedback Collection
  feedbackConfig: {
    collectionMethod: 'email' | 'sms' | 'call' | 'in-person' | 'qr-code' | 'mobile-app';
    sentDate?: Date;
    responseDate?: Date;
    remindersSent: number;
    maxReminders: number;
    reminderInterval: number; // hours
    autoFollowUp: boolean;
    incentiveOffered?: {
      type: 'discount' | 'gift' | 'points' | 'other';
      description: string;
      value: number;
    };
  };

  // Overall Ratings (1-10 scale)
  overallRatings: {
    overallSatisfaction: number;
    valueForMoney: number;
    likelinessToRecommend: number;
    likelinessToRebook: number;
  };

  // Detailed Service Ratings
  serviceRatings: {
    // Venue & Setup
    venue: {
      location: number;
      ambiance: number;
      cleanliness: number;
      capacity: number;
      accessibility: number;
      facilities: number;
    };

    // Food & Beverage
    catering?: {
      foodQuality: number;
      foodPresentation: number;
      foodVariety: number;
      beverageQuality: number;
      serviceSpeed: number;
      dietaryAccommodation: number;
    };

    // Service & Staff
    service: {
      staffProfessionalism: number;
      staffAttentiveness: number;
      eventCoordination: number;
      responsiveness: number;
      problemResolution: number;
      communication: number;
    };

    // Decoration & Ambiance
    decoration?: {
      themeExecution: number;
      creativity: number;
      setupQuality: number;
      floralArrangements: number;
      lighting: number;
      overall: number;
    };

    // Equipment & Technical
    equipment?: {
      audioVisual: number;
      soundQuality: number;
      lightingEffects: number;
      equipmentReliability: number;
      technicalSupport: number;
    };

    // Entertainment
    entertainment?: {
      performanceQuality: number;
      audienceEngagement: number;
      professionalism: number;
      timeliness: number;
      appropriateness: number;
    };

    // Photography/Videography
    photography?: {
      photoQuality: number;
      videoQuality: number;
      coverage: number;
      creativity: number;
      delivery: number;
      professionalism: number;
    };
  };

  // Timeline & Execution Feedback
  executionFeedback: {
    planningPhase: {
      communicationClarity: number;
      responsivenessToRequests: number;
      timelyDelivery: number;
      flexibilityWithChanges: number;
    };

    eventDay: {
      punctuality: number;
      setupEfficiency: number;
      coordinationSmooth: number;
      issueHandling: number;
      overallExecution: number;
    };

    postEvent: {
      cleanupEfficiency: number;
      finalBillingAccuracy: number;
      documentDelivery: number;
      followUpSatisfaction: number;
    };
  };

  // Open-ended Feedback
  qualitativeFeedback: {
    bestAspects: string[];
    improvementAreas: string[];
    specificComplaints?: string[];
    specificCompliments?: string[];
    additionalServices?: string[];
    overallComments?: string;
    
    // Detailed feedback by category
    venueComments?: string;
    cateringComments?: string;
    serviceComments?: string;
    decorationComments?: string;
    entertainmentComments?: string;
    coordinationComments?: string;
  };

  // Net Promoter Score (NPS) Analysis
  npsData: {
    score: number; // 0-10
    category: 'detractor' | 'passive' | 'promoter';
    reason?: string;
    improvementSuggestions?: string[];
  };

  // Testimonial & Reviews
  testimonial?: {
    content: string;
    approved: boolean;
    approvedBy?: Types.ObjectId;
    approvedDate?: Date;
    useForMarketing: boolean;
    platformsToShare: string[];
    clientConsent: boolean;
    mediaAttachments?: string[];
  };

  // Review Platform Integration
  platformReviews: [{
    platform: 'google' | 'facebook' | 'instagram' | 'website' | 'weddingwire' | 'zola' | 'other';
    rating: number;
    reviewText?: string;
    reviewUrl?: string;
    postedDate?: Date;
    verified: boolean;
    response?: {
      responseText: string;
      responseDate: Date;
      respondedBy: Types.ObjectId;
    };
  }];

  // Issues & Complaints
  issues: [{
    category: 'service' | 'food' | 'venue' | 'staff' | 'billing' | 'coordination' | 'equipment' | 'other';
    severity: 'minor' | 'moderate' | 'serious' | 'critical';
    description: string;
    reportedDate: Date;
    status: 'reported' | 'acknowledged' | 'investigating' | 'resolved' | 'closed';
    assignedTo?: Types.ObjectId;
    resolution?: {
      action: string;
      resolvedDate: Date;
      resolvedBy: Types.ObjectId;
      clientSatisfaction: number; // 1-5
      preventiveActions: string[];
    };
    compensation?: {
      type: 'refund' | 'discount' | 'free-service' | 'upgrade' | 'other';
      amount: number;
      description: string;
      approved: boolean;
      approvedBy?: Types.ObjectId;
    };
  }];

  // Follow-up Actions
  followUpActions: [{
    action: 'thank-you-note' | 'testimonial-request' | 'review-request' | 'referral-program' | 'future-bookings' | 'issue-resolution' | 'other';
    scheduled: boolean;
    scheduledDate?: Date;
    completed: boolean;
    completedDate?: Date;
    completedBy?: Types.ObjectId;
    notes?: string;
    outcome?: string;
  }];

  // Analytics & Insights
  analytics: {
    responseTime: number; // hours from request to response
    completionTime: number; // minutes to complete feedback
    deviceUsed?: 'mobile' | 'desktop' | 'tablet';
    browser?: string;
    location?: string;
    
    // Sentiment Analysis
    sentimentAnalysis?: {
      overallSentiment: 'positive' | 'neutral' | 'negative';
      positiveKeywords: string[];
      negativeKeywords: string[];
      emotionalTone: string[];
      confidenceScore: number;
    };
    
    // Response Quality
    responseQuality: {
      completenessScore: number; // 0-100
      detailScore: number; // 0-100
      helpfulnessScore: number; // 0-100
    };
  };

  // Team Performance Insights
  teamInsights: {
    topPerformers: [{
      staffMemberId: Types.ObjectId;
      staffName: string;
      role: string;
      rating: number;
      mentions: number;
      positiveComments: string[];
    }];
    
    improvementAreas: [{
      area: string;
      staffMemberId?: Types.ObjectId;
      frequency: number;
      impact: 'low' | 'medium' | 'high';
      actionRequired: string;
    }];
  };

  // Competitive Analysis
  competitiveInsights?: {
    mentionedCompetitors: string[];
    comparisons: [{
      competitor: string;
      aspect: string;
      comparison: 'better' | 'same' | 'worse';
      comments?: string;
    }];
    priceComparison?: {
      ourPrice: number;
      competitorPrice: number;
      pricePerception: 'expensive' | 'fair' | 'cheap';
    };
  };

  // Status & Metadata
  status: 'pending' | 'partial' | 'completed' | 'analyzed' | 'archived';
  completionPercentage: number;
  
  // Integration flags
  integrations: {
    crmUpdated: boolean;
    reviewPlatformsNotified: boolean;
    analyticsProcessed: boolean;
    teamNotified: boolean;
    marketingTeamNotified: boolean;
  };

  // Quality Assurance
  qualityCheck: {
    reviewedBy?: Types.ObjectId;
    reviewedDate?: Date;
    verified: boolean;
    flagged: boolean;
    flagReason?: string;
    notes?: string;
  };

  // Metadata
  isActive: boolean;
  createdBy: Types.ObjectId;
  lastUpdatedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;

  // Methods
  calculateNPS(): number;
  generateInsights(): any;
  sendFollowUp(action: string): Promise<boolean>;
  updateTeamPerformance(): Promise<void>;
  exportReport(): Promise<any>;
}

const EventFeedbackSchema = new Schema<IEventFeedback>({
  propertyId: {
    type: Schema.Types.ObjectId,
    ref: 'Property',
    required: [true, 'Property ID is required'],
    index: true
  },

  eventBookingId: {
    type: Schema.Types.ObjectId,
    ref: 'EventBooking',
    required: [true, 'Event Booking ID is required'],
    index: true
  },

  feedbackNumber: {
    type: String,
    required: [true, 'Feedback number is required'],
    unique: true,
    trim: true
  },

  // Event & Client Information
  eventDetails: {
    eventName: {
      type: String,
      required: [true, 'Event name is required']
    },
    eventDate: {
      type: Date,
      required: [true, 'Event date is required']
    },
    eventType: {
      type: String,
      required: [true, 'Event type is required']
    },
    venueId: {
      type: Schema.Types.ObjectId,
      ref: 'EventVenue',
      required: [true, 'Venue ID is required']
    },
    venueName: {
      type: String,
      required: [true, 'Venue name is required']
    }
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
    company: String
  },

  // Feedback Configuration
  feedbackConfig: {
    collectionMethod: {
      type: String,
      required: [true, 'Collection method is required'],
      enum: {
        values: ['email', 'sms', 'call', 'in-person', 'qr-code', 'mobile-app'],
        message: 'Invalid collection method'
      }
    },
    sentDate: Date,
    responseDate: Date,
    remindersSent: {
      type: Number,
      default: 0,
      min: [0, 'Reminders sent cannot be negative']
    },
    maxReminders: {
      type: Number,
      default: 3,
      min: [0, 'Max reminders cannot be negative']
    },
    reminderInterval: {
      type: Number,
      default: 24,
      min: [1, 'Reminder interval must be at least 1 hour']
    },
    autoFollowUp: {
      type: Boolean,
      default: true
    },
    incentiveOffered: {
      type: {
        type: String,
        enum: ['discount', 'gift', 'points', 'other']
      },
      description: String,
      value: {
        type: Number,
        min: [0, 'Incentive value cannot be negative']
      }
    }
  },

  // Overall Ratings
  overallRatings: {
    overallSatisfaction: {
      type: Number,
      min: [1, 'Rating must be between 1 and 10'],
      max: [10, 'Rating must be between 1 and 10']
    },
    valueForMoney: {
      type: Number,
      min: [1, 'Rating must be between 1 and 10'],
      max: [10, 'Rating must be between 1 and 10']
    },
    likelinessToRecommend: {
      type: Number,
      min: [1, 'Rating must be between 1 and 10'],
      max: [10, 'Rating must be between 1 and 10']
    },
    likelinessToRebook: {
      type: Number,
      min: [1, 'Rating must be between 1 and 10'],
      max: [10, 'Rating must be between 1 and 10']
    }
  },

  // Detailed Service Ratings
  serviceRatings: {
    venue: {
      location: { type: Number, min: 1, max: 10 },
      ambiance: { type: Number, min: 1, max: 10 },
      cleanliness: { type: Number, min: 1, max: 10 },
      capacity: { type: Number, min: 1, max: 10 },
      accessibility: { type: Number, min: 1, max: 10 },
      facilities: { type: Number, min: 1, max: 10 }
    },

    catering: {
      foodQuality: { type: Number, min: 1, max: 10 },
      foodPresentation: { type: Number, min: 1, max: 10 },
      foodVariety: { type: Number, min: 1, max: 10 },
      beverageQuality: { type: Number, min: 1, max: 10 },
      serviceSpeed: { type: Number, min: 1, max: 10 },
      dietaryAccommodation: { type: Number, min: 1, max: 10 }
    },

    service: {
      staffProfessionalism: { type: Number, min: 1, max: 10 },
      staffAttentiveness: { type: Number, min: 1, max: 10 },
      eventCoordination: { type: Number, min: 1, max: 10 },
      responsiveness: { type: Number, min: 1, max: 10 },
      problemResolution: { type: Number, min: 1, max: 10 },
      communication: { type: Number, min: 1, max: 10 }
    },

    decoration: {
      themeExecution: { type: Number, min: 1, max: 10 },
      creativity: { type: Number, min: 1, max: 10 },
      setupQuality: { type: Number, min: 1, max: 10 },
      floralArrangements: { type: Number, min: 1, max: 10 },
      lighting: { type: Number, min: 1, max: 10 },
      overall: { type: Number, min: 1, max: 10 }
    },

    equipment: {
      audioVisual: { type: Number, min: 1, max: 10 },
      soundQuality: { type: Number, min: 1, max: 10 },
      lightingEffects: { type: Number, min: 1, max: 10 },
      equipmentReliability: { type: Number, min: 1, max: 10 },
      technicalSupport: { type: Number, min: 1, max: 10 }
    },

    entertainment: {
      performanceQuality: { type: Number, min: 1, max: 10 },
      audienceEngagement: { type: Number, min: 1, max: 10 },
      professionalism: { type: Number, min: 1, max: 10 },
      timeliness: { type: Number, min: 1, max: 10 },
      appropriateness: { type: Number, min: 1, max: 10 }
    },

    photography: {
      photoQuality: { type: Number, min: 1, max: 10 },
      videoQuality: { type: Number, min: 1, max: 10 },
      coverage: { type: Number, min: 1, max: 10 },
      creativity: { type: Number, min: 1, max: 10 },
      delivery: { type: Number, min: 1, max: 10 },
      professionalism: { type: Number, min: 1, max: 10 }
    }
  },

  // Timeline & Execution Feedback
  executionFeedback: {
    planningPhase: {
      communicationClarity: { type: Number, min: 1, max: 10 },
      responsivenessToRequests: { type: Number, min: 1, max: 10 },
      timelyDelivery: { type: Number, min: 1, max: 10 },
      flexibilityWithChanges: { type: Number, min: 1, max: 10 }
    },

    eventDay: {
      punctuality: { type: Number, min: 1, max: 10 },
      setupEfficiency: { type: Number, min: 1, max: 10 },
      coordinationSmooth: { type: Number, min: 1, max: 10 },
      issueHandling: { type: Number, min: 1, max: 10 },
      overallExecution: { type: Number, min: 1, max: 10 }
    },

    postEvent: {
      cleanupEfficiency: { type: Number, min: 1, max: 10 },
      finalBillingAccuracy: { type: Number, min: 1, max: 10 },
      documentDelivery: { type: Number, min: 1, max: 10 },
      followUpSatisfaction: { type: Number, min: 1, max: 10 }
    }
  },

  // Open-ended Feedback
  qualitativeFeedback: {
    bestAspects: [String],
    improvementAreas: [String],
    specificComplaints: [String],
    specificCompliments: [String],
    additionalServices: [String],
    overallComments: String,
    venueComments: String,
    cateringComments: String,
    serviceComments: String,
    decorationComments: String,
    entertainmentComments: String,
    coordinationComments: String
  },

  // Net Promoter Score
  npsData: {
    score: {
      type: Number,
      min: [0, 'NPS score must be between 0 and 10'],
      max: [10, 'NPS score must be between 0 and 10']
    },
    category: {
      type: String,
      enum: {
        values: ['detractor', 'passive', 'promoter'],
        message: 'Invalid NPS category'
      }
    },
    reason: String,
    improvementSuggestions: [String]
  },

  // Testimonial
  testimonial: {
    content: String,
    approved: {
      type: Boolean,
      default: false
    },
    approvedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    approvedDate: Date,
    useForMarketing: {
      type: Boolean,
      default: false
    },
    platformsToShare: [String],
    clientConsent: {
      type: Boolean,
      default: false
    },
    mediaAttachments: [String]
  },

  // Platform Reviews
  platformReviews: [{
    platform: {
      type: String,
      required: true,
      enum: ['google', 'facebook', 'instagram', 'website', 'weddingwire', 'zola', 'other']
    },
    rating: {
      type: Number,
      required: true,
      min: [1, 'Rating must be between 1 and 5'],
      max: [5, 'Rating must be between 1 and 5']
    },
    reviewText: String,
    reviewUrl: String,
    postedDate: Date,
    verified: {
      type: Boolean,
      default: false
    },
    response: {
      responseText: String,
      responseDate: Date,
      respondedBy: {
        type: Schema.Types.ObjectId,
        ref: 'User'
      }
    }
  }],

  // Issues & Complaints
  issues: [{
    category: {
      type: String,
      required: true,
      enum: ['service', 'food', 'venue', 'staff', 'billing', 'coordination', 'equipment', 'other']
    },
    severity: {
      type: String,
      required: true,
      enum: ['minor', 'moderate', 'serious', 'critical']
    },
    description: {
      type: String,
      required: true
    },
    reportedDate: {
      type: Date,
      required: true,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['reported', 'acknowledged', 'investigating', 'resolved', 'closed'],
      default: 'reported'
    },
    assignedTo: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    resolution: {
      action: String,
      resolvedDate: Date,
      resolvedBy: {
        type: Schema.Types.ObjectId,
        ref: 'User'
      },
      clientSatisfaction: {
        type: Number,
        min: 1,
        max: 5
      },
      preventiveActions: [String]
    },
    compensation: {
      type: {
        type: String,
        enum: ['refund', 'discount', 'free-service', 'upgrade', 'other']
      },
      amount: {
        type: Number,
        min: 0
      },
      description: String,
      approved: {
        type: Boolean,
        default: false
      },
      approvedBy: {
        type: Schema.Types.ObjectId,
        ref: 'User'
      }
    }
  }],

  // Follow-up Actions
  followUpActions: [{
    action: {
      type: String,
      required: true,
      enum: ['thank-you-note', 'testimonial-request', 'review-request', 'referral-program', 'future-bookings', 'issue-resolution', 'other']
    },
    scheduled: {
      type: Boolean,
      default: false
    },
    scheduledDate: Date,
    completed: {
      type: Boolean,
      default: false
    },
    completedDate: Date,
    completedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    notes: String,
    outcome: String
  }],

  // Analytics
  analytics: {
    responseTime: {
      type: Number,
      min: [0, 'Response time cannot be negative']
    },
    completionTime: {
      type: Number,
      min: [0, 'Completion time cannot be negative']
    },
    deviceUsed: {
      type: String,
      enum: ['mobile', 'desktop', 'tablet']
    },
    browser: String,
    location: String,

    sentimentAnalysis: {
      overallSentiment: {
        type: String,
        enum: ['positive', 'neutral', 'negative']
      },
      positiveKeywords: [String],
      negativeKeywords: [String],
      emotionalTone: [String],
      confidenceScore: {
        type: Number,
        min: [0, 'Confidence score must be between 0 and 1'],
        max: [1, 'Confidence score must be between 0 and 1']
      }
    },

    responseQuality: {
      completenessScore: {
        type: Number,
        min: [0, 'Score must be between 0 and 100'],
        max: [100, 'Score must be between 0 and 100'],
        default: 0
      },
      detailScore: {
        type: Number,
        min: [0, 'Score must be between 0 and 100'],
        max: [100, 'Score must be between 0 and 100'],
        default: 0
      },
      helpfulnessScore: {
        type: Number,
        min: [0, 'Score must be between 0 and 100'],
        max: [100, 'Score must be between 0 and 100'],
        default: 0
      }
    }
  },

  // Team Insights
  teamInsights: {
    topPerformers: [{
      staffMemberId: {
        type: Schema.Types.ObjectId,
        ref: 'User'
      },
      staffName: String,
      role: String,
      rating: Number,
      mentions: Number,
      positiveComments: [String]
    }],

    improvementAreas: [{
      area: String,
      staffMemberId: {
        type: Schema.Types.ObjectId,
        ref: 'User'
      },
      frequency: Number,
      impact: {
        type: String,
        enum: ['low', 'medium', 'high']
      },
      actionRequired: String
    }]
  },

  // Competitive Insights
  competitiveInsights: {
    mentionedCompetitors: [String],
    comparisons: [{
      competitor: String,
      aspect: String,
      comparison: {
        type: String,
        enum: ['better', 'same', 'worse']
      },
      comments: String
    }],
    priceComparison: {
      ourPrice: Number,
      competitorPrice: Number,
      pricePerception: {
        type: String,
        enum: ['expensive', 'fair', 'cheap']
      }
    }
  },

  // Status
  status: {
    type: String,
    required: true,
    enum: {
      values: ['pending', 'partial', 'completed', 'analyzed', 'archived'],
      message: 'Invalid status'
    },
    default: 'pending'
  },

  completionPercentage: {
    type: Number,
    min: [0, 'Completion percentage must be between 0 and 100'],
    max: [100, 'Completion percentage must be between 0 and 100'],
    default: 0
  },

  // Integrations
  integrations: {
    crmUpdated: {
      type: Boolean,
      default: false
    },
    reviewPlatformsNotified: {
      type: Boolean,
      default: false
    },
    analyticsProcessed: {
      type: Boolean,
      default: false
    },
    teamNotified: {
      type: Boolean,
      default: false
    },
    marketingTeamNotified: {
      type: Boolean,
      default: false
    }
  },

  // Quality Check
  qualityCheck: {
    reviewedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    reviewedDate: Date,
    verified: {
      type: Boolean,
      default: false
    },
    flagged: {
      type: Boolean,
      default: false
    },
    flagReason: String,
    notes: String
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
  collection: 'eventfeedbacks'
});

// Pre-save middleware
EventFeedbackSchema.pre('save', function() {
  const doc = this as any;
  
  // Generate feedback number if not provided
  if (!doc.feedbackNumber) {
    const date = new Date();
    const dateStr = date.toISOString().slice(2, 10).replace(/-/g, '');
    const timeStr = Date.now().toString().slice(-4);
    doc.feedbackNumber = `FB${dateStr}${timeStr}`;
  }

  // Calculate NPS category
  if (doc.npsData?.score !== undefined) {
    if (doc.npsData.score >= 9) {
      doc.npsData.category = 'promoter';
    } else if (doc.npsData.score >= 7) {
      doc.npsData.category = 'passive';
    } else {
      doc.npsData.category = 'detractor';
    }
  }

  // Calculate completion percentage
  let totalFields = 0;
  let completedFields = 0;

  // Count required feedback fields
  const checkObject = (obj: any, path = '') => {
    for (const key in obj) {
      if (obj[key] !== null && obj[key] !== undefined && obj[key] !== '') {
        if (typeof obj[key] === 'object' && !Array.isArray(obj[key])) {
          checkObject(obj[key], `${path}${key}.`);
        } else {
          totalFields++;
          if (Array.isArray(obj[key]) ? obj[key].length > 0 : true) {
            completedFields++;
          }
        }
      } else {
        totalFields++;
      }
    }
  };

  if (doc.overallRatings) checkObject(doc.overallRatings);
  if (doc.serviceRatings) checkObject(doc.serviceRatings);
  if (doc.executionFeedback) checkObject(doc.executionFeedback);
  if (doc.qualitativeFeedback) checkObject(doc.qualitativeFeedback);
  if (doc.npsData) checkObject(doc.npsData);

  doc.completionPercentage = totalFields > 0 ? Math.round((completedFields / totalFields) * 100) : 0;

  // Update status based on completion
  if (doc.completionPercentage === 100) {
    doc.status = 'completed';
  } else if (doc.completionPercentage > 0) {
    doc.status = 'partial';
  }
});

// Indexes
EventFeedbackSchema.index({ propertyId: 1, feedbackNumber: 1 }, { unique: true });
EventFeedbackSchema.index({ eventBookingId: 1 });
EventFeedbackSchema.index({ status: 1 });
EventFeedbackSchema.index({ 'eventDetails.eventDate': -1 });
EventFeedbackSchema.index({ 'npsData.score': -1 });
EventFeedbackSchema.index({ 'overallRatings.overallSatisfaction': -1 });
EventFeedbackSchema.index({ createdAt: -1 });

// Methods
EventFeedbackSchema.methods.calculateNPS = function() {
  const doc = this as any;
  if (!doc.npsData?.score) return 0;
  
  // This would typically be calculated across multiple feedbacks
  // For now, return the individual score normalized to NPS scale
  return (doc.npsData.score - 5) * 20; // Convert 1-10 to -100 to 100
};

EventFeedbackSchema.methods.generateInsights = function() {
  const doc = this as any;
  
  const insights = {
    strengths: [],
    weaknesses: [],
    actionItems: [],
    teamPerformance: {},
    overallScore: 0
  };

  // Calculate overall score from ratings
  if (doc.overallRatings) {
    const ratings = Object.values(doc.overallRatings).filter(r => typeof r === 'number');
    insights.overallScore = ratings.length > 0 
      ? Math.round(ratings.reduce((sum: number, rating: any) => sum + rating, 0) / ratings.length)
      : 0;
  }

  // Identify strengths (ratings >= 8)
  const analyzeRatings = (obj: any, prefix = '') => {
    for (const key in obj) {
      if (typeof obj[key] === 'number' && obj[key] >= 8) {
        insights.strengths.push(`${prefix}${key}: ${obj[key]}/10`);
      } else if (typeof obj[key] === 'number' && obj[key] <= 5) {
        insights.weaknesses.push(`${prefix}${key}: ${obj[key]}/10`);
      } else if (typeof obj[key] === 'object') {
        analyzeRatings(obj[key], `${prefix}${key} - `);
      }
    }
  };

  if (doc.serviceRatings) analyzeRatings(doc.serviceRatings);
  if (doc.executionFeedback) analyzeRatings(doc.executionFeedback);

  return insights;
};

EventFeedbackSchema.methods.sendFollowUp = function(action: string) {
  const doc = this as any;
  
  // Find or create follow-up action
  let followUp = doc.followUpActions?.find((fa: any) => fa.action === action);
  if (!followUp) {
    doc.followUpActions = doc.followUpActions || [];
    followUp = {
      action,
      scheduled: true,
      scheduledDate: new Date(),
      completed: false
    };
    doc.followUpActions.push(followUp);
  }

  return doc.save().then(() => {
    // Implementation would send actual follow-up (email, SMS, etc.)
    return true;
  });
};

EventFeedbackSchema.methods.updateTeamPerformance = function() {
  // This would analyze feedback and update team performance metrics
  return this.save();
};

EventFeedbackSchema.methods.exportReport = function() {
  const doc = this as any;
  
  return {
    eventDetails: doc.eventDetails,
    client: doc.client,
    overallScore: doc.generateInsights().overallScore,
    npsScore: doc.npsData?.score,
    npsCategory: doc.npsData?.category,
    completionPercentage: doc.completionPercentage,
    strengths: doc.generateInsights().strengths,
    weaknesses: doc.generateInsights().weaknesses,
    testimonial: doc.testimonial?.content,
    issues: doc.issues?.length || 0,
    createdAt: doc.createdAt
  };
};

const EventFeedback = models.EventFeedback || model('EventFeedback', EventFeedbackSchema);

export default EventFeedback;