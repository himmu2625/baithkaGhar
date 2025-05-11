import City from '@/models/city';
import { connectToDatabase } from '@/lib/mongodb';
// Mark this module as server-only
import 'server-only';

export interface CityData {
  id?: string;
  name: string;
  properties?: number;
  image?: string;
}

export const cityService = {
  // Get all cities
  getAllCities: async (): Promise<CityData[]> => {
    try {
      await connectToDatabase();
      const cities = await City.find({}).sort({ name: 1 });
      return cities.map(city => ({
        id: city._id.toString(),
        name: city.name,
        properties: city.properties,
        image: city.image,
      }));
    } catch (error) {
      console.error('Error fetching cities:', error);
      throw error;
    }
  },

  // Get city by name
  getCityByName: async (name: string): Promise<CityData | null> => {
    try {
      await connectToDatabase();
      const city = await City.findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') } });
      if (!city) return null;
      
      return {
        id: city._id.toString(),
        name: city.name,
        properties: city.properties,
        image: city.image,
      };
    } catch (error) {
      console.error(`Error fetching city ${name}:`, error);
      throw error;
    }
  },

  // Create new city
  createCity: async (cityData: CityData): Promise<CityData> => {
    try {
      await connectToDatabase();
      const newCity = await City.create(cityData);
      return {
        id: newCity._id.toString(),
        name: newCity.name,
        properties: newCity.properties,
        image: newCity.image,
      };
    } catch (error) {
      console.error('Error creating city:', error);
      throw error;
    }
  },

  // Update city
  updateCity: async (id: string, cityData: Partial<CityData>): Promise<CityData | null> => {
    try {
      await connectToDatabase();
      const updatedCity = await City.findByIdAndUpdate(
        id,
        { ...cityData, updatedAt: Date.now() },
        { new: true }
      );
      
      if (!updatedCity) return null;
      
      return {
        id: updatedCity._id.toString(),
        name: updatedCity.name,
        properties: updatedCity.properties,
        image: updatedCity.image,
      };
    } catch (error) {
      console.error(`Error updating city ${id}:`, error);
      throw error;
    }
  },

  // Delete city
  deleteCity: async (id: string): Promise<boolean> => {
    try {
      await connectToDatabase();
      const result = await City.findByIdAndDelete(id);
      return !!result;
    } catch (error) {
      console.error(`Error deleting city ${id}:`, error);
      throw error;
    }
  },

  // Increment property count for a city
  incrementPropertyCount: async (cityName: string): Promise<CityData | null> => {
    try {
      await connectToDatabase();
      const city = await City.findOneAndUpdate(
        { name: { $regex: new RegExp(`^${cityName}$`, 'i') } },
        { $inc: { properties: 1 }, updatedAt: Date.now() },
        { new: true }
      );
      
      if (!city) return null;
      
      return {
        id: city._id.toString(),
        name: city.name,
        properties: city.properties,
        image: city.image,
      };
    } catch (error) {
      console.error(`Error incrementing property count for city ${cityName}:`, error);
      throw error;
    }
  },

  // Decrement property count for a city
  decrementPropertyCount: async (cityName: string): Promise<CityData | null> => {
    try {
      await connectToDatabase();
      const city = await City.findOneAndUpdate(
        { name: { $regex: new RegExp(`^${cityName}$`, 'i') } },
        { $inc: { properties: -1 }, updatedAt: Date.now() },
        { new: true }
      );
      
      if (!city) return null;
      
      return {
        id: city._id.toString(),
        name: city.name,
        properties: city.properties,
        image: city.image,
      };
    } catch (error) {
      console.error(`Error decrementing property count for city ${cityName}:`, error);
      throw error;
    }
  },

  // Seed initial cities data
  seedInitialCities: async (cities: CityData[]): Promise<void> => {
    try {
      await connectToDatabase();
      
      // Check if cities already exist
      const count = await City.countDocuments();
      if (count > 0) return;
      
      // Insert initial cities
      await City.insertMany(cities);
      console.log('Initial cities seeded successfully');
    } catch (error) {
      console.error('Error seeding initial cities:', error);
      throw error;
    }
  }
}; 