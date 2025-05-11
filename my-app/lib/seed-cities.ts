// Client-safe alternative that uses fetch instead of direct import
export interface CityData {
  id?: string;
  name: string;
  properties?: number;
  image?: string;
}

export async function seedCities() {
  try {
    console.log('Starting to seed cities via API route...');
    const response = await fetch('/api/seed-cities', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to seed cities: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('Cities seeded successfully via API!');
    return data;
  } catch (error) {
    console.error('Error seeding cities:', error);
    throw error;
  }
}

// Example of usage:
// import { seedCities } from '@/lib/seed-cities';
// seedCities(); 