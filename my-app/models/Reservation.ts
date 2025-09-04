import { Schema, model, models } from 'mongoose';

const ReservationSchema = new Schema({
  propertyId: {
    type: String,
    required: true,
    ref: 'Property'
  },
  
  reservationNumber: {
    type: String,
    required: true,
    unique: true
  },
  
  customer: {
    type: {
      type: String,
      enum: ['guest', 'walk_in', 'member', 'corporate'],
      required: true
    },
    guestId: {
      type: Schema.Types.ObjectId,
      ref: 'Guest'
    },
    contactInfo: {
      name: {
        type: String,
        required: true,
        trim: true
      },
      phone: {
        type: String,
        required: true
      },
      email: String,
      alternatePhone: String
    },
    preferences: {
      dietaryRestrictions: [String],
      allergies: [String],
      specialRequests: String,
      preferredSeating: {
        type: String,
        enum: ['window', 'quiet', 'outdoor', 'bar', 'private', 'no_preference']
      }
    }
  },
  
  reservationDetails: {
    reservationDate: {
      type: Date,
      required: true
    },
    reservationTime: {
      type: String,
      required: true // "19:30"
    },
    partySize: {
      type: Number,
      required: true,
      min: 1
    },
    duration: {
      estimated: { type: Number, default: 120 }, // minutes
      actual: Number
    },
    occasion: {
      type: String,
      enum: ['birthday', 'anniversary', 'business', 'date', 'family', 'celebration', 'other']
    },
    specialRequests: String
  },
  
  tableAssignment: {
    preferredTableId: {
      type: Schema.Types.ObjectId,
      ref: 'Table'
    },
    assignedTableId: {
      type: Schema.Types.ObjectId,
      ref: 'Table'
    },
    tablePreference: {
      area: String,
      seatingType: String,
      features: [String] // e.g., ["hasView", "quiet", "wheelchairAccessible"]
    },
    autoAssign: { type: Boolean, default: true }
  },
  
  status: {
    type: String,
    enum: ['confirmed', 'pending', 'waitlisted', 'seated', 'no_show', 'cancelled', 'completed'],
    default: 'pending'
  },
  
  timeline: {
    reservationMade: {
      type: Date,
      default: Date.now
    },
    confirmed: Date,
    reminderSent: Date,
    customerArrived: Date,
    seated: Date,
    orderTaken: Date,
    mealCompleted: Date,
    departed: Date,
    cancelled: Date
  },
  
  service: {
    assignedHost: {
      type: Schema.Types.ObjectId,
      ref: 'StaffMember'
    },
    assignedWaiter: {
      type: Schema.Types.ObjectId,
      ref: 'StaffMember'
    },
    serviceNotes: String,
    vipTreatment: { type: Boolean, default: false },
    specialArrangements: [String],
    
    checkIn: {
      actualArrivalTime: Date,
      waitTime: Number, // minutes
      partyComplete: { type: Boolean, default: false },
      actualPartySize: Number
    }
  },
  
  orderInfo: {
    orderId: {
      type: Schema.Types.ObjectId,
      ref: 'FBOrder'
    },
    preOrdered: { type: Boolean, default: false },
    preOrderItems: [{
      itemName: String,
      quantity: Number,
      specialInstructions: String
    }],
    estimatedOrderValue: Number,
    actualOrderValue: Number
  },
  
  payment: {
    depositRequired: { type: Boolean, default: false },
    depositAmount: { type: Number, default: 0 },
    depositPaid: { type: Boolean, default: false },
    depositDate: Date,
    refundAmount: { type: Number, default: 0 },
    cancellationFee: { type: Number, default: 0 }
  },
  
  communications: {
    confirmationSent: { type: Boolean, default: false },
    reminderSent: { type: Boolean, default: false },
    
    notifications: [{
      type: {
        type: String,
        enum: ['confirmation', 'reminder', 'modification', 'cancellation', 'waitlist_update']
      },
      method: {
        type: String,
        enum: ['email', 'sms', 'call', 'app_notification']
      },
      sentAt: Date,
      status: {
        type: String,
        enum: ['sent', 'delivered', 'failed', 'opened'],
        default: 'sent'
      },
      content: String
    }],
    
    customerMessages: [{
      message: String,
      sentBy: {
        type: String,
        enum: ['customer', 'restaurant']
      },
      timestamp: Date,
      staffMember: {
        type: Schema.Types.ObjectId,
        ref: 'StaffMember'
      }
    }]
  },
  
  modifications: [{
    modifiedAt: Date,
    modifiedBy: {
      type: Schema.Types.ObjectId,
      ref: 'StaffMember'
    },
    changes: [{
      field: String,
      oldValue: Schema.Types.Mixed,
      newValue: Schema.Types.Mixed
    }],
    reason: String
  }],
  
  feedback: {
    customerRating: {
      overall: { type: Number, min: 1, max: 5 },
      food: { type: Number, min: 1, max: 5 },
      service: { type: Number, min: 1, max: 5 },
      ambiance: { type: Number, min: 1, max: 5 },
      value: { type: Number, min: 1, max: 5 }
    },
    comments: String,
    wouldRecommend: Boolean,
    feedbackDate: Date,
    followUpRequired: { type: Boolean, default: false }
  },
  
  businessRules: {
    source: {
      type: String,
      enum: ['phone', 'walk_in', 'website', 'app', 'third_party', 'social_media'],
      required: true
    },
    campaignId: String, // Marketing campaign reference
    referralCode: String,
    loyaltyPoints: { type: Number, default: 0 },
    
    restrictions: {
      minimumAdvanceHours: { type: Number, default: 2 },
      maximumAdvanceDays: { type: Number, default: 60 },
      allowSameDayBooking: { type: Boolean, default: true },
      requiresApproval: { type: Boolean, default: false }
    }
  },
  
  analytics: {
    leadTime: Number, // Hours between booking and reservation time
    repeatCustomer: { type: Boolean, default: false },
    customerSegment: String,
    seasonality: String,
    weatherImpact: String,
    
    performance: {
      onTimeArrival: Boolean,
      stayedFullDuration: Boolean,
      orderValueVsEstimate: Number, // Percentage difference
      serviceRating: Number
    }
  },
  
  waitlist: {
    isWaitlisted: { type: Boolean, default: false },
    waitlistPosition: Number,
    waitlistDate: Date,
    estimatedWaitTime: Number, // minutes
    notifyWhenAvailable: { type: Boolean, default: true },
    autoAcceptIfAvailable: { type: Boolean, default: false }
  },
  
  groupReservation: {
    isGroupReservation: { type: Boolean, default: false },
    groupSize: Number,
    groupName: String,
    splitBilling: { type: Boolean, default: false },
    groupContact: {
      name: String,
      phone: String,
      email: String
    },
    specialArrangements: String
  },
  
  cancellation: {
    cancelledBy: {
      type: String,
      enum: ['customer', 'restaurant', 'system']
    },
    cancellationReason: String,
    cancellationDate: Date,
    refundIssued: { type: Boolean, default: false },
    rebookingOffered: { type: Boolean, default: false }
  },
  
  isActive: {
    type: Boolean,
    default: true
  },
  
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'StaffMember'
  },
  
  lastUpdatedBy: {
    type: Schema.Types.ObjectId,
    ref: 'StaffMember'
  },
  
  createdAt: {
    type: Date,
    default: Date.now
  },
  
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

ReservationSchema.pre('save', function() {
  this.updatedAt = new Date();
  
  // Generate reservation number if not provided
  if (!this.reservationNumber) {
    const date = new Date(this.reservationDetails?.reservationDate || new Date());
    const dateStr = date.toISOString().slice(2, 10).replace(/-/g, '');
    const timeStr = Date.now().toString().slice(-4);
    this.reservationNumber = `RES${dateStr}${timeStr}`;
  }
  
  // Calculate lead time
  if (this.reservationDetails?.reservationDate && this.createdAt) {
    // Initialize analytics with all required properties
    if (!this.analytics) {
      this.analytics = {
        repeatCustomer: false,
        leadTime: 0,
        performance: {}
      } as any;
    }
    
    (this as any).analytics.leadTime = Math.round(
      (new Date(this.reservationDetails.reservationDate).getTime() - this.createdAt.getTime()) / (1000 * 60 * 60)
    );
  }
  
  // Auto-update timeline based on status
  if (this.isModified('status')) {
    const now = new Date();
    switch (this.status) {
      case 'confirmed':
        if (!this.timeline?.confirmed) (this as any).timeline.confirmed = now;
        break;
      case 'seated':
        if (!this.timeline?.seated) (this as any).timeline.seated = now;
        break;
      case 'completed':
        if (!this.timeline?.mealCompleted) (this as any).timeline.mealCompleted = now;
        break;
      case 'cancelled':
        if (!this.timeline?.cancelled) (this as any).timeline.cancelled = now;
        break;
    }
  }
});

ReservationSchema.index({ propertyId: 1, reservationDate: 1 });
ReservationSchema.index({ reservationNumber: 1 }, { unique: true });
ReservationSchema.index({ propertyId: 1, status: 1 });
ReservationSchema.index({ 'customer.guestId': 1 });
ReservationSchema.index({ 'tableAssignment.assignedTableId': 1 });
ReservationSchema.index({ createdAt: -1 });

ReservationSchema.virtual('reservationDateTime').get(function() {
  if (this.reservationDetails?.reservationDate && this.reservationDetails?.reservationTime) {
    const [hours, minutes] = this.reservationDetails.reservationTime.split(':');
    const dateTime = new Date(this.reservationDetails.reservationDate);
    dateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    return dateTime;
  }
  return null;
});

ReservationSchema.virtual('isToday').get(function() {
  if (!this.reservationDetails?.reservationDate) return false;
  
  const today = new Date();
  const reservationDate = new Date(this.reservationDetails.reservationDate);
  
  return today.toDateString() === reservationDate.toDateString();
});

ReservationSchema.methods.updateStatus = function(newStatus: string, staffMemberId?: string) {
  this.status = newStatus;
  if (staffMemberId) {
    this.lastUpdatedBy = staffMemberId;
  }
  return this.save();
};

ReservationSchema.methods.assignTable = function(tableId: string) {
  this.tableAssignment = this.tableAssignment || {};
  this.tableAssignment.assignedTableId = tableId;
  return this.save();
};

ReservationSchema.methods.checkIn = function(actualPartySize?: number, waitTime?: number) {
  this.timeline = this.timeline || {};
  this.timeline.customerArrived = new Date();
  
  this.service = this.service || {};
  this.service.checkIn = {
    actualArrivalTime: new Date(),
    waitTime: waitTime || 0,
    partyComplete: true,
    actualPartySize: actualPartySize || this.reservationDetails?.partySize
  };
  
  this.status = 'seated';
  return this.save();
};

ReservationSchema.methods.sendNotification = function(type: string, method: string, content?: string) {
  this.communications = this.communications || { notifications: [] };
  
  this.communications.notifications.push({
    type,
    method,
    sentAt: new Date(),
    status: 'sent',
    content: content || ''
  });
  
  // Update flags
  if (type === 'confirmation') {
    this.communications.confirmationSent = true;
  } else if (type === 'reminder') {
    this.communications.reminderSent = true;
    this.timeline.reminderSent = new Date();
  }
  
  return this.save();
};

ReservationSchema.methods.cancel = function(reason: string, cancelledBy: string, refundAmount?: number) {
  this.status = 'cancelled';
  this.cancellation = {
    cancelledBy,
    cancellationReason: reason,
    cancellationDate: new Date(),
    refundIssued: refundAmount ? refundAmount > 0 : false,
    rebookingOffered: false
  };
  
  if (refundAmount && refundAmount > 0) {
    this.payment = this.payment || {};
    this.payment.refundAmount = refundAmount;
  }
  
  return this.save();
};

ReservationSchema.methods.addToWaitlist = function(position?: number) {
  this.status = 'waitlisted';
  this.waitlist = {
    isWaitlisted: true,
    waitlistPosition: position || 1,
    waitlistDate: new Date(),
    estimatedWaitTime: (position || 1) * 30, // Rough estimate
    notifyWhenAvailable: true,
    autoAcceptIfAvailable: false
  };
  
  return this.save();
};

ReservationSchema.methods.addFeedback = function(ratings: any, comments?: string) {
  this.feedback = {
    customerRating: ratings,
    comments: comments || '',
    feedbackDate: new Date(),
    wouldRecommend: ratings.overall >= 4,
    followUpRequired: ratings.overall <= 2
  };
  
  return this.save();
};

ReservationSchema.statics.findByProperty = function(propertyId: string) {
  return this.find({ propertyId }).sort({ 'reservationDetails.reservationDate': -1 });
};

ReservationSchema.statics.findTodayReservations = function(propertyId: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  return this.find({
    propertyId,
    'reservationDetails.reservationDate': { $gte: today, $lt: tomorrow }
  }).sort({ 'reservationDetails.reservationTime': 1 });
};

ReservationSchema.statics.findUpcoming = function(propertyId: string, hours = 2) {
  const now = new Date();
  const futureTime = new Date(now.getTime() + (hours * 60 * 60 * 1000));
  
  return this.find({
    propertyId,
    status: { $in: ['confirmed', 'pending'] },
    'reservationDetails.reservationDate': { $gte: now, $lte: futureTime }
  }).sort({ 'reservationDetails.reservationDate': 1 });
};

ReservationSchema.statics.findByTable = function(tableId: string, date?: Date) {
  let query: any = { 'tableAssignment.assignedTableId': tableId };
  
  if (date) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    
    query['reservationDetails.reservationDate'] = { $gte: startOfDay, $lte: endOfDay };
  }
  
  return this.find(query).sort({ 'reservationDetails.reservationTime': 1 });
};

ReservationSchema.statics.getOccupancyReport = function(propertyId: string, startDate: Date, endDate: Date) {
  return this.aggregate([
    {
      $match: {
        propertyId,
        'reservationDetails.reservationDate': { $gte: startDate, $lte: endDate },
        status: { $ne: 'cancelled' }
      }
    },
    {
      $group: {
        _id: {
          date: { $dateToString: { format: '%Y-%m-%d', date: '$reservationDetails.reservationDate' } },
          hour: { $toInt: { $substr: ['$reservationDetails.reservationTime', 0, 2] } }
        },
        totalReservations: { $sum: 1 },
        totalGuests: { $sum: '$reservationDetails.partySize' },
        averagePartySize: { $avg: '$reservationDetails.partySize' }
      }
    },
    { $sort: { '_id.date': 1, '_id.hour': 1 } }
  ]);
};

ReservationSchema.set('toJSON', { virtuals: true });
ReservationSchema.set('toObject', { virtuals: true });

const Reservation = models.Reservation || model('Reservation', ReservationSchema);

export default Reservation;