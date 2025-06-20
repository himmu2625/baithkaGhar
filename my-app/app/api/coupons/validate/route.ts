import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/get-session";
import dbConnect from "@/lib/db/dbConnect";
import Coupon from "@/models/Coupon";
import CouponUsage from "@/models/CouponUsage";
import { z } from "zod";

// Validation schema for coupon validation request
const validateCouponSchema = z.object({
  code: z.string().min(1).transform(val => val.toUpperCase()),
  bookingAmount: z.number().min(0),
  propertyId: z.string().min(1),
});

// POST - Validate coupon for booking
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    
    if (!session || !session.user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    await dbConnect();

    const body = await request.json();
    
    // Validate request data
    const { code, bookingAmount, propertyId } = validateCouponSchema.parse(body);

    // Find the coupon
    const coupon = await Coupon.findOne({ code, isActive: true });
    
    if (!coupon) {
      return NextResponse.json({
        valid: false,
        error: "Invalid coupon code"
      }, { status: 400 });
    }

    // Check if coupon is valid for this booking
    const validationResult = coupon.isValidForBooking(
      bookingAmount,
      session.user.id,
      propertyId
    );

    if (!validationResult.valid) {
      return NextResponse.json({
        valid: false,
        error: validationResult.reason
      }, { status: 400 });
    }

    // Check user usage limit
    const userUsageCount = await CouponUsage.countDocuments({
      couponId: coupon._id,
      userId: session.user.id
    });

    if (userUsageCount >= coupon.userUsageLimit) {
      return NextResponse.json({
        valid: false,
        error: `You have already used this coupon ${coupon.userUsageLimit} time(s)`
      }, { status: 400 });
    }

    // Calculate discount
    const discountAmount = coupon.calculateDiscount(bookingAmount);
    const finalAmount = bookingAmount - discountAmount;

    return NextResponse.json({
      valid: true,
      coupon: {
        code: coupon.code,
        name: coupon.name,
        description: coupon.description,
        type: coupon.type,
        value: coupon.value
      },
      discount: {
        amount: discountAmount,
        originalAmount: bookingAmount,
        finalAmount: finalAmount,
        savings: discountAmount
      }
    });

  } catch (error) {
    console.error("Error validating coupon:", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { valid: false, error: "Invalid request data", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { valid: false, error: "Failed to validate coupon" },
      { status: 500 }
    );
  }
} 