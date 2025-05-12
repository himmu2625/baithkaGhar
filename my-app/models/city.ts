import mongoose from 'mongoose';

// Add this line to indicate this module should not be bundled on the client
import 'server-only';

const citySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'City name is required'],
    unique: true,
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

// Add text index for searching cities by name
citySchema.index({ name: 'text' });

// Add case-insensitive index for name lookups
citySchema.index({ name: 1 }, { collation: { locale: 'en', strength: 2 } });

// Use a function to get the model to avoid issues with Hot Module Replacement
const getModel = () => {
  // Check if the City model already exists to prevent OverwriteModelError
  return mongoose.models.City || mongoose.model('City', citySchema);
};

// Use this pattern to safely export the model
const City = getModel();

export default City; 