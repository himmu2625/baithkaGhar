import { NextRequest, NextResponse } from "next/server";
import { adminApiAuth } from "@/lib/admin-auth";
import dbConnect from "@/lib/db/dbConnect";
import Influencer from "@/models/Influencer";
import ReferralClick from "@/models/ReferralClick";
import Booking from "@/models/Booking";
import { z } from "zod";

// Validation schema for influencer creation
const influencerCreateSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  phone: z.string().optional(),
  platform: z.enum(['youtube', 'instagram', 'facebook', 'twitter', 'tiktok', 'blog', 'other']),
  handle: z.string().min(1).max(100),
  followerCount: z.number().min(0).optional(),
  niche: z.string().min(1),
  referralCode: z.string().min(4).max(20).optional(),
  commissionType: z.enum(['percentage', 'fixed']).default('percentage'),
  commissionRate: z.number().min(0),
  bankDetails: z.object({
    accountNumber: z.string().optional(),
    ifscCode: z.string().optional(),
    accountName: z.string().optional(),
    bankName: z.string().optional(),
  }).optional(),
  panNumber: z.string().optional(),
  gstNumber: z.string().optional(),
  address: z.object({
    street: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    pincode: z.string().optional(),
    country: z.string().default('India').optional(),
  }).optional(),
  notes: z.string().max(1000).optional(),
  tags: z.array(z.string()).optional(),
}).refine(data => {
  if (data.commissionType === 'percentage') {
    return data.commissionRate > 0 && data.commissionRate <= 50;
  }
  return data.commissionRate > 0;
}, {
  message: "Commission rate must be between 1-50% for percentage type or positive for fixed amount"
});

// GET - List influencers with filtering and pagination
export async function GET(request: NextRequest) {
  try {
    const session = await adminApiAuth(request);
    if (session instanceof NextResponse) return session;

    await dbConnect();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || 'all';
    const platform = searchParams.get('platform') || 'all';
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    // Build filter query
    const filter: any = {};
    
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { handle: { $regex: search, $options: 'i' } },
        { referralCode: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (status !== 'all') {
      filter.status = status;
    }
    
    if (platform !== 'all') {
      filter.platform = platform;
    }

    // Build sort object
    const sort: any = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Execute query with pagination
    const skip = (page - 1) * limit;
    
    const [influencers, total] = await Promise.all([
      Influencer.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .populate('createdBy', 'name email')
        .lean(),
      Influencer.countDocuments(filter)
    ]);

    // Calculate pagination info
    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return NextResponse.json({
      success: true,
      influencers,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage,
        hasPrevPage
      }
    });

  } catch (error) {
    console.error("Error fetching influencers:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch influencers" },
      { status: 500 }
    );
  }
}

// POST - Create new influencer
export async function POST(request: NextRequest) {
  try {
    const session = await adminApiAuth(request);
    if (session instanceof NextResponse) return session;

    await dbConnect();

    const body = await request.json();
    
    // Validate request data
    const validatedData = influencerCreateSchema.parse(body);

    // Check if referral code already exists
    if (validatedData.referralCode) {
      const existingInfluencer = await Influencer.findOne({ 
        referralCode: validatedData.referralCode.toUpperCase() 
      });
      if (existingInfluencer) {
        return NextResponse.json(
          { success: false, error: "Referral code already exists" },
          { status: 400 }
        );
      }
    }

    // Check if email already exists
    const existingEmail = await Influencer.findOne({ email: validatedData.email });
    if (existingEmail) {
      return NextResponse.json(
        { success: false, error: "Email already exists" },
        { status: 400 }
      );
    }

    // Create influencer
    const influencer = new Influencer({
      ...validatedData,
      referralCode: validatedData.referralCode?.toUpperCase(),
      createdBy: session.user.id,
      status: 'pending' // Start as pending for approval
    });

    await influencer.save();

    // Populate created by info for response
    await influencer.populate('createdBy', 'name email');

    return NextResponse.json({
      success: true,
      message: "Influencer created successfully",
      influencer
    }, { status: 201 });

  } catch (error) {
    console.error("Error creating influencer:", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Failed to create influencer" },
      { status: 500 }
    );
  }
} 