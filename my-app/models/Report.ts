import mongoose, { Schema, Document } from 'mongoose';
import { ReportType, ReportTargetType, ReportStatus } from '@/types/report';

export interface IReport extends Document {
  reportedBy: mongoose.Types.ObjectId;
  targetType: ReportTargetType;
  targetId: mongoose.Types.ObjectId;
  type: ReportType;
  reason: string;
  details?: string;
  attachments?: string[];
  status: ReportStatus;
  adminNotes?: string;
  resolvedBy?: mongoose.Types.ObjectId;
  resolvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ReportSchema = new Schema<IReport>(
  {
    reportedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    targetType: {
      type: String,
      enum: Object.values(ReportTargetType),
      required: true,
      index: true
    },
    targetId: {
      type: Schema.Types.ObjectId,
      required: true,
      index: true
    },
    type: {
      type: String,
      enum: Object.values(ReportType),
      required: true,
      index: true
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
    attachments: [{
      type: String
    }],
    status: {
      type: String,
      enum: Object.values(ReportStatus),
      default: ReportStatus.PENDING,
      index: true
    },
    adminNotes: {
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
  {
    timestamps: true
  }
);

// Compound indexes
ReportSchema.index({ targetType: 1, targetId: 1 });
ReportSchema.index({ status: 1, createdAt: -1 });
ReportSchema.index({ reportedBy: 1, createdAt: -1 });

const Report = (mongoose.models?.Report || mongoose.model<IReport>('Report', ReportSchema)) as mongoose.Model<IReport>;

export default Report;
export { ReportType, ReportTargetType, ReportStatus };
