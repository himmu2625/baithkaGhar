import { NextRequest, NextResponse } from 'next/server';
import { cityService, CityData } from '@/services/cityService';

// Ensure the endpoint is not cached
export const dynamic = 'force-dynamic';

// Initial city data from the existing component
const initialCities: CityData[] = [
  {
    name: "Goa",
    properties: 0,
    image: "/images/goa.jpg",
  },
  {
    name: "Bangalore",
    properties: 0,
    image: "/images/bangalore.jpg",
  },
  {
    name: "Chitrakoot",
    properties: 0,
    image: "/images/chitrakoot.jpg",
  },
  {
    name: "Mumbai",
    properties: 0,
    image: "/images/mumbai.jpg",
  },
  {
    name: "Hyderabad",
    properties: 0,
    image: "/images/hyderabad.jpg",
  },
  {
    name: "Chennai",
    properties: 0,
    image: "/images/chennai.jpg",
  },
  {
    name: "Nagpur",
    properties: 0,
    image: "/images/nagpur.jpg",
  },
  {
    name: "Pune",
    properties: 0,
    image: "/images/pune.jpg",
  },
  {
    name: "Ahmedabad",
    properties: 0,
    image: "/images/ahmedabad.jpg",
  },
  {
    name: "Lucknow",
    properties: 0,
    image: "/images/lucknow.jpg",
  },
  {
    name: "Varanasi",
    properties: 0,
    image: "/images/varanasi.jpg",
  },
  {
    name: "Ayodhya",
    properties: 0,
    image: "/images/ayodhya.jpg",
  },
  {
    name: "Mathura",
    properties: 0,
    image: "/images/mathura.jpg",
  },
  {
    name: "Prayagraj",
    properties: 0,
    image: "/images/prayagraj.jpg",
  },
];

// Support both GET (for easy browser access) and POST requests
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const force = searchParams.get('force') === 'true';
  return await seedCities(force);
}

export async function POST(request: NextRequest) {
  let force = false;
  
  // Try to parse JSON body if present
  try {
    const body = await request.json();
    force = !!body.force;
  } catch (e) {
    // If no body or invalid JSON, use default force=false
  }
  
  return await seedCities(force);
}

async function seedCities(force: boolean = false) {
  try {
    console.log(`Starting to seed cities. Force mode: ${force}`);
    
    // Use the enhanced seedInitialCities with force option
    await cityService.seedInitialCities(initialCities, { force });
    
    // Verify cities were seeded by checking for Goa
    const cities = await cityService.getAllCities();
    const goa = cities.find(city => city.name === 'Goa');
    
    if (!goa && cities.length === 0) {
      console.error('Seeding may have failed. No cities found after seeding operation.');
      return NextResponse.json(
        { 
          success: false, 
          error: 'No cities found after seeding operation' 
        },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ 
      success: true,
      message: `Cities seeded successfully. Force mode: ${force}`,
      count: cities.length,
      cities: cities.map(c => c.name)
    });
  } catch (error) {
    console.error('Error seeding cities:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 