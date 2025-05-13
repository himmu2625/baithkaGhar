import { NextRequest, NextResponse } from "next/server";
import { connectMongo } from "@/lib/db/mongodb";
import Property from "@/models/Property";

// Force dynamic to prevent caching
export const dynamic = 'force-dynamic';

// GET handler for a specific property
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Connect to MongoDB
    await connectMongo();

    // Get property ID from URL params
    const id = params.id;
    
    if (!id) {
      return NextResponse.json(
        { success: false, message: "Property ID is required" },
        { status: 400 }
      );
    }

    // Find property by ID
    const property = await Property.findById(id);
      
    if (!property) {
      return NextResponse.json(
        { success: false, message: "Property not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      method: "GET",
      property
    });
  } catch (error) {
    console.error("Error in GET:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch property", error: (error as Error).message },
      { status: 500 }
    );
  }
}

// PATCH handler to update a property
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get property ID from URL params
    const id = params.id;
    
    if (!id) {
      return NextResponse.json(
        { success: false, message: "Property ID is required" },
        { status: 400 }
      );
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
    
    return NextResponse.json({
      success: true,
      method: "PATCH",
      id,
      receivedData: updateData,
      message: "PATCH method is working correctly"
    });
  } catch (error) {
    console.error("Error in PATCH:", error);
    return NextResponse.json(
      { success: false, message: "Error processing PATCH request", error: (error as Error).message },
      { status: 500 }
    );
  }
}

// PUT handler to update a property
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get property ID from URL params
    const id = params.id;
    
    if (!id) {
      return NextResponse.json(
        { success: false, message: "Property ID is required" },
        { status: 400 }
      );
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
    
    return NextResponse.json({
      success: true,
      method: "PUT",
      id,
      receivedData: updateData,
      message: "PUT method is working correctly"
    });
  } catch (error) {
    console.error("Error in PUT:", error);
    return NextResponse.json(
      { success: false, message: "Error processing PUT request", error: (error as Error).message },
      { status: 500 }
    );
  }
}

// DELETE handler to delete a property
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get property ID from URL params
    const id = params.id;
    
    if (!id) {
      return NextResponse.json(
        { success: false, message: "Property ID is required" },
        { status: 400 }
      );
    }
    
    return NextResponse.json({
      success: true,
      method: "DELETE",
      id,
      message: "DELETE method is working correctly"
    });
  } catch (error) {
    console.error("Error in DELETE:", error);
    return NextResponse.json(
      { success: false, message: "Error processing DELETE request", error: (error as Error).message },
      { status: 500 }
    );
  }
}

// OPTIONS handler for CORS preflight requests
export async function OPTIONS(
  request: NextRequest
) {
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