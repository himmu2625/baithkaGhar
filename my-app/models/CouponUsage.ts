import mongoose, { Schema, Document } from "mongoose";

export interface ICouponUsage extends Document {
  couponId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  bookingId: mongoose.Types.ObjectId;
  propertyId: mongoose.Types.ObjectId;
  originalAmount: number;
  discountAmount: number;
  finalAmount: number;
  usedAt: Date;
}

const CouponUsageSchema = new Schema<ICouponUsage>(
  {
    couponId: {
      type: Schema.Types.ObjectId,
      ref: "Coupon",
      required: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    bookingId: {
      type: Schema.Types.ObjectId,
      ref: "Booking",
      required: true,
    },
    propertyId: {
      type: Schema.Types.ObjectId,
      ref: "Property",
      required: true,
    },
    originalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    discountAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    finalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    usedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    collection: "coupon_usage",
  }
);

// Indexes for better performance
CouponUsageSchema.index({ couponId: 1 });
CouponUsageSchema.index({ userId: 1 });
CouponUsageSchema.index({ bookingId: 1 });
CouponUsageSchema.index({ usedAt: -1 });

// Compound index for checking user usage per coupon
CouponUsageSchema.index({ couponId: 1, userId: 1 });

const CouponUsage = mongoose.models.CouponUsage || mongoose.model<ICouponUsage>("CouponUsage", CouponUsageSchema);

export default CouponUsage; 