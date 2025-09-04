import mongoose, { Schema, Document, Types } from 'mongoose';

export interface ITable extends Document {
  _id: Types.ObjectId;
  propertyId: Types.ObjectId;
  number: string;
  capacity: number;
  section: string;
  status: 'available' | 'occupied' | 'reserved' | 'cleaning' | 'out_of_order';
  
  location?: {
    x?: number;
    y?: number;
    floor?: string;
  };
  
  features: ('window_view' | 'outdoor' | 'private' | 'accessible' | 'booth' | 'bar_height' | 'round' | 'square')[];
  isActive: boolean;
  minimumSpend: number;
  notes?: string;
  qrCode?: string;
  
  settings: {
    allowOnlineReservation: boolean;
    maxReservationDuration: number;
    advanceBookingDays: number;
    requireDeposit: boolean;
    depositAmount: number;
  };

  // Metadata
  createdBy: Types.ObjectId;
  lastUpdatedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;

  // Methods
  isAvailable(): boolean;
  canAccommodate(partySize: number): boolean;
  updateStatus(status: string, additionalData?: any): Promise<ITable>;
}

const TableSchema = new Schema<ITable>({
  propertyId: {
    type: Schema.Types.ObjectId,
    ref: 'Property',
    required: [true, 'Property ID is required'],
    index: true
  },
  
  number: {
    type: String,
    required: [true, 'Table number is required'],
    trim: true,
    maxlength: [20, 'Table number cannot exceed 20 characters']
  },

  capacity: {
    type: Number,
    required: [true, 'Capacity is required'],
    min: [1, 'Capacity must be at least 1'],
    max: [50, 'Capacity cannot exceed 50']
  },

  section: {
    type: String,
    required: [true, 'Section is required'],
    trim: true,
    maxlength: [100, 'Section name cannot exceed 100 characters']
  },

  status: {
    type: String,
    enum: {
      values: ['available', 'occupied', 'reserved', 'cleaning', 'out_of_order'],
      message: 'Invalid table status'
    },
    default: 'available',
    index: true
  },
  
  location: {
    x: Number,
    y: Number,
    floor: {
      type: String,
      maxlength: 50
    }
  },
  
  features: [{
    type: String,
    enum: ['window_view', 'outdoor', 'private', 'accessible', 'booth', 'bar_height', 'round', 'square']
  }],

  isActive: {
    type: Boolean,
    default: true,
    index: true
  },

  minimumSpend: {
    type: Number,
    default: 0,
    min: [0, 'Minimum spend cannot be negative']
  },

  notes: {
    type: String,
    maxlength: [500, 'Notes cannot exceed 500 characters']
  },

  qrCode: String,

  settings: {
    allowOnlineReservation: { type: Boolean, default: true },
    maxReservationDuration: { type: Number, min: 30, default: 120 },
    advanceBookingDays: { type: Number, min: 0, default: 30 },
    requireDeposit: { type: Boolean, default: false },
    depositAmount: { type: Number, min: 0, default: 0 }
  },

  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Created by user is required']
  },

  lastUpdatedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true,
  toJSON: { 
    virtuals: true,
    transform: function(doc, ret) {
      delete ret.__v;
      return ret;
    }
  },
  toObject: { virtuals: true }
});

// Indexes for performance
TableSchema.index({ propertyId: 1, number: 1 }, { unique: true });
TableSchema.index({ propertyId: 1, section: 1 });
TableSchema.index({ propertyId: 1, status: 1 });
TableSchema.index({ propertyId: 1, capacity: 1 });
TableSchema.index({ propertyId: 1, isActive: 1 });
TableSchema.index({ features: 1 });

// Virtual for checking availability
TableSchema.virtual('isAvailableNow').get(function() {
  return this.isActive && this.status === 'available';
});

// Pre-save middleware
TableSchema.pre('save', function(next) {
  if (this.isModified() && !this.isNew) {
    this.lastUpdatedBy = this.createdBy; // This should be set by the API
  }
  next();
});

// Instance methods
TableSchema.methods.isAvailable = function(): boolean {
  return this.isActive && this.status === 'available';
};

TableSchema.methods.canAccommodate = function(partySize: number): boolean {
  return this.isActive && partySize <= this.capacity && partySize > 0;
};

TableSchema.methods.updateStatus = function(status: string, additionalData?: any): Promise<ITable> {
  this.status = status;
  return this.save();
};

// Static methods
TableSchema.statics.findByProperty = function(propertyId: Types.ObjectId, filters: any = {}) {
  return this.find({ propertyId, ...filters })
    .sort({ section: 1, number: 1 })
    .populate('createdBy', 'fullName')
    .populate('lastUpdatedBy', 'fullName');
};

TableSchema.statics.findActiveByProperty = function(propertyId: Types.ObjectId) {
  return (this as any).findByProperty(propertyId, { isActive: true });
};

TableSchema.statics.findAvailable = function(propertyId: Types.ObjectId, partySize?: number, section?: string) {
  const filters: any = { isActive: true, status: 'available' };
  
  if (partySize) {
    filters.capacity = { $gte: partySize };
  }
  
  if (section) {
    filters.section = section;
  }
  
  return (this as any).findByProperty(propertyId, filters)
    .sort({ capacity: 1 }); // Sort by smallest suitable table first
};

TableSchema.statics.findBySection = function(propertyId: Types.ObjectId, section: string) {
  return (this as any).findByProperty(propertyId, { section, isActive: true });
};

const Table = mongoose.models.Table || mongoose.model<ITable>('Table', TableSchema);

export default Table;