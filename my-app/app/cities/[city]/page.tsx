"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { MapPin, Home, Star, Bath, Bed, Users, Loader2, Building, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";

interface Property {
  id: string;
  title: string;
  type: string;
  price: number;
  thumbnail: string | null;
  city: string;
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
      <div className="relative bg-darkGreen text-lightYellow pt-10 md:pt-10">
        {/* Background Image with Overlay */}
        <div className="absolute inset-0 bg-darkGreen/80 z-0">
          {cityInfo.image && (
            <Image 
              src={cityInfo.image} 
              alt={displayName}
              fill
              style={{ objectFit: 'cover', opacity: 0.3 }}
              priority
            />
          )}
        </div>
        
        <div className="container mx-auto relative z-10 py-12 px-4 md:px-0">
          <Link
            href="/"
            className="inline-flex items-center text-lightGreen hover:text-lightYellow transition-colors mb-0 "
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Homepage
          </Link>
          
          <div className="mt-4 flex items-center">
            <MapPin className="h-8 w-8 text-lightGreen mr-2" />
            <h1 className="text-4xl font-bold">{displayName}</h1>
          </div>
          
          <div className="mt-2 flex items-center">
            <Building className="h-5 w-5 text-lightGreen mr-2" />
            <p className="text-xl">
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
              <Link
                key={property.id}
                href={`/property/${property.id}`}
                className="group focus:outline-none focus:ring-2 focus:ring-mediumGreen rounded-xl"
              >
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                  className="border border-gray-200 rounded-xl overflow-hidden shadow-md group-hover:shadow-lg transition-all group-hover:-translate-y-1"
                >
                  <div className="relative h-48 bg-gray-100">
                    {property.thumbnail ? (
                      <Image
                        src={property.thumbnail}
                        alt={property.title}
                        fill
                        style={{ objectFit: "cover" }}
                        onError={(e) => {
                          console.log("Image load error, replacing with placeholder");
                          (e.target as HTMLImageElement).src = "/placeholder.svg";
                        }}
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full bg-gray-200">
                        <Home className="h-12 w-12 text-gray-400" />
                      </div>
                    )}
                    <div className="absolute top-2 right-2 z-10">
                      <Badge className="bg-lightGreen text-darkGreen font-medium shadow-lg border border-lightGreen/30 hover:bg-lightGreen/90 transition-colors">
                        {property.type || 'Property'}
                      </Badge>
                    </div>
                    <div className="absolute top-2 left-2 z-10">
                      <Badge className="bg-darkGreen text-lightYellow font-medium shadow-lg">
                        Property {index + 1}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="p-4">
                    <div className="flex items-center text-xs text-mediumGreen mb-1">
                      <MapPin className="h-3 w-3 mr-1" />
                      <span>{property.city}</span>
                    </div>
                    <h3 className="font-semibold text-darkGreen text-lg mb-2 line-clamp-1">
                      {property.title}
                    </h3>
                    
                    <div className="flex justify-between items-center mb-3">
                      <div className="flex items-center text-amber-500">
                        <Star className="h-4 w-4 fill-current" />
                        <span className="ml-1 text-sm">
                          {property.rating.toFixed(1)}
                        </span>
                      </div>
                      <p className="text-darkGreen font-bold">
                        ₹{property.price.toLocaleString()}<span className="text-sm font-normal">/night</span>
                      </p>
                    </div>
                    
                    <div className="flex text-gray-500 text-sm mb-4 justify-between">
                      <div className="flex items-center">
                        <Bed className="h-4 w-4 mr-1" />
                        <span>{property.bedrooms} {property.bedrooms === 1 ? 'bed' : 'beds'}</span>
                      </div>
                      <div className="flex items-center">
                        <Bath className="h-4 w-4 mr-1" />
                        <span>{property.bathrooms} {property.bathrooms === 1 ? 'bath' : 'baths'}</span>
                      </div>
                      <div className="flex items-center">
                        <Users className="h-4 w-4 mr-1" />
                        <span>{property.maxGuests} guests</span>
                      </div>
                    </div>
                    
                    <div className="block w-full text-center bg-mediumGreen group-hover:bg-darkGreen text-lightYellow py-2 rounded-md transition-colors font-medium">
                      View Details
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
