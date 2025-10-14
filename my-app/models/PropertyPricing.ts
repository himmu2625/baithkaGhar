import mongoose, { Schema, Document } from 'mongoose';

export interface IPropertyPricing extends Document {
  propertyId: string;
  roomCategory: string;
  planType: 'EP' | 'CP' | 'MAP' | 'AP';
  occupancyType: 'SINGLE' | 'DOUBLE' | 'TRIPLE' | 'QUAD';
  pricingType: 'DIRECT' | 'PLAN_BASED' | 'BASE';
  startDate: Date;
  endDate: Date;
  price: number;
  currency: string;
  seasonType?: string;
  reason?: string;
  isActive: boolean;
  isAvailable?: boolean; // NEW: Whether this plan/occupancy combo is available for booking
  createdAt: Date;
  updatedAt: Date;
}

const PropertyPricingSchema = new Schema<IPropertyPricing>({
  propertyId: { type: String, required: true, index: true },
  roomCategory: { type: String, required: true },
  planType: {
    type: String,
    required: true,
    enum: ['EP', 'CP', 'MAP', 'AP']
  },
  occupancyType: {
    type: String,
    required: true,
    enum: ['SINGLE', 'DOUBLE', 'TRIPLE', 'QUAD']
  },
  pricingType: {
    type: String,
    required: true,
    enum: ['DIRECT', 'PLAN_BASED', 'BASE'],
    default: 'PLAN_BASED'
  },
  startDate: { type: Date, required: true, index: true },
  endDate: { type: Date, required: true, index: true },
  price: { type: Number, required: true, min: 0 },
  currency: { type: String, default: 'INR' },
  seasonType: { type: String },
  reason: { type: String },
  isActive: { type: Boolean, default: true },
  isAvailable: { type: Boolean, default: true }, // NEW: Availability toggle
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Compound indexes for efficient queries
PropertyPricingSchema.index({ propertyId: 1, roomCategory: 1, startDate: 1, endDate: 1 });
PropertyPricingSchema.index({ propertyId: 1, planType: 1, occupancyType: 1, pricingType: 1 });
PropertyPricingSchema.index({ startDate: 1, endDate: 1 });
PropertyPricingSchema.index({ propertyId: 1, pricingType: 1 });

// Pre-save middleware to update updatedAt
PropertyPricingSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

export default mongoose.models.PropertyPricing || mongoose.model<IPropertyPricing>('PropertyPricing', PropertyPricingSchema);