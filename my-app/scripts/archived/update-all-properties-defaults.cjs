const { MongoClient } = require('mongodb');

async function updateAllProperties() {
  const uri = process.env.MONGODB_URI || 'mongodb+srv://admin:1bfWvYGmDMSiPUPf@cluster0.jxpwth5.mongodb.net/';
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('Connected to MongoDB');

    const db = client.db('test');
    const propertiesCollection = db.collection('properties');

    // Find all properties with propertyUnits
    const properties = await propertiesCollection.find({
      propertyUnits: { $exists: true, $ne: [] }
    }).toArray();

    console.log(`\nFound ${properties.length} properties with propertyUnits`);

    let updateCount = 0;

    for (const property of properties) {
      console.log(`\n--- Processing: ${property.title} ---`);

      if (!property.propertyUnits || !Array.isArray(property.propertyUnits)) {
        console.log('  Skipping - no propertyUnits array');
        continue;
      }

      let needsUpdate = false;
      const updatedUnits = property.propertyUnits.map(unit => {
        const updated = { ...unit };

        // Set default maxCapacityPerRoom to 4 if not set
        if (!updated.maxCapacityPerRoom || updated.maxCapacityPerRoom === 0) {
          updated.maxCapacityPerRoom = 4;
          needsUpdate = true;
          console.log(`  Updated ${unit.unitTypeName}: maxCapacityPerRoom = 4`);
        }

        // Calculate freeExtraPersonLimit as maxCapacityPerRoom - 2
        const calculatedFreeExtra = Math.max(0, updated.maxCapacityPerRoom - 2);
        if (updated.freeExtraPersonLimit !== calculatedFreeExtra) {
          updated.freeExtraPersonLimit = calculatedFreeExtra;
          needsUpdate = true;
          console.log(`  Updated ${unit.unitTypeName}: freeExtraPersonLimit = ${calculatedFreeExtra} (max ${updated.maxCapacityPerRoom} - 2)`);
        }

        // Set extraPersonCharge to 500 if not set or 0
        if (!updated.extraPersonCharge || updated.extraPersonCharge === 0) {
          updated.extraPersonCharge = 500;
          needsUpdate = true;
          console.log(`  Updated ${unit.unitTypeName}: extraPersonCharge = 500`);
        }

        return updated;
      });

      if (needsUpdate) {
        const result = await propertiesCollection.updateOne(
          { _id: property._id },
          { $set: { propertyUnits: updatedUnits } }
        );

        if (result.modifiedCount > 0) {
          updateCount++;
          console.log(`  ✅ Updated property: ${property.title}`);
        }
      } else {
        console.log(`  ⏭️  No updates needed for: ${property.title}`);
      }
    }

    console.log(`\n✅ Total properties updated: ${updateCount}`);

    // Verify BAITHAKA GHAR HOTEL ROSETUM specifically
    console.log('\n--- Verifying BAITHAKA GHAR HOTEL ROSETUM ---');
    const rosetum = await propertiesCollection.findOne({
      title: /BAITHAKA GHAR HOTEL ROSETUM/i
    });

    if (rosetum && rosetum.propertyUnits) {
      rosetum.propertyUnits.forEach((unit, i) => {
        console.log(`\nUnit ${i + 1}: ${unit.unitTypeName}`);
        console.log(`  maxCapacityPerRoom: ${unit.maxCapacityPerRoom}`);
        console.log(`  freeExtraPersonLimit: ${unit.freeExtraPersonLimit}`);
        console.log(`  extraPersonCharge: ${unit.extraPersonCharge}`);
      });
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
    console.log('\nDatabase connection closed');
  }
}

updateAllProperties();
