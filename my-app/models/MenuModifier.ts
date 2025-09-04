import { Schema, model, models } from 'mongoose';

const MenuModifierSchema = new Schema({
  propertyId: {
    type: String,
    required: true,
    ref: 'Property'
  },
  
  name: {
    type: String,
    required: true,
    trim: true
  },
  
  description: {
    type: String,
    trim: true
  },
  
  modifierType: {
    type: String,
    enum: ['single_select', 'multi_select', 'quantity_based', 'text_input'],
    required: true
  },
  
  category: {
    type: String,
    enum: ['size', 'addon', 'customization', 'cooking_preference', 'spice_level', 'temperature', 'extras', 'removal'],
    required: true
  },
  
  isRequired: {
    type: Boolean,
    default: false
  },
  
  options: [{
    name: {
      type: String,
      required: true,
      trim: true
    },
    description: String,
    priceAdjustment: {
      type: Number,
      default: 0 // Can be negative for discounts
    },
    image: String,
    isDefault: {
      type: Boolean,
      default: false
    },
    isAvailable: {
      type: Boolean,
      default: true
    },
    stockQuantity: Number, // null means unlimited
    nutritionalImpact: {
      calories: { type: Number, default: 0 },
      protein: { type: Number, default: 0 },
      carbs: { type: Number, default: 0 },
      fat: { type: Number, default: 0 }
    },
    allergens: [{
      type: String,
      enum: ['gluten', 'dairy', 'nuts', 'soy', 'eggs', 'shellfish', 'fish', 'sesame']
    }]
  }],
  
  constraints: {
    minSelections: {
      type: Number,
      default: 0
    },
    maxSelections: {
      type: Number,
      default: 1
    },
    maxQuantityPerOption: {
      type: Number,
      default: 10
    }
  },
  
  applicableItems: [{
    type: Schema.Types.ObjectId,
    ref: 'MenuItem'
  }],
  
  applicableCategories: [{
    type: Schema.Types.ObjectId,
    ref: 'MenuCategory'
  }],
  
  displayOrder: {
    type: Number,
    default: 0
  },
  
  isActive: {
    type: Boolean,
    default: true
  },
  
  settings: {
    showImage: { type: Boolean, default: false },
    allowCustomText: { type: Boolean, default: false },
    maxCustomTextLength: { type: Number, default: 100 },
    showNutritionalInfo: { type: Boolean, default: false },
    hideUnavailableOptions: { type: Boolean, default: true }
  },
  
  analytics: {
    totalUsed: { type: Number, default: 0 },
    popularOptions: [{
      optionName: String,
      usageCount: { type: Number, default: 0 }
    }]
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

MenuModifierSchema.pre('save', function() {
  this.updatedAt = new Date();
  
  // Ensure constraints make sense
  if (this.modifierType === 'single_select') {
    this.constraints = this.constraints || {
      minSelections: 0,
      maxSelections: 1,
      maxQuantityPerOption: 1
    };
    this.constraints!.maxSelections = 1;
  }
  
  // Ensure at least one default option for required modifiers
  if (this.isRequired && this.options?.length > 0) {
    const hasDefault = this.options.some(option => option.isDefault);
    if (!hasDefault) {
      this.options[0].isDefault = true;
    }
  }
});

MenuModifierSchema.index({ propertyId: 1, category: 1 });
MenuModifierSchema.index({ propertyId: 1, isActive: 1 });
MenuModifierSchema.index({ applicableItems: 1 });
MenuModifierSchema.index({ applicableCategories: 1 });
MenuModifierSchema.index({ displayOrder: 1 });

MenuModifierSchema.methods.getAvailableOptions = function() {
  return this.options?.filter((option: any) => 
    option.isAvailable && 
    (option.stockQuantity === null || option.stockQuantity > 0)
  ) || [];
};

MenuModifierSchema.methods.updateOptionStock = function(optionName: string, quantity: number) {
  const option = this.options?.find((opt: any) => opt.name === optionName);
  if (option && option.stockQuantity !== null) {
    option.stockQuantity = Math.max(0, option.stockQuantity - quantity);
    option.isAvailable = option.stockQuantity > 0;
    
    // Update analytics
    const analyticsOption = this.analytics?.popularOptions?.find((po: any) => po.optionName === optionName);
    if (analyticsOption) {
      analyticsOption.usageCount += quantity;
    } else {
      this.analytics = this.analytics || { totalUsed: 0, popularOptions: [] };
      this.analytics.popularOptions.push({ optionName, usageCount: quantity });
    }
    
    this.analytics.totalUsed = (this.analytics.totalUsed || 0) + quantity;
  }
  return this.save();
};

MenuModifierSchema.methods.calculatePriceAdjustment = function(selectedOptions: string[]) {
  let totalAdjustment = 0;
  selectedOptions.forEach(optionName => {
    const option = this.options?.find((opt: any) => opt.name === optionName);
    if (option) {
      totalAdjustment += option.priceAdjustment || 0;
    }
  });
  return totalAdjustment;
};

MenuModifierSchema.statics.findByProperty = function(propertyId: string) {
  return this.find({ propertyId, isActive: true }).sort({ category: 1, displayOrder: 1 });
};

MenuModifierSchema.statics.findForMenuItem = function(menuItemId: string) {
  return this.find({ 
    $or: [
      { applicableItems: menuItemId },
      { applicableCategories: { $exists: true } } // Will need to check category match in application logic
    ],
    isActive: true 
  }).sort({ displayOrder: 1 });
};

MenuModifierSchema.statics.findByCategory = function(propertyId: string, category: string) {
  return this.find({ propertyId, category, isActive: true }).sort({ displayOrder: 1 });
};

const MenuModifier = models.MenuModifier || model('MenuModifier', MenuModifierSchema);

export default MenuModifier;