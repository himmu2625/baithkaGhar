const mongoose = require('mongoose');

async function enableMealPricing() {
  try {
    const mongoUri = process.env.MONGODB_URI;

    if (!mongoUri) {
      console.error('❌ MONGODB_URI environment variable is not set');
      process.exit(1);
    }

    console.log('Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // Get Property model
    const Property = mongoose.connection.collection('properties');

    // Find the Baithaka Ghar Grandeur de Sanchi property
    const property = await Property.findOne({
      slug: 'baithaka-ghar-grandeur-de-sanchi'
    });

    if (!property) {
      console.log('❌ Property not found');
      process.exit(1);
    }

    console.log('Found property:', property.title);
    console.log('Current mealPricing:', JSON.stringify(property.mealPricing, null, 2));

    // Update meal pricing with enabled meals
    const result = await Property.updateOne(
      { slug: 'baithaka-ghar-grandeur-de-sanchi' },
      {
        $set: {
          'mealPricing.breakfast.enabled': true,
          'mealPricing.breakfast.pricePerPerson': 300,
          'mealPricing.breakfast.description': 'Continental breakfast included',
          'mealPricing.lunchDinner.enabled': true,
          'mealPricing.lunchDinner.pricePerPerson': 500,
          'mealPricing.lunchDinner.description': 'Choose lunch or dinner',
          'mealPricing.allMeals.enabled': true,
          'mealPricing.allMeals.pricePerPerson': 1200,
          'mealPricing.allMeals.description': 'Breakfast, lunch & dinner included'
        }
      }
    );

    console.log('✅ Update result:', result);

    // Verify the update
    const updatedProperty = await Property.findOne({
      slug: 'baithaka-ghar-grandeur-de-sanchi'
    });
    console.log('\nUpdated mealPricing:', JSON.stringify(updatedProperty.mealPricing, null, 2));

    console.log('\n✅ Meal pricing enabled successfully!');
    console.log('Breakfast: ₹300/person');
    console.log('Lunch/Dinner: ₹500/person');
    console.log('All Meals: ₹1200/person');

  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

enableMealPricing();
