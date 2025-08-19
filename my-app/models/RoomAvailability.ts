import mongoose, { Schema, Document } from 'mongoose';

export interface IRoomAvailability extends Document {
  propertyId: mongoose.Types.ObjectId;
  roomId: mongoose.Types.ObjectId;
  roomTypeId: mongoose.Types.ObjectId;
  date: Date;
  isAvailable: boolean;
  
  // Booking information
  bookingId?: mongoose.Types.ObjectId;
  reservationType?: 'confirmed' | 'pending' | 'blocked' | 'maintenance' | 'owner_use' | 'event';
  
  // Pricing for this specific date
  pricing: {
    baseRate: number;
    dynamicRate: number;
    finalRate: number;
    currency: string;
    rateType: 'base' | 'seasonal' | 'dynamic' | 'event' | 'promotion' | 'manual';
    appliedDiscounts: [{
      discountType: 'early_bird' | 'last_minute' | 'weekly' | 'monthly' | 'group' | 'loyalty' | 'promotion';
      discountAmount: number;
      discountPercentage: number;
    }];
  };
  
  // Availability restrictions
  restrictions: {
    minimumStay: number;
    maximumStay: number;
    checkInAllowed: boolean;
    checkOutAllowed: boolean;
    closedToArrival: boolean;
    closedToDeparture: boolean;
    stopSell: boolean; // Completely unavailable for booking
  };
  
  // Inventory details
  inventory: {
    totalRooms: number;
    availableRooms: number;
    bookedRooms: number;
    blockedRooms: number;
    maintenanceRooms: number;
    allotmentRooms: number; // Rooms allocated to travel agents/partners
  };
  
  // Demand and competition data
  marketData: {
    demandLevel: 'low' | 'medium' | 'high' | 'very_high';
    competitorAverageRate?: number;
    localEvents: string[];
    weatherForecast?: string;
    holidayType?: 'public' | 'religious' | 'local' | 'international' | 'none';
  };
  
  // Channel management
  channelAvailability: [{
    channel: 'direct' | 'booking.com' | 'expedia' | 'airbnb' | 'agoda' | 'makemytrip' | 'goibibo' | 'travel_agent';
    isAvailable: boolean;
    rate: number;
    inventory: number;
    lastUpdated: Date;
    restrictions: {
      minimumStay: number;
      closedToArrival: boolean;
      closedToDeparture: boolean;
    };
  }];
  
  // Revenue management
  revenueData: {
    expectedRevenue: number;
    actualRevenue?: number;
    revenuePotential: number;
    occupancyForecast: number;
    rateOptimizationScore: number; // 0-100
  };
  
  // Booking patterns
  bookingMetrics: {
    inquiries: number;
    bookingAttempts: number;
    successfulBookings: number;
    cancellations: number;
    noShows: number;
    conversionRate: number;
  };
  
  // Housekeeping schedule
  housekeeping: {
    scheduledCleaning: boolean;
    cleaningTime?: Date;
    cleaningDuration: number; // in minutes
    assignedStaff?: mongoose.Types.ObjectId;
    cleaningType: 'standard' | 'deep' | 'maintenance' | 'checkout' | 'checkin';
    specialInstructions?: string;
  };
  
  // Maintenance schedule
  maintenance: {
    scheduledMaintenance: boolean;
    maintenanceType?: 'preventive' | 'corrective' | 'inspection' | 'renovation';
    scheduledTime?: Date;
    estimatedDuration?: number; // in hours
    assignedTechnician?: mongoose.Types.ObjectId;
    maintenanceNotes?: string;
    affectsAvailability: boolean;
  };
  
  // Special events or notes
  specialNotes: {
    internalNotes?: string;
    guestNotes?: string;
    staffNotes?: string;
    alertLevel?: 'info' | 'warning' | 'critical';
    flagged: boolean;
    flagReason?: string;
  };
  
  // Automation settings
  automation: {
    autoPricingEnabled: boolean;
    autoAvailabilityUpdate: boolean;
    priceOptimizationRules: [{
      ruleName: string;
      condition: string;
      action: string;
      isActive: boolean;
    }];
  };
  
  // Sync status with channels
  syncStatus: {
    lastSyncAttempt: Date;
    lastSuccessfulSync: Date;
    pendingUpdates: string[];
    syncErrors: string[];
    channelSyncStatus: [{
      channel: string;
      lastSync: Date;
      status: 'success' | 'failed' | 'pending';
      error?: string;
    }];
  };
  
  // Analytics data
  analytics: {
    viewCount: number;
    searchCount: number;
    clickThroughRate: number;
    bounceRate: number;
    averageSearchPosition: number;
    competitorRankings: [{
      competitor: string;
      theirRate: number;
      position: number;
    }];
  };
  
  // Overbooking protection
  overbookingProtection: {
    allowOverbooking: boolean;
    overbookingLimit: number;
    overbookingPenalty: number;
    riskLevel: 'low' | 'medium' | 'high';
  };
  
  lastUpdated: Date;
  updatedBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const RoomAvailabilitySchema = new Schema<IRoomAvailability>({
  propertyId: { 
    type: Schema.Types.ObjectId, 
    ref: 'Property', 
    required: true 
  },
  roomId: { 
    type: Schema.Types.ObjectId, 
    ref: 'Room', 
    required: true 
  },
  roomTypeId: { 
    type: Schema.Types.ObjectId, 
    ref: 'RoomType', 
    required: true 
  },
  date: { 
    type: Date, 
    required: true 
  },
  isAvailable: { 
    type: Boolean, 
    default: true 
  },
  bookingId: { 
    type: Schema.Types.ObjectId, 
    ref: 'Booking' 
  },
  reservationType: { 
    type: String, 
    enum: ['confirmed', 'pending', 'blocked', 'maintenance', 'owner_use', 'event'] 
  },
  pricing: {
    baseRate: { type: Number, required: true, min: 0 },
    dynamicRate: { type: Number, required: true, min: 0 },
    finalRate: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'INR' },
    rateType: { 
      type: String, 
      enum: ['base', 'seasonal', 'dynamic', 'event', 'promotion', 'manual'],
      default: 'base' 
    },
    appliedDiscounts: [{
      discountType: { 
        type: String, 
        enum: ['early_bird', 'last_minute', 'weekly', 'monthly', 'group', 'loyalty', 'promotion'],
        required: true 
      },
      discountAmount: { type: Number, default: 0, min: 0 },
      discountPercentage: { type: Number, default: 0, min: 0, max: 100 }
    }]
  },
  restrictions: {
    minimumStay: { type: Number, default: 1, min: 1 },
    maximumStay: { type: Number, default: 365, min: 1 },
    checkInAllowed: { type: Boolean, default: true },
    checkOutAllowed: { type: Boolean, default: true },
    closedToArrival: { type: Boolean, default: false },
    closedToDeparture: { type: Boolean, default: false },
    stopSell: { type: Boolean, default: false }
  },
  inventory: {
    totalRooms: { type: Number, required: true, min: 0 },
    availableRooms: { type: Number, required: true, min: 0 },
    bookedRooms: { type: Number, default: 0, min: 0 },
    blockedRooms: { type: Number, default: 0, min: 0 },
    maintenanceRooms: { type: Number, default: 0, min: 0 },
    allotmentRooms: { type: Number, default: 0, min: 0 }
  },
  marketData: {
    demandLevel: { 
      type: String, 
      enum: ['low', 'medium', 'high', 'very_high'],
      default: 'medium' 
    },
    competitorAverageRate: { type: Number, min: 0 },
    localEvents: [{ type: String }],
    weatherForecast: { type: String },
    holidayType: { 
      type: String, 
      enum: ['public', 'religious', 'local', 'international', 'none'],
      default: 'none' 
    }
  },
  channelAvailability: [{
    channel: { 
      type: String, 
      enum: ['direct', 'booking.com', 'expedia', 'airbnb', 'agoda', 'makemytrip', 'goibibo', 'travel_agent'],
      required: true 
    },
    isAvailable: { type: Boolean, default: true },
    rate: { type: Number, required: true, min: 0 },
    inventory: { type: Number, required: true, min: 0 },
    lastUpdated: { type: Date, default: Date.now },
    restrictions: {
      minimumStay: { type: Number, default: 1, min: 1 },
      closedToArrival: { type: Boolean, default: false },
      closedToDeparture: { type: Boolean, default: false }
    }
  }],
  revenueData: {
    expectedRevenue: { type: Number, default: 0, min: 0 },
    actualRevenue: { type: Number, min: 0 },
    revenuePotential: { type: Number, default: 0, min: 0 },
    occupancyForecast: { type: Number, default: 0, min: 0, max: 100 },
    rateOptimizationScore: { type: Number, default: 50, min: 0, max: 100 }
  },
  bookingMetrics: {
    inquiries: { type: Number, default: 0, min: 0 },
    bookingAttempts: { type: Number, default: 0, min: 0 },
    successfulBookings: { type: Number, default: 0, min: 0 },
    cancellations: { type: Number, default: 0, min: 0 },
    noShows: { type: Number, default: 0, min: 0 },
    conversionRate: { type: Number, default: 0, min: 0, max: 100 }
  },
  housekeeping: {
    scheduledCleaning: { type: Boolean, default: false },
    cleaningTime: { type: Date },
    cleaningDuration: { type: Number, default: 30, min: 1 },
    assignedStaff: { type: Schema.Types.ObjectId, ref: 'User' },
    cleaningType: { 
      type: String, 
      enum: ['standard', 'deep', 'maintenance', 'checkout', 'checkin'],
      default: 'standard' 
    },
    specialInstructions: { type: String }
  },
  maintenance: {
    scheduledMaintenance: { type: Boolean, default: false },
    maintenanceType: { 
      type: String, 
      enum: ['preventive', 'corrective', 'inspection', 'renovation'] 
    },
    scheduledTime: { type: Date },
    estimatedDuration: { type: Number, min: 0.5 },
    assignedTechnician: { type: Schema.Types.ObjectId, ref: 'User' },
    maintenanceNotes: { type: String },
    affectsAvailability: { type: Boolean, default: true }
  },
  specialNotes: {
    internalNotes: { type: String },
    guestNotes: { type: String },
    staffNotes: { type: String },
    alertLevel: { type: String, enum: ['info', 'warning', 'critical'] },
    flagged: { type: Boolean, default: false },
    flagReason: { type: String }
  },
  automation: {
    autoPricingEnabled: { type: Boolean, default: false },
    autoAvailabilityUpdate: { type: Boolean, default: true },
    priceOptimizationRules: [{
      ruleName: { type: String, required: true },
      condition: { type: String, required: true },
      action: { type: String, required: true },
      isActive: { type: Boolean, default: true }
    }]
  },
  syncStatus: {
    lastSyncAttempt: { type: Date, default: Date.now },
    lastSuccessfulSync: { type: Date },
    pendingUpdates: [{ type: String }],
    syncErrors: [{ type: String }],
    channelSyncStatus: [{
      channel: { type: String, required: true },
      lastSync: { type: Date, required: true },
      status: { type: String, enum: ['success', 'failed', 'pending'], required: true },
      error: { type: String }
    }]
  },
  analytics: {
    viewCount: { type: Number, default: 0, min: 0 },
    searchCount: { type: Number, default: 0, min: 0 },
    clickThroughRate: { type: Number, default: 0, min: 0, max: 100 },
    bounceRate: { type: Number, default: 0, min: 0, max: 100 },
    averageSearchPosition: { type: Number, default: 0, min: 0 },
    competitorRankings: [{
      competitor: { type: String, required: true },
      theirRate: { type: Number, required: true, min: 0 },
      position: { type: Number, required: true, min: 1 }
    }]
  },
  overbookingProtection: {
    allowOverbooking: { type: Boolean, default: false },
    overbookingLimit: { type: Number, default: 0, min: 0 },
    overbookingPenalty: { type: Number, default: 0, min: 0 },
    riskLevel: { type: String, enum: ['low', 'medium', 'high'], default: 'low' }
  },
  lastUpdated: { 
    type: Date, 
    default: Date.now 
  },
  updatedBy: { 
    type: Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better performance
RoomAvailabilitySchema.index({ propertyId: 1 });
RoomAvailabilitySchema.index({ roomId: 1 });
RoomAvailabilitySchema.index({ roomTypeId: 1 });
RoomAvailabilitySchema.index({ date: 1 });
RoomAvailabilitySchema.index({ isAvailable: 1 });
RoomAvailabilitySchema.index({ 'restrictions.stopSell': 1 });

// Compound indexes for common queries
RoomAvailabilitySchema.index({ propertyId: 1, date: 1 });
RoomAvailabilitySchema.index({ roomId: 1, date: 1 }, { unique: true });
RoomAvailabilitySchema.index({ propertyId: 1, roomTypeId: 1, date: 1 });
RoomAvailabilitySchema.index({ propertyId: 1, isAvailable: 1, date: 1 });
RoomAvailabilitySchema.index({ date: 1, isAvailable: 1 });

// Validation
RoomAvailabilitySchema.pre('save', function(next) {
  // Ensure inventory consistency
  const totalAllocated = this.inventory.bookedRooms + 
                        this.inventory.blockedRooms + 
                        this.inventory.maintenanceRooms + 
                        this.inventory.allotmentRooms;
                        
  if (totalAllocated > this.inventory.totalRooms) {
    const error = new Error('Total allocated rooms cannot exceed total rooms');
    return next(error);
  }
  
  this.inventory.availableRooms = this.inventory.totalRooms - totalAllocated;
  
  // Update availability based on inventory
  this.isAvailable = this.inventory.availableRooms > 0 && !this.restrictions.stopSell;
  
  // Calculate conversion rate
  if (this.bookingMetrics.bookingAttempts > 0) {
    this.bookingMetrics.conversionRate = 
      (this.bookingMetrics.successfulBookings / this.bookingMetrics.bookingAttempts) * 100;
  }
  
  next();
});

// Virtual for occupancy rate
RoomAvailabilitySchema.virtual('occupancyRate').get(function() {
  if (this.inventory.totalRooms === 0) return 0;
  return (this.inventory.bookedRooms / this.inventory.totalRooms) * 100;
});

// Virtual for revenue per available room
RoomAvailabilitySchema.virtual('revPAR').get(function() {
  const occupancyRate = this.inventory.totalRooms === 0 ? 0 : (this.inventory.bookedRooms / this.inventory.totalRooms) * 100;
  return (this.pricing.finalRate * occupancyRate) / 100;
});

// Methods
RoomAvailabilitySchema.methods.updatePricing = function(newRate: number, rateType: string) {
  this.pricing.finalRate = newRate;
  this.pricing.rateType = rateType;
  this.lastUpdated = new Date();
  return this.save();
};

RoomAvailabilitySchema.methods.blockRoom = function(reason: string, blockedRooms: number = 1) {
  if (this.inventory.availableRooms >= blockedRooms) {
    this.inventory.blockedRooms += blockedRooms;
    this.inventory.availableRooms -= blockedRooms;
    this.specialNotes.internalNotes = reason;
    this.lastUpdated = new Date();
    return this.save();
  }
  throw new Error('Not enough available rooms to block');
};

RoomAvailabilitySchema.methods.releaseBlock = function(releasedRooms: number = 1) {
  if (this.inventory.blockedRooms >= releasedRooms) {
    this.inventory.blockedRooms -= releasedRooms;
    this.inventory.availableRooms += releasedRooms;
    this.lastUpdated = new Date();
    return this.save();
  }
  throw new Error('Cannot release more rooms than currently blocked');
};

// Static methods
RoomAvailabilitySchema.statics.getAvailabilityRange = function(
  propertyId: string, 
  roomTypeId: string, 
  startDate: Date, 
  endDate: Date
) {
  return this.find({
    propertyId,
    roomTypeId,
    date: { $gte: startDate, $lte: endDate },
    isAvailable: true,
    'restrictions.stopSell': false
  }).sort({ date: 1 });
};

RoomAvailabilitySchema.statics.updateRateRange = function(
  propertyId: string,
  roomTypeId: string,
  startDate: Date,
  endDate: Date,
  newRate: number,
  rateType: string
) {
  return this.updateMany(
    {
      propertyId,
      roomTypeId,
      date: { $gte: startDate, $lte: endDate }
    },
    {
      $set: {
        'pricing.finalRate': newRate,
        'pricing.rateType': rateType,
        lastUpdated: new Date()
      }
    }
  );
};

RoomAvailabilitySchema.statics.getRevenueForPeriod = function(
  propertyId: string,
  startDate: Date,
  endDate: Date
) {
  return this.aggregate([
    {
      $match: {
        propertyId: new mongoose.Types.ObjectId(propertyId),
        date: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: null,
        totalRevenue: { $sum: '$revenueData.actualRevenue' },
        expectedRevenue: { $sum: '$revenueData.expectedRevenue' },
        averageRate: { $avg: '$pricing.finalRate' },
        totalOccupancy: { $avg: '$occupancyRate' }
      }
    }
  ]);
};

export default mongoose.models.RoomAvailability || mongoose.model<IRoomAvailability>('RoomAvailability', RoomAvailabilitySchema);