import mongoose, { Schema, Document } from "mongoose";

export interface IPayout extends Document {
  influencerId: mongoose.Types.ObjectId;
  amount: number;
  periodStart: Date;
  periodEnd: Date;
  bookingIds: mongoose.Types.ObjectId[]; // Bookings included in this payout
  status: 'pending' | 'processing' | 'paid' | 'failed' | 'cancelled';
  paymentMethod: 'bank_transfer' | 'upi' | 'wallet' | 'cheque';
  transactionId?: string; // Payment gateway transaction ID
  razorpayPayoutId?: string; // Razorpay payout ID
  bankDetails?: {
    accountNumber: string;
    ifscCode: string;
    accountName: string;
    bankName: string;
  };
  upiId?: string;
  taxDeductions?: {
    tds: number; // TDS amount
    gst: number; // GST amount
    other: number; // Other deductions
  };
  netAmount: number; // Amount after deductions
  notes?: string;
  failureReason?: string;
  requestedAt: Date;
  processedAt?: Date;
  paidAt?: Date;
  processedBy?: mongoose.Types.ObjectId; // Admin who processed
  metadata?: {
    totalBookings: number;
    avgCommissionRate: number;
    totalRevenue: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

const PayoutSchema = new Schema<IPayout>(
  {
    influencerId: {
      type: Schema.Types.ObjectId,
      ref: "Influencer",
      required: true,
      index: true
    },
    amount: {
      type: Number,
      required: true,
      min: 0
    },
    periodStart: {
      type: Date,
      required: true,
      index: true
    },
    periodEnd: {
      type: Date,
      required: true,
      index: true
    },
    bookingIds: [{
      type: Schema.Types.ObjectId,
      ref: "Booking"
    }],
    status: {
      type: String,
      enum: ['pending', 'processing', 'paid', 'failed', 'cancelled'],
      default: 'pending',
      index: true
    },
    paymentMethod: {
      type: String,
      enum: ['bank_transfer', 'upi', 'wallet', 'cheque'],
      default: 'bank_transfer'
    },
    transactionId: {
      type: String,
      trim: true,
      sparse: true
    },
    razorpayPayoutId: {
      type: String,
      trim: true,
      sparse: true
    },
    bankDetails: {
      accountNumber: { type: String, trim: true },
      ifscCode: { type: String, trim: true, uppercase: true },
      accountName: { type: String, trim: true },
      bankName: { type: String, trim: true }
    },
    upiId: {
      type: String,
      trim: true
    },
    taxDeductions: {
      tds: { type: Number, default: 0, min: 0 },
      gst: { type: Number, default: 0, min: 0 },
      other: { type: Number, default: 0, min: 0 }
    },
    netAmount: {
      type: Number,
      required: true,
      min: 0
    },
    notes: {
      type: String,
      maxlength: 1000
    },
    failureReason: {
      type: String,
      maxlength: 500
    },
    requestedAt: {
      type: Date,
      default: Date.now,
      index: true
    },
    processedAt: {
      type: Date
    },
    paidAt: {
      type: Date
    },
    processedBy: {
      type: Schema.Types.ObjectId,
      ref: "User"
    },
    metadata: {
      totalBookings: { type: Number, default: 0 },
      avgCommissionRate: { type: Number, default: 0 },
      totalRevenue: { type: Number, default: 0 }
    }
  },
  {
    timestamps: true,
    collection: "payouts",
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Indexes for performance
PayoutSchema.index({ influencerId: 1, status: 1 });
PayoutSchema.index({ status: 1, requestedAt: -1 });
PayoutSchema.index({ periodStart: 1, periodEnd: 1 });
PayoutSchema.index({ transactionId: 1 }, { sparse: true });
PayoutSchema.index({ razorpayPayoutId: 1 }, { sparse: true });

// Virtual for total deductions
PayoutSchema.virtual('totalDeductions').get(function() {
  if (!this.taxDeductions) return 0;
  return (this.taxDeductions.tds || 0) + 
         (this.taxDeductions.gst || 0) + 
         (this.taxDeductions.other || 0);
});

// Virtual for processing time
PayoutSchema.virtual('processingTime').get(function() {
  if (!this.processedAt || !this.requestedAt) return null;
  const diffMs = this.processedAt.getTime() - this.requestedAt.getTime();
  const diffHours = Math.round(diffMs / (1000 * 60 * 60));
  return `${diffHours} hours`;
});

// Virtual for payout reference
PayoutSchema.virtual('payoutReference').get(function() {
  return `PO-${this._id.toString().slice(-8).toUpperCase()}`;
});

// Pre-save middleware to calculate net amount
PayoutSchema.pre('save', function(next) {
  const totalDeductions = (this.taxDeductions?.tds || 0) + 
                         (this.taxDeductions?.gst || 0) + 
                         (this.taxDeductions?.other || 0);
  this.netAmount = this.amount - totalDeductions;
  next();
});

// Pre-save middleware to set timestamps
PayoutSchema.pre('save', function(next) {
  if (this.isModified('status')) {
    const now = new Date();
    
    if (this.status === 'processing' && !this.processedAt) {
      this.processedAt = now;
    }
    
    if (this.status === 'paid' && !this.paidAt) {
      this.paidAt = now;
    }
  }
  next();
});

// Static method to create payout for influencer
PayoutSchema.statics.createForInfluencer = async function(
  influencerId: mongoose.Types.ObjectId,
  periodStart: Date,
  periodEnd: Date,
  bookingIds: mongoose.Types.ObjectId[],
  amount: number,
  options?: {
    paymentMethod?: 'bank_transfer' | 'upi' | 'wallet' | 'cheque';
    taxDeductions?: { tds?: number; gst?: number; other?: number };
    notes?: string;
  }
) {
  const payout = new this({
    influencerId,
    amount,
    periodStart,
    periodEnd,
    bookingIds,
    paymentMethod: options?.paymentMethod || 'bank_transfer',
    taxDeductions: options?.taxDeductions || { tds: 0, gst: 0, other: 0 },
    notes: options?.notes,
    requestedAt: new Date()
  });
  
  return payout.save();
};

// Method to mark as paid
PayoutSchema.methods.markAsPaid = function(
  transactionId: string,
  processedBy?: mongoose.Types.ObjectId,
  razorpayPayoutId?: string
) {
  this.status = 'paid';
  this.transactionId = transactionId;
  this.processedBy = processedBy;
  this.razorpayPayoutId = razorpayPayoutId;
  this.paidAt = new Date();
  return this.save();
};

// Method to mark as failed
PayoutSchema.methods.markAsFailed = function(
  reason: string,
  processedBy?: mongoose.Types.ObjectId
) {
  this.status = 'failed';
  this.failureReason = reason;
  this.processedBy = processedBy;
  return this.save();
};

// Method to calculate TDS (typically 10% for influencers)
PayoutSchema.methods.calculateTDS = function(rate: number = 0.1) {
  const tdsAmount = this.amount * rate;
  if (!this.taxDeductions) {
    this.taxDeductions = { tds: 0, gst: 0, other: 0 };
  }
  this.taxDeductions.tds = tdsAmount;
  return this.save();
};

const Payout = mongoose.models.Payout || mongoose.model<IPayout>("Payout", PayoutSchema);

export default Payout; 