import mongoose, { Schema, type Document } from "mongoose"

export interface IReview extends Document {
  userId?: mongoose.Types.ObjectId // Optional for imported reviews
  propertyId: mongoose.Types.ObjectId
  bookingId?: mongoose.Types.ObjectId // Optional for imported reviews
  userName: string // Added for imported reviews without user accounts
  userImage?: string
  rating: number
  comment: string
  checkInDate?: Date
  checkOutDate?: Date
  source: 'direct' | 'mmt' | 'justdial' | 'google' | 'imported'
  sourceReviewId?: string // Original review ID from external platform
  isVerified: boolean
  isPublished: boolean
  ratingBreakdown?: {
    cleanliness?: number
    accuracy?: number
    communication?: number
    location?: number
    checkIn?: number
    value?: number
  }
  helpfulCount: number
  createdAt: Date
  updatedAt: Date
}

const ReviewSchema = new Schema<IReview>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User" },
    propertyId: { type: Schema.Types.ObjectId, ref: "Property", required: true, index: true },
    bookingId: { type: Schema.Types.ObjectId, ref: "Booking" },
    userName: { type: String, required: true },
    userImage: { type: String },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true, maxlength: 2000 },
    checkInDate: { type: Date },
    checkOutDate: { type: Date },
    source: {
      type: String,
      enum: ['direct', 'mmt', 'justdial', 'google', 'imported'],
      default: 'direct',
      index: true
    },
    sourceReviewId: { type: String },
    isVerified: { type: Boolean, default: false },
    isPublished: { type: Boolean, default: true },
    ratingBreakdown: {
      cleanliness: { type: Number, min: 1, max: 5 },
      accuracy: { type: Number, min: 1, max: 5 },
      communication: { type: Number, min: 1, max: 5 },
      location: { type: Number, min: 1, max: 5 },
      checkIn: { type: Number, min: 1, max: 5 },
      value: { type: Number, min: 1, max: 5 },
    },
    helpfulCount: { type: Number, default: 0 },
  },
  { timestamps: true,
    collection: "reviews",
   },
)

// Ensure a user can only review a property once per booking (for direct reviews)
ReviewSchema.index({ userId: 1, propertyId: 1, bookingId: 1 }, { unique: true, sparse: true })
// Additional indexes for performance
ReviewSchema.index({ propertyId: 1, createdAt: -1 })
ReviewSchema.index({ propertyId: 1, isPublished: 1 })
ReviewSchema.index({ rating: -1 })

export default mongoose.models.Review || mongoose.model<IReview>("Review", ReviewSchema)
