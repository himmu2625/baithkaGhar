import mongoose, { Schema, type Document } from "mongoose"

export interface IFavorite extends Document {
  userId: mongoose.Types.ObjectId
  propertyId: mongoose.Types.ObjectId
  createdAt: Date
}

const FavoriteSchema = new Schema<IFavorite>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    propertyId: { type: Schema.Types.ObjectId, ref: "Property", required: true },
  },
  { timestamps: true },
)

// Ensure a user can only favorite a property once
FavoriteSchema.index({ userId: 1, propertyId: 1 }, { unique: true })

export default mongoose.models.Favorite || mongoose.model<IFavorite>("Favorite", FavoriteSchema)
