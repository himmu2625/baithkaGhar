import mongoose from 'mongoose';

// Comment out the server-only import for compatibility with Vercel deployment
// import 'server-only';

// Define interface for City document
export interface ICityDocument extends mongoose.Document {
  name: string;
  properties: number;
  image: string;
  isVisible: boolean;
  displayOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

const citySchema = new mongoose.Schema<ICityDocument>({
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
  isVisible: {
    type: Boolean,
    default: true,
  },
  displayOrder: {
    type: Number,
    default: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
  collection: 'cities',
});

// Add unique case-insensitive index for name lookups and text search capability
citySchema.index({ name: 1 }, { unique: true, collation: { locale: 'en', strength: 2 } });

// Delete the model if it exists (for development hot reload)
if (mongoose.models.City) {
  delete mongoose.models.City;
}

// Create and export the model
const City = mongoose.model<ICityDocument>('City', citySchema);

export default City; 