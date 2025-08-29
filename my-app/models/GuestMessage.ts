import mongoose, { Schema, Document } from "mongoose";

export interface IGuestMessage extends Document {
  bookingId: mongoose.Types.ObjectId;
  senderId: mongoose.Types.ObjectId;
  recipientId: mongoose.Types.ObjectId;
  senderType: 'guest' | 'admin' | 'property_owner';
  recipientType: 'guest' | 'admin' | 'property_owner';
  messageType: 'text' | 'image' | 'file' | 'system' | 'auto_response';
  subject?: string;
  content: string;
  attachments?: Array<{
    fileName: string;
    fileUrl: string;
    fileType: string;
    fileSize: number;
  }>;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'sent' | 'delivered' | 'read' | 'archived';
  threadId?: string; // Group related messages
  isSystemGenerated: boolean;
  automatedResponse?: {
    triggered: boolean;
    responseType: string;
    delay: number; // milliseconds
  };
  metadata?: {
    ipAddress?: string;
    userAgent?: string;
    location?: string;
    sentFromPage?: string;
  };
  readAt?: Date;
  deliveredAt?: Date;
  archivedAt?: Date;
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
}

const attachmentSchema = new Schema({
  fileName: { type: String, required: true },
  fileUrl: { type: String, required: true },
  fileType: { type: String, required: true },
  fileSize: { type: Number, required: true }
});

const guestMessageSchema = new Schema<IGuestMessage>(
  {
    bookingId: { 
      type: Schema.Types.ObjectId, 
      ref: "Booking", 
      required: true,
      index: true
    },
    senderId: { 
      type: Schema.Types.ObjectId, 
      refPath: 'senderType', 
      required: true 
    },
    recipientId: { 
      type: Schema.Types.ObjectId, 
      refPath: 'recipientType', 
      required: true 
    },
    senderType: {
      type: String,
      enum: ['guest', 'admin', 'property_owner'],
      required: true
    },
    recipientType: {
      type: String,
      enum: ['guest', 'admin', 'property_owner'],
      required: true
    },
    messageType: {
      type: String,
      enum: ['text', 'image', 'file', 'system', 'auto_response'],
      default: 'text'
    },
    subject: { 
      type: String,
      maxlength: 200
    },
    content: { 
      type: String, 
      required: true,
      maxlength: 2000
    },
    attachments: [attachmentSchema],
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium'
    },
    status: {
      type: String,
      enum: ['sent', 'delivered', 'read', 'archived'],
      default: 'sent'
    },
    threadId: { 
      type: String,
      index: true
    },
    isSystemGenerated: { 
      type: Boolean, 
      default: false 
    },
    automatedResponse: {
      triggered: { type: Boolean, default: false },
      responseType: { type: String },
      delay: { type: Number }
    },
    metadata: {
      ipAddress: { type: String },
      userAgent: { type: String },
      location: { type: String },
      sentFromPage: { type: String }
    },
    readAt: { type: Date },
    deliveredAt: { type: Date },
    archivedAt: { type: Date },
    tags: [{ type: String, maxlength: 50 }]
  },
  { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Compound indexes for efficient queries
guestMessageSchema.index({ bookingId: 1, createdAt: -1 });
guestMessageSchema.index({ senderId: 1, senderType: 1, createdAt: -1 });
guestMessageSchema.index({ recipientId: 1, recipientType: 1, status: 1 });
guestMessageSchema.index({ threadId: 1, createdAt: 1 });
guestMessageSchema.index({ status: 1, priority: 1, createdAt: -1 });

// Virtual for time since message was sent
guestMessageSchema.virtual('timeSinceSent').get(function() {
  const now = new Date();
  const diffInMinutes = Math.floor((now.getTime() - this.createdAt.getTime()) / (1000 * 60));
  
  if (diffInMinutes < 1) return 'Just now';
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  
  const hours = Math.floor(diffInMinutes / 60);
  if (hours < 24) return `${hours}h ago`;
  
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
});

// Virtual for conversation participant names (populated)
guestMessageSchema.virtual('senderInfo', {
  ref: function(doc: IGuestMessage) {
    return doc.senderType === 'guest' ? 'User' : 'User'; // Simplified - in reality you'd have different models
  },
  localField: 'senderId',
  foreignField: '_id',
  justOne: true
});

guestMessageSchema.virtual('recipientInfo', {
  ref: function(doc: IGuestMessage) {
    return doc.recipientType === 'guest' ? 'User' : 'User';
  },
  localField: 'recipientId',
  foreignField: '_id',
  justOne: true
});

// Pre-save middleware to generate thread ID if not provided
guestMessageSchema.pre('save', function(next) {
  if (!this.threadId) {
    // Generate thread ID based on booking and participants
    const participants = [this.senderId.toString(), this.recipientId.toString()].sort();
    this.threadId = `${this.bookingId}_${participants.join('_')}`;
  }
  next();
});

// Pre-save middleware to set delivered status
guestMessageSchema.pre('save', function(next) {
  if (this.isModified('status') && this.status === 'delivered' && !this.deliveredAt) {
    this.deliveredAt = new Date();
  }
  
  if (this.isModified('status') && this.status === 'read' && !this.readAt) {
    this.readAt = new Date();
  }
  
  if (this.isModified('status') && this.status === 'archived' && !this.archivedAt) {
    this.archivedAt = new Date();
  }
  
  next();
});

// Static method to get conversation between two users for a booking
guestMessageSchema.statics.getConversation = function(
  bookingId: string, 
  userId1: string, 
  userId2: string, 
  page: number = 1, 
  limit: number = 50
) {
  const skip = (page - 1) * limit;
  
  return this.find({
    bookingId,
    $or: [
      { senderId: userId1, recipientId: userId2 },
      { senderId: userId2, recipientId: userId1 }
    ]
  })
  .sort({ createdAt: -1 })
  .skip(skip)
  .limit(limit)
  .populate('senderId', 'name email')
  .populate('recipientId', 'name email')
  .populate('bookingId', 'bookingCode propertyId')
  .lean();
};

// Static method to get unread message count for a user
guestMessageSchema.statics.getUnreadCount = function(userId: string, userType: string) {
  return this.countDocuments({
    recipientId: userId,
    recipientType: userType,
    status: { $in: ['sent', 'delivered'] }
  });
};

// Static method to mark messages as read
guestMessageSchema.statics.markAsRead = function(messageIds: string[], userId: string) {
  return this.updateMany(
    {
      _id: { $in: messageIds },
      recipientId: userId,
      status: { $ne: 'read' }
    },
    {
      $set: {
        status: 'read',
        readAt: new Date()
      }
    }
  );
};

// Static method to get recent conversations for a user
guestMessageSchema.statics.getRecentConversations = function(userId: string, userType: string) {
  return this.aggregate([
    {
      $match: {
        $or: [
          { senderId: new mongoose.Types.ObjectId(userId), senderType: userType },
          { recipientId: new mongoose.Types.ObjectId(userId), recipientType: userType }
        ]
      }
    },
    {
      $sort: { createdAt: -1 }
    },
    {
      $group: {
        _id: '$threadId',
        lastMessage: { $first: '$$ROOT' },
        unreadCount: {
          $sum: {
            $cond: [
              {
                $and: [
                  { $eq: ['$recipientId', new mongoose.Types.ObjectId(userId)] },
                  { $eq: ['$recipientType', userType] },
                  { $in: ['$status', ['sent', 'delivered']] }
                ]
              },
              1,
              0
            ]
          }
        },
        totalMessages: { $sum: 1 }
      }
    },
    {
      $sort: { 'lastMessage.createdAt': -1 }
    },
    {
      $limit: 20
    }
  ]);
};

const GuestMessage = mongoose.models.GuestMessage || mongoose.model<IGuestMessage>("GuestMessage", guestMessageSchema);
export default GuestMessage;