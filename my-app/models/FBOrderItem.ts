import { Schema, model, models } from 'mongoose';

const FBOrderItemSchema = new Schema({
  orderId: {
    type: Schema.Types.ObjectId,
    ref: 'FBOrder',
    required: true
  },
  
  menuItemId: {
    type: Schema.Types.ObjectId,
    ref: 'MenuItem',
    required: true
  },
  
  itemDetails: {
    name: {
      type: String,
      required: true
    },
    description: String,
    categoryName: String,
    basePrice: {
      type: Number,
      required: true,
      min: 0
    },
    portionSize: String // "Small", "Medium", "Large", etc.
  },
  
  quantity: {
    type: Number,
    required: true,
    min: 1,
    default: 1
  },
  
  modifiers: [{
    modifierId: {
      type: Schema.Types.ObjectId,
      ref: 'MenuModifier'
    },
    modifierName: String,
    selectedOptions: [{
      optionName: String,
      quantity: { type: Number, default: 1 },
      priceAdjustment: { type: Number, default: 0 }
    }],
    totalAdjustment: { type: Number, default: 0 }
  }],
  
  customizations: {
    specialInstructions: String,
    allergies: [String],
    dietaryRestrictions: [String],
    spiceLevel: {
      type: String,
      enum: ['mild', 'medium', 'hot', 'extra_hot']
    },
    cookingPreference: String, // "Well done", "Medium rare", etc.
    additionalRequests: String
  },
  
  pricing: {
    unitPrice: {
      type: Number,
      required: true
    }, // Base price + modifier adjustments
    totalPrice: {
      type: Number,
      required: true
    }, // Unit price * quantity
    discountApplied: {
      type: Number,
      default: 0
    }
  },
  
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'preparing', 'ready', 'served', 'cancelled'],
    default: 'pending'
  },
  
  kitchen: {
    assignedChef: {
      type: Schema.Types.ObjectId,
      ref: 'StaffMember'
    },
    kitchenStation: String,
    preparationStarted: Date,
    preparationCompleted: Date,
    actualPrepTime: Number, // minutes
    kitchenNotes: String,
    qualityRating: {
      type: Number,
      min: 1,
      max: 5
    }
  },
  
  service: {
    servedBy: {
      type: Schema.Types.ObjectId,
      ref: 'StaffMember'
    },
    servedAt: Date,
    temperature: {
      type: String,
      enum: ['hot', 'warm', 'cold', 'room_temp']
    },
    presentation: {
      type: String,
      enum: ['excellent', 'good', 'average', 'poor']
    }
  },
  
  feedback: {
    customerRating: {
      type: Number,
      min: 1,
      max: 5
    },
    customerComments: String,
    wouldOrderAgain: Boolean,
    issuesReported: [String]
  },
  
  timeline: {
    orderPlaced: {
      type: Date,
      default: Date.now
    },
    kitchenReceived: Date,
    preparationStarted: Date,
    preparationCompleted: Date,
    qualityChecked: Date,
    served: Date,
    feedbackReceived: Date
  },
  
  returnOrExchange: {
    isReturned: {
      type: Boolean,
      default: false
    },
    returnReason: String,
    returnedAt: Date,
    replacementItemId: {
      type: Schema.Types.ObjectId,
      ref: 'FBOrderItem'
    },
    refundAmount: {
      type: Number,
      default: 0
    }
  },
  
  nutritionalInfo: {
    calories: Number,
    protein: Number,
    carbs: Number,
    fat: Number,
    allergens: [String]
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

FBOrderItemSchema.pre('save', function() {
  this.updatedAt = new Date();
  
  // Calculate unit price including modifiers
  let unitPrice = this.itemDetails?.basePrice || 0;
  
  if (this.modifiers) {
    this.modifiers.forEach(modifier => {
      let modifierTotal = 0;
      if (modifier.selectedOptions) {
        modifier.selectedOptions.forEach(option => {
          modifierTotal += (option.priceAdjustment || 0) * (option.quantity || 1);
        });
      }
      modifier.totalAdjustment = modifierTotal;
      unitPrice += modifierTotal;
    });
  }
  
  this.pricing.unitPrice = unitPrice;
  this.pricing.totalPrice = (unitPrice * this.quantity) - (this.pricing.discountApplied || 0);
  
  // Update timeline based on status changes
  if (this.isModified('status')) {
    const now = new Date();
    switch (this.status) {
      case 'preparing':
        if (!this.timeline?.preparationStarted) {
          this.timeline.preparationStarted = now;
          this.kitchen = this.kitchen || {};
          this.kitchen.preparationStarted = now;
        }
        break;
      case 'ready':
        if (!this.timeline?.preparationCompleted) {
          this.timeline.preparationCompleted = now;
          this.kitchen = this.kitchen || {};
          this.kitchen.preparationCompleted = now;
          
          // Calculate actual prep time
          if (this.kitchen.preparationStarted) {
            this.kitchen.actualPrepTime = Math.round(
              (now.getTime() - this.kitchen.preparationStarted.getTime()) / 60000
            );
          }
        }
        break;
      case 'served':
        if (!this.timeline?.served) {
          this.timeline.served = now;
          this.service = this.service || {};
          this.service.servedAt = now;
        }
        break;
    }
  }
});

FBOrderItemSchema.index({ orderId: 1 });
FBOrderItemSchema.index({ menuItemId: 1 });
FBOrderItemSchema.index({ status: 1 });
FBOrderItemSchema.index({ 'kitchen.assignedChef': 1 });
FBOrderItemSchema.index({ createdAt: -1 });

FBOrderItemSchema.methods.updateStatus = function(newStatus: string, staffMemberId?: string) {
  this.status = newStatus;
  if (staffMemberId) {
    this.lastUpdatedBy = staffMemberId;
  }
  return this.save();
};

FBOrderItemSchema.methods.assignToChef = function(chefId: string, kitchenStation?: string) {
  this.kitchen = this.kitchen || {};
  this.kitchen.assignedChef = chefId;
  if (kitchenStation) {
    this.kitchen.kitchenStation = kitchenStation;
  }
  this.timeline.kitchenReceived = new Date();
  return this.save();
};

FBOrderItemSchema.methods.addFeedback = function(rating: number, comments?: string) {
  this.feedback = this.feedback || {};
  this.feedback.customerRating = rating;
  if (comments) {
    this.feedback.customerComments = comments;
  }
  this.timeline.feedbackReceived = new Date();
  return this.save();
};

FBOrderItemSchema.methods.processReturn = function(reason: string, refundAmount?: number) {
  this.returnOrExchange = this.returnOrExchange || {};
  this.returnOrExchange.isReturned = true;
  this.returnOrExchange.returnReason = reason;
  this.returnOrExchange.returnedAt = new Date();
  if (refundAmount !== undefined) {
    this.returnOrExchange.refundAmount = refundAmount;
  }
  this.status = 'cancelled';
  return this.save();
};

FBOrderItemSchema.methods.getEstimatedPrepTime = function() {
  // This would typically be calculated based on menu item prep time and current kitchen load
  // For now, return a simple estimate based on the item type
  const baseTime = 15; // minutes
  const modifierTime = (this.modifiers?.length || 0) * 2;
  return baseTime + modifierTime;
};

FBOrderItemSchema.statics.findByOrder = function(orderId: string) {
  return this.find({ orderId }).populate('menuItemId').sort({ createdAt: 1 });
};

FBOrderItemSchema.statics.findActiveKitchenItems = function() {
  return this.find({ 
    status: { $in: ['confirmed', 'preparing'] }
  }).populate(['orderId', 'menuItemId']).sort({ 
    'timeline.kitchenReceived': 1 
  });
};

FBOrderItemSchema.statics.findByChef = function(chefId: string) {
  return this.find({ 
    'kitchen.assignedChef': chefId,
    status: { $in: ['preparing', 'ready'] }
  }).populate(['orderId', 'menuItemId']).sort({ 
    'timeline.preparationStarted': 1 
  });
};

FBOrderItemSchema.statics.getItemAnalytics = function(menuItemId: string, dateRange?: { start: Date, end: Date }) {
  const matchQuery: any = { menuItemId };
  
  if (dateRange) {
    matchQuery.createdAt = { $gte: dateRange.start, $lte: dateRange.end };
  }
  
  return this.aggregate([
    { $match: matchQuery },
    {
      $group: {
        _id: '$menuItemId',
        totalOrdered: { $sum: '$quantity' },
        totalRevenue: { $sum: '$pricing.totalPrice' },
        averageRating: { $avg: '$feedback.customerRating' },
        averagePrepTime: { $avg: '$kitchen.actualPrepTime' },
        returnRate: {
          $avg: { $cond: ['$returnOrExchange.isReturned', 1, 0] }
        }
      }
    }
  ]);
};

const FBOrderItem = models.FBOrderItem || model('FBOrderItem', FBOrderItemSchema);

export default FBOrderItem;