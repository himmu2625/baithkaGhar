import mongoose, { Schema, type Document } from "mongoose"

export interface IAmenity {
  name: string
  icon?: string
}

export interface IProperty extends Document {
  title: string
  description: string
  type: string
  location: {
    city: string
    state: string
    address: string
    zipCode: string
  }
  price: number
  images: string[]
  amenities: IAmenity[]
  bedrooms: number
  bathrooms: number
  maxGuests: number
  rating: number
  reviewCount: number
  ownerId: mongoose.Types.ObjectId
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

const PropertySchema = new Schema<IProperty>(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    type: { type: String, required: true },
    location: {
      city: { type: String, required: true },
      state: { type: String, required: true },
      address: { type: String, required: true },
      zipCode: { type: String, required: true },
    },
    price: { type: Number, required: true },
    images: [{ type: String }],
    amenities: [
      {
        name: { type: String, required: true },
        icon: { type: String },
      },
    ],
    bedrooms: { type: Number, required: true },
    bathrooms: { type: Number, required: true },
    maxGuests: { type: Number, required: true },
    rating: { type: Number, default: 0 },
    reviewCount: { type: Number, default: 0 },
    ownerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true,
    collection: "properties",
   },
)

export default mongoose.models.Property || mongoose.model<IProperty>("Property", PropertySchema)
