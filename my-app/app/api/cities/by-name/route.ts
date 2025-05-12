import { NextResponse } from 'next/server';
import { cityService } from '@/services/cityService';
import { connectMongo } from '@/lib/db/mongodb';

// Force dynamic to prevent caching
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    // Extract the name from query params
    const { searchParams } = new URL(request.url);
    const name = searchParams.get('name');
    
    if (!name) {
      return NextResponse.json(
        { error: 'City name is required' },
        { status: 400 }
      );
    }
    
    // Ensure database connection
    await connectMongo();
    
    // Format the city name correctly by replacing hyphens with spaces and capitalizing each word
    const formattedName = name
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
    
    console.log(`Searching for city: ${formattedName}`);
    
    // Get the city from the database
    const city = await cityService.getCityByName(formattedName);
    
    if (!city) {
      return NextResponse.json(
        { error: 'City not found' },
        { status: 404 }
      );
    }
    
    // Set cache control headers to prevent caching
    const response = NextResponse.json(city);
    response.headers.set('Cache-Control', 'no-store, max-age=0');
    response.headers.set('Pragma', 'no-cache');
    
    return response;
  } catch (error) {
    console.error('Error fetching city by name:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch city', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
} 