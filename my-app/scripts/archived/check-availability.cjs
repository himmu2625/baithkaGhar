const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://admin:1bfWvYGmDMSiPUPf@cluster0.jxpwth5.mongodb.net/';

async function checkAvailability() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✓ Connected to MongoDB');

    const PropertyPricing = mongoose.model('PropertyPricing', new mongoose.Schema({}, { strict: false }));

    const entries = await PropertyPricing.find({
      propertyId: '68543254321ae4322b9b5b31',
      roomCategory: 'king_suite',
      isActive: true
    }).select('planType occupancyType isAvailable price pricingType').sort({ planType: 1, occupancyType: 1 });

    console.log('\n=== King Suite Pricing Entries ===');
    console.log(`Total entries: ${entries.length}\n`);

    entries.forEach(entry => {
      const key = `${entry.planType}-${entry.occupancyType}`;
      const avail = entry.isAvailable === undefined ? 'undefined' : entry.isAvailable;
      console.log(`${key.padEnd(15)} | Price: ₹${String(entry.price).padEnd(6)} | Available: ${avail} | Type: ${entry.pricingType}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkAvailability();
