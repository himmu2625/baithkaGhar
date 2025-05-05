import mongoose, { Schema, Document, Model } from 'mongoose';

// Define the types of reports
export enum ReportType {
  INAPPROPRIATE_CONTENT = 'INAPPROPRIATE_CONTENT',
  MISLEADING_INFORMATION = 'MISLEADING_INFORMATION',
  FAKE_LISTING = 'FAKE_LISTING',
  SCAM = 'SCAM',
  HARASSMENT = 'HARASSMENT',
  DISCRIMINATION = 'DISCRIMINATION',
  POLICY_VIOLATION = 'POLICY_VIOLATION',
  OTHER = 'OTHER'
}

// Define the target types that can be reported
export enum ReportTargetType {
  PROPERTY = 'PROPERTY',
  USER = 'USER',
  REVIEW = 'REVIEW',
  BOOKING = 'BOOKING'
}

// Define the status of reports
export enum ReportStatus {
  PENDING = 'PENDING',
  UNDER_REVIEW = 'UNDER_REVIEW',
  RESOLVED = 'RESOLVED',
  DISMISSED = 'DISMISSED'
}

// Interface for Report document
export interface IReport extends Document {
  type: ReportType;
  targetType: ReportTargetType;
  reporter: mongoose.Types.ObjectId;
  property?: mongoose.Types.ObjectId;
  user?: mongoose.Types.ObjectId;
  review?: mongoose.Types.ObjectId;
  booking?: mongoose.Types.ObjectId;
  reason: string;
  details?: string;
  attachments?: string[];
  status: ReportStatus;
  adminResponse?: string;
  resolvedBy?: mongoose.Types.ObjectId;
  resolvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Report Schema
const reportSchema = new Schema<IReport>(
  {
    type: {
      type: String,
      enum: Object.values(ReportType),
      required: true
    },
    targetType: {
      type: String,
      enum: Object.values(ReportTargetType),
      required: true
    },
    reporter: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    property: {
      type: Schema.Types.ObjectId,
      ref: 'Property',
      required: function(this: IReport) {
        return this.targetType === ReportTargetType.PROPERTY;
      }
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: function(this: IReport) {
        return this.targetType === ReportTargetType.USER;
      }
    },
    review: {
      type: Schema.Types.ObjectId,
      ref: 'Review',
      required: function(this: IReport) {
        return this.targetType === ReportTargetType.REVIEW;
      }
    },
    booking: {
      type: Schema.Types.ObjectId,
      ref: 'Booking',
      required: function(this: IReport) {
        return this.targetType === ReportTargetType.BOOKING;
      }
    },
    reason: {
      type: String,
      required: true,
      minlength: 10,
      maxlength: 500
    },
    details: {
      type: String,
      maxlength: 2000
    },
    attachments: {
      type: [String],
      validate: {
        validator: function(v: string[]) {
          return v.length <= 5;
        },
        message: 'A maximum of 5 attachments is allowed'
      }
    },
    status: {
      type: String,
      enum: Object.values(ReportStatus),
      default: ReportStatus.PENDING
    },
    adminResponse: {
      type: String,
      maxlength: 1000
    },
    resolvedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    resolvedAt: {
      type: Date
    }
  },
  { timestamps: true }
);

// Indexes for improved query performance
reportSchema.index({ reporter: 1, status: 1 });
reportSchema.index({ targetType: 1, property: 1 });
reportSchema.index({ targetType: 1, user: 1 });
reportSchema.index({ targetType: 1, review: 1 });
reportSchema.index({ targetType: 1, booking: 1 });
reportSchema.index({ status: 1, createdAt: -1 });

// Pre-save middleware
reportSchema.pre('save', function(next) {
  if (this.isModified('status') && 
      (this.status === ReportStatus.RESOLVED || this.status === ReportStatus.DISMISSED) && 
      !this.resolvedAt) {
    this.resolvedAt = new Date();
  }
  next();
});

/**
 * Safe model initialization that works in both ESM and CommonJS environments
 */
let Report: Model<IReport>;

// Check if the model already exists to prevent redefinition
if (mongoose.models && mongoose.models.Report) {
  Report = mongoose.models.Report as Model<IReport>;
} else {
  // Create new model if it doesn't exist
  Report = mongoose.model<IReport>('Report', reportSchema);
}

export default Report; 