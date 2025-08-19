import mongoose, { Schema, Document } from 'mongoose';

export interface IRoom extends Document {
  propertyId: mongoose.Types.ObjectId;
  roomTypeId: mongoose.Types.ObjectId;
  roomNumber: string;
  floor: number;
  wing?: string; // e.g., "East Wing", "West Wing"
  block?: string; // e.g., "Block A", "Block B"
  status: 'available' | 'occupied' | 'maintenance' | 'cleaning' | 'out_of_order' | 'reserved';
  condition: 'excellent' | 'good' | 'fair' | 'poor' | 'needs_renovation';
  
  // Physical characteristics
  actualSize: {
    area: number;
    unit: 'sqft' | 'sqm';
  };
  actualBeds: {
    singleBeds: number;
    doubleBeds: number;
    queenBeds: number;
    kingBeds: number;
    sofaBeds: number;
    bunkBeds: number;
  };
  view: string[]; // Actual view from this specific room
  orientation: 'north' | 'south' | 'east' | 'west' | 'northeast' | 'northwest' | 'southeast' | 'southwest';
  
  // Room specific amenities (may differ from room type)
  specificAmenities: {
    hasBalcony: boolean;
    hasTerrace: boolean;
    hasGarden: boolean;
    hasKitchen: boolean;
    hasWorkDesk: boolean;
    hasSmartTV: boolean;
    hasAC: boolean;
    hasMinibar: boolean;
    hasSafe: boolean;
    hasJacuzzi: boolean;
    customAmenities: string[];
  };
  
  // Current booking information
  currentBooking?: {
    bookingId: mongoose.Types.ObjectId;
    guestName: string;
    checkIn: Date;
    checkOut: Date;
    guestCount: number;
    specialRequests?: string;
  };
  
  // Housekeeping status
  housekeeping: {
    lastCleaned: Date;
    lastCleanedBy: mongoose.Types.ObjectId;
    cleaningStatus: 'dirty' | 'cleaning_in_progress' | 'clean' | 'inspected' | 'maintenance_required';
    cleaningNotes?: string;
    nextCleaningScheduled?: Date;
    cleaningDuration: number; // actual time taken in minutes
    housekeepingIssues: [{
      issue: string;
      reportedBy: mongoose.Types.ObjectId;
      reportedAt: Date;
      priority: 'low' | 'medium' | 'high' | 'urgent';
      status: 'open' | 'in_progress' | 'resolved';
      resolvedAt?: Date;
      resolvedBy?: mongoose.Types.ObjectId;
    }];
  };
  
  // Maintenance tracking
  maintenance: {
    lastMaintenance: Date;
    nextScheduledMaintenance?: Date;
    maintenanceHistory: [{
      type: 'preventive' | 'corrective' | 'emergency' | 'renovation';
      description: string;
      performedBy: string;
      performedAt: Date;
      cost: number;
      duration: number; // in hours
      partsUsed?: string[];
      notes?: string;
    }];
    currentIssues: [{
      issueType: 'electrical' | 'plumbing' | 'hvac' | 'furniture' | 'fixtures' | 'electronics' | 'structural' | 'other';
      description: string;
      severity: 'minor' | 'moderate' | 'major' | 'critical';
      reportedBy: mongoose.Types.ObjectId;
      reportedAt: Date;
      expectedResolution?: Date;
      assignedTo?: mongoose.Types.ObjectId;
      status: 'reported' | 'assigned' | 'in_progress' | 'resolved' | 'deferred';
      cost?: number;
    }];
  };
  
  // Pricing information
  pricing: {
    baseRate: number;
    seasonalMultiplier: number;
    dynamicPricing: {
      currentRate: number;
      lastUpdated: Date;
      updatedBy: 'system' | 'manual';
    };
    specialRates: [{
      rateName: string;
      rate: number;
      validFrom: Date;
      validTo: Date;
      isActive: boolean;
    }];
  };
  
  // Accessibility features
  accessibility: {
    wheelchairAccessible: boolean;
    features: string[];
    certificationLevel?: string;
    lastAccessibilityAudit?: Date;
  };
  
  // Safety and security
  safety: {
    smokeDetectorStatus: 'working' | 'needs_battery' | 'not_working' | 'missing';
    lastSafetyCheck: Date;
    emergencyEquipment: [{
      item: string;
      status: 'working' | 'needs_replacement' | 'missing';
      lastChecked: Date;
    }];
    securityFeatures: {
      keyCardAccess: boolean;
      deadbolt: boolean;
      chainLock: boolean;
      peephole: boolean;
      balconyLock: boolean;
    };
  };
  
  // Guest feedback
  feedback: {
    averageRating: number;
    totalReviews: number;
    lastReviewDate?: Date;
    commonComplaints: string[];
    commonPraises: string[];
  };
  
  // Inventory items in room
  inventory: [{
    item: string;
    category: 'furniture' | 'electronics' | 'linens' | 'bathroom' | 'kitchen' | 'decor' | 'safety';
    quantity: number;
    condition: 'excellent' | 'good' | 'fair' | 'poor' | 'missing';
    lastChecked: Date;
    needsReplacement: boolean;
    cost: number;
    supplier?: string;
  }];
  
  // Energy consumption (for sustainability tracking)
  energyConsumption: {
    electricityUsage: number; // kWh
    waterUsage: number; // liters
    lastMeterReading: Date;
    monthlyAverage: number;
  };
  
  // Revenue tracking
  revenue: {
    monthlyRevenue: number;
    yearlyRevenue: number;
    averageDailyRate: number;
    revenuePAR: number; // Revenue Per Available Room
    lastRevenueUpdate: Date;
  };
  
  isActive: boolean;
  isBookable: boolean;
  notes: string;
  
  createdBy: mongoose.Types.ObjectId;
  lastModifiedBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const RoomSchema = new Schema<IRoom>({
  propertyId: { 
    type: Schema.Types.ObjectId, 
    ref: 'Property', 
    required: true 
  },
  roomTypeId: { 
    type: Schema.Types.ObjectId, 
    ref: 'RoomType', 
    required: true 
  },
  roomNumber: { 
    type: String, 
    required: true, 
    trim: true 
  },
  floor: { 
    type: Number, 
    required: true,
    min: 0 
  },
  wing: { 
    type: String, 
    trim: true 
  },
  block: { 
    type: String, 
    trim: true 
  },
  status: { 
    type: String, 
    enum: ['available', 'occupied', 'maintenance', 'cleaning', 'out_of_order', 'reserved'],
    default: 'available' 
  },
  condition: { 
    type: String, 
    enum: ['excellent', 'good', 'fair', 'poor', 'needs_renovation'],
    default: 'good' 
  },
  actualSize: {
    area: { type: Number, required: true, min: 1 },
    unit: { type: String, enum: ['sqft', 'sqm'], default: 'sqft' }
  },
  actualBeds: {
    singleBeds: { type: Number, default: 0, min: 0 },
    doubleBeds: { type: Number, default: 0, min: 0 },
    queenBeds: { type: Number, default: 0, min: 0 },
    kingBeds: { type: Number, default: 0, min: 0 },
    sofaBeds: { type: Number, default: 0, min: 0 },
    bunkBeds: { type: Number, default: 0, min: 0 }
  },
  view: [{ type: String }],
  orientation: { 
    type: String, 
    enum: ['north', 'south', 'east', 'west', 'northeast', 'northwest', 'southeast', 'southwest'] 
  },
  specificAmenities: {
    hasBalcony: { type: Boolean, default: false },
    hasTerrace: { type: Boolean, default: false },
    hasGarden: { type: Boolean, default: false },
    hasKitchen: { type: Boolean, default: false },
    hasWorkDesk: { type: Boolean, default: false },
    hasSmartTV: { type: Boolean, default: false },
    hasAC: { type: Boolean, default: false },
    hasMinibar: { type: Boolean, default: false },
    hasSafe: { type: Boolean, default: false },
    hasJacuzzi: { type: Boolean, default: false },
    customAmenities: [{ type: String }]
  },
  currentBooking: {
    bookingId: { type: Schema.Types.ObjectId, ref: 'Booking' },
    guestName: { type: String },
    checkIn: { type: Date },
    checkOut: { type: Date },
    guestCount: { type: Number, min: 1 },
    specialRequests: { type: String }
  },
  housekeeping: {
    lastCleaned: { type: Date, default: Date.now },
    lastCleanedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    cleaningStatus: { 
      type: String, 
      enum: ['dirty', 'cleaning_in_progress', 'clean', 'inspected', 'maintenance_required'],
      default: 'clean' 
    },
    cleaningNotes: { type: String },
    nextCleaningScheduled: { type: Date },
    cleaningDuration: { type: Number, default: 30, min: 1 },
    housekeepingIssues: [{
      issue: { type: String, required: true },
      reportedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
      reportedAt: { type: Date, default: Date.now },
      priority: { type: String, enum: ['low', 'medium', 'high', 'urgent'], default: 'medium' },
      status: { type: String, enum: ['open', 'in_progress', 'resolved'], default: 'open' },
      resolvedAt: { type: Date },
      resolvedBy: { type: Schema.Types.ObjectId, ref: 'User' }
    }]
  },
  maintenance: {
    lastMaintenance: { type: Date, default: Date.now },
    nextScheduledMaintenance: { type: Date },
    maintenanceHistory: [{
      type: { type: String, enum: ['preventive', 'corrective', 'emergency', 'renovation'], required: true },
      description: { type: String, required: true },
      performedBy: { type: String, required: true },
      performedAt: { type: Date, required: true },
      cost: { type: Number, default: 0, min: 0 },
      duration: { type: Number, default: 1, min: 0 },
      partsUsed: [{ type: String }],
      notes: { type: String }
    }],
    currentIssues: [{
      issueType: { 
        type: String, 
        enum: ['electrical', 'plumbing', 'hvac', 'furniture', 'fixtures', 'electronics', 'structural', 'other'],
        required: true 
      },
      description: { type: String, required: true },
      severity: { type: String, enum: ['minor', 'moderate', 'major', 'critical'], required: true },
      reportedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
      reportedAt: { type: Date, default: Date.now },
      expectedResolution: { type: Date },
      assignedTo: { type: Schema.Types.ObjectId, ref: 'User' },
      status: { type: String, enum: ['reported', 'assigned', 'in_progress', 'resolved', 'deferred'], default: 'reported' },
      cost: { type: Number, min: 0 }
    }]
  },
  pricing: {
    baseRate: { type: Number, required: true, min: 0 },
    seasonalMultiplier: { type: Number, default: 1, min: 0.1, max: 10 },
    dynamicPricing: {
      currentRate: { type: Number, required: true, min: 0 },
      lastUpdated: { type: Date, default: Date.now },
      updatedBy: { type: String, enum: ['system', 'manual'], default: 'system' }
    },
    specialRates: [{
      rateName: { type: String, required: true },
      rate: { type: Number, required: true, min: 0 },
      validFrom: { type: Date, required: true },
      validTo: { type: Date, required: true },
      isActive: { type: Boolean, default: true }
    }]
  },
  accessibility: {
    wheelchairAccessible: { type: Boolean, default: false },
    features: [{ type: String }],
    certificationLevel: { type: String },
    lastAccessibilityAudit: { type: Date }
  },
  safety: {
    smokeDetectorStatus: { 
      type: String, 
      enum: ['working', 'needs_battery', 'not_working', 'missing'],
      default: 'working' 
    },
    lastSafetyCheck: { type: Date, default: Date.now },
    emergencyEquipment: [{
      item: { type: String, required: true },
      status: { type: String, enum: ['working', 'needs_replacement', 'missing'], required: true },
      lastChecked: { type: Date, required: true }
    }],
    securityFeatures: {
      keyCardAccess: { type: Boolean, default: false },
      deadbolt: { type: Boolean, default: true },
      chainLock: { type: Boolean, default: false },
      peephole: { type: Boolean, default: true },
      balconyLock: { type: Boolean, default: false }
    }
  },
  feedback: {
    averageRating: { type: Number, default: 0, min: 0, max: 5 },
    totalReviews: { type: Number, default: 0, min: 0 },
    lastReviewDate: { type: Date },
    commonComplaints: [{ type: String }],
    commonPraises: [{ type: String }]
  },
  inventory: [{
    item: { type: String, required: true },
    category: { 
      type: String, 
      enum: ['furniture', 'electronics', 'linens', 'bathroom', 'kitchen', 'decor', 'safety'],
      required: true 
    },
    quantity: { type: Number, required: true, min: 0 },
    condition: { type: String, enum: ['excellent', 'good', 'fair', 'poor', 'missing'], required: true },
    lastChecked: { type: Date, required: true },
    needsReplacement: { type: Boolean, default: false },
    cost: { type: Number, default: 0, min: 0 },
    supplier: { type: String }
  }],
  energyConsumption: {
    electricityUsage: { type: Number, default: 0, min: 0 },
    waterUsage: { type: Number, default: 0, min: 0 },
    lastMeterReading: { type: Date, default: Date.now },
    monthlyAverage: { type: Number, default: 0, min: 0 }
  },
  revenue: {
    monthlyRevenue: { type: Number, default: 0, min: 0 },
    yearlyRevenue: { type: Number, default: 0, min: 0 },
    averageDailyRate: { type: Number, default: 0, min: 0 },
    revenuePAR: { type: Number, default: 0, min: 0 },
    lastRevenueUpdate: { type: Date, default: Date.now }
  },
  isActive: { 
    type: Boolean, 
    default: true 
  },
  isBookable: { 
    type: Boolean, 
    default: true 
  },
  notes: { 
    type: String 
  },
  createdBy: { 
    type: Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  lastModifiedBy: { 
    type: Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
RoomSchema.index({ propertyId: 1 });
RoomSchema.index({ roomTypeId: 1 });
RoomSchema.index({ roomNumber: 1 });
RoomSchema.index({ status: 1 });
RoomSchema.index({ floor: 1 });
RoomSchema.index({ isActive: 1 });
RoomSchema.index({ isBookable: 1 });
RoomSchema.index({ 'housekeeping.cleaningStatus': 1 });

// Compound indexes
RoomSchema.index({ propertyId: 1, roomNumber: 1 }, { unique: true });
RoomSchema.index({ propertyId: 1, status: 1 });
RoomSchema.index({ propertyId: 1, floor: 1 });
RoomSchema.index({ roomTypeId: 1, status: 1 });
RoomSchema.index({ propertyId: 1, isActive: 1, isBookable: 1 });

// Virtual for total beds
RoomSchema.virtual('totalBeds').get(function() {
  return this.actualBeds.singleBeds + 
         this.actualBeds.doubleBeds + 
         this.actualBeds.queenBeds + 
         this.actualBeds.kingBeds + 
         this.actualBeds.sofaBeds + 
         this.actualBeds.bunkBeds;
});

// Virtual for room type details
RoomSchema.virtual('roomType', {
  ref: 'RoomType',
  localField: 'roomTypeId',
  foreignField: '_id',
  justOne: true
});

// Virtual for current occupancy status
RoomSchema.virtual('isOccupied').get(function() {
  return this.status === 'occupied' && this.currentBooking?.bookingId;
});

// Methods
RoomSchema.methods.updateStatus = function(newStatus: string, updatedBy: string) {
  this.status = newStatus;
  this.lastModifiedBy = updatedBy;
  return this.save();
};

RoomSchema.methods.scheduleHousekeeping = function(scheduledTime: Date) {
  this.housekeeping.nextCleaningScheduled = scheduledTime;
  if (this.status === 'available') {
    this.status = 'cleaning';
  }
  return this.save();
};

RoomSchema.methods.completeCleaning = function(cleanedBy: string, duration: number, notes?: string) {
  this.housekeeping.lastCleaned = new Date();
  this.housekeeping.lastCleanedBy = cleanedBy;
  this.housekeeping.cleaningStatus = 'clean';
  this.housekeeping.cleaningDuration = duration;
  this.housekeeping.cleaningNotes = notes;
  this.housekeeping.nextCleaningScheduled = undefined;
  
  if (this.status === 'cleaning') {
    this.status = 'available';
  }
  
  return this.save();
};

// Static methods
RoomSchema.statics.getAvailableRooms = function(propertyId: string, checkIn: Date, checkOut: Date) {
  return this.find({
    propertyId,
    status: 'available',
    isActive: true,
    isBookable: true,
    $or: [
      { 'currentBooking.checkOut': { $lte: checkIn } },
      { 'currentBooking.checkIn': { $gte: checkOut } },
      { 'currentBooking.bookingId': { $exists: false } }
    ]
  });
};

RoomSchema.statics.getRoomsByStatus = function(propertyId: string, status: string) {
  return this.find({ propertyId, status }).populate('roomType');
};

RoomSchema.statics.getMaintenanceRequired = function(propertyId: string) {
  return this.find({
    propertyId,
    $or: [
      { 'maintenance.currentIssues': { $exists: true, $not: { $size: 0 } } },
      { 'housekeeping.cleaningStatus': 'maintenance_required' },
      { condition: { $in: ['poor', 'needs_renovation'] } }
    ]
  });
};

export default mongoose.models.Room || mongoose.model<IRoom>('Room', RoomSchema);