"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import Image from "next/image"
import { CalendarDays, MapPin, Users, Search, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { format } from "date-fns"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { motion, AnimatePresence } from "framer-motion"

// Real travel destination images
const slides = [
  {
    id: 1,
    image: "https://images.unsplash.com/photo-1596422846543-75c6fc197f07?q=80&w=1600&auto=format&fit=crop",
    title: "Luxury Beach Resort",
    subtitle: "Experience the ultimate beachfront getaway",
    location: "Goa",
  },
  {
    id: 2,
    image: "https://images.unsplash.com/photo-1580977276076-ae4b8c219b8e?q=80&w=1600&auto=format&fit=crop",
    title: "Mountain Retreat",
    subtitle: "Escape to serene mountain landscapes",
    location: "Shimla",
  },
  {
    id: 3,
    image: "https://images.unsplash.com/photo-1599661046289-e31897846e41?q=80&w=1600&auto=format&fit=crop",
    title: "Heritage Palace",
    subtitle: "Discover royal luxury in historic settings",
    location: "Jaipur",
  },
  {
    id: 4,
    image: "https://images.unsplash.com/photo-1571677246347-5040e8278516?q=80&w=1600&auto=format&fit=crop",
    title: "Lakeside Villa",
    subtitle: "Relax by tranquil waters in premium comfort",
    location: "Udaipur",
  },
]

export default function HeroSection() {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [checkIn, setCheckIn] = useState<Date | undefined>(new Date())
  const [checkOut, setCheckOut] = useState<Date | undefined>(new Date(Date.now() + 24 * 60 * 60 * 1000))
  const [nights, setNights] = useState(1)
  const [guests, setGuests] = useState(2)
  const [children, setChildren] = useState(0)
  const [rooms, setRooms] = useState(1)
  const [location, setLocation] = useState("")
  const [isLoaded, setIsLoaded] = useState(false)
  const searchBoxRef = useRef<HTMLDivElement>(null)
  const [isSliding, setIsSliding] = useState(false)
  const [autoplay, setAutoplay] = useState(true)
  const [hovering, setHovering] = useState(false)

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

  // Set loaded state after mount to avoid hydration issues
  useEffect(() => {
    setIsLoaded(true)

    // Adjust search box position based on viewport height for mobile
    const adjustSearchBox = () => {
      if (searchBoxRef.current) {
        const viewportHeight = window.innerHeight
        const isMobile = window.innerWidth < 768
        const isSmallScreen = window.innerWidth < 480

        if (isMobile) {
          if (isSmallScreen) {
            // Extra small screens
            searchBoxRef.current.style.bottom = `${Math.max(10, viewportHeight * 0.12)}px`
          } else {
            // Small to medium screens
            searchBoxRef.current.style.bottom = `${Math.max(10, viewportHeight * 0.15)}px`
          }
        } else {
          // Reset for desktop
          searchBoxRef.current.style.bottom = "80px"
        }
      }
    }

    adjustSearchBox()
    window.addEventListener("resize", adjustSearchBox)

    return () => {
      window.removeEventListener("resize", adjustSearchBox)
    }
  }, [])

  const nextSlide = useCallback(() => {
    if (!isSliding) {
      setIsSliding(true)
      setCurrentSlide((prev) => (prev === slides.length - 1 ? 0 : prev + 1))
      setTimeout(() => setIsSliding(false), 800)
    }
  }, [isSliding])

  const prevSlide = useCallback(() => {
    if (!isSliding) {
      setIsSliding(true)
      setCurrentSlide((prev) => (prev === 0 ? slides.length - 1 : prev - 1))
      setTimeout(() => setIsSliding(false), 800)
    }
  }, [isSliding])

  // Set up slide transition interval with pause on hover
  useEffect(() => {
    if (!isLoaded || !autoplay || hovering) return

    const interval = setInterval(() => {
      nextSlide()
    }, 5000)
    return () => clearInterval(interval)
  }, [isLoaded, nextSlide, autoplay, hovering])

  useEffect(() => {
    if (checkIn && checkOut) {
      const diffTime = Math.abs(checkOut.getTime() - checkIn.getTime())
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      setNights(diffDays)
    }
  }, [checkIn, checkOut])

  // Early return during SSR to prevent hydration mismatch
  if (!isLoaded) {
    return <div className="h-screen bg-lightYellow/30"></div>
  }

  return (
    <div
      className="relative h-[100svh] sm:h-screen overflow-hidden"
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
    >
      {/* Background slides with parallax effect */}
      <div className="absolute inset-0">
        {slides.map((slide, index) => (
          <motion.div
            key={index}
            className="absolute inset-0 w-full h-full"
            initial={{ opacity: 0, scale: currentSlide === index ? 1.05 : 1 }}
            animate={{
              opacity: currentSlide === index ? 1 : 0,
              scale: currentSlide === index ? 1 : 1.05,
              zIndex: currentSlide === index ? 1 : 0,
            }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
          >
            <motion.div
              className="relative w-full h-full overflow-hidden"
              animate={{
                x: currentSlide === index ? ["0%", "-2%", "0%"] : "0%",
                y: currentSlide === index ? ["0%", "-1%", "0%"] : "0%",
              }}
              transition={{
                duration: 20,
                repeat: Number.POSITIVE_INFINITY,
                repeatType: "reverse",
                ease: "easeInOut",
              }}
            >
              <Image
                src={slide.image}
                alt={slide.title}
                fill
                priority={index === 0}
                loading={index === 0 ? "eager" : "lazy"}
                sizes="100vw"
                className="object-cover transform scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-black/60" />
            </motion.div>
          </motion.div>
        ))}
      </div>

      {/* Custom navigation arrows - hidden on smallest screens */}
      <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex justify-between px-4 md:px-10 z-20 hidden xs:flex">
        <motion.button
          initial={{ opacity: 0.7, x: -10 }}
          whileHover={{ opacity: 1, x: 0, scale: 1.1 }}
          onClick={prevSlide}
          className="bg-darkGreen/40 backdrop-blur-sm hover:bg-lightGreen text-lightYellow hover:text-darkGreen rounded-full p-2 md:p-3 transition-all duration-300"
        >
          <ChevronLeft className="h-4 w-4 md:h-6 md:w-6" />
        </motion.button>
        <motion.button
          initial={{ opacity: 0.7, x: 10 }}
          whileHover={{ opacity: 1, x: 0, scale: 1.1 }}
          onClick={nextSlide}
          className="bg-darkGreen/40 backdrop-blur-sm hover:bg-lightGreen text-lightYellow hover:text-darkGreen rounded-full p-2 md:p-3 transition-all duration-300"
        >
          <ChevronRight className="h-4 w-4 md:h-6 md:w-6" />
        </motion.button>
      </div>

      {/* Slide indicators */}
      <div className="absolute bottom-36 md:bottom-40 left-1/2 transform -translate-x-1/2 flex space-x-2 z-20">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => {
              if (!isSliding) {
                setIsSliding(true)
                setCurrentSlide(index)
                setTimeout(() => setIsSliding(false), 800)
              }
            }}
            className={`h-2 md:h-3 rounded-full transition-all duration-300 ${
              currentSlide === index
                ? "bg-lightGreen w-6 md:w-8"
                : "bg-lightYellow/70 hover:bg-lightYellow w-2 md:w-3"
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>

      {/* Hero Content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
        <div className="text-center mb-16 md:mb-24 px-4 relative -mt-16 md:mt-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentSlide}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
              className="absolute inset-0 w-full"
            >
              <motion.h1
                className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-lightYellow mb-4"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.7, delay: 0.2 }}
              >
                <span className="block">Find Your Perfect</span>
                <span className="block text-lightGreen mt-2">Home Away From Home</span>
              </motion.h1>
              <motion.p
                className="text-sm sm:text-base md:text-xl text-lightYellow/90 max-w-xl md:max-w-2xl mx-auto mt-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.4 }}
              >
                {slides[currentSlide].subtitle}
              </motion.p>
            </motion.div>
          </AnimatePresence>

          {/* This div creates space for the absolute positioned text */}
          <div className="opacity-0 pointer-events-none">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4">
              <span className="block">Find Your Perfect</span>
              <span className="block mt-2">Home Away From Home</span>
            </h1>
            <p className="text-sm sm:text-base md:text-xl max-w-xl md:max-w-2xl mx-auto mt-4">
              Placeholder text for spacing
            </p>
          </div>
        </div>

        {/* Search panel with glassmorphism effect */}
<motion.div
  ref={searchBoxRef}
  initial={{ y: 20, opacity: 0 }}
  animate={{ y: 0, opacity: 1 }}
  transition={{ delay: 0.4, duration: 0.6 }}
  className="w-[90%] sm:w-[85%] md:max-w-5xl rounded-xl p-4 sm:p-5 shadow-xl border border-lightGreen/30 absolute bottom-16 sm:bottom-20 left-1/2 transform -translate-x-1/2 z-20 bg-black/40 backdrop-blur-md"
>
  <div className="flex flex-col lg:flex-row items-center gap-2 sm:gap-3">
    {/* Location */}
    <div className="w-full lg:flex-1">
      <label className="block text-xs sm:text-sm font-medium text-lightYellow mb-1">
        Location
      </label>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <MapPin className="h-4 w-4 sm:h-5 sm:w-5 text-lightGreen" />
        </div>
        <input
          type="text"
          placeholder="City, region or hotel"
          className="w-full pl-10 pr-2 py-2 bg-darkGreen/60 border border-lightGreen/30 rounded-lg text-lightYellow placeholder-lightYellow/60 focus:outline-none focus:ring-2 focus:ring-lightGreen"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
        />
      </div>
    </div>
    
    {/* Guests */}
    <div className="w-full lg:w-auto">
      <label className="block text-xs sm:text-sm font-medium text-lightYellow mb-1">
        Guests
      </label>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Users className="h-4 w-4 sm:h-5 sm:w-5 text-lightGreen" />
        </div>
        <select className="w-full lg:w-48 pl-10 pr-2 py-2 bg-darkGreen/60 border border-lightGreen/30 rounded-lg text-lightYellow focus:outline-none focus:ring-2 focus:ring-lightGreen appearance-none">
          <option value="1-2-0">1 Room, 02 Adults</option>
          <option value="1-1-0">1 Room, 01 Adult</option>
          <option value="1-2-1">1 Room, 02 Adults, 01 Child</option>
          <option value="2-3-0">2 Rooms, 03 Adults</option>
          <option value="2-4-2">2 Rooms, 04 Adults, 02 Children</option>
        </select>
      </div>
    </div>
    
    {/* Check-in date */}
    <div className="w-full lg:w-auto">
      <label className="block text-xs sm:text-sm font-medium text-lightYellow mb-1">
        Check-in
      </label>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <CalendarDays className="h-4 w-4 sm:h-5 sm:w-5 text-lightGreen" />
        </div>
        <Popover>
          <PopoverTrigger asChild>
            <button className="w-full lg:w-40 pl-10 pr-2 py-2 bg-darkGreen/60 border border-lightGreen/30 rounded-lg text-lightYellow text-left focus:outline-none focus:ring-2 focus:ring-lightGreen">
              {checkIn ? (
                format(checkIn, "MMM dd, yyyy")
              ) : (
                "Start date"
              )}
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 bg-darkGreen" align="start">
            <CalendarComponent
              mode="single"
              selected={checkIn}
              onSelect={(date) => setCheckIn(date)}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>
    </div>
    
    {/* Check-out date with nights pill */}
    <div className="w-full lg:w-auto relative">
      <label className="block text-xs sm:text-sm font-medium text-lightYellow mb-1">
        Check-out
      </label>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <CalendarDays className="h-4 w-4 sm:h-5 sm:w-5 text-lightGreen" />
        </div>
        <Popover>
          <PopoverTrigger asChild>
            <button className="w-full lg:w-40 pl-10 pr-2 py-2 bg-darkGreen/60 border border-lightGreen/30 rounded-lg text-lightYellow text-left focus:outline-none focus:ring-2 focus:ring-lightGreen">
              {checkOut ? (
                format(checkOut, "MMM dd, yyyy")
              ) : (
                "End date"
              )}
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 bg-darkGreen" align="start">
            <CalendarComponent
              mode="single"
              selected={checkOut}
              onSelect={(date) => setCheckOut(date)}
              initialFocus
              disabled={(date) => date < (checkIn || new Date())}
            />
          </PopoverContent>
        </Popover>
        {/* Nights pill */}
        {nights > 0 && (
          <span className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-lightGreen text-darkGreen text-xs font-medium px-2 py-0.5 rounded-full">
            {nights}N
          </span>
        )}
      </div>
    </div>

    {/* Search button */}
    <div className="w-full lg:w-auto self-end mt-1">
      <Button className="w-full lg:w-32 h-10 bg-gradient-to-r from-lightGreen to-mediumGreen hover:opacity-90 text-darkGreen font-medium transition-all duration-300 shadow-md hover:shadow-lg">
        <Search className="mr-2 h-4 w-4" />
        Search
      </Button>
    </div>
  </div>
</motion.div>
      </div>
    </div>
  )
}