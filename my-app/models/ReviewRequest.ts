import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IReviewRequest extends Document {
  bookingId: mongoose.Types.ObjectId;
  propertyId: mongoose.Types.ObjectId;
  guestName: string;
  guestEmail: string;
  guestPhone?: string;

  // Stay details
  checkInDate: Date;
  checkOutDate: Date;
  roomCategory?: string;
  nightsStayed: number;

  // Request details
  token: string; // Unique token for review link
  requestSentAt: Date;
  requestSentVia: Array<'email' | 'sms' | 'whatsapp'>;

  // Tracking
  emailSent: boolean;
  emailSentAt?: Date;
  emailOpenedAt?: Date;
  linkClickedAt?: Date;

  smsSent: boolean;
  smsSentAt?: Date;

  whatsappSent: boolean;
  whatsappSentAt?: Date;

  // Reminders
  remindersSent: number;
  lastReminderAt?: Date;
  nextReminderAt?: Date;

  // Status
  status: 'pending' | 'submitted' | 'expired' | 'cancelled';
  reviewSubmittedAt?: Date;
  reviewId?: mongoose.Types.ObjectId;

  // Expiry
  expiresAt: Date;

  // Metadata
  generatedBy?: mongoose.Types.ObjectId; // Admin who generated the link
  isAutomated: boolean; // Auto-generated vs manual
  notes?: string;
}

const ReviewRequestSchema = new Schema<IReviewRequest>({
  bookingId: {
    type: Schema.Types.ObjectId,
    ref: 'Booking',
    required: true,
    unique: true, // One review request per booking
  },
  propertyId: {
    type: Schema.Types.ObjectId,
    ref: 'Property',
    required: true,
    index: true,
  },
  guestName: {
    type: String,
    required: true,
    trim: true,
  },
  guestEmail: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
  },
  guestPhone: String,

  checkInDate: {
    type: Date,
    required: true,
  },
  checkOutDate: {
    type: Date,
    required: true,
  },
  roomCategory: String,
  nightsStayed: {
    type: Number,
    required: true,
  },

  token: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  requestSentAt: {
    type: Date,
    default: Date.now,
  },
  requestSentVia: [{
    type: String,
    enum: ['email', 'sms', 'whatsapp'],
  }],

  emailSent: {
    type: Boolean,
    default: false,
  },
  emailSentAt: Date,
  emailOpenedAt: Date,
  linkClickedAt: Date,

  smsSent: {
    type: Boolean,
    default: false,
  },
  smsSentAt: Date,

  whatsappSent: {
    type: Boolean,
    default: false,
  },
  whatsappSentAt: Date,

  remindersSent: {
    type: Number,
    default: 0,
  },
  lastReminderAt: Date,
  nextReminderAt: Date,

  status: {
    type: String,
    enum: ['pending', 'submitted', 'expired', 'cancelled'],
    default: 'pending',
    index: true,
  },
  reviewSubmittedAt: Date,
  reviewId: {
    type: Schema.Types.ObjectId,
    ref: 'Review',
  },

  expiresAt: {
    type: Date,
    required: true,
    index: true,
  },

  generatedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
  isAutomated: {
    type: Boolean,
    default: false,
  },
  notes: String,
}, {
  timestamps: true,
});

// Indexes for performance
ReviewRequestSchema.index({ status: 1, expiresAt: 1 });
ReviewRequestSchema.index({ propertyId: 1, status: 1 });
ReviewRequestSchema.index({ nextReminderAt: 1, status: 1 });

// Method to check if request is expired
ReviewRequestSchema.methods.isExpired = function(): boolean {
  return new Date() > this.expiresAt;
};

// Method to mark as submitted
ReviewRequestSchema.methods.markAsSubmitted = function(reviewId: mongoose.Types.ObjectId) {
  this.status = 'submitted';
  this.reviewSubmittedAt = new Date();
  this.reviewId = reviewId;
  return this.save();
};

const ReviewRequest: Model<IReviewRequest> =
  mongoose.models.ReviewRequest ||
  mongoose.model<IReviewRequest>('ReviewRequest', ReviewRequestSchema);

export default ReviewRequest;
