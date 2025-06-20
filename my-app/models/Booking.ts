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
  contactDetails?: {
    name: string;
    email: string;
    phone: string;
  };
  specialRequests?: string;
  createdAt: Date;
  updatedAt: Date;
}

const bookingSchema = new Schema<IBooking>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    propertyId: { type: Schema.Types.ObjectId, ref: "Property", required: true },
    status: { type: String, enum: ["confirmed", "cancelled", "completed"], default: "confirmed" },
    dateFrom: { type: Date, required: true },
    dateTo: { type: Date, required: true },
    guests: { type: Number, required: true, min: 1 },
    totalPrice: { type: Number },
    originalAmount: { type: Number },
    discountAmount: { type: Number, default: 0 },
    couponCode: { type: String },
    pricePerNight: { type: Number },
    propertyName: { type: String },
    contactDetails: {
      name: { type: String },
      email: { type: String },
      phone: { type: String }
    },
    specialRequests: { type: String }
  },
  { timestamps: true }
);

const Booking = mongoose.models.Booking || mongoose.model<IBooking>("Booking", bookingSchema);
export default Booking;
