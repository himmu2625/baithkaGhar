import City from '@/models/city';
import { connectToDatabase } from '@/lib/mongodb';
// Mark this module as server-only
// import 'server-only'; // Commented out for Vercel compatibility

export interface CityData {
  id?: string;
  name: string;
  properties?: number;
  image?: string;
  isVisible?: boolean;
  displayOrder?: number;
}

export const cityService = {
  // Get all cities (for admin)
  getAllCities: async (): Promise<CityData[]> => {
    try {
      await connectToDatabase();
      const cities = await City.find({}).sort({ displayOrder: 1, name: 1 });
      return cities.map(city => ({
        id: city._id.toString(),
        name: city.name,
        properties: city.properties,
        image: city.image,
        isVisible: city.isVisible ?? true,
        displayOrder: city.displayOrder ?? 0,
      }));
    } catch (error) {
      console.error('Error fetching cities:', error);
      throw error;
    }
  },

  // Get visible cities only (for public display)
  getVisibleCities: async (): Promise<CityData[]> => {
    try {
      await connectToDatabase();
      const cities = await City.find({ isVisible: true }).sort({ displayOrder: 1, name: 1 });
      return cities.map(city => ({
        id: city._id.toString(),
        name: city.name,
        properties: city.properties,
        image: city.image,
        isVisible: city.isVisible,
        displayOrder: city.displayOrder,
      }));
    } catch (error) {
      console.error('Error fetching visible cities:', error);
      throw error;
    }
  },

  // Get city by name
  getCityByName: async (name: string): Promise<CityData | null> => {
    try {
      await connectToDatabase();

      // Import city utilities
      const { getCityRegex } = await import('../lib/utils/city-utils');

      const cityRegex = getCityRegex(name);
      const city = await City.findOne({ name: { $regex: cityRegex } });
      if (!city) return null;

      return {
        id: city._id.toString(),
        name: city.name,
        properties: city.properties,
        image: city.image,
        isVisible: city.isVisible ?? true,
        displayOrder: city.displayOrder ?? 0,
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

      // Import city utilities
      const { normalizeCityName } = await import('../lib/utils/city-utils');

      // Normalize the city name before creating
      const normalizedCityData = {
        ...cityData,
        name: normalizeCityName(cityData.name)
      };

      const newCity = await City.create(normalizedCityData);
      return {
        id: newCity._id.toString(),
        name: newCity.name,
        properties: newCity.properties,
        image: newCity.image,
        isVisible: newCity.isVisible ?? true,
        displayOrder: newCity.displayOrder ?? 0,
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
        isVisible: updatedCity.isVisible ?? true,
        displayOrder: updatedCity.displayOrder ?? 0,
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

      // Import city utilities
      const { getCityRegex } = await import('../lib/utils/city-utils');

      const cityRegex = getCityRegex(cityName);
      const city = await City.findOneAndUpdate(
        { name: { $regex: cityRegex } },
        { $inc: { properties: 1 }, updatedAt: Date.now() },
        { new: true }
      );

      if (!city) return null;

      return {
        id: city._id.toString(),
        name: city.name,
        properties: city.properties,
        image: city.image,
        isVisible: city.isVisible ?? true,
        displayOrder: city.displayOrder ?? 0,
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

      // Import city utilities
      const { getCityRegex } = await import('../lib/utils/city-utils');

      const cityRegex = getCityRegex(cityName);
      const city = await City.findOneAndUpdate(
        { name: { $regex: cityRegex } },
        { $inc: { properties: -1 }, updatedAt: Date.now() },
        { new: true }
      );

      if (!city) return null;

      return {
        id: city._id.toString(),
        name: city.name,
        properties: city.properties,
        image: city.image,
        isVisible: city.isVisible ?? true,
        displayOrder: city.displayOrder ?? 0,
      };
    } catch (error) {
      console.error(`Error decrementing property count for city ${cityName}:`, error);
      throw error;
    }
  },

  // Seed initial cities data
  seedInitialCities: async (cities: CityData[], options?: { force?: boolean }): Promise<void> => {
    try {
      await connectToDatabase();
      
      // Check if cities already exist
      const count = await City.countDocuments();
      console.log(`Seeding cities - current count: ${count}, force: ${options?.force}`);
      
      // Only exit early if cities exist AND force is not enabled
      if (count > 0 && !options?.force) {
        console.log('Cities collection already has data. Skipping seeding. Use force option to override.');
        return;
      }
      
      // If we're forcing or no cities exist, clear existing data first to prevent duplicates
      if (count > 0 && options?.force) {
        console.log('Force option enabled. Clearing existing cities...');
        await City.deleteMany({});
      }
      
      // Insert initial cities
      await City.insertMany(cities);
      console.log(`Initial cities seeded successfully (${cities.length} cities)`);
    } catch (error) {
      console.error('Error seeding initial cities:', error);
      throw error;
    }
  }
}; 