import mongoose, { Schema, Document } from 'mongoose';

export interface ITravelPick extends Document {
  propertyId: mongoose.Types.ObjectId;
  rank: number;
  score: number;
  metrics: {
    rating: number;
    reviewCount: number;
    bookingCount: number;
    recentBookings: number; // bookings in last 30 days
    revenue: number;
    occupancyRate: number;
  };
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const TravelPickSchema = new Schema<ITravelPick>({
  propertyId: { 
    type: Schema.Types.ObjectId, 
    ref: 'Property', 
    required: true,
    unique: true 
  },
  rank: { 
    type: Number, 
    required: true,
    min: 1,
    max: 5 
  },
  score: { 
    type: Number, 
    required: true,
    default: 0 
  },
  metrics: {
    rating: { type: Number, default: 0 },
    reviewCount: { type: Number, default: 0 },
    bookingCount: { type: Number, default: 0 },
    recentBookings: { type: Number, default: 0 },
    revenue: { type: Number, default: 0 },
    occupancyRate: { type: Number, default: 0 }
  },
  isActive: { 
    type: Boolean, 
    default: true 
  }
}, { 
  timestamps: true,
  indexes: [
    { rank: 1 },
    { score: -1 },
    { isActive: 1 }
  ]
});

// Ensure only 5 active travel picks at a time
TravelPickSchema.pre('save', async function(next) {
  if (this.isActive && this.isNew) {
    const activeCount = await mongoose.model('TravelPick').countDocuments({ isActive: true });
    if (activeCount >= 5) {
      throw new Error('Cannot have more than 5 active travel picks');
    }
  }
  next();
});

const TravelPick = mongoose.models.TravelPick || mongoose.model<ITravelPick>('TravelPick', TravelPickSchema);
export default TravelPick; 