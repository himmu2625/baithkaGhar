import mongoose, { Schema, Document } from "mongoose";

export interface IEnhancedRoom extends Document {
  propertyId: mongoose.Types.ObjectId;
  roomNumber: string;
  roomType: string;
  floor: number;
  block?: string; // Building block (A, B, C, etc.)
  
  // Room Status Management
  status: 'available' | 'occupied' | 'dirty' | 'clean' | 'out_of_order' | 'maintenance' | 'blocked';
  housekeepingStatus: 'clean' | 'dirty' | 'in_progress' | 'inspected' | 'maintenance_required';
  
  // Room Configuration
  bedType: 'single' | 'double' | 'queen' | 'king' | 'twin' | 'sofa_bed';
  bedCount: number;
  maxOccupancy: number;
  baseRate: number;
  
  // Amenities & Features
  amenities: string[];
  view: string; // 'garden', 'ocean', 'city', 'mountain', etc.
  balcony: boolean;
  smokingAllowed: boolean;
  petFriendly: boolean;
  accessibilityFeatures: string[];
  
  // Current Booking Information
  currentBooking?: {
    bookingId: mongoose.Types.ObjectId;
    guestName: string;
    checkIn: Date;
    checkOut: Date;
    guestCount: number;
    specialRequests?: string[];
  };
  
  // Housekeeping Information
  housekeeping: {
    lastCleaned: Date;
    cleanedBy?: mongoose.Types.ObjectId; // Staff member
    inspectedBy?: mongoose.Types.ObjectId;
    inspectionDate?: Date;
    cleaningNotes?: string;
    estimatedCleaningTime: number; // minutes
    priority: 'low' | 'medium' | 'high' | 'urgent';
  };
  
  // Maintenance Information
  maintenance: {
    lastMaintenance?: Date;
    nextScheduledMaintenance?: Date;
    maintenanceNotes?: string[];
    outOfOrderReason?: string;
    outOfOrderSince?: Date;
    estimatedFixTime?: Date;
    maintenanceRequests: Array<{
      requestId: mongoose.Types.ObjectId;
      type: string;
      priority: 'low' | 'medium' | 'high' | 'critical';
      status: 'open' | 'in_progress' | 'completed' | 'cancelled';
      reportedDate: Date;
      description: string;
    }>;
  };
  
  // Rate Management
  rates: {
    baseRate: number;
    seasonalRates: Array<{
      name: string;
      startDate: Date;
      endDate: Date;
      rate: number;
      daysOfWeek?: number[]; // 0-6 (Sunday-Saturday)
    }>;
    dynamicPricing: {
      enabled: boolean;
      minRate: number;
      maxRate: number;
      factors: {
        occupancyMultiplier: number;
        demandMultiplier: number;
        competitorMultiplier: number;
        eventMultiplier: number;
      };
    };
  };
  
  // Availability & Restrictions
  availability: {
    isAvailable: boolean;
    blockedDates: Array<{
      startDate: Date;
      endDate: Date;
      reason: string;
      blockedBy: mongoose.Types.ObjectId;
    }>;
    minimumStay: number;
    maximumStay: number;
    advanceBookingDays: number;
    cutoffTime: string; // "14:00" format
  };
  
  // Photos & Media
  media: {
    photos: Array<{
      url: string;
      caption?: string;
      isPrimary: boolean;
      order: number;
    }>;
    virtualTour?: string;
    floorPlan?: string;
  };
  
  // Analytics & Performance
  performance: {
    totalBookings: number;
    totalRevenue: number;
    averageRate: number;
    occupancyRate: number; // percentage
    lastOccupied?: Date;
    averageStayLength: number;
    guestSatisfactionScore: number;
    cleaningEfficiency: number; // average cleaning time
    maintenanceFrequency: number; // issues per month
  };
  
  // Integration Data
  channelMapping: {
    bookingDotCom?: string;
    expedia?: string;
    agoda?: string;
    airbnb?: string;
    custom?: Record<string, string>;
  };
  
  // Metadata
  isActive: boolean;
  notes: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  lastStatusChange: Date;
  statusHistory: Array<{
    status: string;
    changedAt: Date;
    changedBy: mongoose.Types.ObjectId;
    reason?: string;
  }>;
}

const enhancedRoomSchema = new Schema<IEnhancedRoom>(
  {
    propertyId: { 
      type: Schema.Types.ObjectId, 
      ref: "Property", 
      required: true,
      index: true
    },
    roomNumber: { 
      type: String, 
      required: true,
      trim: true
    },
    roomType: { 
      type: String, 
      required: true,
      index: true
    },
    floor: { 
      type: Number, 
      required: true,
      min: 0
    },
    block: { 
      type: String,
      trim: true
    },
    
    // Status Management
    status: {
      type: String,
      enum: ['available', 'occupied', 'dirty', 'clean', 'out_of_order', 'maintenance', 'blocked'],
      default: 'available',
      index: true
    },
    housekeepingStatus: {
      type: String,
      enum: ['clean', 'dirty', 'in_progress', 'inspected', 'maintenance_required'],
      default: 'clean'
    },
    
    // Configuration
    bedType: {
      type: String,
      enum: ['single', 'double', 'queen', 'king', 'twin', 'sofa_bed'],
      required: true
    },
    bedCount: { 
      type: Number, 
      required: true,
      min: 1
    },
    maxOccupancy: { 
      type: Number, 
      required: true,
      min: 1
    },
    baseRate: { 
      type: Number, 
      required: true,
      min: 0
    },
    
    // Features
    amenities: [{ type: String }],
    view: { type: String, default: 'standard' },
    balcony: { type: Boolean, default: false },
    smokingAllowed: { type: Boolean, default: false },
    petFriendly: { type: Boolean, default: false },
    accessibilityFeatures: [{ type: String }],
    
    // Current Booking
    currentBooking: {
      bookingId: { type: Schema.Types.ObjectId, ref: "Booking" },
      guestName: String,
      checkIn: Date,
      checkOut: Date,
      guestCount: Number,
      specialRequests: [String]
    },
    
    // Housekeeping
    housekeeping: {
      lastCleaned: { type: Date, default: Date.now },
      cleanedBy: { type: Schema.Types.ObjectId, ref: "Staff" },
      inspectedBy: { type: Schema.Types.ObjectId, ref: "Staff" },
      inspectionDate: Date,
      cleaningNotes: String,
      estimatedCleaningTime: { type: Number, default: 30 },
      priority: {
        type: String,
        enum: ['low', 'medium', 'high', 'urgent'],
        default: 'medium'
      }
    },
    
    // Maintenance
    maintenance: {
      lastMaintenance: Date,
      nextScheduledMaintenance: Date,
      maintenanceNotes: [String],
      outOfOrderReason: String,
      outOfOrderSince: Date,
      estimatedFixTime: Date,
      maintenanceRequests: [{
        requestId: { type: Schema.Types.ObjectId, ref: "MaintenanceRequest" },
        type: { type: String, required: true },
        priority: {
          type: String,
          enum: ['low', 'medium', 'high', 'critical'],
          default: 'medium'
        },
        status: {
          type: String,
          enum: ['open', 'in_progress', 'completed', 'cancelled'],
          default: 'open'
        },
        reportedDate: { type: Date, default: Date.now },
        description: { type: String, required: true }
      }]
    },
    
    // Rates
    rates: {
      baseRate: { type: Number, required: true, min: 0 },
      seasonalRates: [{
        name: { type: String, required: true },
        startDate: { type: Date, required: true },
        endDate: { type: Date, required: true },
        rate: { type: Number, required: true, min: 0 },
        daysOfWeek: [{ type: Number, min: 0, max: 6 }]
      }],
      dynamicPricing: {
        enabled: { type: Boolean, default: false },
        minRate: { type: Number, min: 0 },
        maxRate: { type: Number, min: 0 },
        factors: {
          occupancyMultiplier: { type: Number, default: 1.0, min: 0.5, max: 3.0 },
          demandMultiplier: { type: Number, default: 1.0, min: 0.5, max: 3.0 },
          competitorMultiplier: { type: Number, default: 1.0, min: 0.5, max: 3.0 },
          eventMultiplier: { type: Number, default: 1.0, min: 0.5, max: 5.0 }
        }
      }
    },
    
    // Availability
    availability: {
      isAvailable: { type: Boolean, default: true },
      blockedDates: [{
        startDate: { type: Date, required: true },
        endDate: { type: Date, required: true },
        reason: { type: String, required: true },
        blockedBy: { type: Schema.Types.ObjectId, ref: "User", required: true }
      }],
      minimumStay: { type: Number, default: 1, min: 1 },
      maximumStay: { type: Number, default: 30, min: 1 },
      advanceBookingDays: { type: Number, default: 365, min: 0 },
      cutoffTime: { type: String, default: "14:00" }
    },
    
    // Media
    media: {
      photos: [{
        url: { type: String, required: true },
        caption: String,
        isPrimary: { type: Boolean, default: false },
        order: { type: Number, default: 0 }
      }],
      virtualTour: String,
      floorPlan: String
    },
    
    // Performance Analytics
    performance: {
      totalBookings: { type: Number, default: 0 },
      totalRevenue: { type: Number, default: 0 },
      averageRate: { type: Number, default: 0 },
      occupancyRate: { type: Number, default: 0, min: 0, max: 100 },
      lastOccupied: Date,
      averageStayLength: { type: Number, default: 0 },
      guestSatisfactionScore: { type: Number, default: 0, min: 0, max: 5 },
      cleaningEfficiency: { type: Number, default: 30 },
      maintenanceFrequency: { type: Number, default: 0 }
    },
    
    // Channel Integration
    channelMapping: {
      bookingDotCom: String,
      expedia: String,
      agoda: String,
      airbnb: String,
      custom: { type: Map, of: String }
    },
    
    // Metadata
    isActive: { type: Boolean, default: true },
    notes: { type: String, maxlength: 1000 },
    tags: [{ type: String, maxlength: 50 }],
    lastStatusChange: { type: Date, default: Date.now },
    statusHistory: [{
      status: { type: String, required: true },
      changedAt: { type: Date, default: Date.now },
      changedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
      reason: String
    }]
  },
  { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Compound Indexes for Performance
enhancedRoomSchema.index({ propertyId: 1, status: 1 });
enhancedRoomSchema.index({ propertyId: 1, roomNumber: 1 }, { unique: true });
enhancedRoomSchema.index({ propertyId: 1, floor: 1, roomNumber: 1 });
enhancedRoomSchema.index({ status: 1, housekeepingStatus: 1 });
enhancedRoomSchema.index({ 'currentBooking.checkOut': 1 });
enhancedRoomSchema.index({ 'availability.isAvailable': 1, status: 1 });

// Virtual Properties
enhancedRoomSchema.virtual('isOccupied').get(function() {
  return this.status === 'occupied' && this.currentBooking?.checkOut && new Date() < this.currentBooking.checkOut;
});

enhancedRoomSchema.virtual('needsCleaning').get(function() {
  return this.housekeepingStatus === 'dirty' || this.housekeepingStatus === 'maintenance_required';
});

enhancedRoomSchema.virtual('isOutOfOrder').get(function() {
  return this.status === 'out_of_order' || this.status === 'maintenance';
});

enhancedRoomSchema.virtual('revenue').get(function() {
  return this.performance.totalRevenue || 0;
});

enhancedRoomSchema.virtual('displayName').get(function() {
  return this.block ? `${this.block}-${this.roomNumber}` : this.roomNumber;
});

// Methods
enhancedRoomSchema.methods.updateStatus = function(newStatus: string, changedBy: string, reason?: string) {
  const oldStatus = this.status;
  this.status = newStatus;
  this.lastStatusChange = new Date();
  
  this.statusHistory.push({
    status: newStatus,
    changedAt: new Date(),
    changedBy: new mongoose.Types.ObjectId(changedBy),
    reason: reason || `Status changed from ${oldStatus} to ${newStatus}`
  });
};

enhancedRoomSchema.methods.calculateDynamicRate = function(date: Date, occupancyRate: number) {
  if (!this.rates.dynamicPricing.enabled) {
    return this.rates.baseRate;
  }
  
  let rate = this.rates.baseRate;
  const factors = this.rates.dynamicPricing.factors;
  
  // Apply occupancy multiplier
  rate *= (1 + (occupancyRate / 100) * (factors.occupancyMultiplier - 1));
  
  // Apply seasonal rates if applicable
  const seasonalRate = this.rates.seasonalRates.find(sr => 
    date >= sr.startDate && date <= sr.endDate &&
    (!sr.daysOfWeek || sr.daysOfWeek.includes(date.getDay()))
  );
  
  if (seasonalRate) {
    rate = seasonalRate.rate;
  }
  
  // Ensure within min/max bounds
  rate = Math.max(this.rates.dynamicPricing.minRate, rate);
  rate = Math.min(this.rates.dynamicPricing.maxRate, rate);
  
  return Math.round(rate);
};

enhancedRoomSchema.methods.isAvailableForDates = function(checkIn: Date, checkOut: Date) {
  if (!this.availability.isAvailable || this.status === 'out_of_order') {
    return false;
  }
  
  // Check if dates conflict with blocked dates
  const hasConflict = this.availability.blockedDates.some(blocked => 
    checkIn < blocked.endDate && checkOut > blocked.startDate
  );
  
  if (hasConflict) {
    return false;
  }
  
  // Check if current booking conflicts
  if (this.currentBooking && checkIn < this.currentBooking.checkOut && checkOut > this.currentBooking.checkIn) {
    return false;
  }
  
  return true;
};

// Static Methods
enhancedRoomSchema.statics.getOccupancyStats = function(propertyId: string, startDate?: Date, endDate?: Date) {
  const matchStage: any = { propertyId: new mongoose.Types.ObjectId(propertyId) };
  
  if (startDate || endDate) {
    matchStage['currentBooking.checkIn'] = {};
    if (startDate) matchStage['currentBooking.checkIn'].$gte = startDate;
    if (endDate) matchStage['currentBooking.checkIn'].$lte = endDate;
  }
  
  return this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: null,
        totalRooms: { $sum: 1 },
        occupiedRooms: {
          $sum: { $cond: [{ $eq: ['$status', 'occupied'] }, 1, 0] }
        },
        availableRooms: {
          $sum: { $cond: [{ $eq: ['$status', 'available'] }, 1, 0] }
        },
        dirtyRooms: {
          $sum: { $cond: [{ $eq: ['$housekeepingStatus', 'dirty'] }, 1, 0] }
        },
        outOfOrderRooms: {
          $sum: { $cond: [{ $in: ['$status', ['out_of_order', 'maintenance']] }, 1, 0] }
        },
        totalRevenue: { $sum: '$performance.totalRevenue' },
        averageRate: { $avg: '$performance.averageRate' }
      }
    },
    {
      $project: {
        totalRooms: 1,
        occupiedRooms: 1,
        availableRooms: 1,
        dirtyRooms: 1,
        outOfOrderRooms: 1,
        occupancyRate: {
          $multiply: [
            { $divide: ['$occupiedRooms', '$totalRooms'] },
            100
          ]
        },
        totalRevenue: 1,
        averageRate: 1
      }
    }
  ]);
};

// Pre-save Middleware
enhancedRoomSchema.pre('save', function(next) {
  // Update performance metrics when status changes
  if (this.isModified('status')) {
    if (this.status === 'occupied') {
      this.performance.lastOccupied = new Date();
    }
  }
  
  // Validate rate bounds
  if (this.rates.dynamicPricing.enabled) {
    if (this.rates.dynamicPricing.minRate > this.rates.dynamicPricing.maxRate) {
      return next(new Error('Minimum rate cannot be greater than maximum rate'));
    }
  }
  
  next();
});

const EnhancedRoom = mongoose.models.EnhancedRoom || mongoose.model<IEnhancedRoom>("EnhancedRoom", enhancedRoomSchema);
export default EnhancedRoom;