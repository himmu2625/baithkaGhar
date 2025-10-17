// Customer Report Types
// For users reporting issues with properties, bookings, reviews, or other users

export enum ReportType {
  INAPPROPRIATE_CONTENT = 'INAPPROPRIATE_CONTENT',
  MISLEADING_INFORMATION = 'MISLEADING_INFORMATION',
  SCAM_OR_FRAUD = 'SCAM_OR_FRAUD',
  SAFETY_CONCERN = 'SAFETY_CONCERN',
  DISCRIMINATION = 'DISCRIMINATION',
  SPAM = 'SPAM',
  HARASSMENT = 'HARASSMENT',
  FAKE_LISTING = 'FAKE_LISTING',
  PRICING_ISSUE = 'PRICING_ISSUE',
  QUALITY_ISSUE = 'QUALITY_ISSUE',
  CANCELLATION_ISSUE = 'CANCELLATION_ISSUE',
  PAYMENT_ISSUE = 'PAYMENT_ISSUE',
  OTHER = 'OTHER'
}

export enum ReportTargetType {
  PROPERTY = 'PROPERTY',
  USER = 'USER',
  REVIEW = 'REVIEW',
  BOOKING = 'BOOKING'
}

export enum ReportStatus {
  PENDING = 'PENDING',
  UNDER_REVIEW = 'UNDER_REVIEW',
  RESOLVED = 'RESOLVED',
  REJECTED = 'REJECTED',
  ESCALATED = 'ESCALATED'
}

export interface CustomerReport {
  _id: string;
  reportedBy: string; // User ID
  targetType: ReportTargetType;
  targetId: string;
  type: ReportType;
  reason: string;
  details?: string;
  attachments?: string[];
  status: ReportStatus;
  adminNotes?: string;
  resolvedBy?: string; // Admin user ID
  resolvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}
