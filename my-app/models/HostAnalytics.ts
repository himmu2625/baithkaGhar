import mongoose, { Schema, Document } from "mongoose";

export interface IHostAnalytics extends Document {
  propertyId: mongoose.Types.ObjectId;
  hostId: mongoose.Types.ObjectId;
  viewStats: {
    daily: { date: Date; count: number }[];
    totalViews: number;
    uniqueViews: number;
  };
  bookingStats: {
    total: number;
    conversionRate: number;
    averageStayLength: number;
  };
  revenueStats: {
    total: number;
    projected: number;
    byMonth: { month: string; amount: number }[];
  };
  priceHistory: {
    date: Date;
    basePrice: number;
    finalPrice: number;
    factors: {
      seasonality: number;
      demand: number;
      events: number;
      competitors: number;
    };
  }[];
  performanceScore: number;
  lastUpdated: Date;
}

const HostAnalyticsSchema = new Schema<IHostAnalytics>({
  propertyId: { type: Schema.Types.ObjectId, ref: "Property", required: true },
  hostId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  viewStats: {
    daily: [{ 
      date: { type: Date },
      count: { type: Number, default: 0 }
    }],
    totalViews: { type: Number, default: 0 },
    uniqueViews: { type: Number, default: 0 }
  },
  bookingStats: {
    total: { type: Number, default: 0 },
    conversionRate: { type: Number, default: 0 },
    averageStayLength: { type: Number, default: 0 }
  },
  revenueStats: {
    total: { type: Number, default: 0 },
    projected: { type: Number, default: 0 },
    byMonth: [{ 
      month: String,
      amount: Number 
    }]
  },
  priceHistory: [{
    date: { type: Date },
    basePrice: { type: Number },
    finalPrice: { type: Number },
    factors: {
      seasonality: Number,
      demand: Number,
      events: Number,
      competitors: Number
    }
  }],
  performanceScore: { type: Number, default: 0 },
  lastUpdated: { type: Date, default: Date.now }
}, { timestamps: true });

// Create compound index for efficient queries
HostAnalyticsSchema.index({ propertyId: 1, hostId: 1 });

export default mongoose.models.HostAnalytics || 
  mongoose.model<IHostAnalytics>("HostAnalytics", HostAnalyticsSchema); 