import mongoose, { Schema, Document } from 'mongoose';

export interface IPropertyAmenity extends Document {
  propertyId: mongoose.Types.ObjectId;
  amenityName: string;
  amenityType: 'basic' | 'premium' | 'luxury' | 'accessibility' | 'business' | 'recreation' | 'safety';
  category: 'room' | 'property' | 'location' | 'service' | 'policy';
  description?: string;
  isAvailable: boolean;
  hasAdditionalCost: boolean;
  additionalCost?: number;
  costType?: 'per_use' | 'per_day' | 'per_stay' | 'per_person';
  icon?: string;
  displayOrder: number;
  isHighlight: boolean; // For highlighting important amenities
  verificationRequired: boolean; // For amenities that need verification
  verificationStatus: 'pending' | 'verified' | 'rejected';
  verificationDate?: Date;
  verificationNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const PropertyAmenitySchema = new Schema<IPropertyAmenity>({
  propertyId: { 
    type: Schema.Types.ObjectId, 
    ref: 'Property', 
    required: true 
  },
  amenityName: { 
    type: String, 
    required: true, 
    trim: true 
  },
  amenityType: { 
    type: String, 
    enum: ['basic', 'premium', 'luxury', 'accessibility', 'business', 'recreation', 'safety'],
    required: true 
  },
  category: { 
    type: String, 
    enum: ['room', 'property', 'location', 'service', 'policy'],
    required: true 
  },
  description: { 
    type: String, 
    trim: true 
  },
  isAvailable: { 
    type: Boolean, 
    default: true 
  },
  hasAdditionalCost: { 
    type: Boolean, 
    default: false 
  },
  additionalCost: { 
    type: Number, 
    min: 0 
  },
  costType: { 
    type: String, 
    enum: ['per_use', 'per_day', 'per_stay', 'per_person'] 
  },
  icon: { 
    type: String 
  },
  displayOrder: { 
    type: Number, 
    default: 0 
  },
  isHighlight: { 
    type: Boolean, 
    default: false 
  },
  verificationRequired: { 
    type: Boolean, 
    default: false 
  },
  verificationStatus: { 
    type: String, 
    enum: ['pending', 'verified', 'rejected'],
    default: 'pending' 
  },
  verificationDate: { 
    type: Date 
  },
  verificationNotes: { 
    type: String 
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better performance
PropertyAmenitySchema.index({ propertyId: 1 });
PropertyAmenitySchema.index({ amenityType: 1 });
PropertyAmenitySchema.index({ category: 1 });
PropertyAmenitySchema.index({ isAvailable: 1 });
PropertyAmenitySchema.index({ isHighlight: 1 });
PropertyAmenitySchema.index({ verificationStatus: 1 });

// Compound indexes
PropertyAmenitySchema.index({ propertyId: 1, category: 1 });
PropertyAmenitySchema.index({ propertyId: 1, amenityType: 1 });
PropertyAmenitySchema.index({ propertyId: 1, isHighlight: 1 });

// Validation: Additional cost should be provided if hasAdditionalCost is true
PropertyAmenitySchema.pre('save', function(next) {
  if (this.hasAdditionalCost && (this.additionalCost === undefined || this.additionalCost === null)) {
    const error = new Error('Additional cost must be provided when hasAdditionalCost is true');
    return next(error);
  }
  
  if (this.hasAdditionalCost && !this.costType) {
    const error = new Error('Cost type must be provided when hasAdditionalCost is true');
    return next(error);
  }
  
  next();
});

// Static method to get amenities by category for a property
PropertyAmenitySchema.statics.getByCategory = function(propertyId: string, category: string) {
  return this.find({ 
    propertyId, 
    category, 
    isAvailable: true 
  }).sort({ displayOrder: 1 });
};

// Static method to get highlight amenities for a property
PropertyAmenitySchema.statics.getHighlights = function(propertyId: string) {
  return this.find({ 
    propertyId, 
    isHighlight: true, 
    isAvailable: true 
  }).sort({ displayOrder: 1 }).limit(6);
};

export default mongoose.models.PropertyAmenity || mongoose.model<IPropertyAmenity>('PropertyAmenity', PropertyAmenitySchema);