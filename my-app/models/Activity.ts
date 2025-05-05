import mongoose, { Schema, Document } from 'mongoose';

export interface ActivityDocument extends Document {
  type: string;
  description: string;
  entity?: string;
  entityId?: string;
  userId?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const ActivitySchema = new Schema({
  type: {
    type: String,
    required: true,
    enum: [
      'USER_SIGNUP',
      'USER_LOGIN',
      'USER_UPDATE',
      'PROPERTY_CREATED',
      'PROPERTY_UPDATED',
      'PROPERTY_DELETED',
      'BOOKING_CREATED',
      'BOOKING_CONFIRMED',
      'BOOKING_CANCELLED',
      'BOOKING_COMPLETED',
      'PAYMENT_COMPLETED',
      'PAYMENT_FAILED',
      'REVIEW_CREATED',
      'REPORT_CREATED',
      'REPORT_UPDATE',
      'ADMIN_ACTION'
    ]
  },
  description: {
    type: String,
    required: true
  },
  entity: {
    type: String,
    enum: ['user', 'property', 'booking', 'payment', 'review', 'report'],
    default: null
  },
  entityId: {
    type: String,
    default: null
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  metadata: {
    type: Object,
    default: {}
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

// Create index for faster queries
ActivitySchema.index({ createdAt: -1 });
ActivitySchema.index({ type: 1 });
ActivitySchema.index({ userId: 1 });
ActivitySchema.index({ entity: 1, entityId: 1 });

export default mongoose.models.Activity || mongoose.model<ActivityDocument>('Activity', ActivitySchema); 