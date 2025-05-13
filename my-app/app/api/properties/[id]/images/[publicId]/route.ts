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
      'Allow': 'DELETE, OPTIONS',
      'Access-Control-Allow-Methods': 'DELETE, OPTIONS',
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

// DELETE endpoint to remove an image from a property
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; publicId: string } }
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
    
    // Get property ID and image public_id from URL params
    const id = params.id;
    const publicId = params.publicId;
    
    if (!id || !publicId) {
      return NextResponse.json(
        { success: false, message: "Property ID and image public_id are required" },
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
    
    // Remove image from property
    if (!property.images) {
      return NextResponse.json(
        { success: false, message: "Property has no images" },
        { status: 400 }
      );
    }
    
    // Type cast images to array of PropertyImage
    const propertyImages = property.images as unknown as PropertyImage[];
    
    // Find the index of the image to remove
    const imageIndex = propertyImages.findIndex(img => img.public_id === publicId);
    
    if (imageIndex === -1) {
      return NextResponse.json(
        { success: false, message: "Image not found" },
        { status: 404 }
      );
    }
    
    // Remove the image from the array
    propertyImages.splice(imageIndex, 1);
    
    // Update thumbnail if removed image was the thumbnail
    if (propertyImages.length > 0 && (!(property as any).thumbnail || (property as any).thumbnail === publicId)) {
      (property as any).thumbnail = propertyImages[0].url;
    } else if (propertyImages.length === 0) {
      (property as any).thumbnail = '';
    }
    
    // Save the typed array back to property
    property.images = propertyImages as any;
    
    // Save the updated property
    await property.save();
    
    return NextResponse.json({
      success: true,
      message: "Image removed successfully",
      images: propertyImages
    });
  } catch (error) {
    console.error("Error removing image:", error);
    return NextResponse.json(
      { 
        success: false, 
        message: "Failed to remove image", 
        error: (error as Error).message 
      },
      { status: 500 }
    );
  }
} 