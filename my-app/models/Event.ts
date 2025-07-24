import mongoose, { Schema, Document } from 'mongoose';

export interface IEvent extends Document {
  name: string;
  description?: string;
  startDate: string; // ISO date string
  endDate: string;   // ISO date string
  city: string;
  region: string;
  country: string;
  type: 'holiday' | 'festival' | 'conference' | 'sports' | 'concert' | 'local_event' | 'religious' | 'cultural' | 'custom';
  impact: 'low' | 'medium' | 'high'; // Expected impact on demand
  suggestedPriceMultiplier: number; // Suggested pricing multiplier (e.g., 1.2 = 20% increase)
  isNational: boolean; // Whether it's a national holiday/event
  isRecurring: boolean; // Whether it repeats annually
  source: 'admin' | 'api' | 'import'; // How the event was added
  isActive: boolean;
  tags: string[]; // Additional tags for categorization
  createdAt: Date;
  updatedAt: Date;
}

const EventSchema = new Schema<IEvent>({
  name: { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  startDate: { type: String, required: true },
  endDate: { type: String, required: true },
  city: { type: String, required: true, trim: true },
  region: { type: String, required: true, trim: true },
  country: { type: String, required: true, trim: true, default: 'India' },
  type: { 
    type: String, 
    enum: ['holiday', 'festival', 'conference', 'sports', 'concert', 'local_event', 'religious', 'cultural', 'custom'],
    required: true 
  },
  impact: { 
    type: String, 
    enum: ['low', 'medium', 'high'],
    required: true,
    default: 'medium'
  },
  suggestedPriceMultiplier: { 
    type: Number, 
    required: true, 
    min: 0.5, 
    max: 5.0,
    default: 1.2 
  },
  isNational: { type: Boolean, default: false },
  isRecurring: { type: Boolean, default: false },
  source: { 
    type: String, 
    enum: ['admin', 'api', 'import'],
    default: 'admin'
  },
  isActive: { type: Boolean, default: true },
  tags: [{ type: String, trim: true }]
}, {
  timestamps: true
});

// Index for efficient querying
EventSchema.index({ city: 1, startDate: 1, endDate: 1 });
EventSchema.index({ region: 1, startDate: 1, endDate: 1 });
EventSchema.index({ startDate: 1, endDate: 1, isActive: 1 });

export default mongoose.models.Event || mongoose.model<IEvent>('Event', EventSchema); 