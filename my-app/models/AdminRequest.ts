import mongoose, { Schema, model, models } from "mongoose"

export interface IAdminRequest {
  fullName: string
  email: string
  password: string
  phone?: string
  organization: string
  position: string
  department?: string
  requestedRole: string
  accessReason: string
  referenceCode?: string
  status: 'pending' | 'approved' | 'rejected'
  reviewedBy?: mongoose.Types.ObjectId
  reviewDate?: Date
  reviewNotes?: string
  createdAt: Date
}

const AdminRequestSchema = new Schema<IAdminRequest>({
  fullName: {
    type: String,
    required: [true, "Full name is required"],
  },
  email: {
    type: String,
    required: [true, "Email is required"],
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: [true, "Password is required"],
  },
  phone: {
    type: String,
  },
  organization: {
    type: String,
    required: [true, "Organization is required"],
  },
  position: {
    type: String,
    required: [true, "Position is required"],
  },
  department: {
    type: String,
  },
  requestedRole: {
    type: String,
    required: [true, "Requested role is required"],
    enum: ["super_admin", "admin", "editor", "support"],
  },
  accessReason: {
    type: String,
    required: [true, "Reason for access is required"],
  },
  referenceCode: {
    type: String,
  },
  status: {
    type: String,
    required: true,
    enum: ["pending", "approved", "rejected"],
    default: "pending",
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  reviewDate: {
    type: Date,
  },
  reviewNotes: {
    type: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
})

const AdminRequest = models.AdminRequest || model<IAdminRequest>("AdminRequest", AdminRequestSchema)

export default AdminRequest 