import { NextRequest, NextResponse } from "next/server"
import { PropertyService } from "@/services/property-service"
import { dbHandler, convertDocToObj } from "@/lib/db"
import { getSession } from "@/lib/get-session"
import Property from "@/models/Property"
import { getToken } from "next-auth/jwt"
import { authOptions } from "@/lib/auth"
import { connectMongo } from "@/lib/db/mongodb"

interface Params {
  params: {
    id: string
  }
}

// Mark this route as dynamic since it uses session
export const dynamic = 'force-dynamic';

// Handle all methods for CORS preflight requests
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Allow': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Origin': '*'
    },
  });
}

// This helper function is needed for static site generation
export function generateStaticParams() {
  return [{ id: "placeholder" }];
}

// GET handler for a specific property
export async function GET(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const params = await context.params;
    const idFromParams = params.id;
    // Log the request
    console.log(`GET request for property with ID: ${idFromParams}`);
    
    // Connect to MongoDB
    try {
      await connectMongo();
      console.log("Connected to MongoDB successfully");
    } catch (dbError) {
      console.error("MongoDB connection error:", dbError);
      return NextResponse.json(
        { success: false, message: "Database connection failed", error: (dbError as Error).message },
        { status: 500 }
      );
    }

    // Get property ID from URL params
    const id = params.id;
    
    if (!id) {
      console.log("No property ID provided");
      return NextResponse.json(
        { success: false, message: "Property ID is required" },
        { status: 400 }
      );
    }

    // Find property by ID
    console.log(`Looking up property with ID: ${id}`);
    
    try {
      const property = await Property.findById(id).lean();
        
      if (!property) {
        console.log(`Property not found with ID: ${id}`);
        return NextResponse.json(
          { success: false, message: "Property not found" },
          { status: 404 }
        );
      }
      
      console.log(`Property found: ${property._id}`);
      
      // Return sanitized property object
      return NextResponse.json({ 
        success: true, 
        property: {
          ...property,
          _id: property._id.toString()
        }
      });
    } catch (lookupError) {
      console.error("Error finding property:", lookupError);
      
      // Check if it's an invalid ID format error
      if ((lookupError as Error).message?.includes('Cast to ObjectId failed')) {
        return NextResponse.json(
          { success: false, message: "Invalid property ID format" },
          { status: 400 }
        );
      }
      
      return NextResponse.json(
        { success: false, message: "Error finding property", error: (lookupError as Error).message },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Uncaught error in property GET handler:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch property", error: (error as Error).message },
      { status: 500 }
    );
  }
}

// PATCH handler to update a property (protected)
export async function PATCH(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const params = await context.params;
    const idFromParams = params.id;
    // Validate token for authentication
    const token = await getToken({ req: request, secret: authOptions.secret });
    
    if (!token) {
      return NextResponse.json(
        { success: false, message: "Authentication required to update properties" },
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
    
    // Parse the request body
    let updateData;
    try {
      updateData = await request.json();
    } catch (error) {
      return NextResponse.json(
        { success: false, message: "Invalid JSON in request body" },
        { status: 400 }
      );
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
    
    // Check if user is authorized to update this property
    if (!isAdmin && property.userId.toString() !== token?.sub) {
      return NextResponse.json(
        { success: false, message: "Unauthorized to update this property" },
        { status: 403 }
      );
    }
    
    // Special handling for property type updates
    if (updateData.propertyType) {
      console.log(`Updating property type from ${(property as any).propertyType} to ${updateData.propertyType}`);
      
      // Ensure valid property type
      const validTypes = ['apartment', 'house', 'hotel', 'villa', 'resort'];
      if (!validTypes.includes(updateData.propertyType)) {
        return NextResponse.json(
          { 
            success: false, 
            message: `Invalid property type. Must be one of: ${validTypes.join(', ')}` 
          },
          { status: 400 }
        );
      }
    }
    
    // Update the property fields using type assertion to avoid TypeScript errors
    const fields = [
      'title', 'description', 'propertyType', 'bedrooms', 'bathrooms', 
      'maxGuests', 'status', 'verificationStatus', 'featured', 'address'
    ];
    
    fields.forEach(field => {
      if (updateData[field] !== undefined) {
        (property as any)[field] = updateData[field];
      }
    });
    
    // Handle price update (has nested structure)
    if (updateData.price) {
      if (!(property as any).price) {
        (property as any).price = { base: 0 };
      }
      
      if (updateData.price.base !== undefined) {
        (property as any).price.base = updateData.price.base;
      }
    }
    
    // Save the updated property
    await property.save();
    
    return NextResponse.json({
      success: true,
      message: "Property updated successfully",
      property: {
        id: property._id,
        title: (property as any).title,
        propertyType: (property as any).propertyType
      }
    });
  } catch (error) {
    console.error("Error updating property:", error);
    return NextResponse.json(
      { 
        success: false, 
        message: "Failed to update property", 
        error: (error as Error).message 
      },
      { status: 500 }
    );
  }
}

// PUT handler to update a property (mirrors PATCH functionality for compatibility)
export async function PUT(
  request: NextRequest,
  context: { params: { id: string } }
) {
  const params = await context.params;
  const idFromParams = params.id;
  // Ensure there's an id
  if (!idFromParams) {
    return NextResponse.json(
      { success: false, message: "Property ID is required" },
      { status: 400 }
    );
  }

  // Use id directly from params to ensure it's defined
  const propertyId = params.id;

  console.log(`PUT request for property ID: ${propertyId}`);

  try {
    // Validate token for authentication
    const token = await getToken({ req: request, secret: authOptions.secret });
    
    if (!token) {
      return NextResponse.json(
        { success: false, message: "Authentication required to update properties" },
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
    
    // Parse the request body
    let updateData;
    try {
      updateData = await request.json();
    } catch (error) {
      return NextResponse.json(
        { success: false, message: "Invalid JSON in request body" },
        { status: 400 }
      );
    }
    
    // Find the property
    const property = await Property.findById(propertyId);
    
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
    
    // Special handling for property type updates
    if (updateData.propertyType) {
      console.log(`Updating property type from ${(property as any).propertyType} to ${updateData.propertyType}`);
      
      // Ensure valid property type
      const validTypes = ['apartment', 'house', 'hotel', 'villa', 'resort'];
      if (!validTypes.includes(updateData.propertyType)) {
        return NextResponse.json(
          { 
            success: false, 
            message: `Invalid property type. Must be one of: ${validTypes.join(', ')}` 
          },
          { status: 400 }
        );
      }
    }
    
    // Update the property fields using type assertion to avoid TypeScript errors
    const fields = [
      'title', 'description', 'propertyType', 'bedrooms', 'bathrooms', 
      'maxGuests', 'status', 'verificationStatus', 'featured', 'address'
    ];
    
    fields.forEach(field => {
      if (updateData[field] !== undefined) {
        (property as any)[field] = updateData[field];
      }
    });
    
    // Handle price update (has nested structure)
    if (updateData.price) {
      if (!(property as any).price) {
        (property as any).price = { base: 0 };
      }
      
      if (updateData.price.base !== undefined) {
        (property as any).price.base = updateData.price.base;
      }
    }
    
    // Save the updated property
    await property.save();
    
    return NextResponse.json({
      success: true,
      message: "Property updated successfully",
      property: {
        id: property._id,
        title: (property as any).title,
        propertyType: (property as any).propertyType
      }
    });
  } catch (error) {
    console.error("Error updating property:", error);
    return NextResponse.json(
      { 
        success: false, 
        message: "Failed to update property", 
        error: (error as Error).message 
      },
      { status: 500 }
    );
  }
}

// DELETE handler to delete a property (protected)
export async function DELETE(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const params = await context.params;
    const idFromParams = params.id;
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
    
    // Delete the property
    await Property.findByIdAndDelete(id);
    
    return NextResponse.json({
      success: true,
      message: "Property deleted successfully"
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
