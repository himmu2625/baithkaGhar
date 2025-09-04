import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IMenuItem extends Document {
  _id: Types.ObjectId;
  propertyId: Types.ObjectId;
  categoryId: Types.ObjectId;
  name: string;
  description?: string;
  itemType: 'food' | 'beverage' | 'combo';
  basePrice: number;
  costPrice?: number;
  
  // Size variations
  sizes: [{
    name: string;
    price: number;
    costPrice?: number;
    isDefault: boolean;
    availabilityCount?: number;
  }];

  image?: string;
  images: string[];
  displayOrder: number;
  isActive: boolean;
  isAvailable: boolean;
  isFeatured: boolean;
  preparationTime: number;
  spicyLevel: 'none' | 'mild' | 'medium' | 'hot' | 'extra_hot';

  // Availability Schedule
  availabilitySchedule: {
    allDay: boolean;
    timeSlots: [{
      startTime: string; // HH:MM format
      endTime: string;   // HH:MM format
      days: ('monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday')[];
    }];
  };

  // Dietary Information
  dietary: {
    vegetarian: boolean;
    vegan: boolean;
    glutenFree: boolean;
    dairyFree: boolean;
    nutFree: boolean;
    halal: boolean;
    kosher: boolean;
    organic: boolean;
    keto: boolean;
    lowCarb: boolean;
    highProtein: boolean;
  };

  // Nutritional Information
  nutritionalInfo?: {
    calories: number;
    protein: number; // grams
    carbs: number;   // grams
    fat: number;     // grams
    fiber: number;   // grams
    sugar: number;   // grams
    sodium: number;  // mg
    servingSize: string;
    servingUnit: 'g' | 'ml' | 'oz' | 'cup' | 'piece' | 'slice';
  };

  allergens: ('nuts' | 'dairy' | 'eggs' | 'soy' | 'wheat' | 'shellfish' | 'fish' | 'sesame')[];
  ingredients: string[];
  tags: string[];
  modifiers: Types.ObjectId[];

  // Combo specific fields
  combo?: {
    items: [{
      itemId: Types.ObjectId;
      quantity: number;
      isOptional: boolean;
    }];
    discountType: 'fixed' | 'percentage';
    discountValue: number;
  };

  // Settings
  settings: {
    allowCustomization: boolean;
    requireAge18Plus: boolean;
    maximumOrderQuantity: number;
    minimumOrderQuantity: number;
    showNutritionalInfo: boolean;
    trackInventory: boolean;
    availabilityCount?: number;
  };

  // Legacy fields for backward compatibility
  availability?: {
    isActive: boolean;
    isOutOfStock: boolean;
    stockQuantity?: number;
    minimumStock: number;
    timeSlots: [{
      startTime: string;
      endTime: string;
      days: string[];
    }];
    seasonal: {
      isSeasonalItem: boolean;
      seasonStart?: Date;
      seasonEnd?: Date;
    };
  };

  preparation?: {
    prepTime: number;
    cookTime: number;
    kitchenStation: string;
    difficulty: 'easy' | 'medium' | 'hard';
    specialInstructions?: string;
  };

  pricing?: {
    basePrice: number;
    currency: string;
    discountPrice?: number;
    portions: [{
      name: string;
      price: number;
      calories?: number;
      servingSize?: string;
    }];
  };

  ratings?: {
    averageRating: number;
    totalReviews: number;
  };

  analytics?: {
    totalOrdered: number;
    totalRevenue: number;
    lastOrderDate?: Date;
    popularityScore: number;
  };

  // Metadata
  createdBy: Types.ObjectId;
  lastUpdatedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;

  // Methods
  isAvailableNow(): boolean;
  updateStock(quantity: number): Promise<IMenuItem>;
  addRating(rating: number): Promise<IMenuItem>;
}

const MenuItemSchema = new Schema<IMenuItem>({
  propertyId: {
    type: Schema.Types.ObjectId,
    ref: 'Property',
    required: [true, 'Property ID is required'],
    index: true
  },
  
  categoryId: {
    type: Schema.Types.ObjectId,
    ref: 'MenuCategory',
    required: [true, 'Category ID is required'],
    index: true
  },
  
  name: {
    type: String,
    required: [true, 'Item name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  
  description: {
    type: String,
    trim: true,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },

  itemType: {
    type: String,
    required: [true, 'Item type is required'],
    enum: {
      values: ['food', 'beverage', 'combo'],
      message: 'Invalid item type'
    }
  },

  basePrice: {
    type: Number,
    required: [true, 'Base price is required'],
    min: [0, 'Price cannot be negative']
  },

  costPrice: {
    type: Number,
    min: [0, 'Cost price cannot be negative']
  },

  sizes: [{
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50
    },
    price: {
      type: Number,
      required: true,
      min: 0
    },
    costPrice: {
      type: Number,
      min: 0
    },
    isDefault: {
      type: Boolean,
      default: false
    },
    availabilityCount: {
      type: Number,
      min: 0
    }
  }],

  image: {
    type: String,
    validate: {
      validator: function(v: string) {
        return !v || /^https?:\/\/.+/.test(v);
      },
      message: 'Image must be a valid URL'
    }
  },
  
  images: [{
    type: String,
    validate: {
      validator: function(v: string) {
        return /^https?:\/\/.+/.test(v);
      },
      message: 'Image must be a valid URL'
    }
  }],
  displayOrder: {
    type: Number,
    default: 0,
    min: [0, 'Display order cannot be negative']
  },

  isActive: {
    type: Boolean,
    default: true,
    index: true
  },

  isAvailable: {
    type: Boolean,
    default: true,
    index: true
  },

  isFeatured: {
    type: Boolean,
    default: false,
    index: true
  },

  preparationTime: {
    type: Number,
    default: 15,
    min: [0, 'Preparation time cannot be negative']
  },

  spicyLevel: {
    type: String,
    enum: {
      values: ['none', 'mild', 'medium', 'hot', 'extra_hot'],
      message: 'Invalid spicy level'
    },
    default: 'none'
  },

  availabilitySchedule: {
    type: {
      allDay: {
        type: Boolean,
        default: true
      },
      timeSlots: [{
        startTime: {
          type: String,
          validate: {
            validator: function(v: string) {
              return /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
            },
            message: 'Start time must be in HH:MM format'
          }
        },
        endTime: {
          type: String,
          validate: {
            validator: function(v: string) {
              return /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
            },
            message: 'End time must be in HH:MM format'
          }
        },
        days: [{
          type: String,
          enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
        }]
      }]
    },
    default: () => ({ allDay: true, timeSlots: [] })
  },

  dietary: {
    vegetarian: { type: Boolean, default: false },
    vegan: { type: Boolean, default: false },
    glutenFree: { type: Boolean, default: false },
    dairyFree: { type: Boolean, default: false },
    nutFree: { type: Boolean, default: false },
    halal: { type: Boolean, default: false },
    kosher: { type: Boolean, default: false },
    organic: { type: Boolean, default: false },
    keto: { type: Boolean, default: false },
    lowCarb: { type: Boolean, default: false },
    highProtein: { type: Boolean, default: false }
  },

  nutritionalInfo: {
    calories: {
      type: Number,
      min: [0, 'Calories cannot be negative']
    },
    protein: {
      type: Number,
      min: [0, 'Protein cannot be negative']
    },
    carbs: {
      type: Number,
      min: [0, 'Carbs cannot be negative']
    },
    fat: {
      type: Number,
      min: [0, 'Fat cannot be negative']
    },
    fiber: {
      type: Number,
      min: [0, 'Fiber cannot be negative']
    },
    sugar: {
      type: Number,
      min: [0, 'Sugar cannot be negative']
    },
    sodium: {
      type: Number,
      min: [0, 'Sodium cannot be negative']
    },
    servingSize: String,
    servingUnit: {
      type: String,
      enum: ['g', 'ml', 'oz', 'cup', 'piece', 'slice'],
      default: 'piece'
    }
  },

  allergens: [{
    type: String,
    enum: ['nuts', 'dairy', 'eggs', 'soy', 'wheat', 'shellfish', 'fish', 'sesame']
  }],

  ingredients: [{
    type: String,
    trim: true,
    maxlength: 100
  }],

  tags: [{
    type: String,
    trim: true,
    maxlength: 50
  }],

  modifiers: [{
    type: Schema.Types.ObjectId,
    ref: 'MenuModifier'
  }],

  combo: {
    items: [{
      itemId: {
        type: Schema.Types.ObjectId,
        ref: 'MenuItem',
        required: true
      },
      quantity: {
        type: Number,
        min: 1,
        default: 1
      },
      isOptional: {
        type: Boolean,
        default: false
      }
    }],
    discountType: {
      type: String,
      enum: ['fixed', 'percentage']
    },
    discountValue: {
      type: Number,
      min: 0
    }
  },

  settings: {
    allowCustomization: { type: Boolean, default: true },
    requireAge18Plus: { type: Boolean, default: false },
    maximumOrderQuantity: { type: Number, min: 1, default: 10 },
    minimumOrderQuantity: { type: Number, min: 1, default: 1 },
    showNutritionalInfo: { type: Boolean, default: false },
    trackInventory: { type: Boolean, default: false },
    availabilityCount: {
      type: Number,
      min: 0
    }
  },

  // Legacy support fields
  availability: {
    isActive: { type: Boolean, default: true },
    isOutOfStock: { type: Boolean, default: false },
    stockQuantity: { type: Number, default: null },
    minimumStock: { type: Number, default: 0 },
    timeSlots: [{
      startTime: String,
      endTime: String,
      days: [String]
    }],
    seasonal: {
      isSeasonalItem: { type: Boolean, default: false },
      seasonStart: Date,
      seasonEnd: Date
    }
  },

  preparation: {
    prepTime: { type: Number, default: 0 },
    cookTime: { type: Number, default: 0 },
    kitchenStation: {
      type: String,
      enum: ['hot_kitchen', 'cold_kitchen', 'grill', 'fryer', 'salad_station', 'dessert_station', 'beverage_station', 'bar']
    },
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard'],
      default: 'medium'
    },
    specialInstructions: String
  },

  pricing: {
    basePrice: {
      type: Number,
      min: 0
    },
    currency: {
      type: String,
      default: 'INR'
    },
    discountPrice: {
      type: Number,
      min: 0
    },
    portions: [{
      name: String,
      price: Number,
      calories: Number,
      servingSize: String
    }]
  },

  ratings: {
    averageRating: { type: Number, min: 0, max: 5, default: 0 },
    totalReviews: { type: Number, default: 0 }
  },

  analytics: {
    totalOrdered: { type: Number, default: 0 },
    totalRevenue: { type: Number, default: 0 },
    lastOrderDate: Date,
    popularityScore: { type: Number, default: 0 }
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
MenuItemSchema.index({ propertyId: 1, name: 1 }, { unique: true });
MenuItemSchema.index({ propertyId: 1, categoryId: 1 });
MenuItemSchema.index({ propertyId: 1, isActive: 1 });
MenuItemSchema.index({ propertyId: 1, isAvailable: 1 });
MenuItemSchema.index({ propertyId: 1, isFeatured: 1 });
MenuItemSchema.index({ propertyId: 1, itemType: 1 });
MenuItemSchema.index({ basePrice: 1 });
MenuItemSchema.index({ displayOrder: 1 });
MenuItemSchema.index({ tags: 1 });
MenuItemSchema.index({ 'ratings.averageRating': -1 });
MenuItemSchema.index({ 'analytics.popularityScore': -1 });

// Virtual for checking availability now (removed to avoid conflict with instance method)

// Pre-save middleware
MenuItemSchema.pre('save', function(next) {
  if (this.isModified() && !this.isNew) {
    (this as any).lastUpdatedBy = (this as any).createdBy; // This should be set by the API
  }
  
  // Auto-calculate popularity score
  if ((this as any).analytics && typeof (this as any).analytics.totalOrdered === 'number' && typeof (this as any).ratings?.averageRating === 'number') {
    (this as any).analytics.popularityScore = ((this as any).analytics.totalOrdered * 0.3) + ((this as any).ratings.averageRating * 20);
  }
  
  next();
});

// Instance methods
MenuItemSchema.methods.isAvailableNow = function(): boolean {
  if (!this.isActive || !this.isAvailable) return false;
  
  if (this.availabilitySchedule.allDay) return true;
  
  const now = new Date();
  const currentTime = now.toTimeString().slice(0, 5); // HH:MM
  const currentDay = now.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
  
  return this.availabilitySchedule.timeSlots.some((slot: any) => {
    return slot.days.includes(currentDay) && 
           currentTime >= slot.startTime && 
           currentTime <= slot.endTime;
  });
};

MenuItemSchema.methods.updateStock = function(quantity: number): Promise<IMenuItem> {
  if (this.settings.trackInventory && this.settings.availabilityCount !== undefined) {
    this.settings.availabilityCount = Math.max(0, this.settings.availabilityCount - quantity);
    this.isAvailable = this.settings.availabilityCount > 0;
  }
  return this.save();
};

MenuItemSchema.methods.addRating = function(rating: number): Promise<IMenuItem> {
  const currentTotal = (this.ratings?.averageRating || 0) * (this.ratings?.totalReviews || 0);
  this.ratings = this.ratings || { averageRating: 0, totalReviews: 0 };
  this.ratings.totalReviews = (this.ratings.totalReviews || 0) + 1;
  this.ratings.averageRating = (currentTotal + rating) / this.ratings.totalReviews;
  return this.save();
};

MenuItemSchema.methods.updatePrice = function(newPrice: number): Promise<IMenuItem> {
  this.basePrice = newPrice;
  this.lastUpdatedBy = this.createdBy; // Should be set by the calling code
  return this.save();
};

MenuItemSchema.methods.toggleAvailability = function(): Promise<IMenuItem> {
  this.isAvailable = !this.isAvailable;
  this.lastUpdatedBy = this.createdBy; // Should be set by the calling code
  return this.save();
};

MenuItemSchema.methods.addModifier = function(modifierId: string): Promise<IMenuItem> {
  if (!this.modifiers.includes(modifierId)) {
    this.modifiers.push(modifierId);
    this.lastUpdatedBy = this.createdBy; // Should be set by the calling code
  }
  return this.save();
};

// Static methods
MenuItemSchema.statics.findByProperty = function(propertyId: Types.ObjectId, filters: any = {}) {
  return this.find({ propertyId, ...filters })
    .sort({ displayOrder: 1, name: 1 })
    .populate('categoryId', 'name categoryType')
    .populate('modifiers', 'name type options')
    .populate('createdBy', 'fullName')
    .populate('lastUpdatedBy', 'fullName');
};

MenuItemSchema.statics.findActiveByProperty = function(propertyId: Types.ObjectId) {
  return (this as any).findByProperty(propertyId, { isActive: true });
};

MenuItemSchema.statics.findAvailableByProperty = function(propertyId: Types.ObjectId) {
  return (this as any).findByProperty(propertyId, { isActive: true, isAvailable: true });
};

MenuItemSchema.statics.findByCategory = function(propertyId: Types.ObjectId, categoryId: Types.ObjectId) {
  return (this as any).findByProperty(propertyId, { categoryId, isActive: true });
};

MenuItemSchema.statics.findFeatured = function(propertyId: Types.ObjectId) {
  return (this as any).findByProperty(propertyId, { isActive: true, isFeatured: true })
    .sort({ 'analytics.popularityScore': -1 });
};

MenuItemSchema.statics.findPopular = function(propertyId: Types.ObjectId, limit = 10) {
  return (this as any).findByProperty(propertyId, { isActive: true })
    .sort({ 'analytics.popularityScore': -1 })
    .limit(limit);
};

const MenuItem = mongoose.models.MenuItem || mongoose.model<IMenuItem>('MenuItem', MenuItemSchema);

export default MenuItem;