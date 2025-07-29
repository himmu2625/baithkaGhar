"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { MapPin, Home, Star, Bath, Bed, Users, Loader2, Building } from "lucide-react";
import { BuildingIcon, LocationIcon } from "@/components/ui/enhanced-icons";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BackButton } from "@/components/ui/back-button";
import { motion } from "framer-motion";
import { PropertyCard } from "@/components/ui/property-card";

interface Property {
  id: string;
  title: string;
  type: string;
  price: number;
  thumbnail: string | null;
  categorizedImages?: Array<{
    category: string;
    files: Array<{ url: string; public_id: string }>;
  }>;
  legacyGeneralImages?: Array<{ url: string; public_id: string }>;
  city: string;
  location: string;
  bedrooms: number;
  bathrooms: number;
  maxGuests: number;
  rating: number;
}

export default function CityPage() {
  const params = useParams();
  const cityName = (params?.city as string) || "";

  const [properties, setProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [cityInfo, setCityInfo] = useState<{name: string, image?: string}>({name: ''});

  useEffect(() => {
    async function fetchCityInfo() {
      try {
        const response = await fetch(`/api/cities/by-name?name=${encodeURIComponent(cityName)}`);
        if (response.ok) {
          const cityData = await response.json();
          setCityInfo(cityData);
        }
      } catch (err) {
        console.error("Error fetching city info:", err);
      }
    }

    fetchCityInfo();
  }, [cityName]);

  useEffect(() => {
    async function fetchCityProperties() {
      if (!cityName) return;

      try {
        setIsLoading(true);
        const response = await fetch(
          `/api/properties/by-city?city=${encodeURIComponent(cityName.toLowerCase())}&timestamp=${Date.now()}`,
          {
            method: 'GET',
            headers: {
              'Cache-Control': 'no-cache',
              'Pragma': 'no-cache'
            }
          }
        );

        if (response.status === 404) {
          console.log("by-city endpoint not found, trying general properties endpoint");
          const fallbackResponse = await fetch(
            `/api/properties?city=${encodeURIComponent(cityName.toLowerCase())}&timestamp=${Date.now()}`,
            {
              method: 'GET',
              headers: {
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache'
              }
            }
          );
          
          if (!fallbackResponse.ok) {
            throw new Error(`Failed to fetch properties: ${fallbackResponse.status}`);
          }
          
          const fallbackData = await fallbackResponse.json();
          
          if (!fallbackData.success) {
            throw new Error(fallbackData.message || "Failed to load properties");
          }
          
          console.log("Properties from fallback response:", fallbackData.properties);
          setProperties(fallbackData.properties || []);
          setError(null);
          return;
        }

        if (!response.ok) {
          throw new Error(`Failed to fetch properties: ${response.status}`);
        }

        const data = await response.json();
        
        if (!data.success) {
          throw new Error(data.message || "Failed to load properties");
        }
        
        console.log("Properties received:", data.properties);
        // Add detailed debugging for property types
        if (data.properties && data.properties.length > 0) {
          console.log("First property received from API:", data.properties[0]);
          console.log("Property types received:", data.properties.map((p: any) => ({
            id: p.id,
            title: p.title,
            type: p.type || 'No type found'
          })));
        }
        
        setProperties(data.properties || []);
        setError(null);
      } catch (err) {
        console.error("Error fetching city properties:", err);
        setError(err instanceof Error ? err.message : "Failed to load properties. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    }

    fetchCityProperties();
  }, [cityName]);

  useEffect(() => {
    // Debug properties data
    if (properties.length > 0) {
      console.log("Properties in city page:", properties);
      // Add additional logging for property types
      console.log("Property types:", properties.map(p => ({ id: p.id, title: p.title, type: p.type })));
    }
  }, [properties]);

  // Format city name for display
  const formatCityName = (name: string) => {
    return name
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  };

  const displayName = cityInfo.name || formatCityName(cityName || "");

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-24 md:py-32 min-h-screen flex flex-col items-center justify-center">
        <Loader2 className="h-10 w-10 text-mediumGreen animate-spin mb-4" />
        <h3 className="text-xl font-semibold text-mediumGreen">
          Loading properties in {displayName}...
        </h3>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-16">
      {/* Hero Section */}
      <div className="relative bg-darkGreen text-lightYellow pt-16 pb-12 min-h-[40vh]">
        {/* Background Image with Better Quality */}
        <div className="absolute inset-0 z-0">
          {cityInfo.image ? (
            <Image 
              src={cityInfo.image} 
              alt={`${displayName} cityscape`}
              fill
              className="object-cover"
              style={{ opacity: 0.7 }}
              priority
              quality={85}
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 70vw"
            />
          ) : (
            <Image 
              src={`/images/${cityName.toLowerCase()}.jpg`} 
              alt={`${displayName} cityscape`}
              fill
              className="object-cover"
              style={{ opacity: 0.7 }}
              priority
              quality={85}
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 70vw"
              onError={(e) => {
                // Fallback to a default city image if specific city image not found
                e.currentTarget.src = "/placeholder.svg";
              }}
            />
          )}
          {/* Improved overlay for better text readability */}
          <div className="absolute inset-0 bg-gradient-to-b from-darkGreen/60 via-darkGreen/50 to-darkGreen/70" />
        </div>
        
        <div className="container mx-auto relative z-10 py-8 px-4 md:px-0">
          <BackButton 
            variant="ghost"
            className="text-lightGreen hover:text-lightYellow hover:bg-lightGreen/10 mb-6"
            text="Back"
            onClick={() => window.location.href = '/'}
          />
          
          <div className="mt-4 flex items-center">
            <LocationIcon size="xl" className="text-lightGreen mr-3" />
            <h1 className="text-4xl md:text-5xl font-bold text-white drop-shadow-lg">{displayName}</h1>
          </div>
          
          <div className="mt-3 flex items-center">
            <BuildingIcon size="md" className="text-lightGreen mr-2" />
            <p className="text-xl text-lightYellow/90 font-medium drop-shadow">
              {properties.length} {properties.length === 1 ? 'property' : 'properties'} available
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12">
        <h2 className="text-2xl font-bold text-darkGreen mb-2 flex items-center">
          <Home className="w-6 h-6 mr-2 text-mediumGreen" />
          Properties in {displayName}
        </h2>
        <p className="text-mediumGreen mb-8">
          Browse our selection of premium accommodations in {displayName}
        </p>

        {error ? (
          <div className="p-8 text-center bg-red-50 rounded-lg border border-red-100">
            <p className="text-red-600 mb-4">{error}</p>
            <Button
              onClick={() => window.location.reload()}
              className="bg-mediumGreen hover:bg-darkGreen text-lightYellow"
            >
              Try Again
            </Button>
          </div>
        ) : properties.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="p-12 text-center border-2 border-dashed border-lightGreen/30 rounded-xl bg-lightGreen/5"
          >
            <Image 
              src="/images/empty-properties.svg" 
              alt="No properties" 
              width={200} 
              height={200} 
              className="mx-auto mb-6"
              onError={(e) => {
                e.currentTarget.src = "/placeholder.svg";
              }}
            />
            <h3 className="text-2xl font-semibold text-darkGreen mb-3">
              No Properties Yet in {displayName}
            </h3>
            <p className="text-mediumGreen mb-6 max-w-md mx-auto">
              We're growing fast! Be the first to list your property in {displayName} and stand out from the crowd.
            </p>
            <div className="flex gap-4 justify-center">
              <Link href="/">
                <Button variant="outline" className="border-mediumGreen text-mediumGreen">
                  Explore Other Cities
                </Button>
              </Link>
              <Link href="/list-property">
                <Button className="bg-mediumGreen hover:bg-darkGreen text-lightYellow">
                  List Your Property
                </Button>
              </Link>
            </div>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {properties.map((property, index) => (
              <motion.div
                key={property.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <PropertyCard
                  property={{
                    ...property,
                    location: property.city
                  }}
                  showCategorizedImages={true}
                />
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
