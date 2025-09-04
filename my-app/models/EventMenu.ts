import { Schema, model, models } from 'mongoose';

const EventMenuSchema = new Schema({
  propertyId: {
    type: String,
    required: true,
    ref: 'Property'
  },
  
  menuName: {
    type: String,
    required: true,
    trim: true
  },
  
  menuCode: {
    type: String,
    required: true,
    trim: true,
    uppercase: true
  },
  
  description: {
    type: String,
    trim: true
  },
  
  menuType: {
    type: String,
    enum: ['banquet', 'cocktail', 'buffet', 'plated', 'family_style', 'bbq', 'themed', 'custom'],
    required: true
  },
  
  eventTypes: [{
    eventTypeId: {
      type: Schema.Types.ObjectId,
      ref: 'EventType'
    },
    eventTypeName: String,
    suitabilityRating: { type: Number, min: 1, max: 10, default: 5 }
  }],
  
  cuisineStyle: {
    primary: {
      type: String,
      enum: ['indian', 'chinese', 'italian', 'continental', 'mexican', 'thai', 'mediterranean', 'fusion', 'japanese', 'middle_eastern'],
      required: true
    },
    secondary: [String],
    fusion: { type: Boolean, default: false }
  },
  
  serviceDetails: {
    serviceStyle: {
      type: String,
      enum: ['buffet', 'plated', 'family_style', 'stations', 'passed_hors_doeuvres', 'mixed'],
      required: true
    },
    
    mealPeriods: [{
      type: String,
      enum: ['breakfast', 'brunch', 'lunch', 'tea', 'cocktail', 'dinner', 'late_night'],
      required: true
    }],
    
    duration: {
      service: { type: Number, default: 2 }, // hours
      cocktail: { type: Number, default: 1 },
      dinner: { type: Number, default: 2 }
    },
    
    guestCapacity: {
      minimum: { type: Number, required: true },
      maximum: { type: Number, required: true },
      optimal: { type: Number, required: true }
    }
  },
  
  menuSections: [{
    sectionId: String,
    sectionName: {
      type: String,
      required: true
    },
    sectionType: {
      type: String,
      enum: ['appetizer', 'soup', 'salad', 'main_course', 'side_dish', 'dessert', 'beverage', 'bread', 'accompaniment'],
      required: true
    },
    displayOrder: Number,
    
    items: [{
      itemId: String,
      menuItemId: {
        type: Schema.Types.ObjectId,
        ref: 'MenuItem'
      },
      itemName: {
        type: String,
        required: true
      },
      description: String,
      
      pricing: {
        costPerServing: { type: Number, required: true },
        sellingPricePerServing: { type: Number, required: true },
        minimumOrder: { type: Number, default: 1 },
        portionSize: String
      },
      
      dietary: {
        vegetarian: { type: Boolean, default: false },
        vegan: { type: Boolean, default: false },
        glutenFree: { type: Boolean, default: false },
        dairyFree: { type: Boolean, default: false },
        nutFree: { type: Boolean, default: false },
        halal: { type: Boolean, default: false },
        kosher: { type: Boolean, default: false },
        spiceLevel: {
          type: String,
          enum: ['mild', 'medium', 'hot', 'extra_hot'],
          default: 'mild'
        }
      },
      
      preparation: {
        prepTime: Number, // minutes
        cookTime: Number,
        totalTime: Number,
        kitchenStation: String,
        skill_level: {
          type: String,
          enum: ['basic', 'intermediate', 'advanced', 'expert'],
          default: 'intermediate'
        },
        servingTemperature: {
          type: String,
          enum: ['hot', 'warm', 'room_temp', 'cold', 'frozen'],
          default: 'hot'
        }
      },
      
      ingredients: [{
        ingredientName: String,
        quantity: Number,
        unit: String,
        isOptional: { type: Boolean, default: false },
        allergen: { type: Boolean, default: false },
        substitutions: [String]
      }],
      
      presentation: {
        servingStyle: String,
        garnish: String,
        servingVessel: String,
        accompaniments: [String]
      },
      
      availability: {
        isActive: { type: Boolean, default: true },
        seasonal: { type: Boolean, default: false },
        seasonStart: Date,
        seasonEnd: Date
      },
      
      popularity: {
        orderCount: { type: Number, default: 0 },
        rating: { type: Number, default: 0 },
        clientFeedback: [String]
      }
    }],
    
    serviceOptions: {
      isOptional: { type: Boolean, default: false },
      allowSubstitutions: { type: Boolean, default: true },
      maximumSelections: Number,
      minimumSelections: { type: Number, default: 1 }
    }
  }],
  
  beverageOptions: {
    included: { type: Boolean, default: true },
    
    nonAlcoholic: [{
      beverageName: String,
      type: {
        type: String,
        enum: ['water', 'soft_drink', 'juice', 'tea', 'coffee', 'mocktail'],
        required: true
      },
      description: String,
      pricePerServing: Number,
      isComplimentary: { type: Boolean, default: false },
      unlimited: { type: Boolean, default: true }
    }],
    
    alcoholic: {
      included: { type: Boolean, default: false },
      
      options: [{
        categoryName: String,
        type: {
          type: String,
          enum: ['beer', 'wine', 'spirits', 'cocktail', 'champagne'],
          required: true
        },
        items: [{
          name: String,
          brand: String,
          description: String,
          pricePerServing: Number,
          abvPercentage: Number
        }],
        serviceStyle: {
          type: String,
          enum: ['open_bar', 'cash_bar', 'limited_bar', 'wine_only'],
          default: 'limited_bar'
        },
        duration: Number, // hours
        lastCall: String // "30 minutes before end"
      }],
      
      restrictions: {
        ageVerificationRequired: { type: Boolean, default: true },
        servingLimitations: String,
        licenseRequired: { type: Boolean, default: true }
      }
    }
  },
  
  specialDietaryMenus: [{
    dietType: {
      type: String,
      enum: ['vegetarian', 'vegan', 'gluten_free', 'dairy_free', 'keto', 'diabetic', 'low_sodium', 'halal', 'kosher'],
      required: true
    },
    
    menuItems: [{
      sectionName: String,
      items: [{
        itemName: String,
        description: String,
        ingredients: [String],
        priceAdjustment: { type: Number, default: 0 }
      }]
    }],
    
    additionalCost: { type: Number, default: 0 },
    minimumOrder: { type: Number, default: 10 },
    advanceNoticeRequired: { type: Number, default: 48 } // hours
  }],
  
  presentation: {
    setupStyle: {
      type: String,
      enum: ['elegant', 'casual', 'rustic', 'modern', 'traditional', 'themed'],
      default: 'elegant'
    },
    
    serviceWare: {
      plates: String,
      cutlery: String,
      glassware: String,
      linens: String,
      centerpieces: String
    },
    
    buffetSetup: {
      layout: String,
      decorations: [String],
      signage: { type: Boolean, default: true },
      chafingDishes: { type: Boolean, default: true },
      ice_displays: { type: Boolean, default: false }
    },
    
    staffPresentation: {
      uniform: String,
      serviceStyle: String,
      interaction_level: {
        type: String,
        enum: ['minimal', 'standard', 'white_glove'],
        default: 'standard'
      }
    }
  },
  
  logistics: {
    preparation: {
      advancePreparation: Number, // hours
      freshPreparation: Number,   // hours
      totalPrepTime: Number,
      kitchenCapacity: Number,    // simultaneous guests
      staffRequired: Number
    },
    
    service: {
      setupTime: Number,        // hours before event
      serviceStart: String,     // relative to event start
      serviceEnd: String,
      cleanupTime: Number,      // hours after event
      
      staffRequirements: [{
        role: {
          type: String,
          enum: ['chef', 'cook', 'server', 'bartender', 'captain', 'coordinator'],
          required: true
        },
        count: Number,
        hoursRequired: Number,
        skillLevel: String
      }]
    },
    
    equipment: [{
      equipmentName: String,
      quantity: Number,
      essential: { type: Boolean, default: true },
      alternativeOptions: [String]
    }],
    
    transportation: {
      deliveryRequired: { type: Boolean, default: false },
      specialHandling: [String],
      temperatureControl: { type: Boolean, default: false }
    }
  },
  
  costing: {
    breakdown: {
      foodCost: { type: Number, required: true },
      beverageCost: { type: Number, default: 0 },
      laborCost: { type: Number, required: true },
      equipmentCost: { type: Number, default: 0 },
      overheadCost: { type: Number, default: 0 },
      totalCostPerGuest: { type: Number, required: true }
    },
    
    pricing: {
      sellingPricePerGuest: { type: Number, required: true },
      currency: { type: String, default: 'INR' },
      
      tierPricing: [{
        guestRange: {
          min: Number,
          max: Number
        },
        pricePerGuest: Number,
        minimumSpend: Number
      }],
      
      seasonalPricing: [{
        season: String,
        startDate: Date,
        endDate: Date,
        priceMultiplier: { type: Number, default: 1.0 }
      }]
    },
    
    profitability: {
      grossProfit: Number,
      grossMargin: Number,    // percentage
      netProfit: Number,
      netMargin: Number,      // percentage
      breakEvenGuests: Number,
      targetMargin: { type: Number, default: 30 }
    }
  },
  
  customization: {
    isCustomizable: { type: Boolean, default: true },
    
    customizationOptions: [{
      optionName: String,
      category: {
        type: String,
        enum: ['appetizer_substitute', 'main_course_option', 'dessert_choice', 'dietary_modification', 'presentation_style']
      },
      description: String,
      additionalCost: Number,
      minimumOrder: Number
    }],
    
    substitutionPolicy: {
      allowSubstitutions: { type: Boolean, default: true },
      substitutionFee: { type: Number, default: 0 },
      advanceNotice: { type: Number, default: 24 } // hours
    }
  },
  
  qualityStandards: {
    ingredients: {
      qualityGrade: {
        type: String,
        enum: ['premium', 'standard', 'economy'],
        default: 'standard'
      },
      sourcePreferences: [String],
      organicOptions: { type: Boolean, default: false },
      localSourcing: { type: Boolean, default: false }
    },
    
    preparation: {
      freshnessPolicyHours: Number,
      temperatureStandards: [{
        dishType: String,
        servingTemp: String,
        holdingTemp: String,
        maxHoldTime: Number // minutes
      }],
      qualityCheckpoints: [String]
    },
    
    service: {
      presentationStandards: [String],
      serviceTimeStandards: Number, // minutes per table
      qualityAssurance: [String]
    }
  },
  
  feedback: {
    clientRatings: [{
      eventBookingId: {
        type: Schema.Types.ObjectId,
        ref: 'EventBooking'
      },
      overallRating: { type: Number, min: 1, max: 5 },
      foodQuality: { type: Number, min: 1, max: 5 },
      presentation: { type: Number, min: 1, max: 5 },
      service: { type: Number, min: 1, max: 5 },
      valueForMoney: { type: Number, min: 1, max: 5 },
      comments: String,
      wouldReorder: { type: Boolean, default: false },
      date: Date
    }],
    
    averageRatings: {
      overall: { type: Number, default: 0 },
      foodQuality: { type: Number, default: 0 },
      presentation: { type: Number, default: 0 },
      service: { type: Number, default: 0 },
      valueForMoney: { type: Number, default: 0 }
    },
    
    totalOrders: { type: Number, default: 0 },
    repeatOrders: { type: Number, default: 0 }
  },
  
  allergenInformation: {
    containsAllergens: [{
      allergen: {
        type: String,
        enum: ['gluten', 'dairy', 'nuts', 'soy', 'eggs', 'shellfish', 'fish', 'sesame'],
        required: true
      },
      severity: {
        type: String,
        enum: ['trace', 'ingredient', 'major_ingredient'],
        default: 'ingredient'
      },
      affectedItems: [String],
      crossContaminationRisk: { type: Boolean, default: false }
    }],
    
    allergenFreeAlternatives: [{
      allergen: String,
      alternatives: [String],
      additionalCost: Number
    }]
  },
  
  sustainability: {
    sustainabilityRating: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium'
    },
    
    practices: {
      localSourcing: { type: Boolean, default: false },
      organicIngredients: { type: Boolean, default: false },
      seasonalIngredients: { type: Boolean, default: false },
      wasteReduction: { type: Boolean, default: false },
      recyclablePackaging: { type: Boolean, default: false },
      compostableWare: { type: Boolean, default: false }
    },
    
    certifications: [String], // Organic, Fair Trade, etc.
    carbonFootprint: Number,  // kg CO2 equivalent per guest
    wasteGeneration: Number   // kg per guest
  },
  
  media: {
    images: [{
      url: String,
      alt: String,
      caption: String,
      category: {
        type: String,
        enum: ['full_spread', 'individual_dish', 'presentation', 'setup', 'service']
      },
      isPrimary: { type: Boolean, default: false }
    }],
    
    videos: [{
      url: String,
      title: String,
      type: {
        type: String,
        enum: ['preparation', 'presentation', 'service', 'testimonial']
      },
      duration: Number // seconds
    }]
  },
  
  status: {
    type: String,
    enum: ['active', 'inactive', 'seasonal', 'discontinued', 'testing'],
    default: 'active'
  },
  
  availability: {
    isActive: { type: Boolean, default: true },
    seasonal: { type: Boolean, default: false },
    availableFrom: Date,
    availableUntil: Date,
    
    restrictions: {
      minimumGuests: Number,
      maximumGuests: Number,
      advanceNoticeHours: { type: Number, default: 48 },
      blackoutDates: [{
        startDate: Date,
        endDate: Date,
        reason: String
      }]
    }
  },
  
  version: {
    versionNumber: { type: Number, default: 1.0 },
    lastUpdated: Date,
    updateReason: String,
    previousVersions: [{
      version: Number,
      updatedDate: Date,
      changes: String
    }]
  },
  
  tags: [String], // For categorization and search
  
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

EventMenuSchema.pre('save', function() {
  this.updatedAt = new Date();
  
  // Calculate total cost per guest
  if (this.costing?.breakdown) {
    const breakdown = this.costing.breakdown;
    this.costing.breakdown.totalCostPerGuest = 
      (breakdown.foodCost || 0) + 
      (breakdown.beverageCost || 0) + 
      (breakdown.laborCost || 0) + 
      (breakdown.equipmentCost || 0) + 
      (breakdown.overheadCost || 0);
  }
  
  // Calculate profitability
  if (this.costing?.breakdown?.totalCostPerGuest && this.costing?.pricing?.sellingPricePerGuest) {
    const costPerGuest = this.costing.breakdown.totalCostPerGuest;
    const sellingPrice = this.costing.pricing.sellingPricePerGuest;
    
    this.costing.profitability = this.costing.profitability || {};
    this.costing.profitability.grossProfit = sellingPrice - costPerGuest;
    this.costing.profitability.grossMargin = ((sellingPrice - costPerGuest) / sellingPrice) * 100;
  }
  
  // Calculate average ratings
  if (this.feedback?.clientRatings?.length > 0) {
    const ratings = this.feedback.clientRatings;
    const totalRatings = ratings.length;
    
    this.feedback.averageRatings = {
      overall: ratings.reduce((sum: number, rating: any) => sum + (rating.overallRating || 0), 0) / totalRatings,
      foodQuality: ratings.reduce((sum: number, rating: any) => sum + (rating.foodQuality || 0), 0) / totalRatings,
      presentation: ratings.reduce((sum: number, rating: any) => sum + (rating.presentation || 0), 0) / totalRatings,
      service: ratings.reduce((sum: number, rating: any) => sum + (rating.service || 0), 0) / totalRatings,
      valueForMoney: ratings.reduce((sum: number, rating: any) => sum + (rating.valueForMoney || 0), 0) / totalRatings
    };
  }
});

EventMenuSchema.index({ propertyId: 1, menuCode: 1 }, { unique: true });
EventMenuSchema.index({ propertyId: 1, menuType: 1 });
EventMenuSchema.index({ propertyId: 1, 'cuisineStyle.primary': 1 });
EventMenuSchema.index({ 'serviceDetails.guestCapacity.minimum': 1, 'serviceDetails.guestCapacity.maximum': 1 });
EventMenuSchema.index({ 'costing.pricing.sellingPricePerGuest': 1 });
EventMenuSchema.index({ 'feedback.averageRatings.overall': -1 });
EventMenuSchema.index({ tags: 1 });

EventMenuSchema.methods.calculatePriceForGuests = function(guestCount: number, eventDate?: Date) {
  let pricePerGuest = this.costing?.pricing?.sellingPricePerGuest || 0;
  
  // Check tier pricing
  if (this.costing?.pricing?.tierPricing) {
    const tier = this.costing.pricing.tierPricing.find(t =>
      guestCount >= (t.guestRange?.min || 0) && guestCount <= (t.guestRange?.max || Infinity)
    );
    
    if (tier) {
      pricePerGuest = tier.pricePerGuest || pricePerGuest;
    }
  }
  
  // Apply seasonal pricing
  if (eventDate && this.costing?.pricing?.seasonalPricing) {
    const seasonalPricing = this.costing.pricing.seasonalPricing.find(sp =>
      eventDate >= new Date(sp.startDate) && eventDate <= new Date(sp.endDate)
    );
    
    if (seasonalPricing) {
      pricePerGuest *= seasonalPricing.priceMultiplier;
    }
  }
  
  return Math.round(pricePerGuest * guestCount);
};

EventMenuSchema.methods.canAccommodate = function(guestCount: number) {
  return guestCount >= (this.serviceDetails?.guestCapacity?.minimum || 0) &&
         guestCount <= (this.serviceDetails?.guestCapacity?.maximum || Infinity);
};

EventMenuSchema.methods.getMenuForDietaryRestriction = function(dietType: string) {
  return this.specialDietaryMenus?.find(menu => menu.dietType === dietType);
};

EventMenuSchema.methods.addFeedback = function(feedbackData: any) {
  this.feedback = this.feedback || { clientRatings: [] };
  
  this.feedback.clientRatings.push({
    ...feedbackData,
    date: new Date()
  });
  
  this.feedback.totalOrders = (this.feedback.totalOrders || 0) + 1;
  
  return this.save();
};

EventMenuSchema.methods.updateVersion = function(changes: string, updatedBy: string) {
  // Save current version to history
  this.version = this.version || { previousVersions: [] };
  this.version.previousVersions.push({
    version: this.version.versionNumber || 1.0,
    updatedDate: new Date(),
    changes: changes
  });
  
  // Update version
  this.version.versionNumber = (this.version.versionNumber || 1.0) + 0.1;
  this.version.lastUpdated = new Date();
  this.version.updateReason = changes;
  this.lastUpdatedBy = updatedBy;
  
  return this.save();
};

EventMenuSchema.methods.checkAllergenCompatibility = function(allergens: string[]) {
  const incompatibleAllergens: string[] = [];
  
  allergens.forEach(allergen => {
    const allergenInfo = this.allergenInformation?.containsAllergens?.find(a => a.allergen === allergen);
    if (allergenInfo) {
      incompatibleAllergens.push(allergen);
    }
  });
  
  return {
    compatible: incompatibleAllergens.length === 0,
    incompatibleAllergens,
    alternatives: this.allergenInformation?.allergenFreeAlternatives?.filter(alt =>
      incompatibleAllergens.includes(alt.allergen)
    ) || []
  };
};

EventMenuSchema.statics.findByProperty = function(propertyId: string) {
  return this.find({ propertyId, isActive: true }).sort({ menuType: 1, menuName: 1 });
};

EventMenuSchema.statics.findByType = function(propertyId: string, menuType: string) {
  return this.find({ propertyId, menuType, isActive: true }).sort({ menuName: 1 });
};

EventMenuSchema.statics.findByCuisine = function(propertyId: string, cuisine: string) {
  return this.find({
    propertyId,
    'cuisineStyle.primary': cuisine,
    isActive: true
  }).sort({ menuName: 1 });
};

EventMenuSchema.statics.findForGuestCount = function(propertyId: string, guestCount: number) {
  return this.find({
    propertyId,
    isActive: true,
    'serviceDetails.guestCapacity.minimum': { $lte: guestCount },
    'serviceDetails.guestCapacity.maximum': { $gte: guestCount }
  }).sort({ 'feedback.averageRatings.overall': -1 });
};

EventMenuSchema.statics.findByPriceRange = function(propertyId: string, minPrice: number, maxPrice: number) {
  return this.find({
    propertyId,
    isActive: true,
    'costing.pricing.sellingPricePerGuest': { $gte: minPrice, $lte: maxPrice }
  }).sort({ 'costing.pricing.sellingPricePerGuest': 1 });
};

EventMenuSchema.statics.findPopular = function(propertyId: string, limit = 10) {
  return this.find({ propertyId, isActive: true })
    .sort({ 'feedback.totalOrders': -1, 'feedback.averageRatings.overall': -1 })
    .limit(limit);
};

EventMenuSchema.statics.getAnalyticsReport = function(propertyId: string) {
  return this.aggregate([
    { $match: { propertyId, isActive: true } },
    {
      $group: {
        _id: '$menuType',
        totalMenus: { $sum: 1 },
        averagePrice: { $avg: '$costing.pricing.sellingPricePerGuest' },
        averageRating: { $avg: '$feedback.averageRatings.overall' },
        totalOrders: { $sum: '$feedback.totalOrders' },
        averageMargin: { $avg: '$costing.profitability.grossMargin' }
      }
    },
    { $sort: { totalOrders: -1 } }
  ]);
};

const EventMenu = models.EventMenu || model('EventMenu', EventMenuSchema);

export default EventMenu;