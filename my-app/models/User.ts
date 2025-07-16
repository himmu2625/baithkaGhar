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
  role: 'super_admin' | 'admin' | 'user' | 'travel_agent'
  permissions?: string[]
  googleId?: string
  profileComplete: boolean
  isSpam: boolean
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
      enum: ['super_admin', 'admin', 'user', 'travel_agent'],
      default: 'user'
    },
    permissions: [{ type: String }],
    googleId: { type: String },
    profileComplete: { type: Boolean, default: false }, // Tracks if user has completed full profile
    isSpam: { type: Boolean, default: false }, // Tracks if user is marked as spam
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

/**
 * Safe initialization - works in both ESM and CommonJS
 */
const User = (mongoose.models.User || mongoose.model<IUser>("User", UserSchema)) as mongoose.Model<IUser>

export default User
