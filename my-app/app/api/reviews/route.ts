import { type NextRequest, NextResponse } from "next/server"
import { connectMongo } from "@/lib/db/mongodb"
import Review from "@/models/Review"
import Property from "@/models/Property"
import mongoose from "mongoose"

export async function GET(req: NextRequest) {
  try {
    await connectMongo()

    const url = new URL(req.url)
    const propertyId = url.searchParams.get("propertyId")
    const userId = url.searchParams.get("userId")

    let query = {}

    if (propertyId) query = { ...query, propertyId }
    if (userId) query = { ...query, userId }

    const reviews = await Review.find(query).populate("userId", "name").sort({ createdAt: -1 })

    return NextResponse.json({ success: true, reviews }, { status: 200 })
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
