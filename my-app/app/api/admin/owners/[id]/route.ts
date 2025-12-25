import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { authOptions } from "@/lib/auth";
import { dbConnect } from "@/lib/db";
import User from "@/models/User";
import Property from "@/models/Property";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/owners/[id]
 * Get single property owner details
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;
    const ownerId = id;

    if (!mongoose.Types.ObjectId.isValid(ownerId)) {
      return NextResponse.json(
        { success: false, message: "Invalid owner ID" },
        { status: 400 }
      );
    }

    const owner = await User.findOne({
      _id: ownerId,
      role: 'property_owner'
    }).select('-password').lean();

    if (!owner) {
      return NextResponse.json(
        { success: false, message: "Owner not found" },
        { status: 404 }
      );
    }

    // Get properties owned by this owner
    const properties = await Property.find({ ownerId }).select('name location status').lean();

    return NextResponse.json({
      success: true,
      owner: {
        ...owner,
        properties
      }
    });

  } catch (error) {
    console.error('Error fetching owner:', error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch owner",
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/owners/[id]
 * Update property owner details
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;
    const ownerId = id;

    if (!mongoose.Types.ObjectId.isValid(ownerId)) {
      return NextResponse.json(
        { success: false, message: "Invalid owner ID" },
        { status: 400 }
      );
    }

    const body = await req.json();
    const {
      name,
      email,
      phone,
      businessName,
      businessType,
      gstNumber,
      panNumber,
      kycStatus,
      bankDetails,
      address,
      propertyIds
    } = body;

    // Check if owner exists
    const existingOwner = await User.findOne({
      _id: ownerId,
      role: 'property_owner'
    });

    if (!existingOwner) {
      return NextResponse.json(
        { success: false, message: "Owner not found" },
        { status: 404 }
      );
    }

    // Check if email is being changed and if it's already in use
    if (email && email !== existingOwner.email) {
      const emailExists = await User.findOne({ email });
      if (emailExists) {
        return NextResponse.json(
          { success: false, message: "Email already exists" },
          { status: 400 }
        );
      }
    }

    // Build update object
    const updateData: any = {};

    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone;

    // Update owner profile fields
    const ownerProfileUpdate: any = {};
    if (businessName) ownerProfileUpdate['ownerProfile.businessName'] = businessName;
    if (businessType) ownerProfileUpdate['ownerProfile.businessType'] = businessType;
    if (gstNumber !== undefined) ownerProfileUpdate['ownerProfile.gstNumber'] = gstNumber;
    if (panNumber !== undefined) ownerProfileUpdate['ownerProfile.panNumber'] = panNumber;
    if (kycStatus) ownerProfileUpdate['ownerProfile.kycStatus'] = kycStatus;
    if (bankDetails) ownerProfileUpdate['ownerProfile.bankDetails'] = bankDetails;
    if (address) ownerProfileUpdate['ownerProfile.address'] = address;

    // Handle property IDs update
    if (propertyIds !== undefined && Array.isArray(propertyIds)) {
      const validPropertyIds = propertyIds
        .filter((id: string) => mongoose.Types.ObjectId.isValid(id))
        .map((id: string) => new mongoose.Types.ObjectId(id));

      ownerProfileUpdate['ownerProfile.propertyIds'] = validPropertyIds;

      // Update properties to link/unlink this owner
      await Property.updateMany(
        { ownerId: ownerId },
        { $set: { ownerId: null } }
      );

      if (validPropertyIds.length > 0) {
        await Property.updateMany(
          { _id: { $in: validPropertyIds } },
          { $set: { ownerId: ownerId } }
        );
      }
    }

    // Perform update
    const updatedOwner = await User.findByIdAndUpdate(
      ownerId,
      {
        $set: {
          ...updateData,
          ...ownerProfileUpdate,
          updatedAt: new Date()
        }
      },
      { new: true, select: '-password' }
    );

    return NextResponse.json({
      success: true,
      message: "Owner updated successfully",
      owner: updatedOwner
    });

  } catch (error) {
    console.error('Error updating owner:', error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to update owner",
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/owners/[id]
 * Delete property owner (only super_admin)
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Authenticate super admin only
    const token = await getToken({ req, secret: authOptions.secret });

    if (!token || token.role !== 'super_admin') {
      return NextResponse.json(
        { success: false, message: "Unauthorized - Super Admin access required" },
        { status: 401 }
      );
    }

    await dbConnect();

    const { id } = await params;
    const ownerId = id;

    if (!mongoose.Types.ObjectId.isValid(ownerId)) {
      return NextResponse.json(
        { success: false, message: "Invalid owner ID" },
        { status: 400 }
      );
    }

    // Check if owner exists
    const owner = await User.findOne({
      _id: ownerId,
      role: 'property_owner'
    });

    if (!owner) {
      return NextResponse.json(
        { success: false, message: "Owner not found" },
        { status: 404 }
      );
    }

    // Unlink properties
    await Property.updateMany(
      { ownerId: ownerId },
      { $set: { ownerId: null } }
    );

    // Delete owner
    await User.findByIdAndDelete(ownerId);

    return NextResponse.json({
      success: true,
      message: "Owner deleted successfully"
    });

  } catch (error) {
    console.error('Error deleting owner:', error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to delete owner",
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
