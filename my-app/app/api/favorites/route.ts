import { type NextRequest, NextResponse } from "next/server"
import { connectMongo } from "@/lib/db/mongodb"
import Favorite from "@/models/Favorite"

export async function GET(req: NextRequest) {
  try {
    await connectMongo()

    const url = new URL(req.url)
    const userId = url.searchParams.get("userId")

    if (!userId) {
      return NextResponse.json({ success: false, message: "User ID is required" }, { status: 400 })
    }

    const favorites = await Favorite.find({ userId }).populate("propertyId").sort({ createdAt: -1 })

    return NextResponse.json({ success: true, favorites }, { status: 200 })
  } catch (error) {
    console.error("Error fetching favorites:", error)
    return NextResponse.json({ success: false, message: "Error fetching favorites" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectMongo()

    const { userId, propertyId } = await req.json()

    // Check if already favorited
    const existingFavorite = await Favorite.findOne({ userId, propertyId })

    if (existingFavorite) {
      return NextResponse.json({ success: false, message: "Property already in favorites" }, { status: 400 })
    }

    const favorite = await Favorite.create({ userId, propertyId })

    return NextResponse.json({ success: true, message: "Added to favorites", favorite }, { status: 201 })
  } catch (error) {
    console.error("Error adding favorite:", error)
    return NextResponse.json({ success: false, message: "Error adding to favorites" }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await connectMongo()

    const url = new URL(req.url)
    const userId = url.searchParams.get("userId")
    const propertyId = url.searchParams.get("propertyId")

    if (!userId || !propertyId) {
      return NextResponse.json({ success: false, message: "User ID and Property ID are required" }, { status: 400 })
    }

    const result = await Favorite.findOneAndDelete({ userId, propertyId })

    if (!result) {
      return NextResponse.json({ success: false, message: "Favorite not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true, message: "Removed from favorites" }, { status: 200 })
  } catch (error) {
    console.error("Error removing favorite:", error)
    return NextResponse.json({ success: false, message: "Error removing from favorites" }, { status: 500 })
  }
}
