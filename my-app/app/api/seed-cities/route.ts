import { NextResponse } from 'next/server';
import { cityService, CityData } from '@/services/cityService';

// Initial city data from the existing component
const initialCities: CityData[] = [
  {
    name: "Goa",
    properties: 0,
    image: "/images/mumbai.jpg",
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

export async function POST() {
  try {
    console.log('Starting to seed cities from route handler...');
    await cityService.seedInitialCities(initialCities);
    console.log('Cities seeded successfully from route handler!');
    return NextResponse.json({ success: true });
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