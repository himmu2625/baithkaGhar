import mongoose, { Schema, type Document } from "mongoose"

export interface IStaffRole extends Document {
  name: string;
  permissions: string[];
  description: string;
  accessLevel: 'basic' | 'intermediate' | 'advanced' | 'admin';
  departmentId?: mongoose.Types.ObjectId;
  isActive: boolean;
  createdBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const StaffRoleSchema = new Schema<IStaffRole>(
  {
    name: { type: String, required: true },
    permissions: [{ type: String, required: true }],
    description: { type: String, required: true },
    accessLevel: { 
      type: String, 
      enum: ['basic', 'intermediate', 'advanced', 'admin'],
      default: 'basic'
    },
    departmentId: { type: Schema.Types.ObjectId, ref: "Department" },
    isActive: { type: Boolean, default: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" }
  },
  { 
    timestamps: true,
    collection: "staff_roles"
  }
)

// Create indexes for faster queries
StaffRoleSchema.index({ name: 1 }, { unique: true })
StaffRoleSchema.index({ accessLevel: 1 })
StaffRoleSchema.index({ isActive: 1 })
StaffRoleSchema.index({ departmentId: 1 })

/**
 * StaffRole model for defining staff roles and permissions
 * 
 * Common roles might include:
 * - Property Manager
 * - Front Desk Agent
 * - Housekeeper
 * - Maintenance Technician
 * - Security Officer
 * - Concierge
 * - Chef/Kitchen Staff
 */
const StaffRole = (mongoose.models.StaffRole || mongoose.model<IStaffRole>("StaffRole", StaffRoleSchema)) as mongoose.Model<IStaffRole>

export default StaffRole