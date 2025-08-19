import mongoose, { Schema, Document } from "mongoose";
import bcrypt from "bcryptjs";

export interface ITravelAgent extends Document {
  userId?: mongoose.Types.ObjectId; // Optional link to User account
  name: string;
  email: string;
  phone: string;
  password: string;
  companyName: string;
  companyType: 'individual' | 'agency' | 'corporate' | 'tour_operator';
  licenseNumber?: string; // Travel agent license
  gstNumber?: string;
  panNumber?: string;
  address: {
    street: string;
    city: string;
    state: string;
    pincode: string;
    country: string;
  };
  businessDetails: {
    website?: string;
    yearsInBusiness?: number;
    specialties?: string[]; // domestic, international, luxury, budget, etc.
    targetMarkets?: string[]; // regions they focus on
  };
  commissionStructure: {
    type: 'percentage' | 'fixed' | 'tiered';
    rate: number; // Base commission rate
    tierRates?: Array<{
      minBookings: number;
      rate: number;
    }>;
    specialRates?: {
      luxuryProperties?: number;
      longStays?: number;
      bulkBookings?: number;
    };
  };
  referralCode: string; // Unique referral code
  status: 'pending' | 'active' | 'suspended' | 'inactive';
  verificationStatus: 'pending' | 'verified' | 'rejected';
  totalEarnings: number;
  walletBalance: number;
  totalBookings: number;
  totalRevenue: number; // Total revenue generated
  totalClients: number;
  averageBookingValue: number;
  joinedAt: Date;
  lastActiveAt?: Date;
  bankDetails?: {
    accountNumber: string;
    ifscCode: string;
    accountName: string;
    bankName: string;
  };
  documents?: {
    license?: string; // URL to uploaded document
    gstCertificate?: string;
    panCard?: string;
    addressProof?: string;
  };
  preferences: {
    preferredDestinations?: string[];
    preferredPropertyTypes?: string[];
    preferredStayTypes?: string[];
    commissionPayoutFrequency: 'weekly' | 'monthly' | 'quarterly';
    autoPayout: boolean;
    minPayoutAmount: number;
  };
  notes?: string; // Admin notes
  tags?: string[]; // For categorization
  createdBy: mongoose.Types.ObjectId; // Admin who created this
  createdAt: Date;
  updatedAt: Date;
}

const TravelAgentSchema = new Schema<ITravelAgent>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      sparse: true
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      unique: true
    },
    phone: {
      type: String,
      required: true,
      trim: true
    },
    password: {
      type: String,
      required: true,
      trim: true
    },
    companyName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200
    },
    companyType: {
      type: String,
      enum: ['individual', 'agency', 'corporate', 'tour_operator'],
      required: true
    },
    licenseNumber: {
      type: String,
      trim: true,
      uppercase: true
    },
    gstNumber: {
      type: String,
      trim: true,
      uppercase: true
    },
    panNumber: {
      type: String,
      trim: true,
      uppercase: true
    },
    address: {
      street: { type: String, required: true, trim: true },
      city: { type: String, required: true, trim: true },
      state: { type: String, required: true, trim: true },
      pincode: { type: String, required: true, trim: true },
      country: { type: String, required: true, trim: true, default: 'India' }
    },
    businessDetails: {
      website: { type: String, trim: true },
      yearsInBusiness: { type: Number, min: 0 },
      specialties: [{ type: String, trim: true }],
      targetMarkets: [{ type: String, trim: true }]
    },
    commissionStructure: {
      type: {
        type: String,
        enum: ['percentage', 'fixed', 'tiered'],
        required: true,
        default: 'percentage'
      },
      rate: {
        type: Number,
        required: true,
        min: 0,
        validate: {
          validator: function(this: ITravelAgent, v: number) {
            if (this.commissionStructure?.type === 'percentage') {
              return v > 0 && v <= 30; // Max 30% commission for travel agents
            }
            return v > 0; // Fixed amount must be positive
          },
          message: "Commission rate must be between 1-30% for percentage type or positive for fixed amount"
        }
      },
      tierRates: [{
        minBookings: { type: Number, required: true, min: 0 },
        rate: { type: Number, required: true, min: 0 }
      }],
      specialRates: {
        luxuryProperties: { type: Number, min: 0 },
        longStays: { type: Number, min: 0 },
        bulkBookings: { type: Number, min: 0 }
      }
    },
    referralCode: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      minlength: 4,
      maxlength: 20
    },
    status: {
      type: String,
      enum: ['pending', 'active', 'suspended', 'inactive'],
      default: 'pending'
    },
    verificationStatus: {
      type: String,
      enum: ['pending', 'verified', 'rejected'],
      default: 'pending'
    },
    totalEarnings: {
      type: Number,
      default: 0,
      min: 0
    },
    walletBalance: {
      type: Number,
      default: 0,
      min: 0
    },
    totalBookings: {
      type: Number,
      default: 0,
      min: 0
    },
    totalRevenue: {
      type: Number,
      default: 0,
      min: 0
    },
    totalClients: {
      type: Number,
      default: 0,
      min: 0
    },
    averageBookingValue: {
      type: Number,
      default: 0,
      min: 0
    },
    joinedAt: {
      type: Date,
      default: Date.now
    },
    lastActiveAt: {
      type: Date
    },
    bankDetails: {
      accountNumber: { type: String, trim: true },
      ifscCode: { type: String, trim: true, uppercase: true },
      accountName: { type: String, trim: true },
      bankName: { type: String, trim: true }
    },
    documents: {
      license: { type: String },
      gstCertificate: { type: String },
      panCard: { type: String },
      addressProof: { type: String }
    },
    preferences: {
      preferredDestinations: [{ type: String, trim: true }],
      preferredPropertyTypes: [{ type: String, trim: true }],
      preferredStayTypes: [{ type: String, trim: true }],
      commissionPayoutFrequency: {
        type: String,
        enum: ['weekly', 'monthly', 'quarterly'],
        default: 'monthly'
      },
      autoPayout: {
        type: Boolean,
        default: false
      },
      minPayoutAmount: {
        type: Number,
        default: 1000,
        min: 0
      }
    },
    notes: {
      type: String,
      maxlength: 1000
    },
    tags: [{ type: String, trim: true }],
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true
    }
  },
  {
    timestamps: true,
    collection: "travel_agents",
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Indexes for performance (referralCode and email already have unique indexes from schema definition)
TravelAgentSchema.index({ status: 1 });
TravelAgentSchema.index({ verificationStatus: 1 });
TravelAgentSchema.index({ companyType: 1 });
TravelAgentSchema.index({ "address.city": 1 });
TravelAgentSchema.index({ "address.state": 1 });
TravelAgentSchema.index({ createdBy: 1 });

// Virtual for formatted referral code
TravelAgentSchema.virtual('formattedReferralCode').get(function() {
  return `TA-${this.referralCode}`;
});

// Virtual for commission rate display
TravelAgentSchema.virtual('commissionDisplay').get(function() {
  if (this.commissionStructure?.type === 'percentage') {
    return `${this.commissionStructure.rate}%`;
  } else if (this.commissionStructure?.type === 'fixed') {
    return `₹${this.commissionStructure.rate}`;
  }
  return 'Tiered';
});

// Pre-save middleware to generate referral code if not provided
TravelAgentSchema.pre('save', function(next) {
  if (!this.referralCode) {
    // Generate unique referral code
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    this.referralCode = `${timestamp}${random}`.toUpperCase();
  }
  next();
});

// Pre-save middleware to hash password
TravelAgentSchema.pre('save', async function(next) {
  if (this.isModified('password') && this.password) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }
  
  // Update average booking value
  if (this.totalBookings > 0) {
    this.averageBookingValue = this.totalRevenue / this.totalBookings;
  }
  next();
});

const TravelAgent = mongoose.models.TravelAgent || mongoose.model<ITravelAgent>("TravelAgent", TravelAgentSchema);
export default TravelAgent; 