import { NextRequest, NextResponse } from "next/server"
import { connectMongo } from "@/lib/db/mongodb"
import Property from "@/models/Property"
import { getToken } from "next-auth/jwt"
import { authOptions } from "@/lib/auth"

// Force dynamic to prevent caching
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    // Validate token and admin access
    const token = await getToken({ req, secret: authOptions.secret });
    if (!token || !token.sub) {
      return NextResponse.json(
        { success: false, message: "Unauthorized - Please log in" },
        { status: 401 }
      );
    }

    // Connect to database
    await connectMongo();

    // Check if user is admin
    const user = await import('@/models/User').then(({ default: User }) => 
      User.findById(token.sub)
    );
    
    if (!user || !['admin', 'super_admin'].includes(user.role)) {
      return NextResponse.json(
        { success: false, message: "Unauthorized - Admin access required" },
        { status: 403 }
      );
    }

    // Get properties with 'apartment' as type
    const properties = await Property.find({ propertyType: 'apartment' });
    console.log(`Found ${properties.length} properties with 'apartment' type to update`);

    // Define keywords for property type detection
    const typeKeywords = {
      hotel: ['hotel', 'resort', 'inn', 'suites'],
      villa: ['villa', 'mansion', 'bungalow', 'cottage'],
      resort: ['resort', 'retreat', 'spa', 'lodge'],
      house: ['house', 'home', 'duplex', 'townhouse']
    };

    // Counter for updated properties
    let updatedCount = 0;
    const updatedProperties = [];

    // Update each property based on name or title pattern
    for (const property of properties) {
      let detectedType = 'apartment'; // Default
      const name = property.name?.toLowerCase() || '';
      const title = property.title?.toLowerCase() || '';
      const nameLower = (name || title).toLowerCase();

      // Try to detect property type from name or title
      for (const [type, keywords] of Object.entries(typeKeywords)) {
        if (keywords.some(keyword => nameLower.includes(keyword))) {
          detectedType = type;
          break;
        }
      }

      // Only update if we detected a different type
      if (detectedType !== 'apartment') {
        const oldType = property.propertyType;
        property.propertyType = detectedType;
        await property.save();
        updatedCount++;
        updatedProperties.push({
          id: property._id.toString(),
          name: property.name || property.title,
          oldType,
          newType: detectedType
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Updated ${updatedCount} properties with correct types`,
      updatedProperties
    });
  } catch (error) {
    console.error("Error updating property types:", error);
    return NextResponse.json(
      { success: false, message: "Failed to update property types", error: (error as Error).message },
      { status: 500 }
    );
  }
} 