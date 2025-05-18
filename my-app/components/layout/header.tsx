"use client";

import type React from "react";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  CalendarDays,
  MapPin,
  Users,
  Search,
  Menu,
  LogOut,
  Home,
  Sparkles,
  HelpCircle,
  Building,
  X,
  Phone,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter, usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { ModeToggle } from "@/components/ui/mode-toggle";
import LoginSignup from "@/components/features/auth/login-signup";
import { useCities } from "@/provider/cities-provider";
import Image from "next/image";

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session } = useSession();
  const [scrolled, setScrolled] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [checkIn, setCheckIn] = useState<Date>();
  const [checkOut, setCheckOut] = useState<Date>();
  const [nights, setNights] = useState(0);
  const [guests, setGuests] = useState(1);
  const [rooms, setRooms] = useState(1);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [location, setLocation] = useState("");
  const [searchBoxAligned, setSearchBoxAligned] = useState(false);

  const headerRef = useRef<HTMLDivElement>(null);
  const heroBoxRef = useRef<HTMLDivElement>(null);

  // Use the cities context
  const { cities, isLoading: citiesLoading } = useCities();

  // Derive location data from cities
  const locations =
    cities.length > 0
      ? cities.map((city) => city.name)
      : [
          "Goa",
          "Mumbai",
          "Delhi",
          "Bangalore",
          "Kolkata",
          "Chennai",
          "Hyderabad",
          "Pune",
          "Jaipur",
          "Shimla",
        ];

  // Check if we're on a page other than home
  const isNotHomePage = pathname !== "/";

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 100) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    window.addEventListener("scroll", handleScroll);

    // If not on home page, always show the transformed header
    if (isNotHomePage) {
      setScrolled(true);
    }

    return () => window.removeEventListener("scroll", handleScroll);
  }, [isNotHomePage]);

  useEffect(() => {
    if (checkIn && checkOut) {
      const diffTime = Math.abs(checkOut.getTime() - checkIn.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      setNights(diffDays);
    }
  }, [checkIn, checkOut]);

  useEffect(() => {
    if (guests > 3) {
      setRooms(Math.ceil(guests / 3));
    }
  }, [guests]);

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        mobileMenuOpen &&
        headerRef.current &&
        !headerRef.current.contains(e.target as Node)
      ) {
        setMobileMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [mobileMenuOpen]);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  const handleLogout = async () => {
    await signOut({ redirect: false });
    // Force a hard page reload to ensure session is properly cleared
    window.location.href = "/";
  };

  const getInitials = (name: string) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  const handleLoginClick = () => {
    if (pathname !== "/login") {
      setShowLoginModal(true);
    } else {
      router.push("/login");
    }
  };

  const handleSignupClick = () => {
    router.push("/signup");
  };

  const handleSuccessfulLogin = (name: string) => {
    setShowLoginModal(false);
    // No need to manually set login state; NextAuth handles this
  };

  useEffect(() => {
    const handleSearchBoxAligned = (event: CustomEvent) => {
      setSearchBoxAligned(event.detail.aligned);
    };

    // TypeScript needs this cast
    window.addEventListener(
      "searchBoxAligned",
      handleSearchBoxAligned as EventListener
    );

    return () => {
      window.removeEventListener(
        "searchBoxAligned",
        handleSearchBoxAligned as EventListener
      );
    };
  }, []);

  // Update check-in/check-out relationship
  const handleCheckInChange = (date: Date | undefined) => {
    setCheckIn(date);

    // If check-out date exists but is before the new check-in date, reset it
    if (date && checkOut && checkOut < date) {
      // Set check-out to the day after check-in by default
      const nextDay = new Date(date);
      nextDay.setDate(nextDay.getDate() + 1);
      setCheckOut(nextDay);
    }
  };

  // Modified List Property handler with forced navigation and error handling
  const handleListPropertyClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Always use direct navigation to prevent authentication loops
    if (session?.user) {
      console.log(
        "User is authenticated, using direct navigation to list property"
      );
      window.location.href = "/list-property";
    } else {
      console.log(
        "User is not authenticated, redirecting to login with callback"
      );
      window.location.href = "/login?callbackUrl=/list-property";
      setShowLoginModal(false);
    }
  };

  // Add a scroll behavior utility
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Add a better navigation method that ensures direct links work
  const navigateTo = (path: string) => {
    // Use router for client-side navigation instead of direct location change
    router.push(path);
  };

  // Update handleNavClick to use our new navigation method
  const handleNavClick = (path: string) => {
    setMobileMenuOpen(false); // Close the mobile menu
    navigateTo(path); // Use direct navigation
  };

  return (
    <header
      ref={headerRef}
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        scrolled || isNotHomePage
          ? "bg-darkGreen shadow-md py-2"
          : "bg-transparent py-4"
      )}
    >
      <div className="container mx-auto px-4">
        {/* Main header row */}
        <div
          className={`flex items-center ${
            scrolled || isNotHomePage || searchBoxAligned
              ? "flex-wrap md:flex-nowrap gap-2"
              : "justify-between"
          }`}
        >
          {/* Logo */}
          <Link
            href="/"
            className={`flex items-center group mr-2 md:mr-4 h-9`}
            aria-label="Go to homepage"
          >
            <div className="relative flex-shrink-0 flex items-center justify-center" style={{width: "100%", height: "100%", maxWidth: "100px", maxHeight: "100px"}}>
              <Image
                src="/Logo.png"
                alt="Baithaka Ghar Logo"
                width={72}
                height={72}
                className="object-contain"
                priority
                unoptimized
              />
            </div>
          </Link>

          {/* OYO-style search bar when scrolled */}
          {(scrolled || isNotHomePage || searchBoxAligned) && (
            <div className="flex flex-grow flex-wrap md:flex-nowrap items-center gap-1.5 md:gap-2 bg-white dark:bg-darkGreen/90 rounded-lg border border-lightGreen/20 p-1 pr-0 h-9 md:h-10">
              {/* Location */}
              <div className="w-full md:w-auto flex-grow flex items-center bg-transparent">
                <MapPin className="text-lightGreen hidden md:block h-4 w-4 ml-1 mr-2" />
                <Select value={location} onValueChange={setLocation}>
                  <SelectTrigger className="border-none focus:ring-0 w-full md:min-w-[200px] h-9 md:h-10">
                    <SelectValue placeholder="Where are you going?" />
                  </SelectTrigger>
                  <SelectContent>
                    {locations.map((loc) => (
                      <SelectItem key={loc} value={loc}>
                        {loc}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Check-in */}
              <div className="w-full md:w-auto flex-shrink-0 border-l border-gray-300 dark:border-gray-700 pl-2 hidden md:block">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="ghost"
                      className="h-10 gap-2 font-normal justify-start"
                    >
                      <CalendarDays className="h-4 w-4 text-lightGreen" />
                      <div className="text-left">
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          Check-in
                        </div>
                        <div>
                          {checkIn ? format(checkIn, "MMM d") : "Add date"}
                        </div>
                      </div>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 bg-darkGreen border border-lightGreen/50 shadow-lg shadow-darkGreen" align="start">
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

              {/* Check-out */}
              <div className="w-full md:w-auto flex-shrink-0 border-l border-gray-300 dark:border-gray-700 pl-2 hidden md:block">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="ghost"
                      className="h-10 gap-2 font-normal justify-start"
                      disabled={!checkIn}
                    >
                      <CalendarDays className="h-4 w-4 text-lightGreen" />
                      <div className="text-left">
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          Check-out
                        </div>
                        <div>
                          {checkOut ? format(checkOut, "MMM d") : "Add date"}
                        </div>
                      </div>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 bg-darkGreen border border-lightGreen/50 shadow-lg shadow-darkGreen" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={checkOut}
                      onSelect={setCheckOut}
                      initialFocus
                      disabled={(date) =>
                        checkIn ? date <= new Date(checkIn) : true
                      }
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Guests and Rooms */}
              <div className="w-full md:w-auto flex-shrink-0 border-l border-gray-300 dark:border-gray-700 pl-2 hidden md:block">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="ghost"
                      className="h-10 gap-2 font-normal justify-start"
                    >
                      <Users className="h-4 w-4 text-lightGreen" />
                      <div className="text-left">
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          Guests & Rooms
                        </div>
                        <div>
                          {guests} Guest{guests !== 1 ? "s" : ""}, {rooms} Room
                          {rooms !== 1 ? "s" : ""}
                        </div>
                      </div>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-52 p-4">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span>Guests</span>
                        <div className="flex items-center space-x-1">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-6 w-6 rounded-full p-0"
                            onClick={() => setGuests(Math.max(1, guests - 1))}
                            disabled={guests <= 1}
                          >
                            -
                          </Button>
                          <span className="w-6 text-center">{guests}</span>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-6 w-6 rounded-full p-0"
                            onClick={() => setGuests(guests + 1)}
                          >
                            +
                          </Button>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Rooms</span>
                        <div className="flex items-center space-x-1">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-6 w-6 rounded-full p-0"
                            onClick={() => setRooms(Math.max(1, rooms - 1))}
                            disabled={
                              rooms <= 1 || rooms <= Math.ceil(guests / 3)
                            }
                          >
                            -
                          </Button>
                          <span className="w-6 text-center">{rooms}</span>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-6 w-6 rounded-full p-0"
                            onClick={() => setRooms(rooms + 1)}
                          >
                            +
                          </Button>
                        </div>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>

              {/* Compact mobile view for date/guests */}
              <div className="md:hidden w-full flex items-center justify-between">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="h-9 w-[48%] text-xs justify-between"
                    >
                      <CalendarDays className="h-3 w-3 text-lightGreen" />
                      <span>
                        {checkIn && checkOut
                          ? `${format(checkIn, "MMM d")} - ${format(
                              checkOut,
                              "MMM d"
                            )}`
                          : "Add dates"}
                      </span>
                      <span>→</span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 bg-darkGreen border border-lightGreen/50 shadow-lg shadow-darkGreen">
                    <div className="p-2 flex flex-col gap-2">
                      <div>
                        <div className="text-xs font-medium mb-1 text-lightYellow">Check-in</div>
                        <CalendarComponent
                          mode="single"
                          selected={checkIn}
                          onSelect={handleCheckInChange}
                          disabled={(date) => date < new Date()}
                        />
                      </div>
                      <div className="mt-2">
                        <div className="text-xs font-medium mb-1 text-lightYellow">
                          Check-out
                        </div>
                        <CalendarComponent
                          mode="single"
                          selected={checkOut}
                          onSelect={setCheckOut}
                          disabled={(date) =>
                            checkIn ? date <= new Date(checkIn) : true
                          }
                        />
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>

                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="h-9 w-[48%] text-xs">
                      <Users className="h-3 w-3 text-lightGreen" />
                      <span>
                        {guests} Guest{guests !== 1 ? "s" : ""}, {rooms} Room
                        {rooms !== 1 ? "s" : ""}
                      </span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-48 p-2">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs">Guests</span>
                        <div className="flex items-center space-x-1">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-5 w-5 rounded-full p-0"
                            onClick={() => setGuests(Math.max(1, guests - 1))}
                            disabled={guests <= 1}
                          >
                            -
                          </Button>
                          <span className="w-4 text-center text-xs">
                            {guests}
                          </span>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-5 w-5 rounded-full p-0"
                            onClick={() => setGuests(guests + 1)}
                          >
                            +
                          </Button>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs">Rooms</span>
                        <div className="flex items-center space-x-1">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-5 w-5 rounded-full p-0"
                            onClick={() => setRooms(Math.max(1, rooms - 1))}
                            disabled={rooms <= 1}
                          >
                            -
                          </Button>
                          <span className="w-4 text-center text-xs">
                            {rooms}
                          </span>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-5 w-5 rounded-full p-0"
                            onClick={() => setRooms(rooms + 1)}
                          >
                            +
                          </Button>
                        </div>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>

              {/* Search button */}
              <Button 
                className="w-full md:w-auto md:h-10 h-7 bg-lightGreen hover:bg-lightGreen/90 text-darkGreen px-2 md:px-3"
                onClick={() => {
                  if (!location) {
                    alert('Please enter a location');
                    return;
                  }
                  
                  // Construct search URL with parameters
                  const searchParams = new URLSearchParams();
                  searchParams.append('location', location);
                  
                  if (checkIn) {
                    searchParams.append('checkIn', checkIn.toISOString());
                  }
                  
                  if (checkOut) {
                    searchParams.append('checkOut', checkOut.toISOString());
                  }
                  
                  searchParams.append('guests', guests.toString());
                  searchParams.append('rooms', rooms.toString());
                  
                  // Navigate to search page with the parameters
                  window.location.href = `/search?${searchParams.toString()}`;
                }}
              >
                <Search className="h-4 w-4" />
                <span className="md:inline-block md:ml-1 sr-only md:not-sr-only">Search</span>
              </Button>
            </div>
          )}

          {/* Desktop Navigation - Standard, visible when not scrolled */}
          {!scrolled && !isNotHomePage && (
            <div className="hidden md:flex items-center space-x-2 lg:space-x-6 ml-auto">
              <a
                href="/about"
                className="text-lightYellow hover:text-lightGreen transition-colors flex items-center gap-1 group relative text-xs lg:text-base"
                onClick={(e) => {
                  e.preventDefault();
                  navigateTo("/about");
                }}
              >
                <Home className="w-3.5 h-3.5 lg:w-4 lg:h-4 group-hover:animate-bounce-light" />
                <span>About Us</span>
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-lightGreen transition-all duration-300 group-hover:w-full"></span>
              </a>
              <a
                href="/contact"
                className="text-lightYellow hover:text-lightGreen transition-colors flex items-center gap-1 group relative text-xs lg:text-base"
                onClick={(e) => {
                  e.preventDefault();
                  navigateTo("/contact");
                }}
              >
                <MapPin className="w-3.5 h-3.5 lg:w-4 lg:h-4 group-hover:animate-bounce-light" />
                <span>Contact Us</span>
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-lightGreen transition-all duration-300 group-hover:w-full"></span>
              </a>
              <a
                href="/faq"
                className="text-lightYellow hover:text-lightGreen transition-colors flex items-center gap-1 group relative text-xs lg:text-base"
                onClick={(e) => {
                  e.preventDefault();
                  navigateTo("/faq");
                }}
              >
                <HelpCircle className="w-3.5 h-3.5 lg:w-4 lg:h-4 group-hover:animate-bounce-light" />
                <span>FAQs</span>
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-lightGreen transition-all duration-300 group-hover:w-full"></span>
              </a>

              <a
                href="/list-property"
                className="text-lightYellow hover:text-lightGreen transition-colors flex items-center gap-1 group relative text-xs lg:text-base"
                onClick={handleListPropertyClick}
              >
                <Building className="w-3.5 h-3.5 lg:w-4 lg:h-4 group-hover:animate-bounce-light" />
                <span className="whitespace-nowrap">List Property</span>
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-lightGreen transition-all duration-300 group-hover:w-full"></span>
              </a>

              <ModeToggle />

              {session?.user ? (
                <div className="relative group">
                  <Button
                    variant="ghost"
                    className="text-lightYellow hover:text-lightGreen flex items-center gap-1 sm:gap-2 p-1"
                  >
                    <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-lightGreen to-mediumGreen flex items-center justify-center text-darkGreen font-semibold text-xs sm:text-sm">
                      {getInitials(session.user.name || "")}
                    </div>
                    <span className="hidden lg:inline-block text-xs lg:text-sm">
                      {session.user.name || "User"}
                    </span>
                  </Button>
                  <div className="absolute right-0 mt-2 w-40 lg:w-48 bg-lightYellow dark:bg-darkGreen dark:border dark:border-lightGreen/30 rounded-lg shadow-lg overflow-hidden z-20 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 transform group-hover:translate-y-0 translate-y-2">
                    <div className="py-1">
                      <Link
                        href="/profile"
                        className="block px-4 py-1.5 lg:py-2 text-darkGreen dark:text-lightYellow hover:bg-lightGreen/20 transition-colors text-xs lg:text-sm"
                      >
                        Edit Profile
                      </Link>
                      <Link
                        href="/bookings"
                        className="block px-4 py-1.5 lg:py-2 text-darkGreen dark:text-lightYellow hover:bg-lightGreen/20 transition-colors text-xs lg:text-sm"
                      >
                        My Bookings
                      </Link>
                      <Link
                        href="/favorites"
                        className="block px-4 py-1.5 lg:py-2 text-darkGreen dark:text-lightYellow hover:bg-lightGreen/20 transition-colors text-xs lg:text-sm"
                      >
                        Favorite Locations
                      </Link>
                      <Link
                        href="/refunds"
                        className="block px-4 py-1.5 lg:py-2 text-darkGreen dark:text-lightYellow hover:bg-lightGreen/20 transition-colors text-xs lg:text-sm"
                      >
                        Refund Status
                      </Link>
                      <Link
                        href="/reviews"
                        className="block px-4 py-1.5 lg:py-2 text-darkGreen dark:text-lightYellow hover:bg-lightGreen/20 transition-colors text-xs lg:text-sm"
                      >
                        My Reviews
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="block w-full text-left px-4 py-1.5 lg:py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-xs lg:text-sm"
                      >
                        Logout
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Button
                    onClick={handleLoginClick}
                    className="bg-lightGreen hover:bg-lightGreen/80 text-darkGreen font-medium rounded-full px-2.5 xs:px-3 sm:px-4 py-0.5 xs:py-1 h-auto text-xs transition-all duration-300 hover:shadow-lg hover:scale-105"
                  >
                    <span className="whitespace-nowrap">Login</span>
                  </Button>
                  <Button
                    onClick={handleSignupClick}
                    className="bg-mediumGreen hover:bg-mediumGreen/80 text-lightYellow font-medium rounded-full px-2.5 xs:px-3 sm:px-4 py-0.5 xs:py-1 h-auto text-xs transition-all duration-300 hover:shadow-lg hover:scale-105"
                  >
                    <span className="whitespace-nowrap">Signup</span>
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Right-side elements that are always visible */}
          {(scrolled || isNotHomePage || searchBoxAligned) && (
            <div className="hidden md:flex items-center ml-2 gap-2">
              <a
                href="/list-property"
                className="text-lightYellow hover:text-lightGreen text-sm whitespace-nowrap cursor-pointer"
                onClick={handleListPropertyClick}
              >
                List Property
              </a>

              <Link
                href="tel:+911234567890"
                className="flex items-center gap-1 text-lightYellow hover:text-lightGreen text-sm"
              >
                <Phone className="h-4 w-4" />
                <span className="hidden lg:inline">Book now</span>
              </Link>

              <ModeToggle />

              {session?.user ? (
                <div className="relative group">
                  <Button
                    variant="ghost"
                    className="text-lightYellow hover:text-lightGreen p-1"
                  >
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-lightGreen to-mediumGreen flex items-center justify-center text-darkGreen font-semibold">
                      {getInitials(session.user.name || "")}
                    </div>
                  </Button>
                  <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-darkGreen dark:border dark:border-lightGreen/30 rounded-lg shadow-lg overflow-hidden z-20 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300">
                    {/* User dropdown menu - same as before */}
                    <div className="py-1">
                      <Link
                        href="/profile"
                        className="block px-4 py-2 text-darkGreen dark:text-lightYellow hover:bg-lightGreen/20 transition-colors text-sm"
                      >
                        Edit Profile
                      </Link>
                      {/* Other dropdown items */}
                      <button
                        onClick={handleLogout}
                        className="block w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-sm"
                      >
                        Logout
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Button
                    onClick={handleLoginClick}
                    className="bg-lightGreen hover:bg-lightGreen/80 text-darkGreen font-medium rounded-md h-9"
                  >
                    Login
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center gap-1 sm:gap-2 ml-auto">
            {!scrolled && !isNotHomePage && (
              <>
                {/* Mobile Logo (shown only when not scrolled) */}
                <div className="relative flex-shrink-0 flex items-center justify-center mr-1 sm:mr-2" style={{width: "36px", height: "36px"}}>
                  <Image
                    src="/Logo.png"
                    alt="Logo"
                    width={32}
                    height={32}
                    className="object-contain"
                    priority
                    unoptimized
                  />
                </div>
                {session?.user ? (
                  <div className="relative group">
                    <Button
                      variant="ghost"
                      className="text-lightYellow p-0.5 xs:p-1"
                      onClick={() => router.push("/profile")}
                    >
                      <div className="w-6 h-6 xs:w-7 xs:h-7 rounded-full bg-gradient-to-br from-lightGreen to-mediumGreen flex items-center justify-center text-darkGreen text-xs">
                        {getInitials(session.user.name || "")}
                      </div>
                    </Button>
                  </div>
                ) : (
                  <div className="flex gap-1">
                    <Button
                      onClick={handleLoginClick}
                      className="bg-lightGreen hover:bg-lightGreen/80 text-darkGreen font-medium text-xs px-2 xs:px-3 h-6 xs:h-7 rounded-full"
                    >
                      Login
                    </Button>
                    <Button
                      onClick={handleSignupClick}
                      className="bg-mediumGreen hover:bg-mediumGreen/80 text-lightYellow font-medium text-xs px-2 xs:px-3 h-6 xs:h-7 rounded-full"
                    >
                      Signup
                    </Button>
                  </div>
                )}
              </>
            )}
            {/* Mode Toggle */}
            <ModeToggle />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-lightYellow hover:text-lightGreen bg-darkGreen/30 rounded-full h-7 w-7 xs:h-8 xs:w-8"
            >
              {mobileMenuOpen ? (
                <X className="h-4 w-4 xs:h-5 xs:w-5" />
              ) : (
                <Menu className="h-4 w-4 xs:h-5 xs:w-5" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile menu overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="md:hidden absolute top-full left-0 right-0 bg-darkGreen/95 backdrop-blur-md p-2 xs:p-3 sm:p-4 shadow-lg border-t border-lightGreen/20 max-h-[80vh] overflow-y-auto z-50"
          >
            {/* Logo in mobile menu */}
            <div className="flex items-center justify-between mb-4 border-b border-lightGreen/20 pb-3">
              <div className="flex items-center gap-1.5">
                <div className="relative flex-shrink-0 flex items-center justify-center" style={{width: "36px", height: "36px"}}>
                  <Image
                    src="/Logo.png"
                    alt="Baithaka Ghar Logo"
                    width={32}
                    height={32}
                    className="object-contain"
                    unoptimized
                  />
                </div>
                <span className="text-lightYellow font-bold text-lg xs:text-xl flex items-center">Baithaka Ghar</span>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setMobileMenuOpen(false)}
                className="text-lightYellow hover:text-lightGreen bg-darkGreen/30 rounded-full h-7 w-7 xs:h-8 xs:w-8"
              >
                <X className="h-4 w-4 xs:h-5 xs:w-5" />
              </Button>
            </div>
            
            <nav className="flex flex-col space-y-1 xs:space-y-2 sm:space-y-3">
              <a
                href="/about"
                className="flex items-center gap-1.5 xs:gap-2 text-lightYellow p-1.5 rounded-lg hover:bg-lightGreen/10 transition-colors text-xs xs:text-sm sm:text-base w-full text-left"
                onClick={(e) => {
                  e.preventDefault();
                  handleNavClick("/about");
                }}
              >
                <Home className="w-3.5 h-3.5 xs:w-4 xs:h-4 sm:w-5 sm:h-5" />
                About Us
              </a>
              <a
                href="/contact"
                className="flex items-center gap-1.5 xs:gap-2 text-lightYellow p-1.5 rounded-lg hover:bg-lightGreen/10 transition-colors text-xs xs:text-sm sm:text-base w-full text-left"
                onClick={(e) => {
                  e.preventDefault();
                  handleNavClick("/contact");
                }}
              >
                <MapPin className="w-3.5 h-3.5 xs:w-4 xs:h-4 sm:w-5 sm:h-5" />
                Contact Us
              </a>
              <a
                href="/faq"
                className="flex items-center gap-1.5 xs:gap-2 text-lightYellow p-1.5 rounded-lg hover:bg-lightGreen/10 transition-colors text-xs xs:text-sm sm:text-base w-full text-left"
                onClick={(e) => {
                  e.preventDefault();
                  handleNavClick("/faq");
                }}
              >
                <HelpCircle className="w-3.5 h-3.5 xs:w-4 xs:h-4 sm:w-5 sm:h-5" />
                FAQs
              </a>

              <a
                href="/list-property"
                className="flex items-center gap-1.5 xs:gap-2 text-lightYellow p-1.5 rounded-lg hover:bg-lightGreen/10 transition-colors text-xs xs:text-sm sm:text-base w-full text-left"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setMobileMenuOpen(false);

                  // Use direct navigation approach to prevent loops
                  if (session?.user) {
                    console.log(
                      "Mobile: User is authenticated, using direct navigation to list property"
                    );
                    window.location.href = "/list-property";
                  } else {
                    console.log(
                      "Mobile: User is not authenticated, redirecting to login with callback"
                    );
                    window.location.href = "/login?callbackUrl=/list-property";
                    setShowLoginModal(false);
                  }
                }}
              >
                <Building className="w-3.5 h-3.5 xs:w-4 xs:h-4 sm:w-5 sm:h-5" />
                List Your Property
              </a>

              <div className="pt-1.5 xs:pt-2 border-t border-lightGreen/20">
                {session?.user ? (
                  <>
                    <div className="flex items-center gap-1.5 xs:gap-2 p-1.5 mb-1 xs:mb-2">
                      <div className="w-6 h-6 xs:w-7 xs:h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-lightGreen to-mediumGreen flex items-center justify-center text-darkGreen text-xs">
                        {getInitials(session.user.name || "")}
                      </div>
                      <span className="text-lightYellow text-xs xs:text-sm sm:text-base">
                        {session.user.name || "User"}
                      </span>
                    </div>
                    <Link
                      href="/profile"
                      className="flex items-center gap-1.5 xs:gap-2 text-lightYellow p-1.5 pl-6 sm:pl-8 rounded-lg hover:bg-lightGreen/10 transition-colors text-xs sm:text-sm"
                      onClick={(e) => handleNavClick("/profile")}
                    >
                      Edit Profile
                    </Link>
                    <Link
                      href="/bookings"
                      className="flex items-center gap-1.5 xs:gap-2 text-lightYellow p-1.5 pl-6 sm:pl-8 rounded-lg hover:bg-lightGreen/10 transition-colors text-xs sm:text-sm"
                      onClick={(e) => handleNavClick("/bookings")}
                    >
                      My Bookings
                    </Link>
                    <Link
                      href="/favorites"
                      className="flex items-center gap-1.5 xs:gap-2 text-lightYellow p-1.5 pl-6 sm:pl-8 rounded-lg hover:bg-lightGreen/10 transition-colors text-xs sm:text-sm"
                      onClick={(e) => handleNavClick("/favorites")}
                    >
                      Favorite Locations
                    </Link>
                    <Link
                      href="/refunds"
                      className="flex items-center gap-1.5 xs:gap-2 text-lightYellow p-1.5 pl-6 sm:pl-8 rounded-lg hover:bg-lightGreen/10 transition-colors text-xs sm:text-sm"
                      onClick={(e) => handleNavClick("/refunds")}
                    >
                      Refund Status
                    </Link>
                    <Link
                      href="/reviews"
                      className="flex items-center gap-1.5 xs:gap-2 text-lightYellow p-1.5 pl-6 sm:pl-8 rounded-lg hover:bg-lightGreen/10 transition-colors text-xs sm:text-sm"
                      onClick={(e) => handleNavClick("/reviews")}
                    >
                      My Reviews
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-1.5 xs:gap-2 text-red-500 w-full text-left p-1.5 mt-1 sm:mt-2 rounded-lg border border-red-500/20 hover:bg-red-500/10 transition-colors text-xs xs:text-sm sm:text-base"
                    >
                      <LogOut className="w-3.5 h-3.5 xs:w-4 xs:h-4 sm:w-5 sm:h-5" />
                      Logout
                    </button>
                  </>
                ) : (
                  <div className="space-y-2">
                    <Button
                      onClick={handleSignupClick}
                      className="w-full bg-gradient-to-r from-mediumGreen to-lightGreen hover:opacity-90 text-darkGreen font-medium text-xs xs:text-sm sm:text-base py-1.5 sm:py-2 h-auto"
                    >
                      Sign Up
                    </Button>
                    <Button
                      onClick={handleLoginClick}
                      className="w-full bg-gradient-to-r from-lightGreen to-mediumGreen hover:opacity-90 text-darkGreen font-medium text-xs xs:text-sm sm:text-base py-1.5 sm:py-2 h-auto"
                    >
                      Login
                    </Button>
                  </div>
                )}
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Login/Signup Modal */}
      <AnimatePresence>
        {showLoginModal && (
          <LoginSignup
            onClose={() => setShowLoginModal(false)}
            onLogin={handleSuccessfulLogin}
          />
        )}
      </AnimatePresence>
    </header>
  );
}
