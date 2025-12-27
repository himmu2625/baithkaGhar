import mongoose from "mongoose";
import Event from "../models/Event.js";

const sampleEvents = [
  // National Holidays
  {
    name: "Diwali",
    description:
      "Festival of Lights - One of the most significant Hindu festivals",
    startDate: "2024-11-01",
    endDate: "2024-11-05",
    city: "Mumbai",
    region: "Maharashtra",
    country: "India",
    type: "holiday",
    impact: "high",
    suggestedPriceMultiplier: 1.8,
    isNational: true,
    isRecurring: true,
    source: "import",
    tags: ["festival", "hindu", "lights"],
  },
  {
    name: "Holi",
    description: "Festival of Colors celebrating the arrival of spring",
    startDate: "2024-03-25",
    endDate: "2024-03-26",
    city: "Mumbai",
    region: "Maharashtra",
    country: "India",
    type: "holiday",
    impact: "high",
    suggestedPriceMultiplier: 1.6,
    isNational: true,
    isRecurring: true,
    source: "import",
    tags: ["festival", "colors", "spring"],
  },

  // Mumbai Specific Events
  {
    name: "Mumbai International Film Festival",
    description:
      "Annual international film festival showcasing cinema from around the world",
    startDate: "2024-02-15",
    endDate: "2024-02-22",
    city: "Mumbai",
    region: "Maharashtra",
    country: "India",
    type: "festival",
    impact: "high",
    suggestedPriceMultiplier: 1.5,
    isNational: false,
    isRecurring: true,
    source: "import",
    tags: ["film", "cinema", "international"],
  },
  {
    name: "Ganesh Chaturthi",
    description:
      "11-day festival celebrating Lord Ganesha, very popular in Maharashtra",
    startDate: "2024-09-07",
    endDate: "2024-09-17",
    city: "Mumbai",
    region: "Maharashtra",
    country: "India",
    type: "religious",
    impact: "high",
    suggestedPriceMultiplier: 1.7,
    isNational: false,
    isRecurring: true,
    source: "import",
    tags: ["ganesh", "religious", "procession"],
  },

  // Goa Events
  {
    name: "Goa Carnival",
    description: "Vibrant three-day festival with parades, music, and dance",
    startDate: "2024-02-10",
    endDate: "2024-02-13",
    city: "Panaji",
    region: "Goa",
    country: "India",
    type: "festival",
    impact: "high",
    suggestedPriceMultiplier: 1.9,
    isNational: false,
    isRecurring: true,
    source: "import",
    tags: ["carnival", "parade", "music", "dance"],
  },
  {
    name: "Sunburn Festival",
    description: "Asia's largest electronic dance music festival",
    startDate: "2024-12-27",
    endDate: "2024-12-30",
    city: "Vagator",
    region: "Goa",
    country: "India",
    type: "concert",
    impact: "high",
    suggestedPriceMultiplier: 2.2,
    isNational: false,
    isRecurring: true,
    source: "import",
    tags: ["edm", "electronic", "music", "festival"],
  },

  // Delhi Events
  {
    name: "Delhi Auto Expo",
    description:
      "India's premier automotive exhibition showcasing latest vehicles and technology",
    startDate: "2024-01-12",
    endDate: "2024-01-17",
    city: "New Delhi",
    region: "Delhi",
    country: "India",
    type: "conference",
    impact: "medium",
    suggestedPriceMultiplier: 1.3,
    isNational: false,
    isRecurring: false,
    source: "import",
    tags: ["automotive", "technology", "exhibition"],
  },

  // Bangalore Events
  {
    name: "Bangalore Tech Summit",
    description:
      "Global technology summit bringing together industry leaders and innovators",
    startDate: "2024-11-15",
    endDate: "2024-11-17",
    city: "Bangalore",
    region: "Karnataka",
    country: "India",
    type: "conference",
    impact: "medium",
    suggestedPriceMultiplier: 1.4,
    isNational: false,
    isRecurring: true,
    source: "import",
    tags: ["technology", "summit", "innovation"],
  },

  // Rajasthan Events
  {
    name: "Jaipur Literature Festival",
    description: "World's largest free literary festival",
    startDate: "2024-01-25",
    endDate: "2024-01-29",
    city: "Jaipur",
    region: "Rajasthan",
    country: "India",
    type: "cultural",
    impact: "high",
    suggestedPriceMultiplier: 1.6,
    isNational: false,
    isRecurring: true,
    source: "import",
    tags: ["literature", "books", "authors", "cultural"],
  },
  {
    name: "Desert Festival Jaisalmer",
    description:
      "Three-day cultural extravaganza showcasing Rajasthani folk culture",
    startDate: "2024-02-22",
    endDate: "2024-02-24",
    city: "Jaisalmer",
    region: "Rajasthan",
    country: "India",
    type: "cultural",
    impact: "medium",
    suggestedPriceMultiplier: 1.5,
    isNational: false,
    isRecurring: true,
    source: "import",
    tags: ["desert", "cultural", "folk", "rajasthani"],
  },

  // Kerala Events
  {
    name: "Onam Festival",
    description: "Kerala's harvest festival and state festival",
    startDate: "2024-09-15",
    endDate: "2024-09-16",
    city: "Kochi",
    region: "Kerala",
    country: "India",
    type: "holiday",
    impact: "high",
    suggestedPriceMultiplier: 1.7,
    isNational: false,
    isRecurring: true,
    source: "import",
    tags: ["harvest", "kerala", "traditional"],
  },

  // Sports Events
  {
    name: "Indian Premier League Finals",
    description: "Cricket championship finals",
    startDate: "2024-05-25",
    endDate: "2024-05-27",
    city: "Mumbai",
    region: "Maharashtra",
    country: "India",
    type: "sports",
    impact: "high",
    suggestedPriceMultiplier: 1.8,
    isNational: false,
    isRecurring: false,
    source: "import",
    tags: ["cricket", "ipl", "sports", "championship"],
  },
];

async function seedEvents() {
  try {
    // Connect to MongoDB
    await mongoose.connect(
      process.env.MONGODB_URI || "mongodb://localhost:27017/baithaka-ghar"
    );
    console.log("Connected to MongoDB");

    // Clear existing events (optional - remove this if you want to keep existing events)
    // await Event.deleteMany({ source: 'import' });
    // console.log('Cleared existing imported events');

    // Insert sample events
    const insertedEvents = await Event.insertMany(sampleEvents);
    console.log(
      `✅ Successfully inserted ${insertedEvents.length} sample events`
    );

    // Display summary
    const eventsByType = await Event.aggregate([
      { $match: { source: "import" } },
      { $group: { _id: "$type", count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);

    console.log("\n📊 Events by type:");
    eventsByType.forEach(({ _id, count }) => {
      console.log(`  ${_id}: ${count} events`);
    });

    const eventsByRegion = await Event.aggregate([
      { $match: { source: "import" } },
      { $group: { _id: "$region", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    console.log("\n🌍 Events by region:");
    eventsByRegion.forEach(({ _id, count }) => {
      console.log(`  ${_id}: ${count} events`);
    });

    console.log("\n🎉 Event seeding completed successfully!");
  } catch (error) {
    console.error("❌ Error seeding events:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
  }
}

// Run the seeding function
seedEvents();
