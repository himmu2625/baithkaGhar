#!/usr/bin/env node

/**
 * 🔍 Check Existing Property Logins
 * Check what PropertyLogin credentials already exist
 */

const mongoose = require('mongoose');

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/baithakaGharDB';

// Simple schemas
const PropertyLoginSchema = new mongoose.Schema({
  propertyId: mongoose.Schema.Types.ObjectId,
  username: String,
  passwordHash: String,
  isActive: Boolean,
  createdAt: Date
});

const PropertySchema = new mongoose.Schema({
  title: String,
  name: String,
  tags: [String]
});

const PropertyLogin = mongoose.model('PropertyLogin', PropertyLoginSchema);
const Property = mongoose.model('Property', PropertySchema);

async function checkExistingLogins() {
  try {
    console.log('🔍 Checking existing PropertyLogin credentials...');

    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find all PropertyLogins
    const propertyLogins = await PropertyLogin.find({}).populate('propertyId');

    console.log(`\n📋 Found ${propertyLogins.length} PropertyLogin entries:`);

    for (let i = 0; i < propertyLogins.length; i++) {
      const login = propertyLogins[i];
      console.log(`${i + 1}. Username: ${login.username}`);
      console.log(`   Property ID: ${login.propertyId}`);
      console.log(`   Active: ${login.isActive}`);
      console.log(`   Created: ${login.createdAt}`);
      console.log('');
    }

    // Find test properties
    const testProperties = await Property.find({ tags: "test" });
    console.log(`\n🧪 Found ${testProperties.length} test properties:`);

    for (let i = 0; i < testProperties.length; i++) {
      const prop = testProperties[i];
      console.log(`${i + 1}. Property ID: ${prop._id}`);
      console.log(`   Name: ${prop.name || prop.title}`);
      console.log(`   Tags: ${prop.tags?.join(', ')}`);
      console.log('');
    }

    await mongoose.disconnect();

  } catch (error) {
    console.error('❌ Error checking logins:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  checkExistingLogins()
    .then(() => {
      console.log('🎉 Check completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Check failed:', error);
      process.exit(1);
    });
}

module.exports = { checkExistingLogins };