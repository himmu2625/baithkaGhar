import mongoose, { Document, Schema } from 'mongoose';

export interface IStaffTraining extends Document {
  // Basic Information
  trainingId: string;
  staffId: mongoose.Types.ObjectId;
  propertyId: mongoose.Types.ObjectId;
  trainingType: 'mandatory' | 'optional' | 'certification' | 'skill_development' | 'compliance' | 'safety';
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled' | 'failed';

  // Training Details
  title: string;
  description: string;
  category: 'technical' | 'soft_skills' | 'safety' | 'compliance' | 'leadership' | 'customer_service';
  provider: string;
  instructor?: string;
  location: string;
  format: 'in-person' | 'virtual' | 'hybrid' | 'self-paced' | 'workshop';

  // Schedule & Duration
  startDate: Date;
  endDate: Date;
  duration: number; // in hours
  schedule: {
    startTime: string;
    endTime: string;
    daysOfWeek: number[]; // 0-6 (Sunday-Saturday)
    timezone: string;
  };

  // Progress & Assessment
  progress: number; // 0-100 percentage
  score?: number; // 0-100
  grade?: 'A' | 'B' | 'C' | 'D' | 'F' | 'pass' | 'fail';
  assessmentMethod: 'exam' | 'practical' | 'project' | 'observation' | 'self-assessment' | 'none';
  certificate?: string;
  certificateUrl?: string;
  certificateExpiryDate?: Date;

  // Content & Materials
  materials: Array<{
    type: 'document' | 'video' | 'presentation' | 'link' | 'other';
    title: string;
    url: string;
    description?: string;
    required: boolean;
  }>;
  prerequisites: Array<{
    trainingId: mongoose.Types.ObjectId;
    title: string;
    status: 'completed' | 'pending' | 'not_required';
  }>;

  // Cost & Budget
  cost: {
    amount: number;
    currency: string;
    paidBy: 'company' | 'employee' | 'shared';
    reimbursementStatus: 'pending' | 'approved' | 'rejected' | 'paid';
    paymentDate?: Date;
  };

  // Feedback & Evaluation
  feedback: {
    instructorRating?: number; // 1-5 scale
    contentRating?: number; // 1-5 scale
    relevanceRating?: number; // 1-5 scale
    overallRating?: number; // 1-5 scale
    comments?: string;
    suggestions?: string;
    wouldRecommend?: boolean;
  };

  // Impact & Outcomes
  outcomes: {
    skillImprovement: number; // 0-100
    knowledgeGained: number; // 0-100
    confidenceBoost: number; // 0-100
    performanceImpact: number; // 0-100
    careerDevelopment: number; // 0-100
    notes?: string;
  };

  // Compliance & Requirements
  compliance: {
    isMandatory: boolean;
    regulatoryRequirement?: string;
    renewalRequired: boolean;
    renewalPeriod?: number; // in months
    lastRenewalDate?: Date;
    nextRenewalDate?: Date;
    complianceStatus: 'compliant' | 'non-compliant' | 'pending' | 'expired';
  };

  // Notifications & Reminders
  notifications: {
    registrationReminder: boolean;
    startDateReminder: boolean;
    completionReminder: boolean;
    certificateExpiryReminder: boolean;
    renewalReminder: boolean;
  };

  // Documents & Attachments
  documents: Array<{
    type: string;
    name: string;
    url: string;
    uploadedAt: Date;
    uploadedBy: mongoose.Types.ObjectId;
  }>;

  // System Tracking
  createdBy: mongoose.Types.ObjectId;
  lastModifiedBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const StaffTrainingSchema = new Schema<IStaffTraining>({
  // Basic Information
  trainingId: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  staffId: {
    type: Schema.Types.ObjectId,
    ref: 'Staff',
    required: true
  },
  propertyId: {
    type: Schema.Types.ObjectId,
    ref: 'Property',
    required: true
  },
  trainingType: {
    type: String,
    enum: ['mandatory', 'optional', 'certification', 'skill_development', 'compliance', 'safety'],
    required: true
  },
  status: {
    type: String,
    enum: ['scheduled', 'in-progress', 'completed', 'cancelled', 'failed'],
    default: 'scheduled'
  },

  // Training Details
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  category: {
    type: String,
    enum: ['technical', 'soft_skills', 'safety', 'compliance', 'leadership', 'customer_service'],
    required: true
  },
  provider: {
    type: String,
    required: true
  },
  instructor: String,
  location: {
    type: String,
    required: true
  },
  format: {
    type: String,
    enum: ['in-person', 'virtual', 'hybrid', 'self-paced', 'workshop'],
    required: true
  },

  // Schedule & Duration
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  duration: {
    type: Number,
    required: true
  },
  schedule: {
    startTime: String,
    endTime: String,
    daysOfWeek: [Number],
    timezone: { type: String, default: 'UTC' }
  },

  // Progress & Assessment
  progress: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  score: {
    type: Number,
    min: 0,
    max: 100
  },
  grade: {
    type: String,
    enum: ['A', 'B', 'C', 'D', 'F', 'pass', 'fail']
  },
  assessmentMethod: {
    type: String,
    enum: ['exam', 'practical', 'project', 'observation', 'self-assessment', 'none'],
    default: 'none'
  },
  certificate: String,
  certificateUrl: String,
  certificateExpiryDate: Date,

  // Content & Materials
  materials: [{
    type: {
      type: String,
      enum: ['document', 'video', 'presentation', 'link', 'other'],
      required: true
    },
    title: { type: String, required: true },
    url: { type: String, required: true },
    description: String,
    required: { type: Boolean, default: false }
  }],
  prerequisites: [{
    trainingId: {
      type: Schema.Types.ObjectId,
      ref: 'StaffTraining',
      required: true
    },
    title: { type: String, required: true },
    status: {
      type: String,
      enum: ['completed', 'pending', 'not_required'],
      default: 'pending'
    }
  }],

  // Cost & Budget
  cost: {
    amount: { type: Number, default: 0 },
    currency: { type: String, default: 'INR' },
    paidBy: {
      type: String,
      enum: ['company', 'employee', 'shared'],
      default: 'company'
    },
    reimbursementStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'paid'],
      default: 'pending'
    },
    paymentDate: Date
  },

  // Feedback & Evaluation
  feedback: {
    instructorRating: {
      type: Number,
      min: 1,
      max: 5
    },
    contentRating: {
      type: Number,
      min: 1,
      max: 5
    },
    relevanceRating: {
      type: Number,
      min: 1,
      max: 5
    },
    overallRating: {
      type: Number,
      min: 1,
      max: 5
    },
    comments: String,
    suggestions: String,
    wouldRecommend: Boolean
  },

  // Impact & Outcomes
  outcomes: {
    skillImprovement: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    knowledgeGained: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    confidenceBoost: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    performanceImpact: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    careerDevelopment: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    notes: String
  },

  // Compliance & Requirements
  compliance: {
    isMandatory: { type: Boolean, default: false },
    regulatoryRequirement: String,
    renewalRequired: { type: Boolean, default: false },
    renewalPeriod: Number,
    lastRenewalDate: Date,
    nextRenewalDate: Date,
    complianceStatus: {
      type: String,
      enum: ['compliant', 'non-compliant', 'pending', 'expired'],
      default: 'pending'
    }
  },

  // Notifications & Reminders
  notifications: {
    registrationReminder: { type: Boolean, default: true },
    startDateReminder: { type: Boolean, default: true },
    completionReminder: { type: Boolean, default: true },
    certificateExpiryReminder: { type: Boolean, default: true },
    renewalReminder: { type: Boolean, default: true }
  },

  // Documents & Attachments
  documents: [{
    type: { type: String, required: true },
    name: { type: String, required: true },
    url: { type: String, required: true },
    uploadedAt: { type: Date, required: true },
    uploadedBy: {
      type: Schema.Types.ObjectId,
      ref: 'Staff',
      required: true
    }
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
StaffTrainingSchema.index({ staffId: 1, startDate: 1 });
StaffTrainingSchema.index({ propertyId: 1, status: 1 });
StaffTrainingSchema.index({ trainingType: 1, status: 1 });
StaffTrainingSchema.index({ category: 1, status: 1 });
StaffTrainingSchema.index({ 'compliance.complianceStatus': 1 });

// Virtual for training duration in days
StaffTrainingSchema.virtual('durationInDays').get(function() {
  if (!this.startDate || !this.endDate) return 0;
  const start = new Date(this.startDate);
  const end = new Date(this.endDate);
  return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
});

// Virtual for is completed
StaffTrainingSchema.virtual('isCompleted').get(function() {
  return this.status === 'completed';
});

// Virtual for is overdue
StaffTrainingSchema.virtual('isOverdue').get(function() {
  if (this.status !== 'scheduled' && this.status !== 'in-progress') return false;
  return new Date() > this.endDate;
});

// Virtual for average feedback rating
StaffTrainingSchema.virtual('averageFeedbackRating').get(function() {
  const ratings = [
    this.feedback.instructorRating,
    this.feedback.contentRating,
    this.feedback.relevanceRating,
    this.feedback.overallRating
  ].filter(rating => rating !== undefined);
  
  if (ratings.length === 0) return 0;
  return ratings.reduce((sum: number, rating: number) => sum + rating, 0) / ratings.length;
});

// Virtual for overall impact score
StaffTrainingSchema.virtual('overallImpactScore').get(function() {
  const scores = [
    this.outcomes.skillImprovement,
    this.outcomes.knowledgeGained,
    this.outcomes.confidenceBoost,
    this.outcomes.performanceImpact,
    this.outcomes.careerDevelopment
  ];
  return scores.reduce((sum: number, score: number) => sum + score, 0) / scores.length;
});

// Pre-save middleware
StaffTrainingSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Static methods
StaffTrainingSchema.statics.findByStaff = function(staffId: string, startDate: Date, endDate: Date) {
  return this.find({
    staffId,
    startDate: { $gte: startDate },
    endDate: { $lte: endDate }
  }).sort({ startDate: 1 });
};

StaffTrainingSchema.statics.findByProperty = function(propertyId: string, status: string) {
  return this.find({
    propertyId,
    status
  }).populate('staffId', 'firstName lastName employeeId');
};

StaffTrainingSchema.statics.getTrainingAnalytics = function(propertyId: string, startDate: Date, endDate: Date) {
  return this.aggregate([
    {
      $match: {
        propertyId: new mongoose.Types.ObjectId(propertyId),
        startDate: { $gte: startDate },
        endDate: { $lte: endDate }
      }
    },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        avgProgress: { $avg: '$progress' },
        avgScore: { $avg: '$score' },
        avgImpactScore: { $avg: '$overallImpactScore' }
      }
    }
  ]);
};

export default mongoose.models.StaffTraining || mongoose.model<IStaffTraining>('StaffTraining', StaffTrainingSchema); 