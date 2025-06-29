"use client"

import { useRef } from "react"
import { motion } from "framer-motion"
import { Clock, Search, IndianRupee, Percent, MessageSquare, PhoneCall, Check, Award, LucideIcon } from "lucide-react"

interface Benefit {
  id: number;
  title: string;
  description: string;
  icon: LucideIcon;
  color: string;
  highlight: string;
}

const benefits: Benefit[] = [
  {
    id: 1,
    title: "Guaranteed Check-in",
    description: "No more waiting. We guarantee your room will be ready on time.",
    icon: Clock,
    color: "#4CAF50",
    highlight: "Always on time",
  },
  {
    id: 2,
    title: "Wide Selection",
    description: "Thousands of properties across India to choose from.",
    icon: Search,
    color: "#2196F3",
    highlight: "1000+ Properties",
  },
  {
    id: 3,
    title: "Best Price Guarantee",
    description: "Find it cheaper elsewhere? We'll match the price.",
    icon: IndianRupee,
    color: "#FF9800",
    highlight: "Price match",
  },
  {
    id: 4,
    title: "Transparent Pricing",
    description: "No hidden fees or charges. What you see is what you pay.",
    icon: Percent,
    color: "#9C27B0",
    highlight: "No hidden fees",
  },
  {
    id: 5,
    title: "Customer Reviews",
    description: "Authentic reviews from real guests to help you decide.",
    icon: MessageSquare,
    color: "#F44336",
    highlight: "Real feedback",
  },
  {
    id: 6,
    title: "24/7 Support",
    description: "Our customer service team is available around the clock.",
    icon: PhoneCall,
    color: "#009688",
    highlight: "Always available",
  },
]

export default function Benefits() {
  return (
    <section className="py-16 bg-gradient-to-b from-white to-lightBg relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute top-0 left-0 w-64 h-64 bg-lightGreen/5 rounded-full -translate-x-1/2 -translate-y-1/2"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-lightGreen/10 rounded-full translate-x-1/3 translate-y-1/3"></div>
      
      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.7 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <span className="inline-block px-4 py-1.5 bg-lightGreen/20 text-darkGreen rounded-full text-sm font-medium mb-3">Our Promises To You</span>
          <h2 className="text-3xl md:text-4xl font-bold text-darkGreen mb-3">Why Choose Baithaka Ghar</h2>
          <p className="text-grayText max-w-2xl mx-auto text-lg">
            We're committed to making your stay comfortable and hassle-free with these guarantees
          </p>
        </motion.div>

        {/* Grid layout for benefits */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {benefits.map((benefit, index) => (
            <BenefitCard 
              key={benefit.id} 
              benefit={benefit} 
              index={index}
            />
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="mt-12 text-center"
        >
          <div className="inline-flex items-center gap-2 bg-lightGreen/10 text-darkGreen px-5 py-3 rounded-full">
            <Award className="h-5 w-5" />
            <span className="font-medium">Trusted by over 10,000 customers across India</span>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

interface BenefitCardProps {
  benefit: Benefit;
  index: number;
}

function BenefitCard({ benefit, index }: BenefitCardProps) {
  const { title, description, icon: Icon, color, highlight } = benefit
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ 
        duration: 0.5,
        delay: index * 0.1
      }}
      viewport={{ once: true, margin: "-50px" }}
      className="group"
    >
      <div className="relative bg-white rounded-xl shadow-md p-6 border border-gray-100 h-full hover:shadow-lg transition-shadow duration-300 hover:-translate-y-1 transform transition-transform">
        <div className="absolute -top-4 -left-4 flex items-center justify-center w-14 h-14 rounded-xl shadow-md"
          style={{ backgroundColor: color }}>
          <Icon className="h-7 w-7 text-white" />
        </div>
        
        <div className="ml-5 pt-5">
          <div className="flex items-center mb-3">
            <div className="inline-block px-3 py-1 bg-lightGreen/20 text-darkGreen rounded-full text-sm font-medium">
              {highlight}
            </div>
          </div>
          
          <h3 className="text-xl font-bold text-darkGreen mb-3">{title}</h3>
          <p className="text-gray-700 mb-4">{description}</p>
          
          <div className="flex items-center text-mediumGreen font-medium mt-auto">
            <Check className="h-5 w-5 mr-2 text-mediumGreen" />
            <span>Guaranteed with every booking</span>
          </div>
        </div>
        
        <div className="absolute -bottom-2 -right-2 h-20 w-20 bg-gradient-to-br from-transparent to-lightGreen/10 rounded-br-xl"></div>
      </div>
    </motion.div>
  )
}
