"use client";

import { useRef, useEffect, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  MapPin,
  Building,
  Navigation,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, useAnimation } from "framer-motion";
import Link from "next/link";

// Define local CityData interface instead of importing from server-only service
interface CityData {
  id?: string;
  name: string;
  properties?: number;
  image?: string;
}

interface City extends CityData {
  id: string;
}

export default function PopularCities() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const controls = useAnimation();
  const [cities, setCities] = useState<City[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    controls.start({ opacity: 1, y: 0 });
  }, [controls]);

  useEffect(() => {
    async function fetchCities() {
      try {
        setIsLoading(true);
        const response = await fetch("/api/cities");

        if (!response.ok) {
          throw new Error("Failed to fetch cities");
        }

        const citiesData = await response.json();
        setCities(citiesData);
        setError(null);
      } catch (err) {
        console.error("Error fetching cities:", err);
        setError("Failed to load cities. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    }

    fetchCities();
  }, []);

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const { current } = scrollRef;
      const scrollAmount =
        direction === "left"
          ? -current.clientWidth / 1.5
          : current.clientWidth / 1.5;

      current.scrollBy({
        left: scrollAmount,
        behavior: "smooth",
      });
    }
  };

  if (isLoading) {
    return (
      <section className="py-16 bg-gradient-to-b from-lightYellow to-white">
        <div
          className="container mx-auto px-4 flex justify-center items-center"
          style={{ minHeight: "300px" }}
        >
          <Loader2 className="h-8 w-8 text-mediumGreen animate-spin" />
          <span className="ml-2 text-mediumGreen">Loading cities...</span>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="py-16 bg-gradient-to-b from-lightYellow to-white">
        <div
          className="container mx-auto px-4 text-center"
          style={{ minHeight: "300px" }}
        >
          <p className="text-red-500">{error}</p>
          <Button
            onClick={() => window.location.reload()}
            className="mt-4 bg-mediumGreen hover:bg-darkGreen"
          >
            Retry
          </Button>
        </div>
      </section>
    );
  }

  if (cities.length === 0) {
    return null;
  }

  return (
    <section className="py-16 bg-gradient-to-b from-lightYellow to-white">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={controls}
          transition={{ duration: 0.5 }}
          className="text-center mb-8"
        >
          <h2 className="text-3xl font-bold text-darkGreen mb-4 flex items-center justify-center">
            <Navigation className="mr-2 h-6 w-6 text-mediumGreen animate-pulse-light" />
            Popular Destinations
          </h2>
          <p className="text-mediumGreen max-w-2xl mx-auto">
            Explore our most popular cities with the best accommodations
          </p>
        </motion.div>

        <div className="relative bg-lightGreen/10 rounded-xl p-4 md:p-6 shadow-md">
          <div className="relative overflow-hidden">
            <div
              ref={scrollRef}
              className="flex gap-3 md:gap-4 overflow-x-auto smooth-scroll scrollbar-hide pb-4"
              style={{
                scrollSnapType: "x mandatory",
                scrollBehavior: "smooth",
              }}
            >
              {cities.map((city, index) => (
                <motion.div
                  key={city.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{
                    duration: 0.5,
                    delay: index * 0.05,
                    type: "spring",
                    stiffness: 100,
                  }}
                  viewport={{ once: true }}
                  className="min-w-[220px] sm:min-w-[250px] md:min-w-[280px] scroll-snap-align-start"
                  style={{ scrollSnapAlign: "start" }}
                >
                  <Link
                    href={`/cities/${city.name.toLowerCase()}`}
                    className="block group focus:outline-none focus:ring-2 focus:ring-lightGreen rounded-xl"
                  >
                    <div className="relative overflow-hidden rounded-xl h-64 sm:h-72 md:h-80 shadow-md group-hover:shadow-xl transition-all duration-300 group-hover:-translate-y-1">
                      <img
                        src={city.image || "/placeholder.svg"}
                        alt={city.name}
                        className="object-cover w-full h-full transition-transform duration-700 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-darkGreen/70 to-transparent" />
                      <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6 text-lightYellow">
                        <div className="flex items-center mb-1">
                          <MapPin className="w-4 h-4 md:w-5 md:h-5 mr-1 text-lightGreen group-hover:animate-bounce-light" />
                          <h3 className="text-xl md:text-2xl font-bold">
                            {city.name}
                          </h3>
                        </div>
                        <div className="flex items-center text-lightYellow/90 text-sm md:text-base">
                          <Building className="w-3 h-3 md:w-4 md:h-4 mr-1 text-lightGreen" />
                          <p>{city.properties || 0} properties</p>
                        </div>
                      </div>
                      <div className="absolute inset-0 bg-darkGreen/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-300">
                        <span className="px-3 py-1 md:px-4 md:py-2 bg-lightGreen text-darkGreen rounded-full font-bold text-sm md:text-base transform scale-0 group-hover:scale-100 transition-transform duration-300">
                          Explore Now
                        </span>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-lightYellow hover:bg-lightGreen text-darkGreen rounded-full shadow-lg z-10 w-8 h-8 md:w-10 md:h-10"
            onClick={() => scroll("left")}
          >
            <ArrowLeft className="h-4 w-4 md:h-6 md:w-6" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-lightYellow hover:bg-lightGreen text-darkGreen rounded-full shadow-lg z-10 w-8 h-8 md:w-10 md:h-10"
            onClick={() => scroll("right")}
          >
            <ArrowRight className="h-4 w-4 md:h-6 md:w-6" />
          </Button>
        </div>
      </div>
    </section>
  );
}