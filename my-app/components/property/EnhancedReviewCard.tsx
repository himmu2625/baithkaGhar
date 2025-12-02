"use client"

import { useState } from "react"
import {
  Star,
  ThumbsUp,
  ThumbsDown,
  Flag,
  CheckCircle2,
  Award,
  Camera,
  MapPin,
  Calendar,
  Users,
  ChevronDown,
  ChevronUp,
  MessageCircle,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { format } from "date-fns"

interface Review {
  id: string
  user: {
    name: string
    image?: string
    location?: string
    reviewCount?: number
    isTopContributor?: boolean
  }
  rating: number
  comment: string
  date: string
  verifiedBooking?: boolean
  source?: string // google, booking, airbnb, mmt, justdial, direct
  stayDate?: string
  roomCategory?: string
  tripType?: "solo" | "couple" | "family" | "business"
  photos?: string[]
  helpfulCount?: number
  notHelpfulCount?: number
  nightsStayed?: number
  categoryRatings?: {
    cleanliness?: number
    accuracy?: number
    communication?: number
    location?: number
    checkIn?: number
    value?: number
  }
  hostResponse?: {
    comment: string
    date: string
    responseTime?: string
  }
}

interface EnhancedReviewCardProps {
  review: Review
  onHelpful?: (reviewId: string) => void
  onNotHelpful?: (reviewId: string) => void
  onReport?: (reviewId: string) => void
}

const tripTypeLabels = {
  solo: "Solo Trip",
  couple: "Couple's Trip",
  family: "Family Trip",
  business: "Business Trip",
}

const tripTypeIcons = {
  solo: Users,
  couple: Users,
  family: Users,
  business: Users,
}

const sourceConfig = {
  google: { label: "⭐ Google", style: "bg-blue-50 text-blue-700 border-blue-200" },
  booking: { label: "🏨 Booking.com", style: "bg-indigo-50 text-indigo-700 border-indigo-200" },
  airbnb: { label: "🏠 Airbnb", style: "bg-red-50 text-red-700 border-red-200" },
  mmt: { label: "✈️ MakeMyTrip", style: "bg-orange-50 text-orange-700 border-orange-200" },
  justdial: { label: "📱 JustDial", style: "bg-green-50 text-green-700 border-green-200" },
  imported: { label: "📥 Imported", style: "bg-gray-50 text-gray-700 border-gray-200" },
}

export function EnhancedReviewCard({
  review,
  onHelpful,
  onNotHelpful,
  onReport,
}: EnhancedReviewCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [showAllPhotos, setShowAllPhotos] = useState(false)

  const shouldTruncate = review.comment.length > 200
  const displayComment = !isExpanded && shouldTruncate
    ? review.comment.substring(0, 200) + "..."
    : review.comment

  const TripIcon = review.tripType ? tripTypeIcons[review.tripType] : Users

  // Rating color based on value
  const getRatingColor = (rating: number) => {
    if (rating >= 4.5) return "text-green-600 bg-green-50 border-green-200"
    if (rating >= 3.5) return "text-blue-600 bg-blue-50 border-blue-200"
    if (rating >= 2.5) return "text-yellow-600 bg-yellow-50 border-yellow-200"
    return "text-orange-600 bg-orange-50 border-orange-200"
  }

  // Get source badge configuration
  const getSourceConfig = (source?: string) => {
    if (!source || source === 'direct') return null
    return sourceConfig[source as keyof typeof sourceConfig] || sourceConfig.imported
  }

  const formatStayDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr)
      return format(date, "MMM yyyy")
    } catch {
      return dateStr
    }
  }

  return (
    <Card className="hover:shadow-lg transition-all duration-300 border-gray-200">
      <CardContent className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start gap-3">
            <Avatar className="h-12 w-12 border-2 border-emerald-100">
              <AvatarImage src={review.user.image || "/placeholder.svg"} alt={review.user.name} />
              <AvatarFallback className="bg-emerald-100 text-emerald-700 font-semibold">
                {review.user.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-semibold text-gray-900">{review.user.name}</h4>
                {review.user.isTopContributor && (
                  <Badge variant="secondary" className="bg-amber-100 text-amber-700 border-amber-200">
                    <Award className="h-3 w-3 mr-1" />
                    Top Contributor
                  </Badge>
                )}
              </div>
              {review.user.location && (
                <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                  <MapPin className="h-3 w-3" />
                  {review.user.location}
                </p>
              )}
              {review.user.reviewCount && review.user.reviewCount > 1 && (
                <p className="text-xs text-gray-500 mt-0.5">
                  {review.user.reviewCount} reviews
                </p>
              )}
            </div>
          </div>

          {/* Rating Badge */}
          <Badge className={`px-3 py-1 border ${getRatingColor(review.rating)}`}>
            <Star className="h-3 w-3 mr-1 fill-current" />
            {review.rating.toFixed(1)}
          </Badge>
        </div>

        {/* Verification & Stay Info */}
        <div className="flex flex-wrap gap-2 mb-4">
          {review.verifiedBooking && (
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Verified Booking
            </Badge>
          )}
          {(() => {
            const sourceInfo = getSourceConfig(review.source)
            return sourceInfo ? (
              <Badge variant="outline" className={sourceInfo.style}>
                {sourceInfo.label}
              </Badge>
            ) : null
          })()}
          {review.stayDate && (
            <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200">
              <Calendar className="h-3 w-3 mr-1" />
              Stayed {formatStayDate(review.stayDate)}
            </Badge>
          )}
          {review.roomCategory && (
            <Badge variant="outline" className="bg-purple-50 text-purple-600 border-purple-200">
              {review.roomCategory}
            </Badge>
          )}
          {review.tripType && (
            <Badge variant="outline" className="bg-indigo-50 text-indigo-600 border-indigo-200">
              <TripIcon className="h-3 w-3 mr-1" />
              {tripTypeLabels[review.tripType]}
            </Badge>
          )}
          {review.nightsStayed && (
            <Badge variant="outline" className="bg-gray-100 text-gray-600 border-gray-200">
              {review.nightsStayed} {review.nightsStayed === 1 ? "night" : "nights"}
            </Badge>
          )}
        </div>

        {/* Review Comment */}
        <p className="text-gray-700 leading-relaxed mb-4 whitespace-pre-line">
          {displayComment}
        </p>
        {shouldTruncate && (
          <Button
            variant="link"
            className="p-0 h-auto text-emerald-600 hover:text-emerald-700 mb-4"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? (
              <>
                Show less <ChevronUp className="h-4 w-4 ml-1" />
              </>
            ) : (
              <>
                Read more <ChevronDown className="h-4 w-4 ml-1" />
              </>
            )}
          </Button>
        )}

        {/* Category Ratings */}
        {review.categoryRatings && (
          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
            <p className="text-xs font-semibold text-gray-700 mb-2">Detailed Ratings</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
              {Object.entries(review.categoryRatings).map(([key, value]) => (
                value && (
                  <div key={key} className="flex items-center justify-between">
                    <span className="text-gray-600 capitalize">{key}</span>
                    <span className="font-semibold text-gray-900">{value.toFixed(1)}</span>
                  </div>
                )
              ))}
            </div>
          </div>
        )}

        {/* Review Photos */}
        {review.photos && review.photos.length > 0 && (
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <Camera className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">
                {review.photos.length} {review.photos.length === 1 ? "photo" : "photos"}
              </span>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {review.photos.slice(0, showAllPhotos ? review.photos.length : 4).map((photo, index) => (
                <div key={index} className="relative aspect-square rounded-lg overflow-hidden">
                  <img
                    src={photo}
                    alt={`Review photo ${index + 1}`}
                    className="w-full h-full object-cover hover:scale-110 transition-transform cursor-pointer"
                  />
                </div>
              ))}
            </div>
            {review.photos.length > 4 && !showAllPhotos && (
              <Button
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={() => setShowAllPhotos(true)}
              >
                +{review.photos.length - 4} more photos
              </Button>
            )}
          </div>
        )}

        {/* Host Response */}
        {review.hostResponse && (
          <>
            <Separator className="my-4" />
            <div className="bg-emerald-50 rounded-lg p-4 border border-emerald-100">
              <div className="flex items-center gap-2 mb-2">
                <MessageCircle className="h-4 w-4 text-emerald-600" />
                <span className="text-sm font-semibold text-emerald-900">Host Response</span>
                {review.hostResponse.responseTime && (
                  <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 text-xs">
                    Replied in {review.hostResponse.responseTime}
                  </Badge>
                )}
              </div>
              <p className="text-sm text-gray-700 leading-relaxed mb-2">
                {review.hostResponse.comment}
              </p>
              <p className="text-xs text-gray-500">{review.hostResponse.date}</p>
            </div>
          </>
        )}

        <Separator className="my-4" />

        {/* Review Actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="text-gray-600 hover:text-emerald-600 hover:bg-emerald-50"
                onClick={() => onHelpful?.(review.id)}
              >
                <ThumbsUp className="h-4 w-4 mr-1" />
                Helpful {review.helpfulCount ? `(${review.helpfulCount})` : ""}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-gray-600 hover:text-gray-700"
                onClick={() => onNotHelpful?.(review.id)}
              >
                <ThumbsDown className="h-4 w-4" />
                {review.notHelpfulCount ? `(${review.notHelpfulCount})` : ""}
              </Button>
            </div>
          </div>

          <Button
            variant="ghost"
            size="sm"
            className="text-gray-500 hover:text-red-600"
            onClick={() => onReport?.(review.id)}
          >
            <Flag className="h-4 w-4 mr-1" />
            Report
          </Button>
        </div>

        {/* Review Date */}
        <p className="text-xs text-gray-400 mt-3">Reviewed on {review.date}</p>
      </CardContent>
    </Card>
  )
}
