"use client";

import React, { createContext, useState, useEffect, useContext } from "react";

// Define city data type without importing from server-side service
export interface CityData {
  id?: string;
  name: string;
  properties?: number;
  image?: string;
}

interface CitiesContextType {
  cities: CityData[];
  isLoading: boolean;
  error: string | null;
  refreshCities: () => Promise<void>;
}

const CitiesContext = createContext<CitiesContextType | undefined>(undefined);

export function CitiesProvider({ children }: { children: React.ReactNode }) {
  const [cities, setCities] = useState<CityData[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);

  const fetchCities = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/cities");

      if (!response.ok) {
        throw new Error("Failed to fetch cities");
      }

      const citiesData = await response.json();
      setCities(citiesData);
      setError(null);
      return citiesData;
    } catch (err) {
      console.error("Error fetching cities:", err);
      setError("Failed to load cities");
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  const seedCities = async () => {
    try {
      const response = await fetch("/api/seed-cities", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to seed cities");
      }

      return await response.json();
    } catch (err) {
      console.error("Error seeding cities:", err);
      throw err;
    }
  };

  const initializeCities = async () => {
    // Try to fetch cities first
    const existingCities = await fetchCities();

    // If no cities exist, seed initial data
    if (existingCities.length === 0) {
      try {
        await seedCities();
        // Fetch cities again after seeding
        await fetchCities();
      } catch (err) {
        console.error("Error seeding cities:", err);
      }
    }

    setInitialized(true);
  };

  // Initialize cities on first load
  useEffect(() => {
    if (!initialized) {
      initializeCities();
    }
  }, [initialized]);

  const refreshCities = async () => {
    await fetchCities();
  };

  return (
    <CitiesContext.Provider value={{ cities, isLoading, error, refreshCities }}>
      {children}
    </CitiesContext.Provider>
  );
}

export function useCities() {
  const context = useContext(CitiesContext);
  if (context === undefined) {
    throw new Error("useCities must be used within a CitiesProvider");
  }
  return context;
}
