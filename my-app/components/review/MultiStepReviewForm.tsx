"use client"

import { useState } from "react"
import { Star, ChevronRight, ChevronLeft, Upload, Loader2, CheckCircle2, ThumbsUp, ThumbsDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface MultiStepReviewFormProps {
  token: string
  propertyName: string
  checkInDate: string
  checkOutDate: string
  onSubmitSuccess: (rewardPoints: number) => void
}

const STEPS = [
  { id: 1, title: "Rate Your Stay", description: "How was your overall experience?" },
  { id: 2, title: "Category Ratings", description: "Rate specific aspects" },
  { id: 3, title: "Tell Us More", description: "Share your experience" },
  { id: 4, title: "Trip Details", description: "Help future guests" },
  { id: 5, title: "Add Photos", description: "Show us your stay (optional)" },
]

export function MultiStepReviewForm({
  token,
  propertyName,
  checkInDate,
  checkOutDate,
  onSubmitSuccess,
}: MultiStepReviewFormProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Form data
  const [overallRating, setOverallRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [categoryRatings, setCategoryRatings] = useState({
    cleanliness: 0,
    accuracy: 0,
    communication: 0,
    location: 0,
    checkIn: 0,
    value: 0,
  })
  const [comment, setComment] = useState("")
  const [lovedMost, setLovedMost] = useState("")
  const [improvements, setImprovements] = useState("")
  const [wouldRecommend, setWouldRecommend] = useState<boolean | null>(null)
  const [tripType, setTripType] = useState("")
  const [guestLocation, setGuestLocation] = useState("")
  const [displayName, setDisplayName] = useState("")
  const [photos, setPhotos] = useState<File[]>([])

  const progress = (currentStep / STEPS.length) * 100

  const categories = [
    { key: "cleanliness", label: "Cleanliness", emoji: "🧼" },
    { key: "accuracy", label: "Accuracy", emoji: "✓" },
    { key: "communication", label: "Communication", emoji: "💬" },
    { key: "location", label: "Location", emoji: "📍" },
    { key: "checkIn", label: "Check-in", emoji: "🔑" },
    { key: "value", label: "Value for Money", emoji: "💰" },
  ]

  const handleCategoryRating = (category: string, rating: number) => {
    setCategoryRatings(prev => ({ ...prev, [category]: rating }))
  }

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newPhotos = Array.from(e.target.files)
      setPhotos(prev => [...prev, ...newPhotos].slice(0, 5)) // Max 5 photos
    }
  }

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return overallRating > 0
      case 2:
        return Object.values(categoryRatings).every(r => r > 0)
      case 3:
        return comment.trim().length >= 20 && wouldRecommend !== null
      case 4:
        return tripType !== ""
      case 5:
        return true // Photos are optional
      default:
        return false
    }
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)

    try {
      // For now, we'll skip actual photo upload to keep it simple
      // In production, you'd upload photos to Cloudinary first
      const photoUrls: any[] = []

      const response = await fetch('/api/reviews/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          overallRating,
          categoryRatings,
          comment,
          lovedMost,
          improvements,
          wouldRecommend,
          tripType,
          guestLocation,
          displayName,
          photos: photoUrls,
        }),
      })

      const data = await response.json()

      if (data.success) {
        onSubmitSuccess(data.review.rewardPoints)
      } else {
        alert(data.error || 'Failed to submit review')
        setIsSubmitting(false)
      }
    } catch (error) {
      console.error('Error submitting review:', error)
      alert('Failed to submit review. Please try again.')
      setIsSubmitting(false)
    }
  }

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardContent className="p-8">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">
              Step {currentStep} of {STEPS.length}
            </span>
            <span className="text-sm text-gray-500">{Math.round(progress)}% Complete</span>
          </div>
          <Progress value={progress} className="h-2" />

          <div className="mt-4 text-center">
            <h2 className="text-2xl font-bold text-darkGreen">{STEPS[currentStep - 1].title}</h2>
            <p className="text-gray-600 mt-1">{STEPS[currentStep - 1].description}</p>
          </div>
        </div>

        {/* Step Content */}
        <div className="min-h-[400px]">
          {/* Step 1: Overall Rating */}
          {currentStep === 1 && (
            <div className="text-center py-12">
              <h3 className="text-xl mb-6 text-gray-800">
                How would you rate your stay at <span className="font-bold text-emerald-600">{propertyName}</span>?
              </h3>

              <div className="flex justify-center gap-3 mb-6">
                {[1, 2, 3, 4, 5].map((rating) => (
                  <button
                    key={rating}
                    onClick={() => setOverallRating(rating)}
                    onMouseEnter={() => setHoverRating(rating)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="transition-transform hover:scale-110"
                  >
                    <Star
                      className={`h-16 w-16 ${
                        rating <= (hoverRating || overallRating)
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-gray-300"
                      }`}
                    />
                  </button>
                ))}
              </div>

              {overallRating > 0 && (
                <div className="mt-6">
                  <Badge className="text-lg px-4 py-2 bg-emerald-600">
                    {overallRating === 5 ? "Excellent!" :
                     overallRating === 4 ? "Very Good!" :
                     overallRating === 3 ? "Good" :
                     overallRating === 2 ? "Fair" : "Poor"}
                  </Badge>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Category Ratings */}
          {currentStep === 2 && (
            <div className="space-y-6 py-6">
              {categories.map((category) => (
                <div key={category.key} className="border-b pb-4 last:border-0">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{category.emoji}</span>
                      <Label className="text-lg font-medium">{category.label}</Label>
                    </div>
                    <span className="text-sm text-gray-500">
                      {categoryRatings[category.key as keyof typeof categoryRatings] || 0}/5
                    </span>
                  </div>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((rating) => (
                      <button
                        key={rating}
                        onClick={() => handleCategoryRating(category.key, rating)}
                        className="transition-transform hover:scale-110"
                      >
                        <Star
                          className={`h-8 w-8 ${
                            rating <= categoryRatings[category.key as keyof typeof categoryRatings]
                              ? "fill-yellow-400 text-yellow-400"
                              : "text-gray-300"
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Step 3: Written Review */}
          {currentStep === 3 && (
            <div className="space-y-6 py-6">
              <div>
                <Label htmlFor="comment" className="text-base font-semibold mb-2 block">
                  Tell us about your experience *
                </Label>
                <Textarea
                  id="comment"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Share your thoughts about your stay..."
                  className="min-h-[150px]"
                  maxLength={2000}
                />
                <p className="text-sm text-gray-500 mt-1">
                  {comment.length}/2000 characters {comment.length < 20 && "(minimum 20 characters)"}
                </p>
              </div>

              <div>
                <Label htmlFor="loved" className="text-base font-semibold mb-2 block">
                  What did you love most?
                </Label>
                <Input
                  id="loved"
                  value={lovedMost}
                  onChange={(e) => setLovedMost(e.target.value)}
                  placeholder="E.g., The stunning view, friendly staff..."
                  maxLength={500}
                />
              </div>

              <div>
                <Label htmlFor="improvements" className="text-base font-semibold mb-2 block">
                  What could be improved?
                </Label>
                <Input
                  id="improvements"
                  value={improvements}
                  onChange={(e) => setImprovements(e.target.value)}
                  placeholder="Any suggestions? (optional)"
                  maxLength={500}
                />
              </div>

              <div>
                <Label className="text-base font-semibold mb-3 block">
                  Would you recommend this property? *
                </Label>
                <div className="flex gap-4">
                  <Button
                    type="button"
                    variant={wouldRecommend === true ? "default" : "outline"}
                    onClick={() => setWouldRecommend(true)}
                    className={wouldRecommend === true ? "bg-green-600 hover:bg-green-700" : ""}
                  >
                    <ThumbsUp className="h-4 w-4 mr-2" />
                    Yes
                  </Button>
                  <Button
                    type="button"
                    variant={wouldRecommend === false ? "default" : "outline"}
                    onClick={() => setWouldRecommend(false)}
                    className={wouldRecommend === false ? "bg-red-600 hover:bg-red-700" : ""}
                  >
                    <ThumbsDown className="h-4 w-4 mr-2" />
                    No
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Trip Details */}
          {currentStep === 4 && (
            <div className="space-y-6 py-6">
              <div>
                <Label htmlFor="tripType" className="text-base font-semibold mb-2 block">
                  What type of trip was this? *
                </Label>
                <Select value={tripType} onValueChange={setTripType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select trip type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="solo">Solo Trip</SelectItem>
                    <SelectItem value="couple">Couple's Trip</SelectItem>
                    <SelectItem value="family">Family Trip</SelectItem>
                    <SelectItem value="business">Business Trip</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="displayName" className="text-base font-semibold mb-2 block">
                  Display Name
                </Label>
                <Input
                  id="displayName"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="How should we display your name?"
                />
              </div>

              <div>
                <Label htmlFor="location" className="text-base font-semibold mb-2 block">
                  Your Location (Optional)
                </Label>
                <Input
                  id="location"
                  value={guestLocation}
                  onChange={(e) => setGuestLocation(e.target.value)}
                  placeholder="E.g., Mumbai, India"
                />
              </div>
            </div>
          )}

          {/* Step 5: Photos */}
          {currentStep === 5 && (
            <div className="py-6">
              <div className="text-center mb-6">
                <p className="text-lg text-gray-700 mb-2">
                  Add photos to make your review more helpful (Optional)
                </p>
                <Badge className="bg-amber-100 text-amber-700">
                  +50 bonus points for adding photos!
                </Badge>
              </div>

              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-emerald-500 transition-colors">
                <Upload className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <Label htmlFor="photos" className="cursor-pointer">
                  <span className="text-emerald-600 font-semibold hover:text-emerald-700">
                    Click to upload
                  </span>
                  <span className="text-gray-600"> or drag and drop</span>
                  <p className="text-sm text-gray-500 mt-2">
                    PNG, JPG up to 10MB (Max 5 photos)
                  </p>
                </Label>
                <Input
                  id="photos"
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
              </div>

              {photos.length > 0 && (
                <div className="mt-4 grid grid-cols-3 gap-4">
                  {photos.map((photo, index) => (
                    <div key={index} className="relative aspect-square rounded-lg overflow-hidden border">
                      <img
                        src={URL.createObjectURL(photo)}
                        alt={`Photo ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between pt-6 border-t">
          <Button
            variant="outline"
            onClick={() => setCurrentStep(prev => prev - 1)}
            disabled={currentStep === 1 || isSubmitting}
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Previous
          </Button>

          {currentStep < STEPS.length ? (
            <Button
              onClick={() => setCurrentStep(prev => prev + 1)}
              disabled={!canProceed()}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              Next
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={!canProceed() || isSubmitting}
              className="bg-emerald-600 hover:bg-emerald-700 min-w-[120px]"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  Submit Review
                  <CheckCircle2 className="h-4 w-4 ml-2" />
                </>
              )}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
