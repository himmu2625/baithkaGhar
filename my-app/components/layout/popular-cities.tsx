"use client"

import { useRef, useEffect } from "react"
import { ArrowLeft, ArrowRight, MapPin, Building, Navigation } from "lucide-react"
import { Button } from "@/components/ui/button"
import { motion, useAnimation } from "framer-motion"
import ProtectedLink from "@/components/features/auth/protected-link"

const cities = [
  {
    id: 1,
    name: "Mumbai",
    properties: 245,
    image: "/public/images/mumbai.jpg",
  },
  {
    id: 2,
    name: "Bangalore",
    properties: 189,
    image: "/public/images/bangalore.jpg",
  },
  {
    id: 3,
    name: "Chitrakoot",
    properties: 87,
    image: "/public/images/chitrakoot.jpg",
  },
  {
    id: 4,
    name: "Hyderabad",
    properties: 167,
    image: "/public/images/hyderabad.jpg",
  },
  {
    id: 5,
    name: "Chennai",
    properties: 112,
    image: "/public/images/chennai.jpg",
  },
  {
    id: 6,
    name: "Nagpur",
    properties: 98,
    image: "/public/images/nagpur.jpg",
  },
  {
    id: 7,
    name: "Pune",
    properties: 156,
    image: "/public/images/pune.jpg",
  },
  {
    id: 8,
    name: "Ahmedabad",
    properties: 132,
    image: "/public/images/ahmedabad.jpg",
  },
  {
    id: 9,
    name: "Lucknow",
    properties: 102,
    image: "/public/images/lucknow.jpg",
  },
  {
    id: 10,
    name: "Varanasi",
    properties: 124,
    image: "/public/images/varanasi.jpg",
  },
  {
    id: 11,
    name: "Ayodhya",
    properties: 78,
    image: "/public/images/ayodhya.jpg",
  },
  {
    id: 12,
    name: "Mathura",
    properties: 92,
    image: "/public/images/mathura.jpg",
  },
  {
    id: 13,
    name: "Prayagraj",
    properties: 105,
    image: "/public/images/prayagraj.jpg",
  },
]

export default function PopularCities() {
  const scrollRef = useRef<HTMLDivElement>(null)
  const controls = useAnimation()

  useEffect(() => {
    controls.start({ opacity: 1, y: 0 })
  }, [controls])

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const { current } = scrollRef
      const scrollAmount = direction === "left" ? -current.clientWidth / 1.5 : current.clientWidth / 1.5

      current.scrollBy({
        left: scrollAmount,
        behavior: "smooth",
      })
    }
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
                  className="min-w-[220px] sm:min-w-[250px] md:min-w-[280px] scroll-snap-align-start hover-lift"
                  style={{ scrollSnapAlign: "start" }}
                >
                  <ProtectedLink href={`/cities/${city.name.toLowerCase()}`} className="block group">
                    <div className="relative overflow-hidden rounded-xl h-64 sm:h-72 md:h-80">
                      <img
                        src={city.image || "/placeholder.svg"}
                        alt={city.name}
                        className="object-cover w-full h-full transition-transform duration-700 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-darkGreen/70 to-transparent" />
                      <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6 text-lightYellow">
                        <div className="flex items-center mb-1">
                          <MapPin className="w-4 h-4 md:w-5 md:h-5 mr-1 text-lightGreen group-hover:animate-bounce-light" />
                          <h3 className="text-xl md:text-2xl font-bold">{city.name}</h3>
                        </div>
                        <div className="flex items-center text-lightYellow/90 text-sm md:text-base">
                          <Building className="w-3 h-3 md:w-4 md:h-4 mr-1 text-lightGreen" />
                          <p>{city.properties} properties</p>
                        </div>
                      </div>
                      <motion.div
                        className="absolute inset-0 bg-darkGreen/20 flex items-center justify-center"
                        initial={{ opacity: 0 }}
                        whileHover={{ opacity: 1 }}
                        transition={{ duration: 0.3 }}
                      >
                        <motion.span
                          className="px-3 py-1 md:px-4 md:py-2 bg-lightGreen text-darkGreen rounded-full font-bold text-sm md:text-base"
                          initial={{ scale: 0 }}
                          whileHover={{ scale: 1 }}
                          transition={{ type: "spring", stiffness: 300, damping: 10 }}
                        >
                          Explore Now
                        </motion.span>
                      </motion.div>
                    </div>
                  </ProtectedLink>
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
  )
}
