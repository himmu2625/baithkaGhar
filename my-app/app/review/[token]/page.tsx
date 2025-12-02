"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { Loader2, CheckCircle2, Gift } from "lucide-react"
import { MultiStepReviewForm } from "@/components/review/MultiStepReviewForm"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface ReviewRequestData {
  propertyName: string
  propertyImage?: string
  checkInDate: string
  checkOutDate: string
  roomCategory?: string
  guestName: string
  status: string
}

export default function ReviewSubmissionPage() {
  const params = useParams()
  const token = params.token as string

  const [loading, setLoading] = useState(true)
  const [reviewData, setReviewData] = useState<ReviewRequestData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [rewardPoints, setRewardPoints] = useState(0)

  useEffect(() => {
    fetchReviewRequest()
  }, [token])

  const fetchReviewRequest = async () => {
    try {
      const response = await fetch(`/api/reviews/request/${token}`)
      const data = await response.json()

      if (data.success) {
        if (data.reviewRequest.status === 'submitted') {
          setError('This review has already been submitted.')
        } else if (data.reviewRequest.status === 'expired') {
          setError('This review link has expired.')
        } else {
          setReviewData({
            propertyName: data.property?.name || 'Property',
            propertyImage: data.property?.images?.[0] || '',
            checkInDate: data.reviewRequest.checkInDate,
            checkOutDate: data.reviewRequest.checkOutDate,
            roomCategory: data.reviewRequest.roomCategory,
            guestName: data.reviewRequest.guestName,
            status: data.reviewRequest.status,
          })
        }
      } else {
        setError(data.error || 'Invalid review link')
      }
    } catch (error) {
      console.error('Error fetching review request:', error)
      setError('Failed to load review form. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitSuccess = (points: number) => {
    setSubmitted(true)
    setRewardPoints(points)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-blue-50">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-emerald-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading review form...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-blue-50 p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <div className="h-16 w-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">⚠️</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Oops!</h2>
            <p className="text-gray-600">{error}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-blue-50 p-4">
        <Card className="w-full max-w-2xl">
          <CardContent className="p-12 text-center">
            <div className="h-20 w-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="h-12 w-12 text-green-600" />
            </div>

            <h1 className="text-3xl font-bold text-gray-900 mb-3">
              Thank You for Your Review!
            </h1>

            <p className="text-gray-600 text-lg mb-6">
              Your feedback helps other travelers make informed decisions.
            </p>

            <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border-2 border-amber-200 rounded-lg p-6 mb-6">
              <Gift className="h-10 w-10 text-amber-600 mx-auto mb-3" />
              <h3 className="text-xl font-bold text-amber-900 mb-2">
                You've Earned Reward Points!
              </h3>
              <div className="text-4xl font-bold text-amber-600 mb-2">
                +{rewardPoints} Points
              </div>
              <p className="text-sm text-amber-700">
                Use these points for discounts on your next booking!
              </p>
            </div>

            <div className="space-y-3 text-sm text-gray-600">
              <p className="flex items-center justify-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                Your review is pending approval
              </p>
              <p className="flex items-center justify-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                We'll notify you once it's published
              </p>
              <p className="flex items-center justify-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                Your reward points will be credited shortly
              </p>
            </div>

            <div className="mt-8 pt-6 border-t">
              <a
                href="/"
                className="inline-block bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-8 py-3 rounded-lg transition-colors"
              >
                Back to Home
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-blue-50 py-12 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <Badge className="mb-4 bg-emerald-600">Share Your Experience</Badge>
          <h1 className="text-4xl font-bold text-gray-900 mb-3">
            How was your stay?
          </h1>
          <p className="text-gray-600 text-lg">
            Your feedback helps us improve and helps other travelers
          </p>
        </div>

        {/* Property Info Card */}
        {reviewData && (
          <Card className="mb-8 border-2 border-emerald-100">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                {reviewData.propertyImage && (
                  <img
                    src={reviewData.propertyImage}
                    alt={reviewData.propertyName}
                    className="w-20 h-20 rounded-lg object-cover"
                  />
                )}
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900">
                    {reviewData.propertyName}
                  </h3>
                  <p className="text-gray-600">
                    {new Date(reviewData.checkInDate).toLocaleDateString()} - {new Date(reviewData.checkOutDate).toLocaleDateString()}
                  </p>
                  {reviewData.roomCategory && (
                    <Badge variant="outline" className="mt-1">
                      {reviewData.roomCategory}
                    </Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Review Form */}
        {reviewData && (
          <MultiStepReviewForm
            token={token}
            propertyName={reviewData.propertyName}
            checkInDate={reviewData.checkInDate}
            checkOutDate={reviewData.checkOutDate}
            onSubmitSuccess={handleSubmitSuccess}
          />
        )}

        {/* Footer Note */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            Your review will be verified and published within 24-48 hours
          </p>
        </div>
      </div>
    </div>
  )
}
