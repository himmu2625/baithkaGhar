import mongoose, { Schema, Document } from 'mongoose';

export interface IRoomType extends Document {
  propertyId: mongoose.Types.ObjectId;
  name: string; // e.g., "Deluxe Room", "Executive Suite", "Standard Room"
  code: string; // e.g., "DEL", "EXE", "STD" - for booking systems
  description: string;
  category: 'standard' | 'deluxe' | 'suite' | 'presidential' | 'economy' | 'family' | 'accessible';
  maxOccupancy: {
    adults: number;
    children: number;
    total: number;
  };
  bedConfiguration: {
    singleBeds: number;
    doubleBeds: number;
    queenBeds: number;
    kingBeds: number;
    sofaBeds: number;
    bunkBeds: number;
    totalBeds: number;
  };
  roomSize: {
    area: number; // in square feet or meters
    unit: 'sqft' | 'sqm';
  };
  basePrice: {
    perNight: number;
    perWeek: number;
    perMonth: number;
    currency: string;
  };
  amenities: {
    // Room specific amenities
    bathroom: {
      privateBathroom: boolean;
      bathtub: boolean;
      shower: boolean;
      toiletries: boolean;
      hairDryer: boolean;
      slippers: boolean;
      bathrobes: boolean;
    };
    technology: {
      wifi: boolean;
      tv: boolean;
      cableChannels: boolean;
      smartTV: boolean;
      soundSystem: boolean;
      gamingConsole: boolean;
      workDesk: boolean;
      laptop: boolean;
    };
    comfort: {
      airConditioning: boolean;
      heating: boolean;
      fan: boolean;
      blackoutCurtains: boolean;
      soundproofing: boolean;
      balcony: boolean;
      terrace: boolean;
      garden: boolean;
    };
    kitchen: {
      fullKitchen: boolean;
      kitchenette: boolean;
      microwave: boolean;
      refrigerator: boolean;
      coffeemaker: boolean;
      teaKettle: boolean;
      dishwasher: boolean;
      cookingBasics: boolean;
    };
    safety: {
      smokeDector: boolean;
      carbonMonoxideDetector: boolean;
      fireExtinguisher: boolean;
      firstAidKit: boolean;
      safe: boolean;
      securityCamera: boolean;
      keylessEntry: boolean;
    };
  };
  views: string[]; // e.g., ["sea view", "mountain view", "garden view", "city view"]
  floorPreference: number[]; // Preferred floors for this room type
  accessibility: {
    wheelchairAccessible: boolean;
    wideDoorways: boolean;
    rollInShower: boolean;
    grabBars: boolean;
    lowerCounters: boolean;
    brailleSignage: boolean;
    hearingAccessible: boolean;
  };
  policies: {
    smokingAllowed: boolean;
    petsAllowed: boolean;
    maxPetWeight?: number;
    petFee?: number;
    eventsAllowed: boolean;
    partiesAllowed: boolean;
    additionalGuestFee?: number;
    maxAdditionalGuests: number;
  };
  images: [{
    url: string;
    publicId: string;
    isPrimary: boolean;
    description?: string;
    roomNumber?: string; // If specific to a room
  }];
  seasonalPricing: [{
    season: string;
    startDate: Date;
    endDate: Date;
    priceMultiplier: number;
    isActive: boolean;
  }];
  promotionalOffers: [{
    title: string;
    description: string;
    discountPercentage?: number;
    discountAmount?: number;
    validFrom: Date;
    validTo: Date;
    isActive: boolean;
    conditions?: string;
  }];
  inventory: {
    totalRooms: number;
    availableRooms: number;
    maintenanceRooms: number;
    bookedRooms: number;
  };
  housekeeping: {
    cleaningTime: number; // in minutes
    checklistId?: mongoose.Types.ObjectId;
    specialInstructions?: string;
    supplies: [{
      item: string;
      quantity: number;
      unit: string;
    }];
  };
  isActive: boolean;
  isBookable: boolean;
  displayOrder: number;
  createdBy: mongoose.Types.ObjectId;
  lastModifiedBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const RoomTypeSchema = new Schema<IRoomType>({
  propertyId: { 
    type: Schema.Types.ObjectId, 
    ref: 'Property', 
    required: true 
  },
  name: { 
    type: String, 
    required: true, 
    trim: true 
  },
  code: { 
    type: String, 
    required: true, 
    uppercase: true,
    trim: true 
  },
  description: { 
    type: String, 
    required: true 
  },
  category: { 
    type: String, 
    enum: ['standard', 'deluxe', 'suite', 'presidential', 'economy', 'family', 'accessible'],
    required: true 
  },
  maxOccupancy: {
    adults: { type: Number, required: true, min: 1 },
    children: { type: Number, default: 0, min: 0 },
    total: { type: Number, required: true, min: 1 }
  },
  bedConfiguration: {
    singleBeds: { type: Number, default: 0, min: 0 },
    doubleBeds: { type: Number, default: 0, min: 0 },
    queenBeds: { type: Number, default: 0, min: 0 },
    kingBeds: { type: Number, default: 0, min: 0 },
    sofaBeds: { type: Number, default: 0, min: 0 },
    bunkBeds: { type: Number, default: 0, min: 0 },
    totalBeds: { type: Number, required: true, min: 1 }
  },
  roomSize: {
    area: { type: Number, required: true, min: 1 },
    unit: { type: String, enum: ['sqft', 'sqm'], default: 'sqft' }
  },
  basePrice: {
    perNight: { type: Number, required: true, min: 0 },
    perWeek: { type: Number, required: true, min: 0 },
    perMonth: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'INR' }
  },
  amenities: {
    bathroom: {
      privateBathroom: { type: Boolean, default: true },
      bathtub: { type: Boolean, default: false },
      shower: { type: Boolean, default: true },
      toiletries: { type: Boolean, default: true },
      hairDryer: { type: Boolean, default: false },
      slippers: { type: Boolean, default: false },
      bathrobes: { type: Boolean, default: false }
    },
    technology: {
      wifi: { type: Boolean, default: true },
      tv: { type: Boolean, default: true },
      cableChannels: { type: Boolean, default: false },
      smartTV: { type: Boolean, default: false },
      soundSystem: { type: Boolean, default: false },
      gamingConsole: { type: Boolean, default: false },
      workDesk: { type: Boolean, default: false },
      laptop: { type: Boolean, default: false }
    },
    comfort: {
      airConditioning: { type: Boolean, default: false },
      heating: { type: Boolean, default: false },
      fan: { type: Boolean, default: true },
      blackoutCurtains: { type: Boolean, default: false },
      soundproofing: { type: Boolean, default: false },
      balcony: { type: Boolean, default: false },
      terrace: { type: Boolean, default: false },
      garden: { type: Boolean, default: false }
    },
    kitchen: {
      fullKitchen: { type: Boolean, default: false },
      kitchenette: { type: Boolean, default: false },
      microwave: { type: Boolean, default: false },
      refrigerator: { type: Boolean, default: false },
      coffeemaker: { type: Boolean, default: false },
      teaKettle: { type: Boolean, default: false },
      dishwasher: { type: Boolean, default: false },
      cookingBasics: { type: Boolean, default: false }
    },
    safety: {
      smokeDector: { type: Boolean, default: true },
      carbonMonoxideDetector: { type: Boolean, default: false },
      fireExtinguisher: { type: Boolean, default: true },
      firstAidKit: { type: Boolean, default: false },
      safe: { type: Boolean, default: false },
      securityCamera: { type: Boolean, default: false },
      keylessEntry: { type: Boolean, default: false }
    }
  },
  views: [{ type: String }],
  floorPreference: [{ type: Number, min: 0 }],
  accessibility: {
    wheelchairAccessible: { type: Boolean, default: false },
    wideDoorways: { type: Boolean, default: false },
    rollInShower: { type: Boolean, default: false },
    grabBars: { type: Boolean, default: false },
    lowerCounters: { type: Boolean, default: false },
    brailleSignage: { type: Boolean, default: false },
    hearingAccessible: { type: Boolean, default: false }
  },
  policies: {
    smokingAllowed: { type: Boolean, default: false },
    petsAllowed: { type: Boolean, default: false },
    maxPetWeight: { type: Number, min: 0 },
    petFee: { type: Number, min: 0 },
    eventsAllowed: { type: Boolean, default: false },
    partiesAllowed: { type: Boolean, default: false },
    additionalGuestFee: { type: Number, min: 0 },
    maxAdditionalGuests: { type: Number, default: 0, min: 0 }
  },
  images: [{
    url: { type: String, required: true },
    publicId: { type: String, required: true },
    isPrimary: { type: Boolean, default: false },
    description: { type: String },
    roomNumber: { type: String }
  }],
  seasonalPricing: [{
    season: { type: String, required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    priceMultiplier: { type: Number, required: true, min: 0.1, max: 10 },
    isActive: { type: Boolean, default: true }
  }],
  promotionalOffers: [{
    title: { type: String, required: true },
    description: { type: String, required: true },
    discountPercentage: { type: Number, min: 0, max: 100 },
    discountAmount: { type: Number, min: 0 },
    validFrom: { type: Date, required: true },
    validTo: { type: Date, required: true },
    isActive: { type: Boolean, default: true },
    conditions: { type: String }
  }],
  inventory: {
    totalRooms: { type: Number, required: true, min: 0 },
    availableRooms: { type: Number, default: 0, min: 0 },
    maintenanceRooms: { type: Number, default: 0, min: 0 },
    bookedRooms: { type: Number, default: 0, min: 0 }
  },
  housekeeping: {
    cleaningTime: { type: Number, default: 30, min: 1 },
    checklistId: { type: Schema.Types.ObjectId, ref: 'HousekeepingChecklist' },
    specialInstructions: { type: String },
    supplies: [{
      item: { type: String, required: true },
      quantity: { type: Number, required: true, min: 1 },
      unit: { type: String, required: true }
    }]
  },
  isActive: { 
    type: Boolean, 
    default: true 
  },
  isBookable: { 
    type: Boolean, 
    default: true 
  },
  displayOrder: { 
    type: Number, 
    default: 0 
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
RoomTypeSchema.index({ propertyId: 1 });
RoomTypeSchema.index({ code: 1 });
RoomTypeSchema.index({ category: 1 });
RoomTypeSchema.index({ isActive: 1 });
RoomTypeSchema.index({ isBookable: 1 });
RoomTypeSchema.index({ 'basePrice.perNight': 1 });
RoomTypeSchema.index({ 'maxOccupancy.total': 1 });

// Compound indexes
RoomTypeSchema.index({ propertyId: 1, code: 1 }, { unique: true });
RoomTypeSchema.index({ propertyId: 1, isActive: 1, isBookable: 1 });

// Validation
RoomTypeSchema.pre('save', function(next) {
  // Ensure total occupancy is consistent
  this.maxOccupancy.total = this.maxOccupancy.adults + this.maxOccupancy.children;
  
  // Ensure total beds is consistent
  this.bedConfiguration.totalBeds = 
    this.bedConfiguration.singleBeds +
    this.bedConfiguration.doubleBeds +
    this.bedConfiguration.queenBeds +
    this.bedConfiguration.kingBeds +
    this.bedConfiguration.sofaBeds +
    this.bedConfiguration.bunkBeds;
    
  // Ensure inventory consistency
  if (this.inventory.availableRooms + this.inventory.maintenanceRooms + this.inventory.bookedRooms > this.inventory.totalRooms) {
    const error = new Error('Sum of available, maintenance, and booked rooms cannot exceed total rooms');
    return next(error);
  }
  
  next();
});

// Virtual for occupancy rate
RoomTypeSchema.virtual('occupancyRate').get(function() {
  if (this.inventory.totalRooms === 0) return 0;
  return (this.inventory.bookedRooms / this.inventory.totalRooms) * 100;
});

// Virtual for availability rate
RoomTypeSchema.virtual('availabilityRate').get(function() {
  if (this.inventory.totalRooms === 0) return 0;
  return (this.inventory.availableRooms / this.inventory.totalRooms) * 100;
});

// Static methods
RoomTypeSchema.statics.getByProperty = function(propertyId: string) {
  return this.find({ 
    propertyId, 
    isActive: true 
  }).sort({ displayOrder: 1, category: 1 });
};

RoomTypeSchema.statics.getBookableRooms = function(propertyId: string) {
  return this.find({ 
    propertyId, 
    isActive: true, 
    isBookable: true,
    'inventory.availableRooms': { $gt: 0 }
  }).sort({ 'basePrice.perNight': 1 });
};

export default mongoose.models.RoomType || mongoose.model<IRoomType>('RoomType', RoomTypeSchema);