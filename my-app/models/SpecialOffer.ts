import mongoose, { Schema, Document } from 'mongoose';
import { IProperty } from './Property';

export interface ISpecialOffer extends Document {
  title: string;
  subtitle?: string;
  description: string;
  label?: string; // e.g. '30% OFF', 'Limited Time'
  tag?: string; // e.g. 'Premium', 'Hot Deal'
  validUntil: Date;
  targetProperties: mongoose.Types.ObjectId[] | IProperty[];
  isActive: boolean;
  imageUrl: string;
  publicId: string;
  createdAt: Date;
  updatedAt: Date;
}

const SpecialOfferSchema = new Schema<ISpecialOffer>(
  {
    title: {
      type: String,
      required: [true, 'Offer title is required'],
      trim: true,
      maxlength: [100, 'Title cannot be more than 100 characters'],
    },
    subtitle: {
      type: String,
      trim: true,
      maxlength: [150, 'Subtitle cannot be more than 150 characters'],
    },
    description: {
      type: String,
      required: [true, 'Offer description is required'],
      maxlength: [500, 'Description cannot be more than 500 characters'],
    },
    label: {
      type: String,
      trim: true,
      maxlength: [50, 'Label cannot be more than 50 characters'],
    },
    tag: {
      type: String,
      trim: true,
      maxlength: [50, 'Tag cannot be more than 50 characters'],
    },
    validUntil: {
      type: Date,
      required: [true, 'Offer validity date is required'],
    },
    targetProperties: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Property',
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
    imageUrl: {
      type: String,
      required: [true, 'Offer image URL is required'],
    },
    publicId: {
      type: String,
      required: [true, 'Image public ID is required'],
    }
  },
  {
    timestamps: true,
    collection: 'special_offers',
  }
);

SpecialOfferSchema.index({ isActive: 1, validUntil: -1 });

const SpecialOffer = mongoose.models.SpecialOffer || mongoose.model<ISpecialOffer>('SpecialOffer', SpecialOfferSchema);

export default SpecialOffer; 