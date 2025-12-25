const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

async function createTestOwner() {
  try {
    const MONGODB_URI = process.env.MONGODB_URI || "mongodb+srv://admin:1bfWvYGmDMSiPUPf@cluster0.jxpwth5.mongodb.net/";

    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Define User schema flexibly
    const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }), 'users');

    // Check if test owner already exists
    const testEmail = 'testowner@baithakaghar.com';
    const existing = await User.findOne({ email: testEmail });

    if (existing) {
      console.log('⚠️  Test owner already exists!');
      console.log('━'.repeat(50));
      console.log('Email:', existing.email);
      console.log('Name:', existing.name);
      console.log('Role:', existing.role);
      console.log('Properties:', existing.ownerProfile?.propertyIds?.length || 0);
      console.log('━'.repeat(50));
      console.log('\n💡 Use these credentials to test OS login:');
      console.log('   Email: testowner@baithakaghar.com');
      console.log('   Password: Test1234');
      console.log('\n🔗 Login at: http://localhost:3000/os/login\n');
      await mongoose.disconnect();
      return;
    }

    // Hash password
    const password = 'Test1234';
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create test owner
    const owner = await User.create({
      name: 'Test Owner',
      email: testEmail,
      phone: '+91 9876543210',
      password: hashedPassword,
      role: 'property_owner',
      isAdmin: false,
      profileComplete: true,
      isSpam: false,
      ownerProfile: {
        propertyIds: [],
        businessName: 'Test Business',
        businessType: 'individual',
        kycStatus: 'pending',
        registeredAt: new Date(),
        address: {
          city: 'Test City',
          state: 'Test State',
          country: 'India'
        }
      },
      createdAt: new Date(),
      updatedAt: new Date()
    });

    console.log('✅ Test owner created successfully!');
    console.log('━'.repeat(50));
    console.log('Name:', owner.name);
    console.log('Email:', owner.email);
    console.log('Phone:', owner.phone);
    console.log('Role:', owner.role);
    console.log('Business:', owner.ownerProfile.businessName);
    console.log('KYC Status:', owner.ownerProfile.kycStatus);
    console.log('━'.repeat(50));
    console.log('\n🎉 Owner account is ready to use!');
    console.log('\n💡 Login credentials:');
    console.log('   Email: testowner@baithakaghar.com');
    console.log('   Password: Test1234');
    console.log('\n📝 Next steps:');
    console.log('   1. Start dev server: npm run dev');
    console.log('   2. Open: http://localhost:3000');
    console.log('   3. Click "Baithaka Ghar OS" in footer');
    console.log('   4. Login with credentials above');
    console.log('\n⚠️  Note: Owner has no properties assigned yet.');
    console.log('   Assign properties via: /admin/owner-logins\n');

    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB\n');

  } catch (error) {
    console.error('❌ Error creating test owner:', error);
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
    }
    process.exit(1);
  }
}

createTestOwner();
