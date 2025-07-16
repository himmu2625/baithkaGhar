import { NextRequest, NextResponse } from "next/server";
import { connectMongo } from "@/lib/db/mongodb";
import Property from "@/models/Property";
import { getToken } from "next-auth/jwt";
import { authOptions } from "@/lib/auth";

// Force dynamic to prevent caching
export const dynamic = 'force-dynamic';

// Handle OPTIONS requests for CORS preflight
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Allow': 'POST, OPTIONS',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Origin': '*'
    },
  });
}

// POST endpoint that handles property deletion - simpler implementation
export async function POST(request: NextRequest) {
  console.log("Universal property deletion endpoint called");
  
  try {
    // First connect to MongoDB before doing anything else
    try {
      console.log("Connecting to MongoDB...");
      await connectMongo();
      console.log("Connected to MongoDB successfully");
    } catch (dbError) {
      console.error("MongoDB connection error:", dbError);
      return NextResponse.json(
        { success: false, message: "Database connection failed", error: (dbError as Error).message },
        { status: 500 }
      );
    }
    
    // Parse the request body
    let data;
    try {
      data = await request.json();
      console.log("Deletion request data:", data);
    } catch (error) {
      console.error("JSON parsing error:", error);
      return NextResponse.json(
        { success: false, message: "Invalid JSON in request body" },
        { status: 400 }
      );
    }
    
    // Get property ID from request
    const id = data.id;
    
    if (!id) {
      console.log("No property ID provided");
      return NextResponse.json(
        { success: false, message: "Property ID is required" },
        { status: 400 }
      );
    }
    
    // Validate token for authentication (but allow bypass for testing)
    let isAuthenticated = false;
    let isAdmin = false;
    let token = null;
    
    try {
      console.log("Validating authentication token...");
      token = await getToken({ req: request, secret: authOptions.secret });
      
      if (!token) {
        console.log("No authentication token found");
        return NextResponse.json(
          { success: false, message: "Authentication required to delete properties" },
          { status: 401 }
        );
      }
      isAuthenticated = true;
      
      // Get the current user from the token
      if (token?.sub) {
        try {
          console.log("Checking user permissions...");
          // Check if user is admin
          const User = (await import('@/models/User')).default;
          const user = await User.findById(token.sub);
          
          if (user && ['admin', 'super_admin'].includes(user.role)) {
            isAdmin = true;
            console.log("User has admin permissions");
          }
        } catch (userError) {
          console.error("User lookup error:", userError);
          // Don't fail the request, just log the error and assume not admin
        }
      }
    } catch (authError) {
      console.error("Auth error:", authError);
      return NextResponse.json(
        { success: false, message: "Authentication error" },
        { status: 401 }
      );
    }
    
    // Find the property
    let property;
    try {
      console.log("Looking up property by ID:", id);
      property = await Property.findById(id);
      
      if (!property) {
        console.log("Property not found by ID:", id);
        return NextResponse.json(
          { success: false, message: "Property not found" },
          { status: 404 }
        );
      }
      console.log("Property found:", String((property as any)._id));
    } catch (lookupError) {
      console.error("Property lookup error:", lookupError);
      return NextResponse.json(
        { success: false, message: "Error finding property" },
        { status: 500 }
      );
    }
    
    // Check if user is authorized to delete this property
    if (isAuthenticated && !isAdmin) {
      try {
        const propertyUserId = (property as any).userId ? (property as any).userId.toString() : null;
        const requestUserId = token?.sub || null;
        
        console.log("Checking authorization - Property User ID:", propertyUserId, "Request User ID:", requestUserId);
        
        if (propertyUserId !== requestUserId) {
          console.log("User not authorized to delete this property");
          return NextResponse.json(
            { success: false, message: "Unauthorized to delete this property" },
            { status: 403 }
          );
        }
      } catch (authzError) {
        console.error("Authorization checking error:", authzError);
        return NextResponse.json(
          { success: false, message: "Error checking authorization" },
          { status: 500 }
        );
      }
    }
    
    // Delete the property
    try {
      console.log("Deleting property:", id);
      await Property.findByIdAndDelete(id);
      console.log("Property deleted successfully");
      
      return NextResponse.json({
        success: true,
        message: "Property deleted successfully"
      });
    } catch (deleteError) {
      console.error("Error deleting property:", deleteError);
      return NextResponse.json(
        { success: false, message: "Failed to delete property" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Uncaught error in delete endpoint:", error);
    return NextResponse.json(
      { success: false, message: "Unexpected error deleting property" },
      { status: 500 }
    );
  }
} 