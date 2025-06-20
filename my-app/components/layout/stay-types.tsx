"use client"

import { motion } from "framer-motion"
import Image from "next/image"
import { Users, Briefcase, Heart, Utensils, Camera, Map } from "lucide-react"
import Link from "next/link"

// Property-based stay types (redirect to filtered properties)
const propertyStayTypes = [
  {
    id: "corporate-stay",
    title: "Corporate Stay",
    description: "Business-friendly accommodations with workspace and high-speed internet",
    icon: Briefcase,
    image: "https://images.pexels.com/photos/380768/pexels-photo-380768.jpeg?auto=compress&cs=tinysrgb&w=1600",
    color: "#2563EB",
    gradient: "linear-gradient(135deg, #3B82F6 0%, #1E40AF 100%)",
    isProperty: true,
  },
  {
    id: "family-stay",
    title: "Family Stay",
    description: "Spacious rooms and kid-friendly amenities for the whole family",
    icon: Users,
    image: "https://images.pexels.com/photos/237371/pexels-photo-237371.jpeg?auto=compress&cs=tinysrgb&w=1600",
    color: "#16A34A",
    gradient: "linear-gradient(135deg, #22C55E 0%, #15803D 100%)",
    isProperty: true,
  },
  {
    id: "couple-stay",
    title: "Couple Stay",
    description: "Romantic getaways with privacy and special amenities for couples",
    icon: Heart,
    image: "https://images.pexels.com/photos/3155666/pexels-photo-3155666.jpeg?auto=compress&cs=tinysrgb&w=1600",
    color: "#E11D48",
    gradient: "linear-gradient(135deg, #F43F5E 0%, #BE123C 100%)",
    isProperty: true,
  },
  {
    id: "banquet-events",
    title: "Banquet & Events",
    description: "Venues for weddings, conferences, and special occasions",
    icon: Utensils,
    image: "https://images.pexels.com/photos/169190/pexels-photo-169190.jpeg?auto=compress&cs=tinysrgb&w=1600",
    color: "#9333EA",
    gradient: "linear-gradient(135deg, #A855F7 0%, #7E22CE 100%)",
    isProperty: true,
  },
]

// Non-property pages (keep current functionality)
const serviceStayTypes = [
  {
    id: "5",
    title: "Influencer Partnership",
    description: "Special packages for content creators and social media influencers",
    icon: Camera,
    image: "https://images.pexels.com/photos/7433822/pexels-photo-7433822.jpeg?auto=compress&cs=tinysrgb&w=1600",
    color: "#EA580C",
    gradient: "linear-gradient(135deg, #F97316 0%, #C2410C 100%)",
    isProperty: false,
  },
  {
    id: "6",
    title: "Travel Agent",
    description: "Exclusive deals and commission for travel agents and tour operators",
    icon: Map,
    image: "https://images.pexels.com/photos/346885/pexels-photo-346885.jpeg?auto=compress&cs=tinysrgb&w=1600",
    color: "#0891B2",
    gradient: "linear-gradient(135deg, #06B6D4 0%, #0E7490 100%)",
    isProperty: false,
  },
]

const stayTypes = [...propertyStayTypes, ...serviceStayTypes]

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
          <h2 className="text-3xl font-bold text-darkGreen mb-4">Find Your Perfect Stay</h2>
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
                <Link 
                  href={`/stay-types/${type.id}`} 
                  className="block group"
                >
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
                  <div className="flex items-start gap-4">
                    <motion.div 
                      initial={{ rotate: 0 }}
                      whileHover={{ rotate: [0, -10, 10, -5, 5, 0], scale: 1.1 }}
                      transition={{ duration: 0.5 }}
                      className="flex-shrink-0 p-3 sm:p-4 rounded-xl shadow-lg relative overflow-hidden"
                      style={{ 
                        background: type.gradient,
                      }}
                    >
                      <div className="absolute inset-0 opacity-30 mix-blend-overlay bg-[radial-gradient(circle_at_top_right,_rgba(255,255,255,0.8),_transparent_70%)]"></div>
                      <Icon className="h-6 w-6 sm:h-7 sm:w-7 text-white drop-shadow-md" strokeWidth={2} />
                    </motion.div>
                    <div>
                      <h3 className="font-bold text-base sm:text-lg text-darkGreen group-hover:text-mediumGreen transition-colors">
                        {type.title}
                      </h3>
                      <p className="text-xs sm:text-sm text-grayText mt-1">{type.description}</p>
                    </div>
                  </div>
                </Link>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
