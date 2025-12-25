import mongoose, { Schema, type Document } from "mongoose"
import bcrypt from "bcryptjs"

export interface IUser extends Document {
  name: string
  email: string
  phone?: string
  password?: string
  address?: string
  dob?: Date
  isAdmin: boolean
  role: 'super_admin' | 'admin' | 'user' | 'travel_agent' | 'property_owner'
  permissions?: string[]
  googleId?: string
  profileComplete: boolean
  isSpam: boolean
  resetPasswordToken?: string
  resetPasswordExpire?: Date
  // Phase 1: Property Owner Profile
  ownerProfile?: {
    propertyIds: mongoose.Types.ObjectId[]
    businessName?: string
    businessType?: 'individual' | 'company' | 'partnership'
    gstNumber?: string
    panNumber?: string
    bankDetails?: {
      accountName: string
      accountNumber: string
      ifscCode: string
      bankName: string
      branchName: string
    }
    address?: {
      street: string
      city: string
      state: string
      zipCode: string
      country: string
    }
    contactPerson?: {
      name: string
      designation: string
      phone: string
      email: string
    }
    kycStatus?: 'pending' | 'verified' | 'rejected'
    kycDocuments?: {
      type: string
      number: string
      documentUrl: string
      verifiedAt?: Date
    }[]
    registeredAt?: Date
    approvedBy?: mongoose.Types.ObjectId
    approvedAt?: Date
  }
  createdAt: Date
  updatedAt: Date
  comparePassword(candidatePassword: string): Promise<boolean>
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, },
    phone: { type: String },
    password: { type: String },
    address: { type: String },
    dob: { type: Date },
    isAdmin: { type: Boolean, default: false },
    role: {
      type: String,
      enum: ['super_admin', 'admin', 'user', 'travel_agent', 'property_owner'],
      default: 'user'
    },
    permissions: [{ type: String }],
    googleId: { type: String },
    profileComplete: { type: Boolean, default: false }, // Tracks if user has completed full profile
    isSpam: { type: Boolean, default: false }, // Tracks if user is marked as spam
    resetPasswordToken: { type: String },
    resetPasswordExpire: { type: Date },
    // Phase 1: Property Owner Profile
    ownerProfile: {
      propertyIds: [{ type: Schema.Types.ObjectId, ref: 'Property' }],
      businessName: { type: String },
      businessType: {
        type: String,
        enum: ['individual', 'company', 'partnership']
      },
      gstNumber: { type: String, uppercase: true },
      panNumber: { type: String, uppercase: true },
      bankDetails: {
        accountName: { type: String },
        accountNumber: { type: String },
        ifscCode: { type: String, uppercase: true },
        bankName: { type: String },
        branchName: { type: String }
      },
      address: {
        street: { type: String },
        city: { type: String },
        state: { type: String },
        zipCode: { type: String },
        country: { type: String, default: 'India' }
      },
      contactPerson: {
        name: { type: String },
        designation: { type: String },
        phone: { type: String },
        email: { type: String }
      },
      kycStatus: {
        type: String,
        enum: ['pending', 'verified', 'rejected'],
        default: 'pending'
      },
      kycDocuments: [{
        type: { type: String, enum: ['aadhar', 'pan', 'gst', 'other'] },
        number: { type: String },
        documentUrl: { type: String },
        verifiedAt: { type: Date }
      }],
      registeredAt: { type: Date, default: Date.now },
      approvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
      approvedAt: { type: Date }
    }
  },
  { 
    timestamps: true,
    collection: "users",
  }
)

// Hash password before saving
UserSchema.pre("save", async function (next) {
  if (this.isModified("password") && this.password) {
    const salt = await bcrypt.genSalt(10)
    this.password = await bcrypt.hash(this.password, salt)
  }
  next()
})

// Method to compare password
UserSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  if (!this.password) return false
  return bcrypt.compare(candidatePassword, this.password)
}

// Create indexes for faster queries
UserSchema.index({ email: 1 }, { unique: true })
UserSchema.index({ phone: 1 }, { sparse: true })
UserSchema.index({ googleId: 1 }, { sparse: true })
UserSchema.index({ role: 1 })
UserSchema.index({ isSpam: 1 })
// Phase 1: Owner profile indexes
UserSchema.index({ 'ownerProfile.kycStatus': 1 })
UserSchema.index({ 'ownerProfile.propertyIds': 1 })
UserSchema.index({ 'ownerProfile.gstNumber': 1 }, { sparse: true })
UserSchema.index({ 'ownerProfile.panNumber': 1 }, { sparse: true })

/**
 * Safe initialization - works in both ESM and CommonJS
 */
const User = (mongoose.models.User || mongoose.model<IUser>("User", UserSchema)) as mongoose.Model<IUser>

export default User
