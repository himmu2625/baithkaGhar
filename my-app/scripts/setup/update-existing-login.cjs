#!/usr/bin/env node

/**
 * 🔧 Update Existing PropertyLogin Credentials
 * Update the existing admin login and provide additional access methods
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/baithakaGharDB';

// PropertyLogin schema
const PropertyLoginSchema = new mongoose.Schema({
  propertyId: mongoose.Schema.Types.ObjectId,
  username: String,
  passwordHash: String,
  isActive: Boolean,
  failedLoginAttempts: { type: Number, default: 0 },
  accountLocked: { type: Boolean, default: false },
  lastLogin: Date,
  createdAt: Date,
  updatedAt: Date
});

PropertyLoginSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

const PropertyLogin = mongoose.model('PropertyLogin', PropertyLoginSchema);

// Property schema
const PropertySchema = new mongoose.Schema({
  title: String,
  name: String,
  tags: [String]
});

const Property = mongoose.model('Property', PropertySchema);

async function updateExistingLogin() {
  try {
    console.log('🔧 Updating existing PropertyLogin credentials...');

    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find our test property
    const testProperty = await Property.findOne({ tags: "test" });

    if (!testProperty) {
      console.log('❌ No test property found.');
      process.exit(1);
    }

    console.log(`📋 Found test property: ${testProperty._id}`);

    // Find existing admin login for this property
    const existingLogin = await PropertyLogin.findOne({ propertyId: testProperty._id });

    if (existingLogin) {
      console.log(`🔧 Updating existing login: ${existingLogin.username}`);

      // Update password to our known test password
      const newPassword = 'DevTest@123';
      const passwordHash = await bcrypt.hash(newPassword, 12);

      existingLogin.passwordHash = passwordHash;
      existingLogin.isActive = true;
      existingLogin.failedLoginAttempts = 0;
      existingLogin.accountLocked = false;
      existingLogin.updatedAt = new Date();

      await existingLogin.save();
      console.log(`✅ Updated login credentials for: ${existingLogin.username}`);

      // Display final credentials
      console.log('\n🎯 OS LOGIN CREDENTIALS READY!');
      console.log('=' .repeat(60));
      console.log('\n📋 PROPERTY INFORMATION:');
      console.log(`Property ID: ${testProperty._id}`);
      console.log(`Property Name: ${testProperty.name || testProperty.title}`);

      console.log('\n🔐 OS LOGIN CREDENTIALS:');
      console.log('Primary Access:');
      console.log(`  Username: ${existingLogin.username}`);
      console.log('  Password: DevTest@123');
      console.log('  Access: Full system access');

      console.log('\n🔗 LOGIN URL:');
      console.log('OS Login: http://localhost:3001/os/login');

      console.log('\n📊 DIRECT ACCESS URLS:');
      console.log(`Dashboard: http://localhost:3001/os/dashboard/${testProperty._id}`);
      console.log(`Inventory: http://localhost:3001/os/inventory/dashboard/${testProperty._id}`);
      console.log(`F&B: http://localhost:3001/os/fb/dashboard/${testProperty._id}`);

      console.log('\n💡 INSTRUCTIONS:');
      console.log('1. Go to: http://localhost:3001/os/login');
      console.log(`2. Username: ${existingLogin.username}`);
      console.log('3. Password: DevTest@123');
      console.log('4. Click "Sign In to Dashboard"');

      console.log('\n🛡️  SECURITY NOTE:');
      console.log('These are DEVELOPMENT-ONLY credentials.');
      console.log('Do not use in production environments!');

      console.log('\n' + '=' .repeat(60));

    } else {
      console.log('❌ No existing PropertyLogin found for the test property.');
    }

    await mongoose.disconnect();

  } catch (error) {
    console.error('❌ Error updating PropertyLogin credentials:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  updateExistingLogin()
    .then(() => {
      console.log('🎉 PropertyLogin credentials updated successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Failed to update PropertyLogin credentials:', error);
      process.exit(1);
    });
}

module.exports = { updateExistingLogin };