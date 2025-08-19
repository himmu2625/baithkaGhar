import mongoose, { Schema, type Document } from "mongoose"

export interface IStaff extends Document {
  propertyId: mongoose.Types.ObjectId;
  name: string;
  email: string;
  phone: string;
  role: mongoose.Types.ObjectId;
  status: 'active' | 'inactive' | 'on_leave' | 'terminated';
  hireDate: Date;
  emergencyContact?: {
    name: string;
    relationship: string;
    phone: string;
  };
  address?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  documents?: {
    idProof: string;
    addressProof: string;
    contractDocument: string;
  };
  skills?: string[];
  performanceRating?: number;
  salary?: {
    amount: number;
    currency: string;
    paymentFrequency: 'weekly' | 'biweekly' | 'monthly';
  };
  createdAt: Date;
  updatedAt: Date;
}

const StaffSchema = new Schema<IStaff>(
  {
    propertyId: { type: Schema.Types.ObjectId, ref: "Property", required: true },
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    role: { type: Schema.Types.ObjectId, ref: "StaffRole", required: true },
    status: { 
      type: String, 
      enum: ['active', 'inactive', 'on_leave', 'terminated'],
      default: 'active'
    },
    hireDate: { type: Date, required: true },
    emergencyContact: {
      name: { type: String },
      relationship: { type: String },
      phone: { type: String }
    },
    address: {
      street: { type: String },
      city: { type: String },
      state: { type: String },
      zipCode: { type: String },
      country: { type: String }
    },
    documents: {
      idProof: { type: String },
      addressProof: { type: String },
      contractDocument: { type: String }
    },
    skills: [{ type: String }],
    performanceRating: { type: Number, min: 0, max: 5 },
    salary: {
      amount: { type: Number },
      currency: { type: String, default: "INR" },
      paymentFrequency: { 
        type: String, 
        enum: ['weekly', 'biweekly', 'monthly'],
        default: 'monthly'
      }
    }
  },
  { 
    timestamps: true,
    collection: "staff"
  }
)

// Create indexes for faster queries
StaffSchema.index({ propertyId: 1 })
StaffSchema.index({ email: 1 }, { unique: true })
StaffSchema.index({ phone: 1 })
StaffSchema.index({ role: 1 })
StaffSchema.index({ status: 1 })

/**
 * Staff model for property staff management
 */
const Staff = (mongoose.models.Staff || mongoose.model<IStaff>("Staff", StaffSchema)) as mongoose.Model<IStaff>

export default Staff