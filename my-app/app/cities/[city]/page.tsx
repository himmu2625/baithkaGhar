"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

export default function CityPage() {
  const params = useParams();
  const cityName = (params?.city as string) || "";

  const [properties, setProperties] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCityProperties() {
      if (!cityName) return;

      try {
        setIsLoading(true);
        const response = await fetch(
          `/api/properties?city=${encodeURIComponent(cityName.toLowerCase())}`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch properties");
        }

        const data = await response.json();
        setProperties(data.properties || []);
        setError(null);
      } catch (err) {
        console.error("Error fetching city properties:", err);
        setError("Failed to load properties. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    }

    fetchCityProperties();
  }, [cityName]);

  // Format city name for display
  const formatCityName = (name: string) => {
    return name
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  };

  const displayName = formatCityName(cityName || "");

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-20 min-h-screen flex justify-center items-center">
        <div className="animate-spin h-8 w-8 border-4 border-green-500 rounded-full border-t-transparent"></div>
        <span className="ml-2 text-green-700">
          Loading properties in {displayName}...
        </span>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="bg-green-700 text-white p-8">
        <div className="container mx-auto">
          <Link
            href="/cities"
            className="text-white hover:underline mb-4 inline-block"
          >
            ← Back to Cities
          </Link>
          <h1 className="text-3xl font-bold mt-4">{displayName}</h1>
          <p className="text-lg">{properties.length} properties available</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold text-green-700 mb-4">
          Properties in {displayName}
        </h2>
        <p className="text-green-600 mb-6">
          Browse our selection of premium accommodations in {displayName}
        </p>

        {error ? (
          <div className="p-8 text-center">
            <p className="text-red-500 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
            >
              Try Again
            </button>
          </div>
        ) : properties.length === 0 ? (
          <div className="p-8 text-center border border-dashed border-gray-300 rounded-lg">
            <h3 className="text-xl font-semibold text-green-700 mb-2">
              No Properties Found
            </h3>
            <p className="text-green-600 mb-4">
              We don't have any properties listed in {displayName} yet.
            </p>
            <Link
              href="/list-property"
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded inline-block"
            >
              List Your Property
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {properties.map((property: any) => (
              <div
                key={property.id}
                className="border rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow"
              >
                <div className="h-48 bg-gray-200"></div>
                <div className="p-4">
                  <h3 className="font-semibold text-lg">{property.title}</h3>
                  <p className="text-gray-600">{property.type}</p>
                  <p className="text-green-700 font-bold mt-2">
                    ₹{property.price}/night
                  </p>
                  <Link
                    href={`/property/${property.id}`}
                    className="mt-3 inline-block bg-green-600 text-white px-3 py-1 rounded text-sm"
                  >
                    View Details
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
