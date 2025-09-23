#!/usr/bin/env node

/**
 * 🔐 Property Login Creator for OS Development Testing
 * Creates PropertyLogin credentials for username/password authentication
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/baithakaGharDB';

// PropertyLogin schema
const PropertyLoginSchema = new mongoose.Schema({
  propertyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Property',
    required: true,
    unique: true
  },
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 30
  },
  passwordHash: {
    type: String,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  failedLoginAttempts: {
    type: Number,
    default: 0
  },
  accountLocked: {
    type: Boolean,
    default: false
  },
  lockedUntil: Date,
  lastLoginIp: String,
  lastLoginUserAgent: String,
  loginHistory: [{
    timestamp: { type: Date, required: true },
    ipAddress: { type: String, required: true },
    userAgent: { type: String, required: true },
    success: { type: Boolean, required: true },
    failureReason: String
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Instance methods
PropertyLoginSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

PropertyLoginSchema.methods.isAccountLocked = function() {
  if (!this.accountLocked) return false;
  if (!this.lockedUntil) return false;
  return new Date() < this.lockedUntil;
};

PropertyLoginSchema.methods.addLoginAttempt = function(success, ipAddress, userAgent) {
  this.loginHistory.push({
    timestamp: new Date(),
    ipAddress,
    userAgent,
    success,
    failureReason: success ? undefined : 'Invalid credentials'
  });

  if (!success) {
    this.failedLoginAttempts += 1;
    if (this.failedLoginAttempts >= 5) {
      this.accountLocked = true;
      this.lockedUntil = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
    }
  } else {
    this.failedLoginAttempts = 0;
    this.accountLocked = false;
    this.lockedUntil = undefined;
    this.lastLogin = new Date();
    this.lastLoginIp = ipAddress;
    this.lastLoginUserAgent = userAgent;
  }
};

// Create models
const PropertyLogin = mongoose.model('PropertyLogin', PropertyLoginSchema);

// Simple Property schema for finding our test property
const PropertySchema = new mongoose.Schema({
  title: String,
  name: String,
  tags: [String]
});

const Property = mongoose.model('Property', PropertySchema);

async function createPropertyLogins() {
  try {
    console.log('🔐 Creating PropertyLogin credentials for OS...');

    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find our test property
    const testProperty = await Property.findOne({ tags: "test" });

    if (!testProperty) {
      console.log('❌ No test property found. Please run the mock property setup first.');
      process.exit(1);
    }

    console.log(`📋 Found test property: ${testProperty._id}`);

    // Clear existing PropertyLogin entries for this property AND by username
    await PropertyLogin.deleteMany({ propertyId: testProperty._id });
    await PropertyLogin.deleteMany({ username: { $in: ['admin', 'manager', 'staff'] } });
    console.log('🧹 Cleared existing PropertyLogin credentials');

    // Define test login credentials
    const testLogins = [
      {
        username: 'admin',
        password: 'DevTest@123',
        description: 'Admin User (Full Access)'
      },
      {
        username: 'manager',
        password: 'TestManager@123',
        description: 'Manager User (Limited Access)'
      },
      {
        username: 'staff',
        password: 'DemoStaff@123',
        description: 'Staff User (Basic Access)'
      }
    ];

    // Create PropertyLogin entries using upsert
    console.log('👥 Creating PropertyLogin credentials...');

    for (const login of testLogins) {
      // Hash password
      const passwordHash = await bcrypt.hash(login.password, 12);

      // Use findOneAndUpdate with upsert to avoid duplicate key errors
      await PropertyLogin.findOneAndUpdate(
        { username: login.username },
        {
          propertyId: testProperty._id,
          username: login.username,
          passwordHash: passwordHash,
          isActive: true,
          failedLoginAttempts: 0,
          accountLocked: false,
          loginHistory: [],
          updatedAt: new Date()
        },
        {
          upsert: true,
          new: true
        }
      );

      console.log(`✅ Created/Updated login: ${login.username} - ${login.description}`);
    }

    // Display final credentials
    console.log('\n🎯 OS LOGIN CREDENTIALS CREATED!');
    console.log('=' .repeat(60));
    console.log('\n📋 PROPERTY INFORMATION:');
    console.log(`Property ID: ${testProperty._id}`);
    console.log(`Property Name: ${testProperty.name || testProperty.title}`);

    console.log('\n🔐 OS LOGIN CREDENTIALS:');
    console.log('Admin Access:');
    console.log('  Username: admin');
    console.log('  Password: DevTest@123');
    console.log('  Access: Full system access');

    console.log('\nManager Access:');
    console.log('  Username: manager');
    console.log('  Password: TestManager@123');
    console.log('  Access: Management functions');

    console.log('\nStaff Access:');
    console.log('  Username: staff');
    console.log('  Password: DemoStaff@123');
    console.log('  Access: Basic operations');

    console.log('\n🔗 LOGIN URL:');
    console.log('OS Login: http://localhost:3001/os/login');

    console.log('\n📊 DIRECT ACCESS URLS:');
    console.log(`Dashboard: http://localhost:3001/os/dashboard/${testProperty._id}`);
    console.log(`Inventory: http://localhost:3001/os/inventory/dashboard/${testProperty._id}`);
    console.log(`F&B: http://localhost:3001/os/fb/dashboard/${testProperty._id}`);

    console.log('\n🛡️  SECURITY NOTE:');
    console.log('These are DEVELOPMENT-ONLY credentials.');
    console.log('Do not use in production environments!');

    console.log('\n' + '=' .repeat(60));
    await mongoose.disconnect();

  } catch (error) {
    console.error('❌ Error creating PropertyLogin credentials:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  createPropertyLogins()
    .then(() => {
      console.log('🎉 PropertyLogin credentials created successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Failed to create PropertyLogin credentials:', error);
      process.exit(1);
    });
}

module.exports = { createPropertyLogins };