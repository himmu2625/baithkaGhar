"use client"

import { useParams, useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Briefcase, Users, Heart, Check, LucideIcon } from "lucide-react"
import Image from "next/image"
import { Badge } from "@/components/ui/badge"
import { useLoginPrompt } from "@/hooks/use-login-prompt"

export default function StayTypePage() {
  const params = useParams()
  const router = useRouter()
  const { promptLogin } = useLoginPrompt()
  const stayTypeId = params?.id as string || "1"

  // Sample stay types data
  const stayTypes: {
    id: string;
    title: string;
    description: string;
    icon: LucideIcon;
    image: string;
    color: string;
    features: string[];
    benefits: string[];
  }[] = [
    {
      id: "1",
      title: "Corporate Stay",
      description: "Business-friendly accommodations with workspace and high-speed internet",
      icon: Briefcase,
      image: "/placeholder.svg?height=600&width=1200",
      color: "#D9EAFD",
      features: [
        "High-speed WiFi",
        "Dedicated workspace",
        "Meeting rooms",
        "Business center access",
        "Express check-in/check-out",
        "Complimentary breakfast",
      ],
      benefits: [
        "Convenient location near business districts",
        "Corporate rates available",
        "Flexible cancellation policy",
        "Loyalty program for frequent business travelers",
      ],
    },
    {
      id: "2",
      title: "Family Stay",
      description: "Spacious rooms and kid-friendly amenities for the whole family",
      icon: Users,
      image: "/placeholder.svg?height=600&width=1200",
      color: "#BCCCDC",
      features: [
        "Spacious family rooms",
        "Kids play area",
        "Child-friendly menu",
        "Babysitting services",
        "Family activities",
        "Safety features for children",
      ],
      benefits: [
        "Special rates for children",
        "Family packages with meals included",
        "Close to family attractions",
        "Extra beds/cribs available",
      ],
    },
    {
      id: "3",
      title: "Couple Stay",
      description: "Romantic getaways with privacy and special amenities for couples",
      icon: Heart,
      image: "/placeholder.svg?height=600&width=1200",
      color: "#9AA6B2",
      features: [
        "Private balcony/terrace",
        "King-size bed",
        "Couples spa treatments",
        "Romantic dining options",
        "Champagne on arrival",
        "Late check-out option",
      ],
      benefits: ["Honeymoon packages", "Anniversary specials", "Romantic settings", "Privacy guaranteed"],
    },
  ]

  const stayType = stayTypes.find((type) => type.id === stayTypeId) || stayTypes[0]
  const Icon = stayType.icon

  // Sample properties for this stay type
  const properties = [
    {
      id: 1,
      title: "Luxury Hotel with " + stayType.title + " Package",
      location: "Mumbai",
      price: 12500,
      rating: 4.9,
      reviews: 124,
      image: "/placeholder.svg?height=300&width=500",
    },
    {
      id: 2,
      title: "Premium Resort with " + stayType.title + " Amenities",
      location: "Goa",
      price: 18000,
      rating: 4.7,
      reviews: 98,
      image: "/placeholder.svg?height=300&width=500",
    },
    {
      id: 3,
      title: "Boutique Stay with " + stayType.title + " Focus",
      location: "Delhi",
      price: 9800,
      rating: 4.8,
      reviews: 156,
      image: "/placeholder.svg?height=300&width=500",
    },
  ]

  return (
    <main className="pt-24 md:pt-28 pb-16">
      <div className="container mx-auto px-4">
        <Button variant="ghost" className="mb-4 text-darkGreen hover:text-mediumGreen" onClick={() => router.back()}>
          ← Back
        </Button>

        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 rounded-full" style={{ backgroundColor: stayType.color }}>
              <Icon className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-darkGreen">{stayType.title}</h1>
          </div>
          <p className="text-mediumGreen text-lg">{stayType.description}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12">
          <div className="lg:col-span-2">
            <div className="relative h-64 md:h-96 rounded-lg overflow-hidden mb-6">
              <Image src={stayType.image || "/placeholder.svg"} alt={stayType.title} fill className="object-cover" />
            </div>

            <h2 className="text-2xl font-bold text-darkGreen mb-4">Features</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-8">
              {stayType.features.map((feature, index) => (
                <div key={index} className="flex items-center">
                  <Check className="h-5 w-5 text-mediumGreen mr-2" />
                  <span className="text-mediumGreen">{feature}</span>
                </div>
              ))}
            </div>

            <h2 className="text-2xl font-bold text-darkGreen mb-4">Benefits</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-8">
              {stayType.benefits.map((benefit, index) => (
                <div key={index} className="flex items-center">
                  <Check className="h-5 w-5 text-mediumGreen mr-2" />
                  <span className="text-mediumGreen">{benefit}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <Card className="border-lightGreen sticky top-24">
              <CardContent className="p-6">
                <h3 className="text-xl font-bold text-darkGreen mb-4">Book Your {stayType.title}</h3>
                <p className="text-mediumGreen mb-6">
                  Experience the perfect {stayType.title.toLowerCase()} with our specially curated packages and
                  amenities.
                </p>
                <Button
                  className="w-full bg-mediumGreen hover:bg-darkGreen text-lightYellow mb-4"
                  onClick={promptLogin}
                >
                  Check Availability
                </Button>
                <p className="text-sm text-mediumGreen text-center">Special rates available for direct bookings</p>
              </CardContent>
            </Card>
          </div>
        </div>

        <h2 className="text-2xl font-bold text-darkGreen mb-6">Recommended Properties for {stayType.title}</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {properties.map((property) => (
            <Card
              key={property.id}
              className="overflow-hidden border-lightGreen/30 hover:border-lightGreen transition-all duration-300"
            >
              <div className="relative h-48 overflow-hidden">
                <Image
                  src={property.image || "/placeholder.svg"}
                  alt={property.title}
                  fill
                  className="object-cover transition-transform duration-500 hover:scale-110"
                />
                <Badge className="absolute top-2 right-2 bg-lightGreen text-darkGreen">
                  ₹{property.price.toLocaleString()}/night
                </Badge>
              </div>
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-darkGreen hover:text-mediumGreen transition-colors">
                    {property.title}
                  </h3>
                </div>
                <p className="text-sm text-grayText mb-4">{property.location}</p>
                <Button
                  className="w-full bg-mediumGreen hover:bg-darkGreen text-lightYellow transition-all duration-300"
                  onClick={promptLogin}
                >
                  View Details
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </main>
  )
}
