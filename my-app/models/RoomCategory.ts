import mongoose from "mongoose";

const RoomCategorySchema = new mongoose.Schema({
  value: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  label: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  category: {
    type: String,
    enum: ["hotel", "residential", "specialty", "luxury"],
    default: "specialty",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
});

// Create index for faster searches
RoomCategorySchema.index({ label: "text", description: "text" });
RoomCategorySchema.index({ category: 1 });
RoomCategorySchema.index({ value: 1 });

const RoomCategory =
  mongoose.models.RoomCategory ||
  mongoose.model("RoomCategory", RoomCategorySchema);

export default RoomCategory;
