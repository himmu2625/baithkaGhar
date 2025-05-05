"use client"

export const dynamic = 'force-dynamic';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Heart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

export default function FavoritesPage() {
  const router = useRouter()

  return (
    <main className="pt-24 pb-16">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-darkGreen">My Favorites</h1>
          <Button onClick={() => router.push("/")} className="bg-mediumGreen hover:bg-darkGreen text-lightYellow">
            Explore Properties
          </Button>
        </div>

        <Card className="border-lightGreen">
          <CardHeader>
            <CardTitle className="text-darkGreen">Favorite Properties</CardTitle>
            <CardDescription>Properties you've saved for later</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <Heart className="h-12 w-12 mx-auto text-mediumGreen/50 mb-4" />
              <h3 className="text-lg font-medium text-darkGreen mb-2">No favorites yet</h3>
              <p className="text-mediumGreen">
                You haven't saved any properties as favorites yet. Click the heart icon on any property to save it here.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
