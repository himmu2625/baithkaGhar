import { NextRequest, NextResponse } from "next/server";
import { connectMongo } from "@/lib/db/mongodb";
import Property from "@/models/Property";
import User from "@/models/User";
import { getToken } from "next-auth/jwt";
import { authOptions } from "@/lib/auth";

// Mark this route as dynamic since it uses session
export const dynamic = 'force-dynamic';

// GET handler for fetching property requests
export const GET = async (req: NextRequest) => {
  try {
    // Get token and validate authentication
    console.log("Property requests API: Attempting to get token...");
    console.log("Property requests API: Request cookies:", req.cookies.getAll().map(c => ({ name: c.name, hasValue: !!c.value })));
    
    // Try different cookie names to find the working one
    let token = null;
    const cookieNames = [
      'next-auth.session-token',
      '__Secure-next-auth.session-token', 
      'authjs.session-token',
      '__Secure-authjs.session-token'
    ];
    
    for (const cookieName of cookieNames) {
      try {
        token = await getToken({ 
          req, 
          secret: process.env.NEXTAUTH_SECRET || authOptions.secret,
          cookieName
        });
        
        if (token) {
          console.log(`Property requests API: Token found with cookie: ${cookieName}`);
          break;
        }
      } catch (error) {
        console.log(`Property requests API: Error with cookie ${cookieName}:`, error);
      }
    }
    
    console.log("Property requests API: Token retrieved:", token ? "Success" : "Failed");
    if (token) {
      console.log("Property requests API: Token details:", { 
        hasSub: !!token.sub, 
        hasEmail: !!token.email, 
        hasRole: !!token.role,
        sub: token.sub,
        email: token.email
      });
    }
    
    if (!token || !token.sub) {
      console.log("Property requests API: No valid token found");
      return NextResponse.json(
        { success: false, message: "Unauthorized - Please log in" },
        { status: 401 }
      );
    }

    // Connect to database
    await connectMongo();

    // Check if user is admin/super_admin
    const user = await User.findById(token.sub);
    if (!user || !['admin', 'super_admin'].includes(user.role)) {
      console.log(`Property requests API: User ${token.email} does not have admin role. Role: ${user?.role}`);
      return NextResponse.json(
        { success: false, message: "Unauthorized - Admin access required" },
        { status: 403 }
      );
    }

    console.log(`Property requests API: Authenticated admin user ${token.email} (${user.role})`);

    // Get query parameters
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') || 'pending';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    console.log(`Property requests API: Fetching properties with status=${status}, page=${page}, limit=${limit}`);

    // Build query
    const query = { verificationStatus: status };
    
    // Get total count for pagination
    const total = await Property.countDocuments(query);
    console.log(`Property requests API: Found ${total} total properties with status=${status}`);

    // Fetch property requests with pagination
    const propertyRequests = await Property.find(query)
      .populate('userId', 'name email phone')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    console.log(`Property requests API: Returning ${propertyRequests.length} properties`);

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
    console.error("Property requests API error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch property requests", error: error.message },
      { status: 500 }
    );
  }
};

// PUT handler for updating property verification status
export const PUT = async (req: NextRequest) => {
  try {
    // Get token and validate authentication
    console.log("Property requests PUT API: Attempting to get token...");
    console.log("Property requests PUT API: Request cookies:", req.cookies.getAll().map(c => ({ name: c.name, hasValue: !!c.value })));
    
    // Try different cookie names to find the working one
    let token = null;
    const cookieNames = [
      'next-auth.session-token',
      '__Secure-next-auth.session-token', 
      'authjs.session-token',
      '__Secure-authjs.session-token'
    ];
    
    for (const cookieName of cookieNames) {
      try {
        token = await getToken({ 
          req, 
          secret: process.env.NEXTAUTH_SECRET || authOptions.secret,
          cookieName
        });
        
        if (token) {
          console.log(`Property requests PUT API: Token found with cookie: ${cookieName}`);
          break;
        }
      } catch (error) {
        console.log(`Property requests PUT API: Error with cookie ${cookieName}:`, error);
      }
    }
    
    console.log("Property requests PUT API: Token retrieved:", token ? "Success" : "Failed");
    if (token) {
      console.log("Property requests PUT API: Token details:", { 
        hasSub: !!token.sub, 
        hasEmail: !!token.email, 
        hasRole: !!token.role,
        sub: token.sub,
        email: token.email
      });
    }
    
    if (!token || !token.sub) {
      console.log("Property requests PUT API: No valid token found");
      return NextResponse.json(
        { success: false, message: "Unauthorized - Please log in" },
        { status: 401 }
      );
    }

    // Connect to database
    await connectMongo();

    // Check if user is admin/super_admin
    const user = await User.findById(token.sub);
    if (!user || !['admin', 'super_admin'].includes(user.role)) {
      console.log(`Property requests PUT API: User ${token.email} does not have admin role. Role: ${user?.role}`);
      return NextResponse.json(
        { success: false, message: "Unauthorized - Admin access required" },
        { status: 403 }
      );
    }

    // Parse request body
    let body;
    try {
      body = await req.json();
    } catch (parseError) {
      console.error("Property requests PUT API: JSON parse error:", parseError);
      return NextResponse.json(
        { success: false, message: "Invalid JSON in request body" },
        { status: 400 }
      );
    }

    const { propertyId, status, notes } = body;
    
    console.log(`Property requests PUT API: Processing request to ${status} property ${propertyId}`);
    console.log("Property requests PUT API: Request body:", { propertyId, status, notes });

    if (!propertyId || !status || !['approved', 'rejected'].includes(status)) {
      console.error("Property requests PUT API: Invalid request data:", { propertyId, status, notes });
      return NextResponse.json(
        { success: false, message: "Invalid request data" },
        { status: 400 }
      );
    }

    // Update property verification status
    console.log(`Property requests PUT API: Looking up property ${propertyId}`);
    const property = await Property.findById(propertyId);
    if (!property) {
      console.error(`Property requests PUT API: Property ${propertyId} not found`);
      return NextResponse.json(
        { success: false, message: "Property not found" },
        { status: 404 }
      );
    }

    console.log(`Property requests PUT API: Found property ${property._id}, current status: ${property.verificationStatus}`);
    const previousStatus = property.verificationStatus;
    
    try {
      console.log("Property requests PUT API: Updating property fields...");
      
      const updateFields = {
        verificationStatus: status,
        verificationNotes: notes || '',
        verifiedAt: new Date(),
        verifiedBy: token.sub,
        isPublished: status === 'approved'
      };

      console.log("Property requests PUT API: Saving property to database...");
      const updateResult = await Property.updateOne(
        { _id: propertyId },
        { $set: updateFields }
      );
      
      if (updateResult.modifiedCount === 0) {
        console.warn("Property requests PUT API: No documents were modified");
      }
      
      console.log(`Property ${propertyId} status updated from ${previousStatus} to ${status} by ${token.email}`);
    } catch (saveError) {
      console.error("Property requests PUT API: Error saving property:", saveError);
      console.error("Property requests PUT API: Save error details:", {
        message: saveError instanceof Error ? saveError.message : 'Unknown error',
        stack: saveError instanceof Error ? saveError.stack : undefined,
        name: saveError instanceof Error ? saveError.name : undefined
      });
      return NextResponse.json(
        { success: false, message: "Failed to save property changes to database", error: saveError instanceof Error ? saveError.message : 'Unknown error' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Property ${status === 'approved' ? 'approved' : 'rejected'} successfully`,
      property: {
        _id: property._id,
        title: property.title || property.name,
        verificationStatus: status,
        isPublished: status === 'approved'
      }
    });
  } catch (error) {
    console.error("Property requests PUT API: Unexpected error:", error);
    return NextResponse.json(
      { 
        success: false, 
        message: "Failed to update property verification status",
        error: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}; 