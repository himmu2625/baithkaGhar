import HeroSection from "@/components/layout/hero-section"
import PopularCities from "@/components/layout/popular-cities"
import { SpecialOffersDisplay } from "@/components/features/special-offers/SpecialOffersDisplay"
import TravelPicks from "@/components/layout/travel-picks"
import SpecialDeals from "@/components/layout/special-deals"
import StayTypes from "@/components/layout/stay-types"
import Benefits from "@/components/layout/benefits"

// Metadata for SEO
export const metadata = {
  title: 'Baithaka GHAR - Affordable & Reliable Accommodation',
  description: 'Book instant accommodations across India. Trusted by thousands of travelers.',
}

// Enable static generation for faster loading
export const revalidate = 3600 // Revalidate every hour

export default function Home() {
  return (
    <main className="min-h-screen">
      <HeroSection />
      <PopularCities />
      <SpecialOffersDisplay />
      <TravelPicks />
      <SpecialDeals />
      <StayTypes />
      <Benefits />
      
      {/* Development Example Section - Can be removed in production */}
      {/* <section className="max-w-5xl mx-auto my-12 p-4">
        <div className="bg-gray-50 border border-gray-200 p-4 rounded-lg">
          <h2 className="text-lg font-medium mb-2">Development Examples</h2>
          <p className="text-sm text-gray-600 mb-3">
            Check out examples of server-side features like getServerSession, headers(), and useSearchParams().
          </p>
          <Link
            href="/examples/server-components"
            className="inline-block px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors text-sm"
          >
            View Server Components Example
          </Link>
        </div>
      </section> */}
    </main>
  )
}
