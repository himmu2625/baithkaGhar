import { NextRequest, NextResponse } from 'next/server';
import { cityService } from '@/services/cityService';
import { PropertyService } from '@/services/property-service';

interface Params {
  params: {
    id: string;
  };
}

// GET /api/cities/[id]/properties - Get properties for a specific city
export async function GET(req: NextRequest, { params }: Params) {
  try {
    const { id } = params;
    
    // First try to get the city to ensure it exists
    const cities = await cityService.getAllCities();
    const city = cities.find(c => c.id === id);
    
    if (!city) {
      return NextResponse.json(
        { error: 'City not found' },
        { status: 404 }
      );
    }
    
    // Get properties for this city
    const properties = await PropertyService.getPropertiesByCity(city.name);
    
    return NextResponse.json({
      city,
      properties,
      count: properties.length
    });
  } catch (error) {
    console.error(`Error in GET /api/cities/${params.id}/properties:`, error);
    return NextResponse.json(
      { error: 'Failed to fetch city properties' },
      { status: 500 }
    );
  }
} 