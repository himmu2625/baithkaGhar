import mongoose, { Schema, Document } from 'mongoose';

export interface IGuest extends Document {
  // Basic Information
  personalInfo: {
    firstName: string;
    lastName: string;
    fullName: string;
    dateOfBirth?: Date;
    gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say';
    nationality: string;
    occupation?: string;
    title?: 'Mr' | 'Mrs' | 'Ms' | 'Dr' | 'Prof' | 'Other';
  };
  
  // Contact Information
  contactInfo: {
    email: string;
    phone: string;
    alternatePhone?: string;
    whatsapp?: string;
    preferredContactMethod: 'email' | 'phone' | 'whatsapp' | 'sms';
  };
  
  // Address Information
  address: {
    street?: string;
    city?: string;
    state?: string;
    country: string;
    zipCode?: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  
  // Emergency Contact
  emergencyContact?: {
    name: string;
    relationship: string;
    phone: string;
    email?: string;
  };
  
  // Identification Documents
  identification: {
    primaryId: {
      type: 'passport' | 'drivers_license' | 'national_id' | 'aadhar' | 'pan' | 'voter_id' | 'other';
      number: string;
      issuingCountry: string;
      expiryDate?: Date;
      documentUrl?: string;
      verified: boolean;
      verifiedAt?: Date;
      verifiedBy?: mongoose.Types.ObjectId;
    };
    secondaryId?: {
      type: string;
      number: string;
      issuingCountry: string;
      expiryDate?: Date;
      documentUrl?: string;
    };
  };
  
  // Preferences
  preferences: {
    // Room Preferences
    roomType?: string;
    bedType?: 'single' | 'double' | 'queen' | 'king' | 'twin';
    smokingPreference: 'non_smoking' | 'smoking' | 'no_preference';
    floorPreference?: 'low' | 'high' | 'middle' | 'no_preference';
    viewPreference?: string[];
    accessibilityNeeds: string[];
    
    // Dietary Preferences
    dietaryRestrictions: string[];
    foodAllergies: string[];
    
    // Communication Preferences
    language: string;
    communicationFrequency: 'minimal' | 'standard' | 'frequent';
    marketingOptIn: boolean;
    
    // Special Requests
    quietRoom: boolean;
    petFriendly: boolean;
    businessFacilities: boolean;
    fitnessAccess: boolean;
    spaServices: boolean;
  };
  
  // Travel Information
  travelDetails: {
    purposeOfTravel?: 'leisure' | 'business' | 'medical' | 'educational' | 'other';
    travelFrequency?: 'first_time' | 'occasional' | 'frequent' | 'regular';
    groupType?: 'solo' | 'couple' | 'family' | 'friends' | 'business' | 'other';
    arrivalTransport?: 'flight' | 'train' | 'bus' | 'car' | 'taxi' | 'other';
    departureTransport?: 'flight' | 'train' | 'bus' | 'car' | 'taxi' | 'other';
  };
  
  // Loyalty and Membership
  loyalty: {
    membershipTier: 'bronze' | 'silver' | 'gold' | 'platinum' | 'none';
    loyaltyPoints: number;
    memberSince?: Date;
    lifetimeValue: number;
    referralCode?: string;
    referredBy?: mongoose.Types.ObjectId;
  };
  
  // Booking History Summary
  bookingHistory: {
    totalBookings: number;
    successfulBookings: number;
    cancelledBookings: number;
    noShowCount: number;
    lastBookingDate?: Date;
    favoriteProperties: mongoose.Types.ObjectId[];
    averageSpend: number;
    preferredSeasons: string[];
  };
  
  // Behavioral Data
  behavior: {
    bookingPattern: 'early_planner' | 'last_minute' | 'seasonal' | 'spontaneous';
    priceSegment: 'budget' | 'mid_range' | 'luxury' | 'ultra_luxury';
    stayDuration: 'short_stay' | 'medium_stay' | 'long_stay' | 'extended_stay';
    bookingChannel: 'direct' | 'ota' | 'travel_agent' | 'social_media' | 'referral';
    deviceUsage: 'mobile' | 'desktop' | 'tablet' | 'mixed';
  };
  
  // Reviews and Ratings
  reviewProfile: {
    averageRatingGiven: number;
    totalReviewsWritten: number;
    averageRatingReceived: number; // As a guest
    helpfulReviews: number;
    lastReviewDate?: Date;
    reviewingBehavior: 'frequent' | 'occasional' | 'rare' | 'never';
  };
  
  // Special Needs and Accommodations
  specialNeeds: {
    medicalConditions: string[];
    medicationRequirements: string[];
    mobilityAssistance: boolean;
    visualImpairment: boolean;
    hearingImpairment: boolean;
    serviceDog: boolean;
    allergyAlerts: string[];
    emergencyMedicalInfo?: string;
  };
  
  // Payment Information
  paymentProfile: {
    preferredPaymentMethod: 'credit_card' | 'debit_card' | 'digital_wallet' | 'bank_transfer' | 'cash';
    creditRating?: 'excellent' | 'good' | 'fair' | 'poor';
    paymentReliability: number; // 1-100 score
    chargebackHistory: number;
    refundRequests: number;
  };
  
  // Social Media and Digital Presence
  socialMedia?: {
    facebookProfile?: string;
    instagramHandle?: string;
    twitterHandle?: string;
    linkedinProfile?: string;
    influencerStatus: boolean;
    followersCount?: number;
    socialVerified: boolean;
  };
  
  // Privacy and Security
  privacy: {
    dataProcessingConsent: boolean;
    marketingConsent: boolean;
    dataSharingConsent: boolean;
    consentGivenAt: Date;
    privacyPreferences: {
      shareWithPartners: boolean;
      personalizedOffers: boolean;
      locationTracking: boolean;
      behaviorTracking: boolean;
    };
  };
  
  // Risk Assessment
  riskProfile: {
    riskScore: number; // 1-100
    riskFactors: string[];
    fraudAlerts: number;
    verificationStatus: 'unverified' | 'partial' | 'verified' | 'flagged';
    blacklisted: boolean;
    blacklistReason?: string;
    trustScore: number; // 1-100
  };
  
  // Guest Services History
  serviceHistory: {
    complaintsCount: number;
    complimentsCount: number;
    serviceRequests: number;
    resolutionSatisfaction: number; // Average 1-5
    responseTimeExpectation: 'immediate' | 'same_day' | 'next_day' | 'flexible';
  };
  
  // Communication Logs
  communicationLog: [{
    type: 'email' | 'phone' | 'sms' | 'whatsapp' | 'in_person' | 'chat';
    direction: 'inbound' | 'outbound';
    subject?: string;
    summary: string;
    sentBy: mongoose.Types.ObjectId;
    sentAt: Date;
    response?: string;
    responseAt?: Date;
    status: 'sent' | 'delivered' | 'read' | 'responded' | 'failed';
  }];
  
  // Tags and Classifications
  tags: string[];
  classification: string[];
  
  // System Fields
  isActive: boolean;
  isVip: boolean;
  isBanned: boolean;
  banReason?: string;
  bannedAt?: Date;
  bannedBy?: mongoose.Types.ObjectId;
  
  // Audit Trail
  createdBy: mongoose.Types.ObjectId;
  lastModifiedBy: mongoose.Types.ObjectId;
  lastLoginAt?: Date;
  lastActivityAt?: Date;
  
  createdAt: Date;
  updatedAt: Date;
}

const GuestSchema = new Schema<IGuest>({
  personalInfo: {
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    fullName: { type: String, required: true, trim: true },
    dateOfBirth: { type: Date },
    gender: { type: String, enum: ['male', 'female', 'other', 'prefer_not_to_say'] },
    nationality: { type: String, required: true },
    occupation: { type: String, trim: true },
    title: { type: String, enum: ['Mr', 'Mrs', 'Ms', 'Dr', 'Prof', 'Other'] }
  },
  
  contactInfo: {
    email: { 
      type: String, 
      required: true, 
      lowercase: true,
      trim: true,
      unique: true 
    },
    phone: { type: String, required: true },
    alternatePhone: { type: String },
    whatsapp: { type: String },
    preferredContactMethod: { 
      type: String, 
      enum: ['email', 'phone', 'whatsapp', 'sms'],
      default: 'email' 
    }
  },
  
  address: {
    street: { type: String },
    city: { type: String },
    state: { type: String },
    country: { type: String, required: true },
    zipCode: { type: String },
    coordinates: {
      lat: { type: Number },
      lng: { type: Number }
    }
  },
  
  emergencyContact: {
    name: { type: String },
    relationship: { type: String },
    phone: { type: String },
    email: { type: String }
  },
  
  identification: {
    primaryId: {
      type: { 
        type: String, 
        enum: ['passport', 'drivers_license', 'national_id', 'aadhar', 'pan', 'voter_id', 'other'],
        required: true 
      },
      number: { type: String, required: true },
      issuingCountry: { type: String, required: true },
      expiryDate: { type: Date },
      documentUrl: { type: String },
      verified: { type: Boolean, default: false },
      verifiedAt: { type: Date },
      verifiedBy: { type: Schema.Types.ObjectId, ref: 'User' }
    },
    secondaryId: {
      type: { type: String },
      number: { type: String },
      issuingCountry: { type: String },
      expiryDate: { type: Date },
      documentUrl: { type: String }
    }
  },
  
  preferences: {
    roomType: { type: String },
    bedType: { type: String, enum: ['single', 'double', 'queen', 'king', 'twin'] },
    smokingPreference: { 
      type: String, 
      enum: ['non_smoking', 'smoking', 'no_preference'],
      default: 'non_smoking' 
    },
    floorPreference: { type: String, enum: ['low', 'high', 'middle', 'no_preference'] },
    viewPreference: [{ type: String }],
    accessibilityNeeds: [{ type: String }],
    dietaryRestrictions: [{ type: String }],
    foodAllergies: [{ type: String }],
    language: { type: String, default: 'English' },
    communicationFrequency: { 
      type: String, 
      enum: ['minimal', 'standard', 'frequent'],
      default: 'standard' 
    },
    marketingOptIn: { type: Boolean, default: false },
    quietRoom: { type: Boolean, default: false },
    petFriendly: { type: Boolean, default: false },
    businessFacilities: { type: Boolean, default: false },
    fitnessAccess: { type: Boolean, default: false },
    spaServices: { type: Boolean, default: false }
  },
  
  travelDetails: {
    purposeOfTravel: { type: String, enum: ['leisure', 'business', 'medical', 'educational', 'other'] },
    travelFrequency: { type: String, enum: ['first_time', 'occasional', 'frequent', 'regular'] },
    groupType: { type: String, enum: ['solo', 'couple', 'family', 'friends', 'business', 'other'] },
    arrivalTransport: { type: String, enum: ['flight', 'train', 'bus', 'car', 'taxi', 'other'] },
    departureTransport: { type: String, enum: ['flight', 'train', 'bus', 'car', 'taxi', 'other'] }
  },
  
  loyalty: {
    membershipTier: { 
      type: String, 
      enum: ['bronze', 'silver', 'gold', 'platinum', 'none'],
      default: 'bronze' 
    },
    loyaltyPoints: { type: Number, default: 0, min: 0 },
    memberSince: { type: Date },
    lifetimeValue: { type: Number, default: 0, min: 0 },
    referralCode: { type: String, unique: true, sparse: true },
    referredBy: { type: Schema.Types.ObjectId, ref: 'Guest' }
  },
  
  bookingHistory: {
    totalBookings: { type: Number, default: 0, min: 0 },
    successfulBookings: { type: Number, default: 0, min: 0 },
    cancelledBookings: { type: Number, default: 0, min: 0 },
    noShowCount: { type: Number, default: 0, min: 0 },
    lastBookingDate: { type: Date },
    favoriteProperties: [{ type: Schema.Types.ObjectId, ref: 'Property' }],
    averageSpend: { type: Number, default: 0, min: 0 },
    preferredSeasons: [{ type: String }]
  },
  
  behavior: {
    bookingPattern: { type: String, enum: ['early_planner', 'last_minute', 'seasonal', 'spontaneous'] },
    priceSegment: { type: String, enum: ['budget', 'mid_range', 'luxury', 'ultra_luxury'] },
    stayDuration: { type: String, enum: ['short_stay', 'medium_stay', 'long_stay', 'extended_stay'] },
    bookingChannel: { type: String, enum: ['direct', 'ota', 'travel_agent', 'social_media', 'referral'] },
    deviceUsage: { type: String, enum: ['mobile', 'desktop', 'tablet', 'mixed'] }
  },
  
  reviewProfile: {
    averageRatingGiven: { type: Number, default: 0, min: 0, max: 5 },
    totalReviewsWritten: { type: Number, default: 0, min: 0 },
    averageRatingReceived: { type: Number, default: 0, min: 0, max: 5 },
    helpfulReviews: { type: Number, default: 0, min: 0 },
    lastReviewDate: { type: Date },
    reviewingBehavior: { type: String, enum: ['frequent', 'occasional', 'rare', 'never'] }
  },
  
  specialNeeds: {
    medicalConditions: [{ type: String }],
    medicationRequirements: [{ type: String }],
    mobilityAssistance: { type: Boolean, default: false },
    visualImpairment: { type: Boolean, default: false },
    hearingImpairment: { type: Boolean, default: false },
    serviceDog: { type: Boolean, default: false },
    allergyAlerts: [{ type: String }],
    emergencyMedicalInfo: { type: String }
  },
  
  paymentProfile: {
    preferredPaymentMethod: { 
      type: String, 
      enum: ['credit_card', 'debit_card', 'digital_wallet', 'bank_transfer', 'cash'],
      default: 'credit_card' 
    },
    creditRating: { type: String, enum: ['excellent', 'good', 'fair', 'poor'] },
    paymentReliability: { type: Number, default: 100, min: 0, max: 100 },
    chargebackHistory: { type: Number, default: 0, min: 0 },
    refundRequests: { type: Number, default: 0, min: 0 }
  },
  
  socialMedia: {
    facebookProfile: { type: String },
    instagramHandle: { type: String },
    twitterHandle: { type: String },
    linkedinProfile: { type: String },
    influencerStatus: { type: Boolean, default: false },
    followersCount: { type: Number, min: 0 },
    socialVerified: { type: Boolean, default: false }
  },
  
  privacy: {
    dataProcessingConsent: { type: Boolean, required: true },
    marketingConsent: { type: Boolean, default: false },
    dataSharingConsent: { type: Boolean, default: false },
    consentGivenAt: { type: Date, required: true },
    privacyPreferences: {
      shareWithPartners: { type: Boolean, default: false },
      personalizedOffers: { type: Boolean, default: true },
      locationTracking: { type: Boolean, default: false },
      behaviorTracking: { type: Boolean, default: true }
    }
  },
  
  riskProfile: {
    riskScore: { type: Number, default: 50, min: 1, max: 100 },
    riskFactors: [{ type: String }],
    fraudAlerts: { type: Number, default: 0, min: 0 },
    verificationStatus: { 
      type: String, 
      enum: ['unverified', 'partial', 'verified', 'flagged'],
      default: 'unverified' 
    },
    blacklisted: { type: Boolean, default: false },
    blacklistReason: { type: String },
    trustScore: { type: Number, default: 50, min: 1, max: 100 }
  },
  
  serviceHistory: {
    complaintsCount: { type: Number, default: 0, min: 0 },
    complimentsCount: { type: Number, default: 0, min: 0 },
    serviceRequests: { type: Number, default: 0, min: 0 },
    resolutionSatisfaction: { type: Number, default: 3, min: 1, max: 5 },
    responseTimeExpectation: { 
      type: String, 
      enum: ['immediate', 'same_day', 'next_day', 'flexible'],
      default: 'same_day' 
    }
  },
  
  communicationLog: [{
    type: { 
      type: String, 
      enum: ['email', 'phone', 'sms', 'whatsapp', 'in_person', 'chat'],
      required: true 
    },
    direction: { type: String, enum: ['inbound', 'outbound'], required: true },
    subject: { type: String },
    summary: { type: String, required: true },
    sentBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    sentAt: { type: Date, default: Date.now },
    response: { type: String },
    responseAt: { type: Date },
    status: { 
      type: String, 
      enum: ['sent', 'delivered', 'read', 'responded', 'failed'],
      default: 'sent' 
    }
  }],
  
  tags: [{ type: String, lowercase: true }],
  classification: [{ type: String }],
  
  isActive: { type: Boolean, default: true },
  isVip: { type: Boolean, default: false },
  isBanned: { type: Boolean, default: false },
  banReason: { type: String },
  bannedAt: { type: Date },
  bannedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  lastModifiedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  lastLoginAt: { type: Date },
  lastActivityAt: { type: Date, default: Date.now }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
GuestSchema.index({ 'contactInfo.email': 1 });
GuestSchema.index({ 'contactInfo.phone': 1 });
GuestSchema.index({ 'personalInfo.fullName': 1 });
GuestSchema.index({ 'loyalty.membershipTier': 1 });
GuestSchema.index({ 'riskProfile.verificationStatus': 1 });
GuestSchema.index({ isActive: 1 });
GuestSchema.index({ isVip: 1 });
GuestSchema.index({ 'loyalty.loyaltyPoints': -1 });

// Compound indexes
GuestSchema.index({ 'contactInfo.email': 1, isActive: 1 });
GuestSchema.index({ 'riskProfile.blacklisted': 1, isActive: 1 });

// Text search index
GuestSchema.index({ 
  'personalInfo.fullName': 'text',
  'contactInfo.email': 'text',
  'contactInfo.phone': 'text',
  tags: 'text'
});

// Pre-save middleware
GuestSchema.pre('save', function(next) {
  // Generate full name
  this.personalInfo.fullName = `${this.personalInfo.firstName} ${this.personalInfo.lastName}`;
  
  // Update last activity
  this.lastActivityAt = new Date();
  
  // Generate referral code if VIP and doesn't exist
  if (this.isVip && !this.loyalty.referralCode) {
    this.loyalty.referralCode = `REF${this.personalInfo.firstName.slice(0,2)}${Date.now().toString().slice(-6)}`.toUpperCase();
  }
  
  next();
});

// Virtual for age
GuestSchema.virtual('age').get(function() {
  if (this.personalInfo.dateOfBirth) {
    const today = new Date();
    const birthDate = new Date(this.personalInfo.dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  }
  return null;
});

// Virtual for guest score
GuestSchema.virtual('guestScore').get(function() {
  const loyaltyWeight = 0.3;
  const trustWeight = 0.4;
  const activityWeight = 0.3;
  
  const loyaltyScore = Math.min(this.loyalty.loyaltyPoints / 1000 * 100, 100);
  const trustScore = this.riskProfile.trustScore;
  const activityScore = Math.min(this.bookingHistory.totalBookings * 10, 100);
  
  return Math.round(
    (loyaltyScore * loyaltyWeight) + 
    (trustScore * trustWeight) + 
    (activityScore * activityWeight)
  );
});

// Methods
GuestSchema.methods.addLoyaltyPoints = function(points: number) {
  this.loyalty.loyaltyPoints += points;
  
  // Update tier based on points
  if (this.loyalty.loyaltyPoints >= 10000) {
    this.loyalty.membershipTier = 'platinum';
  } else if (this.loyalty.loyaltyPoints >= 5000) {
    this.loyalty.membershipTier = 'gold';
  } else if (this.loyalty.loyaltyPoints >= 2000) {
    this.loyalty.membershipTier = 'silver';
  } else {
    this.loyalty.membershipTier = 'bronze';
  }
  
  return this.save();
};

GuestSchema.methods.updateRiskScore = function() {
  let score = 50; // Base score
  
  // Positive factors
  if (this.identification.primaryId.verified) score += 10;
  if (this.bookingHistory.successfulBookings > 5) score += 15;
  if (this.paymentProfile.paymentReliability > 80) score += 10;
  if (this.reviewProfile.averageRatingReceived > 4) score += 10;
  
  // Negative factors
  if (this.bookingHistory.noShowCount > 2) score -= 20;
  if (this.serviceHistory.complaintsCount > 3) score -= 15;
  if (this.paymentProfile.chargebackHistory > 0) score -= 25;
  if (this.riskProfile.fraudAlerts > 0) score -= 30;
  
  this.riskProfile.riskScore = Math.max(1, Math.min(100, score));
  return this.save();
};

// Static methods
GuestSchema.statics.findByEmail = function(email: string) {
  return this.findOne({ 'contactInfo.email': email.toLowerCase(), isActive: true });
};

GuestSchema.statics.findByPhone = function(phone: string) {
  return this.findOne({ 'contactInfo.phone': phone, isActive: true });
};

GuestSchema.statics.getVipGuests = function() {
  return this.find({ isVip: true, isActive: true }).sort({ 'loyalty.loyaltyPoints': -1 });
};

GuestSchema.statics.getRiskyGuests = function() {
  return this.find({ 
    'riskProfile.riskScore': { $lt: 30 },
    isActive: true 
  }).sort({ 'riskProfile.riskScore': 1 });
};

export default mongoose.models.Guest || mongoose.model<IGuest>('Guest', GuestSchema);