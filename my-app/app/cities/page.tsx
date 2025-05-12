"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { 
  MapPin, 
  Building, 
  ArrowLeft, 
  Loader2,
  Search
} from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface City {
  id: string;
  name: string;
  properties: number;
  image?: string;
}

export default function CitiesPage() {
  const [cities, setCities] = useState<City[]>([]);
  const [filteredCities, setFilteredCities] = useState<City[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  
  useEffect(() => {
    const fetchCities = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/cities?timestamp=${Date.now()}`, {
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        });
        
        if (!response.ok) {
          throw new Error("Failed to fetch cities");
        }
        
        const citiesData = await response.json();
        setCities(citiesData);
        setFilteredCities(citiesData);
        setError(null);
      } catch (err) {
        console.error("Error fetching cities:", err);
        setError("Failed to load cities. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchCities();
  }, []);
  
  // Filter cities based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredCities(cities);
      return;
    }
    
    const query = searchQuery.toLowerCase();
    const filtered = cities.filter(city => 
      city.name.toLowerCase().includes(query)
    );
    
    setFilteredCities(filtered);
  }, [searchQuery, cities]);
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center py-20">
        <div className="flex flex-col items-center">
          <Loader2 className="h-12 w-12 text-mediumGreen animate-spin" />
          <p className="mt-4 text-mediumGreen font-medium">Loading cities...</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="min-h-screen py-16">
        <div className="container mx-auto px-4">
          <Link
            href="/"
            className="inline-flex items-center text-mediumGreen hover:text-darkGreen transition-colors mb-6"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Homepage
          </Link>
          
          <div className="flex flex-col items-center justify-center py-16">
            <div className="text-red-500 mb-4">{error}</div>
            <Button 
              onClick={() => window.location.reload()}
              className="bg-mediumGreen hover:bg-darkGreen text-lightYellow"
            >
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen py-16">
      <div className="container mx-auto px-4">
        <Link
          href="/"
          className="inline-flex items-center text-mediumGreen hover:text-darkGreen transition-colors mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Homepage
        </Link>
        
        <h1 className="text-3xl md:text-4xl font-bold text-darkGreen mb-4">Explore Our Cities</h1>
        <p className="text-mediumGreen mb-8 max-w-2xl">
          Discover accommodations in beautiful cities across the country. Each city offers unique experiences and places to stay.
        </p>
        
        {/* Search */}
        <div className="mb-8 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <Input
              type="text"
              placeholder="Search cities..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 border-lightGreen focus:border-mediumGreen"
            />
          </div>
        </div>
        
        {filteredCities.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-lg">
            <p className="text-gray-500">No cities found matching "{searchQuery}"</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredCities.map((city, index) => (
              <Link
                key={city.id}
                href={`/cities/${city.name.toLowerCase()}`}
                className="group focus:outline-none focus:ring-2 focus:ring-lightGreen rounded-xl"
              >
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className="relative h-64 rounded-xl overflow-hidden shadow-md group-hover:shadow-xl transition-all duration-300 group-hover:-translate-y-1"
                >
                  <Image
                    src={city.image || "/placeholder.svg"}
                    alt={city.name}
                    fill
                    style={{ objectFit: "cover" }}
                    className="transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-darkGreen/70 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-6 text-lightYellow">
                    <div className="flex items-center mb-1">
                      <MapPin className="w-5 h-5 mr-1 text-lightGreen group-hover:animate-bounce-light" />
                      <h3 className="text-xl font-bold">{city.name}</h3>
                    </div>
                    <div className="flex items-center text-lightYellow/90">
                      <Building className="w-4 h-4 mr-1 text-lightGreen" />
                      <p>{city.properties} properties</p>
                    </div>
                  </div>
                </motion.div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 