import { NextRequest, NextResponse } from "next/server";
import { connectMongo } from "@/lib/db/mongodb";
import SearchQuery from "@/models/SearchQuery";
import { auth } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    await connectMongo();
    
    // Parse JSON with error handling
    let data;
    try {
      data = await req.json();
    } catch (error) {
      console.error("Invalid JSON in request:", error);
      return NextResponse.json(
        { success: false, message: "Invalid JSON in request body" },
        { status: 400 }
      );
    }
    
    const { searchTerm, location, checkIn, checkOut, guests, hasResults, resultCount } = data;
    
    // Validate required fields
    if (!searchTerm) {
      return NextResponse.json(
        { success: false, message: "searchTerm is required" },
        { status: 400 }
      );
    }
    
    // Get the current user session
    let session;
    try {
      session = await auth();
    } catch (error) {
      console.error("Error getting session:", error);
      // Continue without session - tracking will work for anonymous users
    }
    
    // Create the search query object with safe type handling
    const searchQuery = {
      searchTerm,
      isPropertyListed: Boolean(hasResults),
      location: location || undefined,
      checkIn: checkIn ? new Date(checkIn) : undefined,
      checkOut: checkOut ? new Date(checkOut) : undefined,
      guests: typeof guests === 'number' ? guests : (guests ? parseInt(guests) : undefined),
      ...(session?.user && {
        userId: session.user.id,
        userName: session.user.name,
        userEmail: session.user.email,
      }),
    };
    
    // Create the search record
    try {
      await SearchQuery.create(searchQuery);
    } catch (error) {
      console.error("Error creating search record:", error);
      return NextResponse.json(
        { success: false, message: "Database error while creating search record" },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error tracking search:", error);
    return NextResponse.json(
      { success: false, message: "Failed to track search" },
      { status: 500 }
    );
  }
} 