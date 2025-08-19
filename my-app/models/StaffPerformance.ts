import mongoose, { Schema, type Document } from "mongoose"

export interface IStaffPerformance extends Document {
  staffId: mongoose.Types.ObjectId;
  evaluationPeriod: {
    startDate: Date;
    endDate: Date;
  };
  evaluationType: 'monthly' | 'quarterly' | 'semi_annual' | 'annual' | 'probation';
  metrics: {
    attendance: {
      score: number; // 1-5 scale
      comments?: string;
    };
    punctuality: {
      score: number; // 1-5 scale
      comments?: string;
    };
    taskCompletion: {
      score: number; // 1-5 scale
      comments?: string;
    };
    qualityOfWork: {
      score: number; // 1-5 scale
      comments?: string;
    };
    teamwork: {
      score: number; // 1-5 scale
      comments?: string;
    };
    communication: {
      score: number; // 1-5 scale
      comments?: string;
    };
    initiative: {
      score: number; // 1-5 scale
      comments?: string;
    };
    customerService?: {
      score: number; // 1-5 scale
      comments?: string;
    };
    problemSolving?: {
      score: number; // 1-5 scale
      comments?: string;
    };
    adaptability?: {
      score: number; // 1-5 scale
      comments?: string;
    };
    leadership?: {
      score: number; // 1-5 scale
      comments?: string;
    };
    customMetrics?: {
      [key: string]: {
        score: number;
        comments?: string;
      };
    };
  };
  overallRating: number; // 1-5 scale
  strengths?: string[];
  areasForImprovement?: string[];
  goalsForNextPeriod?: string[];
  trainingRecommendations?: string[];
  evaluatorId: mongoose.Types.ObjectId;
  evaluatorNotes?: string;
  acknowledgement?: {
    acknowledged: boolean;
    acknowledgedAt?: Date;
    staffComments?: string;
  };
  status: 'draft' | 'completed' | 'acknowledged' | 'disputed';
  createdAt: Date;
  updatedAt: Date;
}

const StaffPerformanceSchema = new Schema<IStaffPerformance>(
  {
    staffId: { type: Schema.Types.ObjectId, ref: "Staff", required: true },
    evaluationPeriod: {
      startDate: { type: Date, required: true },
      endDate: { type: Date, required: true }
    },
    evaluationType: { 
      type: String, 
      enum: ['monthly', 'quarterly', 'semi_annual', 'annual', 'probation'],
      required: true
    },
    metrics: {
      attendance: {
        score: { type: Number, required: true, min: 1, max: 5 },
        comments: { type: String }
      },
      punctuality: {
        score: { type: Number, required: true, min: 1, max: 5 },
        comments: { type: String }
      },
      taskCompletion: {
        score: { type: Number, required: true, min: 1, max: 5 },
        comments: { type: String }
      },
      qualityOfWork: {
        score: { type: Number, required: true, min: 1, max: 5 },
        comments: { type: String }
      },
      teamwork: {
        score: { type: Number, required: true, min: 1, max: 5 },
        comments: { type: String }
      },
      communication: {
        score: { type: Number, required: true, min: 1, max: 5 },
        comments: { type: String }
      },
      initiative: {
        score: { type: Number, required: true, min: 1, max: 5 },
        comments: { type: String }
      },
      customerService: {
        score: { type: Number, min: 1, max: 5 },
        comments: { type: String }
      },
      problemSolving: {
        score: { type: Number, min: 1, max: 5 },
        comments: { type: String }
      },
      adaptability: {
        score: { type: Number, min: 1, max: 5 },
        comments: { type: String }
      },
      leadership: {
        score: { type: Number, min: 1, max: 5 },
        comments: { type: String }
      },
      customMetrics: { type: Schema.Types.Mixed }
    },
    overallRating: { type: Number, required: true, min: 1, max: 5 },
    strengths: [{ type: String }],
    areasForImprovement: [{ type: String }],
    goalsForNextPeriod: [{ type: String }],
    trainingRecommendations: [{ type: String }],
    evaluatorId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    evaluatorNotes: { type: String },
    acknowledgement: {
      acknowledged: { type: Boolean, default: false },
      acknowledgedAt: { type: Date },
      staffComments: { type: String }
    },
    status: { 
      type: String, 
      enum: ['draft', 'completed', 'acknowledged', 'disputed'],
      default: 'draft'
    }
  },
  { 
    timestamps: true,
    collection: "staff_performance"
  }
)

// Create indexes for faster queries
StaffPerformanceSchema.index({ staffId: 1 })
StaffPerformanceSchema.index({ 'evaluationPeriod.startDate': 1, 'evaluationPeriod.endDate': 1 })
StaffPerformanceSchema.index({ evaluationType: 1 })
StaffPerformanceSchema.index({ overallRating: 1 })
StaffPerformanceSchema.index({ status: 1 })
StaffPerformanceSchema.index({ evaluatorId: 1 })

// Create compound index for unique performance evaluations per staff per period
StaffPerformanceSchema.index(
  { 
    staffId: 1, 
    'evaluationPeriod.startDate': 1, 
    'evaluationPeriod.endDate': 1, 
    evaluationType: 1 
  }, 
  { unique: true }
)

/**
 * StaffPerformance model for tracking staff performance evaluations and metrics
 */
const StaffPerformance = (mongoose.models.StaffPerformance || mongoose.model<IStaffPerformance>("StaffPerformance", StaffPerformanceSchema)) as mongoose.Model<IStaffPerformance>

export default StaffPerformance