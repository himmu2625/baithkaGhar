"use client"

import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Clock, Info } from "lucide-react"
import Image from "next/image"
import { Badge } from "@/components/ui/badge"

export default function DealPage() {
  const params = useParams()
  const router = useRouter()
  const dealId = params?.id as string || "unknown"

  // Sample deal data
  const deal = {
    id: dealId,
    title: "Weekend Getaway Special",
    description:
      "30% off on weekend stays at select properties across India. Valid for bookings made between Monday and Thursday for weekend stays (Friday to Sunday).",
    image: "/placeholder.svg?height=500&width=1000",
    discount: "30%",
    validUntil: "2024-12-31",
    tag: "Limited Time",
    terms: [
      "Offer valid for stays between Friday and Sunday only",
      "Booking must be made at least 7 days in advance",
      "Cannot be combined with other offers or promotions",
      "Subject to availability",
      "Blackout dates may apply during peak seasons and holidays",
    ],
    properties: [
      "Luxury Villa in Goa",
      "Beachfront Resort in Mumbai",
      "Mountain Retreat in Shimla",
      "Heritage Haveli in Jaipur",
    ],
  }

  return (
    <main className="pt-24 pb-16">
      <div className="container mx-auto px-4">
        <Button variant="ghost" className="mb-4 text-darkGreen hover:text-mediumGreen" onClick={() => router.back()}>
          ← Back to Deals
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card className="border-lightGreen overflow-hidden">
              <div className="relative h-64 md:h-80">
                <Image src={deal.image || "/placeholder.svg"} alt={deal.title} fill className="object-cover" />
                <div className="absolute top-4 right-4">
                  <Badge className="bg-mediumGreen text-lightYellow text-lg px-4 py-2">{deal.discount} OFF</Badge>
                </div>
              </div>
              <CardHeader>
                <CardTitle className="text-2xl md:text-3xl text-darkGreen">{deal.title}</CardTitle>
                <CardDescription className="text-base">{deal.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center text-mediumGreen mb-4">
                  <Clock className="mr-2 h-5 w-5" />
                  <span>Valid until {new Date(deal.validUntil).toLocaleDateString()}</span>
                </div>

                <h3 className="text-xl font-bold text-darkGreen mb-2">Participating Properties</h3>
                <ul className="list-disc list-inside mb-6 text-mediumGreen">
                  {deal.properties.map((property, index) => (
                    <li key={index} className="mb-1">
                      {property}
                    </li>
                  ))}
                </ul>

                <h3 className="text-xl font-bold text-darkGreen mb-2">Terms & Conditions</h3>
                <ul className="list-disc list-inside text-mediumGreen">
                  {deal.terms.map((term, index) => (
                    <li key={index} className="mb-1">
                      {term}
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Button className="w-full bg-mediumGreen hover:bg-darkGreen text-lightYellow">
                  Book Now with This Deal
                </Button>
              </CardFooter>
            </Card>
          </div>

          <div>
            <Card className="border-lightGreen sticky top-24">
              <CardHeader>
                <CardTitle className="text-darkGreen">Deal Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center pb-2 border-b">
                  <span className="text-mediumGreen">Discount</span>
                  <span className="font-bold text-darkGreen">{deal.discount}</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b">
                  <span className="text-mediumGreen">Valid Until</span>
                  <span className="font-bold text-darkGreen">{new Date(deal.validUntil).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b">
                  <span className="text-mediumGreen">Deal Type</span>
                  <Badge>{deal.tag}</Badge>
                </div>
                <div className="flex items-start pt-2">
                  <Info className="h-5 w-5 text-mediumGreen mr-2 mt-0.5" />
                  <p className="text-sm text-mediumGreen">
                    To redeem this deal, simply book a participating property and the discount will be automatically
                    applied at checkout.
                  </p>
                </div>
              </CardContent>
              <CardFooter>
                <Button className="w-full bg-mediumGreen hover:bg-darkGreen text-lightYellow">
                  Book with This Deal
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>
    </main>
  )
}
