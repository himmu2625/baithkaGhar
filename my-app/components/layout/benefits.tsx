"use client"

import { motion } from "framer-motion"
import { Clock, Search, DollarSign, Percent, MessageSquare, PhoneCall } from "lucide-react"

const benefits = [
  {
    id: 1,
    title: "Guaranteed Check-in",
    description: "No more waiting. We guarantee your room will be ready on time.",
    icon: Clock,
    color: "#D9EAFD",
  },
  {
    id: 2,
    title: "Wide Selection",
    description: "Thousands of properties across India to choose from.",
    icon: Search,
    color: "#BCCCDC",
  },
  {
    id: 3,
    title: "Best Price Guarantee",
    description: "Find it cheaper elsewhere? We'll match the price.",
    icon: DollarSign,
    color: "#9AA6B2",
  },
  {
    id: 4,
    title: "Transparent Pricing",
    description: "No hidden fees or charges. What you see is what you pay.",
    icon: Percent,
    color: "#D9EAFD",
  },
  {
    id: 5,
    title: "Customer Reviews",
    description: "Authentic reviews from real guests to help you decide.",
    icon: MessageSquare,
    color: "#BCCCDC",
  },
  {
    id: 6,
    title: "24/7 Support",
    description: "Our customer service team is available around the clock.",
    icon: PhoneCall,
    color: "#9AA6B2",
  },
]

export default function Benefits() {
  const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  }

  return (
    <section className="py-16 bg-lightBg">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl font-bold text-secondaryBlue mb-4">Why Choose Baithaka Ghar</h2>
          <p className="text-grayText max-w-2xl mx-auto">
            We're committed to making your stay comfortable and hassle-free
          </p>
        </motion.div>

        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={{
            visible: {
              transition: {
                staggerChildren: 0.1,
              },
            },
          }}
        >
          {benefits.map((benefit) => {
            const Icon = benefit.icon

            return (
              <motion.div
                key={benefit.id}
                variants={fadeInUp}
                transition={{ duration: 0.5 }}
                className="bg-white p-4 md:p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow"
                whileHover={{ y: -5 }}
              >
                <div
                  className="p-2 sm:p-3 rounded-full w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center mb-3 md:mb-4"
                  style={{ backgroundColor: benefit.color }}
                >
                  <Icon className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                </div>
                <h3 className="font-bold text-base sm:text-lg text-secondaryBlue mb-1 sm:mb-2">{benefit.title}</h3>
                <p className="text-sm text-grayText">{benefit.description}</p>
              </motion.div>
            )
          })}
        </motion.div>
      </div>
    </section>
  )
}
