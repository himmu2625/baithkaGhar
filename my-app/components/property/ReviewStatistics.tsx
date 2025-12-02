"use client"

import { Star, TrendingUp, Award, ThumbsUp } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"

interface ReviewStatisticsProps {
  averageRating: number
  totalReviews: number
  ratingDistribution: {
    5: number
    4: number
    3: number
    2: number
    1: number
  }
  recommendationPercentage?: number
  categoryBreakdown: {
    cleanliness: number
    accuracy: number
    communication: number
    location: number
    checkIn: number
    value: number
  }
  recentTrend?: "up" | "down" | "stable"
}

export function ReviewStatistics({
  averageRating,
  totalReviews,
  ratingDistribution,
  recommendationPercentage = 95,
  categoryBreakdown,
  recentTrend = "stable",
}: ReviewStatisticsProps) {
  const getRatingPercentage = (count: number) => {
    return totalReviews > 0 ? (count / totalReviews) * 100 : 0
  }

  const ratingCategories = [
    { rating: 5, count: ratingDistribution[5] },
    { rating: 4, count: ratingDistribution[4] },
    { rating: 3, count: ratingDistribution[3] },
    { rating: 2, count: ratingDistribution[2] },
    { rating: 1, count: ratingDistribution[1] },
  ]

  const categoryRatings = [
    { name: "Cleanliness", value: categoryBreakdown.cleanliness, icon: "🧼" },
    { name: "Accuracy", value: categoryBreakdown.accuracy, icon: "✓" },
    { name: "Communication", value: categoryBreakdown.communication, icon: "💬" },
    { name: "Location", value: categoryBreakdown.location, icon: "📍" },
    { name: "Check-in", value: categoryBreakdown.checkIn, icon: "🔑" },
    { name: "Value", value: categoryBreakdown.value, icon: "💰" },
  ]

  return (
    <Card className="mb-6 border-2 border-emerald-100 shadow-md">
      <CardContent className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-darkGreen mb-2 flex items-center gap-2">
              <Star className="h-6 w-6 text-yellow-400 fill-yellow-400" />
              Guest Reviews
            </h2>
            <p className="text-gray-600">
              {totalReviews} verified review{totalReviews !== 1 ? "s" : ""}
            </p>
          </div>

          {/* Average Rating Display */}
          <div className="text-center">
            <div className="text-5xl font-bold text-emerald-600 mb-1">
              {averageRating.toFixed(1)}
            </div>
            <div className="flex items-center gap-1 justify-center mb-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`h-4 w-4 ${
                    star <= Math.round(averageRating)
                      ? "fill-yellow-400 text-yellow-400"
                      : "text-gray-300"
                  }`}
                />
              ))}
            </div>
            {recentTrend === "up" && (
              <Badge className="bg-green-100 text-green-700 border-green-200">
                <TrendingUp className="h-3 w-3 mr-1" />
                Improving
              </Badge>
            )}
          </div>
        </div>

        {/* Recommendation Badge */}
        {recommendationPercentage >= 90 && (
          <div className="mb-6 p-4 bg-gradient-to-r from-emerald-50 to-green-50 rounded-lg border-2 border-emerald-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-600 rounded-full">
                <ThumbsUp className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="font-bold text-emerald-900 text-lg">
                  {recommendationPercentage}% of guests recommend this property
                </p>
                <p className="text-sm text-emerald-700">Based on verified bookings</p>
              </div>
            </div>
          </div>
        )}

        {/* Rating Distribution */}
        <div className="mb-6">
          <h3 className="font-semibold text-gray-900 mb-3">Rating Distribution</h3>
          <div className="space-y-2">
            {ratingCategories.map(({ rating, count }) => {
              const percentage = getRatingPercentage(count)
              return (
                <div key={rating} className="flex items-center gap-3">
                  <div className="flex items-center gap-1 w-16">
                    <span className="text-sm font-medium text-gray-700">{rating}</span>
                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                  </div>
                  <Progress
                    value={percentage}
                    className="h-2 flex-1"
                  />
                  <span className="text-sm text-gray-600 w-12 text-right">
                    {count}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Category Breakdown */}
        <div>
          <h3 className="font-semibold text-gray-900 mb-3">Category Ratings</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {categoryRatings.map((category) => (
              <div
                key={category.name}
                className="p-3 bg-gray-50 rounded-lg border border-gray-200 hover:border-emerald-300 transition-colors"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-700">{category.name}</span>
                  <span className="text-xl">{category.icon}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <Progress value={category.value * 20} className="h-1.5" />
                  </div>
                  <span className="text-sm font-bold text-gray-900">
                    {category.value.toFixed(1)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Trust Badges */}
        {averageRating >= 4.5 && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="flex flex-wrap gap-2">
              <Badge className="bg-amber-100 text-amber-700 border-amber-200 px-3 py-1">
                <Award className="h-3 w-3 mr-1" />
                Highly Rated
              </Badge>
              {recommendationPercentage >= 95 && (
                <Badge className="bg-green-100 text-green-700 border-green-200 px-3 py-1">
                  <ThumbsUp className="h-3 w-3 mr-1" />
                  Guest Favorite
                </Badge>
              )}
              {categoryBreakdown.cleanliness >= 4.8 && (
                <Badge className="bg-blue-100 text-blue-700 border-blue-200 px-3 py-1">
                  Exceptionally Clean
                </Badge>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
