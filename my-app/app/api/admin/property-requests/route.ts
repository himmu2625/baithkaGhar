import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { authOptions } from "@/lib/auth";
import { connectMongo } from "@/lib/db/mongodb";
import Property from "@/models/Property";
import User from "@/models/User";

// Mark this route as dynamic since it uses session
export const dynamic = 'force-dynamic';

// GET handler for fetching property requests
export const GET = async (req: NextRequest) => {
  try {
    // Validate token and admin access
    const token = await getToken({ req, secret: authOptions.secret });
    if (!token || !token.id) {
      return NextResponse.json(
        { success: false, message: "Unauthorized - Please log in" },
        { status: 401 }
      );
    }

    // Connect to database
    await connectMongo();

    // Check if user is admin/super_admin
    const user = await User.findById(token.id);
    if (!user || !['admin', 'super_admin'].includes(user.role)) {
      return NextResponse.json(
        { success: false, message: "Unauthorized - Admin access required" },
        { status: 403 }
      );
    }

    // Get query parameters
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') || 'pending';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    // Build query
    const query = { verificationStatus: status };
    
    // Get total count for pagination
    const total = await Property.countDocuments(query);

    // Fetch property requests with pagination
    const propertyRequests = await Property.find(query)
      .populate('userId', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    return NextResponse.json({
      success: true,
      propertyRequests,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        page,
        limit
      }
    });
  } catch (error) {
    console.error("Error fetching property requests:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch property requests" },
      { status: 500 }
    );
  }
};

// PUT handler for updating property verification status
export const PUT = async (req: NextRequest) => {
  try {
    // Validate token and admin access
    const token = await getToken({ req, secret: authOptions.secret });
    if (!token || !token.id) {
      return NextResponse.json(
        { success: false, message: "Unauthorized - Please log in" },
        { status: 401 }
      );
    }

    // Connect to database
    await connectMongo();

    // Check if user is admin/super_admin
    const user = await User.findById(token.id);
    if (!user || !['admin', 'super_admin'].includes(user.role)) {
      return NextResponse.json(
        { success: false, message: "Unauthorized - Admin access required" },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await req.json();
    const { propertyId, status, notes } = body;

    if (!propertyId || !status || !['approved', 'rejected'].includes(status)) {
      return NextResponse.json(
        { success: false, message: "Invalid request data" },
        { status: 400 }
      );
    }

    // Update property verification status
    const property = await Property.findById(propertyId);
    if (!property) {
      return NextResponse.json(
        { success: false, message: "Property not found" },
        { status: 404 }
      );
    }

    property.verificationStatus = status;
    property.verificationNotes = notes;
    property.verifiedAt = new Date();
    property.verifiedBy = token.id;
    property.isPublished = status === 'approved';

    await property.save();

    return NextResponse.json({
      success: true,
      message: `Property ${status === 'approved' ? 'approved' : 'rejected'} successfully`,
      property
    });
  } catch (error) {
    console.error("Error updating property verification status:", error);
    return NextResponse.json(
      { success: false, message: "Failed to update property verification status" },
      { status: 500 }
    );
  }
}; 