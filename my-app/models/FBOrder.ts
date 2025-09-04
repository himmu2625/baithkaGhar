import { Schema, model, models } from 'mongoose';

const FBOrderSchema = new Schema({
  propertyId: {
    type: String,
    required: true,
    ref: 'Property'
  },
  
  orderNumber: {
    type: String,
    required: true,
    unique: true
  },
  
  orderType: {
    type: String,
    enum: ['dine_in', 'room_service', 'takeaway', 'delivery', 'banquet', 'event_catering'],
    required: true
  },
  
  customer: {
    type: {
      type: String,
      enum: ['guest', 'walk_in', 'staff', 'event'],
      required: true
    },
    guestId: {
      type: Schema.Types.ObjectId,
      ref: 'Guest'
    },
    bookingId: {
      type: Schema.Types.ObjectId,
      ref: 'Booking'
    },
    eventBookingId: {
      type: Schema.Types.ObjectId,
      ref: 'EventBooking'
    },
    contactInfo: {
      name: String,
      phone: String,
      email: String,
      roomNumber: String
    }
  },
  
  dining: {
    tableId: {
      type: Schema.Types.ObjectId,
      ref: 'Table'
    },
    partySize: Number,
    specialOccasion: String,
    seatingPreference: {
      type: String,
      enum: ['indoor', 'outdoor', 'private_dining', 'bar_seating', 'no_preference']
    }
  },
  
  delivery: {
    address: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      landmark: String
    },
    deliveryInstructions: String,
    estimatedDeliveryTime: Date,
    actualDeliveryTime: Date,
    deliveryPartner: String,
    deliveryFee: { type: Number, default: 0 }
  },
  
  items: [{
    type: Schema.Types.ObjectId,
    ref: 'FBOrderItem',
    required: true
  }],
  
  pricing: {
    subtotal: {
      type: Number,
      required: true,
      min: 0
    },
    taxes: [{
      name: String,
      rate: Number, // percentage
      amount: Number
    }],
    discounts: [{
      type: String,
      description: String,
      amount: Number,
      percentage: Number
    }],
    serviceCharge: {
      type: Number,
      default: 0
    },
    deliveryFee: {
      type: Number,
      default: 0
    },
    packagingFee: {
      type: Number,
      default: 0
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0
    },
    currency: {
      type: String,
      default: 'INR'
    }
  },
  
  payment: {
    status: {
      type: String,
      enum: ['pending', 'partial', 'paid', 'refunded', 'failed'],
      default: 'pending'
    },
    method: {
      type: String,
      enum: ['cash', 'card', 'upi', 'wallet', 'room_charge', 'complimentary', 'staff_meal']
    },
    paidAmount: {
      type: Number,
      default: 0
    },
    transactionId: String,
    paymentDate: Date,
    refundAmount: {
      type: Number,
      default: 0
    }
  },
  
  status: {
    type: String,
    enum: ['draft', 'confirmed', 'preparing', 'ready', 'served', 'delivered', 'cancelled', 'refunded'],
    default: 'draft'
  },
  
  timeline: {
    orderPlaced: {
      type: Date,
      default: Date.now
    },
    orderConfirmed: Date,
    preparationStarted: Date,
    orderReady: Date,
    orderServed: Date,
    orderCompleted: Date,
    orderCancelled: Date
  },
  
  kitchen: {
    assignedTo: {
      type: Schema.Types.ObjectId,
      ref: 'StaffMember'
    },
    kitchenNotes: String,
    estimatedPrepTime: Number, // minutes
    actualPrepTime: Number,    // minutes
    priority: {
      type: String,
      enum: ['low', 'normal', 'high', 'urgent'],
      default: 'normal'
    }
  },
  
  service: {
    assignedWaiter: {
      type: Schema.Types.ObjectId,
      ref: 'StaffMember'
    },
    serviceNotes: String,
    specialRequests: String,
    allergies: [String],
    dietaryRestrictions: [String]
  },
  
  feedback: {
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    review: String,
    feedbackDate: Date,
    respondedBy: {
      type: Schema.Types.ObjectId,
      ref: 'StaffMember'
    },
    response: String
  },
  
  promotions: [{
    couponId: {
      type: Schema.Types.ObjectId,
      ref: 'Coupon'
    },
    discountAmount: Number,
    description: String
  }],
  
  analytics: {
    orderSource: {
      type: String,
      enum: ['pos', 'mobile_app', 'website', 'phone', 'walk_in', 'room_service_call'],
      default: 'pos'
    },
    deviceInfo: {
      userAgent: String,
      ip: String,
      platform: String
    }
  },
  
  notes: {
    customerNotes: String,
    internalNotes: String,
    kitchenNotes: String
  },
  
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'StaffMember',
    required: true
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

FBOrderSchema.pre('save', function() {
  this.updatedAt = new Date();
  
  // Generate order number if not provided
  if (!this.orderNumber) {
    const prefix = this.orderType === 'room_service' ? 'RS' : 'FB';
    const timestamp = Date.now().toString().slice(-6);
    this.orderNumber = `${prefix}${timestamp}`;
  }
  
  // Auto-update timeline based on status
  const now = new Date();
  if (this.isModified('status')) {
    switch (this.status) {
      case 'confirmed':
        if (!this.timeline?.orderConfirmed) this.timeline.orderConfirmed = now;
        break;
      case 'preparing':
        if (!this.timeline?.preparationStarted) this.timeline.preparationStarted = now;
        break;
      case 'ready':
        if (!this.timeline?.orderReady) this.timeline.orderReady = now;
        break;
      case 'served':
      case 'delivered':
        if (!this.timeline?.orderServed) this.timeline.orderServed = now;
        break;
      case 'cancelled':
        if (!this.timeline?.orderCancelled) this.timeline.orderCancelled = now;
        break;
    }
  }
});

FBOrderSchema.index({ propertyId: 1, status: 1 });
FBOrderSchema.index({ orderNumber: 1 }, { unique: true });
FBOrderSchema.index({ orderType: 1 });
FBOrderSchema.index({ 'customer.guestId': 1 });
FBOrderSchema.index({ 'customer.bookingId': 1 });
FBOrderSchema.index({ 'dining.tableId': 1 });
FBOrderSchema.index({ createdAt: -1 });
FBOrderSchema.index({ 'timeline.orderPlaced': -1 });

FBOrderSchema.methods.updateStatus = function(newStatus: string, staffMemberId?: string) {
  this.status = newStatus;
  if (staffMemberId) {
    this.lastUpdatedBy = staffMemberId;
  }
  return this.save();
};

FBOrderSchema.methods.calculateTotal = function() {
  let subtotal = 0;
  // Note: This assumes items are populated with their pricing
  if (this.populated('items')) {
    this.items.forEach((item: any) => {
      subtotal += item.totalPrice || 0;
    });
  }
  
  this.pricing.subtotal = subtotal;
  
  let total = subtotal;
  
  // Add taxes
  if (this.pricing.taxes) {
    this.pricing.taxes.forEach(tax => {
      tax.amount = (subtotal * tax.rate) / 100;
      total += tax.amount;
    });
  }
  
  // Add fees
  total += this.pricing.serviceCharge || 0;
  total += this.pricing.deliveryFee || 0;
  total += this.pricing.packagingFee || 0;
  
  // Apply discounts
  if (this.pricing.discounts) {
    this.pricing.discounts.forEach(discount => {
      if (discount.percentage) {
        discount.amount = (total * discount.percentage) / 100;
      }
      total -= discount.amount || 0;
    });
  }
  
  this.pricing.totalAmount = Math.max(0, total);
  return this.pricing.totalAmount;
};

FBOrderSchema.methods.canBeCancelled = function() {
  return ['draft', 'confirmed'].includes(this.status);
};

FBOrderSchema.methods.getEstimatedReadyTime = function() {
  if (this.kitchen?.estimatedPrepTime && this.timeline?.preparationStarted) {
    return new Date(this.timeline.preparationStarted.getTime() + (this.kitchen.estimatedPrepTime * 60000));
  }
  return null;
};

FBOrderSchema.statics.findByProperty = function(propertyId: string) {
  return this.find({ propertyId }).sort({ createdAt: -1 });
};

FBOrderSchema.statics.findActiveOrders = function(propertyId: string) {
  return this.find({ 
    propertyId, 
    status: { $in: ['confirmed', 'preparing', 'ready'] }
  }).sort({ 'kitchen.priority': -1, createdAt: 1 });
};

FBOrderSchema.statics.findByGuest = function(guestId: string) {
  return this.find({ 'customer.guestId': guestId }).sort({ createdAt: -1 });
};

FBOrderSchema.statics.findByTable = function(tableId: string) {
  return this.find({ 'dining.tableId': tableId, status: { $ne: 'cancelled' } })
    .sort({ createdAt: -1 });
};

FBOrderSchema.statics.getTodayOrders = function(propertyId: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  return this.find({
    propertyId,
    createdAt: { $gte: today, $lt: tomorrow }
  }).sort({ createdAt: -1 });
};

const FBOrder = models.FBOrder || model('FBOrder', FBOrderSchema);

export default FBOrder;