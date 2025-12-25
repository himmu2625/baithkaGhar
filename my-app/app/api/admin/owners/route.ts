import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { authOptions } from "@/lib/auth";
import { dbConnect } from "@/lib/db";
import User, { IUser } from "@/models/User";
import Property from "@/models/Property";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/owners
 * Get all property owners
 */
export async function GET(req: NextRequest) {
  try {
    // Authenticate admin
    const token = await getToken({ req, secret: authOptions.secret });

    if (!token || !['admin', 'super_admin'].includes(token.role as string)) {
      return NextResponse.json(
        { success: false, message: "Unauthorized - Admin access required" },
        { status: 401 }
      );
    }

    await dbConnect();

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const kycStatus = searchParams.get('kycStatus');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const skip = (page - 1) * limit;

    // Build query
    const query: any = {
      role: 'property_owner'
    };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { 'ownerProfile.businessName': { $regex: search, $options: 'i' } }
      ];
    }

    if (kycStatus) {
      query['ownerProfile.kycStatus'] = kycStatus;
    }

    // Get owners with property counts
    const owners = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Get property count for each owner
    const ownersWithCounts = await Promise.all(
      owners.map(async (owner: any) => {
        const propertyCount = await Property.countDocuments({
          ownerId: owner._id
        });

        return {
          ...owner,
          propertyCount
        };
      })
    );

    const total = await User.countDocuments(query);

    return NextResponse.json({
      success: true,
      owners: ownersWithCounts,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching owners:', error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch owners",
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/owners
 * Create new property owner account
 */
export async function POST(req: NextRequest) {
  try {
    // Authenticate admin
    const token = await getToken({ req, secret: authOptions.secret });

    if (!token || !['admin', 'super_admin'].includes(token.role as string)) {
      return NextResponse.json(
        { success: false, message: "Unauthorized - Admin access required" },
        { status: 401 }
      );
    }

    await dbConnect();

    const body = await req.json();
    const {
      name,
      email,
      phone,
      password,
      businessName,
      businessType,
      gstNumber,
      panNumber,
      propertyIds,
      kycStatus,
      bankDetails,
      address
    } = body;

    // Validate required fields
    if (!name || !email || !password) {
      return NextResponse.json(
        { success: false, message: "Name, email, and password are required" },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { success: false, message: "Email already exists" },
        { status: 400 }
      );
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Validate property IDs if provided
    let validPropertyIds: mongoose.Types.ObjectId[] = [];
    if (propertyIds && Array.isArray(propertyIds) && propertyIds.length > 0) {
      validPropertyIds = propertyIds
        .filter((id: string) => mongoose.Types.ObjectId.isValid(id))
        .map((id: string) => new mongoose.Types.ObjectId(id));
    }

    // Create owner profile
    const ownerProfile = {
      propertyIds: validPropertyIds,
      businessName: businessName || name,
      businessType: businessType || 'individual',
      gstNumber: gstNumber || undefined,
      panNumber: panNumber || undefined,
      bankDetails: bankDetails || undefined,
      address: address || undefined,
      kycStatus: kycStatus || 'pending',
      registeredAt: new Date(),
      approvedBy: new mongoose.Types.ObjectId(token.id as string),
      approvedAt: new Date()
    };

    // Create new owner user
    const newOwner = await User.create({
      name,
      email,
      phone: phone || undefined,
      password: hashedPassword,
      role: 'property_owner',
      isAdmin: false,
      profileComplete: true,
      isSpam: false,
      ownerProfile
    });

    // Update properties to link to this owner
    if (validPropertyIds.length > 0) {
      await Property.updateMany(
        { _id: { $in: validPropertyIds } },
        { $set: { ownerId: newOwner._id } }
      );
    }

    // Remove password from response
    const ownerResponse = newOwner.toObject();
    delete ownerResponse.password;

    return NextResponse.json({
      success: true,
      message: "Property owner created successfully",
      owner: ownerResponse
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating owner:', error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to create owner",
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
