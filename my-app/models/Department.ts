import mongoose, { Schema, type Document } from "mongoose"

export interface IDepartment extends Document {
  name: string;
  description: string;
  propertyId: mongoose.Types.ObjectId;
  managerId?: mongoose.Types.ObjectId; // Staff member who manages this department
  budget?: {
    allocated: number;
    spent: number;
    currency: string;
    fiscalYear: string;
  };
  isActive: boolean;
  createdBy: mongoose.Types.ObjectId;
  updatedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const DepartmentSchema = new Schema<IDepartment>(
  {
    name: { type: String, required: true },
    description: { type: String, required: true },
    propertyId: { type: Schema.Types.ObjectId, ref: "Property", required: true },
    managerId: { type: Schema.Types.ObjectId, ref: "Staff" },
    budget: {
      allocated: { type: Number, min: 0 },
      spent: { type: Number, min: 0, default: 0 },
      currency: { type: String, default: "INR" },
      fiscalYear: { type: String }
    },
    isActive: { type: Boolean, default: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: "User" }
  },
  { 
    timestamps: true,
    collection: "departments"
  }
)

// Create indexes for faster queries
DepartmentSchema.index({ propertyId: 1 })
DepartmentSchema.index({ managerId: 1 })
DepartmentSchema.index({ isActive: 1 })

// Create compound index for unique department names per property
DepartmentSchema.index({ propertyId: 1, name: 1 }, { unique: true })

/**
 * Department model for organizing staff by departments
 * 
 * Common departments might include:
 * - Front Office
 * - Housekeeping
 * - Maintenance
 * - Food & Beverage
 * - Security
 * - Administration
 * - Guest Services
 */
const Department = (mongoose.models.Department || mongoose.model<IDepartment>("Department", DepartmentSchema)) as mongoose.Model<IDepartment>

export default Department