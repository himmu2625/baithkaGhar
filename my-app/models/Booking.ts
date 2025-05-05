import mongoose, { Schema, Document } from "mongoose";

export interface IBooking extends Document {
  userId: mongoose.Types.ObjectId;
  propertyId: mongoose.Types.ObjectId;
  status: string;
  dateFrom: Date;
  dateTo: Date;
  createdAt: Date;
  updatedAt: Date;
}

const bookingSchema = new Schema<IBooking>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    propertyId: { type: Schema.Types.ObjectId, ref: "Property", required: true },
    status: { type: String, enum: ["confirmed", "cancelled", "completed"], default: "confirmed" },
    dateFrom: Date,
    dateTo: Date,
  },
  { timestamps: true }
);

const Booking = mongoose.models.Booking || mongoose.model<IBooking>("Booking", bookingSchema);
export default Booking;
