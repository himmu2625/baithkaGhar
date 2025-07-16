import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db/dbConnect';
// @ts-ignore
import InfluencerApplication from '@/models/InfluencerApplication';
import { z } from 'zod';

// Validation schema
const applicationSchema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  socialLinks: z.object({
    instagram: z.string().url('Invalid Instagram URL').optional().or(z.literal('')),
    youtube: z.string().url('Invalid YouTube URL').optional().or(z.literal('')),
    tiktok: z.string().url('Invalid TikTok URL').optional().or(z.literal('')),
    facebook: z.string().url('Invalid Facebook URL').optional().or(z.literal('')),
    twitter: z.string().url('Invalid Twitter URL').optional().or(z.literal('')),
    blog: z.string().url('Invalid Blog URL').optional().or(z.literal('')),
    other: z.string().optional()
  }),
  followerCount: z.number().min(0, 'Follower count must be positive'),
  primaryPlatform: z.enum(['instagram', 'youtube', 'tiktok', 'facebook', 'twitter', 'blog', 'other']),
  collaborationType: z.enum(['paid', 'barter', 'affiliate', 'mixed']),
  profileImage: z.string().optional(),
  bio: z.string().max(500, 'Bio must be less than 500 characters').optional(),
  motivation: z.string().max(1000, 'Motivation must be less than 1000 characters').optional(),
  niche: z.string().max(100, 'Niche must be less than 100 characters').optional(),
  location: z.object({
    city: z.string().optional(),
    state: z.string().optional(),
    country: z.string().default('India')
  }).optional(),
  averageEngagement: z.number().min(0).max(100).optional(),
  previousBrandCollabs: z.string().max(500).optional(),
  utmSource: z.string().optional(),
  utmMedium: z.string().optional(),
  utmCampaign: z.string().optional()
});

export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const body = await request.json();
    
    // Validate input data
    const validatedData = applicationSchema.parse(body);

    // Check for existing application with same email
    const existingApplication = await InfluencerApplication.findOne({ email: validatedData.email });
    if (existingApplication) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'An application with this email already exists',
          existingStatus: existingApplication.status
        },
        { status: 409 }
      );
    }

    // Get client IP and user agent for tracking
    const clientIP = request.headers.get('x-forwarded-for') || 
                    request.headers.get('x-real-ip') || 
                    'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // Create new application
    const application = new InfluencerApplication({
      ...validatedData,
      ipAddress: clientIP,
      userAgent: userAgent
    });

    await application.save();

    // Send response without sensitive data
    const responseData = {
      id: application._id,
      fullName: application.fullName,
      email: application.email,
      status: application.status,
      submittedAt: application.submittedAt
    };

    return NextResponse.json({
      success: true,
      message: 'Application submitted successfully! We will review your application and get back to you within 3-5 business days.',
      data: responseData
    }, { status: 201 });

  } catch (error) {
    console.error('Error submitting influencer application:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Validation failed',
        details: error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }))
      }, { status: 400 });
    }

    return NextResponse.json({
      success: false,
      error: 'Failed to submit application. Please try again.'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json({
        success: false,
        error: 'Email parameter is required'
      }, { status: 400 });
    }

    await dbConnect();

    const application = await InfluencerApplication.findOne({ email: email });
    
    if (!application) {
      return NextResponse.json({
        success: false,
        error: 'No application found with this email'
      }, { status: 404 });
    }

    // Return public fields only
    const responseData = {
      id: application._id,
      fullName: application.fullName,
      email: application.email,
      status: application.status,
      submittedAt: application.submittedAt,
      reviewedAt: application.reviewedAt
    };

    return NextResponse.json({
      success: true,
      data: responseData
    });

  } catch (error) {
    console.error('Error fetching application status:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch application status'
    }, { status: 500 });
  }
} 