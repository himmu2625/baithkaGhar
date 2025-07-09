import mongoose, { Schema, Document } from "mongoose";

export interface IInfluencerApplication extends Document {
  fullName: string;
  email: string;
  phone?: string;
  socialLinks: {
    instagram?: string;
    youtube?: string;
    tiktok?: string;
    facebook?: string;
    twitter?: string;
    blog?: string;
    other?: string;
  };
  followerCount: number;
  primaryPlatform: 'instagram' | 'youtube' | 'tiktok' | 'facebook' | 'twitter' | 'blog' | 'other';
  collaborationType: 'paid' | 'barter' | 'affiliate' | 'mixed';
  profileImage?: string; // URL to uploaded image
  bio?: string;
  motivation?: string;
  niche?: string;
  location?: {
    city: string;
    state: string;
    country: string;
  };
  mediaKit?: string; // URL to media kit file
  averageEngagement?: number; // Engagement rate percentage
  previousBrandCollabs?: string; // Brands they've worked with
  status: 'pending' | 'reviewing' | 'approved' | 'rejected' | 'contacted';
  reviewNotes?: string; // Internal admin notes
  reviewedBy?: mongoose.Types.ObjectId; // Admin who reviewed
  reviewedAt?: Date;
  contactedAt?: Date;
  convertedToInfluencer?: boolean; // If converted to actual influencer
  convertedInfluencerId?: mongoose.Types.ObjectId;
  utmSource?: string; // Where they came from
  utmMedium?: string;
  utmCampaign?: string;
  ipAddress?: string;
  userAgent?: string;
  submittedAt: Date;
  updatedAt: Date;
}

const influencerApplicationSchema = new Schema<IInfluencerApplication>({
  fullName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
    index: true
  },
  phone: {
    type: String,
    trim: true
  },
  socialLinks: {
    instagram: { type: String, trim: true },
    youtube: { type: String, trim: true },
    tiktok: { type: String, trim: true },
    facebook: { type: String, trim: true },
    twitter: { type: String, trim: true },
    blog: { type: String, trim: true },
    other: { type: String, trim: true }
  },
  followerCount: {
    type: Number,
    required: true,
    min: 0
  },
  primaryPlatform: {
    type: String,
    required: true,
    enum: ['instagram', 'youtube', 'tiktok', 'facebook', 'twitter', 'blog', 'other']
  },
  collaborationType: {
    type: String,
    required: true,
    enum: ['paid', 'barter', 'affiliate', 'mixed'],
    default: 'affiliate'
  },
  profileImage: {
    type: String,
    trim: true
  },
  bio: {
    type: String,
    maxlength: 500,
    trim: true
  },
  motivation: {
    type: String,
    maxlength: 1000,
    trim: true
  },
  niche: {
    type: String,
    maxlength: 100,
    trim: true
  },
  location: {
    city: { type: String, trim: true },
    state: { type: String, trim: true },
    country: { type: String, default: 'India', trim: true }
  },
  mediaKit: {
    type: String,
    trim: true
  },
  averageEngagement: {
    type: Number,
    min: 0,
    max: 100
  },
  previousBrandCollabs: {
    type: String,
    maxlength: 500,
    trim: true
  },
  status: {
    type: String,
    enum: ['pending', 'reviewing', 'approved', 'rejected', 'contacted'],
    default: 'pending',
    index: true
  },
  reviewNotes: {
    type: String,
    maxlength: 1000
  },
  reviewedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  reviewedAt: {
    type: Date
  },
  contactedAt: {
    type: Date
  },
  convertedToInfluencer: {
    type: Boolean,
    default: false
  },
  convertedInfluencerId: {
    type: Schema.Types.ObjectId,
    ref: 'Influencer'
  },
  utmSource: {
    type: String,
    trim: true
  },
  utmMedium: {
    type: String,
    trim: true
  },
  utmCampaign: {
    type: String,
    trim: true
  },
  ipAddress: {
    type: String
  },
  userAgent: {
    type: String
  },
  submittedAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for performance
influencerApplicationSchema.index({ email: 1, submittedAt: -1 });
influencerApplicationSchema.index({ status: 1, submittedAt: -1 });
influencerApplicationSchema.index({ primaryPlatform: 1, followerCount: -1 });
influencerApplicationSchema.index({ collaborationType: 1, status: 1 });

// Update the updatedAt field before saving
influencerApplicationSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Instance methods
influencerApplicationSchema.methods.approve = function() {
  this.status = 'approved';
  this.reviewedAt = new Date();
  return this.save();
};

influencerApplicationSchema.methods.reject = function(notes?: string) {
  this.status = 'rejected';
  this.reviewedAt = new Date();
  if (notes) this.reviewNotes = notes;
  return this.save();
};

influencerApplicationSchema.methods.markAsContacted = function() {
  this.status = 'contacted';
  this.contactedAt = new Date();
  return this.save();
};

// Static methods
influencerApplicationSchema.statics.findByEmail = function(email: string) {
  return this.findOne({ email: email.toLowerCase() });
};

influencerApplicationSchema.statics.getApplicationsByStatus = function(status: string) {
  return this.find({ status }).sort({ submittedAt: -1 });
};

influencerApplicationSchema.statics.getApplicationStats = function() {
  return this.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        avgFollowers: { $avg: '$followerCount' }
      }
    }
  ]);
};

const InfluencerApplication = mongoose.models.InfluencerApplication || 
  mongoose.model<IInfluencerApplication>('InfluencerApplication', influencerApplicationSchema);

export default InfluencerApplication; 