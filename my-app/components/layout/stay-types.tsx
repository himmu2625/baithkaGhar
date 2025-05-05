"use client"

import { motion } from "framer-motion"
import Image from "next/image"
import { Users, Briefcase, Heart, Utensils, Camera, Map } from "lucide-react"
import ProtectedLink from "@/components/features/auth/protected-link"

const stayTypes = [
  {
    id: 1,
    title: "Corporate Stay",
    description: "Business-friendly accommodations with workspace and high-speed internet",
    icon: Briefcase,
    image: "/placeholder.svg?height=400&width=600",
    color: "#D9EAFD",
  },
  {
    id: 2,
    title: "Family Stay",
    description: "Spacious rooms and kid-friendly amenities for the whole family",
    icon: Users,
    image: "/placeholder.svg?height=400&width=600",
    color: "#BCCCDC",
  },
  {
    id: 3,
    title: "Couple Stay",
    description: "Romantic getaways with privacy and special amenities for couples",
    icon: Heart,
    image: "/placeholder.svg?height=400&width=600",
    color: "#9AA6B2",
  },
  {
    id: 4,
    title: "Banquet & Events",
    description: "Venues for weddings, conferences, and special occasions",
    icon: Utensils,
    image: "/placeholder.svg?height=400&width=600",
    color: "#D9EAFD",
  },
  {
    id: 5,
    title: "Influencer Partnership",
    description: "Special packages for content creators and social media influencers",
    icon: Camera,
    image: "/placeholder.svg?height=400&width=600",
    color: "#BCCCDC",
  },
  {
    id: 6,
    title: "Travel Agent",
    description: "Exclusive deals and commission for travel agents and tour operators",
    icon: Map,
    image: "/placeholder.svg?height=400&width=600",
    color: "#9AA6B2",
  },
]

export default function StayTypes() {
  return (
    <section className="py-16">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl font-bold text-secondaryBlue mb-4">Find Your Perfect Stay</h2>
          <p className="text-grayText max-w-2xl mx-auto">
            We offer specialized accommodations for every type of traveler
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {stayTypes.map((type, index) => {
            const Icon = type.icon

            return (
              <motion.div
                key={type.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                whileHover={{ y: -10 }}
              >
                <ProtectedLink href={`/stay-types/${type.id}`} className="block group">
                  <div className="relative overflow-hidden rounded-xl h-48 sm:h-56 md:h-64 mb-4">
                    <Image
                      src={type.image || "/placeholder.svg"}
                      alt={type.title}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div
                      className="absolute inset-0 opacity-0 group-hover:opacity-70 transition-opacity duration-300"
                      style={{ backgroundColor: type.color }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <span className="text-white font-bold text-lg md:text-xl">Explore</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="p-2 sm:p-3 rounded-full" style={{ backgroundColor: `${type.color}` }}>
                      <Icon className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-base sm:text-lg text-secondaryBlue group-hover:text-primaryBlue transition-colors">
                        {type.title}
                      </h3>
                      <p className="text-xs sm:text-sm text-grayText">{type.description}</p>
                    </div>
                  </div>
                </ProtectedLink>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
