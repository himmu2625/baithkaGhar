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

// POST endpoint that handles updates (workaround for environments where PATCH/PUT are blocked)
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  console.log("POST /update endpoint called for property ID:", params.id);
  
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
    
    // Get property ID from URL params
    const id = params.id;
    
    if (!id) {
      console.log("No property ID provided");
      return NextResponse.json(
        { success: false, message: "Property ID is required" },
        { status: 400 }
      );
    }
    
    // Parse the request body
    let updateData;
    try {
      updateData = await request.json();
      console.log("Received update data:", JSON.stringify(updateData).substring(0, 200) + "...");
    } catch (error) {
      console.error("JSON parsing error:", error);
      return NextResponse.json(
        { success: false, message: "Invalid JSON in request body", error: (error as Error).message },
        { status: 400 }
      );
    }
    
    // Validate token for authentication
    let token;
    try {
      console.log("Validating authentication token...");
      token = await getToken({ req: request, secret: authOptions.secret });
      
      if (!token) {
        console.log("No authentication token found");
        return NextResponse.json(
          { success: false, message: "Authentication required to update properties" },
          { status: 401 }
        );
      }
      console.log("Authentication token validated");
    } catch (authError) {
      console.error("Auth error:", authError);
      return NextResponse.json(
        { success: false, message: "Authentication error", error: (authError as Error).message },
        { status: 401 }
      );
    }
    
    // Get the current user from the token
    let isAdmin = false;
    
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
      console.log("Property found:", (property as any)._id?.toString());
    } catch (lookupError) {
      console.error("Property lookup error:", lookupError);
      return NextResponse.json(
        { success: false, message: "Error finding property", error: (lookupError as Error).message },
        { status: 500 }
      );
    }
    
    // Check if user is authorized to update this property
    if (!isAdmin) {
      try {
        const propertyUserId = property.userId ? property.userId.toString() : null;
        const requestUserId = token?.sub || null;
        
        console.log("Checking authorization - Property User ID:", propertyUserId, "Request User ID:", requestUserId);
        
        if (propertyUserId !== requestUserId) {
          console.log("User not authorized to update this property");
          return NextResponse.json(
            { success: false, message: "Unauthorized to update this property" },
            { status: 403 }
          );
        }
      } catch (authzError) {
        console.error("Authorization checking error:", authzError);
        return NextResponse.json(
          { success: false, message: "Error checking authorization", error: (authzError as Error).message },
          { status: 500 }
        );
      }
    }
    
    // Log update method being used
    console.log(`Using POST-based update endpoint for property ${id}`);
    
    // Simplified update approach to avoid potential issues
    try {
      console.log("Starting property update...");
      
      // Extract basic fields that we know are safe to update
      const updateFields: Record<string, any> = {};
      
      // Basic string/number fields
      const basicFields = ['title', 'description', 'propertyType', 'googleMapLink'];
      basicFields.forEach(field => {
        if (updateData[field] !== undefined) {
          updateFields[field] = updateData[field];
        }
      });
      
      // Status field - special handling
      if (updateData.status !== undefined) {
        console.log(`Processing status update: ${updateData.status}`);
        // Map frontend status values to database schema values
        let dbStatus = updateData.status;
        if (updateData.status === 'active') {
          dbStatus = 'available';
        } else if (updateData.status === 'inactive') {
          dbStatus = 'unavailable';
        }
        
        // Make sure the mapped status is valid for the database
        const validDbStatuses = ['available', 'unavailable', 'maintenance', 'deleted'];
        if (validDbStatuses.includes(dbStatus)) {
          updateFields.status = dbStatus;
          console.log(`Mapped status ${updateData.status} to ${dbStatus}`);
          
          // If we're setting status to active or available, ensure the property is published
          if (updateData.status === 'active' || updateData.status === 'available') {
            updateFields.isPublished = true;
            
            // If the verification status is pending, set it to approved when activating
            if (property.verificationStatus === 'pending') {
              updateFields.verificationStatus = 'approved';
              updateFields.verifiedAt = new Date();
              
              if (token?.sub) {
                updateFields.verifiedBy = token.sub;
              }
              
              console.log("Auto-approving property when setting to active status");
            }
          }
          
          // If admin is updating stayTypes, auto-approve the property
          if (isAdmin && updateData.stayTypes && updateData.stayTypes.length > 0) {
            if (property.verificationStatus === 'pending') {
              updateFields.verificationStatus = 'approved';
              updateFields.verifiedAt = new Date();
              updateFields.isPublished = true;
              
              if (token?.sub) {
                updateFields.verifiedBy = token.sub;
              }
              
              console.log("Auto-approving property when admin updates stayTypes");
            }
          }
          
          // If setting to inactive, update availability but keep it published
          if (updateData.status === 'inactive') {
            updateFields.isAvailable = false;
          } else {
            updateFields.isAvailable = true;
          }
          
          console.log(`Updated status fields: ${JSON.stringify(updateFields)}`);
        } else {
          console.warn(`Invalid status value provided: ${updateData.status}, using current status`);
        }
      } else {
        console.log("Status field not provided in update, keeping current value");
      }
      
      // Number fields
      const numberFields = ['bedrooms', 'bathrooms', 'maxGuests'];
      numberFields.forEach(field => {
        if (updateData[field] !== undefined) {
          updateFields[field] = Number(updateData[field]);
        }
      });
      
      // Boolean fields
      if (updateData.featured !== undefined) {
        updateFields.featured = Boolean(updateData.featured);
      }
      
      // Object fields
      if (updateData.address) {
        updateFields.address = updateData.address;
      }

      // Update location coordinates if provided
      if (updateData.locationCoords) {
        updateFields.locationCoords = updateData.locationCoords;
      }
      
      // Handle price specially
      if (updateData.price && updateData.price.base !== undefined) {
        updateFields['price.base'] = Number(updateData.price.base);
      }
      
      // Handle stayTypes array
      if (updateData.stayTypes !== undefined && Array.isArray(updateData.stayTypes)) {
        updateFields.stayTypes = updateData.stayTypes;
        console.log(`Updating stayTypes: ${JSON.stringify(updateData.stayTypes)}`);
      } else {
        console.log(`stayTypes not found or not array:`, typeof updateData.stayTypes, updateData.stayTypes);
      }
      
      // Handle pricing
      if (updateData.pricing) {
        updateFields.pricing = updateData.pricing;
      }
      
      // Handle categorized images
      if (updateData.categorizedImages !== undefined) {
        updateFields.categorizedImages = updateData.categorizedImages;
        console.log(`Updating categorized images: ${updateData.categorizedImages.length} categories`);
      }
      
      // Handle legacy general images
      if (updateData.legacyGeneralImages !== undefined) {
        updateFields.legacyGeneralImages = updateData.legacyGeneralImages;
        console.log(`Updating legacy images: ${updateData.legacyGeneralImages.length} images`);
      }
      
      // Handle other fields that might be missing
      const additionalFields = ['generalAmenities', 'otherAmenities', 'policyDetails', 'minStay', 'maxStay', 'totalHotelRooms', 'propertySize', 'availability', 'hotelEmail'];
      additionalFields.forEach(field => {
        if (updateData[field] !== undefined) {
          updateFields[field] = updateData[field];
        }
      });
      
      // Only allow admin to explicitly change verification status
      if (isAdmin && updateData.verificationStatus !== undefined) {
        updateFields.verificationStatus = updateData.verificationStatus;
        if (updateData.verificationStatus === 'approved') {
          updateFields.verifiedAt = new Date();
          updateFields.verifiedBy = token.sub;
          updateFields.isPublished = true;
        }
      }
      
      console.log("Fields to update:", JSON.stringify(updateFields));
      
      // Use updateOne to perform a direct update
      const updateResult = await Property.updateOne(
        { _id: id },
        { $set: updateFields }
      );
      
      console.log("Update result:", updateResult);
      
      if (updateResult.modifiedCount === 0) {
        console.log("No changes were made to the property");
      }
      
      // Get the updated property
      const updatedProperty = await Property.findById(id);
      
      if (!updatedProperty) {
        return NextResponse.json(
          { success: false, message: "Property not found after update" },
          { status: 404 }
        );
      }
      
      console.log("Property after update:", {
        id: updatedProperty._id,
        title: updatedProperty.title,
        status: updatedProperty.status,
        stayTypes: updatedProperty.stayTypes,
        isPublished: updatedProperty.isPublished,
        verificationStatus: updatedProperty.verificationStatus
      });
      
      return NextResponse.json({
        success: true,
        message: "Property updated successfully via POST-update endpoint",
        property: {
          id: updatedProperty._id,
          title: updatedProperty.title,
          propertyType: updatedProperty.propertyType,
          status: updatedProperty.status,
          stayTypes: updatedProperty.stayTypes
        }
      });
    } catch (updateError) {
      console.error("Error updating property:", updateError);
      return NextResponse.json(
        { 
          success: false, 
          message: "Failed to update property", 
          error: (updateError as Error).message,
          stack: (updateError as Error).stack
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Uncaught error in update endpoint:", error);
    return NextResponse.json(
      { 
        success: false, 
        message: "Unexpected error updating property", 
        error: (error as Error).message,
        stack: (error as Error).stack
      },
      { status: 500 }
    );
  }
} 