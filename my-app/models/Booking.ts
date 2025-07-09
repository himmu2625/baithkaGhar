import mongoose, { Schema, Document } from "mongoose";

export interface IBooking extends Document {
  userId: mongoose.Types.ObjectId;
  propertyId: mongoose.Types.ObjectId;
  status: string;
  dateFrom: Date;
  dateTo: Date;
  guests: number;
  totalPrice?: number;
  originalAmount?: number;
  discountAmount?: number;
  couponCode?: string;
  pricePerNight?: number;
  propertyName?: string;
  // Influencer tracking fields
  influencerId?: mongoose.Types.ObjectId;
  referralCode?: string;
  commissionAmount?: number;
  commissionRate?: number;
  commissionType?: 'percentage' | 'fixed';
  commissionPaid?: boolean;
  contactDetails?: {
    name: string;
    email: string;
    phone: string;
  };
  specialRequests?: string;
  paymentStatus?: string;
  paymentSessionId?: string;
  paymentIntentId?: string;
  emailSent?: {
    confirmation?: Date;
    reminder?: Date;
    thankYou?: Date;
  };
  checkInTime?: Date;
  checkOutTime?: Date;
  rating?: number;
  review?: string;
  cancellationReason?: string;
  cancelledAt?: Date;
  completedAt?: Date;
  adminNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const bookingSchema = new Schema<IBooking>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    propertyId: { type: Schema.Types.ObjectId, ref: "Property", required: true },
    status: { 
      type: String, 
      enum: ["pending", "confirmed", "cancelled", "completed", "refunded"], 
      default: "confirmed" 
    },
    dateFrom: { type: Date, required: true },
    dateTo: { type: Date, required: true },
    guests: { type: Number, required: true, min: 1 },
    totalPrice: { type: Number },
    originalAmount: { type: Number },
    discountAmount: { type: Number, default: 0 },
    couponCode: { type: String },
    pricePerNight: { type: Number },
    propertyName: { type: String },
    // Influencer tracking fields
    influencerId: { 
      type: Schema.Types.ObjectId, 
      ref: "Influencer",
      sparse: true 
    },
    referralCode: { type: String, uppercase: true },
    commissionAmount: { type: Number, min: 0, default: 0 },
    commissionRate: { type: Number, min: 0 },
    commissionType: { 
      type: String, 
      enum: ['percentage', 'fixed'] 
    },
    commissionPaid: { type: Boolean, default: false },
    contactDetails: {
      name: { type: String },
      email: { type: String },
      phone: { type: String }
    },
    specialRequests: { type: String },
    paymentStatus: { 
      type: String, 
      enum: ["pending", "processing", "completed", "failed", "refunded"], 
      default: "completed" 
    },
    paymentSessionId: { type: String },
    paymentIntentId: { type: String },
    emailSent: {
      confirmation: { type: Date },
      reminder: { type: Date },
      thankYou: { type: Date }
    },
    checkInTime: { type: Date },
    checkOutTime: { type: Date },
    rating: { type: Number, min: 1, max: 5 },
    review: { type: String },
    cancellationReason: { type: String },
    cancelledAt: { type: Date },
    completedAt: { type: Date },
    adminNotes: { type: String }
  },
  { 
    timestamps: true,
    // Add indexes for better query performance
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Add compound indexes for common queries
bookingSchema.index({ userId: 1, status: 1 });
bookingSchema.index({ propertyId: 1, dateFrom: 1, dateTo: 1 });
bookingSchema.index({ status: 1, dateFrom: 1 });
bookingSchema.index({ status: 1, dateTo: 1 });
// Influencer tracking indexes
bookingSchema.index({ influencerId: 1, createdAt: -1 });
bookingSchema.index({ referralCode: 1 });
bookingSchema.index({ commissionPaid: 1, influencerId: 1 });

// Virtual for booking duration in nights
bookingSchema.virtual('nights').get(function() {
  if (this.dateFrom && this.dateTo) {
    const diffTime = Math.abs(this.dateTo.getTime() - this.dateFrom.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
  return 0;
});

// Virtual for booking code (formatted ID)
bookingSchema.virtual('bookingCode').get(function() {
  return `BK-${this._id.toString().slice(-6).toUpperCase()}`;
});

// Virtual for time until check-in
bookingSchema.virtual('timeUntilCheckIn').get(function() {
  if (this.dateFrom) {
    const now = new Date();
    const timeDiff = this.dateFrom.getTime() - now.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
    
    if (daysDiff < 0) return "Check-in has passed";
    if (daysDiff === 0) return "Today";
    if (daysDiff === 1) return "Tomorrow";
    return `${daysDiff} days`;
  }
  return null;
});

// Pre-save middleware to validate dates
bookingSchema.pre('save', function(next) {
  if (this.dateFrom && this.dateTo && this.dateFrom >= this.dateTo) {
    return next(new Error('Check-out date must be after check-in date'));
  }
  next();
});

// Pre-save middleware to set completion date when status changes to completed
bookingSchema.pre('save', function(next) {
  if (this.isModified('status') && this.status === 'completed' && !this.completedAt) {
    this.completedAt = new Date();
  }
  
  if (this.isModified('status') && this.status === 'cancelled' && !this.cancelledAt) {
    this.cancelledAt = new Date();
  }
  
  next();
});

const Booking = mongoose.models.Booking || mongoose.model<IBooking>("Booking", bookingSchema);
export default Booking;
