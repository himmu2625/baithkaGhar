"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import {
  CalendarDays,
  MapPin,
  Users,
  Search,
  Home,
} from "lucide-react";
import { LocationIcon, CalendarIcon, GuestsIcon, SearchIcon } from "@/components/ui/enhanced-icons";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format } from "date-fns";
import { useCities } from "@/provider/cities-provider";
import { AdvancedSearch } from "@/components/ui/advanced-search";
import { useRouter } from "next/navigation";

// India religious activities images
const slides = [
  {
    id: 1,
    image:
      "https://images.pexels.com/photos/2387871/pexels-photo-2387871.jpeg?auto=compress&cs=tinysrgb&w=1600",
    title: "Mumbai Experience",
    subtitle: "Explore the vibrant spiritual traditions of Mumbai",
    location: "Mumbai",
  },
  {
    id: 2,
    image:
      "https://images.pexels.com/photos/2901209/pexels-photo-2901209.jpeg?auto=compress&cs=tinysrgb&w=1600",
    title: "Varanasi Sacred Ghats",
    subtitle: "Witness the ancient rituals along the holy Ganges",
    location: "Varanasi",
  },
  {
    id: 3,
    image:
      "https://images.pexels.com/photos/2161467/pexels-photo-2161467.jpeg?auto=compress&cs=tinysrgb&w=1600",
    title: "Golden Temple",
    subtitle: "Experience the spiritual ambiance of the sacred Golden Temple",
    location: "Amritsar",
  },
  {
    id: 4,
    image:
      "https://images.pexels.com/photos/3581368/pexels-photo-3581368.jpeg?auto=compress&cs=tinysrgb&w=1600",
    title: "Hyderabad Heritage",
    subtitle: "Experience the blend of cultures and traditions",
    location: "Hyderabad",
  },
  {
    id: 5,
    image:
      "https://images.pexels.com/photos/3522880/pexels-photo-3522880.jpeg?auto=compress&cs=tinysrgb&w=1600",
    title: "Rajasthan Palaces",
    subtitle: "Stay in luxurious heritage properties of royal Rajasthan",
    location: "Jaipur",
  },
  {
    id: 6,
    image:
      "https://images.pexels.com/photos/1310788/pexels-photo-1310788.jpeg?auto=compress&cs=tinysrgb&w=1600",
    title: "Kerala Backwaters",
    subtitle: "Experience serene houseboat stays in God's own country",
    location: "Kerala",
  },
];

export default function HeroSection() {
  const router = useRouter();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [checkIn, setCheckIn] = useState<Date | undefined>(new Date());
  const [checkOut, setCheckOut] = useState<Date | undefined>(
    new Date(Date.now() + 24 * 60 * 60 * 1000)
  );
  const [nights, setNights] = useState(1);
  const [guests, setGuests] = useState(2);
  const [rooms, setRooms] = useState(1);
  const [location, setLocation] = useState("");
  const [selectedResult, setSelectedResult] = useState<any>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const searchBoxRef = useRef<HTMLDivElement>(null);
  const slidesRef = useRef<HTMLDivElement>(null);

  // Use the cities context
  const { cities, isLoading: citiesLoading } = useCities();

  // Derive location data from cities
  const locations =
    cities.length > 0
      ? cities.map((city) => city.name)
      : [
          "Goa",
          "Mumbai",
          "Bangalore",
          "Chitrakoot",
          "Hyderabad",
          "Chennai",
          "Nagpur",
          "Pune",
          "Ahmedabad",
          "Lucknow",
          "Varanasi",
          "Ayodhya",
          "Mathura",
          "Prayagraj",
        ];

  // Set loaded state after mount to avoid hydration issues
  useEffect(() => {
    setIsLoaded(true);

    // Adjust search box position based on viewport height for mobile
    const adjustSearchBox = () => {
      if (searchBoxRef.current) {
        const viewportHeight = window.innerHeight;
        const isMobile = window.innerWidth < 768;
        const isSmallScreen = window.innerWidth < 480;

        if (isMobile) {
          if (isSmallScreen) {
            // Extra small screens
            searchBoxRef.current.style.bottom = `${Math.max(
              10,
              viewportHeight * 0.12
            )}px`;
          } else {
            // Small to medium screens
            searchBoxRef.current.style.bottom = `${Math.max(
              10,
              viewportHeight * 0.15
            )}px`;
          }
        } else {
          // Reset for desktop
          searchBoxRef.current.style.bottom = "80px";
        }
      }
    };

    adjustSearchBox();
    window.addEventListener("resize", adjustSearchBox);

    return () => {
      window.removeEventListener("resize", adjustSearchBox);
    };
  }, []);

  // Auto-adjust rooms based on guest count
  useEffect(() => {
    const requiredRooms = Math.ceil(guests / 3);

    if (requiredRooms > rooms) {
      setRooms(requiredRooms);
    }
  }, [guests, rooms]);

  // Auto-slide functionality with 5-second interval
  useEffect(() => {
    if (!isLoaded) return;

    const slideInterval = setInterval(() => {
      setCurrentSlide((prevSlide) => (prevSlide === slides.length - 1 ? 0 : prevSlide + 1));
    }, 5000);

    return () => clearInterval(slideInterval);
  }, [isLoaded]);

  // Handle check-in date changes
  const handleCheckInChange = (date: Date | undefined) => {
    setCheckIn(date);

    // If checkout date exists but is before the new check-in date, reset it
    if (date && checkOut && checkOut < date) {
      // Set checkout to the day after check-in by default
      const nextDay = new Date(date);
      nextDay.setDate(nextDay.getDate() + 1);
      setCheckOut(nextDay);
    }
  };

  useEffect(() => {
    if (checkIn && checkOut) {
      const diffTime = Math.abs(checkOut.getTime() - checkIn.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      setNights(diffDays);
    }
  }, [checkIn, checkOut]);

  // Handle guest count changes
  const handleGuestChange = (newValue: number) => {
    if (newValue >= 1) {
      setGuests(newValue);
    }
  };

  // Handle room count changes
  const handleRoomChange = (newValue: number) => {
    const minRooms = Math.ceil(guests / 3);

    if (newValue >= minRooms) {
      setRooms(newValue);
    } else {
      // Show a message that rooms can't be reduced below the required minimum
      alert(`Minimum ${minRooms} room(s) required for ${guests} guests`);
    }
  };

  // Early return during SSR to prevent hydration mismatch
  if (!isLoaded) {
    return <div className="h-screen bg-lightYellow/30"></div>;
  }

  // Calculate slide position
  const slidePosition = -100 * currentSlide;

  return (
    <div className="relative h-[100svh] sm:h-screen overflow-hidden">
      {/* Background slides with automatic sliding */}
      <div 
        ref={slidesRef}
        className="absolute inset-0 w-full h-full" 
      >
        <div 
          className="flex h-full transition-transform duration-1000 ease-in-out"
          style={{ transform: `translateX(${slidePosition}%)` }}
        >
          {slides.map((slide, index) => (
            <div
              key={index}
              className="min-w-full w-full h-full flex-shrink-0 relative"
            >
              <div className="relative w-full h-full overflow-hidden">
                <Image
                  src={slide.image || "/placeholder.svg"}
                  alt={`${slide.title} - ${slide.subtitle}`}
                  fill
                  priority={index < 2}
                  loading={index < 2 ? "eager" : "lazy"}
                  sizes="100vw"
                  className="object-cover"
                  quality={80}
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = "/placeholder.svg";
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-black/60" />
                
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Hero Content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
        <div className="text-center mb-24 md:mb-24 px-4 relative -mt-32">
          <div className="w-full">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-lightYellow mb-4">
              <span className="block">Find Your Perfect Stay</span>
              <span className="block text-lightGreen mt-2">
                Book Hotels & Homes
              </span>
            </h1>
            <p className="text-sm sm:text-base md:text-xl text-lightYellow/90 max-w-xl md:max-w-2xl mx-auto mt-4">
              Affordable and reliable accommodation across India. Trusted by thousands of travelers.
            </p>
          </div>

          {/* This div is no longer needed with fixed sizing */}
          <div className="hidden">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4">
              <span className="block">Find Your Perfect</span>
              <span className="block mt-2">Home Away From Home</span>
            </h1>
            <p className="text-sm sm:text-base md:text-xl max-w-xl md:max-w-2xl mx-auto mt-4">
              Placeholder text for spacing
            </p>
          </div>
        </div>

        <div className="w-full flex justify-center">
          <div
            ref={searchBoxRef}
            className="w-[90%] sm:w-[80%] rounded-xl p-3 sm:p-3 shadow-xl border border-lightGreen/30 absolute z-20 bg-black/40 backdrop-blur-md -mt-24 lg:-mt-8"
          >
            <div className="flex flex-col lg:flex-row items-center justify-between gap-2 sm:gap-3">
              {/* Location */}
              <div className="w-full lg:w-[25%]">
                <label className="block text-xs sm:text-sm font-medium text-lightYellow mb-1">
                  Location
                </label>
                <AdvancedSearch
                  placeholder="City, region or hotel"
                  value={location}
                  onChange={(value) => {
                    setLocation(value);
                    // Clear selected result when manually typing
                    if (!value) setSelectedResult(null);
                  }}
                  onSelectResult={(result) => {
                    setSelectedResult(result);

                    // Set location
                    setLocation(result.name);

                    // Automatically trigger search/navigation
                    setTimeout(() => {
                      if (result.type === 'city') {
                        // Navigate to city page
                        const citySlug = result.name.toLowerCase().replace(/\s+/g, '-');
                        router.push(`/cities/${citySlug}`);
                      } else if ('id' in result && result.id) {
                        // Navigate directly to property page
                        router.push(`/property/${result.id}`);
                      }
                    }, 100);
                  }}
                  variant="hero"
                  className="w-full"
                />
              </div>

              {/* Adults */}
              <div className="w-full lg:w-[15%]">
                <label className="block text-xs sm:text-sm font-medium text-lightYellow mb-1">
                  Guests
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <GuestsIcon size="md" className="text-lightGreen" />
                  </div>
                  <div className="flex items-center w-full h-10 pl-10 pr-2 py-1 bg-darkGreen/60 border border-lightGreen/30 rounded-lg text-lightYellow">
                    <button
                      className="px-2 py-1 text-lightYellow hover:text-lightGreen"
                      onClick={() => handleGuestChange(guests - 1)}
                    >
                      -
                    </button>
                    <span className="flex-1 text-center">{guests}</span>
                    <button
                      className="px-2 py-1 text-lightYellow hover:text-lightGreen"
                      onClick={() => handleGuestChange(guests + 1)}
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

              {/* Rooms */}
              <div className="w-full lg:w-[15%]">
                <label className="block text-xs sm:text-sm font-medium text-lightYellow mb-1">
                  Rooms
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Home className="h-4 w-4 sm:h-5 sm:w-5 text-lightGreen" />
                  </div>
                  <div className="flex items-center w-full h-10 pl-10 pr-2 py-1 bg-darkGreen/60 border border-lightGreen/30 rounded-lg text-lightYellow">
                    <button
                      className="px-2 py-1 text-lightYellow hover:text-lightGreen"
                      onClick={() => handleRoomChange(rooms - 1)}
                    >
                      -
                    </button>
                    <span className="flex-1 text-center">{rooms}</span>
                    <button
                      className="px-2 py-1 text-lightYellow hover:text-lightGreen"
                      onClick={() => handleRoomChange(rooms + 1)}
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

              {/* Date Selection with Nights Pill */}
              <div className="w-full lg:w-[30%] flex flex-col">
                <div className="flex items-center justify-between">
                  <label className="text-xs sm:text-sm font-medium text-lightYellow">
                    Check-in
                  </label>
                  {nights > 0 && (
                    <span className="bg-lightGreen text-darkGreen text-xs font-medium px-2 py-0.5 rounded-full mx-2">
                      {nights} Nights
                    </span>
                  )}
                  <label className="text-xs sm:text-sm font-medium text-lightYellow">
                    Check-out
                  </label>
                </div>
                <div className="flex space-x-2 h-10">
                  {/* Check-in date */}
                  <div className="relative w-1/2">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <CalendarIcon size="md" className="text-lightGreen" />
                    </div>
                    <Popover>
                      <PopoverTrigger asChild>
                        <button className="w-full h-full pl-10 pr-2 py-2 bg-darkGreen/60 border border-lightGreen/30 rounded-lg text-lightYellow text-left focus:outline-none focus:ring-2 focus:ring-lightGreen truncate">
                          {checkIn
                            ? format(checkIn, "MMM dd, yyyy")
                            : "Start date"}
                        </button>
                      </PopoverTrigger>
                      <PopoverContent
                        className="w-auto p-0 bg-darkGreen border border-lightGreen/50 shadow-lg shadow-darkGreen"
                        align="start"
                      >
                        <CalendarComponent
                          mode="single"
                          selected={checkIn}
                          onSelect={handleCheckInChange}
                          initialFocus
                          disabled={(date) => date < new Date()}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  {/* Check-out date */}
                  <div className="relative w-1/2">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <CalendarIcon size="md" className="text-lightGreen" />
                    </div>
                    <Popover>
                      <PopoverTrigger asChild>
                        <button
                          className="w-full h-full pl-10 pr-2 py-2 bg-darkGreen/60 border border-lightGreen/30 rounded-lg text-lightYellow text-left focus:outline-none focus:ring-2 focus:ring-lightGreen truncate"
                          disabled={!checkIn} // Disable if no check-in date
                        >
                          {checkOut
                            ? format(checkOut, "MMM dd, yyyy")
                            : "End date"}
                        </button>
                      </PopoverTrigger>
                      <PopoverContent
                        className="w-auto p-0 bg-darkGreen border border-lightGreen/50 shadow-lg shadow-darkGreen"
                        align="start"
                      >
                        <CalendarComponent
                          mode="single"
                          selected={checkOut}
                          onSelect={setCheckOut}
                          initialFocus
                          disabled={(date) => {
                            // Disable dates before or equal to check-in
                            const checkInDate = checkIn
                              ? new Date(checkIn)
                              : new Date();
                            checkInDate.setHours(0, 0, 0, 0);
                            return date <= checkInDate;
                          }}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              </div>

              {/* Search button */}
              <div className="w-full lg:w-[15%] lg:self-end mt-1 lg:mt-0">
                <Button
                  className="w-full h-10 bg-gradient-to-r from-lightGreen to-mediumGreen hover:opacity-90 text-darkGreen font-medium transition-all duration-300 shadow-md hover:shadow-lg"
                  onClick={() => {
                    if (!location) {
                      alert("Please enter a location");
                      return;
                    }

                    // Smart navigation based on selected result type
                    if (selectedResult) {
                      if (selectedResult.type === 'city') {
                        // Navigate to city page
                        const citySlug = selectedResult.name.toLowerCase().replace(/\s+/g, '-');
                        router.push(`/cities/${citySlug}`);
                        return;
                      } else if (selectedResult.id) {
                        // Navigate directly to property page
                        router.push(`/property/${selectedResult.id}`);
                        return;
                      }
                    }

                    // Fallback: Construct search URL with parameters
                    const searchParams = new URLSearchParams();
                    searchParams.append("location", location);

                    if (checkIn) {
                      searchParams.append("checkIn", checkIn.toISOString());
                    }

                    if (checkOut) {
                      searchParams.append("checkOut", checkOut.toISOString());
                    }

                    searchParams.append("guests", guests.toString());
                    searchParams.append("rooms", rooms.toString());

                    // Navigate to search page with the parameters
                    router.push(`/search?${searchParams.toString()}`);
                  }}
                >
                  <SearchIcon size="md" />
                  Search
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
