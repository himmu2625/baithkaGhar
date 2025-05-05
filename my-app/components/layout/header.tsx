"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
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
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { motion, AnimatePresence } from "framer-motion"
import { useRouter, usePathname } from "next/navigation"
import { useSession, signOut } from "next-auth/react"
import { ModeToggle } from "@/components/ui/mode-toggle"
import LoginSignup from "@/components/features/auth/login-signup"

export default function Header() {
  const router = useRouter()
  const pathname = usePathname()
  const { data: session } = useSession()
  const [scrolled, setScrolled] = useState(false)
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [checkIn, setCheckIn] = useState<Date>()
  const [checkOut, setCheckOut] = useState<Date>()
  const [nights, setNights] = useState(0)
  const [guests, setGuests] = useState(1)
  const [rooms, setRooms] = useState(1)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [location, setLocation] = useState("")
  const [searchBoxAligned, setSearchBoxAligned] = useState(false)

  const headerRef = useRef<HTMLDivElement>(null)
  const heroBoxRef = useRef<HTMLDivElement>(null)

  const locations = [
    "Mumbai",
    "Delhi",
    "Bangalore",
    "Kolkata",
    "Chennai",
    "Hyderabad",
    "Pune",
    "Jaipur",
    "Goa",
    "Shimla",
  ]

  // Check if we're on a page other than home
  const isNotHomePage = pathname !== "/"

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 100) {
        setScrolled(true)
      } else {
        setScrolled(false)
      }
    }

    window.addEventListener("scroll", handleScroll)

    // If not on home page, always show the transformed header
    if (isNotHomePage) {
      setScrolled(true)
    }

    return () => window.removeEventListener("scroll", handleScroll)
  }, [isNotHomePage])

  useEffect(() => {
    if (checkIn && checkOut) {
      const diffTime = Math.abs(checkOut.getTime() - checkIn.getTime())
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      setNights(diffDays)
    }
  }, [checkIn, checkOut])

  useEffect(() => {
    if (guests > 3) {
      setRooms(Math.ceil(guests / 3))
    }
  }, [guests])

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (mobileMenuOpen && headerRef.current && !headerRef.current.contains(e.target as Node)) {
        setMobileMenuOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [mobileMenuOpen])

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false)
  }, [pathname])

  const handleLogout = async () => {
    await signOut({ redirect: false })
    // Force a hard page reload to ensure session is properly cleared
    window.location.href = "/"
  }

  const getInitials = (name: string) => {
    if (!name) return "U"
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .substring(0, 2)
  }

  const handleLoginClick = () => {
    if (pathname !== "/login") {
      setShowLoginModal(true)
    } else {
      router.push("/login")
    }
  }

  const handleSignupClick = () => {
    router.push("/signup")
  }

  const handleSuccessfulLogin = (name: string) => {
    setShowLoginModal(false)
    // No need to manually set login state; NextAuth handles this
  }

  useEffect(() => {
    const handleSearchBoxAligned = (event: CustomEvent) => {
      setSearchBoxAligned(event.detail.aligned)
    }

    // TypeScript needs this cast
    window.addEventListener("searchBoxAligned", handleSearchBoxAligned as EventListener)

    return () => {
      window.removeEventListener("searchBoxAligned", handleSearchBoxAligned as EventListener)
    }
  }, [])

  return (
    <header
      ref={headerRef}
      className={cn(
        "fixed w-full z-50 transition-all duration-500",
        scrolled || isNotHomePage
          ? "bg-darkGreen/95 backdrop-blur-md shadow-lg py-1.5 xs:py-2 sm:py-2"
          : "bg-transparent py-1.5 xs:py-2 sm:py-4",
      )}
    >
      <div className="container mx-auto px-2 xs:px-3 sm:px-4">
        <div className="flex justify-between items-center">
          <Link
            href="/"
            className="text-lg xs:text-xl sm:text-2xl font-bold text-lightYellow flex items-center gap-1 sm:gap-2 group"
          >
            <Sparkles className="h-4 w-4 xs:h-5 xs:w-5 sm:h-6 sm:w-6 text-lightGreen group-hover:animate-pulse-light transition-all duration-300" />
            <span className="group-hover:text-lightGreen transition-all duration-300">Baithaka Ghar</span>
          </Link>

          {/* Desktop Navigation */}
          {!scrolled && !isNotHomePage && (
            <div className="hidden md:flex items-center space-x-2 lg:space-x-6">
              <Link
                href="/about"
                className="text-lightYellow hover:text-lightGreen transition-colors flex items-center gap-1 group relative text-xs lg:text-base"
              >
                <Home className="w-3.5 h-3.5 lg:w-4 lg:h-4 group-hover:animate-bounce-light" />
                <span>About Us</span>
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-lightGreen transition-all duration-300 group-hover:w-full"></span>
              </Link>
              <Link
                href="/contact"
                className="text-lightYellow hover:text-lightGreen transition-colors flex items-center gap-1 group relative text-xs lg:text-base"
              >
                <MapPin className="w-3.5 h-3.5 lg:w-4 lg:h-4 group-hover:animate-bounce-light" />
                <span>Contact Us</span>
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-lightGreen transition-all duration-300 group-hover:w-full"></span>
              </Link>
              <Link
                href="/faq"
                className="text-lightYellow hover:text-lightGreen transition-colors flex items-center gap-1 group relative text-xs lg:text-base"
              >
                <HelpCircle className="w-3.5 h-3.5 lg:w-4 lg:h-4 group-hover:animate-bounce-light" />
                <span>FAQs</span>
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-lightGreen transition-all duration-300 group-hover:w-full"></span>
              </Link>
              <Link
                href="/list-property"
                className="text-lightYellow hover:text-lightGreen transition-colors flex items-center gap-1 group relative text-xs lg:text-base"
              >
                <Building className="w-3.5 h-3.5 lg:w-4 lg:h-4 group-hover:animate-bounce-light" />
                <span className="whitespace-nowrap">List Property</span>
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-lightGreen transition-all duration-300 group-hover:w-full"></span>
              </Link>

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
                    <span className="hidden lg:inline-block text-xs lg:text-sm">{session.user.name || "User"}</span>
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

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center gap-1 sm:gap-2">
            {!scrolled &&
              !isNotHomePage &&
              (session?.user ? (
                <Button
                  variant="ghost"
                  className="text-lightYellow p-0.5 xs:p-1"
                  onClick={() => router.push("/profile")}
                >
                  <div className="w-6 h-6 xs:w-7 xs:h-7 rounded-full bg-gradient-to-br from-lightGreen to-mediumGreen flex items-center justify-center text-darkGreen text-xs">
                    {getInitials(session.user.name || "")}
                  </div>
                </Button>
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
              ))}
            <ModeToggle />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-lightYellow hover:text-lightGreen bg-darkGreen/30 rounded-full h-7 w-7 xs:h-8 xs:w-8"
            >
              {mobileMenuOpen ? <X className="h-4 w-4 xs:h-5 xs:w-5" /> : <Menu className="h-4 w-4 xs:h-5 xs:w-5" />}
            </Button>
          </div>
        </div>

        {/* Search bar that appears when scrolled or not on homepage */}
        {(scrolled || isNotHomePage || searchBoxAligned) && (
          <AnimatePresence>
            <motion.div
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              transition={{ duration: 0.5, type: "spring", stiffness: 100 }}
              className="mt-1.5 xs:mt-2 sm:mt-4 rounded-lg p-1.5 xs:p-2 sm:p-3 shadow-md flex flex-wrap items-center justify-between gap-1.5 xs:gap-2 bg-transparent backdrop-blur-sm border border-lightGreen/20"
            >
              <div className="flex items-center gap-1 w-full xs:w-1/2 sm:w-auto">
                <MapPin className="text-darkGreen dark:text-lightGreen hidden xs:block h-3 w-3 xs:h-4 xs:w-4" />
                <Select value={location} onValueChange={setLocation}>
                  <SelectTrigger className="border-lightGreen focus:border-lightGreen w-full xs:w-32 md:w-auto min-h-7 h-7 xs:h-8 sm:h-10 text-xs">
                    <SelectValue placeholder="Where are you going?" />
                  </SelectTrigger>
                  <SelectContent>
                    {locations.map((loc) => (
                      <SelectItem key={loc} value={loc} className="text-xs">
                        {loc}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="w-full xs:w-1/2 sm:w-auto">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="border-lightGreen w-full xs:w-auto h-7 xs:h-8 sm:h-10 text-xs">
                      <CalendarDays className="mr-1 h-3 w-3 text-darkGreen dark:text-lightGreen" />
                      {checkIn ? format(checkIn, "PP") : "Check-in"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent mode="single" selected={checkIn} onSelect={setCheckIn} initialFocus />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="w-full xs:w-1/2 sm:w-auto">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="border-lightGreen w-full xs:w-auto h-7 xs:h-8 sm:h-10 text-xs">
                      <CalendarDays className="mr-1 h-3 w-3 text-darkGreen dark:text-lightGreen" />
                      {checkOut ? format(checkOut, "PP") : "Check-out"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent mode="single" selected={checkOut} onSelect={setCheckOut} initialFocus />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="w-full xs:w-1/2 sm:w-auto">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="border-lightGreen w-full xs:w-auto h-7 xs:h-8 sm:h-10 text-xs">
                      <Users className="mr-1 h-3 w-3 text-darkGreen dark:text-lightGreen" />
                      <span className="truncate">
                        {guests} {guests === 1 ? "Guest" : "Guests"}, {rooms} {rooms === 1 ? "Room" : "Rooms"}
                      </span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-40 xs:w-48 p-2 xs:p-3 sm:p-4">
                    <div className="space-y-2 xs:space-y-3 sm:space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-xs">Guests</span>
                        <div className="flex items-center space-x-1">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-4 w-4 xs:h-5 xs:w-5 sm:h-6 sm:w-6 rounded-full p-0"
                            onClick={() => setGuests(Math.max(1, guests - 1))}
                            disabled={guests <= 1}
                          >
                            -
                          </Button>
                          <span className="w-4 text-center text-xs">{guests}</span>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-4 w-4 xs:h-5 xs:w-5 sm:h-6 sm:w-6 rounded-full p-0"
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
                            className="h-4 w-4 xs:h-5 xs:w-5 sm:h-6 sm:w-6 rounded-full p-0"
                            onClick={() => setRooms(Math.max(1, rooms - 1))}
                            disabled={rooms <= 1}
                          >
                            -
                          </Button>
                          <span className="w-4 text-center text-xs">{rooms}</span>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-4 w-4 xs:h-5 xs:w-5 sm:h-6 sm:w-6 rounded-full p-0"
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

              <Button className="w-full xs:w-1/2 sm:w-auto bg-mediumGreen hover:bg-mediumGreen/80 text-darkGreen h-7 xs:h-8 sm:h-10 text-xs">
                <Search className="mr-1 h-3 w-3" />
                Search
              </Button>
            </motion.div>
          </AnimatePresence>
        )}
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
            <nav className="flex flex-col space-y-1 xs:space-y-2 sm:space-y-3">
              <Link
                href="/about"
                className="flex items-center gap-1.5 xs:gap-2 text-lightYellow p-1.5 rounded-lg hover:bg-lightGreen/10 transition-colors text-xs xs:text-sm sm:text-base"
              >
                <Home className="w-3.5 h-3.5 xs:w-4 xs:h-4 sm:w-5 sm:h-5" />
                About Us
              </Link>
              <Link
                href="/contact"
                className="flex items-center gap-1.5 xs:gap-2 text-lightYellow p-1.5 rounded-lg hover:bg-lightGreen/10 transition-colors text-xs xs:text-sm sm:text-base"
              >
                <MapPin className="w-3.5 h-3.5 xs:w-4 xs:h-4 sm:w-5 sm:h-5" />
                Contact Us
              </Link>
              <Link
                href="/faq"
                className="flex items-center gap-1.5 xs:gap-2 text-lightYellow p-1.5 rounded-lg hover:bg-lightGreen/10 transition-colors text-xs xs:text-sm sm:text-base"
              >
                <HelpCircle className="w-3.5 h-3.5 xs:w-4 xs:h-4 sm:w-5 sm:h-5" />
                FAQs
              </Link>
              <Link
                href="/list-property"
                className="flex items-center gap-1.5 xs:gap-2 text-lightYellow p-1.5 rounded-lg hover:bg-lightGreen/10 transition-colors text-xs xs:text-sm sm:text-base"
              >
                <Building className="w-3.5 h-3.5 xs:w-4 xs:h-4 sm:w-5 sm:h-5" />
                List Your Property
              </Link>

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
                    >
                      Edit Profile
                    </Link>
                    <Link
                      href="/bookings"
                      className="flex items-center gap-1.5 xs:gap-2 text-lightYellow p-1.5 pl-6 sm:pl-8 rounded-lg hover:bg-lightGreen/10 transition-colors text-xs sm:text-sm"
                    >
                      My Bookings
                    </Link>
                    <Link
                      href="/favorites"
                      className="flex items-center gap-1.5 xs:gap-2 text-lightYellow p-1.5 pl-6 sm:pl-8 rounded-lg hover:bg-lightGreen/10 transition-colors text-xs sm:text-sm"
                    >
                      Favorite Locations
                    </Link>
                    <Link
                      href="/refunds"
                      className="flex items-center gap-1.5 xs:gap-2 text-lightYellow p-1.5 pl-6 sm:pl-8 rounded-lg hover:bg-lightGreen/10 transition-colors text-xs sm:text-sm"
                    >
                      Refund Status
                    </Link>
                    <Link
                      href="/reviews"
                      className="flex items-center gap-1.5 xs:gap-2 text-lightYellow p-1.5 pl-6 sm:pl-8 rounded-lg hover:bg-lightGreen/10 transition-colors text-xs sm:text-sm"
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
        {showLoginModal && <LoginSignup onClose={() => setShowLoginModal(false)} onLogin={handleSuccessfulLogin} />}
      </AnimatePresence>
    </header>
  )
}
