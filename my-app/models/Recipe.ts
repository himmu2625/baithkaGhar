import { Schema, model, models } from 'mongoose';

const RecipeSchema = new Schema({
  propertyId: {
    type: String,
    required: true,
    ref: 'Property'
  },
  
  recipeCode: {
    type: String,
    required: true,
    trim: true,
    uppercase: true
  },
  
  recipeName: {
    type: String,
    required: true,
    trim: true
  },
  
  description: {
    type: String,
    trim: true
  },
  
  recipeType: {
    type: String,
    enum: ['appetizer', 'main_course', 'dessert', 'beverage', 'sauce', 'base_preparation', 'component'],
    required: true
  },
  
  cuisine: {
    type: String,
    enum: ['indian', 'chinese', 'italian', 'continental', 'mexican', 'thai', 'mediterranean', 'fusion', 'other']
  },
  
  linkedMenuItem: {
    type: Schema.Types.ObjectId,
    ref: 'MenuItem'
  },
  
  yields: {
    servingSize: {
      type: Number,
      required: true,
      min: 1
    },
    unit: {
      type: String,
      required: true // 'portions', 'liters', 'kg', etc.
    },
    portionWeight: String, // "250g", "300ml"
    scalable: { type: Boolean, default: true }
  },
  
  ingredients: [{
    inventoryItemId: {
      type: Schema.Types.ObjectId,
      ref: 'FBInventory'
    },
    ingredientName: {
      type: String,
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 0
    },
    unit: {
      type: String,
      required: true
    },
    costPerUnit: Number,
    totalCost: Number,
    
    preparationNotes: String,
    isOptional: { type: Boolean, default: false },
    canSubstitute: { type: Boolean, default: false },
    substitutes: [{
      ingredientName: String,
      quantity: Number,
      unit: String,
      notes: String
    }],
    
    quality: {
      grade: String, // 'premium', 'standard', 'basic'
      freshness: String,
      specifications: String
    }
  }],
  
  preparation: {
    prepTime: { type: Number, required: true }, // minutes
    cookTime: { type: Number, required: true }, // minutes
    totalTime: { type: Number, required: true }, // minutes
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard', 'expert'],
      default: 'medium'
    },
    
    equipment: [{
      equipmentName: String,
      isEssential: { type: Boolean, default: true },
      alternatives: [String]
    }],
    
    steps: [{
      stepNumber: {
        type: Number,
        required: true
      },
      instruction: {
        type: String,
        required: true
      },
      duration: Number, // minutes
      temperature: String,
      technique: String,
      criticalPoint: { type: Boolean, default: false },
      notes: String,
      images: [String] // URLs to step images
    }],
    
    techniques: [String], // 'sautéing', 'grilling', 'braising', etc.
    
    qualityChecks: [{
      checkPoint: String,
      expectedResult: String,
      troubleshooting: String
    }]
  },
  
  nutritionalInfo: {
    caloriesPerServing: Number,
    macronutrients: {
      protein: Number, // grams
      carbohydrates: Number, // grams
      fat: Number, // grams
      fiber: Number, // grams
      sugar: Number // grams
    },
    micronutrients: [{
      nutrient: String,
      amount: Number,
      unit: String
    }],
    allergens: [{
      type: String,
      enum: ['gluten', 'dairy', 'nuts', 'soy', 'eggs', 'shellfish', 'fish', 'sesame']
    }]
  },
  
  dietary: {
    vegetarian: { type: Boolean, default: false },
    vegan: { type: Boolean, default: false },
    glutenFree: { type: Boolean, default: false },
    dairyFree: { type: Boolean, default: false },
    nutFree: { type: Boolean, default: false },
    keto: { type: Boolean, default: false },
    lowCarb: { type: Boolean, default: false },
    halal: { type: Boolean, default: false },
    kosher: { type: Boolean, default: false }
  },
  
  costing: {
    totalIngredientCost: {
      type: Number,
      required: true,
      min: 0
    },
    laborCost: {
      type: Number,
      default: 0
    },
    overheadCost: {
      type: Number,
      default: 0
    },
    totalCostPerServing: {
      type: Number,
      required: true
    },
    currency: {
      type: String,
      default: 'INR'
    },
    
    costBreakdown: [{
      category: String, // 'protein', 'vegetables', 'spices', etc.
      percentage: Number,
      amount: Number
    }],
    
    profitMargin: {
      targetMargin: Number, // percentage
      suggestedSellingPrice: Number
    },
    
    lastCostUpdate: Date
  },
  
  standardization: {
    version: {
      type: Number,
      default: 1.0
    },
    lastRevised: Date,
    revisedBy: {
      type: Schema.Types.ObjectId,
      ref: 'StaffMember'
    },
    
    consistency: {
      portionConsistency: {
        type: String,
        enum: ['excellent', 'good', 'needs_improvement'],
        default: 'good'
      },
      tasteConsistency: {
        type: String,
        enum: ['excellent', 'good', 'needs_improvement'],
        default: 'good'
      },
      presentationConsistency: {
        type: String,
        enum: ['excellent', 'good', 'needs_improvement'],
        default: 'good'
      }
    },
    
    variations: [{
      variationName: String,
      description: String,
      ingredientChanges: [String],
      preparationChanges: [String],
      costImpact: Number
    }]
  },
  
  qualityControl: {
    criticalControlPoints: [{
      point: String,
      temperature: {
        min: Number,
        max: Number
      },
      time: {
        min: Number,
        max: Number
      },
      visualCues: String,
      correctiveAction: String
    }],
    
    presentation: {
      platingInstructions: String,
      garnish: String,
      servingTemperature: String,
      servingVessel: String,
      portionGuidelines: String
    },
    
    shelfLife: {
      preparedShelfLife: Number, // hours
      componentShelfLife: Number, // hours for prepared components
      storageInstructions: String,
      reheatingInstructions: String
    }
  },
  
  performance: {
    popularityScore: { type: Number, default: 0 },
    totalOrdersUsing: { type: Number, default: 0 },
    averageRating: { type: Number, min: 0, max: 5, default: 0 },
    profitabilityScore: { type: Number, default: 0 },
    
    analytics: {
      averagePrepTime: Number,
      wastageRate: { type: Number, default: 0 }, // percentage
      customerSatisfaction: { type: Number, default: 0 },
      returnRate: { type: Number, default: 0 },
      
      seasonalTrends: [{
        month: Number,
        orderCount: Number,
        profitMargin: Number
      }]
    }
  },
  
  training: {
    skillLevel: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced', 'expert'],
      default: 'intermediate'
    },
    requiredCertifications: [String],
    trainingNotes: String,
    
    staffAssignments: [{
      staffId: {
        type: Schema.Types.ObjectId,
        ref: 'StaffMember'
      },
      competencyLevel: {
        type: String,
        enum: ['learning', 'competent', 'expert'],
        default: 'learning'
      },
      lastTrained: Date,
      nextTraining: Date
    }]
  },
  
  images: [{
    url: String,
    alt: String,
    type: {
      type: String,
      enum: ['final_product', 'step_by_step', 'ingredient_prep', 'plating']
    },
    isPrimary: { type: Boolean, default: false }
  }],
  
  videos: [{
    url: String,
    title: String,
    type: {
      type: String,
      enum: ['complete_recipe', 'technique_demo', 'plating_guide']
    },
    duration: Number // seconds
  }],
  
  notes: {
    chefNotes: String,
    historicalNotes: String,
    customerFeedback: String,
    improvementSuggestions: String
  },
  
  status: {
    type: String,
    enum: ['active', 'inactive', 'testing', 'discontinued', 'seasonal'],
    default: 'active'
  },
  
  tags: [{
    type: String,
    trim: true // e.g., 'signature_dish', 'seasonal', 'chef_special', 'quick_prep'
  }],
  
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

RecipeSchema.pre('save', function() {
  this.updatedAt = new Date();
  
  // Calculate total ingredient cost
  let totalCost = 0;
  if (this.ingredients) {
    this.ingredients.forEach(ingredient => {
      ingredient.totalCost = (ingredient.quantity || 0) * (ingredient.costPerUnit || 0);
      totalCost += ingredient.totalCost;
    });
  }
  
  // Initialize costing if it doesn't exist
  if (!this.costing) {
    this.costing = {} as any;
  }
  
  // Set costing values
  (this as any).costing.totalIngredientCost = totalCost;
  (this as any).costing.totalCostPerServing = (totalCost + (this.costing?.laborCost || 0) + (this.costing?.overheadCost || 0)) / (this.yields?.servingSize || 1);
  
  // Initialize preparation if it doesn't exist
  if (!this.preparation) {
    this.preparation = {} as any;
  }
  
  // Update total time
  (this as any).preparation.totalTime = (this.preparation?.prepTime || 0) + (this.preparation?.cookTime || 0);
  
  // Calculate profitability score
  if (this.performance && this.costing) {
    const avgSellingPrice = this.costing.profitMargin?.suggestedSellingPrice || 0;
    const profit = avgSellingPrice - this.costing.totalCostPerServing;
    this.performance.profitabilityScore = avgSellingPrice > 0 ? (profit / avgSellingPrice) * 100 : 0;
  }
});

RecipeSchema.index({ propertyId: 1, recipeCode: 1 }, { unique: true });
RecipeSchema.index({ propertyId: 1, recipeType: 1 });
RecipeSchema.index({ linkedMenuItem: 1 });
RecipeSchema.index({ status: 1 });
RecipeSchema.index({ 'performance.popularityScore': -1 });
RecipeSchema.index({ tags: 1 });

RecipeSchema.methods.scaleRecipe = function(newServingSize: number) {
  const scaleFactor = newServingSize / this.yields.servingSize;
  
  const scaledRecipe = this.toObject();
  scaledRecipe.yields.servingSize = newServingSize;
  
  // Scale ingredients
  if (scaledRecipe.ingredients) {
    scaledRecipe.ingredients.forEach((ingredient: any) => {
      ingredient.quantity = ingredient.quantity * scaleFactor;
      ingredient.totalCost = ingredient.totalCost * scaleFactor;
    });
  }
  
  // Scale costing
  scaledRecipe.costing.totalIngredientCost = this.costing.totalIngredientCost * scaleFactor;
  
  return scaledRecipe;
};

RecipeSchema.methods.calculateCostForQuantity = function(quantity: number) {
  const costPerServing = this.costing.totalCostPerServing;
  return costPerServing * quantity;
};

RecipeSchema.methods.checkIngredientAvailability = function() {
  // This would check against inventory
  // Returns array of ingredients that are low/out of stock
  const unavailableIngredients: any[] = [];
  
  // Implementation would query FBInventory for each ingredient
  // For now, return empty array
  return unavailableIngredients;
};

RecipeSchema.methods.updateCosting = function() {
  // This would fetch current prices from inventory
  // and update the recipe costing
  this.costing.lastCostUpdate = new Date();
  return this.save();
};

RecipeSchema.methods.addPerformanceData = function(ordersUsing: number, rating?: number) {
  this.performance.totalOrdersUsing += ordersUsing;
  
  if (rating) {
    const currentRatingTotal = this.performance.averageRating * this.performance.totalOrdersUsing;
    this.performance.averageRating = (currentRatingTotal + rating) / (this.performance.totalOrdersUsing + 1);
  }
  
  // Update popularity score based on orders and rating
  this.performance.popularityScore = (this.performance.totalOrdersUsing * 0.7) + (this.performance.averageRating * 20);
  
  return this.save();
};

RecipeSchema.methods.addVariation = function(variationData: any) {
  this.standardization = this.standardization || { variations: [] };
  this.standardization.variations.push(variationData);
  return this.save();
};

RecipeSchema.statics.findByProperty = function(propertyId: string) {
  return this.find({ propertyId, isActive: true }).sort({ recipeName: 1 });
};

RecipeSchema.statics.findByType = function(propertyId: string, recipeType: string) {
  return this.find({ propertyId, recipeType, isActive: true }).sort({ recipeName: 1 });
};

RecipeSchema.statics.findByCuisine = function(propertyId: string, cuisine: string) {
  return this.find({ propertyId, cuisine, isActive: true }).sort({ recipeName: 1 });
};

RecipeSchema.statics.findPopular = function(propertyId: string, limit = 10) {
  return this.find({ propertyId, isActive: true })
    .sort({ 'performance.popularityScore': -1 })
    .limit(limit);
};

RecipeSchema.statics.findProfitable = function(propertyId: string, limit = 10) {
  return this.find({ propertyId, isActive: true })
    .sort({ 'performance.profitabilityScore': -1 })
    .limit(limit);
};

RecipeSchema.statics.findByIngredient = function(ingredientId: string) {
  return this.find({ 
    'ingredients.inventoryItemId': ingredientId,
    isActive: true 
  }).sort({ recipeName: 1 });
};

RecipeSchema.statics.getCostAnalysis = function(propertyId: string) {
  return this.aggregate([
    { $match: { propertyId, isActive: true } },
    {
      $group: {
        _id: '$recipeType',
        averageCost: { $avg: '$costing.totalCostPerServing' },
        totalRecipes: { $sum: 1 },
        averageProfitability: { $avg: '$performance.profitabilityScore' }
      }
    },
    { $sort: { averageCost: -1 } }
  ]);
};

const Recipe = models.Recipe || model('Recipe', RecipeSchema);

export default Recipe;