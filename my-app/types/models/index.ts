import mongoose from "mongoose"

// User types
export interface IUser {
  _id: mongoose.Types.ObjectId
  name: string
  email: string
  phone?: string
  password?: string
  address?: string
  dob?: Date
  isAdmin: boolean
  googleId?: string
  profileComplete: boolean
  createdAt: Date
  updatedAt: Date
}

// Property types
export interface IAmenity {
  name: string
  icon?: string
}

export interface ILocation {
  city: string
  state: string
  address: string
  zipCode: string
}

export interface IProperty {
  _id: mongoose.Types.ObjectId
  title: string
  description: string
  type: string
  location: ILocation
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

// Booking types
export interface IBooking {
  _id: mongoose.Types.ObjectId
  userId: mongoose.Types.ObjectId
  propertyId: mongoose.Types.ObjectId
  status: "confirmed" | "cancelled" | "completed"
  dateFrom: Date
  dateTo: Date
  totalPrice?: number
  createdAt: Date
  updatedAt: Date
}

// Review types
export interface IReview {
  _id: mongoose.Types.ObjectId
  userId: mongoose.Types.ObjectId
  propertyId: mongoose.Types.ObjectId
  bookingId: mongoose.Types.ObjectId
  rating: number
  comment: string
  createdAt: Date
  updatedAt: Date
}

// OTP types
export enum OtpPurpose {
  SIGNUP = "signup",
  LOGIN = "login",
  PASSWORD_RESET = "password_reset",
  EMAIL_VERIFICATION = "email_verification",
  PHONE_VERIFICATION = "phone_verification"
}

export enum OtpMethod {
  EMAIL = "email",
  SMS = "sms"
}

export interface IOtp {
  _id: mongoose.Types.ObjectId
  otp?: string
  hashedOtp: string
  email?: string
  phone?: string
  purpose: OtpPurpose
  method: OtpMethod
  userId?: mongoose.Types.ObjectId
  expiresAt: Date
  isUsed: boolean
  createdAt: Date
  updatedAt: Date
}

// Activity types
export interface IActivity {
  _id: mongoose.Types.ObjectId
  type: string
  description: string
  entity?: string
  entityId?: string
  userId?: mongoose.Types.ObjectId
  metadata?: Record<string, any>
  createdAt: Date
}

// Search Query types
export interface ISearchQuery {
  _id: mongoose.Types.ObjectId
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
