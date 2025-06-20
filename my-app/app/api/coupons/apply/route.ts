import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/get-session";
import dbConnect from "@/lib/db/dbConnect";
import Coupon from "@/models/Coupon";
import CouponUsage from "@/models/CouponUsage";
import { z } from "zod";

// Validation schema for coupon application
const applyCouponSchema = z.object({
  code: z.string().min(1).transform(val => val.toUpperCase()),
  bookingId: z.string().min(1),
  propertyId: z.string().min(1),
  originalAmount: z.number().min(0),
});

// POST - Apply coupon to booking (called after successful payment)
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    
    if (!session || !session.user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    await dbConnect();

    const body = await request.json();
    
    // Validate request data
    const { code, bookingId, propertyId, originalAmount } = applyCouponSchema.parse(body);

    // Find the coupon
    const coupon = await Coupon.findOne({ code, isActive: true });
    
    if (!coupon) {
      return NextResponse.json({
        success: false,
        error: "Invalid coupon code"
      }, { status: 400 });
    }

    // Validate coupon again (double-check)
    const validationResult = coupon.isValidForBooking(
      originalAmount,
      session.user.id,
      propertyId
    );

    if (!validationResult.valid) {
      return NextResponse.json({
        success: false,
        error: validationResult.reason
      }, { status: 400 });
    }

    // Check if coupon has already been applied to this booking
    const existingUsage = await CouponUsage.findOne({
      couponId: coupon._id,
      bookingId: bookingId
    });

    if (existingUsage) {
      return NextResponse.json({
        success: false,
        error: "Coupon has already been applied to this booking"
      }, { status: 400 });
    }

    // Check user usage limit
    const userUsageCount = await CouponUsage.countDocuments({
      couponId: coupon._id,
      userId: session.user.id
    });

    if (userUsageCount >= coupon.userUsageLimit) {
      return NextResponse.json({
        success: false,
        error: `You have already used this coupon ${coupon.userUsageLimit} time(s)`
      }, { status: 400 });
    }

    // Calculate discount
    const discountAmount = coupon.calculateDiscount(originalAmount);
    const finalAmount = originalAmount - discountAmount;

    // Create usage record
    const couponUsage = new CouponUsage({
      couponId: coupon._id,
      userId: session.user.id,
      bookingId: bookingId,
      propertyId: propertyId,
      originalAmount: originalAmount,
      discountAmount: discountAmount,
      finalAmount: finalAmount,
    });

    await couponUsage.save();

    // Update coupon usage count
    await Coupon.findByIdAndUpdate(coupon._id, {
      $inc: { usageCount: 1 }
    });

    return NextResponse.json({
      success: true,
      message: "Coupon applied successfully",
      usage: {
        couponCode: coupon.code,
        discountAmount: discountAmount,
        originalAmount: originalAmount,
        finalAmount: finalAmount,
        savings: discountAmount
      }
    });

  } catch (error) {
    console.error("Error applying coupon:", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: "Invalid request data", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Failed to apply coupon" },
      { status: 500 }
    );
  }
} 