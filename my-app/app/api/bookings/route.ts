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
  console.log("[API/bookings/POST] Request received")
  
  const session = await getSession()
  console.log("[API/bookings/POST] Session check:", { 
    hasSession: !!session, 
    hasUser: !!session?.user,
    userId: session?.user?.id 
  })
  
  // Check if user is authenticated
  if (!session || !session.user) {
    console.log("[API/bookings/POST] Unauthorized - no session or user")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  
  try {
    const body = await req.json()
    console.log("[API/bookings/POST] Request body received:", body)
    
    // Add user ID from session
    body.userId = session.user.id
    console.log("[API/bookings/POST] Added userId to body:", body.userId)
    
    // Validate required fields
    const requiredFields = ["propertyId", "dateFrom", "dateTo", "guests"]
    const missingFields = requiredFields.filter(field => !body[field])
    
    if (missingFields.length > 0) {
      console.log("[API/bookings/POST] Missing required fields:", missingFields)
      return NextResponse.json(
        { error: `Missing required fields: ${missingFields.join(", ")}` },
        { status: 400 }
      )
    }
    
    console.log("[API/bookings/POST] All required fields present")
    
    // Check if the dates are valid
    const checkIn = new Date(body.dateFrom)
    const checkOut = new Date(body.dateTo)
    
    console.log("[API/bookings/POST] Date validation:", {
      checkIn: checkIn.toISOString(),
      checkOut: checkOut.toISOString(),
      checkInValid: !isNaN(checkIn.getTime()),
      checkOutValid: !isNaN(checkOut.getTime()),
      checkInBeforeCheckOut: checkIn < checkOut
    })
    
    if (checkIn >= checkOut) {
      console.log("[API/bookings/POST] Invalid dates - checkIn >= checkOut")
      return NextResponse.json(
        { error: "Check-out date must be after check-in date" },
        { status: 400 }
      )
    }
    
    console.log("[API/bookings/POST] Checking availability...")
    
    // Check if the property is available for the selected dates
    const isAvailable = await BookingService.checkAvailability(
      body.propertyId,
      checkIn,
      checkOut
    )
    
    console.log("[API/bookings/POST] Availability result:", isAvailable)
    
    if (!isAvailable) {
      console.log("[API/bookings/POST] Property not available for selected dates")
      return NextResponse.json(
        { error: "Property is not available for the selected dates" },
        { status: 400 }
      )
    }
    
    console.log("[API/bookings/POST] Property available, creating booking...")
    
    // Create the booking
    const booking = await BookingService.createBooking(body)
    
    console.log("[API/bookings/POST] Booking created successfully:", booking._id)
    
    return NextResponse.json(booking, { status: 201 })
  } catch (error: any) {
    console.error("[API/bookings/POST] Error occurred:", error)
    console.error("[API/bookings/POST] Error stack:", error.stack)
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
})
