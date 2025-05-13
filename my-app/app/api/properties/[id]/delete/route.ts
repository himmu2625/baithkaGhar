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

// POST endpoint that handles property deletion (workaround for environments where DELETE is blocked)
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Validate token for authentication
    const token = await getToken({ req: request, secret: authOptions.secret });
    
    if (!token) {
      return NextResponse.json(
        { success: false, message: "Authentication required to delete properties" },
        { status: 401 }
      );
    }
    
    // Get the current user from the token
    let isAdmin = false;
    
    if (token?.sub) {
      // Connect to MongoDB
      await connectMongo();
      
      // Check if user is admin
      const User = (await import('@/models/User')).default;
      const user = await User.findById(token.sub);
      
      if (user && ['admin', 'super_admin'].includes(user.role)) {
        isAdmin = true;
      }
    }
    
    // Get property ID from URL params
    const id = params.id;
    
    if (!id) {
      return NextResponse.json(
        { success: false, message: "Property ID is required" },
        { status: 400 }
      );
    }
    
    // Find the property
    const property = await Property.findById(id);
  
    if (!property) {
      return NextResponse.json(
        { success: false, message: "Property not found" },
        { status: 404 }
      );
    }
    
    // Check if user is authorized to delete this property
    if (!isAdmin && property.userId.toString() !== token?.sub) {
      return NextResponse.json(
        { success: false, message: "Unauthorized to delete this property" },
        { status: 403 }
      );
    }
    
    console.log(`Using POST-based property deletion for property ${id}`);
    
    // Delete the property
    await Property.findByIdAndDelete(id);
    
    return NextResponse.json({
      success: true,
      message: "Property deleted successfully via POST-delete endpoint"
    });
  } catch (error) {
    console.error("Error deleting property:", error);
    return NextResponse.json(
      { 
        success: false, 
        message: "Failed to delete property", 
        error: (error as Error).message 
      },
      { status: 500 }
    );
  }
} 