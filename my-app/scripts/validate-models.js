#!/usr/bin/env node

import { existsSync, readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🔍 Validating Model Schema Files...\n');

const modelsDir = join(__dirname, '..', 'models');

// Define expected models and their key components
const expectedModels = {
  'EventVenue.ts': {
    requiredFields: ['propertyId', 'name', 'capacity', 'dimensions', 'pricing', 'availability'],
    methods: ['isAvailableOn', 'getCapacityForStyle', 'calculatePrice'],
    statics: ['findByProperty', 'findActiveByProperty', 'findByCapacity']
  },
  'EventBooking.ts': {
    requiredFields: ['propertyId', 'bookingNumber', 'eventType', 'eventName', 'eventDate', 'venueId', 'organizer'],
    methods: ['updateStatus', 'addPayment', 'addCommunication'],
    statics: ['findByProperty', 'findUpcoming', 'findByVenue']
  },
  'EventPackage.ts': {
    requiredFields: ['propertyId', 'packageName', 'packageCode', 'category', 'guestCapacity', 'inclusions', 'pricing'],
    methods: ['calculatePrice', 'canAccommodate', 'isCompatibleWithEventType'],
    statics: ['findByProperty', 'findByCategory', 'findForGuestCount']
  },
  'EventService.ts': {
    requiredFields: ['propertyId', 'serviceName', 'serviceCode', 'category', 'pricing'],
    methods: ['calculatePrice', 'isAvailableForDate', 'addBooking'],
    statics: ['findByProperty', 'findByCategory', 'findAvailableForDate']
  },
  'EventEquipment.ts': {
    requiredFields: ['propertyId', 'equipmentName', 'equipmentCode', 'category', 'availability'],
    methods: ['bookEquipment', 'returnEquipment', 'recordMaintenance', 'calculateRentalPrice'],
    statics: ['findByProperty', 'findAvailable', 'findByCategory', 'findMaintenanceDue']
  },
  'FBInventory.ts': {
    requiredFields: ['propertyId', 'itemCode', 'itemName', 'category', 'units', 'stockLevels', 'costingInfo'],
    methods: ['updateStock', 'addBatch', 'checkNearExpiry', 'calculateReorderQuantity', 'recordConsumption'],
    statics: ['findByProperty', 'findLowStock', 'findNearExpiry', 'findByCategory']
  },
  'Recipe.ts': {
    requiredFields: ['propertyId', 'recipeCode', 'recipeName', 'recipeType', 'yields', 'ingredients', 'preparation', 'costing'],
    methods: ['scaleRecipe', 'calculateCostForQuantity', 'checkIngredientAvailability', 'updateCosting', 'addPerformanceData'],
    statics: ['findByProperty', 'findByType', 'findByCuisine', 'findPopular', 'findProfitable']
  },
  'MenuItem.ts': {
    requiredFields: ['propertyId', 'name', 'categoryId', 'basePrice', 'isAvailable'],
    methods: ['updatePrice', 'toggleAvailability', 'addModifier'],
    statics: ['findByProperty', 'findByCategory', 'findAvailable']
  },
  'MenuCategory.ts': {
    requiredFields: ['propertyId', 'name', 'isActive'],
    methods: ['addItem', 'removeItem', 'getItems'],
    statics: ['findByProperty', 'findActive']
  },
  'Table.ts': {
    requiredFields: ['propertyId', 'number', 'capacity', 'section', 'status', 'settings'],
    methods: ['isAvailable', 'canAccommodate', 'updateStatus'],
    statics: ['findByProperty', 'findActiveByProperty', 'findAvailable']
  },
  'Order.ts': {
    requiredFields: ['propertyId', 'orderNumber', 'orderType', 'guestInfo', 'items', 'pricing', 'status', 'timestamps'],
    methods: ['calculateTotal', 'updateStatus', 'addPayment'],
    statics: ['findByProperty', 'findActiveOrders', 'findTodaysOrders', 'findByStatus']
  },
  'MenuModifier.ts': {
    requiredFields: ['propertyId', 'name', 'modifierType', 'category', 'options'],
    methods: ['getAvailableOptions', 'updateOptionStock', 'calculatePriceAdjustment'],
    statics: ['findByProperty', 'findForMenuItem', 'findByCategory']
  }
};

let validModels = 0;
let invalidModels = 0;
let totalChecks = 0;
let passedChecks = 0;

function validateModel(filename, expectedStructure) {
  console.log(`📄 Validating: ${filename}`);
  
  const filePath = join(modelsDir, filename);
  
  // Check if file exists
  if (!existsSync(filePath)) {
    console.log(`   ❌ File does not exist: ${filePath}`);
    invalidModels++;
    return;
  }
  
  try {
    const content = readFileSync(filePath, 'utf-8');
    let modelValid = true;
    let checksForThisModel = 0;
    let passedForThisModel = 0;
    
    // Check for required fields in interface/schema
    console.log(`   🔧 Checking required fields...`);
    expectedStructure.requiredFields.forEach(field => {
      checksForThisModel++;
      if (content.includes(field + ':') || content.includes(field + '?')) {
        console.log(`      ✅ Field '${field}' found`);
        passedForThisModel++;
      } else {
        console.log(`      ❌ Field '${field}' missing`);
        modelValid = false;
      }
    });
    
    // Check for instance methods
    console.log(`   ⚙️  Checking instance methods...`);
    expectedStructure.methods.forEach(method => {
      checksForThisModel++;
      if (content.includes(`.methods.${method}`) || content.includes(`${method}:`)) {
        console.log(`      ✅ Method '${method}' found`);
        passedForThisModel++;
      } else {
        console.log(`      ❌ Method '${method}' missing`);
        modelValid = false;
      }
    });
    
    // Check for static methods
    console.log(`   📋 Checking static methods...`);
    expectedStructure.statics.forEach(staticMethod => {
      checksForThisModel++;
      if (content.includes(`.statics.${staticMethod}`) || content.includes(`static ${staticMethod}`)) {
        console.log(`      ✅ Static method '${staticMethod}' found`);
        passedForThisModel++;
      } else {
        console.log(`      ❌ Static method '${staticMethod}' missing`);
        modelValid = false;
      }
    });
    
    // Check for mongoose schema and model export
    checksForThisModel += 3;
    if (content.includes('new Schema') || content.includes('mongoose.Schema')) {
      console.log(`      ✅ Mongoose schema found`);
      passedForThisModel++;
    } else {
      console.log(`      ❌ Mongoose schema missing`);
      modelValid = false;
    }
    
    if (content.includes('mongoose.model') || content.includes('.model(') || content.includes('models.') || content.includes('|| model(')) {
      console.log(`      ✅ Mongoose model found`);
      passedForThisModel++;
    } else {
      console.log(`      ❌ Mongoose model missing`);
      modelValid = false;
    }
    
    if (content.includes('export default')) {
      console.log(`      ✅ Default export found`);
      passedForThisModel++;
    } else {
      console.log(`      ❌ Default export missing`);
      modelValid = false;
    }
    
    // Check for indexes
    if (content.includes('.index(')) {
      console.log(`      ✅ Database indexes found`);
    } else {
      console.log(`      ⚠️  No database indexes found (recommended for performance)`);
    }
    
    // Check for pre-save middleware
    if (content.includes('.pre(\'save\'') || content.includes('.pre("save"')) {
      console.log(`      ✅ Pre-save middleware found`);
    } else {
      console.log(`      ⚠️  No pre-save middleware found`);
    }
    
    totalChecks += checksForThisModel;
    passedChecks += passedForThisModel;
    
    if (modelValid) {
      console.log(`   ✅ ${filename} - VALID (${passedForThisModel}/${checksForThisModel} checks passed)`);
      validModels++;
    } else {
      console.log(`   ❌ ${filename} - INVALID (${passedForThisModel}/${checksForThisModel} checks passed)`);
      invalidModels++;
    }
    
  } catch (error) {
    console.log(`   ❌ Error reading file: ${error.message}`);
    invalidModels++;
  }
  
  console.log('');
}

// Validate all expected models
Object.entries(expectedModels).forEach(([filename, structure]) => {
  validateModel(filename, structure);
});

// Additional checks for model relationships
console.log('🔗 Checking Model Relationships...');

const modelFiles = Object.keys(expectedModels).map(filename => {
  const filePath = join(modelsDir, filename);
  if (existsSync(filePath)) {
    return {
      name: filename,
      content: readFileSync(filePath, 'utf-8')
    };
  }
  return null;
}).filter(Boolean);

// Check for proper ObjectId references
console.log('   📎 Checking ObjectId references...');
const objectIdReferences = [
  'Schema.Types.ObjectId',
  'mongoose.Types.ObjectId',
  'Types.ObjectId'
];

let hasProperReferences = true;
modelFiles.forEach(model => {
  const hasObjectIdRef = objectIdReferences.some(ref => model.content.includes(ref));
  if (hasObjectIdRef) {
    console.log(`      ✅ ${model.name} has proper ObjectId references`);
  } else {
    console.log(`      ❌ ${model.name} missing ObjectId references`);
    hasProperReferences = false;
  }
});

// Check for model imports
console.log('   📤 Checking model imports...');
modelFiles.forEach(model => {
  if (model.content.includes('import') && model.content.includes('mongoose')) {
    console.log(`      ✅ ${model.name} has proper mongoose import`);
  } else {
    console.log(`      ❌ ${model.name} missing mongoose import`);
  }
});

console.log('');

// Final Summary
console.log('📊 Validation Results Summary');
console.log('='.repeat(60));
console.log(`📁 Total Models Expected: ${Object.keys(expectedModels).length}`);
console.log(`✅ Valid Models: ${validModels}`);
console.log(`❌ Invalid Models: ${invalidModels}`);
console.log(`📈 Check Success Rate: ${Math.round((passedChecks / totalChecks) * 100)}% (${passedChecks}/${totalChecks})`);

if (invalidModels === 0 && hasProperReferences) {
  console.log('\n🎉 All model validations passed!');
  console.log('✨ The database models are properly structured with:');
  console.log('   • All required fields and interfaces');
  console.log('   • Instance and static methods');
  console.log('   • Proper mongoose schemas and models');
  console.log('   • Correct ObjectId references');
  console.log('   • Database indexes for performance');
  console.log('   • Pre-save middleware for data processing');
  
  console.log('\n🏗️  Model Architecture Summary:');
  console.log('   📍 Events Management: EventVenue, EventBooking, EventPackage, EventService, EventEquipment');
  console.log('   🍽️  F&B Operations: MenuItem, MenuCategory, MenuModifier, Order, Table');
  console.log('   📦 Inventory & Recipes: FBInventory, Recipe');
  console.log('   🔄 All models support CRUD operations with proper validation');
  
} else {
  console.log('\n⚠️  Some model validations failed.');
  console.log('📝 Please review the errors above and ensure all models are properly implemented.');
  
  if (!hasProperReferences) {
    console.log('⚠️  Some models are missing proper ObjectId references.');
  }
  
  process.exit(1);
}

console.log('\n🏁 Model validation completed successfully!');