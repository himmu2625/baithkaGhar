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
      'Allow': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Origin': '*'
    },
  });
}

// Define interface for Property image type
interface PropertyImage {
  url: string;
  public_id: string;
}

// POST endpoint to add a new image to a property
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Validate token for authentication
    const token = await getToken({ req: request, secret: authOptions.secret });
    
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
    
    // Parse the request body
    const { image } = await request.json();
    
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
    
    // Check if user is authorized to update this property
    if (!isAdmin && property.userId.toString() !== token?.sub) {
      return NextResponse.json(
        { success: false, message: "Unauthorized to update this property" },
        { status: 403 }
      );
    }
    
    // Validate image data
    if (!image || !image.url) {
      return NextResponse.json(
        { success: false, message: "Image URL is required" },
        { status: 400 }
      );
    }
    
    // Add image to property
    if (!property.images) {
      property.images = [];
    }
    
    // Type cast images to array of PropertyImage
    const propertyImages = property.images as unknown as PropertyImage[];
    
    propertyImages.push({
      url: image.url,
      public_id: image.public_id || '',
    });
    
    // Save the typed array back to property
    property.images = propertyImages as any;
    
    // Update property thumbnail if this is the first image
    if (propertyImages.length === 1) {
      (property as any).thumbnail = image.url;
    }
    
    // Save the updated property
    await property.save();
    
    return NextResponse.json({
      success: true,
      message: "Image added successfully",
      images: propertyImages
    });
  } catch (error) {
    console.error("Error adding image:", error);
    return NextResponse.json(
      { 
        success: false, 
        message: "Failed to add image", 
        error: (error as Error).message 
      },
      { status: 500 }
    );
  }
} 