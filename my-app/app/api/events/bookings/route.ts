import { NextRequest, NextResponse } from "next/server"
import { dbHandler } from "@/lib/db"
import { connectMongo } from "@/lib/db/mongodb"
import { getToken } from "next-auth/jwt"
import { z } from 'zod'
import EventBooking from "@/models/EventBooking"
import EventVenue from "@/models/EventVenue"
import { Types } from "mongoose"

export const dynamic = 'force-dynamic';

// GET handler - Get event bookings
export const GET = dbHandler(async (req: NextRequest) => {
  try {
    await connectMongo()

    const { searchParams } = new URL(req.url)
    const propertyId = searchParams.get('propertyId')
    const status = searchParams.get('status')
    const venueId = searchParams.get('venueId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const eventType = searchParams.get('eventType')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const upcoming = searchParams.get('upcoming') === 'true'

    if (!propertyId || !Types.ObjectId.isValid(propertyId)) {
      return NextResponse.json(
        { success: false, message: "Valid property ID is required" },
        { status: 400 }
      )
    }

    // Build query
    const query: any = { propertyId: new Types.ObjectId(propertyId) }

    if (status) {
      query.status = status
    }

    if (venueId && Types.ObjectId.isValid(venueId)) {
      query.venueId = new Types.ObjectId(venueId)
    }

    if (eventType) {
      query.eventType = eventType
    }

    if (upcoming) {
      query.eventDate = { $gte: new Date() }
      query.status = { $nin: ['cancelled', 'completed'] }
    }

    // Date range filter
    if (startDate || endDate) {
      query.eventDate = {}
      if (startDate) {
        query.eventDate.$gte = new Date(startDate)
      }
      if (endDate) {
        query.eventDate.$lte = new Date(endDate)
      }
    }

    // Calculate skip for pagination
    const skip = (page - 1) * limit

    const bookingsQuery = EventBooking.find(query)
      .populate('venueId', 'name capacity pricing')
      .populate('services.serviceId', 'serviceName category pricing')
      .populate('createdBy', 'name email')
      .populate('lastUpdatedBy', 'name email')
      .sort({ eventDate: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean()

    const [bookings, total] = await Promise.all([
      bookingsQuery as unknown as any[],
      EventBooking.countDocuments(query)
    ])

    // Transform bookings for frontend
    const formattedBookings = bookings.map(booking => ({
      id: booking._id.toString(),
      bookingNumber: booking.bookingNumber,
      eventType: booking.eventType,
      eventName: booking.eventName,
      eventDate: booking.eventDate,
      startTime: booking.startTime,
      endTime: booking.endTime,
      duration: booking.duration || 0,
      status: booking.status,
      expectedGuests: booking.expectedGuests,
      guestCount: booking.guestCount || booking.expectedGuests,
      setupStyle: booking.setupStyle,
      venue: booking.venueId ? {
        id: booking.venueId._id?.toString(),
        name: booking.venueId.name,
        capacity: booking.venueId.capacity
      } : null,
      organizer: booking.organizer,
      billingContact: booking.billingContact,
      services: booking.services?.map((service: any) => ({
        id: service._id?.toString(),
        service: service.serviceId,
        quantity: service.quantity,
        unitPrice: service.unitPrice,
        totalPrice: service.totalPrice
      })) || [],
      cateringRequired: booking.cateringRequired,
      pricing: {
        venueCharges: booking.venueCharges || 0,
        cateringCharges: booking.cateringCharges || 0,
        serviceCharges: booking.serviceCharges || 0,
        equipmentCharges: booking.equipmentCharges || 0,
        decorationCharges: booking.decorationCharges || 0,
        subtotal: booking.subtotal || 0,
        tax: booking.tax || 0,
        discount: booking.discount || 0,
        totalAmount: booking.totalAmount || 0
      },
      payment: {
        advancePayment: booking.advancePayment || 0,
        balanceAmount: booking.balanceAmount || 0,
        paymentStatus: booking.paymentStatus,
        paymentMethod: booking.paymentMethod || null
      },
      specialRequests: booking.specialRequests || '',
      eventTimeline: booking.eventTimeline || [],
      createdAt: booking.createdAt,
      updatedAt: booking.updatedAt
    }))

    // Get summary statistics
    const statusCounts = await EventBooking.aggregate([
      { $match: { propertyId: new Types.ObjectId(propertyId) } },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ])

    const summary = {
      total,
      statusCounts: statusCounts.reduce((acc: any, item: any) => {
        acc[item._id] = item.count
        return acc
      }, {}),
      upcomingBookings: await EventBooking.countDocuments({
        propertyId: new Types.ObjectId(propertyId),
        eventDate: { $gte: new Date() },
        status: { $nin: ['cancelled', 'completed'] }
      })
    }

    return NextResponse.json({
      success: true,
      bookings: formattedBookings,
      summary,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })

  } catch (error) {
    console.error('Error fetching event bookings:', error)
    return NextResponse.json(
      { success: false, message: "Failed to fetch event bookings" },
      { status: 500 }
    )
  }
})

// POST handler - Create new event booking
export const POST = dbHandler(async (req: NextRequest) => {
  try {
    // Validate authentication
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
    if (!token || !token.sub) {
      return NextResponse.json(
        { success: false, message: "Unauthorized - Please log in" },
        { status: 401 }
      )
    }

    await connectMongo()

    // Parse and validate request body
    let body;
    try {
      body = await req.json()
    } catch (parseError) {
      return NextResponse.json(
        { success: false, message: "Invalid request body" },
        { status: 400 }
      )
    }

    try {
      const validatedData = createBookingSchema.parse(body)

      // Validate venue exists and belongs to property
      const venue = await EventVenue.findOne({
        _id: new Types.ObjectId(validatedData.venueId),
        propertyId: new Types.ObjectId(validatedData.propertyId),
        isActive: true,
        'availability.isActive': true
      })

      if (!venue) {
        return NextResponse.json(
          { success: false, message: "Venue not found or not available" },
          { status: 404 }
        )
      }

      // Check venue capacity
      const setupCapacity = venue.getCapacityForStyle(validatedData.setupStyle)
      if (validatedData.expectedGuests > setupCapacity) {
        return NextResponse.json(
          { 
            success: false, 
            message: `Venue ${venue.name} can only accommodate ${setupCapacity} guests in ${validatedData.setupStyle} setup` 
          },
          { status: 400 }
        )
      }

      // Check for conflicting bookings
      const conflictingBooking = await EventBooking.findOne({
        venueId: new Types.ObjectId(validatedData.venueId),
        eventDate: new Date(validatedData.eventDate),
        status: { $nin: ['cancelled', 'completed'] },
        $or: [
          // New booking starts during existing booking
          {
            startTime: { $lte: validatedData.startTime },
            endTime: { $gt: validatedData.startTime }
          },
          // New booking ends during existing booking
          {
            startTime: { $lt: validatedData.endTime },
            endTime: { $gte: validatedData.endTime }
          },
          // New booking encompasses existing booking
          {
            startTime: { $gte: validatedData.startTime },
            endTime: { $lte: validatedData.endTime }
          }
        ]
      })

      if (conflictingBooking) {
        return NextResponse.json(
          { 
            success: false, 
            message: `Venue is already booked for ${conflictingBooking.eventName} from ${conflictingBooking.startTime} to ${conflictingBooking.endTime}` 
          },
          { status: 409 }
        )
      }

      // Generate booking number
      const bookingCount = await EventBooking.countDocuments({ 
        propertyId: new Types.ObjectId(validatedData.propertyId)
      })
      const bookingNumber = `EVT${Date.now().toString().slice(-6)}${String(bookingCount + 1).padStart(3, '0')}`

      // Calculate pricing
      const eventHours = calculateHours(validatedData.startTime, validatedData.endTime)
      const venueCharges = venue.calculatePrice(validatedData.startTime, validatedData.endTime)
      const serviceCharges = 0 // Will be calculated when services are added
      const subtotal = venueCharges + serviceCharges
      const tax = Math.round(subtotal * 0.18) // 18% tax
      const discount = validatedData.discount || 0
      const totalAmount = subtotal + tax - discount

      // Create booking
      const bookingData = {
        propertyId: new Types.ObjectId(validatedData.propertyId),
        bookingNumber,
        eventType: validatedData.eventType,
        eventName: validatedData.eventName,
        eventDate: new Date(validatedData.eventDate),
        startTime: validatedData.startTime,
        endTime: validatedData.endTime,
        duration: eventHours * 60, // Convert to minutes
        expectedGuests: validatedData.expectedGuests,
        guestCount: validatedData.expectedGuests,
        venueId: new Types.ObjectId(validatedData.venueId),
        setupStyle: validatedData.setupStyle,
        organizer: validatedData.organizer,
        billingContact: validatedData.billingContact || validatedData.organizer,
        services: [],
        cateringRequired: validatedData.cateringRequired || false,
        assignedStaff: [],
        specialRequests: validatedData.specialRequests || '',
        equipmentNeeds: validatedData.equipmentNeeds || [],
        decorationRequests: validatedData.decorationRequests || '',
        technicalRequirements: validatedData.technicalRequirements || '',
        venueCharges,
        cateringCharges: 0,
        serviceCharges: 0,
        equipmentCharges: 0,
        decorationCharges: 0,
        subtotal,
        tax,
        discount,
        totalAmount,
        advancePayment: Math.round(totalAmount * 0.3), // 30% advance
        balanceAmount: Math.round(totalAmount * 0.7),
        paymentStatus: 'pending',
        status: 'pending',
        eventTimeline: [{
          stage: 'booking_created',
          scheduledTime: new Date(),
          status: 'completed',
          notes: 'Event booking created'
        }],
        createdBy: new Types.ObjectId(token.sub),
        createdAt: new Date(),
        updatedAt: new Date()
      }

      const booking = await EventBooking.create(bookingData)

      // Populate the created booking
      const populatedBooking = await EventBooking.findById(booking._id)
        .populate('venueId', 'name capacity pricing')
        .populate('createdBy', 'name email')
        .lean() as any

      return NextResponse.json({
        success: true,
        message: "Event booking created successfully",
        booking: {
          id: populatedBooking!._id.toString(),
          bookingNumber: populatedBooking!.bookingNumber,
          eventType: populatedBooking!.eventType,
          eventName: populatedBooking!.eventName,
          eventDate: populatedBooking!.eventDate,
          startTime: populatedBooking!.startTime,
          endTime: populatedBooking!.endTime,
          status: populatedBooking!.status,
          expectedGuests: populatedBooking!.expectedGuests,
          venue: populatedBooking!.venueId,
          organizer: populatedBooking!.organizer,
          pricing: {
            venueCharges: populatedBooking!.venueCharges,
            subtotal: populatedBooking!.subtotal,
            tax: populatedBooking!.tax,
            totalAmount: populatedBooking!.totalAmount,
            advancePayment: populatedBooking!.advancePayment
          },
          paymentStatus: populatedBooking!.paymentStatus,
          createdAt: populatedBooking!.createdAt,
          createdBy: populatedBooking!.createdBy
        }
      }, { status: 201 })

    } catch (validationError) {
      if (validationError instanceof z.ZodError) {
        const formattedErrors = validationError.errors.map(e => ({
          path: e.path.join('.'),
          message: e.message
        }))
        return NextResponse.json(
          { 
            success: false, 
            message: "Validation error", 
            errors: formattedErrors
          },
          { status: 400 }
        )
      }
      throw validationError
    }

  } catch (error: any) {
    console.error('Error creating event booking:', error)
    
    // Handle Mongoose validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map((err: any) => ({
        field: err.path,
        message: err.message
      }))
      return NextResponse.json(
        { 
          success: false, 
          message: "Database validation error", 
          errors: validationErrors 
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, message: "Failed to create event booking" },
      { status: 500 }
    )
  }
})

// Helper function to calculate duration in hours
function calculateHours(startTime: string, endTime: string): number {
  const start = new Date(`2000-01-01T${startTime}:00`)
  const end = new Date(`2000-01-01T${endTime}:00`)
  return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60))
}

// Schema for booking creation validation
const createBookingSchema = z.object({
  propertyId: z.string().min(1, "Property ID is required"),
  venueId: z.string().min(1, "Venue ID is required"),
  eventType: z.enum(['conference', 'wedding', 'birthday', 'corporate', 'meeting', 'workshop', 'celebration', 'other']),
  eventName: z.string().min(1, "Event name is required").max(200, "Event name cannot exceed 200 characters"),
  eventDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
  startTime: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, "Start time must be in HH:MM format"),
  endTime: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, "End time must be in HH:MM format"),
  expectedGuests: z.number().min(1, "Expected guests must be at least 1").max(10000, "Expected guests cannot exceed 10,000"),
  setupStyle: z.enum(['theatre', 'classroom', 'u-shape', 'boardroom', 'seated', 'standing']),
  organizer: z.object({
    name: z.string().min(1, "Organizer name is required"),
    email: z.string().email("Invalid email format"),
    phone: z.string().min(10, "Valid phone number is required"),
    company: z.string().optional(),
    address: z.object({
      street: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      zipCode: z.string().optional(),
      country: z.string().optional()
    }).optional()
  }),
  billingContact: z.object({
    name: z.string().min(1, "Billing contact name is required"),
    email: z.string().email("Invalid email format"),
    phone: z.string().min(10, "Valid phone number is required"),
    company: z.string().optional(),
    address: z.object({
      street: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      zipCode: z.string().optional(),
      country: z.string().optional()
    }).optional()
  }).optional(),
  cateringRequired: z.boolean().default(false),
  specialRequests: z.string().max(1000, "Special requests cannot exceed 1000 characters").optional(),
  equipmentNeeds: z.array(z.string()).default([]),
  decorationRequests: z.string().max(500, "Decoration requests cannot exceed 500 characters").optional(),
  technicalRequirements: z.string().max(500, "Technical requirements cannot exceed 500 characters").optional(),
  discount: z.number().min(0).default(0)
}).refine((data) => {
  // Validate that event date is not in the past
  const eventDate = new Date(data.eventDate)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return eventDate >= today
}, {
  message: "Event date cannot be in the past",
  path: ["eventDate"]
}).refine((data) => {
  // Validate that end time is after start time
  const start = new Date(`2000-01-01T${data.startTime}:00`)
  const end = new Date(`2000-01-01T${data.endTime}:00`)
  return end > start
}, {
  message: "End time must be after start time",
  path: ["endTime"]
})