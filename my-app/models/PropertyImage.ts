import mongoose, { Schema, Document } from 'mongoose';

export interface IPropertyImage extends Document {
  propertyId: mongoose.Types.ObjectId;
  imageUrl: string;
  publicId: string; // Cloudinary public ID
  imageType: 'exterior' | 'interior' | 'room' | 'bathroom' | 'kitchen' | 'amenity' | 'view' | 'common_area' | 'other';
  roomType?: string; // For room-specific images
  roomNumber?: string; // For specific room images
  category: string; // Additional categorization
  title?: string;
  description?: string;
  altText?: string; // For accessibility
  isPrimary: boolean; // Main display image
  isActive: boolean;
  displayOrder: number;
  uploadedBy: mongoose.Types.ObjectId; // User who uploaded
  fileSize: number; // In bytes
  dimensions: {
    width: number;
    height: number;
  };
  format: string; // jpg, png, webp, etc.
  quality: 'thumbnail' | 'medium' | 'high' | 'original';
  compressionApplied: boolean;
  watermarkApplied: boolean;
  moderationStatus: 'pending' | 'approved' | 'rejected';
  moderationNotes?: string;
  moderatedBy?: mongoose.Types.ObjectId;
  moderatedAt?: Date;
  viewCount: number;
  tags: string[]; // Searchable tags
  metadata: {
    camera?: string;
    location?: string;
    timestamp?: Date;
    photographer?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const PropertyImageSchema = new Schema<IPropertyImage>({
  propertyId: { 
    type: Schema.Types.ObjectId, 
    ref: 'Property', 
    required: true 
  },
  imageUrl: { 
    type: String, 
    required: true 
  },
  publicId: { 
    type: String, 
    required: true 
  },
  imageType: { 
    type: String, 
    enum: ['exterior', 'interior', 'room', 'bathroom', 'kitchen', 'amenity', 'view', 'common_area', 'other'],
    required: true 
  },
  roomType: { 
    type: String 
  },
  roomNumber: { 
    type: String 
  },
  category: { 
    type: String, 
    required: true 
  },
  title: { 
    type: String, 
    trim: true 
  },
  description: { 
    type: String, 
    trim: true 
  },
  altText: { 
    type: String, 
    trim: true 
  },
  isPrimary: { 
    type: Boolean, 
    default: false 
  },
  isActive: { 
    type: Boolean, 
    default: true 
  },
  displayOrder: { 
    type: Number, 
    default: 0 
  },
  uploadedBy: { 
    type: Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  fileSize: { 
    type: Number, 
    required: true,
    min: 0 
  },
  dimensions: {
    width: { type: Number, required: true, min: 1 },
    height: { type: Number, required: true, min: 1 }
  },
  format: { 
    type: String, 
    required: true,
    lowercase: true 
  },
  quality: { 
    type: String, 
    enum: ['thumbnail', 'medium', 'high', 'original'],
    default: 'high' 
  },
  compressionApplied: { 
    type: Boolean, 
    default: false 
  },
  watermarkApplied: { 
    type: Boolean, 
    default: false 
  },
  moderationStatus: { 
    type: String, 
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending' 
  },
  moderationNotes: { 
    type: String 
  },
  moderatedBy: { 
    type: Schema.Types.ObjectId, 
    ref: 'User' 
  },
  moderatedAt: { 
    type: Date 
  },
  viewCount: { 
    type: Number, 
    default: 0,
    min: 0 
  },
  tags: [{ 
    type: String, 
    trim: true,
    lowercase: true 
  }],
  metadata: {
    camera: { type: String },
    location: { type: String },
    timestamp: { type: Date },
    photographer: { type: String }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better performance
PropertyImageSchema.index({ propertyId: 1 });
PropertyImageSchema.index({ imageType: 1 });
PropertyImageSchema.index({ isPrimary: 1 });
PropertyImageSchema.index({ isActive: 1 });
PropertyImageSchema.index({ moderationStatus: 1 });
PropertyImageSchema.index({ uploadedBy: 1 });
PropertyImageSchema.index({ tags: 1 });

// Compound indexes
PropertyImageSchema.index({ propertyId: 1, imageType: 1 });
PropertyImageSchema.index({ propertyId: 1, isPrimary: 1 });
PropertyImageSchema.index({ propertyId: 1, isActive: 1, displayOrder: 1 });
PropertyImageSchema.index({ propertyId: 1, moderationStatus: 1 });

// Text index for searching
PropertyImageSchema.index({ 
  title: 'text', 
  description: 'text', 
  tags: 'text',
  category: 'text'
});

// Ensure only one primary image per property per image type
PropertyImageSchema.pre('save', async function(next) {
  if (this.isPrimary && this.isModified('isPrimary')) {
    // Remove primary status from other images of the same type for this property
    await mongoose.model('PropertyImage').updateMany(
      { 
        propertyId: this.propertyId, 
        imageType: this.imageType,
        _id: { $ne: this._id } 
      },
      { isPrimary: false }
    );
  }
  next();
});

// Virtual for image URL with transformations
PropertyImageSchema.virtual('thumbnailUrl').get(function() {
  if (this.publicId) {
    return `https://res.cloudinary.com/your-cloud-name/image/upload/c_thumb,w_200,h_150/${this.publicId}`;
  }
  return this.imageUrl;
});

PropertyImageSchema.virtual('mediumUrl').get(function() {
  if (this.publicId) {
    return `https://res.cloudinary.com/your-cloud-name/image/upload/c_scale,w_800/${this.publicId}`;
  }
  return this.imageUrl;
});

// Static methods
PropertyImageSchema.statics.getPrimaryImages = function(propertyId: string) {
  return this.find({ 
    propertyId, 
    isPrimary: true, 
    isActive: true,
    moderationStatus: 'approved' 
  }).sort({ imageType: 1 });
};

PropertyImageSchema.statics.getImagesByType = function(propertyId: string, imageType: string) {
  return this.find({ 
    propertyId, 
    imageType, 
    isActive: true,
    moderationStatus: 'approved' 
  }).sort({ displayOrder: 1 });
};

PropertyImageSchema.statics.incrementViewCount = function(imageId: string) {
  return this.findByIdAndUpdate(imageId, { $inc: { viewCount: 1 } });
};

export default mongoose.models.PropertyImage || mongoose.model<IPropertyImage>('PropertyImage', PropertyImageSchema);