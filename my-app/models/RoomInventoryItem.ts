import mongoose, { Schema, Document } from 'mongoose';

// Define interface with simpler structure to avoid build issues
interface IRoomInventoryItem extends Document {
  // Basic Information
  propertyId: mongoose.Types.ObjectId;
  roomId: mongoose.Types.ObjectId;
  itemCode: string;
  itemName: string;
  itemDescription?: string;

  // Classification
  category: 'furniture' | 'electronics' | 'linens' | 'bathroom' | 'kitchen' | 'decor' | 'safety' | 'appliances' | 'lighting' | 'hvac';
  subCategory?: string;
  brand?: string;
  model?: string;
  serialNumber?: string;

  // Physical Properties
  quantity: number;
  unit: 'piece' | 'set' | 'pair' | 'kg' | 'liter' | 'meter' | 'sqft' | 'box';
  color?: string;
  material?: string;

  // Condition Tracking
  condition: 'excellent' | 'good' | 'fair' | 'poor' | 'damaged' | 'missing' | 'under_repair';
  conditionNotes?: string;

  // Financial Information
  financial: {
    purchasePrice: number;
    currentValue: number;
    currency: string;
    purchaseDate: Date;
  };

  // Location Tracking
  location: {
    specificLocation?: string;
    isFixed: boolean;
    isVisible: boolean;
  };

  // System Fields
  isActive: boolean;
  version: number;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  createdBy: mongoose.Types.ObjectId;
  lastModifiedBy: mongoose.Types.ObjectId;
}

const RoomInventoryItemSchema = new Schema<IRoomInventoryItem>({
  // Basic Information
  propertyId: {
    type: Schema.Types.ObjectId,
    ref: 'Property',
    required: true,
    index: true
  },
  roomId: {
    type: Schema.Types.ObjectId,
    ref: 'Room',
    required: true,
    index: true
  },
  itemCode: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true
  },
  itemName: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  itemDescription: {
    type: String,
    trim: true
  },

  // Classification
  category: {
    type: String,
    enum: ['furniture', 'electronics', 'linens', 'bathroom', 'kitchen', 'decor', 'safety', 'appliances', 'lighting', 'hvac'],
    required: true,
    index: true
  },
  subCategory: {
    type: String,
    trim: true
  },
  brand: {
    type: String,
    trim: true
  },
  model: {
    type: String,
    trim: true
  },
  serialNumber: {
    type: String,
    trim: true
  },

  // Physical Properties
  quantity: {
    type: Number,
    required: true,
    min: 0
  },
  unit: {
    type: String,
    enum: ['piece', 'set', 'pair', 'kg', 'liter', 'meter', 'sqft', 'box'],
    default: 'piece'
  },
  color: {
    type: String,
    trim: true
  },
  material: {
    type: String,
    trim: true
  },

  // Condition Tracking
  condition: {
    type: String,
    enum: ['excellent', 'good', 'fair', 'poor', 'damaged', 'missing', 'under_repair'],
    required: true,
    default: 'good',
    index: true
  },
  conditionNotes: {
    type: String,
    trim: true
  },

  // Financial Information
  financial: {
    purchasePrice: { type: Number, required: true, min: 0 },
    currentValue: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'USD' },
    purchaseDate: { type: Date, required: true }
  },

  // Location Tracking
  location: {
    specificLocation: String,
    isFixed: { type: Boolean, default: false },
    isVisible: { type: Boolean, default: true }
  },

  // System Fields
  isActive: {
    type: Boolean,
    default: true
  },
  version: {
    type: Number,
    default: 1
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  lastModifiedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
RoomInventoryItemSchema.index({ propertyId: 1, roomId: 1 });
RoomInventoryItemSchema.index({ itemCode: 1 }, { unique: true });
RoomInventoryItemSchema.index({ category: 1 });
RoomInventoryItemSchema.index({ condition: 1 });

// Virtual for total value
RoomInventoryItemSchema.virtual('totalValue').get(function() {
  return this.financial.currentValue * this.quantity;
});

// Pre-save middleware
RoomInventoryItemSchema.pre('save', function(next) {
  // Auto-generate item code if not provided
  if (!this.itemCode && this.isNew) {
    const roomNumber = this.roomId ? `R${this.roomId.toString().slice(-3)}` : 'R000';
    const categoryCode = this.category.substring(0, 3).toUpperCase();
    const timestamp = Date.now().toString().slice(-4);
    this.itemCode = `${categoryCode}-${roomNumber}-${timestamp}`;
  }

  // Update version on modifications
  if (this.isModified() && !this.isNew) {
    this.version += 1;
  }

  next();
});

export default mongoose.models.RoomInventoryItem || mongoose.model<IRoomInventoryItem>('RoomInventoryItem', RoomInventoryItemSchema);
export type { IRoomInventoryItem };