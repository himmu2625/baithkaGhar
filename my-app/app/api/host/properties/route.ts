import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { connectMongo } from "@/lib/db/mongodb";
import Property from "@/models/Property";

export async function GET(req: NextRequest) {
  try {
    // Verify authentication
    const token = await getToken({ req });
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectMongo();

    // Fetch properties for the authenticated user/host
    const properties = await Property.find({ 
      userId: token.id || token.sub,
      status: { $ne: 'deleted' }
    })
    .select('_id title type address price rating occupancyRate')
    .sort({ createdAt: -1 })
    .lean();

    // Format properties for frontend
    const formattedProperties = properties.map((property: any) => ({
      id: property._id.toString(),
      title: property.title || 'Untitled Property',
      type: property.type || 'Unknown',
      location: property.address ? 
        `${property.address.city || ''}, ${property.address.state || ''}`.trim().replace(/^,|,$/, '') 
        : 'Unknown Location',
      price: property.price || 0,
      rating: property.rating || 0,
      occupancy: property.occupancyRate || 0
    }));

    return NextResponse.json({
      success: true,
      properties: formattedProperties
    });

  } catch (error: any) {
    console.error("Host Properties API Error:", error);
    return NextResponse.json(
      { success: false, error: "Internal Server Error", details: error.message },
      { status: 500 }
    );
  }
} 