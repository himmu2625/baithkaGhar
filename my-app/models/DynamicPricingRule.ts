import mongoose, { Schema, Document } from 'mongoose';

export interface IDynamicPricingRule extends Document {
  propertyId: mongoose.Types.ObjectId;
  name: string;
  type: 'multiplier' | 'fixed_amount' | 'percentage';
  ruleType: 'weekend' | 'seasonal' | 'last_minute' | 'peak_period' | 'custom';
  condition: {
    dayOfWeek?: number[]; // 0-6 (Sun-Sat)
    dateRange?: {
      start: Date;
      end: Date;
    };
    daysBeforeCheckIn?: number;
    minStayNights?: number;
  };
  adjustment: {
    EP?: number;
    CP?: number;
    MAP?: number;
    AP?: number;
  };
  isActive: boolean;
  priority: number; // Higher priority rules apply first
  createdAt: Date;
  updatedAt: Date;
}

const DynamicPricingRuleSchema = new Schema<IDynamicPricingRule>({
  propertyId: {
    type: Schema.Types.ObjectId,
    ref: 'Property',
    required: true,
    index: true
  },
  name: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['multiplier', 'fixed_amount', 'percentage'],
    required: true
  },
  ruleType: {
    type: String,
    enum: ['weekend', 'seasonal', 'last_minute', 'peak_period', 'custom'],
    required: true
  },
  condition: {
    dayOfWeek: [{
      type: Number,
      min: 0,
      max: 6
    }],
    dateRange: {
      start: Date,
      end: Date
    },
    daysBeforeCheckIn: Number,
    minStayNights: Number
  },
  adjustment: {
    EP: { type: Number, default: 1 },
    CP: { type: Number, default: 1 },
    MAP: { type: Number, default: 1 },
    AP: { type: Number, default: 1 }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  priority: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update timestamp on save
DynamicPricingRuleSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Index for efficient querying
DynamicPricingRuleSchema.index({ propertyId: 1, isActive: 1 });
DynamicPricingRuleSchema.index({ propertyId: 1, priority: -1 });

export default mongoose.models.DynamicPricingRule ||
  mongoose.model<IDynamicPricingRule>('DynamicPricingRule', DynamicPricingRuleSchema);
