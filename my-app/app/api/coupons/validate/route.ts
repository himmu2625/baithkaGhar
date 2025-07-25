import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/get-session";
import dbConnect from "@/lib/db/dbConnect";
import Coupon from "@/models/Coupon";
import Promotion from "@/models/Promotion";
import CouponUsage from "@/models/CouponUsage";
import { z } from "zod";

// Validation schema for coupon validation request
const validateCouponSchema = z.object({
  code: z.string().min(1).transform(val => val.toUpperCase()),
  bookingAmount: z.number().min(0),
  propertyId: z.string().min(1),
});

// Helper function to validate promotion for booking
const validatePromotionForBooking = (
  promotion: any,
  bookingAmount: number,
  userId: string,
  propertyId: string
): { valid: boolean; reason?: string } => {
  const now = new Date();

  // Check if promotion is active
  if (!promotion.isActive || promotion.status !== 'active') {
    return { valid: false, reason: "Promotion is not active" };
  }

  // Check date validity
  if (now < promotion.conditions.validFrom || now > promotion.conditions.validTo) {
    return { valid: false, reason: "Promotion has expired or not yet valid" };
  }

  // Check minimum booking amount
  if (promotion.conditions.minBookingAmount && bookingAmount < promotion.conditions.minBookingAmount) {
    return { 
      valid: false, 
      reason: `Minimum order amount of ₹${promotion.conditions.minBookingAmount} required` 
    };
  }

  // Check usage limit
  if (promotion.conditions.usageLimit && promotion.analytics.usageCount >= promotion.conditions.usageLimit) {
    return { valid: false, reason: "Promotion usage limit exceeded" };
  }

  // Check property applicability
  if (promotion.conditions.applicableFor === "specific_properties" && 
      promotion.conditions.applicableProperties && 
      !promotion.conditions.applicableProperties.includes(propertyId)) {
    return { valid: false, reason: "Promotion not applicable for this property" };
  }

  // Check user applicability
  if (promotion.conditions.applicableFor === "specific_users" && 
      promotion.conditions.applicableUsers && 
      !promotion.conditions.applicableUsers.includes(userId)) {
    return { valid: false, reason: "Promotion not applicable for this user" };
  }

  // Check excluded properties
  if (promotion.conditions.excludeProperties && 
      promotion.conditions.excludeProperties.includes(propertyId)) {
    return { valid: false, reason: "Promotion not applicable for this property" };
  }

  // Check excluded users
  if (promotion.conditions.excludedUsers && 
      promotion.conditions.excludedUsers.includes(userId)) {
    return { valid: false, reason: "Promotion not applicable for this user" };
  }

  return { valid: true };
};

// Helper function to calculate promotion discount
const calculatePromotionDiscount = (promotion: any, amount: number): number => {
  let discount = 0;
  
  if (promotion.discountType === "percentage") {
    discount = (amount * promotion.discountValue) / 100;
  } else if (promotion.discountType === "fixed_amount") {
    discount = promotion.discountValue;
  }

  // Apply max discount limit for percentage promotions
  if (promotion.maxDiscountAmount && discount > promotion.maxDiscountAmount) {
    discount = promotion.maxDiscountAmount;
  }

  return Math.min(discount, amount); // Don't exceed the total amount
};

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

    // First, try to find the coupon in the new Promotion system
    const promotion = await Promotion.findOne({ 
      couponCode: code, 
      isActive: true,
      'conditions.requiresCouponCode': true,
      $or: [
        { type: 'coupon' },
        { migratedFrom: 'coupon' }
      ]
    });

    if (promotion) {
      // Use the new Promotion system
      const validationResult = validatePromotionForBooking(
        promotion,
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

      // Check user usage limit (using the promotion's usageLimitPerCustomer or userUsageLimit)
      const userUsageLimit = promotion.conditions.usageLimitPerCustomer || promotion.conditions.userUsageLimit || 1;
      
      // For now, we'll use CouponUsage for backward compatibility, but this could be enhanced
      // to track usage in the promotion analytics or a new PromotionUsage model
      const userUsageCount = await CouponUsage.countDocuments({
        couponId: promotion.originalId || promotion._id, // Use original coupon ID if migrated
        userId: session.user.id
      });

      if (userUsageCount >= userUsageLimit) {
        return NextResponse.json({
          valid: false,
          error: `You have already used this coupon ${userUsageLimit} time(s)`
        }, { status: 400 });
      }

      // Calculate discount
      const discountAmount = calculatePromotionDiscount(promotion, bookingAmount);
      const finalAmount = bookingAmount - discountAmount;

      return NextResponse.json({
        valid: true,
        coupon: {
          code: promotion.couponCode,
          name: promotion.name,
          description: promotion.description,
          type: promotion.discountType,
          value: promotion.discountValue
        },
        discount: {
          amount: discountAmount,
          originalAmount: bookingAmount,
          finalAmount: finalAmount,
          savings: discountAmount
        },
        source: 'promotion' // Indicate this came from the new system
      });
    }

    // Fallback to the old Coupon system if not found in promotions
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
      },
      source: 'coupon' // Indicate this came from the old system
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