import mongoose, { Schema, type Document } from "mongoose"

export interface ISearchQuery extends Document {
  userId?: mongoose.Types.ObjectId
  userName?: string
  userEmail?: string
  searchTerm: string
  isPropertyListed: boolean
  location?: string
  checkIn?: Date
  checkOut?: Date
  guests?: number
  createdAt: Date
  updatedAt: Date
}

const SearchQuerySchema = new Schema<ISearchQuery>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    userName: { type: String },
    userEmail: { type: String },
    searchTerm: { type: String, required: true },
    isPropertyListed: { type: Boolean, default: false },
    location: { type: String },
    checkIn: { type: Date },
    checkOut: { type: Date },
    guests: { type: Number },
  },
  { 
    timestamps: true,
    collection: "search_queries"
  }
)

// Create indexes for faster queries
SearchQuerySchema.index({ searchTerm: 1 })
SearchQuerySchema.index({ isPropertyListed: 1 })
SearchQuerySchema.index({ createdAt: 1 })
SearchQuerySchema.index({ userId: 1 })

const SearchQuery = mongoose.models.SearchQuery || 
                   mongoose.model<ISearchQuery>("SearchQuery", SearchQuerySchema)

export default SearchQuery 