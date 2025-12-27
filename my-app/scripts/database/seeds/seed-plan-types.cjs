const mongoose = require('mongoose');

// Define PlanType schema directly in CommonJS
const PlanTypeSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    enum: ['EP', 'CP', 'MAP', 'AP']
  },
  name: { type: String, required: true },
  description: { type: String, required: true },
  inclusions: [{ type: String }],
  sortOrder: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true }
});

const PlanType = mongoose.models.PlanType || mongoose.model('PlanType', PlanTypeSchema);

const planTypes = [
  {
    code: 'EP',
    name: 'Room Only',
    description: 'European Plan - Room accommodation only',
    inclusions: ['Room accommodation', 'Basic amenities'],
    sortOrder: 1
  },
  {
    code: 'CP',
    name: 'Room + Breakfast',
    description: 'Continental Plan - Room with breakfast included',
    inclusions: ['Room accommodation', 'Daily breakfast', 'Basic amenities'],
    sortOrder: 2
  },
  {
    code: 'MAP',
    name: 'Room + Breakfast + 1 Meal',
    description: 'Modified American Plan - Room with breakfast and one main meal',
    inclusions: ['Room accommodation', 'Daily breakfast', 'Lunch or dinner', 'Basic amenities'],
    sortOrder: 3
  },
  {
    code: 'AP',
    name: 'Room + All Meals',
    description: 'American Plan - Room with all meals included',
    inclusions: ['Room accommodation', 'Daily breakfast', 'Lunch', 'Dinner', 'Basic amenities'],
    sortOrder: 4
  }
];

async function seedPlanTypes() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);

    for (const planType of planTypes) {
      await PlanType.findOneAndUpdate(
        { code: planType.code },
        planType,
        { upsert: true, new: true }
      );
      console.log(`✅ Plan type ${planType.code} created/updated`);
    }

    console.log('🎉 Plan types seeded successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding plan types:', error);
    process.exit(1);
  }
}

seedPlanTypes();