import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/get-session";
import dbConnect from "@/lib/db/dbConnect";
import Coupon from "@/models/Coupon";
import CouponUsage from "@/models/CouponUsage";
import { z } from "zod";

// Validation schema for coupon update
const couponUpdateSchema = z.object({
  code: z.string().min(3).max(20).transform(val => val.toUpperCase()).optional(),
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  type: z.enum(["percentage", "fixed_amount"]).optional(),
  value: z.number().min(0).optional(),
  minOrderAmount: z.number().min(0).optional(),
  maxDiscountAmount: z.number().min(0).optional(),
  usageLimit: z.number().min(1).optional(),
  userUsageLimit: z.number().min(1).optional(),
  isActive: z.boolean().optional(),
  validFrom: z.string().datetime().optional(),
  validTo: z.string().datetime().optional(),
  applicableFor: z.enum(["all", "specific_properties", "specific_users"]).optional(),
}).refine(data => {
  if (data.type === "percentage" && data.value && (data.value <= 0 || data.value > 100)) {
    return false;
  }
  if (data.type === "fixed_amount" && data.value && data.value <= 0) {
    return false;
  }
  if (data.validFrom && data.validTo && new Date(data.validTo) <= new Date(data.validFrom)) {
    return false;
  }
  return true;
}, {
  message: "Invalid coupon data: check percentage value (1-100), fixed amount (>0), and date range"
});

// GET - Fetch single coupon with usage stats
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    
    if (!session || !["admin", "super_admin"].includes(session.user?.role || "")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    const coupon = await Coupon.findById(params.id)
      .populate("createdBy", "name email")
      .populate("applicableProperties", "title")
      .populate("applicableUsers", "name email");

    if (!coupon) {
      return NextResponse.json({ error: "Coupon not found" }, { status: 404 });
    }

    // Get usage statistics
    const usageStats = await CouponUsage.aggregate([
      { $match: { couponId: coupon._id } },
      {
        $group: {
          _id: null,
          totalUsage: { $sum: 1 },
          totalDiscountGiven: { $sum: "$discountAmount" },
          totalRevenueLoss: { $sum: "$discountAmount" },
          avgDiscountAmount: { $avg: "$discountAmount" },
          uniqueUsers: { $addToSet: "$userId" }
        }
      }
    ]);

    const stats = usageStats[0] || {
      totalUsage: 0,
      totalDiscountGiven: 0,
      totalRevenueLoss: 0,
      avgDiscountAmount: 0,
      uniqueUsers: []
    };

    return NextResponse.json({
      success: true,
      coupon,
      stats: {
        ...stats,
        uniqueUserCount: stats.uniqueUsers.length
      }
    });

  } catch (error) {
    console.error("Error fetching coupon:", error);
    return NextResponse.json(
      { error: "Failed to fetch coupon" },
      { status: 500 }
    );
  }
}

// PUT - Update coupon
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    
    if (!session || !["admin", "super_admin"].includes(session.user?.role || "")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    const body = await request.json();
    
    // Validate request data
    const validatedData = couponUpdateSchema.parse(body);

    // Check if coupon exists
    const existingCoupon = await Coupon.findById(params.id);
    if (!existingCoupon) {
      return NextResponse.json({ error: "Coupon not found" }, { status: 404 });
    }

    // If updating code, check for duplicates
    if (validatedData.code && validatedData.code !== existingCoupon.code) {
      const duplicateCoupon = await Coupon.findOne({ 
        code: validatedData.code,
        _id: { $ne: params.id }
      });
      if (duplicateCoupon) {
        return NextResponse.json(
          { error: "Coupon code already exists" },
          { status: 400 }
        );
      }
    }

    // Prepare update data
    const updateData: any = { ...validatedData };
    if (validatedData.validFrom) updateData.validFrom = new Date(validatedData.validFrom);
    if (validatedData.validTo) updateData.validTo = new Date(validatedData.validTo);

    // Update coupon
    const updatedCoupon = await Coupon.findByIdAndUpdate(
      params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate("createdBy", "name email");

    return NextResponse.json({
      success: true,
      message: "Coupon updated successfully",
      coupon: updatedCoupon
    });

  } catch (error) {
    console.error("Error updating coupon:", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to update coupon" },
      { status: 500 }
    );
  }
}

// DELETE - Delete coupon
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    
    if (!session || !["admin", "super_admin"].includes(session.user?.role || "")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    // Check if coupon exists
    const coupon = await Coupon.findById(params.id);
    if (!coupon) {
      return NextResponse.json({ error: "Coupon not found" }, { status: 404 });
    }

    // Check if coupon has been used
    const usageCount = await CouponUsage.countDocuments({ couponId: params.id });
    if (usageCount > 0) {
      return NextResponse.json(
        { 
          error: "Cannot delete coupon that has been used. Consider deactivating it instead.",
          usageCount 
        },
        { status: 400 }
      );
    }

    // Delete coupon
    await Coupon.findByIdAndDelete(params.id);

    return NextResponse.json({
      success: true,
      message: "Coupon deleted successfully"
    });

  } catch (error) {
    console.error("Error deleting coupon:", error);
    return NextResponse.json(
      { error: "Failed to delete coupon" },
      { status: 500 }
    );
  }
} 