import mongoose, { Schema, Document } from 'mongoose';

export interface INotification extends Document {
  userId: mongoose.Types.ObjectId;
  type: 'booking' | 'payment' | 'room' | 'review' | 'system' | 'alert';
  title: string;
  message: string;
  icon?: string;
  link?: string;

  // Related entities
  bookingId?: mongoose.Types.ObjectId;
  propertyId?: mongoose.Types.ObjectId;
  roomId?: mongoose.Types.ObjectId;

  // Priority and status
  priority: 'low' | 'medium' | 'high' | 'urgent';
  isRead: boolean;
  readAt?: Date;

  // Action button
  actionLabel?: string;
  actionUrl?: string;

  // Metadata
  metadata?: Record<string, any>;

  // Expiry
  expiresAt?: Date;

  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema<INotification>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  type: {
    type: String,
    enum: ['booking', 'payment', 'room', 'review', 'system', 'alert'],
    required: true,
    index: true,
  },
  title: {
    type: String,
    required: true,
    trim: true,
  },
  message: {
    type: String,
    required: true,
    trim: true,
  },
  icon: {
    type: String,
    trim: true,
  },
  link: {
    type: String,
    trim: true,
  },
  bookingId: {
    type: Schema.Types.ObjectId,
    ref: 'Booking',
    index: true,
  },
  propertyId: {
    type: Schema.Types.ObjectId,
    ref: 'Property',
    index: true,
  },
  roomId: {
    type: Schema.Types.ObjectId,
    ref: 'Room',
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium',
    index: true,
  },
  isRead: {
    type: Boolean,
    default: false,
    index: true,
  },
  readAt: {
    type: Date,
  },
  actionLabel: {
    type: String,
    trim: true,
  },
  actionUrl: {
    type: String,
    trim: true,
  },
  metadata: {
    type: Schema.Types.Mixed,
  },
  expiresAt: {
    type: Date,
    index: true,
  },
}, {
  timestamps: true,
});

// Compound indexes
NotificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });
NotificationSchema.index({ userId: 1, type: 1, createdAt: -1 });
NotificationSchema.index({ userId: 1, priority: 1, isRead: 1 });

// TTL index - automatically delete expired notifications
NotificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Methods
NotificationSchema.methods.markAsRead = function() {
  this.isRead = true;
  this.readAt = new Date();
  return this.save();
};

// Statics
NotificationSchema.statics.createNotification = async function(notificationData: Partial<INotification>) {
  return this.create(notificationData);
};

NotificationSchema.statics.getUnreadCount = function(userId: string) {
  return this.countDocuments({ userId, isRead: false });
};

NotificationSchema.statics.markAllAsRead = function(userId: string) {
  return this.updateMany(
    { userId, isRead: false },
    { $set: { isRead: true, readAt: new Date() } }
  );
};

NotificationSchema.statics.deleteOldNotifications = function(userId: string, daysOld: number = 30) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);

  return this.deleteMany({
    userId,
    createdAt: { $lt: cutoffDate },
    isRead: true,
  });
};

export default mongoose.models.Notification || mongoose.model<INotification>('Notification', NotificationSchema);
