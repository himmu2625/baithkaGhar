import { NextResponse } from 'next/server';
import { cityService } from '@/services/cityService';

export const dynamic = 'force-dynamic';

// GET /api/cities/visible - Get only visible cities (for public display)
export async function GET() {
  try {
    console.log('Cities API: Fetching visible cities');
    const cities = await cityService.getVisibleCities();

    // Log details for debugging
    console.log(`Cities API: Found ${cities.length} visible cities`);
    cities.forEach(city => {
      console.log(`  - ${city.name}: isVisible=${city.isVisible}, displayOrder=${city.displayOrder}`);
    });

    // Create response with cities data
    const response = NextResponse.json(cities);

    // Add cache control headers to prevent caching
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');

    console.log(`Cities API: Returning ${cities.length} visible cities`);
    return response;
  } catch (error) {
    console.error('Cities API: Error fetching visible cities:', error);
    return NextResponse.json(
      { error: 'Failed to fetch visible cities' },
      { status: 500 }
    );
  }
}
