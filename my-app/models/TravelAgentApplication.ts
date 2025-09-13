import mongoose, { Schema, Document } from "mongoose";

export interface ITravelAgentApplication extends Document {
  name: string;
  email: string;
  phone: string;
  password: string;
  companyName: string;
  companyType: 'individual' | 'agency' | 'corporate' | 'tour_operator';
  licenseNumber?: string;
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
    specialties?: string[];
    targetMarkets?: string[];
    annualTurnover?: number;
    teamSize?: number;
  };
  commissionExpectations: {
    preferredType: 'percentage' | 'fixed' | 'tiered';
    expectedRate: number;
    minimumBookingValue?: number;
  };
  profilePicture?: string; // URL to profile picture
  companyLogo?: string; // URL to company logo
  documents: {
    license?: string; // URL to uploaded document
    gstCertificate?: string;
    panCard?: string;
    addressProof?: string;
    businessRegistration?: string;
    bankStatement?: string;
  };
  status: 'pending' | 'approved' | 'rejected' | 'under_review';
  adminNotes?: string;
  rejectionReason?: string;
  approvedBy?: mongoose.Types.ObjectId;
  approvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const TravelAgentApplicationSchema = new Schema<ITravelAgentApplication>(
  {
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
      lowercase: true
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
      targetMarkets: [{ type: String, trim: true }],
      annualTurnover: { type: Number, min: 0 },
      teamSize: { type: Number, min: 1 }
    },
    commissionExpectations: {
      preferredType: {
        type: String,
        enum: ['percentage', 'fixed', 'tiered'],
        required: true
      },
      expectedRate: {
        type: Number,
        required: true,
        min: 0,
        validate: {
          validator: function(this: ITravelAgentApplication, v: number) {
            if (this.commissionExpectations?.preferredType === 'percentage') {
              return v > 0 && v <= 30; // Max 30% commission
            }
            return v > 0; // Fixed amount must be positive
          },
          message: "Expected commission rate must be between 1-30% for percentage type or positive for fixed amount"
        }
      },
      minimumBookingValue: { type: Number, min: 0 }
    },
    profilePicture: {
      type: String,
      validate: {
        validator: function(v: string) {
          if (!v) return true; // Optional field
          return v.startsWith('/uploads/') || v.startsWith('http');
        },
        message: "Profile picture must be a valid image URL"
      }
    },
    companyLogo: {
      type: String,
      validate: {
        validator: function(v: string) {
          if (!v) return true; // Optional field
          return v.startsWith('/uploads/') || v.startsWith('http');
        },
        message: "Company logo must be a valid image URL"
      }
    },
    documents: {
      license: { type: String },
      gstCertificate: { type: String },
      panCard: { type: String },
      addressProof: { type: String },
      businessRegistration: { type: String },
      bankStatement: { type: String }
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'under_review'],
      default: 'pending'
    },
    adminNotes: {
      type: String,
      maxlength: 1000
    },
    rejectionReason: {
      type: String,
      maxlength: 500
    },
    approvedBy: {
      type: Schema.Types.ObjectId,
      ref: "User"
    },
    approvedAt: {
      type: Date
    }
  },
  {
    timestamps: true,
    collection: "travel_agent_applications",
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Indexes for performance
TravelAgentApplicationSchema.index({ email: 1 });
TravelAgentApplicationSchema.index({ status: 1 });
TravelAgentApplicationSchema.index({ companyType: 1 });
TravelAgentApplicationSchema.index({ createdAt: -1 });
TravelAgentApplicationSchema.index({ approvedBy: 1 });

// Virtual for application age
TravelAgentApplicationSchema.virtual('ageInDays').get(function() {
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - this.createdAt.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Virtual for formatted status
TravelAgentApplicationSchema.virtual('statusDisplay').get(function() {
  const statusMap = {
    pending: 'Pending Review',
    approved: 'Approved',
    rejected: 'Rejected',
    under_review: 'Under Review'
  };
  return statusMap[this.status] || this.status;
});

// Pre-save middleware to set approval timestamp
TravelAgentApplicationSchema.pre('save', function(next) {
  if (this.isModified('status') && this.status === 'approved' && !this.approvedAt) {
    this.approvedAt = new Date();
  }
  next();
});

const TravelAgentApplication = mongoose.models.TravelAgentApplication || mongoose.model<ITravelAgentApplication>("TravelAgentApplication", TravelAgentApplicationSchema);
export default TravelAgentApplication; 