import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/get-session";
import dbConnect from "@/lib/db/dbConnect";
import Coupon from "@/models/Coupon";
import { z } from "zod";

// Validation schema for coupon creation/update
const couponSchema = z.object({
  code: z.string().min(3).max(20).transform(val => val.toUpperCase()),
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  type: z.enum(["percentage", "fixed_amount"]),
  value: z.number().min(0),
  minOrderAmount: z.number().min(0).default(0),
  maxDiscountAmount: z.number().min(0).optional(),
  usageLimit: z.number().min(1).optional(),
  userUsageLimit: z.number().min(1).default(1),
  isActive: z.boolean().default(true),
  validFrom: z.string().datetime(),
  validTo: z.string().datetime(),
  applicableFor: z.enum(["all", "specific_properties", "specific_users"]).default("all"),
}).refine(data => {
  if (data.type === "percentage" && (data.value <= 0 || data.value > 100)) {
    return false;
  }
  if (data.type === "fixed_amount" && data.value <= 0) {
    return false;
  }
  if (new Date(data.validTo) <= new Date(data.validFrom)) {
    return false;
  }
  return true;
}, {
  message: "Invalid coupon data: check percentage value (1-100), fixed amount (>0), and date range"
});

// GET - Fetch all coupons
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    
    if (!session || !["admin", "super_admin"].includes(session.user?.role || "")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const status = searchParams.get("status");
    const type = searchParams.get("type");
    const search = searchParams.get("search");

    // Build filter query
    const filter: any = {};
    
    if (status === "active") filter.isActive = true;
    if (status === "inactive") filter.isActive = false;
    if (type && type !== "all") filter.type = type;
    if (search) {
      filter.$or = [
        { code: { $regex: search, $options: "i" } },
        { name: { $regex: search, $options: "i" } }
      ];
    }

    const skip = (page - 1) * limit;

    const [coupons, total] = await Promise.all([
      Coupon.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("createdBy", "name email"),
      Coupon.countDocuments(filter)
    ]);

    return NextResponse.json({
      success: true,
      coupons,
      pagination: {
        current: page,
        total: Math.ceil(total / limit),
        count: total
      }
    });

  } catch (error) {
    console.error("Error fetching coupons:", error);
    return NextResponse.json(
      { error: "Failed to fetch coupons" },
      { status: 500 }
    );
  }
}

// POST - Create new coupon
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    
    if (!session || !["admin", "super_admin"].includes(session.user?.role || "")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    const body = await request.json();
    
    // Validate request data
    const validatedData = couponSchema.parse(body);

    // Check if coupon code already exists
    const existingCoupon = await Coupon.findOne({ code: validatedData.code });
    if (existingCoupon) {
      return NextResponse.json(
        { error: "Coupon code already exists" },
        { status: 400 }
      );
    }

    // Create coupon
    const coupon = new Coupon({
      ...validatedData,
      validFrom: new Date(validatedData.validFrom),
      validTo: new Date(validatedData.validTo),
      createdBy: session.user.id,
    });

    await coupon.save();

    return NextResponse.json({
      success: true,
      message: "Coupon created successfully",
      coupon
    }, { status: 201 });

  } catch (error) {
    console.error("Error creating coupon:", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to create coupon" },
      { status: 500 }
    );
  }
} 