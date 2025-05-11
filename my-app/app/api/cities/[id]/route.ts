import { NextRequest, NextResponse } from 'next/server';
import { cityService } from '@/services/cityService';
import { auth } from '@/lib/auth';

interface Params {
  params: {
    id: string;
  };
}

// GET /api/cities/[id] - Get city by ID
export async function GET(req: NextRequest, { params }: Params) {
  try {
    const { id } = params;
    const cities = await cityService.getAllCities();
    const city = cities.find(c => c.id === id);
    
    if (!city) {
      return NextResponse.json(
        { error: 'City not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(city);
  } catch (error) {
    console.error(`Error in GET /api/cities/${params.id}:`, error);
    return NextResponse.json(
      { error: 'Failed to fetch city' },
      { status: 500 }
    );
  }
}

// PATCH /api/cities/[id] - Update city (admin only)
export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const session = await auth();
    
    // Check if user is admin
    if (!session?.user?.isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required' },
        { status: 403 }
      );
    }
    
    const { id } = params;
    const cityData = await req.json();
    
    // Check if city exists
    const cities = await cityService.getAllCities();
    const cityExists = cities.some(c => c.id === id);
    
    if (!cityExists) {
      return NextResponse.json(
        { error: 'City not found' },
        { status: 404 }
      );
    }
    
    // If name is being updated, check for duplicates
    if (cityData.name) {
      const existingCity = await cityService.getCityByName(cityData.name);
      if (existingCity && existingCity.id !== id) {
        return NextResponse.json(
          { error: 'City with this name already exists' },
          { status: 409 }
        );
      }
    }
    
    const updatedCity = await cityService.updateCity(id, cityData);
    return NextResponse.json(updatedCity);
  } catch (error) {
    console.error(`Error in PATCH /api/cities/${params.id}:`, error);
    return NextResponse.json(
      { error: 'Failed to update city' },
      { status: 500 }
    );
  }
}

// DELETE /api/cities/[id] - Delete city (admin only)
export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const session = await auth();
    
    // Check if user is admin
    if (!session?.user?.isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required' },
        { status: 403 }
      );
    }
    
    const { id } = params;
    
    // Check if city exists
    const cities = await cityService.getAllCities();
    const city = cities.find(c => c.id === id);
    
    if (!city) {
      return NextResponse.json(
        { error: 'City not found' },
        { status: 404 }
      );
    }
    
    // Check if city has properties
    if (city.properties && city.properties > 0) {
      return NextResponse.json(
        { error: 'Cannot delete city with existing properties' },
        { status: 400 }
      );
    }
    
    await cityService.deleteCity(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(`Error in DELETE /api/cities/${params.id}:`, error);
    return NextResponse.json(
      { error: 'Failed to delete city' },
      { status: 500 }
    );
  }
} 