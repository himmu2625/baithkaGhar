#!/usr/bin/env node

// Simple Node.js script to test model schemas
import mongoose from 'mongoose';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Import models
import EventVenue from '../models/EventVenue.ts';
import EventBooking from '../models/EventBooking.ts';
import FBInventory from '../models/FBInventory.ts';
import Recipe from '../models/Recipe.ts';
import MenuItem from '../models/MenuItem.ts';
import Table from '../models/Table.ts';
import Order from '../models/Order.ts';
import MenuModifier from '../models/MenuModifier.ts';

console.log('🚀 Testing Model Schemas...\n');

// Test data
const testPropertyId = new mongoose.Types.ObjectId();
const testUserId = new mongoose.Types.ObjectId();

let testsPassed = 0;
let testsFailed = 0;

function runTest(testName, testFn) {
  try {
    console.log(`Testing: ${testName}`);
    testFn();
    console.log(`✅ ${testName} - PASSED`);
    testsPassed++;
  } catch (error) {
    console.log(`❌ ${testName} - FAILED`);
    console.log(`   Error: ${error.message}`);
    testsFailed++;
  }
  console.log('');
}

// Test EventVenue Model
runTest('EventVenue - Basic Creation', () => {
  const venue = new EventVenue({
    propertyId: testPropertyId,
    name: 'Test Conference Hall',
    description: 'A modern conference hall',
    capacity: {
      seatedCapacity: 100,
      standingCapacity: 150,
      theatreStyle: 120,
      classroomStyle: 80,
      uShapeStyle: 40,
      boardroomStyle: 25
    },
    dimensions: {
      length: 20,
      width: 15,
      height: 4,
      area: 300
    },
    amenities: ['wifi', 'ac', 'projector'],
    equipment: [],
    images: [],
    pricing: {
      basePrice: 5000,
      halfDayPrice: 3000,
      hourlyRate: 500,
      currency: 'INR'
    },
    availability: {
      isActive: true,
      maintenanceSchedule: []
    },
    createdBy: testUserId
  });

  if (!venue.name) throw new Error('Venue name not set');
  if (venue.capacity.seatedCapacity !== 100) throw new Error('Venue capacity not set correctly');
  if (venue.pricing.basePrice !== 5000) throw new Error('Venue pricing not set correctly');
});

runTest('EventVenue - Required Field Validation', () => {
  const venue = new EventVenue({});
  const error = venue.validateSync();
  
  if (!error) throw new Error('Validation should have failed');
  if (!error.errors.propertyId) throw new Error('propertyId validation should fail');
  if (!error.errors.name) throw new Error('name validation should fail');
});

runTest('EventVenue - Methods Exist', () => {
  const venue = new EventVenue({
    propertyId: testPropertyId,
    name: 'Test Venue',
    capacity: { seatedCapacity: 100, standingCapacity: 150, theatreStyle: 120, classroomStyle: 80, uShapeStyle: 40, boardroomStyle: 25 },
    dimensions: { length: 20, width: 15, height: 4, area: 300 },
    pricing: { basePrice: 5000, halfDayPrice: 3000, hourlyRate: 500, currency: 'INR' },
    availability: { isActive: true, maintenanceSchedule: [] },
    createdBy: testUserId
  });

  if (typeof venue.isAvailableOn !== 'function') throw new Error('isAvailableOn method missing');
  if (typeof venue.getCapacityForStyle !== 'function') throw new Error('getCapacityForStyle method missing');
  if (typeof venue.calculatePrice !== 'function') throw new Error('calculatePrice method missing');
});

// Test FBInventory Model
runTest('FBInventory - Basic Creation', () => {
  const inventory = new FBInventory({
    propertyId: 'test-property',
    itemCode: 'RICE001',
    itemName: 'Basmati Rice',
    category: 'dry_goods',
    units: {
      baseUnit: 'kg'
    },
    stockLevels: {
      currentStock: 50,
      minimumStock: 10,
      reorderPoint: 15,
      reorderQuantity: 25
    },
    costingInfo: {
      unitCost: 80
    },
    suppliers: [],
    storageInfo: {},
    createdBy: testUserId
  });

  if (inventory.itemName !== 'Basmati Rice') throw new Error('Item name not set');
  if (inventory.stockLevels.currentStock !== 50) throw new Error('Stock level not set');
  if (inventory.costingInfo.unitCost !== 80) throw new Error('Unit cost not set');
});

runTest('FBInventory - Stock Level Validation', () => {
  const inventory = new FBInventory({
    propertyId: 'test-property',
    itemCode: 'TEST001',
    itemName: 'Test Item',
    category: 'dry_goods',
    units: { baseUnit: 'kg' },
    stockLevels: {
      currentStock: -5, // Should fail validation
      minimumStock: 10,
      reorderPoint: 15,
      reorderQuantity: 25
    },
    costingInfo: { unitCost: 100 },
    createdBy: testUserId
  });

  const error = inventory.validateSync();
  if (!error || !error.errors['stockLevels.currentStock']) {
    throw new Error('Stock level validation should fail for negative values');
  }
});

runTest('FBInventory - Methods Exist', () => {
  const inventory = new FBInventory({
    propertyId: 'test-property',
    itemCode: 'TEST001',
    itemName: 'Test Item',
    category: 'dry_goods',
    units: { baseUnit: 'kg' },
    stockLevels: { currentStock: 50, minimumStock: 10, reorderPoint: 15, reorderQuantity: 25 },
    costingInfo: { unitCost: 100 },
    createdBy: testUserId
  });

  if (typeof inventory.updateStock !== 'function') throw new Error('updateStock method missing');
  if (typeof inventory.addBatch !== 'function') throw new Error('addBatch method missing');
  if (typeof inventory.checkNearExpiry !== 'function') throw new Error('checkNearExpiry method missing');
});

// Test Recipe Model
runTest('Recipe - Basic Creation', () => {
  const recipe = new Recipe({
    propertyId: 'test-property',
    recipeCode: 'RCP001',
    recipeName: 'Butter Chicken',
    recipeType: 'main_course',
    yields: {
      servingSize: 4,
      unit: 'portions'
    },
    ingredients: [
      {
        ingredientName: 'Chicken',
        quantity: 500,
        unit: 'grams',
        costPerUnit: 0.3
      }
    ],
    preparation: {
      prepTime: 30,
      cookTime: 45,
      totalTime: 75,
      steps: [
        {
          stepNumber: 1,
          instruction: 'Marinate chicken pieces'
        }
      ]
    },
    costing: {
      totalIngredientCost: 150,
      totalCostPerServing: 37.5
    },
    createdBy: testUserId
  });

  if (recipe.recipeName !== 'Butter Chicken') throw new Error('Recipe name not set');
  if (recipe.yields.servingSize !== 4) throw new Error('Serving size not set');
  if (recipe.preparation.totalTime !== 75) throw new Error('Total time not set');
});

runTest('Recipe - Methods Exist', () => {
  const recipe = new Recipe({
    propertyId: 'test-property',
    recipeCode: 'TEST001',
    recipeName: 'Test Recipe',
    recipeType: 'main_course',
    yields: { servingSize: 4, unit: 'portions' },
    ingredients: [],
    preparation: { prepTime: 30, cookTime: 45, totalTime: 75, steps: [] },
    costing: { totalIngredientCost: 150, totalCostPerServing: 37.5 },
    createdBy: testUserId
  });

  if (typeof recipe.scaleRecipe !== 'function') throw new Error('scaleRecipe method missing');
  if (typeof recipe.calculateCostForQuantity !== 'function') throw new Error('calculateCostForQuantity method missing');
  if (typeof recipe.updateCosting !== 'function') throw new Error('updateCosting method missing');
});

// Test MenuItem Model
runTest('MenuItem - Basic Creation', () => {
  const menuItem = new MenuItem({
    propertyId: testPropertyId,
    name: 'Butter Chicken',
    description: 'Creamy tomato-based chicken curry',
    categoryId: new mongoose.Types.ObjectId(),
    basePrice: 450,
    preparationTime: 25,
    isAvailable: true,
    createdBy: testUserId
  });

  if (menuItem.name !== 'Butter Chicken') throw new Error('Menu item name not set');
  if (menuItem.basePrice !== 450) throw new Error('Base price not set');
  if (menuItem.isAvailable !== true) throw new Error('Availability not set');
});

// Test Table Model
runTest('Table - Basic Creation', () => {
  const table = new Table({
    propertyId: testPropertyId,
    number: 'T001',
    capacity: 4,
    section: 'Main Dining',
    status: 'available',
    features: ['window_view'],
    isActive: true,
    minimumSpend: 1000,
    settings: {
      allowOnlineReservation: true,
      maxReservationDuration: 120,
      advanceBookingDays: 30,
      requireDeposit: false,
      depositAmount: 0
    },
    createdBy: testUserId
  });

  if (table.number !== 'T001') throw new Error('Table number not set');
  if (table.capacity !== 4) throw new Error('Table capacity not set');
  if (table.status !== 'available') throw new Error('Table status not set');
});

runTest('Table - Methods Exist', () => {
  const table = new Table({
    propertyId: testPropertyId,
    number: 'T001',
    capacity: 4,
    section: 'Main Dining',
    createdBy: testUserId
  });

  if (typeof table.isAvailable !== 'function') throw new Error('isAvailable method missing');
  if (typeof table.canAccommodate !== 'function') throw new Error('canAccommodate method missing');
  if (typeof table.updateStatus !== 'function') throw new Error('updateStatus method missing');
});

// Test Order Model
runTest('Order - Basic Creation', () => {
  const order = new Order({
    propertyId: testPropertyId,
    orderNumber: 'ORD240101001',
    orderType: 'dine_in',
    guestInfo: {
      name: 'John Doe',
      phone: '1234567890'
    },
    items: [{
      itemId: new mongoose.Types.ObjectId(),
      quantity: 2,
      unitPrice: 450,
      modifiers: [],
      subtotal: 900
    }],
    pricing: {
      subtotal: 900,
      tax: 162,
      serviceCharge: 0,
      deliveryFee: 0,
      discount: 0,
      total: 1062
    },
    status: 'pending',
    timestamps: {
      ordered: new Date()
    },
    paymentStatus: 'pending',
    priorityLevel: 'medium',
    source: 'pos',
    createdBy: testUserId
  });

  if (order.orderNumber !== 'ORD240101001') throw new Error('Order number not set');
  if (order.orderType !== 'dine_in') throw new Error('Order type not set');
  if (order.pricing.total !== 1062) throw new Error('Total price not set');
});

runTest('Order - Methods Exist', () => {
  const order = new Order({
    propertyId: testPropertyId,
    orderNumber: 'TEST001',
    orderType: 'dine_in',
    guestInfo: { name: 'Test', phone: '1234567890' },
    items: [],
    pricing: { subtotal: 0, tax: 0, serviceCharge: 0, deliveryFee: 0, discount: 0, total: 0 },
    timestamps: { ordered: new Date() },
    createdBy: testUserId
  });

  if (typeof order.calculateTotal !== 'function') throw new Error('calculateTotal method missing');
  if (typeof order.updateStatus !== 'function') throw new Error('updateStatus method missing');
  if (typeof order.addPayment !== 'function') throw new Error('addPayment method missing');
});

// Test MenuModifier Model
runTest('MenuModifier - Basic Creation', () => {
  const modifier = new MenuModifier({
    propertyId: 'test-property',
    name: 'Spice Level',
    modifierType: 'single_select',
    category: 'spice_level',
    isRequired: true,
    options: [
      {
        name: 'Mild',
        priceAdjustment: 0,
        isDefault: true
      },
      {
        name: 'Hot',
        priceAdjustment: 0
      }
    ],
    createdBy: testUserId
  });

  if (modifier.name !== 'Spice Level') throw new Error('Modifier name not set');
  if (modifier.modifierType !== 'single_select') throw new Error('Modifier type not set');
  if (modifier.options.length !== 2) throw new Error('Options not set correctly');
});

// Test Static Methods
runTest('Static Methods - EventVenue', () => {
  if (typeof EventVenue.findByProperty !== 'function') throw new Error('findByProperty static method missing');
  if (typeof EventVenue.findActiveByProperty !== 'function') throw new Error('findActiveByProperty static method missing');
  if (typeof EventVenue.findByCapacity !== 'function') throw new Error('findByCapacity static method missing');
});

runTest('Static Methods - FBInventory', () => {
  if (typeof FBInventory.findByProperty !== 'function') throw new Error('findByProperty static method missing');
  if (typeof FBInventory.findLowStock !== 'function') throw new Error('findLowStock static method missing');
  if (typeof FBInventory.findNearExpiry !== 'function') throw new Error('findNearExpiry static method missing');
});

runTest('Static Methods - Recipe', () => {
  if (typeof Recipe.findByProperty !== 'function') throw new Error('findByProperty static method missing');
  if (typeof Recipe.findPopular !== 'function') throw new Error('findPopular static method missing');
  if (typeof Recipe.findProfitable !== 'function') throw new Error('findProfitable static method missing');
});

// Test Schema Indexes
runTest('Schema Indexes', () => {
  const venueIndexes = EventVenue.schema.indexes();
  const inventoryIndexes = FBInventory.schema.indexes();
  const recipeIndexes = Recipe.schema.indexes();

  if (venueIndexes.length === 0) throw new Error('EventVenue has no indexes');
  if (inventoryIndexes.length === 0) throw new Error('FBInventory has no indexes');
  if (recipeIndexes.length === 0) throw new Error('Recipe has no indexes');
});

// Print Test Results
console.log('📊 Test Results Summary');
console.log('='.repeat(50));
console.log(`✅ Tests Passed: ${testsPassed}`);
console.log(`❌ Tests Failed: ${testsFailed}`);
console.log(`📈 Total Tests: ${testsPassed + testsFailed}`);

if (testsFailed === 0) {
  console.log('\n🎉 All model schema tests passed!');
  console.log('✨ The database models are properly structured and functional.');
} else {
  console.log('\n⚠️  Some tests failed. Please review the errors above.');
  process.exit(1);
}

console.log('\n🏁 Model schema testing completed.');