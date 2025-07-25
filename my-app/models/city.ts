import mongoose from 'mongoose';

// Comment out the server-only import for compatibility with Vercel deployment
// import 'server-only';

const citySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'City name is required'],
    trim: true,
  },
  properties: {
    type: Number,
    default: 0,
  },
  image: {
    type: String,
    default: '/placeholder.svg',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Add unique case-insensitive index for name lookups and text search capability
citySchema.index({ name: 1 }, { unique: true, collation: { locale: 'en', strength: 2 } });

// Use a function to get the model to avoid issues with Hot Module Replacement
const getModel = () => {
  // Check if the City model already exists to prevent OverwriteModelError
  return mongoose.models.City || mongoose.model('City', citySchema);
};

// Use this pattern to safely export the model
const City = getModel();

export default City; 