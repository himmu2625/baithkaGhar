import { type NextRequest, NextResponse } from "next/server"
import { connectMongo } from "@/lib/db/mongodb"
import Review from "@/models/Review"
import Property from "@/models/Property"
import mongoose from "mongoose"
import TravelPicksAutoUpdater from "@/lib/services/travel-picks-auto-update"

export async function GET(req: NextRequest) {
  try {
    await connectMongo()

    const url = new URL(req.url)
    const propertyId = url.searchParams.get("propertyId")
    const userId = url.searchParams.get("userId")
    const includeStats = url.searchParams.get("includeStats") === "true"

    let query: any = { isPublished: true } // Only fetch published reviews

    // Convert propertyId to ObjectId if provided
    if (propertyId) {
      try {
        // Handle both string IDs and ObjectIds
        query.propertyId = new mongoose.Types.ObjectId(propertyId)
      } catch (err) {
        console.error("Invalid propertyId format:", propertyId)
        return NextResponse.json({
          success: false,
          message: "Invalid property ID format",
          reviews: [],
          statistics: null
        }, { status: 400 })
      }
    }

    if (userId) {
      try {
        query.userId = new mongoose.Types.ObjectId(userId)
      } catch (err) {
        console.error("Invalid userId format:", userId)
      }
    }

    const reviews = await Review.find(query)
      .populate("userId", "name image")
      .sort({ createdAt: -1 })
      .lean()

    // Transform reviews to match frontend interface
    const transformedReviews = reviews.map((review: any) => ({
      id: review._id.toString(),
      user: {
        name: review.userName || review.userId?.name || "Anonymous",
        image: review.userImage || review.userId?.image || null,
      },
      rating: review.rating,
      comment: review.comment,
      date: review.createdAt.toISOString(),
      source: review.source || 'direct',
      verifiedBooking: review.isVerified || false,
      stayDate: review.checkInDate?.toISOString() || null,
      categoryRatings: review.ratingBreakdown || null,
      helpfulCount: review.helpfulCount || 0,
    }))

    // Calculate statistics if requested
    if (includeStats && propertyId) {
      const totalReviews = reviews.length
      const averageRating = totalReviews > 0
        ? reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / totalReviews
        : 0

      // Calculate rating distribution
      const ratingDistribution = {
        5: reviews.filter((r: any) => r.rating === 5).length,
        4: reviews.filter((r: any) => r.rating === 4).length,
        3: reviews.filter((r: any) => r.rating === 3).length,
        2: reviews.filter((r: any) => r.rating === 2).length,
        1: reviews.filter((r: any) => r.rating === 1).length,
      }

      // Calculate category ratings average
      const categoryBreakdown = {
        cleanliness: 0,
        accuracy: 0,
        communication: 0,
        location: 0,
        checkIn: 0,
        value: 0,
      }

      let categoryCount = 0
      reviews.forEach((r: any) => {
        if (r.ratingBreakdown) {
          if (r.ratingBreakdown.cleanliness) categoryBreakdown.cleanliness += r.ratingBreakdown.cleanliness
          if (r.ratingBreakdown.accuracy) categoryBreakdown.accuracy += r.ratingBreakdown.accuracy
          if (r.ratingBreakdown.communication) categoryBreakdown.communication += r.ratingBreakdown.communication
          if (r.ratingBreakdown.location) categoryBreakdown.location += r.ratingBreakdown.location
          if (r.ratingBreakdown.checkIn) categoryBreakdown.checkIn += r.ratingBreakdown.checkIn
          if (r.ratingBreakdown.value) categoryBreakdown.value += r.ratingBreakdown.value
          categoryCount++
        }
      })

      if (categoryCount > 0) {
        categoryBreakdown.cleanliness = categoryBreakdown.cleanliness / categoryCount
        categoryBreakdown.accuracy = categoryBreakdown.accuracy / categoryCount
        categoryBreakdown.communication = categoryBreakdown.communication / categoryCount
        categoryBreakdown.location = categoryBreakdown.location / categoryCount
        categoryBreakdown.checkIn = categoryBreakdown.checkIn / categoryCount
        categoryBreakdown.value = categoryBreakdown.value / categoryCount
      } else {
        // Use average rating as fallback
        Object.keys(categoryBreakdown).forEach((key) => {
          categoryBreakdown[key as keyof typeof categoryBreakdown] = averageRating
        })
      }

      // Calculate recommendation percentage (4+ stars)
      const recommendedCount = reviews.filter((r: any) => r.rating >= 4).length
      const recommendationPercentage = totalReviews > 0
        ? Math.round((recommendedCount / totalReviews) * 100)
        : 0

      return NextResponse.json({
        success: true,
        reviews: transformedReviews,
        statistics: {
          totalReviews,
          averageRating: Number(averageRating.toFixed(1)),
          ratingDistribution,
          categoryBreakdown,
          recommendationPercentage,
        },
      }, { status: 200 })
    }

    return NextResponse.json({ success: true, reviews: transformedReviews }, { status: 200 })
  } catch (error) {
    console.error("Error fetching reviews:", error)
    return NextResponse.json({ success: false, message: "Error fetching reviews" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const session = await mongoose.startSession()
  session.startTransaction()

  try {
    await connectMongo()

    const reviewData = await req.json()

    // Create review
    const review = await Review.create([reviewData], { session })

    // Update property rating
    const propertyId = reviewData.propertyId

    // Get all reviews for this property
    const allReviews = await Review.find({ propertyId })

    // Calculate new average rating
    const totalRating = allReviews.reduce((sum, review) => sum + review.rating, 0)
    const newRating = totalRating / allReviews.length

    // Update property
    await Property.findByIdAndUpdate(
      propertyId,
      {
        rating: Number.parseFloat(newRating.toFixed(1)),
        reviewCount: allReviews.length,
      },
      { session },
    )

    await session.commitTransaction()
    
    // Automatically trigger travel picks update in background
    TravelPicksAutoUpdater.onReviewOrRatingUpdate(propertyId)

    return NextResponse.json(
      { success: true, message: "Review added successfully", review: review[0] },
      { status: 201 },
    )
  } catch (error) {
    await session.abortTransaction()
    console.error("Error adding review:", error)
    return NextResponse.json({ success: false, message: "Error adding review" }, { status: 500 })
  } finally {
    session.endSession()
  }
}
