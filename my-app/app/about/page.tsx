export const dynamic = 'force-dynamic';

import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"
import { Award, Users, Building, Clock, MapPin } from "lucide-react"
import { getPlaceholderImage } from "@/lib/placeholder"

export default function AboutPage() {
  return (
    <main className="pt-24 pb-16">
      <section className="bg-lightBeige py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-12">
            <h1 className="text-4xl font-bold text-darkGreen mb-4">About Baithaka Ghar</h1>
            <p className="text-mediumGreen text-lg">
              Your trusted partner for finding the perfect accommodation across India
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-2xl font-bold text-darkGreen mb-4">Our Story</h2>
              <p className="text-mediumGreen mb-4">
                Founded in 2020, Baithaka Ghar was born from a simple idea: to make finding and booking accommodations
                in India as easy and enjoyable as possible.
              </p>
              <p className="text-mediumGreen mb-4">
                Our founders experienced firsthand the challenges of finding reliable, quality accommodations while
                traveling across the diverse landscapes of India. They envisioned a platform that would bridge the gap
                between travelers and property owners, ensuring a seamless experience for both.
              </p>
              <p className="text-mediumGreen">
                Today, Baithaka Ghar has grown into a trusted platform connecting thousands of travelers with their
                ideal stays, from luxury resorts to cozy homestays, across every corner of India.
              </p>
            </div>
            <div className="relative h-80 rounded-lg overflow-hidden shadow-lg">
              <Image
                src={getPlaceholderImage(800, 600, "Baithaka Ghar Team") || "/placeholder.svg"}
                alt="Baithaka Ghar Team"
                fill
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-darkGreen text-center mb-12">Our Mission & Values</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="bg-lightBeige border-brownTan">
              <CardContent className="pt-6">
                <div className="bg-brownTan w-12 h-12 rounded-full flex items-center justify-center mb-4 mx-auto">
                  <Award className="text-lightBeige h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold text-darkGreen text-center mb-2">Quality Assurance</h3>
                <p className="text-mediumGreen text-center">
                  We personally verify all properties on our platform to ensure they meet our high standards of quality,
                  cleanliness, and service.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-lightBeige border-brownTan">
              <CardContent className="pt-6">
                <div className="bg-brownTan w-12 h-12 rounded-full flex items-center justify-center mb-4 mx-auto">
                  <Users className="text-lightBeige h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold text-darkGreen text-center mb-2">Customer First</h3>
                <p className="text-mediumGreen text-center">
                  Our decisions are guided by what's best for our customers. We strive to provide exceptional service
                  and support at every step.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-lightBeige border-brownTan">
              <CardContent className="pt-6">
                <div className="bg-brownTan w-12 h-12 rounded-full flex items-center justify-center mb-4 mx-auto">
                  <Building className="text-lightBeige h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold text-darkGreen text-center mb-2">Community Support</h3>
                <p className="text-mediumGreen text-center">
                  We empower local property owners and contribute to local economies by connecting them with travelers
                  from around the world.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="bg-darkGreen py-16 text-lightBeige">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Our Achievements</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center">
              <p className="text-4xl font-bold text-brownTan mb-2">10,000+</p>
              <p className="text-lg">Properties Listed</p>
            </div>

            <div className="text-center">
              <p className="text-4xl font-bold text-brownTan mb-2">500+</p>
              <p className="text-lg">Cities Covered</p>
            </div>

            <div className="text-center">
              <p className="text-4xl font-bold text-brownTan mb-2">1M+</p>
              <p className="text-lg">Happy Customers</p>
            </div>

            <div className="text-center">
              <p className="text-4xl font-bold text-brownTan mb-2">4.8/5</p>
              <p className="text-lg">Average Rating</p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-darkGreen text-center mb-12">Our Team</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map((member) => (
              <div key={member} className="text-center">
                <div className="relative w-48 h-48 rounded-full overflow-hidden mx-auto mb-4">
                  <Image
                    src={getPlaceholderImage(200, 200, `Team Member ${member || "/placeholder.svg"}`)}
                    alt={`Team Member ${member}`}
                    fill
                    className="object-cover"
                  />
                </div>
                <h3 className="text-xl font-bold text-darkGreen">Team Member {member}</h3>
                <p className="text-brownTan mb-2">Co-Founder & CEO</p>
                <p className="text-mediumGreen">
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla facilisi. Sed euismod, nisl vel
                  ultricies lacinia.
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-lightBeige py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-darkGreen mb-6">Visit Our Office</h2>
          <div className="flex flex-col items-center justify-center space-y-2 mb-8">
            <MapPin className="h-6 w-6 text-brownTan" />
            <p className="text-mediumGreen">123 Hospitality Lane, Mumbai, Maharashtra, India</p>
          </div>

          <div className="flex flex-col items-center justify-center space-y-2">
            <Clock className="h-6 w-6 text-brownTan" />
            <p className="text-mediumGreen">Monday - Friday: 9:00 AM - 6:00 PM</p>
            <p className="text-mediumGreen">Saturday: 10:00 AM - 4:00 PM</p>
            <p className="text-mediumGreen">Sunday: Closed</p>
          </div>
        </div>
      </section>
    </main>
  )
}
