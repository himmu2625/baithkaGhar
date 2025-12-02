"use client"

import { useState, useEffect } from "react"
import { Loader2, Upload, AlertCircle, CheckCircle2, Plus, Trash2, Copy } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface ReviewToImport {
  id: string
  userName: string
  rating: number
  comment: string
  source: string
  sourceReviewId?: string
  reviewDate?: string
  userImage?: string
}

interface Property {
  id: string
  name?: string
  title?: string
}

export default function ImportReviewsPage() {
  const [loading, setLoading] = useState(false)
  const [properties, setProperties] = useState<Property[]>([])
  const [selectedProperty, setSelectedProperty] = useState("")
  const [reviews, setReviews] = useState<ReviewToImport[]>([
    {
      id: Math.random().toString(),
      userName: "",
      rating: 5,
      comment: "",
      source: "google",
      sourceReviewId: "",
      reviewDate: new Date().toISOString().split('T')[0],
    }
  ])
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState<any>(null)

  useEffect(() => {
    fetchProperties()
  }, [])

  const fetchProperties = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/properties')
      const data = await response.json()
      if (data.success) {
        const props = data.properties || []
        console.log('Fetched properties:', props.map((p: any) => ({
          id: p.id,
          name: p.name,
          title: p.title
        })))
        setProperties(props)
      }
    } catch (error) {
      console.error('Error fetching properties:', error)
    } finally {
      setLoading(false)
    }
  }

  const addReview = () => {
    setReviews([
      ...reviews,
      {
        id: Math.random().toString(),
        userName: "",
        rating: 5,
        comment: "",
        source: "google",
        sourceReviewId: "",
        reviewDate: new Date().toISOString().split('T')[0],
      }
    ])
  }

  const removeReview = (id: string) => {
    setReviews(reviews.filter(r => r.id !== id))
  }

  const updateReview = (id: string, field: keyof ReviewToImport, value: any) => {
    setReviews(reviews.map(r => r.id === id ? { ...r, [field]: value } : r))
  }

  const handleImport = async () => {
    if (!selectedProperty) {
      alert('Please select a property')
      return
    }

    const validReviews = reviews.filter(r => r.userName && r.comment && r.rating)

    if (validReviews.length === 0) {
      alert('Please fill in at least one complete review')
      return
    }

    // Debug: Check what we're sending
    console.log('Selected Property ID:', selectedProperty)
    console.log('Valid Reviews:', validReviews)

    setImporting(true)
    setResult(null)

    try {
      const payload = {
        propertyId: selectedProperty,
        reviews: validReviews.map(r => ({
          userName: r.userName,
          rating: r.rating,
          comment: r.comment,
          source: r.source,
          sourceReviewId: r.sourceReviewId || undefined,
          reviewDate: r.reviewDate ? new Date(r.reviewDate) : new Date(),
          userImage: r.userImage || undefined,
          isPublished: true,
        }))
      }

      console.log('Sending payload:', JSON.stringify(payload, null, 2))

      const response = await fetch('/api/admin/reviews/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const data = await response.json()

      if (data.success) {
        setResult(data)
        // Reset form on success
        setReviews([{
          id: Math.random().toString(),
          userName: "",
          rating: 5,
          comment: "",
          source: "google",
          sourceReviewId: "",
          reviewDate: new Date().toISOString().split('T')[0],
        }])
      } else {
        alert(data.error || 'Failed to import reviews')
      }
    } catch (error) {
      console.error('Import error:', error)
      alert('Failed to import reviews')
    } finally {
      setImporting(false)
    }
  }

  const pasteExampleReviews = () => {
    setReviews([
      {
        id: Math.random().toString(),
        userName: "Rahul Sharma",
        rating: 5,
        comment: "Excellent property! The location was perfect and the host was very responsive. Clean rooms and great amenities. Highly recommended!",
        source: "google",
        sourceReviewId: "google_" + Date.now(),
        reviewDate: "2024-11-01",
      },
      {
        id: Math.random().toString(),
        userName: "Priya Patel",
        rating: 4,
        comment: "Great stay overall. The property matched the photos and description. WiFi could be faster but everything else was perfect.",
        source: "booking",
        sourceReviewId: "booking_" + Date.now(),
        reviewDate: "2024-10-28",
      },
      {
        id: Math.random().toString(),
        userName: "Amit Kumar",
        rating: 5,
        comment: "Amazing experience! Beautiful property with stunning views. The host went above and beyond to make our stay comfortable.",
        source: "airbnb",
        sourceReviewId: "airbnb_" + Date.now(),
        reviewDate: "2024-10-25",
      }
    ])
  }

  const sourceOptions = [
    { value: 'google', label: '⭐ Google', color: 'bg-blue-100 text-blue-700' },
    { value: 'booking', label: '🏨 Booking.com', color: 'bg-indigo-100 text-indigo-700' },
    { value: 'airbnb', label: '🏠 Airbnb', color: 'bg-red-100 text-red-700' },
    { value: 'mmt', label: '✈️ MakeMyTrip', color: 'bg-orange-100 text-orange-700' },
    { value: 'justdial', label: '📱 JustDial', color: 'bg-green-100 text-green-700' },
    { value: 'imported', label: '📥 Other', color: 'bg-gray-100 text-gray-700' },
  ]

  const getSourceBadge = (source: string) => {
    const option = sourceOptions.find(o => o.value === source)
    return option || sourceOptions[sourceOptions.length - 1]
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Import Reviews Manually</h1>
        <p className="text-gray-600">
          Add reviews from Google, Booking.com, Airbnb, and other platforms
        </p>
      </div>

      {/* Instructions Card */}
      <Card className="mb-6 border-blue-200 bg-blue-50">
        <CardContent className="p-6">
          <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            How to Import Reviews
          </h3>
          <ol className="space-y-2 text-sm text-blue-800 list-decimal list-inside">
            <li>Select the property where you want to add reviews</li>
            <li>Fill in the review details (copy from Google, Booking.com, etc.)</li>
            <li>Select the source platform (Google, Booking, Airbnb, etc.)</li>
            <li>Add more reviews using the &quot;+ Add Another Review&quot; button</li>
            <li>Click &quot;Import Reviews&quot; to save them to your database</li>
          </ol>
          <Button
            variant="outline"
            size="sm"
            className="mt-4"
            onClick={pasteExampleReviews}
          >
            <Copy className="h-4 w-4 mr-2" />
            Load Example Reviews
          </Button>
        </CardContent>
      </Card>

      {/* Property Selection */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Select Property</CardTitle>
          <CardDescription>Choose which property these reviews belong to</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center gap-2 text-gray-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading properties...
            </div>
          ) : properties.length === 0 ? (
            <div className="text-gray-500 text-sm p-3 border rounded-md">
              No properties found. Please create a property first.
            </div>
          ) : (
            <div className="space-y-2">
              <select
                value={selectedProperty}
                onChange={(e) => setSelectedProperty(e.target.value)}
                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">Select a property</option>
                {properties.map((property) => (
                  <option key={property.id} value={property.id}>
                    {property.name || property.title}
                  </option>
                ))}
              </select>
              {selectedProperty && (
                <div className="flex items-center gap-1 text-sm text-green-600 mt-2">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>
                    Selected: {properties.find(p => p.id === selectedProperty)?.name ||
                               properties.find(p => p.id === selectedProperty)?.title}
                  </span>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Reviews to Import */}
      <div className="space-y-4 mb-6">
        {reviews.map((review, index) => (
          <Card key={review.id} className="border-2">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Review #{index + 1}</CardTitle>
                <div className="flex items-center gap-2">
                  <Badge className={getSourceBadge(review.source).color}>
                    {getSourceBadge(review.source).label}
                  </Badge>
                  {reviews.length > 1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeReview(review.id)}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Guest Name */}
                <div>
                  <Label htmlFor={`name-${review.id}`}>Guest Name *</Label>
                  <Input
                    id={`name-${review.id}`}
                    value={review.userName}
                    onChange={(e) => updateReview(review.id, 'userName', e.target.value)}
                    placeholder="e.g., Rahul Sharma"
                  />
                </div>

                {/* Rating */}
                <div>
                  <Label htmlFor={`rating-${review.id}`}>Rating *</Label>
                  <select
                    id={`rating-${review.id}`}
                    value={review.rating.toString()}
                    onChange={(e) => updateReview(review.id, 'rating', parseInt(e.target.value))}
                    className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
                  >
                    <option value="5">⭐⭐⭐⭐⭐ (5 stars)</option>
                    <option value="4">⭐⭐⭐⭐ (4 stars)</option>
                    <option value="3">⭐⭐⭐ (3 stars)</option>
                    <option value="2">⭐⭐ (2 stars)</option>
                    <option value="1">⭐ (1 star)</option>
                  </select>
                </div>

                {/* Source */}
                <div>
                  <Label htmlFor={`source-${review.id}`}>Source Platform *</Label>
                  <select
                    id={`source-${review.id}`}
                    value={review.source}
                    onChange={(e) => updateReview(review.id, 'source', e.target.value)}
                    className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
                  >
                    {sourceOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Review Date */}
                <div>
                  <Label htmlFor={`date-${review.id}`}>Review Date</Label>
                  <Input
                    id={`date-${review.id}`}
                    type="date"
                    value={review.reviewDate}
                    onChange={(e) => updateReview(review.id, 'reviewDate', e.target.value)}
                  />
                </div>
              </div>

              {/* Comment */}
              <div>
                <Label htmlFor={`comment-${review.id}`}>Review Comment *</Label>
                <Textarea
                  id={`comment-${review.id}`}
                  value={review.comment}
                  onChange={(e) => updateReview(review.id, 'comment', e.target.value)}
                  placeholder="Copy and paste the review text here..."
                  rows={4}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {review.comment.length} characters
                </p>
              </div>

              {/* Source Review ID (Optional) */}
              <div>
                <Label htmlFor={`sourceId-${review.id}`}>Source Review ID (Optional)</Label>
                <Input
                  id={`sourceId-${review.id}`}
                  value={review.sourceReviewId}
                  onChange={(e) => updateReview(review.id, 'sourceReviewId', e.target.value)}
                  placeholder="e.g., google_12345 (prevents duplicates)"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Use this to prevent importing the same review twice
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Add More Button */}
      <Button
        variant="outline"
        className="w-full mb-6"
        onClick={addReview}
      >
        <Plus className="h-4 w-4 mr-2" />
        Add Another Review
      </Button>

      {/* Import Button */}
      <div className="flex gap-4">
        <Button
          size="lg"
          className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
          onClick={handleImport}
          disabled={importing || !selectedProperty}
        >
          {importing ? (
            <>
              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              Importing...
            </>
          ) : (
            <>
              <Upload className="h-5 w-5 mr-2" />
              Import {reviews.filter(r => r.userName && r.comment).length} Review(s)
            </>
          )}
        </Button>
      </div>

      {/* Result Message */}
      {result && (
        <Alert className="mt-6 border-green-200 bg-green-50">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            <strong>Success!</strong> Imported {result.imported} review(s) successfully.
            {result.failed > 0 && ` ${result.failed} review(s) failed to import.`}
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}
