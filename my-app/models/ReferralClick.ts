import mongoose, { Schema, Document } from "mongoose";

export interface IReferralClick extends Document {
  influencerId: mongoose.Types.ObjectId;
  sessionId: string; // Unique session identifier
  visitorId?: string; // Browser fingerprint or similar
  ipAddress?: string;
  userAgent?: string;
  sourcePage?: string; // Where the click originated
  landingPage: string; // Where user landed on your site
  city?: string;
  country?: string;
  device?: 'mobile' | 'tablet' | 'desktop';
  browser?: string;
  referrer?: string; // External referrer (e.g., Instagram, YouTube)
  utmSource?: string; // UTM tracking parameters
  utmMedium?: string;
  utmCampaign?: string;
  conversionStatus: 'clicked' | 'browsed' | 'booked'; // Track funnel stage
  convertedBookingId?: mongoose.Types.ObjectId; // If converted to booking
  clickedAt: Date;
  convertedAt?: Date;
}

const ReferralClickSchema = new Schema<IReferralClick>(
  {
    influencerId: {
      type: Schema.Types.ObjectId,
      ref: "Influencer",
      required: true,
      index: true
    },
    sessionId: {
      type: String,
      required: true,
      index: true
    },
    visitorId: {
      type: String,
      index: true
    },
    ipAddress: {
      type: String,
      trim: true
    },
    userAgent: {
      type: String,
      trim: true
    },
    sourcePage: {
      type: String,
      trim: true
    },
    landingPage: {
      type: String,
      required: true,
      trim: true
    },
    city: {
      type: String,
      trim: true
    },
    country: {
      type: String,
      trim: true,
      default: 'India'
    },
    device: {
      type: String,
      enum: ['mobile', 'tablet', 'desktop']
    },
    browser: {
      type: String,
      trim: true
    },
    referrer: {
      type: String,
      trim: true
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
    conversionStatus: {
      type: String,
      enum: ['clicked', 'browsed', 'booked'],
      default: 'clicked',
      index: true
    },
    convertedBookingId: {
      type: Schema.Types.ObjectId,
      ref: "Booking",
      sparse: true
    },
    clickedAt: {
      type: Date,
      default: Date.now
    },
    convertedAt: {
      type: Date,
      index: true
    }
  },
  {
    timestamps: true,
    collection: "referral_clicks"
  }
);

// Compound indexes for analytics queries
ReferralClickSchema.index({ influencerId: 1, clickedAt: -1 });
ReferralClickSchema.index({ influencerId: 1, conversionStatus: 1 });
ReferralClickSchema.index({ sessionId: 1, influencerId: 1 });
ReferralClickSchema.index({ clickedAt: -1, conversionStatus: 1 });
ReferralClickSchema.index({ country: 1, device: 1 });

// TTL index to automatically delete old clicks (optional - keep 2 years of data)
ReferralClickSchema.index({ clickedAt: 1 }, { expireAfterSeconds: 63072000 }); // 2 years

// Static method to create click with device detection
ReferralClickSchema.statics.createClick = function(data: {
  influencerId: mongoose.Types.ObjectId;
  sessionId: string;
  userAgent?: string;
  ipAddress?: string;
  landingPage: string;
  referrer?: string;
  utmParams?: {
    source?: string;
    medium?: string;
    campaign?: string;
  };
}) {
  // Basic device detection from user agent
  let device: 'mobile' | 'tablet' | 'desktop' = 'desktop';
  let browser = 'unknown';
  
  if (data.userAgent) {
    const ua = data.userAgent.toLowerCase();
    
    // Device detection
    if (/mobile|android|iphone/.test(ua)) {
      device = 'mobile';
    } else if (/tablet|ipad/.test(ua)) {
      device = 'tablet';
    }
    
    // Browser detection
    if (/chrome/.test(ua)) browser = 'Chrome';
    else if (/firefox/.test(ua)) browser = 'Firefox';
    else if (/safari/.test(ua)) browser = 'Safari';
    else if (/edge/.test(ua)) browser = 'Edge';
  }
  
  return this.create({
    influencerId: data.influencerId,
    sessionId: data.sessionId,
    userAgent: data.userAgent,
    ipAddress: data.ipAddress,
    landingPage: data.landingPage,
    referrer: data.referrer,
    device,
    browser,
    utmSource: data.utmParams?.source,
    utmMedium: data.utmParams?.medium,
    utmCampaign: data.utmParams?.campaign,
    clickedAt: new Date()
  });
};

// Method to mark as converted
ReferralClickSchema.methods.markConverted = function(bookingId: mongoose.Types.ObjectId) {
  this.conversionStatus = 'booked';
  this.convertedBookingId = bookingId;
  this.convertedAt = new Date();
  return this.save();
};

const ReferralClick = mongoose.models.ReferralClick || mongoose.model<IReferralClick>("ReferralClick", ReferralClickSchema);

export default ReferralClick; 