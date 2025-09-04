import { Schema, model, models } from 'mongoose';

const KitchenSchema = new Schema({
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
  
  kitchenType: {
    type: String,
    enum: ['main_kitchen', 'prep_kitchen', 'pastry_kitchen', 'banquet_kitchen', 'room_service_kitchen', 'bar', 'coffee_station'],
    required: true
  },
  
  location: {
    floor: String,
    building: String,
    area: String,
    coordinates: {
      x: Number,
      y: Number
    }
  },
  
  stations: [{
    stationId: {
      type: String,
      required: true
    },
    name: {
      type: String,
      required: true
    },
    type: {
      type: String,
      enum: ['grill', 'fryer', 'saute', 'salad', 'dessert', 'beverage', 'prep', 'washing', 'plating'],
      required: true
    },
    equipment: [{
      name: String,
      type: String,
      capacity: String,
      status: {
        type: String,
        enum: ['operational', 'maintenance', 'out_of_order'],
        default: 'operational'
      },
      lastMaintenance: Date,
      nextMaintenance: Date
    }],
    assignedStaff: [{
      staffId: {
        type: Schema.Types.ObjectId,
        ref: 'StaffMember'
      },
      role: {
        type: String,
        enum: ['head_chef', 'sous_chef', 'line_cook', 'prep_cook', 'assistant'],
        required: true
      },
      shiftStart: String, // "09:00"
      shiftEnd: String,   // "17:00"
      isActive: { type: Boolean, default: true }
    }],
    capacity: {
      maxSimultaneousOrders: { type: Number, default: 10 },
      averageOrderTime: { type: Number, default: 15 } // minutes
    },
    isActive: { type: Boolean, default: true }
  }],
  
  operatingHours: {
    schedule: [{
      day: {
        type: String,
        enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
        required: true
      },
      openTime: String,  // "06:00"
      closeTime: String, // "23:00"
      breakTimes: [{
        startTime: String,
        endTime: String,
        description: String
      }],
      isOperational: { type: Boolean, default: true }
    }],
    holidays: [{
      date: Date,
      reason: String,
      isOperational: { type: Boolean, default: false }
    }]
  },
  
  currentLoad: {
    activeOrders: { type: Number, default: 0 },
    pendingOrders: { type: Number, default: 0 },
    averageWaitTime: { type: Number, default: 0 }, // minutes
    lastUpdated: { type: Date, default: Date.now }
  },
  
  performance: {
    dailyStats: [{
      date: Date,
      ordersCompleted: { type: Number, default: 0 },
      averageCompletionTime: { type: Number, default: 0 },
      customerSatisfaction: { type: Number, default: 0 },
      wastePercentage: { type: Number, default: 0 },
      efficiency: { type: Number, default: 0 } // percentage
    }],
    monthlyTargets: {
      orderVolume: Number,
      averageServiceTime: Number,
      customerRating: Number,
      wastageTarget: Number
    }
  },
  
  inventory: {
    linkedInventoryIds: [{
      type: Schema.Types.ObjectId,
      ref: 'FBInventory'
    }],
    criticalItems: [{
      itemName: String,
      currentStock: Number,
      minimumRequired: Number,
      unit: String,
      lastUpdated: Date
    }],
    autoReorderEnabled: { type: Boolean, default: false }
  },
  
  qualityControl: {
    temperatureLog: [{
      equipment: String,
      temperature: Number,
      recordedAt: Date,
      recordedBy: {
        type: Schema.Types.ObjectId,
        ref: 'StaffMember'
      },
      isWithinRange: Boolean
    }],
    cleaningSchedule: [{
      area: String,
      frequency: {
        type: String,
        enum: ['daily', 'weekly', 'monthly'],
        required: true
      },
      lastCleaned: Date,
      nextDue: Date,
      assignedTo: {
        type: Schema.Types.ObjectId,
        ref: 'StaffMember'
      },
      status: {
        type: String,
        enum: ['pending', 'in_progress', 'completed', 'overdue'],
        default: 'pending'
      }
    }],
    haccp: {
      enabled: { type: Boolean, default: false },
      lastAudit: Date,
      nextAudit: Date,
      certificationStatus: {
        type: String,
        enum: ['active', 'expired', 'pending', 'not_applicable'],
        default: 'not_applicable'
      }
    }
  },
  
  communications: {
    printerConfigs: [{
      printerName: String,
      ipAddress: String,
      orderTypes: [String], // Which order types print to this printer
      isActive: { type: Boolean, default: true }
    }],
    displayScreens: [{
      screenId: String,
      location: String,
      showOrderQueue: { type: Boolean, default: true },
      showTimers: { type: Boolean, default: true },
      isActive: { type: Boolean, default: true }
    }]
  },
  
  settings: {
    orderQueueDisplay: {
      maxDisplayItems: { type: Number, default: 20 },
      sortBy: {
        type: String,
        enum: ['order_time', 'priority', 'prep_time'],
        default: 'order_time'
      },
      showEstimatedTime: { type: Boolean, default: true }
    },
    notifications: {
      orderReceived: { type: Boolean, default: true },
      orderOverdue: { type: Boolean, default: true },
      equipmentIssue: { type: Boolean, default: true },
      lowStock: { type: Boolean, default: true }
    },
    automation: {
      autoAssignOrders: { type: Boolean, default: false },
      loadBalancing: { type: Boolean, default: false },
      priorityRules: [{
        condition: String,
        priority: {
          type: String,
          enum: ['low', 'normal', 'high', 'urgent']
        }
      }]
    }
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

KitchenSchema.pre('save', function() {
  this.updatedAt = new Date();
});

KitchenSchema.index({ propertyId: 1, kitchenType: 1 });
KitchenSchema.index({ propertyId: 1, isActive: 1 });
KitchenSchema.index({ 'stations.stationId': 1 });
KitchenSchema.index({ 'stations.assignedStaff.staffId': 1 });

KitchenSchema.methods.updateCurrentLoad = function(activeOrders: number, pendingOrders: number) {
  this.currentLoad = {
    activeOrders,
    pendingOrders,
    averageWaitTime: this.calculateAverageWaitTime(),
    lastUpdated: new Date()
  };
  return this.save();
};

KitchenSchema.methods.calculateAverageWaitTime = function() {
  // This would be calculated based on current orders and station capacity
  const totalCapacity = this.stations?.reduce((sum, station) => {
    return sum + (station.isActive ? station.capacity?.maxSimultaneousOrders || 0 : 0);
  }, 0) || 1;
  
  const currentLoad = this.currentLoad?.activeOrders || 0;
  const baseTime = 15; // minutes
  
  return Math.max(baseTime, baseTime * (currentLoad / totalCapacity));
};

KitchenSchema.methods.getAvailableStations = function() {
  return this.stations?.filter(station => 
    station.isActive && 
    station.assignedStaff?.some(staff => staff.isActive)
  ) || [];
};

KitchenSchema.methods.assignOrderToStation = function(orderId: string, stationType: string) {
  const availableStations = this.getAvailableStations();
  const suitableStation = availableStations.find(station => station.type === stationType);
  
  if (suitableStation) {
    // Logic to assign order to the station would go here
    return suitableStation.stationId;
  }
  
  return null;
};

KitchenSchema.methods.recordTemperature = function(equipment: string, temperature: number, staffId: string) {
  this.qualityControl = this.qualityControl || { temperatureLog: [] };
  this.qualityControl.temperatureLog.push({
    equipment,
    temperature,
    recordedAt: new Date(),
    recordedBy: staffId,
    isWithinRange: this.isTemperatureWithinRange(equipment, temperature)
  });
  
  return this.save();
};

KitchenSchema.methods.isTemperatureWithinRange = function(equipment: string, temperature: number) {
  // Define temperature ranges for different equipment types
  const ranges: { [key: string]: { min: number, max: number } } = {
    'refrigerator': { min: 1, max: 4 },
    'freezer': { min: -18, max: -15 },
    'oven': { min: 180, max: 250 },
    'fryer': { min: 170, max: 190 }
  };
  
  const equipmentType = equipment.toLowerCase();
  const range = ranges[equipmentType];
  
  if (!range) return true; // Unknown equipment, assume OK
  
  return temperature >= range.min && temperature <= range.max;
};

KitchenSchema.statics.findByProperty = function(propertyId: string) {
  return this.find({ propertyId, isActive: true }).sort({ kitchenType: 1, name: 1 });
};

KitchenSchema.statics.findActiveKitchens = function(propertyId: string) {
  return this.find({ propertyId, isActive: true });
};

KitchenSchema.statics.findByType = function(propertyId: string, kitchenType: string) {
  return this.find({ propertyId, kitchenType, isActive: true });
};

const Kitchen = models.Kitchen || model('Kitchen', KitchenSchema);

export default Kitchen;