import { NextRequest, NextResponse } from 'next/server';
import { cityService } from '@/services/cityService';
import { auth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET /api/cities - Get all cities
export async function GET() {
  try {
    console.log('Cities API: Fetching all cities');
    const cities = await cityService.getAllCities();
    
    // Create response with cities data
    const response = NextResponse.json(cities);
    
    // Add cache control headers to prevent caching
    response.headers.set('Cache-Control', 'no-store, max-age=0');
    response.headers.set('Pragma', 'no-cache');
    
    console.log(`Cities API: Returning ${cities.length} cities`);
    return response;
  } catch (error) {
    console.error('Cities API: Error fetching cities:', error);
    return NextResponse.json(
      { error: 'Failed to fetch cities' },
      { status: 500 }
    );
  }
}

// POST /api/cities - Create a new city (admin only)
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    
    // Check if user is admin
    if (session?.user?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required' },
        { status: 403 }
      );
    }
    
    const cityData = await req.json();
    
    // Validate required fields
    if (!cityData.name) {
      return NextResponse.json(
        { error: 'City name is required' },
        { status: 400 }
      );
    }
    
    const existingCity = await cityService.getCityByName(cityData.name);
    if (existingCity) {
      return NextResponse.json(
        { error: 'City with this name already exists' },
        { status: 409 }
      );
    }
    
    const newCity = await cityService.createCity(cityData);
    return NextResponse.json(newCity, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/cities:', error);
    return NextResponse.json(
      { error: 'Failed to create city' },
      { status: 500 }
    );
  }
} 