import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IMenuCategory extends Document {
  _id: Types.ObjectId;
  name: string;
  description?: string;
  propertyId: Types.ObjectId;
  categoryType: 'appetizer' | 'main_course' | 'dessert' | 'beverage' | 'snack' | 'salad' | 'soup' | 'breakfast' | 'lunch' | 'dinner' | 'alcoholic' | 'non_alcoholic' | 'hot_beverage' | 'cold_beverage';
  displayOrder: number;
  isActive: boolean;
  image?: string;
  
  // Availability Schedule
  availabilitySchedule: {
    allDay: boolean;
    timeSlots: [{
      startTime: string; // HH:MM format
      endTime: string;   // HH:MM format
      days: ('monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday')[];
    }];
  };
  
  // Legacy support for availableTime
  availableTime?: {
    breakfast: boolean;
    lunch: boolean;
    dinner: boolean;
    allDay: boolean;
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
  };

  // Category Settings
  settings: {
    allowCustomization: boolean;
    showNutritionalInfo: boolean;
    requireAge18Plus: boolean; // For alcoholic categories
    maximumOrderQuantity?: number;
  };

  // Metadata
  createdBy: Types.ObjectId;
  lastUpdatedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;

  // Methods
  isAvailableNow(): boolean;
}

const MenuCategorySchema = new Schema<IMenuCategory>({
  name: {
    type: String,
    required: [true, 'Category name is required'],
    trim: true,
    maxlength: [100, 'Category name cannot exceed 100 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  propertyId: {
    type: Schema.Types.ObjectId,
    ref: 'Property',
    required: [true, 'Property ID is required'],
    index: true
  },
  categoryType: {
    type: String,
    required: [true, 'Category type is required'],
    enum: {
      values: ['appetizer', 'main_course', 'dessert', 'beverage', 'snack', 'salad', 'soup', 'breakfast', 'lunch', 'dinner', 'alcoholic', 'non_alcoholic', 'hot_beverage', 'cold_beverage'],
      message: 'Invalid category type'
    }
  },
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
  image: {
    type: String,
    validate: {
      validator: function(v: string) {
        return !v || /^https?:\/\/.+/.test(v);
      },
      message: 'Image must be a valid URL'
    }
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

  // Legacy support
  availableTime: {
    breakfast: { type: Boolean, default: true },
    lunch: { type: Boolean, default: true },
    dinner: { type: Boolean, default: true },
    allDay: { type: Boolean, default: true }
  },

  dietary: {
    vegetarian: { type: Boolean, default: false },
    vegan: { type: Boolean, default: false },
    glutenFree: { type: Boolean, default: false },
    dairyFree: { type: Boolean, default: false },
    nutFree: { type: Boolean, default: false },
    halal: { type: Boolean, default: false },
    kosher: { type: Boolean, default: false }
  },

  settings: {
    allowCustomization: { type: Boolean, default: true },
    showNutritionalInfo: { type: Boolean, default: false },
    requireAge18Plus: { type: Boolean, default: false },
    maximumOrderQuantity: {
      type: Number,
      min: [1, 'Maximum order quantity must be at least 1']
    }
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
MenuCategorySchema.index({ propertyId: 1, name: 1 }, { unique: true });
MenuCategorySchema.index({ propertyId: 1, displayOrder: 1 });
MenuCategorySchema.index({ propertyId: 1, categoryType: 1 });
MenuCategorySchema.index({ propertyId: 1, isActive: 1 });

// Virtual for menu items count
MenuCategorySchema.virtual('itemCount', {
  ref: 'MenuItem',
  localField: '_id',
  foreignField: 'categoryId',
  count: true,
  match: { isActive: true }
});

// Pre-save middleware
MenuCategorySchema.pre('save', function(next) {
  if (this.isModified() && !this.isNew) {
    (this as any).lastUpdatedBy = (this as any).createdBy; // This should be set by the API
  }
  next();
});

// Instance methods
MenuCategorySchema.methods.isAvailableNow = function(): boolean {
  if (!this.isActive) return false;
  
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

MenuCategorySchema.methods.addItem = function(menuItemId: string): Promise<IMenuCategory> {
  // This method would be used to associate items with category
  // Implementation depends on whether items reference category or vice versa
  return this.save();
};

MenuCategorySchema.methods.removeItem = function(menuItemId: string): Promise<IMenuCategory> {
  // This method would be used to disassociate items from category
  // Implementation depends on whether items reference category or vice versa
  return this.save();
};

MenuCategorySchema.methods.getItems = function() {
  // This method would return all menu items in this category
  // Implementation would use populate or a separate query
  const MenuItem = require('./MenuItem').default;
  return MenuItem.find({ categoryId: this._id, isActive: true });
};

// Static methods
MenuCategorySchema.statics.findByProperty = function(propertyId: Types.ObjectId, filters: any = {}) {
  return this.find({ propertyId, ...filters })
    .sort({ displayOrder: 1, name: 1 })
    .populate('createdBy', 'fullName')
    .populate('lastUpdatedBy', 'fullName');
};

MenuCategorySchema.statics.findActiveByProperty = function(propertyId: Types.ObjectId) {
  return (this as any).findByProperty(propertyId, { isActive: true });
};

const MenuCategory = mongoose.models.MenuCategory || mongoose.model<IMenuCategory>('MenuCategory', MenuCategorySchema);

export default MenuCategory;