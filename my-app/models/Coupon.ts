import mongoose, { Schema, Document } from "mongoose";

export interface ICoupon extends Document {
  code: string;
  name: string;
  description?: string;
  type: "percentage" | "fixed_amount";
  value: number; // percentage (1-100) or fixed amount in INR
  minOrderAmount?: number;
  maxDiscountAmount?: number;
  usageLimit?: number;
  usageCount: number;
  userUsageLimit?: number; // per user limit
  isActive: boolean;
  validFrom: Date;
  validTo: Date;
  applicableFor: "all" | "specific_properties" | "specific_users";
  applicableProperties?: mongoose.Types.ObjectId[];
  applicableUsers?: mongoose.Types.ObjectId[];
  excludedProperties?: mongoose.Types.ObjectId[];
  excludedUsers?: mongoose.Types.ObjectId[];
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const CouponSchema = new Schema<ICoupon>(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      minlength: 3,
      maxlength: 20,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    description: {
      type: String,
      maxlength: 500,
    },
    type: {
      type: String,
      enum: ["percentage", "fixed_amount"],
      required: true,
    },
    value: {
      type: Number,
      required: true,
      min: 0,
      validate: {
        validator: function(this: ICoupon, v: number) {
          if (this.type === "percentage") {
            return v > 0 && v <= 100;
          }
          return v > 0;
        },
        message: "Value must be between 1-100 for percentage type or greater than 0 for fixed amount",
      },
    },
    minOrderAmount: {
      type: Number,
      min: 0,
      default: 0,
    },
    maxDiscountAmount: {
      type: Number,
      min: 0,
    },
    usageLimit: {
      type: Number,
      min: 1,
    },
    usageCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    userUsageLimit: {
      type: Number,
      min: 1,
      default: 1,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    validFrom: {
      type: Date,
      required: true,
    },
    validTo: {
      type: Date,
      required: true,
      validate: {
        validator: function(this: ICoupon, v: Date) {
          return v > this.validFrom;
        },
        message: "Valid to date must be after valid from date",
      },
    },
    applicableFor: {
      type: String,
      enum: ["all", "specific_properties", "specific_users"],
      default: "all",
    },
    applicableProperties: [{
      type: Schema.Types.ObjectId,
      ref: "Property",
    }],
    applicableUsers: [{
      type: Schema.Types.ObjectId,
      ref: "User",
    }],
    excludedProperties: [{
      type: Schema.Types.ObjectId,
      ref: "Property",
    }],
    excludedUsers: [{
      type: Schema.Types.ObjectId,
      ref: "User",
    }],
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
    collection: "coupons",
  }
);

// Indexes for better performance
CouponSchema.index({ code: 1 });
CouponSchema.index({ isActive: 1, validFrom: 1, validTo: 1 });
CouponSchema.index({ createdBy: 1 });

// Methods
CouponSchema.methods.isValidForBooking = function(
  bookingAmount: number,
  userId: mongoose.Types.ObjectId,
  propertyId: mongoose.Types.ObjectId
): { valid: boolean; reason?: string } {
  const now = new Date();

  // Check if coupon is active
  if (!this.isActive) {
    return { valid: false, reason: "Coupon is not active" };
  }

  // Check date validity
  if (now < this.validFrom || now > this.validTo) {
    return { valid: false, reason: "Coupon has expired or not yet valid" };
  }

  // Check minimum order amount
  if (this.minOrderAmount && bookingAmount < this.minOrderAmount) {
    return { 
      valid: false, 
      reason: `Minimum order amount of ₹${this.minOrderAmount} required` 
    };
  }

  // Check usage limit
  if (this.usageLimit && this.usageCount >= this.usageLimit) {
    return { valid: false, reason: "Coupon usage limit exceeded" };
  }

  // Check property applicability
  if (this.applicableFor === "specific_properties" && 
      !this.applicableProperties.includes(propertyId)) {
    return { valid: false, reason: "Coupon not applicable for this property" };
  }

  // Check user applicability
  if (this.applicableFor === "specific_users" && 
      !this.applicableUsers.includes(userId)) {
    return { valid: false, reason: "Coupon not applicable for this user" };
  }

  // Check excluded properties
  if (this.excludedProperties && this.excludedProperties.includes(propertyId)) {
    return { valid: false, reason: "Coupon not applicable for this property" };
  }

  // Check excluded users
  if (this.excludedUsers && this.excludedUsers.includes(userId)) {
    return { valid: false, reason: "Coupon not applicable for this user" };
  }

  return { valid: true };
};

CouponSchema.methods.calculateDiscount = function(amount: number): number {
  let discount = 0;
  
  if (this.type === "percentage") {
    discount = (amount * this.value) / 100;
  } else {
    discount = this.value;
  }

  // Apply max discount limit for percentage coupons
  if (this.maxDiscountAmount && discount > this.maxDiscountAmount) {
    discount = this.maxDiscountAmount;
  }

  return Math.min(discount, amount); // Don't exceed the total amount
};

const Coupon = mongoose.models.Coupon || mongoose.model<ICoupon>("Coupon", CouponSchema);

export default Coupon; 