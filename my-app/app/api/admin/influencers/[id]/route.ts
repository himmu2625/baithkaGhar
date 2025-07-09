import { NextRequest, NextResponse } from "next/server";
import { adminApiAuth } from "@/lib/admin-auth";
import dbConnect from "@/lib/db/dbConnect";
import Influencer from "@/models/Influencer";
import ReferralClick from "@/models/ReferralClick";
import Booking from "@/models/Booking";
import Payout from "@/models/Payout";
import { z } from "zod";
import mongoose from "mongoose";

// Validation schema for influencer update
const influencerUpdateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  platform: z.enum(['youtube', 'instagram', 'facebook', 'twitter', 'tiktok', 'blog', 'other']).optional(),
  handle: z.string().min(1).max(100).optional(),
  followerCount: z.number().min(0).optional(),
  niche: z.string().min(1).optional(),
  commissionType: z.enum(['percentage', 'fixed']).optional(),
  commissionRate: z.number().min(0).optional(),
  status: z.enum(['pending', 'active', 'suspended', 'inactive']).optional(),
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
    country: z.string().optional(),
  }).optional(),
  notes: z.string().max(1000).optional(),
  tags: z.array(z.string()).optional(),
}).refine(data => {
  if (data.commissionType === 'percentage' && data.commissionRate) {
    return data.commissionRate > 0 && data.commissionRate <= 50;
  }
  if (data.commissionType === 'fixed' && data.commissionRate) {
    return data.commissionRate > 0;
  }
  return true;
}, {
  message: "Commission rate must be between 1-50% for percentage type or positive for fixed amount"
});

// GET - Get single influencer with detailed stats
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await adminApiAuth(request);
    if (session instanceof NextResponse) return session;

    await dbConnect();

    const { id } = params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: "Invalid influencer ID" },
        { status: 400 }
      );
    }

    // Get influencer with populated creator info
    const influencer = await Influencer.findById(id)
      .populate('createdBy', 'name email')
      .lean();

    if (!influencer) {
      return NextResponse.json(
        { success: false, error: "Influencer not found" },
        { status: 404 }
      );
    }

    // Get detailed statistics
    const [clicksCount, bookingsCount, totalRevenue, recentClicks, recentBookings, payoutsCount] = await Promise.all([
      ReferralClick.countDocuments({ influencerId: id }),
      Booking.countDocuments({ influencerId: id }),
      Booking.aggregate([
        { $match: { influencerId: new mongoose.Types.ObjectId(id) } },
        { $group: { _id: null, total: { $sum: "$totalPrice" } } }
      ]),
      ReferralClick.find({ influencerId: id })
        .sort({ clickedAt: -1 })
        .limit(10)
        .lean(),
      Booking.find({ influencerId: id })
        .sort({ createdAt: -1 })
        .limit(10)
        .populate('propertyId', 'name location')
        .populate('userId', 'name email')
        .lean(),
      Payout.countDocuments({ influencerId: id })
    ]);

    // Calculate additional metrics
    const conversionRate = clicksCount > 0 ? ((bookingsCount / clicksCount) * 100).toFixed(2) : '0';
    const avgBookingValue = bookingsCount > 0 ? (totalRevenue[0]?.total || 0) / bookingsCount : 0;

    return NextResponse.json({
      success: true,
      influencer: {
        ...influencer,
        stats: {
          totalClicks: clicksCount,
          totalBookings: bookingsCount,
          totalRevenue: totalRevenue[0]?.total || 0,
          conversionRate: parseFloat(conversionRate),
          avgBookingValue: Math.round(avgBookingValue),
          totalPayouts: payoutsCount
        },
        recentActivity: {
          clicks: recentClicks,
          bookings: recentBookings
        }
      }
    });

  } catch (error) {
    console.error("Error fetching influencer:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch influencer" },
      { status: 500 }
    );
  }
}

// PATCH - Update influencer
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await adminApiAuth(request);
    if (session instanceof NextResponse) return session;

    await dbConnect();

    const { id } = params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: "Invalid influencer ID" },
        { status: 400 }
      );
    }

    const body = await request.json();
    
    // Validate request data
    const validatedData = influencerUpdateSchema.parse(body);

    // Check if influencer exists
    const existingInfluencer = await Influencer.findById(id);
    if (!existingInfluencer) {
      return NextResponse.json(
        { success: false, error: "Influencer not found" },
        { status: 404 }
      );
    }

    // Check if email is being changed and if new email exists
    if (validatedData.email && validatedData.email !== existingInfluencer.email) {
      const emailExists = await Influencer.findOne({ 
        email: validatedData.email,
        _id: { $ne: id }
      });
      if (emailExists) {
        return NextResponse.json(
          { success: false, error: "Email already exists" },
          { status: 400 }
        );
      }
    }

    // Update influencer
    const updatedInfluencer = await Influencer.findByIdAndUpdate(
      id,
      { 
        ...validatedData,
        updatedAt: new Date()
      },
      { new: true, runValidators: true }
    ).populate('createdBy', 'name email');

    // Update activity timestamp if status changed to active
    if (validatedData.status === 'active') {
      await updatedInfluencer?.updateActivity();
    }

    return NextResponse.json({
      success: true,
      message: "Influencer updated successfully",
      influencer: updatedInfluencer
    });

  } catch (error) {
    console.error("Error updating influencer:", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Failed to update influencer" },
      { status: 500 }
    );
  }
}

// DELETE - Delete influencer (soft delete by setting status to inactive)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await adminApiAuth(request);
    if (session instanceof NextResponse) return session;

    await dbConnect();

    const { id } = params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: "Invalid influencer ID" },
        { status: 400 }
      );
    }

    // Check if influencer exists
    const influencer = await Influencer.findById(id);
    if (!influencer) {
      return NextResponse.json(
        { success: false, error: "Influencer not found" },
        { status: 404 }
      );
    }

    // Check if influencer has active bookings or pending payouts
    const [activeBookings, pendingPayouts] = await Promise.all([
      Booking.countDocuments({ 
        influencerId: id, 
        commissionPaid: false 
      }),
      Payout.countDocuments({ 
        influencerId: id, 
        status: { $in: ['pending', 'processing'] } 
      })
    ]);

    if (activeBookings > 0 || pendingPayouts > 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Cannot delete influencer with ${activeBookings} unpaid bookings and ${pendingPayouts} pending payouts. Please settle all payments first.` 
        },
        { status: 400 }
      );
    }

    // Soft delete by setting status to inactive
    await Influencer.findByIdAndUpdate(id, { 
      status: 'inactive',
      updatedAt: new Date()
    });

    return NextResponse.json({
      success: true,
      message: "Influencer deleted successfully"
    });

  } catch (error) {
    console.error("Error deleting influencer:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete influencer" },
      { status: 500 }
    );
  }
} 