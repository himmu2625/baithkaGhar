import mongoose, { Document, Schema } from 'mongoose';

export interface TeamMemberSocial {
  linkedin?: string;
  twitter?: string;
  github?: string;
  website?: string;
  email?: string;
}

export interface TeamMember {
  name: string;
  role: string;
  department: string;
  bio: string;
  image: {
    url: string;
    public_id: string;
  };
  social: TeamMemberSocial;
  order: number;
  isActive: boolean;
  showOnAboutPage: boolean;
  joinedDate: Date;
  location: string;
  skills: string[];
  achievements: string[];
  education: string;
  experience: string;
}

export interface ITeamMember extends TeamMember, Document {}

const TeamMemberSchema = new Schema<ITeamMember>({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  role: {
    type: String,
    required: true,
    trim: true,
    enum: [
      'CEO',
      'Co-Founder',
      'CTO',
      'COO',
      'CFO',
      'VP Engineering',
      'VP Marketing',
      'VP Sales',
      'Head of Product',
      'Head of Design',
      'Head of Operations',
      'Senior Developer',
      'Developer',
      'Designer',
      'Marketing Manager',
      'Sales Manager',
      'Product Manager',
      'HR Manager',
      'Finance Manager',
      'Customer Success Manager',
      'Other'
    ],
  },
  department: {
    type: String,
    required: true,
    trim: true,
    enum: [
      'Executive',
      'Engineering',
      'Product',
      'Design',
      'Marketing',
      'Sales',
      'Operations',
      'Finance',
      'HR',
      'Customer Success',
      'Other'
    ],
  },
  bio: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500,
  },
  image: {
    url: {
      type: String,
      required: true,
    },
    public_id: {
      type: String,
      required: true,
    },
  },
  social: {
    linkedin: {
      type: String,
      trim: true,
      validate: {
        validator: function(v: string) {
          return !v || /^https:\/\/(www\.)?linkedin\.com\/in\/[a-zA-Z0-9-]+\/?$/.test(v);
        },
        message: 'Please enter a valid LinkedIn URL'
      }
    },
    twitter: {
      type: String,
      trim: true,
      validate: {
        validator: function(v: string) {
          return !v || /^https:\/\/(www\.)?twitter\.com\/[a-zA-Z0-9_]+\/?$/.test(v);
        },
        message: 'Please enter a valid Twitter URL'
      }
    },
    github: {
      type: String,
      trim: true,
      validate: {
        validator: function(v: string) {
          return !v || /^https:\/\/(www\.)?github\.com\/[a-zA-Z0-9-]+\/?$/.test(v);
        },
        message: 'Please enter a valid GitHub URL'
      }
    },
    website: {
      type: String,
      trim: true,
      validate: {
        validator: function(v: string) {
          return !v || /^https?:\/\/.+\..+/.test(v);
        },
        message: 'Please enter a valid website URL'
      }
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      validate: {
        validator: function(v: string) {
          return !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
        },
        message: 'Please enter a valid email address'
      }
    }
  },
  order: {
    type: Number,
    default: 0,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  showOnAboutPage: {
    type: Boolean,
    default: false,
  },
  joinedDate: {
    type: Date,
    default: Date.now,
  },
  location: {
    type: String,
    trim: true,
  },
  skills: [{
    type: String,
    trim: true,
  }],
  achievements: [{
    type: String,
    trim: true,
  }],
  education: {
    type: String,
    trim: true,
  },
  experience: {
    type: String,
    trim: true,
  },
}, {
  timestamps: true,
});

// Indexes for better performance
TeamMemberSchema.index({ order: 1 });
TeamMemberSchema.index({ isActive: 1 });
TeamMemberSchema.index({ showOnAboutPage: 1 });
TeamMemberSchema.index({ role: 1 });
TeamMemberSchema.index({ department: 1 });

// Virtual for years of experience calculation
TeamMemberSchema.virtual('yearsWithCompany').get(function() {
  const now = new Date();
  const joined = this.joinedDate;
  return Math.floor((now.getTime() - joined.getTime()) / (1000 * 60 * 60 * 24 * 365));
});

const TeamMemberModel = mongoose.models.TeamMember || mongoose.model<ITeamMember>('TeamMember', TeamMemberSchema);

export default TeamMemberModel; 