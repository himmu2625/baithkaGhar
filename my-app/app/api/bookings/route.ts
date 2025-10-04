import { NextRequest, NextResponse } from "next/server"
import { BookingService } from "@/services/booking-service"
import { getSession } from "@/lib/get-session"
import { getToken } from "next-auth/jwt"
import { z } from "zod"
import dbConnect from "@/lib/db/dbConnect"
import Booking from "@/models/Booking"
import Property from "@/models/Property"
import TravelPicksAutoUpdater from "@/lib/services/travel-picks-auto-update"
import User from "@/models/User"
import { calculateBookingPrice } from "@/lib/services/pricing-calculator"
import { differenceInDays } from "date-fns"

// Mark this route as dynamic since it uses session
export const dynamic = 'force-dynamic';

// Helper function to convert document to object
function convertDocToObject(doc: any) {
  if (doc && typeof doc.toObject === 'function') {
    return doc.toObject()
  }
  return doc
}

// GET handler for bookings (protected)
export async function GET(req: Request) {
  try {
    console.log("[API/bookings/GET] Request received")
    
    // Step 1: Get session - try multiple approaches
    let session
    let userEmail
    let userId: string | undefined
    
    try {
      // Try getSession first
      session = await getSession()
      console.log("[API/bookings/GET] Session retrieved successfully via getSession")
      userEmail = session?.user?.email
      userId = session?.user?.id
    } catch (sessionError: any) {
      console.error("[API/bookings/GET] getSession error:", sessionError)
      
      // Fallback: Try getToken
      try {
        const token = await getToken({ 
          req: req as any, 
          secret: process.env.NEXTAUTH_SECRET 
        })
        console.log("[API/bookings/GET] Token retrieved successfully")
        userEmail = token?.email
        userId = token?.sub
        console.log("[API/bookings/GET] Using token data:", { userEmail, userId })
      } catch (tokenError: any) {
        console.error("[API/bookings/GET] getToken error:", tokenError)
        return NextResponse.json({ 
          error: "Authentication error", 
          details: "Both getSession and getToken failed" 
        }, { status: 500 })
      }
    }
    
    // Ensure userId is set from userEmail if not already set
    if (!userId && userEmail) {
      try {
        await dbConnect()
        const user = await User.findOne({ email: userEmail }).select('_id').lean()
        if (user) {
          userId = user._id.toString()
          console.log("[API/bookings/GET] Set userId from email lookup:", userId)
        }
      } catch (error) {
        console.error("[API/bookings/GET] Error looking up user by email:", error)
      }
    }
    
    console.log("[API/bookings/GET] Authentication check:", { 
      hasSession: !!session, 
      hasUser: !!session?.user,
      userId: userId,
      userEmail: userEmail
    })
    
    // Check if user is authenticated
    if (!userEmail) {
      console.log("[API/bookings/GET] Unauthorized - no user email")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    const url = new URL(req.url)
    const propertyId = url.searchParams.get("propertyId")
    console.log("[API/bookings/GET] Query params:", { propertyId })
    
    let bookings = []
    
    try {
      if (propertyId) {
        console.log("[API/bookings/GET] Fetching property bookings for propertyId:", propertyId)
        // If propertyId is provided, get bookings for that property
        // Check if user is the owner of the property (handled in service)
        bookings = await BookingService.getPropertyBookings(propertyId)
        console.log("[API/bookings/GET] Property bookings found:", bookings.length)
      } else {
        console.log("[API/bookings/GET] Fetching user bookings for userId:", userId)
        console.log("[API/bookings/GET] User details:", {
          id: userId,
          email: userEmail,
          idType: typeof userId,
          idLength: userId?.length
        })
        
        // Debug: Check if the user ID looks like a valid ObjectId
        const isValidObjectId = userId && userId.length === 24 && /^[0-9a-fA-F]{24}$/.test(userId)
        console.log("[API/bookings/GET] Is user ID valid ObjectId:", isValidObjectId)
        
        // Step 2: Get user's bookings
        try {
          if (userId) {
            bookings = await BookingService.getUserBookings(userId)
            console.log("[API/bookings/GET] User bookings found via userId:", bookings.length)
          }
        } catch (bookingServiceError: any) {
          console.error("[API/bookings/GET] BookingService error:", bookingServiceError)
          console.error("[API/bookings/GET] BookingService error stack:", bookingServiceError.stack)
        }
        
        // If no bookings found or BookingService failed, try direct database query
        if (bookings.length === 0) {
          try {
            console.log("[API/bookings/GET] Trying direct database query...")
            await dbConnect()
            
            // Try to find the user by email first
            const user = await User.findOne({ email: userEmail }).lean()
            if (user) {
              console.log("[API/bookings/GET] Found user by email:", {
                _id: user._id,
                email: user.email,
                name: user.name
              })
              
              // Try to find bookings with the actual user ID from database
              const directBookings = await Booking.find({ userId: user._id })
                .populate("propertyId", "title address images price ownerId")
                .sort({ dateFrom: -1 })
                .lean()
              console.log("[API/bookings/GET] Direct DB query found:", directBookings.length, "bookings")
              
              if (directBookings.length > 0) {
                bookings = directBookings.map(booking => convertDocToObject(booking))
                console.log("[API/bookings/GET] Using direct DB results")
              }
            }
          } catch (dbError: any) {
            console.error("[API/bookings/GET] Direct DB query error:", dbError)
            return NextResponse.json({ 
              error: "Database error", 
              details: dbError.message 
            }, { status: 500 })
          }
        }
        
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
          console.log("[API/bookings/GET] No bookings found for user")
        }
      }
      
      console.log("[API/bookings/GET] Returning response with", bookings.length, "bookings")
      return NextResponse.json({ bookings })
    } catch (error: any) {
      console.error("[API/bookings/GET] Error in booking service:", error)
      console.error("[API/bookings/GET] Error stack:", error.stack)
      return NextResponse.json({ error: "Failed to fetch bookings", details: error.message }, { status: 500 })
    }
  } catch (error: any) {
    console.error("[API/bookings/GET] Outer error:", error)
    console.error("[API/bookings/GET] Outer error stack:", error.stack)
    return NextResponse.json({ error: "Internal server error", details: error.message }, { status: 500 })
  }
}

// POST handler to create a booking (protected)
export async function POST(req: Request) {
  try {
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
    
    console.log("[API/bookings/POST] Property available, calculating pricing...")

    // Calculate precise pricing using the unified pricing calculator
    let pricingResult = null;
    let nights = differenceInDays(checkOut, checkIn);

    try {
      // Use plan-based pricing if plan details are provided
      if (body.roomCategory && body.planType && body.occupancyType) {
        console.log("[API/bookings/POST] Using plan-based pricing calculator");
        pricingResult = await calculateBookingPrice({
          propertyId: body.propertyId,
          roomCategory: body.roomCategory,
          planType: body.planType,
          occupancyType: body.occupancyType,
          checkIn: checkIn,
          checkOut: checkOut,
          numberOfRooms: body.numberOfRooms || 1
        });

        console.log("[API/bookings/POST] Pricing calculated:", pricingResult);

        // Update body with calculated pricing
        body.totalPrice = pricingResult.totalForStay;
        body.pricePerNight = pricingResult.pricePerNight;
        body.basePrice = pricingResult.basePrice;
        body.planCharges = pricingResult.planCharges;
        body.occupancyCharges = pricingResult.occupancyCharges;
        body.dynamicPriceAdjustment = pricingResult.dynamicAdjustment;
        body.nightsCount = nights;
        body.mealPlanInclusions = pricingResult.mealPlanInclusions;

      } else {
        // Fallback to old pricing method for legacy bookings
        console.log("[API/bookings/POST] Using legacy pricing (no plan details)");

        const startDate = checkIn.toISOString().split('T')[0];
        const endDate = checkOut.toISOString().split('T')[0];
        const guests = body.guests || 1;

        const pricingResponse = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/properties/${body.propertyId}/pricing?startDate=${startDate}&endDate=${endDate}&guests=${guests}`);

        if (pricingResponse.ok) {
          const pricingData = await pricingResponse.json();
          body.totalPrice = pricingData.totalPrice;
          body.pricePerNight = pricingData.nightlyAverage;
          body.nightsCount = nights;
          console.log("[API/bookings/POST] Legacy pricing applied:", { totalPrice: body.totalPrice });
        }
      }
    } catch (pricingError) {
      console.error("[API/bookings/POST] Error calculating pricing:", pricingError);
      // Continue with provided price if calculation fails
      if (!body.totalPrice && body.pricePerNight) {
        body.totalPrice = body.pricePerNight * nights;
      }
    }
    
    // Validate booking data completeness before creation
    console.log("[API/bookings/POST] Final booking data validation:", {
      hasUserId: !!body.userId,
      hasPropertyId: !!body.propertyId,
      hasDateFrom: !!body.dateFrom,
      hasDateTo: !!body.dateTo,
      hasGuests: !!body.guests,
      hasTotalPrice: !!body.totalPrice && body.totalPrice > 0,
      totalPrice: body.totalPrice
    })
    
    // Ensure we have a minimum total price
    if (!body.totalPrice || body.totalPrice <= 0) {
      console.error("[API/bookings/POST] Invalid total price:", body.totalPrice)
      return NextResponse.json(
        { error: "Invalid total price. Please try again." },
        { status: 400 }
      )
    }
    
    // Create the booking
    const booking = await BookingService.createBooking(body)
    
    console.log("[API/bookings/POST] Booking created successfully:", booking._id)
    
    // Handle room allocation in background - only if property has room management
    setTimeout(async () => {
      try {
        await dbConnect()
        const bookingDoc = await Booking.findById(booking._id)
        
        if (!bookingDoc) {
          console.error("[API/bookings/POST] Could not find booking for room allocation:", booking._id)
          return
        }
        
        // Check if property has room management (propertyUnits with rooms)
        const property = await Property.findById(body.propertyId)
        if (!property) {
          console.error("[API/bookings/POST] Property not found for room allocation:", body.propertyId)
          return
        }
        
        // Only allocate rooms if property has propertyUnits with roomNumbers
        const hasRoomManagement = property.propertyUnits && 
                                  property.propertyUnits.length > 0 && 
                                  property.propertyUnits.some(unit => unit.roomNumbers && unit.roomNumbers.length > 0)
        
        if (hasRoomManagement) {
          console.log("[API/bookings/POST] Property has room management, allocating room...")
          
          // Import and use room availability service
          const { RoomAvailabilityService } = await import('@/lib/services/room-availability-service');
          const roomAllocation = await RoomAvailabilityService.allocateRoom(
            body.propertyId,
            checkIn,
            checkOut,
            body.unitTypeCode // Optional: specific room type
          );
          
          if (roomAllocation.success && roomAllocation.allocatedRoom) {
            bookingDoc.allocatedRoom = roomAllocation.allocatedRoom;
            bookingDoc.roomAllocationStatus = 'allocated';
            await bookingDoc.save();
            console.log("[API/bookings/POST] Room allocated:", roomAllocation.allocatedRoom);
          } else {
            console.log("[API/bookings/POST] Room allocation failed:", roomAllocation.error);
            bookingDoc.roomAllocationStatus = 'failed';
            await bookingDoc.save();
          }
        } else {
          console.log("[API/bookings/POST] Property has no room management, skipping room allocation")
          // Mark as not applicable instead of failed
          bookingDoc.roomAllocationStatus = 'not_applicable';
          await bookingDoc.save();
        }
      } catch (error) {
        console.error("[API/bookings/POST] Error in background room allocation:", error);
      }
    }, 100) // Small delay to ensure booking is committed
    
    // Automatically trigger travel picks update in background
    TravelPicksAutoUpdater.onBookingCreated(booking._id, body.propertyId)
    
    return NextResponse.json(booking, { status: 201 })
  } catch (error: any) {
    console.error("[API/bookings/POST] Error occurred:", error)
    console.error("[API/bookings/POST] Error stack:", error.stack)
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}
