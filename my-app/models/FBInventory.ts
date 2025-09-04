import { Schema, model, models } from 'mongoose';

const FBInventorySchema = new Schema({
  propertyId: {
    type: String,
    required: true,
    ref: 'Property'
  },
  
  itemCode: {
    type: String,
    required: true,
    trim: true,
    uppercase: true
  },
  
  itemName: {
    type: String,
    required: true,
    trim: true
  },
  
  category: {
    type: String,
    enum: [
      'produce', 'meat_poultry', 'seafood', 'dairy', 'dry_goods', 'spices_condiments',
      'beverages', 'alcohol', 'frozen', 'bakery', 'cleaning_supplies', 'disposables',
      'equipment', 'utensils', 'linens', 'packaging'
    ],
    required: true
  },
  
  subCategory: {
    type: String,
    trim: true
  },
  
  description: {
    type: String,
    trim: true
  },
  
  specifications: {
    brand: String,
    model: String,
    size: String,
    weight: String,
    color: String,
    material: String
  },
  
  units: {
    baseUnit: {
      type: String,
      required: true // kg, liter, piece, box, etc.
    },
    alternativeUnits: [{
      unit: String,
      conversionFactor: Number // How many base units = 1 alternative unit
    }],
    purchaseUnit: String,
    consumptionUnit: String
  },
  
  stockLevels: {
    currentStock: {
      type: Number,
      required: true,
      min: 0,
      default: 0
    },
    minimumStock: {
      type: Number,
      required: true,
      min: 0,
      default: 0
    },
    maximumStock: {
      type: Number,
      min: 0
    },
    reorderPoint: {
      type: Number,
      required: true,
      min: 0
    },
    reorderQuantity: {
      type: Number,
      required: true,
      min: 0
    },
    
    reservedStock: { type: Number, default: 0 }, // Stock allocated for confirmed orders
    availableStock: { type: Number, default: 0 }, // Current - Reserved
    
    lastStockUpdate: {
      type: Date,
      default: Date.now
    }
  },
  
  costingInfo: {
    unitCost: {
      type: Number,
      required: true,
      min: 0
    },
    averageCost: {
      type: Number,
      min: 0
    },
    lastPurchasePrice: {
      type: Number,
      min: 0
    },
    standardCost: {
      type: Number,
      min: 0
    },
    currency: {
      type: String,
      default: 'INR'
    },
    
    totalValue: { type: Number, default: 0 }, // Current stock * unit cost
    
    priceHistory: [{
      date: Date,
      price: Number,
      supplierId: {
        type: Schema.Types.ObjectId,
        ref: 'Supplier'
      },
      quantity: Number
    }]
  },
  
  suppliers: [{
    supplierId: {
      type: Schema.Types.ObjectId,
      ref: 'Supplier'
    },
    supplierName: String,
    supplierItemCode: String,
    unitPrice: Number,
    minimumOrderQuantity: Number,
    leadTime: Number, // days
    isPrimary: { type: Boolean, default: false },
    lastOrderDate: Date,
    rating: { type: Number, min: 1, max: 5 }
  }],
  
  storageInfo: {
    location: {
      warehouse: String,
      section: String,
      shelf: String,
      bin: String
    },
    storageType: {
      type: String,
      enum: ['dry', 'refrigerated', 'frozen', 'room_temperature', 'climate_controlled']
    },
    storageConditions: {
      temperature: {
        min: Number,
        max: Number,
        unit: { type: String, default: 'C' }
      },
      humidity: {
        min: Number,
        max: Number
      },
      specialRequirements: String
    }
  },
  
  expiryTracking: {
    isPerishable: { type: Boolean, default: false },
    shelfLife: Number, // days
    
    batches: [{
      batchNumber: String,
      receivedDate: Date,
      expiryDate: Date,
      quantity: Number,
      supplierBatchCode: String,
      status: {
        type: String,
        enum: ['active', 'expired', 'consumed', 'disposed'],
        default: 'active'
      }
    }],
    
    nearExpiryDays: { type: Number, default: 7 }, // Alert when items expire within X days
    autoDisposeExpired: { type: Boolean, default: false }
  },
  
  consumptionTracking: {
    averageDailyUsage: { type: Number, default: 0 },
    averageWeeklyUsage: { type: Number, default: 0 },
    averageMonthlyUsage: { type: Number, default: 0 },
    
    usageHistory: [{
      date: Date,
      quantityUsed: Number,
      purpose: {
        type: String,
        enum: ['production', 'waste', 'sample', 'staff_meal', 'returned', 'damaged']
      },
      orderId: {
        type: Schema.Types.ObjectId,
        ref: 'FBOrder'
      },
      recipeId: {
        type: Schema.Types.ObjectId,
        ref: 'Recipe'
      },
      usedBy: {
        type: Schema.Types.ObjectId,
        ref: 'StaffMember'
      },
      notes: String
    }],
    
    lastUsedDate: Date,
    turnoverRate: Number // How many times inventory turns over in a period
  },
  
  qualityControl: {
    qualityStandards: {
      appearance: String,
      texture: String,
      aroma: String,
      taste: String,
      otherCriteria: String
    },
    
    inspectionHistory: [{
      inspectionDate: Date,
      inspectedBy: {
        type: Schema.Types.ObjectId,
        ref: 'StaffMember'
      },
      qualityRating: { type: Number, min: 1, max: 5 },
      notes: String,
      issuesFound: [String],
      actionTaken: String,
      passed: { type: Boolean, default: true }
    }],
    
    nextInspectionDate: Date,
    inspectionFrequency: String, // 'daily', 'weekly', 'monthly'
    requiresInspection: { type: Boolean, default: false }
  },
  
  procurement: {
    autoReorderEnabled: { type: Boolean, default: false },
    
    pendingOrders: [{
      orderId: String,
      orderDate: Date,
      expectedDelivery: Date,
      quantity: Number,
      supplierId: {
        type: Schema.Types.ObjectId,
        ref: 'Supplier'
      },
      status: {
        type: String,
        enum: ['ordered', 'confirmed', 'shipped', 'delivered', 'cancelled']
      }
    }],
    
    lastOrderDate: Date,
    nextExpectedDelivery: Date,
    orderFrequency: String // 'daily', 'weekly', 'monthly'
  },
  
  menuUsage: {
    usedInMenuItems: [{
      menuItemId: {
        type: Schema.Types.ObjectId,
        ref: 'MenuItem'
      },
      menuItemName: String,
      quantityPerPortion: Number,
      isCriticalIngredient: { type: Boolean, default: false }
    }],
    
    usedInRecipes: [{
      recipeId: {
        type: Schema.Types.ObjectId,
        ref: 'Recipe'
      },
      recipeName: String,
      quantityRequired: Number
    }]
  },
  
  analytics: {
    totalPurchased: { type: Number, default: 0 },
    totalConsumed: { type: Number, default: 0 },
    totalWasted: { type: Number, default: 0 },
    wastePercentage: { type: Number, default: 0 },
    
    costAnalysis: {
      totalPurchaseCost: { type: Number, default: 0 },
      totalWasteCost: { type: Number, default: 0 },
      costPerUnit: { type: Number, default: 0 }
    },
    
    seasonalTrends: [{
      month: Number,
      averageConsumption: Number,
      averageCost: Number
    }],
    
    lastAnalysisUpdate: Date
  },
  
  alerts: {
    lowStock: { type: Boolean, default: false },
    nearExpiry: { type: Boolean, default: false },
    overStock: { type: Boolean, default: false },
    qualityIssue: { type: Boolean, default: false },
    supplierDelay: { type: Boolean, default: false },
    
    alertHistory: [{
      alertType: String,
      alertDate: Date,
      resolved: { type: Boolean, default: false },
      resolvedDate: Date,
      resolvedBy: {
        type: Schema.Types.ObjectId,
        ref: 'StaffMember'
      }
    }]
  },
  
  status: {
    type: String,
    enum: ['active', 'inactive', 'discontinued', 'seasonal'],
    default: 'active'
  },
  
  isActive: {
    type: Boolean,
    default: true
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

FBInventorySchema.pre('save', function() {
  this.updatedAt = new Date();
  
  // Calculate available stock
  this.stockLevels.availableStock = this.stockLevels.currentStock - (this.stockLevels.reservedStock || 0);
  
  // Calculate total value
  this.costingInfo.totalValue = this.stockLevels.currentStock * (this.costingInfo.unitCost || 0);
  
  // Update alerts
  this.alerts.lowStock = this.stockLevels.currentStock <= this.stockLevels.reorderPoint;
  this.alerts.overStock = this.stockLevels.maximumStock ? 
    this.stockLevels.currentStock > this.stockLevels.maximumStock : false;
  
  // Calculate waste percentage
  if (this.analytics?.totalPurchased > 0) {
    this.analytics.wastePercentage = (this.analytics.totalWasted / this.analytics.totalPurchased) * 100;
  }
});

FBInventorySchema.index({ propertyId: 1, itemCode: 1 }, { unique: true });
FBInventorySchema.index({ propertyId: 1, category: 1 });
FBInventorySchema.index({ propertyId: 1, status: 1 });
FBInventorySchema.index({ 'stockLevels.currentStock': 1 });
FBInventorySchema.index({ 'alerts.lowStock': 1 });
FBInventorySchema.index({ 'alerts.nearExpiry': 1 });

FBInventorySchema.methods.updateStock = function(quantity: number, operation: 'add' | 'subtract', reason?: string, staffId?: string) {
  const previousStock = this.stockLevels.currentStock;
  
  if (operation === 'add') {
    this.stockLevels.currentStock += quantity;
  } else {
    this.stockLevels.currentStock = Math.max(0, this.stockLevels.currentStock - quantity);
  }
  
  this.stockLevels.lastStockUpdate = new Date();
  
  // Record usage
  if (reason && staffId) {
    this.consumptionTracking = this.consumptionTracking || { usageHistory: [] };
    this.consumptionTracking.usageHistory.push({
      date: new Date(),
      quantityUsed: operation === 'subtract' ? quantity : -quantity,
      purpose: reason as any,
      usedBy: staffId
    });
  }
  
  return this.save();
};

FBInventorySchema.methods.addBatch = function(batchData: any) {
  this.expiryTracking = this.expiryTracking || { isPerishable: true, batches: [] };
  
  this.expiryTracking.batches.push({
    ...batchData,
    status: 'active'
  });
  
  // Update stock
  this.stockLevels.currentStock += batchData.quantity;
  
  return this.save();
};

FBInventorySchema.methods.checkNearExpiry = function() {
  if (!this.expiryTracking?.isPerishable) return [];
  
  const nearExpiryDays = this.expiryTracking.nearExpiryDays || 7;
  const checkDate = new Date();
  checkDate.setDate(checkDate.getDate() + nearExpiryDays);
  
  const nearExpiryBatches = this.expiryTracking.batches?.filter(batch => 
    batch.status === 'active' && 
    batch.expiryDate && 
    new Date(batch.expiryDate) <= checkDate
  ) || [];
  
  this.alerts.nearExpiry = nearExpiryBatches.length > 0;
  
  return nearExpiryBatches;
};

FBInventorySchema.methods.calculateReorderQuantity = function() {
  const dailyUsage = this.consumptionTracking?.averageDailyUsage || 0;
  const leadTime = this.suppliers?.find(s => s.isPrimary)?.leadTime || 7;
  const safetyStock = dailyUsage * 3; // 3 days safety stock
  
  const targetStock = (dailyUsage * leadTime) + safetyStock;
  const reorderQuantity = Math.max(0, targetStock - this.stockLevels.currentStock);
  
  return Math.ceil(reorderQuantity);
};

FBInventorySchema.methods.recordConsumption = function(quantity: number, purpose: string, additionalData?: any) {
  this.consumptionTracking = this.consumptionTracking || { usageHistory: [], averageDailyUsage: 0 };
  
  this.consumptionTracking.usageHistory.push({
    date: new Date(),
    quantityUsed: quantity,
    purpose,
    ...additionalData
  });
  
  this.consumptionTracking.lastUsedDate = new Date();
  
  // Update stock
  this.stockLevels.currentStock = Math.max(0, this.stockLevels.currentStock - quantity);
  
  // Update analytics
  this.analytics = this.analytics || {};
  this.analytics.totalConsumed = (this.analytics.totalConsumed || 0) + quantity;
  
  if (purpose === 'waste') {
    this.analytics.totalWasted = (this.analytics.totalWasted || 0) + quantity;
  }
  
  return this.save();
};

FBInventorySchema.statics.findByProperty = function(propertyId: string) {
  return this.find({ propertyId, isActive: true }).sort({ category: 1, itemName: 1 });
};

FBInventorySchema.statics.findLowStock = function(propertyId: string) {
  return this.find({ 
    propertyId, 
    isActive: true,
    'alerts.lowStock': true 
  }).sort({ 'stockLevels.currentStock': 1 });
};

FBInventorySchema.statics.findNearExpiry = function(propertyId: string) {
  return this.find({ 
    propertyId, 
    isActive: true,
    'alerts.nearExpiry': true 
  }).sort({ 'expiryTracking.batches.expiryDate': 1 });
};

FBInventorySchema.statics.findByCategory = function(propertyId: string, category: string) {
  return this.find({ propertyId, category, isActive: true }).sort({ itemName: 1 });
};

FBInventorySchema.statics.getInventoryValue = function(propertyId: string) {
  return this.aggregate([
    { $match: { propertyId, isActive: true } },
    {
      $group: {
        _id: '$category',
        totalValue: { $sum: '$costingInfo.totalValue' },
        totalItems: { $sum: 1 },
        lowStockItems: { 
          $sum: { $cond: ['$alerts.lowStock', 1, 0] }
        }
      }
    },
    { $sort: { totalValue: -1 } }
  ]);
};

const FBInventory = models.FBInventory || model('FBInventory', FBInventorySchema);

export default FBInventory;