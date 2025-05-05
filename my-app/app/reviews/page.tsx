"use client"

export const dynamic = 'force-dynamic';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Star } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

export default function ReviewsPage() {
  const router = useRouter()

  return (
    <main className="pt-24 pb-16">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-darkGreen">My Reviews</h1>
          <Button
            onClick={() => router.push("/bookings")}
            className="bg-mediumGreen hover:bg-darkGreen text-lightYellow"
          >
            View Bookings
          </Button>
        </div>

        <Card className="border-lightGreen">
          <CardHeader>
            <CardTitle className="text-darkGreen">Your Reviews</CardTitle>
            <CardDescription>Reviews you've left for properties</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <Star className="h-12 w-12 mx-auto text-mediumGreen/50 mb-4" />
              <h3 className="text-lg font-medium text-darkGreen mb-2">No reviews yet</h3>
              <p className="text-mediumGreen">
                You haven't written any reviews yet. After your stay, you'll be able to share your experience.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
