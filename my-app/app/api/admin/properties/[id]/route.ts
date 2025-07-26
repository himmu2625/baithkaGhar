
import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db/dbConnect";
import Property from "@/models/Property";
import { revalidatePath } from "next/cache";

// GET a single property by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  await dbConnect();
  try {
    console.log('Fetching property with ID:', params.id);
    
    const property = await Property.findById(params.id)
      .populate({
        path: "hostId",
        select: "name email"
      })
      .lean();

    if (!property) {
      console.log('Property not found for ID:', params.id);
      return NextResponse.json(
        { message: "Property not found" },
        { status: 404 }
      );
    }

    console.log('Property found:', property.title || property.name);
    
    // Normalize the property data structure
    const normalizedProperty = {
      ...property,
      id: property._id.toString(),
      title: property.title || property.name || 'Unnamed Property',
      basePrice: property.price?.base || property.pricing?.perNight || property.price || 0,
      price: {
        base: property.price?.base || property.pricing?.perNight || property.price || 0,
        cleaning: property.price?.cleaning || 0,
        service: property.price?.service || 0,
        tax: property.price?.tax || 0
      },
      currency: 'INR', // Default currency since it's not in the Property model
      location: property.address?.city || property.location || 'Unknown location',
      totalHotelRooms: property.totalHotelRooms || property.maxGuests || 1,
      maxGuests: property.maxGuests || 1,
      dynamicPricing: property.dynamicPricing || {
        enabled: false,
        factors: {
          seasonality: { enabled: false, multiplier: 1.0 },
          demand: { enabled: false, multiplier: 1.0 },
          lastMinute: { enabled: false, multiplier: 1.0 },
          events: { enabled: false, multiplier: 1.0 }
        }
      }
    };

    return NextResponse.json(normalizedProperty, { status: 200 });
  } catch (error) {
    console.error("Error fetching property:", error);
    return NextResponse.json(
      { 
        message: "Internal Server Error", 
        error: error instanceof Error ? error.message : 'Unknown error',
        details: process.env.NODE_ENV === 'development' ? error : undefined
      },
      { status: 500 }
    );
  }
}

// UPDATE a property by ID
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  await dbConnect();
  try {
    const body = await request.json();
    const updatedProperty = await Property.findByIdAndUpdate(params.id, body, {
      new: true,
      runValidators: true,
    });

    if (!updatedProperty) {
      return NextResponse.json(
        { message: "Property not found" },
        { status: 404 }
      );
    }

    // Revalidate paths to reflect updates
    revalidatePath("/admin/properties");
    revalidatePath(`/property/${params.id}`);
    
    return NextResponse.json(updatedProperty, { status: 200 });
  } catch (error) {
    console.error("Error updating property:", error);
    return NextResponse.json(
      { message: "Internal Server Error", error: (error as Error).message },
      { status: 500 }
    );
  }
}

// DELETE a property by ID
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  await dbConnect();
  try {
    const deletedProperty = await Property.findByIdAndDelete(params.id);

    if (!deletedProperty) {
      return NextResponse.json(
        { message: "Property not found" },
        { status: 404 }
      );
    }
    
    revalidatePath("/admin/properties");

    return NextResponse.json(
      { message: "Property deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting property:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
} 

// PATCH: Update property base price
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  await dbConnect();
  const { id } = params;
  
  try {
    const body = await req.json();
    const { price } = body;

    if (!price || typeof price !== 'number' || price <= 0) {
      return NextResponse.json({ error: 'Valid price is required' }, { status: 400 });
    }

    const property = await Property.findByIdAndUpdate(
      id,
      { price },
      { new: true, runValidators: true, fields: { price: 1, title: 1 } }
    );

    if (!property) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 });
    }

    return NextResponse.json({ 
      message: 'Property price updated successfully',
      price: property.price 
    });
  } catch (error) {
    console.error('Property price update error:', error);
    return NextResponse.json({ 
      error: 'Failed to update property price', 
      details: error 
    }, { status: 500 });
  }
} 