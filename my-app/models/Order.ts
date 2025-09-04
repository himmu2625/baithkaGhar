import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IOrder extends Document {
  _id: Types.ObjectId;
  propertyId: Types.ObjectId;
  orderNumber: string;
  orderType: 'dine_in' | 'takeaway' | 'room_service' | 'delivery';

  // Customer Information
  guestInfo: {
    guestId?: Types.ObjectId;
    name: string;
    phone: string;
    email?: string;
    roomNumber?: string;
  };

  // Order Details
  items: [{
    itemId: Types.ObjectId;
    quantity: number;
    unitPrice: number;
    modifiers: [{
      modifierId: Types.ObjectId;
      selectedOptions: [{
        optionIndex: number;
        quantity: number;
        priceAdjustment: number;
      }];
    }];
    specialInstructions?: string;
    subtotal: number;
  }];

  // Pricing
  pricing: {
    subtotal: number;
    tax: number;
    serviceCharge: number;
    deliveryFee: number;
    discount: number;
    total: number;
  };

  // Operations
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'served' | 'delivered' | 'cancelled';
  tableId?: Types.ObjectId;
  assignedWaiter?: Types.ObjectId;
  assignedChef?: Types.ObjectId;

  // Timing
  timestamps: {
    ordered: Date;
    confirmed?: Date;
    preparing?: Date;
    ready?: Date;
    served?: Date;
    delivered?: Date;
    cancelled?: Date;
    estimatedReady?: Date;
  };

  // Payment
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  paymentMethod?: 'cash' | 'card' | 'room_charge' | 'upi' | 'online';
  paymentDetails?: {
    transactionId?: string;
    paymentGateway?: string;
    paidAmount?: number;
    paidAt?: Date;
  };

  // Delivery Information (for delivery orders)
  deliveryInfo?: {
    address: string;
    instructions?: string;
    estimatedDeliveryTime?: Date;
    deliveryPersonId?: Types.ObjectId;
    actualDeliveryTime?: Date;
  };

  // Additional fields
  specialInstructions?: string;
  estimatedPreparationTime?: number; // minutes
  priorityLevel: 'low' | 'medium' | 'high' | 'urgent';
  source: 'pos' | 'online' | 'app' | 'phone' | 'walk_in';
  notes?: string;

  // Metadata
  createdBy: Types.ObjectId;
  lastUpdatedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;

  // Methods
  calculateTotal(): number;
  updateStatus(status: string): Promise<IOrder>;
  addPayment(paymentDetails: any): Promise<IOrder>;
}

const OrderSchema = new Schema<IOrder>({
  propertyId: {
    type: Schema.Types.ObjectId,
    ref: 'Property',
    required: [true, 'Property ID is required'],
    index: true
  },

  orderNumber: {
    type: String,
    required: [true, 'Order number is required'],
    unique: true,
    trim: true,
    maxlength: [50, 'Order number cannot exceed 50 characters']
  },

  orderType: {
    type: String,
    required: [true, 'Order type is required'],
    enum: {
      values: ['dine_in', 'takeaway', 'room_service', 'delivery'],
      message: 'Invalid order type'
    },
    index: true
  },

  guestInfo: {
    guestId: {
      type: Schema.Types.ObjectId,
      ref: 'Guest'
    },
    name: {
      type: String,
      required: [true, 'Guest name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters']
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      validate: {
        validator: function(v: string) {
          return /^[+]?[\d\s\-\(\)]+$/.test(v);
        },
        message: 'Invalid phone number format'
      }
    },
    email: {
      type: String,
      validate: {
        validator: function(v: string) {
          return !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
        },
        message: 'Invalid email format'
      }
    },
    roomNumber: {
      type: String,
      maxlength: [20, 'Room number cannot exceed 20 characters']
    }
  },

  items: [{
    itemId: {
      type: Schema.Types.ObjectId,
      ref: 'MenuItem',
      required: [true, 'Item ID is required']
    },
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: [1, 'Quantity must be at least 1']
    },
    unitPrice: {
      type: Number,
      required: [true, 'Unit price is required'],
      min: [0, 'Unit price cannot be negative']
    },
    modifiers: [{
      modifierId: {
        type: Schema.Types.ObjectId,
        ref: 'MenuModifier',
        required: true
      },
      selectedOptions: [{
        optionIndex: {
          type: Number,
          required: true,
          min: 0
        },
        quantity: {
          type: Number,
          default: 1,
          min: 1
        },
        priceAdjustment: {
          type: Number,
          default: 0
        }
      }]
    }],
    specialInstructions: {
      type: String,
      maxlength: [500, 'Special instructions cannot exceed 500 characters']
    },
    subtotal: {
      type: Number,
      required: [true, 'Subtotal is required'],
      min: [0, 'Subtotal cannot be negative']
    }
  }],

  pricing: {
    subtotal: {
      type: Number,
      required: [true, 'Subtotal is required'],
      min: [0, 'Subtotal cannot be negative']
    },
    tax: {
      type: Number,
      default: 0,
      min: [0, 'Tax cannot be negative']
    },
    serviceCharge: {
      type: Number,
      default: 0,
      min: [0, 'Service charge cannot be negative']
    },
    deliveryFee: {
      type: Number,
      default: 0,
      min: [0, 'Delivery fee cannot be negative']
    },
    discount: {
      type: Number,
      default: 0,
      min: [0, 'Discount cannot be negative']
    },
    total: {
      type: Number,
      required: [true, 'Total is required'],
      min: [0, 'Total cannot be negative']
    }
  },

  status: {
    type: String,
    required: [true, 'Status is required'],
    enum: {
      values: ['pending', 'confirmed', 'preparing', 'ready', 'served', 'delivered', 'cancelled'],
      message: 'Invalid order status'
    },
    default: 'pending',
    index: true
  },

  tableId: {
    type: Schema.Types.ObjectId,
    ref: 'Table',
    index: true
  },

  assignedWaiter: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },

  assignedChef: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },

  timestamps: {
    ordered: {
      type: Date,
      required: [true, 'Order timestamp is required'],
      default: Date.now
    },
    confirmed: Date,
    preparing: Date,
    ready: Date,
    served: Date,
    delivered: Date,
    cancelled: Date,
    estimatedReady: Date
  },

  paymentStatus: {
    type: String,
    required: [true, 'Payment status is required'],
    enum: {
      values: ['pending', 'paid', 'failed', 'refunded'],
      message: 'Invalid payment status'
    },
    default: 'pending',
    index: true
  },

  paymentMethod: {
    type: String,
    enum: {
      values: ['cash', 'card', 'room_charge', 'upi', 'online'],
      message: 'Invalid payment method'
    }
  },

  paymentDetails: {
    transactionId: String,
    paymentGateway: String,
    paidAmount: {
      type: Number,
      min: 0
    },
    paidAt: Date
  },

  deliveryInfo: {
    address: {
      type: String,
      maxlength: [500, 'Address cannot exceed 500 characters']
    },
    instructions: {
      type: String,
      maxlength: [500, 'Instructions cannot exceed 500 characters']
    },
    estimatedDeliveryTime: Date,
    deliveryPersonId: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    actualDeliveryTime: Date
  },

  specialInstructions: {
    type: String,
    maxlength: [1000, 'Special instructions cannot exceed 1000 characters']
  },

  estimatedPreparationTime: {
    type: Number,
    min: [0, 'Preparation time cannot be negative']
  },

  priorityLevel: {
    type: String,
    enum: {
      values: ['low', 'medium', 'high', 'urgent'],
      message: 'Invalid priority level'
    },
    default: 'medium'
  },

  source: {
    type: String,
    required: [true, 'Source is required'],
    enum: {
      values: ['pos', 'online', 'app', 'phone', 'walk_in'],
      message: 'Invalid order source'
    },
    default: 'pos'
  },

  notes: {
    type: String,
    maxlength: [1000, 'Notes cannot exceed 1000 characters']
  },

  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Created by user is required']
  },

  lastUpdatedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true,
  toJSON: { 
    virtuals: true,
    transform: function(doc, ret) {
      delete ret.__v;
      return ret;
    }
  },
  toObject: { virtuals: true }
});

// Indexes for performance
OrderSchema.index({ propertyId: 1, orderNumber: 1 }, { unique: true });
OrderSchema.index({ propertyId: 1, status: 1 });
OrderSchema.index({ propertyId: 1, orderType: 1 });
OrderSchema.index({ propertyId: 1, paymentStatus: 1 });
OrderSchema.index({ 'guestInfo.guestId': 1 });
OrderSchema.index({ tableId: 1 });
OrderSchema.index({ assignedWaiter: 1 });
OrderSchema.index({ assignedChef: 1 });
OrderSchema.index({ 'timestamps.ordered': -1 });
OrderSchema.index({ priorityLevel: 1 });
OrderSchema.index({ source: 1 });

// Virtual for total preparation time
OrderSchema.virtual('totalPreparationTime').get(function() {
  return this.estimatedPreparationTime || 
         this.items.reduce((total: number, item: any) => total + (item.preparationTime || 15), 0);
});

// Virtual for order duration
OrderSchema.virtual('orderDuration').get(function() {
  if (!this.timestamps.ordered) return 0;
  
  const endTime = this.timestamps.served || 
                  this.timestamps.delivered || 
                  this.timestamps.cancelled || 
                  new Date();
  
  return Math.floor((endTime.getTime() - this.timestamps.ordered.getTime()) / (1000 * 60)); // minutes
});

// Virtual for estimated completion time
OrderSchema.virtual('estimatedCompletion').get(function() {
  if (this.timestamps.estimatedReady) {
    return this.timestamps.estimatedReady;
  }
  
  const prepTime = (this as any).totalPreparationTime;
  const startTime = this.timestamps.preparing || this.timestamps.confirmed || this.timestamps.ordered;
  
  return new Date(startTime.getTime() + (prepTime * 60 * 1000));
});

// Pre-save middleware
OrderSchema.pre('save', function(next) {
  if (this.isModified() && !this.isNew) {
    this.lastUpdatedBy = this.createdBy; // This should be set by the API
  }
  
  // Validate delivery info for delivery orders
  if (this.orderType === 'delivery' && !this.deliveryInfo?.address) {
    return next(new Error('Delivery address is required for delivery orders'));
  }
  
  // Validate room number for room service
  if (this.orderType === 'room_service' && !this.guestInfo?.roomNumber) {
    return next(new Error('Room number is required for room service orders'));
  }
  
  next();
});

// Instance methods
OrderSchema.methods.calculateTotal = function(): number {
  const itemsTotal = this.items.reduce((total: number, item: any) => {
    const modifiersTotal = item.modifiers.reduce((modTotal: number, modifier: any) => {
      return modTotal + modifier.selectedOptions.reduce((optTotal: number, option: any) => {
        return optTotal + (option.priceAdjustment * option.quantity);
      }, 0);
    }, 0);
    
    return total + ((item.unitPrice + modifiersTotal) * item.quantity);
  }, 0);
  
  const subtotal = itemsTotal;
  const total = subtotal + this.pricing.tax + this.pricing.serviceCharge + 
                this.pricing.deliveryFee - this.pricing.discount;
  
  return Math.max(0, total);
};

OrderSchema.methods.updateStatus = function(status: string): Promise<IOrder> {
  this.status = status;
  
  // Update timestamps based on status
  const now = new Date();
  switch (status) {
    case 'confirmed':
      this.timestamps.confirmed = now;
      break;
    case 'preparing':
      this.timestamps.preparing = now;
      break;
    case 'ready':
      this.timestamps.ready = now;
      break;
    case 'served':
      this.timestamps.served = now;
      break;
    case 'delivered':
      this.timestamps.delivered = now;
      break;
    case 'cancelled':
      this.timestamps.cancelled = now;
      break;
  }
  
  return this.save();
};

OrderSchema.methods.addPayment = function(paymentDetails: any): Promise<IOrder> {
  this.paymentStatus = 'paid';
  this.paymentMethod = paymentDetails.method;
  this.paymentDetails = {
    ...this.paymentDetails,
    ...paymentDetails,
    paidAt: new Date()
  };
  
  return this.save();
};

// Static methods
OrderSchema.statics.findByProperty = function(propertyId: Types.ObjectId, filters: any = {}) {
  return this.find({ propertyId, ...filters })
    .sort({ 'timestamps.ordered': -1 })
    .populate('tableId', 'number section')
    .populate('items.itemId', 'name basePrice preparationTime')
    .populate('assignedWaiter', 'fullName')
    .populate('assignedChef', 'fullName')
    .populate('createdBy', 'fullName')
    .populate('lastUpdatedBy', 'fullName');
};

OrderSchema.statics.findActiveOrders = function(propertyId: Types.ObjectId) {
  return (this as any).findByProperty(propertyId, { 
    status: { $in: ['pending', 'confirmed', 'preparing', 'ready'] } 
  });
};

OrderSchema.statics.findTodaysOrders = function(propertyId: Types.ObjectId) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  return (this as any).findByProperty(propertyId, {
    'timestamps.ordered': {
      $gte: today,
      $lt: tomorrow
    }
  });
};

OrderSchema.statics.findByStatus = function(propertyId: Types.ObjectId, status: string) {
  return (this as any).findByProperty(propertyId, { status });
};

OrderSchema.statics.findByTable = function(propertyId: Types.ObjectId, tableId: Types.ObjectId) {
  return (this as any).findByProperty(propertyId, { tableId });
};

const Order = mongoose.models.Order || mongoose.model<IOrder>('Order', OrderSchema);

export default Order;