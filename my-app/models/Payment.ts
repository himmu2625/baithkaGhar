import mongoose, { Schema, type Document } from "mongoose"

export interface IPayment extends Document {
  bookingId: mongoose.Types.ObjectId
  userId: mongoose.Types.ObjectId
  amount: number
  currency: string
  status: "pending" | "succeeded" | "failed" | "refunded"
  paymentMethod?: string
  receiptUrl?: string
  refundId?: string
  refundAmount?: number
  refundReason?: string
  metadata?: Record<string, any>
  createdAt: Date
  updatedAt: Date
}

const PaymentSchema = new Schema<IPayment>(
  {
    bookingId: { type: Schema.Types.ObjectId, ref: "Booking", required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    amount: { type: Number, required: true },
    currency: { type: String, required: true, default: "INR" },
    status: {
      type: String,
      enum: ["pending", "succeeded", "failed", "refunded"],
      default: "pending",
    },
    paymentMethod: { type: String },
    receiptUrl: { type: String },
    refundId: { type: String },
    refundAmount: { type: Number },
    refundReason: { type: String },
    metadata: { type: Schema.Types.Mixed },
  },
  { timestamps: true,
    collection: "payments" }
)

// Index for faster lookups
PaymentSchema.index({ bookingId: 1 })
PaymentSchema.index({ userId: 1 })

export default mongoose.models.Payment || mongoose.model<IPayment>("Payment", PaymentSchema) 