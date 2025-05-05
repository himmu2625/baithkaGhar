import { NextRequest, NextResponse } from "next/server"
import { BookingService } from "@/services/booking-service"
import { dbHandler } from "@/lib/db"
import { getSession } from "@/lib/get-session"
import { z } from "zod"
import dbConnect from "@/lib/db/dbConnect"
import Booking from "@/models/Booking"
import Property from "@/models/Property"

// Mark this route as dynamic since it uses session
export const dynamic = 'force-dynamic';

// GET handler for bookings (protected)
export const GET = dbHandler(async (req: Request) => {
  const session = await getSession()
  
  // Check if user is authenticated
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  
  const url = new URL(req.url)
  const propertyId = url.searchParams.get("propertyId")
  
  let bookings
  
  if (propertyId) {
    // If propertyId is provided, get bookings for that property
    // Check if user is the owner of the property (handled in service)
    bookings = await BookingService.getPropertyBookings(propertyId)
  } else {
    // Get user's bookings
    bookings = await BookingService.getUserBookings(session.user.id)
  }
  
  return NextResponse.json({ bookings })
})

// POST handler to create a booking (protected)
export const POST = dbHandler(async (req: Request) => {
  const session = await getSession()
  
  // Check if user is authenticated
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  
  try {
    const body = await req.json()
    
    // Add user ID from session
    body.userId = session.user.id
    
    // Validate required fields
    const requiredFields = ["propertyId", "checkInDate", "checkOutDate", "guests"]
    const missingFields = requiredFields.filter(field => !body[field])
    
    if (missingFields.length > 0) {
      return NextResponse.json(
        { error: `Missing required fields: ${missingFields.join(", ")}` },
        { status: 400 }
      )
    }
    
    // Check if the dates are valid
    const checkIn = new Date(body.checkInDate)
    const checkOut = new Date(body.checkOutDate)
    
    if (checkIn >= checkOut) {
      return NextResponse.json(
        { error: "Check-out date must be after check-in date" },
        { status: 400 }
      )
    }
    
    // Check if the property is available for the selected dates
    const isAvailable = await BookingService.checkAvailability(
      body.propertyId,
      checkIn,
      checkOut
    )
    
    if (!isAvailable) {
      return NextResponse.json(
        { error: "Property is not available for the selected dates" },
        { status: 400 }
      )
    }
    
    // Create the booking
    const booking = await BookingService.createBooking(body)
    
    return NextResponse.json(booking, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
})
