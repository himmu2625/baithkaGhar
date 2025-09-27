import mongoose, { Schema, Document } from 'mongoose';

export interface IPlanType extends Document {
  code: 'EP' | 'CP' | 'MAP' | 'AP';
  name: string;
  description: string;
  inclusions: string[];
  sortOrder: number;
  isActive: boolean;
}

const PlanTypeSchema = new Schema<IPlanType>({
  code: {
    type: String,
    required: true,
    unique: true,
    enum: ['EP', 'CP', 'MAP', 'AP']
  },
  name: { type: String, required: true },
  description: { type: String, required: true },
  inclusions: [{ type: String }],
  sortOrder: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true }
});

export default mongoose.models.PlanType || mongoose.model<IPlanType>('PlanType', PlanTypeSchema);