import mongoose, { Schema, type Document } from "mongoose"

export interface IReview extends Document {
  userId: mongoose.Types.ObjectId
  propertyId: mongoose.Types.ObjectId
  bookingId: mongoose.Types.ObjectId
  rating: number
  comment: string
  createdAt: Date
  updatedAt: Date
}

const ReviewSchema = new Schema<IReview>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    propertyId: { type: Schema.Types.ObjectId, ref: "Property", required: true },
    bookingId: { type: Schema.Types.ObjectId, ref: "Booking", required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true },
  },
  { timestamps: true,
    collection: "reviews",
   },
)

// Ensure a user can only review a property once per booking
ReviewSchema.index({ userId: 1, propertyId: 1, bookingId: 1 }, { unique: true })

export default mongoose.models.Review || mongoose.model<IReview>("Review", ReviewSchema)
