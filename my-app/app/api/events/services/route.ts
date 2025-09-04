import { NextRequest, NextResponse } from "next/server"
import { dbHandler } from "@/lib/db"
import { connectMongo } from "@/lib/db/mongodb"
import { getToken } from "next-auth/jwt"
import { z } from 'zod'
import EventBooking from "@/models/EventBooking"
import { Types } from "mongoose"

export const dynamic = 'force-dynamic';

// GET handler - Get available event services
export const GET = dbHandler(async (req: NextRequest) => {
  try {
    await connectMongo()

    const { searchParams } = new URL(req.url)
    const propertyId = searchParams.get('propertyId')
    const category = searchParams.get('category')
    const eventType = searchParams.get('eventType')
    const bookingId = searchParams.get('bookingId')

    if (propertyId && !Types.ObjectId.isValid(propertyId)) {
      return NextResponse.json(
        { success: false, message: "Invalid property ID" },
        { status: 400 }
      )
    }

    // Available event services catalog
    const eventServices = [
      // Photography & Videography
      {
        id: new Types.ObjectId().toString(),
        serviceId: "PHOTO001",
        serviceName: "Professional Photography",
        category: "photography",
        description: "Professional event photography with edited photos",
        eventTypes: ["wedding", "birthday", "corporate", "conference"],
        pricing: {
          basePrice: 15000,
          pricingType: "flat", // flat, per_hour, per_person
          duration: 8, // hours
          includes: [
            "Professional photographer",
            "High-resolution photos",
            "Basic editing",
            "Online gallery",
            "50 printed photos"
          ]
        },
        customizable: true,
        advanceBooking: 7, // days
        cancellationPolicy: "50% refund if cancelled 48 hours before event",
        isActive: true
      },
      {
        id: new Types.ObjectId().toString(),
        serviceId: "VIDEO001",
        serviceName: "Wedding Videography",
        category: "videography",
        description: "Complete wedding videography with highlight reel",
        eventTypes: ["wedding"],
        pricing: {
          basePrice: 25000,
          pricingType: "flat",
          duration: 10, // hours
          includes: [
            "2 professional videographers",
            "Ceremony coverage",
            "Reception highlights",
            "Edited highlight reel (3-5 minutes)",
            "Full ceremony video",
            "Digital delivery"
          ]
        },
        customizable: true,
        advanceBooking: 14,
        cancellationPolicy: "25% refund if cancelled 7 days before event",
        isActive: true
      },

      // Decoration Services
      {
        id: new Types.ObjectId().toString(),
        serviceId: "DECOR001",
        serviceName: "Floral Arrangements",
        category: "decoration",
        description: "Fresh flower arrangements and centerpieces",
        eventTypes: ["wedding", "birthday", "corporate"],
        pricing: {
          basePrice: 8000,
          pricingType: "per_table",
          minimum: 5,
          includes: [
            "Fresh flower centerpieces",
            "Table arrangements",
            "Entrance decoration",
            "Basic setup and removal"
          ]
        },
        customizable: true,
        advanceBooking: 3,
        cancellationPolicy: "No refund for cancellations within 24 hours",
        isActive: true
      },
      {
        id: new Types.ObjectId().toString(),
        serviceId: "DECOR002",
        serviceName: "Balloon Decoration",
        category: "decoration",
        description: "Colorful balloon decorations and arches",
        eventTypes: ["birthday", "celebration"],
        pricing: {
          basePrice: 5000,
          pricingType: "flat",
          includes: [
            "Balloon arch",
            "Table balloon clusters",
            "Entrance decoration",
            "Color coordination with theme"
          ]
        },
        customizable: true,
        advanceBooking: 2,
        cancellationPolicy: "Full refund if cancelled 12 hours before event",
        isActive: true
      },

      // Entertainment Services
      {
        id: new Types.ObjectId().toString(),
        serviceId: "ENT001",
        serviceName: "DJ & Music System",
        category: "entertainment",
        description: "Professional DJ with music system and lighting",
        eventTypes: ["wedding", "birthday", "corporate", "celebration"],
        pricing: {
          basePrice: 12000,
          pricingType: "per_hour",
          minimum: 4, // minimum hours
          includes: [
            "Professional DJ",
            "Sound system setup",
            "Microphones",
            "Basic lighting",
            "Music playlist customization"
          ]
        },
        customizable: true,
        advanceBooking: 7,
        cancellationPolicy: "75% refund if cancelled 48 hours before event",
        isActive: true
      },
      {
        id: new Types.ObjectId().toString(),
        serviceId: "ENT002",
        serviceName: "Live Band Performance",
        category: "entertainment",
        description: "Live music band for events",
        eventTypes: ["wedding", "corporate", "celebration"],
        pricing: {
          basePrice: 25000,
          pricingType: "flat",
          duration: 3, // hours
          includes: [
            "4-piece live band",
            "Sound equipment",
            "3-hour performance",
            "Popular song covers",
            "One special request song"
          ]
        },
        customizable: false,
        advanceBooking: 14,
        cancellationPolicy: "50% refund if cancelled 72 hours before event",
        isActive: true
      },

      // Technical Services
      {
        id: new Types.ObjectId().toString(),
        serviceId: "TECH001",
        serviceName: "AV Equipment Setup",
        category: "technical",
        description: "Audio-visual equipment for presentations",
        eventTypes: ["corporate", "conference", "meeting"],
        pricing: {
          basePrice: 5000,
          pricingType: "flat",
          includes: [
            "Projector and screen",
            "Microphone system",
            "Speakers",
            "Laptop connectivity",
            "Technical support staff"
          ]
        },
        customizable: true,
        advanceBooking: 3,
        cancellationPolicy: "Full refund if cancelled 24 hours before event",
        isActive: true
      },
      {
        id: new Types.ObjectId().toString(),
        serviceId: "TECH002",
        serviceName: "Live Streaming Setup",
        category: "technical",
        description: "Professional live streaming for virtual attendees",
        eventTypes: ["wedding", "corporate", "conference"],
        pricing: {
          basePrice: 18000,
          pricingType: "flat",
          includes: [
            "Multi-camera setup",
            "Professional streaming software",
            "Dedicated streaming operator",
            "HD quality stream",
            "Platform integration (Zoom, YouTube, etc.)"
          ]
        },
        customizable: true,
        advanceBooking: 7,
        cancellationPolicy: "25% refund if cancelled 48 hours before event",
        isActive: true
      },

      // Transportation Services
      {
        id: new Types.ObjectId().toString(),
        serviceId: "TRANS001",
        serviceName: "Guest Transportation",
        category: "transportation",
        description: "Shuttle service for guests",
        eventTypes: ["wedding", "corporate", "conference"],
        pricing: {
          basePrice: 8000,
          pricingType: "per_vehicle",
          capacity: 25, // per vehicle
          includes: [
            "Air-conditioned bus",
            "Professional driver",
            "Fuel included",
            "4-hour service window"
          ]
        },
        customizable: true,
        advanceBooking: 5,
        cancellationPolicy: "50% refund if cancelled 24 hours before event",
        isActive: true
      },

      // Catering Add-ons
      {
        id: new Types.ObjectId().toString(),
        serviceId: "CATER001",
        serviceName: "Welcome Drinks Station",
        category: "catering",
        description: "Welcome drinks counter with variety of beverages",
        eventTypes: ["wedding", "corporate", "birthday", "celebration"],
        pricing: {
          basePrice: 150,
          pricingType: "per_person",
          minimum: 25,
          includes: [
            "Variety of welcome drinks",
            "Professional bartender",
            "Decorated serving station",
            "2-hour service"
          ]
        },
        customizable: true,
        advanceBooking: 3,
        cancellationPolicy: "Full refund if cancelled 24 hours before event",
        isActive: true
      },
      {
        id: new Types.ObjectId().toString(),
        serviceId: "CATER002",
        serviceName: "Live Cooking Station",
        category: "catering",
        description: "Interactive live cooking stations",
        eventTypes: ["wedding", "corporate", "celebration"],
        pricing: {
          basePrice: 300,
          pricingType: "per_person",
          minimum: 30,
          includes: [
            "Professional chef",
            "Interactive cooking station",
            "Fresh ingredients",
            "Variety of dishes",
            "Complete setup and cleanup"
          ]
        },
        customizable: true,
        advanceBooking: 7,
        cancellationPolicy: "25% refund if cancelled 48 hours before event",
        isActive: true
      }
    ]

    // Apply filters
    let filteredServices = eventServices

    if (category) {
      filteredServices = filteredServices.filter(service => service.category === category)
    }

    if (eventType) {
      filteredServices = filteredServices.filter(service => 
        service.eventTypes.includes(eventType)
      )
    }

    // If bookingId is provided, get services already added to this booking
    let bookingServices: any[] = []
    if (bookingId && Types.ObjectId.isValid(bookingId)) {
      const booking = await EventBooking.findById(bookingId)
        .select('services')
        .lean() as any
      
      if (booking) {
        bookingServices = booking.services || []
      }
    }

    // Get service statistics
    const serviceStats = {
      totalServices: filteredServices.length,
      byCategory: filteredServices.reduce((acc: any, service) => {
        acc[service.category] = (acc[service.category] || 0) + 1
        return acc
      }, {}),
      priceRange: {
        min: Math.min(...filteredServices.map(service => service.pricing.basePrice)),
        max: Math.max(...filteredServices.map(service => service.pricing.basePrice))
      },
      averageAdvanceBooking: filteredServices.reduce((sum, service) => 
        sum + service.advanceBooking, 0) / filteredServices.length
    }

    return NextResponse.json({
      success: true,
      services: filteredServices,
      bookingServices,
      statistics: serviceStats,
      categories: ["photography", "videography", "decoration", "entertainment", "technical", "transportation", "catering"]
    })

  } catch (error) {
    console.error('Error fetching event services:', error)
    return NextResponse.json(
      { success: false, message: "Failed to fetch event services" },
      { status: 500 }
    )
  }
})

// POST handler - Add services to booking
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
      const validatedData = addServicesSchema.parse(body)

      // Validate booking exists and user has permission
      const booking = await EventBooking.findById(validatedData.bookingId)
      if (!booking) {
        return NextResponse.json(
          { success: false, message: "Booking not found" },
          { status: 404 }
        )
      }

      // Validate services exist (in a real implementation, you'd query a Services collection)
      const serviceIds = validatedData.services.map(s => s.serviceId)
      
      // For now, we'll simulate service validation
      const validServiceIds = [
        "PHOTO001", "VIDEO001", "DECOR001", "DECOR002", 
        "ENT001", "ENT002", "TECH001", "TECH002", 
        "TRANS001", "CATER001", "CATER002"
      ]
      
      const invalidServices = serviceIds.filter(id => !validServiceIds.includes(id))
      if (invalidServices.length > 0) {
        return NextResponse.json(
          { 
            success: false, 
            message: `Invalid service IDs: ${invalidServices.join(', ')}` 
          },
          { status: 400 }
        )
      }

      // Calculate service charges
      let totalServiceCharges = 0
      const servicesWithPricing = validatedData.services.map((service: any) => {
        // In a real implementation, you'd look up actual service pricing
        const basePrice = service.unitPrice || 5000 // Default price
        const quantity = service.quantity || 1
        const totalPrice = basePrice * quantity
        totalServiceCharges += totalPrice

        return {
          serviceId: service.serviceId,
          serviceName: service.serviceName || `Service ${service.serviceId}`,
          category: service.category || 'general',
          quantity: quantity,
          unitPrice: basePrice,
          totalPrice: totalPrice,
          specifications: service.specifications || '',
          notes: service.notes || ''
        }
      })

      // Update booking with new services
      const updatedServiceCharges = (booking.serviceCharges || 0) + totalServiceCharges
      const updatedSubtotal = booking.venueCharges + booking.cateringCharges + updatedServiceCharges + 
                            booking.equipmentCharges + booking.decorationCharges
      const updatedTax = Math.round(updatedSubtotal * 0.18) // 18% tax
      const updatedTotal = updatedSubtotal + updatedTax - (booking.discount || 0)

      const updatedBooking = await EventBooking.findByIdAndUpdate(
        validatedData.bookingId,
        {
          $push: { services: { $each: servicesWithPricing } },
          $set: {
            serviceCharges: updatedServiceCharges,
            subtotal: updatedSubtotal,
            tax: updatedTax,
            totalAmount: updatedTotal,
            balanceAmount: updatedTotal - (booking.advancePayment || 0),
            lastUpdatedBy: new Types.ObjectId(token.sub),
            updatedAt: new Date()
          }
        },
        { 
          new: true,
          runValidators: true
        }
      )
      .populate('services.serviceId', 'serviceName category pricing')
      .lean() as any

      return NextResponse.json({
        success: true,
        message: "Services added to booking successfully",
        booking: {
          id: updatedBooking!._id.toString(),
          bookingNumber: updatedBooking!.bookingNumber,
          services: updatedBooking!.services,
          pricing: {
            venueCharges: updatedBooking!.venueCharges,
            serviceCharges: updatedBooking!.serviceCharges,
            cateringCharges: updatedBooking!.cateringCharges,
            equipmentCharges: updatedBooking!.equipmentCharges,
            decorationCharges: updatedBooking!.decorationCharges,
            subtotal: updatedBooking!.subtotal,
            tax: updatedBooking!.tax,
            discount: updatedBooking!.discount || 0,
            totalAmount: updatedBooking!.totalAmount,
            balanceAmount: updatedBooking!.balanceAmount
          },
          updatedAt: updatedBooking!.updatedAt
        },
        addedServices: servicesWithPricing,
        note: "This is a mock implementation. In production, implement proper Services model and database operations."
      }, { status: 200 })

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
    console.error('Error adding services to booking:', error)
    
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
      { success: false, message: "Failed to add services to booking" },
      { status: 500 }
    )
  }
})

// Schema for adding services to booking
const addServicesSchema = z.object({
  bookingId: z.string().min(1, "Booking ID is required"),
  services: z.array(z.object({
    serviceId: z.string().min(1, "Service ID is required"),
    serviceName: z.string().optional(),
    category: z.string().optional(),
    quantity: z.number().min(1, "Quantity must be at least 1").default(1),
    unitPrice: z.number().min(0, "Unit price cannot be negative").optional(),
    specifications: z.string().max(500, "Specifications cannot exceed 500 characters").optional(),
    notes: z.string().max(300, "Notes cannot exceed 300 characters").optional()
  })).min(1, "At least one service must be provided")
})