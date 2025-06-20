"use client"

import { useRef } from "react"
import Image from "next/image"
import { motion } from "framer-motion"
import { Badge } from "@/components/ui/badge"
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Clock, ArrowLeft, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import ProtectedLink from "@/components/features/auth/protected-link"
import { getPlaceholderImage } from "@/lib/placeholder"

// This would typically come from an API or database
const deals = [
  {
    id: 1,
    title: "Weekend Getaway Special",
    description: "30% off on weekend stays at select properties",
    image: "https://images.pexels.com/photos/1591361/pexels-photo-1591361.jpeg?auto=compress&cs=tinysrgb&w=1600",
    discount: "30%",
    validUntil: "2024-12-31",
    tag: "Limited Time",
  },
  {
    id: 2,
    title: "Summer Vacation Package",
    description: "Book 3 nights, get 1 night free at beach resorts",
    image: "https://images.pexels.com/photos/2835562/pexels-photo-2835562.jpeg?auto=compress&cs=tinysrgb&w=1600",
    discount: "25%",
    validUntil: "2024-08-31",
    tag: "Hot Deal",
  },
  {
    id: 3,
    title: "Luxury Suite Upgrade",
    description: "Complimentary upgrade to luxury suite on bookings above ₹15,000",
    image: "https://images.pexels.com/photos/271624/pexels-photo-271624.jpeg?auto=compress&cs=tinysrgb&w=1600",
    discount: "Upgrade",
    validUntil: "2024-10-15",
    tag: "Premium",
  },
  {
    id: 4,
    title: "Early Bird Discount",
    description: "Book 30 days in advance and save 20% on your stay",
    image: "https://images.pexels.com/photos/262048/pexels-photo-262048.jpeg?auto=compress&cs=tinysrgb&w=1600",
    discount: "20%",
    validUntil: "2024-12-31",
    tag: "Early Bird",
  },
  {
    id: 5,
    title: "Family Package",
    description: "Kids stay free when you book 2 rooms for 3+ nights",
    image: "https://images.pexels.com/photos/1648387/pexels-photo-1648387.jpeg?auto=compress&cs=tinysrgb&w=1600",
    discount: "Kids Free",
    validUntil: "2024-09-30",
    tag: "Family",
  },
  {
    id: 6,
    title: "Honeymoon Special",
    description: "Complimentary spa treatment and romantic dinner",
    image: "https://images.pexels.com/photos/3155666/pexels-photo-3155666.jpeg?auto=compress&cs=tinysrgb&w=1600",
    discount: "Extras",
    validUntil: "2024-11-30",
    tag: "Romantic",
  },
]

export default function SpecialDeals() {
  const scrollRef = useRef<HTMLDivElement>(null)

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const { current } = scrollRef
      const scrollAmount = direction === "left" ? -current.clientWidth / 2 : current.clientWidth / 2

      current.scrollBy({
        left: scrollAmount,
        behavior: "smooth",
      })
    }
  }

  return (
    <section className="py-16 bg-gradient-to-b from-lightBg to-white">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="text-center mb-8"
        >
          <h2 className="text-3xl font-bold text-darkGreen mb-4">Special Offers</h2>
          <p className="text-grayText max-w-2xl mx-auto">Exclusive deals and special offers for your next stay</p>
        </motion.div>

        <div className="relative">
          <Button
            variant="ghost"
            size="icon"
            className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-2 sm:-translate-x-4 bg-white hover:bg-lightGreen/10 text-darkGreen rounded-full shadow-lg z-10 w-8 h-8 md:w-10 md:h-10"
            onClick={() => scroll("left")}
          >
            <ArrowLeft className="h-4 w-4 md:h-5 md:w-5" />
          </Button>

          <div
            ref={scrollRef}
            className="flex gap-3 md:gap-4 overflow-x-auto smooth-scroll scrollbar-hide pb-4"
            style={{
              scrollSnapType: "x mandatory",
              scrollBehavior: "smooth",
            }}
          >
            {deals.map((deal, index) => (
              <motion.div
                key={deal.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.05 }}
                viewport={{ once: true }}
                className="min-w-[240px] sm:min-w-[280px] md:min-w-[320px]"
                style={{ scrollSnapAlign: "start" }}
              >
                <Card className="overflow-hidden h-full border-lightGreen/30 hover:border-mediumGreen transition-colors group">
                  <div className="relative h-40 sm:h-48">
                    <Image
                      src={deal.image || "/placeholder.svg"}
                      alt={deal.title}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <Badge className="absolute top-3 right-3 bg-lightGreen hover:bg-darkGreen">
                      {deal.discount} OFF
                    </Badge>
                  </div>
                  <CardHeader className="p-3 sm:p-4">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-darkGreen group-hover:text-mediumGreen transition-colors text-base sm:text-lg">
                        {deal.title}
                      </CardTitle>
                      <Badge variant="outline" className="border-grayText text-grayText text-xs">
                        {deal.tag}
                      </Badge>
                    </div>
                    <CardDescription className="text-sm">{deal.description}</CardDescription>
                  </CardHeader>
                  <CardFooter className="flex justify-between border-t pt-3 p-3 sm:p-4">
                    <div className="flex items-center text-xs sm:text-sm text-grayText">
                      <Clock className="mr-1 h-3 w-3 sm:h-4 sm:w-4 text-mediumGreen" />
                      Valid until {new Date(deal.validUntil).toLocaleDateString()}
                    </div>
                    <ProtectedLink
                      href={`/deals/${deal.id}`}
                      className="text-mediumGreen hover:text-darkGreen font-medium text-xs sm:text-sm"
                    >
                      View Deal
                    </ProtectedLink>
                  </CardFooter>
                </Card>
              </motion.div>
            ))}
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="absolute right-0 top-1/2 transform -translate-y-1/2 translate-x-2 sm:translate-x-4 bg-white hover:bg-lightGreen/10 text-darkGreen rounded-full shadow-lg z-10 w-8 h-8 md:w-10 md:h-10"
            onClick={() => scroll("right")}
          >
            <ArrowRight className="h-4 w-4 md:h-5 md:w-5" />
          </Button>
        </div>
      </div>
    </section>
  )
}
