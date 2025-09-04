import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IEventVenue extends Document {
  _id: Types.ObjectId;
  propertyId: Types.ObjectId;
  name: string;
  description: string;
  
  // Capacity configurations for different setup styles (following user specification)
  capacity: {
    seatedCapacity: number;
    standingCapacity: number;
    theatreStyle: number;
    classroomStyle: number;
    uShapeStyle: number;
    boardroomStyle: number;
  };
  
  // Physical dimensions (following user specification)
  dimensions: {
    length: number; // in meters
    width: number;  // in meters
    height: number; // in meters
    area: number;   // in square meters
  };
  
  // Venue features and amenities (following user specification)
  amenities: string[]; // ['wifi', 'ac', 'projector', 'sound_system', 'stage', 'parking']
  
  // Equipment available with the venue (following user specification)
  equipment: [{
    equipmentId: Types.ObjectId;
    isIncluded: boolean;
    additionalCost?: number;
  }];
  
  // Venue images (following user specification)
  images: string[];
  
  // Pricing structure (following user specification)
  pricing: {
    basePrice: number;      // Full day price
    halfDayPrice: number;   // Half day price
    hourlyRate: number;     // Per hour rate
    currency: string;       // Currency code (USD, EUR, INR, etc.)
  };
  
  // Availability and maintenance (following user specification)
  availability: {
    isActive: boolean;
    maintenanceSchedule: [{
      startDate: Date;
      endDate: Date;
      reason: string;
    }];
  };

  // Metadata
  isActive: boolean;
  displayOrder?: number;
  createdBy: Types.ObjectId;
  lastUpdatedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;

  // Methods
  isAvailableOn(date: Date, startTime: string, endTime: string): boolean;
  getCapacityForStyle(setupStyle: string): number;
  calculatePrice(startTime: string, endTime: string): number;
}

const EventVenueSchema = new Schema<IEventVenue>({
  propertyId: {
    type: Schema.Types.ObjectId,
    ref: 'Property',
    required: [true, 'Property ID is required'],
    index: true
  },
  
  name: {
    type: String,
    required: [true, 'Venue name is required'],
    trim: true,
    maxlength: [100, 'Venue name cannot exceed 100 characters']
  },
  
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true,
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },
  
  // Core capacity fields following user specification
  capacity: {
    seatedCapacity: {
      type: Number,
      required: [true, 'Seated capacity is required'],
      min: [1, 'Seated capacity must be at least 1']
    },
    standingCapacity: {
      type: Number,
      required: [true, 'Standing capacity is required'],
      min: [1, 'Standing capacity must be at least 1']
    },
    theatreStyle: {
      type: Number,
      required: [true, 'Theatre style capacity is required'],
      min: [1, 'Theatre style capacity must be at least 1']
    },
    classroomStyle: {
      type: Number,
      required: [true, 'Classroom style capacity is required'],
      min: [1, 'Classroom style capacity must be at least 1']
    },
    uShapeStyle: {
      type: Number,
      required: [true, 'U-shape style capacity is required'],
      min: [1, 'U-shape style capacity must be at least 1']
    },
    boardroomStyle: {
      type: Number,
      required: [true, 'Boardroom style capacity is required'],
      min: [1, 'Boardroom style capacity must be at least 1']
    }
  },
  
  // Core dimensions fields following user specification
  dimensions: {
    length: {
      type: Number,
      required: [true, 'Length is required'],
      min: [1, 'Length must be positive']
    },
    width: {
      type: Number,
      required: [true, 'Width is required'],
      min: [1, 'Width must be positive']
    },
    height: {
      type: Number,
      required: [true, 'Height is required'],
      min: [1, 'Height must be positive']
    },
    area: {
      type: Number,
      required: [true, 'Area is required'],
      min: [1, 'Area must be positive']
    }
  },
  
  // Core amenities field following user specification
  amenities: [{
    type: String,
    trim: true,
    maxlength: [50, 'Amenity name cannot exceed 50 characters']
  }],
  
  // Core equipment field following user specification
  equipment: [{
    equipmentId: {
      type: Schema.Types.ObjectId,
      ref: 'EventEquipment',
      required: [true, 'Equipment ID is required']
    },
    isIncluded: {
      type: Boolean,
      required: [true, 'IsIncluded flag is required']
    },
    additionalCost: {
      type: Number,
      min: [0, 'Additional cost cannot be negative']
    }
  }],
  
  // Core images field following user specification
  images: [{
    type: String,
    validate: {
      validator: function(v: string) {
        return /^https?:\/\/.+/.test(v);
      },
      message: 'Image must be a valid URL'
    }
  }],
  
  // Core pricing structure following user specification
  pricing: {
    basePrice: {
      type: Number,
      required: [true, 'Base price is required'],
      min: [0, 'Base price cannot be negative']
    },
    halfDayPrice: {
      type: Number,
      required: [true, 'Half day price is required'],
      min: [0, 'Half day price cannot be negative']
    },
    hourlyRate: {
      type: Number,
      required: [true, 'Hourly rate is required'],
      min: [0, 'Hourly rate cannot be negative']
    },
    currency: {
      type: String,
      required: [true, 'Currency is required'],
      default: 'USD',
      maxlength: [3, 'Currency code cannot exceed 3 characters']
    }
  },
  
  // Core availability structure following user specification
  availability: {
    isActive: {
      type: Boolean,
      required: [true, 'IsActive status is required'],
      default: true
    },
    maintenanceSchedule: [{
      startDate: {
        type: Date,
        required: [true, 'Start date is required']
      },
      endDate: {
        type: Date,
        required: [true, 'End date is required']
      },
      reason: {
        type: String,
        required: [true, 'Reason is required'],
        maxlength: [200, 'Reason cannot exceed 200 characters']
      }
    }]
  },

  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  
  displayOrder: {
    type: Number,
    default: 0,
    min: [0, 'Display order cannot be negative']
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
EventVenueSchema.index({ propertyId: 1, name: 1 }, { unique: true });
EventVenueSchema.index({ propertyId: 1, isActive: 1 });
EventVenueSchema.index({ propertyId: 1, 'availability.isActive': 1 });
EventVenueSchema.index({ 'capacity.seatedCapacity': 1 });
EventVenueSchema.index({ 'capacity.standingCapacity': 1 });
EventVenueSchema.index({ 'pricing.basePrice': 1 });
EventVenueSchema.index({ displayOrder: 1 });

// Pre-save middleware
EventVenueSchema.pre('save', function(next) {
  if (this.isModified() && !this.isNew) {
    this.lastUpdatedBy = this.createdBy; // This should be set by the API
  }
  
  // Auto-calculate area if not provided
  if (this.dimensions && (!this.dimensions.area || this.dimensions.area === 0)) {
    this.dimensions.area = this.dimensions.length * this.dimensions.width;
  }
  
  next();
});

// Instance methods
EventVenueSchema.methods.isAvailableOn = function(date: Date, startTime: string, endTime: string): boolean {
  if (!this.availability.isActive || !this.isActive) return false;
  
  // Check maintenance schedule
  const isUnderMaintenance = this.availability.maintenanceSchedule.some((maintenance: any) => {
    return date >= maintenance.startDate && date <= maintenance.endDate;
  });
  
  return !isUnderMaintenance;
};

EventVenueSchema.methods.getCapacityForStyle = function(setupStyle: string): number {
  const capacityMap: { [key: string]: keyof IEventVenue['capacity'] } = {
    'theatre': 'theatreStyle',
    'classroom': 'classroomStyle',
    'u-shape': 'uShapeStyle',
    'boardroom': 'boardroomStyle',
    'seated': 'seatedCapacity',
    'standing': 'standingCapacity'
  };
  
  const capacityKey = capacityMap[setupStyle.toLowerCase()];
  return capacityKey ? this.capacity[capacityKey] : this.capacity.seatedCapacity;
};

EventVenueSchema.methods.calculatePrice = function(startTime: string, endTime: string): number {
  const start = new Date(`2000-01-01T${startTime}:00`);
  const end = new Date(`2000-01-01T${endTime}:00`);
  const hours = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60));
  
  if (hours <= 4) {
    return this.pricing.halfDayPrice;
  } else if (hours <= 8) {
    return this.pricing.basePrice;
  } else {
    return this.pricing.basePrice + ((hours - 8) * this.pricing.hourlyRate);
  }
};

// Static methods
EventVenueSchema.statics.findByProperty = function(propertyId: Types.ObjectId, filters: any = {}) {
  return this.find({ propertyId, ...filters })
    .sort({ displayOrder: 1, name: 1 })
    .populate('equipment.equipmentId', 'name category')
    .populate('createdBy', 'fullName')
    .populate('lastUpdatedBy', 'fullName');
};

EventVenueSchema.statics.findActiveByProperty = function(propertyId: Types.ObjectId) {
  return this.findByProperty(propertyId, { isActive: true, 'availability.isActive': true });
};

EventVenueSchema.statics.findByCapacity = function(propertyId: Types.ObjectId, minCapacity: number, setupStyle: string = 'seated') {
  const capacityField = setupStyle === 'standing' ? 'capacity.standingCapacity' : 'capacity.seatedCapacity';
  return this.findByProperty(propertyId, { 
    isActive: true, 
    'availability.isActive': true,
    [capacityField]: { $gte: minCapacity }
  });
};

const EventVenue = mongoose.models.EventVenue || mongoose.model<IEventVenue>('EventVenue', EventVenueSchema);

export default EventVenue;