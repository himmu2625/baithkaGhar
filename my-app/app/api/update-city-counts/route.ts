import { NextRequest, NextResponse } from 'next/server';
import { connectMongo } from '@/lib/db/mongodb';
import Property from '@/models/Property';
import City from '@/models/city';
import { auth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET /api/update-city-counts - Update all city property counts
export async function GET(req: NextRequest) {
  try {
    // Check for admin authentication
    const session = await auth();
    if (!session?.user || (session.user.role !== 'admin' && session.user.role !== 'super_admin')) {
      return NextResponse.json(
        { success: false, message: "Unauthorized - Admin access required" },
        { status: 403 }
      );
    }

    await connectMongo();
    
    // Get all cities first
    const cities = await City.find({});
    const cityUpdateResults = [];

    // For each city, count properties and update
    for (const city of cities) {
      // Get the city name
      const cityName = city.name;
      
      // Count properties in this city with a proper query structure
      const cityRegex = new RegExp(cityName, 'i');
      const propertyCount = await Property.countDocuments({
        isPublished: true,
        verificationStatus: 'approved',
        status: 'available',
        'address.city': cityRegex
      });
      
      // Update the city with the new count
      const updatedCity = await City.findByIdAndUpdate(
        city._id,
        { properties: propertyCount, updatedAt: new Date() },
        { new: true }
      );
      
      cityUpdateResults.push({
        id: city._id.toString(),
        name: city.name,
        oldCount: city.properties,
        newCount: propertyCount,
        success: !!updatedCity
      });
    }
    
    return NextResponse.json({
      success: true,
      message: `Updated property counts for ${cityUpdateResults.length} cities`,
      results: cityUpdateResults
    });
  } catch (error) {
    console.error('Error updating city property counts:', error);
    return NextResponse.json(
      { error: 'Failed to update city property counts' },
      { status: 500 }
    );
  }
} 