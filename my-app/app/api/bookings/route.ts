import { NextRequest, NextResponse } from "next/server"
import { BookingService } from "@/services/booking-service"
import { dbHandler } from "@/lib/db"
import { getSession } from "@/lib/get-session"
import { z } from "zod"
import dbConnect from "@/lib/db/dbConnect"
import Booking from "@/models/Booking"
import Property from "@/models/Property"
import TravelPicksAutoUpdater from "@/lib/services/travel-picks-auto-update"

// Mark this route as dynamic since it uses session
export const dynamic = 'force-dynamic';

// GET handler for bookings (protected)
export const GET = dbHandler(async (req: Request) => {
  console.log("[API/bookings/GET] Request received")
  
  const session = await getSession()
  console.log("[API/bookings/GET] Session check:", { 
    hasSession: !!session, 
    hasUser: !!session?.user,
    userId: session?.user?.id,
    userEmail: session?.user?.email
  })
  
  // Check if user is authenticated
  if (!session || !session.user) {
    console.log("[API/bookings/GET] Unauthorized - no session or user")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  
  const url = new URL(req.url)
  const propertyId = url.searchParams.get("propertyId")
  console.log("[API/bookings/GET] Query params:", { propertyId })
  
  let bookings
  
  try {
    if (propertyId) {
      console.log("[API/bookings/GET] Fetching property bookings for propertyId:", propertyId)
      // If propertyId is provided, get bookings for that property
      // Check if user is the owner of the property (handled in service)
      bookings = await BookingService.getPropertyBookings(propertyId)
      console.log("[API/bookings/GET] Property bookings found:", bookings.length)
    } else {
      console.log("[API/bookings/GET] Fetching user bookings for userId:", session.user.id)
      // Get user's bookings
      bookings = await BookingService.getUserBookings(session.user.id)
      console.log("[API/bookings/GET] User bookings found:", bookings.length)
      
      // Log first few bookings for debugging
      if (bookings.length > 0) {
        console.log("[API/bookings/GET] Sample bookings:")
        bookings.slice(0, 3).forEach((booking, index) => {
          console.log(`  ${index + 1}. ID: ${booking._id}`)
          console.log(`     Property: ${booking.propertyId?.title || 'Unknown'}`)
          console.log(`     Status: ${booking.status}`)
          console.log(`     Dates: ${booking.dateFrom} to ${booking.dateTo}`)
          console.log(`     Guests: ${booking.guests}`)
          console.log(`     Price: ${booking.totalPrice}`)
        })
      } else {
        console.log("[API/bookings/GET] No bookings found for user. Checking database directly...")
        
        // Direct database check for debugging
        await dbConnect()
        const directBookings = await Booking.find({ userId: session.user.id }).lean()
        console.log("[API/bookings/GET] Direct DB query found:", directBookings.length, "bookings")
        
        if (directBookings.length > 0) {
          console.log("[API/bookings/GET] Direct DB sample:")
          directBookings.slice(0, 2).forEach((booking, index) => {
            console.log(`  ${index + 1}. ID: ${booking._id}`)
            console.log(`     UserID: ${booking.userId}`)
            console.log(`     Status: ${booking.status}`)
            console.log(`     Property: ${booking.propertyId}`)
          })
        }
      }
    }
    
    console.log("[API/bookings/GET] Returning response with", bookings.length, "bookings")
    return NextResponse.json({ bookings })
  } catch (error) {
    console.error("[API/bookings/GET] Error:", error)
    return NextResponse.json({ error: "Failed to fetch bookings" }, { status: 500 })
  }
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
    
    // Fetch dynamic pricing information if available
    let dynamicPricingInfo = null;
    try {
      const startDate = checkIn.toISOString().split('T')[0];
      const endDate = checkOut.toISOString().split('T')[0];
      const guests = body.guests || 1;
      
      const pricingResponse = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/properties/${body.propertyId}/pricing?startDate=${startDate}&endDate=${endDate}&guests=${guests}`);
      
      if (pricingResponse.ok) {
        const pricingData = await pricingResponse.json();
        dynamicPricingInfo = {
          totalPrice: pricingData.totalPrice,
          nightlyAverage: pricingData.nightlyAverage,
          nights: pricingData.nights,
          pricingFactors: pricingData.pricingFactors,
          dailyPrices: pricingData.dailyPrices,
          dynamicPricingEnabled: pricingData.dynamicPricingEnabled
        };
        console.log("[API/bookings/POST] Dynamic pricing info fetched:", dynamicPricingInfo);
      } else {
        console.log("[API/bookings/POST] Dynamic pricing not available, using static pricing");
      }
    } catch (error) {
      console.log("[API/bookings/POST] Error fetching dynamic pricing:", error);
    }
    
    // Add dynamic pricing information to booking data
    if (dynamicPricingInfo) {
      body.dynamicPricing = dynamicPricingInfo;
      // Update total price with dynamic pricing if available
      if (dynamicPricingInfo.totalPrice > 0) {
        body.totalPrice = dynamicPricingInfo.totalPrice;
        body.pricePerNight = dynamicPricingInfo.nightlyAverage;
      }
    }
    
    // Create the booking
    const booking = await BookingService.createBooking(body)
    
    console.log("[API/bookings/POST] Booking created successfully:", booking._id)
    
    // Allocate room for the booking
    try {
      const { RoomAvailabilityService } = await import('@/lib/services/room-availability-service');
      const roomAllocation = await RoomAvailabilityService.allocateRoom(
        body.propertyId,
        checkIn,
        checkOut,
        body.unitTypeCode // Optional: specific room type
      );
      
      if (roomAllocation.success && roomAllocation.allocatedRoom) {
        // Update booking with room allocation
        booking.allocatedRoom = roomAllocation.allocatedRoom;
        booking.roomAllocationStatus = 'allocated';
        await booking.save();
        
        console.log("[API/bookings/POST] Room allocated:", roomAllocation.allocatedRoom);
      } else {
        console.log("[API/bookings/POST] Room allocation failed:", roomAllocation.error);
        booking.roomAllocationStatus = 'failed';
        await booking.save();
      }
    } catch (error) {
      console.error("[API/bookings/POST] Error in room allocation:", error);
      booking.roomAllocationStatus = 'failed';
      await booking.save();
    }
    
    // Automatically trigger travel picks update in background
    TravelPicksAutoUpdater.onBookingCreated(booking._id, body.propertyId)
    
    return NextResponse.json(booking, { status: 201 })
  } catch (error: any) {
    console.error("[API/bookings/POST] Error occurred:", error)
    console.error("[API/bookings/POST] Error stack:", error.stack)
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
})
